import {
  BACKGROUND_PRESET_MAP,
  FONT_FAMILY_LABELS,
  FONT_SIZE_LABELS,
  PAGE_ID_ALIASES,
  PAGE_MAP,
  SHAPE_MODE_LABELS
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

const PAGE_ALIASES = {
  home: ['home', 'hero', '首頁', '主頁', '封面'],
  intro: ['intro', '介紹', '場域', '3d', '3D', '模型'],
  features: ['features', '特色', '功能', '亮點'],
  tech: ['tech', '技術', '技術頁', '實作', '架構', 'three', 'gsap', 'anime'],
  gallery: ['gallery', '展示', '作品', '圖片'],
  about: ['about', '關於', '影像', '影像頁', '影片', 'remotion'],
  contact: ['contact', '控制', '導覽', 'ai', 'api', '快速導覽'],
  presentation: ['presentation', '簡報', '報告', 'ppt', 'notes', '筆記', '最後']
};

const COLOR_ALIASES = {
  白色: '#ffffff',
  白: '#ffffff',
  黑色: '#050505',
  黑: '#050505',
  粉紅: '#ffd6e8',
  粉紅色: '#ffd6e8',
  粉色: '#ffd6e8',
  奶油: '#fff8ed',
  奶油色: '#fff8ed',
  米色: '#fff8ed',
  冷色: '#eff6ff',
  冷色系: '#eff6ff',
  藍色: '#dbeafe',
  深海藍: '#0f2747',
  綠色: '#d8f3dc',
  紫色: '#efe7ff',
  金色: '#d4af37',
  特殊金色: '#d4af37',
  香檳金: '#d7c27a',
  銀色: '#d8dde6',
  金屬色: '#8f98a8',
  深色: '#111827',
  深色系: '#111827',
  gold: '#d4af37',
  champagne: '#d7c27a',
  silver: '#d8dde6',
  steel: '#8f98a8',
  white: '#ffffff',
  black: '#050505',
  pink: '#ffd6e8',
  cream: '#fff8ed',
  blue: '#dbeafe',
  purple: '#efe7ff'
};

const PAGE_WORDS = Object.entries(PAGE_ALIASES);
const SECRET_PATTERNS = [/api\s*key/i, /google\s*ai\s*key/i, /AIza[0-9A-Za-z_-]{20,}/, /secret/i, /token/i, /密鑰/, /金鑰/];

export function coerceAIAction(rawAction, message = '') {
  const action = normalizeActionShape(rawAction);
  const text = String(message || '');

  if (isSecretRequest(text)) {
    return { action: 'unknown', message: '我不能顯示或處理 API key、token 或其他秘密資訊。' };
  }

  if (!action.action || action.action === 'unknown') {
    return inferActionFromText(text);
  }

  switch (action.action) {
    case 'goToPage': {
      const target = normalizePageId(action.target || action.page || action.value);
      return target
        ? { action: 'goToPage', target }
        : (text ? inferActionFromText(text) : { action: 'unknown', message: '頁面 action 缺少合法 target，因此沒有切換頁面。' });
    }
    case 'setTheme': {
      const theme = normalizeTheme(action.theme || action.value);
      return theme ? { action: 'setTheme', theme } : inferActionFromText(text);
    }
    case 'setFontSize': {
      const size = normalizeFontSize(action.size || action.value);
      return size ? { action: 'setFontSize', size } : inferActionFromText(text);
    }
    case 'setFontFamily': {
      const family = normalizeFontFamily(action.family || action.fontFamily || action.value);
      return family ? { action: 'setFontFamily', family } : inferActionFromText(text);
    }
    case 'setBackground': {
      const color = normalizeHexColor(action.color || action.value) || inferColorFromText(text);
      if (color) return { action: 'setBackground', color };
      const preset = normalizeBackgroundPreset(action.preset || action.value || text);
      return preset ? { action: 'setBackground', preset } : { action: 'unknown', message: '請提供合法色碼或清楚的背景顏色，例如 #ffffff、白色、深色系。' };
    }
    case 'setTextColor': {
      const color = normalizeHexColor(action.color || action.value) || inferColorFromText(text);
      return color ? { action: 'setTextColor', color } : { action: 'unknown', message: '請提供合法文字色碼或常見顏色，例如 黑色、白色、#111827。' };
    }
    case 'setShapeMode': {
      const mode = normalizeShapeMode(action.mode || action.value || text);
      return mode ? { action: 'setShapeMode', mode } : { action: 'unknown', message: '形狀只能改成直角、柔和、圓角、毛玻璃或實心。' };
    }
    case 'setMarquee':
    case 'setMarqueeText': {
      const value = String(action.text || action.value || inferMarquee(text) || '').trim();
      return value ? { action: 'setMarquee', text: value.slice(0, 120) } : { action: 'unknown', message: '請告訴我要顯示在跑馬燈上的文字。' };
    }
    case 'setPresentationMode':
      return { action: 'setPresentationMode', mode: action.mode === 'ppt' ? 'ppt' : 'web' };
    default:
      return action;
  }
}

export function coerceAIActionList(rawAction, message = '') {
  return normalizeActionList(rawAction).map((item) => coerceAIAction(item, message));
}

export function parseNavigatorCommand(message, state = getState()) {
  const actions = inferActionsFromText(message, state);
  return actions.length === 1
    ? { action: actions[0], actions, reply: describeAction(actions[0], state) }
    : { actions, reply: describeActionSequence(actions, state) };
}

export function validateAIAction(rawAction) {
  const action = coerceAIAction(rawAction);
  if (!action || typeof action !== 'object') return { ok: false, reason: 'Action 必須是物件。' };

  switch (action.action) {
    case 'goToPage':
      return isKnownPage(action.target) ? { ok: true } : { ok: false, reason: '未知頁面。' };
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
      return isKnownFontFamily(action.family) ? { ok: true } : { ok: false, reason: '未知字體。' };
    case 'setBackground':
      if (action.color) return normalizeHexColor(action.color) ? { ok: true } : { ok: false, reason: '背景色必須是合法 hex。' };
      if (action.preset) return isKnownBackgroundPreset(action.preset) ? { ok: true } : { ok: false, reason: '未知背景 preset。' };
      return { ok: false, reason: '背景 action 需要 color 或 preset。' };
    case 'setTextColor':
      return normalizeHexColor(action.color) ? { ok: true } : { ok: false, reason: '文字色必須是合法 hex。' };
    case 'setShapeMode':
      return isKnownShapeMode(action.mode) ? { ok: true } : { ok: false, reason: '未知形狀模式。' };
    case 'setMarquee':
      return typeof action.text === 'string' && action.text.trim() ? { ok: true } : { ok: false, reason: '跑馬燈文字不可為空。' };
    case 'setPresentationMode':
      return action.mode === 'web' || action.mode === 'ppt' ? { ok: true } : { ok: false, reason: '未知簡報模式。' };
    default:
      return { ok: false, reason: `不支援的 action：${action.action}` };
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

export function inferActionsFromText(message, state = getState()) {
  const text = String(message || '').trim();
  if (!text) return [{ action: 'unknown', message: '請輸入想控制或想詢問的內容。' }];
  if (isSecretRequest(text)) return [{ action: 'unknown', message: '我不能顯示或處理 API key、token 或其他秘密資訊。' }];

  const actions = [];
  const push = (action) => {
    if (!action || !action.action) return;
    if (actions.some((item) => item.action === action.action)) return;
    actions.push(action);
  };

  const explanation = inferExplanation(text);
  if (explanation) return [{ action: 'unknown', message: explanation }];

  const directPage = inferDirectPageCommand(text);
  if (directPage) push({ action: 'goToPage', target: directPage });
  else if (/下一頁|下頁|往右|next/i.test(text)) push({ action: 'nextPage' });
  else if (/上一頁|上頁|往左|previous|prev/i.test(text)) push({ action: 'previousPage' });
  else if (/進度|目前到哪/i.test(text)) push({ action: 'getCurrentProgress' });
  else {
    const page = inferPage(text);
    if (page) push({ action: 'goToPage', target: page });
  }

  const marquee = inferMarquee(text);
  if (marquee) push({ action: 'setMarquee', text: marquee });

  const theme = normalizeTheme(text);
  if (/(主題|風格|切換|換成|改成|變成)/.test(text) && theme) push({ action: 'setTheme', theme });

  const textColorIntent = /(文字|字|標題).*(顏色|色)|字.*(黑|白|金|銀|#)|字.*改成.*(黑|白|金|銀)|文字.*#/.test(text);
  if (/(字體|文字|字級|字變|字小|字大|font|typeface)/i.test(text) || textColorIntent) {
    const color = textColorIntent ? inferColorFromText(text) : null;
    if (color) push({ action: 'setTextColor', color });
    const size = normalizeFontSize(text);
    if (size) push({ action: 'setFontSize', size });
    const family = normalizeFontFamily(text);
    if (family) push({ action: 'setFontFamily', family });
  }

  if (/(外框|邊框|框框|卡片|方塊|形狀|正方形|方形|直角|圓角|圓一點|變圓|柔和|毛玻璃|玻璃|實心|shape|round|rounded|sharp|square|glass|solid)/i.test(text)) {
    const mode = normalizeShapeMode(text);
    if (mode) push({ action: 'setShapeMode', mode });
  }

  const hasBackgroundIntent = /(背景|底色|頁面顏色|背景色|background|bg)/i.test(text);
  const hasGenericColorIntent = /(顏色|色|color|#[0-9a-fA-F]{6})/.test(text);
  const hasTextColorIntent = /(文字|字|標題).*(顏色|色)|字.*(黑|白|金|銀|#)|文字.*#/.test(text);
  if (hasBackgroundIntent || (hasGenericColorIntent && !hasTextColorIntent)) {
    const color = inferColorFromText(text);
    if (color) push({ action: 'setBackground', color });
    else {
      const preset = normalizeBackgroundPreset(text);
      if (preset) push({ action: 'setBackground', preset });
    }
  }

  if (/下載.*ppt|ppt.*下載/i.test(text)) push({ action: 'downloadPpt' });
  if (/產生.*ppt|生成.*ppt/i.test(text)) push({ action: 'generatePpt' });
  if (/網頁簡報|web.*presentation/i.test(text)) push({ action: 'setPresentationMode', mode: 'web' });
  if (/重設|還原|reset/i.test(text)) push({ action: 'resetSettings' });

  return actions.length ? actions : [{ action: 'unknown', message: `我理解你的訊息是「${text}」，但沒有足夠資訊產生安全 action，因此先不改畫面。` }];
}

function executeAction(action, options = {}) {
  const validation = validateAIAction(action);
  if (!validation.ok) return { ok: false, reply: `這個 action 沒有執行：${validation.reason}` };

  const shouldPersist = options.persist === true;
  const state = getState();

  switch (action.action) {
    case 'goToPage':
      updateState({ currentPage: action.target }, { persist: shouldPersist });
      return { ok: true, reply: `已切到「${getPageById(action.target)?.label || action.target}」。` };
    case 'nextPage': {
      const page = PAGE_MAP[Math.min(PAGE_MAP.length - 1, state.pageIndex + 1)];
      updateState({ currentPage: page.id }, { persist: shouldPersist });
      return { ok: true, reply: `已切到「${page.label}」。` };
    }
    case 'previousPage': {
      const page = PAGE_MAP[Math.max(0, state.pageIndex - 1)];
      updateState({ currentPage: page.id }, { persist: shouldPersist });
      return { ok: true, reply: `已切到「${page.label}」。` };
    }
    case 'getCurrentProgress':
      return { ok: true, reply: buildProgressReply(state) };
    case 'setTheme':
      updateState({ theme: action.theme }, { persist: shouldPersist });
      return { ok: true, reply: `已切換成「${getThemeLabel(action.theme)}」風格。` };
    case 'setFontSize':
      updateState({ fontSize: action.size }, { persist: shouldPersist });
      return { ok: true, reply: `字體大小已改成「${FONT_SIZE_LABELS[action.size] || action.size}」。` };
    case 'setFontFamily':
      updateState({ fontFamily: action.family }, { persist: shouldPersist });
      return { ok: true, reply: `字體已改成「${FONT_FAMILY_LABELS[action.family] || action.family}」。` };
    case 'setBackground': {
      const color = action.color ? normalizeHexColor(action.color) : undefined;
      updateState({
        backgroundPreset: action.preset || (color ? 'default' : state.backgroundPreset),
        customBackgroundColor: color,
        customTextColor: color ? getReadableTextColor(color) : state.customTextColor
      }, { persist: shouldPersist });
      return {
        ok: true,
        reply: color
          ? `背景已改成 ${color}，並保留目前主題。`
          : `背景已套用「${action.preset}」設定，並保留目前主題。`
      };
    }
    case 'setTextColor':
      updateState({ customTextColor: normalizeHexColor(action.color) }, { persist: shouldPersist });
      return { ok: true, reply: `文字顏色已改成 ${normalizeHexColor(action.color)}。` };
    case 'setShapeMode':
      updateState({ shapeMode: action.mode }, { persist: shouldPersist });
      return { ok: true, reply: `形狀已改成「${SHAPE_MODE_LABELS[action.mode] || getShapeLabel(action.mode)}」。` };
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
      return { ok: true, reply: '已切到簡報頁並準備 PPT。' };
    case 'resetSettings':
      resetState({
        preserveTheme: true,
        preservePage: true,
        clearPersisted: true,
        persist: false
      });
  return { ok: true, reply: '已清除儲存設定並還原預設，但保留目前風格。' };
    case 'unknown':
      return { ok: true, reply: action.message || '沒有足夠資訊產生安全 action，因此先不改畫面。' };
    default:
      return { ok: false, reply: `不支援的 action：${action.action}` };
  }
}

function normalizeActionShape(rawAction) {
  if (!rawAction || typeof rawAction !== 'object') return { action: 'unknown' };
  if (typeof rawAction.action === 'string') return { ...rawAction };

  const entries = Object.entries(rawAction);
  if (entries.length === 1) {
    const [key, value] = entries[0];
    if (['nextPage', 'previousPage', 'getCurrentProgress', 'generatePpt', 'downloadPpt', 'resetSettings'].includes(key)) return { action: key };
    if (['goToPage', 'page', 'target'].includes(key)) return { action: 'goToPage', target: value };
    if (key === 'setTheme') return { action: 'setTheme', theme: value };
    if (key === 'setFontSize') return { action: 'setFontSize', size: value };
    if (key === 'setFontFamily') return { action: 'setFontFamily', family: value };
    if (key === 'setBackground') return typeof value === 'string' ? { action: 'setBackground', value } : { action: 'setBackground', ...(value || {}) };
    if (key === 'setTextColor') return typeof value === 'string' ? { action: 'setTextColor', color: value } : { action: 'setTextColor', ...(value || {}) };
    if (key === 'setShapeMode') return { action: 'setShapeMode', mode: value };
    if (key === 'setMarquee' || key === 'setMarqueeText') return { action: 'setMarquee', text: value };
    if (key === 'setPresentationMode') return { action: 'setPresentationMode', mode: value };
  }

  if (rawAction.goToPage || rawAction.page || rawAction.target) return { action: 'goToPage', target: rawAction.goToPage || rawAction.page || rawAction.target };
  if (rawAction.setBackground || rawAction.background || rawAction.color) return { action: 'setBackground', value: rawAction.setBackground || rawAction.background || rawAction.color };
  if (rawAction.setTextColor || rawAction.textColor) return { action: 'setTextColor', color: rawAction.setTextColor || rawAction.textColor };
  if (rawAction.setShapeMode || rawAction.shapeMode) return { action: 'setShapeMode', mode: rawAction.setShapeMode || rawAction.shapeMode };
  if (rawAction.setFontSize || rawAction.fontSize) return { action: 'setFontSize', size: rawAction.setFontSize || rawAction.fontSize };
  if (rawAction.setFontFamily || rawAction.fontFamily) return { action: 'setFontFamily', family: rawAction.setFontFamily || rawAction.fontFamily };
  if (rawAction.setMarquee || rawAction.marquee) return { action: 'setMarquee', text: rawAction.setMarquee || rawAction.marquee };

  return { action: 'unknown' };
}

function normalizeActionList(rawAction) {
  if (Array.isArray(rawAction)) return rawAction;
  if (Array.isArray(rawAction?.actions)) return rawAction.actions;
  if (Array.isArray(rawAction?.action)) return rawAction.action;
  return [rawAction];
}

function inferActionFromText(message) {
  return inferActionsFromText(message)[0];
}

function normalizePageId(value) {
  const raw = String(value || '').trim();
  if (isKnownPage(raw)) return raw;
  const lower = raw.toLowerCase();
  if (PAGE_ID_ALIASES[lower]) return PAGE_ID_ALIASES[lower];
  return PAGE_WORDS.find(([, aliases]) => aliases.some((alias) => lower.includes(String(alias).toLowerCase())))?.[0] || null;
}

function inferDirectPageCommand(text) {
  if (/回首頁|回到首頁|回主頁/.test(text)) return 'home';
  if (/最後一頁|簡報頁|技術簡報|看簡報/.test(text)) return 'presentation';
  if (/技術頁|到技術|去技術/.test(text)) return 'tech';
  if (/展示頁|到展示|去展示/.test(text)) return 'gallery';
  if (/控制頁|快速導覽|AI控制|AI 控制/.test(text)) return 'contact';
  return null;
}

function inferPage(text) {
  return normalizePageId(text);
}

function normalizeTheme(value) {
  const text = String(value || '').trim().toLowerCase();
  if (isKnownTheme(text)) return text;
  if (/金屬|metal|metallic|steel|chrome/.test(text)) return 'metal';
  if (/未來|科技|future/.test(text)) return 'future';
  if (/溫暖|貓|貓咪|cat|warm/.test(text)) return 'cat';
  return null;
}

function normalizeFontSize(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownFontSize(text)) return text;
  if (/特大|最大|超大|xl/.test(text)) return 'xl';
  if (/放大|大一點|大字|大號|lg|large/.test(text)) return 'lg';
  if (/中等|正常|預設|md|medium/.test(text)) return 'md';
  if (/縮小|小一點|小字|sm|small/.test(text)) return 'sm';
  return null;
}

function normalizeFontFamily(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownFontFamily(text)) return text;
  if (/標楷|dfkai|kai/.test(text)) return 'kai';
  if (/明體|pmingliu|mingliu|serif/.test(text)) return 'serif';
  if (/微軟正黑|jhenghei|microsoft\s*jhenghei|msjh/.test(text)) return 'jhenghei';
  if (/noto/.test(text)) return 'noto';
  if (/系統|system|segoe/.test(text)) return 'system';
  if (/等寬|mono|code|monospace/.test(text)) return 'mono';
  if (/預設|default/.test(text)) return 'default';
  return null;
}

function normalizeShapeMode(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownShapeMode(text)) return text;
  if (/毛玻璃|玻璃|glass|frost/.test(text)) return 'glass';
  if (/圓角|圓一點|變圓|圓形|膠囊|round|rounded|pill/.test(text)) return 'round';
  if (/柔和|柔軟|soft/.test(text)) return 'soft';
  if (/正方形|方形|方塊|直角|銳利|外框.*方|邊框.*方|sharp|square/.test(text)) return 'sharp';
  if (/實心|不透明|solid/.test(text)) return 'solid';
  return null;
}

function normalizeBackgroundPreset(value) {
  const text = String(value || '').toLowerCase();
  if (isKnownBackgroundPreset(text)) return text;
  if (/深色|黑色|dark/.test(text)) return 'dark';
  if (/亮色|淺色|白色|light/.test(text)) return 'light';
  if (/柔和|soft/.test(text)) return 'soft';
  if (/霓虹|neon/.test(text)) return 'neon';
  if (/粉彩|pastel/.test(text)) return 'pastel';
  if (/溫暖|奶油|warm/.test(text)) return 'warm';
  if (/冷色|cool/.test(text)) return 'cool';
  if (/極簡|minimal/.test(text)) return 'minimal';
  if (/lab|實驗室/.test(text)) return 'lab';
  if (/貓房|catroom/.test(text)) return 'catRoom';
  return null;
}

function inferColorFromText(text) {
  const hex = String(text || '').match(/#?[0-9a-fA-F]{6}/)?.[0];
  if (hex) return normalizeHexColor(hex);
  const normalized = String(text || '').toLowerCase();
  for (const [word, color] of Object.entries(COLOR_ALIASES)) {
    if (normalized.includes(word.toLowerCase())) return color;
  }
  return null;
}

function inferMarquee(text) {
  const raw = String(text || '').trim();
  if (!/(跑馬燈|公告|marquee)/i.test(raw)) return null;
  const match = raw.match(/(?:跑馬燈|公告|marquee)(?:改成|顯示|寫成|變成|：|:)?\s*(.+)$/i);
  return match?.[1]?.trim().slice(0, 120) || null;
}

function inferExplanation(text) {
  if (!/(怎麼做|如何實作|怎麼實作|原理|說明)/.test(text)) return null;
  if (/跑馬燈/.test(text)) return '跑馬燈由 AppState 保存文字，畫面用 CSS animation 呈現；低效能模式會停用或放慢動畫，但文字仍保留。';
  if (/背景|顏色/.test(text)) return '背景控制會轉成 setBackground action，只更新背景色或 preset，不會改變目前選定的風格。';
  if (/形狀|外框|卡片/.test(text)) return '形狀控制只允許 sharp、soft、round、glass、solid 五種模式，透過 Action Router 更新 CSS variables，不執行任意 CSS。';
  if (/3d|場域|three/i.test(text)) return '3D 場域由 scene.js 延後載入 Three.js，只在相關頁面需要時啟動，低效能模式會降低粒子與像素比。';
  return '這個網站的控制都會先轉成安全 JSON action，再由 Action Router 更新狀態，不會直接執行 AI 產生的程式碼。';
}

function isSecretRequest(text) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(String(text || '')));
}

function describeAction(action, state = getState()) {
  switch (action.action) {
    case 'setBackground':
      return action.color ? `準備把背景改成 ${action.color}。` : `準備套用 ${action.preset} 背景。`;
    case 'setTextColor':
      return `準備把文字改成 ${action.color}。`;
    case 'setShapeMode':
      return `準備把形狀改成 ${getShapeLabel(action.mode)}。`;
    case 'setFontSize':
      return `準備把字體大小改成 ${FONT_SIZE_LABELS[action.size] || action.size}。`;
    case 'setTheme':
      return `準備切換到 ${getThemeLabel(action.theme)} 風格。`;
    case 'goToPage':
      return `準備切到 ${getPageById(action.target)?.label || action.target}。`;
    case 'nextPage':
      return '準備切到下一頁。';
    case 'previousPage':
      return '準備切到上一頁。';
    case 'setMarquee':
      return '準備更新跑馬燈。';
    case 'unknown':
      return action.message || '沒有足夠資訊產生安全 action。';
    default:
      return buildProgressReply(state);
  }
}

function describeActionSequence(actions, state) {
  return actions.map((action) => describeAction(action, state)).join(' ');
}

function buildProgressReply(state) {
  const page = PAGE_MAP[state.pageIndex] || PAGE_MAP[0];
  return `目前在「${page?.label || state.currentPage}」，第 ${state.pageIndex + 1} / ${state.totalPages} 頁。`;
}

function getThemeLabel(theme) {
  return { future: '未來', cat: '溫暖', metal: '金屬' }[theme] || theme;
}

function getShapeLabel(mode) {
  return { sharp: '直角', soft: '柔和', round: '圓角', glass: '毛玻璃', solid: '實心' }[mode] || mode;
}
