function toNum(x){ const n = +x; return Number.isFinite(n) ? n : 0 }
function signQty(action, qty){ if(action==="买入") return toNum(qty); if(action==="卖出") return -toNum(qty); if(action==="拆股") return toNum(qty); return 0 }
function cashflow(action, qty, price, fee){ const Q=toNum(qty), P=toNum(price), F=toNum(fee); if(action==="买入") return -Q*P - F; if(action==="卖出") return  Q*P - F; if(action==="分红") return  P; if(action==="费用") return -F; return 0 }
export function buildLedger(events){ return events.map(e => ({...e, cash: cashflow(e.action, e.qty, e.price, e.fee), signedQty: signQty(e.action, e.qty)})).sort((a,b)=> new Date(a.date) - new Date(b.date)) }
export function uniqueSymbols(ledger){ const set=new Set(); for(const r of ledger){ if(r.symbol) set.add(r.symbol.toUpperCase()) } return Array.from(set) }

// Avg-cost method
export function positionsSummary(ledger, priceMap){ const map={}; for(const r of ledger){ const rec = map[r.symbol] ||= { symbol:r.symbol, qty:0, avgCost:0, cashflow:0, tiers:{A:0,B:0,C:0} }; rec.qty += r.signedQty; rec.cashflow += r.cash; if(r.action==="买入"){ const prevQty = rec.qty - r.signedQty; const totalCost = rec.avgCost*prevQty + toNum(r.qty)*toNum(r.price) + toNum(r.fee); const newQty = rec.qty; rec.avgCost = newQty ? totalCost / newQty : 0; if(r.tier) rec.tiers[r.tier] = (rec.tiers[r.tier]||0) + toNum(r.qty) } } return Object.values(map).map(p=>{ const price = toNum(priceMap[p.symbol]||0); const unreal = (price - p.avgCost) * p.qty; return { ...p, price, unrealizedPnl: unreal } }) }

// FIFO method
export function positionsSummaryFIFO(ledger, priceMap){
  const lots = {}
  for(const r of ledger){
    const sym = r.symbol
    lots[sym] ||= []
    if(r.action==="买入"){
      lots[sym].push({ qty: toNum(r.qty), cost: toNum(r.price), fee: toNum(r.fee) })
    }else if(r.action==="卖出"){
      let remain = toNum(r.qty)
      while(remain>0 && lots[sym].length){
        const lot = lots[sym][0]
        const take = Math.min(remain, lot.qty)
        lot.qty -= take
        if(lot.qty<=0) lots[sym].shift()
        remain -= take
      }
    }
  }
  const out = []
  for(const sym in lots){
    const totalQty = lots[sym].reduce((a,l)=>a+l.qty,0)
    const totalCost = lots[sym].reduce((a,l)=>a+l.qty*l.cost + l.fee,0)
    const avg = totalQty? totalCost/totalQty : 0
    const price = toNum(priceMap[sym]||0)
    out.push({ symbol:sym, qty: totalQty, avgCost: avg, price, unrealizedPnl: (price-avg)*totalQty })
  }
  return out
}

export function cashflowSummary(ledger){ const byDay={}; for(const r of ledger){ const d = new Date(r.date); const day = d.toISOString().slice(0,10); const arr = byDay[day] ||= []; arr.push(r.cash) } const daily = Object.entries(byDay).map(([day, arr]) => ({ day, cash: arr.reduce((a,b)=>a+b,0) })); const total = daily.reduce((a,b)=>a+b.cash, 0); return { daily, total } }

export function dailySnapshot(ledger, priceMap){
  const days = Array.from(new Set(ledger.map(r=> new Date(r.date).toISOString().slice(0,10)))).sort()
  const snaps = []
  let holdings = {}
  for(const day of days){
    for(const r of ledger.filter(x=> new Date(x.date).toISOString().slice(0,10)===day)){
      const h = holdings[r.symbol] ||= { qty:0, avg:0 }
      if(r.action==="买入"){
        const total = h.avg*h.qty + toNum(r.qty)*toNum(r.price) + toNum(r.fee)
        h.qty += toNum(r.qty)
        h.avg = h.qty? total/h.qty : 0
      }else if(r.action==="卖出"){
        h.qty -= toNum(r.qty)
        if(h.qty<0) h.qty=0
      }
    }
    const value = Object.entries(holdings).reduce((sum,[sym,h])=> sum + (toNum(priceMap[sym]||0)*h.qty), 0)
    snaps.push({ day, value })
  }
  return snaps
}

// More granular T rules
export function tCostOptimizer(pos, priceMap, stepA=0.02, stepB=0.05){
  const out=[]
  for(const p of pos){
    if(!p.qty) continue
    const price = toNum(priceMap[p.symbol]||0)
    if(!price) continue
    const diff = (price - p.avgCost) / (p.avgCost||1e-9)
    if(diff <= -stepB){
      out.push({ symbol:p.symbol, level:"重仓买T", action:"加仓", reason:`现价低于均价 ${(Math.abs(diff)*100).toFixed(1)}%`, qtyHint: Math.max(1, Math.round(Math.abs(p.qty)*0.3)) })
    }else if(diff <= -stepA){
      out.push({ symbol:p.symbol, level:"轻仓买T", action:"加仓", reason:`现价低于均价 ${(Math.abs(diff)*100).toFixed(1)}%`, qtyHint: Math.max(1, Math.round(Math.abs(p.qty)*0.1)) })
    }else if(diff >= stepB){
      out.push({ symbol:p.symbol, level:"重仓卖T", action:"减仓", reason:`现价高于均价 ${(Math.abs(diff)*100).toFixed(1)}%`, qtyHint: Math.max(1, Math.round(Math.abs(p.qty)*0.3)) })
    }else if(diff >= stepA){
      out.push({ symbol:p.symbol, level:"轻仓卖T", action:"减仓", reason:`现价高于均价 ${(Math.abs(diff)*100).toFixed(1)}%`, qtyHint: Math.max(1, Math.round(Math.abs(p.qty)*0.1)) })
    }
  }
  return out
}
