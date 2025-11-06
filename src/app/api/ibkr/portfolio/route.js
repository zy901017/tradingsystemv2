import { NextResponse } from "next/server"
import { fetchIbkrFlex } from "@/lib/ibkrFlex"

export async function GET(){
  const flex = await fetchIbkrFlex()
  if(!flex.ok){
    return NextResponse.json({ positions:[], error:flex.error||"IBKR 未配置" })
  }
  return NextResponse.json({ positions: flex.positions, trades: flex.trades })
}
