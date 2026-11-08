/* MSM Design Studio — rate chart tabs + quick estimator (vanilla JS)
   Used on index.html (estimator only) and pricing.html (tabs + estimator). */
(function () {
  'use strict';
  var WA = 'https://wa.me/918282938283';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- tabs (pricing.html) ---------- */
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.rate-tab'));
    function show(key, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === key;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById('panel-' + t.getAttribute('data-tab'));
        if (p) p.hidden = !on;
        if (on && focus) t.focus();
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        show(t.getAttribute('data-tab'));
        history.replaceState(null, '', '#' + t.getAttribute('data-tab'));
      });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); show(tabs[n].getAttribute('data-tab'), true); }
      });
    });
    function fromHash() {
      var m = /^#(?:rates-)?(construction|interior|design|labour)$/.exec(location.hash);
      if (m && tabs.length) show(m[1]);
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);

    /* ---------- estimator ---------- */
    var typeEl = document.getElementById('estType');
    if (!typeEl) return;
    var tierEl = document.getElementById('estTier');
    var areaEl = document.getElementById('estArea');
    var toiletEl = document.getElementById('estToilets');
    var toiletWrap = document.getElementById('estToiletWrap');
    var areaLbl = document.getElementById('estAreaLbl');
    var valEl = document.getElementById('estValue');
    var metaEl = document.getElementById('estMeta');
    var cta = document.getElementById('estCta');

    var DATA = {
      construction: {
        label: 'Construction',
        areaLabel: 'Built-up area (sq ft)',
        tiers: [
          { name: 'Essential', lo: 1800, hi: 1950 },
          { name: 'Signature (Recommended)', lo: 2150, hi: 2350 },
          { name: 'Luxe', lo: 2750, hi: 3200 },
          { name: 'Architect Signature', lo: 3500, hi: null }
        ],
        note: 'Material + labour, RCC residential with a normal foundation. Excludes approvals, soil testing, compound wall, lift and interiors.'
      },
      interior: {
        label: 'Turnkey interiors',
        areaLabel: 'Carpet area (sq ft)',
        tiers: [
          { name: 'Essential', lo: 1400, hi: 1600, bath: 125000 },
          { name: 'Signature (Recommended)', lo: 1800, hi: 2000, bath: 185000 },
          { name: 'Luxe', lo: 2200, hi: 2400, bath: 275000 }
        ],
        note: 'Design, materials, execution and supervision on carpet area. Bathrooms charged separately (starting prices). Civil alterations quoted separately.'
      }
    };

    function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

    function fillTiers() {
      var d = DATA[typeEl.value];
      var prev = tierEl.selectedIndex;
      tierEl.innerHTML = '';
      d.tiers.forEach(function (t, i) {
        var o = document.createElement('option');
        o.value = i; o.textContent = t.name;
        tierEl.appendChild(o);
      });
      tierEl.selectedIndex = (prev > 0 && prev < d.tiers.length) ? prev : 1;
      areaLbl.textContent = d.areaLabel;
      toiletWrap.hidden = typeEl.value !== 'interior';
    }

    function calc() {
      var d = DATA[typeEl.value];
      var t = d.tiers[tierEl.selectedIndex] || d.tiers[0];
      var area = parseFloat(areaEl.value);
      if (!(area > 0)) {
        valEl.textContent = '—';
        metaEl.textContent = 'Enter your area to see an estimate.';
        cta.href = WA + '?text=' + encodeURIComponent('Hi MSM Design, I\'d like a quotation for a project.');
        return;
      }
      var lo = t.lo * area, hi = t.hi ? t.hi * area : null;
      var toilets = 0;
      if (typeEl.value === 'interior') {
        toilets = Math.max(0, parseInt(toiletEl.value, 10) || 0);
        lo += toilets * t.bath;
        hi += toilets * t.bath;
      }
      valEl.textContent = hi === null ? 'From ' + inr(lo) : inr(lo) + ' – ' + inr(hi);
      var parts = [area.toLocaleString('en-IN') + ' sq ft × ' + inr(t.lo) + (t.hi ? '–' + inr(t.hi).replace('₹', '') : '+') + ' / sq ft'];
      if (toilets) parts.push(toilets + ' toilet' + (toilets > 1 ? 's' : '') + ' × ' + inr(t.bath) + ' onwards');
      metaEl.textContent = '';
      parts.concat(['GST extra. ' + d.note]).forEach(function (line, i) {
        if (i) metaEl.appendChild(document.createElement('br'));
        metaEl.appendChild(document.createTextNode(line));
      });
      var summary = d.label + ' · ' + t.name.replace(' (Recommended)', '') + ' package · ' +
        area.toLocaleString('en-IN') + ' sq ft' + (toilets ? ' · ' + toilets + ' toilets' : '') +
        ' · estimate ' + valEl.textContent + ' + GST';
      cta.href = WA + '?text=' + encodeURIComponent('Hi MSM Design, I used the estimator on your website:\n' + summary + '\nPlease share a detailed quotation.');
    }

    typeEl.addEventListener('change', function () { tierEl.selectedIndex = 1; fillTiers(); calc(); });
    [tierEl, areaEl, toiletEl].forEach(function (el) {
      el.addEventListener('input', calc);
      el.addEventListener('change', calc);
    });
    fillTiers();
    calc();
  });
})();
