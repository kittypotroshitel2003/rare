(function () {
  'use strict';

  var STORAGE_KEY = 'rr-a11y';
  var BTN_ID = 'a11y-toggle';

  /* ── CSS injected into page ─────────────────────────────────────── */
  var css = `
/* ── Accessibility toggle button ──────────────────────────────── */
#a11y-toggle {
  position: fixed;
  bottom: 100px;
  right: 24px;
  z-index: 9000;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(86,134,115,0.35);
  background: #102f27;
  color: #fdfcf8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s;
  font-family: sans-serif;
  flex-direction: column;
  gap: 2px;
  text-align: center;
}
#a11y-toggle:hover {
  transform: scale(1.08);
  box-shadow: 0 8px 24px rgba(0,0,0,0.28);
  background: #1c4a3a;
}
#a11y-toggle svg { display: block; flex-shrink: 0; }
#a11y-toggle .a11y-label {
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  color: rgba(253,252,248,0.75);
  text-transform: uppercase;
}
#a11y-toggle.is-active { background: #568673; border-color: #568673; }

/* ── Accessibility mode styles ─────────────────────────────────── */
html.a11y-mode {
  font-size: 20px !important;
}
html.a11y-mode *,
html.a11y-mode *::before,
html.a11y-mode *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
html.a11y-mode body {
  background: #ffffff !important;
  color: #111111 !important;
  font-size: 1.2rem !important;
  line-height: 1.8 !important;
}
html.a11y-mode :root {
  --c-dark:   #0a1f16 !important;
  --c-accent: #1a5c42 !important;
  --c-bg:     #ffffff !important;
  --c-text:   #111111 !important;
  --c-muted:  #333333 !important;
  --c-white:  #ffffff !important;
}
html.a11y-mode a {
  text-decoration: underline !important;
  text-underline-offset: 3px !important;
  color: #00529b !important;
}
html.a11y-mode a:visited { color: #7a0099 !important; }
html.a11y-mode button,
html.a11y-mode .pill-btn {
  outline: 3px solid #111 !important;
  outline-offset: 2px;
}
html.a11y-mode input,
html.a11y-mode select,
html.a11y-mode textarea {
  border: 2px solid #111 !important;
  background: #fff !important;
  color: #111 !important;
  font-size: 1.1rem !important;
}
html.a11y-mode h1,
html.a11y-mode h2,
html.a11y-mode h3 {
  letter-spacing: 0 !important;
  line-height: 1.3 !important;
  color: #000 !important;
}
html.a11y-mode img {
  filter: contrast(1.15) !important;
}
html.a11y-mode .site-header,
html.a11y-mode .site-hd,
html.a11y-mode .sec-dir,
html.a11y-mode .sec-spec,
html.a11y-mode .sec-founder,
html.a11y-mode .sec-contacts,
html.a11y-mode .site-footer {
  background: #0a1f16 !important;
}
html.a11y-mode .site-header *,
html.a11y-mode .site-hd *,
html.a11y-mode .sec-dir *,
html.a11y-mode .sec-spec *,
html.a11y-mode .sec-founder *,
html.a11y-mode .sec-contacts *,
html.a11y-mode .site-footer * {
  color: #ffffff !important;
}
html.a11y-mode .site-footer a,
html.a11y-mode .site-header a,
html.a11y-mode .site-hd a {
  text-decoration: underline !important;
  color: #7df5c4 !important;
}
html.a11y-mode .pill-btn {
  background: #1a5c42 !important;
  color: #fff !important;
  font-size: 1.1rem !important;
  padding: 18px 32px !important;
}
html.a11y-mode .adv-label,
html.a11y-mode .svc-card__name,
html.a11y-mode .svc-card__desc {
  color: #111 !important;
}
html.a11y-mode .svc-card { border: 2px solid #111 !important; }
html.a11y-mode .booking-field input,
html.a11y-mode .booking-svc-sel { font-size: 1.1rem !important; }
html.a11y-mode .cookie-banner { display: none !important; }

@media (max-width: 767px) {
  #a11y-toggle { bottom: 80px; right: 16px; width: 44px; height: 44px; }
}
`;

  /* ── Inject styles ──────────────────────────────────────────────── */
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Create toggle button ───────────────────────────────────────── */
  function createBtn() {
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.setAttribute('aria-label', 'Версия для слабовидящих');
    btn.setAttribute('title', 'Версия для слабовидящих');
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span class="a11y-label">Aa</span>';
    document.body.appendChild(btn);
    return btn;
  }

  /* ── Toggle logic ───────────────────────────────────────────────── */
  function enable() {
    document.documentElement.classList.add('a11y-mode');
    localStorage.setItem(STORAGE_KEY, '1');
    var btn = document.getElementById(BTN_ID);
    if (btn) btn.classList.add('is-active');
  }

  function disable() {
    document.documentElement.classList.remove('a11y-mode');
    localStorage.removeItem(STORAGE_KEY);
    var btn = document.getElementById(BTN_ID);
    if (btn) btn.classList.remove('is-active');
  }

  function init() {
    var btn = createBtn();
    if (localStorage.getItem(STORAGE_KEY)) enable();
    btn.addEventListener('click', function () {
      if (document.documentElement.classList.contains('a11y-mode')) {
        disable();
      } else {
        enable();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
