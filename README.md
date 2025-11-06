# TradingSystem v2.4.2 (Full)
- Next.js App Router
- IBKR Flex (Trades + Positions / fallback Trades-only)
- Massive Options snapshot (SIO) + IVR (Flat Files hook or HV proxy)
- Indicators/News/GEX/PCR/BearScore
- SSE stream scaffold

## Env Vars
IBKR_FLEX_TOKEN, IBKR_TRADES_QUERY_ID, IBKR_POSITIONS_QUERY_ID (or IBKR_FLEX_QUERY_ID)
FINNHUB_TOKEN, MASSIVE_API_KEY
Optional: FLAT_FILES_ENABLED, FLAT_FILES_BASE_URL, CBOE_PCR_URL_TOTAL, CBOE_PCR_URL_EQUITY, GEXBOT_API_KEY

## Dev
npm i
npm run build
npm start
