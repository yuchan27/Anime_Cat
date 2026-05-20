# Cat Future Lab Workflow

## 0. 目前狀態
- 主要作品在 `cat-future-lab/`。
- 根目錄已初始化 Git，最近一次實作 commit 為 `022c976 Build cat future lab final project`。
- Figma 設計稿已建立：https://www.figma.com/design/KHTxo4D1lTXtSteplkjcCp
- OneDrive 目錄曾出現 Git lock / 權限問題，因此後續建議移到 `C:\Code\CatFutureLab` 執行。

## 1. 搬到 C:\ 的交接流程
- 建議目標資料夾：`C:\Code\CatFutureLab`。
- 請複製整個 repo，不只複製 `cat-future-lab/`，因為根目錄有 `.git`、`AGENTS.md`、`WORKFLOW.md`、`README.md`、`.gitignore`。
- 搬移後在新視窗先執行：

```powershell
cd "C:\Code\CatFutureLab"
git status --short
```

- 不要在 agent 內批量刪除 OneDrive 舊資料夾。確認 `C:\` 版本能跑後，再由使用者手動清理舊資料。

## 2. 執行網站
- 進入網站資料夾：

```powershell
cd "C:\Code\CatFutureLab\cat-future-lab"
npm start
```

- 開啟 `http://localhost:5177/`。
- 若 5177 被占用，可改用：

```powershell
$env:PORT=5180
npm start
```

## 3. API 設定
- 複製 `.env.example` 為 `.env`，但不要提交 `.env`。
- 可用欄位：

```env
PORT=5177
GOOGLE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-2.0-flash
```

- `POST /api/chat` 走 server proxy，不要讓前端直接持有 Google key。
- `GET /api/weather?lat=...&lng=...` 使用 Open-Meteo；定位失敗時前端會使用台北座標展示。

## 4. 後續開發順序
- 先確認 Figma 風格是否要調整。
- 再更新前端視覺與互動。
- 接著設定 `.env` 測試 AI chat。
- 最後處理 Remotion 渲染素材與 Lighthouse 驗收。

## 5. 檔案分工
- `cat-future-lab/index.html`：一頁式網站結構、SEO meta、JSON-LD。
- `cat-future-lab/assets/css/styles.css`：視覺系統、RWD、focus、reduced motion。
- `cat-future-lab/assets/js/main.js`：頁面啟動、Anime.js、表單互動。
- `cat-future-lab/assets/js/scene.js`：Three.js 貓咪場景。
- `cat-future-lab/assets/js/api.js`：前端 API client。
- `cat-future-lab/assets/js/a11y.js`：降低動態與 reveal observer。
- `cat-future-lab/server/server.js`：靜態檔案伺服與 API proxy。
- `cat-future-lab/remotion/`：Remotion 素材產線。

## 6. 驗收清單
- `npm run check`
- `node --check assets/js/main.js`
- `node --check assets/js/scene.js`
- 首頁可載入。
- Three.js canvas 非空白。
- Chat API 未設定 key 時有 fallback。
- Weather API 可回傳資料或 fallback。
- 鍵盤可操作導覽、按鈕、表單與模式切換。
- SEO 有 title、description、canonical、Open Graph、Twitter Card、JSON-LD。
- Accessibility 有 heading hierarchy、alt、aria-live、aria-pressed、focus ring、reduced motion。
- 完成後執行 `git status --short` 並建立 focused commit。
