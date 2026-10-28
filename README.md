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
  NOVA AI sphere. `assets/img/screens/<lang>/<tab>.webp` — real app screens (build 46, 28.10.2026), 720×1560.
- Live data: `https://cryptonova.vip/*.json` (the cockpit's `web/`, GitHub Pages). `assets/snapshot.js` — a dated copy of the
  feeds, shown only if the live ones don't load, and the page says so («Снимок данных от …», with a «Повторить» button).

## Build
1. Edit `tools/src/i18n/<lang>.json` (all five) or `tools/src/legal/<page>.<lang>.html`.
2. `python3 tools/snapshot.py ../cryptonova-cockpit/web` (refresh the fallback numbers).
3. `python3 tools/build.py ../cryptonova-cockpit` — the cockpit gives NOVA AI's ready answers (`data/nova_faq*.json`), the OKX
   partner link (`web/app_config.json` → `okx_ref`) and CRYPTO NOVA's lead-trader profile (`web/public_real.json` → `copy_url`).
4. Commit to `site-src`; publishing to `main` (production) is a separate step the owner approves.

## Page order (v9, owner's brief 28.10.2026)
Loading screen (kept) → hero «The agent that never sleeps» with the coins → NOVA AI → phone animation → the running line
«Разобраться в крипте проще, чем кажется» → six questions (short answers that open) → 1 What is CRYPTO NOVA → 2 How it works
(collection, analysis, verification, selection) → 3 Why it can be useful → 4 Public portfolio → 5 Try it here (NOVA AI's ready
answers, the bitcoin piggy bank) → 6 Your next step → Connecting and copying → The mobile app → How CRYPTO NOVA makes money → FAQ.

## The public portfolio (v9, 28.10)
Only the REAL CRYPTO NOVA account on OKX since 22.10.2026: app_home `public_portfolio` (= `web/public_real.json`): value, result,
today, periods, curve, where the money is (`alloc.groups`), assets, spot / futures results, real futures trades and the
autopilot's real fills. Deposits and withdrawals are not part of the result. The old $20 000 demo header (`public`, 17.10) and
the allocator (`portfolio`) are not shown anywhere. The account's split (spot 65 / futures 25 / active spot 10) is the owner's
rule (`okx_alloc.SHARES`).

## Copying (`#connect`)
OKX copy trading, no API keys, no UID: sign up with the partner link, identity check, USDT, CRYPTO NOVA's lead-trader profile,
«Copy». OKX keeps a share of the copier's profit for the lead trader. Not available in the EU, EEA and UK (the trades can be
repeated by hand there); where OKX doesn't serve customers the app offers BingX, copying there comes later. The site never
mentions VPN and never sends anyone to a Telegram bot.

## NOVA AI on the site
The site doesn't call the NOVA AI server: «Спросите NOVA AI» plays NOVA AI's own ready answers from the app's FAQ, and says so.
The live chat is in the app (5 questions a day); when the server doesn't answer in time the app shows «Повторить» and the
question isn't counted.
