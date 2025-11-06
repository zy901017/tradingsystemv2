import { NextResponse } from "next/server"
import { chainMassive } from "@/lib/providers/options/massive"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get("symbol") || "SPY").toUpperCase()
  const data = await chainMassive(symbol)
  return NextResponse.json(data)
}
