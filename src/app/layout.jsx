import "./globals.css"
import Link from "next/link"

export const metadata = { title: "TradingSystem v2.4", description: "SIO (所见即所得) · Excel parity · IBKR · Massive Options · GEX · PCR · IVR · BearScore" }

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh bg-zinc-950 text-zinc-100 antialiased">
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <nav className="flex flex-wrap gap-4 text-sm text-zinc-300">
            <Link href="/" className="hover:text-white">首页</Link>
            <Link href="/portfolio" className="hover:text-white">持仓总览</Link>
            <Link href="/excel" className="hover:text-white">Excel 功能</Link>
            <Link href="/scanner" className="hover:text-white">多周期指标</Link>
          </nav>
          {children}
        </div>
      </body>
    </html>
  )
}
