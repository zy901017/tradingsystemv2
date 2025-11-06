// Flexible Massive (Polygon rebrand) provider
const BASE = process.env.MASSIVE_BASE_URL || "https://api.massive.com"

// Map varying field names to a canonical shape
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

export async function chainMassive(symbol, expiry){
  const key = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY
  if(!key) return { ok:false, error:"MASSIVE_API_KEY 缺失" }
  const qs = new URLSearchParams({ symbol })
  if(expiry) qs.set("expiry", expiry)
  const url = `${BASE}/options/chain?${qs.toString()}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 0 } })
  if(!res.ok) return { ok:false, error:`Massive 请求失败 ${res.status}` }
  const json = await res.json()
  const rows = (json.results || json.data || json || []).map(mapOption).filter(Boolean)
  return { ok:true, data: rows }
}

// Optional: daily IV series endpoint template for true IVR
export async function ivSeriesMassive(symbol){
  const key = process.env.MASSIVE_API_KEY || process.env.POLYGON_API_KEY
  const template = process.env.MASSIVE_IV_SERIES_URL // e.g. https://api.massive.com/options/iv-series?symbol={symbol}&tenor=30
  if(!key || !template) return { ok:false, error:"缺 MASSIVE_API_KEY 或 MASSIVE_IV_SERIES_URL" }
  const url = template.replace("{symbol}", symbol)
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, next: { revalidate: 0 } })
  if(!res.ok) return { ok:false, error:`Massive IV series 请求失败 ${res.status}` }
  const json = await res.json()
  // 期望 json:{ series:[{date:'YYYY-MM-DD', iv:0.34}, ...] }
  return { ok:true, series: json.series || json.results || [] }
}
