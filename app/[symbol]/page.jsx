export const dynamic = 'force-dynamic'

async function fetchJSON(path){
  const res = await fetch(path, { cache: 'no-store' })
  return res.json()
}

export default async function SymbolPage({ params }){
  const symbol = (params.symbol || 'SPY').toUpperCase()
  const [chain, ivr, news] = await Promise.all([
    fetchJSON(`/api/options/chain?symbol=${symbol}`),
    fetchJSON(`/api/ivr?symbol=${symbol}`),
    fetchJSON(`/api/news?symbol=${symbol}`)
  ])
  return (
    <main className="grid">
      <div className="card">
        <h1>{symbol} <span className="badge">SIO</span></h1>
        <div className="muted">IVR: {ivr?.ivr ?? '—'} {ivr?.method ? `(${ivr.method})` : ''}</div>
        <div style={{overflow:'auto', maxHeight:560, marginTop:8}}>
          <table className="table">
            <thead><tr>
              <th>Expiry</th><th>Type</th><th>Strike</th>
              <th>Bid</th><th>Ask</th><th>Mid</th><th>OI</th>
              <th>IV%</th><th>Δ</th><th>Γ</th><th>Θ</th><th>Vega</th>
            </tr></thead>
            <tbody>
              {Array.isArray(chain?.data) && chain.data.slice(0,500).map((r,i)=>(
                <tr key={i}>
                  <td>{r.expiration || '-'}</td>
                  <td>{r.type || '-'}</td>
                  <td>{r.strike ?? '-'}</td>
                  <td>{r.bid ?? '-'}</td>
                  <td>{r.ask ?? '-'}</td>
                  <td>{r.mid ?? '-'}</td>
                  <td>{r.oi ?? '-'}</td>
                  <td>{r.iv ?? '-'}</td>
                  <td>{r.delta ?? '-'}</td>
                  <td>{r.gamma ?? '-'}</td>
                  <td>{r.theta ?? '-'}</td>
                  <td>{r.vega ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>策略卡片（示例）</h2>
        <p className="muted">根据 IVR/Greeks 选择：当 IVR 高→偏卖（IC/BWB/Calendar），IVR 低→偏买（Diagonal/Vertical）。此处展示为演示逻辑，你可按需替换。</p>
        <ul>
          <li>IVR {ivr?.ivr ?? '—'} → 方向：{(ivr?.ivr ?? 50) > 55 ? '中性~略空（卖方）' : ((ivr?.ivr ?? 50) < 45 ? '中性~略多（买方）' : '中性（观察）')}</li>
          <li>风险管理：±1σ，GEX/PCR 参照 /api/gex /api/pcr。</li>
        </ul>
      </div>
      <div className="card">
        <h2>新闻聚合</h2>
        <ul>
          {(news?.data||[]).slice(0,8).map((n,i)=>(
            <li key={i}><a href={n.url} target="_blank">{n.headline || n.title}</a> <span className="muted">({n.source || ''})</span></li>
          ))}
        </ul>
      </div>
    </main>
  )
}
