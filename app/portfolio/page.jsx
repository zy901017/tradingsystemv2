'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// —— 内联工具函数 ——
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(Number(n))) return '-'
  return Number(n).toFixed(d)
}

async function getJSON(url){
  const r = await fetch(url, { cache:'no-store' })
  if(!r.ok) throw new Error(await r.text())
  return r.json()
}

export default function Portfolio(){
  const [rows,setRows]=useState([])
  const [err,setErr]=useState('')

  useEffect(()=>{ (async ()=>{
    try{
      const j = await getJSON('/api/ibkr/positions')
      if(Array.isArray(j.positions)) setRows(j.positions)
      else if(j.error) setErr(j.error)
    }catch(e){ setErr(String(e)) }
  })() },[])

  return (
    <main style={{padding:16}}>
      <h1>Portfolio</h1>
      {err && <div style={{border:'1px solid #a33',padding:8,borderRadius:8,margin:'8px 0'}}>错误：{String(err)}</div>}
      <div style={{border:'1px solid #23262d',borderRadius:12,padding:12}}>
        <div style={{overflowX:'auto'}}>
          <table style={{borderCollapse:'collapse',width:'100%'}}>
            <thead><tr>
              <th style={{textAlign:'left'}}>symbol</th><th>qty</th><th>avgCost</th><th>mark</th><th>P&L</th>
            </tr></thead>
            <tbody>
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td style={{textAlign:'left'}}>{r.symbol}</td>
                  <td>{r.qty}</td>
                  <td>{fmt(r.avgCost)}</td>
                  <td>{fmt(r.mark)}</td>
                  <td>{fmt((r.mark - r.avgCost)*r.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{opacity:.7}}>返回 <Link href="/">首页</Link></p>
    </main>
  )
}
