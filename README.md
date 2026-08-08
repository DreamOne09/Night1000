# NightBox 1000（Night1000）

給三五好友晚上的真心話大冒險題庫；題目由檔案建置並去重維護。

## 題目／建置

- 真心話前段：`question-truth-head.txt`
- 人工精選靈魂拷問／成人題：`truth-premium-pool.txt`（優先進入產出）
- 真心話後段來源池：`tail-manual-pool.txt`（精選池不足 275 題時再補）
- 大冒險模板：`build-question-bank.mjs`
- 產出：`node build-question-bank.mjs` → `question.js`、`question-meta.js`

## 題目品質

- 本機「好題／爛題」按鈕已移除：資料無法跨玩家彙總，容易造成有紀錄卻無法採取行動的假功能。
- 大冒險建置有禁句品質閘門，會拒絕同步拍手、抖音道具、連續五通電話等已淘汰模板。
- 每次改題後執行建置；腳本會檢查真心話、大冒險皆為 500 題且完全去重。

## 瀏覽統計／全球回饋

GitHub Pages 只能提供靜態檔案，不能直接執行 SQLite。若要在頁面下方顯示全球累計觀看數，有兩個實際方案：

1. **GoatCounter**：建立網站代碼後加入 `count.js`，並在 GoatCounter 設定開啟公開 visitor counter。適合只做隱私友善的瀏覽統計。
2. **Supabase**：建立 `page_views`／`question_feedback` 資料表及安全的 RPC，能同時處理觀看數與全球題目回饋；需先完成 Supabase MCP 驗證與專案選擇。

不要把 Supabase service-role key 或其他私密 API 金鑰放入 GitHub Pages；前端只能使用可公開的匿名金鑰，資料表必須配置 RLS／限權 RPC。
