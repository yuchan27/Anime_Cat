# Technical Reference - Cat Future Lab

## 1. 技術堆疊

- `Anime.js 3.2.2`
  - Hero 進場、stagger、訊號路徑、微互動循環。
- `Three.js 0.164.x`
  - 3D 場景、粒子軌道、模式切換、`requestAnimationFrame`。
- `GSAP 3.12.x + ScrollTrigger`
  - 視差、卡片浮動、hover tilt、section 進場、LAB NOTES 轉場。
- `Intersection Observer`
  - 區塊 reveal 觸發。
- `CSS Animation/Transition`
  - loader、按鈕、卡片與基礎動態。

## 2. 模組化結構（重要備註）

程式以模組化拆分，不把邏輯塞進單一大檔。

- `assets/js/main.js`：初始化總控。
- `assets/js/animations.js`：Anime.js 時間軸與元件動畫。
- `assets/js/scene.js`：Three.js 場景與互動控制。
- `assets/js/effects.js`：GSAP/ScrollTrigger 視覺效果。
- `assets/js/notes.js`：LAB NOTES 網頁投影片（左右滑動/縮放/拖曳）。
- `assets/js/cursor.js`：貓咪光標與熱點對位。
- `assets/js/ui.js`：聊天室、天氣、狀態區、下載報告。
- `assets/js/api.js`：前端 API client。
- `assets/js/a11y.js`：reduced-motion、reveal observer、無障礙輔助。
- `server/server.js`：Server Proxy API 與靜態檔案服務。

## 3. API 設計

- `POST /api/ai-navigator`
  - 前端送文字到 server，由 server 產生安全 JSON action。
  - 模型 fallback chain：`gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash`。
- `GET /api/weather?lat=...&lng=...`
  - 走 Open-Meteo，即時溫度/風速。
- `GET /api/env-status`
  - 檢查是否已載入 API key 與模型清單。

## 4. 安全與金鑰策略

- API key 只存在 `.env`（server 端）。
- client 不持有金鑰，也不直接打第三方模型 API。
- 若上游失敗，server 回傳安全 fallback，前端仍可完整展示流程。

## 5. 視覺與互動規劃

- 貓咪元素作為訊號與角色，不把整站做成單一大貓造型。
- Hero 主圖與揮手訊號分離，避免覆蓋主圖資訊。
- 自訂光標改為「熱點對齊」，修正真實滑鼠與貓咪光標偏移。
- LAB NOTES 改為網頁化簡報體驗：
  - 左右切換（按鈕/鍵盤/滾輪/拖曳）
  - 可縮放（zoom slider）

## 6. 無障礙與 SEO

- 語意結構：`header/nav/main/section/article/footer`。
- `aria-live`、`aria-pressed`、可見 focus ring、reduced-motion。
- SEO：`title`、`description`、`canonical`、OG、Twitter Card、JSON-LD。

## 7. 本地驗證流程

```powershell
cd "C:\Code\animation_design\cat-future-lab"
npm run check
```

短時 health check（自動啟停，不常駐）：

1. 啟動 `node server/server.js`
2. 驗證 `http://localhost:5177/`、`/api/env-status`
3. 自動停止 server，確認 Port 已釋放

## 8. 參考來源

- Anime.js v3 docs: https://animejs.com/v3/documentation/
- Anime.js timeline docs: https://animejs.com/documentation/timeline
- Three.js docs: https://threejs.org/docs/
- GSAP docs: https://gsap.com/docs/
- Remotion docs: https://www.remotion.dev/docs/
- Open-Meteo API docs: https://open-meteo.com/en/docs
