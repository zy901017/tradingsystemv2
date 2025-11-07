export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol')||'').toUpperCase()
  if(!symbol) return new Response(JSON.stringify({ error:'symbol required' }), { status:400 })
  const token = process.env.FINNHUB_TOKEN
  if(!token) return new Response(JSON.stringify({ error:'FINNHUB_TOKEN missing' }), { status:500 })
  const to = Math.floor(Date.now()/1000), from = to - 400*24*3600
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}&token=${token}`
  const r = await fetch(url); const j = await r.json()
  if(j.s!=='ok') return new Response(JSON.stringify({ error:'candle not ok' }), { status:500 })
  const c = j.c, h=j.h, l=j.l, v=j.v
  function ema(arr, n){ const k=2/(n+1); let e=arr[0]; const out=[e]; for(let i=1;i<arr.length;i++){ e=arr[i]*k+e*(1-k); out.push(e) } return out }
  function sma(arr, n){ const out=[]; for(let i=0;i<arr.length;i++){ const s=Math.max(0,i-n+1); const win=arr.slice(s,i+1); out.push(win.reduce((a,b)=>a+b,0)/win.length) } return out }
  function rsi(arr, n=14){
    let gains=0,losses=0; for(let i=1;i<=n;i++){ const d=arr[i]-arr[i-1]; if(d>=0) gains+=d; else losses-=d }
    let avgU=gains/n, avgD=losses/n; const out=new Array(arr.length).fill(null)
    out[n]=100-(100/(1+(avgU/(avgD||1e-9))))
    for(let i=n+1;i<arr.length;i++){ const d=arr[i]-arr[i-1]; const u=Math.max(d,0), dn=Math.max(-d,0); avgU=(avgU*(n-1)+u)/n; avgD=(avgD*(n-1)+dn)/n; out[i]=100-(100/(1+(avgU/(avgD||1e-9)))) }
    return out
  }
  const ema20=ema(c,20), ema50=ema(c,50), ema200=ema(c,200)
  const ema12=ema(c,12), ema26=ema(c,26); const macd=ema12.map((v,i)=>v-ema26[i]); const signal=ema(macd,9); const hist=macd.map((v,i)=>v-signal[i])
  const hlc3=c.map((_,i)=>(h[i]+l[i]+c[i])/3); let cv=0,cvp=0; const vwap=[]
  for(let i=0;i<c.length;i++){ cv+=v[i]; cvp+=hlc3[i]*v[i]; vwap.push(cvp/(cv||1)) }
  const out={ close:c, ema20, ema50, ema200, macd, signal, hist, rsi:rsi(c,14), vwap }
  return new Response(JSON.stringify(out), { headers:{ 'content-type':'application/json' } })
}