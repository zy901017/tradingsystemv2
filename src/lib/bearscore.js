// Refined BearScore: add VIX/VIX3M + SPXA200R CSV if provided
import { candles } from "@/lib/marketProvider"
import { fetchPCR } from "@/lib/providers/pcr"

function pctRank(arr, x){
  if(!arr.length) return 0.5
  const sorted = [...arr].sort((a,b)=>a-b)
  let i=0; while(i<sorted.length && sorted[i]<=x) i++
  return i / sorted.length
}
async function safeC(sym){ try{ const now = Math.floor(Date.now()/1000), from = now - 500*24*3600; const r = await candles(sym, "D", from, now); return r?.c||[] }catch{ return [] } }

async function spxa200rSeries(){
  const url = process.env.SPXA200R_CSV_URL
  if(!url) return []
  try{
    const res = await fetch(url, { next: { revalidate: 0 } })
    const text = await res.text()
    const lines = text.trim().split(/\r?\n/)
    const rows = lines.slice(1).map(x=> x.split(/,|\t|\s*\|\s*/))
    // assume last column is value %
    return rows.map(r=> +String(r.at(-1) || "0").replace(/[^0-9.\-]/g,"")).filter(Number.isFinite)
  }catch{ return [] }
}

export async function computeBearScore(symbol="SPY"){
  const spx = await safeC("SPY")
  const rsp = await safeC("RSP")
  const hyg = await safeC("HYG")
  const lqd = await safeC("LQD")
  const dxy = await safeC("DXY")
  const vix = await safeC("VIX")
  const vix3m = await safeC("VIX3M")
  const breadthSeries = await spxa200rSeries()

  const pcrT = await fetchPCR("total"); const pcrE = await fetchPCR("equity")
  const pcrSeries = (pcrT.ok? pcrT.series: []).map(x=> +x.v).filter(Number.isFinite)

  // Factors
  const breadthProxy = (spx.length && rsp.length) ? (rsp.at(-1)/spx.at(-1) - 1) : 0
  const breadthReal = breadthSeries.length ? (breadthSeries.at(-1)-50)/50 : null // 50%为中性
  const breadth = breadthReal ?? breadthProxy

  const credit = (hyg.length && lqd.length) ? (hyg.at(-1)/lqd.at(-1) - 1) : 0
  const dollar = dxy.length ? (dxy.at(-1) / (dxy.at(-30)||1) - 1) : 0

  let term = 0
  if(vix.length && vix3m.length){
    const v = vix.at(-1), v3 = vix3m.at(-1)
    term = (v - v3) / (v3 || 1) // <0 => backwardation（偏空）
  }

  const pcrPctl = pcrSeries.length ? pctRank(pcrSeries.slice(-252), pcrSeries.at(-1)) : 0.5

  // Normalize (负为偏空)
  const zBreadth = -breadth
  const zCredit = -credit
  const zDollar = -dollar
  const zTerm = term<0 ? Math.abs(term) : -term // backwardation => 负；contango => 正
  const zPCR = (pcrPctl - 0.5) * 2 * -1

  const factors = [zBreadth, zCredit, zDollar, zTerm, zPCR].filter(x=> Number.isFinite(x))
  const mean = factors.length? factors.reduce((a,b)=>a+b,0)/factors.length : 0
  const std = Math.sqrt(factors.reduce((a,b)=>a+(b-mean)**2,0)/(factors.length||1)) || 1
  const score = Math.max(-100, Math.min(100, -mean*100))
  const width = Math.max(0, Math.min(100, (1- Math.min(std,1))*100))

  return { score, width, components:{ zBreadth, zCredit, zDollar, zTerm, zPCR }, meta:{ breadthReal: !!breadthSeries.length } }
}
