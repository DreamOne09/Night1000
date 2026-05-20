# NightBox 1000（Night1000）

給三五好友晚上的真心話大冒險題庫；題目由檔案建置並去重維護。

## 題目／建置

- 真心話前段：`question-truth-head.txt`
- 真心話後段來源池：`tail-manual-pool.txt`（由上往下取去重後 275 題）
- 大冒險模板：`build-question-bank.mjs`
- 產出：`node build-question-bank.mjs` → `question.js`、`question-meta.js`

## 好題／爛題紀錄

- **目前機制**：用瀏覽器的 `localStorage` 記「好題／爛題」的題目索引（0 起算），可一鍵匯出 JSON；資料**留在本機、不上傳**，也不會占用伺服器。
- **SQLite？**GitHub Pages 只能放靜態檔案，**沒有伺服器可跑 SQLite**。若要 SQLite，需要改用：桌面／原生 App（本機資料庫）、自架後端 API，或使用 Firebase／Supabase 等雲服務。若在純瀏覽器內強行用 SQLite，通常會改成內嵌 [sql.js](https://sql.js.org/)（Wasm），體積與複雜度都会上升；資料仍多半只存在于使用者這台裝置，除非再接同步。
