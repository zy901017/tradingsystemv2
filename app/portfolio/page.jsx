'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import '../globals.css'
import { fmt } from '../../src/lib/utils'

async function getJSON(url){ const r = await fetch(url, { cache:'no-store' }); if(!r.ok) throw new Error(await r.text()); return r.json() }

export default function Portfolio(){
  const [rows,setRows]=useState([])
  const [err,setErr]=useState('')

  useEffect(()=>{ (async ()=>{
    try{
      const j = await getJSON('/api/ibkr/positions')
      if(j && Array.isArray(j.positions)) setRows(j.positions)
      else if(j.error) setErr(j.error)
    }catch(e){ setErr(String(e)) }
  })() },[])

  return (<main>
    <h1>Portfolio</h1>
    {err && <div className="card" style={{borderColor:'#a33'}}>错误：{String(err)}</div>}
    <div className="card"><div style={{overflowX:'auto'}}>
      <table><thead><tr>
        <th style={{textAlign:'left'}}>symbol</th><th>qty</th><th>avgCost</th><th>mark</th><th>P&L</th>
      </tr></thead><tbody>
        {rows.map((r,i)=>(
          <tr key={i}>
            <td style={{textAlign:'left'}}>{r.symbol}</td>
            <td>{r.qty}</td>
            <td>{fmt(r.avgCost)}</td>
            <td>{fmt(r.mark)}</td>
            <td>{fmt((r.mark - r.avgCost)*r.qty)}</td>
          </tr>
        ))}
      </tbody></table>
    </div></div>
    <p className="mono">返回 <Link href="/">首页</Link></p>
  </main>)
}
