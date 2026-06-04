/* RA|RÉ — scroll reveal + parallax + premium micro-interactions */
(function () {
  'use strict';

  const EASE  = 'cubic-bezier(0.22,1,0.36,1)';
  const EASEO = 'cubic-bezier(0.4,0,0.2,1)';

  const css = `
@keyframes rrFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rrFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes rrScaleUp {
  from { opacity: 0; transform: scale(0.94) translateY(14px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes rrSlideLeft {
  from { opacity: 0; transform: translateX(-36px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes rrSlideRight {
  from { opacity: 0; transform: translateX(36px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes rrReveal {
  from { opacity: 0; clip-path: inset(0 0 100% 0); }
  to   { opacity: 1; clip-path: inset(0 0 0% 0); }
}
@keyframes rrLineExpand {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
@keyframes rrImgIn {
  from { opacity: 0; transform: scale(1.04); }
  to   { opacity: 1; transform: scale(1); }
}

[data-rr] { opacity: 0; }

[data-rr="up"].rr-in {
  animation: rrFadeUp var(--rr-dur, 0.72s) ${EASE} var(--rr-del, 0s) both;
}
[data-rr="in"].rr-in {
  animation: rrFadeIn var(--rr-dur, 0.65s) ${EASEO} var(--rr-del, 0s) both;
}
[data-rr="scale"].rr-in {
  animation: rrScaleUp var(--rr-dur, 0.72s) ${EASE} var(--rr-del, 0s) both;
}
[data-rr="left"].rr-in {
  animation: rrSlideLeft var(--rr-dur, 0.72s) ${EASE} var(--rr-del, 0s) both;
}
[data-rr="right"].rr-in {
  animation: rrSlideRight var(--rr-dur, 0.72s) ${EASE} var(--rr-del, 0s) both;
}
[data-rr="reveal"].rr-in {
  animation: rrReveal var(--rr-dur, 0.8s) ${EASE} var(--rr-del, 0s) both;
}
[data-rr="img"].rr-in {
  animation: rrImgIn var(--rr-dur, 1s) ${EASEO} var(--rr-del, 0s) both;
}

/* ── SMART NAVBAR ── */
.site-hd,
.site-header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 500 !important;
  will-change: transform;
  background: transparent !important;
  box-shadow: none !important;
  padding-left: var(--gutter, clamp(20px, 4.5vw, 72px)) !important;
  padding-right: var(--gutter, clamp(20px, 4.5vw, 72px)) !important;
  transition: transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94),
              background 0.4s ease,
              box-shadow 0.4s ease !important;
}
.site-hd.rr-nav-solid,
.site-header.rr-nav-solid {
  background: #102f27 !important;
  box-shadow: 0 2px 24px rgba(0,0,0,0.18) !important;
}
.site-hd.rr-nav-hidden,
.site-header.rr-nav-hidden {
  transform: translateY(-110%) !important;
}
.rr-nav-spacer {
  display: block;
  flex-shrink: 0;
}

/* Parallax hero image */
.hero__bg { will-change: transform; }

/* pill-btn shimmer on hover */
.pill-btn { position: relative; overflow: hidden; }
.pill-btn::after {
  content: '';
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.13);
  opacity: 0;
  transition: opacity 0.22s ease;
  border-radius: inherit;
}
.pill-btn:hover::after { opacity: 1; }
.pill-btn:active { transform: scale(0.97) !important; }

/* dir mosaic shimmer */
.dir-mosaic__card::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 60%);
  z-index: 2; pointer-events: none;
  opacity: 0; transition: opacity 0.4s ease;
}
.dir-mosaic__card:hover::after { opacity: 1; }

/* stat glow */
.about-stat__n { display: inline-block; transition: color 0.3s ease; }
.about-stat:hover .about-stat__n { color: #102f27; }

/* proc-row hover */
.proc-row {
  transition: background 0.18s ease, padding-left 0.2s ${EASE}, padding-right 0.2s ${EASE}, border-radius 0.2s ease;
}
.proc-row:hover {
  background: rgba(253,252,248,0.05);
  padding-left: 10px !important;
  padding-right: 10px !important;
  border-radius: 6px;
}

/* svc-big-card hover */
.svc-big-card {
  transition: box-shadow 0.3s ease, transform 0.3s ${EASE};
}
.svc-big-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(16,47,39,0.14);
}

/* inner-hero parallax bg */
.inner-hero__bg { will-change: transform; transition: none; }

/* spec-card & svc-spec-card hover lift */
.svc-spec-card {
  transition: transform 0.3s ${EASE}, box-shadow 0.3s ease;
}
.svc-spec-card:hover { transform: translateY(-4px) scale(1.01); }
`;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* selector | type | duration | baseDelay | stagger */
  const RULES = [
    // ── Hero ───────────────────────────────────────────────
    ['.inner-hero__title',          'up',     0.9,  0.1,  0    ],
    ['.inner-hero__cnt > p',        'up',     0.7,  0.28, 0    ],
    ['.inner-hero__breadcrumb',     'up',     0.6,  0.05, 0    ],
    ['.page-hero__title',           'up',     0.9,  0.1,  0    ],
    ['.hero__title',                'up',     1.0,  0.15, 0    ],
    ['.hero__sub',                  'up',     0.8,  0.32, 0    ],
    ['.hero__cta',                  'up',     0.7,  0.48, 0    ],

    // ── Section headings ───────────────────────────────────
    ['.sec-h',                      'up',     0.75, 0,    0    ],
    ['.sec-eyebrow',                'up',     0.55, 0,    0    ],
    ['.dir-heading',                'left',   0.85, 0,    0    ],
    ['.dir-all',                    'right',  0.7,  0.1,  0    ],
    ['.cta-heading',                'up',     0.85, 0,    0    ],
    ['.cta-sub',                    'up',     0.7,  0.12, 0    ],
    ['.gallery-heading',            'up',     0.8,  0,    0    ],
    ['.contact-heading',            'left',   0.8,  0,    0    ],
    ['.contacts-heading',           'left',   0.8,  0,    0    ],
    ['.booking-heading',            'up',     0.8,  0,    0    ],
    ['.articles-heading',           'up',     0.8,  0,    0    ],
    ['.about-text__heading',        'up',     0.8,  0,    0    ],
    ['.desc-text h2',               'up',     0.8,  0,    0    ],
    ['.desc-text p',                'up',     0.65, 0.1,  0    ],
    ['.about-text__body',           'up',     0.7,  0.12, 0    ],
    ['.about-body',                 'up',     0.7,  0.12, 0    ],
    ['.promo-heading',              'up',     0.8,  0.05, 0    ],
    ['.promo-desc',                 'up',     0.7,  0.15, 0    ],
    ['.promo-terms',                'up',     0.7,  0.1,  0    ],
    ['.svc-body',                   'up',     0.7,  0.1,  0    ],

    // ── Articles ──────────────────────────────────────────
    ['.article-hero__cnt h1',       'up',     0.85, 0.1,  0    ],
    ['.article-hero__cnt .article-meta', 'up', 0.6, 0.25, 0   ],
    ['.article-body h2',            'up',     0.7,  0,    0    ],
    ['.article-body p',             'up',     0.55, 0,    0.04 ],
    ['.article-tip',                'scale',  0.7,  0,    0    ],
    ['.article-sidebar',            'up',     0.7,  0.15, 0    ],
    ['.article-card',               'up',     0.65, 0,    0.09 ],
    ['.articles-lead',              'up',     0.7,  0.1,  0    ],

    // ── Cards — staggered ──────────────────────────────────
    ['.gift-card',                  'scale',  0.72, 0,    0.11 ],
    ['.cert-card',                  'up',     0.65, 0,    0.07 ],
    ['.svc-card',                   'up',     0.65, 0,    0.08 ],
    ['.svc-big-card',               'up',     0.65, 0,    0.09 ],
    ['.article-card',               'up',     0.65, 0,    0.09 ],
    ['.spec-card',                  'scale',  0.65, 0,    0.07 ],
    ['.bullet-card',                'up',     0.65, 0,    0.08 ],
    ['.ba-card',                    'in',     0.75, 0,    0.1  ],
    ['.promo-card',                 'up',     0.65, 0,    0.07 ],
    ['.promo-benefit',              'left',   0.55, 0,    0.06 ],
    ['.svc-spec-card',              'scale',  0.65, 0,    0.07 ],
    ['.platform-card',              'up',     0.6,  0,    0.07 ],
    ['.review-card',                'up',     0.55, 0,    0.05 ],
    ['.pair-card',                  'up',     0.6,  0,    0.07 ],
    ['.spec-svc-card',              'up',     0.6,  0,    0.06 ],

    // ── Lists ─────────────────────────────────────────────
    ['.faq-item',                   'up',     0.5,  0,    0.05 ],
    ['.price-row',                  'up',     0.45, 0,    0.035],
    ['.proc-row',                   'up',     0.45, 0,    0.05 ],
    ['.price-row',                  'up',     0.45, 0,    0.04 ],
    ['.bullet-card',                'up',     0.65, 0,    0.10 ],
    ['.svc-rev-card',               'up',     0.55, 0,    0.08 ],
    ['.svc-booking-form',           'up',     0.75, 0.1,  0    ],
    ['.svc-booking-text h2',        'up',     0.75, 0,    0    ],
    ['.svc-booking-text p',         'up',     0.65, 0.12, 0    ],
    ['.svc-list li',                'up',     0.45, 0.05, 0.06 ],
    ['.footer-links a',             'up',     0.4,  0,    0.03 ],
    ['.price-block',                'up',     0.6,  0,    0.08 ],

    // ── Stats & photos ─────────────────────────────────────
    ['.about-stat',                 'scale',  0.65, 0,    0.08 ],
    ['.about-ph',                   'img',    0.9,  0,    0.14 ],
    ['.about-photo-wrap',           'img',    0.9,  0.05, 0    ],
    ['.desc-photo',                 'img',    0.9,  0,    0    ],
    ['.svc-intro-photo',            'img',    0.9,  0,    0    ],
    ['.founder-photo',              'img',    0.9,  0,    0    ],
    ['.founder-name',               'up',     0.8,  0.05, 0    ],
    ['.founder-lbl',                'up',     0.6,  0,    0    ],
    ['.founder-quote p',            'up',     0.65, 0.1,  0.12 ],
    ['.result-photo',               'img',    0.9,  0,    0    ],
    ['.ba-photo',                   'img',    0.75, 0,    0.08 ],
    ['.spec-hero__photo',           'img',    0.9,  0,    0    ],

    // ── Forms & CTAs ──────────────────────────────────────
    ['.booking-form',               'up',     0.8,  0.12, 0    ],
    ['.sec-cta .pill-btn',          'up',     0.7,  0.22, 0.1  ],
    ['.sec-cta a[href^="tel"]',     'up',     0.65, 0.32, 0    ],
    ['.sec-gift p',                 'up',     0.7,  0.12, 0    ],

    // ── Advantages ─────────────────────────────────────────
    ['.adv-item',                   'up',     0.65, 0,    0.12 ],

    // ── Contacts ──────────────────────────────────────────
    ['.contacts-info',              'up',     0.65, 0.1,  0    ],
    ['.contacts-links',             'up',     0.65, 0.2,  0    ],

    // ── Specialist detail ──────────────────────────────────
    ['.spec-hero__name',            'up',     0.85, 0.1,  0    ],
    ['.spec-hero__role',            'up',     0.6,  0.2,  0    ],
    ['.spec-hero__bio',             'up',     0.65, 0.28, 0    ],
    ['.spec-hero__stats',           'up',     0.65, 0.22, 0    ],
    ['.spec-hero__actions',         'up',     0.65, 0.32, 0    ],
    ['.spec-rev-card',              'up',     0.55, 0,    0.05 ],
    ['.other-spec-card',            'scale',  0.6,  0,    0.07 ],
    ['.edu-item',                   'up',     0.5,  0,    0.04 ],

    // ── Promo card (sticky) ────────────────────────────────
    ['.promo-card.promo-card--sticky', 'right', 0.8, 0.15, 0  ],
  ];

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('rr-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

  const seen = new WeakSet();

  function setup() {
    RULES.forEach(([sel, type, dur, baseDelay, stagger]) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.dataset.rr = type;
        el.style.setProperty('--rr-dur', dur + 's');
        el.style.setProperty('--rr-del', (baseDelay + (stagger ? i * stagger : 0)) + 's');
        obs.observe(el);
      });
    });

    // Fallback: observe any [data-rr] elements in HTML not caught by RULES
    document.querySelectorAll('[data-rr]').forEach(el => {
      if (seen.has(el)) return;
      seen.add(el);
      obs.observe(el);
    });

    initParallax();
    initInnerHeroParallax();
    initHoverTilt();
  }

  /* ── HOMEPAGE HERO parallax ─────────────────────────── */
  function initParallax() {
    const heroBg = document.querySelector('.hero__bg');
    if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let heroH = heroBg.parentElement.offsetHeight;
    window.addEventListener('resize', () => { heroH = heroBg.parentElement.offsetHeight; }, { passive: true });
    heroBg.style.transform = 'translateY(0) scale(1.15)';
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY < heroH * 1.2)
            heroBg.style.transform = `translateY(${window.scrollY * 0.28}px) scale(1.15)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── INNER HERO (subpages) subtle parallax ───────────── */
  function initInnerHeroParallax() {
    const bg = document.querySelector('.inner-hero__bg');
    if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const section = bg.parentElement;
    let ticking = false;
    bg.style.transform = 'translateY(0) scale(1.08)';
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = section.getBoundingClientRect();
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            const progress = -rect.top / (rect.height + window.innerHeight);
            bg.style.transform = `translateY(${progress * 60}px) scale(1.08)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── CARD 3D TILT ────────────────────────────────────── */
  function initHoverTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    document.querySelectorAll('.svc-card, .spec-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x*4}deg) rotateX(${-y*4}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ── SMART NAVBAR ─────────────────────────────────── */
  function initSmartNav() {
    var header = document.querySelector('.site-hd, .site-header');
    if (!header) return;

    var lastY = window.scrollY;
    var ticking = false;
    var scrolledDown = 0;

    function update() {
      var y = window.scrollY;

      // Background handled by IntersectionObserver below


      var delta = y - lastY;

      if (window.innerWidth <= 1024) {
        // Mobile: always visible, just sticky
        header.classList.remove('rr-nav-hidden');
      } else {
        // Desktop: hide on scroll down, reveal on scroll up
        if (y < 100) {
          header.classList.remove('rr-nav-hidden');
          scrolledDown = 0;
        } else if (delta > 0) {
          if (y > 120) {
            scrolledDown += delta;
            if (scrolledDown > 120) {
              header.classList.add('rr-nav-hidden');
            }
          }
        } else if (delta < 0) {
          scrolledDown = 0;
          header.classList.remove('rr-nav-hidden');
        }
      }

      lastY = y;
    }

    // Transparent in hero, solid everywhere else
    var hero = document.querySelector('.hero');
    if (hero) {
      var heroObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            header.classList.remove('rr-nav-solid');
          } else {
            header.classList.add('rr-nav-solid');
          }
        });
      }, { threshold: 0.05 });
      heroObs.observe(hero);
    } else {
      header.classList.add('rr-nav-solid');
    }

    update(); // run once on load

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
    document.addEventListener('DOMContentLoaded', initSmartNav);
  } else {
    setup();
    initSmartNav();
  }
})();
