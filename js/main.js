/* =====================================================================
   MSM Design Studio — redesign scripts (vanilla JS, no dependencies)
   ===================================================================== */
(function () {
  'use strict';

  var RES = 'resources/';

  /* build a numbered image list, skipping any missing indices */
  function seq(dir, ext, from, to, skip) {
    var out = [], s = skip || [];
    for (var i = from; i <= to; i++) {
      if (s.indexOf(i) !== -1) continue;
      out.push(RES + dir + '/' + i + '.' + ext);
    }
    return out;
  }

  var GALLERIES = {
    residential: {
      title: 'Residential',
      images: seq('Featured_works/Residential', 'webp', 1, 9)
    },
    commercial: {
      title: 'Commercial',
      images: seq('Featured_works/Commercial', 'jpeg', 1, 9)
    },
    interior3d: {
      title: 'Interior Modelling & Rendering',
      images: seq('3d_software_modelling_and_rendering', 'webp', 1, 15, [3])
    },
    model3d: {
      title: '3D Software Modelling',
      images: seq('Featured_works/3D_Modelling_and_rending', 'webp', 1, 8)
    }
  };

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- year ---------- */
    var yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();

    /* ---------- header shadow on scroll ---------- */
    var header = document.getElementById('header');
    function onScroll() {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- mobile nav ---------- */
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    function closeNav() {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });

    /* ---------- hero crossfade slideshow ---------- */
    var slides = document.querySelectorAll('#heroSlides img');
    if (slides.length > 1) {
      var idx = 0;
      setInterval(function () {
        slides[idx].classList.remove('active');
        idx = (idx + 1) % slides.length;
        slides[idx].classList.add('active');
      }, 4500);
    }

    /* ---------- scroll reveal ---------- */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* ---------- lightbox gallery ---------- */
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbTitle = document.getElementById('lbTitle');
    var lbCount = document.getElementById('lbCount');
    var current = { images: [], i: 0 };

    function renderLb() {
      lbImg.src = current.images[current.i];
      lbCount.textContent = (current.i + 1) + ' / ' + current.images.length;
    }
    function openLb(key) {
      var g = GALLERIES[key];
      if (!g || !g.images.length) return;
      current.images = g.images;
      current.i = 0;
      lbTitle.textContent = g.title;
      renderLb();
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeLb() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
    }
    function step(d) {
      current.i = (current.i + d + current.images.length) % current.images.length;
      renderLb();
    }

    document.querySelectorAll('.work-card').forEach(function (card) {
      card.addEventListener('click', function () {
        openLb(card.getAttribute('data-gallery'));
      });
    });
    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });

    /* ---------- contact form: compose WhatsApp / email (free, no backend) ---------- */
    var form = document.getElementById('contactForm');

    function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

    function validate() {
      var name = val('name'), phone = val('phone'), msg = val('message');
      if (!name || !phone || !msg) {
        alert('Please add your name, phone and a short message so we can help.');
        return null;
      }
      return {
        name: name, phone: phone,
        email: val('email'), service: val('service'), message: msg
      };
    }

    function composeText(d) {
      var lines = [
        'New enquiry — MSM Design Studio',
        '',
        'Name: ' + d.name,
        'Phone: ' + d.phone
      ];
      if (d.email) lines.push('Email: ' + d.email);
      if (d.service) lines.push('Service: ' + d.service);
      lines.push('', 'Message:', d.message);
      return lines.join('\n');
    }

    var waBtn = document.getElementById('sendWhatsApp');
    if (waBtn) waBtn.addEventListener('click', function () {
      var d = validate();
      if (!d) return;
      var url = 'https://wa.me/918282938283?text=' + encodeURIComponent(composeText(d));
      window.open(url, '_blank', 'noopener');
    });

    /* primary submit -> Formspree (stays on page, shows inline thank-you) */
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = validate();
      if (!d) return;
      var btn = document.getElementById('sendMsg');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.hidden = true;
          var thanks = document.getElementById('formThanks');
          if (thanks) thanks.hidden = false;
        } else {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          alert('Sorry, something went wrong. Please try WhatsApp, or email us directly.');
        }
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        alert('Sorry, something went wrong. Please try WhatsApp, or email us directly.');
      });
    });
  });
})();