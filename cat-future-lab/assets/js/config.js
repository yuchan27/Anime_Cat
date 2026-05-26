export const PAGE_MAP = [
  {
    id: 'home',
    domId: 'hero',
    label: '首頁',
    navLabel: '首頁',
    summary: '網站入口與主視覺，說明城市訊號觀測台的核心概念。'
  },
  {
    id: 'intro',
    domId: 'scene',
    label: '介紹',
    navLabel: '介紹',
    summary: '3D 城市場域，用粒子、幾何與光照說明城市訊號流動。'
  },
  {
    id: 'features',
    domId: 'stories',
    label: '特色',
    navLabel: '特色',
    summary: '使用情境與產品特色，呈現平台如何被當作城市資料導覽產品使用。'
  },
  {
    id: 'tech',
    domId: 'modules',
    label: '技術',
    navLabel: '技術',
    summary: '平台引擎與模組分工，說明動畫、3D、資料層、可用性與影像素材。'
  },
  {
    id: 'gallery',
    domId: 'gallery',
    label: '展示',
    navLabel: '展示',
    summary: '動畫風格貓咪圖像與城市觀測素材展示。'
  },
  {
    id: 'about',
    domId: 'remotion',
    label: '關於',
    navLabel: '關於',
    summary: '動態影像素材區，說明 Remotion 影片如何補足網站節奏。'
  },
  {
    id: 'contact',
    domId: 'assistant',
    label: '控制',
    navLabel: '控制',
    summary: '智慧導覽員、城市資料與 Open-Meteo 即時狀態。'
  },
  {
    id: 'presentation',
    domId: 'notes',
    label: '簡報',
    navLabel: '簡報',
    summary: '最後的網頁化技術簡報與 PPT 下載入口。'
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
    bgMain: '#0b1020',
    bgPanel: 'rgba(255,255,255,0.08)',
    textMain: '#ffffff',
    textMuted: 'rgba(255,255,255,0.7)',
    accentMain: '#5eead4',
    accentSecondary: '#8b5cf6',
    borderSubtle: 'rgba(255,255,255,0.14)',
    ink: '#dffaff',
    paper: '#0b1020',
    moss: '#b8ff63',
    cyan: '#55f4ff',
    coral: '#ff6b9b',
    violet: '#8d7cff',
    clay: '#ff9f7a',
    line: 'rgba(85,244,255,0.18)',
    lineStrong: 'rgba(223,250,255,0.74)'
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
    label: '俐落直角',
    surfaceRadius: '4px',
    controlRadius: '2px',
    shapeShadow: '12px 12px 0 var(--ink)',
    panelBlur: '0px'
  },
  soft: {
    label: '柔和方塊',
    surfaceRadius: '12px',
    controlRadius: '10px',
    shapeShadow: '0 18px 50px rgba(17, 19, 31, 0.14)',
    panelBlur: '0px'
  },
  round: {
    label: '圓角卡片',
    surfaceRadius: '22px',
    controlRadius: '999px',
    shapeShadow: '0 20px 60px rgba(17, 19, 31, 0.16)',
    panelBlur: '0px'
  },
  glass: {
    label: '玻璃質感',
    surfaceRadius: '18px',
    controlRadius: '14px',
    shapeShadow: '0 22px 70px rgba(17, 19, 31, 0.16)',
    panelBlur: '16px'
  },
  solid: {
    label: '實心板塊',
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

export const COLOR_WORD_MAP = {
  白: '#ffffff',
  白色: '#ffffff',
  黑: '#050505',
  黑色: '#050505',
  粉紅: '#ffd6e8',
  粉紅色: '#ffd6e8',
  奶油: '#fff8ed',
  奶油色: '#fff8ed',
  米色: '#fff8ed',
  藍: '#eff6ff',
  藍色: '#eff6ff',
  深藍: '#111827',
  紫: '#f7f2ff',
  紫色: '#f7f2ff',
  綠: '#e8fff7',
  綠色: '#e8fff7',
  黃: '#fff8d6',
  黃色: '#fff8d6',
  橘: '#fff1df',
  橘色: '#fff1df',
  紅: '#fff0ed',
  紅色: '#fff0ed',
  灰: '#f4f4f5',
  灰色: '#f4f4f5'
};

export const SECTION_EXPLAINERS = {
  home: '首頁用語意化 hero 區塊、Anime.js 入場節奏、主視覺圖片與輕量 SVG 訊號組成，負責建立網站定位與第一個操作入口。',
  intro: '3D 場域由 assets/js/scene.js 管理，使用 Three.js 建立 renderer、camera、幾何核心、粒子軌道與三種模式按鈕，並保留文字摘要避免資訊只存在 Canvas。',
  features: '特色區保留既有產品敘事卡片，透過 data-reveal 與一致的卡片樣式呈現平台使用情境，不把貓咪元素放大成整站主題。',
  tech: '技術區把 Anime.js、Three.js、資料層、可用性與 Remotion 拆成卡片，對應模組化檔案，讓每個功能責任清楚。',
  gallery: '圖庫區由 assets/js/ui.js 的 initImageGallery 控制，點擊卡片會切換圖片、說明文字與 active 狀態。',
  about: '影像素材區使用 video + poster，Remotion 只作為素材來源；就算 mp4 沒載入，仍有 poster 與文字摘要可讀。',
  contact: '控制區包含智慧導覽員與城市天氣。導覽員走安全 Action Router；天氣區走 /api/weather 並顯示城市時間、溫度、風速與來源。',
  presentation: '簡報頁由 assets/js/notes.js 管理左右滑動、縮放與 PPT lazy load 下載，內容以網頁簡報形式保留在最後一頁。',
  background: '背景控制由 AI Action Router 更新 AppState，再套用 CSS variables；背景色或 preset 只改表層背景，不會切換 theme。',
  theme: '主題控制使用 THEME_TOKEN_MAP 管理 future/cat 的視覺語言，背景 preset 與自訂色碼是另一層，因此不會破壞原本選定主題。',
  font: '字體大小使用 FONT_SCALE_MAP 更新 --font-scale，標題、內文、按鈕和導覽文字都按照比例縮放，而不是全部變同一個大小。',
  marquee: '跑馬燈使用 CSS animation 顯示目前提示文字；智慧導覽員可以透過 setMarquee action 更新內容。',
  wheel: '輪軸式導覽由同一份 PAGE_MAP 產生，點擊節點會走 Action Router 切頁，因此和按鈕、鍵盤、滑動、智慧導覽員保持同步。',
  progress: '底部進度線根據 PAGE_MAP 的 pageIndex 計算 scaleX，不顯示百分比，到最後一頁會填滿。'
};
