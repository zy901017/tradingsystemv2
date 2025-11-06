async function fetchPortfolio(){
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${base}/api/ibkr/portfolio`, { cache: "no-store" })
  return res.json()
}
export default async function Portfolio(){
  const data = await fetchPortfolio()
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">持仓总览（IBKR）</h1>
      <section className="card">
        <table className="table">
          <thead><tr><th>标的</th><th>数量</th><th>成本</th><th>现价</th><th>浮盈亏</th></tr></thead>
          <tbody>
          {(data.positions||[]).map((p,i)=>(
            <tr key={i}>
              <td>{p.symbol}</td><td>{p.quantity}</td><td>{p.avgCost?.toFixed?.(2)}</td>
              <td>{p.price?.toFixed?.(2)}</td>
              <td className={p.unrealizedPnl>=0?"text-emerald-300":"text-rose-300"}>{p.unrealizedPnl?.toFixed?.(2)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
