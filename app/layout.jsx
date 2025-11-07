import './globals.css'
import Nav from '../components/Nav'

export const metadata = {
  title: 'Trading System v2.4.2',
  description: 'Options + IVR + IBKR + Breadth dashboard'
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <Nav />
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          {children}
        </div>
      </body>
    </html>
  );
}
