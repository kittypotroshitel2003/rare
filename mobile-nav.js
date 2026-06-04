(function () {
  var header = document.querySelector('.site-header, .site-hd');
  if (!header) return;

  var navEl = header.querySelector('.site-header__nav, .site-hd__nav');
  var links = navEl ? Array.from(navEl.querySelectorAll('a')) : [];
  var logoEl = header.querySelector('.site-header__logo, .site-hd__logo');
  var logoImg = header.querySelector('.site-header__logo img, .site-hd__logo img');
  var ctaEl = header.querySelector('.site-header__cta, .site-hd__cta, .pill-btn');

  // Build hamburger
  var hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-label', 'Меню');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(hamburger);

  // Build overlay
  var overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('role', 'dialog');

  // Build overlay using DOM API to avoid any XSS risk from href values
  var top = document.createElement('div');
  top.className = 'mobile-nav-top';

  var logoLink = document.createElement('a');
  logoLink.href = logoEl ? (logoEl.getAttribute('href') || '/') : '/';
  if (logoImg) {
    var logoImgEl = document.createElement('img');
    logoImgEl.src = logoImg.getAttribute('src');
    logoImgEl.alt = 'RA|RÉ';
    logoLink.appendChild(logoImgEl);
  } else {
    logoLink.textContent = 'RA|RÉ';
  }
  top.appendChild(logoLink);

  var closeBtn = document.createElement('button');
  closeBtn.className = 'mobile-nav-close';
  closeBtn.setAttribute('aria-label', 'Закрыть');
  closeBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F3EEE8" stroke-width="2" stroke-linecap="round"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>';
  top.appendChild(closeBtn);
  overlay.appendChild(top);

  var navEl2 = document.createElement('nav');
  navEl2.className = 'mobile-nav-links';
  links.forEach(function (a) {
    var link = document.createElement('a');
    link.href = a.getAttribute('href') || '#';
    link.textContent = a.textContent.trim();
    var style = a.getAttribute('style');
    if (style) link.setAttribute('style', style);
    navEl2.appendChild(link);
  });
  overlay.appendChild(navEl2);

  var bottom = document.createElement('div');
  bottom.className = 'mobile-nav-bottom';
  var phone = document.createElement('a');
  phone.href = 'tel:+79002761116';
  phone.className = 'mobile-nav-phone';
  phone.textContent = '+7 (900) 276-11-16';
  var cta = document.createElement('a');
  cta.href = ctaEl ? (ctaEl.getAttribute('href') || '#booking') : '#booking';
  cta.className = 'mobile-nav-cta';
  cta.textContent = 'Записаться на приём';
  bottom.appendChild(phone);
  bottom.appendChild(cta);
  overlay.appendChild(bottom);

  document.body.appendChild(overlay);

  var _lockScrollY = 0;

  function openMenu() {
    _lockScrollY = window.scrollY;
    overlay.classList.add('is-open');
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    // Make sure header is visible when menu opens
    header.classList.remove('rr-nav-hidden');
    // iOS-safe scroll lock
    document.body.style.top = '-' + _lockScrollY + 'px';
    document.body.classList.add('rr-nav-locked');
  }
  function closeMenu() {
    overlay.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('rr-nav-locked');
    document.body.style.top = '';
    window.scrollTo(0, _lockScrollY);
  }

  hamburger.addEventListener('click', function () {
    overlay.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);

  overlay.querySelectorAll('.mobile-nav-links a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  overlay.querySelector('.mobile-nav-cta').addEventListener('click', closeMenu);

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024) closeMenu();
  });

  // Close on backdrop click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeMenu();
  });

  // ── HEADER SCROLL EFFECT (is-scrolled bg only — hide/show handled by animations.js) ─
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollY = window.scrollY;
        if (scrollY > 40) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ── READING PROGRESS BAR ────────────────────────────────────
(function () {
  if (!document.querySelector('.article-body, .sec-article')) return;

  var bar = document.createElement('div');
  bar.className = 'rr-progress';
  document.body.appendChild(bar);

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var scrollTop = window.scrollY;
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        var pct = docH > 0 ? Math.min(100, (scrollTop / docH) * 100) : 0;
        bar.style.width = pct + '%';
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

// ── MOBILE FLOATING CTA ON ARTICLE PAGES ───────────────────
(function () {
  if (window.innerWidth > 767) return;
  var sidebar = document.querySelector('.article-sidebar');
  if (!sidebar) return;

  var ctaTitle = document.querySelector('.sidebar-cta__title');
  var ctaBtn   = document.querySelector('.sidebar-cta .pill-btn');
  if (!ctaTitle || !ctaBtn) return;

  var floatBar = document.createElement('div');
  floatBar.className = 'rr-float-cta';
  floatBar.innerHTML =
    '<span class="rr-float-cta__text">' + ctaTitle.textContent + '</span>' +
    '<a href="' + ctaBtn.getAttribute('href') + '" class="rr-float-cta__btn">Записаться</a>';
  document.body.appendChild(floatBar);

  var shown = false;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var meta = document.querySelector('.article-meta');
        if (meta && window.scrollY > meta.getBoundingClientRect().bottom + window.scrollY + 100) {
          if (!shown) { floatBar.classList.add('is-visible'); shown = true; }
        } else {
          if (shown) { floatBar.classList.remove('is-visible'); shown = false; }
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
