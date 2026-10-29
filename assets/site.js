/* CRYPTO NOVA AI — cryptonova.pro v9. No cookies, no trackers. Live figures come from the public feeds on cryptonova.vip
   (GitHub Pages of the cockpit). When they don't load, the page shows the dated snapshot (assets/snapshot.js) and says so —
   never invented numbers. The public portfolio is app_home "public_portfolio": the REAL CRYPTO NOVA account on OKX since 22.10.2026. */
(function () {
  "use strict";
  var LANGS = ["en", "ru", "uk", "el", "es"];
  var LOCALE = { en: "en-US", ru: "ru-RU", uk: "uk-UA", el: "el-GR", es: "es-ES" };
  var DLOCALE = { en: "en-GB", ru: "ru-RU", uk: "uk-UA", el: "el-GR", es: "es-ES" };
  var FEED = "https://cryptonova.vip/";
  var HOME_FILE = { ru: "app_home.json", en: "app_home.en.json", uk: "app_home.uk.json", el: "app_home.el.json", es: "app_home.es.json" };
  // the account's own start (web/public_real.json) — used only if no feed and no snapshot is there to say it
  var START = { since: 1792669322166, start_usd: 10024.4 };
  // the public account's split, the owner's rule (cockpit okx_alloc.SHARES; owner's decision of 28.10: futures 25 → 15 %, + extra core 10 %)
  var RULES = [["spot", 65, "#7FD3FF"], ["core", 10, "#4FD1C5"], ["fut", 15, "#5C8DFF"], ["active", 10, "#B9C6E6"]];
  var I18N = window.CN_I18N || {};
  var doc = document, $ = function (s, r) { return (r || doc).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var page = doc.body.getAttribute("data-page") || "home";
  var isDoc = page !== "home";

  /* ---------- language ---------- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function pickLang() {
    var q = (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1];
    if (q && I18N[q]) { store("cn.lang", q); return q; }
    var s = store("cn.lang"); if (s && I18N[s]) return s;
    var nav = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < nav.length; i++) { var c = String(nav[i]).slice(0, 2).toLowerCase(); if (c === "be") c = "ru"; if (I18N[c]) return c; }
    return "en";
  }
  var lang = page === "404" ? "en" : pickLang();
  function t(key, vars) {
    var s = (I18N[lang] && I18N[lang][key]) || (I18N.en && I18N.en[key]) || "";
    if (vars) for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nf(opts) { return new Intl.NumberFormat(LOCALE[lang], opts); }
  function num(v, dec) { return nf({ maximumFractionDigits: dec || 0, minimumFractionDigits: dec || 0 }).format(v); }
  /* money like the app: $9 882,12 (ru, uk) · $9,882.12 (en) · $9.882,12 (el, es) */
  function money(v, dec) { dec = dec == null ? 2 : dec; var s = "$" + num(Math.abs(v), dec); return v < 0 ? "−" + s : s; }
  function smoney(v, dec) { return (v > 0 ? "+" : v < 0 ? "−" : "") + "$" + num(Math.abs(v), dec == null ? 2 : dec); }
  function pct(v, d) { d = d == null ? 2 : d; return (v > 0 ? "+" : v < 0 ? "−" : "") + num(Math.abs(v), d) + "%"; }
  function cls(v) { return v > 0 ? "up" : v < 0 ? "down" : ""; }
  function date(ms, long) { return new Intl.DateTimeFormat(DLOCALE[lang], long ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "long" }).format(new Date(ms)); }
  function dshort(ms) { return new Intl.DateTimeFormat(DLOCALE[lang], { day: "2-digit", month: "2-digit" }).format(new Date(ms)); }
  function stamp(ms) { return new Intl.DateTimeFormat(DLOCALE[lang], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(ms)); }
  function ago(ms) {
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 10) return t("ago.now"); if (s < 90) return t("ago.sec", { n: s });
    var m = Math.round(s / 60); return m < 90 ? t("ago.min", { n: m }) : t("ago.h", { n: Math.round(m / 60) });
  }

  function applyI18n() {
    doc.documentElement.lang = lang;
    $$("[data-i]").forEach(function (el) { var v = t(el.getAttribute("data-i")); if (v) el.textContent = v; });
    $$("[data-i-attr]").forEach(function (el) { el.getAttribute("data-i-attr").split(";").forEach(function (pair) { var p = pair.split(":"); var v = t(p[1]); if (v) el.setAttribute(p[0], v); }); });
    var sel = $("#lang"); if (sel) sel.value = lang;
    if (isDoc) {
      var shown = null;
      $$("article[data-lang]").forEach(function (a) { var on = a.getAttribute("data-lang") === lang; a.hidden = !on; if (on) shown = a; });
      if (!shown) { var en = $('article[data-lang="en"]'); if (en) { en.hidden = false; shown = en; } }
      var h = shown && $("h1", shown); if (h) doc.title = h.textContent + " | CRYPTO NOVA AI";
    } else doc.title = t("meta.title");
  }
  function setLang(l) {
    if (!I18N[l]) return;
    lang = l; store("cn.lang", l);
    if (history.replaceState && /[?&]lang=/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash);
    applyI18n();
    if (!isDoc) { renderAll(); renderStatic(); loadHome(); }
  }

  /* ---------- header ---------- */
  var top = $("#top");
  function onScroll() { if (top) top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var mb = $("#menuBtn"), nav = $("#nav");
  function menu(open) { if (!mb || !nav) return; nav.classList.toggle("open", open); mb.setAttribute("aria-expanded", open ? "true" : "false"); }
  if (mb && nav) {
    mb.addEventListener("click", function () { menu(!nav.classList.contains("open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { menu(false); }); });
    doc.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && nav.classList.contains("open")) { menu(false); mb.focus(); } });
  }
  var sel = $("#lang"); if (sel) sel.addEventListener("change", function () { setLang(sel.value); });
  applyI18n();
  if (isDoc) return;

  /* ---------- data: live feeds first, the dated snapshot otherwise ---------- */
  var SNAP = window.CN_SNAP || {};
  var D = { home: {}, live: {}, failed: {}, conveyor: SNAP.conveyor || {}, markets: SNAP.markets || {}, marketsLive: false, btc: SNAP.btc };
  LANGS.forEach(function (l) { if (SNAP.home && SNAP.home[l]) D.home[l] = SNAP.home[l]; });
  function H() { return D.home[lang] || D.home.en || {}; }
  function PP() { var p = H().public_portfolio; return p && typeof p.value_usd === "number" ? p : null; }
  function E() { return H().engine || {}; }
  function nCoins() { var m = D.markets || {}; return m.n || (m.top || []).length || 150; }
  function nDesks() { return ((D.conveyor || {}).counts || {}).paper || 14; }
  function get(name) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(FEED + name + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  var loading = {};
  function loadHome() {
    var l = lang; if (loading[l]) return loading[l];
    loading[l] = get(HOME_FILE[l]).then(function (h) {
      if (!h || typeof h !== "object") throw new Error("empty");
      D.home[l] = { asof: h.asof, public_portfolio: h.public_portfolio || null, engine: h.engine || (D.home[l] || {}).engine };
      D.live[l] = Date.now(); D.failed[l] = false;
    }).catch(function () { D.failed[l] = true; }).then(function () { loading[l] = null; if (l === lang) renderAll(); });
    return loading[l];
  }
  function loadMarkets() {
    return get("markets.json").then(function (m) {
      if (!m || !m.top) return;
      D.markets = { asof: m.asof, n: m.top.length, symbols: m.top.map(function (c) { return c.symbol; }).filter(Boolean), top: m.top };
      D.marketsLive = true; renderTicker(); renderHow();
    }).catch(function () {});
  }
  function loadAll() {
    loadHome(); loadMarkets();
    get("conveyor.json").then(function (c) { if (c && c.counts) { D.conveyor = { asof: c.asof, counts: c.counts }; renderHow(); renderVars(); } }).catch(function () {});
    get("app_btc.json").then(function (b) { if (b && b.closes) { D.btc = b; pgBuilt = ""; renderPiggy(); } }).catch(function () {});
  }

  /* ---------- hero status ---------- */
  function renderStatus() {
    var el = $("#status"); if (!el) return;
    var sp = $("span", el), h = H(), pp = PP();
    el.classList.remove("live", "stale");
    if (D.live[lang] && h.asof) { sp.textContent = t("status.live", { ago: ago(h.asof) }); el.classList.add("live"); }
    else if (D.failed[lang] || !window.fetch) { sp.textContent = t("status.snapshot", { date: stamp((pp && pp.asof) || h.asof || SNAP.made || Date.now()) }); el.classList.add("stale"); }
    else sp.textContent = t("status.wait");
  }
  /* texts with numbers in them */
  function renderVars() {
    var pp = PP() || START, set = function (id, txt) { var el = doc.getElementById(id); if (el) el.textContent = txt; };
    var since = date(pp.since || START.since, true), start = money(pp.start_usd || START.start_usd);
    set("pfLead", t("pf.lead", { since: since, start: start }));
    set("howD1", t("how.s1.d", { n: num(nCoins()) }));
    set("howD3", t("how.s3.d", { n: num(nDesks()) }));
    set("sf1", t("sys.f1", { n: num(nCoins()) }));
    $$("[data-i-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i-html"), { since: since, start: start }); });
    $$("img[data-scr]").forEach(function (im) { var src = "assets/img/screens/" + lang + "/" + im.getAttribute("data-scr") + ".webp"; if (im.getAttribute("src") !== src) im.setAttribute("src", src); });
  }

  /* ---------- the running line: the owner's phrase; market prices join it only when they are live ---------- */
  function renderTicker() {
    var el = $("#ticker"); if (!el) return;
    var m = D.markets || {}, fresh = D.marketsLive && m.asof && Date.now() - m.asof < 30 * 60000, px = [];
    if (fresh) ["BTC", "ETH", "SOL"].forEach(function (s) {
      var c = (m.top || []).filter(function (x) { return x.symbol === s; })[0];
      if (c && c.price) px.push('<span class="px"><b>' + s + "</b>" + money(c.price, c.price >= 100 ? 0 : 2) + '<span class="' + cls(c.chg24 || 0) + '">' + pct(c.chg24 || 0) + "</span></span>");
    });
    var one = "";
    for (var i = 0; i < 4; i++) one += '<span class="ph">' + esc(t("tick.phrase")) + '</span><i class="dot"></i>' + (px.length ? px[i % px.length] + '<i class="dot"></i>' : "");
    el.innerHTML = one + one;
  }

  /* ---------- how it works: the small visuals with the engine's real numbers ---------- */
  var SRC_NAMES = ["BINANCE", "OKX", "BINGX", "HYPERLIQUID", "COINGECKO", "NEWS"];
  function renderHow() {
    var v1 = $("#viz1"), v2 = $("#viz2"), v3 = $("#viz3"), v4 = $("#viz4"), e = E();
    if (v1) v1.innerHTML = '<div class="vrow"><span class="vbig">' + num(nCoins()) + '</span><span class="vk">' + esc(t("how.v1")) + '</span></div><div class="srcs">' +
      SRC_NAMES.map(function (s, i) { return '<span style="--i:' + i + '">' + s + "</span>"; }).join("") + "</div>";
    if (v2) v2.innerHTML = '<p class="vk">' + esc(t("how.v2")) + "</p>" + miniChart();
    if (v3) {
      var rows = [["lab_tried", "f.tried"], ["lab_tested", "f.tested"], ["lab_passed", "f.passed"], ["lab_reliable", "f.reliable"]], max = e.lab_tried || 1;
      v3.innerHTML = '<p class="vk">' + esc(t("how.v3")) + "</p>" + (e.lab_tried ? '<div class="funnel">' + rows.map(function (r) {
        var v = e[r[0]] || 0; return '<div class="fun"><div class="bar" style="width:' + Math.max(12, Math.sqrt(v / max) * 100).toFixed(1) + '%">' + num(v) + "</div><span>" + esc(t(r[1])) + "</span></div>";
      }).join("") + "</div>" : "") + '<div class="desks"><i class="ldot" aria-hidden="true"></i><b>' + num(nDesks()) + "</b><span>" + esc(t("how.v3b")) + "</span></div>";
    }
    if (v4) v4.innerHTML = '<p class="vk">' + esc(t("how.v4")) + '</p><div class="split" aria-hidden="true">' + RULES.map(function (r) { return '<i style="flex:' + r[1] + ";background:" + r[2] + '"></i>'; }).join("") +
      '</div><ul class="splitl">' + RULES.map(function (r) { return '<li><i style="background:' + r[2] + '"></i><span>' + esc(t("split." + r[0])) + "</span><b>" + r[1] + "%</b></li>"; }).join("") + "</ul>";
  }
  function miniChart() {
    // an illustration of what the analysis reads (a price line, a support level, volume) — not data
    var pts = [52, 48, 55, 50, 58, 62, 57, 64, 60, 68, 66, 74, 70, 78, 75, 82], W = 300, Hh = 110, path = pts.map(function (v, i) { return (i ? "L" : "M") + (i * W / (pts.length - 1)).toFixed(1) + " " + (Hh - 18 - (v - 40) * 1.6).toFixed(1); }).join("");
    var bars = pts.map(function (v, i) { var h = 6 + ((i * 37) % 17); return '<rect x="' + (i * W / pts.length + 3).toFixed(1) + '" y="' + (Hh - h) + '" width="' + (W / pts.length - 6).toFixed(1) + '" height="' + h + '" rx="1.5" fill="rgba(127,211,255,.18)"/>'; }).join("");
    return '<svg class="mini" viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true">' + bars +
      '<line x1="0" x2="300" y1="' + (Hh - 18 - (48 - 40) * 1.6) + '" y2="' + (Hh - 18 - (48 - 40) * 1.6) + '" stroke="rgba(127,211,255,.45)" stroke-dasharray="4 5"/>' +
      '<path d="' + path + '" fill="none" stroke="#BFE6FF" stroke-width="2" stroke-linejoin="round"/>' +
      (reduce ? "" : '<g class="scan"><rect x="-24" y="0" width="24" height="110" fill="url(#scg)"/><rect x="-1.5" y="0" width="1.5" height="110" fill="#BFE6FF" opacity=".7"/></g><defs><linearGradient id="scg" x1="0" x2="1"><stop offset="0" stop-color="#7FD3FF" stop-opacity="0"/><stop offset="1" stop-color="#7FD3FF" stop-opacity=".18"/></linearGradient></defs>') + "</svg>";
  }

  /* ---------- 4 · the public portfolio ---------- */
  var PF = { per: "all" };
  var PERS = ["day", "week", "month", "all"];
  function renderPortfolio() {
    var box = $("#pf"); if (!box) return;
    var pp = PP(), note = $("#pfNote");
    var live = !!D.live[lang];
    if (!pp) {
      $("#pfVal").textContent = "—"; $("#pfRes").innerHTML = ""; $("#pfPerV").textContent = ""; $("#pfCurve").innerHTML = "";
      ["#pfRules", "#pfWhere", "#pfHold", "#pfTrades", "#pfActs"].forEach(function (s) { var el = $(s); if (el) el.innerHTML = ""; });
      note.className = "pfnote stale"; note.innerHTML = "<span>" + esc(t("pf.none")) + "</span>" + retryBtn();
      bindRetry(); renderRules(); return;
    }
    $("#pfVal").textContent = money(pp.value_usd);
    $("#pfRes").innerHTML = '<span class="' + cls(pp.pnl_usd) + '">' + smoney(pp.pnl_usd) + " · " + pct(pp.pnl_pct) + "</span> " + esc(t("pf.res", { date: date(pp.since) })) +
      (pp.today_usd != null ? "<small>" + esc(t("pf.today")) + ': <span class="' + cls(pp.today_usd) + '">' + smoney(pp.today_usd) + " · " + pct(pp.today_pct || 0) + "</span></small>" : "");
    if (live && !pp.stale) { note.className = "pfnote"; note.innerHTML = "<span>" + esc(t("pf.live", { ago: ago(pp.asof) })) + "</span>"; }
    else if (live && pp.stale) { note.className = "pfnote stale"; note.innerHTML = "<span>" + esc(t("pf.stale", { date: stamp(pp.asof) })) + "</span>"; }
    else if (D.failed[lang] || !window.fetch) { note.className = "pfnote stale"; note.innerHTML = "<span>" + esc(t("pf.snap", { date: stamp(pp.asof) })) + "</span>" + retryBtn(); bindRetry(); }
    else { note.className = "pfnote"; note.textContent = t("status.wait"); }
    renderPeriods(pp); renderRules(); renderWhere(pp); renderHold(pp); renderTrades(pp); renderActs(pp);
  }
  function retryBtn() { return window.fetch ? '<button type="button" class="btn" id="pfRetry">' + esc(t("pf.retry")) + "</button>" : ""; }
  function bindRetry() {
    var b = $("#pfRetry"); if (!b) return;
    b.addEventListener("click", function () { b.disabled = true; b.textContent = "…"; loadHome(); });
  }
  function renderPeriods(pp) {
    var seg = $("#pfPer"), per = (pp.periods || {});
    if (!per[PF.per]) PF.per = "all";
    seg.innerHTML = PERS.map(function (k) { return '<button type="button" data-k="' + k + '" aria-pressed="' + (k === PF.per) + '">' + esc(t("pf.per." + k)) + "</button>"; }).join("");
    $$("button", seg).forEach(function (b) { b.addEventListener("click", function () { PF.per = b.getAttribute("data-k"); renderPeriods(PP() || pp); }); });
    var p = per[PF.per] || {}, v = $("#pfPerV");
    if (PF.per === "all") p = { from: pp.since, available: true, base_usd: pp.start_usd, usd: pp.pnl_usd, pct: pp.pnl_pct, clipped: false };
    if (p.available && p.usd != null) {
      var from = p.clipped ? t("pf.per.clip", { date: date(p.from) }) : t("pf.per.from", { date: PF.per === "day" ? stamp(p.from) : date(p.from) });
      v.innerHTML = '<span class="' + cls(p.usd) + '">' + smoney(p.usd) + " · " + pct(p.pct || 0) + "</span><small>" + esc(from) + "</small>";
    } else v.innerHTML = '<span class="small">' + esc(t("pf.per.na")) + "</span>";
    drawCurve($("#pfCurve"), pp, p.from || pp.since, p.base_usd || pp.start_usd, p.usd);
  }
  function drawCurve(box, pp, from, base, res) {
    var c = (pp.curve || []).filter(function (r) { return r && r[0] >= from - 1 && typeof r[1] === "number"; });
    if (c.length < 2) { box.innerHTML = '<p class="small" style="padding-top:40px">' + esc(t("pf.per.na")) + "</p>"; return; }
    var W = 640, Hh = 220, padT = 12, padB = 24, t0 = c[0][0], t1 = c[c.length - 1][0];
    var vals = c.map(function (r) { return r[1]; }).concat([base]), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * 0.15, 4); lo -= pad; hi += pad;
    function X(tm) { return (tm - t0) / Math.max(1, t1 - t0) * W; }
    function Y(v) { return padT + (1 - (v - lo) / (hi - lo)) * (Hh - padT - padB); }
    var xy = c.map(function (r) { return X(r[0]).toFixed(1) + "," + Y(r[1]).toFixed(1); }), last = c[c.length - 1];
    var col = (res != null ? res : last[1] - base) >= 0 ? "#3ADB93" : "#FF7A90", yb = Y(base);
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" role="img" aria-label="' + esc(t("pf.chart") + ": " + money(c[0][1]) + " → " + money(last[1])) + '">' +
      '<defs><linearGradient id="pfg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".22"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<line x1="0" x2="' + W + '" y1="' + yb.toFixed(1) + '" y2="' + yb.toFixed(1) + '" stroke="rgba(127,211,255,.4)" stroke-dasharray="4 5" vector-effect="non-scaling-stroke"/>' +
      '<polygon points="0,' + (Hh - padB) + " " + xy.join(" ") + " " + W + "," + (Hh - padB) + '" fill="url(#pfg)"/>' +
      '<polyline points="' + xy.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="cv-dot" style="left:' + (X(last[0]) / W * 100).toFixed(2) + "%;top:" + (Y(last[1]) / Hh * 100).toFixed(2) + "%;background:" + col + '"></span>' +
      '<span class="cv-b" style="top:' + (yb / Hh * 100).toFixed(2) + '%">' + esc(t("pf.start", { v: money(base) })) + "</span>" +
      '<span class="cv-x cv-l">' + esc(PF.per === "day" ? stamp(t0) : date(t0)) + '</span><span class="cv-x cv-r">' + esc(PF.per === "day" ? stamp(t1) : date(t1)) + "</span>";
  }
  function renderRules() {
    var el = $("#pfRules"); if (!el) return;
    el.innerHTML = '<div class="split" aria-hidden="true">' + RULES.map(function (r) { return '<i style="flex:' + r[1] + ";background:" + r[2] + '"></i>'; }).join("") + "</div>" +
      RULES.map(function (r) { var k = "pf.rule." + r[0]; return '<div class="rule"><i style="background:' + r[2] + '"></i><b>' + esc(t(k)) + "</b><em>" + r[1] + "%</em><p>" + esc(t(k + ".d")) + "</p></div>"; }).join("");
  }
  function rowsHTML(items) {
    var max = Math.max.apply(null, items.map(function (x) { return x.share || 0; }).concat([1]));
    return '<ul class="rows">' + items.map(function (x) {
      return "<li><span" + (x.sym ? ' class="sym"' : "") + ">" + esc(x.name) + '</span><span class="n">' + money(x.usd || 0, 0) + '</span><span class="p">' + num(x.share || 0, 1) + '%</span><span class="b"><s style="width:' + Math.min(100, (x.share || 0) / max * 100).toFixed(1) + '%"></s></span></li>';
    }).join("") + "</ul>";
  }
  function renderWhere(pp) {
    var el = $("#pfWhere"); if (!el) return;
    var g = ((pp.alloc || {}).groups || []).map(function (x) { return { name: x.name, usd: x.usd, share: x.share }; });
    var sp = pp.spot || {}, fu = pp.futures || {};
    var parts = (sp.pnl_usd != null || fu.pnl_usd != null) ? '<div class="parts"><p class="k">' + esc(t("pf.parts", { date: date(pp.since) })) + "</p>" +
      [["pf.part.spot", sp], ["pf.part.fut", fu]].map(function (r) { var o = r[1]; return o.pnl_usd == null ? "" : '<div class="pp"><span>' + esc(t(r[0])) + (o.share_pct ? " · " + num(o.share_pct) + "%" : "") + '</span><b class="' + cls(o.pnl_usd) + '">' + smoney(o.pnl_usd) + " · " + pct(o.pct || 0) + "</b></div>"; }).join("") +
      (sp.base_note || fu.base_note ? "<small>" + esc([sp.base_note, fu.base_note].filter(Boolean).join(" ")) + "</small>" : "") + "</div>" : "";
    el.innerHTML = (g.length ? rowsHTML(g) : '<p class="none">' + esc(t("pf.per.na")) + "</p>") + parts;
  }
  function renderHold(pp) {
    var el = $("#pfHold"); if (!el) return;
    var a = ((pp.alloc || {}).assets || []).slice().sort(function (x, y) { return (y.usd || 0) - (x.usd || 0); }).slice(0, 10)
      .map(function (x) { return { name: x.sym === "USDT" ? t("pf.cash") : x.sym, sym: x.sym !== "USDT", usd: x.usd, share: x.share }; });
    el.innerHTML = a.length ? rowsHTML(a) : '<p class="none">' + esc(t("pf.per.na")) + "</p>";
  }
  function renderTrades(pp) {
    var el = $("#pfTrades"); if (!el) return;
    var f = pp.futures || {}, st = f.stats || {}, open = f.open || [], closed = (f.closed || []).slice().sort(function (a, b) { return (b.closed || 0) - (a.closed || 0); }).slice(0, 5);
    var sym = function (o) { return o.sym || String(o.inst || "").split("-")[0]; }, side = function (o) { return String(o.side || "").toUpperCase() === "SHORT" ? t("pf.short") : t("pf.long"); };
    var h = st.n != null ? '<p class="tstats">' + esc(t("pf.stats", { n: num(st.n || 0), w: num(st.wins || 0), l: num(st.losses || 0) })) + "</p>" : "";
    if (open.length) h += open.map(function (o) {
      var u = o.upnl_usd != null ? o.upnl_usd : null;
      return '<div class="trade"><span><span class="sym">' + esc(sym(o)) + '</span><span class="side">' + esc(side(o)) + "</span></span>" + '<span class="r ' + cls(u || 0) + '">' + (u != null ? smoney(u) : "") + "</span>" +
        "<small>" + esc(t("pf.open.h")) + (o.opened ? " " + dshort(o.opened) : "") + (o.lev ? " · " + esc(t("pf.lev", { n: num(o.lev) })) : "") + '</small><small class="r">' + (o.upnl_pct != null ? pct(o.upnl_pct) : "") + "</small></div>";
    }).join("");
    else h += '<p class="none">' + esc(t("pf.open.none")) + "</p>";
    h += closed.map(function (o) {
      return '<div class="trade"><span><span class="sym">' + esc(sym(o)) + '</span><span class="side">' + esc(side(o)) + "</span></span>" + '<span class="r ' + cls(o.pnl_usd || 0) + '">' + smoney(o.pnl_usd || 0) + "</span>" +
        "<small>" + esc(t("pf.closed.h")) + " " + (o.opened ? dshort(o.opened) + " → " : "") + (o.closed ? dshort(o.closed) : "") + (o.lev ? " · " + esc(t("pf.lev", { n: num(o.lev) })) : "") + '</small><small class="r">' + (o.move_pct != null ? pct(o.move_pct) : "") + "</small></div>";
    }).join("");
    el.innerHTML = h;
  }
  function renderActs(pp) {
    var el = $("#pfActs"); if (!el) return;
    var a = (pp.actions || []).slice(0, 4);
    el.innerHTML = a.length ? a.map(function (x) { return '<li><time datetime="' + new Date(x.t).toISOString() + '">' + esc(dshort(x.t)) + "</time><span>" + esc(x.text || "") + "</span></li>"; }).join("") : "<li><span>" + esc(t("pf.acts.none")) + "</span></li>";
  }

  /* ---------- the NOVA AI sphere's coin colours (shared by the two canvases) ---------- */
  var COINCOL = { BTC: "#F7931A", ETH: "#8A92B2", SOL: "#9945FF", XRP: "#5B7FA6", BNB: "#F3BA2F", DOGE: "#C2A633", ADA: "#3468D1", LINK: "#2A5ADA", AVAX: "#E84142", SUI: "#4DA2FF", TON: "#0098EA", DOT: "#E6007A", NEAR: "#00C08B", LTC: "#A6A9AA", UNI: "#FF5CA8", TRX: "#EB0029", APT: "#3BD6B4", ARB: "#28A0F0", OP: "#FF0420", HYPE: "#5CE1C6", ZEC: "#ECB244", PENGU: "#7AB6FF", AAVE: "#B6509E", XLM: "#5AA1C9", HBAR: "#7A7A7A", BCH: "#0AC18E" };
  var GLYPH = { BTC: "₿", ETH: "Ξ", LTC: "Ł", DOGE: "Ð", ADA: "₳" };
  function hashS(x) { var h = 0; for (var i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0; return Math.abs(h); }
  function coinPool() {
    var s = ((D.markets || {}).symbols || []).filter(function (x) { return /^[A-Z0-9]{2,6}$/.test(x); });
    return s.length > 12 ? s.slice(0, 40) : ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "LINK", "AVAX", "SUI", "TON", "DOT", "NEAR", "LTC", "HYPE", "TRX", "APT", "ARB", "OP", "ZEC", "AAVE", "XLM"];
  }
  function heldCoins() {
    var a = (((PP() || {}).alloc || {}).assets || []).map(function (x) { return x.sym; }).filter(function (x) { return x && x !== "USDT"; });
    return a.length ? a : ["BTC", "ETH", "SOL"];
  }
  /* coins and glows are drawn once into small sprites and reused every frame (no gradients per frame) */
  var SPR = {};
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { SPR = {}; });
  function sprite(key, size, paint) { var c = SPR[key]; if (c) return c; c = doc.createElement("canvas"); c.width = c.height = Math.max(2, Math.ceil(size)); paint(c.getContext("2d"), c.width / 2); SPR[key] = c; return c; }
  function drawCoin(ctx, sym, x, y, r, a, glowCol) {
    var rr = Math.round(r * 2) / 2, pad = glowCol ? rr * 1.5 : 1;
    var c = sprite("c|" + sym + "|" + rr + "|" + (glowCol || ""), (rr + pad) * 2, function (g, m) {
      var base = COINCOL[sym] || "hsl(" + (hashS(sym) % 360) + ",50%,58%)";
      if (glowCol) { var h = g.createRadialGradient(m, m, rr * 0.8, m, m, rr * 2.4); h.addColorStop(0, "rgba(" + glowCol + ",.38)"); h.addColorStop(1, "rgba(" + glowCol + ",0)"); g.fillStyle = h; g.beginPath(); g.arc(m, m, rr * 2.4, 0, 6.2832); g.fill(); }
      var gr = g.createRadialGradient(m - rr * 0.35, m - rr * 0.4, rr * 0.1, m, m, rr);
      gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(0.3, base); gr.addColorStop(1, "rgba(8,14,32,.95)");
      g.fillStyle = gr; g.beginPath(); g.arc(m, m, rr, 0, 6.2832); g.fill();
      g.lineWidth = Math.max(1, rr * 0.12); g.strokeStyle = "rgba(225,240,255,.6)"; g.beginPath(); g.arc(m, m, rr - g.lineWidth / 2, 0, 6.2832); g.stroke();
      if (rr >= 6.5) {
        var gl = GLYPH[sym] || sym.slice(0, sym.length > 3 ? 3 : sym.length);
        g.font = "700 " + Math.round(rr * (gl.length > 2 ? 0.6 : gl.length > 1 ? 0.76 : 1.05)) + "px 'JetBrains Mono',monospace"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillStyle = "#fff"; g.fillText(gl, m, m + rr * 0.05);
      }
    });
    ctx.globalAlpha = a; ctx.drawImage(c, x - c.width / 2, y - c.height / 2); ctx.globalAlpha = 1;
  }
  function glow(ctx, x, y, r, col, a) {
    var rr = Math.max(2, Math.round(r));
    var c = sprite("g|" + col + "|" + rr, rr * 2, function (g, m) { var gr = g.createRadialGradient(m, m, 0, m, m, m); gr.addColorStop(0, "rgba(" + col + ",1)"); gr.addColorStop(1, "rgba(" + col + ",0)"); g.fillStyle = gr; g.fillRect(0, 0, m * 2, m * 2); });
    ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.drawImage(c, x - c.width / 2, y - c.height / 2); ctx.globalAlpha = 1;
  }
  function ease(s) { return s * s * (3 - 2 * s); }
  function runner(cv, frame) {   // runs a canvas only while it is on screen, the tab is visible and motion is allowed
    var running = false, visible = true;
    function set() { var want = visible && !doc.hidden && !reduce; if (want && !running) { running = true; requestAnimationFrame(loop); } else if (!want) running = false; }
    function loop(now) { if (!running) return; frame(now); requestAnimationFrame(loop); }
    doc.addEventListener("visibilitychange", set);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; set(); }).observe(cv);
    set();
    return { running: function () { return running; } };
  }

  /* ---------- hero: coins → NOVA AI → the phone (the owner's idea, kept) ----------
     Coins from the market's sources move through three layers (collect, analyse, test); at every layer part of them fades out —
     the system drops them. The few that pass reach NOVA AI (the brand sphere), which sends the result as light into the app.
     It explains the process; it never shows a coin turning into profit. */
  function makeSystem(cv) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d"), W = 0, Hh = 0, dpr = 1, t0 = performance.now(), last = 0;
    var SRC = ["BINANCE", "OKX", "BINGX", "HYPERLIQUID", "COINGECKO", "NEWS", "F&G INDEX", "HISTORY"], SRC_S = ["BINANCE", "OKX", "BINGX", "HYPER", "GECKO", "NEWS", "F&G", "HIST"];
    var L = [], P = [], ph = { x: 0, t: 0, b: 0 }, FAN = 13, glowIn = 0, sx = 0, narrow = false, AI = { x: 0, y: 0, r: 0, hit: 0 }, act = [0, 0, 0, 0], cr = 6;
    var chips = $$("#sysflow li"), phoneEl = $(".hero-phone .phone");
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, cv.clientWidth < 620 ? 1.5 : 2); W = cv.width = Math.max(1, Math.round(cv.clientWidth * dpr)); Hh = cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
      var pe = $(".hero-phone"), cb = cv.getBoundingClientRect(), pb = pe ? pe.getBoundingClientRect() : null;
      ph.x = pb && pb.width ? (pb.left - cb.left) * dpr : W * 0.75;
      ph.t = pb && pb.height ? (pb.top - cb.top + pb.height * 0.18) * dpr : Hh * 0.2; ph.b = pb && pb.height ? (pb.top - cb.top + pb.height * 0.82) * dpr : Hh * 0.8;
      narrow = cv.clientWidth < 620; cr = (narrow ? 5 : 8.4) * dpr;
      ctx.font = "500 " + Math.round(9 * dpr) + "px 'JetBrains Mono',monospace";
      var mw = 0; (narrow ? SRC_S : SRC).forEach(function (n) { mw = Math.max(mw, ctx.measureText(n).width); });
      sx = mw + 10 * dpr;
      // the NOVA AI emblem, a little larger than the old sphere
      AI.r = Math.max(15 * dpr, Math.min(W * (narrow ? 0.072 : 0.062), Hh * 0.118)); AI.x = ph.x - AI.r * 1.6 - Math.max(W * 0.035, 12 * dpr); AI.y = Hh * 0.48;
      var x0 = sx + Math.max(W * 0.06, 18 * dpr), x1 = AI.x - AI.r * 1.7 - Math.max(W * 0.04, 12 * dpr), sizes = [6, 8, 6];
      L = sizes.map(function (n, li) { var x = x0 + (x1 - x0) * li / (sizes.length - 1), out = []; for (var k = 0; k < n; k++) out.push({ x: x, y: Hh * (0.1 + 0.8 * k / (n - 1)), lit: 0 }); return out; });
    }
    function srcY(i) { return Hh * (0.07 + 0.86 * i / (SRC.length - 1)); }
    function fan(i) { var k = FAN > 1 ? i / (FAN - 1) : 0.5, ax = AI.x + AI.r * 0.6, ay = AI.y + (k - 0.5) * AI.r * 0.5, bx = ph.x + 2 * dpr, by = ph.t + (ph.b - ph.t) * k; return { ax: ax, ay: ay, bx: bx, by: by, cx: (ax + bx) / 2, cy: ay + (by - ay) * 0.15 }; }
    function spawn(seed) {
      var pool = coinPool(), held = heldCoins(), keep = Math.random() < 0.3;
      var sym = keep ? held[Math.floor(Math.random() * held.length)] : pool[Math.floor(Math.random() * pool.length)];
      var si = Math.floor(Math.random() * SRC.length);
      var p = { sym: sym, seg: -1, k: Math.floor(Math.random() * L[0].length), from: { x: sx, y: srcY(si) }, s: 0, v: 0.45 + Math.random() * 0.25, drop: -1, a: 1, keep: keep };
      // which layer drops it (the held coins pass every layer); the rest fail at layer 1, 2 or 3
      if (!keep) p.drop = Math.random() < 0.45 ? 0 : Math.random() < 0.6 ? 1 : 2;
      if (seed) { p.seg = Math.floor(Math.random() * 3) - 1; if (p.seg >= 0) p.k = Math.floor(Math.random() * L[p.seg].length); p.s = Math.random(); }
      P.push(p);
    }
    function target(p) {
      if (p.seg === -1) return { A: p.from, B: L[0][p.k] };
      if (p.seg < 2) { if (p.nk == null) p.nk = Math.floor(Math.random() * L[p.seg + 1].length); return { A: L[p.seg][p.k], B: L[p.seg + 1][p.nk] }; }
      if (p.seg === 2) return { A: L[2][p.k], B: { x: AI.x - AI.r * 0.7, y: AI.y + (L[2][p.k].y - AI.y) * 0.12 } };
      var f = fan(p.f); return { A: { x: f.ax, y: f.ay }, B: { x: f.bx, y: f.by }, q: f };
    }
    function frame(now) {
      var tm = Math.max(0, ((now == null ? performance.now() + 4000 : now) - t0) / 1000), dt = 0.016;
      if (now != null) { dt = last ? Math.min(0.05, Math.max(0, tm - last)) : 0.016; last = tm; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, Hh);
      if (!L.length) size();
      if (now != null && Math.random() < dt * 5.4) spawn(false);
      // sources
      ctx.font = "500 " + Math.round(9 * dpr) + "px 'JetBrains Mono',monospace"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      (narrow ? SRC_S : SRC).forEach(function (n, i) { var y = srcY(i); ctx.fillStyle = "rgba(160,205,240,.7)"; ctx.fillText(n, sx - 7 * dpr, y); ctx.fillStyle = "rgba(127,211,255,.9)"; ctx.beginPath(); ctx.arc(sx, y, 2 * dpr, 0, 6.2832); ctx.fill(); });
      // wires
      ctx.lineWidth = dpr * 0.6; ctx.strokeStyle = "rgba(127,211,255,.07)"; ctx.beginPath();
      for (var li = 0; li < L.length - 1; li++) L[li].forEach(function (a) { L[li + 1].forEach(function (b) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }); });
      L[2].forEach(function (a) { ctx.moveTo(a.x, a.y); ctx.lineTo(AI.x - AI.r * 0.7, AI.y + (a.y - AI.y) * 0.12); });
      ctx.stroke();
      // the soft fan of light from NOVA AI into the phone
      for (var fi = 0; fi < FAN; fi++) {
        var fq = fan(fi);
        ctx.strokeStyle = "rgba(150,215,255," + (0.16 + glowIn * 0.2).toFixed(3) + ")"; ctx.lineWidth = (fi % 3 ? 0.7 : 1.1) * dpr; ctx.beginPath(); ctx.moveTo(fq.ax, fq.ay); ctx.quadraticCurveTo(fq.cx, fq.cy, fq.bx, fq.by); ctx.stroke();
      }
      // layer nodes
      L.forEach(function (layer) { layer.forEach(function (n) { n.lit = Math.max(0, n.lit - dt * 1.6); var r = 3 * dpr; glow(ctx, n.x, n.y, r * 4.5, "127,211,255", 0.08 + n.lit * 0.4); ctx.fillStyle = "rgba(8,16,40,.95)"; ctx.strokeStyle = "rgba(127,211,255," + (0.45 + n.lit * 0.5).toFixed(3) + ")"; ctx.lineWidth = 1.1 * dpr; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.2832); ctx.fill(); ctx.stroke(); }); });
      // coins and light
      P = P.filter(function (p) {
        if (now != null) p.s += p.v * dt;
        if (p.fade) { p.a -= dt * 1.4; p.y0 = (p.y0 || 0) + dt * 14 * dpr; if (p.a <= 0) return false; }
        var tg = target(p);
        if (p.s >= 1 && !p.fade) {
          if (p.seg === 3) { glowIn = 1; act[3] = 1; return false; }
          if (p.seg === 2) { AI.hit = 1; act[3] = Math.max(act[3], 0.7); p.seg = 3; p.s = 0; p.v = 0.9; p.f = Math.floor(Math.random() * FAN); return true; }
          var node = tg.B; node.lit = 1; act[p.seg + 1] = 1;
          if (p.seg + 1 === p.drop) { p.fade = true; p.s = 1; p.fx = node.x; p.fy = node.y; return true; }
          p.k = p.seg === -1 ? p.k : p.nk; p.nk = null; p.seg += 1; p.s = 0;
        }
        var s = ease(Math.min(1, p.s)), x, y;
        if (p.fade) { x = p.fx; y = p.fy + p.y0; }
        else if (p.seg === 3 && tg.q) { var u = 1 - s, q = tg.q; x = u * u * q.ax + 2 * u * s * q.cx + s * s * q.bx; y = u * u * q.ay + 2 * u * s * q.cy + s * s * q.by; }
        else { x = tg.A.x + (tg.B.x - tg.A.x) * s; y = tg.A.y + (tg.B.y - tg.A.y) * s; }
        if (p.seg === 3) { glow(ctx, x, y, 9 * dpr, "200,235,255", 0.5); ctx.fillStyle = "rgba(235,248,255,.95)"; ctx.beginPath(); ctx.arc(x, y, 2.2 * dpr, 0, 6.2832); ctx.fill(); }
        else if (p.fade) { ctx.globalAlpha = Math.max(0, p.a) * 0.6; ctx.fillStyle = "rgba(140,160,190,1)"; ctx.beginPath(); ctx.arc(x, y, cr * 0.8, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; }
        else drawCoin(ctx, p.sym, x, y, cr, Math.min(1, p.a), p.seg === 2 ? "127,211,255" : null);
        return true;
      });
      // NOVA AI decides
      AI.hit = Math.max(0, AI.hit - dt * 1.3);
      if (AI.hit > 0.02) glow(ctx, AI.x, AI.y, AI.r * 2.2, "120,210,255", 0.32 * AI.hit);
      if (window.NovaSphere) NovaSphere.draw(ctx, AI.x, AI.y, AI.r * 2.1, now == null ? 0 : tm, { busy: AI.hit > 0.5, still: now == null });
      ctx.font = "700 " + Math.round(9.5 * dpr) + "px 'JetBrains Mono',monospace"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillStyle = "#CFEFFF";
      ctx.fillText("NOVA AI", AI.x, AI.y + AI.r * 1.8);
      glowIn = Math.max(0, glowIn - dt * 1.4);
      if (phoneEl) { var on = glowIn > 0.25; if (on !== phoneEl.classList.contains("arrive")) phoneEl.classList.toggle("arrive", on); }
      for (var c = 0; c < 4; c++) { act[c] = Math.max(now == null ? 0.5 : 0, act[c] - dt * 1.1); var av = Math.round(act[c] * 10) / 10; if (chips[c] && chips[c]._a !== av) { chips[c]._a = av; chips[c].style.setProperty("--a", av.toFixed(1)); } }
    }
    size(); for (var i = 0; i < 30; i++) spawn(true);
    var r = runner(cv, frame);
    window.addEventListener("resize", function () { size(); if (!r.running()) frame(); });
    setTimeout(function () { size(); if (!r.running()) frame(); }, 400);
    if (window.NovaSphere && NovaSphere.ready) NovaSphere.ready(function () { if (!r.running()) frame(); });
    frame();
    return { size: size };
  }

  /* ---------- 1 · what: hundreds of coins in, few reach the portfolio ---------- */
  function thinkFlow(cv) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d"), W = 0, Hh = 0, dpr = 1, gates = [], ex = 0, ey = 0, C = [], last = 0, t0 = performance.now(), pulse = 0, seeded = false;
    var SURV = [0.6, 0.62, 0.5, 0.45];
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, cv.clientWidth < 620 ? 1.5 : 2); W = cv.width = Math.max(1, Math.round(cv.clientWidth * dpr)); Hh = cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
      ex = W - colW(); ey = Hh / 2; gates = []; for (var g = 1; g <= 4; g++) gates.push((ex - 40 * dpr) * g / 4.6);
    }
    function colW() { return Math.min(Math.max(W * 0.22, 128 * dpr), 176 * dpr); }
    function label(txt, x, y, px, col, weight, maxW) {
      var s = px; ctx.font = (weight || 500) + " " + Math.round(s * dpr) + "px 'JetBrains Mono',monospace";
      while (s > 6.5 && ctx.measureText(txt).width > maxW) { s -= 0.5; ctx.font = (weight || 500) + " " + Math.round(s * dpr) + "px 'JetBrains Mono',monospace"; }
      ctx.fillStyle = col; ctx.fillText(txt, x, y);
    }
    function spawn() { var P = coinPool(), held = heldCoins(), fate = 0; while (fate < 4 && Math.random() < SURV[fate]) fate++; var sym = fate >= 4 ? held[Math.floor(Math.random() * held.length)] : P[Math.floor(Math.random() * P.length)]; C.push({ sym: sym, x: -20 * dpr, y: Hh * (0.1 + Math.random() * 0.8), v: (55 + Math.random() * 35) * dpr, fate: fate, st: "go", a: 1, vy: 0 }); }
    function band(x) { var k = Math.min(1, Math.max(0, x / ex)); return Hh * (0.44 - 0.36 * k); }
    function frame(now) {
      var tm = ((now == null ? performance.now() + 5000 : now) - t0) / 1000, dt = 0.016;
      if (now != null) { dt = last ? Math.min(0.05, Math.max(0, tm - last)) : 0.016; last = tm; }
      if (!seeded) { seeded = true; for (var w0 = 0; w0 < 46; w0++) { spawn(); var c0 = C[C.length - 1]; c0.x = Math.random() * ex * 0.92; if (c0.fate < 4 && c0.x > gates[c0.fate]) C.pop(); } }
      if (now != null && Math.random() < dt * 8) spawn();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, Hh);
      ctx.fillStyle = "rgba(0,160,220,.05)"; ctx.beginPath(); ctx.moveTo(0, Hh * 0.06); ctx.lineTo(ex, ey - Hh * 0.08); ctx.lineTo(ex, ey + Hh * 0.08); ctx.lineTo(0, Hh * 0.94); ctx.closePath(); ctx.fill();
      gates.forEach(function (gx) { var hb = band(gx) + 10 * dpr; ctx.strokeStyle = "rgba(127,211,255,.3)"; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.moveTo(gx, ey - hb); ctx.lineTo(gx, ey + hb); ctx.stroke(); ctx.strokeStyle = "rgba(127,211,255,.14)"; ctx.lineWidth = dpr; ctx.beginPath(); for (var yy = ey - hb; yy <= ey + hb; yy += 7 * dpr) { ctx.moveTo(gx - 4 * dpr, yy); ctx.lineTo(gx + 4 * dpr, yy); } ctx.stroke(); });
      if (!reduce) { var sw = ((tm * 0.14) % 1.2 - 0.1) * ex, sg = ctx.createLinearGradient(sw - 60 * dpr, 0, sw, 0); sg.addColorStop(0, "rgba(127,211,255,0)"); sg.addColorStop(1, "rgba(190,240,255,.16)"); ctx.fillStyle = sg; ctx.fillRect(sw - 60 * dpr, 0, 60 * dpr, Hh); }
      var r = (W < 900 ? 8.5 : 10) * dpr;
      C = C.filter(function (c) {
        if (c.st === "go") {
          if (now != null) c.x += c.v * dt; var hb2 = band(c.x); c.y += (Math.max(ey - hb2, Math.min(ey + hb2, c.y)) - c.y) * Math.min(1, dt * 3);
          var g = gates[c.fate]; if (c.fate < 4 && g != null && c.x >= g - 6 * dpr) { c.st = "out"; c.vy = (Math.random() < 0.5 ? -1 : 1) * 26 * dpr; }
          if (c.fate >= 4 && c.x >= ex - 18 * dpr) { pulse = 1; return false; }
          drawCoin(ctx, c.sym, c.x, c.y, r, 1, c.fate >= 4 && c.x > gates[3] ? "127,211,255" : null);
        } else {
          c.vy *= 1.02; c.y += c.vy * dt; c.x += c.v * 0.12 * dt; c.a -= dt * 1.3; if (c.a <= 0) return false;
          ctx.globalAlpha = Math.max(0, c.a) * 0.55; ctx.fillStyle = "rgba(140,160,190,1)"; ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.8, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
        }
        return c.x < W + 30 * dpr;
      });
      pulse = Math.max(0, pulse - dt * 1.5);
      var bw = colW(), cx = W - bw / 2 - 4 * dpr, half = Math.min(bw * 0.4, Hh * 0.2), mw = bw - 10 * dpr;
      if (window.NovaSphere) NovaSphere.draw(ctx, cx, ey - Hh * 0.1, half, now == null ? 0 : tm, { busy: pulse > 0.3, still: now == null });
      var held = heldCoins().length, ty = ey - Hh * 0.1 + half * 0.95;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      label(t("think.out"), cx, ty, 8.5, "rgba(160,215,245,.9)", 500, mw);
      label(num(held), cx, ty + 13 * dpr, 19, pulse > 0.05 ? "#FFFFFF" : "#DDF2FF", 700, mw);
      label(t("think.out.coins"), cx, ty + 36 * dpr, 8.5, "rgba(200,225,245,.85)", 500, mw);
      label(t("think.out.desks", { n: num(nDesks()) }), cx, ty + 50 * dpr, 8.5, "rgba(127,211,255,.75)", 500, mw);
      ctx.textAlign = "left"; label(t("think.in", { n: num(nCoins()) }), 10 * dpr, 8 * dpr, 8.5, "rgba(160,205,240,.75)", 500, W * 0.6);
    }
    size();
    var r = runner(cv, frame);
    window.addEventListener("resize", function () { size(); if (!r.running()) frame(); });
    if (window.NovaSphere && NovaSphere.ready) NovaSphere.ready(function () { if (!r.running()) frame(); });
    frame();
    return { draw: function () { if (!r.running()) frame(); } };
  }

  /* ---------- the app: a static, upright phone; the tab list next to it (under it on a phone) switches its screen ----------
     Owner 29.10: «телефон кривой, кнопочки не нажимаются, разбор портфеля дёргается, переключатель ниже не нужен». Every screen
     is a stacked <img> in one fixed 720×1560 box (nothing moves or changes size); the screens of the language are preloaded
     when the section comes near, and a tab shows its screen only once it is decoded, so a switch never flashes or jumps. */
  var TABS = ["home", "demo", "fut", "spot", "nova", "review", "buy", "learn", "piggy", "connect"], tabKey = "home", scrLang = "", scrWant = 0;
  function scrSrc(k) { return "assets/img/screens/" + lang + "/" + k + ".webp"; }
  function scrPreload() {
    $$("#scr img").forEach(function (im) { var s = im.getAttribute("data-src"); if (s) { im.src = s; im.removeAttribute("data-src"); } });
  }
  function renderScreens() {
    var scr = $("#scr"); if (!scr) return;
    if (scrLang !== lang) {
      scrLang = lang;
      scr.innerHTML = TABS.map(function (k) {
        var on = k === tabKey;
        return '<img data-k="' + k + '" alt="' + esc(t("tab." + k + ".t") + ": " + t("tab." + k + ".p")) + '" ' + (on ? 'src="' + scrSrc(k) + '" class="on"' : 'data-src="' + scrSrc(k) + '" aria-hidden="true"') + ' width="720" height="1560" decoding="async" draggable="false">';
      }).join("");
      if (scrNear) scrPreload();
    } else $$("#scr img").forEach(function (im) { var k = im.getAttribute("data-k"); im.alt = t("tab." + k + ".t") + ": " + t("tab." + k + ".p"); });
    markTab(tabKey);
  }
  var scrNear = false;
  (function () {
    var box = $("#app");
    if (box && "IntersectionObserver" in window) { var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { scrNear = true; scrPreload(); io.disconnect(); } }, { rootMargin: "900px 0px" }); io.observe(box); }
    else { scrNear = true; scrPreload(); }
  })();
  function markTab(k) {
    tabKey = k;
    $$("#tabs .tab").forEach(function (b) { var on = b.getAttribute("data-k") === k; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
    var scr = $("#scr"); if (scr) scr.setAttribute("aria-labelledby", "tab-" + k);
    var d = $("#tabdesc"); if (d) d.innerHTML = "<b>" + esc(t("tab." + k + ".t")) + "</b> " + esc(t("tab." + k + ".p"));
  }
  function showScreen(k) {
    var im = $('#scr img[data-k="' + k + '"]'); if (!im) return;
    var ticket = ++scrWant;
    function swap() {
      if (ticket !== scrWant) return;   // a later tap wins
      $$("#scr img").forEach(function (x) { var on = x === im; x.classList.toggle("on", on); if (on) x.removeAttribute("aria-hidden"); else x.setAttribute("aria-hidden", "true"); });
    }
    var s = im.getAttribute("data-src"); if (s) { im.src = s; im.removeAttribute("data-src"); }
    if (im.complete && im.naturalWidth) swap();
    else if (im.decode) im.decode().then(swap, swap);
    else { im.addEventListener("load", swap, { once: true }); im.addEventListener("error", swap, { once: true }); }
  }
  function selectTab(k, focus) {
    if (TABS.indexOf(k) < 0) return;
    markTab(k); showScreen(k);
    if (focus) { var tb = $('#tabs .tab[data-k="' + k + '"]'); if (tb) tb.focus(); }
  }
  $$("#tabs .tab").forEach(function (b) {
    b.addEventListener("click", function () { selectTab(b.getAttribute("data-k")); });
    b.addEventListener("keydown", function (ev) {
      var all = $$("#tabs .tab"), i = all.indexOf(b), n = null;
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") n = all[(i + 1) % all.length];
      if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") n = all[(i - 1 + all.length) % all.length];
      if (ev.key === "Home") n = all[0];
      if (ev.key === "End") n = all[all.length - 1];
      if (n) { ev.preventDefault(); selectTab(n.getAttribute("data-k"), true); }
    });
  });

  /* ---------- NOVA AI: ready answers from the app's own FAQ (no server call on the site — the live chat is in the app) ---------- */
  var typing = null, novaArmed = false;
  function renderNova() {
    var nv = (window.CN_NOVA || {})[lang] || (window.CN_NOVA || {}).en, chat = $("#chat"), qs = $("#qs");
    if (!chat || !qs) return;
    if (typing) { clearInterval(typing); typing = null; }
    if (!nv) { chat.innerHTML = ""; qs.innerHTML = ""; return; }
    chat.innerHTML = '<div class="msg bot">' + esc(nv.hello) + "</div>";
    qs.innerHTML = nv.items.map(function (it, i) { return '<button type="button" class="q" data-i="' + i + '">' + esc(it.q) + "</button>"; }).join("");
    $$(".q", qs).forEach(function (b) {
      b.addEventListener("click", function () {
        if (typing) return;
        var it = nv.items[+b.getAttribute("data-i")]; b.disabled = true;
        chat.insertAdjacentHTML("beforeend", '<div class="msg me">' + esc(it.q) + "</div>");
        var bot = doc.createElement("div"); bot.className = "msg bot typing"; chat.appendChild(bot);
        var words = it.a.split(/(\s+)/), i = 0;
        function scroll() { chat.scrollTop = chat.scrollHeight; }
        if (reduce) { bot.textContent = it.a; bot.classList.remove("typing"); scroll(); return; }
        typing = setInterval(function () { i += 2; bot.textContent = words.slice(0, i).join(""); scroll(); if (i >= words.length) { clearInterval(typing); typing = null; bot.classList.remove("typing"); } }, 30);
      });
    });
    // the first time the chat comes into view NOVA AI answers the first question by itself: a live example, not an empty box
    if (!novaArmed && "IntersectionObserver" in window && !reduce) {
      novaArmed = true;
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { var q0 = $("#qs .q"); if (q0 && !typing && !$("#chat .msg.me")) q0.click(); }, 900); } }, { threshold: 0.4 });
      io.observe(chat);
    }
  }
  var sph = $("#novaSph");
  if (sph && window.NovaSphere && !sph._sph) sph._sph = window.NovaSphere.mount(sph, { busy: function () { return !!typing; } });

  /* ---------- the piggy bank on real daily BTC closes ---------- */
  var PG = { amt: 10, freq: "w", year: 2021 }, pgBuilt = "";
  function seg(el, items, cur, on) {
    el.innerHTML = items.map(function (it) { return '<button type="button" aria-pressed="' + (String(it[0]) === String(cur)) + '" data-v="' + it[0] + '">' + esc(it[1]) + "</button>"; }).join("");
    $$("button", el).forEach(function (b) { b.addEventListener("click", function () { on(b.getAttribute("data-v")); $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); calcPiggy(); }); });
  }
  function renderPiggy() {
    var b = D.btc; if (!b || !b.closes || !$("#pgAmt")) return;
    var DAY = 86400000, sd = b.start_day, lastDay = sd + b.closes.length - 1;
    var firstYear = new Date(sd * DAY).getUTCFullYear(), lastYear = new Date(lastDay * DAY).getUTCFullYear(), years = [];
    for (var y = firstYear; y <= Math.min(lastYear - 1, firstYear + 6); y++) years.push([y, String(y)]);
    if (PG.year < firstYear) PG.year = firstYear;
    var key = lang + sd + b.closes.length;
    if (pgBuilt !== key) {
      pgBuilt = key;
      seg($("#pgAmt"), [5, 10, 25, 50].map(function (a) { return [a, money(a, 0)]; }), PG.amt, function (v) { PG.amt = +v; });
      seg($("#pgFreq"), [["w", t("piggy.weekly")], ["m", t("piggy.monthly")]], PG.freq, function (v) { PG.freq = v; });
      seg($("#pgYear"), years, PG.year, function (v) { PG.year = +v; });
    }
    calcPiggy();
  }
  function calcPiggy() {
    var b = D.btc; if (!b) return;
    var DAY = 86400000, cl = b.closes, sd = b.start_day, lastDay = sd + cl.length - 1, buys = [], d0 = Math.max(sd, Math.floor(Date.UTC(PG.year, 0, 1) / DAY));
    if (PG.freq === "w") { for (var d = d0; d <= lastDay; d += 7) buys.push(d); }
    else { for (var mm = 0; ; mm++) { var dd = Math.floor(Date.UTC(PG.year, mm, 1) / DAY); if (dd > lastDay) break; if (dd >= sd) buys.push(dd); } }
    var put = 0, btc = 0, series = [];
    buys.forEach(function (day) { var c = cl[day - sd]; if (!c) return; put += PG.amt; btc += PG.amt / c; series.push([day, put, btc * c]); });
    var lastP = cl[cl.length - 1]; series.push([lastDay, put, btc * lastP]);
    var worth = btc * lastP;
    $("#pgPut").textContent = money(put, 0);
    var w = $("#pgWorth"); w.textContent = money(worth, 0); w.className = cls(worth - put);
    $("#pgBtc").textContent = num(btc, 4) + " BTC";
    var W = 600, Hh = 140, ts = series[0][0], te = lastDay, hi = 0;
    series.forEach(function (s) { hi = Math.max(hi, s[1], s[2]); });
    function X(v) { return (v - ts) / Math.max(1, te - ts) * W; }
    function Y(v) { return 6 + (1 - v / (hi || 1)) * (Hh - 12); }
    var a = series.map(function (s) { return X(s[0]).toFixed(1) + "," + Y(s[1]).toFixed(1); }).join(" "), v2 = series.map(function (s) { return X(s[0]).toFixed(1) + "," + Y(s[2]).toFixed(1); }).join(" ");
    $("#pgChart").innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" role="img" aria-label="' + esc(t("piggy.put") + " " + money(put, 0) + " · " + t("piggy.worth") + " " + money(worth, 0)) + '"><line x1="0" x2="' + W + '" y1="' + (Hh - 6) + '" y2="' + (Hh - 6) + '" stroke="rgba(127,211,255,.15)" vector-effect="non-scaling-stroke"/>' +
      '<polyline points="' + a + '" fill="none" stroke="#8EA2C6" stroke-width="2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/><polyline points="' + v2 + '" fill="none" stroke="#7FD3FF" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ---------- the loading screen (kept): a short mission-control start, once per visit ----------
     The inline script in <head> shows it before the first paint and removes it after 4.5 s whatever happens; this fills the log
     and closes it about 1.8 s later, or at once on a tap, a key or «Пропустить». */
  function boot() {
    var root = doc.documentElement, b = $("#boot"); if (!b || !root.classList.contains("booting")) return;
    var e = E(), lines = [t("boot.l1", { n: num(nCoins()) }), t("boot.l2"), t("boot.l3", { n: num(nDesks()) }), t("boot.l4"), t("boot.l5")];
    var log = $("#bootLog"), bar = $("#bootBar"), i = 0, done = false;
    var cols = Math.max(26, Math.floor(log.clientWidth / (parseFloat(getComputedStyle(log).fontSize) * 0.6)));
    function close() { if (done) return; done = true; b.classList.add("off"); setTimeout(function () { root.classList.remove("booting"); }, 520); }
    function hh(n) { return ("0" + n).slice(-2); }
    function next() {
      if (done) return;
      if (i < lines.length) {
        var d = new Date(), ts = "[" + hh(d.getHours()) + ":" + hh(d.getMinutes()) + ":" + hh(d.getSeconds()) + "] ", txt = lines[i], dots = Math.max(2, cols - ts.length - txt.length - 4);
        log.innerHTML += esc(ts + txt + " " + new Array(dots + 1).join(".") + " ") + '<span class="ok">OK</span>\n';
        i++; bar.style.width = (i / (lines.length + 1) * 100).toFixed(0) + "%"; setTimeout(next, 220);
      } else { log.innerHTML += '\n<span class="hi">&gt; ' + esc(t("boot.l6")) + "</span>"; bar.style.width = "100%"; setTimeout(close, 650); }
    }
    b.addEventListener("click", close); doc.addEventListener("keydown", close, { once: true });
    void e; setTimeout(next, 200);
  }

  /* ---------- go ---------- */
  function renderAll() { renderStatus(); renderVars(); renderTicker(); renderHow(); renderPortfolio(); if (flow) flow.draw(); }
  function renderStatic() { renderScreens(); renderNova(); pgBuilt = ""; renderPiggy(); }
  var flow = null;
  boot(); renderAll(); renderStatic();
  makeSystem($("#core")); flow = thinkFlow($("#thinkCv"));
  if (window.fetch) { loadAll(); setInterval(function () { if (!doc.hidden) { loadHome(); loadMarkets(); } }, 5 * 60000); }
  else renderAll();
  setInterval(function () { if (!doc.hidden) { renderStatus(); var pp = PP(); if (pp && D.live[lang] && !pp.stale) { var n = $("#pfNote span"); if (n) n.textContent = t("pf.live", { ago: ago(pp.asof) }); } } }, 30000);
})();
