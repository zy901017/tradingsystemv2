import { NextResponse } from "next/server"
import { chainMassive } from "@/lib/providers/options/massive"
import { chainPolygon } from "@/lib/providers/options/polygon"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const expiry = searchParams.get("expiry") || ""
  const m = await chainMassive(symbol, expiry)
  if(m.ok) return NextResponse.json({ provider:"massive", ...m })
  const p = await chainPolygon(symbol)
  return NextResponse.json({ provider:"polygon", ...p })
}
