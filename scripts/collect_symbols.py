#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys, io, re, csv, urllib.request

def ibkr_fetch(query_id, token):
    if not (query_id and token): return ""
    send = f"https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t={token}&q={query_id}&v=3"
    with urllib.request.urlopen(send, timeout=60) as r:
        txt = r.read().decode("utf-8", errors="ignore")
    m = re.search(r"<ReferenceCode>(.*?)</ReferenceCode>", txt)
    if not m: return ""
    ref = m.group(1)
    get = f"https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement?q={ref}&t={token}&v=3"
    with urllib.request.urlopen(get, timeout=120) as r:
        return r.read().decode("utf-8", errors="ignore")

def parse_syms(txt):
    syms=set()
    if "<FlexStatements" in txt or "<FlexQueryResponse" in txt:
        for tag in ("<Symbol>","<UnderlyingSymbol>"):
            for s in re.findall(tag + r'([^<]+)</', txt):
                s=s.strip().upper()
                if s and s.isalnum() and len(s)<=6: syms.add(s)
        return syms
    try:
        f=io.StringIO(txt); rd=csv.DictReader(f)
        for row in rd:
            for k in ("Symbol","Sym","UnderlyingSymbol"):
                if k in row and row[k]:
                    s=row[k].strip().upper()
                    if s and s.isalnum() and len(s)<=6: syms.add(s)
                    break
    except: pass
    return syms

def read_watchlist():
    try:
        with open("precomputed/_watchlist.txt","r",encoding="utf-8") as f:
            return {x.strip().upper() for x in f if x.strip()}
    except: return set()

def main():
    syms={"SPY","QQQ"}
    token=os.getenv("IBKR_FLEX_TOKEN")
    qtr=os.getenv("IBKR_TRADES_QUERY_ID")
    qpo=os.getenv("IBKR_POSITIONS_QUERY_ID")
    if token:
        if qtr:
            try: syms |= parse_syms(ibkr_fetch(qtr, token))
            except Exception as e: print("WARN trades:", e, file=sys.stderr)
        if qpo:
            try: syms |= parse_syms(ibkr_fetch(qpo, token))
            except Exception as e: print("WARN positions:", e, file=sys.stderr)
    syms |= read_watchlist()
    syms={s for s in syms if s and s.isalnum() and len(s)<=6}
    print(",".join(sorted(syms)))

if __name__=='__main__':
    main()
