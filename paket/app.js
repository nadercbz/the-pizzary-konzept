/* The Pizzary Systempaket. Aufbau wie acai-x-you/23_OnePager/app.js.
   GSAP (lokal in assets/vendor, läuft offline und per file://): ScrollSmoother für weiches Scrollen und Parallax über data-speed,
   ScrollTrigger für Pins und Scrub. Handy und reduzierte Bewegung: Klasse "calm", normales Scrollen ohne Pins (siehe Kopf von index.html). */
(function(){
  var calm = document.documentElement.classList.contains("calm");
  var reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var smoother = null;

  /* Zahlen Tabs und Anker laufen auch ohne GSAP */
  document.querySelectorAll(".tabs button").forEach(function(b){
    b.addEventListener("click", function(){
      document.querySelectorAll(".tabs button").forEach(function(o){ var on = o === b; o.classList.toggle("on", on); o.setAttribute("aria-selected", on); });
      document.querySelectorAll(".fall").forEach(function(f){ f.hidden = f.id !== "fall-" + b.dataset.fall; });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });
  if (!window.gsap || reduce) {
    document.querySelectorAll(".reveal .w").forEach(function(w){ w.style.opacity = 1; });
    document.querySelectorAll("[data-n]").forEach(function(el){ el.textContent = el.dataset.n; });
    document.querySelectorAll(".k-steps li, .phone-in img").forEach(function(e){ e.style.opacity = 1; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  if (!calm) smoother = ScrollSmoother.create({wrapper:"#smooth-wrapper", content:"#smooth-content", smooth:1.2, effects:true, smoothTouch:0.1});
  window.__smoother = smoother;

  /* Hero */
  gsap.from(".hero-logo", {scale:.6, opacity:0, rotate:-8, duration:1, ease:"back.out(1.8)", delay:.1});
  gsap.from(".hero h1", {yPercent:30, opacity:0, duration:1.1, ease:"power3.out", delay:.2});
  gsap.from(".hero .kick, .hero .lead, .hero .btn", {y:24, opacity:0, stagger:.12, duration:.9, delay:.5});
  gsap.from(".f", {scale:.5, opacity:0, rotate:"+=24", stagger:.1, duration:1.1, ease:"back.out(1.6)", delay:.2});
  if (!calm) gsap.utils.toArray(".f").forEach(function(f, i){
    gsap.to(f, {rotate:"+=" + (i % 2 ? -18 : 18), ease:"none", scrollTrigger:{trigger:".hero", start:"top top", end:"bottom top", scrub:true}});
  });

  /* Statement Wort für Wort */
  document.querySelectorAll(".reveal").forEach(function(el){
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function(w){ return '<span class="w">' + w + "</span>"; }).join(" ");
    gsap.to(el.querySelectorAll(".w"), {opacity:1, stagger:.08, ease:"none", scrollTrigger:{trigger:el, start:"top 80%", end:"bottom 50%", scrub:true}});
  });
  gsap.from(".facts > div", {y:40, opacity:0, stagger:.12, duration:.8, scrollTrigger:{trigger:".facts", start:"top 88%"}});

  /* Band, Zähler */
  gsap.fromTo(".mq span", {xPercent:0}, {xPercent:-33, ease:"none", scrollTrigger:{trigger:".stats", start:"top bottom", end:"bottom top", scrub:true}});
  document.querySelectorAll("[data-n]").forEach(function(el){
    var n = +el.dataset.n, o = {v:0};
    ScrollTrigger.create({trigger:el, start:"top 90%", once:true, onEnter:function(){ gsap.to(o, {v:n, duration:1.6, ease:"power2.out", onUpdate:function(){ el.textContent = Math.round(o.v); }, onComplete:function(){ el.textContent = n; }}); }});
  });
  gsap.from(".st-grid > div", {y:60, opacity:0, stagger:.1, duration:.8, scrollTrigger:{trigger:".st-grid", start:"top 85%"}});

  /* Marke */
  gsap.from(".m-vis figure", {y:80, opacity:0, rotate:"+=6", stagger:.15, duration:1, ease:"back.out(1.4)", scrollTrigger:{trigger:".m-vis", start:"top 80%"}});
  gsap.from(".cast-row figure", {y:70, opacity:0, stagger:.1, duration:.8, ease:"power3.out", scrollTrigger:{trigger:".cast-row", start:"top 85%"}});
  gsap.from(".stand-g figure", {y:60, opacity:0, stagger:.12, duration:.8, scrollTrigger:{trigger:".stand-g", start:"top 88%"}});

  /* Produkt Reihen laufen gegeneinander (Handy: eigene Wischleiste) */
  if (!calm){
    gsap.fromTo(".produkt .r1 > div", {x:0}, {x:function(){ return -(document.querySelector(".produkt .r1 > div").scrollWidth - innerWidth) - 10; }, ease:"none", scrollTrigger:{trigger:".produkt", start:"top bottom", end:"bottom top", scrub:true, invalidateOnRefresh:true}});
    gsap.fromTo(".produkt .r2 > div", {x:function(){ return -(document.querySelector(".produkt .r2 > div").scrollWidth - innerWidth) - 10; }}, {x:0, ease:"none", scrollTrigger:{trigger:".produkt", start:"top bottom", end:"bottom top", scrub:true, invalidateOnRefresh:true}});
  }

  /* Baukasten und Kiosk: das Handy bleibt stehen, die Bildschirme wechseln beim Scrollen */
  var shots = gsap.utils.toArray(".kiosk .phone-in img"), steps = gsap.utils.toArray(".k-steps li");
  function showShot(i){
    shots.forEach(function(im, k){ gsap.to(im, {opacity: k === i ? 1 : 0, duration:.35, overwrite:true}); });
    steps.forEach(function(s, k){ s.classList.toggle("on", k === i); });
  }
  showShot(0);
  if (!calm){
    ScrollTrigger.create({trigger:".kiosk", start:"top top", end:"+=2800", pin:".k-pin", scrub:true, onUpdate:function(self){ showShot(Math.min(shots.length - 1, Math.floor(self.progress * shots.length * .999))); }});
  } else {
    ScrollTrigger.create({trigger:".kiosk .phone", start:"top 80%", end:"bottom 15%", onUpdate:function(self){ showShot(Math.min(shots.length - 1, Math.floor(self.progress * shots.length * .999))); }});
  }

  /* Paket Karten */
  gsap.from(".bk", {y:60, opacity:0, stagger:{each:.04, from:"start"}, duration:.7, ease:"power3.out", scrollTrigger:{trigger:".pk-grid", start:"top 85%"}});

  /* Unterlagen horizontal (Pin nur auf dem Desktop) */
  if (!calm){
    var pin = document.querySelector(".d-pin");
    var dist = function(){ return Math.max(0, pin.scrollWidth - innerWidth); };
    gsap.to(pin, {x:function(){ return -dist(); }, ease:"none", scrollTrigger:{trigger:".decks", start:"top top", end:function(){ return "+=" + dist(); }, pin:true, scrub:true, invalidateOnRefresh:true}});
  }

  /* Marketing Streifen, Laden */
  if (!calm) gsap.fromTo(".strip-in", {x:0}, {x:function(){ return -(document.querySelector(".strip-in").scrollWidth - innerWidth) - 10; }, ease:"none", scrollTrigger:{trigger:".strip", start:"top bottom", end:"bottom top", scrub:true, invalidateOnRefresh:true}});
  gsap.from(".la-grid figure", {y:70, opacity:0, stagger:.08, duration:.8, ease:"power3.out", scrollTrigger:{trigger:".la-grid", start:"top 88%"}});

  /* Zahlen, Angebot, Ehrlich, Ablauf, Kontakt */
  gsap.from(".zc, .fall", {y:50, opacity:0, stagger:.08, duration:.8, ease:"power3.out", scrollTrigger:{trigger:".z-r", start:"top 85%"}});
  gsap.from(".ac", {y:80, opacity:0, stagger:.12, duration:.9, ease:"power3.out", scrollTrigger:{trigger:".a-grid", start:"top 88%"}});
  gsap.from(".eh-list li", {x:-50, opacity:0, stagger:.08, duration:.7, scrollTrigger:{trigger:".eh-list", start:"top 85%"}});
  gsap.from(".steps li", {y:60, opacity:0, stagger:.12, duration:.8, scrollTrigger:{trigger:".steps", start:"top 88%"}});
  gsap.from(".k-logo", {scale:.7, rotate:-8, opacity:0, ease:"back.out(2)", duration:1.1, scrollTrigger:{trigger:".kontakt", start:"top 70%"}});

  /* Anker, auch mit weichem Scrollen */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click", function(e){
      var t = document.querySelector(a.getAttribute("href")); if (!t) return; e.preventDefault();
      if (smoother) smoother.scrollTo(t, true, "top top+=" + 60); else t.scrollIntoView({behavior:"smooth"});
    });
  });

  /* Bilder nicht lazy: nach dem Decode Pins neu berechnen */
  function settle(){ ScrollTrigger.refresh(); }
  Promise.all([].slice.call(document.images).map(function(i){ return i.decode ? i.decode().catch(function(){}) : Promise.resolve(); })).then(settle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  addEventListener("load", function(){ settle(); setTimeout(settle, 1200); });
})();
