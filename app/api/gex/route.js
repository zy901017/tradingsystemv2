import { NextResponse } from "next/server"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol') || 'SPX').toUpperCase()
  const key = process.env.GEXBOT_API_KEY
  const tpl = process.env.GEXBOT_URL_TEMPLATE || 'https://api.gexbot.com/{symbol}/classic/full/majors?key={key}'
  if(!key) return NextResponse.json({ ok:false, error:'GEXBOT_API_KEY 缺失' })
  const url = tpl.replace('{symbol}', symbol).replace('{key}', key)
  const res = await fetch(url, { next: { revalidate: 0 } })
  if(!res.ok) return NextResponse.json({ ok:false, error:`GEX 请求失败 ${res.status}` })
  const j = await res.json()
  return NextResponse.json({ ok:true, data: j })
}
