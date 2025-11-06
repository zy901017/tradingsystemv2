import { NextResponse } from "next/server"
import { fetchPCR } from "@/lib/providers/pcr"

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope") || "total"
  const resp = await fetchPCR(scope)
  return NextResponse.json(resp)
}
