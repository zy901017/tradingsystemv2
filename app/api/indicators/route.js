import { NextResponse } from "next/server"
import { candles } from "@/lib/marketProvider"

function sma(values, p){ const out=[]; for(let i=0;i<values.length;i++){ if(i+1<p) { out.push(null); continue } out.push(values.slice(i+1-p,i+1).reduce((a,b)=>a+b,0)/p) } return out }
function ema(values, p){ const k=2/(p+1); let prev=null; const out=[]; for(let i=0;i<values.length;i++){ const v=values[i]; prev = prev===null? v : v*k + prev*(1-k); out.push(prev) } return out }
function rsi(values, p=14){ const out=[]; let gains=0, losses=0; for(let i=1;i<values.length;i++){ const ch=values[i]-values[i-1]; if(i<=p){ if(ch>0) gains+=ch; else losses-=ch; out.push(null); continue } if(ch>0){ gains=(gains*(p-1)+ch)/p; losses=losses*(p-1)/p } else { gains=gains*(p-1)/p; losses=(losses*(p-1)-ch)/p } const rs = losses===0? 100: gains/losses; out.push(100 - 100/(1+rs)) } return out }
function macd(values, fast=12, slow=26, signal=9){ const emaF=ema(values, fast), emaS=ema(values, slow); const mac=emaF.map((v,i)=> v- (emaS[i]||0)); const sig=ema(mac.slice(slow-1), signal); const hist=mac.slice(slow-1).map((v,i)=> v - (sig[i]||0)); return { macd: mac, signal: [ ...Array(slow-1).fill(null), ...sig ], hist: [ ...Array(slow-1).fill(null), ...hist ] } }

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol') || 'SPY').toUpperCase()
  const resolution = searchParams.get('resolution') || 'D'
  const now = Math.floor(Date.now()/1000), from = now - 500*24*3600
  const c = await candles(symbol, resolution, from, now)
  const close = c?.c || []
  const data = {
    sma20: sma(close,20).at(-1),
    sma50: sma(close,50).at(-1),
    ema20: ema(close,20).at(-1),
    ema50: ema(close,50).at(-1),
    rsi14: rsi(close,14).at(-1),
    macd: macd(close)
  }
  return NextResponse.json({ symbol, resolution, indicators: data })
}
