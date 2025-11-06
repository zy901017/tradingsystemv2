import xml2js from "xml2js"
import { candles } from "@/lib/marketProvider"

async function fetchFlexByQID(token, qid){
  const res = await fetch(`https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t=${token}&q=${qid}&v=3`)
  const text = await res.text()
  const m = text.match(/Reference ID = (\w+)/)
  if(!m) return { ok:false, error:"Flex 初次请求失败", raw:text }
  const rid = m[1]
  const res2 = await fetch(`https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement?q=${rid}&t=${token}&v=3`)
  const xml = await res2.text()
  const parsed = await xml2js.parseStringPromise(xml, { explicitArray:false, mergeAttrs:true })
  return { ok:true, parsed }
}

function normalizeFlex(p, tr){
  const positions = (Array.isArray(p)?p:[p]).filter(Boolean).map(x=> ({
    symbol: (x.symbol || x.underlyingSymbol || x.description || "").toUpperCase(),
    assetCategory: x.assetCategory,
    quantity: +x.position || 0,
    avgCost: +x.costBasisPrice || +x.costBasisMoney || 0,
    price: +x.markPrice || +x.closePrice || 0,
    unrealizedPnl: +x.unrealizedPL || 0
  }))
  const trades = (Array.isArray(tr)?tr:[tr]).filter(Boolean).map(t=> ({
    date: t.tradeDate, symbol: (t.symbol || t.underlyingSymbol || "").toUpperCase(), action: t.buySell,
    quantity: +t.quantity || 0, price: +t.tradePrice || 0, fee: +(t.ibCommission||0)
  }))
  return { ok:true, positions, trades }
}

function rebuildPositionsFromTrades(trades){
  const map = new Map()
  for(const t of trades){
    const sym = t.symbol
    if(!sym) continue
    const rec = map.get(sym) || { qty:0, cost:0 }
    if((t.action||"").toUpperCase()==="BUY"){
      const totalCost = rec.cost*rec.qty + t.price*t.quantity + (t.fee||0)
      rec.qty += t.quantity
      rec.cost = rec.qty ? totalCost/rec.qty : 0
    }else if((t.action||"").toUpperCase()==="SELL"){
      rec.qty -= t.quantity
      if(rec.qty<0) rec.qty = 0
    }
    map.set(sym, rec)
  }
  return Array.from(map.entries()).filter(([_,r])=> r.qty>0).map(([symbol, r])=> ({ symbol, quantity:r.qty, avgCost:r.cost }))
}

async function fillLastPrices(positions){
  const now = Math.floor(Date.now()/1000), from = now - 10*24*3600
  const out = []
  for(const p of positions){
    try{
      const c = await candles(p.symbol, "D", from, now)
      const last = c?.c?.at?.(-1) || 0
      out.push({ ...p, price:last, unrealizedPnl: (last - (p.avgCost||0))* (p.quantity||0) })
    }catch{
      out.push({ ...p, price:0, unrealizedPnl:0 })
    }
  }
  return out
}

export async function fetchIbkrPortfolio(){
  const token = process.env.IBKR_FLEX_TOKEN
  const qid = process.env.IBKR_FLEX_QUERY_ID
  const tradesQ = process.env.IBKR_TRADES_QUERY_ID
  const positionsQ = process.env.IBKR_POSITIONS_QUERY_ID
  if(!token) return { ok:false, error:"IBKR_FLEX_TOKEN 缺失", positions:[], trades:[] }

  // 单报表优先
  if(qid){
    const one = await fetchFlexByQID(token, qid)
    if(!one.ok) return { ok:false, error: one.error || "Flex 获取失败" }
    const stmt = one.parsed?.FlexQueryResponse?.FlexStatements?.FlexStatement
    const p = stmt?.OpenPositions?.OpenPosition || []
    const tr = stmt?.Trades?.Trade || []
    const norm = normalizeFlex(p, tr)
    if(norm.positions.length===0 && norm.trades.length>0){
      const rebuilt = rebuildPositionsFromTrades(norm.trades)
      const filled = await fillLastPrices(rebuilt)
      return { ok:true, positions: filled, trades: norm.trades, fallback:"positions_from_trades" }
    }
    return norm
  }

  // 分报表
  if(tradesQ || positionsQ){
    let p=[], tr=[]
    if(positionsQ){
      const po = await fetchFlexByQID(token, positionsQ)
      const stmt = po.parsed?.FlexQueryResponse?.FlexStatements?.FlexStatement
      p = stmt?.OpenPositions?.OpenPosition || []
    }
    if(tradesQ){
      const to = await fetchFlexByQID(token, tradesQ)
      const stmt = to.parsed?.FlexQueryResponse?.FlexStatements?.FlexStatement
      tr = stmt?.Trades?.Trade || []
    }
    const norm = normalizeFlex(p, tr)
    if(norm.positions.length===0 && norm.trades.length>0){
      const rebuilt = rebuildPositionsFromTrades(norm.trades)
      const filled = await fillLastPrices(rebuilt)
      return { ok:true, positions: filled, trades: norm.trades, fallback:"positions_from_trades" }
    }
    return norm
  }

  return { ok:false, error:"缺少 IBKR_FLEX_QUERY_ID 或 IBKR_TRADES_QUERY_ID/IBKR_POSITIONS_QUERY_ID" }
}
