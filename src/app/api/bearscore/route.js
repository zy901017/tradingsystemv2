import { NextResponse } from "next/server"
import { computeBearScore } from "@/lib/bearscore"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const res = await computeBearScore(symbol)
  return NextResponse.json({ symbol, ...res })
}
