export async function dailyAlpha(symbol){
  const key = process.env.ALPHAVANTAGE_API_KEY
  if(!key) return { ok:false, error:"ALPHAVANTAGE_API_KEY 缺失" }
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${key}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  const json = await res.json()
  return json
}
