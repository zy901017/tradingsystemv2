# Phase0 v2.4.2 FULL Overlay — One‑Shot Install

This overlay adds **everything we discussed** to your existing v2.4.2 app:
- **IBKR Flex** (Trades + Positions) ingestion (server API) and **Portfolio UI** (`/portfolio`).
- **Massive** (Polygon→Massive) options chain **"what-you-see-is-what-you-get" Greeks**.
- **True IVR (30D ATM, 1y percentile)** via **GitHub Actions** + Massive REST (no CDN required).
- **IVR fallback** to **HV(30) 1y percentile** if flat-files missing (always available).
- **BearScore / Width** with 3 priorities: **Manual input** (front-end), **SPXA200R CSV**, fallback **RSP/SPY proxy**;
  optional dials for **CBOE PCR (Total & Equity)**.
- **Indicators** (EMA/MA/MACD/RSI/VWAP) from Finnhub candles.
- **News aggregation** from Finnhub company-news.
- All envs summarized; **build fix** for missing `globals.css` & `@/lib/utils`.

## Install (5 steps)
1. **Unzip** this overlay into the **repo root** (same level as `app/`, `src/`). Allow overwrite if asked.
2. Commit & push to GitHub.
3. On GitHub → Settings → **Secrets and variables → Actions**, add:
   - `MASSIVE_API_KEY` = your Massive API key
   - (optional) `IBKR_FLEX_TOKEN`, `IBKR_TRADES_QUERY_ID`, `IBKR_POSITIONS_QUERY_ID`
4. On Vercel → Project → Settings → **Environment Variables**, set all from `.env.example` (below).
5. Go to GitHub **Actions**, select **Build True IVR (30D ATM)** → **Run workflow** on `main` to produce first true IVR files.
   Your site will use `/api/ivr` (reads flat-files first, else HV proxy).

## Key URLs
- `/<SYMBOL>`: full symbol view (Greeks chain, IVR, indicators, news, strategies, Manual Breadth).
- `/portfolio`: IBKR holdings + live P&L via Finnhub; ties into strategy hints.
- `/api/ivr?symbol=TSLA`: true IVR (flat-files) else HV proxy with `{ "method": "proxy" }`.
- `/api/ivr/register` (POST `{symbol}`): append symbol to `precomputed/_watchlist.txt` so nightly job computes true IVR.
- `/api/bearscore?spx_pct=55.1&ndx_pct=62.0`: manual breadth → width + BearScore (source: manual).

## Nightly true IVR
- `.github/workflows/ivr.yml` + `scripts/build_ivr_series.py` compute **30D ATM IV** by total-variance interpolation between nearest expiries with **|Δ-0.5|** contracts, push:
  - `precomputed/<SYM>/ivr_30d_atm_series.json`
  - `precomputed/<SYM>/ivr_30d_atm_1y.json` (read by `/api/ivr` when `FLAT_FILES_ENABLED=true`).
- `scripts/collect_symbols.py` merges **IBKR** tickers + local **watchlist** → `IVR_SYMBOLS` env for the run.

## Front-end Manual Breadth
On any `/<symbol>` page you'll see a card letting you input **SPX% & NDX% >200DMA**; those are stored in `localStorage` and pushed into `/api/bearscore` to derive Width & BearScore.

---

# ENV Quickstart
Copy these to Vercel. Values marked “optional” can be skipped.

```
# ==== Core market & options ====
FINNHUB_TOKEN=xxxxx
MASSIVE_API_KEY=xxxxx
MASSIVE_BASE_URL=https://api.massive.com

# ==== IBKR Flex ====
IBKR_FLEX_TOKEN=xxxxx
# Either single report OR both of the following two reports
# IBKR_FLEX_QUERY_ID=xxxxxxxxxxxxxxxx        # (optional) one report that includes Trades+Positions
IBKR_TRADES_QUERY_ID=xxxxxxxxxxxxxxxx        # (optional) trades-only
IBKR_POSITIONS_QUERY_ID=xxxxxxxxxxxxxxxx     # (optional) positions-only

# ==== True IVR flat-files ====
FLAT_FILES_ENABLED=true
# Use GitHub Raw as "pseudo-CDN" (public repo):
FLAT_FILES_BASE_URL=https://raw.githubusercontent.com/<owner>/<repo>/main/precomputed

# ==== Breadth / PCR / GEX (optional) ====
SPXA200R_CSV_URL=https://.../spxa200r.csv    # optional real breadth CSV (latest at bottom)
CBOE_PCR_URL_TOTAL=https://.../pcr_total.csv # optional
CBOE_PCR_URL_EQUITY=https://.../pcr_equity.csv
GEXBOT_API_KEY=xxxxx                         # optional
GEXBOT_URL_TEMPLATE=https://api.gexbot.com/{{symbol}}/classic/full/majors?key={{key}}

# ==== GitHub Contents API for watchlist registration ====
GH_REPO=<owner>/<repo>                       # e.g. zhouyue/tradingsystemv2
GH_CONTENT_TOKEN=ghp_...                     # fine-grained PAT, repository contents:write

# ==== App base (optional) ====
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

---

# Notes
- This overlay does **not** erase your project; it only adds/repairs the modules we need.
- If your repo is **private**, either make it public or switch `FLAT_FILES_BASE_URL` to your Vercel static path (see earlier chats).
- Strategy suggestions in `/<symbol>` are rule-based (IVR + trend + breadth) and **never sell naked**; legs include raw chain Greeks + net debit/credit and management rules (open/close/roll).

