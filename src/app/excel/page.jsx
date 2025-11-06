async function fetchExcel() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const res = await fetch(`${base}/api/excel`, { cache: "no-store" })
  return res.json()
}

function sparkline(vals){
  if(!vals?.length) return "-"
  const blocks = "▁▂▃▄▅▆▇█"
  const min = Math.min(...vals), max = Math.max(...vals)
  const span = max - min || 1
  return vals.map(v => {
    const idx = Math.round((v - min)/span * (blocks.length-1))
    return blocks[idx]
  }).join("")
}

export default async function ExcelPage(){
  const data = await fetchExcel()
  const spark = sparkline(data.snapshot?.map(x=>x.value)||[])
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Excel 功能（前端化 · FIFO/加权均价对照）</h1>

      <section className="card">
        <div className="text-lg font-medium mb-2">持仓总览（加权平均口径）</div>
        <table className="table">
          <thead><tr><th>标的</th><th>数量</th><th>均价</th><th>现价</th><th>浮盈亏</th></tr></thead>
          <tbody>
            {data.positions_avg.map((p,i)=>(
              <tr key={i}>
                <td>{p.symbol}</td><td>{p.qty}</td><td>{p.avgCost.toFixed(2)}</td><td>{p.price.toFixed(2)}</td>
                <td className={p.unrealizedPnl>=0?"text-emerald-300":"text-rose-300"}>{p.unrealizedPnl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">持仓总览（FIFO 口径）</div>
        <table className="table">
          <thead><tr><th>标的</th><th>数量</th><th>FIFO 均价</th><th>现价</th><th>浮盈亏</th></tr></thead>
          <tbody>
            {data.positions_fifo.map((p,i)=>(
              <tr key={i}>
                <td>{p.symbol}</td><td>{p.qty}</td><td>{p.avgCost.toFixed(2)}</td><td>{p.price.toFixed(2)}</td>
                <td className={p.unrealizedPnl>=0?"text-emerald-300":"text-rose-300"}>{p.unrealizedPnl.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">组合价值每日快照</div>
        <div className="spark">{spark}</div>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">做T 提示（分级）</div>
        <table className="table">
          <thead><tr><th>标的</th><th>级别</th><th>动作</th><th>原因</th><th>建议数量</th></tr></thead>
          <tbody>
            {data.tcost.map((r,i)=>(
              <tr key={i}>
                <td>{r.symbol}</td><td>{r.level}</td><td>{r.action}</td><td>{r.reason}</td><td>{r.qtyHint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="text-lg font-medium mb-2">现金流汇总</div>
        <div className="text-sm text-zinc-400 mb-1">总计：{data.cash.total.toFixed(2)} USD</div>
        <table className="table">
          <thead><tr><th>日期</th><th>净现金流</th></tr></thead>
          <tbody>{data.cash.daily.map((r,i)=>(<tr key={i}><td>{r.day}</td><td>{r.cash.toFixed(2)}</td></tr>))}</tbody>
        </table>
      </section>
    </main>
  )
}
