async function fetchAll(symbol){
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const [ind, gex, pcrT, pcrE, news, chain, ivr, bs, rec] = await Promise.all([
    fetch(`${base}/api/indicators?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/gex?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/pcr?scope=total`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/pcr?scope=equity`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/news?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/options/chain?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/ivr?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/bearscore?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
    fetch(`${base}/api/strategy/recommend?symbol=${symbol}`, { cache:"no-store" }).then(r=>r.json()),
  ])
  return { ind, gex, pcrT, pcrE, news, chain, ivr, bs, rec }
}

function Bar({ value=0, min=-10, max=10, color="bg-zinc-100" }){
  const clamped = Math.max(min, Math.min(max, value))
  const pct = ((clamped - min) / (max - min)) * 100
  return (
    <div className="h-2 rounded bg-zinc-800 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Gauge({ v, bad, good }){
  const color = v<=bad? "text-rose-300" : v>=good? "text-emerald-300" : "text-zinc-200"
  return <span className={color}>{typeof v==='number'? v.toFixed(2) : "-"}</span>
}

export default async function SymbolPage({ params }){
  const symbol = (params.symbol || "SPY").toUpperCase()
  const data = await fetchAll(symbol)
  const daily = data.ind.frames?.["日K"] || {}
  const last = daily.close || 0

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">{symbol} 聚合看板</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-lg font-medium mb-2">多周期指标</div>
          <div className="grid gap-2">
            {Object.entries(data.ind.frames||{}).map(([k,v])=> (
              <div key={k} className="text-sm">{k}：{"error" in v ? "无数据" : `价 ${v.close?.toFixed?.(2)} · EMA21 ${v.EMA21?.toFixed?.(2)} · EMA55 ${v.EMA55?.toFixed?.(2)} · MACD ${v.MACD?.hist?.toFixed?.(2)} · RSI ${v.RSI?.toFixed?.(1)}`}</div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="text-lg font-medium mb-2">IVR & BearScore</div>
          <div className="text-sm">IVR：<span className="kpi">{data.ivr?.ivr ?? "-"}</span>% （方法：{data.ivr?.method}）</div>
          <div className="text-sm mt-2">BearScore：<span className="kpi">{Math.round(data.bs?.score ?? 0)}</span> · 宽度：<span className="kpi">{Math.round(data.bs?.width ?? 0)}%</span>（{data.bs?.meta?.breadthReal? "广度=SPXA200R":"广度=RSP/SPY 代理"}）</div>
          <div className="mt-2"><Bar value={(data.bs?.score||0)} min={-100} max={100} color="bg-zinc-100" /></div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-lg font-medium mb-2">GEX 关键位</div>
          <div className="text-sm mb-2">{data.gex?.ok? "已获取数据" : `未启用或错误：${data.gex?.error||"-"}`}</div>
          <div className="text-xs text-zinc-400">（在连接你的 GEX 模型字段后，这里会显示上/下关键位与现价的刻度条）</div>
          <div className="mt-2"><Bar value={50} min={0} max={100} color="bg-zinc-700" /></div>
        </div>

        <div className="card">
          <div className="text-lg font-medium mb-2">PCR 热度</div>
          <div className="text-sm">Total：<Gauge v={data.pcrT?.series?.slice?.(-1)?.[0]?.v} bad={0.9} good={0.6} /> · Equity：<Gauge v={data.pcrE?.series?.slice?.(-1)?.[0]?.v} bad={0.9} good={0.6} /></div>
          <div className="text-xs text-zinc-400">绿色=偏乐观，红色=偏恐慌；阈值可在代码中调整。</div>
        </div>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">新闻聚合（近14天）</div>
        <ul className="list-disc ml-6">
          {(data.news?.news||[]).slice(0,8).map((n,i)=>(
            <li key={i}><span className="text-sm">{n.headline || n.summary || "[无标题]"}</span></li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">期权链（Δ/Γ/Θ/Vega/IV/OI/Bid/Ask）</div>
        <div className="text-sm text-zinc-400 mb-2">Provider: {data.chain?.provider || "-"}</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>K</th><th>Type</th><th>Bid</th><th>Ask</th><th>IV</th><th>Δ</th><th>Γ</th><th>Θ</th><th>Vega</th><th>OI</th></tr></thead>
            <tbody>
              {(data.chain?.data||[]).slice(0,30).map((r,i)=>(
                <tr key={i}>
                  <td>{r.strike}</td><td>{r.type}</td>
                  <td>{r.bid?.toFixed?.(2)}</td><td>{r.ask?.toFixed?.(2)}</td>
                  <td>{(r.iv*100)?.toFixed?.(1)}%</td>
                  <td>{r.delta?.toFixed?.(2)}</td><td>{r.gamma?.toFixed?.(4)}</td><td>{r.theta?.toFixed?.(2)}</td><td>{r.vega?.toFixed?.(2)}</td>
                  <td>{r.oi ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">策略建议（具体腿 · 所见即所得）</div>
        <ul className="list-disc ml-6 text-sm">
          {(data.rec?.strategies||[]).map((s,i)=>(
            <li key={i} className="mb-2">
              <div className="font-medium">{s.name}</div>
              <div>组合 Δ {s.combo?.delta?.toFixed?.(2)} · Γ {s.combo?.gamma?.toFixed?.(4)} · Θ {s.combo?.theta?.toFixed?.(2)} · Vega {s.combo?.vega?.toFixed?.(2)} · 净{(s.credit>0?'收款':'借记')} {(Math.abs(s.credit||s.net||s.debit||0)).toFixed(2)}</div>
              <div className="mt-1">腿：</div>
              <ul className="ml-6 list-disc">
                {(s.legs||[]).map((l,j)=>(
                  <li key={j}>{l.qty>0?'+':'−'}{Math.abs(l.qty)} × {l.type}{l.K} · Δ {l.delta?.toFixed?.(2)} · Γ {l.gamma?.toFixed?.(4)} · Θ {l.theta?.toFixed?.(2)} · Vega {l.vega?.toFixed?.(2)}</li>
                ))}
              </ul>
              <div className="mt-1">入场：IVR≥50 且 BearScore≥0；平仓：获利 50–65% 或短腿被触及；调仓：IVR 跌破 30 或趋势转弱（EMA21<EMA55）。</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
