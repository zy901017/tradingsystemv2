import { candles } from "@/lib/marketProvider"

function percentRank(arr, x){
  if(!arr?.length) return null
  const sorted = [...arr].sort((a,b)=>a-b)
  let i=0; while(i<sorted.length && sorted[i]<=x) i++
  return +(i / sorted.length * 100).toFixed(1)
}

async function tryFlatFiles(symbol){
  if(process.env.FLAT_FILES_ENABLED !== "true") return null
  const base = process.env.FLAT_FILES_BASE_URL
  if(!base) return null
  try{
    const url = `${base}/${symbol}/ivr_30d_atm_1y.json`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if(!res.ok) return null
    const json = await res.json()
    if(typeof json.ivr === "number") return { ivr: json.ivr, method:"flat_files", current: json.current }
    return null
  }catch{ return null }
}

export async function computeIVR(symbol){
  const flat = await tryFlatFiles(symbol)
  if(flat) return flat

  // Fallback：HV(30) 百分位代理
  const now = Math.floor(Date.now()/1000), from = now - 500*24*3600
  const c = await candles(symbol, "D", from, now)
  const close = c?.c || []
  if(close.length < 60) return { ivr:null, method:"proxy", note:"历史不足" }
  const r = []
  for(let i=1;i<close.length;i++) r.push(Math.log((close[i]+1e-9)/(close[i-1]+1e-9)))
  const hv30 = []
  for(let i=30;i<=r.length;i++){
    const win = r.slice(i-30,i)
    const mean = win.reduce((a,b)=>a+b,0)/win.length
    const sd = Math.sqrt(win.reduce((a,b)=>a+(b-mean)*(b-mean),0)/win.length)
    hv30.push(sd * Math.sqrt(252) * 100)
  }
  const current = hv30.at(-1)
  const pct = percentRank(hv30.slice(-252), current)
  return { ivr:pct, method:"proxy", current }
}
