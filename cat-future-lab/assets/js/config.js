export const PAGE_MAP = [
  {
    id: 'home',
    domId: 'hero',
    label: '首頁',
    navLabel: '首頁',
    summary: '城市訊號觀測台的入口，介紹平台理念與主要探索路徑。'
  },
  {
    id: 'intro',
    domId: 'scene',
    label: '介紹',
    navLabel: '介紹',
    summary: '以 Three.js 建立 3D 訊號場域，讓城市資料有可操作的視覺入口。'
  },
  {
    id: 'features',
    domId: 'stories',
    label: '特色',
    navLabel: '特色',
    summary: '整理平台使用情境：觀測流程、輕量導覽與一致的互動語言。'
  },
  {
    id: 'tech',
    domId: 'modules',
    label: '技術',
    navLabel: '技術',
    summary: '說明動畫、3D、API、可近用與素材層如何以模組方式協作。'
  },
  {
    id: 'gallery',
    domId: 'gallery',
    label: '展示',
    navLabel: '展示',
    summary: '展示動畫風格貓咪視覺與城市觀測情境，貓咪只作為輔助角色。'
  },
  {
    id: 'about',
    domId: 'remotion',
    label: '影像',
    navLabel: '影像',
    summary: '以 Remotion 影片素材補足網站節奏，並保留 poster 與文字替代。'
  },
  {
    id: 'contact',
    domId: 'assistant',
    label: '控制',
    navLabel: '控制',
    summary: '快速導覽可控制頁面、背景、字體、形狀與跑馬燈，也能回答實作問題。'
  },
  {
    id: 'presentation',
    domId: 'notes',
    label: '簡報',
    navLabel: '簡報',
    summary: '最後一頁是網頁化網站筆記，可左右切換並下載摘要或 PPT。'
  }
];

export const PAGE_ID_ALIASES = {
  hero: 'home',
  scene: 'intro',
  modules: 'tech',
  stories: 'features',
  remotion: 'about',
  assistant: 'contact',
  notes: 'presentation'
};

export const THEME_TOKEN_MAP = {
  future: {
    bgMain: '#130f1f',
    bgPanel: 'rgba(255,255,255,0.08)',
    textMain: '#fff3dc',
    textMuted: 'rgba(255,243,220,0.72)',
    accentMain: '#d7c27a',
    accentSecondary: '#9c7bbd',
    borderSubtle: 'rgba(255,255,255,0.14)',
    ink: '#fff3dc',
    paper: '#130f1f',
    moss: '#d7c27a',
    cyan: '#89d7c0',
    coral: '#e7838f',
    violet: '#9c7bbd',
    clay: '#c28f62',
    line: 'rgba(215,194,122,0.18)',
    lineStrong: 'rgba(255,243,220,0.72)'
  },
  cat: {
    bgMain: '#fff7fb',
    bgPanel: 'rgba(255,255,255,0.82)',
    textMain: '#3f2a35',
    textMuted: 'rgba(63,42,53,0.68)',
    accentMain: '#ff8ec7',
    accentSecondary: '#ffd166',
    borderSubtle: 'rgba(63,42,53,0.12)',
    ink: '#3f2a35',
    paper: '#fff7fb',
    moss: '#ffd166',
    cyan: '#ff8ec7',
    coral: '#f36f52',
    violet: '#8b5cf6',
    clay: '#8e5b44',
    line: 'rgba(63,42,53,0.14)',
    lineStrong: 'rgba(63,42,53,0.62)'
  }
};

export const BACKGROUND_PRESET_MAP = {
  default: {
    bgMain: 'var(--theme-bg-main)',
    overlay: 'none'
  },
  dark: {
    bgMain: '#050505',
    overlay: 'rgba(0,0,0,0.18)'
  },
  light: {
    bgMain: '#ffffff',
    overlay: 'rgba(255,255,255,0.12)'
  },
  soft: {
    bgMain: '#f7f2ff',
    overlay: 'radial-gradient(circle at top, rgba(139,92,246,0.12), transparent 42%)'
  },
  neon: {
    bgMain: '#0b1020',
    overlay: 'radial-gradient(circle at top, rgba(94,234,212,0.16), transparent 42%)'
  },
  pastel: {
    bgMain: '#fff7fb',
    overlay: 'radial-gradient(circle at top, rgba(255,142,199,0.18), transparent 42%)'
  },
  warm: {
    bgMain: '#fff8ed',
    overlay: 'radial-gradient(circle at top, rgba(255,209,102,0.18), transparent 42%)'
  },
  cool: {
    bgMain: '#eff6ff',
    overlay: 'radial-gradient(circle at top, rgba(37,99,235,0.13), transparent 42%)'
  },
  minimal: {
    bgMain: '#fafafa',
    overlay: 'none'
  },
  lab: {
    bgMain: '#0b1020',
    overlay: 'linear-gradient(135deg, rgba(94,234,212,0.12), rgba(139,92,246,0.12))'
  },
  catRoom: {
    bgMain: '#fff7fb',
    overlay: 'linear-gradient(135deg, rgba(255,209,102,0.18), rgba(255,142,199,0.18))'
  }
};

export const SHAPE_MODE_MAP = {
  sharp: {
    label: '俐落方角',
    surfaceRadius: '4px',
    controlRadius: '2px',
    shapeShadow: '12px 12px 0 var(--ink)',
    panelBlur: '0px'
  },
  soft: {
    label: '柔和圓角',
    surfaceRadius: '12px',
    controlRadius: '10px',
    shapeShadow: '0 18px 50px rgba(17, 19, 31, 0.14)',
    panelBlur: '0px'
  },
  round: {
    label: '膠囊圓角',
    surfaceRadius: '22px',
    controlRadius: '999px',
    shapeShadow: '0 20px 60px rgba(17, 19, 31, 0.16)',
    panelBlur: '0px'
  },
  glass: {
    label: '玻璃面板',
    surfaceRadius: '18px',
    controlRadius: '14px',
    shapeShadow: '0 22px 70px rgba(17, 19, 31, 0.16)',
    panelBlur: '16px'
  },
  solid: {
    label: '實心卡片',
    surfaceRadius: '6px',
    controlRadius: '4px',
    shapeShadow: '6px 6px 0 var(--ink)',
    panelBlur: '0px'
  }
};

export const SHAPE_MODE_LABELS = Object.fromEntries(
  Object.entries(SHAPE_MODE_MAP).map(([key, value]) => [key, value.label])
);

export const FONT_SCALE_MAP = {
  xl: 1.25,
  lg: 1.12,
  md: 1,
  sm: 0.88
};

export const FONT_SIZE_LABELS = {
  xl: '特大',
  lg: '大',
  md: '中',
  sm: '小'
};

export const FONT_FAMILY_MAP = {
  default: '"Chivo", "Noto Sans TC", sans-serif',
  jhenghei: '"Microsoft JhengHei", "Noto Sans TC", sans-serif',
  noto: '"Noto Sans TC", "Chivo", sans-serif',
  system: 'system-ui, "Segoe UI", "Noto Sans TC", sans-serif',
  serif: '"Noto Serif TC", "PMingLiU", serif',
  mono: '"JetBrains Mono", "Cascadia Mono", "Noto Sans TC", monospace'
};

export const FONT_FAMILY_LABELS = {
  default: '預設',
  jhenghei: '微軟正黑體',
  noto: '思源黑體',
  system: '系統字體',
  serif: '襯線字體',
  mono: '等寬字體'
};

export const COLOR_WORD_MAP = {
  白色: '#ffffff',
  白: '#ffffff',
  黑色: '#050505',
  黑: '#050505',
  粉紅: '#ffd6e8',
  粉色: '#ffd6e8',
  粉: '#ffd6e8',
  奶油: '#fff8ed',
  米色: '#fff8ed',
  暖色: '#fff8ed',
  冷色: '#eff6ff',
  藍色: '#eff6ff',
  深色: '#111827',
  紫色: '#f7f2ff',
  綠色: '#e8fff7',
  黃色: '#fff8d6',
  金色: '#c9a646',
  特殊金色: '#b88a2a',
  香檳金: '#d7c27a',
  橘色: '#fff1df',
  紅色: '#fff0ed',
  灰色: '#f4f4f5'
};

export const SECTION_EXPLAINERS = {
  home: '首頁用語意化 hero 組成，主視覺與 CTA 都由同一份 PageMap 控制；進場節奏交給 animations.js，頁面切換交給 experience.js。',
  intro: '3D 場域在 scene.js 內建立 Three.js renderer、camera、幾何核心與粒子軌道，模式按鈕只改場景狀態，不直接重建整個 canvas。',
  features: '特色頁把使用情境拆成 story cards，讓平台像城市訊號產品，而不是單純貓咪主題頁。',
  tech: '技術頁將 Anime.js、Three.js、GSAP、API、可近用與 Remotion 分成六張卡片；目前卡片只做漸入，不再持續浮動。',
  gallery: '展示頁用本機動畫風格圖片作為素材，點選卡片只更新圖片、說明與 active 狀態，不會切換頁面或跳到頂端。',
  about: '影像頁播放 Remotion 輸出的 mp4；如果影片無法播放，poster 與文字摘要仍保留完整資訊。',
  contact: '控制頁包含快速導覽與城市天氣。導覽員會先嘗試理解自然語言，再正規化為安全 JSON Action，由 Action Router 更新 AppState。',
  presentation: '簡報頁是最後一個 SPA panel，notes.js 負責左右切換與自適應版面；PPT 下載以 lazy import 載入 pptxgenjs。',
  background: '背景控制走 setBackground action，只改背景色或 preset，不改使用者一開始選的「未來」或「溫暖」主題。',
  theme: '主題控制走 THEME_TOKEN_MAP。未來主題偏高級科技產品，溫暖主題保留柔和貓咪元素；背景色變更不等於切主題。',
  font: '字體大小走 FONT_SCALE_MAP 與 --font-scale，字體家族走 FONT_FAMILY_MAP；標題、內文、按鈕會按比例縮放，不會全部變同一個大小。',
  shape: '形狀控制會把自然語言轉成 sharp、soft、round、glass、solid 等預設視覺模式，透過 CSS variables 改圓角、陰影與面板質感。',
  marquee: '跑馬燈用 CSS animation 呈現，導覽員可透過 setMarquee 修改文字；低效能模式會放慢或降級動畫。',
  wheel: '右側輪軸導覽讀同一份 PAGE_MAP，點擊節點會走 Action Router，因此會同步頁面、進度線與 active nav。',
  progress: '底部進度線根據 pageIndex / totalPages 計算，不看垂直捲動；最後一頁會完整填滿。'
};
