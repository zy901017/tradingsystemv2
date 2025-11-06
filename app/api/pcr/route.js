import { NextResponse } from "next/server"

async function fetchCSV(url){
  if(!url) return []
  const res = await fetch(url, { next: { revalidate: 0 } })
  if(!res.ok) return []
  const text = await res.text()
  const lines = text.trim().split(/\r?\n/)
  return lines.map(l=> l.split(',')).slice(1).map(a=> ({ date: a[0], value: +a[1] }))
}

export async function GET(){
  const tot = process.env.CBOE_PCR_URL_TOTAL
  const eq = process.env.CBOE_PCR_URL_EQUITY
  const total = await fetchCSV(tot)
  const equity = await fetchCSV(eq)
  return NextResponse.json({ total, equity })
}
