// ============ 简繁转化规律数据 ============
const RULES_DATA = [
  {
    id: 'radical',
    name: '部件類推',
    desc: '同一偏旁统一简化，记住一个偏旁，能推出一批字。这是最高效的规律。',
    rules: [
      { pattern: '訁 → 讠', note: '言字旁', examples: ['說|说','話|话','語|语','論|论','讀|读','記|记','詩|诗','詞|词','誰|谁','談|谈'] },
      { pattern: '糸 → 纟', note: '绞丝旁', examples: ['紅|红','級|级','給|给','結|结','紙|纸','線|线','終|终','組|组','絕|绝','織|织'] },
      { pattern: '金 → 钅', note: '金字旁', examples: ['鐵|铁','銀|银','錢|钱','銅|铜','鐘|钟','錯|错','鋼|钢','針|针'] },
      { pattern: '馬 → 马', note: '马字旁', examples: ['騎|骑','驚|惊','驗|验','駕|驾','騙|骗','駐|驻'] },
      { pattern: '鳥 → 鸟', note: '鸟字旁', examples: ['雞|鸡','鴨|鸭','鳴|鸣','鵝|鹅','鶴|鹤','鵬|鹏','鴉|鸦'] },
      { pattern: '魚 → 鱼', note: '鱼字旁', examples: ['鮮|鲜','鯨|鲸','魯|鲁','鯉|鲤','鯽|鲫','鱉|鳖'] },
      { pattern: '貝 → 贝', note: '贝字旁', examples: ['買|买','賣|卖','貴|贵','貨|货','費|费','資|资','購|购','貸|贷'] },
      { pattern: '頁 → 页', note: '页字旁', examples: ['頂|顶','順|顺','頭|头','領|领','頸|颈','題|题','類|类'] },
      { pattern: '見 → 见', note: '见字旁', examples: ['現|现','規|规','視|视','覺|觉','觀|观','覽|览','親|亲'] },
      { pattern: '車 → 车', note: '车字旁', examples: ['輪|轮','轉|转','軟|软','較|较','輕|轻','載|载','軍|军'] },
      { pattern: '門 → 门', note: '门字框', examples: ['開|开','關|关','問|问','間|间','聞|闻','閉|闭','闊|阔'] },
      { pattern: '食 → 饣', note: '食字旁', examples: ['飯|饭','館|馆','餅|饼','餃|饺','餓|饿','飽|饱','飲|饮'] }
    ]
  },
  {
    id: 'symbol',
    name: '符號替代',
    desc: '用一个简单符号替换复杂的部件。规律性强，但符号本身要单独记。',
    rules: [
      { pattern: '又', note: '替换各种复杂部件', examples: ['難|难','歡|欢','漢|汉','觀|观','權|权','勸|劝','對|对','雞|鸡','戲|戏','鄧|邓','樹|树','疊|叠'] },
      { pattern: '乂', note: '仅用于"劉"', examples: ['劉|刘'] },
      { pattern: '不', note: '替换"睘"等部件', examples: ['懷|怀','壞|坏','環|环','還|还'] },
      { pattern: '云', note: '替换"曾"等部件', examples: ['會|会','嘗|尝','層|层'] },
      { pattern: '文', note: '仅用于"這"', examples: ['這|这'] },
      { pattern: '关', note: '替换"關"', examples: ['關|关','聯|联','鄭|郑'] }
    ]
  },
  {
    id: 'cursive',
    name: '草書楷化',
    desc: '字形来源于草书的连笔写法。规律感较弱，需要单独记忆。',
    rules: [
      { pattern: '獨體字', note: '整体简化', examples: ['書|书','為|为','東|东','樂|乐','車|车','長|长','專|专','鳥|鸟','馬|马','魚|鱼','見|见','貝|贝','頁|页','門|门','飛|飞','風|风'] },
      { pattern: '偏旁類', note: '草书连笔形成的新偏旁', examples: ['言|讠','食|饣','糸|纟','金|钅','馬|马','鳥|鸟','魚|鱼','車|车','門|门'] }
    ]
  },
  {
    id: 'homophone',
    name: '同音替代',
    desc: '用一个同音或近音的简单字代替复杂字。这类字往往是"一对多"，必须按词记忆。',
    rules: [
      { pattern: '发 → 發 / 髮', note: '出發用發，頭髮用髮', examples: ['發|发','髮|发','出發|出发','頭髮|头发','發現|发现','理髮|理发'] },
      { pattern: '干 → 乾 / 幹 / 干', note: '乾燥用乾，幹部用幹，干涉用干', examples: ['乾|干','幹|干','干|干','乾燥|干燥','幹部|干部','干涉|干涉'] },
      { pattern: '后 → 後 / 后', note: '以後用後，皇后用后', examples: ['後|后','后|后','以後|以后','皇后|皇后','後面|后面'] },
      { pattern: '里 → 裏 / 里', note: '裏面用裏，公里用里', examples: ['裏|里','里|里','裏面|里面','公里|公里','家裏|家里'] },
      { pattern: '面 → 麵 / 面', note: '麵條用麵，面孔用面', examples: ['麵|面','面|面','麵條|面条','面孔|面孔','麵包|面包'] },
      { pattern: '台 → 臺 / 檯 / 颱', note: '舞臺用臺，檯燈用檯，颱風用颱', examples: ['臺|台','檯|台','颱|台','舞臺|舞台','檯燈|台灯','颱風|台风'] },
      { pattern: '只 → 只 / 隻', note: '只有用只，一隻用隻', examples: ['只|只','隻|只','只有|只有','一隻|一只','隻身|只身'] },
      { pattern: '谷 → 穀 / 谷', note: '穀物用穀，山谷用谷', examples: ['穀|谷','谷|谷','穀物|谷物','山谷|山谷','五穀|五谷'] },
      { pattern: '几 → 幾 / 几', note: '幾個用幾，茶几用几', examples: ['幾|几','几|几','幾個|几个','茶几|茶几','幾乎|几乎'] },
      { pattern: '系 → 係 / 繫 / 系', note: '關係用係，聯繫用繫，系統用系', examples: ['係|系','繫|系','系|系','關係|关系','聯繫|联系','系統|系统'] },
      { pattern: '松 → 鬆 / 松', note: '鬆弛用鬆，松樹用松', examples: ['鬆|松','松|松','鬆弛|松弛','松樹|松树','輕鬆|轻松'] },
      { pattern: '云 → 雲 / 云', note: '雲彩用雲，說云用云', examples: ['雲|云','云|云','雲彩|云彩','雲霧|云雾'] },
      { pattern: '舍 → 捨 / 舍', note: '捨得用捨，宿舍用舍', examples: ['捨|舍','舍|舍','捨得|舍得','宿舍|宿舍','捨棄|舍弃'] },
      { pattern: '布 → 佈 / 布', note: '佈置用佈，布料用布', examples: ['佈|布','布|布','佈置|布置','布料|布料','分佈|分布'] }
    ]
  },
  {
    id: 'semantic',
    name: '新造會意',
    desc: '用简单笔画重新造字，通常保留原字的意象。这些字非常好记。',
    rules: [
      { pattern: '會意造字', note: '用小部件组合出新字', examples: ['塵|尘','體|体','竈|灶','眾|众','淚|泪','滅|灭','奪|夺','郵|邮','審|审','筆|笔','盡|尽'] },
      { pattern: '保留意象', note: '保留最有辨识度的部分', examples: ['飛|飞','陰|阴','陽|阳','寶|宝','國|国','蠶|蚕'] }
    ]
  },
  {
    id: 'feature',
    name: '保留特徵',
    desc: '保留字形中最有辨识度的部分，其余简化。',
    rules: [
      { pattern: '保留核心部件', note: '保留最能表意的部分', examples: ['醫|医','聲|声','縣|县','習|习','處|处','備|备','條|条','務|务','奪|夺','寶|宝'] }
    ]
  }
];

// ============ 渲染 ============
function renderRules(targetId) {
  const container = document.getElementById(targetId || 'rules-content');
  if (!container) return;

  container.innerHTML = RULES_DATA.map((cat, idx) => {
    const rulesHTML = cat.rules.map(rule => {
      const examplesHTML = rule.examples.map(ex => {
        const [trad, simp] = ex.split('|');
        const known = (typeof CHARS !== 'undefined') && CHARS[trad];
        const cls = known ? 'rule-char clickable' : 'rule-char';
        const dataAttr = known ? `data-char="${trad}"` : '';
        return `<span class="${cls}" ${dataAttr}>${trad}<span class="rule-simp">${simp}</span></span>`;
      }).join('');

      return `
        <div class="rule-item">
          <div class="rule-pattern">${escapeHTML(rule.pattern)}</div>
          ${rule.note ? `<div class="rule-note">${escapeHTML(rule.note)}</div>` : ''}
          <div class="rule-examples">${examplesHTML}</div>
        </div>
      `;
    }).join('');

    return `
      <section class="rule-category rule-cat-${cat.id}">
        <div class="rule-cat-head">
          <div class="rule-cat-num">${['一','二','三','四','五','六'][idx] || idx + 1}</div>
          <div>
            <h2 class="rule-cat-name">${escapeHTML(cat.name)}</h2>
            <p class="rule-cat-desc">${escapeHTML(cat.desc)}</p>
          </div>
        </div>
        <div class="rule-list">${rulesHTML}</div>
      </section>
    `;
  }).join('');

  // 绑定示例字点击
  container.querySelectorAll('.rule-char.clickable').forEach(el => {
    el.addEventListener('click', () => {
      const char = el.dataset.char;
      if (typeof switchToView === 'function') {
        switchToView('dict');
      }
      if (typeof selectChar === 'function') selectChar(char);
    });
  });
}

if (typeof escapeHTML !== 'function') {
  window.escapeHTML = function(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  };
}