/* The Pizzary Konzept Seite (Social Bites).
   Technik: GSAP ScrollSmoother (weiches Scrollen) und ScrollTrigger mit pin und scrub.
   Hero: Pizza Aufbau als Video, das beim Scrollen gespult wird (video.currentTime = Scrollfortschritt, Video als Blob geladen).
   Mitmach Builder: Stufe, Soße, Käse, Toppings antippen, Toppings fliegen auf die Pizza, Grenzen je Stufe.
   Wort Reveal per scrub, horizontaler Scroll mit containerAnimation, Laufschriften und Parallax laufen mit dem Scrollen.
   Ohne JS, ohne GSAP oder mit prefers-reduced-motion ist die Seite eine normale statische Seite. */
(function () {
  "use strict";
  var html = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width:899px)").matches;
  var SP = window.SPRITES || {};

  /* ---------- Lokale Links: auf file:// liegen Board, Kiosk und One Pager in den Nachbarordnern ---------- */
  if (location.protocol === "file:") {
    $$("[data-local]").forEach(function (a) { a.setAttribute("href", a.getAttribute("data-local")); });
  }

  /* Döner Pizza: Standbild sofort setzen (auch ohne Animation), passend zum Gerät */
  (function () {
    var DF = window.DOENER_FRAMES, poster = $("#dnPoster");
    if (!poster) return;
    if (!DF) { poster.remove(); return; }
    var set = (window.innerWidth < window.innerHeight && DF.m) ? "m" : "d";
    poster.src = "assets/doener_frames/" + set + "/f_0001." + (DF.ext || "webp");
  })();

  /* ---------- Menü ---------- */
  var menu = $("#menu"), menuBtn = $("#menuBtn");
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.firstElementChild.textContent = open ? "Zu" : "Menü";
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  /* ---------- Hilfen für die Pizza Beläge ---------- */
  var TOP = {
    salami: { w: 15.5, n: 7 }, schinken: { w: 17, n: 5 }, champignon: { w: 13, n: 7 }, zwiebel: { w: 14, n: 7 }, mais: { w: 5.4, n: 18 },
    paprika: { w: 15, n: 8 }, jalapeno: { w: 9, n: 8 }, peperoni: { w: 17, n: 5 }, spinat: { w: 15, n: 6 }, tomate: { w: 10.5, n: 7 }
  };
  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pieces(name, n, rng) {
    var list = SP[name] || [], out = [], mean = 0;
    if (!list.length) return out;
    list.forEach(function (m) { mean += m.w; });
    mean /= list.length;
    for (var i = 0; i < n; i++) {
      var m = list[i % list.length];
      out.push({ f: m.f, w: TOP[name].w * (m.w / mean) * (0.94 + rng() * 0.12), name: name });
    }
    return out;
  }
  // verteilt Stücke auf der Fläche, möglichst ohne starke Überlappung (Radius R in Prozent der Pizza Bühne)
  function layout(items, taken, rng, R) {
    items.forEach(function (it) {
      var best = null, bestScore = -Infinity;
      for (var tries = 0; tries < 70; tries++) {
        var ang = rng() * Math.PI * 2, rad = Math.sqrt(rng()) * (R - it.w * 0.42);
        var x = 50 + Math.cos(ang) * rad, y = 50 + Math.sin(ang) * rad, minD = 999;
        for (var k = 0; k < taken.length; k++) {
          var dx = taken[k].x - x, dy = taken[k].y - y;
          var d = Math.sqrt(dx * dx + dy * dy) - (taken[k].w + it.w) * 0.36;
          if (d < minD) minD = d;
        }
        if (minD > bestScore) { bestScore = minD; best = { x: x, y: y }; }
        if (minD > 0.6) break;
      }
      it.x = best.x; it.y = best.y; it.rot = rng() * 360;
      taken.push({ x: it.x, y: it.y, w: it.w });
    });
    return items;
  }
  function sprite(it, parent) {
    var img = document.createElement("img");
    img.className = "sp";
    img.src = "assets/sprites/" + it.f;
    img.alt = "";
    img.decoding = "async";
    img.style.width = it.w + "%";
    img.style.left = it.x + "%";
    img.style.top = it.y + "%";
    parent.appendChild(img);
    if (window.gsap) gsap.set(img, { xPercent: -50, yPercent: -50, rotation: it.rot });
    else img.style.transform = "translate(-50%,-50%) rotate(" + it.rot + "deg)";
    return img;
  }

  /* ---------- Bau deine eigene: Stufe, Soße, Käse, Toppings, Gewürz antippen ---------- */
  function builder() {
    if (window.BUILDER3D || !document.getElementById("bnStage")) return;   // 3D Builder (builder3d.js) übernimmt den Abschnitt
    var B = window.BAU || { sosse: [], kaese: [], gew: [], top: [] };
    var tabs = $$(".stufe"), spr = $("#bnSprites"), hint = $("#bnHint"), anim = !!window.gsap && !reduce;
    var sel = { sosse: [], kaese: [], top: [], gew: [] }, lim = { sosse: 1, kaese: 1, top: 1, gew: 1 }, placed = {}, preis = "", stufeN = 1;
    var rng = mulberry(17), names = {};
    B.top.forEach(function (t) { names[t[0]] = t[1]; });
    var boxes = { sosse: $("#chSosse"), kaese: $("#chKaese"), top: $("#chTop"), gew: $("#chGew") };
    var cnt = { sosse: $("#cntSosse"), kaese: $("#cntKaese"), top: $("#cntTop"), gew: $("#cntGew") };
    function chip(cat, val, label, icon) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.cat = cat; b.dataset.val = val;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = (icon ? '<img src="assets/sprites/' + icon + '" alt="">' : "") + "<span>" + label + "</span>";
      b.addEventListener("click", function () { toggle(cat, val, b); });
      boxes[cat].appendChild(b);
    }
    B.sosse.forEach(function (n) { chip("sosse", n, n); });
    B.kaese.forEach(function (n) { chip("kaese", n, n); });
    B.top.forEach(function (t) { var ic = SP[t[0]] && SP[t[0]][0]; chip("top", t[0], t[1], ic ? ic.f : ""); });
    B.gew.forEach(function (n) { chip("gew", n, n); });

    function say(msg) { hint.textContent = msg || ""; }
    function taken(except) {
      var t = [];
      Object.keys(placed).forEach(function (k) { if (k !== except) placed[k].items.forEach(function (it) { t.push(it); }); });
      return t;
    }
    function addTop(name) {
      var n = Math.max(3, Math.round(TOP[name].n * .72));
      var items = layout(pieces(name, n, rng), taken(name), rng, 37.5);
      var els = items.map(function (it) { return sprite(it, spr); });
      placed[name] = { items: items, els: els };
      if (anim) {
        els.forEach(function (e, i) {
          var it = items[i], ang = Math.random() * Math.PI * 2, d = 80 + Math.random() * 30;
          gsap.fromTo(e, { left: (50 + Math.cos(ang) * d) + "%", top: (50 + Math.sin(ang) * d) + "%", scale: 1.8, opacity: 0, rotation: it.rot + 160 },
            { left: it.x + "%", top: it.y + "%", scale: 1, opacity: 1, rotation: it.rot, duration: .7, delay: i * .045, ease: "back.out(1.4)" });
        });
      }
    }
    function removeTop(name) {
      var p = placed[name]; if (!p) return;
      delete placed[name];
      if (anim) gsap.to(p.els, { scale: 0, opacity: 0, duration: .3, stagger: .02, ease: "power2.in", onComplete: function () { p.els.forEach(function (e) { e.remove(); }); } });
      else p.els.forEach(function (e) { e.remove(); });
    }
    function layers() {
      var s = $("#bnSauce"), c = $("#bnCheese"), hasS = sel.sosse.length > 0, hasC = sel.kaese.length > 0;
      if (anim) {
        if (hasS && s.dataset.on !== "1") gsap.fromTo(s, { opacity: 1, clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(74% at 50% 50%)", duration: .8, ease: "power2.out" });
        if (!hasS && s.dataset.on === "1") gsap.to(s, { opacity: 0, duration: .3 });
        if (hasC !== (c.dataset.on === "1")) gsap.to(c, { opacity: hasC ? 1 : 0, scale: hasC ? 1 : 1.06, duration: .5, ease: "power2.out" });
      } else { s.style.opacity = hasS ? 1 : 0; c.style.opacity = hasC ? 1 : 0; }
      s.dataset.on = hasS ? "1" : ""; c.dataset.on = hasC ? "1" : "";
    }
    function update() {
      Object.keys(sel).forEach(function (cat) {
        cnt[cat].textContent = sel[cat].length + " / " + lim[cat];
        $$(".chip", boxes[cat]).forEach(function (b) {
          var on = sel[cat].indexOf(b.dataset.val) > -1;
          b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false");
          b.classList.toggle("full", sel[cat].length >= lim[cat] && lim[cat] > 1);
        });
      });
      $("#bnPriceBig").textContent = preis;
      var parts = [];
      if (sel.sosse.length) parts.push(sel.sosse.join(" und "));
      if (sel.kaese.length) parts.push(sel.kaese.join(" und "));
      if (sel.top.length) parts.push(sel.top.map(function (k) { return names[k]; }).join(", "));
      if (sel.gew.length) parts.push(sel.gew.join(" und "));
      $("#bnSum").textContent = parts.length ? "Deine Pizza: " + parts.join(" · ") + "." : "Wähle Soße, Käse und Toppings.";
      layers();
    }
    function toggle(cat, val, btn) {
      var list = sel[cat], i = list.indexOf(val);
      say("");
      if (i > -1) { list.splice(i, 1); if (cat === "top") removeTop(val); update(); return; }
      if (list.length >= lim[cat]) {
        if (lim[cat] === 1) {   // Grenze 1: die neue Wahl ersetzt die alte
          var old = list.pop(); if (cat === "top") removeTop(old);
        } else {
          say(cat === "top"
            ? (stufeN < 7 ? "Stufe voll. Mehr Toppings gibt es mit der nächsten Stufe." : "Mehr als 7 Toppings gehen nicht. Tausch einfach eins.")
            : "In dieser Stufe sind " + lim[cat] + " drin. Erst eins abwählen.");
          btn.classList.remove("nope"); void btn.offsetWidth; btn.classList.add("nope");
          return;
        }
      }
      list.push(val);
      if (cat === "top") addTop(val);
      if (anim) gsap.fromTo("#bnPriceBadge", { scale: 1.15 }, { scale: 1, duration: .4, ease: "back.out(2)" });
      update();
    }
    function stufe(btn) {
      tabs.forEach(function (t) { var on = t === btn; t.classList.toggle("on", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
      stufeN = +btn.dataset.n;
      lim = { sosse: +btn.dataset.sosse, kaese: +btn.dataset.kaese, top: stufeN, gew: +btn.dataset.gew };
      preis = btn.dataset.preis;
      $("#stufeInhalt").textContent = btn.dataset.inhalt;
      Object.keys(sel).forEach(function (cat) {   // kleinere Stufe kürzt die Auswahl
        while (sel[cat].length > lim[cat]) { var x = sel[cat].pop(); if (cat === "top") removeTop(x); }
      });
      say("");
      if (anim) gsap.fromTo(".bn-burst", { rotation: -6 }, { rotation: 12, duration: .7, ease: "power2.out" });
      update();
    }
    tabs.forEach(function (t) { t.addEventListener("click", function () { stufe(t); }); });
    $("#bnReset").addEventListener("click", function () {
      Object.keys(sel).forEach(function (cat) { sel[cat].slice().forEach(function (v) { if (cat === "top") removeTop(v); }); sel[cat] = []; });
      stufe(tabs[0]);
    });
    stufe(tabs[0]);
  }

  /* ---------- Lebende Figuren: ein gemeinsamer WebGL Canvas für alle Figuren ----------
     Jede Figur ist eine freigestellte PNG als Textur auf einem fein unterteilten Gitter. Füße unten fest, Auslenkung wächst
     nach oben (quadratisch), sanftes Schwingen und Wippen, oben (Arme mit Pizza) Heben und Kippen. Eigene Phase und eigenes Tempo,
     Neigung nach Scroll Geschwindigkeit. Hover oder Antippen: Hüpfen mit Squash und Stretch und Winken, Antippen zeigt eine Sprechblase.
     Ein Canvas (fixed, über der Seite, ohne Mausereignisse) zeichnet alle sichtbaren Figuren an ihre Platzhalter im DOM.
     Ohne WebGL oder per file://: CSS Bewegung. Reduzierte Bewegung: stehen still. */
  var FIG = {
    yuki:   { ph: 0.0, sp: 1.00, amp: 1.00, two: 0, arm: .64, piv: .13, say: "Finger weg, det is meine!" },
    mm:     { ph: 2.3, sp: 0.82, amp: 0.85, two: 1, arm: .64, piv: .13, say: "Ick und meine Pizza. Wahre Liebe." },
    reni:   { ph: 1.1, sp: 0.92, amp: 0.90, two: 0, arm: .66, piv: .12, say: "Ick seh allet. Vor allem, wenn du den Rand liegen lässt." },
    mustafa: { ph: 1.7, sp: 1.15, amp: 0.9, two: 0, arm: .55, piv: .55, say: "Dönerfleisch, Mozzarella, Tzatziki, Eisbergsalat, Kirschtomaten, rote Zwiebeln." },
    guenni: { ph: 3.0, sp: 1.10, amp: 0.80, two: 0, arm: .48, piv: .45, say: "Ick kenn die Straße noch ohne Schlange." },
    sam:    { ph: 4.2, sp: 0.95, amp: 0.85, two: 0, arm: .52, piv: .30, say: "Kein Schischi, nur Geschmack." },
    taube:  { ph: 0.7, sp: 1.30, amp: 0.75, two: 0, arm: .70, piv: .22, say: "Watching is free. Tasting is better." }
  };
  var scrollVel = 0, FR = null;
  var FIG_VS = [
    "attribute vec2 a_uv;",
    "uniform vec4 u_rect; uniform vec2 u_cv; uniform float u_t; uniform vec4 u_p; uniform vec4 u_q; uniform vec4 u_fx;",
    "varying vec2 v_uv;",
    "void main(){",
    "  v_uv = vec2(mix(a_uv.x, 1.0 - a_uv.x, u_q.z), a_uv.y);",
    "  float W = u_rect.z, H = u_rect.w;",
    "  float h = 1.0 - a_uv.y, hq = h * h;",
    "  vec2 p = vec2(a_uv.x * W, a_uv.y * H);",
    "  float sq = u_fx.y;",                                                   // Squash und Stretch um die Füße
    "  p = vec2(W * 0.5 + (p.x - W * 0.5) / sqrt(sq), H - (H - p.y) * sq);",
    "  float wv = u_fx.z;",
    "  float t = u_t * u_p.y * (1.0 + wv * 0.8) + u_p.x;",
    "  float ph = t + a_uv.x * 0.8;",
    "  float A = u_p.z;",
    "  float sway = (sin(ph * 0.95) * 0.65 + sin(ph * 1.73 + 1.3) * 0.22) * 0.017 * A;",
    "  float dx = (sway + u_fx.w) * H * hq;",
    "  float dy = -(0.5 + 0.5 * sin(t * 1.35 + 0.6)) * 0.007 * H * h * A + u_fx.x;",
    "  float a = smoothstep(u_q.x, min(1.0, u_q.x + 0.3), h);",
    "  float s = mix(0.5, smoothstep(0.32, 0.68, a_uv.x), u_p.w);",
    "  float tr = t + s * 2.2 * u_p.w;",
    "  float Aa = A * (1.0 + wv * 2.6);",
    "  dy -= (0.5 + 0.5 * sin(tr * 1.15 + 2.0)) * 0.016 * H * a * Aa;",
    "  float ang = sin(tr * 1.05 + 0.4) * 0.045 * a * Aa;",
    "  vec2 piv = vec2(mix(0.5, mix(0.27, 0.73, s), u_p.w) * W, u_q.y * H);",
    "  vec2 r = p - piv;",
    "  dx += r.x * (cos(ang) - 1.0) - r.y * sin(ang);",
    "  dy += r.x * sin(ang) + r.y * (cos(ang) - 1.0);",
    "  vec2 c = vec2(u_rect.x + p.x + dx, u_rect.y + p.y + dy);",
    "  gl_Position = vec4(c.x / u_cv.x * 2.0 - 1.0, 1.0 - c.y / u_cv.y * 2.0, 0.0, 1.0);",
    "}"].join("\n");
  var FIG_FS = "precision mediump float; uniform sampler2D u_tex; varying vec2 v_uv; void main(){ gl_FragColor = texture2D(u_tex, v_uv); }";

  function figRenderer() {
    if (location.protocol === "file:") return null;   // WebGL darf Bilder von file:// nicht lesen
    var cv = document.createElement("canvas");
    cv.className = "fig-layer"; cv.setAttribute("aria-hidden", "true");
    var opt = { alpha: true, premultipliedAlpha: true, antialias: true };
    var gl = cv.getContext("webgl2", opt) || cv.getContext("webgl", opt);
    if (!gl) return null;
    var gl2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
    function sh(type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, FIG_VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FIG_FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var NX = 26, NY = 44, uv = [], idx = [];
    for (var y = 0; y <= NY; y++) for (var x = 0; x <= NX; x++) uv.push(x / NX, y / NY);
    for (y = 0; y < NY; y++) for (x = 0; x < NX; x++) { var i0 = y * (NX + 1) + x, i2 = i0 + NX + 1; idx.push(i0, i2, i0 + 1, i0 + 1, i2, i2 + 1); }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "a_uv"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.clearColor(0, 0, 0, 0);
    var U = {}; ["u_rect", "u_cv", "u_t", "u_p", "u_q", "u_fx"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    document.body.appendChild(cv);
    var texCache = {};
    function texture(img) {
      if (texCache[img.src]) return texCache[img.src];
      var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (gl2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return (texCache[img.src] = tex);
    }
    var figs = [], t0 = performance.now(), lost = false, dprMax = mobile ? 1.5 : 2;
    function render() {
      if (lost) return;
      var vis = figs.filter(function (f) { return f.visible && f.tex; });
      var vw = window.innerWidth, vh = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, dprMax);
      var w = Math.round(vw * dpr), h = Math.round(vh * dpr);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      gl.viewport(0, 0, w, h);
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!vis.length) return;
      gl.uniform2f(U.u_cv, vw, vh);
      gl.uniform1f(U.u_t, (performance.now() - t0) / 1000);
      var leanT = Math.max(-0.035, Math.min(0.035, -scrollVel * 0.0011));
      vis.forEach(function (f) {
        var r = f.img.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100 || r.right < -100 || r.left > vw + 100 || !r.width) return;
        f.st.lean += (leanT - f.st.lean) * 0.06;
        if (f.clip) {
          var c = f.clip.getBoundingClientRect();
          var x0 = Math.max(0, c.left), y0 = Math.max(0, c.top), x1 = Math.min(vw, c.right), y1 = Math.min(vh, c.bottom);
          if (x1 <= x0 || y1 <= y0) return;
          gl.enable(gl.SCISSOR_TEST);
          gl.scissor(Math.floor(x0 * dpr), Math.floor((vh - y1) * dpr), Math.ceil((x1 - x0) * dpr), Math.ceil((y1 - y0) * dpr));
        } else gl.disable(gl.SCISSOR_TEST);
        gl.bindTexture(gl.TEXTURE_2D, f.tex);
        gl.uniform4f(U.u_rect, r.left, r.top, r.width, r.height);
        gl.uniform4f(U.u_p, f.cfg.ph, f.cfg.sp, f.cfg.amp, f.cfg.two);
        gl.uniform4f(U.u_q, f.cfg.arm, f.cfg.piv, f.st.flip, 0);
        gl.uniform4f(U.u_fx, f.st.jump, f.st.sq, f.st.wave, f.st.lean);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      });
    }
    cv.addEventListener("webglcontextlost", function (e) {
      e.preventDefault(); lost = true; cv.remove();
      figs.forEach(function (f) { f.wrap.classList.remove("fig-on"); cssFigure(f); });
    });
    return {
      add: function (f) {
        var go = function () {
          try { f.tex = texture(f.img); f.wrap.classList.add("fig-on"); } catch (e) { cssFigure(f); }
        };
        if (f.img.complete && f.img.naturalWidth) go(); else f.img.addEventListener("load", go, { once: true });
        figs.push(f);
      },
      render: render
    };
  }
  function cssFigure(f) {
    f.wrap.classList.add("fig-css");
    f.wrap.style.setProperty("--fdur", (5.4 / f.cfg.sp).toFixed(2) + "s");
    f.wrap.style.setProperty("--fdel", (-f.cfg.ph * 1.7).toFixed(2) + "s");
  }
  // Hüpfen mit Squash und Stretch, Winken; beim Antippen Sprechblase
  function poke(f, bubble) {
    if (bubble) say(f);
    if (f.busy || reduce) return;
    f.busy = true;
    if (!FR || !f.tex) {
      f.wrap.classList.remove("hop"); void f.wrap.offsetWidth; f.wrap.classList.add("hop");
      setTimeout(function () { f.busy = false; }, 800);
      return;
    }
    var s = f.st, H = f.img.offsetHeight || 300;
    gsap.timeline({ onComplete: function () { f.busy = false; } })
      .to(s, { sq: .86, duration: .12, ease: "power2.out" })
      .to(s, { sq: 1.07, jump: -H * .13, wave: 1, duration: .28, ease: "power2.out" })
      .to(s, { sq: .9, jump: 0, duration: .22, ease: "power2.in" })
      .to(s, { sq: 1, wave: 0, duration: .7, ease: "elastic.out(1,.4)" });
  }
  // Sprechblasen liegen über dem Figuren Canvas (fixed) und folgen der Figur, solange sie zu sehen sind
  function say(f) {
    var b = f.bubble;
    if (!b) {
      b = f.bubble = document.createElement("span");
      b.className = "bubble hand"; b.textContent = f.cfg.say; b.setAttribute("role", "status");
      document.body.appendChild(b);
    }
    var target = f.anchor || f.img || f.wrap;
    var place = function () {
      var r = target.getBoundingClientRect(), bw = b.offsetWidth, bh = b.offsetHeight, vw = window.innerWidth;
      var x = Math.max(12 + bw / 2, Math.min(vw - 12 - bw / 2, r.left + r.width * .5));
      var y = r.top + r.height * .06 - 14;
      if (y - bh < 70) y = Math.min(window.innerHeight - 20, r.top + r.height * .45 + bh);
      b.style.left = x + "px"; b.style.top = y + "px";
    };
    clearTimeout(f.bt);
    if (!f.follow) { f.follow = place; gsap.ticker.add(place); }
    place();
    b.classList.add("on");
    f.bt = setTimeout(function () {
      b.classList.remove("on");
      setTimeout(function () { if (f.follow) { gsap.ticker.remove(f.follow); f.follow = null; } }, 400);
    }, 2600);
  }
  function figures() {
    if (reduce) return;
    var lastY = window.scrollY;
    gsap.ticker.add(function () {
      var y = window.scrollY; scrollVel += ((y - lastY) - scrollVel) * 0.1; lastY = y;
      if (FR) FR.render();
    });
    try { FR = figRenderer(); } catch (e) { FR = null; }
    $$(".fig").forEach(function (wrap) {
      if (mobile && wrap.dataset.mobile === "0") { wrap.style.display = "none"; return; }
      var img = $("img", wrap), cfg = FIG[wrap.dataset.fig] || FIG.yuki;
      var f = { wrap: wrap, img: img, cfg: cfg, clip: wrap.closest(".fig-clip"), visible: false, st: { jump: 0, sq: 1, wave: 0, lean: 0, flip: wrap.dataset.flip === "1" ? 1 : 0 } };
      wrap._fig = f;
      if (FR) FR.add(f); else cssFigure(f);
      if (window.IntersectionObserver) new IntersectionObserver(function (es) { f.visible = es[0].isIntersecting; }, { rootMargin: "150px" }).observe(f.clip || wrap);
      else f.visible = true;
    });
  }
  // Köpfe in Bändern und auf den Karten: wippen (CSS), drehen sich beim Vorbeiscrollen kurz, hüpfen beim Antippen mit Sprechblase
  var KOPF_SAY = { yuki: "Finger weg, det is meine!", malik: "Na klar, mit allet.", moni: "Noch'n bisschen mehr Käse? Klar.", sam: "Kein Schischi, nur Geschmack.", reni: "Ick seh allet.", guenni: "Ick kenn die Straße noch ohne Schlange." };
  function koepfe() {
    if (reduce) return;
    $$(".heads").forEach(function (band) {
      ScrollTrigger.create({ trigger: band, start: "top 85%", onEnter: spin, onEnterBack: spin });
      function spin() { gsap.fromTo($$("img", band), { rotationY: 0 }, { rotationY: 360, duration: 1.1, stagger: .06, ease: "power2.inOut", overwrite: true }); }
    });
    $$(".sc-head").forEach(function (h) {
      var key = (h.getAttribute("src").match(/kopf_(\w+)\./) || [])[1], card = h.closest(".sc");
      var f = { wrap: card, anchor: h, cfg: { say: KOPF_SAY[key] || "Jut." } };
      var hop = function (bubble) {
        gsap.timeline().to(h, { y: -18, scaleY: 1.08, scaleX: .94, duration: .18, ease: "power2.out" })
          .to(h, { y: 0, scaleY: .92, scaleX: 1.06, duration: .16, ease: "power2.in" })
          .to(h, { scaleY: 1, scaleX: 1, duration: .5, ease: "elastic.out(1,.4)" });
        if (bubble) say(f);
      };
      card.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hop(false); });
      card.addEventListener("click", function () { hop(true); });
    });
  }

  /* Auftritte: Figuren gucken beim Reinscrollen von unten ins Bild, Spaziergänger im Footer */
  function szene() {
    $$(".peek").forEach(function (el) {
      var sec = el.closest("section, footer");
      gsap.fromTo(el, { yPercent: 80 }, { yPercent: 0, ease: "power2.out", scrollTrigger: { trigger: sec, start: "top 85%", end: "top 25%", scrub: .6 } });
    });
    $$(".walker").forEach(function (el, i) {
      if (el.style.display === "none") return;
      var f = el._fig, box = el.parentNode, dur = 16 + i * 5;
      var tw = gsap.fromTo(el, { x: function () { return -el.offsetWidth; } }, {
        x: function () { return box.clientWidth; }, duration: dur, ease: "none", repeat: -1, yoyo: true, delay: i * 2.5,
        onRepeat: function () { if (f) f.st.flip = f.st.flip ? 0 : 1; }
      });
      ScrollTrigger.create({ trigger: box, start: "top bottom", end: "bottom top", onToggle: function (st) { st.isActive ? tw.resume() : tw.pause(); } });
    });
  }
  function heroFigs(show) {
    var figs = $$(".vh-fig").filter(function (el) { return el.style.display !== "none"; });
    gsap.killTweensOf(figs);
    if (show) {
      gsap.fromTo(figs, { yPercent: 115, rotation: function (i) { return i ? 8 : -8; } }, { yPercent: 0, rotation: 0, duration: .7, stagger: .14, ease: "back.out(1.7)",
        onComplete: function () { figs.forEach(function (el, i) { if (el._fig) setTimeout(function () { poke(el._fig, i === 0 && !mobile); }, i * 220); }); } });
    } else gsap.to(figs, { yPercent: 115, duration: .35, ease: "power2.in" });
  }

  /* ---------- Navigation ---------- */
  var navST = {}, smoother = null;
  function goTo(id) {
    var y = 0;
    if (id !== "hero") {
      if (navST[id]) y = navST[id].start;
      else { var el = document.getElementById(id); if (!el) return; el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); return; }
    }
    if (smoother) smoother.scrollTo(y, true);
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) return;
    e.preventDefault();
    var wasOpen = !menu.hidden;
    if (wasOpen) setMenu(false);
    setTimeout(function () { goTo(id); }, wasOpen ? 60 : 0);
  });

  /* ---------- Ohne GSAP oder mit reduzierter Bewegung: statische Seite ---------- */
  function boot() {
    var ld = $("#loader");
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined" || typeof ScrollSmoother === "undefined") {
      html.classList.remove("js");
      if (ld) ld.style.display = "none";
      document.body.classList.remove("loading");
      builder(); barState(); figures(); reels();
      return;
    }
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (reduce) {
      html.classList.add("rm");
      if (ld) ld.style.display = "none";
      document.body.classList.remove("loading");
      builder(); barState(); reels();
      return;
    }
    runLoader().then(start);
  }

  /* ---------- Hero Video: komplett als Blob laden (sonst springt das Spulen), mit Fortschritt ---------- */
  var vid = $("#vHero"), useVideo = false;
  function waitMeta(v, ms) {
    return new Promise(function (res) {
      if (v.readyState >= 1) return res(true);
      var done = function (ok) { v.removeEventListener("loadedmetadata", okF); v.removeEventListener("error", noF); res(ok); };
      var okF = function () { done(true); }, noF = function () { done(false); };
      v.addEventListener("loadedmetadata", okF); v.addEventListener("error", noF);
      setTimeout(function () { done(v.readyState >= 1); }, ms || 6000);
    });
  }
  function loadVideo(onProg) {
    if (!vid) { onProg(1); return Promise.resolve(); }   // kein Video auf der Seite: Poster Überblendung
    var url = vid.getAttribute("data-src") + (mobile ? "_m.mp4" : ".mp4");
    var direct = function () { vid.preload = "auto"; vid.src = url; return waitMeta(vid, 6000); };
    if (location.protocol === "file:" || !window.fetch) return direct().then(function (ok) { onProg(1); useVideo = ok; });
    return fetch(url).then(function (r) {
      if (!r.ok || !r.body) throw new Error("http");
      var total = +r.headers.get("content-length") || 5e6, got = 0, reader = r.body.getReader(), chunks = [];
      function pump() {
        return reader.read().then(function (res) {
          if (res.done) return new Blob(chunks, { type: "video/mp4" });
          chunks.push(res.value); got += res.value.length; onProg(Math.min(1, got / total));
          return pump();
        });
      }
      return pump();
    }).then(function (blob) {
      vid.src = URL.createObjectURL(blob);
      return waitMeta(vid, 6000);
    }).then(function (ok) { onProg(1); useVideo = ok; })
      .catch(function () { onProg(1); useVideo = false; });
  }

  /* ---------- Hero Bildfolge auf Canvas (scharf wie Apple Produktseiten) ----------
     Scrollfortschritt = Bildindex. Laden progressiv: erst jedes 8., dann jedes 4., dann alle.
     Bis ein Bild da ist, zeigt der Canvas das nächste schon geladene Bild. Gezeichnet in Gerätepixeln (max. 2) mit cover. */
  var HF = window.HERO_FRAMES || null, seq = null;
  // opt: { data (frames.json Inhalt), dir, canvas, cap (wie weit seitlich abgeschnitten werden darf), cssVar (Farbe der Sektion) }
  function frameSeq(onFirstPass, opt) {
    opt = opt || { data: HF, dir: "assets/hero_frames/", canvas: $("#vhCanvas"), cap: 1.15, cssVar: "--herobg", rgb: "104,135,221" };
    var D = opt.data;
    var portrait = window.innerWidth < window.innerHeight;
    var set = (portrait && D.m) ? "m" : (D.d ? "d" : "m"), info = D[set], n = info.count;
    var ext = info.ext || D.ext || "webp";
    var imgs = new Array(n), ok = new Array(n), cv = opt.canvas, ctx = cv.getContext("2d"), drawn = -1, want = 0;
    function src(i) { return opt.dir + set + "/f_" + ("000" + (i + 1)).slice(-4) + "." + ext; }
    function load(i) {
      return new Promise(function (res) {
        if (imgs[i]) return res();
        var im = new Image(); imgs[i] = im; im.decoding = "async";
        im.onload = function () { ok[i] = true; if (Math.abs(i - want) < Math.abs(drawn - want) || drawn < 0) draw(true); res(); };
        im.onerror = function () { res(); };
        im.src = src(i);
      });
    }
    var bg = null, bgRGB = opt.rgb || "104,135,221";
    // Hintergrundfarbe der Bilder an den Ecken messen, Sektion exakt angleichen (per file:// nicht lesbar, dann CSS Wert)
    function edgeColor(im) {
      var c = getComputedStyle(document.documentElement).getPropertyValue(opt.cssVar).trim() || "#6887DD";
      try {
        var t = document.createElement("canvas"); t.width = 64; t.height = 64;
        var x = t.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, 64, 64);
        var R = [], G = [], B = [], med = function (a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; };
        for (var i = 1; i < 63; i += 6) [[i, 1], [i, 62], [1, i], [62, i]].forEach(function (p) { var d = x.getImageData(p[0], p[1], 1, 1).data; R.push(d[0]); G.push(d[1]); B.push(d[2]); });
        var r = med(R), g = med(G), b = med(B);   // Median: einzelne Toppings am Rand stören nicht
        bgRGB = r + "," + g + "," + b;
        c = "rgb(" + bgRGB + ")";
        document.documentElement.style.setProperty(opt.cssVar, c);
      } catch (e) {}
      return c;
    }
    function nearest(i) {
      for (var d = 0; d < n; d++) { if (i - d >= 0 && ok[i - d]) return i - d; if (i + d < n && ok[i + d]) return i + d; }
      return -1;
    }
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; drawn = -1; draw(true); }
    }
    function draw(force) {
      var k = nearest(want);
      if (k < 0 || (k === drawn && !force)) return;
      var im = imgs[k], cw = cv.width, ch = cv.height, iw = im.naturalWidth, ih = im.naturalHeight;
      if (!cw || !ch) return;
      if (!bg) bg = edgeColor(im);
      // cover, aber höchstens 15 % seitlich abschneiden, damit die Pizza auf dem Handy ganz bleibt. Rest oben und unten in der Bildfarbe.
      var s = Math.max(cw / iw, Math.min(ch / ih, cw / iw * opt.cap)) * (opt.zoom || 1), w = iw * s, h = ih * s, x = (cw - w) / 2 + cw * (opt.dx || 0), y = (ch - h) / 2;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      if (y > 0 || x > 0) { ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch); }
      ctx.drawImage(im, x, y, w, h);
      if (x > 0) {   // seitliche Kanten weich auslaufen lassen
        var fx = Math.min(x, 60 * (window.devicePixelRatio || 1)), gx = ctx.createLinearGradient(x, 0, x + fx, 0);
        gx.addColorStop(0, bg); gx.addColorStop(1, "rgba(" + bgRGB + ",0)"); ctx.fillStyle = gx; ctx.fillRect(x, 0, fx, ch);
        gx = ctx.createLinearGradient(x + w, 0, x + w - fx, 0);
        gx.addColorStop(0, bg); gx.addColorStop(1, "rgba(" + bgRGB + ",0)"); ctx.fillStyle = gx; ctx.fillRect(x + w - fx, 0, fx, ch);
      }
      if (y > 0) {   // weicher Übergang an den Bildkanten, keine sichtbare Linie
        var f = Math.min(y, 40 * (window.devicePixelRatio || 1)), g = ctx.createLinearGradient(0, y, 0, y + f);
        g.addColorStop(0, bg); g.addColorStop(1, "rgba(0,0,0,0)".replace("0,0,0", bgRGB));
        ctx.fillStyle = g; ctx.fillRect(0, y, cw, f);
        g = ctx.createLinearGradient(0, y + h, 0, y + h - f);
        g.addColorStop(0, bg); g.addColorStop(1, "rgba(0,0,0,0)".replace("0,0,0", bgRGB));
        ctx.fillStyle = g; ctx.fillRect(0, y + h - f, cw, f);
      }
      drawn = k;
      cv.dataset.frame = k + 1;   // 1 basiert wie die Dateinamen (f_0001 ...), für den Test
      cv.classList.add("ready");
    }
    function pass(step, total) {
      var list = [];
      for (var i = 0; i < n; i += step) list.push(i);
      if (list[list.length - 1] !== n - 1) list.push(n - 1);
      var done = 0;
      return Promise.all(list.map(function (i) { return load(i).then(function () { done++; if (total) total(done / list.length); }); }));
    }
    window.addEventListener("resize", size);
    size();
    var first = load(0).then(function () { size(); draw(true); });
    var p1 = first.then(function () { return pass(8, onFirstPass); });
    p1.then(function () { return pass(4); }).then(function () { return pass(1); });
    return {
      ready: p1,
      set: function (p) { want = Math.max(0, Math.min(n - 1, Math.round(p * (n - 1)))); draw(false); },
      size: size
    };
  }

  /* ---------- Ladebildschirm ---------- */
  function runLoader() {
    var bar = $("#ldBar"), num = $("#ldNum"), line = $("#ldLine");
    var urls = $$("#hero img, #bauen .bn-layer, #signature img").map(function (i) { return i.currentSrc || i.src; });
    urls = urls.filter(function (u, i) { return u && urls.indexOf(u) === i; });
    var done = 0, vp = 0, shown = 0, li = 0, lines = ["Teig wird geknetet", "Soße wird gerührt", "Käse wird gerieben", "Ofen wird heiß"];
    var target = function () { return (done / Math.max(1, urls.length)) * .3 + vp * .7; };
    var lt = setInterval(function () { li = (li + 1) % lines.length; line.textContent = lines[li]; }, 650);
    var tick = function () {
      shown += (target() - shown) * .15;
      var p = Math.round(shown * 100);
      bar.style.width = p + "%"; num.textContent = p;
    };
    gsap.ticker.add(tick);
    var all = Promise.all(urls.map(function (u) {
      return new Promise(function (res) {
        var im = new Image();
        var fin = function () { done++; res(); };
        im.onload = fin; im.onerror = fin; im.src = u;
      });
    }));
    var video;
    if (HF && (HF.d || HF.m)) { seq = frameSeq(function (p) { vp = p; }); video = seq.ready; }
    else video = loadVideo(function (p) { vp = p; });
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var min = new Promise(function (r) { setTimeout(r, 1200); });
    var cap = new Promise(function (r) { setTimeout(r, 20000); });
    return Promise.race([Promise.all([all, video, fontsReady, min]), cap]).then(function () {
      done = urls.length; vp = 1;
      return new Promise(function (r) { setTimeout(r, 300); });
    }).then(function () {
      clearInterval(lt); gsap.ticker.remove(tick);
      bar.style.width = "100%"; num.textContent = "100";
    });
  }

  /* Kopfleiste: auf dem Hero transparent, danach Schwarz */
  var heroST = null;
  function barState() {
    var bar = $("#bar"), hero = $("#hero");
    var f = function () {
      var lim = heroST ? heroST.end + window.innerHeight - 70 : hero.offsetTop + hero.offsetHeight - 70;
      bar.classList.toggle("solid", window.scrollY > lim);
    };
    window.addEventListener("scroll", f, { passive: true });
    window.addEventListener("resize", f);
    f();
  }

  /* ---------- Start ---------- */
  function start() {
    html.classList.add("smooth");
    document.body.classList.remove("loading");
    $("#loader").classList.add("done");
    builder();
    figures();

    smoother = ScrollSmoother.create({ wrapper: "#smooth-wrapper", content: "#smooth-content", smooth: 1.1, smoothTouch: 0.1, effects: true });

    heroVideo();
    reveal();
    bands();
    doener();
    signature();
    extras();
    szene();
    reels();
    navTriggers();
    barState();

    // Nach Bildern und Schriften neu messen, damit Pins und Positionen stimmen
    var rt;
    var refresh = function () { clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 160); };
    $$("img").forEach(function (im) { if (!im.complete) im.addEventListener("load", refresh, { once: true }); });
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    ScrollTrigger.refresh();
    setTimeout(function () { ScrollTrigger.refresh(); }, 700);
  }

  /* 1 Hero: gepinnt, Scrollen spult das Video von zerlegt bis fertig */
  function heroVideo() {
    var target = 0, cur = 0, steps = $$(".vh-step"), bar = $("#vhBar"), cue = $("#vhCue"), lastS = -2;
    // Bildfolge: 0 bis 0,82 der Pinstrecke spielt alle Bilder ab, danach hält das letzte (perfekte) Bild. Video Platzhalter: 0,92.
    var HOLD = seq ? .82 : .92;
    // Schritt Labels als Anteil der Videolänge (Länge kommt aus video.duration, die Labels bleiben prozentual):
    // 01 Teig, 02 Soße, 03 Käse, 04 Toppings, 05 180 Sekunden, Ende "DEINE REGELN."
    var TV = [.02, .12, .25, .45, .75, .95];
    var T = TV.map(function (v) { return v * HOLD; });
    var fcur = 0, ftarget = 0, figsIn = false, lastHop = 0, cheer = false;
    if (seq) {
      gsap.ticker.add(function () {
        if (fcur === ftarget) return;
        fcur += (ftarget - fcur) * .35;
        if (Math.abs(ftarget - fcur) < 0.002) fcur = ftarget;   // am Ende exakt auf dem letzten Bild landen
        seq.set(fcur);
      });
    } else if (useVideo) {
      vid.classList.add("ready");
      try { vid.currentTime = 0.001; } catch (e) {}
      gsap.ticker.add(function () {
        if (!vid.duration) return;
        cur += (target - cur) * .35;
        if (Math.abs(vid.currentTime - cur) > 0.012) { try { vid.currentTime = cur; } catch (e) {} }
      });
    }
    gsap.set(".vh-h1 .ln>span", { yPercent: 115 });
    gsap.to(".vh-h1 .ln>span", { yPercent: 0, duration: 1, stagger: .14, ease: "power4.out", delay: .2 });
    gsap.from([".vh-kicker", ".vh-entwurf", "#vhStoerer"], { opacity: 0, y: 24, duration: .8, stagger: .12, delay: .35, ease: "power3.out" });
    var tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#hero", start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * 6); },
        pin: "#vhPin", scrub: .4, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: function (st) {
          var p = st.progress, vp = Math.min(1, p / HOLD);
          if (seq) ftarget = vp;
          else if (useVideo && vid.duration) target = Math.max(0, Math.min(vid.duration - 0.04, vp * vid.duration));
          else { gsap.set("#vhEnde", { opacity: gsap.utils.clamp(0, 1, (vp - .45) / .4) }); }
          bar.style.width = (p * 100) + "%";
          cue.style.opacity = p > .03 ? 0 : 1;
          var idx = -1;
          for (var i = 0; i < 5; i++) if (p >= T[i] && p < T[5]) idx = i;
          if (idx !== lastS) { lastS = idx; steps.forEach(function (s, i) { s.classList.toggle("on", i === idx); }); }
          var showF = p >= T[5];
          // Yuki oben rechts: hüpft beim Backen, jubelt am Ende
          var yf = $("#vhTop") && $("#vhTop")._fig;
          if (yf) {
            var now = performance.now();
            if (p >= T[4] && p < T[5] && now - lastHop > 1150) { lastHop = now; poke(yf, false); }
            if (showF !== cheer) { cheer = showF; gsap.to(yf.st, { wave: showF ? .55 : 0, duration: .5 }); if (showF) setTimeout(function () { poke(yf, false); }, 500); }
          }
        }
      }
    });
    heroST = tl.scrollTrigger;
    // Yuki läuft am rechten Rand mit: runter zur Pizza, schaut zu, beim Backen etwas zurück, am Ende vorn
    var vw = function () { return window.innerWidth; }, vhh = function () { return window.innerHeight; };
    // Figur unten rechts: geht beim Aufbau ein Stück zur Pizza, beim Backen zurück, am Ende jubelt sie vorn (Füße bleiben auf der Unterkante)
    tl.fromTo("#vhTop", { x: 0 }, { x: function () { return -window.innerWidth * (mobile ? .02 : .05); }, duration: .3, ease: "sine.inOut" }, .02)
      .to("#vhTop", { x: function () { return -window.innerWidth * (mobile ? .005 : .015); }, duration: .3, ease: "sine.inOut" }, .4)
      .to("#vhTop", { x: function () { return -window.innerWidth * (mobile ? .02 : .04); }, duration: .12, ease: "sine.inOut" }, .74);
    tl.to(".vh-copy", { autoAlpha: 0, y: -50, duration: .07 }, .015)
      .to("#vhStoerer", { rotation: 190, scale: .85, duration: .8 }, 0)
      .fromTo("#vhEnd", { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: .07, ease: "power2.out" }, T[5])
      .to("#vhStoerer", { autoAlpha: 0, duration: .05 }, T[5])
      .to({}, { duration: .05 }, .95);
  }

  /* 2 Wort für Wort einblenden */
  function reveal() {
    $$(".reveal").forEach(function (el) {
      el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + "</span>"; }).join(" ");
      gsap.to($$(".w", el), { opacity: 1, stagger: .22, ease: "none", scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 48%", scrub: true } });
    });
    gsap.from(".st-sub", { opacity: 0, y: 40, duration: .9, ease: "power3.out", scrollTrigger: { trigger: ".st-sub", start: "top 92%", once: true } });
  }

  /* Laufschriften laufen mit dem Scrollen */
  function bands() {
    $$(".mq").forEach(function (m, i) {
      var dir = i % 2 ? 1 : -1;
      gsap.fromTo(m, { xPercent: dir < 0 ? 0 : -28 }, { xPercent: dir < 0 ? -28 : 0, ease: "none", scrollTrigger: { trigger: m.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
    [".zt-track", ".heads-track"].forEach(function (sel, i) {
      var t = $(sel); if (!t) return;
      gsap.fromTo(t, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, ease: "none", scrollTrigger: { trigger: t.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  /* 2c Döner Pizza: gepinnt, dreht sich einmal 360 Grad, Hinweise erscheinen nacheinander. Bilder erst laden, wenn der Abschnitt näher kommt. */
  function doener() {
    var DF = window.DOENER_FRAMES, sec = $("#doener");
    if (!sec) return;
    var calls = $$(".dn-c"), bar = $("#dnBar"), poster = $("#dnPoster");
    var dseq = null, cur = 0, target = 0, lastC = -1;
    var HOLD = .9, TC = [.06, .2, .34, .48, .62, .76];
    function start() {
      if (dseq || !DF) return;
      dseq = frameSeq(null, { data: DF, dir: "assets/doener_frames/", canvas: $("#dnCanvas"), cap: mobile ? 1.32 : 1.12, zoom: mobile ? 1 : .72, dx: mobile ? 0 : .07, cssVar: "--doenerbg", rgb: "246,241,173" });
      gsap.ticker.add(function () {
        if (cur === target) return;
        cur += (target - cur) * .3;
        if (Math.abs(target - cur) < 0.002) cur = target;
        dseq.set(cur);
      });
    }
    ScrollTrigger.create({ trigger: sec, start: "top 250%", once: true, onEnter: start });
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: function () { return "+=" + Math.round(window.innerHeight * 3.4); },
      pin: "#dnPin", scrub: .5, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: function (st) {
        var p = st.progress;
        target = Math.min(1, p / HOLD);
        bar.style.width = (p * 100) + "%";
        var c = -1;
        for (var i = 0; i < TC.length; i++) if (p >= TC[i]) c = i;
        if (c !== lastC) { lastC = c; calls.forEach(function (el, i) { el.classList.toggle("on", i <= c); }); }
      },
      onEnter: start
    });
  }

  /* 3 Signature Pizzen horizontal, Pizza und Kopf drehen beim Scrollen */
  function signature() {
    var track = $("#sigTrack"), pin = $("#sigPin"), sec = $("#signature"), bar = $("#sigBar"), now = $("#sigNow");
    var cards = $$(".sc", track), n = cards.length - 1, lastI = -1;   // letzte Karte ist die Abschlusskarte
    var pizzas = $$(".sc-pizza", track), heads = $$(".sc-head, .sc-badge", track);
    gsap.set(pizzas, { xPercent: -50 });
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tween = gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: {
        trigger: "#signature", start: "top top", end: function () { return "+=" + dist(); },
        pin: "#sigPin", scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (st) {
          bar.style.width = (st.progress * 100) + "%";
          var idx = Math.min(n - 1, Math.round(st.progress * (n - 1) * 1.04));
          if (idx !== lastI) {
            lastI = idx;
            now.textContent = ("0" + (idx + 1)).slice(-2);
            gsap.to([pin, sec], { backgroundColor: cards[idx].dataset.bg, duration: .55, overwrite: true });
          }
        }
      }
    });
    pizzas.forEach(function (img, i) {
      gsap.fromTo(img, { rotation: i % 2 ? -50 : 50 }, { rotation: i % 2 ? 50 : -50, ease: "none",
        scrollTrigger: { trigger: img.closest(".sc"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
    });
    heads.forEach(function (h, i) {
      gsap.fromTo(h, { rotation: i % 2 ? 22 : -22 }, { rotation: i % 2 ? -22 : 22, ease: "none",
        scrollTrigger: { trigger: h.closest(".sc"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
    });
  }

  /* 4 bis 9: Einblenden beim Scrollen. Elemente mit data-speed werden nicht auf y animiert (ScrollSmoother Parallax) */
  function extras() {
    if (document.querySelector(".bn-stage")) gsap.from(".bn-stage", { scale: .7, rotation: -12, opacity: 0, duration: 1, ease: "back.out(1.4)", scrollTrigger: { trigger: ".bn-stage", start: "top 85%", once: true } });
    gsap.from(".kp", { opacity: 0, scale: .8, duration: .9, stagger: .15, ease: "back.out(1.5)", scrollTrigger: { trigger: ".kiosk-phones", start: "top 85%", once: true } });
    gsap.from(".m-voll", { opacity: 0, xPercent: function (i) { return i ? 30 : -30; }, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".marke-in", start: "top 80%", once: true } });
    gsap.from(".m-manifest", { opacity: 0, scale: .8, rotation: 6, duration: .8, ease: "back.out(1.6)", scrollTrigger: { trigger: ".m-manifest", start: "top 92%", once: true } });
    gsap.from([".bs-logo", ".bs-claim"], { scale: .7, rotation: -6, opacity: 0, duration: .9, stagger: .12, ease: "back.out(1.8)", scrollTrigger: { trigger: ".besuch", start: "top 85%", once: true } });
  }


  /* Reels: im Sichtbereich stumm abspielen (max. 2 gleichzeitig geladen), Antippen schaltet Ton, nur eins mit Ton */
  function reels() {
    var cards = $$(".rl"), vids = cards.map(function (c) { return $("video", c); }), active = [];
    function load(v) { if (!v.src) { v.preload = "auto"; v.src = v.dataset.src; } }
    function unload(v) { if (v.src && active.indexOf(v) < 0) { v.pause(); v.removeAttribute("src"); v.load(); } }
    function setTon(card, on) {
      cards.forEach(function (c) { var o = c === card && on; c.classList.toggle("ton", o); $("video", c).muted = !o; $(".rl-ton span", c).textContent = o ? "Ton aus" : "Ton an"; $(".rl-ton", c).setAttribute("aria-label", o ? "Ton aus" : "Ton an"); });
    }
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = $("video", e.target);
          if (e.isIntersecting && e.intersectionRatio > .55) {
            active = active.filter(function (x) { return x !== v; }); active.push(v);
            while (active.length > 2) { var old = active.shift(); old.pause(); unload(old); }
            load(v); if (!reduce) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
          } else if (!e.isIntersecting || e.intersectionRatio < .2) {
            v.pause();
            if (e.target.classList.contains("ton")) setTon(null, false);
          }
        });
      }, { threshold: [0, .2, .6] });
      cards.forEach(function (c) { io.observe(c); });
    }
    cards.forEach(function (c) {
      var v = $("video", c);
      var tap = function () { load(v); var on = !c.classList.contains("ton"); setTon(c, on); var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); };
      $(".rl-ton", c).addEventListener("click", function (e) { e.stopPropagation(); tap(); });
      $(".rl-phone", c).addEventListener("click", tap);
    });
  }

  /* Zielpositionen fürs Menü (zuletzt anlegen, damit die Pins davor eingerechnet sind) */
  function navTriggers() {
    ["bauen", "doener", "signature", "kiosk", "marke", "reels", "besuch"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      navST[id] = ScrollTrigger.create({ trigger: el, start: "top top", id: "nav-" + id });
    });
  }

  boot();
})();
