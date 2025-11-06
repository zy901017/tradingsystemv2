import { NextResponse } from "next/server"
import { fetchIbkrPortfolio } from "@/lib/ibkrFlex"

export async function GET(){
  const data = await fetchIbkrPortfolio()
  return NextResponse.json(data)
}
