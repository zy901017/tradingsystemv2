export async function chainPolygon(symbol){
  const key = process.env.POLYGON_API_KEY || process.env.MASSIVE_API_KEY
  if(!key) return { ok:false, error:"POLYGON_API_KEY/MASSIVE_API_KEY 缺失" }
  const url = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&expired=false&apiKey=${key}`
  const res = await fetch(url, { next: { revalidate: 0 } })
  const json = await res.json()
  return { ok:true, data: json }
}
