# Project Agent Instructions

## 0. Agent Operating Rules

These instructions are for AI coding agents working on this repository. Follow them before making changes.

- This is an existing website extension task. Do **not** rebuild the whole site from scratch.
- Preserve existing content, existing behavior, and the current project structure whenever possible.
- Start with a plan before implementation.
- Inspect the current codebase before editing.
- Prefer small, reviewable changes over one large rewrite.
- Track all project updates with Git.
- Do not commit API keys, `.env`, dependency folders, generated renders, build outputs, or temporary QA artifacts.
- If a requirement conflicts with existing implementation details, preserve core functionality first, then document the conflict and proposed solution.

---

## 1. Safety Rules

- Do not bulk-delete files or folders.
- Never use `del /s`, `rd /s`, `rmdir /s`, `Remove-Item -Recurse`, or `rm -rf`.
- If deletion is required, delete only one explicit file path at a time.
- Example allowed deletion:

```powershell
Remove-Item "C:\path\to\file.txt"
```

- If batch deletion is needed, stop and ask the user to delete files manually.
- Do not modify original course PPT files or the week 12 template unless the user explicitly asks.
- Do not expose secrets in source code, client bundles, console logs, screenshots, generated docs, or chat transcripts that may be committed.

---

## 2. Project Workflow

- New project work starts from an implementation plan.
- First run:

```bash
git status --short
```

- Identify the existing framework and structure before changing code.
- Create or update `IMPLEMENTATION_PLAN.md` before large changes.
- Keep implementation modular and low-coupling.
- Prefer implementing a working minimal version first, then improve visuals.
- After each meaningful step, run the relevant checks available in the project.
- Do not add new packages unless they are clearly necessary.
- If a new dependency is required, explain why and prefer lazy loading for non-core features.

---

## 3. Workspace / C Drive Handoff

If OneDrive causes Git lock, file watching, or execution issues:

- Move/copy the working project to a plain `C:\` path.
- Recommended workspace:

```text
C:\Code\CatFutureLab
```

- Preserve these files/folders when relocating:

```text
.git/
cat-future-lab/
AGENTS.md
WORKFLOW.md
README.md
.gitignore
```

- Open the new window with:

```text
cwd=C:\Code\CatFutureLab
```

- Run the app from:

```text
C:\Code\CatFutureLab\cat-future-lab
```

- Start command:

```bash
npm start
```

- Keep API keys in:

```text
cat-future-lab\.env
```

based on `.env.example`.

---

## 4. Current Project Context

- Main deliverable: `cat-future-lab/`
- Existing project emphasis includes animation, Three.js, CSS animation, Intersection Observer, `requestAnimationFrame`, semantic HTML, SEO, and accessibility.
- Existing Remotion output is optional material only. The main website must remain usable without rendered Remotion output.
- Browser-side code should call local server routes. Secrets must stay in server environment variables.
- Figma reference file:

```text
https://www.figma.com/design/KHTxo4D1lTXtSteplkjcCp
```

### Updated Direction

The previous project direction emphasized a futuristic cat animation lab. The updated direction is now:

- Keep the existing website and course-related content.
- Extend it into a left/right switching SPA.
- The main feature is a smart website navigator that can control the page through safe actions.
- The visual design should be mature and modern, not a stereotypical AI/robot website.
- The site supports two initial visual themes: `future` and `cat`.
- Background/color changes must not destroy or replace the selected theme.

---

## 5. Core Product Goal

Build an extension layer on top of the existing website so users can control the site through natural language.

The smart navigator should understand commands like:

```text
下一頁
上一頁
回首頁
帶我去技術頁
字體放大一點
背景改成 #ffffff
改成柔和一點
跑馬燈改成歡迎來到我的網站
帶我去簡報頁
我要看技術簡報
```

The navigator must convert natural language into a validated JSON action, then the frontend Action Router executes the action.

### Required Control Flow

```text
Natural language input
-> AI / mock parser
-> JSON Action
-> Schema validation
-> AI Action Router
-> AppState update
-> UI updates from state
```

### Forbidden Control Flow

Never allow AI output to directly execute code.

Forbidden:

```text
eval()
new Function()
executing arbitrary JavaScript returned by AI
injecting AI-returned HTML via innerHTML as executable content
allowing AI to directly mutate DOM outside the Action Router
```

---

## 6. Visual Design Principle: De-AI the Look, AI-Control the Function

The appearance should **not** look like a stereotypical AI robot interface.

Avoid:

- giant robot mascots
- full-screen AI labels
- excessive cyberpunk HUD styling
- overdone neon effects
- game-like sci-fi control panels
- cluttered emoji-heavy cat visuals

Aim for a polished modern website feeling inspired by the design quality of:

```text
Apple
Stripe
Linear
Vercel
Notion
Arc
Framer
```

Use these references only as design spirit, not literal copies.

Desired visual traits:

- clean
- mature
- premium
- spacious
- readable
- restrained motion
- modern typography
- clear hierarchy
- polished interactions
- strong performance

The AI/smart navigator should be visually subtle. It can be named:

```text
網站導覽員
智慧導覽
快速控制
Guide
Navigator
Assistant
```

It does not need a robot avatar.

---

## 7. Architecture: Left/Right SPA, Not Vertical Long Page

Do not convert the site into a traditional vertical scrolling landing page.

The site should be a left/right switching single-page app.

### Page Model

Use a page/panel model similar to:

```ts
type PageId =
  | "home"
  | "intro"
  | "features"
  | "tech"
  | "gallery"
  | "about"
  | "contact"
  | "presentation";
```

Suggested order:

```text
home -> intro -> features -> tech -> gallery -> about -> contact -> presentation
```

The final page is `presentation`, used for a web-based technical presentation and optionally PPT download.

### Navigation Methods

Support:

- left/right buttons
- keyboard arrow keys
- mobile swipe gestures
- wheel-style navigation
- smart navigator natural language commands

### Page Transition Requirements

Use light transitions:

```css
transform: translateX(...);
opacity: ...;
transition: ...;
```

Avoid heavy transitions:

- large 3D transforms
- canvas particle transitions
- heavy blur
- heavy shadow
- frame-by-frame JS animation

In reduced-performance mode, downgrade to simple fade or direct switching.

---

## 8. Theme System

Support two initial themes:

```ts
type Theme = "future" | "cat";
```

Important distinction:

```text
Theme = overall visual language.
Background/color = adjustable surface layer.
```

Changing the background must **not** automatically change the selected theme.

Example:

- User selects `cat` theme.
- User says: `背景改成 #ffffff`.
- The app remains in `cat` theme.
- Cat-style cards, buttons, progress line, wheel nav, and illustration language remain.
- Only background color/preset changes.

Same rule applies to `future` theme.

### Initial Theme Selection

On first load, show a theme selector with two buttons:

```text
未來科技發展
可愛動畫貓咪
```

After selection:

1. Play a short lightweight loading transition.
2. Enter the left/right SPA.
3. Apply the selected base theme.

### Future Theme Direction

Use a mature high-tech product website style:

- modern SaaS feeling
- clean future aesthetic
- refined gradients
- clean cards
- subtle lines
- restrained glow
- premium typography
- low-key data visuals

Avoid full robot/cyberpunk overload.

### Cat Theme Direction

Use a polished cute style:

- soft colors
- rounded cards
- subtle paw/cat accents
- light cat illustration or inline SVG
- yarn/fish/paw motifs only as subtle details
- clean layout

Avoid full-screen emoji clutter or childish game UI.

---

## 9. CSS Variables, Theme Tokens, and Background Presets

Use CSS root variables for theme, background, text, borders, motion, and font scale.

Do not hardcode colors across components.

### Base CSS Variables

```css
:root {
  --bg-main: #ffffff;
  --bg-panel: rgba(255, 255, 255, 0.82);
  --text-main: #111111;
  --text-muted: rgba(17, 17, 17, 0.68);

  --accent-main: #2563eb;
  --accent-secondary: #8b5cf6;
  --border-subtle: rgba(0, 0, 0, 0.1);

  --font-scale: 1;

  --transition-theme: 600ms;
  --transition-page: 360ms;
  --motion-scale: 1;
}
```

### Theme Token Map

```ts
const THEME_TOKEN_MAP = {
  future: {
    bgMain: "#0b1020",
    bgPanel: "rgba(255,255,255,0.08)",
    textMain: "#ffffff",
    textMuted: "rgba(255,255,255,0.7)",
    accentMain: "#5eead4",
    accentSecondary: "#8b5cf6",
    borderSubtle: "rgba(255,255,255,0.14)",
  },
  cat: {
    bgMain: "#fff7fb",
    bgPanel: "rgba(255,255,255,0.82)",
    textMain: "#3f2a35",
    textMuted: "rgba(63,42,53,0.68)",
    accentMain: "#ff8ec7",
    accentSecondary: "#ffd166",
    borderSubtle: "rgba(63,42,53,0.12)",
  },
};
```

### Background Preset Map

```ts
type BackgroundPreset =
  | "default"
  | "dark"
  | "light"
  | "soft"
  | "neon"
  | "pastel"
  | "warm"
  | "cool"
  | "minimal"
  | "lab"
  | "catRoom";

const BACKGROUND_PRESET_MAP = {
  default: {
    bgMain: "var(--theme-bg-main)",
    overlay: "none",
  },
  dark: {
    bgMain: "#050505",
    overlay: "rgba(0,0,0,0.18)",
  },
  light: {
    bgMain: "#ffffff",
    overlay: "rgba(255,255,255,0.12)",
  },
  soft: {
    bgMain: "#f7f2ff",
    overlay: "radial-gradient(circle at top, rgba(139,92,246,0.12), transparent 42%)",
  },
  neon: {
    bgMain: "#0b1020",
    overlay: "radial-gradient(circle at top, rgba(94,234,212,0.16), transparent 42%)",
  },
  pastel: {
    bgMain: "#fff7fb",
    overlay: "radial-gradient(circle at top, rgba(255,142,199,0.18), transparent 42%)",
  },
  warm: {
    bgMain: "#fff8ed",
    overlay: "radial-gradient(circle at top, rgba(255,209,102,0.18), transparent 42%)",
  },
  cool: {
    bgMain: "#eff6ff",
    overlay: "radial-gradient(circle at top, rgba(37,99,235,0.13), transparent 42%)",
  },
  minimal: {
    bgMain: "#fafafa",
    overlay: "none",
  },
  lab: {
    bgMain: "#0b1020",
    overlay: "linear-gradient(135deg, rgba(94,234,212,0.12), rgba(139,92,246,0.12))",
  },
  catRoom: {
    bgMain: "#fff7fb",
    overlay: "linear-gradient(135deg, rgba(255,209,102,0.18), rgba(255,142,199,0.18))",
  },
};
```

### Background Color Input

The smart navigator must support user-provided hex colors:

```text
#ffffff
ffffff
#000000
000000
#ffccdd
```

Implementation rules:

- Validate legal hex color.
- Add `#` automatically if user omits it.
- Store it as `customBackgroundColor`.
- Preserve current `theme`.
- Apply readable text/overlay safeguards.

### Smooth Background Switching

Do not instantly swap background or theme colors. Use CSS transitions and/or overlay crossfade.

```css
body,
.app-shell,
.page-panel,
.theme-surface {
  transition:
    background-color var(--transition-theme) ease,
    color var(--transition-theme) ease,
    border-color var(--transition-theme) ease,
    box-shadow var(--transition-theme) ease;
}
```

---

## 10. Font Size Switching

Add global font size controls:

```ts
type FontSizeMode = "xl" | "lg" | "md" | "sm";
```

Display labels:

```text
xl = 特大
lg = 大
md = 中
sm = 小
```

Do not set all text to the same size. Preserve hierarchy:

- h1 largest
- h2 smaller than h1
- h3 smaller than h2
- body smaller than headings
- buttons/nav/metadata scale proportionally

Recommended CSS:

```css
:root {
  --font-scale: 1;

  --font-body: calc(1rem * var(--font-scale));
  --font-small: calc(0.875rem * var(--font-scale));
  --font-button: calc(1rem * var(--font-scale));

  --font-h1: calc(3rem * var(--font-scale));
  --font-h2: calc(2.25rem * var(--font-scale));
  --font-h3: calc(1.5rem * var(--font-scale));
}
```

```ts
const FONT_SCALE_MAP = {
  xl: 1.25,
  lg: 1.12,
  md: 1,
  sm: 0.88,
};
```

---

## 11. Wheel Navigation

Add a wheel-style navigator for page switching.

This must be functional, not decorative.

Requirements:

- Read the same `pageMap` as the PageSlider.
- Show active page.
- Click node -> update `currentPage`.
- Stay synchronized with PageSlider.
- Stay synchronized with AI Action Router.
- Stay synchronized with bottom progress line.

Suggested labels:

```text
首頁
介紹
特色
技術
展示
關於
聯絡
簡報
```

Visual direction:

- `future`: premium product-style radial navigation, subtle lines, clean nodes, small glow on active item.
- `cat`: soft radial navigation, rounded nodes, subtle paw accents, lightweight animation.

---

## 12. Marquee Bar

Add a marquee/status bar.

It can display:

- site hints
- current announcements
- smart navigator suggestions
- user-defined text
- theme-related short messages

The smart navigator must be able to update it:

```json
{
  "action": "setMarquee",
  "text": "歡迎來到我的網站"
}
```

Use CSS animation where possible. In reduced-performance mode, make it slower or static.

---

## 13. Bottom Progress Line

Because this is a left/right SPA, do not use vertical scroll progress.

Calculate progress from `pageMap` and `currentPage`:

```ts
const totalPages = pageMap.length;
const pageIndex = pageMap.findIndex(page => page.id === currentPage);

const progress =
  totalPages <= 1
    ? 100
    : (pageIndex / (totalPages - 1)) * 100;

const isCompleted = pageIndex === totalPages - 1;
```

UI requirements:

- fixed at bottom
- no percentage text
- one line gradually fills
- fill increases with page index
- full line at final page
- must not block buttons or controls

Suggested CSS:

```css
.progress-line {
  transform-origin: left center;
  transform: scaleX(var(--progress-ratio));
}
```

Theme variations:

- `future`: subtle premium data line, gradient, micro glow, small cursor such as `◆`, `◈`, `✦`, or `⬡`; avoid oversized sci-fi energy bars.
- `cat`: clean cat-walk line with small cat/paw/fish/yarn accent; do not clutter the screen.

---

## 14. Smart Navigator / AI Control

This is the core feature.

Implementation priority:

1. AI Action Schema
2. AI Action Validator
3. AI Action Router
4. Mock parser
5. Smart Navigator UI
6. Real AI API integration

The site must work with a mock parser before real AI is connected.

Potential models:

```text
Gemma4
Gemini 2.5 Flash
mock parser
```

### Required Supported Commands

Page controls:

```text
下一頁
上一頁
回首頁
帶我去技術頁
我要看功能介紹
去最後一頁
帶我去簡報頁
```

Theme controls:

```text
切換成貓咪風
換成未來科技風
我要可愛一點
我要科技感一點
```

Background controls:

```text
背景改成白色
背景改成 #ffffff
背景改成 ffffff
背景改成黑色
背景改成 #111827
換成粉紅色背景
我想要柔和一點
改成奶油色
改成深色系
改成冷色系
```

Important: background controls should trigger `setBackground`, not `setTheme`.

Font controls:

```text
字體放大
改成特大字體
字體小一點
切換成中等字體
```

Marquee controls:

```text
把跑馬燈改成歡迎來到我的網站
新增公告：今天展示智慧導覽功能
跑馬燈顯示目前是簡報模式
```

Presentation controls:

```text
帶我去簡報頁
我要看技術簡報
我要下載 PPT
幫我產生技術 PPT
用網頁簡報就好
不要下載 PPT，直接在頁面顯示
```

### Color and Explanation Behavior

- If a user asks for a normal color in natural language, map it to a safe background change.
- Examples: `白色` -> `#ffffff`, `黑色` -> `#050505`, `粉紅色` -> soft pink, `奶油色` -> warm cream.
- If the color request is strange, ambiguous, unsafe, or not confidently recognized, return `unknown` and do **not** change the current background.
- Background color commands must preserve the selected `theme`; only `bgMain`, overlay, and readable text safeguards should change.
- Users may ask how a section works, for example `3D 場域怎麼做出來的？`, `跑馬燈怎麼實作？`, or `背景控制怎麼做？`.
- These explanation questions should reply from local project knowledge and should not mutate UI state unless the user also gives a clear control command.

---

## 15. AI Action Schema

```ts
type Theme = "future" | "cat";

type FontSizeMode = "xl" | "lg" | "md" | "sm";

type PageId =
  | "home"
  | "intro"
  | "features"
  | "tech"
  | "gallery"
  | "about"
  | "contact"
  | "presentation";

type BackgroundPreset =
  | "default"
  | "dark"
  | "light"
  | "soft"
  | "neon"
  | "pastel"
  | "warm"
  | "cool"
  | "minimal"
  | "lab"
  | "catRoom";

type PresentationMode = "web" | "ppt";

type AIAction =
  | {
      action: "goToPage";
      target: PageId;
    }
  | {
      action: "nextPage";
    }
  | {
      action: "previousPage";
    }
  | {
      action: "getCurrentProgress";
    }
  | {
      action: "setTheme";
      theme: Theme;
    }
  | {
      action: "setFontSize";
      size: FontSizeMode;
    }
  | {
      action: "setBackground";
      color?: string;
      preset?: BackgroundPreset;
    }
  | {
      action: "setMarquee";
      text: string;
    }
  | {
      action: "setPresentationMode";
      mode: PresentationMode;
    }
  | {
      action: "generatePpt";
    }
  | {
      action: "downloadPpt";
    }
  | {
      action: "unknown";
      message: string;
    };
```

---

## 16. AppState

```ts
type AppState = {
  theme: Theme;
  fontSize: FontSizeMode;
  marqueeText: string;

  backgroundPreset: BackgroundPreset;
  customBackgroundColor?: string;

  currentPage: PageId;
  pageIndex: number;
  totalPages: number;

  progress: number;
  isCompleted: boolean;

  presentationMode: "web" | "ppt";

  performanceMode: "auto" | "normal" | "reduced";

  pptStatus: "idle" | "generating" | "ready" | "error";
  pptDownloadUrl?: string;
};
```

Use existing React state/context/module state if possible. Do not add Redux/Zustand unless already present or clearly necessary.

---

## 17. AI Action Router

All AI actions must pass through one Action Router.

```ts
function handleAIAction(action: AIAction, state: AppState) {
  switch (action.action) {
    case "goToPage":
      // switch to target page
      break;

    case "nextPage":
      // go to next page
      break;

    case "previousPage":
      // go to previous page
      break;

    case "getCurrentProgress":
      // reply with progress stage; exact percentage is optional
      break;

    case "setTheme":
      // change overall visual language
      break;

    case "setFontSize":
      // update --font-scale
      break;

    case "setBackground":
      // update background preset or custom color
      // must not change current theme
      break;

    case "setMarquee":
      // update marquee text
      break;

    case "setPresentationMode":
      // switch between web presentation and ppt mode
      break;

    case "generatePpt":
      // generate ppt if ppt mode is supported
      break;

    case "downloadPpt":
      // download ppt if available; otherwise navigate to presentation page
      break;

    case "unknown":
      // show available command examples
      break;
  }
}
```

---

## 18. Presentation Page

The last SPA page is:

```ts
PageId = "presentation";
```

It can replace the old idea of a required PPT file, or optionally support PPT download.

### Mode A: Web Presentation

If not generating a `.pptx`, the final page should act as a polished web presentation.

It must not be plain text.

Include:

- cover section
- chapters
- architecture diagram
- flow diagram
- Action Schema block
- performance strategy block
- theme/background control explanation
- polished cards and layout
- optional left/right switching between mini-slides
- smart navigator support for presentation sections

### Mode B: PPT Download

If implementing `.pptx` generation, `pptxgenjs` is allowed only for PPT generation.

It must be lazy-loaded:

```ts
const pptxgen = await import("pptxgenjs");
```

Do not include the PPT library in the initial bundle if avoidable.

PPT design requirements:

- not plain white slides with black text
- clear cover
- consistent theme
- clear slide titles
- diagrams and tables where useful
- readable density
- polished layout
- basic brand feeling

### Presentation / PPT Content Outline

Include at least:

1. 封面：AI 控制式互動網站擴充技術簡報
2. 專案目標與擴充範圍
3. 既有網站保留策略
4. 左右切換式 SPA 架構
5. Page Slider 設計
6. 外觀去 AI 化、功能 AI 化的設計原則
7. 雙主題系統
8. CSS Root Variables
9. Theme Token Map
10. Background Preset Map
11. 色碼背景切換機制
12. 背景切換不改變 Theme 的規則
13. 字體大小比例縮放
14. 輪軸式導覽
15. 跑馬燈控制
16. 智慧導覽員架構
17. AI Action Schema
18. AI Action Router
19. 安全限制：禁止 AI 直接執行 JS
20. 底部進度線
21. Web Presentation / PPT 輸出設計
22. 效能優先策略
23. 低效能降級模式
24. RWD 與手機版支援
25. 未來可擴充方向

---

## 19. Performance and Low-End Device Support

Performance is a required feature.

The app must remain usable on weak devices.

### Performance Mode

```ts
type PerformanceMode = "auto" | "normal" | "reduced";
```

### Auto-Downgrade Conditions

In `auto` mode, reduce animation/visual cost when:

- `prefers-reduced-motion: reduce`
- low device memory
- low FPS
- low-end mobile device
- animation initialization fails
- required visual capability unsupported
- background animation causes lag

### Reduced Mode Strategy

In reduced mode:

- disable particles
- disable heavy blur
- disable complex shadows
- disable 3D transforms
- use simple fade or direct page switching
- slow down or freeze marquee
- keep simple background transitions
- keep smart navigator working
- keep font switching working
- keep page switching working
- keep presentation page working
- keep PPT feature working if implemented

Example:

```css
.app.reduced-motion *,
.app.reduced-motion *::before,
.app.reduced-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 150ms !important;
  scroll-behavior: auto !important;
}

.app.reduced-performance .particle-layer,
.app.reduced-performance .heavy-glow,
.app.reduced-performance .webgl-background {
  display: none;
}
```

---

## 20. Suggested File / Module Structure

If this is React / Next.js, prefer:

```text
/components
  ThemeSelector
  LoadingScreen
  AppShell
  PageSlider
  WheelNavigator
  FontSizeSwitcher
  MarqueeBar
  SmartNavigator
  ProgressLine
  FutureProgressLine
  CatProgressLine
  PresentationPage
  PerformanceGuard

/lib
  themeConfig
  backgroundPresetMap
  applyThemeTokens
  applyBackground
  colorUtils
  fontScale
  pageMap
  pageProgress
  aiActionSchema
  aiActionValidator
  aiActionRouter
  aiMockParser
  performanceMode
  pptGenerator

/api
  ai-navigator
  generate-ppt
```

If not React, keep equivalent separation by responsibility.

Do not put everything in one file.

---

## 21. Component Responsibilities

### `ThemeSelector`

- initial theme selection
- two theme buttons
- transition into loading/main app

### `LoadingScreen`

- lightweight loading only
- different feeling per theme
- no heavy animation package

### `AppShell`

- overall layout
- theme class
- CSS variable application
- contains pages, nav, smart navigator, progress line

### `PageSlider`

- left/right page switching
- `pageIndex` management
- keyboard arrows
- mobile swipes
- performance-aware animation

### `WheelNavigator`

- real page navigation
- active state
- synchronized with `pageMap`
- synchronized with Action Router

### `FontSizeSwitcher`

- `xl`, `lg`, `md`, `sm`
- updates `--font-scale`

### `MarqueeBar`

- displays marquee/status text
- accepts SmartNavigator updates
- degrades in reduced-performance mode

### `SmartNavigator`

- accepts natural language
- calls AI API or mock parser
- validates JSON action
- calls Action Router
- displays response

### `ProgressLine`

- calculates from page index
- no percentage text
- theme-specific visual style

### `PresentationPage`

- final technical presentation
- web presentation mode
- optional PPT generation/download
- polished design required

### `PerformanceGuard`

- detects low performance
- applies reduced classes
- preserves core functionality

---

## 22. API and Server Rules

- Browser calls local server routes.
- API secrets stay in server environment variables.
- Never expose AI API keys in client code.
- Use `.env` based on `.env.example`.
- Do not log secrets.
- If implementing `/api/ai-navigator`, it should accept:

```ts
type AINavigatorRequest = {
  message: string;
  state: AppState;
};
```

and return:

```ts
type AINavigatorResponse = {
  action: AIAction;
  reply?: string;
};
```

The AI prompt must instruct the model:

- output JSON only
- never output executable JS
- never invent invalid enum values
- return `unknown` when uncertain

---

## 23. RWD and Accessibility Requirements

Mobile requirements:

- left/right swipe page switching
- SmartNavigator usable on mobile
- wheel navigation not too large
- bottom progress line does not cover controls
- presentation page readable
- font switching remains readable
- heavy effects degrade automatically

Accessibility requirements:

- keyboard operation
- visible focus states
- correct `aria-*` states
- live regions where dynamic status changes matter
- reduced-motion support
- semantic headings
- text alternatives near Three.js/canvas visuals
- no text overlap at desktop or mobile widths

SEO requirements:

- title
- meta description
- canonical
- Open Graph
- Twitter Card
- JSON-LD where appropriate
- semantic HTML structure

---

## 24. Quality Gates

Before considering work complete, verify:

- `git status --short` reviewed
- no secrets leaked to client code
- no `.env` committed
- desktop layout works
- mobile layout works
- no text overlap
- no blank canvas
- keyboard navigation works
- reduced motion works
- SmartNavigator mock parser works
- Action Schema validates inputs
- invalid AI actions are rejected safely
- background hex input works
- background color change does not change current theme
- theme switch has transition
- page switch works by buttons, keyboard, swipe, wheel nav, and SmartNavigator
- bottom progress line tracks `pageMap`
- final presentation page works
- PPT generation, if implemented, is lazy-loaded

---

## 25. Acceptance Criteria

The implementation must satisfy:

1. Existing website content is preserved.
2. New features are extensions, not a full rebuild.
3. The site is a left/right SPA, not a vertical long page.
4. Initial theme selection exists.
5. `future` and `cat` themes exist.
6. Visual design is de-AI-styled: mature, clean, modern, not a robot UI.
7. Functionally, SmartNavigator controls the website.
8. Theme and background switching are smooth.
9. CSS root variables manage theme tokens.
10. `THEME_TOKEN_MAP` centralizes theme colors.
11. `BACKGROUND_PRESET_MAP` centralizes background presets.
12. Hex color input such as `#ffffff` is supported.
13. Background changes do not change selected theme.
14. Wheel navigation is real navigation, not decoration.
15. Font size modes exist: 特大 / 大 / 中 / 小.
16. Font scaling preserves hierarchy.
17. Marquee exists and can be updated by SmartNavigator.
18. SmartNavigator can switch pages.
19. SmartNavigator can switch theme.
20. SmartNavigator can modify background preset.
21. SmartNavigator can modify background hex color.
22. SmartNavigator can modify font size.
23. SmartNavigator can modify marquee text.
24. SmartNavigator can go to final presentation page.
25. AI only returns fixed JSON actions.
26. No arbitrary AI-generated JS is executed.
27. Bottom progress line exists.
28. Bottom progress line shows no percentage text.
29. Bottom progress line fills by page index.
30. Final page fully fills the progress line.
31. Final page is `PresentationPage`.
32. PresentationPage can replace PPT or offer PPT download.
33. If PPT exists, it is well-designed and lazy-loaded.
34. Avoid new dependencies where possible.
35. Performance is prioritized.
36. Low-end devices get reduced effects.
37. Reduced effects do not break core features.
38. Mobile works.
39. Accessibility and SEO quality gates are met.

---

## 26. Recommended Implementation Order

1. Inspect current project structure.
2. Create implementation plan.
3. Organize existing content into `PageId` / `pageMap`.
4. Build left/right `PageSlider` shell.
5. Create `AppState`.
6. Add CSS root variables.
7. Add `THEME_TOKEN_MAP`.
8. Add `BACKGROUND_PRESET_MAP`.
9. Add background hex validation and application.
10. Add smooth theme/background switching.
11. Add initial `ThemeSelector`.
12. Add wheel navigation.
13. Add font size switcher.
14. Add marquee bar.
15. Add bottom progress line.
16. Add AI Action Schema.
17. Add AI Action Validator.
18. Add AI Action Router.
19. Add SmartNavigator UI.
20. Add mock parser and test all actions.
21. Integrate real AI API if available.
22. Add final `PresentationPage`.
23. Add optional PPT generation/download only if required.
24. Add performance guard and reduced mode.
25. Improve responsive layout.
26. Improve accessibility and SEO.
27. Polish design so it feels like a mature modern website.

---

## 27. Most Important Summary

The final site should behave like this:

```text
The original website content remains.
The site becomes a left/right SPA, not a vertical long page.
Users choose either a future or cat theme on first entry.
The visual style is mature and modern, not obviously AI/robot themed.
Users can navigate by buttons, keyboard, swipe, wheel nav, or SmartNavigator.
SmartNavigator understands natural language and controls page, theme, background, color code, font size, marquee, and presentation page.
Users can request arbitrary legal background hex colors like #ffffff.
Background color changes do not destroy or switch the selected theme.
The bottom progress line fills according to the current page.
The final page is a polished technical presentation page, with optional PPT download.
The project avoids unnecessary dependencies and prioritizes performance.
Low-end devices receive reduced effects, but core features continue to work.
```

Core concept:

```text
The site should look like a mature modern website,
but underneath it can be controlled by a smart navigator through natural language.
```

---

## 28. Current Extension Addendum: Settings, Shape Control, and Persistence

- The smart navigator may control page-local visual settings with large but bounded permissions.
- Supported visual controls include page navigation, theme, background preset, custom hex background color, font size, marquee text, presentation mode, and block/card shape style.
- Shape controls must use a fixed whitelist only, for example:

```ts
type ShapeMode = "sharp" | "soft" | "round" | "glass" | "solid";
```

- User commands such as `方塊變圓`, `卡片柔和一點`, `改成毛玻璃`, `變回直角`, or `不要透明` should become a safe `setShapeMode` action.
- The navigator must never generate arbitrary CSS strings or JavaScript for shape changes. It may only update predefined CSS variables through the Action Router.
- Persist user preferences with a site-scoped cookie, not by writing files. Stored settings may include theme, background, font size, marquee text, shape mode, current page, and presentation mode.
- Cookie persistence is only for this site/page experience and must not include secrets, API keys, chat contents, or private data.
- A top-right `預設` reset control must restore default settings and overwrite the settings cookie with the default preference set.
- Reset must not delete files, rebuild assets, or change committed source. It only resets runtime UI preferences for this site.
- If the user asks for an unclear, unsafe, or strange visual command, return `unknown` and do not mutate state.
- If the user asks how a block works, answer from local project knowledge without changing UI state unless the request also includes a clear action command.

---

## 29. 2026-05-27 User Requirements Addendum

Use these requirements as active project rules for the current Cat Future Lab implementation.

- The project core idea is: future websites can be controlled by AI through safe, validated actions. Users should be able to ask the navigator to change page, background color, card shape, font size, marquee text, and presentation mode.
- The visual design must not become a robot/AI dashboard. The interface should feel like a mature modern website. AI is the control layer, not the visual theme.
- The original two style choices are now named `future` and `warm`. In code the warm theme may still use the legacy id `cat`, but user-facing text should say `溫暖` instead of emphasizing a full cat-themed site.
- The reset/default button must clear AI-made runtime changes only. It should preserve the user's selected theme/style and should not unexpectedly send the user back to the top of a page.
- Natural language color control should be flexible. Common color words such as white, black, pink, warm, cool, cream, dark, and valid hex colors should become safe `setBackground` actions. Strange or unclear color commands should return `unknown` and must not change UI state.
- Background changes must automatically maintain readable text contrast. A black background should use light text; a white background should use dark text.
- Text color control may be supported as a separate safe action, but only through validated hex colors or known color words. It must not allow arbitrary CSS.
- Shape changes must remain bounded to whitelisted modes such as `sharp`, `soft`, `round`, `glass`, and `solid`. The navigator must never execute arbitrary CSS or JavaScript from user or AI output.
- Runtime preferences should be persisted with a site-scoped cookie only. Never store API keys, chat history, or private data in the cookie.
- Page changes, wheel navigation, gallery actions, and presentation next/previous actions must not force-scroll the user back to the top. Preserve the user's current reading position whenever possible.
- The custom cat cursor should remain available on desktop/fine-pointer devices, including after opening browser developer tools. The visual cursor hotspot should match the real pointer position as closely as possible.
- The `future` theme must include an actual future-lab background treatment, not just button/card color changes.
- The `future` theme should be visually distinct from the warm/cat style. Current direction: French art future, using dark aubergine surfaces, champagne linework, restrained rose/sage accents, decorative curves, and a curated gallery feeling instead of American flat SaaS/cyber neon.
- Initial loading should be theme-specific: future mode uses particles gathering toward the center and bursting outward; warm mode uses a small animated cat/progress motif.
- Page transitions should be visible and polished across the SPA. Prefer transform and opacity, and keep reduced-motion behavior available.
- The final presentation page should be compact and useful. Avoid large empty areas. It should support web slides and PPT download, with content sufficient for a technical walkthrough.
- Font size changes must never make page panels or presentation slides unusable. Large and extra-large text modes should tighten title maximums, increase bottom safe padding, and shrink presentation media automatically.
- Avoid duplicate large media slides in the presentation. Keep Remotion as the video/process slide, and use later slides for AI-controlled theme/background logic rather than another full video.

---

## 30. 2026-05-28 Smart Navigator and RWD Addendum

These rules refine the current AI-controlled website direction.

- The smart navigator must attempt the server AI planner first for normal user messages. The local parser is only a fallback for missing keys, network failure, invalid model JSON, or server failure.
- The frontend should always show a visible response for every non-empty smart navigator message, even when no page state changes.
- The user may describe colors in flexible natural language, such as `特殊的金色`, `奶油霧面`, `深海藍`, `高級黑`, or `柔和粉色`. The AI planner should infer a tasteful safe hex color when reasonable.
- Visual mutations such as background, text color, shape, font size, and theme changes should be returned as a proposal first. The user should be able to accept or reject the proposal before it changes the page.
- Do not expose chain-of-thought. Show only a short user-facing `decisionSummary` that explains why an action was selected.
- Even if the user asks to "turn off security", the site must not execute arbitrary JavaScript, CSS, or HTML from the model. The relaxed part is natural-language interpretation, not code execution.
- Explanation questions such as `3D 場域怎麼做？`, `背景控制怎麼做？`, or `這個區塊的功能是什麼？` should be sent to the AI planner when available and should return an explanatory `unknown(message)` response without mutating UI state.
- Mobile layout must not be constrained by fixed-height cards. Panels, weather cards, smart navigator responses, and presentation slides must grow or scroll with font size changes.
- On mobile, header controls should stay compact near the logo/brand row instead of becoming a large block below navigation. Navigation can scroll horizontally, but content must not be pushed into unusable space.
- Bottom page controls and wheel navigation should remain semi-transparent, compact, and should not block primary content or cause horizontal overflow.

---

## 31. 2026-05-28 Relaxed Navigator, Particles, Music, and Cat Interaction Addendum

These rules override stricter wording from older sections for the active Cat Future Lab implementation.

- Do not treat the smart navigator as a rigid keyword switcher. For normal messages, call the server AI planner first and let the model infer intent from flexible natural language.
- The relaxed behavior applies to natural-language interpretation and model output shape. It does not allow exposing secrets, running arbitrary JavaScript, injecting HTML, or applying raw CSS from the model.
- The navigator must refuse requests that try to reveal, print, infer, or extract API keys, tokens, passwords, `.env` contents, or other secrets.
- Model responses may use canonical JSON actions or simple shorthand such as `{"goToPage":"intro"}` and `{"setBackground":"#d4af37"}`. The frontend should normalize those into safe Action Router actions.
- If a model action is malformed but the user intent is clear and harmless, repair it into the nearest safe action instead of failing with a validation-only error.
- Visual changes such as background, text color, font size, shape, and theme should show a confirmation proposal first, including a short user-facing decision summary and color preview when relevant.
- The site should always return a visible response for every non-empty navigator input, even if no state changes.
- The global `導覽` control must be available from every page. It should open a lightweight translucent modal and submit through the same smart navigator flow as the control page.
- Music support uses local files only: `assets/music/1.mp3` for the future theme and `assets/music/2.mp3` for the warm theme. Music starts only after the user clicks the sound button.
- The future theme must include a visible particle background with slow drift plus gather/burst feeling. Reduced-motion or reduced-performance mode may pause or simplify particles, but the future theme should still have a distinct background treatment.
- Background and theme switching should be slower and more visible than ordinary hover transitions so users can perceive the state change.
- The intro / 3D page should explain its scene modes clearly. The cat-ear geometry should feel alive, with subtle ear movement even when the user is not interacting.
- The intro / 3D page should include a `貓咪跟隨` interaction. When enabled, the cat-like scene follows the pointer, eyes open toward the pointer, and the desktop cursor changes to a cat treat while hovering the scene.
- The site icon / brand mark should use cat-related imagery and may animate subtly. Keep it lightweight and do not block layout.
- Performance remains a required quality gate: cap device pixel ratio where needed, reduce particle counts on weak devices, and prefer CSS transforms/opacity over layout-heavy animation.
