import './globals.css'

export const metadata = {
  title: 'Trading System v2.4.2',
  description: 'Options + IVR + IBKR + Breadth dashboard'
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
