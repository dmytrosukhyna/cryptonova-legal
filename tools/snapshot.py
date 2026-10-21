"""Bake a fallback copy of the live feeds into assets/snapshot.js.

The page always tries the live feeds on cryptonova.vip first (see assets/site.js → FEEDS). This snapshot is only
what it shows when those don't load (offline, blocked, previews). Same field names as the feeds, fewer fields.

  python3 tools/snapshot.py /path/to/cryptonova-cockpit/web
"""
import json, os, sys, time

WEB = sys.argv[1] if len(sys.argv) > 1 else "../cryptonova-cockpit/web"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "snapshot.js")
LANG_FILE = {"ru": "app_home.json", "en": "app_home.en.json", "uk": "app_home.uk.json", "el": "app_home.el.json", "es": "app_home.es.json"}


def load(name):
    with open(os.path.join(WEB, name), encoding="utf-8") as f:
        return json.load(f)


def thin(curve, n=160):
    if not curve or len(curve) <= n:
        return curve
    step = (len(curve) - 1) / (n - 1)
    return [curve[round(i * step)] for i in range(n)]


def home(lang):
    h = load(LANG_FILE[lang])
    p = dict(h.get("portfolio") or {})
    if p.get("curve"):
        p["curve"] = thin(p["curve"])
    fut = h.get("futures") or {}
    keep = ("sym", "side", "entry", "price", "stop", "target", "pct", "why_title", "why", "checks", "opened")
    opened = [{k: t.get(k) for k in keep} for t in (fut.get("open") or [])[:5]]
    sp = h.get("spot") or {}
    spot = {k: sp.get(k) for k in ("usd", "pct", "n_coins", "cash_pct", "alloc", "movers")}
    return {"asof": h.get("asof"), "portfolio": p, "engine": h.get("engine"),
            "futures": {"open": opened, **{k: fut.get(k) for k in ("usd", "pct", "trades", "wins", "closed_n") if k in fut}}, "market": h.get("market"), "spot": spot}


def scorecard():
    s = load("scorecard.json")
    src = [{k: x.get(k) for k in ("key", "kind", "checked", "verdict")} for x in s.get("sources", [])]
    rec = [{k: x.get(k) for k in ("src", "sym", "t", "ok", "ru", "en")} for x in s.get("recent", []) if x.get("ok") is not None][:24]
    ch = s.get("chain", {}).get("ledger", {})
    return {"asof": s.get("asof"), "headline": s.get("headline"), "sources": src, "recent": rec,
            "chain": {"ledger": {"head": ch.get("head"), "ok": ch.get("ok"), "lines": ch.get("lines")}}}


def conveyor():
    c = load("conveyor.json")
    return {"asof": c.get("asof"), "counts": c.get("counts")}


def risk():
    r = load("risk.json")
    lim = [{k: x.get(k) for k in ("key", "value", "limit", "unit", "pct_of_limit", "status")} for x in r.get("limits", [])]
    return {"asof": r.get("asof"), "state": r.get("state"), "limits": lim, "kill_switch": r.get("kill_switch")}


TICK = ["BTC", "ETH", "SOL", "BNB", "XRP", "HYPE", "DOGE", "LINK", "ADA", "AVAX", "SUI", "TON", "NEAR", "LTC", "DOT", "TRX"]


def markets():
    m = load("markets.json")
    top = [{"symbol": c["symbol"], "price": c.get("price"), "chg24": c.get("chg24")} for c in m.get("top", []) if c.get("symbol") in TICK]
    g = m.get("global") or {}
    return {"asof": m.get("asof"), "global": {"total_mcap": g.get("total_mcap"), "mcap_chg24": g.get("mcap_chg24")},
            "fng": {"value": (m.get("fng") or {}).get("value")}, "top": top}


def btc():
    b = load("app_btc.json")
    return {"start_day": b["start_day"], "closes": [round(x, 2) for x in b["closes"]]}


def models():
    c = load("capital.json")
    return {k: {"w": m.get("w")} for k, m in (c.get("models") or {}).items()}


def scale():
    """Honest size of the work, from the engine's own files: markets in the nightly lab, years of history, candle checks a
    night (every tried rule walks its market's whole daily history), futures markets the scanner watches every minute."""
    a = load("autolab.json"); cov = a.get("coverage") or {}
    days = [v.get("days") or 0 for v in cov.values()]
    mean = sum(days) / len(days) if days else 0
    t = load("terminal.json"); m = load("markets.json")
    since = min((v.get("from") or "9999")[:4] for v in cov.values()) if cov else None
    return {"lab_markets": len(cov), "since": int(since) if since and since.isdigit() else None,
            "candle_checks": int((a.get("tried") or 0) * mean), "fut_markets": len(t.get("coins") or []), "coins": len(m.get("top") or [])}


snap = {"made": int(time.time() * 1000), "home": {l: home(l) for l in LANG_FILE}, "scorecard": scorecard(),
        "conveyor": conveyor(), "risk": risk(), "btc": btc(), "markets": markets(), "models": models(), "scale": scale()}
with open(OUT, "w", encoding="utf-8") as f:
    f.write("/* fallback copy of the live feeds, made by tools/snapshot.py */\nwindow.CN_SNAP=")
    json.dump(snap, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print("snapshot", os.path.getsize(OUT) // 1024, "KB")
