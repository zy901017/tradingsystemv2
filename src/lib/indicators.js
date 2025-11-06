export function EMA(arr, n){ const k=2/(n+1); let e=arr[0]??0; const out=[e]; for(let i=1;i<arr.length;i++){ e=arr[i]*k+e*(1-k); out.push(e)} return out }
export function SMA(arr, n){ const out=[]; for(let i=0;i<arr.length;i++){ const s=Math.max(0,i-n+1); const w=arr.slice(s,i+1); out.push(w.reduce((a,b)=>a+b,0)/w.length) } return out }
export function MACD(arr, fast=12, slow=26, signal=9){
  if(arr.length < slow+signal) return { macd:[], signal:[], hist:[] }
  const emaF=EMA(arr,fast), emaS=EMA(arr,slow); const macd=emaF.map((v,i)=>v-emaS[i])
  const sig=EMA(macd.slice(slow-1),signal)
  const hist=macd.slice(slow-1).map((v,i)=>v-sig[i])
  return { macd: macd.slice(slow-1), signal: sig, hist }
}
export function RSI(arr, n=14){
  if(arr.length < n+1) return []
  let gains=0, losses=0
  for(let i=1;i<=n;i++){ const ch=arr[i]-arr[i-1]; if(ch>=0) gains+=ch; else losses-=ch }
  let rs=gains/(losses||1e-9); const out=[100-100/(1+rs)]
  for(let i=n+1;i<arr.length;i++){ const ch=arr[i]-arr[i-1]; gains=(gains*(n-1)+(ch>0?ch:0))/n; losses=(losses*(n-1)+(ch<0?-ch:0))/n; rs=gains/(losses||1e-9); out.push(100-100/(1+rs)) }
  return out
}
export function KDJ(high,low,close,n=9,m1=3,m2=3){
  if(close.length < n) return {K:[],D:[],J:[]}
  const RSV=[]; for(let i=0;i<close.length;i++){ const s=Math.max(0,i-n+1); const hh=Math.max(...high.slice(s,i+1)); const ll=Math.min(...low.slice(s,i+1)); RSV.push((close[i]-ll)/((hh-ll)||1e-9)*100)}
  const K=EMA(RSV,m1); const D=EMA(K,m2); const J=K.map((k,i)=>3*k-2*D[i]); return { K, D, J }
}
export function VWAP(close, volume){ const out=[]; let pv=0, v=0; for(let i=0;i<close.length;i++){ const c=close[i], vol=volume?.[i]??0; pv+=c*vol; v+=vol; out.push(v?pv/v:c) } return out }
