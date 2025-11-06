import { NextResponse } from "next/server"
import { computeIVRTrue } from "@/lib/ivr"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const res = await computeIVRTrue(symbol)
  return NextResponse.json({ symbol, ...res })
}
