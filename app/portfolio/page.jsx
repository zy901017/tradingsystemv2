'use client'
import { useEffect, useState } from 'react'

export default function Portfolio(){
  const [data,setData]=useState(null)
  const [err,setErr]=useState('')
  const [prices,setPrices]=useState({})

  useEffect(()=>{
    fetch('/api/ibkr/positions').then(r=>r.json()).then(async j=>{
      if(j.error){ setErr(j.error); return }
      setData(j.positions||[])
      const token = process.env.NEXT_PUBLIC_FINNHUB_TOKEN || ''
      async function quote(sym){
        try{
          const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${token}`)
          const j=await r.json(); return j.c || null
        }catch(e){ return null }
      }
      const out={}
      for(const p of j.positions||[]){ out[p.symbol]=await quote(p.symbol) }
      setPrices(out)
    }).catch(e=>setErr(String(e)))
  },[])

  return <div style={{padding:16}}>
    <h1>Portfolio</h1>
    {err && <div className="card">Error: {err}</div>}
    <div className="card">
      <table style={{width:'100%'}}>
        <thead><tr><th>Symbol</th><th>Qty</th><th>Avg</th><th>Mark</th><th>Live</th><th>P&L</th></tr></thead>
        <tbody>
          {(data||[]).map((p,i)=>{
            const live=prices[p.symbol]??p.mkt
            const pnl = (live - p.avg) * p.qty
            return <tr key={i}>
              <td>{p.symbol}</td><td>{p.qty}</td><td>{p.avg?.toFixed?.(2)}</td><td>{p.mkt?.toFixed?.(2)}</td><td>{live?.toFixed?.(2)}</td><td style={{color:pnl>=0?'#6cff8f':'#ff6c6c'}}>{pnl?.toFixed?.(2)}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </div>
}