'use client'
import { useState, useEffect } from "react"

export default function Scanner(){
  const [symbol, setSymbol] = useState("SPY")
  const [data, setData] = useState(null)
  useEffect(()=>{ fetch(`/api/indicators?symbol=${symbol}`).then(r=>r.json()).then(setData) }, [symbol])
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">多周期指标</h1>
      <div className="card space-y-3">
        <input className="bg-zinc-800 rounded px-3 py-2" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/>
        {!data ? <div>加载中…</div> : (
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(data.frames||{}).map(([k,v])=> (
              <div key={k} className="border border-zinc-800 rounded p-3">
                <div className="text-sm text-zinc-400 mb-1">{k}</div>
                {"error" in v ? <div className="text-rose-300">{v.error}</div> :
                  <div className="text-sm">
                    价：{v.close?.toFixed?.(2)} · EMA21 {v.EMA21?.toFixed?.(2)} · EMA55 {v.EMA55?.toFixed?.(2)} · SMA200 {v.SMA200?.toFixed?.(2)}<br/>
                    MACD {v.MACD?.hist?.toFixed?.(2)} · RSI {v.RSI?.toFixed?.(1)} · K {v.KDJ?.K?.toFixed?.(1)} · D {v.KDJ?.D?.toFixed?.(1)} · VWAP {v.VWAP?.toFixed?.(2)}
                  </div>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
