/* =====================================================================
   MSM Design Studio — site scripts (vanilla JS, no dependencies)
   ===================================================================== */
(function () {
  'use strict';

  var RES = 'resources/';
  var WA = 'https://wa.me/918282938283';

  /* Image lists live in js/gallery-data.js (descriptive file names, alt text, thumb sizes). */
  var GALLERIES = {};
  var SRC = window.MSM_GALLERIES || {};
  Object.keys(SRC).forEach(function (k) {
    GALLERIES[k] = {
      title: SRC[k].title,
      images: SRC[k].images.map(function (im) {
        return { src: RES + im.path + '.webp', thumb: RES + 'thumbs/' + im.path + '.webp', alt: im.alt, w: im.w, h: im.h, room: im.room };
      })
    };
  });
  /* near-duplicate shots: kept in their own category, skipped in the mixed "All" view */
  var SKIP_IN_ALL = [
    'projects/residential/marble-hall-cove-ceiling', 'projects/commercial/cafe-planter-table-front',
    'projects/commercial/office-workstations-wide', 'projects/commercial/office-cabin-and-workstations',
    'models/tower-model-day-side', 'models/wooden-house-model-side', 'models/wooden-house-model-corner',
    'interiors/kitchen-grey-compact', 'visualization/bathroom-red-tile-window', 'visualization/bathroom-walnut-window',
    'visualization/living-room-starlight-ceiling', 'projects/hospitality/guest-bathroom'
  ];
  var CASES = window.MSM_CASES || [];
  var SITE = 'https://msm-design.in/';
  var ORDER = ['residential', 'commercial', 'hospitality', 'interiors', 'elevation', 'architecture', 'visualization', 'models']
    .filter(function (k) { return GALLERIES[k]; });

  document.addEventListener('DOMContentLoaded', function () {

    var yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();

    /* ---------- header on scroll ---------- */
    var header = document.getElementById('header');
    function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- mobile nav ---------- */
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    function setNav(open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', function () { setNav(!links.classList.contains('open')); });
    links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('open')) { setNav(false); toggle.focus(); } });

    /* ---------- lightbox ---------- */
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbTitle = document.getElementById('lbTitle');
    var lbCount = document.getElementById('lbCount');
    var current = { key: null, images: [], i: 0 };
    var lastFocus = null;

    function renderLb() {
      var img = current.images[current.i];
      lbImg.src = img.src;
      lbImg.alt = img.alt || (GALLERIES[current.key].title + ', image ' + (current.i + 1));
      lbCount.textContent = (current.i + 1) + ' / ' + current.images.length;
      /* preload neighbour */
      var next = current.images[(current.i + 1) % current.images.length];
      if (next) { var p = new Image(); p.src = next.src; }
    }
    function openLb(key, start) {
      var g = GALLERIES[key];
      if (!g || !lb) return;
      current.key = key;
      current.images = g.images;
      current.i = Math.min(Math.max(start || 0, 0), g.images.length - 1);
      lbTitle.textContent = g.title;
      renderLb();
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      document.getElementById('lbClose').focus();
    }
    function closeLb() {
      lb.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    function step(d) {
      current.i = (current.i + d + current.images.length) % current.images.length;
      renderLb();
    }
    if (lb) {
      document.getElementById('lbClose').addEventListener('click', closeLb);
      document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
      document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
      document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') closeLb();
        else if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
        else if (e.key === 'Tab') {
          var f = lb.querySelectorAll('button');
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      /* swipe on touch */
      var sx = null;
      lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        sx = null;
      });
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-gallery]');
      if (!t) return;
      e.preventDefault();
      openLb(t.getAttribute('data-gallery'), parseInt(t.getAttribute('data-start') || '0', 10));
    });

    /* ---------- portfolio wall ---------- */
    var wall = document.getElementById('wall');
    var moreBtn = document.getElementById('wallMore');
    var PAGE = 18;
    var wallState = { filter: 'all', shown: PAGE };

    function wallItems(filter) {
      var items = [];
      if (filter === 'all') {
        /* interleave categories so "All" shows variety first */
        var max = 0;
        ORDER.forEach(function (k) { max = Math.max(max, GALLERIES[k].images.length); });
        for (var i = 0; i < max; i++) {
          ORDER.forEach(function (k) {
            var im = GALLERIES[k].images[i];
            if (im && SKIP_IN_ALL.indexOf(im.src.replace(RES, '').replace('.webp', '')) === -1) items.push({ key: k, i: i, img: im });
          });
        }
      } else {
        GALLERIES[filter].images.forEach(function (img, i) { items.push({ key: filter, i: i, img: img }); });
      }
      return items;
    }
    function renderWall() {
      if (!wall) return;
      var items = wallItems(wallState.filter);
      var frag = document.createDocumentFragment();
      wall.innerHTML = '';
      items.slice(0, wallState.shown).forEach(function (it) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'tile';
        b.setAttribute('data-gallery', it.key);
        b.setAttribute('data-start', it.i);
        b.setAttribute('aria-label', 'Open ' + it.img.alt.toLowerCase() + ' (' + GALLERIES[it.key].title + ')');
        /* keep each image's own proportions: tiles grow in a row by their aspect ratio */
        var ratio = it.img.w && it.img.h ? (it.img.w / it.img.h) : 0.8;
        b.style.setProperty('--ar', ratio.toFixed(3));
        var im = document.createElement('img');
        im.src = it.img.thumb;
        im.alt = '';
        if (it.img.w) { im.width = it.img.w; im.height = it.img.h; }
        im.loading = 'lazy';
        im.decoding = 'async';
        b.appendChild(im);
        frag.appendChild(b);
      });
      wall.appendChild(frag);
      moreBtn.hidden = items.length <= wallState.shown;
    }
    if (wall) {
      document.querySelectorAll('.filter[data-filter]').forEach(function (f) {
        f.addEventListener('click', function () {
          document.querySelectorAll('.filter[data-filter]').forEach(function (o) {
            var on = o === f;
            o.classList.toggle('is-active', on);
            o.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          wallState.filter = f.getAttribute('data-filter');
          wallState.shown = PAGE;
          renderWall();
        });
      });
      moreBtn.addEventListener('click', function () { wallState.shown += PAGE; renderWall(); });
      renderWall();
    }

    /* ---------- process: active step drives the sticky image ---------- */
    var steps = document.querySelectorAll('.step');
    var stageImgs = document.querySelectorAll('.stage-frame img');
    if (steps.length && 'IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var idx = parseInt(en.target.getAttribute('data-step'), 10);
          steps.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
          stageImgs.forEach(function (im, i) { im.classList.toggle('is-active', i === idx); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      steps.forEach(function (s) { so.observe(s); });
    }

    /* ---------- render vs built sliders ---------- */
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.ba').forEach(function (ba) {
      var r = ba.querySelector('.ba-range');
      if (!r) return;
      function set() { ba.style.setProperty('--pos', r.value + '%'); }
      r.addEventListener('input', function () { ba.classList.add('is-touched'); set(); });
      set();
      /* one gentle sweep the first time it scrolls into view, so people see it moves */
      if (!reduceMotion && 'IntersectionObserver' in window) {
        var seen = new IntersectionObserver(function (en) {
          if (!en[0].isIntersecting) return;
          seen.disconnect();
          var keys = [50, 22, 78, 50], k = 0;
          ba.classList.add('is-sweeping');
          (function next() {
            if (ba.classList.contains('is-touched') || k >= keys.length) { ba.classList.remove('is-sweeping'); return; }
            r.value = keys[k++]; set();
            setTimeout(next, 700);
          })();
        }, { threshold: 0.6 });
        seen.observe(ba);
      }
    });

    /* ---------- render vs reality: project picker + share ---------- */
    var picker = document.getElementById('casePicker');
    if (picker && CASES.length) {
      var caseRender = document.getElementById('caseRender');
      var caseBuilt = document.getElementById('caseBuilt');
      var caseTitle = document.getElementById('caseTitle');
      var caseKicker = document.getElementById('caseKicker');
      var caseQuote = document.getElementById('caseQuote');
      var caseBa = document.getElementById('caseBa');
      var caseRange = caseBa.querySelector('.ba-range');
      var currentCase = 0;
      var caseSrc = function (c, n) { return RES + 'case-studies/' + c.slug + '/' + n + '.webp'; };
      var showCase = function (i) {
        var c = CASES[i]; currentCase = i;
        caseRender.src = caseSrc(c, 'render'); caseRender.alt = '3D render: ' + c.title.toLowerCase();
        caseBuilt.src = caseSrc(c, 'built'); caseBuilt.alt = 'Finished building: ' + c.title.toLowerCase();
        caseTitle.textContent = c.title; caseKicker.textContent = c.kicker;
        caseQuote.href = WA + '?text=' + encodeURIComponent('Hi MSM Design, I saw "' + c.title + '" in your render vs reality projects. I would like to plan something similar.');
        caseRange.value = 50; caseBa.style.setProperty('--pos', '50%');
        picker.querySelectorAll('button').forEach(function (b, j) {
          b.classList.toggle('is-active', j === i);
          b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
        });
        var n = CASES[(i + 1) % CASES.length];
        new Image().src = caseSrc(n, 'render'); new Image().src = caseSrc(n, 'built');
      };
      CASES.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'case-pick';
        b.setAttribute('aria-label', 'Show ' + c.title);
        var im = document.createElement('img');
        im.src = RES + 'thumbs/case-studies/' + c.slug + '/built.webp'; im.alt = ''; im.loading = 'lazy';
        b.appendChild(im);
        b.addEventListener('click', function () { showCase(i); });
        picker.appendChild(b);
      });
      showCase(0);

      document.getElementById('caseShare').addEventListener('click', function () {
        var c = CASES[currentCase];
        var url = SITE + '#render-vs-real';
        var text = '3D render vs the finished building: ' + c.title + ' by MSM Design Studio, Kolkata.';
        if (navigator.share) {
          navigator.share({ title: 'Render vs reality · MSM Design Studio', text: text, url: url }).catch(function () {});
        } else {
          window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
        }
      });
    }

    /* ---------- room explorer ---------- */
    var roomGrid = document.getElementById('roomGrid');
    if (roomGrid && GALLERIES.interiors) {
      var ROOMS = {
        bedroom:  ['Bedrooms', 'Fluted panels, upholstered headboards and wardrobes that disappear into the wall.', 'bedroom'],
        kitchen:  ['Modular kitchens', 'Soft-close storage, quartz tops and under-cabinet lighting, planned around how you cook.', 'kitchen'],
        living:   ['Living rooms', 'TV walls, cove ceilings and seating planned for the whole family.', 'living room'],
        kids:     ["Kids' rooms", 'Study desks, bookshelves and storage that grow with your child.', "kid's room"],
        dining:   ['Dining', 'Display units and lighting that make everyday dinners feel like an occasion.', 'dining area'],
        bath:     ['Bathrooms', 'Glass showers, wall-hung fittings and warm vanity lighting.', 'bathroom'],
        balcony:  ['Balconies', 'Swings, planters and screens that turn a balcony into another room.', 'balcony'],
        wardrobe: ['Wardrobes & dressing', 'Walk-in storage with glass shutters and lit shelves.', 'wardrobe']
      };
      var roomTitle = document.getElementById('roomTitle');
      var roomText = document.getElementById('roomText');
      var roomCount = document.getElementById('roomCount');
      var roomWa = document.getElementById('roomWa');
      var showRoom = function (room) {
        var items = [];
        GALLERIES.interiors.images.forEach(function (im, i) { if (im.room === room) items.push({ im: im, i: i }); });        roomGrid.innerHTML = '';
        roomGrid.className = 'room-grid room-grid--' + Math.min(items.length, 4);
        items.slice(0, 4).forEach(function (it, k) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = k ? 'room-thumb' : 'room-main';
          b.setAttribute('data-gallery', 'interiors'); b.setAttribute('data-start', it.i);
          b.setAttribute('aria-label', 'Open ' + it.im.alt.toLowerCase());
          var img = document.createElement('img');
          img.src = k ? it.im.thumb : it.im.src; img.alt = it.im.alt; img.decoding = 'async';
          b.appendChild(img); roomGrid.appendChild(b);
        });
        var t = ROOMS[room];
        roomTitle.textContent = t[0]; roomText.textContent = t[1];
        roomCount.textContent = items.length + (items.length === 1 ? ' design' : ' designs') + ' to explore';
        roomWa.href = WA + '?text=' + encodeURIComponent('Hi MSM Design, I am planning my ' + t[2] + '. Can we talk about ideas and budget?');
        document.querySelectorAll('[data-room]').forEach(function (c) {
          var on = c.getAttribute('data-room') === room;
          c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      };
      document.querySelectorAll('[data-room]').forEach(function (c) {
        c.addEventListener('click', function () { showRoom(c.getAttribute('data-room')); });
      });
      showRoom('bedroom');
      var roomEst = document.getElementById('roomEstimate');
      if (roomEst) roomEst.addEventListener('click', function () {
        var seg = document.querySelector('.seg-btn[data-mode="interior"]');
        if (seg) seg.click();
      });
    }

    /* ---------- pricing: construction / interiors switch ---------- */
    var segs = document.querySelectorAll('.seg-btn');
    var estType = document.getElementById('estType');
    function setMode(mode, fromEstimator) {
      segs.forEach(function (b) {
        var on = b.getAttribute('data-mode') === mode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      document.querySelectorAll('[data-pkgs]').forEach(function (p) { p.hidden = p.getAttribute('data-pkgs') !== mode; });
      if (estType && !fromEstimator && estType.value !== mode) {
        estType.value = mode;
        estType.dispatchEvent(new Event('change'));
      }
    }
    segs.forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
    if (estType && segs.length) estType.addEventListener('change', function () { setMode(estType.value, true); });

    /* ---------- contact form ---------- */
    var form = document.getElementById('contactForm');
    if (!form) return;
    var status = document.getElementById('formStatus');
    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
    function setErr(id, on) {
      var el = document.getElementById(id);
      var err = document.getElementById(id + '-err');
      if (!el) return;
      el.closest('.field').classList.toggle('has-err', on);
      el.setAttribute('aria-invalid', on ? 'true' : 'false');
      if (err) { err.hidden = !on; if (on) el.setAttribute('aria-describedby', id + '-err'); }
    }
    function validate() {
      var bad = null;
      ['name', 'phone', 'message'].forEach(function (id) {
        var empty = !val(id);
        setErr(id, empty);
        if (empty && !bad) bad = id;
      });
      if (bad) { document.getElementById(bad).focus(); return null; }
      return { name: val('name'), phone: val('phone'), service: val('service'), message: val('message') };
    }
    ['name', 'phone', 'message'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { if (val(id)) setErr(id, false); });
    });
    function composeText(d) {
      var lines = ['Hi MSM Design, I\'d like to discuss a project.', '', 'Name: ' + d.name, 'Phone: ' + d.phone];
      if (d.service) lines.push('Service: ' + d.service);
      lines.push('', d.message);
      return lines.join('\n');
    }
    var waBtn = document.getElementById('sendWhatsApp');
    if (waBtn) waBtn.addEventListener('click', function () {
      var d = validate();
      if (!d) return;
      window.open(WA + '?text=' + encodeURIComponent(composeText(d)), '_blank', 'noopener');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = validate();
      if (!d) return;
      var btn = document.getElementById('sendMsg');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…';
      status.textContent = '';
      function fail() {
        btn.disabled = false; btn.textContent = label;
        status.textContent = 'That didn\'t send. Please try WhatsApp, or email us directly.';
      }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (res) {
          if (!res.ok) return fail();
          form.hidden = true;
          var thanks = document.getElementById('formThanks');
          if (thanks) thanks.hidden = false;
        })
        .catch(fail);
    });
  });
})();
