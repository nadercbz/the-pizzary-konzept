/* The Pizzary: 3D Pizza Builder "Bau deine eigene".
   Mountet sich in #builder3d, lädt three.js (assets/vendor/three/three.bundle.js, r180, lokal) erst, wenn der Abschnitt näher kommt.
   Daten aus 04_Produkt_Rezepte/Produktdaten.json (Stand 19.10.2026), Einzelteile aus assets/builder/, eigene Texturen aus assets/builder3d/.
   Doku: _build/BUILDER3D.md */
(function () {
  "use strict";
  if (window.BUILDER3D) return;
  window.BUILDER3D = true;

  var SCRIPT = document.currentScript;
  var BASE = (SCRIPT && SCRIPT.src) ? SCRIPT.src.replace(/[^\/]*$/, "") : "";
  function U(p) { return BASE + p; }

  /* ---------------- Daten ---------------- */
  var STUFEN = [
    { n: 1, preis: 10.9, s: 1, k: 1, g: 1 },
    { n: 3, preis: 12.9, s: 2, k: 1, g: 1 },
    { n: 5, preis: 14.9, s: 2, k: 1, g: 1 },
    { n: 7, preis: 16.9, s: 2, k: 2, g: 2 }
  ];
  // tint: Farbe der Soße, mix: wie stark das Tomatenfoto umgefärbt wird, art: full | oil
  var SOSSEN = [
    { id: "tomatensauce", name: "Tomatensoße", col: "#c8321e", mix: 0, art: "full" },
    { id: "tomatensauce-scharf", name: "Scharfe Tomatensoße", col: "#8a160c", mix: 0.55, art: "full" },
    { id: "bechamel", name: "Béchamel", col: "#f3e8cc", mix: 1, art: "full" },
    { id: "pesto", name: "Pesto", col: "#55862a", mix: 1, art: "full" },
    { id: "bbq", name: "BBQ Soße", col: "#4e1e0e", mix: 1, art: "full" },
    { id: "hollandaise", name: "Hollandaise (vegan)", col: "#f2c955", mix: 1, art: "full" },
    { id: "joghurtsauce", name: "Joghurtsoße", col: "#f5f2e8", mix: 1, art: "full" },
    { id: "ranch", name: "Ranch", col: "#eee4cd", mix: 1, art: "full" },
    { id: "balsamico", name: "Balsamico", col: "#2c140f", mix: 1, art: "full" },
    { id: "olivenoel", name: "Olivenöl", col: "#c9a52a", mix: 1, art: "oil" },
    { id: "knoblauchoel", name: "Knoblauchöl", col: "#e0c46e", mix: 1, art: "oil" }
  ];
  var KAESE = [
    { id: "mozzarella", name: "Mozzarella", layer: true },
    { id: "mozzarella-perlen", name: "Mozzarella Perlen", slug: "mozzarella-perlen" },
    { id: "parmesan", name: "Parmesan", slug: "parmesan" },
    { id: "gorgonzola", name: "Gorgonzola", slug: "gorgonzola" },
    { id: "feta", name: "Feta", slug: "feta" },
    { id: "ziegenkaese", name: "Ziegenkäse", slug: "ziegenkaese" },
    { id: "ricotta", name: "Ricotta", slug: "ricotta" },
    { id: "veganer-kaese", name: "Veganer Käse", slug: "veganer-kaese", vegan: true }
  ];
  // cats: Filter (Fleisch, Vegan, Gemüse, Scharf, Obst)
  var TOPS = [
    ["salami", "Salami", "salami", "Fleisch"],
    ["pepperoni", "Pepperoni", "pepperoni", "Fleisch Scharf"],
    ["schinken", "Schinken", "schinken", "Fleisch"],
    ["bacon", "Bacon", "bacon", "Fleisch"],
    ["hackfleisch", "Hackfleisch", "hackfleisch", "Fleisch"],
    ["haehnchen", "Hähnchen", "haehnchen", "Fleisch"],
    ["sucuk", "Sucuk", "sucuk", "Fleisch"],
    ["thunfisch", "Thunfisch", "thunfisch", "Fleisch"],
    ["veganes-hack", "Veganes Hack", "veganes-hack", "Vegan"],
    ["veganer-schinken", "Veganer Schinken", "veganer-schinken", "Vegan"],
    ["vegane-salami", "Vegane Salami", "vegane-salami", "Vegan"],
    ["champignons", "Champignons", "champignons", "Gemüse Vegan"],
    ["rote-zwiebeln", "Rote Zwiebeln", "zwiebel-rot", "Gemüse Vegan"],
    ["weisse-zwiebeln", "Weiße Zwiebeln", "zwiebel-weiss", "Gemüse Vegan"],
    ["kirschtomaten", "Kirschtomaten", "kirschtomaten", "Gemüse Vegan"],
    ["paprika-rot", "Paprika rot", "paprika-rot", "Gemüse Vegan"],
    ["paprika-gelb", "Paprika gelb", "paprika-gelb", "Gemüse Vegan"],
    ["paprika-gruen", "Paprika grün", "paprika-gruen", "Gemüse Vegan"],
    ["oliven-schwarz", "Oliven schwarz", "oliven-schwarz", "Gemüse Vegan"],
    ["oliven-gruen", "Oliven grün", "oliven-gruen", "Gemüse Vegan"],
    ["artischocken", "Artischocken", "artischocken", "Gemüse Vegan"],
    ["spinat", "Spinat", "spinat", "Gemüse Vegan"],
    ["rucola", "Rucola", "rucola", "Gemüse Vegan"],
    ["brokkoli", "Brokkoli", "brokkoli", "Gemüse Vegan"],
    ["zucchini", "Zucchini", "zucchini", "Gemüse Vegan"],
    ["mais", "Mais", "mais", "Gemüse Vegan"],
    ["knoblauch", "Knoblauch", "knoblauch", "Gemüse Vegan"],
    ["ananas", "Ananas", "ananas", "Obst Vegan"],
    ["jalapenos", "Jalapeños", "jalapenos", "Scharf Vegan"],
    ["chili-gruen", "Chili grün", "chili-gruen", "Scharf Vegan"],
    ["chili-rot", "Chili rot", "chili-rot", "Scharf Vegan"],
    ["peperoni-eingelegt", "Peperoni (eingelegt, grün)", "peperoni-eingelegt", "Scharf"]
  ].map(function (t) { return { id: t[0], name: t[1], slug: t[2], cats: t[3].split(" ") }; });
  var GEW = [
    { id: "oregano", name: "Oregano", col: "#5a7a2c" },
    { id: "chilipulver", name: "Chilipulver", col: "#b8321c" },
    { id: "meersalz", name: "Meersalz", col: "#f4f4f0" }
  ];
  // Anzahl Fotos je Slug (assets/builder/manifest.json), Rucola aus assets/builder3d/teile (gesäubert)
  var MANI = { "bacon": 6, "hackfleisch": 8, "pepperoni": 6, "sucuk": 6, "thunfisch": 6, "vegane-salami": 6, "veganer-schinken": 6, "veganes-hack": 8, "ananas": 6, "artischocken": 6, "brokkoli": 6, "chili-gruen": 8, "chili-rot": 8, "feta": 6, "gorgonzola": 6, "haehnchen": 6, "knoblauch": 8, "mozzarella-perlen": 6, "oliven-gruen": 8, "oliven-schwarz": 8, "paprika-gelb": 6, "paprika-gruen": 6, "parmesan": 6, "ricotta": 6, "veganer-kaese": 6, "ziegenkaese": 6, "zucchini": 6, "zwiebel-weiss": 6, "champignons": 6, "jalapenos": 8, "mais": 18, "paprika-rot": 8, "peperoni-eingelegt": 5, "rucola": 8, "salami": 6, "schinken": 5, "spinat": 6, "kirschtomaten": 6, "zwiebel-rot": 7 };
  // echte Größe in cm (Pizza 30 cm), daraus Größe auf der Pizza
  var CM = { "bacon": 7, "hackfleisch": 2.8, "pepperoni": 4, "salami": 5, "sucuk": 4.2, "thunfisch": 3.6, "vegane-salami": 5, "veganer-schinken": 5, "veganes-hack": 2.8, "ananas": 2.8, "artischocken": 3.8, "brokkoli": 3.8, "chili-gruen": 2, "chili-rot": 2, "feta": 2.6, "gorgonzola": 2.8, "haehnchen": 3.8, "knoblauch": 2, "mozzarella-perlen": 2.4, "oliven-gruen": 2, "oliven-schwarz": 2, "paprika-gelb": 4.6, "paprika-gruen": 4.6, "parmesan": 3.2, "ricotta": 3.4, "veganer-kaese": 3.6, "ziegenkaese": 4, "zucchini": 3.6, "zwiebel-weiss": 4.2, "champignons": 3.8, "jalapenos": 2.6, "mais": 1.05, "paprika-rot": 4, "peperoni-eingelegt": 4.6, "rucola": 5.5, "schinken": 5.5, "spinat": 4.8, "kirschtomaten": 3, "zwiebel-rot": 4.2 };
  function teileAnzahl(slug) {
    if (slug === "mais") return 16;
    if (slug === "rucola") return 8;
    var c = CM[slug] || 3;
    return c >= 5 ? 6 : c <= 2.2 ? 10 : 8;
  }
  function teilUrl(slug, i) {
    var n = MANI[slug] || 1, k = (i % n) + 1;
    return slug === "rucola" ? U("assets/builder3d/teile/rucola_" + k + ".webp") : U("assets/builder/" + slug + "_" + k + ".webp");
  }
  function iconUrl(slug) { return U("assets/builder_icons/" + slug + ".webp"); }

  var FILTER = ["Alle", "Fleisch", "Vegan", "Gemüse", "Scharf", "Obst", "Käse"];
  var STEPS = [
    { key: "stufe", t: "Stufe" }, { key: "sosse", t: "Soße" }, { key: "kaese", t: "Käse" },
    { key: "top", t: "Toppings" }, { key: "gew", t: "Gewürz" }
  ];
  var BYID = {};
  SOSSEN.forEach(function (x) { x.typ = "sosse"; BYID[x.id] = x; });
  KAESE.forEach(function (x) { x.typ = "kaese"; BYID[x.id] = x; });
  TOPS.forEach(function (x) { x.typ = "top"; BYID[x.id] = x; });
  GEW.forEach(function (x) { x.typ = "gew"; BYID[x.id] = x; });

  var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var euro = function (v) { return v.toFixed(2).replace(".", ",") + " €"; };

  /* ---------------- Zustand ---------------- */
  var S = { stufe: 1, sosse: [], kaese: [], top: [], gew: [], step: 0, filter: "Alle", gebacken: false, busy: false };
  function stufe() { return STUFEN[S.stufe]; }
  function limit(typ) { var st = stufe(); return typ === "sosse" ? st.s : typ === "kaese" ? st.k : typ === "top" ? st.n : st.g; }

  /* ---------------- DOM ---------------- */
  var root, el = {};
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function buildUI() {
    root.classList.add("b3");
    root.innerHTML =
      '<div class="b3-head"><p class="b3-kick">Deine Pizza. Deine Regeln.</p><h2 class="b3-title">Bau deine eigene.</h2>' +
      '<p class="b3-lead">Stufe wählen, dann Soße, Käse, Toppings und Gewürz antippen. Alles fliegt live auf deine Pizza.</p></div>' +
      '<div class="b3-grid">' +
      '<div class="b3-stage" aria-label="3D Ansicht deiner Pizza">' +
      '<div class="b3-canvas"></div><div class="b3-glow"></div>' +
      '<div class="b3-star"><span class="b3-star-in"><small>Deine Pizza</small><b class="b3-price">10,90 €</b></span></div>' +
      '<p class="b3-drag">Ziehen zum Drehen</p>' +
      '<p class="b3-toast" role="status" aria-live="polite"></p>' +
      '<div class="b3-load"><i></i><span>Ofen heizt vor</span></div>' +
      '<div class="b3-result" hidden><div class="b3-result-in"><p class="b3-kick">Frisch aus dem Ofen</p><h3>Deine Pizza</h3>' +
      '<p class="b3-result-list"></p><p class="b3-result-price"></p>' +
      '<p class="b3-result-note">Bei uns im Steinofen dauert det 180 Sekunden. An der Theke sagst du einfach, wat drauf soll.</p>' +
      '<div class="b3-result-btns"><button type="button" class="b3-btn b3-btn-ghost b3-again">Nochmal bauen</button>' +
      '<a class="b3-btn b3-order" href="#bestellen">So bestellst du bei uns</a></div></div></div>' +
      '</div>' +
      '<div class="b3-panel">' +
      '<nav class="b3-steps" aria-label="Schritte"></nav>' +
      '<div class="b3-body"></div>' +
      '<div class="b3-nav"><button type="button" class="b3-btn b3-btn-ghost b3-prev">Zurück</button>' +
      '<p class="b3-sum" aria-live="polite"></p>' +
      '<button type="button" class="b3-btn b3-next">Weiter</button></div>' +
      '<p class="b3-note">Preise laut Speisekarte, Stand Oktober 2026.</p>' +
      '</div></div>';
    ["stage", "canvas", "glow", "price", "toast", "load", "result", "steps", "body", "prev", "next", "sum", "star"].forEach(function (k) {
      el[k] = root.querySelector(".b3-" + k);
    });
    el.resultList = root.querySelector(".b3-result-list");
    el.resultPrice = root.querySelector(".b3-result-price");
    root.querySelector(".b3-again").addEventListener("click", nochmal);
    root.querySelector(".b3-order").addEventListener("click", function (e) {
      if (!document.getElementById("bestellen")) {
        var k = document.getElementById("kiosk");
        if (k) { e.preventDefault(); k.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); }
      }
    });

    // Schritt Reiter
    STEPS.forEach(function (st, i) {
      var b = h("button", "b3-step", '<b>' + (i + 1) + '</b><span>' + st.t + '</span><em></em>');
      b.type = "button"; b.dataset.i = i;
      b.addEventListener("click", function () { goStep(i); });
      el.steps.appendChild(b);
    });

    // Panes
    var p0 = h("div", "b3-pane"); p0.dataset.k = "stufe";
    p0.appendChild(h("p", "b3-pane-t", "Wie viele Toppings sollen drauf?"));
    var cards = h("div", "b3-stufen");
    STUFEN.forEach(function (st, i) {
      var b = h("button", "b3-stufe",
        '<b>' + st.n + '</b><span>' + (st.n === 1 ? "Topping" : "Toppings") + '</span><i>' + euro(st.preis) + '</i>' +
        '<small>' + st.s + 'x Soße · ' + st.k + 'x Käse · ' + st.g + 'x Gewürz</small>');
      b.type = "button"; b.dataset.i = i;
      b.addEventListener("click", function () { setStufe(i); });
      cards.appendChild(b);
    });
    p0.appendChild(cards);
    el.body.appendChild(p0);

    function pane(key, title, items, extra) {
      var p = h("div", "b3-pane"); p.dataset.k = key;
      p.appendChild(h("p", "b3-pane-t", title + ' <em class="b3-cnt" data-k="' + key + '"></em>'));
      if (extra) p.appendChild(extra);
      var rail = h("div", "b3-chips" + (key === "top" ? " b3-chips-top" : ""));
      items.forEach(function (it) { rail.appendChild(chip(it)); });
      p.appendChild(rail);
      el.body.appendChild(p);
      return rail;
    }
    pane("sosse", "Such dir deine Soße aus.", SOSSEN);
    pane("kaese", "Welcher Käse kommt drauf?", KAESE);
    var fl = h("div", "b3-filter");
    FILTER.forEach(function (f) {
      var b = h("button", "b3-fbtn" + (f === "Alle" ? " on" : ""), f); b.type = "button"; b.dataset.f = f;
      b.addEventListener("click", function () { S.filter = f; renderFilter(); });
      fl.appendChild(b);
    });
    el.topRail = pane("top", "Pack drauf, wat du willst.", TOPS.concat(KAESE.map(function (k) { return { id: k.id, alias: true }; })), fl);
    pane("gew", "Zum Schluss: bisschen Würze.", GEW);

    el.prev.addEventListener("click", function () { goStep(S.step - 1); });
    el.next.addEventListener("click", function () {
      if (S.step < STEPS.length - 1) goStep(S.step + 1); else ofen();
    });
    renderAll();
  }

  function chip(it) {
    var real = BYID[it.id];
    var b = h("button", "b3-chip"); b.type = "button"; b.dataset.id = real.id;
    if (it.alias) b.classList.add("b3-alias");
    var ic;
    if (real.typ === "sosse") ic = '<i class="b3-sw" style="--c:' + real.col + '"></i>';
    else if (real.typ === "gew") ic = '<i class="b3-sw b3-sw-gew" style="--c:' + real.col + '"></i>';
    else if (real.layer) ic = '<img src="' + U("assets/builder3d/cheese.webp") + '" alt="" loading="lazy" width="56" height="56">';
    else ic = '<img src="' + iconUrl(real.slug) + '" alt="" loading="lazy" width="56" height="56">';
    b.innerHTML = ic + '<span>' + real.name + '</span><u aria-hidden="true"></u>';
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { toggle(real.id, b); });
    return b;
  }

  function renderFilter() {
    root.querySelectorAll(".b3-fbtn").forEach(function (b) { b.classList.toggle("on", b.dataset.f === S.filter); });
    el.topRail.querySelectorAll(".b3-chip").forEach(function (c) {
      var it = BYID[c.dataset.id], alias = c.classList.contains("b3-alias"), show;
      if (S.filter === "Käse") show = alias;
      else if (alias) show = false;
      else show = S.filter === "Alle" || it.cats.indexOf(S.filter) >= 0;
      c.hidden = !show;
    });
    el.topRail.scrollLeft = 0;
  }

  function renderAll() {
    var st = stufe();
    el.price.textContent = euro(st.preis);
    root.querySelectorAll(".b3-stufe").forEach(function (b, i) {
      b.classList.toggle("on", i === S.stufe); b.setAttribute("aria-pressed", i === S.stufe ? "true" : "false");
    });
    root.querySelectorAll(".b3-chip").forEach(function (c) {
      var it = BYID[c.dataset.id], on = S[it.typ].indexOf(it.id) >= 0;
      c.classList.toggle("on", on); c.setAttribute("aria-pressed", on ? "true" : "false");
    });
    ["sosse", "kaese", "top", "gew"].forEach(function (k) {
      root.querySelectorAll('.b3-cnt[data-k="' + k + '"]').forEach(function (e) {
        e.textContent = S[k].length + " / " + limit(k);
        e.classList.toggle("full", S[k].length >= limit(k));
      });
    });
    root.querySelectorAll(".b3-step").forEach(function (b, i) {
      var k = STEPS[i].key;
      b.classList.toggle("on", i === S.step);
      b.querySelector("em").textContent = k === "stufe" ? euro(st.preis) : S[k].length + "/" + limit(k);
      b.classList.toggle("done", k !== "stufe" && S[k].length >= limit(k));
    });
    root.querySelectorAll(".b3-pane").forEach(function (p, i) { p.hidden = i !== S.step; });
    el.prev.disabled = S.step === 0;
    el.next.textContent = S.step === STEPS.length - 1 ? "Ab in den Ofen" : "Weiter";
    el.next.classList.toggle("b3-oven", S.step === STEPS.length - 1);
    var n = S.sosse.length + S.kaese.length + S.top.length + S.gew.length;
    el.sum.textContent = n ? n + (n === 1 ? " Zutat drauf" : " Zutaten drauf") : "Noch nix drauf";
    if (!G.ok && G.failed) renderFallbackList();
  }

  function goStep(i) {
    if (S.busy) return;
    S.step = Math.max(0, Math.min(STEPS.length - 1, i));
    renderAll();
    if (STEPS[S.step].key === "top") renderFilter();
  }

  var toastT;
  function toast(msg) {
    el.toast.textContent = msg; el.toast.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { el.toast.classList.remove("on"); }, 2600);
  }
  function wackel(node) {
    if (!node) return;
    node.classList.remove("b3-shake"); void node.offsetWidth; node.classList.add("b3-shake");
    root.querySelectorAll('.b3-cnt').forEach(function (c) { if (c.offsetParent) { c.classList.remove("b3-shake"); void c.offsetWidth; c.classList.add("b3-shake"); } });
  }
  function popStar() { el.star.classList.remove("pop"); void el.star.offsetWidth; el.star.classList.add("pop"); }

  function setStufe(i) {
    if (S.busy) return;
    S.stufe = i;
    var cut = [];
    ["sosse", "kaese", "top", "gew"].forEach(function (k) {
      while (S[k].length > limit(k)) cut.push(S[k].pop());
    });
    cut.forEach(function (id) { remove3D(id); });
    if (cut.length) toast("Passt nich mehr in die Stufe, " + cut.map(function (id) { return BYID[id].name; }).join(", ") + " fliegt runter.");
    popStar(); renderAll();
  }

  var NAMEN = { sosse: "Soße", kaese: "Käse", top: "Toppings", gew: "Gewürz" };
  function toggle(id, node) {
    if (S.busy) return;
    if (S.gebacken) unbake();
    var it = BYID[id], arr = S[it.typ], i = arr.indexOf(id);
    if (i >= 0) { arr.splice(i, 1); remove3D(id); renderAll(); return; }
    var lim = limit(it.typ);
    if (arr.length >= lim) {
      if (lim === 1 && it.typ !== "top") {
        var old = arr.pop(); remove3D(old);
      } else {
        var nxt = STUFEN.filter(function (s) { return limit.call(null, it.typ) < (it.typ === "top" ? s.n : it.typ === "sosse" ? s.s : it.typ === "kaese" ? s.k : s.g); })[0];
        toast("Stopp, " + lim + "x " + NAMEN[it.typ] + " ist dein Limit." + (nxt ? " Mit " + nxt.n + " Toppings geht mehr." : " Tausch einfach wat raus."));
        wackel(node);
        return;
      }
    }
    arr.push(id);
    add3D(id);
    renderAll();
  }

  /* ---------------- 3D ---------------- */
  var G = { ok: false, failed: false };
  var T; // THREE

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script"); s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(new Error("Script fehlt: " + src)); };
      document.head.appendChild(s);
    });
  }
  function webglOk() {
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); } catch (e) { return false; }
  }

  function start3D() {
    if (G.started) return; G.started = true;
    // file://: Browser sperren Bilder für WebGL (Cross Origin), dann Bedienung mit Liste statt 3D
    if (!webglOk() || location.protocol === "file:") return fallback();
    var p = window.THREE && window.THREE.WebGLRenderer ? Promise.resolve() : loadScript(U("assets/vendor/three/three.bundle.js"));
    p.then(init3D).catch(function (e) { console.warn(e); fallback(); });
  }

  function fallback() {
    G.failed = true;
    root.querySelector(".b3-drag").hidden = true;
    el.load.innerHTML = '<span>Dein Browser zeigt hier kein 3D. Bauen geht trotzdem, deine Auswahl steht hier:</span><p class="b3-fb-list"></p>';
    el.load.classList.add("b3-fb");
    renderFallbackList();
  }
  function renderFallbackList() {
    var l = root.querySelector(".b3-fb-list"); if (!l) return;
    l.textContent = auswahlText() || "Noch nix drauf.";
  }
  function auswahlText() {
    return S.sosse.concat(S.kaese, S.top, S.gew).map(function (id) { return BYID[id].name; }).join(", ");
  }

  var texCache = {};
  function tex(url, srgb) {
    if (texCache[url]) return texCache[url];
    var t = G.loader.load(url, function () { G.dirty = true; }, undefined, function () { console.warn("Bild fehlt: " + url); });
    if (srgb !== false) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = Math.min(4, G.renderer.capabilities.getMaxAnisotropy());
    return (texCache[url] = t);
  }
  var texProm = {};
  function texP(url) {
    if (texProm[url]) return texProm[url];
    return (texProm[url] = new Promise(function (res) {
      var t = G.loader.load(url, function (tt) { res(tt); }, undefined, function () { console.warn("Bild fehlt: " + url); res(null); });
      t.colorSpace = T.SRGBColorSpace; t.anisotropy = Math.min(4, G.renderer.capabilities.getMaxAnisotropy());
    }));
  }

  function noise(a, s) { return Math.sin(a * 3 + s) * 0.5 + Math.sin(a * 7 + s * 2.1) * 0.3 + Math.sin(a * 13 + s * 0.7) * 0.2; }

  function radialTexture(stops) {
    var c = document.createElement("canvas"); c.width = c.height = 256; var x = c.getContext("2d");
    var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    var t = new T.CanvasTexture(c); return t;
  }
  // Shader Erweiterung: Ausbreiten von der Mitte (uR), Umfärben (uTint/uMix), Überblenden auf zweite Textur (uMap2/uBake), Auflösen (uDis)
  function extend(mat, opt) {
    var u = {
      uR: { value: opt.r != null ? opt.r : 2 }, uTint: { value: new T.Color(opt.tint || "#ffffff") }, uMix: { value: opt.mix || 0 },
      uMap2: { value: opt.map2 || null }, uBake: { value: 0 }, uDis: { value: opt.dis != null ? opt.dis : 1 }, uSwirl: { value: opt.swirl ? 1 : 0 }
    };
    mat.userData.u = u;
    mat.onBeforeCompile = function (sh) {
      Object.keys(u).forEach(function (k) { sh.uniforms[k] = u[k]; });
      sh.vertexShader = "varying vec3 vLp;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvLp = position;");
      sh.fragmentShader = "varying vec3 vLp;\nuniform float uR,uMix,uBake,uDis,uSwirl;uniform vec3 uTint;" + (opt.map2 ? "uniform sampler2D uMap2;" : "") +
        "\nfloat h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\n" +
        sh.fragmentShader.replace("#include <map_fragment>",
          "#include <map_fragment>\n" +
          (opt.map2 ? "vec4 m2 = texture2D(uMap2, vMapUv); diffuseColor = mix(diffuseColor, vec4(m2.rgb*diffuse, m2.a*opacity), uBake);\n" : "") +
          "float lum = dot(diffuseColor.rgb, vec3(0.3,0.55,0.15));\n" +
          "vec3 tinted = uTint * clamp(0.3 + 3.2*lum, 0.0, 1.6);\n" +
          "diffuseColor.rgb = mix(diffuseColor.rgb, tinted, uMix);\n" +
          "float d = length(vLp.xy) + (sin(atan(vLp.y,vLp.x)*9.0)*0.02 + sin(atan(vLp.y,vLp.x)*23.0)*0.01);\n" +
          "diffuseColor.a *= 1.0 - smoothstep(uR-0.05, uR, d);\n" +
          "if(uSwirl>0.5){ diffuseColor.a *= smoothstep(0.17,0.22,lum); }\n" +
          "if(uDis<1.0){ float n = h21(floor(vMapUv*90.0)); diffuseColor.a *= step(n, uDis*1.02); }\n");
    };
    mat.customProgramCacheKey = function () { return "b3" + (opt.map2 ? "m2" : "") ; };
    return u;
  }

  function init3D() {
    T = window.THREE;
    var mobile = window.matchMedia("(max-width: 899px)").matches;
    var renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return fallback(); }
    G.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x000000, 0);
    el.canvas.appendChild(renderer.domElement);
    G.loader = new T.TextureLoader();

    var scene = new T.Scene(); G.scene = scene;
    var cam = new T.PerspectiveCamera(30, 1, 0.1, 50); G.cam = cam;

    // Licht: warmes Studio Licht von der Seite, warmer Rand, keine Shadow Maps (weiche Kontaktschatten als Textur)
    scene.add(new T.HemisphereLight(0xfff0dc, 0x3a1008, 0.7));
    var key = new T.DirectionalLight(0xffe6c8, 2.7); key.position.set(3.6, 3.3, 1.2);
    scene.add(key); G.key = key;
    var rim = new T.DirectionalLight(0xffb060, 2.6); rim.position.set(-3.2, 1.4, -2.8); scene.add(rim); G.rim = rim;
    var fill = new T.DirectionalLight(0xffd0b0, 0.45); fill.position.set(-3, 2, 3); scene.add(fill);
    var oven = new T.PointLight(0xff6a1a, 0, 6, 1.5); oven.position.set(0, 0.6, 0); scene.add(oven); G.ovenLight = oven;

    // Gruppe, die sich dreht
    var grp = new T.Group(); scene.add(grp); G.grp = grp;

    // weicher Kontaktschatten, Pizza schwebt leicht darüber
    var shTex = radialTexture([[0, "rgba(50,0,8,0.85)"], [0.5, "rgba(50,0,8,0.55)"], [0.78, "rgba(50,0,8,0.18)"], [1, "rgba(50,0,8,0)"]]);
    var floorSh = new T.Mesh(new T.PlaneGeometry(3.1, 3.1), new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
    floorSh.rotation.x = -Math.PI / 2; floorSh.position.set(0.12, -0.22, 0.16); floorSh.renderOrder = -1; scene.add(floorSh); G.floorSh = floorSh;

    // Teig mit Wulst
    var prof = [[0.0, 0.0], [0.9, 0.0], [0.99, 0.015], [1.04, 0.055], [1.062, 0.105], [1.048, 0.155], [1.005, 0.19], [0.952, 0.2], [0.902, 0.182], [0.866, 0.138], [0.85, 0.097], [0.835, 0.072], [0.815, 0.056], [0.6, 0.055], [0.0, 0.055]];
    var pts = prof.map(function (p) { return new T.Vector2(Math.max(p[0], 0.0001), p[1]); }).reverse();
    var dGeo = new T.LatheGeometry(pts, 160);
    var pos = dGeo.attributes.position, uv = dGeo.attributes.uv, v = new T.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var rr = Math.hypot(v.x, v.z), ang = Math.atan2(v.z, v.x);
      var rimF = Math.max(0, Math.min(1, (rr - 0.8) / 0.2));
      var k = 1 + noise(ang, 1.3) * 0.018 * rimF;
      v.x *= k; v.z *= k;
      if (v.y > 0.07) v.y += noise(ang, 4.1) * 0.022 * rimF;
      pos.setXYZ(i, v.x, v.y, v.z);
      var rp = rr <= 0.835 ? rr / 0.835 * 0.84 : 0.84 + Math.min(1, (rr - 0.835) / 0.23) * 0.11, f = rr > 0.0001 ? rp / rr * 0.5 : 0.5;
      uv.setXY(i, 0.5 + v.x * f, 0.5 - v.z * f);
    }
    dGeo.computeVertexNormals();
    var doughTex = tex(U("assets/builder3d/dough.webp")), doughBaked = tex(U("assets/builder3d/dough_baked.webp"));
    var dMat = new T.MeshStandardMaterial({ map: doughTex, bumpMap: doughTex, bumpScale: 1.6, roughness: 0.9, metalness: 0, emissive: 0xff5a10, emissiveIntensity: 0 });
    G.dough = extend(dMat, { map2: doughBaked });
    G.dMat = dMat;
    var dough = new T.Mesh(dGeo, dMat); grp.add(dough);
    G.topY = 0.055;

    // Soßen Schichten (2 Plätze)
    var sauceTex = tex(U("assets/builder3d/sauce.webp"));
    G.sauces = [0, 1].map(function (i) {
      var m = new T.MeshStandardMaterial({ map: sauceTex, transparent: true, roughness: 0.42, metalness: 0, depthWrite: false });
      var u = extend(m, { r: 0, swirl: i === 1 });
      var me = new T.Mesh(new T.CircleGeometry(0.99, 120), m);
      me.rotation.x = -Math.PI / 2; me.position.y = G.topY + 0.004 + i * 0.003; me.renderOrder = 2 + i; me.visible = false;
      grp.add(me);
      return { mesh: me, mat: m, u: u, id: null, tw: null };
    });
    // Mozzarella Decke
    var chTex = tex(U("assets/builder3d/cheese.webp")), chMelt = tex(U("assets/builder3d/cheese_melt.webp"));
    var cm = new T.MeshStandardMaterial({ map: chTex, transparent: true, roughness: 0.7, metalness: 0, depthWrite: false });
    G.cheeseU = extend(cm, { map2: chMelt, dis: 0 }); G.cheeseMat = cm;
    var cheese = new T.Mesh(new T.CircleGeometry(1.0, 96), cm);
    cheese.rotation.x = -Math.PI / 2; cheese.position.y = G.topY + 0.011; cheese.renderOrder = 5; cheese.visible = false;
    grp.add(cheese); G.cheese = cheese;

    // Gewürz Punkte
    G.pieces = {}; G.anims = []; G.order = 0; G.spice = {}; G.shCache = {};
    G.planeGeo = new T.PlaneGeometry(1, 1); G.planeGeo.rotateX(-Math.PI / 2);

    // Dampf
    var stTex = radialTexture([[0, "rgba(255,255,255,0.55)"], [0.5, "rgba(255,255,255,0.18)"], [1, "rgba(255,255,255,0)"]]);
    G.steam = [];
    for (var s = 0; s < 26; s++) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: stTex, transparent: true, opacity: 0, depthWrite: false }));
      sp.scale.set(0.6, 0.6, 1); sp.visible = false; scene.add(sp); G.steam.push({ s: sp, t: Math.random() });
    }

    // Kamera und Steuerung
    G.view = { yaw: 0.5, tilt: 0, dist: 1, elev: 0.92, vel: 0, zoom: 1 };
    G.mobile = mobile;
    setupControls();
    resize();
    window.addEventListener("resize", resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(el.stage);

    G.ok = true;
    el.load.classList.add("off");
    // was schon gewählt ist (vor dem Laden) zeigen
    S.sosse.forEach(function (id) { add3D(id, true); });
    S.kaese.concat(S.top, S.gew).forEach(function (id) { add3D(id, true); });

    // Render Schleife nur sichtbar
    // Sichtbarkeit per Rechteck (robust auch mit ScrollSmoother Transform), außerhalb nur langsames Nachsehen
    G.visible = true;
    document.addEventListener("visibilitychange", function () { if (!document.hidden) loop(); });
    window.addEventListener("scroll", function () { if (!raf) { G.last = performance.now(); loop(); } }, { passive: true });
    G.last = performance.now();
    loop();
  }

  function resize() {
    if (!G.renderer) return;
    var w = el.canvas.clientWidth, hgt = el.canvas.clientHeight;
    if (!w || !hgt) return;
    G.renderer.setSize(w, hgt, false);
    G.cam.aspect = w / hgt; G.cam.updateProjectionMatrix();
    // Abstand so, dass Pizza (Radius ~1.25) sicher reinpasst
    var vf = G.cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * G.cam.aspect);
    // Brett (Radius ~1.4) soll mit Rand reinpassen, Schräglage staucht die Tiefe
    var needW = 1.22, needH = 1.25 * Math.sin(G.view.elev) + 0.4;
    G.view.dist = Math.max(needW / Math.tan(hf / 2), needH / Math.tan(vf / 2), 3.4);
    G.dirty = true;
  }

  function setupControls() {
    var cv = G.renderer.domElement, drag = null;
    cv.style.touchAction = "pan-y";
    cv.addEventListener("pointerdown", function (e) {
      drag = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
      G.view.vel = 0; G.dragging = true; el.stage.classList.add("dragging");
      try { cv.setPointerCapture(e.pointerId); } catch (er) { }
    });
    cv.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), dt = Math.max(1, now - drag.t);
      G.view.yaw += dx * 0.009;
      G.view.vel = dx * 0.009 / dt * 1000;
      if (drag.type === "mouse") G.view.tilt = Math.max(-0.28, Math.min(0.32, G.view.tilt + dy * 0.004));
      drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
      root.querySelector(".b3-drag").classList.add("off");
      loop();
    });
    function up() { drag = null; G.dragging = false; el.stage.classList.remove("dragging"); }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);
  }

  /* ---------- Animationen ---------- */
  function tween(dur, fn, done, delay) {
    var a = { t0: performance.now() + (delay || 0), dur: dur, fn: fn, done: done };
    G.anims.push(a); loop(); return a;
  }
  var ease = {
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inout: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    in: function (t) { return t * t; }
  };

  function sauceSlot(id) {
    return G.sauces.filter(function (s) { return s.id === id; })[0];
  }
  function applySauce(slot, it) {
    var oil = it.art === "oil";
    slot.u.uTint.value.set(it.col); slot.u.uMix.value = it.mix;
    slot.mat.opacity = oil ? 0.5 : 1;
    slot.mat.roughness = oil ? 0.12 : (it.id === "balsamico" ? 0.25 : 0.4);
    slot.u.uSwirl.value = (slot === G.sauces[1] && !oil) ? 1 : 0;
  }

  function add3D(id, instant) {
    if (!G.ok) return;
    var it = BYID[id], quick = instant || RM;
    if (it.typ === "sosse") {
      // erste Soße als Fläche, zweite als Spirale obendrauf
      var slot = !G.sauces[0].id ? G.sauces[0] : G.sauces[1];
      slot.id = id; applySauce(slot, it); slot.mesh.visible = true;
      if (slot.tw) slot.tw.dead = true;
      if (quick) slot.u.uR.value = 1.06;
      else { slot.u.uR.value = 0; slot.tw = tween(1100, function (t) { slot.u.uR.value = ease.out(t) * 1.06; }); }
      return;
    }
    if (it.typ === "kaese" && it.layer) {
      G.cheese.visible = true;
      if (quick) G.cheeseU.uDis.value = 1;
      else tween(1300, function (t) { G.cheeseU.uDis.value = ease.out(t); });
      return;
    }
    if (it.typ === "gew") return addSpice(it, quick);
    addPieces(it, quick);
  }

  function remove3D(id) {
    if (!G.ok) return;
    var it = BYID[id];
    if (it.typ === "sosse") {
      var slot = sauceSlot(id); if (!slot) return;
      slot.id = null; if (slot.tw) slot.tw.dead = true;
      var r0 = slot.u.uR.value;
      slot.tw = tween(RM ? 1 : 450, function (t) { slot.u.uR.value = r0 * (1 - ease.in(t)); }, function () { if (!slot.id) slot.mesh.visible = false; });
      // falls nur noch die zweite übrig ist: nach unten holen
      if (slot === G.sauces[0] && G.sauces[1].id) {
        var keep = G.sauces[1].id;
        setTimeout(function () {
          if (G.sauces[1].id !== keep) return;
          G.sauces[1].id = null; G.sauces[1].mesh.visible = false;
          var s0 = G.sauces[0]; s0.id = keep; applySauce(s0, BYID[keep]); s0.mesh.visible = true; if (s0.tw) s0.tw.dead = true; s0.u.uR.value = 1.06;
        }, RM ? 0 : 460);
      }
      return;
    }
    if (it.typ === "kaese" && it.layer) {
      var d0 = G.cheeseU.uDis.value;
      tween(RM ? 1 : 500, function (t) { G.cheeseU.uDis.value = d0 * (1 - t); }, function () { if (S.kaese.indexOf("mozzarella") < 0) G.cheese.visible = false; });
      return;
    }
    if (it.typ === "gew") {
      var sp = G.spice[id]; if (!sp) return; delete G.spice[id];
      tween(RM ? 1 : 400, function (t) { sp.material.opacity = 1 - t; }, function () { G.grp.remove(sp); sp.geometry.dispose(); });
      return;
    }
    var list = G.pieces[id] || []; delete G.pieces[id];
    list.forEach(function (p, i) {
      if (p.fly) p.fly.dead = true;
      if (RM) { G.grp.remove(p.m); return; }
      var a = p.m.position.clone(), ang = Math.atan2(a.z, a.x), sc0 = p.m.scale.x;
      var b = new T.Vector3(Math.cos(ang) * 2.4, 1.6 + Math.random(), Math.sin(ang) * 2.4);
      tween(520, function (t) {
        var e = ease.in(t);
        p.m.position.lerpVectors(a, b, e); p.m.position.y = a.y + (b.y - a.y) * e + Math.sin(t * Math.PI) * 0.4;
        p.m.rotation.y += 0.12; p.m.scale.setScalar(sc0 * (1 - e * 0.7));
      }, function () { G.grp.remove(p.m); }, i * 25);
    });
  }

  function allPlaced() {
    var arr = [];
    Object.keys(G.pieces).forEach(function (k) { G.pieces[k].forEach(function (p) { arr.push(p); }); });
    return arr;
  }
  function placeSpot(size, placed) {
    var best = null, bestD = -1, maxR = 0.8 - size * 0.35;
    for (var c = 0; c < 26; c++) {
      var r = Math.sqrt(Math.random()) * maxR, a = Math.random() * Math.PI * 2;
      var x = Math.cos(a) * r, z = Math.sin(a) * r, dmin = 9;
      for (var i = 0; i < placed.length; i++) {
        var q = placed[i], d = Math.hypot(q.x - x, q.z - z) - (q.size + size) * 0.36;
        if (d < dmin) dmin = d;
      }
      if (dmin > bestD) { bestD = dmin; best = { x: x, z: z }; }
    }
    return best;
  }

  function addPieces(it, quick) {
    var slug = it.slug, n = teileAnzahl(slug), base = (CM[slug] || 3) / 15;
    var chipEl = root.querySelectorAll('.b3-chip[data-id="' + it.id + '"]');
    chipEl.forEach(function (c) { c.classList.add("loading"); });
    var urls = []; for (var i = 0; i < n; i++) urls.push(teilUrl(slug, i));
    Promise.all(urls.map(texP)).then(function (texs) {
      chipEl.forEach(function (c) { c.classList.remove("loading"); });
      if (S[it.typ].indexOf(it.id) < 0 || G.pieces[it.id]) return;
      var placed = allPlaced().map(function (p) { return p.spot; });
      var list = []; G.pieces[it.id] = list;
      texs.forEach(function (tx, i) {
        if (!tx) return;
        var img = tx.image, asp = img.width / img.height;
        var sz = base * (0.85 + Math.random() * 0.3);
        var mat = G.matCache && G.matCache[tx.uuid];
        if (!mat) {
          G.matCache = G.matCache || {};
          mat = G.matCache[tx.uuid] = new T.MeshStandardMaterial({ map: tx, alphaTest: 0.5, alphaToCoverage: true, roughness: 0.55, metalness: 0, side: T.DoubleSide });
        }
        var m = new T.Mesh(G.planeGeo, mat);
        var sx = asp >= 1 ? sz : sz * asp, sz2 = asp >= 1 ? sz / asp : sz;
        m.scale.set(sx, 1, sz2);
 
        // feiner Schatten unter jedem Teil (dunkle Silhouette, leicht versetzt)
        var shm = G.shCache[tx.uuid] || (G.shCache[tx.uuid] = new T.MeshBasicMaterial({ map: tx, color: 0x2a0606, transparent: true, opacity: 0.38, depthWrite: false }));
        var sh = new T.Mesh(G.planeGeo, shm); sh.position.set(0.05, -0.006, 0.05); sh.scale.set(1.08, 1, 1.08); sh.renderOrder = 9; m.add(sh);
        if (!quick) sh.visible = false;
        var spot = placeSpot(sz, placed); spot.size = sz; placed.push(spot);
        G.order++;
        var y = G.topY + 0.017 + (G.order % 200) * 0.0009;
        m.renderOrder = 10 + G.order;
        m.rotation.y = Math.random() * Math.PI * 2;
        var p = { m: m, spot: spot, y: y }; list.push(p);
        G.grp.add(m);
        var target = new T.Vector3(spot.x, y, spot.z);
        if (quick) { m.position.copy(target); return; }
        // Bogenbahn von oben
        var a = Math.random() * Math.PI * 2;
        var from = new T.Vector3(Math.cos(a) * 1.6, 2.4 + Math.random() * 0.6, Math.sin(a) * 1.6);
        var ctrl = new T.Vector3((from.x + target.x) / 2, 2.8, (from.z + target.z) / 2);
        var rot0 = m.rotation.y - 2 - Math.random() * 2, rot1 = m.rotation.y, s0x = sx, s0z = sz2;
        m.position.copy(from);
        p.fly = tween(720, function (t) {
          if (t < 0.78) {
            var q = ease.inout(t / 0.78), iq = 1 - q;
            m.position.set(iq * iq * from.x + 2 * iq * q * ctrl.x + q * q * target.x, iq * iq * from.y + 2 * iq * q * ctrl.y + q * q * target.y, iq * iq * from.z + 2 * iq * q * ctrl.z + q * q * target.z);
            m.rotation.y = rot0 + (rot1 - rot0) * q;
            m.rotation.x = (1 - q) * 0.9; m.rotation.z = (1 - q) * 0.5;
          } else {
            var b = (t - 0.78) / 0.22;
            m.position.set(target.x, target.y + Math.sin(b * Math.PI) * 0.045 * (1 - b), target.z);
            m.rotation.set(0, rot1, 0);
            var sq = 1 + Math.sin(b * Math.PI) * 0.08;
            m.scale.set(s0x * sq, 1, s0z * sq);
          }
        }, function () { m.position.copy(target); m.scale.set(s0x, 1, s0z); m.rotation.set(0, rot1, 0); sh.visible = true; }, i * 70);
      });
      if (S.gebacken) tintPieces(1);
    });
  }

  function dotTexture() {
    if (G.dotTex) return G.dotTex;
    var c = document.createElement("canvas"); c.width = c.height = 32; var x = c.getContext("2d");
    var g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.55, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return (G.dotTex = new T.CanvasTexture(c));
  }
  function addSpice(it, quick) {
    var n = it.id === "meersalz" ? 160 : 520, arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var r = Math.sqrt(Math.random()) * 0.86, a = Math.random() * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * r; arr[i * 3 + 1] = G.topY + 0.03 + Math.random() * 0.01; arr[i * 3 + 2] = Math.sin(a) * r;
    }
    var g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(arr, 3));
    var m = new T.PointsMaterial({ color: it.col, size: it.id === "meersalz" ? 0.022 : 0.014, map: dotTexture(), transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true });
    var p = new T.Points(g, m); p.renderOrder = 900; G.grp.add(p); G.spice[it.id] = p;
    if (quick) m.opacity = 1; else tween(700, function (t) { m.opacity = t; p.position.y = (1 - ease.out(t)) * 0.5; });
  }

  /* ---------- Ofen ---------- */
  function tintPieces(k) {
    if (!G.matCache) return;
    Object.keys(G.matCache).forEach(function (u) { G.matCache[u].color.setRGB(1 - 0.08 * k, 1 - 0.16 * k, 1 - 0.26 * k); });
  }
  function setBake(k) {
    G.dough.uBake.value = k; G.cheeseU.uBake.value = k;
    G.cheeseMat.roughness = 0.7 - 0.38 * k;
    G.sauces.forEach(function (s) { s.mat.color.setRGB(1 - 0.12 * k, 1 - 0.18 * k, 1 - 0.2 * k); });
    tintPieces(k);
  }
  function ofen() {
    if (S.busy) return;
    if (!S.sosse.length && !S.top.length && !S.kaese.length) { toast("Erst mal wat drauf packen. Mindestens eine Soße."); wackel(el.next); return; }
    S.busy = true; root.classList.add("b3-baking");
    el.next.disabled = el.prev.disabled = true;
    if (!G.ok) { return showResult(); }
    if (window.innerWidth < 900) el.stage.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
    var z0 = G.view.zoom, e0 = G.view.elev;
    var D = RM ? 1 : 1;
    tween(RM ? 1 : 900, function (t) { var e = ease.inout(t); G.view.zoom = z0 + (0.74 - z0) * e; G.view.elev = e0 + (0.78 - e0) * e; });
    el.glow.classList.add("on");
    tween(RM ? 1 : 3000, function (t) {
      var glow = Math.sin(Math.min(1, t * 1.15) * Math.PI);
      G.ovenLight.intensity = glow * 3.2; G.dMat.emissiveIntensity = glow * 0.22;
      G.key.color.setRGB(1, 0.94 - 0.12 * glow, 0.88 - 0.25 * glow);
      setBake(ease.inout(Math.min(1, t * 1.2)));
    }, function () {
      G.ovenLight.intensity = 0; G.dMat.emissiveIntensity = 0; G.key.color.set(0xfff1e0); setBake(1);
      el.glow.classList.remove("on");
      S.gebacken = true;
      tween(RM ? 1 : 800, function (t) { var e = ease.inout(t); G.view.zoom = 0.74 + (1 - 0.74) * e; G.view.elev = 0.78 + (e0 - 0.78) * e; });
      setTimeout(showResult, RM ? 0 : 500);
    }, 500);
    if (!RM) { G.steamOn = performance.now(); G.steamUntil = performance.now() + 7000; }
  }
  function showResult() {
    var st = stufe();
    el.resultList.textContent = auswahlText() || "Pizza pur.";
    el.resultPrice.innerHTML = '<b>' + euro(st.preis) + '</b> <span>' + st.n + (st.n === 1 ? " Topping" : " Toppings") + '</span>';
    el.result.hidden = false;
    requestAnimationFrame(function () { el.result.classList.add("on"); });
    S.busy = false; el.next.disabled = false; el.prev.disabled = S.step === 0; root.classList.remove("b3-baking");
  }
  function unbake() {
    S.gebacken = false; if (G.ok) setBake(0);
    el.result.classList.remove("on"); el.result.hidden = true;
  }
  function nochmal() {
    unbake();
    ["sosse", "kaese", "top", "gew"].forEach(function (k) { S[k].slice().forEach(function (id) { remove3D(id); }); S[k] = []; });
    S.step = 0; S.filter = "Alle"; renderFilter(); renderAll();
    if (G.ok) { G.view.yaw += 0.001; }
    el.stage.scrollIntoView && window.innerWidth < 900 && el.stage.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
  }

  /* ---------- Schleife ---------- */
  var raf = 0;
  function loop() {
    if (raf || !G.ok) return;
    raf = requestAnimationFrame(frame);
  }
  function stepAnims(now) {
    for (var i = G.anims.length - 1; i >= 0; i--) {
      var a = G.anims[i];
      if (a.dead) { G.anims.splice(i, 1); continue; }
      var t = (now - a.t0) / a.dur; if (t < 0) continue;
      if (t >= 1) { a.fn(1); G.anims.splice(i, 1); if (a.done) a.done(); } else a.fn(t);
    }
  }
  var idleT = 0;
  function onScreen() {
    var r = el.stage.getBoundingClientRect();
    return r.bottom > -60 && r.top < (window.innerHeight || 800) + 60 && r.width > 0;
  }
  function frame(now) {
    raf = 0;
    G.visible = onScreen();
    if (!G.visible || document.hidden) {
      stepAnims(now);   // Ofen und Flüge laufen logisch weiter, nur ohne Bild
      clearTimeout(idleT);
      if (!document.hidden) idleT = setTimeout(function () { G.last = performance.now(); loop(); }, 150);
      return;
    }
    var dt = Math.min(0.05, (now - G.last) / 1000); G.last = now;
    var v = G.view;
    if (!G.dragging) {
      if (Math.abs(v.vel) > 0.01) { v.yaw += v.vel * dt; v.vel *= Math.pow(0.04, dt); }
      else if (!RM) v.yaw += 0.12 * dt;
      v.tilt *= Math.pow(0.5, dt);
    }
    stepAnims(now);
    // Dampf
    if (G.steamUntil && now < G.steamUntil) {
      var life = (G.steamUntil - now) / 7000;
      G.steam.forEach(function (s, j) {
        s.t += dt * (0.35 + (j % 5) * 0.06);
        if (s.t > 1) { s.t = 0; s.a = Math.random() * 6.28; s.r = Math.random() * 0.7; }
        var aa = s.a || j, r = s.r != null ? s.r : (j % 7) / 10;
        s.s.visible = true;
        s.s.position.set(Math.cos(aa) * r, 0.15 + s.t * 1.4, Math.sin(aa) * r);
        var sc = 0.35 + s.t * 0.9; s.s.scale.set(sc, sc, 1);
        s.s.material.opacity = Math.sin(s.t * Math.PI) * 0.5 * Math.min(1, life * 2);
      });
    } else if (G.steamUntil) { G.steam.forEach(function (s) { s.s.visible = false; }); G.steamUntil = 0; }

    G.grp.position.y = RM ? 0 : Math.sin(now / 1400) * 0.015;
    G.grp.rotation.y = v.yaw;
    G.grp.rotation.x = v.tilt * 0.6;
    var d = v.dist * v.zoom;
    G.cam.position.set(0, Math.sin(v.elev) * d, Math.cos(v.elev) * d);
    G.cam.lookAt(0, 0, 0.05);
    G.renderer.render(G.scene, G.cam);
    loop();
  }

  /* ---------------- Start ---------------- */
  function mount() {
    root = document.getElementById("builder3d");
    if (!root) return;
    buildUI();
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start3D(); }
      }, { rootMargin: "900px 0px" });
      io.observe(root);
    } else start3D();
    window.BUILDER3D_API = { state: S, toggle: function (id) { toggle(id, null); }, setStufe: setStufe, goStep: goStep, ofen: ofen, nochmal: nochmal, g: G, data: { SOSSEN: SOSSEN, KAESE: KAESE, TOPS: TOPS, GEW: GEW, STUFEN: STUFEN, MANI: MANI } };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();
