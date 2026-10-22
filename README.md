# cryptonova.pro

The public website of the CRYPTO NOVA AI app: landing page with live figures from the system, and the legal pages
(privacy, terms, support, account deletion) in English, Russian, Ukrainian, Greek and Spanish.

Static files, served by GitHub Pages. No cookies, no trackers, fonts self-hosted.

## Where things are
- `index.html`, `privacy.html`, `terms.html`, `support.html`, `delete.html`, `404.html` — built pages (don't edit by hand).
- `tools/src/i18n/<lang>.json` — every text on the landing page. `tools/src/legal/<page>.<lang>.html` — the documents.
- `tools/src/index.html` — the landing page template (`{{key}}` = English text baked in for search engines).
- `assets/site.css`, `assets/site.js` — design and behaviour. Live data: `https://cryptonova.vip/*.json` (public demo feeds of the engine).
- `assets/snapshot.js` — fallback copy of the feeds, shown only if the live ones don't load.

## Change a text
1. Edit `tools/src/i18n/<lang>.json` or `tools/src/legal/<page>.<lang>.html`.
2. `python3 tools/build.py ../cryptonova-cockpit` (the cockpit checkout gives NOVA's demo answers).
3. Commit and push — GitHub Pages publishes in about a minute.

Refresh the fallback numbers: `python3 tools/snapshot.py ../cryptonova-cockpit/web`.

## The public portfolio (v8, 22.10)
It is the `public` block of the feed (`web/app_home*.json` in the cockpit): «Заработано всего», futures «отобранные сигналы»,
spot «CRYPTO NOVA портфель» with its coins and «почему», two $10 000 demo accounts from 17.10. The old capital allocator
(`portfolio`, capital.json) is not shown. The one footnote is `live.foot`; `faq.a5` also says «демо». Change both the same day
as the app caption, never before.

## How to connect (`#connect`)
Exchange copy trading, no API keys. The site can't know the visitor's country: it never names or links an exchange
(«партнёрская биржа, подходящая для вашей страны — приложение покажет её»), never mentions VPN, never asks for keys.
