'use client'
import { useState } from "react"
import Link from "next/link"

export default function Home(){
  const [symbol, setSymbol] = useState("SPY")
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-semibold">TradingSystem v2.4</h1>
      <div className="card space-y-3">
        <div className="text-sm text-zinc-400">输入股票或指数代码，进入聚合看板（指标/GEX/PCR/IVR/BearScore/期权/策略）：</div>
        <div className="flex gap-2">
          <input className="bg-zinc-800 rounded px-3 py-2" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} />
          <Link className="px-4 py-2 rounded bg-zinc-100 text-zinc-900 font-medium" href={`/${symbol}`}>打开</Link>
        </div>
      </div>
    </main>
  )
}
