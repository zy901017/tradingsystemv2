'use client'
import { useEffect, useState } from 'react'

export default function Health(){
  const [data,setData]=useState(null)
  const [err,setErr]=useState('')
  useEffect(()=>{(async()=>{try{const r=await fetch('/api/health',{cache:'no-store'});setData(await r.json())}catch(e){setErr(String(e))}})()},[])
  if(err) return <main><h1>健康检查</h1><div className="card">{String(err)}</div></main>
  return (<main>
    <h1>健康检查</h1>
    <div className="card">
      <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(data,null,2)}</pre>
    </div>
    <p>若某项为 <code>false</code>，请在 Vercel 环境变量中补齐。</p>
  </main>)
}
