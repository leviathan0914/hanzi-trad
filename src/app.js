// ============ 全局状态 ============
let CHARS = {};
let ORDERED = [];
let FILTERED = [];
let currentFilter = 'all';
let currentChar = null;
let hanziWriter = null;

let DEFINITIONS = null;
let definitionsPromise = null;

const MAX_LIST = 500;
const WELCOME_KEY = 'hanzi-welcome-dismissed';

const listEl    = document.getElementById('char-list');
const statEl    = document.getElementById('list-stat');
const detailEl  = document.getElementById('detail');
const searchEl  = document.getElementById('search');

// ============ 视图切换 ============
function switchToView(name) {
  document.body.classList.remove('welcome-mode');
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const tab = document.querySelector(`.tab[data-view="${name}"]`);
  if (tab) tab.classList.add('active');
  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');

  if (name === 'stats' && typeof renderStats === 'function') renderStats();
  if (name === 'practice' && typeof renderPracticeHome === 'function') renderPracticeHome();
  if (name === 'rules' && typeof renderRules === 'function') renderRules('rules-content');
}

// ============ 加载字库 ============
async function init() {
  try {
    const res = await fetch('chars.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    CHARS = await res.json();
    ORDERED = Object.entries(CHARS)
      .map(([char, data]) => ({ char, data }))
      .sort(compareScore);
    applyFilter();

    if (localStorage.getItem(WELCOME_KEY)) {
      document.body.classList.remove('welcome-mode');
      switchToView('dict');
    } else {
      document.body.classList.add('welcome-mode');
      if (typeof renderRules === 'function') renderRules('welcome-rules');
    }
  } catch (e) {
    listEl.innerHTML = '<div style="padding:20px;color:#a33;">加载失败：' + e.message + '</div>';
    console.error(e);
  }
}

async function loadDefinitions() {
  if (DEFINITIONS) return DEFINITIONS;
  if (definitionsPromise) return definitionsPromise;
  definitionsPromise = fetch('definitions.json')
    .then(r => r.ok ? r.json() : {})
    .then(d => { DEFINITIONS = d; return d; })
    .catch(() => { DEFINITIONS = {}; return {}; });
  return definitionsPromise;
}

function scoreOf(data) {
  let s = 0;
  if (data.variants) s += 100;
  if (data.variants?.semantic?.length) s += 50;
  if (data.variants?.z?.length) s += 30;
  if (data.variants?.traditional?.length) s += 20;
  if (data.hasStrokes) s += 40;
  if (data.pinyin) s += 10;
  if (data.definition) s += 5;
  return s;
}
function compareScore(a, b) {
  const sa = scoreOf(a.data), sb = scoreOf(b.data);
  if (sb !== sa) return sb - sa;
  return a.char.codePointAt(0) - b.char.codePointAt(0);
}

// ============ 过滤和列表 ============
function applyFilter() {
  const q = searchEl.value.trim().toLowerCase();
  let result = ORDERED;

  if (currentFilter === 'variant') {
    result = result.filter(x => x.data.variants);
  } else if (currentFilter === 'strokes') {
    result = result.filter(x => x.data.hasStrokes);
  }

  if (q) {
    result = result.filter(x => {
      if (x.char === q) return true;
      if (x.char.includes(q)) return true;
      const d = x.data;
      if (d.pinyin && d.pinyin.toLowerCase().includes(q)) return true;
      if (d.definition && d.definition.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  FILTERED = result;
  renderList();
}

function renderList() {
  listEl.innerHTML = '';
  const shown = FILTERED.slice(0, MAX_LIST);
  const frag = document.createDocumentFragment();
  for (const item of shown) {
    const div = document.createElement('div');
    div.className = 'char-item' + (item.char === currentChar ? ' active' : '');
    const info = [
      item.data.pinyin || '',
      item.data.strokes ? item.data.strokes + '画' : '',
    ].filter(Boolean).join(' · ');
    const badges = [];
    if (item.data.variants?.semantic?.length || item.data.variants?.z?.length) badges.push('異');
    if (item.data.hasStrokes) badges.push('筆');
    div.innerHTML = `
      <span class="c">${item.char}</span>
      <span class="info">${info}</span>
      <span class="badge">${badges.join(' ')}</span>
    `;
    div.addEventListener('click', () => selectChar(item.char));
    frag.appendChild(div);
  }
  listEl.appendChild(frag);

  if (FILTERED.length > MAX_LIST) {
    statEl.textContent = `共 ${FILTERED.length} 字，显示前 ${MAX_LIST} 个（用搜索精确定位）`;
  } else {
    statEl.textContent = `共 ${FILTERED.length} 字`;
  }
}

// ============ 详情 ============
async function selectChar(char) {
  currentChar = char;
  const data = CHARS[char];
  if (!data) {
    detailEl.innerHTML = `<div class="placeholder">「${char}」不在字库中</div>`;
    return;
  }

  [...listEl.children].forEach(el => {
    const c = el.querySelector('.c')?.textContent;
    el.classList.toggle('active', c === char);
  });

  detailEl.innerHTML = buildDetailHTML(char, data);
  detailEl.scrollTop = 0;

  detailEl.querySelectorAll('.variant-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.char;
      if (CHARS[target]) {
        selectChar(target);
      } else {
        alert(`「${target}」不在字库中（可能被过滤了）`);
      }
    });
  });

  const defContainer = document.getElementById('defs-container');
  if (defContainer) {
    loadDefinitions().then(defs => {
      if (currentChar !== char) return;
      const myDefs = defs[char];
      defContainer.innerHTML = myDefs && myDefs.length
        ? buildDefinitionsHTML(myDefs)
        : '<div style="color:var(--ink-3);font-size:13px;">暂无释义数据</div>';
    });
  }

  if (data.hasStrokes) {
    await initStrokes(char);
  }
}

function buildDetailHTML(char, data) {
  const rows = [];
  if (data.pinyin) rows.push(['拼音', data.pinyin, false]);
  if (data.strokes) rows.push(['笔画', data.strokes + ' 画', false]);
  if (data.definition) rows.push(['英释', data.definition, true]);
  if (data.decomposition) rows.push(['部件', data.decomposition, false]);
  if (data.guji?.length) rows.push(['古籍', data.guji.join(' / '), false]);

  const rowsHTML = rows.map(([label, value, isEn]) => `
    <div class="basic-row">
      <span class="basic-label">${label}</span>
      <span class="basic-value ${isEn ? 'en' : ''}">${escapeHTML(value)}</span>
    </div>
  `).join('');

  return `
    <div class="detail-head">
      <div class="detail-char">${char}</div>
      <div class="detail-basic">${rowsHTML}</div>
    </div>
    <div class="section">
      <div class="section-title">釋 義</div>
      <div id="defs-container" class="defs-container">
        <div style="color:var(--ink-3);font-size:13px;">載入中…</div>
      </div>
    </div>
    ${buildVariantsHTML(data)}
    ${data.hasStrokes ? `
      <div class="section strokes-box">
        <div class="section-title">筆 順</div>
        <div id="strokes-target"></div>
        <div class="strokes-controls">
          <button id="btn-play">播放筆順</button>
          <button id="btn-quiz">跟着寫</button>
        </div>
        <div class="strokes-hint" id="strokes-hint"></div>
      </div>
    ` : ''}
  `;
}

function buildDefinitionsHTML(list) {
  const priority = {
    '古代汉语词典': 1,
    '古汉语常用字典': 2,
    'CC-CEDICT': 3
  };
  list.sort((a, b) => (priority[a.source] || 99) - (priority[b.source] || 99));

  return list.map(d => {
    if (d.source === '古代汉语词典') {
      const items = (d.items || []).map(it => {
        const paragraphs = it.split('\n').filter(Boolean);
        return paragraphs.map(p =>
          `<div class="def-text">${escapeHTML(p)}</div>`
        ).join('');
      }).join('');
      return `
        <div class="def-group def-gudaihanyu">
          <div class="def-head">
            <span class="def-source">古代漢語詞典</span>
          </div>
          ${items}
        </div>
      `;
    }
    if (d.source === '古汉语常用字典') {
      const items = (d.items || []).map(it =>
        `<div class="def-text">${escapeHTML(it)}</div>`
      ).join('');
      return `
        <div class="def-group def-guhanyu">
          <div class="def-head">
            <span class="def-source">古漢語常用字典</span>
          </div>
          ${items}
        </div>
      `;
    }
    if (d.source === 'CC-CEDICT') {
      return `
        <div class="def-group def-cedict">
          <div class="def-head">
            <span class="def-source">CC-CEDICT</span>
            <span class="def-pinyin">${escapeHTML(d.pinyin || '')}</span>
          </div>
          <div class="def-text">${escapeHTML(d.text || '')}</div>
        </div>
      `;
    }
    return '';
  }).join('');
}

function buildVariantsHTML(data) {
  const v = data.variants;
  if (!v) return '';
  const groups = [];

  if (v.semantic?.length) {
    groups.push(['語義變體', 'semantic', v.semantic]);
  }
  if (v.z?.length) {
    groups.push(['字形變體', 'z', v.z]);
  }
  if (v.traditional?.length) {
    groups.push(['對應繁體', 'trad', v.traditional.map(c => ({ char: c }))]);
  }
  if (v.simplified?.length) {
    groups.push(['對應簡體', 'simp', v.simplified.map(c => ({ char: c }))]);
  }
  if (!groups.length) return '';

  const inner = groups.map(([label, cls, list]) => `
    <div class="variant-group">
      <span class="variant-label ${cls}">${label}</span>
      <div class="variant-chars">
        ${list.map(item => `
          <span class="variant-chip" data-char="${item.char}">
            ${item.char}${item.isZ ? '<span class="mark">正</span>' : ''}
          </span>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
    <div class="section">
      <div class="section-title">變 體 家 族</div>
      ${inner}
    </div>
  `;
}

// ============ 笔顺（打包版） ============
const STROKE_PACKS = {};

async function loadStrokePack(bucket) {
  if (STROKE_PACKS[bucket]) return STROKE_PACKS[bucket];
  const res = await fetch(`strokes-pack/${bucket}.json`);
  if (!res.ok) throw new Error('笔顺包加载失败');
  const data = await res.json();
  STROKE_PACKS[bucket] = data;
  return data;
}

async function initStrokes(char) {
  const target = document.getElementById('strokes-target');
  const hint = document.getElementById('strokes-hint');
  if (!target) return;

  const cpHex = char.codePointAt(0).toString(16).toLowerCase();
  const bucket = cpHex[0];

  try {
    const pack = await loadStrokePack(bucket);
    const data = pack[cpHex];
    if (!data) throw new Error('无笔顺数据');

    if (typeof HanziWriter === 'undefined') {
      hint.textContent = '（Hanzi Writer 未加载）';
      return;
    }

    hanziWriter = HanziWriter.create('strokes-target', char, {
      width: 240, height: 240, padding: 12,
      strokeColor: '#2b2b2b', radicalColor: '#a33',
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 150,
      charDataLoader: (c, onComplete) => onComplete(data),
    });

    document.getElementById('btn-play').onclick = () => {
      hanziWriter.animateCharacter();
    };
    document.getElementById('btn-quiz').onclick = () => {
      hint.textContent = '请在田字格中书写…';
      hanziWriter.quiz({
        onComplete: (summary) => {
          if (summary.totalMistakes === 0) {
            hint.textContent = '完成！全部正确 ✨';
          } else {
            hint.textContent = `完成！共 ${summary.totalMistakes} 处错误`;
          }
        }
      });
    };
  } catch (e) {
    target.innerHTML = '<div style="color:#9a9282;font-size:13px;padding:20px 0;">暂无笔顺数据</div>';
  }
}

// ============ 工具 ============
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// ============ 事件绑定 ============
searchEl.addEventListener('input', applyFilter);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    applyFilter();
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchToView(tab.dataset.view));
});

document.getElementById('btn-collapse-welcome').addEventListener('click', () => {
  localStorage.setItem(WELCOME_KEY, '1');
  switchToView('dict');
});

const btnShowWelcome = document.getElementById('btn-show-welcome');
if (btnShowWelcome) {
  btnShowWelcome.addEventListener('click', () => {
    localStorage.removeItem(WELCOME_KEY);
    if (typeof renderRules === 'function') renderRules('welcome-rules');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.body.classList.add('welcome-mode');
    document.getElementById('view-welcome').classList.add('active');
    window.scrollTo(0, 0);
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
