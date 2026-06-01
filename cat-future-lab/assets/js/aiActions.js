import {
  BACKGROUND_PRESET_MAP,
  COLOR_WORD_MAP,
  FONT_FAMILY_LABELS,
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
  isKnownFontFamily,
  isKnownFontSize,
  isKnownPage,
  isKnownShapeMode,
  isKnownTheme,
  resetState,
  updateState
} from './state.js';

const PAGE_LABEL_ALIASES = {
  home: ['首頁', '主頁', '回首頁', 'home', 'hero'],
  intro: ['介紹', '3d', '3D', '場域', '城市場域', 'scene'],
  features: ['特色', '功能', '故事', 'features'],
  tech: ['技術', '模組', '架構', 'anime', 'three', 'gsap'],
  gallery: ['展示', '圖像', '圖片', 'gallery'],
  about: ['關於', '影像', '影片', 'remotion'],
  contact: ['控制', '導覽', 'ai', 'api', '天氣', 'contact'],
  presentation: ['簡報', '報告', 'ppt', 'notes', 'presentation']
};

const COLOR_ALIASES = {
  白色: '#ffffff',
  黑色: '#050505',
  粉紅: '#ffd6e8',
  粉紅色: '#ffd6e8',
  奶油: '#fff8ed',
  奶油色: '#fff8ed',
  米色: '#fff8ed',
  藍色: '#eff6ff',
  冷色: '#eff6ff',
  綠色: '#d8f3dc',
  紫色: '#efe7ff',
  金色: '#d4af37',
  特殊金色: '#d4af37',
  香檳金: '#d7c27a',
  銀色: '#d8dde6',
  金屬灰: '#8f98a8',
  深藍: '#111827',
  深色: '#050505',
  柔和: '#f7f2ff',
  gold: '#d4af37',
  champagne: '#d7c27a',
  silver: '#d8dde6',
  steel: '#8f98a8',
  white: '#ffffff',
  black: '#050505',
  pink: '#ffd6e8',
  cream: '#fff8ed',
  blue: '#eff6ff',
  purple: '#efe7ff'
};

const SECRET_PATTERNS = [
  /api\s*key/i,
  /google\s*ai\s*key/i,
  /AIza[0-9A-Za-z_-]{20,}/,
  /secret/i,
  /token/i,
  /金鑰/,
  /密鑰/,
  /密碼/
];

const PLAIN_COLOR_ALIASES = {
  '白色': '#ffffff',
  '白': '#ffffff',
  '黑色': '#050505',
  '黑': '#050505',
  '紅色': '#d92d20',
  '紅': '#d92d20',
  '深紅': '#991b1b',
  '粉紅色': '#ffd6e8',
  '粉紅': '#ffd6e8',
  '藍色': '#2563eb',
  '藍': '#2563eb',
  '深藍': '#111827',
  '綠色': '#16a34a',
  '綠': '#16a34a',
  '紫色': '#7c3aed',
  '紫': '#7c3aed',
  '黃色': '#facc15',
  '黃': '#facc15',
  '金色': '#d4af37',
  '金屬金': '#c9a646',
  '銀色': '#d8dde6',
  '灰色': '#71717a',
  '奶油色': '#fff8ed',
  '奶油': '#fff8ed',
  '米色': '#fff8ed'
};

function inferPlainChineseControls(text) {
  const value = String(text || '').toLowerCase();
  const compact = value.replace(/\s+/g, '');
  const intent = {};

  if (/(背景|底色|background|bg)/i.test(value)) {
    const color = inferPlainChineseColor(value);
    if (color) intent.backgroundColor = color;
    else if (/(柔和|粉彩|soft|pastel)/i.test(value)) intent.backgroundPreset = 'soft';
    else if (/(暖|溫暖|奶油|warm)/i.test(value)) intent.backgroundPreset = 'warm';
    else if (/(冷|冷色|cool)/i.test(value)) intent.backgroundPreset = 'cool';
    else if (/(深色|黑|dark)/i.test(value)) intent.backgroundPreset = 'dark';
    else if (/(淺色|白|light)/i.test(value)) intent.backgroundPreset = 'light';
  }

  if (/(字體|字型|font|typeface)/i.test(value)) {
    const size = normalizeFontSize(value);
    const family = normalizeFontFamily(value);
    if (size) intent.fontSize = size;
    if (family) intent.fontFamily = family;
  }

  if (/(框框|卡片|邊框|形狀|圓形|圓角|直角|毛玻璃|玻璃|shape|round|rounded|sharp|glass)/i.test(value)) {
    intent.shapeMode = normalizeShapeMode(value) || 'soft';
  }

  if (/(金屬|鋼|銀|chrome|metal|metallic|steel)/i.test(value) && /(風格|主題|模式|theme)/i.test(value)) {
    intent.theme = 'metal';
  } else if (/(未來|科技|future)/i.test(value) && /(風格|主題|模式|theme)/i.test(value)) {
    intent.theme = 'future';
  } else if (/(溫暖|貓|暖|cat|warm)/i.test(value) && /(風格|主題|模式|theme)/i.test(value)) {
    intent.theme = 'cat';
  }

  if (/^(下一頁|下頁|next)$/.test(compact)) intent.pageAction = 'nextPage';
  if (/^(上一頁|上頁|previous|prev)$/.test(compact)) intent.pageAction = 'previousPage';

  return intent;
}

function inferPlainChineseColor(text) {
  const value = String(text || '').toLowerCase();
  const hex = value.match(/#?[0-9a-f]{6}/i)?.[0];
  if (hex) return normalizeHexColor(hex);

  for (const [word, color] of Object.entries(PLAIN_COLOR_ALIASES)) {
    if (value.includes(word.toLowerCase())) return color;
  }

  return null;
}

export function coerceAIAction(rawAction, message = '') {
  const action = normalizeActionShape(rawAction);
  const text = String(message || '');

  if (isSecretRequest(text)) {
    return { action: 'unknown', message: '我不能讀取、顯示或推測 API key、token 或其他敏感資訊，但可以協助控制頁面外觀與導覽。' };
  }

  if (action.action === 'unknown' || !action.action) {
    return inferActionFromText(text);
  }

  if (action.action === 'goToPage') {
    return { action: 'goToPage', target: normalizePageId(action.target || action.page || action.value) || 'home' };
  }

  if (action.action === 'setBackground') {
    const color = normalizeHexColor(action.color || action.value);
    if (color) return { action: 'setBackground', color };
    const preset = normalizeBackgroundPreset(action.preset || action.value);
    if (preset) return { action: 'setBackground', preset };
    const inferred = inferColorFromText(text);
    if (inferred) return { action: 'setBackground', color: inferred };
  }

  if (action.action === 'setTextColor') {
    const color = normalizeHexColor(action.color || action.value) || inferColorFromText(text);
    return color ? { action: 'setTextColor', color } : { action: 'unknown', message: '我需要明確的文字顏色，例如 #ffffff 或白色。' };
  }

  if (action.action === 'setTheme') {
    const theme = normalizeTheme(action.theme || action.value);
    return theme ? { action: 'setTheme', theme } : inferActionFromText(text);
  }

  if (action.action === 'setFontSize') {
    const size = normalizeFontSize(action.size || action.value);
    return size ? { action: 'setFontSize', size } : inferActionFromText(text);
  }

  if (action.action === 'setFontFamily') {
    const family = normalizeFontFamily(action.family || action.fontFamily || action.value);
    return family ? { action: 'setFontFamily', family } : inferActionFromText(text);
  }

  if (action.action === 'setShapeMode') {
    const mode = normalizeShapeMode(action.mode || action.value);
    return mode ? { action: 'setShapeMode', mode } : inferActionFromText(text);
  }

  if (action.action === 'setMarquee' || action.action === 'setMarqueeText') {
    const value = String(action.text || action.value || '').trim();
    return value ? { action: 'setMarquee', text: value.slice(0, 120) } : inferActionFromText(text);
  }

  if (action.action === 'setPresentationMode') {
    return { action: 'setPresentationMode', mode: action.mode === 'ppt' ? 'ppt' : 'web' };
  }

  return action;
}

export function coerceAIActionList(rawAction, message = '') {
  const list = normalizeActionList(rawAction);
  return list.map((item) => coerceAIAction(item, message));
}

export function parseNavigatorCommand(message, state = getState()) {
  const text = String(message || '').trim();
  const actions = inferActionsFromText(text, state);
  if (actions.length === 1) {
    return withReply(actions[0], describeAction(actions[0], state));
  }
  return { actions, reply: describeActionSequence(actions, state) };
}

export function validateAIAction(rawAction) {
  const action = coerceAIAction(rawAction);
  if (!action || typeof action !== 'object') return { ok: false, reason: 'Action 不是物件。' };

  switch (action.action) {
    case 'goToPage':
      return isKnownPage(action.target) ? { ok: true } : { ok: false, reason: '找不到指定頁面。' };
    case 'nextPage':
    case 'previousPage':
    case 'getCurrentProgress':
    case 'generatePpt':
    case 'downloadPpt':
    case 'resetSettings':
    case 'unknown':
      return { ok: true };
    case 'setTheme':
      return isKnownTheme(action.theme) ? { ok: true } : { ok: false, reason: '未知主題。' };
    case 'setFontSize':
      return isKnownFontSize(action.size) ? { ok: true } : { ok: false, reason: '未知字體大小。' };
    case 'setFontFamily':
      return isKnownFontFamily(action.family) ? { ok: true } : { ok: false, reason: '未知字體家族。' };
    case 'setBackground':
      if (action.color) return normalizeHexColor(action.color) ? { ok: true } : { ok: false, reason: '背景色不是合法 hex。' };
      if (action.preset) return isKnownBackgroundPreset(action.preset) ? { ok: true } : { ok: false, reason: '未知背景 preset。' };
      return { ok: false, reason: '背景操作需要 color 或 preset。' };
    case 'setTextColor':
      return normalizeHexColor(action.color) ? { ok: true } : { ok: false, reason: '文字顏色不是合法 hex。' };
    case 'setShapeMode':
      return isKnownShapeMode(action.mode) ? { ok: true } : { ok: false, reason: '未知形狀模式。' };
    case 'setMarquee':
      return typeof action.text === 'string' && action.text.trim() ? { ok: true } : { ok: false, reason: '跑馬燈文字不可空白。' };
    case 'setPresentationMode':
      return action.mode === 'web' || action.mode === 'ppt' ? { ok: true } : { ok: false, reason: '未知簡報模式。' };
    default:
      return { ok: true };
  }
}

export function handleAIAction(rawAction, options = {}) {
  return executeAction(coerceAIAction(rawAction), options);
}

export function handleVisibleAIAction(rawAction, options = {}) {
  return executeAction(coerceAIAction(rawAction), options);
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

function executeAction(action, options = {}) {
  const validation = validateAIAction(action);
  if (!validation.ok) return { ok: false, reply: `這個操作無法套用：${validation.reason}` };

  const shouldPersist = options.persist === true;

  const state = getState();
  switch (action.action) {
    case 'goToPage':
      updateState({ currentPage: action.target }, { persist: shouldPersist });
      return { ok: true, reply: `已切換到「${getPageById(action.target)?.label || action.target}」。` };

    case 'nextPage': {
      const nextIndex = Math.min(PAGE_MAP.length - 1, state.pageIndex + 1);
      const page = PAGE_MAP[nextIndex];
      updateState({ currentPage: page.id }, { persist: shouldPersist });
      return { ok: true, reply: `已前往「${page.label}」。` };
    }

    case 'previousPage': {
      const prevIndex = Math.max(0, state.pageIndex - 1);
      const page = PAGE_MAP[prevIndex];
      updateState({ currentPage: page.id }, { persist: shouldPersist });
      return { ok: true, reply: `已回到「${page.label}」。` };
    }

    case 'getCurrentProgress':
      return { ok: true, reply: buildProgressReply(state) };

    case 'setTheme':
      updateState({ theme: action.theme }, { persist: shouldPersist });
      return { ok: true, reply: `已切換為${getThemeLabel(action.theme)}風格。` };

    case 'setFontSize':
      updateState({ fontSize: action.size }, { persist: shouldPersist });
      return { ok: true, reply: `字體大小已改成「${FONT_SIZE_LABELS[action.size] || action.size}」。` };

    case 'setFontFamily':
      updateState({ fontFamily: action.family }, { persist: shouldPersist });
      return { ok: true, reply: `字體已切換為「${FONT_FAMILY_LABELS[action.family] || action.family}」。` };

    case 'setBackground': {
      const color = action.color ? normalizeHexColor(action.color) : undefined;
      updateState({ backgroundPreset: action.preset || (color ? 'default' : state.backgroundPreset), customBackgroundColor: color }, { persist: shouldPersist });
      return {
        ok: true,
        reply: color
          ? `背景已改成 ${color}，但仍保留目前的整體風格。`
          : `背景已套用「${action.preset}」風格，主題不會被改掉。`
      };
    }

    case 'setTextColor':
      updateState({ customTextColor: normalizeHexColor(action.color) }, { persist: shouldPersist });
      return { ok: true, reply: `文字顏色已改成 ${normalizeHexColor(action.color)}。` };

    case 'setShapeMode':
      updateState({ shapeMode: action.mode }, { persist: shouldPersist });
      return { ok: true, reply: `方塊形狀已改成「${SHAPE_MODE_LABELS[action.mode] || action.mode}」。` };

    case 'setMarquee':
      updateState({ marqueeText: action.text }, { persist: shouldPersist });
      return { ok: true, reply: `跑馬燈已更新為「${action.text.trim().slice(0, 120)}」。` };

    case 'setPresentationMode':
      updateState({ presentationMode: action.mode, currentPage: 'presentation' }, { persist: shouldPersist });
      return { ok: true, reply: action.mode === 'web' ? '已切到網頁簡報。' : '已切到 PPT 模式。' };

    case 'generatePpt':
    case 'downloadPpt':
      updateState({ currentPage: 'presentation', presentationMode: 'ppt', pptStatus: 'generating' }, { persist: shouldPersist });
      window.dispatchEvent(new CustomEvent('catlab:pptrequest'));
      return { ok: true, reply: '已前往簡報頁並準備 PPT。' };

    case 'resetSettings':
      resetState({ preserveTheme: true, preservePage: true, persist: shouldPersist });
      return { ok: true, reply: '已清除導覽調整，保留目前選擇的風格與頁面。' };

    case 'unknown':
      return { ok: true, reply: action.message || '我可以回答這個區塊怎麼做，也可以控制頁面、背景、字體與跑馬燈。' };

    default:
      return { ok: false, reply: '這個 action 尚未支援。' };
  }
}

function normalizeActionShape(rawAction) {
  if (!rawAction || typeof rawAction !== 'object') return { action: 'unknown' };
  if (typeof rawAction.action === 'string') return { ...rawAction };

  const entries = Object.entries(rawAction);
  if (entries.length === 1) {
    const [key, value] = entries[0];
    switch (key) {
      case 'goToPage':
      case 'page':
      case 'target':
        return { action: 'goToPage', target: value };
      case 'nextPage':
      case 'previousPage':
      case 'getCurrentProgress':
      case 'generatePpt':
      case 'downloadPpt':
      case 'resetSettings':
        return { action: key };
      case 'setTheme':
        return { action: 'setTheme', theme: value };
      case 'setFontSize':
        return { action: 'setFontSize', size: value };
      case 'setFontFamily':
        return { action: 'setFontFamily', family: value };
      case 'setBackground':
        return typeof value === 'string'
          ? { action: 'setBackground', value }
          : { action: 'setBackground', ...(value || {}) };
      case 'setTextColor':
        return typeof value === 'string'
          ? { action: 'setTextColor', color: value }
          : { action: 'setTextColor', ...(value || {}) };
      case 'setShapeMode':
        return { action: 'setShapeMode', mode: value };
      case 'setMarquee':
      case 'setMarqueeText':
        return { action: 'setMarquee', text: value };
      case 'setPresentationMode':
        return { action: 'setPresentationMode', mode: value };
      default:
        return { action: 'unknown', message: `模型回傳了尚未支援的操作「${key}」。` };
    }
  }

  if (rawAction.goToPage || rawAction.page || rawAction.target) {
    return { action: 'goToPage', target: rawAction.goToPage || rawAction.page || rawAction.target };
  }
  if (rawAction.setBackground || rawAction.background || rawAction.color) {
    return { action: 'setBackground', value: rawAction.setBackground || rawAction.background || rawAction.color };
  }
  if (rawAction.setFontFamily || rawAction.fontFamily) {
    return { action: 'setFontFamily', family: rawAction.setFontFamily || rawAction.fontFamily };
  }

  return { action: 'unknown' };
}

function inferActionFromText(message, state = getState()) {
  const text = String(message || '').trim();
  const compact = text.toLowerCase().replace(/\s+/g, '');
  if (!compact) return { action: 'unknown', message: '請輸入想控制或想詢問的內容。' };

  if (isSecretRequest(text)) {
    return { action: 'unknown', message: '我不能讀取或顯示 API key、token、密碼等敏感資訊。' };
  }

  const directPage = inferDirectPageCommand(text);
  if (directPage) return { action: 'goToPage', target: directPage };

  const explanation = inferExplanation(compact);
  if (explanation) return { action: 'unknown', message: explanation };

  if (/(下一頁|下頁|next)/i.test(text)) return { action: 'nextPage' };
  if (/(上一頁|前一頁|previous|prev)/i.test(text)) return { action: 'previousPage' };
  if (/(目前|進度|第幾頁)/.test(text)) return { action: 'getCurrentProgress' };
  if (/(還原|預設|reset)/i.test(text)) return { action: 'resetSettings' };
  if (/(下載.*ppt|ppt.*下載)/i.test(text)) return { action: 'downloadPpt' };
  if (/(產生.*ppt|生成.*ppt)/i.test(text)) return { action: 'generatePpt' };

  const page = inferPage(text);
  if (page) return { action: 'goToPage', target: page };

  const marquee = inferMarquee(text);
  if (marquee) return { action: 'setMarquee', text: marquee };

  if (/(金屬|鋼|銀色|鉻|霧面|metal|metallic|steel|chrome)/i.test(text) && /(風格|主題|切換|換成|感)/.test(text)) return { action: 'setTheme', theme: 'metal' };
  if (/(未來|科技|法式)/.test(text) && /(風格|主題|切換|換成)/.test(text)) return { action: 'setTheme', theme: 'future' };
  if (/(溫暖|貓咪|可愛|療癒)/.test(text) && /(風格|主題|切換|換成)/.test(text)) return { action: 'setTheme', theme: 'cat' };

  if (/(字體|字型|字族|文字|字|font|typeface)/i.test(text)) {
    const size = normalizeFontSize(text);
    if (size) return { action: 'setFontSize', size };
    const family = normalizeFontFamily(text);
    if (family) return { action: 'setFontFamily', family };
  }

  if (/(圓角|圓一點|柔和|毛玻璃|玻璃|直角|方塊|形狀|shape)/i.test(text)) {
    const mode = normalizeShapeMode(text) || 'soft';
    return { action: 'setShapeMode', mode };
  }

  if (/(文字顏色|字體顏色|字的顏色)/.test(text)) {
    const color = inferColorFromText(text);
    if (color) return { action: 'setTextColor', color };
  }

  if (/(背景|底色|顏色|color|background|bg)/i.test(text)) {
    const color = inferColorFromText(text);
    if (color) return { action: 'setBackground', color };
    const preset = normalizeBackgroundPreset(text);
    if (preset) return { action: 'setBackground', preset };
  }

  return {
    action: 'unknown',
    message: `我理解你的訊息是「${text}」。目前可以控制頁面、主題、背景、字體、形狀、跑馬燈，也可以回答各區塊的做法。`
  };
}

export function inferActionsFromText(message, state = getState()) {
  const text = String(message || '').trim();
  const compact = text.toLowerCase().replace(/\s+/g, '');
  if (!compact) return [{ action: 'unknown', message: '請輸入想控制或想詢問的內容。' }];

  if (isSecretRequest(text)) {
    return [{ action: 'unknown', message: '我不能讀取或顯示 API key、token、密碼等敏感資訊。' }];
  }

  const explanation = inferExplanation(compact);
  if (explanation) return [{ action: 'unknown', message: explanation }];

  if (/(還原|預設|reset)/i.test(text)) return [{ action: 'resetSettings' }];
  if (/(下載.*ppt|ppt.*下載)/i.test(text)) return [{ action: 'downloadPpt' }];
  if (/(產生.*ppt|生成.*ppt)/i.test(text)) return [{ action: 'generatePpt' }];

  const actions = [];
  const used = new Set();
  const push = (action) => {
    if (!action || !action.action) return;
    if (used.has(action.action)) return;
    used.add(action.action);
    actions.push(action);
  };
  const plainControls = inferPlainChineseControls(text);

  const directPage = inferDirectPageCommand(text);
  if (directPage) {
    push({ action: 'goToPage', target: directPage });
  } else if (/(下一頁|下頁|next)/i.test(text)) {
    push({ action: 'nextPage' });
  } else if (/(上一頁|前一頁|previous|prev)/i.test(text)) {
    push({ action: 'previousPage' });
  } else if (/(目前|進度|第幾頁)/.test(text)) {
    push({ action: 'getCurrentProgress' });
  } else {
    const page = inferPage(text);
    if (page) push({ action: 'goToPage', target: page });
  }

  const marquee = inferMarquee(text);
  if (marquee) push({ action: 'setMarquee', text: marquee });
  if (plainControls.pageAction) push({ action: plainControls.pageAction });
  if (plainControls.theme) push({ action: 'setTheme', theme: plainControls.theme });
  if (plainControls.fontSize) push({ action: 'setFontSize', size: plainControls.fontSize });
  if (plainControls.fontFamily) push({ action: 'setFontFamily', family: plainControls.fontFamily });
  if (plainControls.shapeMode) push({ action: 'setShapeMode', mode: plainControls.shapeMode });
  if (plainControls.backgroundColor) push({ action: 'setBackground', color: plainControls.backgroundColor });
  if (plainControls.backgroundPreset) push({ action: 'setBackground', preset: plainControls.backgroundPreset });

  if (/(金屬|鋼|銀色|鉻|霧面|metal|metallic|steel|chrome)/i.test(text) && /(風格|主題|切換|換成|感)/.test(text)) {
    push({ action: 'setTheme', theme: 'metal' });
  }
  if (/(未來|科技|法式)/.test(text) && /(風格|主題|切換|換成)/.test(text)) {
    push({ action: 'setTheme', theme: 'future' });
  }
  if (/(溫暖|貓咪|可愛|療癒)/.test(text) && /(風格|主題|切換|換成)/.test(text)) {
    push({ action: 'setTheme', theme: 'cat' });
  }

  if (/(字體|字型|字族|文字|字|font|typeface)/i.test(text)) {
    const size = normalizeFontSize(text);
    if (size) push({ action: 'setFontSize', size });
    const family = normalizeFontFamily(text);
    if (family) push({ action: 'setFontFamily', family });
  }

  if (/(圓角|圓一點|柔和|毛玻璃|玻璃|直角|方塊|形狀|shape)/i.test(text)) {
    const mode = normalizeShapeMode(text) || 'soft';
    push({ action: 'setShapeMode', mode });
  }

  const hasTextColorIntent = /(文字顏色|字體顏色|字的顏色)/.test(text);
  if (hasTextColorIntent) {
    const color = inferColorFromText(text);
    if (color) push({ action: 'setTextColor', color });
  }

  const hasBackgroundIntent = /(背景|底色|background|bg)/i.test(text);
  const hasColorIntent = /(顏色|color)/i.test(text);
  if ((hasBackgroundIntent || (hasColorIntent && !hasTextColorIntent))) {
    const color = inferColorFromText(text);
    if (color) {
      push({ action: 'setBackground', color });
    } else {
      const preset = normalizeBackgroundPreset(text);
      if (preset) push({ action: 'setBackground', preset });
    }
  }

  if (actions.length) return actions;

  return [{
    action: 'unknown',
    message: `我理解你的訊息是「${text}」。目前可以控制頁面、主題、背景、字體、形狀、跑馬燈，也可以回答各區塊的做法。`
  }];
}

function inferDirectPageCommand(text) {
  const value = String(text || '').toLowerCase();
  const wantsNavigation = /(切到|前往|帶我去|我要看|打開|進入|回到|回首頁|去最後|到最後|goto|go to|show|open)/i.test(value);
  if (!wantsNavigation) return null;

  if (/(首頁|主頁|home|hero)/i.test(value)) return 'home';
  if (/(簡報|報告|ppt|notes|最後)/i.test(value)) return 'presentation';
  if (/(控制|導覽|ai|api|天氣|城市|contact)/i.test(value)) return 'contact';
  if (/(影像|影片|remotion|about)/i.test(value)) return 'about';
  if (/(展示|圖庫|觀測圖像|gallery)/i.test(value)) return 'gallery';
  if (/(技術|模組|anime|three|gsap|tech)/i.test(value)) return 'tech';
  if (/(功能|特色|特點|features|story)/i.test(value)) return 'features';
  if (/(介紹|3d|場域|場景|scene|intro)/i.test(value)) return 'intro';

  return null;
}

function inferPage(text) {
  const compact = String(text || '').toLowerCase().replace(/\s+/g, '');
  for (const [pageId, aliases] of Object.entries(PAGE_LABEL_ALIASES)) {
    if (aliases.some((alias) => compact.includes(String(alias).toLowerCase()))) {
      if (/(切到|前往|去|打開|查看|看|回|goto|page)/i.test(text)) return pageId;
    }
  }
  return null;
}

function inferMarquee(text) {
  if (!/(跑馬燈|公告|marquee)/i.test(text)) return null;
  const match = text.match(/(?:改成|顯示|新增公告[:：]?|公告[:：]?|跑馬燈[:：]?)(.+)$/);
  return match?.[1]?.trim().slice(0, 120) || null;
}

function inferColorFromText(text) {
  const hex = String(text || '').match(/#?[0-9a-fA-F]{6}/)?.[0];
  if (hex) return normalizeHexColor(hex);

  const normalized = String(text || '').toLowerCase();
  const plainColor = inferPlainChineseColor(normalized);
  if (plainColor) return plainColor;
  const allColors = { ...COLOR_WORD_MAP, ...COLOR_ALIASES };
  for (const [word, color] of Object.entries(allColors)) {
    if (normalized.includes(String(word).toLowerCase())) return color;
  }
  return null;
}

function inferExplanation(text) {
  if (!/(怎麼做|怎麼實作|如何做|原理|介紹|說明|功能|why|how)/i.test(text)) return null;
  const target = inferPage(text) || Object.entries(PAGE_LABEL_ALIASES)
    .find(([, aliases]) => aliases.some((alias) => text.includes(String(alias).toLowerCase())))?.[0];
  if (target && SECTION_EXPLAINERS[target]) return SECTION_EXPLAINERS[target];
  if (text.includes('背景')) return SECTION_EXPLAINERS.background;
  if (text.includes('字體')) return SECTION_EXPLAINERS.font;
  if (text.includes('形狀') || text.includes('方塊')) return SECTION_EXPLAINERS.shape;
  if (text.includes('跑馬燈')) return SECTION_EXPLAINERS.marquee;
  return '這個網站用 AppState 管理目前頁面、主題、背景、字體、形狀與簡報狀態；所有自然語言控制都會先轉成 action，再由前端 router 套用，不會直接執行模型產生的程式碼。';
}

function normalizePageId(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownPage(text)) return text;
  return Object.entries(PAGE_LABEL_ALIASES).find(([, aliases]) => (
    aliases.some((alias) => text.includes(String(alias).toLowerCase()))
  ))?.[0] || null;
}

function normalizeTheme(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownTheme(text)) return text;
  if (/金屬|鋼|銀|chrome|metal|metallic|steel/.test(text)) return 'metal';
  if (/未來|科技|future/.test(text)) return 'future';
  if (/溫暖|貓咪|貓|warm|cat/.test(text)) return 'cat';
  if (/metal|metallic|steel|chrome|金屬|鋼|銀色|鉻|霧面/.test(text)) return 'metal';
  if (/future|未來|科技|法式/.test(text)) return 'future';
  if (/cat|貓|溫暖|可愛/.test(text)) return 'cat';
  return null;
}

function normalizeFontSize(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownFontSize(text)) return text;
  if (/特大|超大|extra\s*large|xl/.test(text)) return 'xl';
  if (/大一點|放大|大型|大字|大\b|large|lg/.test(text)) return 'lg';
  if (/中等|中型|中\b|medium|md/.test(text)) return 'md';
  if (/小一點|縮小|小型|小\b|small|sm/.test(text)) return 'sm';
  if (/特大|超大|最大|xl/.test(text)) return 'xl';
  if (/大一點|放大|大|lg|large/.test(text)) return 'lg';
  if (/中|預設|正常|md|medium/.test(text)) return 'md';
  if (/小一點|縮小|小|sm|small/.test(text)) return 'sm';
  return null;
}

function normalizeFontFamily(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownFontFamily(text)) return text;
  if (/標楷|標楷體|dfkai|kai\s?ti|kaiti/.test(text)) return 'kai';
  if (/新細明體|細明體|pmingliu|mingliu|明體|宋體/.test(text)) return 'serif';
  if (/微軟正黑|正黑|jhenghei|microsoft\s*jhenghei|msjh/.test(text)) return 'jhenghei';
  if (/思源黑|noto\s*sans|noto/.test(text)) return 'noto';
  if (/系統|system|segoe/.test(text)) return 'system';
  if (/等寬|程式碼|mono|code|monospace/.test(text)) return 'mono';
  if (/預設|default/.test(text)) return 'default';
  if (/微軟正黑體|正黑體|msjh|jhenghei|microsoft\s*jhenghei/.test(text)) return 'jhenghei';
  if (/思源黑體|黑體|無襯線|sans|noto/.test(text)) return 'noto';
  if (/系統|system/.test(text)) return 'system';
  if (/襯線|serif|宋體|明體|手寫|書法/.test(text)) return 'serif';
  if (/等寬|mono|code|monospace/.test(text)) return 'mono';
  if (/預設|default/.test(text)) return 'default';
  return null;
}

function normalizeShapeMode(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownShapeMode(text)) return text;
  if (/毛玻璃|玻璃|glass|frost/.test(text)) return 'glass';
  if (/圓形|圓角|變圓|框框.*圓|卡片.*圓|round|rounded|pill/.test(text)) return 'round';
  if (/柔和|柔軟|soft/.test(text)) return 'soft';
  if (/直角|銳利|sharp|square/.test(text)) return 'sharp';
  if (/實心|不透明|solid/.test(text)) return 'solid';
  if (/毛玻璃|玻璃|透明|glass/.test(text)) return 'glass';
  if (/圓角|圓一點|圓|round/.test(text)) return 'round';
  if (/柔和|soft/.test(text)) return 'soft';
  if (/直角|銳利|sharp/.test(text)) return 'sharp';
  if (/實心|不透明|solid/.test(text)) return 'solid';
  return null;
}

function normalizeBackgroundPreset(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownBackgroundPreset(text)) return text;
  if (/深色|暗色|黑|dark/.test(text)) return 'dark';
  if (/淺色|亮色|白|light/.test(text)) return 'light';
  if (/柔和|柔軟|soft/.test(text)) return 'soft';
  if (/霓虹|neon/.test(text)) return 'neon';
  if (/粉彩|pastel/.test(text)) return 'pastel';
  if (/溫暖|暖|奶油|warm/.test(text)) return 'warm';
  if (/冷色|冷|cool/.test(text)) return 'cool';
  if (/極簡|minimal/.test(text)) return 'minimal';
  if (/實驗室|lab/.test(text)) return 'lab';
  if (/貓房|catroom/.test(text)) return 'catRoom';
  if (/深色|黑|dark/.test(text)) return 'dark';
  if (/淺色|白|light/.test(text)) return 'light';
  if (/柔和|soft/.test(text)) return 'soft';
  if (/霓虹|neon/.test(text)) return 'neon';
  if (/粉彩|pastel/.test(text)) return 'pastel';
  if (/溫暖|奶油|warm/.test(text)) return 'warm';
  if (/冷色|藍|cool/.test(text)) return 'cool';
  if (/極簡|minimal/.test(text)) return 'minimal';
  if (/實驗室|lab/.test(text)) return 'lab';
  if (/貓房|catroom/.test(text)) return 'catRoom';
  return null;
}

function isSecretRequest(text) {
  const value = String(text || '');
  return SECRET_PATTERNS.some((pattern) => pattern.test(value)) && /(給我|顯示|讀取|說出|show|print|reveal)/i.test(value);
}

function buildProgressReply(state) {
  const page = getPageById(state.currentPage);
  return `目前在「${page?.label || state.currentPage}」，第 ${state.pageIndex + 1} / ${PAGE_MAP.length} 頁。${page?.summary || ''}`;
}

function describeAction(action, state) {
  if (action.action === 'unknown') return action.message || '我沒有找到可執行操作。';
  if (action.action === 'getCurrentProgress') return buildProgressReply(state);
  if (action.action === 'setBackground') return action.color ? `準備把背景改成 ${action.color}。` : `準備套用 ${action.preset} 背景。`;
  if (action.action === 'setTheme') return `準備切換成${getThemeLabel(action.theme)}風格。`;
  if (action.action === 'setFontFamily') return `準備把字體切換為「${FONT_FAMILY_LABELS[action.family] || action.family}」。`;
  if (action.action === 'goToPage') return `準備切到「${getPageById(action.target)?.label || action.target}」。`;
  return '已轉成可執行的網站控制 action。';
}

function getThemeLabel(theme) {
  return {
    future: '未來',
    cat: '溫暖',
    metal: '金屬'
  }[theme] || theme;
}

function describeActionSequence(actions, state) {
  if (!Array.isArray(actions) || actions.length === 0) return '我沒有找到可執行操作。';
  if (actions.length === 1) return describeAction(actions[0], state);
  const summaries = actions.map((action) => describeAction(action, state)).filter(Boolean);
  return `已整理 ${actions.length} 個操作：${summaries.join(' ')}`;
}

function withReply(action, reply) {
  return { action, reply };
}

function normalizeActionList(rawAction) {
  if (!rawAction) return [];
  if (Array.isArray(rawAction)) return rawAction;
  if (rawAction.actions && Array.isArray(rawAction.actions)) return rawAction.actions;
  if (typeof rawAction === 'object' && !rawAction.action) {
    const compound = splitCompoundActions(rawAction);
    if (compound.length) return compound;
  }
  return [rawAction];
}

function splitCompoundActions(rawAction) {
  const actions = [];
  if (!rawAction || typeof rawAction !== 'object') return actions;

  if (rawAction.goToPage || rawAction.page || rawAction.target) {
    actions.push({ action: 'goToPage', target: rawAction.goToPage || rawAction.page || rawAction.target });
  }
  if (rawAction.nextPage) actions.push({ action: 'nextPage' });
  if (rawAction.previousPage) actions.push({ action: 'previousPage' });
  if (rawAction.getCurrentProgress) actions.push({ action: 'getCurrentProgress' });
  if (rawAction.generatePpt) actions.push({ action: 'generatePpt' });
  if (rawAction.downloadPpt) actions.push({ action: 'downloadPpt' });
  if (rawAction.resetSettings) actions.push({ action: 'resetSettings' });
  if (rawAction.setTheme || rawAction.theme) actions.push({ action: 'setTheme', theme: rawAction.setTheme || rawAction.theme });
  if (rawAction.setFontSize || rawAction.fontSize) actions.push({ action: 'setFontSize', size: rawAction.setFontSize || rawAction.fontSize });
  if (rawAction.setFontFamily || rawAction.fontFamily) actions.push({ action: 'setFontFamily', family: rawAction.setFontFamily || rawAction.fontFamily });
  if (rawAction.setBackground || rawAction.background || rawAction.color) {
    actions.push({ action: 'setBackground', value: rawAction.setBackground || rawAction.background || rawAction.color });
  }
  if (rawAction.setTextColor || rawAction.textColor || rawAction.fontColor) {
    actions.push({ action: 'setTextColor', color: rawAction.setTextColor || rawAction.textColor || rawAction.fontColor });
  }
  if (rawAction.setShapeMode || rawAction.shapeMode) {
    actions.push({ action: 'setShapeMode', mode: rawAction.setShapeMode || rawAction.shapeMode });
  }
  if (rawAction.setMarquee || rawAction.setMarqueeText || rawAction.marquee) {
    actions.push({ action: 'setMarquee', text: rawAction.setMarquee || rawAction.setMarqueeText || rawAction.marquee });
  }
  if (rawAction.setPresentationMode || rawAction.presentationMode) {
    actions.push({ action: 'setPresentationMode', mode: rawAction.setPresentationMode || rawAction.presentationMode });
  }

  return actions;
}
