# Cat Future Lab（animation_design）

本專案是既有網站的延伸，不是重做。核心目標是把網站做成「左右切換 SPA + 智慧導覽員（自然語言控制）」；視覺上保持成熟、現代、低噪音，功能上走安全可驗證的 AI Action Router。

## 1) 專案摘要（依 AGENTS.md + WORKFLOW.md）

- 保留既有內容與架構，採小步可審查更新，不做整站重寫。
- 任何 AI 控制都必須走：`自然語言 -> JSON Action -> 驗證 -> Action Router -> AppState -> UI`。
- 禁止 AI 直接執行程式碼（禁止 `eval/new Function/任意 HTML 注入執行`）。
- 主體為左右切換式 SPA（非長頁滾動），支援按鈕、鍵盤、手勢、輪軸、智慧導覽切頁。
- 主題與背景分離：改背景不能強制切換主題。
- 設定持久化使用 Cookie（站內偏好），不得存放秘密資訊。
- 啟動前先看 `git status --short`，持續 git 管理；不要提交 `.env`、金鑰、build 產物、暫存檔。

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
  全站 AppState 與訂閱機制，含頁面進度計算、Cookie 持久化（`catlab-settings-v2`）、reset 與狀態白名單檢查。

- `cat-future-lab/assets/js/aiActions.js`  
  Action 正規化、驗證、執行路由（頁面/主題/背景/字體/形狀/跑馬燈/簡報模式等），並處理顏色解析與安全限制（含敏感資訊請求攔截）。

- `cat-future-lab/assets/js/smartNavigator.js`  
  智慧導覽 UI 流程：送出訊息、呼叫 server planner、fallback parser、提案確認（accept/reject）、可回復操作（undo）與結果渲染。

- `cat-future-lab/server/server.js`  
  Node HTTP server + 靜態檔案服務；提供 `/api/env-status`、`/api/chat`、`/api/ai-navigator`、`/api/weather`。  
  AI planner 支援模型鏈 fallback、JSON 解析/修復、safe action 正規化與背景色推斷。

- `cat-future-lab/assets/js/config.js`  
  集中定義 `PAGE_MAP`、`THEME_TOKEN_MAP`、`BACKGROUND_PRESET_MAP`、字級與形狀等白名單配置。

- `cat-future-lab/assets/css/styles.css`  
  視覺樣式與主題 token 套用、過場、RWD、互動元件外觀。

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
