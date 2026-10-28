"""The live page in a real browser (Chromium on the runner): does cryptonova.pro load the live public-portfolio feed from
cryptonova.vip (CORS) and show it? Prints the status line, the portfolio value and note, and any console errors."""
import asyncio
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for lang in ("ru", "en"):
            pg = await b.new_page(viewport={"width": 1280, "height": 900}); errs = []; feeds = []
            pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
            pg.on("pageerror", lambda e: errs.append("pageerror " + str(e)[:160]))
            pg.on("response", lambda r: feeds.append(f"{r.url.split('?')[0].rsplit('/', 1)[-1]} {r.status}") if "cryptonova.vip" in r.url else None)
            await pg.goto(f"https://cryptonova.pro/?lang={lang}&noboot", wait_until="load")
            await pg.wait_for_timeout(7000)
            st = await pg.inner_text("#status"); val = await pg.inner_text("#pfVal"); note = await pg.inner_text("#pfNote")
            print(f"::notice title=browser {lang}::title «{await pg.title()}» · status «{st}» · portfolio {val} · «{note.strip()}» · feeds {feeds} · errors {errs}")
            await pg.close()
        await b.close()

asyncio.run(main())
