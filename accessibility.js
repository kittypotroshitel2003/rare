(function () {
  'use strict';

  var STORAGE_KEY = 'rr-a11y';
  var BTN_ID = 'a11y-toggle';

  /* ── CSS injected into page ─────────────────────────────────────── */
  var css = `
/* ── Accessibility toggle button ──────────────────────────────── */
#a11y-toggle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s ease, color 0.2s ease;
  padding: 0;
  opacity: 0.85;
}
#a11y-toggle:hover { opacity: 1; }
#a11y-toggle svg { width: 20px; height: 20px; display: block; }
#a11y-toggle .a11y-label { display: none; }
#a11y-toggle.is-active { color: var(--c-accent, #777247); opacity: 1; }

/* fixed-position fallback for pages without a header actions row */
#a11y-toggle.a11y-fixed {
  position: fixed; top: 16px; right: 12px; z-index: 600;
  width: 26px; height: 26px;
  border: 1px solid rgba(253,252,248,0.4);
  color: rgba(253,252,248,0.85);
  opacity: 1;
}
#a11y-toggle.a11y-fixed:hover { background: rgba(253,252,248,0.12); }
#a11y-toggle.a11y-fixed.is-active { background: var(--c-accent, #777247); border-color: var(--c-accent, #777247); color: #fff; }
@media (max-width: 767px) {
  #a11y-toggle.a11y-fixed { top: 12px; right: 60px; width: 24px; height: 24px; }
}

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
html.a11y-mode .script {
  font-family: var(--f) !important;
  font-style: normal !important;
  font-size: 1em !important;
}
html.a11y-mode .spec-card__view {
  opacity: 1 !important;
  transform: none !important;
  font-family: var(--f) !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  color: #ffffff !important;
}
html.a11y-mode .dot {
  background: #555555 !important;
}
html.a11y-mode .dot--active {
  background: #1a5c42 !important;
}
html.a11y-mode .booking-submit,
html.a11y-mode .interior-arr,
html.a11y-mode .promo-card,
html.a11y-mode .result-item .result-photo {
  outline: 3px solid #111 !important;
  outline-offset: 2px;
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
`;

  /* ── Inject styles ──────────────────────────────────────────────── */
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Create toggle button ───────────────────────────────────────── */
  function createBtn() {
    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Версия для слабовидящих');
    btn.setAttribute('title', 'Версия для слабовидящих');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M2 8C2 8 6.47715 3 12 3C17.5228 3 22 8 22 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M21.544 13.045C21.848 13.4713 22 13.6845 22 14C22 14.3155 21.848 14.5287 21.544 14.955C20.1779 16.8706 16.6892 21 12 21C7.31078 21 3.8221 16.8706 2.45604 14.955C2.15201 14.5287 2 14.3155 2 14C2 13.6845 2.15201 13.4713 2.45604 13.045C3.8221 11.1294 7.31078 7 12 7C16.6892 7 20.1779 11.1294 21.544 13.045Z" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M15 14C15 12.3431 13.6569 11 12 11C10.3431 11 9 12.3431 9 14C9 15.6569 10.3431 17 12 17C13.6569 17 15 15.6569 15 14Z" stroke="currentColor" stroke-width="1.5"/>' +
      '</svg><span class="a11y-label">Aa</span>';

    var headerActions = document.querySelector('.site-header__actions, .site-hd__actions');
    if (headerActions) {
      headerActions.insertBefore(btn, headerActions.firstChild);
    } else {
      btn.classList.add('a11y-fixed');
      document.body.appendChild(btn);
    }
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
