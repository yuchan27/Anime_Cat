# Cat Future Lab Workflow

## 0. 目前狀態
- 主要作品在 `cat-future-lab/`。
- 根目錄已初始化 Git，baseline commit 為 `8270b19 chore: baseline cat future lab project`。
- Figma 設計稿已建立：https://www.figma.com/design/KHTxo4D1lTXtSteplkjcCp
- Figma `Implementation Sync` 頁記錄目前方向：未來互動動畫實驗室，加上貓耳幾何、尾巴軌跡、貓眼 HUD 等局部貓咪元素。
- 主視覺圖片在 `cat-future-lab/assets/images/cat-hero-cartoon.png`，由 imagegen 生成後複製進專案。
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
- Figma 與前端同步推進，先保持 `Implementation Sync`、`FIGMA_BRIEF.md` 與實作方向一致。
- 更新前端視覺與互動時，維持「貓咪元素，不是整體貓咪頁」。
- 接著設定 `.env` 測試 AI chat。
- 最後處理 Remotion 渲染素材與 Lighthouse 驗收。

## 5. 檔案分工
- `cat-future-lab/index.html`：一頁式網站結構、SEO meta、JSON-LD。
- `cat-future-lab/assets/css/styles.css`：視覺系統、RWD、focus、reduced motion。
- `cat-future-lab/assets/images/cat-hero-cartoon.png`：Hero 使用的生成貓咪實驗室主視覺。
- `cat-future-lab/assets/js/main.js`：頁面啟動與模組 orchestration。
- `cat-future-lab/assets/js/animations.js`：Anime.js timeline、stagger、SVG path 與狀態數字動畫。
- `cat-future-lab/assets/js/ui.js`：header、chat 與 weather UI 狀態控制。
- `cat-future-lab/assets/js/scene.js`：Three.js 抽象未來實驗場與貓咪符號。
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

## 7. 2026-05-31 修正 Workflow：資源整理、手機導覽、輪播切頁

### 任務清單

- [x] 盤點正式圖片資源，確認完全相同的圖片 hash。
- [x] 統一圖片引用路徑：Hero 使用 `cat-hero-cartoon.png`，展示使用 `cat-observer-cartoon-wide.png`，天氣/簡報使用 `cat-weather-cartoon.png`。
- [x] 逐一刪除重複圖片檔：`cat-lab-guide.png`、`cat-observer-cartoon.png`、`cat-observer-lab.png`、`cat-weather-console.png`。
- [x] 檢查明顯未使用程式碼並移除 `experience.js` 內未被呼叫的 `easeInCubic()` helper。
- [x] 風格選擇後強制切回 `home`，避免從舊 hash 或 cookie 直接進入其他頁。
- [x] 將 SPA 頁面切換改成橫向輪播式位移，使用 `--page-offset` 控制每個 panel 的相對位置。
- [x] 手機版改成左側漢堡選單：主選單與控制列改為抽屜式直列，不再塞在頂部造成按鈕消失。
- [x] 移除品牌圖示上的額外線條，避免手機版 logo 與裝飾線重疊。
- [x] 溫暖模式加入輕量粒子背景與更柔和的多層背景，不再只呈現單一紅色背景。
- [x] 完成瀏覽器桌機與手機畫面驗收。
- [x] 執行 `npm run check`。
- [x] 完成 git commit / push。

### 驗收重點

- 桌機：首頁載入後停在首頁，右側輪軸、底部進度、左右切頁同步。
- 手機：左上角三條線可開啟直列選單，選單內能切頁、切主題、調字級與開導覽。
- 圖片：正式 `assets/images/` 不再保留同 hash 的重複圖片。
- 主題：溫暖模式要有可辨識的粒子與柔和背景層次，低效能模式仍可降級。

## 8. 2026-05-31 手機重疊與網站文案自然化

### 任務清單

- [x] 手機版隱藏右側/左側輪軸導覽，改由漢堡選單負責完整切頁，避免固定導覽蓋住內容。
- [x] 手機版翻頁控制固定在右下，並增加頁面底部安全距離，降低與圖片、文字重疊。
- [x] 抽屜選單上方加入品牌 logo 與 `Cat Future Lab`，開啟選單時仍保留網站識別。
- [x] 抽屜開啟時隱藏浮動翻頁控制，避免按鈕壓在選單上。
- [x] 手機版 hero 標題、內文、圖片與 CTA 改為更穩定的響應式尺寸。
- [x] 將首頁、介紹、特色、展示、控制、影像、使用情境與簡報入口文案改成正常網站語氣，降低報告感。
- [x] 執行 `npm run check`。
- [x] 完成 git commit / push。

### 驗收重點

- 手機首頁：品牌列、漢堡按鈕、主要文字、主圖與翻頁控制不互相遮擋。
- 手機選單：開啟後可看到 logo，選單內容直列顯示，浮動翻頁控制不壓在抽屜上。
- 內容語氣：各分頁優先像一般網站介紹，不再每一頁都像技術報告。

## 9. 2026-05-31 本次修正 Workflow：手機 CTA、ARIA 警告、內容與溫暖風格

### 任務清單

- [x] 修正手機首頁 CTA 壓在主圖上的問題：首頁在手機版改成直向 flex 流程，CTA 與圖片各自佔位。
- [x] 修正頁面切換時 `aria-hidden` 警告：切頁前先把焦點移到新頁面 panel，再隱藏舊頁面。
- [x] 修正手機抽屜選單 `aria-hidden` 警告：關閉前先把焦點移回漢堡按鈕，手機版用 `inert` 管理不可互動狀態。
- [x] 將 API 狀態列簡化為一行半透明文字，成功時只顯示「已讀取 key」。
- [x] 重新撰寫影像/關於頁敘事，把 Remotion 區塊改成城市觀測站故事。
- [x] Remotion `CatLoop` 來源長度從 10 秒提高到 18 秒。
- [x] 在影像頁新增四張情境圖片，讓故事不只依賴影片。
- [x] 擴充特色與技術卡片內容，加入操作、效能、手機與 fallback 說明。
- [x] 讓溫暖風格在介紹、影像、控制與簡報頁有多層暖色、光點和柔和紋理，不再是單一底色。
- [x] 加入頁面 panel 的 rendering containment，降低非作用頁面重繪成本。

### 待驗收

- [x] 執行 `npm run check`。
- [x] 開本機頁面檢查桌機與手機版首頁、介紹、特色、影像、控制與簡報。
- [x] 檢查 console 是否不再出現本專案造成的 `aria-hidden` 焦點警告。
- [x] 重新 render Remotion `cat-loop.mp4`，讓本機影片檔也更新到 18 秒。
