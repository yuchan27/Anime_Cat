# Cat Future Lab（animation_design）

本專案是既有網站的延伸，不是重做。核心目標是把網站做成「左右切換 SPA + 智慧導覽員（自然語言控制）」；視覺上保持成熟、現代、低噪音，功能上走安全可驗證的 AI Action Router。

## 1) 專案摘要（依 AGENTS.md + WORKFLOW.md）

- 保留既有內容與架構，採小步可審查更新，不做整站重寫。
- 任何 AI 控制都必須走：`自然語言 -> JSON Action -> 驗證 -> Action Router -> AppState -> UI`。
- 禁止 AI 直接執行程式碼（禁止 `eval/new Function/任意 HTML 注入執行`）。
- 主體為左右切換式 SPA（非長頁滾動），支援按鈕、鍵盤、手勢、輪軸、智慧導覽切頁。
- 目前提供三種主題：未來科技、溫暖動畫貓咪、金屬光澤；初次進站 10 秒未選會自動採用未來科技。
- 主題與背景分離：改背景不能強制切換主題。背景可用高斯模糊、光暈與低成本紋理協助文字聚焦。
- 設定持久化使用 Cookie（站內偏好），不得存放秘密資訊。
- 啟動前先看 `git status --short`，持續 git 管理；不要提交 `.env`、金鑰、build 產物、暫存檔。
- 2026-06-01 改版加入 Awwwards 參考的作品集式呈現：首頁改成 editorial showcase，特色與展示區改成可重用卡片系統；同時以 shadcn-ui 的 token / primitive 思路建立 `ui-card`、`ui-badge`、`ui-button`，不額外引入 React 或 Tailwind 依賴。
- 金屬主題已改成暗底高對比金屬色，文字、卡片、徽章與主視覺都有對比保護，並加入低成本 3D 景深板與光暈，避免背景與文字太接近。
- 2026-06-01 後續修正將三種風格拆得更明確：未來風偏沉浸式 3D / glass interface，溫暖風維持柔和貓咪網站語氣，金屬風偏工業銘牌與拉絲金屬；同一風格內按鈕、跑馬燈、卡片與簡報邊框會統一。
- 首頁主視覺改用 `assets/images/cat-3d-billboard-portal.png`，用 CSS `portal-cat-float` 做輕量動態；介紹頁恢復以原本 3D 場景為主，避免區塊重疊。
- 上方風格切換已改成只顯示另外兩種可切換風格，例如目前在溫暖風時顯示「未來」與「金屬」。

## 2) 執行方式

```powershell
cd "C:\Code\animation_design\cat-future-lab"
npm start
```

- 預設網址：`http://localhost:5177/`
- 若 5177 被占用，server 會自動遞增嘗試其他 port（見 `server/server.js`）。

## 3) 檢查指令

```powershell
cd "C:\Code\animation_design\cat-future-lab"
npm run check
```

`check` 會對 server 與主要前端模組做 `node --check` 語法檢查。

## 4) 重要程式碼導覽（目前實作）

- `cat-future-lab/assets/js/main.js`  
  前端初始化入口，串接動畫、3D、UI、Smart Navigator、天氣、音效、無障礙等模組。

- `cat-future-lab/assets/js/state.js`  
  全站 AppState 與訂閱機制，含頁面進度計算、Cookie 持久化（`catlab-settings-v4`）、reset 與狀態白名單檢查。

- `cat-future-lab/assets/js/aiActions.js`  
  Action 正規化、驗證、執行路由（頁面/主題/背景/字體/形狀/跑馬燈/簡報模式等），並處理顏色解析與安全限制（含敏感資訊請求攔截）。

- `cat-future-lab/assets/js/smartNavigator.js`  
  智慧導覽 UI 流程：送出訊息、呼叫 server planner、fallback parser、提案確認（accept/reject）、可回復操作（undo）與結果渲染。

- `cat-future-lab/server/server.js`  
  Node HTTP server + 靜態檔案服務；提供 `/api/env-status`、`/api/chat`、`/api/ai-navigator`、`/api/weather`。  
  AI planner 支援模型鏈 fallback、JSON 解析/修復、safe action 正規化與背景色推斷。

- `cat-future-lab/assets/js/config.js`  
  集中定義 `PAGE_MAP`、`THEME_TOKEN_MAP`、`BACKGROUND_PRESET_MAP`、字級與形狀等白名單配置；新增 `metal` 主題 token。

- `cat-future-lab/assets/css/styles.css`  
  視覺樣式與主題 token 套用、過場、RWD、互動元件外觀；背景模糊、全主題光暈與金屬拉絲效果都集中在這裡。

- `cat-future-lab/assets/js/effects.js`、`cat-future-lab/assets/js/scene.js`
  效能守門：SPA 模式下不再啟動多餘 GSAP 滑鼠追蹤；3D 場景只在介紹頁可見時按幀率上限更新，低效能模式改成靜態/低頻效果。

## 5) API 與環境變數

請建立：

`C:\Code\animation_design\cat-future-lab\.env`

```env
PORT=5177
GOOGLE_AI_API_KEY=
```

- 金鑰只放 server `.env`，不可進前端 bundle。
- `/api/chat`、`/api/ai-navigator` 由 server 代理呼叫模型。

## 6) Git 與提交範圍建議

- 先執行：`git status --short`
- 每次只提交本次功能必要檔案。
- 避免提交課程原始素材、臨時輸出、機密、node_modules。

## 7) 相關文件

- 技術細節：`C:\Code\animation_design\cat-future-lab\TECHNICAL_REFERENCE.md`
- Agent 規範：`C:\Code\animation_design\AGENTS.md`
- 工作流程：`C:\Code\animation_design\WORKFLOW.md`
