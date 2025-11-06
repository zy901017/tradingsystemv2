import { candles } from "@/lib/marketProvider"
import { ivSeriesMassive } from "@/lib/providers/options/massive"

function percentRank(arr, x){
  if(!arr || arr.length===0) return null
  const sorted = [...arr].sort((a,b)=>a-b)
  let i=0; while(i<sorted.length && sorted[i]<=x) i++
  return +(i / sorted.length * 100).toFixed(1)
}

export async function computeIVRTrue(symbol){
  // Try Massive IV series endpoint if configured
  const seriesResp = await ivSeriesMassive(symbol)
  if(seriesResp.ok && (seriesResp.series||[]).length){
    const arr = seriesResp.series.map(d=> +d.iv).filter(Number.isFinite)
    const current = arr.at(-1)
    const window = arr.slice(-252)
    const ivr = percentRank(window, current)
    return { ivr, method:"true_iv_series", current }
  }
  // Fallback: HV proxy
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
