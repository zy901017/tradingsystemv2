import { NextResponse } from "next/server"
import { buildIC, buildBWB, buildDiagonal } from "@/lib/strategy/engine"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const under = +(searchParams.get("price") || 500)
  const iv = +(searchParams.get("iv") || 0.35)
  const dte = +(searchParams.get("dte") || 30)
  const ic = buildIC(under, iv, dte)
  const bwb = buildBWB(under, iv, dte)
  const diag = buildDiagonal(under, iv, 14, 90)
  return NextResponse.json({ symbol, under, iv, dte, strategies:[ic,bwb,diag] })
}
