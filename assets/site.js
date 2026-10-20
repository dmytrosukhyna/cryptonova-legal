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
  var D = { home: {}, liveHome: {}, scorecard: SNAP.scorecard, conveyor: SNAP.conveyor, risk: SNAP.risk, btc: SNAP.btc, markets: SNAP.markets };
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
    get("scorecard.json").then(function (s) { D.scorecard = s; renderEngines(); }).catch(function () {});
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
    } else { sp.textContent = t("status.snapshot", { date: stamp(SNAP.made || Date.now()) }); el.classList.add("stale"); }
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
  var ht = $("#heroTurbine"); if (ht) ht.innerHTML = turbine(235, 14, 7);
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
  var engSel = "lab";
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
      if (!reduce) for (var j = 0; j < 2; j++) {
        flows.appendChild(svgEl("circle", { r: 4, fill: j ? "#3ADB93" : "#7FD3FF" }, '<animateMotion dur="' + (2.6 + i * 0.3) + 's" begin="' + (-j * 1.3 - i * 0.4) + 's" repeatCount="indefinite"><mpath href="#fl' + i + '"/></animateMotion>'));
      }
    });
    map.appendChild(flows);
    // NOVA core: the app's orb with orbiting electrons
    var core = svgEl("g", { transform: "translate(" + CX + " " + CY + ")", "class": "node" + (engSel === "core" ? " on" : ""), tabindex: "0", role: "button", "data-k": "core", "aria-label": t("eng.core") });
    var orbits = "";
    [[0, "#7FD3FF"], [60, "#3ADB93"], [120, "#FF94B4"]].forEach(function (o, i) {
      orbits += '<g transform="rotate(' + o[0] + ')"><ellipse class="ring" rx="128" ry="44" fill="none" stroke="rgba(127,211,255,.32)" stroke-width="1.2"/>' +
        (reduce ? '<circle cx="128" r="7" fill="' + o[1] + '"/>' : '<circle r="7" fill="' + o[1] + '"><animateMotion dur="' + (4 + i) + 's" repeatCount="indefinite" path="M128 0 A128 44 0 1 1 -128 0 A128 44 0 1 1 128 0"/></circle>') + "</g>";
    });
    core.innerHTML = '<defs><radialGradient id="coreG" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#F2FDFF"/><stop offset=".22" stop-color="#9BE2FF"/><stop offset=".55" stop-color="#14B6DE"/><stop offset="1" stop-color="#0A2058"/></radialGradient><radialGradient id="coreH"><stop offset=".45" stop-color="#00B4D8" stop-opacity=".45"/><stop offset="1" stop-color="#00B4D8" stop-opacity="0"/></radialGradient></defs>' +
      '<circle r="170" fill="url(#coreH)"/>' + orbits + '<circle r="70" fill="url(#coreG)"/><circle class="halo" r="84" fill="none" stroke="#7FD3FF" stroke-width="1.5" stroke-dasharray="3 6"/>' +
      '<text y="128" text-anchor="middle" class="lbl">' + esc(t("eng.core")) + "</text>";
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
      return '<button type="button" class="eitem" data-k="' + k + '" aria-expanded="' + (k === engSel) + '" aria-controls="engDetail"><svg viewBox="-80 -80 160 160" aria-hidden="true">' + turbine(52, n.blades, n.sp) + "</svg><span><b>" + esc(engTitle(k)) + "</b><span>" + esc(engMetric(k)) + "</span></span></button>";
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
  var SLEEVE_COL = { spot: "#00B4D8", active: "#7FD3FF", futures: "#3ADB93", funding: "#FFC562", basis: "#B39DFF", yield: "#5C8DFF", susde: "#FF94B4" };
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
  function seg(el, items, cur, on) {
    el.innerHTML = items.map(function (it) { return '<button type="button" aria-pressed="' + (String(it[0]) === String(cur)) + '" data-v="' + it[0] + '">' + esc(it[1]) + "</button>"; }).join("");
    $$("button", el).forEach(function (b) { b.addEventListener("click", function () { on(b.getAttribute("data-v")); $$("button", el).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); calcPiggy(); }); });
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
    renderStatus(); renderHeroCards(); renderTicker(); renderEngines(); renderPortfolio();
    var since = (H().portfolio || {}).since;
    $$("[data-i-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i-html"), since ? { since: date(since, true) } : null); });
  }
  function renderStatic() { renderScreens(); renderNova(); pgBuilt = ""; renderPiggy(); }   // interactive widgets: load and language change only
  renderData(); renderStatic(); initFlow();
  var mq = window.matchMedia("(max-width:860px)"); if (mq.addEventListener) mq.addEventListener("change", renderEngines);
  if (window.fetch) { loadAll(); setInterval(function () { if (!doc.hidden) loadAll(); }, 5 * 60000); }
  setInterval(renderStatus, 60000);
})();
