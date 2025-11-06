export const runtime = 'nodejs'
export async function GET(req){
  const { searchParams } = new URL(req.url)
  const symbol = (searchParams.get('symbol') || 'SPY').toUpperCase()
  const stream = new ReadableStream({
    start(controller){
      const enc = new TextEncoder()
      function send(obj){ controller.enqueue(enc.encode('data: ' + JSON.stringify(obj) + '\n\n')) }
      const hb = setInterval(()=> send({ type:'heartbeat', t: Date.now() }), 15000)
      let px = 100
      const tm = setInterval(()=>{ px = +(px||100) * (1 + (Math.random()-0.5)*0.002); send({ type:'agg', symbol, price:+px.toFixed(2), t: Date.now() }) }, 5000)
      const cancel = ()=>{ clearInterval(hb); clearInterval(tm); controller.close() }
      req.signal.addEventListener('abort', cancel)
    }
  })
  return new Response(stream, { headers: { 'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive' } })
}
