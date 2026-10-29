# cryptonova.pro

The public website of CRYPTO NOVA AI: the landing page with live figures from the system, and the legal pages
(privacy, terms, support, account deletion) in English, Russian, Ukrainian, Greek and Spanish.

Static files, served by GitHub Pages from `main` (with `CNAME`). The sources live on `site-src`. No cookies, no trackers,
fonts self-hosted.

## Where things are
- `index.html`, `privacy.html`, `terms.html`, `support.html`, `delete.html`, `404.html` — built pages (don't edit by hand).
- `tools/src/i18n/<lang>.json` — every text of the landing page, one catalog per language. Every key must exist in all five
  catalogs: the build stops otherwise. `tools/src/legal/<page>.<lang>.html` — the documents.
- `tools/src/index.html` — the landing page template (`{{key}}` = English text baked in for search engines and no-JS visitors).
- `assets/site.css`, `assets/site.js` — design and behaviour (one file each, landing and legal pages). `assets/sphere.js` — the
  NOVA AI emblem, alive: the owner's picture in motion (29.10). The glowing «N» core and the BTC / ETH / SOL / BNB coins are cut
  from his picture into `assets/img/nova-parts.webp` (`tools/novaparts.py <picture>`); the three orbits are drawn live with the
  picture's geometry, turn slowly, the coins travel along them, the core breathes; still with prefers-reduced-motion. Never
  called «атом» / "atom" in any text of the site. `assets/img/screens/<lang>/<tab>.webp` — real app screens, 720×1560, from the
  app's pictures of 28.10.2026 (build 48/49, release `screens-40757126728`; `tools/appscreens.py`).
- Live data: `https://cryptonova.vip/*.json` (the cockpit's `web/`, GitHub Pages). `assets/snapshot.js` — a dated copy of the
  feeds, shown only if the live ones don't load, and the page says so («Снимок данных от …», with a «Повторить» button).

## Build
1. Edit `tools/src/i18n/<lang>.json` (all five) or `tools/src/legal/<page>.<lang>.html`.
2. `python3 tools/snapshot.py ../cryptonova-cockpit/web` (refresh the fallback numbers).
3. `python3 tools/build.py ../cryptonova-cockpit` — the cockpit gives NOVA AI's ready answers (`data/nova_faq*.json`), the OKX
   partner link (`web/app_config.json` → `okx_ref`) and CRYPTO NOVA's lead-trader profile (`web/public_real.json` → `copy_url`).
4. Commit to `site-src`; publishing to `main` (production) is a separate step the owner approves.

## Page order (v9, owner's brief 28.10.2026; copying is the offer since 29.10)
Loading screen (kept) → hero «The agent that never sleeps» with the coins → NOVA AI → phone animation and the main button
«Подключиться к системе CRYPTO NOVA» → the running line «Разобраться в крипте проще, чем кажется» → six questions (short answers
that open; the cards of a row are one height) → 1 What is CRYPTO NOVA → 2 How it works (collection, analysis, verification,
selection) → 3 Why it can be useful → 4 Public portfolio, then the invitation to connect → 5 Try it here (NOVA AI's ready answers,
the bitcoin piggy bank) → 6 Your next step (step 3 = connect, the one primary button) → «Подключиться к системе CRYPTO NOVA» →
The mobile app → How CRYPTO NOVA makes money → FAQ. The header carries «Подключиться» as its one highlighted button (in the menu
on phones). Buttons of one group are one size.

## The public portfolio (v9, 28.10)
Only the REAL CRYPTO NOVA account on OKX since 22.10.2026: app_home `public_portfolio` (= `web/public_real.json`): value, result,
today, periods, curve, where the money is (`alloc.groups`), assets, spot / futures results, real futures trades and the
autopilot's real fills. Deposits and withdrawals are not part of the result. The old $20 000 demo header (`public`, 17.10) and
the allocator (`portfolio`) are not shown anywhere. The account's split (spot 65, extra core 10, futures 15 — 2x, at most 3x, LONG only — and «Импульс BTC» 10) is the owner's
rule (`okx_alloc.SHARES`).

## Copying (`#connect`, «Подключиться к системе CRYPTO NOVA»)
OKX copy trading, no API keys, no UID, three steps with buttons: 1 sign up with the partner link (`okx_ref`); 2 identity check and
USDT (OKX help: verification https://www.okx.com/help/4402551261837, deposit https://www.okx.com/help/4572795342989); 3 «Копировать
CRYPTO NOVA» — the lead-trader profile (`public_real.copy_url`). One calm «i»: «Доступность копитрейдинга и отдельных инструментов
зависит от страны и региона — условия показывает OKX». Short small print: losses are possible; OKX keeps a share of the profit for
the lead trader, shown before copying; the money stays in the OKX account. No ban statements; the site never mentions VPN and never
sends anyone to a Telegram bot.

## The app section
The phone is static and upright (no tilt, no 3D). The tab list next to it (under it on a phone) switches its screen: every screen
is a stacked image in one fixed 720×1560 box, preloaded when the section comes near and shown only once decoded — no jump, no
flicker. No dots or arrows under the phone, no auto-advance.

## Checks
`tools/linkcheck.py` and `tools/livecheck.py` run from a GitHub runner on every push to `site-v9` (links, stores, feeds). A commit
whose message holds `[live]` also checks production after a deploy: it waits for this build's `site.css?v=` stamp on cryptonova.pro,
opens every page and asset and drives the live page in Chromium at 390 / 768 / 1280 / 1920 (console errors, sideways scroll, six
cards, button sizes, «Подключиться» → `#connect`, every phone tab).

## NOVA AI on the site
The site doesn't call the NOVA AI server: «Спросите NOVA AI» plays NOVA AI's own ready answers from the app's FAQ, and says so.
The live chat is in the app (5 questions a day); when the server doesn't answer in time the app shows «Повторить» and the
question isn't counted.
