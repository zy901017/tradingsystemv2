#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, json, math, time, datetime, urllib.request, urllib.parse, pathlib

API = os.environ.get("MASSIVE_BASE_URL", "https://api.massive.com")
KEY = os.environ.get("MASSIVE_API_KEY")
SYMBOLS = os.environ.get("IVR_SYMBOLS", "SPY,QQQ").split(",")
OUT_ROOT = "precomputed"

def http_get(url, headers=None, sleep=0.0):
  req = urllib.request.Request(url, headers=headers or {"User-Agent":"ivr-builder/1.3"})
  with urllib.request.urlopen(req, timeout=60) as r:
    data = r.read()
  if sleep: time.sleep(sleep)
  return json.loads(data.decode("utf-8"))

def get_chain(symbol):
  if not KEY: raise RuntimeError("MASSIVE_API_KEY missing")
  url = f"{API}/v3/snapshot/options/{urllib.parse.quote(symbol)}"
  j = http_get(url, headers={"Authorization": f"Bearer {KEY}"})
  rows = []
  if isinstance(j, list): rows = j
  elif isinstance(j, dict):
    for k in ("results","data","options","contracts"):
      v = j.get(k)
      if isinstance(v, list) and v: rows = v; break
  return rows

def pick_atm_iv(rows, dte_target_days=30):
  today = datetime.date.today()
  def dte(exp):
    try:
      y,m,d = map(int, str(exp).replace('/','-').split("-"))
      return (datetime.date(y,m,d) - today).days
    except: return None

  buckets = {}
  for r in rows:
    exp = r.get("expiration_date") or r.get("expiry") or r.get("expiration") or r.get("exp_date")
    t   = (r.get("type") or r.get("option_type") or "").upper()[:1]
    iv  = r.get("implied_volatility") or r.get("iv") or r.get("impliedVolatility")
    greeks = r.get("greeks") or {}
    delta = r.get("delta") or r.get("greeks_delta") or greeks.get("delta")
    if exp and iv is not None and delta is not None and t in ("C","P"):
      dt = dte(exp)
      if dt is None or dt <= 0: continue
      buckets.setdefault(dt, []).append({"t":t,"iv":float(iv),"delta":abs(float(delta))})

  if not buckets: return None
  dtes = sorted(buckets.keys())
  below = max([x for x in dtes if x<=dte_target_days], default=None)
  above = min([x for x in dtes if x>=dte_target_days], default=None)
  if below is None and above is None: return None
  if below is None: below = above
  if above is None: above = below

  def iv_at(d):
    opts = buckets.get(d, [])
    call = min([o for o in opts if o["t"]=="C"], key=lambda o: abs(o["delta"]-0.5), default=None)
    put  = min([o for o in opts if o["t"]=="P"], key=lambda o: abs(o["delta"]-0.5), default=None)
    vals = [x["iv"] for x in (call,put) if x]
    return sum(vals)/len(vals) if vals else None

  iv_b, iv_a = iv_at(below), iv_at(above)
  if iv_b is None and iv_a is None: return None
  if iv_b is None: iv_b = iv_a
  if iv_a is None: iv_a = iv_b

  T_b, T_a, T_t = below/365.0, above/365.0, dte_target_days/365.0
  var_b, var_a = (iv_b/100.0)**2 * T_b, (iv_a/100.0)**2 * T_a
  var_t = (var_a + var_b)/2.0 if T_a==T_b else ((T_a - T_t)/(T_a - T_b))*var_b + (1 - (T_a - T_t)/(T_a - T_b))*var_a
  iv_t = (math.sqrt(max(var_t,0)/max(T_t,1e-9)) * 100.0)
  return iv_t

def percent_rank(values, x):
  if not values: return None
  arr = sorted(values)
  i = sum(1 for v in arr if v <= x)
  return round(i/len(arr)*100, 1)

def ensure_dir(p):
  pathlib.Path(p).mkdir(parents=True, exist_ok=True)

def save_json(path, payload):
  ensure_dir(os.path.dirname(path))
  with open(path, "w", encoding="utf-8") as f: json.dump(payload, f, indent=2)

def main():
  if not KEY:
    print("ERROR: MASSIVE_API_KEY missing", file=sys.stderr); sys.exit(1)
  today = datetime.date.today().isoformat()
  syms = [s.strip().upper() for s in SYMBOLS if s.strip()] or ["SPY","QQQ"]
  for sym in syms:
    try:
      rows = get_chain(sym)
      iv30 = pick_atm_iv(rows, 30)
      if iv30 is None:
        save_json(f"{OUT_ROOT}/{sym}/ivr_30d_atm_1y.json", {"ivr":50.0,"current":30.0,"as_of":today,"placeholder":True})
        continue
      series_path = f"{OUT_ROOT}/{sym}/ivr_30d_atm_series.json"
      series = []
      if os.path.exists(series_path):
        try: series = json.loads(open(series_path,"r",encoding="utf-8").read())
        except: series = []
      series = [r for r in series if r.get("date") != today]
      series.append({"date": today, "iv30_atm": round(iv30,4)})
      series = sorted(series, key=lambda r: r["date"])[-400:]
      save_json(series_path, series)
      win = [r["iv30_atm"] for r in series[-252:] if "iv30_atm" in r]
      ivr = percent_rank(win, iv30) if win else (percent_rank([r["iv30_atm"] for r in series], iv30) or 50.0)
      save_json(f"{OUT_ROOT}/{sym}/ivr_30d_atm_1y.json", {"ivr": float(ivr), "current": float(iv30), "as_of": today})
    except Exception as e:
      save_json(f"{OUT_ROOT}/{sym}/ivr_30d_atm_1y.json", {"ivr":50.0,"current":30.0,"as_of":today,"error":str(e)})
      continue

if __name__=='__main__':
  main()
