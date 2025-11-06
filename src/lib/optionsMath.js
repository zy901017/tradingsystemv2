// Black-Scholes Greeks (approx), iv annualized, T in years
function cnd(x){ const a1=0.31938153,a2=-0.356563782,a3=1.781477937,a4=-1.821255978,a5=1.330274429; const L=Math.abs(x); const k=1/(1+0.2316419*L); const w=1-Math.exp(-L*L/2)/Math.sqrt(2*Math.PI)*(a1*k+a2*k**2+a3*k**3+a4*k**4+a5*k**5); return x<0?1-w:w }
export function bsGreeks(S,K,r,q,iv,T,call=true){
  const sigma=Math.max(iv,1e-6), sqrtT=Math.sqrt(Math.max(T,1e-9))
  const d1=(Math.log((S+1e-9)/(K+1e-9)) + (r - q + 0.5*sigma*sigma)*T)/(sigma*sqrtT+1e-9)
  const d2=d1 - sigma*sqrtT
  const Nd1= (call?1:-1)===1 ? 0.5*(1+erf(d1/Math.SQRT2)) : 0.5*(1+erf(-d1/Math.SQRT2))
  const Nd2= (call?1:-1)===1 ? 0.5*(1+erf(d2/Math.SQRT2)) : 0.5*(1+erf(-d2/Math.SQRT2))
  const pdf = Math.exp(-0.5*d1*d1)/Math.sqrt(2*Math.PI)
  const discR=Math.exp(-r*T), discQ=Math.exp(-q*T)
  const price = call ? (S*discQ*Nd1 - K*discR*Nd2) : (K*discR*(1-Nd2) - S*discQ*(1-Nd1))
  const delta = call ? discQ*Nd1 : -discQ*(1-Nd1)
  const gamma = discQ*pdf/(S*sigma*sqrtT+1e-9)
  const vega  = S*discQ*pdf*sqrtT/100
  const theta = (-(S*discQ*pdf*sigma)/(2*sqrtT) - (call?(r*K*discR*Nd2):(r*K*discR*(1-Nd2))))/365
  return { price, delta, gamma, vega, theta }
}
function erf(x){ // numeric approximation
  const a1= 0.254829592, a2=-0.284496736, a3= 1.421413741, a4=-1.453152027, a5= 1.061405429
  const p=0.3275911, sign = x<0?-1:1; x=Math.abs(x)
  const t=1/(1+p*x); const y=1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)
  return sign*y
}
