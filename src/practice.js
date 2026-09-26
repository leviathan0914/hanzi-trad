// ============ SM-2 算法 ============
function sm2Update(card, quality) {
  if (quality >= 3) {
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(card.interval * card.ef);
    card.repetitions += 1;
  } else {
    card.repetitions = 0;
    card.interval = 1;
  }
  card.ef = Math.max(1.3, card.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  card.lastReview = Date.now();
  card.nextReview = Date.now() + card.interval * 24 * 60 * 60 * 1000;
  return card;
}

// ============ 存储 ============
const CARDS_KEY = 'hanzi-sm2-cards';
const STATS_KEY = 'hanzi-stats';

function loadCards() {
  try { return JSON.parse(localStorage.getItem(CARDS_KEY) || '{}'); }
  catch { return {}; }
}
function saveCards(c) { localStorage.setItem(CARDS_KEY, JSON.stringify(c)); }

function loadStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ||
      '{"totalReviews":0,"correctReviews":0,"daysStudied":0,"lastStudyDate":""}');
  } catch {
    return { totalReviews: 0, correctReviews: 0, daysStudied: 0, lastStudyDate: '' };
  }
}
function saveStats(s) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }

// ============ 全局 ============
let session = null;

// ============ 笔顺包缓存 ============
const PRACTICE_STROKE_PACKS = {};

async function loadStrokePackPractice(bucket) {
  if (PRACTICE_STROKE_PACKS[bucket]) return PRACTICE_STROKE_PACKS[bucket];
  const res = await fetch(`/data/build/strokes-pack/${bucket}.json`);
  if (!res.ok) throw new Error('笔顺包加载失败');
  const data = await res.json();
  PRACTICE_STROKE_PACKS[bucket] = data;
  return data;
}

// ============ 首页渲染 ============
function renderPracticeHome() {
  document.getElementById('practice-start').style.display = 'block';
  document.getElementById('practice-session').style.display = 'none';
  document.getElementById('practice-summary').style.display = 'none';

  if (!CHARS || Object.keys(CHARS).length === 0) {
    document.getElementById('practice-stats-brief').innerHTML = '字库加载中…';
    return;
  }

  const cards = loadCards();
  const now = Date.now();
  const due = Object.values(cards).filter(c => c.nextReview <= now).length;
  const total = Object.keys(cards).length;

  document.getElementById('practice-stats-brief').innerHTML =
    `已学 <b>${total}</b> 字 · 待复习 <b>${due}</b> 字`;
}

// ============ 构建今日队列 ============
function buildQueue() {
  if (!CHARS || Object.keys(CHARS).length === 0) {
    alert('字库还没加载完，请稍等 1 秒再试');
    return null;
  }
  const cards = loadCards();
  const now = Date.now();

  const due = [];
  for (const [char, card] of Object.entries(cards)) {
    if (card.nextReview <= now && CHARS[char]?.hasStrokes) {
      due.push(char);
    }
  }

  const newCount = parseInt(document.getElementById('new-count').value, 10);
  const newChars = [];
  for (const item of ORDERED) {
    if (newChars.length >= newCount) break;
    const c = item.char;
    if (cards[c]) continue;
    if (!item.data.hasStrokes) continue;
    if (!item.data.variants?.simplified?.length) continue;
    newChars.push(c);
  }

  return {
    due: due.map(c => ({ char: c, isNew: false })),
    newChars: newChars.map(c => ({ char: c, isNew: true })),
  };
}

// ============ 开始会话 ============
function startSession() {
  const q = buildQueue();
  if (!q) return;

  const queue = [...q.due, ...q.newChars];
  if (queue.length === 0) {
    alert('今日没有需要练习的字。明天再来，或去"进度"页重置。');
    return;
  }

  session = { queue, index: 0, results: [] };
  document.getElementById('practice-start').style.display = 'none';
  document.getElementById('practice-session').style.display = 'block';
  document.getElementById('practice-summary').style.display = 'none';
  renderCurrentCard();
}

// ============ 渲染当前卡片 ============
function renderCurrentCard() {
  const item = session.queue[session.index];
  const char = item.char;
  const data = CHARS[char];

  const simplified = data.variants?.simplified?.[0] || char;

  document.getElementById('prompt-char').textContent = simplified;
  document.getElementById('prompt-pinyin').textContent = data.pinyin || '';
  document.getElementById('prompt-def').textContent = data.definition || '';
  document.getElementById('progress-text').textContent =
    `${session.index + 1} / ${session.queue.length}`;

  document.getElementById('practice-canvas').style.display = 'none';
  document.getElementById('practice-rating').style.display = 'none';
  document.getElementById('btn-show-answer').style.display = 'inline-block';
  document.getElementById('practice-hint').textContent = '';

  const target = document.getElementById('answer-trad');
  target.innerHTML = '';
}

// ============ 显示答案 ============
async function showAnswer() {
  const item = session.queue[session.index];
  const char = item.char;

  document.getElementById('practice-canvas').style.display = 'block';

  const target = document.getElementById('answer-trad');
  target.innerHTML = '';

  const cpHex = char.codePointAt(0).toString(16).toLowerCase();
  const bucket = cpHex[0];
  try {
    const pack = await loadStrokePackPractice(bucket);
    const strokeData = pack[cpHex];
    if (strokeData && typeof HanziWriter !== 'undefined') {
      const writer = HanziWriter.create('answer-trad', char, {
        width: 220, height: 220, padding: 10,
        strokeColor: '#2b2b2b', radicalColor: '#a33',
        showOutline: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 100,
        charDataLoader: (c, onComplete) => onComplete(strokeData),
      });
      writer.animateCharacter();
    } else {
      target.innerHTML = `<div style="font-size:140px;line-height:220px;text-align:center;">${char}</div>`;
    }
  } catch {
    target.innerHTML = `<div style="font-size:140px;line-height:220px;text-align:center;">${char}</div>`;
  }

  document.getElementById('btn-show-answer').style.display = 'none';
  document.getElementById('practice-rating').style.display = 'flex';
}

// ============ 评分 ============
function rateCard(quality) {
  const item = session.queue[session.index];
  const char = item.char;

  const cards = loadCards();
  const card = cards[char] || {
    ef: 2.5, interval: 0, repetitions: 0, nextReview: 0, lastReview: 0
  };
  sm2Update(card, quality);
  cards[char] = card;
  saveCards(cards);

  const stats = loadStats();
  stats.totalReviews += 1;
  if (quality >= 3) stats.correctReviews += 1;
  const today = new Date().toDateString();
  if (stats.lastStudyDate !== today) {
    stats.daysStudied += 1;
    stats.lastStudyDate = today;
  }
  saveStats(stats);

  session.results.push({ char, quality });
  session.index += 1;

  if (session.index >= session.queue.length) {
    endSession();
  } else {
    renderCurrentCard();
  }
}

// ============ 结束会话 ============
function endSession() {
  const results = session.results;
  const yes = results.filter(r => r.quality === 5).length;
  const fuzzy = results.filter(r => r.quality === 3).length;
  const no = results.filter(r => r.quality < 3).length;

  document.getElementById('practice-session').style.display = 'none';
  document.getElementById('practice-summary').style.display = 'block';

  document.getElementById('summary-content').innerHTML = `
    <div class="summary-row"><span>本次练习</span><b>${results.length} 字</b></div>
    <div class="summary-row"><span>会</span><b style="color:var(--accent-3)">${yes} 字</b></div>
    <div class="summary-row"><span>模糊</span><b style="color:#c98c1a">${fuzzy} 字</b></div>
    <div class="summary-row"><span>不会</span><b style="color:var(--accent)">${no} 字</b></div>
  `;

  session = null;
}

// ============ 进度页 ============
function renderStats() {
  const cards = loadCards();
  const stats = loadStats();
  const now = Date.now();

  const total = Object.keys(cards).length;
  const mastered = Object.values(cards).filter(c => c.interval >= 21).length;
  const due = Object.values(cards).filter(c => c.nextReview <= now).length;
  const accuracy = stats.totalReviews > 0
    ? Math.round(stats.correctReviews / stats.totalReviews * 100)
    : 0;

  document.getElementById('stats-content').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-num">${total}</div>
        <div class="stat-label">已学字数</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${mastered}</div>
        <div class="stat-label">已掌握</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${due}</div>
        <div class="stat-label">待复习</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">${stats.daysStudied}</div>
        <div class="stat-label">累计天数</div>
      </div>
    </div>
    <div class="stats-detail">
      <div>总复习次数：${stats.totalReviews}</div>
      <div>正确率：${accuracy}%</div>
    </div>
  `;
}

// ============ 事件绑定 ============
document.getElementById('btn-start-practice').addEventListener('click', startSession);
document.getElementById('btn-show-answer').addEventListener('click', showAnswer);

document.querySelectorAll('.rate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    rateCard(parseInt(btn.dataset.q, 10));
  });
});

document.getElementById('btn-quit').addEventListener('click', () => {
  if (confirm('确定退出本次练习？已评分的会保存。')) {
    session = null;
    renderPracticeHome();
  }
});

document.getElementById('btn-back-home').addEventListener('click', () => {
  renderPracticeHome();
});

document.getElementById('btn-reset-stats').addEventListener('click', () => {
  if (confirm('确定重置所有学习进度？此操作不可恢复。')) {
    localStorage.removeItem(CARDS_KEY);
    localStorage.removeItem(STATS_KEY);
    renderStats();
    alert('已重置');
  }
});