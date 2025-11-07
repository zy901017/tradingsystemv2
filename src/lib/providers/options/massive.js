export async function fetchMassiveChain(symbol, apiKey, baseUrl='https://api.massive.com'){
  const url = `${baseUrl}/v3/snapshot/options/${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { headers:{ Authorization:`Bearer ${apiKey}` }, next:{ revalidate:0 } });
  if(!res.ok) throw new Error(`Massive fetch failed ${res.status}`);
  const j = await res.json();
  const rows = Array.isArray(j)? j : (j.results||j.data||j.options||j.contracts||[]);
  return rows.map(r => ({
    expiry: r.expiration_date || r.expiry || r.expiration || r.exp_date,
    type: (r.type || r.option_type || '').toUpperCase().slice(0,1),
    strike: +r.strike,
    bid: +((r.bid!=null?r.bid:r.best_bid)||0),
    ask: +((r.ask!=null?r.ask:r.best_ask)||0),
    last: +((r.last!=null?r.last:r.price)||0),
    iv: +((r.implied_volatility!=null?r.implied_volatility:r.iv)||0),
    delta: +(r.delta ?? r.greeks_delta ?? r.greeks?.delta ?? 0),
    gamma: +(r.gamma ?? r.greeks_gamma ?? r.greeks?.gamma ?? 0),
    theta: +(r.theta ?? r.greeks_theta ?? r.greeks?.theta ?? 0),
    vega:  +(r.vega  ?? r.greeks_vega  ?? r.greeks?.vega  ?? 0),
    oi: +(r.open_interest ?? r.oi ?? 0),
    volume: +(r.volume ?? 0)
  }));
}