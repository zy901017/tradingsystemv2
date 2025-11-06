export const dynamic = 'force-dynamic'

async function fetchJSON(path){ const r = await fetch(path, { cache: 'no-store' }); return r.json() }

export default async function Portfolio(){
  const data = await fetchJSON('/api/ibkr/portfolio')
  const rows = data?.positions || []
  const totalPnl = rows.reduce((a,b)=> a + (b.unrealizedPnl||0), 0)
  const mkt = rows.reduce((a,b)=> a + (b.price||0)*(b.quantity||0), 0)
  const cost = rows.reduce((a,b)=> a + (b.avgCost||0)*(b.quantity||0), 0)
  return (
    <main className="grid">
      <div className="card">
        <h1>IBKR Portfolio</h1>
        <div className="grid">
          <div className="card"><div className="muted">Market Value</div><div className="kpi">${mkt.toFixed(2)}</div></div>
          <div className="card"><div className="muted">Cost Basis</div><div className="kpi">${cost.toFixed(2)}</div></div>
          <div className="card"><div className="muted">Unrealized P/L</div><div className="kpi" style={{color: totalPnl>=0?'#7CFF9E':'#FF7C7C'}}>${totalPnl.toFixed(2)}</div></div>
        </div>
        <div style={{overflow:'auto', maxHeight:560, marginTop:8}}>
          <table className="table">
            <thead><tr><th>Symbol</th><th>Qty</th><th>Avg Cost</th><th>Price</th><th>Unrealized P/L</th></tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td>{r.symbol}</td><td>{r.quantity}</td><td>{r.avgCost?.toFixed?.(2) ?? r.avgCost}</td>
                  <td>{r.price?.toFixed?.(2) ?? r.price}</td>
                  <td style={{color:(r.unrealizedPnl||0)>=0?'#7CFF9E':'#FF7C7C'}}>{(r.unrealizedPnl||0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.fallback ? <div className="muted">来源：Trades 重构持仓</div> : <div className="muted">来源：Open Positions 官方口径</div>}
      </div>
    </main>
  )
}
