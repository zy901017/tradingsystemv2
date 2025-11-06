import { NextResponse } from "next/server"
import { candles } from "@/lib/marketProvider"
import { MACD, RSI, KDJ, EMA, SMA, VWAP } from "@/lib/indicators"

function nowSec(){ return Math.floor(Date.now()/1000) }
function daysAgo(n){ return Math.floor((Date.now() - n*24*3600*1000)/1000) }
const frames = { "日K":"D", "4小时":"240", "2小时":"120", "1小时":"60", "30分钟":"30" }

export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol") || "SPY"
  const from = daysAgo(400), to = nowSec()
  const out = {}
  for(const [name, reso] of Object.entries(frames)){
    const c = await candles(symbol, reso, from, to)
    if(c?.c?.length){
      const close=c.c, high=c.h, low=c.l, vol=c.v||[]
      const macd = MACD(close); const rsi = RSI(close); const kdj = KDJ(high,low,close)
      const ema21 = EMA(close,21).at(-1), ema55=EMA(close,55).at(-1), sma200=SMA(close,200).at(-1), vwap = VWAP(close, vol).at(-1)
      out[name] = { MACD: { hist: macd.hist.at?.(-1)||null }, RSI: rsi.at?.(-1)||null, KDJ: { K: kdj.K.at?.(-1)||null, D: kdj.D.at?.(-1)||null }, EMA21: ema21, EMA55: ema55, SMA200: sma200, VWAP: vwap, close: close.at?.(-1)||null }
    } else out[name] = { error: "无数据或 FINNHUB_TOKEN 缺失" }
  }
  return NextResponse.json({ symbol, frames: out })
}
