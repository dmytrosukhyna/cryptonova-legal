/* CRYPTO NOVA AI — cryptonova.pro. No cookies, no trackers. Live figures come from the public feeds on cryptonova.vip. */
(function () {
  "use strict";
  var LANGS = ["en", "ru", "uk", "el", "es"];
  var LOCALE = { en: "en-US", ru: "ru-RU", uk: "uk-UA", el: "el-GR", es: "es-ES" };
  var FEED = "https://cryptonova.vip/";
  var HOME_FILE = { ru: "app_home.json", en: "app_home.en.json", uk: "app_home.uk.json", el: "app_home.el.json", es: "app_home.es.json" };
  var I18N = window.CN_I18N || {};
  var doc = document, $ = function (s, r) { return (r || doc).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var page = doc.body.getAttribute("data-page") || "home";
  var isDoc = page !== "home";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- language ---------- */
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function pickLang() {
    var q = (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1];
    if (q && I18N[q]) { store("cn.lang", q); return q; }
    var s = store("cn.lang"); if (s && I18N[s]) return s;
    var nav = (navigator.languages || [navigator.language || "en"]);
    for (var i = 0; i < nav.length; i++) {
      var c = String(nav[i]).slice(0, 2).toLowerCase();
      if (c === "be") c = "ru";
      if (I18N[c]) return c;
    }
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
  function usd(v, dec) { return nf({ style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: dec || 0, minimumFractionDigits: dec || 0 }).format(v); }
  function num(v, dec) { return nf({ maximumFractionDigits: dec || 0 }).format(v); }
  function signed(v, txt) { return (v > 0 ? "+" : v < 0 ? "−" : "") + txt; }
  function pct(v, d) { d = d == null ? 2 : d; return signed(v, nf({ maximumFractionDigits: d, minimumFractionDigits: d }).format(Math.abs(v)) + "%"); }
  function date(ms, long) { return new Intl.DateTimeFormat(LOCALE[lang], long ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "long" }).format(new Date(ms)); }
  function stamp(ms) { return new Intl.DateTimeFormat(LOCALE[lang], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(ms)); }

  function applyI18n() {
    doc.documentElement.lang = lang;
    $$("[data-i]").forEach(function (el) { var v = t(el.getAttribute("data-i")); if (v) el.textContent = v; });
    $$("[data-i-attr]").forEach(function (el) { var p = el.getAttribute("data-i-attr").split(":"); var v = t(p[1]); if (v) el.setAttribute(p[0], v); });
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
    if (!isDoc) { renderData(); renderStatic(); loadHome(); }
  }

  /* ---------- header ---------- */
  var top = $("#top");
  function onScroll() { if (top) top.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var mb = $("#menuBtn"), nav = $("#nav");
  if (mb && nav) {
    mb.addEventListener("click", function () { var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o ? "true" : "false"); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); }); });
  }
  var sel = $("#lang"); if (sel) sel.addEventListener("change", function () { setLang(sel.value); });
  applyI18n();
  if (isDoc) return;

  /* ---------- data ---------- */
  var SNAP = window.CN_SNAP || {};
  var D = { home: {}, liveHome: {}, scorecard: SNAP.scorecard, conveyor: SNAP.conveyor, risk: SNAP.risk, btc: SNAP.btc, markets: SNAP.markets, models: SNAP.models, scale: SNAP.scale || {} };
  LANGS.forEach(function (l) { if (SNAP.home && SNAP.home[l]) D.home[l] = SNAP.home[l]; });
  function H() { return D.home[lang] || D.home.en || {}; }
  function E() { return H().engine || {}; }
  function get(name) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    return fetch(FEED + name + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function loadHome() {
    var l = lang;
    return get(HOME_FILE[l]).then(function (h) { if (h && h.portfolio) { D.home[l] = h; D.liveHome[l] = true; if (l === lang) renderData(); } }).catch(function () { renderStatus(); });
  }
  function loadAll() {
    loadHome();
    get("scorecard.json").then(function (s) { D.scorecard = s; renderEngines(); renderThink(); }).catch(function () {});
    get("conveyor.json").then(function (c) { D.conveyor = c; renderEngines(); renderTicker(); }).catch(function () {});
    get("risk.json").then(function (r) { D.risk = r; renderEngines(); renderHeroCards(); renderTicker(); }).catch(function () {});
    get("markets.json").then(function (m) { if (m && m.top) { D.markets = m; renderTicker(); } }).catch(function () {});
    get("app_btc.json").then(function (b) { if (b && b.closes) { D.btc = b; renderPiggy(); } }).catch(function () {});
  }
  function renderStatus() {
    var el = $("#status"); if (!el) return;
    var h = H(), sp = $("span", el);
    if (D.liveHome[lang] && h.asof) {
      var m = Math.max(0, Math.round((Date.now() - h.asof) / 60000));
      var ago = m < 1 ? t("ago.now") : m < 90 ? t("ago.min", { n: m }) : t("ago.h", { n: Math.round(m / 60) });
      sp.textContent = t("status.live", { ago: ago }); el.classList.remove("stale");
    } else { sp.textContent = t("status.snapshot", { date: stamp(SNAP.made || Date.now()).replace(/\.$/, "") }); el.classList.add("stale"); }
  }

  /* ---------- turbine (the drawn "engine") ---------- */
  function turbine(r, blades, speed, opt) {
    opt = opt || {};
    var o = [], i, a;
    var id = "tg" + Math.random().toString(36).slice(2, 7);
    o.push('<defs><radialGradient id="' + id + 'h" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#E9FCFF"/><stop offset=".3" stop-color="#8FDCFF"/><stop offset=".62" stop-color="#00A6CC"/><stop offset="1" stop-color="#0B2155"/></radialGradient>' +
      '<radialGradient id="' + id + 'g"><stop offset=".55" stop-color="#00B4D8" stop-opacity=".28"/><stop offset="1" stop-color="#00B4D8" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="#7FD3FF" stop-opacity=".05"/><stop offset="1" stop-color="#7FD3FF" stop-opacity=".42"/></linearGradient></defs>');
    o.push('<circle r="' + (r * 1.32) + '" fill="url(#' + id + 'g)"/>');
    // outer tick ring, slow
    var ticks = [];
    for (i = 0; i < 72; i++) { a = i * Math.PI / 36; var l = i % 6 === 0 ? 0.1 : 0.045; ticks.push("M" + (Math.cos(a) * r * 1.12).toFixed(1) + " " + (Math.sin(a) * r * 1.12).toFixed(1) + "L" + (Math.cos(a) * r * (1.12 + l)).toFixed(1) + " " + (Math.sin(a) * r * (1.12 + l)).toFixed(1)); }
    o.push('<g class="spin" style="--d:' + (speed * 9) + 's"><path d="' + ticks.join("") + '" stroke="rgba(127,211,255,.35)" stroke-width="' + (r > 100 ? 1.4 : 1) + '"/></g>');
    // dashed arcs, reverse
    var arcs = [];
    for (i = 0; i < 6; i++) { var a0 = i * Math.PI / 3 + 0.12, a1 = a0 + 0.7, R = r * 1.25; arcs.push("M" + (Math.cos(a0) * R).toFixed(1) + " " + (Math.sin(a0) * R).toFixed(1) + "A" + R + " " + R + " 0 0 1 " + (Math.cos(a1) * R).toFixed(1) + " " + (Math.sin(a1) * R).toFixed(1)); }
    o.push('<g class="spin rev" style="--d:' + (speed * 6) + 's"><path d="' + arcs.join("") + '" fill="none" stroke="rgba(127,211,255,.4)" stroke-width="' + (r > 100 ? 2 : 1.5) + '" stroke-linecap="round"/></g>');
    // housing
    o.push('<circle class="ring" r="' + r + '" fill="rgba(8,16,44,.85)" stroke="rgba(127,211,255,.45)" stroke-width="' + (r > 100 ? 2 : 1.5) + '"/>');
    o.push('<circle r="' + (r * 0.9) + '" fill="none" stroke="rgba(127,211,255,.14)" stroke-width="1"/>');
    // blades, fast
    var bl = [];
    for (i = 0; i < blades; i++) {
      var r0 = r * 0.26, r1 = r * 0.86;
      bl.push('<path transform="rotate(' + (i * 360 / blades).toFixed(1) + ')" d="M' + r0 + " " + (-r * 0.02) + " Q" + (r * 0.56) + " " + (-r * 0.3) + " " + r1 + " " + (-r * 0.1) + " L" + r1 + " " + (r * 0.04) + " Q" + (r * 0.55) + " " + (-r * 0.04) + " " + r0 + " " + (r * 0.1) + 'Z"/>');
    }
    o.push('<g class="spin" style="--d:' + speed + 's" fill="url(#' + id + 'b)" stroke="rgba(160,225,255,.55)" stroke-width="' + (r > 100 ? 1.2 : 0.8) + '">' + bl.join("") + "</g>");
    // hub
    o.push('<circle r="' + (r * 0.24) + '" fill="url(#' + id + 'h)"/>');
    o.push('<circle r="' + (r * 0.24) + '" fill="none" stroke="rgba(233,252,255,.6)" stroke-width="1"/>');
    if (opt.halo) o.push('<circle class="halo" r="' + (r * 1.05) + '" fill="none" stroke="#7FD3FF" stroke-width="1.5" stroke-dasharray="3 6"/>');
    return o.join("");
  }

  /* ---------- hero: turbine, flowing data, floating live cards ---------- */
  function initFlow() {
    var cv = $("#flow"); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d"), W = 0, Hh = 0, dpr = 1, P = [], running = false, visible = true;
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.width = Math.round(cv.clientWidth * dpr); Hh = cv.height = Math.round(cv.clientHeight * dpr); }
    function spawn() {
      var ang = Math.random() * Math.PI * 2, R = Math.max(W, Hh) * (0.5 + Math.random() * 0.1);
      return { a: ang, r: R, v: (0.6 + Math.random() * 0.9) * dpr, s: (0.8 + Math.random() * 1.6) * dpr, w: (Math.random() < 0.5 ? 1 : -1) * (0.002 + Math.random() * 0.004), c: Math.random() < 0.18 ? "58,219,147" : Math.random() < 0.5 ? "127,211,255" : "0,180,216" };
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, Hh);
      var cx = W / 2, cy = Hh / 2, core = Math.min(W, Hh) * 0.1;
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.r -= p.v; p.a += p.w;
        if (p.r < core) { P[i] = spawn(); continue; }
        var x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * 0.92;
        var al = Math.min(1, (Math.max(W, Hh) * 0.6 - p.r) / (Math.max(W, Hh) * 0.2)) * Math.min(1, (p.r - core) / (core * 2));
        ctx.fillStyle = "rgba(" + p.c + "," + (0.75 * Math.max(0, al)).toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y, p.s, 0, 6.283); ctx.fill();
        var tx = cx + Math.cos(p.a - p.w * 8) * (p.r + p.v * 10), ty = cy + Math.sin(p.a - p.w * 8) * (p.r + p.v * 10) * 0.92;
        ctx.strokeStyle = "rgba(" + p.c + "," + (0.25 * Math.max(0, al)).toFixed(3) + ")"; ctx.lineWidth = p.s * 0.8;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    function setRun() { var want = visible && !doc.hidden && !reduce; if (want && !running) { running = true; requestAnimationFrame(frame); } else if (!want) running = false; }
    size(); for (var i = 0; i < 90; i++) { var p = spawn(); p.r *= Math.random(); P.push(p); }
    window.addEventListener("resize", size);
    doc.addEventListener("visibilitychange", setRun);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRun(); }).observe(cv);
    setRun();
  }
  function spark(box, curve, start) {
    var c = (curve || []).filter(function (r) { return r && r[1] != null; }); if (!box || c.length < 2) return;
    var W = 200, Hh = 30, v = c.map(function (r) { return start + r[1]; }), lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), sp = (hi - lo) || 1;
    var pts = v.map(function (y, i) { return (i / (v.length - 1) * W).toFixed(1) + "," + (2 + (1 - (y - lo) / sp) * (Hh - 4)).toFixed(1); });
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none"><polyline points="' + pts.join(" ") + '" fill="none" stroke="' + (v[v.length - 1] >= start ? "#3ADB93" : "#FF6E86") + '" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>';
  }
  function renderHeroCards() {
    var p = H().portfolio || {};
    if (p.value_usd != null) {
      $("#fcVal").textContent = usd(p.value_usd);
      var pc = $("#fcPct"); pc.textContent = pct(p.pnl_pct); pc.className = p.pnl_pct >= 0 ? "up" : "down";
      spark($("#fcSpark"), p.curve, p.start_usd || 10000);
    }
    var o = ((H().futures || {}).open || [])[0];
    if (o) {
      var long = String(o.side).toUpperCase() !== "SHORT", span = long ? (o.target - o.stop) : (o.stop - o.target);
      var x = Math.max(0, Math.min(1, long ? (o.price - o.stop) / span : (o.stop - o.price) / span)) * 100;
      $("#fcSym").textContent = o.sym;
      var sd = $("#fcSide"); sd.textContent = t(long ? "tc.long" : "tc.short"); sd.className = long ? "up" : "down";
      var tp = $("#fcTp"); tp.textContent = pct(o.pct || 0); tp.className = (o.pct || 0) >= 0 ? "up" : "down";
      $("#fcBar").style.left = x.toFixed(1) + "%";
    }
    var st = (D.risk || {}).state || "OK", fr = $("#fcRisk");
    fr.textContent = st === "OK" ? t("fc.risk.ok") : t("risk." + st);
    fr.style.color = st === "OK" ? "" : st === "HALT" ? "var(--down)" : "var(--amber)";
  }

  /* ---------- the NOVA energy core (hero and engine room) ----------
     A glass sphere with a geodesic «filter» net, plasma filaments inside, the N at the centre. In the hero, coins drift
     in: the coins the system holds in its spot portfolio pass the filter and are drawn in, others bounce off the shield. */
  var LOGO = new Image(); LOGO.decoding = "async"; LOGO.src = "assets/img/n-core.webp";
  var STABLE = { USDT: 1, USDC: 1, DAI: 1, FDUSD: 1, USDE: 1, USDS: 1, PYUSD: 1, TUSD: 1, USD1: 1, XAUT: 1, PAXG: 1, WBTC: 1, WETH: 1, STETH: 1, WSTETH: 1, WEETH: 1, CBBTC: 1, LEO: 1, WBT: 1, BUIDL: 1, USDTB: 1, BSC: 1 };
  function corePool() {
    var sp = H().spot || {}, ok = (sp.movers || []).map(function (m) { return m.sym; }).filter(Boolean);
    if (ok.length < 3) ok = ["BTC", "ETH", "SOL", "LINK", "NEAR"];
    var no = ((D.markets || {}).top || []).map(function (c) { return c.symbol; }).filter(function (x) { return x && !STABLE[x] && ok.indexOf(x) < 0 && /^[A-Z0-9]{2,6}$/.test(x); }).slice(0, 24);
    if (no.length < 6) no = ["DOGE", "ADA", "TRX", "XLM", "BCH", "HBAR", "TON", "DOT", "UNI", "SHIB", "ICP", "ETC"].filter(function (x) { return ok.indexOf(x) < 0; });
    return { ok: ok, no: no };
  }
  function makeCore(cv, opt) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d"), W = 0, Hh = 0, dpr = 1, R = 0, cx = 0, cy = 0, running = false, visible = true, t0 = performance.now(), last = 0;
    var NP = opt.lattice || 240, PTS = [], LINKS = [], i, j;
    for (i = 0; i < NP; i++) { var yy = 1 - (i + 0.5) * 2 / NP, rr = Math.sqrt(1 - yy * yy), th = i * 2.399963229728653; PTS.push([Math.cos(th) * rr, yy, Math.sin(th) * rr]); }
    var thr = 2.3 * Math.sqrt(4 * Math.PI / NP) * 0.62; thr *= thr;
    for (i = 0; i < NP; i++) for (j = i + 1; j < NP; j++) { var dx = PTS[i][0] - PTS[j][0], dy = PTS[i][1] - PTS[j][1], dz = PTS[i][2] - PTS[j][2]; if (dx * dx + dy * dy + dz * dz < thr) LINKS.push([i, j]); }
    var K = opt.angles ? opt.angles.length : 7, TEN = [];
    for (i = 0; i < K; i++) TEN.push({ base: opt.angles ? opt.angles[i] : i * 2 * Math.PI / K + 0.3, phi: 0, lock: null });
    var A = [], PS = [], flashes = [], boost = 0, ptr = { on: 0, a: 0, x: 0, y: 0 };
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.width = Math.max(1, Math.round(cv.clientWidth * dpr)); Hh = cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
      cx = W / 2; cy = Hh / 2; R = Math.min(W, Hh) * (opt.r || 0.29);
    }
    function spawn(a) {
      var pool = corePool(), ok = Math.random() < 0.42, list = ok ? pool.ok : pool.no;
      a = a || {}; a.sym = list[Math.floor(Math.random() * list.length)]; a.ok = ok;
      a.ang = Math.random() * Math.PI * 2; a.d = R * (1.75 + Math.random() * 0.55); a.v = R * (0.16 + Math.random() * 0.08);
      a.sw = (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.06); a.st = "in"; a.tt = 0; a.al = 0; return a;
    }
    if (opt.assets) for (i = 0; i < 8; i++) { var a0 = spawn(); a0.d = R * (1.3 + Math.random() * 1.0); A.push(a0); }
    function P(p, ay, ax) {
      var x = p[0] * Math.cos(ay) + p[2] * Math.sin(ay), z = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay), y = p[1];
      return [cx + x * R, cy + (y * Math.cos(ax) - z * Math.sin(ax)) * R, y * Math.sin(ax) + z * Math.cos(ax)];
    }
    function net(pr, front) {
      ctx.lineWidth = dpr * 0.7;
      ctx.strokeStyle = front ? "rgba(127,211,255,.20)" : "rgba(127,211,255,.06)";
      ctx.beginPath();
      for (var k = 0; k < LINKS.length; k++) { var p = pr[LINKS[k][0]], q = pr[LINKS[k][1]]; if ((p[2] + q[2] > 0) !== front) continue; ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
      ctx.stroke();
      ctx.fillStyle = front ? "rgba(200,240,255,.75)" : "rgba(127,211,255,.22)";
      for (var m = 0; m < pr.length; m++) { var o = pr[m]; if ((o[2] > 0) !== front) continue; ctx.fillRect(o[0] - dpr * 0.8, o[1] - dpr * 0.8, dpr * 1.6, dpr * 1.6); }
    }
    function glow(x, y, r, c, a) { var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(" + c + "," + a + ")"); g.addColorStop(1, "rgba(" + c + ",0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
    function chip(a, x, y) {
      var fs = Math.round(11 * dpr), padX = 7 * dpr, h = 20 * dpr;
      ctx.font = "500 " + fs + "px 'JetBrains Mono',ui-monospace,monospace";
      var w = ctx.measureText(a.sym).width + padX * 2, col = a.st === "pull" ? "58,219,147" : a.st === "out" ? "255,110,134" : "127,211,255";
      ctx.globalAlpha = a.al;
      ctx.fillStyle = "rgba(8,15,38,.88)"; ctx.strokeStyle = "rgba(" + col + "," + (a.st === "in" ? ".45" : ".95") + ")"; ctx.lineWidth = dpr;
      var rx = 5 * dpr, x0 = x - w / 2, y0 = y - h / 2;
      ctx.beginPath(); ctx.moveTo(x0 + rx, y0); ctx.arcTo(x0 + w, y0, x0 + w, y0 + h, rx); ctx.arcTo(x0 + w, y0 + h, x0, y0 + h, rx); ctx.arcTo(x0, y0 + h, x0, y0, rx); ctx.arcTo(x0, y0, x0 + w, y0, rx); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = a.st === "out" ? "rgba(255,170,185,.9)" : a.st === "pull" ? "#B8FFE0" : "#EAF6FF"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(a.sym, x, y + dpr * 0.5);
      if (a.st === "test") { ctx.strokeStyle = "rgba(127,211,255,.9)"; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(x, y, w * 0.72, a.tt * 9, a.tt * 9 + 1.6); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!running && now !== -1) return;
      var t = ((now === -1 ? t0 + 4000 : now) - t0) / 1000, dt = Math.min(0.05, last ? t - last : 0.016); last = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, Hh);
      var ay = t * 0.12, ax = 0.42, pr = PTS.map(function (p) { return P(p, ay, ax); });
      glow(cx, cy, R * 1.75, "0,180,216", 0.16 + boost * 0.08);
      net(pr, false);
      // glass and plasma
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, "rgba(150,225,255,.30)"); g.addColorStop(0.45, "rgba(0,140,200,.12)"); g.addColorStop(0.9, "rgba(0,120,190,.08)"); g.addColorStop(1, "rgba(127,211,255,.18)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      // tendrils: drift around their base angle; the pointer and the coin being checked pull the closest one
      var targets = [];
      if (ptr.on > 0) { ptr.on -= dt; targets.push(ptr.a); }
      A.forEach(function (a) { if (a.st === "test" || a.st === "pull") targets.push(a.ang); });
      TEN.forEach(function (tn, k) { tn.lock = null; tn.phi = tn.base + 0.55 * Math.sin(t * 0.33 + k * 1.7) + 0.25 * Math.sin(t * 0.71 + k); });
      targets.forEach(function (ang) { var best = null, bd = 9; TEN.forEach(function (tn) { if (tn.lock != null) return; var d = Math.abs(Math.atan2(Math.sin(tn.phi - ang), Math.cos(tn.phi - ang))); if (d < bd) { bd = d; best = tn; } }); if (best) best.lock = ang; });
      // 21.10 13:28: no lightning — energy streams from each engine flow into the core; refused bits stop at the shell
      if (Math.random() < dt * 9) PS.push({ k: Math.floor(Math.random() * TEN.length), s: 0, v: 0.35 + Math.random() * 0.35, bad: Math.random() < 0.3, j: (Math.random() - 0.5) * 0.18 });
      PS = PS.filter(function (q) {
        q.s += q.v * dt;
        var ph = TEN[q.k].base + q.j * (1 - q.s), rr = R * (1.25 - q.s * 1.05);
        if (q.bad && rr <= R * 1.0) { flashes.push({ a: ph, t: 0.3 }); return false; }
        if (rr < R * 0.22) { boost = Math.min(1, boost + 0.12); return false; }
        var x = cx + Math.cos(ph) * rr, y = cy + Math.sin(ph) * rr;
        glow(x, y, 7 * dpr, q.bad ? "255,110,134" : "127,211,255", 0.6);
        ctx.fillStyle = q.bad ? "rgba(255,150,165,.95)" : "rgba(220,245,255,.95)"; ctx.beginPath(); ctx.arc(x, y, 1.8 * dpr, 0, 6.2832); ctx.fill();
        return true;
      });
      TEN.forEach(function (tn) { var ex = cx + Math.cos(tn.base) * R, ey = cy + Math.sin(tn.base) * R; glow(ex, ey, R * 0.12, "127,211,255", 0.35); });
      // slow energy rings
      for (var ri = 0; ri < 3; ri++) { var ph2 = ((t * 0.35 + ri / 3) % 1), rr3 = R * (0.3 + ph2 * 0.68); ctx.strokeStyle = "rgba(127,211,255," + (0.28 * (1 - ph2)).toFixed(3) + ")"; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(cx, cy, rr3, 0, 6.2832); ctx.stroke(); }
      glow(cx, cy, R * 0.62, boost > 0 ? "120,255,200" : "160,230,255", 0.38 + boost * 0.35);
      ctx.globalCompositeOperation = "source-over";
      // the N
      if (LOGO.complete && LOGO.naturalWidth) {
        var sz = R * (opt.logo || 0.8) * (1 + 0.025 * Math.sin(t * 2.1)), lw = sz, lh = sz * LOGO.naturalHeight / LOGO.naturalWidth;
        ctx.drawImage(LOGO, cx - lw / 2, cy - lh / 2, lw, lh);
      }
      // shield flashes where a coin was refused
      flashes = flashes.filter(function (f) { f.t += dt; return f.t < 0.7; });
      boost = Math.max(0, boost - dt * 0.8);
      flashes.forEach(function (f) { ctx.strokeStyle = "rgba(255,110,134," + (0.8 * (1 - f.t / 0.7)).toFixed(3) + ")"; ctx.lineWidth = 2.5 * dpr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.02, f.a - 0.28, f.a + 0.28); ctx.stroke(); });
      net(pr, true);
      ctx.strokeStyle = "rgba(127,211,255,.42)"; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      // coins
      boost = Math.max(0, boost - dt * 1.6);
      A.forEach(function (a) {
        if (a.st === "in") { a.d -= a.v * dt; a.ang += a.sw * dt; a.al = Math.min(1, a.al + dt * 1.5); if (a.d <= R * 1.2) { a.st = "test"; a.tt = 0; } }
        else if (a.st === "test") { a.tt += dt; if (a.tt > 0.75) { a.st = a.ok ? "pull" : "out"; if (!a.ok) flashes.push({ a: a.ang, t: 0 }); } }
        else if (a.st === "pull") { a.d -= R * 1.2 * dt; a.al = Math.max(0, Math.min(1, (a.d - R * 0.15) / (R * 0.5))); if (a.d < R * 0.18) { boost = 1; spawn(a); } }
        else { a.d += R * 0.55 * dt; a.ang += a.sw * dt * 2; a.al = Math.max(0, a.al - dt * 0.7); if (a.al <= 0 || a.d > R * 2.6) spawn(a); }
        var x = cx + Math.cos(a.ang) * a.d, y = cy + Math.sin(a.ang) * a.d * 0.94;
        if (a.st === "test" || a.st === "pull") {
          ctx.strokeStyle = a.st === "pull" ? "rgba(58,219,147,.75)" : "rgba(127,211,255,.6)"; ctx.lineWidth = 1.2 * dpr; ctx.setLineDash(a.st === "pull" ? [] : [4 * dpr, 4 * dpr]);
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a.ang) * R, cy + Math.sin(a.ang) * R); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
        }
        chip(a, x, y);
      });
      if (now !== -1) requestAnimationFrame(frame);
    }
    function setRun() { var want = visible && !doc.hidden && !reduce; if (want && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!want) running = false; }
    size();
    window.addEventListener("resize", function () { size(); if (!running) frame(-1); });
    if (opt.pointer) {
      var pt = function (ev) { var b = cv.getBoundingClientRect(), x = (ev.clientX - b.left) * dpr, y = (ev.clientY - b.top) * dpr, dx = x - cx, dy = y - cy; if (Math.sqrt(dx * dx + dy * dy) < R * 1.7) { ptr.on = 1.2; ptr.a = Math.atan2(dy, dx); } };
      cv.addEventListener("pointermove", pt); cv.addEventListener("pointerdown", pt);
    }
    doc.addEventListener("visibilitychange", setRun);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRun(); }).observe(cv);
    LOGO.addEventListener("load", function () { if (!running) frame(-1); });
    if (reduce) frame(-1); else setRun();
    return { size: size };
  }

  /* ---------- hero: the NOVA tactical radar (21.10 13:28 owner: «не буква N и не молнии — радар, серьёзная система»)
     A scope with range rings, bearing ticks and a phosphor sweep. Coins show up as contacts when the sweep passes:
     the coins the system holds in its spot portfolio get locked (green brackets) and are pulled to the core,
     the rest are marked as refused (red) and fade. Corner readouts are real: coins watched and the engine cycle. */
  function makeRadar(cv) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d"), W = 0, Hh = 0, dpr = 1, R = 0, cx = 0, cy = 0, running = false, visible = true, t0 = performance.now(), last = 0;
    var B = [], ptr = { on: 0, x: 0, y: 0 }, absorb = 0, SPIN = 2 * Math.PI / 4.8;
    function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.width = Math.max(1, Math.round(cv.clientWidth * dpr)); Hh = cv.height = Math.max(1, Math.round(cv.clientHeight * dpr)); cx = W / 2; cy = Hh / 2; R = Math.min(W, Hh) * 0.41; }
    function spawn(b) {
      var pool = corePool(), ok = Math.random() < 0.38, used = B.map(function (x) { return x.sym; }), list = (ok ? pool.ok : pool.no).filter(function (x) { return used.indexOf(x) < 0; });
      if (!list.length) list = ok ? pool.ok : pool.no;
      b = b || {}; b.sym = list[Math.floor(Math.random() * list.length)]; b.ok = ok; b.a = Math.random() * Math.PI * 2; b.r = 0.32 + Math.random() * 0.6;
      b.lit = 0; b.seen = false; b.st = "idle"; b.k = 0; return b;
    }
    for (var i = 0; i < 11; i++) B.push(spawn());
    function mono(sz, w) { return (w || 500) + " " + Math.round(sz * dpr) + "px 'JetBrains Mono',ui-monospace,monospace"; }
    function ang(a) { a %= 2 * Math.PI; return a < 0 ? a + 2 * Math.PI : a; }
    function frame(now) {
      if (!running && now !== -1) return;
      var tm = ((now === -1 ? t0 + 3200 : now) - t0) / 1000, dt = Math.min(0.05, last ? tm - last : 0.016); last = tm;
      var sw = ang(tm * SPIN - Math.PI / 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, Hh);
      // scope body
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.12);
      g.addColorStop(0, "rgba(0,70,95,.38)"); g.addColorStop(0.75, "rgba(0,40,70,.22)"); g.addColorStop(1, "rgba(0,20,40,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(127,211,255,.10)"; ctx.lineWidth = dpr;
      for (var gx = -R; gx <= R; gx += R / 5) { var hh = Math.sqrt(Math.max(0, R * R - gx * gx)); ctx.beginPath(); ctx.moveTo(cx + gx, cy - hh); ctx.lineTo(cx + gx, cy + hh); ctx.moveTo(cx - hh, cy + gx); ctx.lineTo(cx + hh, cy + gx); ctx.stroke(); }
      [0.25, 0.5, 0.75].forEach(function (k) { ctx.strokeStyle = "rgba(127,211,255,.22)"; ctx.setLineDash([3 * dpr, 5 * dpr]); ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, 6.2832); ctx.stroke(); });
      ctx.setLineDash([]); ctx.strokeStyle = "rgba(127,211,255,.55)"; ctx.lineWidth = 1.4 * dpr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = "rgba(127,211,255,.18)"; ctx.lineWidth = dpr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.075, 0, 6.2832); ctx.stroke();
      // bearing ticks and labels
      ctx.strokeStyle = "rgba(127,211,255,.45)";
      for (var d = 0; d < 360; d += 5) { var a = d * Math.PI / 180 - Math.PI / 2, l = d % 30 === 0 ? 0.05 : 0.022; ctx.lineWidth = (d % 30 === 0 ? 1.3 : 0.8) * dpr; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a) * R * (1 + l), cy + Math.sin(a) * R * (1 + l)); ctx.stroke(); }
      ctx.fillStyle = "rgba(160,215,245,.6)"; ctx.font = mono(9.5); ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (var dl = 0; dl < 360; dl += 30) { var al = dl * Math.PI / 180 - Math.PI / 2; ctx.fillText(("00" + dl).slice(-3), cx + Math.cos(al) * R * 1.14, cy + Math.sin(al) * R * 1.14); }
      // crosshair
      ctx.strokeStyle = "rgba(127,211,255,.28)"; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      // sweep with phosphor trail
      if (ctx.createConicGradient) {
        var cg = ctx.createConicGradient(sw - 1.1, cx, cy);
        cg.addColorStop(0, "rgba(34,203,234,0)"); cg.addColorStop(0.17, "rgba(34,203,234,.30)"); cg.addColorStop(0.175, "rgba(34,203,234,0)"); cg.addColorStop(1, "rgba(34,203,234,0)");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, sw - 1.1, sw); ctx.closePath(); ctx.fill();
      } else {
        for (var q = 0; q < 14; q++) { ctx.fillStyle = "rgba(34,203,234," + (0.02 * (14 - q) / 14 * 1.2).toFixed(3) + ")"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, sw - (q + 1) * 0.08, sw - q * 0.08); ctx.closePath(); ctx.fill(); }
      }
      ctx.strokeStyle = "rgba(190,240,255,.95)"; ctx.lineWidth = 1.6 * dpr; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); ctx.stroke();
      // contacts
      B.forEach(function (b) {
        var ba = ang(b.a), behind = ang(sw - ba);
        if (behind < 0.12 && !b.seen && b.st === "idle") { b.seen = true; b.lit = 1; b.st = b.ok ? "lock" : "refuse"; b.k = 0; }
        if (b.st === "lock") { b.k += dt; if (b.k > 1.6) { b.r -= dt * 0.22; if (b.r < 0.06) { absorb = 1; spawn(b); return; } } }
        else if (b.st === "refuse") { b.k += dt; b.lit = Math.max(0, 1 - b.k / 2.4); if (b.k > 2.6) { spawn(b); return; } }
        else { b.lit = Math.max(0, b.lit - dt * 0.4); if (behind > 3) b.seen = false; }
        var x = cx + Math.cos(b.a) * b.r * R, y = cy + Math.sin(b.a) * b.r * R;
        var col = b.st === "lock" ? "58,219,147" : b.st === "refuse" ? "255,110,134" : "127,211,255", al2 = b.st === "idle" ? 0.25 + b.lit * 0.6 : b.st === "refuse" ? b.lit : 1;
        var gl = ctx.createRadialGradient(x, y, 0, x, y, 14 * dpr); gl.addColorStop(0, "rgba(" + col + "," + (0.5 * al2).toFixed(3) + ")"); gl.addColorStop(1, "rgba(" + col + ",0)");
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 14 * dpr, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "rgba(" + col + "," + Math.min(1, al2 + 0.15).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(x, y, 2.6 * dpr, 0, 6.2832); ctx.fill();
        if (b.st === "lock") {
          var s2 = 9 * dpr, c2 = 4 * dpr; ctx.strokeStyle = "rgba(58,219,147,.95)"; ctx.lineWidth = 1.3 * dpr; ctx.beginPath();
          [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { ctx.moveTo(x + c[0] * s2, y + c[1] * (s2 - c2)); ctx.lineTo(x + c[0] * s2, y + c[1] * s2); ctx.lineTo(x + c[0] * (s2 - c2), y + c[1] * s2); });
          ctx.stroke();
          ctx.strokeStyle = "rgba(58,219,147,.35)"; ctx.setLineDash([2 * dpr, 4 * dpr]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
        } else if (b.st === "refuse") {
          var s3 = 4.5 * dpr; ctx.strokeStyle = "rgba(255,110,134," + al2.toFixed(3) + ")"; ctx.lineWidth = 1.3 * dpr; ctx.beginPath(); ctx.moveTo(x - s3 + 9 * dpr, y - s3); ctx.lineTo(x + s3 + 9 * dpr, y + s3); ctx.moveTo(x + s3 + 9 * dpr, y - s3); ctx.lineTo(x - s3 + 9 * dpr, y + s3); ctx.stroke();
        }
        if (b.st !== "idle" || b.lit > 0.25) {
          ctx.font = mono(10.5, b.st === "lock" ? 700 : 500); ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(" + (b.st === "lock" ? "184,255,224" : b.st === "refuse" ? "255,170,185" : "200,235,255") + "," + Math.min(1, al2 + 0.1).toFixed(3) + ")";
          ctx.fillText(b.sym, x + (b.st === "refuse" ? 17 : 13) * dpr, y - 9 * dpr);
        }
      });
      // core: rotating square reticle, pulses green when a contact is absorbed
      absorb = Math.max(0, absorb - dt * 1.4);
      var cr = 14 * dpr * (1 + absorb * 0.35), rot = tm * 0.9;
      var cg2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr * 3.2); cg2.addColorStop(0, absorb > 0.05 ? "rgba(58,219,147,.55)" : "rgba(127,211,255,.45)"); cg2.addColorStop(1, "rgba(127,211,255,0)");
      ctx.fillStyle = cg2; ctx.beginPath(); ctx.arc(cx, cy, cr * 3.2, 0, 6.2832); ctx.fill();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = "rgba(200,240,255,.9)"; ctx.lineWidth = 1.4 * dpr; ctx.strokeRect(-cr, -cr, cr * 2, cr * 2); ctx.rotate(Math.PI / 4 - rot * 2); ctx.strokeStyle = "rgba(34,203,234,.8)"; ctx.strokeRect(-cr * 0.62, -cr * 0.62, cr * 1.24, cr * 1.24); ctx.restore();
      ctx.fillStyle = absorb > 0.05 ? "#3ADB93" : "#EAF8FF"; ctx.beginPath(); ctx.arc(cx, cy, 2.8 * dpr, 0, 6.2832); ctx.fill();
      // pointer reticle
      if (ptr.on > 0) {
        ptr.on -= dt; ctx.strokeStyle = "rgba(255,197,98,.85)"; ctx.lineWidth = 1.2 * dpr; var pr2 = 11 * dpr;
        ctx.beginPath(); ctx.arc(ptr.x, ptr.y, pr2, 0, 6.2832); ctx.moveTo(ptr.x - pr2 * 1.7, ptr.y); ctx.lineTo(ptr.x - pr2 * 0.6, ptr.y); ctx.moveTo(ptr.x + pr2 * 0.6, ptr.y); ctx.lineTo(ptr.x + pr2 * 1.7, ptr.y); ctx.moveTo(ptr.x, ptr.y - pr2 * 1.7); ctx.lineTo(ptr.x, ptr.y - pr2 * 0.6); ctx.moveTo(ptr.x, ptr.y + pr2 * 0.6); ctx.lineTo(ptr.x, ptr.y + pr2 * 1.7); ctx.stroke();
        var dx = ptr.x - cx, dy = ptr.y - cy, rr2 = Math.sqrt(dx * dx + dy * dy) / R, brg = (Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360));
        ctx.font = mono(9.5); ctx.fillStyle = "rgba(255,210,140,.9)"; ctx.textAlign = "left"; ctx.fillText(("00" + brg).slice(-3) + "° · " + Math.min(99, Math.round(rr2 * 100)) + "%", ptr.x + pr2 * 1.9, ptr.y + pr2 * 1.2);
      }
      // corner readouts (real numbers)
      var e = E(), sc = D.scale || {}, d0 = new Date(), hh2 = function (n) { return ("0" + n).slice(-2); };
      ctx.font = mono(10); ctx.fillStyle = "rgba(160,215,245,.75)"; ctx.textBaseline = "top"; ctx.textAlign = "left";
      ctx.textAlign = "right"; var lx = W - 6 * dpr, ly = cy - R * 1.22, lh = 14 * dpr;
      ctx.fillText(t("radar.scan", { n: num(sc.coins || 150) }), lx, ly);
      ctx.fillText(t("radar.cycle", { n: num(e.cycle_sec || 60) }), lx, ly + lh);
      ctx.fillText("UTC " + hh2(d0.getUTCHours()) + ":" + hh2(d0.getUTCMinutes()) + ":" + hh2(d0.getUTCSeconds()), lx, ly + lh * 2);
      if (now !== -1) requestAnimationFrame(frame);
    }
    function setRun() { var want = visible && !doc.hidden && !reduce; if (want && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!want) running = false; }
    size();
    window.addEventListener("resize", function () { size(); if (!running) frame(-1); });
    var pt = function (ev) { var bx = cv.getBoundingClientRect(); ptr.x = (ev.clientX - bx.left) * dpr; ptr.y = (ev.clientY - bx.top) * dpr; var dx = ptr.x - cx, dy = ptr.y - cy; ptr.on = Math.sqrt(dx * dx + dy * dy) < R ? 1.4 : 0; };
    cv.addEventListener("pointermove", pt); cv.addEventListener("pointerdown", pt);
    doc.addEventListener("visibilitychange", setRun);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRun(); }).observe(cv);
    if (reduce) frame(-1); else setRun();
    return { size: size };
  }

  /* ---------- boot: a short mission-control start, once per visit ---------- */
  function boot() {
    var b = $("#boot"); if (!b) return;
    var seen = false; try { seen = sessionStorage.getItem("cn.boot") === "1"; } catch (e) {}
    if (reduce || seen || /[?&]noboot\b/.test(location.search) || navigator.webdriver) { b.parentNode.removeChild(b); return; }
    try { sessionStorage.setItem("cn.boot", "1"); } catch (e) {}
    b.hidden = false;
    var e = E(), sc = D.scale || {}, lines = [t("boot.l1"), t("boot.l2", { n: num(sc.fut_markets || 18) }), t("boot.l3", { n: num(e.lab_tried || 800) }), t("boot.l4"), t("boot.l5")];
    var log = $("#bootLog"), bar = $("#bootBar"), i = 0, done = false;
    var cols = Math.max(30, Math.floor(log.clientWidth / (parseFloat(getComputedStyle(log).fontSize) * 0.6)));
    function close() { if (done) return; done = true; b.classList.add("off"); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 600); }
    function hh(n) { return ("0" + n).slice(-2); }
    function step() {
      if (done) return;
      if (i < lines.length) {
        var d = new Date(), ts = "[" + hh(d.getHours()) + ":" + hh(d.getMinutes()) + ":" + hh(d.getSeconds()) + "] ", txt = lines[i], dots = Math.max(2, cols - ts.length - txt.length - 4);
        log.innerHTML += esc(ts + txt + " " + new Array(dots + 1).join(".") + " ") + '<span class="ok">OK</span>\n';
        i++; bar.style.width = (i / (lines.length + 1) * 100).toFixed(0) + "%"; setTimeout(step, 230);
      } else { log.innerHTML += '\n<span class="hi">&gt; ' + esc(t("boot.l6")) + "</span>"; bar.style.width = "100%"; setTimeout(close, 700); }
    }
    b.addEventListener("click", close); doc.addEventListener("keydown", close);
    setTimeout(step, 220);
  }

  /* ---------- how the system thinks: a stream that narrows stage by stage, real numbers under it ---------- */
  function renderThink() {
    var ol = $("#tsteps"); if (!ol) return;
    var e = E(), sc = D.scale || {}, h = (D.scorecard || {}).headline || {};
    var rows = [
      [num(sc.coins || 150), t("think.s1.p", { fut: num(sc.fut_markets || 18) })],
      [t("think.s2.b", { n: num(e.cycle_sec || 60) }), t("think.s2.p")],
      [num(e.lab_tried || 0), t("think.s3.p")],
      [t("think.s4.b", { n: num((sc.candle_checks || 0) / 1e6, 1) }), t("think.s4.p", { m: num(sc.lab_markets || 20), y: sc.since || 1927 })],
      [t("think.s5.b", { a: num(e.lab_reliable || 0), b: num(e.lab_tried || 0) }), t("think.s5.p")],
      [num(h.checked || 0), t("think.s6.p")]
    ];
    ol.innerHTML = rows.map(function (r, i) { return '<li><div class="ix">0' + (i + 1) + '</div><h3>' + esc(t("think.s" + (i + 1) + ".t")) + '</h3><div class="big">' + esc(r[0]) + "</div><p>" + esc(r[1]) + "</p></li>"; }).join("");
    if (!thinkRun) thinkRun = thinkFlow($("#thinkCv"));
  }
  /* many assets enter on the left; each of the six stages lets fewer through (refused ones turn red and drop);
     the few that survive reach the N core on the right. Gates sit on the column borders of the steps below. */
  var thinkRun = null;
  function thinkFlow(cv) {
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d"), W = 0, Hh = 0, dpr = 1, gates = [], ex = 0, ey = 0, C = [], running = false, visible = true, last = 0, t0 = performance.now(), pulse = 0;
    var SURV = [0.62, 0.66, 0.52, 0.48, 0.56], seeded = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); W = cv.width = Math.max(1, Math.round(cv.clientWidth * dpr)); Hh = cv.height = Math.max(1, Math.round(cv.clientHeight * dpr));
      var lis = $$("#tsteps li"), cb = cv.getBoundingClientRect(), wide = window.matchMedia("(min-width:1061px)").matches;
      gates = [];
      ex = W - Math.min(W * 0.075, 62 * dpr); ey = Hh / 2;
      if (wide && lis.length === 6) lis.forEach(function (li, i) { if (i) gates.push((li.getBoundingClientRect().left - cb.left) * dpr); });
      else for (var g = 1; g < 6; g++) gates.push((ex - 50 * dpr) * g / 5.6);
    }
    function pool() { var m = ((D.markets || {}).top || []).map(function (c) { return c.symbol; }).filter(function (x) { return x && !STABLE[x] && /^[A-Z0-9]{2,6}$/.test(x); }); return m.length > 20 ? m : ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "LINK", "AVAX", "SUI", "TON", "DOT", "NEAR", "LTC", "UNI", "TRX", "APT", "ARB", "OP", "INJ", "HBAR", "XLM", "ATOM", "FIL"]; }
    function spawn() {
      var P = pool(), fate = 0; while (fate < 5 && Math.random() < SURV[fate]) fate++;
      C.push({ sym: P[Math.floor(Math.random() * P.length)], x: -30 * dpr, y: Hh * (0.08 + Math.random() * 0.84), v: (60 + Math.random() * 40) * dpr, fate: fate, st: "go", a: 1, vy: 0 });
    }
    function band(x) { var k = Math.min(1, Math.max(0, x / ex)); return Hh * (0.46 - 0.4 * k); }
    function frame(now) {
      if (!running && now !== -1) return;
      var tm = ((now === -1 ? t0 + 5000 : now) - t0) / 1000, dt = Math.min(0.05, last ? tm - last : 0.016); last = tm;
      if (!seeded) { seeded = true; for (var w0 = 0; w0 < 70; w0++) { spawn(); var c0 = C[C.length - 1]; c0.x = Math.random() * ex * 0.92; if (c0.fate < 5 && c0.x > gates[c0.fate]) { C.pop(); } } }
      if (now !== -1 && Math.random() < dt * 12) spawn();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, Hh);
      // funnel
      ctx.fillStyle = "rgba(0,180,216,.05)"; ctx.beginPath(); ctx.moveTo(0, Hh * 0.04); ctx.lineTo(ex, ey - Hh * 0.06); ctx.lineTo(ex, ey + Hh * 0.06); ctx.lineTo(0, Hh * 0.96); ctx.closePath(); ctx.fill();
      // gates: a filter mesh on every stage border
      gates.forEach(function (gx, i) {
        var hb = band(gx) + 10 * dpr;
        ctx.strokeStyle = "rgba(127,211,255,.35)"; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.moveTo(gx, ey - hb); ctx.lineTo(gx, ey + hb); ctx.stroke();
        ctx.strokeStyle = "rgba(127,211,255,.18)"; ctx.lineWidth = dpr; ctx.beginPath();
        for (var yy = ey - hb; yy <= ey + hb; yy += 7 * dpr) { ctx.moveTo(gx - 4 * dpr, yy); ctx.lineTo(gx + 4 * dpr, yy); }
        ctx.stroke();
      });
      // assets
      C = C.filter(function (c) {
        if (c.st === "go") {
          c.x += c.v * dt; var hb2 = band(c.x); c.y += (Math.max(ey - hb2, Math.min(ey + hb2, c.y)) - c.y) * Math.min(1, dt * 3);
          var g = gates[c.fate];
          if (c.fate < 5 && g != null && c.x >= g - 6 * dpr) { c.st = "out"; c.vy = (Math.random() < 0.5 ? -1 : 1) * 30 * dpr; }
          if (c.fate >= 5 && c.x >= ex - 26 * dpr) { pulse = 1; return false; }
        } else { c.vy *= 1.03; c.y += c.vy * dt; c.x += c.v * 0.15 * dt; c.a -= dt * 1.2; if (c.a <= 0) return false; }
        var won = c.fate >= 5 && c.x > gates[4], col = c.st === "out" ? "255,110,134" : won ? "58,219,147" : "127,211,255";
        var fs = Math.round(9.5 * dpr); ctx.font = "600 " + fs + "px 'JetBrains Mono',monospace";
        var w = ctx.measureText(c.sym).width + 9 * dpr, h = 15 * dpr;
        ctx.globalAlpha = Math.max(0, c.a);
        ctx.fillStyle = "rgba(6,12,30,.9)"; ctx.strokeStyle = "rgba(" + col + ",.85)"; ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.rect(c.x - w / 2, c.y - h / 2, w, h); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(" + (c.st === "out" ? "255,180,190" : won ? "190,255,225" : "220,240,255") + ",1)"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(c.sym, c.x, c.y + 0.5 * dpr);
        ctx.globalAlpha = 1;
        return c.x < W + 40 * dpr;
      });
      // the core
      pulse = Math.max(0, pulse - dt * 1.5);
      var rr = Math.min(Hh * 0.22, 44 * dpr) * (1 + pulse * 0.08);
      var gg = ctx.createRadialGradient(ex, ey, 0, ex, ey, rr * 1.9); gg.addColorStop(0, pulse > 0.05 ? "rgba(58,219,147,.45)" : "rgba(0,180,216,.35)"); gg.addColorStop(1, "rgba(0,180,216,0)");
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(ex, ey, rr * 1.9, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(127,211,255,.55)"; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(ex, ey, rr, 0, 6.2832); ctx.stroke();
      if (LOGO.complete && LOGO.naturalWidth) { var lw = rr * 1.45; ctx.drawImage(LOGO, ex - lw / 2, ey - lw / 2, lw, lw * LOGO.naturalHeight / LOGO.naturalWidth); }
      ctx.font = "600 " + Math.round(8.5 * dpr) + "px 'JetBrains Mono',monospace"; ctx.fillStyle = "rgba(58,219,147,.9)"; ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(t("boot.l6"), Math.min(ex, W - ctx.measureText(t("boot.l6")).width / 2 - 4 * dpr), ey + rr + 6 * dpr);
      if (now !== -1) requestAnimationFrame(frame);
    }
    function setRun() { var want = visible && !doc.hidden && !reduce; if (want && !running) { running = true; last = 0; requestAnimationFrame(frame); } else if (!want) running = false; }
    size(); window.addEventListener("resize", function () { size(); if (!running) frame(-1); });
    doc.addEventListener("visibilitychange", setRun);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; setRun(); }).observe(cv);
    LOGO.addEventListener("load", function () { if (!running) frame(-1); });
    if (reduce) frame(-1); else setRun();
    return { size: size };
  }

  /* ---------- ticker: market prices + the engines at work ---------- */
  var GEAR = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="2.4"/><path d="M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2M3.4 3.4 5 5M11 11l1.6 1.6M3.4 12.6 5 11M11 5l1.6-1.6"/></svg>';
  function renderTicker() {
    var el = $("#ticker"); if (!el) return;
    var m = D.markets || {}, e = E(), items = [];
    var sys = [];
    if (e.cycle_sec) sys.push(t("tick.cycle", { n: num(e.cycle_sec) }));
    if (e.lab_tried) sys.push(t("tick.lab", { n: num(e.lab_tried) }));
    if (e.signals_checked) sys.push(t("tick.signals", { n: num(e.signals_checked) }));
    if ((D.risk || {}).state === "OK") sys.push(t("tick.risk"));
    if (m.fng && m.fng.value != null) sys.push(t("tick.fng", { n: m.fng.value }));
    if (m.global && m.global.total_mcap) sys.push(t("tick.mcap", { v: "$" + nf({ maximumFractionDigits: 2 }).format(m.global.total_mcap / 1e12) + "T" }));
    var TICK = ["BTC", "ETH", "SOL", "BNB", "XRP", "HYPE", "DOGE", "LINK", "ADA", "AVAX", "SUI", "TON", "NEAR", "LTC", "DOT", "TRX"];
    var coins = (m.top || []).filter(function (c) { return c.price && TICK.indexOf(c.symbol) >= 0; });
    var si = 0;
    coins.forEach(function (c, i) {
      var ch = c.chg24 || 0, d = c.price >= 100 ? 0 : c.price >= 1 ? 2 : 4;
      items.push('<span class="it"><b>' + esc(c.symbol) + "</b>" + usd(c.price, d) + ' <span class="c ' + (ch >= 0 ? "up" : "down") + '">' + pct(ch) + "</span></span>");
      if (i % 3 === 2 && sys.length) items.push('<span class="it sys">' + GEAR + esc(sys[si++ % sys.length]) + "</span>");
    });
    if (!coins.length) sys.forEach(function (s) { items.push('<span class="it sys">' + GEAR + esc(s) + "</span>"); });
    var one = items.join("");
    el.innerHTML = one + one;
  }

  /* ---------- engine room ---------- */
  var ENG = [
    { k: "scan", x: 330, y: 120, blades: 10, sp: 1.6 },
    { k: "lab", x: 270, y: 330, blades: 12, sp: 2.4 },
    { k: "conv", x: 330, y: 540, blades: 8, sp: 3.2 },
    { k: "risk", x: 870, y: 120, blades: 9, sp: 4.2 },
    { k: "port", x: 930, y: 330, blades: 11, sp: 3.6 },
    { k: "log", x: 870, y: 540, blades: 7, sp: 2.8 }
  ];
  var engSel = "lab", engCore = null;
  function engTitle(k) { return k === "core" ? t("eng.core") : t("eng." + k + ".t"); }
  function engMetric(k) {
    var e = E(), c = (D.conveyor || {}).counts || {}, s = (D.scorecard || {}).headline || {}, p = H().portfolio || {}, st = (D.risk || {}).state || "OK";
    switch (k) {
      case "scan": return t("eng.scan.m", { n: num(e.cycle_sec || 60) });
      case "lab": return t("eng.lab.m", { n: num(e.lab_tried || 0) });
      case "conv": return t("eng.conv.m", { n: num(c.paper || 0) });
      case "risk": return st === "OK" ? t("eng.risk.m") : t("risk." + st);
      case "port": return p.value_usd != null ? usd(p.value_usd) : "";
      case "log": return t("eng.log.m", { n: num(s.recorded || 0) });
      default: return "24/7";
    }
  }
  function svgEl(tag, attrs, html) { var el = doc.createElementNS(SVGNS, tag); for (var a in attrs) el.setAttribute(a, attrs[a]); if (html) el.innerHTML = html; return el; }
  function renderEngines() {
    var map = $("#engMap"); if (!map) return;
    map.innerHTML = "";
    var CX = 600, CY = 330;
    var flows = svgEl("g", {});
    ENG.forEach(function (n, i) {
      var left = n.x < CX, sx = n.x + (left ? 64 : -64), ex = CX + (left ? -96 : 96);
      var d = "M" + sx + " " + n.y + " C" + (sx + (left ? 120 : -120)) + " " + n.y + " " + (ex + (left ? -110 : 110)) + " " + (CY + (n.y - CY) * 0.25) + " " + ex + " " + (CY + (n.y - CY) * 0.25);
      flows.appendChild(svgEl("path", { d: d, "class": "flow", id: "fl" + i }));
      flows.appendChild(svgEl("path", { d: d, "class": "dash" }));
      if (!reduce) for (var j = 0; j < 3; j++) {
        var du = (2.6 + i * 0.3).toFixed(1);
        if (j < 2) flows.appendChild(svgEl("circle", { r: 4, fill: j ? "#3ADB93" : "#7FD3FF" }, '<animateMotion dur="' + du + 's" begin="' + (-j * 1.3 - i * 0.4) + 's" repeatCount="indefinite"><mpath href="#fl' + i + '"/></animateMotion>'));
        // a refused one: red, fades out before it reaches the core — only the best gets in
        else flows.appendChild(svgEl("circle", { r: 3.5, fill: "#FF6E86" }, '<animateMotion dur="' + du + 's" begin="' + (-0.65 - i * 0.4) + 's" repeatCount="indefinite" calcMode="linear" keyPoints="0;0.62" keyTimes="0;1"><mpath href="#fl' + i + '"/></animateMotion><animate attributeName="opacity" values="1;1;0" keyTimes="0;.7;1" dur="' + du + 's" begin="' + (-0.65 - i * 0.4) + 's" repeatCount="indefinite"/>'));
      }
    });
    map.appendChild(flows);
    if (!map.parentNode.classList.contains("engmapwrap")) {
      var wr = doc.createElement("div"); wr.className = "engmapwrap"; map.parentNode.insertBefore(wr, map); wr.appendChild(map);
      var cc = doc.createElement("canvas"); cc.className = "corecv"; cc.setAttribute("aria-hidden", "true");
      cc.style.left = ((CX - 190) / 1200 * 100) + "%"; cc.style.top = ((CY - 190) / 660 * 100) + "%"; cc.style.width = (380 / 1200 * 100) + "%"; cc.style.height = (380 / 660 * 100) + "%";
      wr.appendChild(cc);
      engCore = makeCore(cc, { r: 0.3, lattice: 160, logo: 0.95, angles: ENG.map(function (n) { return Math.atan2(n.y - CY, n.x - CX); }) });
    }
    // NOVA core: the energy sphere with the N is drawn on a canvas over this spot (see makeCore); here only the hit area and the label
    var core = svgEl("g", { transform: "translate(" + CX + " " + CY + ")", "class": "node" + (engSel === "core" ? " on" : ""), tabindex: "0", role: "button", "data-k": "core", "aria-label": t("eng.core") });
    core.innerHTML = '<circle r="118" fill="rgba(0,0,0,0)"/><circle class="halo" r="132" fill="none" stroke="#7FD3FF" stroke-width="1.5" stroke-dasharray="3 6"/>' +
      '<text y="166" text-anchor="middle" class="corelbl">' + esc(t("eng.core")) + "</text>";
    map.appendChild(core);
    ENG.forEach(function (n) {
      var left = n.x < CX;
      var g = svgEl("g", { transform: "translate(" + n.x + " " + n.y + ")", "class": "node" + (engSel === n.k ? " on" : ""), tabindex: "0", role: "button", "data-k": n.k, "aria-label": engTitle(n.k) + ": " + engMetric(n.k) });
      g.innerHTML = turbine(56, n.blades, n.sp, { halo: true }) +
        '<text x="' + (left ? -90 : 90) + '" y="-4" text-anchor="' + (left ? "end" : "start") + '" class="lbl">' + esc(engTitle(n.k)) + "</text>" +
        '<text x="' + (left ? -90 : 90) + '" y="20" text-anchor="' + (left ? "end" : "start") + '" class="met">' + esc(engMetric(n.k)) + "</text>";
      map.appendChild(g);
    });
    // long labels: shrink to fit the free side
    $$(".lbl, .met", map).forEach(function (tx) {
      var max = tx.closest('[data-k="core"]') ? 300 : 225, w = 0;
      try { w = tx.getComputedTextLength(); } catch (e) { w = 0; }
      if (w > max) tx.style.fontSize = (parseFloat(getComputedStyle(tx).fontSize) * max / w).toFixed(1) + "px";
    });
    $$(".node", map).forEach(function (g) {
      function go() { engSel = g.getAttribute("data-k"); renderEngines(); }
      g.addEventListener("click", go);
      g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); var f = $('#engMap [data-k="' + engSel + '"]'); if (f) f.focus(); } });
    });
    // phone layout: a list of turbines on a flowing line
    var list = $("#engList"), det0 = $("#engDetail");
    if (det0 && det0.parentNode === list) list.insertAdjacentElement("afterend", det0);
    list.innerHTML = ["core"].concat(ENG.map(function (n) { return n.k; })).map(function (k) {
      var n = ENG.filter(function (x) { return x.k === k; })[0] || { blades: 12, sp: 5 };
      return '<button type="button" class="eitem" data-k="' + k + '" aria-expanded="' + (k === engSel) + '" aria-controls="engDetail"><svg viewBox="-80 -80 160 160" aria-hidden="true">' + (k === "core" ? '<circle r="62" fill="rgba(0,180,216,.16)" stroke="rgba(127,211,255,.5)"/><image href="assets/img/n-core.webp" x="-48" y="-48" width="96" height="96"/>' : turbine(52, n.blades, n.sp)) + "</svg><span><b>" + esc(engTitle(k)) + "</b><span>" + esc(engMetric(k)) + "</span></span></button>";
    }).join("");
    $$(".eitem", list).forEach(function (b) {
      b.addEventListener("click", function () {
        engSel = b.getAttribute("data-k"); renderEngines();
        var det = $("#engDetail"), it = $('.eitem[data-k="' + engSel + '"]', list);
        if (det && it && window.matchMedia("(max-width:860px)").matches) it.insertAdjacentElement("afterend", det);
      });
    });
    var det = $("#engDetail");
    if (window.matchMedia("(max-width:860px)").matches) { var it = $('.eitem[data-k="' + engSel + '"]', list); if (it) it.insertAdjacentElement("afterend", det); }
    else if (det.parentNode !== map.parentNode || det.previousElementSibling !== list) list.insertAdjacentElement("afterend", det);
    det.innerHTML = engDetail(engSel);
  }
  function engDetail(k) {
    var e = E(), big = "", desc = "", viz = "";
    switch (k) {
      case "scan": big = t("eng.scan.m", { n: num(e.cycle_sec || 60) }); desc = t("eng.scan.d"); viz = '<p class="small" style="margin-bottom:12px">' + esc(t("eng.scan.x", { n: num(e.signals_checked || 0) })) + "</p>" + tradeHTML(); break;
      case "lab": big = num(e.lab_tried || 0); desc = t("sys.s1.p", { m: num(e.lab_markets || 20) }); viz = funnelHTML(); break;
      case "conv": big = num(((D.conveyor || {}).counts || {}).paper || 0); desc = t("sys.s2.p"); viz = stagesHTML(); break;
      case "risk": big = t("risk." + ((D.risk || {}).state || "OK")); desc = t("sys.s3.p"); viz = riskHTML(); break;
      case "port": var p = H().portfolio || {}; big = p.value_usd != null ? usd(p.value_usd) : ""; desc = t("eng.port.d"); viz = portMiniHTML(); break;
      case "log": big = num(((D.scorecard || {}).headline || {}).recorded || 0); desc = t("eng.log.d"); viz = logHTML(); break;
      default: big = "NOVA"; desc = t("eng.core.d"); viz = '<div class="orbrow"><span class="orb"></span><b>' + esc(t("nova.t")) + '</b></div><p class="small" style="margin-top:10px">' + esc(t("nova.p")) + '</p><p style="margin-top:14px"><a href="#try">' + esc(t("nav.try")) + "</a></p>";
    }
    return '<div><h3>' + esc(engTitle(k)) + '</h3><div class="big">' + esc(big) + "</div><p>" + esc(desc) + '</p></div><div><div class="now">' + esc(t("eng.now")) + "</div>" + viz + "</div>";
  }
  function funnelHTML() {
    var e = E(); if (e.lab_tried == null) return "";
    var rows = [["lab_tried", "f.tried"], ["lab_tested", "f.tested"], ["lab_passed", "f.passed"], ["lab_reliable", "f.reliable"]], max = e.lab_tried || 1;
    return '<div class="funnel">' + rows.map(function (r) {
      var v = e[r[0]] || 0, w = Math.max(9, Math.sqrt(v / max) * 100);
      return '<div class="fun"><div class="bar" style="width:' + w.toFixed(1) + '%">' + num(v) + "</div><span>" + esc(t(r[1])) + "</span></div>";
    }).join("") + '</div><p class="funnel-note">' + esc(t("f.note")) + "</p>";
  }
  function stagesHTML() {
    var c = (D.conveyor || {}).counts || {};
    return '<div class="track4">' + [["lab", "c.lab"], ["paper", "c.paper"], ["ready", "c.ready"], ["retired", "c.retired"]].map(function (r) {
      var v = c[r[0]] || 0; return '<div class="tk' + (v ? "" : " zero") + '"><b>' + num(v) + "</b><span>" + esc(t(r[1])) + "</span></div>";
    }).join("") + "</div>";
  }
  function riskHTML() {
    var r = D.risk || {}, st = r.state || "OK", cls = st === "OK" ? "g" : st === "HALT" ? "r" : "a";
    return '<div class="riskhead"><span class="chip ' + cls + '">' + esc(t("risk." + st)) + '</span></div><div class="gauges">' + (r.limits || []).map(function (l) {
      var p = Math.max(0, l.pct_of_limit || 0), c = p >= 100 ? "r" : p >= 70 ? "a" : "";
      return '<div class="gauge"><div class="row"><span>' + esc(t("lim." + l.key) || l.key) + "</span><span>" + esc(t("lim.of", { pct: num(p) + "%" })) + '</span></div><div class="tr"><i class="' + c + '" style="width:' + Math.min(100, Math.max(p, 1.5)).toFixed(1) + '%"></i></div></div>';
    }).join("") + "</div>";
  }
  function logHTML() {
    var s = D.scorecard || {}, h = s.headline || {}, head = ((s.chain || {}).ledger || {}).head;
    return '<div class="recnums">' + [["recorded", "rec.recorded"], ["checked", "rec.checked"], ["sources", "rec.sources"]].map(function (r) { return "<div><b>" + num(h[r[0]] || 0) + "</b><span>" + esc(t(r[1])) + "</span></div>"; }).join("") +
      '</div><div class="hash">' + (head ? "SHA-256 <code>" + esc(head.slice(0, 16)) + "…</code>" : "") + '<a href="https://cryptonova.vip/scorecard.html">' + esc(t("rec.open")) + "</a></div>";
  }
  var SLEEVE_COL = { spot: "#00B4D8", active: "#7FD3FF", futures: "#3ADB93", funding: "#FFC562", basis: "#9AA6FF", yield: "#4E7BFF", susde: "#5FE3C8" };
  function portMiniHTML() {
    var p = H().portfolio || {}, sl = (p.sleeves || []).filter(function (s) { return s.share > 0.0005; });
    return '<div class="stack">' + sl.map(function (s) { return '<i style="flex:' + s.share + ";background:" + (SLEEVE_COL[s.key] || "#888") + '"></i>'; }).join("") + '</div><ul class="sleeves one">' +
      sl.slice().sort(function (a, b) { return b.share - a.share; }).slice(0, 4).map(function (s) { return '<li><i style="background:' + (SLEEVE_COL[s.key] || "#888") + '"></i><span><b>' + esc(t("sl." + s.key + ".t")) + '</b></span><span class="n">' + num(s.share * 100, 1) + "%</span></li>"; }).join("") +
      '</ul><p style="margin-top:12px"><a href="#live">' + esc(t("live.h2")) + "</a></p>";
  }
  function px(v) { if (v == null) return "–"; var a = Math.abs(v), d = a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 3 : 5; return nf({ maximumFractionDigits: d, minimumFractionDigits: Math.min(d, 2) }).format(v); }
  var OKI = '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="rgba(58,219,147,.16)"/><path d="M5.4 9.2 7.8 11.5l4.6-5" stroke="#3ADB93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var NOI = '<svg viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="rgba(255,110,134,.16)"/><path d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6" stroke="#FF6E86" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function tradeHTML() {
    var o = ((H().futures || {}).open || [])[0];
    if (!o) return '<p class="small">' + esc(t("tc.none")) + "</p>";
    var long = String(o.side).toUpperCase() !== "SHORT", span = long ? (o.target - o.stop) : (o.stop - o.target);
    function x(v) { var r = long ? (v - o.stop) / span : (o.stop - v) / span; return Math.max(0, Math.min(1, r)) * 100; }
    var p = o.pct || 0;
    return '<div class="trade"><div class="th"><span class="coin">' + esc(String(o.sym).slice(0, 5)) + "</span><div><b>" + esc(o.sym) + '</b><div class="side ' + (long ? "up" : "down") + '">' + esc(t(long ? "tc.long" : "tc.short")) + '</div></div><span class="pct ' + (p >= 0 ? "up" : "down") + '">' + pct(p) + "</span></div>" +
      '<div class="tstats">' + [["tc.stop", o.stop], ["tc.entry", o.entry], ["tc.now", o.price], ["tc.target", o.target]].map(function (r) { return "<div><span>" + esc(t(r[0])) + "</span><b>" + px(r[1]) + "</b></div>"; }).join("") + "</div>" +
      '<div class="scale" aria-hidden="true"><div class="ln"></div><span class="tick" style="left:' + x(o.entry).toFixed(1) + '%"></span><span class="dot" style="left:' + x(o.price).toFixed(1) + '%"></span></div>' +
      '<div class="why"><h4>' + esc(t("tc.why")) + "</h4><p>" + esc(o.why_title || "") + '</p><ul class="checks">' + (o.checks || []).slice(0, 4).map(function (c) { return "<li>" + (c.ok === false ? NOI : OKI) + "<span><b>" + esc(c.t) + "</b>" + esc(c.v) + "</span></li>"; }).join("") + "</ul></div></div>";
  }

  /* ---------- public portfolio ---------- */
  function renderPortfolio() {
    var p = H().portfolio; if (!p || p.value_usd == null) return;
    $("#pVal").textContent = usd(p.value_usd);
    var pnl = $("#pPnl"); pnl.className = "pnl " + (p.pnl_usd >= 0 ? "up" : "down");
    pnl.textContent = signed(p.pnl_usd, usd(Math.abs(p.pnl_usd))) + "  (" + pct(p.pnl_pct) + ")";
    $("#pSince").textContent = t("live.pnl", { date: date(p.since, true) }) + ", " + usd(p.start_usd || 10000) + " → " + usd(p.value_usd);
    drawCurve($("#pCurve"), p);
    var sl = (p.sleeves || []).filter(function (s) { return s.share > 0.0005; });
    $("#pStack").innerHTML = sl.map(function (s) { return '<i style="flex:' + s.share + ";background:" + (SLEEVE_COL[s.key] || "#888") + '" title="' + esc(t("sl." + s.key + ".t")) + '"></i>'; }).join("");
    $("#pSleeves").innerHTML = sl.map(function (s) {
      return '<li><i style="background:' + (SLEEVE_COL[s.key] || "#888") + '"></i><span><b>' + esc(t("sl." + s.key + ".t") || s.key) + "</b><small>" + esc(t("sl." + s.key + ".d")) + '</small></span><span class="n">' + usd(s.usd) + "<small><br>" + num(s.share * 100, 1) + "%</small></span></li>";
    }).join("");
  }
  /* the spot coin portfolio, like the app's Spot screen: allocation ring, shares, the day's moves */
  var ALLOC_COL = ["#FFB547", "#7FD3FF", "#3ADB93", "#00B4D8", "#5C8DFF", "#8EA2C6", "#B9C7E0"];
  function plural(n, base) {
    var f = "many";
    try { var r = new Intl.PluralRules(LOCALE[lang]).select(n); f = r === "one" ? "one" : r === "few" ? "few" : "many"; } catch (e) {}
    return t(base + "." + f) || t(base + ".many");
  }
  function renderSpot() {
    var el = $("#spotP"), sp = H().spot; if (!el || !sp || !(sp.alloc || []).length) { if (el) el.hidden = true; return; }
    el.hidden = false;
    var al = sp.alloc, tot = al.reduce(function (a, x) { return a + (x.weight || 0); }, 0) || 100, C = 2 * Math.PI * 42, off = 0;
    var ring = al.map(function (x, i) { var l = (x.weight || 0) / tot * C, seg2 = '<circle r="42" cx="50" cy="50" fill="none" stroke="' + ALLOC_COL[i % ALLOC_COL.length] + '" stroke-width="11" stroke-dasharray="' + Math.max(0, l - 1.2).toFixed(2) + " " + C.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>'; off += l; return seg2; }).join("");
    el.innerHTML = '<h4>' + esc(t("sl.spot.t")) + (sp.pct != null ? '<span class="' + (sp.pct >= 0 ? "up" : "down") + '">' + esc(t("spot.since", { p: pct(sp.pct) })) + "</span>" : "") + "</h4>" +
      '<div class="donut"><svg viewBox="0 0 100 100" aria-hidden="true"><circle r="42" cx="50" cy="50" fill="none" stroke="rgba(127,211,255,.08)" stroke-width="11"/>' + ring + '</svg><div class="c"><b>' + num(sp.n_coins || 0) + "</b><span>" + esc(plural(sp.n_coins || 0, "spot.coin")) + "</span></div></div>" +
      '<ul class="alloc">' + al.map(function (x, i) { var c = ALLOC_COL[i % ALLOC_COL.length]; return '<li><i style="background:' + c + '"></i><span>' + esc(x.name) + "</span><b>" + num(x.weight, 1) + '%</b><span class="bar"><s style="width:' + Math.min(100, x.weight / Math.max.apply(null, al.map(function (y) { return y.weight; })) * 100).toFixed(1) + "%;background:" + c + '"></s></span></li>'; }).join("") + "</ul>" +
      ((sp.movers || []).length ? '<div class="movers"><span class="lb">' + esc(t("spot.movers")) + "</span>" + sp.movers.slice(0, 8).map(function (m) { return '<span class="m">' + esc(m.sym) + ' <span class="' + (m.pct >= 0 ? "up" : "down") + '">' + pct(m.pct, 1) + "</span></span>"; }).join("") + "</div>" : "");
  }
  /* your own portfolio: the same engine's split for any sum and character (allocation only, no return promised) */
  var OWN = { amt: 10000, m: "balanced" }, ownBuilt = "", modelsLive = false;
  var SLEEVE_ORDER = ["spot", "active", "futures", "funding", "basis", "yield", "susde"];
  function renderOwn() {
    var box = $("#pfOwn"); if (!box || box.hidden) return;
    var key = lang;
    if (ownBuilt !== key) {
      ownBuilt = key;
      seg($("#ownAmt"), [1000, 5000, 10000, 50000].map(function (a) { return [a, usd(a)]; }), OWN.amt, function (v) { OWN.amt = +v; }, renderOwn);
      seg($("#ownModel"), ["calm", "balanced", "bold"].map(function (k) { return [k, t("m." + k)]; }), OWN.m, function (v) { OWN.m = v; }, renderOwn);
    }
    var w = ((D.models || {})[OWN.m] || {}).w || {};
    var sl = SLEEVE_ORDER.map(function (k) { return { key: k, share: w[k] || 0 }; }).filter(function (x) { return x.share > 0.0005; });
    var sum = sl.reduce(function (a, x) { return a + x.share; }, 0) || 1;
    $("#ownTotal").textContent = usd(OWN.amt);
    $("#ownStack").innerHTML = sl.map(function (x) { return '<i style="flex:' + x.share + ";background:" + (SLEEVE_COL[x.key] || "#888") + '"></i>'; }).join("");
    $("#ownSleeves").innerHTML = sl.map(function (x) {
      return '<li><i style="background:' + (SLEEVE_COL[x.key] || "#888") + '"></i><span><b>' + esc(t("sl." + x.key + ".t") || x.key) + "</b><small>" + esc(t("sl." + x.key + ".d")) + '</small></span><span class="n">' + usd(OWN.amt * x.share / sum) + "<small><br>" + num(x.share / sum * 100, 1) + "%</small></span></li>";
    }).join("");
  }
  function pfTab(v) {
    var own = v === "own";
    $("#pfDemo").hidden = own; $("#pfOwn").hidden = !own;
    $$("#pfTabs button").forEach(function (b) { var on = b.getAttribute("data-v") === v; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
    if (own) {
      renderOwn();
      if (!modelsLive && window.fetch) { modelsLive = true; get("capital.json").then(function (c) { if (c && c.models) { var m = {}; for (var k in c.models) m[k] = { w: c.models[k].w }; D.models = m; renderOwn(); } }).catch(function () {}); }
    }
  }
  $$("#pfTabs button").forEach(function (b) {
    b.addEventListener("click", function () { pfTab(b.getAttribute("data-v")); });
    b.addEventListener("keydown", function (ev) { if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); var v = b.getAttribute("data-v") === "demo" ? "own" : "demo"; pfTab(v); var n = $('#pfTabs [data-v="' + v + '"]'); if (n) n.focus(); } });
  });
  function drawCurve(box, p) {
    var c = (p.curve || []).filter(function (r) { return r && r[1] != null; }); if (c.length < 2 || !box) return;
    var start = p.start_usd || 10000, W = 640, Hh = 220, padT = 16, padB = 26, t0 = c[0][0], t1 = c[c.length - 1][0];
    var vals = c.map(function (r) { return start + r[1]; }); vals.push(start);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * 0.12, start * 0.002); lo -= pad; hi += pad;
    function X(tm) { return (tm - t0) / Math.max(1, t1 - t0) * W; }
    function Y(v) { return padT + (1 - (v - lo) / (hi - lo)) * (Hh - padT - padB); }
    var pts = c.map(function (r) { return X(r[0]).toFixed(1) + "," + Y(start + r[1]).toFixed(1); });
    var col = c[c.length - 1][1] >= 0 ? "#3ADB93" : "#FF6E86", last = pts[pts.length - 1].split(",");
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" role="img" aria-label="' + esc(t("live.h2")) + '">' +
      '<defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<line x1="0" x2="' + W + '" y1="' + Y(start).toFixed(1) + '" y2="' + Y(start).toFixed(1) + '" stroke="rgba(127,211,255,.35)" stroke-dasharray="4 5" vector-effect="non-scaling-stroke"/>' +
      '<polygon points="0,' + (Hh - padB) + " " + pts.join(" ") + " " + W + "," + (Hh - padB) + '" fill="url(#cg)"/>' +
      '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>' +
      '<span class="cv-dot" style="left:' + (last[0] / W * 100).toFixed(2) + "%;top:" + (last[1] / Hh * 100).toFixed(2) + "%;background:" + col + '"></span>' +
      '<span class="cv-base" style="top:' + (Y(start) / Hh * 100).toFixed(2) + '%">' + usd(start) + "</span>" +
      '<span class="cv-x cv-l">' + esc(date(t0)) + '</span><span class="cv-x cv-r">' + esc(date(t1)) + "</span>";
  }

  /* ---------- app tabs ---------- */
  var tabKey = "home", TABS = ["home", "trade", "nova", "piggy", "learn", "spot"];
  function renderScreens() {
    var scr = $("#scr"); if (!scr) return;
    scr.setAttribute("role", "tabpanel");
    scr.innerHTML = TABS.map(function (k) {
      return '<img data-k="' + k + '" alt="' + esc(t("tab." + k + ".t")) + '" ' + (k === tabKey ? 'src="assets/img/screens/' + lang + "/" + k + '.webp" class="on"' : 'data-src="assets/img/screens/' + lang + "/" + k + '.webp"') + ' width="600" height="1300" decoding="async">';
    }).join("");
    var d = $("#tabdesc"); if (d) d.textContent = t("tab." + tabKey + ".p");
    $$("#tabs .tab").forEach(function (b) { b.setAttribute("aria-label", t("tab." + b.getAttribute("data-k") + ".t")); });
    var hs = $("#heroScr"); if (hs) hs.src = "assets/img/screens/" + lang + "/intro.webp";
    if ("requestIdleCallback" in window) requestIdleCallback(preload); else setTimeout(preload, 1500);
  }
  function preload() { $$("#scr img[data-src]").forEach(function (im) { im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); }); }
  function selectTab(k, focus) {
    tabKey = k;
    $$("#tabs .tab").forEach(function (b) { var on = b.getAttribute("data-k") === k; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    $$("#scr img").forEach(function (im) {
      var on = im.getAttribute("data-k") === k;
      if (on && im.getAttribute("data-src")) { im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); }
      im.classList.toggle("on", on);
    });
    var d = $("#tabdesc"); if (d) d.textContent = t("tab." + k + ".p");
  }
  $$("#tabs .tab").forEach(function (b) {
    b.addEventListener("click", function () { selectTab(b.getAttribute("data-k")); });
    b.addEventListener("keydown", function (ev) {
      var tabs = $$("#tabs .tab"), i = tabs.indexOf(b), n = null;
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") n = tabs[(i + 1) % tabs.length];
      if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { ev.preventDefault(); selectTab(n.getAttribute("data-k"), true); }
    });
  });

  /* ---------- NOVA demo (rendered on load and on a language change only) ---------- */
  var typing = null;
  function renderNova() {
    var nv = (window.CN_NOVA || {})[lang] || (window.CN_NOVA || {}).en; var chat = $("#chat"), qs = $("#qs");
    if (!nv || !chat) return;
    if (typing) { clearInterval(typing); typing = null; }
    chat.innerHTML = '<div class="msg bot">' + esc(nv.hello) + "</div>";
    qs.innerHTML = nv.items.map(function (it, i) { return '<button type="button" class="q" data-i="' + i + '">' + esc(it.q) + "</button>"; }).join("");
    $$(".q", qs).forEach(function (b) {
      b.addEventListener("click", function () {
        if (typing) return;
        var it = nv.items[+b.getAttribute("data-i")]; b.disabled = true;
        chat.insertAdjacentHTML("beforeend", '<div class="msg me">' + esc(it.q) + "</div>");
        var bot = doc.createElement("div"); bot.className = "msg bot"; chat.appendChild(bot);
        var words = it.a.split(/(\s+)/), i = 0;
        function scroll() { chat.scrollTop = chat.scrollHeight; }
        if (reduce) { bot.textContent = it.a; scroll(); return; }
        typing = setInterval(function () { i += 2; bot.textContent = words.slice(0, i).join(""); scroll(); if (i >= words.length) { clearInterval(typing); typing = null; } }, 28);
      });
    });
  }

  /* ---------- Piggy calculator on real BTC closes ---------- */
  var PG = { amt: 10, freq: "w", year: 2021 }, pgBuilt = "";
  function seg(el, items, cur, on, after) {
    el.innerHTML = items.map(function (it) { return '<button type="button" aria-pressed="' + (String(it[0]) === String(cur)) + '" data-v="' + it[0] + '">' + esc(it[1]) + "</button>"; }).join("");
    $$("button", el).forEach(function (b) { b.addEventListener("click", function () { on(b.getAttribute("data-v")); $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); (after || calcPiggy)(); }); });
  }
  function renderPiggy() {
    var b = D.btc; if (!b || !b.closes || !$("#pgAmt")) return;
    var DAY = 86400000, sd = b.start_day, lastDay = sd + b.closes.length - 1;
    var firstYear = new Date(sd * DAY).getUTCFullYear(), lastYear = new Date(lastDay * DAY).getUTCFullYear();
    var years = []; for (var y = firstYear; y <= Math.min(lastYear - 1, firstYear + 6); y++) years.push([y, String(y)]);
    if (PG.year < firstYear) PG.year = firstYear;
    var key = lang + sd + b.closes.length;
    if (pgBuilt !== key) {
      pgBuilt = key;
      seg($("#pgAmt"), [5, 10, 25, 50].map(function (a) { return [a, usd(a)]; }), PG.amt, function (v) { PG.amt = +v; });
      seg($("#pgFreq"), [["w", t("piggy.weekly")], ["m", t("piggy.monthly")]], PG.freq, function (v) { PG.freq = v; });
      seg($("#pgYear"), years, PG.year, function (v) { PG.year = +v; });
    }
    calcPiggy();
  }
  function calcPiggy() {
    var b = D.btc; if (!b) return;
    var DAY = 86400000, cl = b.closes, sd = b.start_day, lastDay = sd + cl.length - 1;
    var buys = [], d0 = Math.max(sd, Math.floor(Date.UTC(PG.year, 0, 1) / DAY));
    if (PG.freq === "w") { for (var d = d0; d <= lastDay; d += 7) buys.push(d); }
    else { for (var mm = 0; ; mm++) { var dd = Math.floor(Date.UTC(PG.year, mm, 1) / DAY); if (dd > lastDay) break; if (dd >= sd) buys.push(dd); } }
    var put = 0, btc = 0, series = [];
    buys.forEach(function (day) { var c = cl[day - sd]; if (!c) return; put += PG.amt; btc += PG.amt / c; series.push([day, put, btc * c]); });
    var last = cl[cl.length - 1]; series.push([lastDay, put, btc * last]);
    $("#pgPut").textContent = usd(put);
    var worth = btc * last, w = $("#pgWorth"); w.textContent = usd(worth); w.className = worth >= put ? "up" : "down";
    $("#pgBtc").textContent = nf({ maximumFractionDigits: 4, minimumFractionDigits: 4 }).format(btc) + " BTC";
    var W = 600, Hh = 150, t0 = series[0][0], t1 = lastDay, hi = 0;
    series.forEach(function (s) { hi = Math.max(hi, s[1], s[2]); });
    function X(v) { return (v - t0) / Math.max(1, t1 - t0) * W; }
    function Y(v) { return 6 + (1 - v / (hi || 1)) * (Hh - 12); }
    var a = series.map(function (s) { return X(s[0]).toFixed(1) + "," + Y(s[1]).toFixed(1); }).join(" ");
    var v2 = series.map(function (s) { return X(s[0]).toFixed(1) + "," + Y(s[2]).toFixed(1); }).join(" ");
    $("#pgChart").innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" aria-hidden="true"><line x1="0" x2="' + W + '" y1="' + (Hh - 6) + '" y2="' + (Hh - 6) + '" stroke="rgba(127,211,255,.15)" vector-effect="non-scaling-stroke"/>' +
      '<polyline points="' + a + '" fill="none" stroke="#8EA2C6" stroke-width="2" stroke-dasharray="5 5" vector-effect="non-scaling-stroke"/><polyline points="' + v2 + '" fill="none" stroke="#7FD3FF" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  }

  /* ---------- go ---------- */
  function renderData() {   // everything that shows live numbers; safe to call on every refresh
    renderStatus(); renderHeroCards(); renderTicker(); renderThink(); renderEngines(); renderPortfolio(); renderSpot(); renderOwn();
    var since = (H().portfolio || {}).since;
    $$("[data-i-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i-html"), since ? { since: date(since, true) } : null); });
  }
  function renderStatic() { renderScreens(); renderNova(); pgBuilt = ""; ownBuilt = ""; renderPiggy(); renderOwn(); }   // interactive widgets: load and language change only
  boot(); renderData(); renderStatic(); initFlow();
  makeRadar($("#core"));
  var mq = window.matchMedia("(max-width:860px)"); if (mq.addEventListener) mq.addEventListener("change", renderEngines);
  if (window.fetch) { loadAll(); setInterval(function () { if (!doc.hidden) loadAll(); }, 5 * 60000); }
  setInterval(renderStatus, 60000);
})();
