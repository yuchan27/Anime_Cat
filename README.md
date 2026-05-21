# Cat Future Lab

一頁式互動網站，主軸是「動畫風格貓咪 + 動態互動實驗室」。
核心技術：`Anime.js`、`Three.js`、`GSAP`、`Server Proxy API`、`Remotion`（素材區）。

## 專案路徑

- Workspace：`C:\Code\animation_design`
- App：`C:\Code\animation_design\cat-future-lab`

## 啟動方式

```powershell
cd "C:\Code\animation_design\cat-future-lab"
npm start
```

預設網址：`http://localhost:5177/`

伺服器有內建 Port retry，若 `5177` 被占用會自動往上找可用 Port，避免 `EADDRINUSE` 直接中斷。

## 環境變數

在 `cat-future-lab\.env` 設定：

```env
PORT=5177
GOOGLE_AI_API_KEY=
GOOGLE_AI_MODELS=gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash
```

說明：
- API key 只放 server 端 `.env`，前端不暴露。
- 聊天模型支援 fallback chain（2.5 -> 2.0 -> 1.5）。

## 快速檢查

```powershell
cd "C:\Code\animation_design\cat-future-lab"
npm run check
```

## 主要功能

- Hero 區塊優化排版與進場動畫。
- 自訂貓咪光標（含動畫），並修正光標熱點偏移。
- Three.js 互動場景（模式切換、粒子與幾何動態）。
- GSAP 視差、浮動卡片、hover tilt、scroll 進場效果。
- API 區塊：`/api/chat`、`/api/weather`、`/api/env-status`。
- 城市天氣支援多城市選單與城市當地時間顯示。
- LAB NOTES：網頁化簡報，支援左右切換、拖曳、鍵盤控制與縮放。

## 文件

- 技術參考：`C:\Code\animation_design\cat-future-lab\TECHNICAL_REFERENCE.md`
