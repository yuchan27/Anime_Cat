import {
  BACKGROUND_PRESET_MAP,
  COLOR_WORD_MAP,
  FONT_SIZE_LABELS,
  PAGE_ID_ALIASES,
  PAGE_MAP,
  SECTION_EXPLAINERS,
  SHAPE_MODE_LABELS,
  SHAPE_MODE_MAP
} from './config.js';
import {
  getPageById,
  getState,
  isKnownBackgroundPreset,
  isKnownFontSize,
  isKnownPage,
  isKnownShapeMode,
  isKnownTheme,
  resetState,
  updateState
} from './state.js';

const ACTION_TYPES = new Set([
  'goToPage',
  'nextPage',
  'previousPage',
  'getCurrentProgress',
  'setTheme',
  'setFontSize',
  'setBackground',
  'setShapeMode',
  'setMarquee',
  'setPresentationMode',
  'generatePpt',
  'downloadPpt',
  'resetSettings',
  'unknown'
]);

const PAGE_KEYWORDS = [
  ['presentation', ['簡報', 'ppt', '報告', '最後', 'notes', 'presentation']],
  ['tech', ['技術', '模組', '架構', 'anime', 'three', 'gsap']],
  ['features', ['特色', '功能介紹', '故事', '內容']],
  ['gallery', ['圖庫', '圖片', '照片', 'gallery', '展示']],
  ['contact', ['api', '導覽員', '助手', '天氣', '聯絡', 'chat']],
  ['about', ['remotion', '影片', '素材']],
  ['intro', ['3d', '場景', '實驗室', '互動場域']],
  ['home', ['首頁', '主頁', '回家', 'home']]
];

const BACKGROUND_PRESET_KEYWORDS = [
  ['dark', ['深色', '黑色背景', '暗色', 'dark']],
  ['light', ['白色背景', '亮色', '明亮', 'light']],
  ['soft', ['柔和', '溫柔', '淡一點', 'soft']],
  ['neon', ['霓虹', '發光', 'neon']],
  ['pastel', ['粉彩', '可愛色', 'pastel']],
  ['warm', ['暖色', '奶油', '溫暖', 'warm']],
  ['cool', ['冷色', '藍色系', 'cool']],
  ['minimal', ['極簡', '簡約', 'minimal']],
  ['lab', ['未來實驗室', '科技實驗室', '科技感背景', 'lab']],
  ['catRoom', ['貓房', '貓咪房間', 'catroom']]
];

const SHAPE_MODE_KEYWORDS = [
  ['glass', ['玻璃', '毛玻璃', '透明卡片', '透明方塊', 'glass']],
  ['round', ['圓角', '變圓', '圓一點', '圓形', '更圓']],
  ['soft', ['柔和方塊', '柔和卡片', '方塊柔和', '軟一點', '柔一點']],
  ['sharp', ['直角', '變方', '方一點', '俐落', '銳利', 'sharp']],
  ['solid', ['實心', '不要透明', '厚實', 'solid']]
];

const EXPLANATION_FALLBACK = '可以詢問 3D 場景、Anime.js、Three.js、GSAP、Remotion、背景控制、字體控制、跑馬燈、輪軸導覽或簡報頁的做法。';

export function parseNavigatorCommand(message, state = getState()) {
  const text = normalize(message);
  const original = String(message || '').trim();

  if (!text) {
    return withReply(
      { action: 'unknown', message: '請輸入想控制的內容，例如：下一頁、背景改成 #ffffff、字體放大、方塊變圓、跑馬燈改成歡迎來到我的網站。' },
      '請輸入想控制的內容，例如：下一頁、背景改成 #ffffff、字體放大、方塊變圓、跑馬燈改成歡迎來到我的網站。'
    );
  }

  if (includesAny(text, ['還原設定', '恢復預設', '回到預設', '重置設定', 'resetsettings', 'reset'])) {
    return withReply(
      { action: 'resetSettings' },
      '已準備還原預設設定，並把預設偏好保存到本站 Cookie。'
    );
  }

  const explanation = parseExplanation(text);
  if (explanation) return withReply({ action: 'unknown', message: explanation }, explanation);

  const marquee = parseMarquee(original, text);
  if (marquee) {
    return withReply(
      { action: 'setMarquee', text: marquee },
      `跑馬燈會改成「${marquee}」。`
    );
  }

  if (includesAny(text, ['下載ppt', '下載簡報'])) {
    return withReply({ action: 'downloadPpt' }, '我會切到簡報頁並準備 PPT 下載。');
  }

  if (includesAny(text, ['產生ppt', '生成ppt', '做ppt'])) {
    return withReply({ action: 'generatePpt' }, '我會切到簡報頁並產生技術 PPT。');
  }

  if (includesAny(text, ['網頁簡報', '不要下載ppt', '直接顯示簡報'])) {
    return withReply({ action: 'setPresentationMode', mode: 'web' }, '已切換成網頁簡報模式。');
  }

  if (includesAny(text, ['目前進度', '進度到哪', '現在在哪', '第幾頁'])) {
    return withReply({ action: 'getCurrentProgress' }, buildProgressReply(state));
  }

  if (includesAny(text, ['下一頁', '下一張', '往右', 'next'])) {
    return withReply({ action: 'nextPage' }, '切到下一頁。');
  }

  if (includesAny(text, ['上一頁', '上一張', '往左', 'previous', 'prev'])) {
    return withReply({ action: 'previousPage' }, '切到上一頁。');
  }

  if (includesAny(text, ['回首頁', '回到首頁', '回主頁', '回home'])) {
    return withReply({ action: 'goToPage', target: 'home' }, '回到首頁。');
  }

  const pageTarget = parsePageTarget(text);
  if (pageTarget) {
    return withReply(
      { action: 'goToPage', target: pageTarget },
      `切到「${getPageById(pageTarget)?.label || pageTarget}」。`
    );
  }

  const background = parseBackground(text);
  if (background) {
    if (background.color) {
      return withReply(
        { action: 'setBackground', color: background.color },
        `背景會改成 ${background.color}，並保留目前主題。`
      );
    }
    return withReply(
      { action: 'setBackground', preset: background.preset },
      `背景會改成 ${background.preset} 預設，並保留目前主題。`
    );
  }

  const theme = parseTheme(text);
  if (theme) {
    return withReply(
      { action: 'setTheme', theme },
      theme === 'cat' ? '切換成可愛動畫貓咪主題。' : '切換成未來科技發展主題。'
    );
  }

  const fontSize = parseFontSize(text, state.fontSize);
  if (fontSize) {
    return withReply(
      { action: 'setFontSize', size: fontSize },
      `字體大小會改成「${FONT_SIZE_LABELS[fontSize]}」。`
    );
  }

  const shapeMode = parseShapeMode(text);
  if (shapeMode) {
    return withReply(
      { action: 'setShapeMode', mode: shapeMode },
      `方塊形狀會改成「${SHAPE_MODE_LABELS[shapeMode]}」。`
    );
  }

  return withReply(
    { action: 'unknown', message: '我沒有足夠把握執行這個指令，所以不會改動頁面。你可以說：下一頁、背景改成白色、方塊變圓、字體放大、跑馬燈改成歡迎來到我的網站。' },
    '我沒有足夠把握執行這個指令，所以不會改動頁面。你可以說：下一頁、背景改成白色、方塊變圓、字體放大、跑馬燈改成歡迎來到我的網站。'
  );
}

export function validateAIAction(action) {
  if (!action || typeof action !== 'object') {
    return { ok: false, reason: 'Action 必須是物件。' };
  }

  if (!ACTION_TYPES.has(action.action)) {
    return { ok: false, reason: 'Action 不在允許清單內。' };
  }

  switch (action.action) {
    case 'goToPage':
      return isKnownPage(action.target)
        ? { ok: true }
        : { ok: false, reason: '目標頁面不存在。' };
    case 'setTheme':
      return isKnownTheme(action.theme)
        ? { ok: true }
        : { ok: false, reason: '主題不存在。' };
    case 'setFontSize':
      return isKnownFontSize(action.size)
        ? { ok: true }
        : { ok: false, reason: '字體大小不在允許清單內。' };
    case 'setShapeMode':
      return isKnownShapeMode(action.mode)
        ? { ok: true }
        : { ok: false, reason: '方塊形狀模式不在允許清單內。' };
    case 'setBackground':
      if (action.color && !normalizeHexColor(action.color)) {
        return { ok: false, reason: '背景色必須是合法 hex color。' };
      }
      if (action.preset && !isKnownBackgroundPreset(action.preset)) {
        return { ok: false, reason: '背景 preset 不存在。' };
      }
      return action.color || action.preset
        ? { ok: true }
        : { ok: false, reason: 'setBackground 需要 color 或 preset。' };
    case 'setMarquee':
      return typeof action.text === 'string' && action.text.trim().length > 0
        ? { ok: true }
        : { ok: false, reason: '跑馬燈文字不可為空。' };
    case 'setPresentationMode':
      return action.mode === 'web' || action.mode === 'ppt'
        ? { ok: true }
        : { ok: false, reason: '簡報模式不存在。' };
    default:
      return { ok: true };
  }
}

export function handleAIAction(action) {
  const validation = validateAIAction(action);
  if (!validation.ok) {
    return {
      ok: false,
      reply: `已拒絕執行：${validation.reason}`
    };
  }

  const state = getState();

  switch (action.action) {
    case 'goToPage':
      updateState({ currentPage: action.target });
      return { ok: true, reply: `已切到「${getPageById(action.target)?.label || action.target}」。` };

    case 'nextPage': {
      const nextIndex = Math.min(PAGE_MAP.length - 1, state.pageIndex + 1);
      const page = PAGE_MAP[nextIndex];
      updateState({ currentPage: page.id });
      return { ok: true, reply: `已切到「${page.label}」。` };
    }

    case 'previousPage': {
      const prevIndex = Math.max(0, state.pageIndex - 1);
      const page = PAGE_MAP[prevIndex];
      updateState({ currentPage: page.id });
      return { ok: true, reply: `已切到「${page.label}」。` };
    }

    case 'getCurrentProgress':
      return { ok: true, reply: buildProgressReply(state) };

    case 'setTheme':
      updateState({ theme: action.theme });
      return {
        ok: true,
        reply: action.theme === 'cat' ? '已切換成可愛動畫貓咪主題。' : '已切換成未來科技發展主題。'
      };

    case 'setFontSize':
      updateState({ fontSize: action.size });
      return { ok: true, reply: `字體大小已改成「${FONT_SIZE_LABELS[action.size]}」。` };

    case 'setShapeMode':
      updateState({ shapeMode: action.mode });
      return {
        ok: true,
        reply: `方塊形狀已套用「${SHAPE_MODE_LABELS[action.mode]}」。這是安全白名單設定，只會改 CSS tokens。`
      };

    case 'setBackground': {
      const color = action.color ? normalizeHexColor(action.color) : undefined;
      updateState({
        backgroundPreset: action.preset || (color ? 'default' : state.backgroundPreset),
        customBackgroundColor: color
      });
      return {
        ok: true,
        reply: color
          ? `背景已改成 ${color}，目前仍維持 ${state.theme === 'cat' ? '可愛動畫貓咪' : '未來科技發展'}主題。`
          : `背景已改成 ${action.preset} 預設，主題仍維持不變。`
      };
    }

    case 'setMarquee':
      updateState({ marqueeText: action.text });
      return { ok: true, reply: `跑馬燈已更新為「${action.text.trim().slice(0, 120)}」。` };

    case 'setPresentationMode':
      updateState({ presentationMode: action.mode, currentPage: 'presentation' });
      return { ok: true, reply: action.mode === 'web' ? '已進入網頁簡報模式。' : '已切到 PPT 模式。' };

    case 'generatePpt':
      updateState({ currentPage: 'presentation', presentationMode: 'ppt', pptStatus: 'generating' });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('catlab:pptrequest'));
      return { ok: true, reply: '已切到簡報頁並開始準備 PPT。' };

    case 'downloadPpt':
      updateState({ currentPage: 'presentation', presentationMode: 'ppt' });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('catlab:pptrequest'));
      return { ok: true, reply: '已切到簡報頁並準備下載 PPT。' };

    case 'resetSettings':
      resetState();
      return { ok: true, reply: '已還原預設設定，包含主題、背景、字體、方塊形狀、跑馬燈與目前頁面。' };

    case 'unknown':
      return { ok: true, reply: action.message || EXPLANATION_FALLBACK };

    default:
      return { ok: false, reply: '這個 Action 尚未支援。' };
  }
}

export function normalizeHexColor(input) {
  const raw = String(input || '').trim();
  const value = raw.startsWith('#') ? raw.slice(1) : raw;
  return /^[0-9a-fA-F]{6}$/.test(value) ? `#${value.toLowerCase()}` : null;
}

export function pageIdFromHash(hash) {
  const raw = String(hash || '').replace(/^#/, '');
  if (isKnownPage(raw)) return raw;
  return PAGE_ID_ALIASES[raw] || null;
}

export function getReadableTextColor(hexColor) {
  const color = normalizeHexColor(hexColor);
  if (!color) return null;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.56 ? '#11131f' : '#f8fbff';
}

function parseExplanation(text) {
  if (!includesAny(text, ['怎麼做', '怎麼做出來', '如何實作', '怎麼實作', '怎麼運作', '怎麼來的', '怎麼寫'])) {
    return null;
  }

  const target = parsePageTarget(text) || parseExplanationTarget(text);
  return target ? SECTION_EXPLAINERS[target] : EXPLANATION_FALLBACK;
}

function parseExplanationTarget(text) {
  const entries = [
    ['background', ['背景', '色碼', '顏色']],
    ['theme', ['主題', 'future', 'cat', '未來', '貓咪風']],
    ['font', ['字體', '文字大小']],
    ['marquee', ['跑馬燈', '公告']],
    ['wheel', ['輪軸', '導覽輪', '圓形導覽']],
    ['progress', ['進度線', '底部線']],
    ['home', ['首頁', 'hero', '主視覺']],
    ['intro', ['3d', 'three', '場景']],
    ['presentation', ['簡報', 'ppt', 'notes']],
    ['about', ['remotion', '影片', '素材']],
    ['gallery', ['圖庫', '圖片', '照片']],
    ['contact', ['導覽員', '助手', 'api']]
  ];
  return entries.find(([, words]) => includesAny(text, words))?.[0] || null;
}

function parseMarquee(original, text) {
  if (!includesAny(text, ['跑馬燈', '公告'])) return null;
  const patterns = [
    /(?:跑馬燈|公告)(?:改成|顯示|寫成|設定為|：|:)\s*(.+)$/i,
    /新增公告(?:：|:)?\s*(.+)$/i
  ];
  for (const pattern of patterns) {
    const match = original.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value.slice(0, 120);
  }
  return null;
}

function parsePageTarget(text) {
  for (const [pageId, keywords] of PAGE_KEYWORDS) {
    if (includesAny(text, keywords) && includesAny(text, ['去', '切到', '帶我去', '我要看', '前往', '打開', '看'])) {
      return pageId;
    }
  }
  return null;
}

function parseTheme(text) {
  if (includesAny(text, ['貓咪風', '可愛一點', '可愛動畫貓咪', 'cat主題', 'cat theme'])) return 'cat';
  if (includesAny(text, ['未來科技風', '未來科技發展', '科技感一點', 'future主題', 'future theme'])) return 'future';
  return null;
}

function parseBackground(text) {
  if (!includesAny(text, ['背景', '底色', '色系', '柔和', '奶油', '深色', '冷色', '粉紅', '實驗室', '科技感', '霓虹', 'lab'])) {
    return null;
  }

  const hexMatch = text.match(/#?[0-9a-fA-F]{6}/);
  if (hexMatch) {
    const color = normalizeHexColor(hexMatch[0]);
    if (color) return { color };
  }

  const normalizedColorMap = {
    ...COLOR_WORD_MAP,
    白: '#ffffff',
    白色: '#ffffff',
    黑: '#050505',
    黑色: '#050505',
    粉紅: '#ffd6e8',
    粉紅色: '#ffd6e8',
    奶油: '#fff8ed',
    奶油色: '#fff8ed',
    藍色: '#eff6ff',
    冷色: '#eff6ff',
    深色: '#111827',
    紫色: '#f7f2ff',
    綠色: '#e8fff7',
    黃色: '#fff8d6',
    橘色: '#fff1df',
    紅色: '#fff0ed',
    灰色: '#f4f4f5'
  };

  for (const [word, color] of Object.entries(normalizedColorMap)) {
    if (text.includes(String(word).toLowerCase())) return { color };
  }

  for (const [preset, keywords] of BACKGROUND_PRESET_KEYWORDS) {
    if (includesAny(text, keywords)) return { preset };
  }

  const explicit = Object.keys(BACKGROUND_PRESET_MAP).find((preset) => text.includes(preset.toLowerCase()));
  return explicit ? { preset: explicit } : null;
}

function parseShapeMode(text) {
  if (!includesAny(text, ['方塊', '卡片', '板塊', '形狀', '圓角', '直角', '玻璃', '毛玻璃', '透明', '實心', 'shape'])) {
    return null;
  }

  for (const [mode, keywords] of SHAPE_MODE_KEYWORDS) {
    if (includesAny(text, keywords)) return mode;
  }

  const explicit = Object.keys(SHAPE_MODE_MAP).find((mode) => text.includes(mode));
  return explicit || null;
}

function parseFontSize(text, currentSize) {
  if (!includesAny(text, ['字體', '文字', '字'])) return null;
  if (includesAny(text, ['特大', '最大'])) return 'xl';
  if (includesAny(text, ['放大', '大一點', '字大', '大字體'])) return currentSize === 'xl' ? 'xl' : 'lg';
  if (includesAny(text, ['中等', '中型', '正常', '標準'])) return 'md';
  if (includesAny(text, ['小一點', '縮小', '小字', '變小'])) return 'sm';
  return null;
}

function buildProgressReply(state) {
  const page = getPageById(state.currentPage);
  return `目前在「${page?.label || '未知頁面'}」，第 ${state.pageIndex + 1} / ${PAGE_MAP.length} 頁。${page?.summary || ''}`;
}

function withReply(action, reply) {
  return { action, reply };
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(String(keyword).toLowerCase()));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}
