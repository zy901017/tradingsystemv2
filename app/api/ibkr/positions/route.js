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
  const q = process.env.IBKR_POSITIONS_QUERY_ID || process.env.IBKR_FLEX_QUERY_ID
  if(!token || !q) return NextResponse.json({ error:'IBKR_FLEX_TOKEN or POSITIONS QUERY missing' }, { status:500 })
  try{
    const txt = await fetchFlexCSV(q, token)
    const lines = txt.trim().split(/\r?\n/); const head = lines[0].split(',')
    function col(name){ const i=head.indexOf(name); return i>=0?i:null }
    const iSym = col('Symbol') ?? col('UnderlyingSymbol') ?? 0
    const iQty = col('Quantity') ?? col('Position') ?? col('Qty')
    const iAvg = col('AverageCost') ?? col('CostBasisPrice')
    const iMkt = col('MarkPrice') ?? col('Price')
    const out=[]
    for(let i=1;i<lines.length;i++){
      const row = lines[i].split(','); const sym=(row[iSym]||'').trim().toUpperCase(); if(!sym) continue
      const qty=parseFloat(row[iQty]||'0'), avg=parseFloat(row[iAvg]||'0'), mkt=parseFloat(row[iMkt]||'0')
      out.push({ symbol:sym, qty, avg, mkt })
    }
    return NextResponse.json({ positions: out })
  }catch(e){
    return NextResponse.json({ error:String(e) }, { status:500 })
  }
}