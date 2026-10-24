/* Blueribbon builders site v2. Vanilla JS, no dependencies.
   Progressive enhancement: with JS off the page is fully readable. */
(function () {
  'use strict';

  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = w.matchMedia && w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in w;

  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }

  /* analytics stub: events queue until the tag loads after the page is idle */
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  function track(name, params) { try { w.gtag('event', name, params || {}); } catch (e) {} }

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- split headings into masked words ---------- */
  var wordIndex;
  function splitNode(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var parts = n.nodeValue.split(/(\s+)/), frag = d.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
          var outer = d.createElement('span'), inner = d.createElement('span');
          outer.className = 'w'; inner.textContent = p;
          inner.style.setProperty('--k', wordIndex++);
          outer.appendChild(inner); frag.appendChild(outer);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) { splitNode(n); }
    });
  }
  $$('.split').forEach(function (el) {
    if ($('.w', el)) return; // already split by the inline script
    wordIndex = 0;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    splitNode(el);
    $$('.w', el).forEach(function (x) { x.setAttribute('aria-hidden', 'true'); });
  });

  /* ---------- nav state ---------- */
  var nav = $('#nav'), mcta = $('#m-cta'), hero = $('#home');
  var contactVisible = false, ticking = false, db = $('#db'), stage = $('#stage');
  var tiltOn = !reduce && w.innerWidth > 1180;

  function frame() {
    var y = w.pageYOffset || d.documentElement.scrollTop;
    if (nav) nav.classList.toggle('scrolled', y > 30);
    if (mcta) mcta.classList.toggle('show', y > (hero ? hero.offsetHeight * 0.6 : 600) && !contactVisible);
    if (db && stage && tiltOn) {
      // dashboard starts tipped back and settles flat as it scrolls into view
      var r = stage.getBoundingClientRect(), vh = w.innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.95 + r.height * 0.1)));
      db.style.setProperty('--r', (12 * (1 - p)).toFixed(2));
    }
    ticking = false;
  }
  function onScroll() { if (!ticking) { ticking = true; w.requestAnimationFrame(frame); } }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', function () { tiltOn = !reduce && w.innerWidth > 1180; onScroll(); }, { passive: true });
  frame();

  /* ---------- mobile nav ---------- */
  var toggle = $('#nav-toggle'), links = $('#nav-links');
  function setNav(open) {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () { setNav(!links.classList.contains('open')); });
    $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  }

  /* ---------- scroll reveal (+ word-split headings) ---------- */
  var revealEls = $$('[data-reveal], .split');
  function show(el) { el.classList.add('in-view'); }
  var hero1 = $('.hero h1');
  if (hero1) { w.requestAnimationFrame(function () { w.requestAnimationFrame(function () { hero1.style.setProperty('--sd', '150ms'); show(hero1); }); }); }
  if (hasIO && !reduce) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); rio.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { if (el !== hero1) rio.observe(el); });
  } else {
    revealEls.forEach(show);
  }

  /* ---------- count-up numbers ---------- */
  function fmt(v, el) {
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    return (el.getAttribute('data-prefix') || '') + v.toFixed(dec) + (el.getAttribute('data-suffix') || '');
  }
  function count(el, delay) {
    var to = parseFloat(el.getAttribute('data-count'));
    if (isNaN(to)) return;
    if (reduce) { el.textContent = fmt(to, el); return; }
    el.textContent = fmt(0, el);
    setTimeout(function () {
      var t0 = null, dur = 1800;
      (function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), el);
        if (p < 1) w.requestAnimationFrame(step);
      })(w.performance.now());
    }, delay || 0);
  }

  /* ---------- hero stage: run the entrance when it scrolls into view ---------- */
  if (stage) {
    var started = false;
    var go = function () {
      if (started) return; started = true;
      stage.classList.add('go');
      $$('[data-count]', stage).forEach(function (el, i) { count(el, 1500 + i * 120); });
    };
    if (hasIO && !reduce) {
      new IntersectionObserver(function (entries, o) {
        if (entries[0].isIntersecting) { go(); o.disconnect(); }
      }, { threshold: 0.18 }).observe(stage);
    } else { go(); }
  }

  /* ---------- spotlight on glass cards (mouse only) ---------- */
  if (finePointer && !reduce) {
    $$('.glass').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ---------- hide sticky CTA while the contact section is on screen ---------- */
  var endEls = $$('#contact, #question, .foot-panel'), endSeen = {};
  if (endEls.length && hasIO) {
    var eio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { endSeen[en.target.id || 'foot'] = en.isIntersecting; });
      contactVisible = Object.keys(endSeen).some(function (k) { return endSeen[k]; });
      frame();
    }, { threshold: 0.05 });
    endEls.forEach(function (el) { eio.observe(el); });
  }

  /* ---------- testimonials widget: load only when near the viewport ---------- */
  var fame = $('.famewall-embed');
  function loadFame() {
    if ($('script[data-famewall-loaded]')) return;
    var s = d.createElement('script');
    s.src = 'https://embed.famewall.io/newFrame.js';
    s.setAttribute('data-famewall-loaded', '1');
    d.body.appendChild(s);
  }
  if (fame) {
    if (hasIO) {
      var fio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { loadFame(); fio.disconnect(); }
      }, { rootMargin: '600px 0px' });
      fio.observe(fame);
    } else { loadFame(); }
  }

  /* ---------- contact form (Web3Forms) ---------- */
  var form = $('#qform'), status = $('#fstatus');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending...';
      status.className = 'status'; status.textContent = '';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!(res.ok && res.j.success)) throw new Error(res.j.message || 'failed');
          form.reset();
          status.className = 'status ok';
          status.textContent = "Thanks, I've got your details. Want to skip the wait? ";
          var a = d.createElement('a');
          a.href = 'https://tidycal.com/royce/30-minute-meeting';
          a.textContent = 'Book a time now.';
          a.setAttribute('data-book', 'form-success');
          status.appendChild(a);
          track('builder_inquiry', { method: 'form' });
        })
        .catch(function () {
          status.className = 'status err';
          status.textContent = 'Something went wrong. Please email royce@blueribbonanalytics.com instead.';
        })
        .then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  /* ---------- booking click tracking (delegated) ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-book]');
    if (a) track('book_call_click', { location: a.getAttribute('data-book') });
  });

  /* ---------- consent + analytics: nothing third-party tracks until the visitor accepts ---------- */
  var KEY = 'br_consent', consentEl = $('#consent'), gaLoaded = false;
  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    if (gaLoaded) return; gaLoaded = true;
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-GEXEQWJWHE';
    d.head.appendChild(s);
    w.gtag('js', new Date());
    w.gtag('config', 'G-GEXEQWJWHE');
  }
  function showBanner(v) { if (consentEl) consentEl.hidden = !v; }
  function decide(v) { setConsent(v); showBanner(false); if (v === 'granted') loadGA(); }
  if (consentEl) {
    $('#consent-yes').addEventListener('click', function () { decide('granted'); });
    $('#consent-no').addEventListener('click', function () { decide('denied'); });
    var again = $('#consent-open'); if (again) again.addEventListener('click', function () { showBanner(true); });
  }
  w.addEventListener('load', function () {
    var c = getConsent();
    if (c === 'granted') { (w.requestIdleCallback || setTimeout)(loadGA, 2000); }
    else if (c !== 'denied') { setTimeout(function () { showBanner(true); }, 1800); }
  });
})();
