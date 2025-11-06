import './styles/globals.css'

export const metadata = { title: 'TradingSystem v2.4.2', description: 'Bear/Bull regime + Options SIO + IBKR Portfolio' }

export default function RootLayout({ children }){
  return (
    <html lang="zh-CN">
      <body>
        <div className="container">
          <header className="flex" style={{justifyContent:'space-between', marginBottom:16}}>
            <a href="/" style={{fontWeight:800, fontSize:20}}>TradingSystem <span className="badge">v2.4.2</span></a>
            <nav className="flex" style={{gap:16}}>
              <a href="/portfolio">Portfolio</a>
              <a href="/scanner">Scanner</a>
              <a href="https://massive.com/docs" target="_blank">Massive Docs</a>
            </nav>
          </header>
          {children}
          <footer style={{marginTop:48, opacity:.7}} className="muted">© {new Date().getFullYear()} — Phase0</footer>
        </div>
      </body>
    </html>
  )
}
