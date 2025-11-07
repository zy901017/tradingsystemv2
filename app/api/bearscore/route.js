import { NextResponse } from 'next/server'
function clamp(x,a=0,b=1){ return Math.max(a, Math.min(b, x)) }

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const spxPct = parseFloat(searchParams.get('spx_pct')||'')
  const ndxPct = parseFloat(searchParams.get('ndx_pct')||'')
  let width=null, source=''
  if(!Number.isNaN(spxPct)){
    width = clamp(((spxPct + (Number.isNaN(ndxPct)?spxPct:ndxPct))/2)/100)
    source='manual'
  }else{
    const csvUrl = process.env.SPXA200R_CSV_URL
    if(csvUrl){
      try{
        const r = await fetch(csvUrl, { cache:'no-store' })
        const t = await r.text()
        const rows = t.trim().split(/\r?\n/).filter(Boolean)
        const last = rows[rows.length-1].split(',')
        const val = parseFloat(last[last.length-1])
        if(!Number.isNaN(val)){ width = clamp(val/100); source='csv' }
      }catch(e){ /* fall through */ }
    }
  }
  if(width==null){
    const token = process.env.FINNHUB_TOKEN
    if(!token) return NextResponse.json({ error:'FINNHUB_TOKEN missing' }, { status:500 })
    const to = Math.floor(Date.now()/1000), from = to - 15*24*3600
    async function lastClose(sym){
      const u = `https://finnhub.io/api/v1/stock/candle?symbol=${sym}&resolution=D&from=${from}&to=${to}&token=${token}`
      const j = await (await fetch(u)).json()
      if(j.s!=='ok') throw new Error('finnhub fail '+sym)
      return j.c[j.c.length-1]
    }
    try{
      const rsp = await lastClose('RSP')
      const spy = await lastClose('SPY')
      const ratio = rsp/spy
      width = clamp((ratio-0.8)/(1.05-0.8))
      source = 'proxy_rsp_spy'
    }catch(e){
      return NextResponse.json({ error:String(e) }, { status:500 })
    }
  }
  const bearScore = (1 - width)*200 - 100
  return NextResponse.json({ width:+width.toFixed(3), bearScore:+bearScore.toFixed(1), source })
}