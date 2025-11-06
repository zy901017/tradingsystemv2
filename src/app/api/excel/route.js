import { NextResponse } from "next/server"
import { buildLedger, uniqueSymbols, positionsSummary, positionsSummaryFIFO, cashflowSummary, tCostOptimizer, dailySnapshot } from "@/lib/excelParity/core"
import { candles } from "@/lib/marketProvider"

function nowSec(){ return Math.floor(Date.now()/1000) }
function daysAgo(n){ return Math.floor((Date.now() - n*24*3600*1000)/1000) }

export async function GET(req){
  const demo = [
    { date:"2025-10-01", symbol:"SPY", tier:"A", action:"买入", qty:10, price:500, fee:1, note:"demo" },
    { date:"2025-10-10", symbol:"SPY", tier:"A", action:"买入", qty:10, price:490, fee:1, note:"demo" },
    { date:"2025-10-15", symbol:"SPY", tier:"A", action:"卖出", qty:5,  price:505, fee:1, note:"demo" },
    { date:"2025-10-20", symbol:"SOFI", tier:"B", action:"买入", qty:100, price:29, fee:1, note:"demo" },
    { date:"2025-10-28", symbol:"SOFI", tier:"B", action:"分红", qty:0, price:10, fee:0, note:"demo" },
  ]

  const ledger = buildLedger(demo)
  const syms = uniqueSymbols(ledger)
  const now = nowSec(), from = daysAgo(120)
  const priceMap = {}
  for (const s of syms){
    const c = await candles(s, "D", from, now)
    const close = c?.c?.at?.(-1) || 0
    priceMap[s] = close
  }

  const posAvg = positionsSummary(ledger, priceMap)
  const posFIFO = positionsSummaryFIFO(ledger, priceMap)
  const cash = cashflowSummary(ledger)
  const tcost = tCostOptimizer(posAvg, priceMap)
  const snap = dailySnapshot(ledger, priceMap)

  return NextResponse.json({ ok:true, ledger, positions_avg: posAvg, positions_fifo: posFIFO, cash, tcost, snapshot: snap })
}
