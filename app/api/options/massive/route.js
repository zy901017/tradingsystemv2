export async function GET(req){
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  if(!symbol) return new Response(JSON.stringify({ error:'symbol required' }), { status:400 });
  const key = process.env.MASSIVE_API_KEY;
  const base = process.env.MASSIVE_BASE_URL || 'https://api.massive.com';
  if(!key) return new Response(JSON.stringify({ error:'MASSIVE_API_KEY missing' }), { status:500 });
  try{
    const url = `${base}/v3/snapshot/options/${encodeURIComponent(symbol)}`;
    const res = await fetch(url, { headers:{ Authorization:`Bearer ${key}` } });
    const j = await res.json();
    return new Response(JSON.stringify(j), { headers:{ 'content-type':'application/json' } });
  }catch(e){
    return new Response(JSON.stringify({ error:String(e) }), { status:500 });
  }
}