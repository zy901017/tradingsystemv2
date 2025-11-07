import { NextResponse } from 'next/server'
async function fetchFlexCSV(queryId, token){
  const send = `https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t=${token}&q=${queryId}&v=3`
  const s = await (await fetch(send, { cache:'no-store' })).text()
  const m = s.match(/<ReferenceCode>(.*?)<\/ReferenceCode>/)
  if(!m) throw new Error('IBKR Flex send fail')
  const code = m[1]
  const getUrl = `https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement?q=${code}&t=${token}&v=3`
  return await (await fetch(getUrl, { cache:'no-store' })).text()
}
export async function GET(){
  const token = process.env.IBKR_FLEX_TOKEN
  const q = process.env.IBKR_TRADES_QUERY_ID || process.env.IBKR_FLEX_QUERY_ID
  if(!token || !q) return NextResponse.json({ error:'IBKR_FLEX_TOKEN or TRADES QUERY missing' }, { status:500 })
  try{
    const txt = await fetchFlexCSV(q, token)
    return NextResponse.json({ raw: txt.slice(0, 20000) })
  }catch(e){
    return NextResponse.json({ error:String(e) }, { status:500 })
  }
}