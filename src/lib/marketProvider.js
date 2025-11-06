// Finnhub
export async function candles(symbol, resolution="D", fromSec, toSec){
  const token = process.env.FINNHUB_TOKEN
  if(!token) return { ok:false, error:"FINNHUB_TOKEN 缺失" }
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${fromSec}&to=${toSec}&token=${token}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  return res.json()
}
export async function companyNews(symbol, from, to){
  const token = process.env.FINNHUB_TOKEN
  if(!token) return { ok:false, error:"FINNHUB_TOKEN 缺失" }
  const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${token}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  return res.json()
}
