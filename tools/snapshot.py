"""Bake a dated fallback copy of the live feeds into assets/snapshot.js.

The page always tries the live feeds on cryptonova.vip first (assets/site.js → FEED). This snapshot is only what it shows when those
don't load (offline, blocked, a preview on another site) — and it says so, with the snapshot's own date. Same field names as the
feeds, fewer fields. v9 (28.10.2026): the public portfolio is app_home "public_portfolio" — the REAL CRYPTO NOVA account on OKX since
22.10.2026 (web/public_real.json); the old $20 000 demo header ("public") and the allocator ("portfolio") are not copied.

  python3 tools/snapshot.py /path/to/cryptonova-cockpit/web
"""
import json, os, sys, time

WEB = sys.argv[1] if len(sys.argv) > 1 else "../cryptonova-cockpit/web"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "snapshot.js")
LANG_FILE = {"ru": "app_home.json", "en": "app_home.en.json", "uk": "app_home.uk.json", "el": "app_home.el.json", "es": "app_home.es.json"}
PP_KEYS = ("kind", "exchange", "since", "start_usd", "value_usd", "pnl_usd", "pnl_pct", "today_usd", "today_pct", "asof", "stale",
           "note", "stale_note", "copy_url", "periods", "curve", "alloc", "spot", "futures", "actions", "flows", "capital_usd")


def load(name):
    with open(os.path.join(WEB, name), encoding="utf-8") as f:
        return json.load(f)


def thin(curve, n=200):
    """every point when short; else n evenly spaced points that always keep the first and the last"""
    if not curve or len(curve) <= n:
        return curve
    step = (len(curve) - 1) / (n - 1)
    return [curve[round(i * step)] for i in range(n)]


def public_portfolio(h):
    pp = h.get("public_portfolio")
    if not isinstance(pp, dict) or pp.get("value_usd") is None:
        return None
    out = {k: pp.get(k) for k in PP_KEYS}
    out["curve"] = thin(pp.get("curve") or [])
    for part in ("spot", "futures"):
        p = dict(out.get(part) or {})
        p.pop("curve", None)
        out[part] = p
    out["actions"] = (out.get("actions") or [])[:8]
    return out


def home(lang):
    h = load(LANG_FILE[lang])
    return {"asof": h.get("asof"), "public_portfolio": public_portfolio(h), "engine": h.get("engine")}


def conveyor():
    c = load("conveyor.json")
    return {"asof": c.get("asof"), "counts": c.get("counts")}


STABLE = {"USDT", "USDC", "DAI", "FDUSD", "USDE", "USDS", "PYUSD", "TUSD", "USD1", "XAUT", "PAXG", "WBTC", "WETH", "STETH", "WSTETH",
          "WEETH", "CBBTC", "LEO", "WBT", "BUIDL", "USDTB", "BSC"}


def markets():
    """only what the animations need (the coin tickers in the flow) and the count of coins watched — no prices: a stale price must
    never look current, so prices are shown only from the live feed"""
    m = load("markets.json")
    syms = [c.get("symbol") for c in m.get("top") or [] if c.get("symbol") and c.get("symbol") not in STABLE]
    return {"asof": m.get("asof"), "n": len(m.get("top") or []), "symbols": syms[:60]}


def btc():
    b = load("app_btc.json")
    return {"start_day": b["start_day"], "closes": [round(x, 2) for x in b["closes"]]}


snap = {"made": int(time.time() * 1000), "home": {l: home(l) for l in LANG_FILE}, "conveyor": conveyor(), "markets": markets(),
        "btc": btc()}
with open(OUT, "w", encoding="utf-8") as f:
    f.write("/* dated fallback copy of the live feeds, made by tools/snapshot.py — shown only when the live feeds don't load */\nwindow.CN_SNAP=")
    json.dump(snap, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("snapshot", os.path.getsize(OUT) // 1024, "KB · public portfolio asof",
      time.strftime("%Y-%m-%d %H:%M UTC", time.gmtime((snap["home"]["en"]["public_portfolio"] or {}).get("asof", 0) / 1000)))
