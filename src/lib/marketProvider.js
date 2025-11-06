const FINNHUB = 'https://finnhub.io/api/v1'

export async function candles(symbol, resolution='D', fromSec, toSec){
  const token = process.env.FINNHUB_TOKEN
  const params = new URLSearchParams({ symbol, resolution, from: String(fromSec), to: String(toSec), token })
  const res = await fetch(`${FINNHUB}/stock/candle?${params.toString()}`, { next: { revalidate: 0 } })
  if(!res.ok) throw new Error('finnhub candle error')
  const j = await res.json()
  return j  // {c,o,h,l,v,t,s}
}

export async function companyNews(symbol, from, to){
  const token = process.env.FINNHUB_TOKEN
  const params = new URLSearchParams({ symbol, from, to, token })
  const res = await fetch(`${FINNHUB}/company-news?${params.toString()}`, { next: { revalidate: 0 } })
  if(!res.ok) return { data: [] }
  const j = await res.json()
  return { data: j.map(x=> ({ headline: x.headline, url: x.url, source: x.source, datetime: x.datetime })) }
}
