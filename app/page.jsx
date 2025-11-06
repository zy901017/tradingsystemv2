export default function Home(){
  async function searchAction(formData){
    'use server'
  }
  return (
    <main className="grid">
      <div className="card">
        <h1>输入股票/指数代码</h1>
        <form action={searchAction} method="GET" actionLang="zh-CN" onSubmit={(e)=>{ e.preventDefault(); const s=e.target.symbol.value.trim().toUpperCase(); if(s) location.href='/' + s }}>
          <div className="flex">
            <input name="symbol" className="input" placeholder="例如：TSLA / SPY / QQQ / NVDA" />
            <button className="btn" type="submit">打开</button>
          </div>
        </form>
        <p className="muted" style={{marginTop:8}}>支持：链上希腊/IV/OI（Massive），IVR（FlatFiles 或 HV 代理），GEX/PCR，IBKR 持仓/盈亏（Flex）。</p>
      </div>
      <div className="card">
        <h2>使用说明</h2>
        <ul>
          <li>环境变量：IBKR_FLEX_TOKEN / IBKR_TRADES_QUERY_ID / IBKR_POSITIONS_QUERY_ID / FINNHUB_TOKEN / MASSIVE_API_KEY</li>
          <li>可选：FLAT_FILES_ENABLED / FLAT_FILES_BASE_URL / CBOE_PCR_URL_* / GEXBOT_API_KEY</li>
          <li>在 /[symbol] 查看链上“所见即所得”与策略卡片；在 /portfolio 查看 IBKR 持仓。</li>
        </ul>
      </div>
    </main>
  )
}
