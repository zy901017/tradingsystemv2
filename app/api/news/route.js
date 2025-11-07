export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol')||'').toUpperCase()
  if(!symbol) return new Response(JSON.stringify({ error:'symbol required' }), { status:400 })
  const token = process.env.FINNHUB_TOKEN
  if(!token) return new Response(JSON.stringify({ error:'FINNHUB_TOKEN missing' }), { status:500 })
  const now = new Date(); const to = now.toISOString().slice(0,10)
  const from = new Date(now.getTime()-14*24*3600*1000).toISOString().slice(0,10)
  const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${token}`
  const r = await fetch(url); const j = await r.json()
  return new Response(JSON.stringify(Array.isArray(j)? j.slice(0,30):[]), { headers:{ 'content-type':'application/json' } })
}