import { bsGreeks } from "@/lib/optionsMath"

export function buildIC(under, iv, dte, width=5){
  const r=0.03, q=0.0, T=dte/365
  const strikeP = under * 0.95, strikeC = under * 1.05
  const shortPut = { type:"P", K: Math.round(strikeP/1)*1, qty:-1 }
  const longPut  = { type:"P", K: Math.round((strikeP-width)/1)*1, qty:+1 }
  const shortCall= { type:"C", K: Math.round(strikeC/1)*1, qty:-1 }
  const longCall = { type:"C", K: Math.round((strikeC+width)/1)*1, qty:+1 }
  const legs=[shortPut,longPut,shortCall,longCall]
  legs.forEach(l=>{ const g=bsGreeks(under,l.K,r,q,iv,T,l.type==="C"); Object.assign(l,g)})
  const sum = legs.reduce((a,l)=>({ delta:a.delta+(l.delta*l.qty), gamma:a.gamma+(l.gamma*l.qty), vega:a.vega+(l.vega*l.qty), theta:a.theta+(l.theta*l.qty), price:a.price+(l.price*l.qty*100)}), {delta:0,gamma:0,vega:0,theta:0,price:0})
  return { name:"Iron Condor", dte, iv, legs, combo: sum, credit: -sum.price }
}

export function buildBWB(under, iv, dte){
  const r=0.03,q=0.0,T=dte/365
  const Kshort = Math.round((under*0.98)/1)*1
  const Klong1 = Math.round((under*0.95)/1)*1
  const Klong2 = Math.round((under*0.90)/1)*1
  const legs=[
    { type:"P", K:Kshort, qty:-2 },
    { type:"P", K:Klong1, qty:+1 },
    { type:"P", K:Klong2, qty:+1 },
  ]
  legs.forEach(l=>{ const g=bsGreeks(under,l.K,r,q,iv,T,l.type==="C"); Object.assign(l,g)})
  const sum = legs.reduce((a,l)=>({ delta:a.delta+(l.delta*l.qty), gamma:a.gamma+(l.gamma*l.qty), vega:a.vega+(l.vega*l.qty), theta:a.theta+(l.theta*l.qty), price:a.price+(l.price*l.qty*100)}), {delta:0,gamma:0,vega:0,theta:0,price:0})
  return { name:"Put BWB", dte, iv, legs, debit: sum.price>0?sum.price:0, credit: sum.price<0?-sum.price:0 }
}

export function buildDiagonal(under, iv, dteNear=14, dteFar=90){
  const r=0.03,q=0.0,Tn=dteNear/365,Tf=dteFar/365
  const Knear = Math.round((under*1.02)/1)*1
  const Kfar  = Math.round((under*0.95)/1)*1
  const legs=[
    { type:"C", K:Kfar, qty:+1, dte:dteFar },
    { type:"C", K:Knear, qty:-1, dte:dteNear },
  ]
  legs.forEach(l=>{ const T=l.dte===dteFar?Tf:Tn; const g=bsGreeks(under,l.K,0.03,0.0,iv,T,true); Object.assign(l,g)})
  const sum = legs.reduce((a,l)=>({ delta:a.delta+(l.delta*l.qty), gamma:a.gamma+(l.gamma*l.qty), vega:a.vega+(l.vega*l.qty), theta:a.theta+(l.theta*l.qty), price:a.price+(l.price*l.qty*100)}), {delta:0,gamma:0,vega:0,theta:0,price:0})
  return { name:"Diagonal Call", legs, combo: sum, net: sum.price }
}
