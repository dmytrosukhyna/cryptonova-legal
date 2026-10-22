/* CRYPTO NOVA — section scripts: the live public portfolio, the NOVA chat polish, the piggy.
   Reads texts and data through window.CN (end of site.js). No invented numbers: the live value is the feed value
   with its spot account repriced at public exchange prices; when those prices are not reachable, the feed value stays. */
(function () {
  "use strict";
  var CN = window.CN; if (!CN) return;
  var doc = document, $ = CN.$, $$ = CN.$$, t = CN.t, num = CN.num;
  var LOC = { en: "en-US", ru: "ru-RU", uk: "uk-UA", el: "el-GR", es: "es-ES" };
  function loc() { return LOC[CN.lang()] || "en-US"; }
  function nf(o) { return new Intl.NumberFormat(loc(), o); }
  function usd(v, d) { d = d || 0; return nf({ style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", minimumFractionDigits: d, maximumFractionDigits: d }).format(v); }
  function signed(v, txt) { return (v > 0 ? "+" : v < 0 ? "−" : "") + txt; }
  function pct(v) { return signed(v, nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v)) + "%"); }
  function day(ms, long) { return new Intl.DateTimeFormat(loc(), long ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "long" }).format(new Date(ms)); }
  function ago(ms) {
    var s = Math.max(0, Math.round((Date.now() - ms) / 1000));
    if (s < 5) return t("ago.now");
    if (s < 90) return t("ago.sec", { n: s });
    var m = Math.round(s / 60); return m < 90 ? t("ago.min", { n: m }) : t("ago.h", { n: Math.round(m / 60) });
  }
  function emit(name, detail) { try { doc.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { /* old browsers */ } }

  /* ================= LIVE public portfolio (v8, owner 22.10) =================
     «Публичный портфель CRYPTO NOVA» = the closed system's header: FUTURES · отобранные сигналы + SPOT · CRYPTO NOVA портфель,
     two $10 000 demo accounts from 17.10 (feed "public"). «Заработано всего» = futures + spot. Between feed refreshes the spot
     account is repriced coin by coin at public exchange prices; the futures part stays at the feed value. */
  var LV = { asof: null, p: null, spotV: 0, coins: [], px: {}, pxAt: 0, bad: {}, host: 0, fails: 0, dead: false, shown: null, tail: [], anim: null, built: "", open: {} };
  var HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];
  var KIND_COL = { core: "#7FD3FF", alt: "#5C8DFF", small: "#FFB547", cash: "#8EA2C6" };
  var IC_FUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 17.5 9 12l3.5 3.5 8-8"/><path d="M15 7.5h5.5V13"/></svg>';
  var IC_SPOT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v8.5h8.5A8.5 8.5 0 1 1 12 3.5z"/><path d="M15 3.8A8.5 8.5 0 0 1 20.2 9H15z"/></svg>';

  function money(v) { var a = Math.abs(v); return signed(v, usd(a, a >= 10 ? 0 : 2)); }
  function plural(n, base) {
    var f = "many";
    try { var r = new Intl.PluralRules(loc()).select(n); f = r === "one" ? "one" : r === "few" ? "few" : "many"; } catch (e) { /* old browsers */ }
    return t(base + "." + f) || t(base + ".many");
  }
  function setup() {
    var h = CN.home() || {}, p = h.public;
    if (!p || p.total_usd == null) return false;
    if (h.asof !== LV.asof) { LV.asof = h.asof; LV.tail = []; }
    LV.p = p;
    var sp = p.spot || {}, ref = {};
    LV.spotV = sp.value_usd > 0 ? +sp.value_usd : 0;
    (((h.spot || {}).coins) || []).forEach(function (c) { if (c && c.sym && c.price > 0) ref[String(c.sym).toUpperCase()] = +c.price; });
    LV.coins = (sp.coins || []).filter(function (c) { return c && c.sym && c.weight > 0 && ref[String(c.sym).toUpperCase()]; })
      .map(function (c) { var s = String(c.sym).toUpperCase(); return { sym: s, w: c.weight / 100, ref: ref[s] }; });
    build();
    return true;
  }
  /* the spot account's move since the feed was made, at live prices; null when there is nothing fresh to trust */
  function spotMove() {
    if (!LV.pxAt || !LV.spotV) return null;
    var d = 0, priced = 0;
    LV.coins.forEach(function (c) { var now = LV.px[c.sym]; if (now > 0) { d += c.w * (now / c.ref - 1); priced += c.w; } });
    if (!priced || Math.abs(d) > 0.25) return null;   // >25 % in minutes = a stale reference, not a market move
    return LV.spotV * d;
  }
  function liveValue() {
    var p = LV.p; if (!p) return null;
    var m = spotMove(), sp = (p.spot || {}).usd || 0;
    return m == null ? { v: p.total_usd, spot: sp, live: false } : { v: p.total_usd + m, spot: sp + m, live: true };
  }

  function fetchJSON(url) {
    var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    return fetch(url, { cache: "no-store", signal: ctl ? ctl.signal : undefined }).then(function (r) { clearTimeout(tm); if (!r.ok) { var e = new Error("http"); e.status = r.status; throw e; } return r.json(); });
  }
  function took(arr) { (arr || []).forEach(function (r) { if (r && r.symbol && +r.price > 0) LV.px[r.symbol.replace(/USDT$/, "")] = +r.price; }); LV.pxAt = Date.now(); LV.fails = 0; }
  function poll() {
    if (LV.dead || doc.hidden || !window.fetch || !LV.coins.length || !LV.spotV) return;
    var syms = LV.coins.map(function (c) { return c.sym + "USDT"; }).filter(function (s) { return !LV.bad[s]; });
    if (!syms.length) return;
    var host = HOSTS[LV.host % HOSTS.length];
    fetchJSON(host + "/api/v3/ticker/price?symbols=" + encodeURIComponent(JSON.stringify(syms))).then(function (a) { took(a); paint(); })
      .catch(function (e) {
        if (e && e.status === 400) {   // one of the coins is not listed there: ask one by one once, remember the misses
          Promise.all(syms.map(function (s) { return fetchJSON(host + "/api/v3/ticker/price?symbol=" + s).then(function (r) { return r; }).catch(function () { LV.bad[s] = 1; return null; }); }))
            .then(function (rs) { var ok = rs.filter(Boolean); if (ok.length) { took(ok); paint(); } });
          return;
        }
        LV.host += 1; LV.fails += 1; if (LV.fails >= 4) LV.dead = true;   // blocked or offline: the feed value stays
      });
  }

  function countTo(el, from, to) {
    if (LV.anim) cancelAnimationFrame(LV.anim);
    if (CN.reduce || from == null || Math.abs(to - from) < 0.005) { el.textContent = signed(to, usd(Math.abs(to), 2)); return; }
    var t0 = performance.now(), dur = 900;
    el.classList.remove("tick-up", "tick-down"); el.classList.add(to > from ? "tick-up" : "tick-down");
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), x = from + (to - from) * e;
      el.textContent = signed(x, usd(Math.abs(x), 2));
      if (k < 1) LV.anim = requestAnimationFrame(step); else { LV.anim = null; setTimeout(function () { el.classList.remove("tick-up", "tick-down"); }, 700); }
    })(t0);
  }

  /* the curve: $ earned by both accounts since 17.10 (0 = the start), the live tail in light green */
  function drawLive(box, p) {
    var c = (p.curve || []).filter(function (r) { return r && r[1] != null; }); if (!box || c.length < 2) return;
    var W = 640, Hh = 220, padT = 16, padB = 26;
    var pts = c.map(function (r) { return [r[0], +r[1]]; }), nFeed = pts.length;
    LV.tail.forEach(function (r) { if (r[0] > pts[pts.length - 1][0]) pts.push(r); });
    var t0 = pts[0][0], t1 = pts[pts.length - 1][0];
    var vals = pts.map(function (r) { return r[1]; }).concat([0]);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * 0.12, 20); lo -= pad; hi += pad;
    function X(tm) { return (tm - t0) / Math.max(1, t1 - t0) * W; }
    function Y(v) { return padT + (1 - (v - lo) / (hi - lo)) * (Hh - padT - padB); }
    var xy = pts.map(function (r) { return X(r[0]).toFixed(1) + "," + Y(r[1]).toFixed(1); });
    var lastV = pts[pts.length - 1][1], col = lastV >= 0 ? "#3ADB93" : "#FF6E86";
    var feedPts = xy.slice(0, nFeed), tailPts = xy.slice(nFeed - 1), last = xy[xy.length - 1].split(",");
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" role="img" aria-label="' + CN.esc(t("live.total")) + '">' +
      '<defs><linearGradient id="cgL" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<line x1="0" x2="' + W + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="rgba(127,211,255,.35)" stroke-dasharray="4 5" vector-effect="non-scaling-stroke"/>' +
      '<polygon points="0,' + (Hh - padB) + " " + xy.join(" ") + " " + W + "," + (Hh - padB) + '" fill="url(#cgL)"/>' +
      '<polyline points="' + feedPts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      (tailPts.length > 1 ? '<polyline points="' + tailPts.join(" ") + '" fill="none" stroke="#C9FFE9" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' : "") + "</svg>" +
      '<span class="cv-dot live" style="left:' + (last[0] / W * 100).toFixed(2) + "%;top:" + (last[1] / Hh * 100).toFixed(2) + "%;background:" + col + '"></span>' +
      '<span class="cv-live" style="left:' + (last[0] / W * 100).toFixed(2) + "%;top:" + (last[1] / Hh * 100).toFixed(2) + '%">LIVE</span>' +
      '<span class="cv-base" style="top:' + (Y(0) / Hh * 100).toFixed(2) + '%">' + usd(0) + "</span>" +
      '<span class="cv-x cv-l">' + CN.esc(day(t0)) + '</span><span class="cv-x cv-r">' + CN.esc(day(t1)) + "</span>";
  }

  /* the two lines and the spot coins: built once per language / feed, so an opened «почему» stays open */
  function line(k, icon, title, sub, why) {
    var esc = CN.esc;
    return '<details class="pl" data-k="' + k + '"' + (LV.open[k] ? " open" : "") + '><summary><span class="plic">' + icon + '</span>' +
      '<span class="plname"><b>' + esc(title) + "</b><small>" + esc(sub) + '</small></span><span class="plval" id="pv-' + k + '"></span><span class="plchev" aria-hidden="true"></span></summary>' +
      (why ? '<p class="plwhy">' + esc(why) + "</p>" : "") + "</details>";
  }
  function coinRow(c) {
    var esc = CN.esc, k = "c:" + c.sym, col = KIND_COL[c.kind] || KIND_COL.alt, pc = c.pct;
    return '<details class="pc" data-k="' + esc(k) + '"' + (LV.open[k] ? " open" : "") + '><summary><i style="background:' + col + '"></i>' +
      '<span class="pcn"><b>' + esc(c.sym) + "</b><small>" + (c.name && c.name !== c.sym ? '<span class="pcnm">' + esc(c.name) + " · </span>" : "") + (c.usd != null ? usd(c.usd) : "") + "</small></span>" +
      '<span class="pcw">' + num(c.weight, 1) + '%</span><span class="pcp ' + (pc == null ? "" : pc >= 0 ? "up" : "down") + '">' + (pc == null ? "—" : signed(pc, nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(pc)) + "%")) + "</span>" +
      '<span class="plchev" aria-hidden="true"></span><span class="pcbar"><s style="width:' + Math.min(100, c.weight / LV.maxW * 100).toFixed(1) + "%;background:" + col + '"></s></span></summary>' +
      (c.why ? '<p class="plwhy">' + esc(c.why) + "</p>" : "") + "</details>";
  }
  function build() {
    var box = $("#pParts"), p = LV.p; if (!box || !p) return;
    var key = CN.lang() + "|" + LV.asof; if (LV.built === key && box.children.length) return;
    LV.built = key;
    var esc = CN.esc, f = p.futures || {}, sp = p.spot || {}, calc = p.calc || {}, coins = (sp.coins || []).slice();
    var nC = coins.length, cash = +sp.cash_pct || 0;
    LV.maxW = Math.max.apply(null, coins.map(function (c) { return +c.weight || 0; }).concat([cash, 1]));
    var fsub = f.closed_n != null ? t("pub.fut.sub", { open: num(f.open_n || 0), closed: num(f.closed_n || 0), wins: num(f.wins || 0) }) : t("pub.fut.sub0", { open: num(f.open_n || 0) });
    var ssub = t("pub.spot.sub", { coins: num(nC) + " " + plural(nC, "spot.coin"), cash: num(cash, 0) });
    // the donut: shares by kind (core / selected / high risk / dollars), each coin its own arc
    var C = 2 * Math.PI * 42, off = 0, arcs = [];
    coins.concat([{ kind: "cash", weight: cash }]).forEach(function (c) {
      var l = (+c.weight || 0) / 100 * C; if (l <= 0) return;
      arcs.push('<circle r="42" cx="50" cy="50" fill="none" stroke="' + (KIND_COL[c.kind] || KIND_COL.alt) + '" stroke-width="11" stroke-dasharray="' + Math.max(0, l - 1.2).toFixed(2) + " " + C.toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"/>');
      off += l;
    });
    var by = { core: 0, alt: 0, small: 0 };
    coins.forEach(function (c) { by[c.kind in by ? c.kind : "alt"] += +c.weight || 0; });
    var legend = ["core", "alt", "small"].filter(function (k) { return by[k] > 0; }).map(function (k) { return '<li><i style="background:' + KIND_COL[k] + '"></i>' + esc(t("pub.kind." + k)) + "<b>" + num(by[k], 1) + "%</b></li>"; }).join("") +
      (cash > 0 ? '<li><i style="background:' + KIND_COL.cash + '"></i>' + esc(t("pub.cash")) + "<b>" + num(cash, 1) + "%</b></li>" : "");
    var cashRow = cash > 0 ? '<details class="pc" data-k="c:$"' + (LV.open["c:$"] ? " open" : "") + '><summary><i style="background:' + KIND_COL.cash + '"></i><span class="pcn"><b>' + esc(t("pub.cash")) + "</b><small>" + esc(t("pub.cash.d")) + (sp.cash_usd != null ? " · " + usd(sp.cash_usd) : "") + '</small></span><span class="pcw">' + num(cash, 1) + '%</span><span class="pcp"></span><span class="plchev" aria-hidden="true"></span><span class="pcbar"><s style="width:' + Math.min(100, cash / LV.maxW * 100).toFixed(1) + "%;background:" + KIND_COL.cash + '"></s></span></summary>' + (calc.cash_why ? '<p class="plwhy">' + esc(calc.cash_why) + "</p>" : "") + "</details>" : "";
    box.innerHTML = '<div class="publines">' + line("fut", IC_FUT, t("pub.fut.t"), fsub, calc.futures_why) + line("spot", IC_SPOT, t("pub.spot.t"), ssub, calc.spot_why) + "</div>" +
      (nC ? '<div class="pubspot"><div class="psd"><div class="donut"><svg viewBox="0 0 100 100" aria-hidden="true"><circle r="42" cx="50" cy="50" fill="none" stroke="rgba(127,211,255,.08)" stroke-width="11"/>' + arcs.join("") +
        '</svg><div class="c"><b>' + num(nC) + "</b><span>" + esc(plural(nC, "spot.coin")) + '</span></div></div><ul class="pslg">' + legend + "</ul></div>" +
        '<div class="pslist"><h4>' + esc(t("pub.coins.h")) + '</h4><div class="pcgrid">' + [1, 2].map(function (i) { return '<div class="pchead h' + i + '" aria-hidden="true"><span>' + esc(t("pub.col.coin")) + "</span><span>" + esc(t("pub.col.share")) + "</span><span>" + esc(t("pub.col.buy")) + "</span></div>"; }).join("") +
        coins.map(coinRow).join("") + cashRow + "</div></div></div>" : "");
    $$("details", box).forEach(function (d) { d.addEventListener("toggle", function () { LV.open[d.getAttribute("data-k")] = d.open; }); });
  }
  function lineVal(k, v, pc) {
    var el = $("#pv-" + k); if (!el || v == null) return;
    el.innerHTML = '<b class="' + (v >= 0 ? "up" : "down") + '">' + money(v) + "</b><small>" + (pc != null ? pct(pc) : "") + "</small>";
  }

  function paint() {
    var r = liveValue(); if (!r) return;
    var p = LV.p, base = p.base_usd || 20000, v = r.v, pc = v / base * 100, f = p.futures || {}, sp = p.spot || {};
    var val = $("#pVal"); if (val) countTo(val, LV.shown, v);
    LV.shown = v;
    var pe = $("#pPnl"); if (pe) { pe.className = "pnl " + (v >= 0 ? "up" : "down"); pe.textContent = pct(pc); }
    var se = $("#pSince"); if (se && p.since) se.textContent = t("live.pnl", { date: day(p.since, true) }) + " · " + usd(base) + " → " + usd(base + v);
    lineVal("fut", f.usd, f.pct);
    lineVal("spot", r.spot, (sp.start_usd || 10000) ? r.spot / (sp.start_usd || 10000) * 100 : sp.pct);
    if (r.live) { var tl = LV.tail, now = LV.pxAt; if (!tl.length || now - tl[tl.length - 1][0] > 5000) tl.push([now, v]); if (tl.length > 240) tl.shift(); }
    drawLive($("#pCurve"), p);
    note(r.live);
    emit("cn:pflive", { value: Math.round(v * 100) / 100, pct: Math.round(pc * 100) / 100, live: !!r.live });
  }
  function note(live) {
    var n = $("#pLive"); if (!n) return;
    n.classList.toggle("on", !!live);
    n.textContent = live ? t("live.real", { ago: ago(LV.pxAt) }) : (LV.asof ? t("live.feed", { ago: ago(LV.asof) }) : "");
  }
  function refresh() { if (setup()) paint(); }
  doc.addEventListener("cn:data", refresh);
  doc.addEventListener("cn:static", function () { LV.shown = null; LV.built = ""; refresh(); });
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) poll(); });
  refresh();
  setTimeout(poll, 1200);
  setInterval(poll, 15000);
  setInterval(function () { if (!doc.hidden) { var r = liveValue(); note(r && r.live); } }, 1000);

  /* ================= NOVA chat: a caret while NOVA writes ================= */
  var chat = $("#chat");
  /* the sphere next to «Ask NOVA AI» works harder while NOVA is writing */
  var sph = $("#novaSph");
  if (sph && window.NovaSphere && !sph._sph) sph._sph = window.NovaSphere.mount(sph, { busy: function () { return !!(chat && chat.classList.contains("writing")); } });
  if (chat && "MutationObserver" in window) {
    var quiet = null;
    new MutationObserver(function () {
      var bots = $$(".msg.bot", chat), b = bots[bots.length - 1]; if (!b) return;
      b.classList.toggle("typing", !b.textContent.trim());
      chat.classList.add("writing");
      if (quiet) clearTimeout(quiet);
      quiet = setTimeout(function () { chat.classList.remove("writing"); }, 600);
    }).observe(chat, { childList: true, subtree: true, characterData: true });
  }

  /* ================= piggy: ⓘ explanations next to the calculator labels ================= */
  $$(".ii").forEach(function (btn) {
    var tip = doc.getElementById(btn.getAttribute("aria-controls")); if (!tip) return;
    function set(open) { btn.setAttribute("aria-expanded", open ? "true" : "false"); tip.hidden = !open; btn.classList.toggle("on", open); }
    btn.addEventListener("click", function (ev) { ev.stopPropagation(); var open = btn.getAttribute("aria-expanded") !== "true"; $$(".ii").forEach(function (o) { if (o !== btn && o.getAttribute("aria-expanded") === "true") { o.click(); } }); set(open); });
    btn.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { set(false); } });
  });
  doc.addEventListener("click", function (ev) { if (!ev.target.closest || !ev.target.closest(".iitip")) $$(".ii[aria-expanded='true']").forEach(function (b) { b.click(); }); });

  /* ================= «Всё в одном приложении»: the phone turns its own pages ================= */
  (function () {
    var tabs = $("#tabs"), box = $(".appgrid"); if (!tabs || !box) return;
    var pausedTill = 0, vis = false, timer = null;
    function step() {
      if (CN.reduce || doc.hidden || !vis || Date.now() < pausedTill) return;
      var all = $$("#tabs .tab"); if (!all.length) return;
      var i = all.findIndex ? all.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; }) : 0;
      all[(i + 1) % all.length].click();   // the same path as a tap: the screen and its caption change together
    }
    function hold() { pausedTill = Date.now() + 10000; }
    tabs.addEventListener("pointerdown", hold); tabs.addEventListener("keydown", hold);
    var ph = $("#app .phone"); if (ph) { ph.addEventListener("pointerdown", hold); ph.addEventListener("touchstart", hold, { passive: true }); ph.addEventListener("wheel", hold, { passive: true }); }
    var dots = $("#scrDots"); if (dots) dots.addEventListener("pointerdown", hold);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }, { threshold: 0.35 }).observe(box); else vis = true;
    if (!CN.reduce) timer = setInterval(step, 3500);
  })();

  /* ================= cards lift on touch too (hover does it on a mouse) ================= */
  $$(".howflow .hw, .earnflow li, .cnsteps .cs").forEach(function (c) {
    c.addEventListener("touchstart", function () { c.classList.add("lift"); setTimeout(function () { c.classList.remove("lift"); }, 700); }, { passive: true });
  });

  /* ================= gentle reveal (v7): text blocks and small cards only — media never waits for an observer ================= */
  (function () {
    if (CN.reduce || !("IntersectionObserver" in window)) return;
    var sel = ".sec .sec-head, .whygrid li, .aisteps li, .pipe .eng, .howflow .hw, .cnsteps .cs, .faqgrid .faq details, .livecta, .final .wrap > div";
    var els = $$(sel).filter(function (el) { return !el.closest(".hero"); });
    function show(el) { el.classList.add("in"); }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return;          // already on screen: no flash
      el.classList.add("rv");
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = (el.matches(".whygrid li, .aisteps li, .howflow .hw, .cnsteps .cs, .faq details") ? (sib % 3) * 70 : 0) + "ms";
      io.observe(el);
    });
    var tk = null;
    function sweep() {   // anything above the bottom of the screen is shown, whatever the observer did
      tk = null; var H = innerHeight;
      $$(".rv:not(.in)").forEach(function (el) { if (el.getBoundingClientRect().top < H) show(el); });
    }
    addEventListener("scroll", function () { if (!tk) tk = setTimeout(sweep, 150); }, { passive: true });
    addEventListener("hashchange", function () { setTimeout(sweep, 400); });
    addEventListener("pageshow", sweep);
  })();
})();
