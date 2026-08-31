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
    'background:#8DA585;color:#fdfcf8;text-decoration:none;padding:14px 22px;border-radius:8px;' +
    'font-family:\'Inter\',sans-serif;font-size:15px;font-weight:400;letter-spacing:-0.01em;' +
    'box-shadow:0 6px 24px rgba(48,54,46,0.3);transition:background 0.2s ease, opacity 0.25s ease;}' +
    '#rr-booking-widget:hover{background:#6A7C64;}' +
    '#rr-booking-widget svg{flex-shrink:0;}' +
    '#rr-booking-widget.rr-bw-hidden{opacity:0;pointer-events:none;}' +
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

  /* Stays plain position:fixed at all times (so it travels with the
     viewport through the whole page, not just part of it) and simply
     fades out — instead of physically docking — once the footer's own
     "Записаться на приём" button scrolls into view, so the two don't
     overlap. IntersectionObserver only fires on an actual visibility
     crossing, so unlike a scroll-position calculation cached from
     getBoundingClientRect(), it can't go stale if the page's layout
     shifts afterward (images/fonts loading, scroll-reveal animations) —
     there's nothing to recompute. */
  function getStopAnchor() {
    var candidates = [document.querySelector('.footer-cta__btn'), document.querySelector('.mh-footer__pill')];
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i]) return candidates[i];
    }
    return null;
  }

  function watchStopAnchor() {
    var stopAnchor = getStopAnchor();
    if (!stopAnchor || typeof IntersectionObserver === 'undefined') return;
    var io = new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      a.classList.toggle('rr-bw-hidden', visible);
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(stopAnchor);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchStopAnchor);
  } else {
    watchStopAnchor();
  }
})();
