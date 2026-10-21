"""Build cryptonova.pro from tools/src.

  python3 tools/build.py [/path/to/cryptonova-cockpit]   # cockpit path gives NOVA's greeting and answers

Writes: index.html, privacy.html, terms.html, support.html, delete.html, 404.html, assets/i18n.js, sitemap.xml.
English is baked into the HTML (crawlers, no-JS); assets/site.js switches the language in the browser.
"""
import html, json, os, re, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "tools", "src")
COCKPIT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "cryptonova-cockpit")
LANGS = ["en", "ru", "uk", "el", "es"]
APPSTORE = "https://apps.apple.com/app/id6754893343"
NOVA_IDS = ["how_works", "where_money", "copy", "testing", "mistake", "passwords"]
PAGES = {"privacy": "foot.privacy", "terms": "foot.terms", "support": "foot.support", "delete": "foot.delete"}
V = time.strftime("%Y%m%d%H%M")

T = {}
for l in LANGS:
    p = os.path.join(SRC, "i18n", f"{l}.json")
    if os.path.exists(p):
        with open(p, encoding="utf-8") as f:
            T[l] = json.load(f)
AVAIL = [l for l in LANGS if l in T]
EN = T["en"]
missing = {l: sorted(set(EN) - set(T[l])) for l in AVAIL if set(EN) - set(T[l])}
if missing:
    print("WARNING missing keys:", {k: v[:5] for k, v in missing.items()})


def e(key, **kw):
    s = EN[key]
    for k, v in kw.items():
        s = s.replace("{" + k + "}", str(v))
    return s


# ---------- NOVA demo content from the app's own FAQ ----------
def nova():
    out = {}
    for l in AVAIL:
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
        items = [{"q": faq[i]["q"], "a": strip(faq[i]["a"])} for i in NOVA_IDS if i in faq]
        out[l] = {"hello": hello, "items": items}
    return out


# ---------- shared blocks ----------
DL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7.5v7M9.2 11.8 12 14.6l2.8-2.8M10.5 18.5h3"/></svg>'


APPLE = ('<svg class="apl" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.21-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.29-1.82-2.32-4.63-2.32-7.28 0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.45z"/></svg>')
DROID = ('<svg class="drd" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">'
         '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>')


def stores():
    # 21.10 owner: «скачать … уродливое» — the App Store button in the familiar black badge style; Android is a quiet «скоро»
    # (no Google Play badge until the app is actually there)
    return (f'<a class="badge-as" href="{APPSTORE}" aria-label="App Store">{APPLE}<span><small data-i="cta.appstore.small">{e("cta.appstore.small")}</small>'
            f'<strong>App Store</strong></span></a>'
            f'<span class="badge-soon" aria-disabled="true">{DROID}<span><small data-i="cta.play.small">{e("cta.play.small")}</small>'
            f'<strong data-i="cta.play.soon">{e("cta.play.soon")}</strong></span></span>')


ICONS = {
    "home": '<path d="M4 11.2 12 4.5l8 6.7V20H4z"/><path d="M9.5 20v-5.5h5V20"/>',
    "trade": '<path d="M3.5 17.5 9 12l3.5 3.5 8-8"/><path d="M15 7.5h5.5V13"/>',
    "nova": '<circle cx="12" cy="12" r="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-25 12 12)"/><circle cx="19.6" cy="8.6" r="1.1"/>',
    "piggy": '<ellipse cx="12" cy="17.5" rx="6.5" ry="2.3"/><path d="M5.5 17.5v-3.2c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3v3.2"/><ellipse cx="12" cy="10.8" rx="6.5" ry="2.3"/><path d="M5.5 10.8V7.6c0 1.3 2.9 2.3 6.5 2.3s6.5-1 6.5-2.3v3.2"/><ellipse cx="12" cy="7.6" rx="6.5" ry="2.3"/>',
    "learn": '<path d="M4 5.5c2.8-.9 5.5-.6 8 1 2.5-1.6 5.2-1.9 8-1V18c-2.8-.9-5.5-.6-8 1-2.5-1.6-5.2-1.9-8-1z"/><path d="M12 6.5V19"/>',
    "spot": '<path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/>',
}


def tabs():
    out = []
    for i, k in enumerate(["home", "trade", "nova", "piggy", "learn", "spot"]):
        sel = "true" if i == 0 else "false"
        ic = f'<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[k]}</svg>'
        out.append(f'<li role="presentation"><button class="tab" role="tab" id="tab-{k}" data-k="{k}" aria-selected="{sel}" aria-controls="scr" tabindex="{0 if i == 0 else -1}">'
                   f'{ic}<b data-i="tab.{k}.t">{e(f"tab.{k}.t")}</b><span data-i="tab.{k}.p">{e(f"tab.{k}.p")}</span></button></li>')
    return "".join(out)


def faq():
    out = []
    for i in range(1, 9):
        a = e(f"faq.a{i}", since="18 October 2026")
        out.append(f'<details><summary data-i="faq.q{i}">{e(f"faq.q{i}")}</summary><p data-i-html="faq.a{i}">{a}</p></details>')
    return "".join(out)


def footer(prefix=""):
    li = lambda href, key: f'<li><a href="{href}" data-i="{key}">{e(key)}</a></li>'
    return f"""<footer class="foot">
  <div class="wrap">
    <div class="cols">
      <div>
        <a class="brand" href="{prefix or './'}"><svg class="emb" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 10V3h7M22 3h7v7M29 22v7h-7M10 29H3v-7"/><circle cx="16" cy="16" r="7"/><path d="M16 5v5M16 22v5M5 16h5M22 16h5"/><path d="M16 12.6l3.4 3.4-3.4 3.4-3.4-3.4z" fill="currentColor" stroke="none"/></svg><b>CRYPTO NOVΛ<span>AI</span></b></a>
        <p class="about" data-i="foot.about">{e("foot.about")}</p>
      </div>
      <div><h4 data-i="foot.docs">{e("foot.docs")}</h4><ul>{li(prefix + "privacy", "foot.privacy")}{li(prefix + "terms", "foot.terms")}{li(prefix + "delete", "foot.delete")}</ul></div>
      <div><h4 data-i="foot.system">{e("foot.system")}</h4><ul>{li("https://cryptonova.vip/scorecard.html", "foot.scorecard")}{li(APPSTORE, "cta.appstore.big")}{li("https://t.me/crypto_nova_news", "foot.news")}</ul></div>
      <div><h4 data-i="foot.contact">{e("foot.contact")}</h4><ul>{li(prefix + "support", "foot.support")}{li("https://t.me/crypto_nova_support", "foot.tg")}<li><a href="mailto:cryptonova.app@gmail.com">cryptonova.app@gmail.com</a></li></ul></div>
    </div>
    <div class="base"><span>© 2026 CRYPTO NOVA AI</span><span data-i="foot.op">{e("foot.op")}</span></div>
  </div>
</footer>"""


def hreflang(path=""):
    tags = [f'<link rel="alternate" hreflang="{l}" href="https://cryptonova.pro/{path}?lang={l}">' for l in AVAIL]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="https://cryptonova.pro/{path}">')
    return "\n".join(tags)


def header(back=False):
    nav = (f'<a class="backlink" href="./" data-i="legal.back">{e("legal.back")}</a>' if back else "")
    return f"""<header class="top" id="top">
  <div class="wrap">
    <a class="brand" href="./" aria-label="CRYPTO NOVA AI"><svg class="emb" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 10V3h7M22 3h7v7M29 22v7h-7M10 29H3v-7"/><circle cx="16" cy="16" r="7"/><path d="M16 5v5M16 22v5M5 16h5M22 16h5"/><path d="M16 12.6l3.4 3.4-3.4 3.4-3.4-3.4z" fill="currentColor" stroke="none"/></svg><b>CRYPTO NOVΛ<span>AI</span></b></a>
    <nav class="nav nav-doc" aria-label="Main">{nav}</nav>
    <div class="langsel"><label class="sr" for="lang" data-i="nav.lang">{e("nav.lang")}</label><select id="lang">{''.join(f'<option value="{l}">{l.upper()}</option>' for l in LANGS)}</select></div>
    <a class="btn-dl" href="{APPSTORE}" data-i="nav.download">{e("nav.download")}</a>
  </div>
</header>"""


# ---------- index ----------
with open(os.path.join(SRC, "index.html"), encoding="utf-8") as f:
    page = f.read()
blocks = {"stores": stores(), "tabs": tabs(), "faq": faq(), "footer": footer(), "hreflang": hreflang(), "v": V}
page = page.replace("{{sys.s1.p}}", html.escape(e("sys.s1.p", m=20)))


def fill(m):
    k = m.group(1)
    if k in blocks:
        return blocks[k]
    return html.escape(EN[k], quote=True)


page = re.sub(r"\{\{([\w.]+)\}\}", fill, page)
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
<style>.nav-doc{{margin-left:auto}}.backlink{{color:var(--soft);text-decoration:none;font-weight:600;font-size:15px;padding:8px 12px}}.backlink:hover{{color:#fff}}@media (max-width:980px){{.nav-doc{{display:flex;position:static;background:none;border:0;padding:0;flex-direction:row}}}}@media (max-width:640px){{.backlink{{display:none}}}}</style>
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
<script src="assets/site.js?v={v}"></script>
</body>
</html>
"""
for name, key in PAGES.items():
    arts = []
    for l in AVAIL:
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
    others = "".join(f'<a href="{n}" data-i="{k}">{e(k)}</a>' for n, k in PAGES.items() if n != name)
    out = DOC.format(page="doc", title=html.escape(title), desc=html.escape(desc[:300]), name=name, hreflang=hreflang(name), v=V,
                     header=header(back=True), articles="\n".join(arts), others=others, footer=footer())
    with open(os.path.join(ROOT, f"{name}.html"), "w", encoding="utf-8") as f:
        f.write(out)

# 404
nf = DOC.format(page="404", title="Page not found", desc="Page not found", name="", hreflang="", v=V, header=header(back=True),
                articles='<article lang="en" data-lang="en"><h1>Page not found</h1><p>This page doesn\'t exist. <a href="./">Go to the home page</a>.</p></article>',
                others="".join(f'<a href="{n}" data-i="{k}">{e(k)}</a>' for n, k in PAGES.items()), footer=footer())
nf = nf.replace('href="assets/', 'href="/assets/').replace('src="assets/', 'src="/assets/').replace('href="./"', 'href="/"')
with open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8") as f:
    f.write(nf)

# ---------- i18n.js ----------
with open(os.path.join(ROOT, "assets", "i18n.js"), "w", encoding="utf-8") as f:
    f.write("/* made by tools/build.py from tools/src/i18n */\nwindow.CN_I18N=")
    json.dump(T, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\nwindow.CN_NOVA=")
    json.dump(nova(), f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\nwindow.CN_MASK=")
    import subprocess
    mask = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, "tools", "landmask.py"), "5200"]))
    json.dump(mask, f, separators=(",", ":"))
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
print("built", AVAIL, "v", V)
