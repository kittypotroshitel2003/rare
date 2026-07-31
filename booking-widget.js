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
    'background:#777247;color:#fdfcf8;text-decoration:none;padding:14px 22px;border-radius:100px;' +
    'font-family:\'Involve\',sans-serif;font-size:15px;font-weight:500;letter-spacing:-0.01em;' +
    'box-shadow:0 6px 24px rgba(51,36,29,0.3);transition:transform 0.2s ease,box-shadow 0.2s ease,background 0.2s ease;}' +
    '#rr-booking-widget:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(51,36,29,0.36);background:#5e5a38;}' +
    '#rr-booking-widget svg{flex-shrink:0;}' +
    '@media (max-width:640px){#rr-booking-widget{right:16px;bottom:16px;padding:12px 18px;font-size:14px;}#rr-booking-widget .rr-bw-label{display:none;}}';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var a = document.createElement('a');
  a.id = 'rr-booking-widget';
  a.href = href;
  a.setAttribute('aria-label', 'Онлайн-запись');
  a.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8.5 14.5l2 2 4.5-4.5"/></svg><span class="rr-bw-label">Онлайн-запись</span>';
  document.body.appendChild(a);
})();
