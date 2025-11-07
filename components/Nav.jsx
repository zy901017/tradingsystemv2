'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Nav(){
  const [ticker, setTicker] = useState('')
  const goto = (e)=>{
    e.preventDefault()
    const sym = (ticker||'').trim().toUpperCase()
    if(sym) window.location.href = `/${encodeURIComponent(sym)}`
  }
  return (
    <header style={{position:'sticky',top:0,zIndex:10,background:'#0f1115',borderBottom:'1px solid #23262d'}}>
      <nav style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px'}}>
        <Link href="/" style={{fontWeight:700}}>Trading System</Link>
        <Link href="/SPY">SPY</Link>
        <Link href="/QQQ">QQQ</Link>
        <Link href="/portfolio">Portfolio</Link>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <form onSubmit={goto}>
            <input placeholder="输入代码，例如 AAPL" value={ticker} onChange={e=>setTicker(e.target.value)} style={{width:180}}/>
            <button type="submit" style={{marginLeft:8}}>Go</button>
          </form>
        </div>
      </nav>
    </header>
  )
}
