import { NextResponse } from "next/server"
import { fetchGEX } from "@/lib/providers/gexbot"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const data = await fetchGEX(symbol)
  return NextResponse.json(data)
}
