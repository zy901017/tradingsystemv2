function parseCSV(text){
  const lines = text.trim().split(/\r?\n/)
  const header = lines[0].split(/,|\t|\s*\|\s*/).map(s=>s.trim())
  const rows = lines.slice(1).map(line => {
    const cols = line.split(/,|\t|\s*\|\s*/).map(s=>s.trim())
    const obj = {}; header.forEach((h,i)=> obj[h||`c${i}`] = cols[i])
    return obj
  })
  return { header, rows }
}
export async function fetchPCR(scope="total"){
  const url = scope==="equity" ? process.env.CBOE_PCR_URL_EQUITY : process.env.CBOE_PCR_URL_TOTAL
  if(!url) return { ok:false, error:`${scope} PCR URL 缺失` }
  const res = await fetch(url, { next: { revalidate: 0 } })
  const text = await res.text()
  try{ const j = JSON.parse(text); return { ok:true, series:j } }catch{}
  const { header, rows } = parseCSV(text)
  const dtKey = header.find(h=>/date|time/i.test(h)) || header[0]
  const valKey = header.find(h=>/pcr|put.*call|ratio/i.test(h)) || header[1]
  const series = rows.map(r=>({ t: r[dtKey], v: +String(r[valKey]||"0").replace(/[^0-9.\-]/g,"") })).filter(x=>Number.isFinite(x.v))
  return { ok:true, series }
}
