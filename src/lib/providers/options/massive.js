const BASE = process.env.MASSIVE_BASE_URL || "https://api.massive.com"

function mapOption(raw){
  if(!raw) return null
  const f = (k, alt=[]) => {
    if(raw[k] !== undefined) return raw[k]
    for(const a of alt){ if(raw[a] !== undefined) return raw[a] }
    return null
  }
  return {
    symbol: f("symbol", ["ticker","contract","option_symbol"]),
    expiration: f("expiration_date", ["expiry","expiration","exp_date"]),
    strike: +f("strike", ["strike_price"]),
    type: (f("type", ["option_type","right"])||"").toUpperCase().startsWith("C") ? "C" : "P",
    bid: +f("bid", ["bid_price","best_bid"]),
    ask: +f("ask", ["ask_price","best_ask"]),
    mid: (()=>{ const b=+f("bid",["bid_price","best_bid"]); const a=+f("ask",["ask_price","best_ask"]); return (Number.isFinite(b)&&Number.isFinite(a))? (b+a)/2 : null })(),
    oi: +f("open_interest", ["oi"]),
    iv: +f("implied_volatility", ["iv","implied_vol"]),
    delta: +f("delta", ["greeks_delta"]),
    gamma: +f("gamma", ["greeks_gamma"]),
    theta: +f("theta", ["greeks_theta"]),
    vega: +f("vega", ["greeks_vega"]),
  }
}

export async function chainMassive(symbol){
  const key = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY
  if(!key) return { ok:false, error:"MASSIVE_API_KEY 缺失" }
  // 使用 v3 snapshot 端点（链）
  const url = `${BASE}/v3/snapshot/options/${encodeURIComponent(symbol)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 0 } })
  if(!res.ok) return { ok:false, error:`Massive 请求失败 ${res.status}` }
  const json = await res.json()
  const arr = json?.results || json?.data || json || []
  const rows = (Array.isArray(arr)?arr:[]).map(mapOption).filter(Boolean)
  return { ok:true, data: rows }
}
