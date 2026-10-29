"""The live page in a real browser (Chromium on the runner), after a deploy: does cryptonova.pro load the live public-portfolio
feed from cryptonova.vip (CORS) and show it, and does it behave as the owner asked on 29.10 — at 390 / 768 / 1280 / 1920:
no console errors, no sideways scroll, the six question cards the same height in a row, the buttons of a group the same size,
«Подключиться к системе CRYPTO NOVA» opening the connect section, the phone upright and every tab switching its screen."""
import asyncio, os
from playwright.async_api import async_playwright

SITE = os.environ.get("SITE", "https://cryptonova.pro")   # SITE=http://127.0.0.1:8000 checks a local build
JS_CHECK = """() => {
  const out = [];
  if (document.documentElement.scrollWidth > innerWidth) out.push('sideways scroll ' + document.documentElement.scrollWidth);
  const rows = {}; document.querySelectorAll('.qpath>li').forEach(li => { const r = li.getBoundingClientRect(); (rows[Math.round(r.top + scrollY)] = rows[Math.round(r.top + scrollY)] || []).push(Math.round(li.querySelector('.qa').getBoundingClientRect().height)); });
  Object.values(rows).forEach(h => { if (Math.max(...h) - Math.min(...h) > 1) out.push('six cards ' + h); });
  for (const sel of ['.st .btn', '.cnk .btn']) { const w = [...document.querySelectorAll(sel)].map(e => Math.round(e.getBoundingClientRect().width)), h = [...document.querySelectorAll(sel)].map(e => Math.round(e.getBoundingClientRect().height)); if (Math.max(...w) - Math.min(...w) > 1 || Math.max(...h) - Math.min(...h) > 1) out.push(sel + ' ' + w + ' / ' + h); }
  let e = document.querySelector('.appphone .phone'); while (e && e !== document.body) { const t = getComputedStyle(e).transform; if (t && t !== 'none') out.push('phone transform ' + t); e = e.parentElement; }
  return out;
}"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ("ru", "en"):
            pg = await b.new_page(viewport={"width": 1280, "height": 900}); errs = []; feeds = []
            pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append("pageerror " + str(e)[:160]))
            pg.on("response", lambda r: feeds.append(f"{r.url.split('?')[0].rsplit('/', 1)[-1]} {r.status}") if "cryptonova.vip" in r.url else None)
            await pg.goto(f"{SITE}/?lang={lang}&noboot", wait_until="load")
            await pg.wait_for_timeout(7000)
            st = await pg.inner_text("#status"); val = await pg.inner_text("#pfVal"); note = await pg.inner_text("#pfNote")
            print(f"::notice title=browser {lang}::title «{await pg.title()}» · status «{st}» · portfolio {val} · «{note.strip()}» · feeds {feeds} · errors {errs}")
            await pg.close()
        for w in (390, 768, 1280, 1920):
            ctx = await b.new_context(viewport={"width": w, "height": 844 if w < 800 else 1000}, is_mobile=w < 800, has_touch=w < 800)
            pg = await ctx.new_page(); errs = []; bad = []
            pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append("pageerror " + str(e)[:160]))
            await pg.goto(f"{SITE}/?lang=ru&noboot", wait_until="load")
            await pg.wait_for_timeout(3000)
            bad += await pg.evaluate(JS_CHECK)
            keys = await pg.eval_on_selector_all("#tabs .tab", "bs => bs.map(b => b.dataset.k)")
            for k in keys[1:] + keys[:1]:
                tab = pg.locator(f'#tabs .tab[data-k="{k}"]')
                await tab.scroll_into_view_if_needed(); await tab.click()
                try:
                    await pg.wait_for_function("k => { const im = document.querySelector('#scr img.on'); return im && im.dataset.k === k && im.naturalWidth > 0; }", arg=k, timeout=8000)
                except Exception:  # noqa: BLE001
                    bad.append(f"tab {k} didn't switch the screen")
            await pg.evaluate("() => window.scrollTo({top: 0, behavior: 'instant'})")
            await pg.click(".hero .cta .btn.primary"); await pg.wait_for_timeout(1800)
            top = await pg.eval_on_selector("#connect", "e => Math.round(e.getBoundingClientRect().top)")
            if abs(top) > 120:
                bad.append(f"«Подключиться» → #connect top {top}")
            links = await pg.eval_on_selector_all("#connect a", "as => as.map(a => a.href)")
            print(f"::notice title=live {w}px::{'OK' if not bad and not errs else 'PROBLEMS'} · tabs {len(keys)} · connect top {top} · connect links {links} · problems {bad} · errors {errs}")
            await ctx.close()
        await b.close()

asyncio.run(main())
