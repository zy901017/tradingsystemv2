import { NextResponse } from 'next/server'

async function fetchJSON(url, opts={}){
  const r = await fetch(url, { ...opts, cache:'no-store' })
  if(!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

function hvPercentile(series, window=252){
  if(!series?.length) return null
  const arr = series.slice(-window)
  const x = arr[arr.length-1]
  const sorted = [...arr].sort((a,b)=>a-b)
  let i=0; for(const v of sorted){ if(v<=x) i++ else break }
  return +(i/sorted.length*100).toFixed(1)
}

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol')||'').toUpperCase()
  if(!symbol) return NextResponse.json({ error:'symbol required' }, { status:400 })

  const enabled = String(process.env.FLAT_FILES_ENABLED||'').toLowerCase() === 'true'
  const base = process.env.FLAT_FILES_BASE_URL
  if(enabled && base){
    try{
      const j = await fetchJSON(`${base}/${symbol}/ivr_30d_atm_1y.json`)
      return NextResponse.json({ method:'flat_files', symbol, ...j })
    }catch(e){ /* fall through */ }
  }

  const token = process.env.FINNHUB_TOKEN
  if(!token) return NextResponse.json({ error:'FINNHUB_TOKEN missing' }, { status:500 })
  const to = Math.floor(Date.now()/1000)
  const from = to - 400*24*3600
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${token}`
  try{
    const j = await fetchJSON(url)
    if(j.s!=='ok') throw new Error('finnhub candle not ok')
    const closes = j.c
    const rets = []
    for(let i=1;i<closes.length;i++){ rets.push(Math.log(closes[i]/closes[i-1])) }
    const hv = []
    const N = 30
    for(let i=N;i<=rets.length;i++){
      const win = rets.slice(i-N,i)
      const avg = win.reduce((a,b)=>a+b,0)/win.length
      const varr = win.reduce((a,b)=>a+(b-avg)*(b-avg),0)/win.length
      const vol = Math.sqrt(varr)*Math.sqrt(252)*100
      hv.push(vol)
    }
    const current = hv[hv.length-1]||null
    const ivr = hvPercentile(hv, 252) ?? null
    return NextResponse.json({ method:'proxy', symbol, ivr, current })
  }catch(e){
    return NextResponse.json({ error:String(e) }, { status:500 })
  }
}