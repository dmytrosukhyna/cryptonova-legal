"""Every outside address the site sends people to or reads from, opened from a GitHub runner (the sandbox the site is built in
can't reach them): status, final address, page title / the facts that matter. Changes nothing. Stdlib only.
  python3 tools/linkcheck.py index.html links|stores|feeds   (GitHub keeps 10 notices a step: one part per step)"""
import json, re, sys, time, urllib.error, urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"


def get(url, origin=None, n=300_000):
    h = {"User-Agent": UA, "Accept-Language": "en,ru;q=0.8"}
    if origin:
        h["Origin"] = origin
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status, r.geturl(), dict(r.headers), r.read(n).decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.geturl(), dict(e.headers or {}), (e.read(20_000).decode("utf-8", "replace") if e.fp else "")
    except Exception as e:  # noqa: BLE001
        return 0, url, {}, f"{type(e).__name__}: {e}"


def title(body):
    m = re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S)
    return re.sub(r"\s+", " ", m.group(1)).strip()[:100] if m else ""


def note(t, msg):
    print(f"::notice title={t}::{msg[:3800]}")


page = open(sys.argv[1] if len(sys.argv) > 1 else "index.html", encoding="utf-8").read()
part = sys.argv[2] if len(sys.argv) > 2 else "links"

if part == "links":
    for u in sorted(set(u for u in re.findall(r'href="(https?://[^"]+)"', page) if "?lang=" not in u)):
        code, final, hd, body = get(u)
        note("link", f"{u} → {code} {final[:120]} · «{title(body)}»")

if part == "stores":
    # our app in the App Store: the public listing and what Apple says about it
    code, final, hd, body = get("https://apps.apple.com/us/app/id6754893343")
    note("App Store page", f"HTTP {code} {final[:100]} · «{title(body)}»")
    code, final, hd, body = get("https://itunes.apple.com/lookup?id=6754893343&country=us")
    try:
        r = (json.loads(body).get("results") or [{}])[0]
        note("App Store lookup", json.dumps({k: r.get(k) for k in ("trackName", "version", "currentVersionReleaseDate", "price", "sellerName",
                                                                   "minimumOsVersion")}, ensure_ascii=False)[:1500])
    except ValueError:
        note("App Store lookup", f"HTTP {code} · not JSON")
    # Google Play: is there a public listing? (the app is in closed testing: a 404 is expected)
    for pkg in ("com.cryptonova", "com.cryptonova.app"):
        code, final, hd, body = get(f"https://play.google.com/store/apps/details?id={pkg}&hl=en")
        note("Google Play", f"{pkg} → HTTP {code} · «{title(body)}»")

if part == "feeds":
    # the live feeds the page reads, as a browser on cryptonova.pro would: status, CORS header, freshness, the public portfolio
    now = time.time() * 1000
    for f in ("app_home.json", "app_home.en.json", "markets.json", "conveyor.json", "app_btc.json"):
        code, final, hd, body = get("https://cryptonova.vip/" + f, origin="https://cryptonova.pro", n=5_000_000)
        acao = {k.lower(): v for k, v in hd.items()}.get("access-control-allow-origin")
        extra = ""
        try:
            d = json.loads(body)
            a = d.get("asof")
            extra = f"age {round((now - a) / 60000)} min" if isinstance(a, (int, float)) else ""
            pp = d.get("public_portfolio")
            if pp:
                extra += f" · public_portfolio value {pp.get('value_usd')} since {pp.get('since')} stale {pp.get('stale')}"
        except ValueError:
            extra = "not JSON"
        note("feed", f"{f} → HTTP {code} · Access-Control-Allow-Origin: {acao} · {extra}")
