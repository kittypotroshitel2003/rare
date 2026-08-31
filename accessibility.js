(function () {
  'use strict';

  /* ── Toggle button(s) ────────────────────────────────────────────
     The header gets an icon-only button (hidden ≤1024px via CSS below);
     the mobile slide-out menu gets a second, labeled instance so the
     control stays reachable once the header icon is hidden on mobile.
     Both carry the .bvi-open class, which the BVI widget (loaded just
     before this file — see the script tag order in <head>/<body>) binds
     its click handler to automatically. */
  var css = `
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

@media (max-width: 1024px) {
  #a11y-toggle { display: none !important; }
}
#a11y-toggle-menu {
  width: auto; height: auto; border-radius: 0;
  display: flex; align-items: center; gap: 12px;
  padding: 0; opacity: 1; color: #30362E;
  font-size: 18px; font-weight: 500; letter-spacing: -0.02em;
  font-family: inherit;
}
#a11y-toggle-menu svg { width: 22px; height: 22px; }
#a11y-toggle-menu .a11y-label { display: inline; }

/* fixed-position fallback for pages without a header actions row */
#a11y-toggle.a11y-fixed {
  position: fixed; top: 16px; right: 12px; z-index: 600;
  width: 26px; height: 26px;
  border: 1px solid rgba(253,252,248,0.4);
  color: rgba(253,252,248,0.85);
  opacity: 1;
}
#a11y-toggle.a11y-fixed:hover { background: rgba(253,252,248,0.12); }
@media (max-width: 767px) {
  #a11y-toggle.a11y-fixed { top: 12px; right: 60px; width: 24px; height: 24px; }
}

/* BVI's top panel and our fixed header both pin to top:0 at the same
   time — push the header down below the panel while it's open (see
   syncBviHeaderOffset in the script below). animations.js sets the
   header's own top:0 with !important for its scroll show/hide behavior,
   so this needs !important too to actually win. */
body.bvi-active .site-header,
body.bvi-active .site-hd {
  top: var(--bvi-panel-h, 0px) !important;
}
`;

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  var ICON_SVG = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M2 8C2 8 6.47715 3 12 3C17.5228 3 22 8 22 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M21.544 13.045C21.848 13.4713 22 13.6845 22 14C22 14.3155 21.848 14.5287 21.544 14.955C20.1779 16.8706 16.6892 21 12 21C7.31078 21 3.8221 16.8706 2.45604 14.955C2.15201 14.5287 2 14.3155 2 14C2 13.6845 2.15201 13.4713 2.45604 13.045C3.8221 11.1294 7.31078 7 12 7C16.6892 7 20.1779 11.1294 21.544 13.045Z" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M15 14C15 12.3431 13.6569 11 12 11C10.3431 11 9 12.3431 9 14C9 15.6569 10.3431 17 12 17C13.6569 17 15 15.6569 15 14Z" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg>';

  function createBtn() {
    var btn = document.createElement('button');
    btn.id = 'a11y-toggle';
    btn.type = 'button';
    btn.classList.add('bvi-open');
    btn.setAttribute('aria-label', 'Версия для слабовидящих');
    btn.setAttribute('title', 'Версия для слабовидящих');
    btn.innerHTML = ICON_SVG + '<span class="a11y-label">Aa</span>';

    var headerActions = document.querySelector('.site-header__actions, .site-hd__actions');
    if (headerActions) {
      headerActions.insertBefore(btn, headerActions.firstChild);
    } else {
      btn.classList.add('a11y-fixed');
      document.body.appendChild(btn);
    }
    return btn;
  }

  function createMenuBtn() {
    var menuBottom = document.querySelector('.mobile-nav-bottom');
    if (!menuBottom) return null;

    var btn = document.createElement('button');
    btn.id = 'a11y-toggle-menu';
    btn.type = 'button';
    btn.classList.add('bvi-open');
    btn.setAttribute('aria-label', 'Версия для слабовидящих');
    btn.setAttribute('title', 'Версия для слабовидящих');
    btn.innerHTML = ICON_SVG + '<span class="a11y-label">Версия для слабовидящих</span>';

    menuBottom.insertBefore(btn, menuBottom.firstChild);
    return btn;
  }

  /* Our own header (.site-header/.site-hd) is position:fixed;top:0 for its
     own scroll-pinning behavior — the same spot BVI plants its top panel,
     at a higher z-index, so the panel simply covers the header while
     active. Push the header down by the panel's real (and resizable —
     the user can grow the font, the panel can reflow at narrow widths)
     height via a CSS var kept in sync with a ResizeObserver. */
  var bviPanelRO = null;
  function syncBviHeaderOffset() {
    var panel = document.querySelector('.bvi-panel');
    var active = document.body.classList.contains('bvi-active');
    var h = (panel && active) ? panel.offsetHeight : 0;
    document.documentElement.style.setProperty('--bvi-panel-h', h + 'px');

    if (panel && active) {
      if (!bviPanelRO && 'ResizeObserver' in window) {
        bviPanelRO = new ResizeObserver(function () {
          document.documentElement.style.setProperty('--bvi-panel-h', panel.offsetHeight + 'px');
        });
        bviPanelRO.observe(panel);
      }
    } else if (bviPanelRO) {
      bviPanelRO.disconnect();
      bviPanelRO = null;
    }
  }

  function init() {
    var btn = createBtn();
    var menuBtn = createMenuBtn();

    /* BVI (https://github.com/veks/button-visually-impaired-javascript)
       scans for elements matching `target` at construction time, so it
       must run after the buttons above exist — bvi.min.js itself loads
       with `defer` right before this script, so `window.isvek` is
       already available here. */
    if (window.isvek && typeof window.isvek.Bvi === 'function') {
      new window.isvek.Bvi({
        target: '.bvi-open',
        lang: 'ru-RU',
        theme: 'white',
        fontSize: 16,
      });
    }

    // Covers the case where the panel is already active from a cookie
    // set on a previous page (BVI renders it synchronously above).
    syncBviHeaderOffset();
    // BVI's own click listener (attached above, runs first) has already
    // opened/closed the panel by the time this fires.
    [btn, menuBtn].forEach(function (b) {
      if (b) b.addEventListener('click', function () { setTimeout(syncBviHeaderOffset, 0); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
