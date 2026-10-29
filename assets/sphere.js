/* CRYPTO NOVA — the NOVA AI emblem, alive (owner 29.10: «обнови светящийся шар с нашим фирменным логотипом» and «он должен
   быть динамичным — вращаться, двигаться, как старый»). It is the owner's picture in motion: the glowing «N» core and the
   BTC / ETH / SOL / BNB coins are cut from his picture (assets/img/nova-parts.webp, tools in the site README); the three
   glowing orbits are drawn live with the picture's geometry, turn slowly in the plane, the coins travel along them, light
   flows along the rings and the core breathes softly. With prefers-reduced-motion it stands still in the picture's own pose.
   100-unit design grid, scaled to any size at the screen's pixel density.
   NovaSphere.draw(ctx, cx, cy, half, t, {busy, still}); NovaSphere.mount(canvas, {busy: fn}); NovaSphere.ready(fn) runs fn
   once the picture parts are loaded; every <canvas data-sphere> mounts itself. */
(function (w) {
  "use strict";
  var TAU = Math.PI * 2, doc = w.document;
  // the parts sheet sits next to this script: assets/sphere.js → assets/img/nova-parts.webp (same ?v= stamp)
  var me = doc.currentScript && doc.currentScript.src;
  var SRC = me ? me.replace(/sphere\.js(\?[^#]*)?$/, "img/nova-parts.webp$1") : "assets/img/nova-parts.webp";
  var IMG = new Image(), READY = false, WAIT = [];
  IMG.decoding = "async";
  IMG.onload = function () { READY = true; WAIT.splice(0).forEach(function (f) { try { f(); } catch (e) { /* a canvas that went away */ } }); };
  IMG.src = SRC;
  // sheet: the core 256×256 at 0,0 (glass interior, radius 120 of 128); coins 128×128 (disc radius 50 of 64)
  var CORE = [0, 0, 256, 256, 120 / 128], COIN = { btc: [256, 0], eth: [384, 0], sol: [256, 128], bnb: [384, 128] };
  var WARM = { btc: true, bnb: true };

  /* the picture's geometry, measured on the owner's 1254-px picture (centre 632,618; 640 px = 50 units): every orbit is a
     tilted circle — g: the long axis on screen, b: the tilt (short / long = sin b), R: the radius, w: the coins' speed,
     coins: [name, angle at t = 0] (t = 0 is the picture's own pose) */
  var K = 50 / 640;
  var ORB = [
    { g: -1.44, b: 0.41, R: 523 * K, w: 0.34, coins: [] },
    { g: 0.50, b: 0.35, R: 580 * K, w: 0.26, coins: [["btc", -2.38], ["bnb", 0.62]] },
    { g: -0.36, b: 0.33, R: 550 * K, w: -0.3, coins: [["eth", 0.42], ["sol", 2.36]] }
  ];
  var FAINT = [{ g: 0.2, b: 0.62, R: 44 }, { g: -0.9, b: 0.5, R: 40 }];
  var RS = 13.6, CR = 4.1, ROT = 0.045, TEMPO = 1;
  var STARS = [];
  (function () { var s = 11; function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 22; i++) { var a = r() * TAU, d = 17 + r() * 30; STARS.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.9, s: 0.25 + r() * 0.45, ph: r() * TAU }); } })();

  /* a point of orbit o at angle th: the tilted circle turned by g + rot in the plane; z > 0 is in front of the core */
  function op(o, th, rot) {
    var x = Math.cos(th) * o.R, y = Math.sin(th) * o.R * Math.sin(o.b), z = Math.sin(th) * o.R * Math.cos(o.b), g = o.g + rot;
    return { x: x * Math.cos(g) - y * Math.sin(g), y: x * Math.sin(g) + y * Math.cos(g), z: z };
  }
  /* depth shade: darker where the orbit is behind the core, one continuous conic gradient per half (no seams) */
  function shade(g, o, rot) {
    var st = [], p0 = op(o, 0, rot), f0 = Math.atan2(p0.y, p0.x);
    for (var q = 0; q < 36; q++) {
      var th = q * TAU / 36, p = op(o, th, rot), f = Math.atan2(p.y, p.x) - f0;
      st.push([((f % TAU) + TAU) % TAU / TAU, 0.55 * (1 - (Math.sin(th) + 1) / 2)]);
    }
    st.sort(function (a, b) { return a[0] - b[0]; });
    var gr = g.createConicGradient(f0, 0, 0);
    st.forEach(function (x) { gr.addColorStop(Math.min(1, Math.max(0, x[0])), "rgba(4,10,34," + x[1].toFixed(3) + ")"); });
    gr.addColorStop(1, "rgba(4,10,34," + st[0][1].toFixed(3) + ")");
    return gr;
  }
  function ribbon(g, o, rot, front, t, glow, small) {
    var a0 = front ? -0.02 : Math.PI - 0.02, a1 = front ? Math.PI + 0.02 : TAU + 0.02, n = small ? 28 : 72;
    function path() { g.beginPath(); for (var i = 0; i <= n; i++) { var p = op(o, a0 + (a1 - a0) * i / n, rot); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); } }
    var conic = !!g.createConicGradient, body = "rgba(150,210,255,.9)";
    if (conic) {   // the picture's colours: cold blue and white light with warm gold passages, flowing slowly along the ring
      body = g.createConicGradient(t * 0.35 * (o.w > 0 ? 1 : -1) + o.g, 0, 0);
      body.addColorStop(0, "rgba(80,165,255,.95)"); body.addColorStop(0.16, "rgba(235,248,255,1)"); body.addColorStop(0.27, "rgba(255,196,120,.95)");
      body.addColorStop(0.38, "rgba(120,190,255,.95)"); body.addColorStop(0.62, "rgba(60,140,255,.9)"); body.addColorStop(0.8, "rgba(230,246,255,1)");
      body.addColorStop(0.9, "rgba(255,210,150,.9)"); body.addColorStop(1, "rgba(80,165,255,.95)");
    }
    g.lineCap = "round"; g.lineJoin = "round";
    if (!small) { path(); g.strokeStyle = "rgba(40,120,255," + ((front ? 0.13 : 0.08) * glow).toFixed(3) + ")"; g.lineWidth = 7; g.stroke(); }
    path(); g.strokeStyle = "rgba(70,150,255," + ((front ? 0.24 : 0.14) * glow).toFixed(3) + ")"; g.lineWidth = small ? 3.6 : 3.8; g.stroke();
    path(); g.strokeStyle = body; g.lineWidth = small ? 1.7 : 1.9; g.stroke();
    if (!small) { path(); g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 0.55; g.stroke(); }
    if (conic && !front) { path(); g.strokeStyle = shade(g, o, rot); g.lineWidth = small ? 3.8 : 4; g.stroke(); }
  }
  function coin(g, name, x, y, r, dim, small) {
    var warm = WARM[name];
    if (!small) {
      var h = g.createRadialGradient(x, y, r * 0.7, x, y, r * 2.4);
      h.addColorStop(0, warm ? "rgba(255,160,60," + (0.5 * dim).toFixed(3) + ")" : "rgba(90,170,255," + (0.5 * dim).toFixed(3) + ")");
      h.addColorStop(1, warm ? "rgba(255,160,60,0)" : "rgba(90,170,255,0)");
      g.fillStyle = h; g.beginPath(); g.arc(x, y, r * 2.4, 0, TAU); g.fill();
    }
    if (READY) {
      var s = COIN[name], rr = r * 64 / 50;   // the disc is 50 of the tile's 64 px half
      g.globalAlpha = dim; g.drawImage(IMG, s[0], s[1], 128, 128, x - rr, y - rr, rr * 2, rr * 2); g.globalAlpha = 1;
    } else {
      g.fillStyle = warm ? "rgba(247,164,58," + dim + ")" : "rgba(110,180,255," + dim + ")"; g.beginPath(); g.arc(x, y, r * 0.8, 0, TAU); g.fill();
    }
  }
  function core(g, t, glow, small) {
    var p = 0.5 + 0.5 * Math.sin(t * 1.25);   // the soft breath
    var halo = g.createRadialGradient(0, 0, RS * 0.85, 0, 0, RS * 1.75);
    halo.addColorStop(0, "rgba(90,170,255," + ((0.42 + 0.16 * p) * glow).toFixed(3) + ")"); halo.addColorStop(1, "rgba(90,170,255,0)");
    g.fillStyle = halo; g.beginPath(); g.arc(0, 0, RS * 1.75, 0, TAU); g.fill();
    // the glass: the owner's «N» interior, then a glowing shell and rim drawn around it
    g.fillStyle = "#050B2A"; g.beginPath(); g.arc(0, 0, RS * 0.98, 0, TAU); g.fill();
    if (READY) { var ri = RS * 0.74 / CORE[4]; g.drawImage(IMG, CORE[0], CORE[1], CORE[2], CORE[3], -ri, -ri, ri * 2, ri * 2); }
    else { g.strokeStyle = "rgba(220,240,255,.9)"; g.lineWidth = RS * 0.16; g.beginPath(); g.moveTo(-RS * 0.4, RS * 0.3); g.bezierCurveTo(-RS * 0.42, -RS * 0.45, -RS * 0.12, -RS * 0.45, 0, 0); g.bezierCurveTo(RS * 0.12, RS * 0.45, RS * 0.42, RS * 0.42, RS * 0.4, -RS * 0.3); g.stroke(); }
    var sh = g.createRadialGradient(0, 0, RS * 0.62, 0, 0, RS);
    sh.addColorStop(0, "rgba(20,80,230,0)"); sh.addColorStop(0.45, "rgba(25,95,255," + (0.42 + 0.1 * p).toFixed(3) + ")");
    sh.addColorStop(0.78, "rgba(70,165,255," + (0.78 + 0.12 * p).toFixed(3) + ")"); sh.addColorStop(0.95, "rgba(200,236,255,.95)"); sh.addColorStop(1, "rgba(150,210,255,.35)");
    g.fillStyle = sh; g.beginPath(); g.arc(0, 0, RS, 0, TAU); g.fill();
    if (!small) {
      g.strokeStyle = "rgba(235,248,255,.8)"; g.lineWidth = 0.5; g.beginPath(); g.arc(0, 0, RS * 0.995, 0, TAU); g.stroke();
      g.strokeStyle = "rgba(255,255,255," + (0.45 + 0.2 * p).toFixed(3) + ")"; g.lineWidth = 0.8; g.beginPath(); g.arc(0, 0, RS * 0.9, Math.PI * 1.08, Math.PI * 1.42); g.stroke();
      g.strokeStyle = "rgba(190,230,255,.35)"; g.lineWidth = 0.6; g.beginPath(); g.arc(0, 0, RS * 0.9, Math.PI * 0.08, Math.PI * 0.36); g.stroke();
    }
  }
  function draw(g, cx0, cy0, half, t, opt) {
    opt = opt || {}; t = (t || 0) * TEMPO;
    var busy = !!opt.busy, small = half < 24, glow = busy ? 1.35 : 1, rot = t * ROT;
    g.save(); g.translate(cx0, cy0); g.scale(half / 50, half / 50);
    // the blue haze of the picture
    var hz = g.createRadialGradient(0, 0, RS * 0.5, 0, 0, 50);
    hz.addColorStop(0, "rgba(50,130,255," + (0.3 * glow).toFixed(3) + ")"); hz.addColorStop(0.5, "rgba(40,100,240," + (0.1 * glow).toFixed(3) + ")"); hz.addColorStop(1, "rgba(30,80,220,0)");
    g.fillStyle = hz; g.beginPath(); g.arc(0, 0, 50, 0, TAU); g.fill();
    if (!small) {
      // the thin dotted orbits and the star dust around
      g.setLineDash([0.5, 1.6]); g.lineWidth = 0.35; g.strokeStyle = "rgba(120,185,255,.28)";
      FAINT.forEach(function (o) { g.beginPath(); for (var i = 0; i <= 64; i++) { var p = op(o, i * TAU / 64, rot * 0.6); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); } g.stroke(); });
      g.setLineDash([]);
      STARS.forEach(function (s) { var a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.9 + s.ph)); g.fillStyle = "rgba(170,215,255," + a.toFixed(3) + ")"; g.beginPath(); g.arc(s.x, s.y, s.s, 0, TAU); g.fill(); });
    }
    var C = [];
    ORB.forEach(function (o) {
      ribbon(g, o, rot, false, t, glow, small);
      o.coins.forEach(function (c) { var p = op(o, c[1] + t * o.w, rot); C.push({ n: c[0], p: p, R: o.R }); });
    });
    function coinAt(c, dim) { var k = 0.86 + 0.14 * (c.p.z / c.R + 1) / 2; coin(g, c.n, c.p.x, c.p.y, CR * k * (small ? 1.25 : 1), dim, small); }
    C.filter(function (c) { return c.p.z < 0; }).forEach(function (c) { coinAt(c, 0.72); });
    core(g, t, glow, small);
    ORB.forEach(function (o) { ribbon(g, o, rot, true, t, glow, small); });
    C.filter(function (c) { return c.p.z >= 0; }).forEach(function (c) { coinAt(c, 1); });
    g.restore();
  }

  function mount(cv, opt) {
    if (!cv || !cv.getContext) return null;
    opt = opt || {};
    var ctx = cv.getContext("2d"), W = 0, H = 0, run = false, vis = true, t = 0, last = 0;
    var reduce = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function size() { var d = Math.min(3, w.devicePixelRatio || 1); W = cv.width = Math.max(1, Math.round(cv.clientWidth * d)); H = cv.height = Math.max(1, Math.round(cv.clientHeight * d)); }
    function frame(now) {
      if (!run && now !== -1) return;
      var busy = typeof opt.busy === "function" ? opt.busy() : false;
      if (now !== -1) { var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now; t += dt * (busy ? 2.2 : 1); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
      draw(ctx, W / 2, H / 2, Math.min(W, H) / 2, t, { busy: busy });
      if (now !== -1) requestAnimationFrame(frame);
    }
    function set() { var want = vis && !doc.hidden && !reduce; if (want && !run) { run = true; last = 0; requestAnimationFrame(frame); } else if (!want) { run = false; frame(-1); } }
    size(); w.addEventListener("resize", function () { size(); if (!run) frame(-1); });
    // a canvas that starts hidden gets its real size when it is shown
    if ("ResizeObserver" in w) new ResizeObserver(function () { var d = Math.min(3, w.devicePixelRatio || 1); if (Math.round(cv.clientWidth * d) !== W || Math.round(cv.clientHeight * d) !== H) { size(); if (!run) frame(-1); } }).observe(cv);
    doc.addEventListener("visibilitychange", set);
    if ("IntersectionObserver" in w) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; set(); }).observe(cv);
    ready(function () { if (!run) frame(-1); });
    set(); frame(-1);
    return { size: size };
  }
  function ready(fn) { if (READY) fn(); else WAIT.push(fn); }

  w.NovaSphere = { draw: draw, mount: mount, ready: ready };
  function auto() { [].forEach.call(doc.querySelectorAll("canvas[data-sphere]"), function (c) { if (!c._sph) try { c._sph = mount(c, {}); } catch (e) { c._sph = true; } }); }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", auto); else auto();
  w.NovaSphere.auto = auto;
})(window);
