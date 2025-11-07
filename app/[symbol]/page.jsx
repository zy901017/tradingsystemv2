'use client'
import { useEffect, useMemo, useState } from 'react'

export default function SymbolPage({ params }){
  const symbol = decodeURIComponent(params.symbol).toUpperCase()
  const [chain,setChain]=useState([])
  const [ivr,setIvr]=useState(null)
  const [ind,setInd]=useState(null)
  const [news,setNews]=useState([])
  const [bs,setBs]=useState(null)
  const [spx,setSpx]=useState(()=>localStorage.getItem('spx_pct')||'')
  const [ndx,setNdx]=useState(()=>localStorage.getItem('ndx_pct')||'')

  useEffect(()=>{
    fetch(`/api/options/massive?symbol=${symbol}`).then(r=>r.json()).then(j=>{
      const rows = Array.isArray(j)? j : (j.results||j.data||j.options||j.contracts||[])
      setChain(rows)
    }).catch(()=>{})

    fetch(`/api/ivr?symbol=${symbol}`).then(r=>r.json()).then(setIvr).catch(()=>{})
    fetch(`/api/indicators?symbol=${symbol}`).then(r=>r.json()).then(setInd).catch(()=>{})
    fetch(`/api/news?symbol=${symbol}`).then(r=>r.json()).then(setNews).catch(()=>{})
  },[symbol])

  function calcBear(){
    const qs = new URLSearchParams()
    if(spx) qs.set('spx_pct', spx)
    if(ndx) qs.set('ndx_pct', ndx)
    fetch(`/api/bearscore?`+qs.toString()).then(r=>r.json()).then(setBs)
    localStorage.setItem('spx_pct', spx||'')
    localStorage.setItem('ndx_pct', ndx||'')
  }

  function greek(v){ return (v==null||isNaN(v))?'-':(+v).toFixed(3) }

  const mapped = useMemo(()=>{
    const rows = chain.map(r=>({ 
      expiry: r.expiration_date || r.expiry || r.expiration || r.exp_date,
      type: (r.type || r.option_type || '').toUpperCase().slice(0,1),
      strike: +(r.strike||0),
      bid: +(r.bid ?? r.best_bid ?? 0),
      ask: +(r.ask ?? r.best_ask ?? 0),
      last: +(r.last ?? r.price ?? 0),
      iv: +(r.implied_volatility ?? r.iv ?? 0),
      delta: +(r.delta ?? r.greeks_delta ?? r.greeks?.delta ?? 0),
      gamma: +(r.gamma ?? r.greeks_gamma ?? r.greeks?.gamma ?? 0),
      theta: +(r.theta ?? r.greeks_theta ?? r.greeks?.theta ?? 0),
      vega:  +(r.vega  ?? r.greeks_vega  ?? r.greeks?.vega  ?? 0),
      oi: +(r.open_interest ?? r.oi ?? 0),
      volume: +(r.volume ?? 0),
    }))
    return rows.slice(0, 2000)
  },[chain])

  function strategy(){
    const ivrVal = ivr?.ivr ?? null
    const rsi = ind?.rsi?.[ind.rsi.length-1] ?? null
    const bull = rsi!=null ? rsi>55 : null
    const ivHigh = ivrVal!=null ? ivrVal>=60 : null
    const ivLow  = ivrVal!=null ? ivrVal<=30 : null
    let title='Neutral income'
    let legs=[]; let note=''
    if(ivHigh){
      title='Short premium (defined risk)'
      note='IVR 高 → Iron Condor / BWB / Calendar 收租；30–50% 收益止盈。'
      const atm = mapped.sort((a,b)=>Math.abs(a.delta-0.5)-Math.abs(b.delta-0.5))[0]?.strike
      if(atm){
        legs=[
          { t:'Sell', side:'Call',  k:(atm*1.03).toFixed(2) },
          { t:'Buy',  side:'Call',  k:(atm*1.06).toFixed(2) },
          { t:'Sell', side:'Put',   k:(atm*0.97).toFixed(2) },
          { t:'Buy',  side:'Put',   k:(atm*0.94).toFixed(2) },
        ]
      }
    }else if(ivLow && bull){
      title='Debit bullish (Diagonal/Vertical)'
      note='IVR 低 + 看多 → 倾向买入借记策略；盈利20–30% 或趋势破坏止盈/损。'
      const atm = mapped.sort((a,b)=>Math.abs(a.delta-0.35)-Math.abs(b.delta-0.35))[0]?.strike
      if(atm){
        legs=[
          { t:'Buy',  side:'Call', k:(atm*1.00).toFixed(2), tenor:'60–90D' },
          { t:'Sell', side:'Call', k:(atm*1.05).toFixed(2), tenor:'7–14D' }
        ]
      }
    }else{
      title='Neutral calendar'
      note='不确定时用日历/对角收 Theta；近月腿剩余1–3天滚动。'
      const atm = mapped.sort((a,b)=>Math.abs(a.delta-0.5)-Math.abs(b.delta-0.5))[0]?.strike
      if(atm){
        legs=[
          { t:'Buy',  side:'Call', k:(atm*1.00).toFixed(2), tenor:'~90D' },
          { t:'Sell', side:'Call', k:(atm*1.00).toFixed(2), tenor:'7–14D' }
        ]
      }
    }
    return { title, note, legs, ivr:ivrVal, rsiLast:rsi }
  }

  const sug = strategy()

  return <div style={{padding:16}}>
    <h1>{symbol}</h1>
    <div className="grid" style={{gridTemplateColumns:'repeat(12,1fr)'}}>

      <div className="card" style={{gridColumn:'span 6'}}>
        <h3>True IVR / Proxy</h3>
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(ivr,null,2)}</pre>
        <button onClick={()=>fetch('/api/ivr/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({symbol})})}>登记到 True IVR 计算清单</button>
      </div>

      <div className="card" style={{gridColumn:'span 6'}}>
        <h3>Manual Breadth (SPX/NDX %&gt;200DMA)</h3>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <label>SPX %</label><input value={spx} onChange={e=>setSpx(e.target.value)} style={{width:90}}/>
          <label>NDX %</label><input value={ndx} onChange={e=>setNdx(e.target.value)} style={{width:90}}/>
          <button onClick={calcBear}>计算</button>
        </div>
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(bs,null,2)}</pre>
      </div>

      <div className="card" style={{gridColumn:'span 12'}}>
        <h3>Options Chain (raw Greeks)</h3>
        <div style={{maxHeight:400, overflow:'auto'}}>
          <table style={{width:'100%'}}>
            <thead><tr>
              <th>Expiry</th><th>T</th><th>Strike</th><th>Bid</th><th>Ask</th><th>Last</th>
              <th>IV</th><th>Δ</th><th>Γ</th><th>Θ</th><th>Vega</th><th>OI</th><th>Vol</th>
            </tr></thead>
            <tbody>
              {mapped.slice(0,1000).map((r,i)=>(
                <tr key={i}>
                  <td>{r.expiry}</td><td>{r.type}</td><td>{r.strike?.toFixed?.(2)}</td>
                  <td>{r.bid?.toFixed?.(2)}</td><td>{r.ask?.toFixed?.(2)}</td><td>{r.last?.toFixed?.(2)}</td>
                  <td>{r.iv?.toFixed?.(2)}</td><td>{greek(r.delta)}</td><td>{greek(r.gamma)}</td>
                  <td>{greek(r.theta)}</td><td>{greek(r.vega)}</td><td>{r.oi}</td><td>{r.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{gridColumn:'span 6'}}>
        <h3>Indicators</h3>
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify({ 
          rsi: ind?.rsi?.[ind.rsi?.length-1], 
          macd: ind?.macd?.[ind.macd?.length-1], 
          ema20: ind?.ema20?.[ind.ema20?.length-1], 
          ema50: ind?.ema50?.[ind.ema50?.length-1], 
          ema200: ind?.ema200?.[ind.ema200?.length-1] }, null, 2)}</pre>
      </div>

      <div className="card" style={{gridColumn:'span 6'}}>
        <h3>Strategy suggestion</h3>
        <p><b>{sug.title}</b></p>
        <p>{sug.note}</p>
        <pre>{JSON.stringify(sug.legs,null,2)}</pre>
      </div>

      <div className="card" style={{gridColumn:'span 12'}}>
        <h3>News</h3>
        <ul>
          {news.map((n,i)=>(<li key={i}><a href={n.url} target="_blank">{n.headline||n.source}</a> <small>{new Date(n.datetime*1000||Date.parse(n.datetime||'')).toLocaleString()}</small></li>))}
        </ul>
      </div>
    </div>
  </div>
}