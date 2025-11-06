#!/usr/bin/env python3
import os, sys, json, math, time, datetime, urllib.request, urllib.parse, pathlib

API = os.environ.get("MASSIVE_BASE_URL", "https://api.massive.com")
KEY = os.environ.get("MASSIVE_API_KEY")
SYMBOLS = os.environ.get("IVR_SYMBOLS", "SPY,QQQ,TSLA,NVDA,AAPL,MSFT,AMD,SOFI").split(",")
OUT_ROOT = "precomputed"

def http_get(url, headers=None, sleep=0.0):
    req = urllib.request.Request(url, headers=headers or {"User-Agent":"ivr-builder/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    if sleep: time.sleep(sleep)
    return json.loads(data.decode("utf-8"))

def get_chain(symbol):
    if not KEY: raise RuntimeError("MASSIVE_API_KEY missing")
    url = f"{API}/v3/snapshot/options/{urllib.parse.quote(symbol)}"
    return http_get(url, headers={"Authorization": f"Bearer {KEY}"})

def pick_atm_iv(rows, dte_target_days=30):
    # rows: list of dicts with fields: expiration_date/expiry, type, delta, iv, strike
    today = datetime.date.today()
    def dte(exp):
        try:
            y,m,d = map(int, str(exp).split("-"))
            e = datetime.date(y,m,d)
            return (e - today).days
        except:
            return None
    # build per-expiry buckets
    buckets = {}
    for r in rows:
        exp = r.get("expiration_date") or r.get("expiry") or r.get("expiration") or ""
        t = r.get("type","").upper()[:1]
        iv = r.get("implied_volatility") or r.get("iv")
        delta = r.get("delta") or r.get("greeks_delta")
        if exp and iv is not None and delta is not None and t in ("C","P"):
            dt = dte(exp)
            if dt is None or dt <= 0: continue
            if dt not in buckets: buckets[dt] = []
            buckets[dt].append({"t":t,"iv":float(iv),"delta":abs(float(delta)), "exp":exp})
    if not buckets: return None

    # choose two expiries around target
    dtes = sorted(buckets.keys())
    below = max([x for x in dtes if x<=dte_target_days], default=None)
    above = min([x for x in dtes if x>=dte_target_days], default=None)
    if below is None and above is None: return None
    if below is None: below = above
    if above is None: above = below

    def iv_at_exp(d):
        # pick the option with delta closest to 0.5 (near-ATM), average call/put if both exist
        opts = buckets.get(d, [])
        if not opts: return None
        # pick top-1 call/put each
        call = min([o for o in opts if o["t"]=="C"], key=lambda o: abs(o["delta"]-0.5), default=None)
        put  = min([o for o in opts if o["t"]=="P"], key=lambda o: abs(o["delta"]-0.5), default=None)
        vals = []
        if call: vals.append(call["iv"])
        if put:  vals.append(put["iv"])
        if not vals: return None
        return sum(vals)/len(vals)

    iv_b = iv_at_exp(below)
    iv_a = iv_at_exp(above)
    if iv_b is None and iv_a is None: return None
    if iv_b is None: iv_b = iv_a
    if iv_a is None: iv_a = iv_b

    # total-variance linear interpolation: w on variance, T in years
    T_b = below / 365.0
    T_a = above / 365.0
    T_t = dte_target_days / 365.0
    var_b = (iv_b/100.0)**2 * T_b
    var_a = (iv_a/100.0)**2 * T_a
    if T_a == T_b:
        var_t = (var_a + var_b)/2.0
    else:
        w = (T_a - T_t) / (T_a - T_b)
        var_t = w * var_b + (1 - w) * var_a
    iv_t = math.sqrt(max(var_t,0) / max(T_t, 1e-9)) * 100.0
    return iv_t

def percent_rank(values, x):
    if not values: return None
    arr = sorted(values)
    i = 0
    for v in arr:
        if v <= x: i += 1
        else: break
    return round(i / len(arr) * 100, 1)

def load_series(sym):
    p = pathlib.Path(OUT_ROOT) / sym / "ivr_30d_atm_series.json"
    if p.exists():
        try:
            return json.loads(p.read_text("utf-8"))
        except: pass
    return []

def save_series(sym, series):
    d = pathlib.Path(OUT_ROOT) / sym
    d.mkdir(parents=True, exist_ok=True)
    (d / "ivr_30d_atm_series.json").write_text(json.dumps(series, indent=2), encoding="utf-8")

def save_snapshot(sym, ivr, current):
    d = pathlib.Path(OUT_ROOT) / sym
    d.mkdir(parents=True, exist_ok=True)
    payload = {"ivr": float(ivr), "current": float(current), "as_of": datetime.date.today().isoformat()}
    (d / "ivr_30d_atm_1y.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")

def main():
    if not KEY:
        print("ERROR: MASSIVE_API_KEY missing", file=sys.stderr); sys.exit(1)
    today = datetime.date.today().isoformat()
    for sym in [s.strip().upper() for s in SYMBOLS if s.strip()]:
        try:
            j = get_chain(sym)
            rows = j.get("results") or j.get("data") or (j if isinstance(j, list) else [])
            if not isinstance(rows, list): rows = []
            current_iv30 = pick_atm_iv(rows, 30)
            if current_iv30 is None:
                print(f"WARN {sym}: cannot compute 30D ATM IV (no rows)", file=sys.stderr)
                continue
            series = load_series(sym)
            # remove today's if exists
            series = [r for r in series if r.get("date") != today]
            series.append({"date": today, "iv30_atm": round(current_iv30, 4)})
            # keep last 400
            series = sorted(series, key=lambda r: r["date"])[-400:]
            save_series(sym, series)
            # Compute IVR on last 252 entries (1y approx.)
            last = [r["iv30_atm"] for r in series[-252:] if "iv30_atm" in r]
            ivr = percent_rank(last, current_iv30) if last else None
            if ivr is None:
                # if not enough history, fallback to rank on all available
                ivr = percent_rank([r["iv30_atm"] for r in series], current_iv30) or 50.0
            save_snapshot(sym, ivr, current_iv30)
            print(f"OK {sym} iv30={current_iv30:.2f} ivr={ivr:.1f}")
            time.sleep(0.2)
        except Exception as e:
            print(f"ERROR {sym}: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
