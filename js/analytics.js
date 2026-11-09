/* =====================================================================
   MSM Design Studio — analytics and lead tracking (vanilla JS)

   1. Paste your IDs below. Until then nothing is loaded or sent.
      - GA4:     analytics.google.com > Admin > Data streams > Web > Measurement ID (G-XXXXXXXXXX)
      - Clarity: clarity.microsoft.com > project > Settings > Overview > Project ID
   2. In GA4 > Admin > Events, mark these as key events (conversions):
      generate_lead, whatsapp_click, call_click, estimate_whatsapp
   ===================================================================== */
(function () {
  'use strict';

  var GA4_ID = '';      // e.g. 'G-AB12CD34EF'
  var CLARITY_ID = '';  // e.g. 'k2abc3def4'

  /* ---------- load the tools (only when an ID is set) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (GA4_ID) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(g);
    gtag('js', new Date());
    gtag('config', GA4_ID);
  }
  if (CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  function track(name, params) {
    params = params || {};
    if (GA4_ID) gtag('event', name, params);
    if (CLARITY_ID && window.clarity) window.clarity('event', name);
  }
  window.msmTrack = track;

  /* ---------- where did this visitor come from? (first visit wins) ---------- */
  var SRC_KEY = 'msm_source';
  function readSource() {
    try { return JSON.parse(localStorage.getItem(SRC_KEY) || 'null'); } catch (e) { return null; }
  }
  (function rememberSource() {
    if (readSource()) return;
    var q = new URLSearchParams(location.search);
    var ref = document.referrer && document.referrer.indexOf(location.host) === -1 ? document.referrer : '';
    var src = {
      source: q.get('utm_source') || (ref ? new URL(ref).hostname : 'direct'),
      medium: q.get('utm_medium') || (ref ? 'referral' : 'none'),
      campaign: q.get('utm_campaign') || '',
      landing: location.pathname + location.hash,
      date: new Date().toISOString().slice(0, 10)
    };
    try { localStorage.setItem(SRC_KEY, JSON.stringify(src)); } catch (e) { /* private mode: skip */ }
  })();

  /* what the visitor looked at, sent along with a form enquiry */
  var interest = { project: '', room: '', estimate: '' };

  function sectionOf(el) {
    var s = el.closest('section[id], header, footer, .action-bar');
    if (!s) return 'page';
    if (s.classList.contains('action-bar')) return 'mobile-bar';
    return s.id || s.tagName.toLowerCase();
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* contact taps */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      var where = sectionOf(a);
      if (href.indexOf('wa.me/') !== -1) {
        if (a.id === 'estCta') track('estimate_whatsapp', { location: where, estimate: interest.estimate });
        else track('whatsapp_click', { location: where, project: interest.project, room: interest.room });
      } else if (href.indexOf('tel:') === 0) track('call_click', { location: where });
      else if (href.indexOf('mailto:') === 0) track('email_click', { location: where });
      else if (/\.pdf$/i.test(href)) track('rate_pdf_download', { file: href.split('/').pop() });
      else if (/instagram|youtube|facebook/.test(href)) track('social_click', { network: (href.match(/instagram|youtube|facebook/) || [''])[0], location: where });
    }, true);

    /* render vs reality: which project, did they drag, did they share */
    document.addEventListener('click', function (e) {
      var pick = e.target.closest('.case-pick');
      if (pick) {
        interest.project = (pick.getAttribute('aria-label') || '').replace(/^Show /, '');
        track('case_view', { project: interest.project });
      }
      if (e.target.closest('#caseShare')) track('share', { method: navigator.share ? 'native' : 'whatsapp', content_type: 'render_vs_reality', item_id: (document.getElementById('caseTitle') || {}).textContent });
      var room = e.target.closest('[data-room]');
      if (room) { interest.room = room.textContent.trim(); track('room_view', { room: interest.room }); }
      var f = e.target.closest('.filter[data-filter]');
      if (f) track('portfolio_filter', { filter: f.getAttribute('data-filter') });
      var gal = e.target.closest('[data-gallery]');
      if (gal) track('gallery_open', { gallery: gal.getAttribute('data-gallery') });
      var tab = e.target.closest('.rate-tab, .seg-btn');
      if (tab) track('pricing_tab', { tab: tab.getAttribute('data-tab') || tab.getAttribute('data-mode') });
    }, true);
    var range = document.querySelector('#caseBa .ba-range');
    if (range) range.addEventListener('input', function once() {
      track('case_slider_drag', { project: (document.getElementById('caseTitle') || {}).textContent });
      range.removeEventListener('input', once);
    });

    /* estimator: record the final estimate shown (debounced) */
    var est = document.getElementById('estValue');
    if (est) {
      var timer;
      ['estType', 'estTier', 'estArea', 'estToilets'].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', function () {
          clearTimeout(timer);
          timer = setTimeout(function () {
            var type = document.getElementById('estType'), tier = document.getElementById('estTier');
            interest.estimate = (type.options[type.selectedIndex] || {}).text + ' · ' +
              (tier.options[tier.selectedIndex] || {}).text + ' · ' + document.getElementById('estArea').value + ' sq ft · ' + est.textContent;
            track('estimate_view', { project_type: type.value, package: (tier.options[tier.selectedIndex] || {}).text, area: Number(document.getElementById('estArea').value) || 0 });
          }, 800);
        });
      });
    }

    /* contact form: attach source + interest so every enquiry arrives with context */
    var form = document.getElementById('contactForm');
    if (form) {
      form.addEventListener('submit', function () {
        var src = readSource() || {};
        var set = function (name, value) {
          var el = form.querySelector('input[name="' + name + '"]');
          if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
          el.value = value || '';
        };
        set('lead_source', [src.source, src.medium, src.campaign].filter(Boolean).join(' / '));
        set('first_visit', (src.date || '') + ' ' + (src.landing || ''));
        set('interested_in', [interest.project && 'Project: ' + interest.project, interest.room && 'Room: ' + interest.room, interest.estimate && 'Estimate: ' + interest.estimate].filter(Boolean).join(' | '));
      }, true);
    }
    document.addEventListener('msm:lead', function (e) {
      track('generate_lead', { method: (e.detail && e.detail.method) || 'form', service: (e.detail && e.detail.service) || '' });
    });
  });
})();
