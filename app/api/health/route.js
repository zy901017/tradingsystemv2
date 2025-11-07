import { NextResponse } from 'next/server'

export async function GET(){
  const env = (k)=> Boolean(process.env[k])
  return NextResponse.json({
    env: {
      FINNHUB_TOKEN: env('FINNHUB_TOKEN'),
      MASSIVE_API_KEY: env('MASSIVE_API_KEY'),
      POLYGON_API_KEY: env('POLYGON_API_KEY'),
      FLAT_FILES_ENABLED: String(process.env.FLAT_FILES_ENABLED||'').toLowerCase()==='true',
      FLAT_FILES_BASE_URL: Boolean(process.env.FLAT_FILES_BASE_URL),
      SPXA200R_CSV_URL: Boolean(process.env.SPXA200R_CSV_URL),
      IBKR_FLEX_TOKEN: env('IBKR_FLEX_TOKEN'),
      IBKR_POSITIONS_QUERY_ID: env('IBKR_POSITIONS_QUERY_ID'),
      IBKR_TRADES_QUERY_ID: env('IBKR_TRADES_QUERY_ID'),
    }
  })
}
