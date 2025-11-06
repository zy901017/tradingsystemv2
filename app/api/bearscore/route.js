import { NextResponse } from "next/server"
import { candles } from "@/lib/marketProvider"

function score01(x, lo, hi){ if(x==null) return .5; if(hi===lo) return .5; const s=(x-lo)/(hi-lo); return Math.max(0, Math.min(1, s)) }

export async function GET(){
  // RSP/SPY 宽度代理 + PCR + （可选）VIX 期限结构等，可扩展
  const now = Math.floor(Date.now()/1000), from = now - 120*24*3600
  const [rsp, spy] = await Promise.all([ candles('RSP','D',from,now), candles('SPY','D',from,now) ])
  const lastR = rsp?.c?.at?.(-1), lastS = spy?.c?.at?.(-1)
  const breadth = lastR && lastS ? lastR/lastS : null
  const width = score01(breadth, 0.9, 1.1)
  const bear = (1 - width) * 100  // 简化：越窄越偏熊
  return NextResponse.json({ bearScore: Math.round((bear*2-100)), width })
}
