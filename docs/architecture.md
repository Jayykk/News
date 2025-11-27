# 消息驅動交易輔助系統 — Phase 1 架構草案

以下以繁體中文描述整體架構，但保留程式碼模組與 DB 命名為英文，方便後續直接實作。

## 模組切分與職責

1. **Collector Layer**
   - 每個來源實作 `Collector` 介面，負責定期抓取資料、整理為 `RawNews` 統一格式。
   - 透過排程器（node-cron）觸發，結果寫入 `raw_news` table。

2. **Ingestion & Dedup Service**
   - 清洗、去除 HTML、計算 hash（來源 + url/標題 + 發布時間）。
   - 檢查 DB 避免重複，將新消息落盤。

3. **News Analysis Service**
   - 介面：`NewsAnalysisService`，輸入 `RawNews`，輸出 `NewsAnalysisResult`（JSON 結構）。
   - 先用關鍵字規則/假資料，後續可換成 LLM 或外部 NLP。
   - 寫入 `news_analysis` table（主要欄位為 JSONB）。

4. **Market Data Service**
   - 介面：`MarketDataService`，輸入資產列表，輸出 `MarketSnapshot` 假資料。
   - 易於替換成真實 API 或快取層。

5. **Signal & Scoring Service**
   - 介面：`SignalService`，負責計算 `impact_score`，依據 configurable weights。
   - 比對門檻決定是否產生 `Alert`，資料寫入 `alerts` table。

6. **Alerting / Notification Layer**
   - 介面：`AlertDispatcher`，目前支援 Webhook/REST（後續可加 LINE/Telegram）。
   - 生成人類可讀摘要與 disclaimer。

7. **API Layer (Express/Fastify)**
   - 提供健康檢查、查詢新聞/警示、重新分析等 REST endpoints。
   - Controller → Service → Repository 分層。

8. **Scheduling / Workflow Orchestrator**
   - node-cron 管理定期流程：收集 → 分析 → 市場資料 → 打分 → 推播。
   - 支援手動重新觸發（API）。

9. **Config & Secrets**
   - `config` 模組統一讀取環境變數（DB、API keys、weights、thresholds、kill switch）。

10. **Phase 2 預留：Execution Service**
    - 定義 `ProposedOrder` 介面與 `execution_jobs` table（或 `proposed_orders`）。
    - Kill switch 與完整 log，暫不下單。

## 主要資料流（文字版）

```
[Collectors] --(scheduled fetch)--> [Ingestion & Dedup] --(cleaned RawNews)--> [raw_news]
    [raw_news (unanalysed)] --(batch/cron)--> [NewsAnalysisService] --> [news_analysis]
    [news_analysis + MarketSnapshot] --(SignalService)--> [impact_score] --> [alerts]
    [alerts] --(AlertDispatcher)--> [Webhook / future bots]
API Layer
    GET news/alerts -> queries raw_news + analysis + alerts
    POST admin/re-analyze -> triggers analysis + scoring for a single news
```

## 預計 DB Tables (PostgreSQL)

### `raw_news`
- `id` (uuid, pk)
- `source` (text)
- `title` (text)
- `content` (text)
- `url` (text)
- `published_at` (timestamptz)
- `collected_at` (timestamptz, default now)
- `language` (text)
- `symbols_raw` (text[])
- `hash` (text unique)
- `ingest_status` (enum: pending/ingested/blocked)
- `created_at` / `updated_at` (timestamptz)

### `news_analysis`
- `id` (uuid, pk)
- `raw_news_id` (uuid, fk raw_news)
- `assets` (jsonb)
- `event_type` (text)
- `sentiment` (text)
- `is_rumor` (boolean)
- `is_confirmed_by_official` (boolean)
- `time_relevance` (text)
- `price_direction_hint` (text)
- `key_reasons` (text[])
- `raw_confidence` (numeric)
- `extra` (jsonb) — 可放調試/模型分數
- `created_at` / `updated_at`

### `alerts`
- `id` (uuid, pk)
- `raw_news_id` (uuid, fk)
- `analysis_id` (uuid, fk news_analysis)
- `impact_score` (numeric)
- `score_components` (jsonb)
- `severity` (text: info/warn/high/critical)
- `summary` (text)
- `dispatched_channels` (text[])
- `dispatched_at` (timestamptz)
- `status` (text: pending/dispatched/failed)
- `created_at` / `updated_at`

### `signal_configs`
- `id` (uuid, pk)
- `name` (text)
- `weights` (jsonb: w_ret_1h, w_volume, w_volatility, w_news)
- `thresholds` (jsonb: impact_alert, severe_alert)
- `is_active` (boolean)
- `created_at` / `updated_at`

### `market_snapshots`
- `id` (uuid, pk)
- `symbol` (text)
- `asset_type` (text)
- `price_now` (numeric)
- `ret_5m` / `ret_1h` (numeric)
- `volume_ratio_1h` (numeric)
- `volatility_ratio_1h` (numeric)
- `collected_at` (timestamptz)

### `proposed_orders`（Phase 2 預留）
- `id` (uuid, pk)
- `alert_id` (uuid, fk)
- `symbol` (text)
- `side` (text: buy/sell)
- `size` (numeric)
- `entry_range` (jsonb: min/max)
- `invalid_if` (jsonb: price/time/volatility constraints)
- `max_holding_minutes` (int)
- `reason` (text)
- `risk_level` (text)
- `kill_switch_snapshot` (jsonb) — 當下全局設定
- `status` (text: pending/cancelled/executed/skipped)
- `created_at` / `updated_at`

## REST API 規格（草稿）

- `GET /health`
  - Response: `{ status: "ok", timestamp }`

- `GET /news`
  - Query: `symbol?`, `limit?=50`, `source?`, `from?`, `to?`
  - Response: list of RawNews + latest analysis (join)

- `GET /news/:id`
  - Response: `{ raw: RawNews, analysis?: NewsAnalysisResult }`

- `GET /alerts`
  - Query: `symbol?`, `from?`, `to?`, `severity?`, `limit?`
  - Response: list of alerts (包含 impact_score, summary, dispatched status)

- `GET /alerts/:id`
  - Response: alert detail + related news/analysis

- `POST /admin/re-analyze-news/:id`
  - Action: 重新跑分析 + 重算 impact_score + 更新/新增 alert
  - Response: `{ status: "re-analyzed", alertId? }`

- （預留）`POST /admin/replay-signals`：重新對某時間區間重算信號

## 取捨與後續建議

- 先以單體服務 + 明確分層，後續若來源/流量增長，可將 Collector/Analysis/Signal 拆為獨立服務並以佇列 (Kafka/Redis Stream) 解耦。
- 排程 + Idempotent 設計可避免重複處理；hash 去重必須穩定。
- 所有推播附上 disclaimer：僅供資訊參考，非投資建議；自動下單需完整風控與回測。

## Phase 1 Implementation Checklist

- [ ] 建立 Node.js + TypeScript 專案骨架（Express/Fastify），包含：
  - [ ] src/server.ts，提供 GET /health
  - [ ] routes：/health, /news, /alerts
  - [ ] 基本 config 模組（讀取環境變數）

- [ ] 建立 PostgreSQL 資料表與 migration：
  - [ ] raw_news
  - [ ] news_analysis
  - [ ] market_snapshots（可選）
  - [ ] signals
  - [ ] alerts
  - [ ] signal_configs
  - [ ] proposed_orders（Phase 2 預留）

- [ ] 實作 Repository layer：
  - [ ] RawNewsRepository
  - [ ] NewsAnalysisRepository
  - [ ] SignalRepository
  - [ ] AlertRepository
  - [ ] ConfigRepository / SignalConfigRepository

- [ ] 實作 Service stub：
  - [ ] NewsAnalysisService（先用關鍵字 / 假資料）
  - [ ] MarketDataService（回傳假行情）
  - [ ] SignalService（計算 impact_score，從 config 讀權重/門檻）
  - [ ] AlertService（寫入 alerts，組簡單 summary + disclaimer）

- [ ] 實作基本 API：
  - [ ] GET /health
  - [ ] GET /news（分頁 + 可選 symbol 篩選，回 raw_news + analysis 摘要）
  - [ ] GET /news/:id
  - [ ] GET /alerts
  - [ ] GET /alerts/:id
  - [ ] POST /admin/re-analyze-news/:id

- [ ] 實作 Scheduler：
  - [ ] 排程 Collector stub：每 X 分鐘寫幾筆假 RawNews 進 DB
  - [ ] 排程分析：對未分析的 raw_news 呼叫 NewsAnalysisService
  - [ ] 排程打分 + 產生 alerts

- [ ] 加入至少 3 個 unit tests：
  - [ ] 測試 SignalService 的 impact_score 計算
  - [ ] 測試 NewsAnalysisService 的基本分類規則
  - [ ] 測試 GET /health 回 200
