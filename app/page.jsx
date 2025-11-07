import Link from 'next/link'

export default function Home(){
  return (
    <main>
      <h1>Trading System v2.4.2</h1>
      <p>欢迎。上方导航可直接输入股票代码进入功能页，或从下面快速入口进入。</p>
      <div className="card">
        <h3>快速入口</h3>
        <ul>
          <li><Link href="/SPY">SPY</Link>、<Link href="/QQQ">QQQ</Link>、<Link href="/AAPL">AAPL</Link></li>
          <li><Link href="/portfolio">Portfolio（IBKR 持仓）</Link></li>
          <li><Link href="/health">健康检查（环境变量与接口连通性）</Link></li>
        </ul>
      </div>
      <div className="card">
        <h3>功能说明</h3>
        <ul>
          <li>期权链：显示 Massive 原始希腊（Δ/Γ/Θ/Vega/IV/OI/Vol）。</li>
          <li>IVR：优先读取 Flat Files 真·IVR，回退 Finnhub 30D HV 百分位。</li>
          <li>BearScore：手动 SPX/NDX → CSV → RSP/SPY 代理。</li>
          <li>新闻与指标：Finnhub 新闻 14 天、EMA/RSI/MACD/VWAP。</li>
        </ul>
      </div>
    </main>
  )
}
