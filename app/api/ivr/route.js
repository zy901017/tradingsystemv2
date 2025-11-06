import { NextResponse } from "next/server"
import { computeIVR } from "@/lib/ivr"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const res = await computeIVR(symbol)
  return NextResponse.json({ symbol, ...res })
}
