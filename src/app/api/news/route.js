import { NextResponse } from "next/server"
import { companyNews } from "@/lib/marketProvider"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") || "SPY"
  const now = new Date()
  const to = now.toISOString().slice(0,10)
  const from = new Date(now.getTime()-14*24*3600*1000).toISOString().slice(0,10)
  const news = await companyNews(symbol, from, to)
  return NextResponse.json({ symbol, from, to, news })
}
