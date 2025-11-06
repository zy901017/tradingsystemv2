import { NextResponse } from "next/server"
import { companyNews } from "@/lib/marketProvider"

function fmt(d){ const x = new Date(d*1000); const y = x.toISOString().slice(0,10); return y }
export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol') || 'SPY').toUpperCase()
  const now = new Date(); const to = now.toISOString().slice(0,10)
  const fromD = new Date(now.getTime() - 14*24*3600*1000).toISOString().slice(0,10)
  const j = await companyNews(symbol, fromD, to)
  return NextResponse.json(j)
}
