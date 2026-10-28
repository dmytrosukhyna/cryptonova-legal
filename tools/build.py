"""Build cryptonova.pro from tools/src.

  python3 tools/build.py [/path/to/cryptonova-cockpit]   # the cockpit gives NOVA AI's answers, the OKX links and today's numbers

Writes: index.html, privacy.html, terms.html, support.html, delete.html, 404.html, assets/i18n.js, sitemap.xml, robots.txt.
English is baked into the HTML (crawlers, no-JS); assets/site.js switches the language in the browser.
v9 (28.10.2026): one catalog per language (tools/src/i18n/<lang>.json, every key in every language — the build stops if one is
missing); the page follows the owner's brief: hero → six questions → what / how / why → public portfolio → try → start → connect →
app → how we earn → FAQ.
"""
import html, json, os, re, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "tools", "src")
COCKPIT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "cryptonova-cockpit")
LANGS = ["en", "ru", "uk", "el", "es"]
APPSTORE = "https://apps.apple.com/app/id6754893343"
# NOVA AI's own FAQ answers (data/nova_faq*.json, kept true by the cockpit): what it is, the real public portfolio, «how much can I
# earn», copying through OKX, the price (OKX's profit share included) and safety
NOVA_IDS = ["what_is", "public", "how_much", "copy", "price", "safe"]
PAGES = {"privacy": "foot.privacy", "terms": "foot.terms", "support": "foot.support", "delete": "foot.delete"}
V = time.strftime("%Y%m%d%H%M")
LOCALE_MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November",
                    "December"]

T = {}
for l in LANGS:
    with open(os.path.join(SRC, "i18n", f"{l}.json"), encoding="utf-8") as f:
        T[l] = json.load(f)
EN = T["en"]
bad = {l: sorted(set(EN) ^ set(T[l])) for l in LANGS if set(EN) != set(T[l])}
if bad:
    sys.exit(f"i18n keys differ between languages: { {k: v[:8] for k, v in bad.items()} }")


def cockpit_json(name):
    try:
        with open(os.path.join(COCKPIT, "web", name), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


CFG = cockpit_json("app_config.json")
REAL = cockpit_json("public_real.json")
MARKETS = cockpit_json("markets.json")
CONVEYOR = cockpit_json("conveyor.json")
# OKX partner sign-up link and CRYPTO NOVA's lead-trader profile (both opened by the cockpit's links-audit). Fallbacks: OKX itself.
OKX_REF = CFG.get("okx_ref") or "https://www.okx.com/"
COPY_URL = REAL.get("copy_url") or CFG.get("okx_copy_url") or "https://www.okx.com/copy-trading"
N_COINS = len(MARKETS.get("top") or []) or 150
N_DESKS = (CONVEYOR.get("counts") or {}).get("paper") or 14


def en_money(v):
    return f"${v:,.2f}"


def en_date(ms):
    d = time.gmtime(ms / 1000)
    return f"{d.tm_mday} {LOCALE_MONTHS_EN[d.tm_mon - 1]} {d.tm_year}"


SINCE = en_date(REAL["since"]) if REAL.get("since") else "22 October 2026"
START = en_money(REAL["start_usd"]) if REAL.get("start_usd") else "$10,024.40"
VARS = {"pf.lead": {"since": SINCE, "start": START}, "faq.a3": {"since": SINCE, "start": START}, "how.s1.d": {"n": N_COINS},
        "how.s3.d": {"n": N_DESKS}, "sys.f1": {"n": N_COINS}}


def e(key, **kw):
    s = EN[key]
    for k, v in {**VARS.get(key, {}), **kw}.items():
        s = s.replace("{" + k + "}", str(v))
    return s


def x(key, **kw):
    return html.escape(e(key, **kw), quote=True)


# ---------- NOVA AI demo content from the app's own FAQ ----------
def nova():
    out = {}
    for l in LANGS:
        suf = "" if l == "ru" else "." + l
        try:
            with open(os.path.join(COCKPIT, "data", f"nova_faq{suf}.json"), encoding="utf-8") as f:
                faq = {i["id"]: i for i in json.load(f)["items"]}
            with open(os.path.join(COCKPIT, "web", f"nova{suf}.json"), encoding="utf-8") as f:
                greet = json.load(f).get("greeting", "")
        except FileNotFoundError:
            continue
        sent = re.split(r"(?<=[.!?])\s+", greet)
        hello = " ".join(sent[:2])
        strip = lambda a: re.sub(r"\s+2\.0\b", "", a)
        items = [{"q": faq[i]["q"].replace(" ", " "), "a": strip(faq[i]["a"])} for i in NOVA_IDS if i in faq]
        out[l] = {"hello": hello, "items": items}
    return out


# ---------- shared blocks ----------
APPLE = ('<svg class="apl" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"/></svg>')
DROID = ('<svg class="drd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">'
         '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>')


def stores():
    # the App Store badge links to the live app; Android is a quiet, non-clickable «closed test» (no Google Play badge until the
    # listing is public)
    return (f'<a class="badge-as" href="{APPSTORE}" aria-label="App Store">{APPLE}<span><small data-i="cta.appstore.small">{x("cta.appstore.small")}</small>'
            f'<strong>App Store</strong></span></a>'
            f'<span class="badge-soon" aria-disabled="true">{DROID}<span><small data-i="cta.play.small">{x("cta.play.small")}</small>'
            f'<strong data-i="cta.play.soon">{x("cta.play.soon")}</strong></span></span>')


def svg(path, cls="ic"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true">{path}</svg>')


ICONS = {
    "home": '<path d="M4 11.2 12 4.5l8 6.7V20H4z"/><path d="M9.5 20v-5.5h5V20"/>',
    "demo": '<path d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z"/><path d="M4 7.5 15.5 4.2v3.3"/><circle cx="16" cy="13.5" r="1.2"/>',
    "fut": '<path d="M3.5 17.5 9 12l3.5 3.5 8-8"/><path d="M15 7.5h5.5V13"/>',
    "spot": '<path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>',
    "nova": '<circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-25 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(35 12 12)"/>',
    "review": '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M9 15l2-2.4 1.8 1.6 2.4-3"/>',
    "buy": '<path d="M4 6h16M4 12h10M4 18h7"/><path d="m16 15 2.5 2.5L22 13"/>',
    "learn": '<path d="M4 5.5c2.8-.9 5.5-.6 8 1 2.5-1.6 5.2-1.9 8-1V18c-2.8-.9-5.5-.6-8 1-2.5-1.6-5.2-1.9-8-1z"/><path d="M12 6.5V19"/>',
    "piggy": '<ellipse cx="12" cy="17.5" rx="6.5" ry="2.3"/><path d="M5.5 17.5v-3.2c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3v3.2"/><ellipse cx="12" cy="10.8" rx="6.5" ry="2.3"/><path d="M5.5 10.8V7.6c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3v3.2"/><ellipse cx="12" cy="7.6" rx="6.5" ry="2.3"/>',
    "connect": '<path d="M10 14a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1.2 1.2"/><path d="M14 10a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1.2-1.2"/>',
}
TABS = ["home", "demo", "fut", "spot", "nova", "review", "buy", "learn", "piggy", "connect"]


def tabs():
    out = []
    for i, k in enumerate(TABS):
        sel = "true" if i == 0 else "false"
        out.append(f'<li role="presentation"><button type="button" class="tab" role="tab" id="tab-{k}" data-k="{k}" aria-selected="{sel}" aria-controls="scr" tabindex="{0 if i == 0 else -1}">'
                   f'{svg(ICONS[k], "ti")}<span class="tt"><b data-i="tab.{k}.t">{x(f"tab.{k}.t")}</b><span data-i="tab.{k}.p">{x(f"tab.{k}.p")}</span></span></button></li>')
    return "".join(out)


PATH_GO = ["#what", "#how", "#why", "#portfolio", "#try", "#start"]


def path():
    out = []
    for i in range(1, 7):
        lis = "".join(f'<li data-i="path.d{i}.{j}">{x(f"path.d{i}.{j}")}</li>' for j in range(1, 4))
        out.append(f'<li><details class="qa"><summary><span class="qn" aria-hidden="true">{i}</span><span class="qt"><b data-i="path.q{i}">{x(f"path.q{i}")}</b>'
                   f'<span data-i="path.a{i}">{x(f"path.a{i}")}</span></span><span class="chev" aria-hidden="true"></span></summary>'
                   f'<div class="qd"><ul>{lis}</ul><a class="qgo" href="{PATH_GO[i - 1]}" data-i="path.go">{x("path.go")}</a></div></details></li>')
    return f'<ol class="qpath">{"".join(out)}</ol>'


WHY_IC = ["fut", "buy", "home", "demo", "nova", "review", "learn", "piggy"]


def why():
    out = []
    for i in range(1, 9):
        out.append(f'<li>{svg(ICONS[WHY_IC[i - 1]], "wi")}<div><h3 data-i="why.{i}.t">{x(f"why.{i}.t")}</h3><p data-i="why.{i}.p">{x(f"why.{i}.p")}</p></div></li>')
    return f'<ul class="whylist">{"".join(out)}</ul>'


START_GO = ["#what", "#portfolio", APPSTORE, "#connect", "#app"]


def start():
    out = []
    for i in range(1, 6):
        href = START_GO[i - 1]
        out.append(f'<li class="st"><span class="sn" aria-hidden="true">{i:02d}</span><div class="stb"><h3 data-i="start.s{i}.t">{x(f"start.s{i}.t")}</h3>'
                   f'<p data-i="start.s{i}.p">{x(f"start.s{i}.p")}</p><p class="need"><b data-i="start.need">{x("start.need")}</b> '
                   f'<span data-i="start.s{i}.n">{x(f"start.s{i}.n")}</span></p></div>'
                   f'<a class="btn{" primary" if i == 3 else ""}" href="{href}" data-i="start.s{i}.a">{x(f"start.s{i}.a")}</a></li>')
    return f'<ol class="startlist">{"".join(out)}</ol>'


def faq():
    out = []
    for i in range(1, 12):
        a = e(f"faq.a{i}")   # the answers may hold links (faq.a10): kept as HTML
        out.append(f'<details><summary data-i="faq.q{i}">{x(f"faq.q{i}")}</summary><p data-i-html="faq.a{i}">{a}</p></details>')
    return "".join(out)


def footer(prefix=""):
    li = lambda href, key: f'<li><a href="{href}" data-i="{key}">{x(key)}</a></li>'
    home = prefix or "./"
    return f"""<footer class="foot">
  <div class="wrap">
    <div class="cols">
      <div>
        <a class="brand" href="{home}"><canvas class="emb" data-sphere aria-hidden="true"></canvas><b>CRYPTO NOVΛ<span>AI</span></b></a>
        <p class="about" data-i="foot.about">{x("foot.about")}</p>
      </div>
      <div><h2 class="fh" data-i="foot.docs">{x("foot.docs")}</h2><ul>{li(prefix + "privacy", "foot.privacy")}{li(prefix + "terms", "foot.terms")}{li(prefix + "delete", "foot.delete")}</ul></div>
      <div><h2 class="fh" data-i="foot.system">{x("foot.system")}</h2><ul>{li(home + "#what", "nav.what")}{li(home + "#portfolio", "nav.portfolio")}{li(APPSTORE, "cta.appstore.big")}{li("https://t.me/crypto_nova_news", "foot.news")}</ul></div>
      <div><h2 class="fh" data-i="foot.contact">{x("foot.contact")}</h2><ul>{li(prefix + "support", "foot.support")}{li("https://t.me/crypto_nova_support", "foot.tg")}<li><a href="mailto:cryptonova.app@gmail.com">cryptonova.app@gmail.com</a></li></ul></div>
    </div>
    <div class="base"><span>© 2026 CRYPTO NOVA AI</span><span data-i="foot.op">{x("foot.op")}</span></div>
  </div>
</footer>"""


def hreflang(path=""):
    tags = [f'<link rel="alternate" hreflang="{l}" href="https://cryptonova.pro/{path}?lang={l}">' for l in LANGS]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="https://cryptonova.pro/{path}">')
    return "\n".join(tags)


def header(back=False):
    nav = (f'<a class="backlink" href="./" data-i="legal.back">{x("legal.back")}</a>' if back else "")
    return f"""<header class="top" id="top">
  <div class="wrap">
    <a class="brand" href="./" aria-label="CRYPTO NOVA AI"><canvas class="emb" data-sphere aria-hidden="true"></canvas><b>CRYPTO NOVΛ<span>AI</span></b></a>
    <nav class="nav nav-doc" aria-label="Main">{nav}</nav>
    <div class="langsel"><label class="sr" for="lang" data-i="nav.lang">{x("nav.lang")}</label><select id="lang">{''.join(f'<option value="{l}">{l.upper()}</option>' for l in LANGS)}</select></div>
    <a class="btn-dl" href="{APPSTORE}" data-i="nav.download">{x("nav.download")}</a>
  </div>
</header>"""


# ---------- index ----------
with open(os.path.join(SRC, "index.html"), encoding="utf-8") as f:
    page = f.read()
blocks = {"stores": stores(), "tabs": tabs(), "faq": faq(), "path": path(), "why": why(), "start": start(), "footer": footer(),
          "hreflang": hreflang(), "v": V, "appstore": APPSTORE, "okx_ref": html.escape(OKX_REF, quote=True),
          "copy_url": html.escape(COPY_URL, quote=True)}


def fill(m):
    k = m.group(1)
    if k in blocks:
        return blocks[k]
    if k not in EN:
        sys.exit(f"template key not in the catalog: {k}")
    return x(k)


page = re.sub(r"\{\{([\w.]+)\}\}", fill, page)
left = re.findall(r"\{\{[^}]*\}\}|\{(?:n|since|start|date|ago|v)\}", page)
if left:
    sys.exit(f"unfilled placeholders in index.html: {left[:6]}")
with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
    f.write(page)


# ---------- legal pages ----------
DOC = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} | CRYPTO NOVA AI</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0A1128">
<link rel="canonical" href="https://cryptonova.pro/{name}">
<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
{hreflang}
<link rel="stylesheet" href="assets/site.css?v={v}">
</head>
<body data-page="{page}">
<a class="skip" href="#main">Skip to content</a>
{header}
<main id="main" class="doc">
{articles}
<nav class="others" aria-label="Documents">{others}</nav>
</main>
{footer}
<script src="assets/i18n.js?v={v}"></script>
<script src="assets/sphere.js?v={v}"></script>
<script src="assets/site.js?v={v}"></script>
</body>
</html>
"""
for name, key in PAGES.items():
    arts = []
    for l in LANGS:
        p = os.path.join(SRC, "legal", f"{name}.{l}.html")
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            body = f.read().strip()
        hid = "" if l == "en" else " hidden"
        arts.append(f'<article lang="{l}" data-lang="{l}"{hid}>\n{body}\n</article>')
    with open(os.path.join(SRC, "legal", f"{name}.en.html"), encoding="utf-8") as f:
        en_body = f.read()
    title = re.sub(r"<[^>]+>", "", re.search(r"<h1>(.*?)</h1>", en_body, re.S).group(1)).strip()
    desc = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", (re.search(r'<p class="meta">(.*?)</p>', en_body, re.S) or re.search(r"<p>(.*?)</p>", en_body, re.S)).group(1))).strip()
    others = "".join(f'<a href="{n}" data-i="{k}">{x(k)}</a>' for n, k in PAGES.items() if n != name)
    out = DOC.format(page="doc", title=html.escape(title), desc=html.escape(desc[:300]), name=name, hreflang=hreflang(name), v=V,
                     header=header(back=True), articles="\n".join(arts), others=others, footer=footer())
    with open(os.path.join(ROOT, f"{name}.html"), "w", encoding="utf-8") as f:
        f.write(out)

# 404 (served for any path, so its links are absolute)
nf = DOC.format(page="404", title="Page not found", desc="Page not found", name="", hreflang="", v=V, header=header(back=True),
                articles='<article lang="en" data-lang="en"><h1>Page not found</h1><p>This page doesn\'t exist. <a href="./">Go to the home page</a>.</p></article>',
                others="".join(f'<a href="{n}" data-i="{k}">{x(k)}</a>' for n, k in PAGES.items()), footer=footer())
nf = nf.replace('href="assets/', 'href="/assets/').replace('src="assets/', 'src="/assets/').replace('href="./"', 'href="/"')
with open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8") as f:
    f.write(nf)

# ---------- i18n.js ----------
with open(os.path.join(ROOT, "assets", "i18n.js"), "w", encoding="utf-8") as f:
    f.write("/* made by tools/build.py from tools/src/i18n */\nwindow.CN_I18N=")
    json.dump(T, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\nwindow.CN_NOVA=")
    json.dump(nova(), f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

# ---------- sitemap, robots ----------
urls = ["", "privacy", "terms", "support", "delete"]
with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for u in urls:
        f.write(f"  <url><loc>https://cryptonova.pro/{u}</loc><lastmod>{time.strftime('%Y-%m-%d')}</lastmod></url>\n")
    f.write("</urlset>\n")
with open(os.path.join(ROOT, "robots.txt"), "w") as f:
    f.write("User-agent: *\nAllow: /\nDisallow: /tools/\nSitemap: https://cryptonova.pro/sitemap.xml\n")
print("built", LANGS, "v", V, "· okx", OKX_REF, "· profile", COPY_URL, "· coins", N_COINS, "· desks", N_DESKS)
