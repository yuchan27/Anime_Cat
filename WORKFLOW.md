# Cat Future Lab Workflow

## 0.6 2026-06-01 簡報與邊框回歸修正

- [x] 重新檢查簡報 deck 的 CSS 層疊來源，定位到 `.note-slide` 被後續規則改成可收縮，導致 12 張 slide 同時擠進內框。
- [x] 強制簡報 track 保持 flex carousel，每張 slide 固定 `100%` 寬，內框不再超出外框。
- [x] 簡報外框、內框、toolbar、slide 全部補上 `max-width: 100%` 與 `box-sizing: border-box`。
- [x] 移除跑馬燈上方殘留線條來源，header 與 marquee 之間不再留下額外邊線。
- [x] 補上中/小字級標題保護，避免中文標題在一般寬度下被切字或擠成直排。
- [x] 完成 Chrome headless 實際渲染驗證：三種主題、四種字級、八個頁面皆無水平溢出；簡報維持單張 slide。

## 0.5 2026-06-01 控制頁與效能修正

- [x] 控制頁左右卡片改成同一組高度規則，桌面版保留更大的欄距與表單間距。
- [x] 移除「重新整理城市訊號」按鈕；城市下拉選單仍會在切換時自動更新天氣資料。
- [x] 手機版頁面切換控制改到右上角精簡顯示，避免壓到特色、展示、影像頁文字與圖片。
- [x] 首頁不再立即載入 Three.js 3D 場景，切到介紹頁才動態載入。
- [x] SPA 模式不再先下載 GSAP / ScrollTrigger，減少首頁未使用 JavaScript。
- [x] Remotion 影片改成 `preload="none"` 並取消首頁影片自動播放，降低初始網路 payload。
- [x] 背景粒子層改為靜態光暈，保留氛圍但移除高成本背景動畫。
- [ ] 完成瀏覽器實機截圖驗證；目前 Browser plugin runtime 缺檔，先以語法與 HTTP 檢查替代。

## 0. 目前狀態
- 主要作品在 `cat-future-lab/`。
- 根目錄已初始化 Git，baseline commit 為 `8270b19 chore: baseline cat future lab project`。
- Figma 設計稿已建立：https://www.figma.com/design/KHTxo4D1lTXtSteplkjcCp
- Figma `Implementation Sync` 頁記錄目前方向：未來互動動畫實驗室，加上貓耳幾何、尾巴軌跡、貓眼 HUD 等局部貓咪元素。
- 首頁主視覺目前使用 `cat-future-lab/assets/images/cat-3d-billboard-portal.png`，並保留 `cat-hero-cartoon.png` 作為展示圖資。
- OneDrive 目錄曾出現 Git lock / 權限問題，因此後續建議移到 `C:\Code\CatFutureLab` 執行。

## 0.1 2026-06-01 Awwwards / shadcn-ui 改版流程
- [x] 參考 Awwwards 的作品集式呈現：首頁改成更像可瀏覽作品的 editorial showcase，而不是報告封面。
- [x] 依 shadcn-ui 思路新增低耦合 primitive：`ui-card`、`ui-badge`、`ui-button`，因專案不是 React/Tailwind 架構，沒有硬裝 shadcn 套件。
- [x] 特色與展示區改成一組共用卡片與分類徽章，方便後續擴充分頁內容。
- [x] 金屬主題改為暗底高對比，避免銀灰背景與白灰文字互相吃掉。
- [x] 首頁加入低成本 3D 景深背景板與全主題光暈；低效能模式會降低景深與粒子成本。
- [x] 完成 `npm run check`、`git diff --check` 與瀏覽器可讀性驗證；金屬主題主要文字對比樣本約 17:1，console 無錯誤。

## 0.2 2026-06-01 三主題差異化與 3D 貓咪工作清單
- [x] 盤點目前主題、簡報、跑馬燈、按鈕與圖片結構。
- [x] 參考 Awwwards，將未來風與金屬風拆成兩套明顯不同的創作語言；溫暖風維持原方向但統一細節。
- [x] 產生新的 3D 貓咪素材，作為可重用主視覺資產。
- [x] 將上方風格切換改成「顯示另外兩種可切換風格」，例如溫暖時顯示未來與金屬。
- [x] 統一同一主題內的按鈕、跑馬燈、輪軸、簡報邊框與卡片形狀，避免左右按鈕風格不一致。
- [x] 降低中等字體下的上下捲動需求；大與特大保留可捲動。
- [x] 修正簡報頁斷層，所有主題都要有明確邊框且版面連續。
- [x] 更新 README / WORKFLOW，跑 `npm run check`、`git diff --check` 與本機瀏覽器驗證。

## 0.3 2026-06-01 首頁鎖定與介紹頁修正工作清單
- [x] 將 3D 貓咪素材移到首頁主視覺，首頁保留翻面查看第二張觀測場景。
- [x] 介紹頁恢復以 3D 場景 canvas 為主，移除造成重疊的額外貓咪視覺層。
- [x] 首頁作用中 panel 改為不產生垂直捲動，避免使用者在首頁誤滑。
- [x] 更新 CSS cache 版本，避免瀏覽器吃到舊樣式。
- [x] 執行 `npm run check` 與 `git diff --check`。
- [ ] 本機瀏覽器驗證：環境目前拒絕開啟本機測試位址，待下次可用時補驗首頁視覺與介紹頁切換。

## 0.4 2026-06-01 響應式比例、簡報與三主題差異修正
- [x] 溫暖風跑馬燈改回正常單列文字，移除雙列動畫與厚重平面陰影感。
- [x] 手機抽屜內的主題、字級與控制按鈕改成垂直排列，不再平行擠在同一列。
- [x] 修正 `大` / `特大` 字級比例，確保特大比大更大，但保留響應式上限。
- [x] 簡報頁套用約 80% 的內容密度，內框與外框改成自適應高度；大字級與特大字級時可在內框捲動，不再裁掉內容。
- [x] 金屬風格改成拉絲金屬、銘牌邊框、暖銅高光與硬邊控制；不再沿用未來風的霓虹/玻璃語言。
- [x] 金屬風各頁背景統一成金屬首頁語言，介紹、簡報與其他頁不再跳成另一套背景。
- [x] 執行 `npm run check`、`git diff --check` 與可用範圍內的本機 HTTP 驗證。

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
- [x] 已先簡化 API 狀態列；後續第 10 節已改為移除 key 狀態框。
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

## 10. 2026-06-01 Layout 統一、去 AI 味與簡報自適應

### 任務清單

- [x] 移除控制頁的 key 狀態框，不再讓金鑰狀態佔據頁面視覺。
- [x] 將關於/影像頁的四張故事圖移到特色頁，關於頁回到影片與故事敘述本身。
- [x] 將技術頁卡片改成與特色頁一致的三欄卡片佈局，減少表格感與空白感。
- [x] 將跑馬燈改成穩定的一行狀態文字，避免手機上出現空白移動區。
- [x] 未來風的字體大小、模式與展示選取狀態補上明確 active 顏色。
- [x] 簡報頁移除手動縮放與內層拖曳/滾輪攔截，改成頁面自適應與上一頁/下一頁控制。
- [x] 修正溫暖風作用中 panel 的 `overflow`，首頁與簡報都可以正常下拉。
- [x] 將可見文案從強 AI 語氣收斂成「快速導覽、網站筆記、產品頁」語氣，保留底層安全 Action Router 架構。

### 驗收狀態

- [x] 執行 `npm run check`。
- [x] 桌機檢查：特色頁有四張圖片，關於頁不再顯示四張圖，技術頁為三欄卡片。
- [x] 桌機檢查：未來風選取「特大」有明確 active 視覺。
- [x] 手機檢查：首頁 panel 可正常下拉，key 狀態框不存在。
- [x] 簡報檢查：未來風與溫暖風 panel 可滾動，投影片本身不再有內層捲軸。

## 11. 2026-06-01 背景模糊、效能降載與金屬風格

### 任務清單

- [x] 新增第三主題 `metal`：集中在 `THEME_TOKEN_MAP`、主題切換、智慧導覽正規化與 CSS token。
- [x] 初次進站未選風格時，10 秒後自動選擇未來科技風格並進入首頁。
- [x] 所有風格都加入低成本背景光暈；主要文字容器加上背景高斯模糊，讓視線集中在內容上。
- [x] 金屬風格使用霧面深鋼、銀色高光、細方向性拉絲紋理，不新增套件。
- [x] SPA 模式停用多餘 GSAP hover / pointer drift / ticker pulse，避免開啟動態後整站變卡。
- [x] 3D 場景降低幾何與粒子數，並改成只在介紹頁可見時才以幀率上限更新。
- [x] 手機、窄螢幕與低效能模式停用全域控制 proximity feedback，減少 pointermove 重繪。

### 待驗收

- [x] 執行 `npm run check`。
- [x] 本機瀏覽器檢查：風格選擇有三個選項，10 秒未選會自動進未來風。
- [x] 本機瀏覽器檢查：未來、溫暖、金屬三種風格都保留光暈與可讀性。
- [x] 本機瀏覽器檢查：開啟動態後首頁與介紹頁不再明顯卡頓。
