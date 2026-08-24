(function () {
  'use strict';

  /* figure out how many folders deep the current page is, to build a
     correct relative link back to the homepage booking section */
  var segments = window.location.pathname.split('/').filter(Boolean);
  var isHome = segments.length === 0 || (segments.length === 1 && segments[0] === 'index.html');
  var depth = Math.max(0, segments.length - 1);
  var prefix = '../'.repeat(depth);
  var href = isHome ? '#booking' : prefix + 'index.html#booking';

  var css = '#rr-booking-widget{position:fixed;bottom:24px;right:24px;z-index:600;display:flex;align-items:center;gap:8px;' +
    'background:#48627C;color:#fdfcf8;text-decoration:none;padding:14px 22px;border-radius:8px;' +
    'font-family:\'Inter\',sans-serif;font-size:15px;font-weight:400;letter-spacing:-0.01em;' +
    'box-shadow:0 6px 24px rgba(29,40,51,0.3);transition:background 0.2s ease;}' +
    '#rr-booking-widget:hover{background:#18334E;}' +
    '#rr-booking-widget svg{flex-shrink:0;}' +
    '@media (max-width:640px){#rr-booking-widget{right:16px;bottom:16px;padding:12px 18px;font-size:14px;}#rr-booking-widget .rr-bw-label{display:none;}}' +
    /* mobile pages already surface their own persistent "Записаться" CTAs
       (hero button, sticky footer pill) — the floating widget only adds a
       second, overlapping button on small screens, so it's hidden below
       the site's standard mobile breakpoint rather than repositioned. */
    '@media (max-width:767px){#rr-booking-widget{display:none !important;}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var a = document.createElement('a');
  a.id = 'rr-booking-widget';
  a.href = href;
  a.setAttribute('aria-label', 'Онлайн-запись');
  a.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4.5-4.5"/></svg><span class="rr-bw-label">Онлайн-запись</span>';
  document.body.appendChild(a);

  /* stop the widget at the level of the footer's own "Записаться на приём"
     button instead of floating over the copyright/podpisait row below it */
  function getStopAnchor() {
    var candidates = [document.querySelector('.footer-cta__btn'), document.querySelector('.mh-footer__pill')];
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] && candidates[i].offsetParent !== null) return candidates[i];
    }
    return null;
  }

  var ticking = false;
  function reposition() {
    ticking = false;
    var margin = window.matchMedia('(max-width:640px)').matches ? 16 : 24;
    var stopAnchor = getStopAnchor();
    if (!stopAnchor) {
      a.style.position = 'fixed';
      a.style.top = 'auto';
      a.style.bottom = margin + 'px';
      return;
    }
    var widgetH = a.offsetHeight;
    var rect = stopAnchor.getBoundingClientRect();
    var desiredDocTop = rect.bottom + window.scrollY - widgetH;
    var fixedDocTopEquivalent = window.scrollY + (window.innerHeight - margin - widgetH);
    if (desiredDocTop <= fixedDocTopEquivalent) {
      a.style.position = 'absolute';
      a.style.top = desiredDocTop + 'px';
      a.style.bottom = 'auto';
    } else {
      a.style.position = 'fixed';
      a.style.top = 'auto';
      a.style.bottom = margin + 'px';
    }
  }
  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(reposition);
    }
  }
  window.addEventListener('scroll', onScrollOrResize, {passive: true});
  window.addEventListener('resize', onScrollOrResize);
  reposition();
})();
