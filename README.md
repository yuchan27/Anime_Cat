# Cat Future Lab

貓咪互動動畫期末作品。網站整合 `Anime.js`、`Three.js`、Server Proxy API、即時天氣資料、Remotion 素材規劃、SEO 與無障礙設定。

## 重要交接

目前原始工作區在 OneDrive：

```text
C:\Users\wuwu6\OneDrive\桌面\homework\網路動畫設計
```

因為 OneDrive 曾造成 Git lock / 權限問題，後續建議複製整個 repo 到：

```text
C:\Code\CatFutureLab
```

請複製整個根目錄，不要只複製 `cat-future-lab/`。根目錄包含 `.git`、`AGENTS.md`、`WORKFLOW.md`、`README.md` 與 `.gitignore`。

## 快速啟動

```powershell
cd "C:\Code\CatFutureLab\cat-future-lab"
npm start
```

開啟：

```text
http://localhost:5177/
```

如果 port 被占用：

```powershell
$env:PORT=5180
npm start
```

## API 設定

建立 `cat-future-lab\.env`：

```env
PORT=5177
GOOGLE_AI_API_KEY=
GOOGLE_AI_MODEL=gemini-2.0-flash
```

`.env` 已由 `.gitignore` 排除，不要提交真實 API key。

API 路由：

```text
POST /api/chat
GET  /api/weather?lat=25.033&lng=121.565
```

## 專案結構

```text
cat-future-lab/
  index.html
  server/server.js
  assets/images/cat-lab-guide.png
  assets/css/styles.css
  assets/js/main.js
  assets/js/animations.js
  assets/js/ui.js
  assets/js/scene.js
  assets/js/api.js
  assets/js/a11y.js
  assets/remotion/cat-loop-poster.svg
  remotion/
```

模組化備註：程式必須使用模組化結構，動畫控制、Three.js 場景、API 呼叫、UI 狀態、無障礙互動與 server routes 應依責任拆分，不要集中在單一大型檔案。

視覺備註：貓咪是導覽符號與互動元素，例如生成主視覺、貓耳幾何、尾巴軌跡、貓眼 HUD 與 meow signal；整體風格仍是未來互動動畫實驗室，不做成完整貓咪主題頁。

## Figma

設計稿：

```text
https://www.figma.com/design/KHTxo4D1lTXtSteplkjcCp
```

`cat-future-lab/FIGMA_BRIEF.md` 保存設計方向與 required sections。

## Remotion

Remotion 僅作素材產線，主網站不依賴影片成品才能運作。

```powershell
cd "C:\Code\CatFutureLab\cat-future-lab\remotion"
npm install
npm run studio
npm run render:loop
```

輸出目標：

```text
cat-future-lab/assets/remotion/
```

影片成品已被 `.gitignore` 排除。

## 驗證

```powershell
cd "C:\Code\CatFutureLab\cat-future-lab"
npm run check
node --check assets/js/main.js
node --check assets/js/animations.js
node --check assets/js/ui.js
node --check assets/js/scene.js
node --check assets/js/api.js
node --check assets/js/a11y.js
```

人工驗收：

- 375px、768px、1440px RWD。
- Three.js canvas 非空白。
- AI chat 在沒有 key 時有 fallback。
- Weather API 正常或 fallback。
- 鍵盤可操作所有互動元件。
- SEO meta、Open Graph、Twitter Card、JSON-LD 完整。
- 無障礙包含 focus ring、ARIA、alt、aria-live、reduced motion。

## Git

搬到 `C:\` 後先執行：

```powershell
cd "C:\Code\CatFutureLab"
git status --short
```

每次穩定更新後建立 focused commit。不要提交 `.env`、`node_modules/`、Remotion 影片輸出或暫存 QA 檔案。
