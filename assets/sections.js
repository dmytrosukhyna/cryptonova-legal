/* CRYPTO NOVA — section scripts: the live public portfolio, the NOVA chat polish, the piggy.
   Reads texts and data through window.CN (end of site.js). No invented numbers: the live value is the feed value
   with its spot part repriced at public exchange prices; when those prices are not reachable, the feed value stays. */
(function () {
  "use strict";
  var CN = window.CN; if (!CN) return;
  var doc = document, $ = CN.$, $$ = CN.$$, t = CN.t;
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

  /* ================= LIVE public portfolio ================= */
  var LV = { asof: null, p: null, sleeve: 0, coins: [], px: {}, pxAt: 0, bad: {}, host: 0, fails: 0, dead: false, shown: null, tail: [], anim: null };
  var HOSTS = ["https://data-api.binance.vision", "https://api.binance.com"];

  function setup() {
    var h = CN.home() || {}, p = h.portfolio;
    if (!p || p.value_usd == null) return false;
    if (h.asof !== LV.asof) { LV.asof = h.asof; LV.tail = []; }
    LV.p = p;
    var sl = (p.sleeves || []).filter(function (s) { return s.key === "spot"; })[0];
    LV.sleeve = sl && sl.usd > 0 ? sl.usd : 0;
    LV.coins = (((h.spot || {}).coins) || []).filter(function (c) { return c && c.sym && c.price > 0 && c.weight > 0; })
      .map(function (c) { return { sym: String(c.sym).toUpperCase(), w: c.weight / 100, ref: +c.price }; });
    return true;
  }
  /* the feed value + the spot sleeve's move since the feed was made, coin by coin, at live prices */
  function liveValue() {
    var p = LV.p; if (!p) return null;
    var d = 0, priced = 0;
    if (LV.pxAt && LV.sleeve) LV.coins.forEach(function (c) { var now = LV.px[c.sym]; if (now > 0) { d += c.w * (now / c.ref - 1); priced += c.w; } });
    if (!priced || Math.abs(d) > 0.25) return { v: p.value_usd, live: false };   // >25 % in minutes = stale reference, not a market move
    return { v: p.value_usd + LV.sleeve * d, live: true };
  }

  function fetchJSON(url) {
    var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    return fetch(url, { cache: "no-store", signal: ctl ? ctl.signal : undefined }).then(function (r) { clearTimeout(tm); if (!r.ok) { var e = new Error("http"); e.status = r.status; throw e; } return r.json(); });
  }
  function took(arr) { (arr || []).forEach(function (r) { if (r && r.symbol && +r.price > 0) LV.px[r.symbol.replace(/USDT$/, "")] = +r.price; }); LV.pxAt = Date.now(); LV.fails = 0; }
  function poll() {
    if (LV.dead || doc.hidden || !window.fetch || !LV.coins.length || !LV.sleeve) return;
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
    if (CN.reduce || from == null || Math.abs(to - from) < 0.005) { el.textContent = usd(to, 2); return; }
    var t0 = performance.now(), dur = 900;
    el.classList.remove("tick-up", "tick-down"); el.classList.add(to > from ? "tick-up" : "tick-down");
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = usd(from + (to - from) * e, 2);
      if (k < 1) LV.anim = requestAnimationFrame(step); else { LV.anim = null; setTimeout(function () { el.classList.remove("tick-up", "tick-down"); }, 700); }
    })(t0);
  }

  function drawLive(box, p) {
    var c = (p.curve || []).filter(function (r) { return r && r[1] != null; }); if (!box || c.length < 2) return;
    var start = p.start_usd || 10000, W = 640, Hh = 220, padT = 16, padB = 26;
    var pts = c.map(function (r) { return [r[0], start + r[1]]; }), nFeed = pts.length;
    LV.tail.forEach(function (r) { if (r[0] > pts[pts.length - 1][0]) pts.push(r); });
    var t0 = pts[0][0], t1 = pts[pts.length - 1][0];
    var vals = pts.map(function (r) { return r[1]; }).concat([start]);
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * 0.12, start * 0.002); lo -= pad; hi += pad;
    function X(tm) { return (tm - t0) / Math.max(1, t1 - t0) * W; }
    function Y(v) { return padT + (1 - (v - lo) / (hi - lo)) * (Hh - padT - padB); }
    var xy = pts.map(function (r) { return X(r[0]).toFixed(1) + "," + Y(r[1]).toFixed(1); });
    var lastV = pts[pts.length - 1][1], col = lastV >= start ? "#3ADB93" : "#FF6E86";
    var feedPts = xy.slice(0, nFeed), tailPts = xy.slice(nFeed - 1), last = xy[xy.length - 1].split(",");
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + Hh + '" preserveAspectRatio="none" role="img" aria-label="' + CN.esc(t("live.h2")) + '">' +
      '<defs><linearGradient id="cgL" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<line x1="0" x2="' + W + '" y1="' + Y(start).toFixed(1) + '" y2="' + Y(start).toFixed(1) + '" stroke="rgba(127,211,255,.35)" stroke-dasharray="4 5" vector-effect="non-scaling-stroke"/>' +
      '<polygon points="0,' + (Hh - padB) + " " + xy.join(" ") + " " + W + "," + (Hh - padB) + '" fill="url(#cgL)"/>' +
      '<polyline points="' + feedPts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' +
      (tailPts.length > 1 ? '<polyline points="' + tailPts.join(" ") + '" fill="none" stroke="#C9FFE9" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>' : "") + "</svg>" +
      '<span class="cv-dot live" style="left:' + (last[0] / W * 100).toFixed(2) + "%;top:" + (last[1] / Hh * 100).toFixed(2) + "%;background:" + col + '"></span>' +
      '<span class="cv-live" style="left:' + (last[0] / W * 100).toFixed(2) + "%;top:" + (last[1] / Hh * 100).toFixed(2) + '%">LIVE</span>' +
      '<span class="cv-base" style="top:' + (Y(start) / Hh * 100).toFixed(2) + '%">' + usd(start) + "</span>" +
      '<span class="cv-x cv-l">' + CN.esc(day(t0)) + '</span><span class="cv-x cv-r">' + CN.esc(day(t1)) + "</span>";
  }

  function paint() {
    var r = liveValue(); if (!r) return;
    var p = LV.p, start = p.start_usd || 10000, v = r.v, pnl = v - start, pc = pnl / start * 100;
    var val = $("#pVal"); if (val) countTo(val, LV.shown, v);
    LV.shown = v;
    var pe = $("#pPnl"); if (pe) { pe.className = "pnl " + (pnl >= 0 ? "up" : "down"); pe.textContent = signed(pnl, usd(Math.abs(pnl), 2)) + "  (" + pct(pc) + ")"; }
    var se = $("#pSince"); if (se && p.since) se.textContent = t("live.pnl", { date: day(p.since, true) }) + ", " + usd(start) + " → " + usd(v);
    split();
    if (r.live) { var tl = LV.tail, now = LV.pxAt; if (!tl.length || now - tl[tl.length - 1][0] > 5000) tl.push([now, v]); if (tl.length > 240) tl.shift(); }
    drawLive($("#pCurve"), p);
    note(r.live);
    emit("cn:pflive", { value: Math.round(v * 100) / 100, pnl: Math.round(pnl * 100) / 100, pct: Math.round(pc * 100) / 100, live: !!r.live });
  }
  /* owner 21.10 19:17: «спот плюс фьючерсы» — what the public portfolio holds, and what the engines' own accounts made */
  function split() {
    var el = $("#pSplit"); if (!el) return;
    var h = CN.home() || {}, p = h.portfolio || {}, sl = p.sleeves || [], by = {}, esc = CN.esc, html = "";
    sl.forEach(function (x) { if (x && x.key) by[x.key] = +x.usd || 0; });
    var all = sl.reduce(function (a, x) { return a + (+x.usd || 0); }, 0);
    function pair(label, val) { return '<span class="nw">' + esc(label) + " " + val + "</span>"; }
    function pl(v) { return '<b class="' + (v >= 0 ? "up" : "down") + '">' + signed(v, usd(Math.abs(v))) + "</b>"; }
    if (by.spot != null && by.futures != null && all > 0)
      html += '<p class="ls-in"><span class="lt">' + esc(t("live.in.t")) + "</span> " + [pair(t("live.in.spot"), "<b>" + usd(by.spot) + "</b>"),
        pair(t("live.in.fut"), "<b>" + usd(by.futures) + "</b>"), pair(t("live.in.other"), "<b>" + usd(all - by.spot - by.futures) + "</b>")].join(" · ") + "</p>";
    var tt = h.total || {}, su = tt.spot_usd != null ? tt.spot_usd : (h.spot || {}).usd, fu = tt.futures_usd != null ? tt.futures_usd : (h.futures || {}).usd;
    if (typeof su === "number" && typeof fu === "number")
      html += '<p class="ls-desk"><span class="lt">' + esc(t("live.desk.t").replace("{n}", usd(10000))) + "</span> " + [pair(t("live.in.spot"), pl(su)), pair(t("live.in.fut"), pl(fu))].join(" · ") + "</p>";
    el.innerHTML = html;
  }
  function note(live) {
    var n = $("#pLive"); if (!n) return;
    n.classList.toggle("on", !!live);
    n.textContent = live ? t("live.real", { ago: ago(LV.pxAt) }) : (LV.asof ? t("live.feed", { ago: ago(LV.asof) }) : "");
  }
  function refresh() { if (setup()) paint(); }
  doc.addEventListener("cn:data", refresh);
  doc.addEventListener("cn:static", function () { LV.shown = null; refresh(); });
  doc.addEventListener("visibilitychange", function () { if (!doc.hidden) poll(); });
  refresh();
  setTimeout(poll, 1200);
  setInterval(poll, 15000);
  setInterval(function () { if (!doc.hidden) note(liveValue() && liveValue().live); }, 1000);

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
    var ph = $("#app .phone"); if (ph) ph.addEventListener("pointerdown", hold);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }, { threshold: 0.35 }).observe(box); else vis = true;
    if (!CN.reduce) timer = setInterval(step, 3500);
  })();

  /* ================= cards lift on touch too (hover does it on a mouse) ================= */
  $$(".howflow .hw, .earnflow li").forEach(function (c) {
    c.addEventListener("touchstart", function () { c.classList.add("lift"); setTimeout(function () { c.classList.remove("lift"); }, 700); }, { passive: true });
  });

  /* ================= gentle reveal: every block fades up once when it comes into view ================= */
  (function () {
    if (CN.reduce || !("IntersectionObserver" in window)) return;
    var sel = ".sec .sec-head, .sec > .wrap > .kicker, .sec > .wrap > h2, .think, .aibrain, .engroom, .pftabs, .live.hud, .appgrid, .trygrid .tool, .howflow .hw, .earn2, .faqgrid .faq details, .final .wrap > *";
    var els = $$(sel).filter(function (el) { return !el.closest(".hero"); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return;          // already on screen: no flash
      el.classList.add("rv"); el.style.transitionDelay = (el.matches(".hw, .faq details") ? (Array.prototype.indexOf.call(el.parentNode.children, el) % 4) * 70 : 0) + "ms";
      io.observe(el);
    });
  })();
})();
