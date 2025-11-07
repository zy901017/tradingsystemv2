'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import '../globals.css'
import { fmt } from '../../src/lib/utils'

async function getJSON(url){
  const r = await fetch(url, { cache:'no-store' })
  if(!r.ok){
    let msg
    try{ msg = await r.text() }catch{ msg = r.statusText }
    throw new Error(msg||`HTTP ${r.status}`)
  }
  return r.json()
}

export default function SymbolPage({ params }){
  const symbol = (params.symbol||'').toUpperCase()
  const [ivr,setIVR]=useState(null)
  const [chain,setChain]=useState([])
  const [news,setNews]=useState([])
  const [ind,setInd]=useState(null)
  const [manualSPX,setManualSPX]=useState('')
  const [manualNDX,setManualNDX]=useState('')
  const [bear,setBear]=useState(null)
  const [err,setErr]=useState('')

  useEffect(()=>{
    let alive=true
    ;(async ()=>{
      try{
        const [ivrJ, chJ, nJ, indJ] = await Promise.all([
          getJSON(`/api/ivr?symbol=${symbol}`),
          getJSON(`/api/options/massive?symbol=${symbol}`),
          getJSON(`/api/news?symbol=${symbol}`),
          getJSON(`/api/indicators?symbol=${symbol}`)
        ])
        if(!alive) return
        setIVR(ivrJ); setChain(chJ.options||[]); setNews(nJ.news||[]); setInd(indJ||null)
      }catch(e){ setErr(String(e)) }
    })()
    return ()=>{ alive=false }
  },[symbol])

  async function calcBear(){
    try{
      const qs = []
      if(manualSPX) qs.push(`spx_pct=${Number(manualSPX)}`)
      if(manualNDX) qs.push(`ndx_pct=${Number(manualNDX)}`)
      const url = `/api/bearscore${qs.length?`?${qs.join('&')}`:''}`
      const j = await getJSON(url)
      setBear(j)
    }catch(e){ setErr(String(e)) }
  }

  return (<main>
    <h1>{symbol}</h1>
    {err && <div className="card" style={{borderColor:'#a33'}}>错误：{String(err)}</div>}

    <div className="row">
      <section className="card col">
        <h3>IVR / 代理</h3>
        <div><small className="mono">method</small>：{ivr?.method || '-'}</div>
        <div><small className="mono">ivr(30d/1y)</small>：{ivr?.ivr ?? '-'}</div>
        <div><small className="mono">current(30dHV)</small>：{fmt(ivr?.current)}</div>
        <div style={{marginTop:10}}>
          <label>手动广度 SPX%：</label>
          <input value={manualSPX} onChange={e=>setManualSPX(e.target.value)} placeholder="例如 55.4" style={{width:120, marginRight:8}} />
          <label>NDX%：</label>
          <input value={manualNDX} onChange={e=>setManualNDX(e.target.value)} placeholder="例如 60.2" style={{width:120, marginRight:8}} />
          <button onClick={calcBear}>计算 BearScore</button>
          {bear && <div style={{marginTop:8}}>width: {fmt(bear.width,3)} ｜ bearScore: {bear.bearScore} ｜ <small className="mono">{bear.source}</small></div>}
        </div>
      </section>

      <section className="card col">
        <h3>指标（D）</h3>
        {ind ? (
          <ul style={{lineHeight:1.6}}>
            <li>EMA20/50/200：{fmt(ind.ema20)}/{fmt(ind.ema50)}/{fmt(ind.ema200)}</li>
            <li>RSI(14)：{fmt(ind.rsi)}</li>
            <li>MACD：{fmt(ind.macd?.macd,2)} / signal {fmt(ind.macd?.signal,2)} / hist {fmt(ind.macd?.hist,2)}</li>
            <li>VWAP：{fmt(ind.vwap)}</li>
          </ul>
        ) : '—'}
      </section>
    </div>

    <section className="card">
      <h3>Options Chain（Massive 原生希腊）</h3>
      <div style={{overflowX:'auto'}}>
        <table><thead><tr>
          <th style={{textAlign:'left'}}>exp</th><th>type</th><th>strike</th><th>bid</th><th>ask</th><th>mid</th>
          <th>IV</th><th>Δ</th><th>Γ</th><th>Θ</th><th>Vega</th><th>OI</th><th>Vol</th>
        </tr></thead><tbody>
        {chain.slice(0,200).map((r,i)=>(
          <tr key={i}>
            <td style={{textAlign:'left'}}>{r.exp||r.expiration||'-'}</td>
            <td>{r.type||r.right||'-'}</td>
            <td>{fmt(r.strike||r.strikePrice,2)}</td>
            <td>{fmt(r.bid)}</td>
            <td>{fmt(r.ask)}</td>
            <td>{fmt(r.mid)}</td>
            <td>{fmt(r.iv)}</td>
            <td>{fmt(r.delta)}</td>
            <td>{fmt(r.gamma)}</td>
            <td>{fmt(r.theta)}</td>
            <td>{fmt(r.vega)}</td>
            <td>{r.oi??r.openInterest??'-'}</td>
            <td>{r.volume??'-'}</td>
          </tr>
        ))}
        </tbody></table>
      </div>
    </section>

    <section className="card">
      <h3>News（14d）</h3>
      <ul>
        {news?.slice?.(0,20).map((n,i)=>(
          <li key={i}><a href={n.url} target="_blank" rel="noreferrer">{n.headline}</a>
            <span style={{marginLeft:8}} className="mono">{new Date(n.datetime*1000).toLocaleString()}</span></li>
        ))}
      </ul>
    </section>

    <p className="mono">返回 <Link href="/">首页</Link> ｜ 打开 <Link href="/portfolio">/portfolio</Link></p>
  </main>)
}
