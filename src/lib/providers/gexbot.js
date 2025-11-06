export async function fetchGEX(symbol){
  const key = process.env.GEXBOT_API_KEY
  const tpl = process.env.GEXBOT_URL_TEMPLATE || "https://api.gexbot.com/{symbol}/classic/full/majors?key={key}"
  if(!key) return { ok:false, error:"GEXBOT_API_KEY 缺失" }
  const url = tpl.replace("{symbol}", symbol).replace("{key}", key)
  const res = await fetch(url, { next: { revalidate: 0 } })
  if(!res.ok) return { ok:false, error:`GEX 请求失败 ${res.status}` }
  const json = await res.json().catch(async ()=>({ raw: await res.text() }))
  return { ok:true, data: json }
}
