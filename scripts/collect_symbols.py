#!/usr/bin/env python3
import os, sys, csv, io, json, urllib.request, urllib.parse

# —— 读取 IBKR Flex（CSV/XML 二选一；下面示例假设你返回 CSV）——
def ibkr_fetch(query_id, token):
    url = f"https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest?t={token}&q={query_id}&v=3"
    with urllib.request.urlopen(url, timeout=60) as r:
        reqid = r.read().decode("utf-8").split("<ReferenceCode>")[1].split("</ReferenceCode>")[0]
    url2 = f"https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement?q={reqid}&t={token}&v=3"
    return urllib.request.urlopen(url2, timeout=120).read().decode("utf-8")

def parse_symbols_from_csv(txt):
    syms = set()
    # 尝试常见表头：Symbol/Sym/UnderlyingSymbol 等
    f = io.StringIO(txt)
    reader = csv.DictReader(f)
    for row in reader:
        for k in ("Symbol","Sym","UnderlyingSymbol"):
            if k in row and row[k]:
                s = row[k].strip().upper()
                # 只要常见美股/ETF 代码（排除期权格式等）
                if s and all(c.isalnum() for c in s) and len(s) <= 6:
                    syms.add(s)
                break
    return syms

def read_watchlist():
    try:
        with open("precomputed/_watchlist.txt","r",encoding="utf-8") as f:
            return {x.strip().upper() for x in f if x.strip()}
    except: return set()

def main():
    token = os.getenv("IBKR_FLEX_TOKEN")
    q_tr  = os.getenv("IBKR_TRADES_QUERY_ID")
    q_pos = os.getenv("IBKR_POSITIONS_QUERY_ID")
    syms = {"SPY","QQQ"}  # 基础兜底
    if token and (q_tr or q_pos):
        if q_tr:
            try: syms |= parse_symbols_from_csv(ibkr_fetch(q_tr, token))
            except Exception as e: print("WARN ibkr trades:", e, file=sys.stderr)
        if q_pos:
            try: syms |= parse_symbols_from_csv(ibkr_fetch(q_pos, token))
            except Exception as e: print("WARN ibkr positions:", e, file=sys.stderr)
    syms |= read_watchlist()
    # 输出逗号分隔给后续步骤用
    print(",".join(sorted(syms)))

if __name__ == "__main__":
    main()
