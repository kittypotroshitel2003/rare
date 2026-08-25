/* RA|RÉ — scroll reveal + parallax + premium micro-interactions */
(function () {
  'use strict';

  const EASE  = 'cubic-bezier(0.22,1,0.36,1)';
  const EASEO = 'cubic-bezier(0.4,0,0.2,1)';

  const css = `
/* "materialize" look: elements resolve into view out of a soft blur, like fog
   condensing rather than sliding in — filter is added alongside the existing
   opacity/transform so nothing about the timing/selectors below has to change. */
@keyframes rrFadeUp {
  from { opacity: 0; transform: translateY(28px); filter: blur(7px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes rrFadeIn {
  from { opacity: 0; filter: blur(7px); }
  to   { opacity: 1; filter: blur(0); }
}
@keyframes rrScaleUp {
  from { opacity: 0; transform: scale(0.94) translateY(14px); filter: blur(7px); }
  to   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}
@keyframes rrSlideLeft {
  from { opacity: 0; transform: translateX(-36px); filter: blur(7px); }
  to   { opacity: 1; transform: translateX(0); filter: blur(0); }
}
@keyframes rrSlideRight {
  from { opacity: 0; transform: translateX(36px); filter: blur(7px); }
  to   { opacity: 1; transform: translateX(0); filter: blur(0); }
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
  from { opacity: 0; transform: scale(1.04); filter: blur(9px); }
  to   { opacity: 1; transform: scale(1); filter: blur(0); }
}

[data-rr] { opacity: 0; }
[data-rr="type"] { opacity: 1; }

[data-rr="up"].rr-in {
  animation: rrFadeUp var(--rr-dur, 0.72s) ${EASE} var(--rr-del, 0s) both;
}
[data-rr="in"].rr-in {
  animation: rrFadeIn var(--rr-dur, 0.65s) ${EASE} var(--rr-del, 0s) both;
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
  animation: rrImgIn var(--rr-dur, 1s) ${EASE} var(--rr-del, 0s) both;
}

/* reduced motion: keep the fade (it aids comprehension — content isn't
   teleporting), drop the movement/scale/blur every [data-rr] variant
   above adds. This block must win the cascade, so it's repeated per
   selector rather than relying on a shared class. */
@media (prefers-reduced-motion: reduce) {
  [data-rr="up"].rr-in,
  [data-rr="in"].rr-in,
  [data-rr="scale"].rr-in,
  [data-rr="left"].rr-in,
  [data-rr="right"].rr-in,
  [data-rr="img"].rr-in {
    animation: rrFadeIn 0.3s ease var(--rr-del, 0s) both;
  }
  [data-rr="reveal"].rr-in {
    animation: rrFadeIn 0.3s ease var(--rr-del, 0s) both;
    clip-path: none;
  }
}

/* ── TYPEWRITER (mission statement) ──────────────────────────── */
[data-rr="type"] { position: relative; }
[data-rr="type"] .tw-ch { opacity: 0; }
[data-rr="type"] .tw-ch.is-in { opacity: 1; }
[data-rr="type"] .tw-caret {
  position: absolute; top: 0; left: 0; width: 2px;
  background: var(--c-accent, #48627C); opacity: 0; pointer-events: none;
}
@keyframes twBlink { 50% { opacity: 0; } }
[data-rr="type"] .tw-caret.is-active { opacity: 1; animation: twBlink 0.9s steps(1) infinite; }
[data-rr="type"] .tw-caret.tw-done { opacity: 0; animation: none; }

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
  background: #FFFFFF !important;
  box-shadow: none !important;
}
/* once the header goes solid beige (scrolled past the photo hero), flip
   its nav text + ghost CTA from photo-legible cream to readable ink */
.site-header.rr-nav-solid .site-header__nav a,
.site-header.rr-nav-solid .site-header__social a,
.site-header.rr-nav-solid .site-header__phone {
  color: #1D2833 !important;
}
/* phone icon + logo are flat <img>s, so they can't inherit color — the
   files themselves are dark ink (correct once solid); invert them back
   to light while the header is still transparent over the hero photo */
.site-header:not(.rr-nav-solid) .site-header__phone img,
.site-header:not(.rr-nav-solid) .site-header__logo img {
  filter: brightness(0) invert(1);
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
.hero__bg-stage { will-change: transform; }
.hero__bg { will-change: opacity, transform; }

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
.about-stat:hover .about-stat__n { color: #48627C; }

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
    // NOTE: .hero__title / .hero__sub / .hero__cta (homepage hero) are
    // intentionally excluded — they run their own dedicated entrance
    // sequence (video → title → typed subtitle → cta → ratings) defined
    // inline in index.html, and double-animating them here caused a
    // visible glitch (this generic reveal firing on top of that one).
    ['.inner-hero__title',          'up',     0.9,  0.1,  0    ],
    ['.inner-hero__cnt > p',        'up',     0.7,  0.28, 0    ],
    ['.inner-hero__breadcrumb',     'up',     0.6,  0.05, 0    ],
    ['.page-hero__title',           'up',     0.9,  0.1,  0    ],

    // ── Section headings ───────────────────────────────────
    // .about-text .sec-h (homepage "Экспертная красота") is excluded — it
    // runs inside that section's own dedicated entrance sequence (heading+
    // lead+button → circle bloom → points staggered), defined inline in
    // index.html, for the same reason the hero heading is excluded above.
    ['.sec-h:not(.about-text .sec-h)', 'up',   0.75, 0,    0    ],
    ['.sec-eyebrow',                'up',     0.55, 0,    0    ],
    ['.dir-heading',                'left',   0.85, 0,    0    ],
    ['.dir-all',                    'right',  0.7,  0.1,  0    ],
    ['.dir-tile',                   'scale',  1.0,  0,    0.12 ],
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
    ['.adv-heading',                'up',     0.8,  0,    0    ],

    // ── Homepage "Акции" promo banner ──────────────────────
    // .promo-banner__card relies on transform: translateY(-50%) for its own
    // vertical centering (position:absolute; top:50%), so it uses 'in' (fade
    // + blur only, no transform in the keyframe) rather than 'up' — same
    // reasoning as the about-section points: an 'up' reveal's own
    // translateY() would overwrite that centering transform outright.
    ['.promo-banner__photo',        'img',    1.0,  0,    0    ],
    ['.promo-banner__card',         'in',     0.75, 0.15, 0    ],

    // ── Homepage "Внутри клиники" gallery ──────────────────
    ['.interior-item',              'img',    0.8,  0,    0.07 ],

    // ── Homepage "Онлайн-запись" text + map ─────────────────
    ['.booking-desc',               'up',     0.7,  0.12, 0    ],
    ['.contacts-bar',               'up',     0.65, 0.05, 0    ],
    ['.booking-map',                'right',  0.8,  0.1,  0    ],

    // ── Footer ──────────────────────────────────────────────
    ['.footer-nav__group',          'up',     0.6,  0,    0.08 ],
    ['.footer-socials',             'up',     0.55, 0.12, 0    ],
    ['.footer-wordmark',            'up',     0.8,  0.18, 0    ],
    ['.footer-cta',                 'up',     0.6,  0.24, 0    ],
    ['.footer-bottom',              'up',     0.5,  0.3,  0    ],

    // ── MOBILE — homepage (index.html .mobile-home) ─────────
    // The mobile hero (.mh-hero__title/__sub/__photo/__cta) now runs its
    // own hand-choreographed WAAPI sequence — title → typed subtitle →
    // photo slides in from the right → cta — defined inline in
    // index.html right next to the equivalent desktop hero sequence, so
    // it's intentionally excluded from this generic list.
    // Durations below run noticeably longer than the desktop equivalents
    // (and get the same ×1.18 SMOOTH stretch on top) — a slow, unhurried
    // materialize was specifically asked for on mobile.
    ['.mh-promo-slide',             'scale',  1.15, 0,    0.14 ],
    ['.mh-stats__title',            'up',     1.1,  0,    0    ],
    ['.mh-stats__desc',             'up',     1.0,  0.15, 0    ],
    ['.mh-stats__btn',              'up',     0.85, 0.3,  0    ],
    ['.mh-stats__circle',           'img',    1.3,  0.15, 0    ],
    ['.mh-features__item',          'up',     0.95, 0,    0.12 ],
    ['.mh-numbers__item',           'scale',  0.95, 0,    0.12 ],
    // .mh-section-title is the shared mobile section heading, reused
    // across index.html, services.html and every services/procedures/*
    // page's mobile booking block — one rule covers all of them.
    ['.mh-section-title',           'up',     1.05, 0,    0    ],
    // .mh-service-card is shared between index.html's and services.html's
    // mobile "Направления услуг" grids.
    ['.mh-service-card',            'up',     0.95, 0,    0.12 ],
    ['.mh-services__cta',           'up',     0.85, 0.15, 0    ],
    ['.mh-why__title',              'up',     1.05, 0,    0    ],
    // .mh-why-cta (the booking button in the last why-card) is nested
    // inside a .mh-why-card, so it's covered by that card's own reveal —
    // giving it a separate rule would double-animate it.
    ['.mh-why-card',                'up',     0.95, 0,    0.12 ],
    ['.mh-why-photo',               'img',    1.25, 0,    0.14 ],
    ['.mh-founder__photo',          'img',    1.25, 0,    0    ],
    ['.mh-founder__quote p',        'up',     0.95, 0.15, 0.16 ],
    ['.mh-founder__author-name',    'up',     0.85, 0.3,  0    ],
    ['.mh-founder__author-role',    'up',     0.8,  0.4,  0    ],
    ['.mh-spec-card',               'scale',  0.95, 0,    0.1  ],
    ['.mh-interior-slide',          'img',    1.1,  0,    0.1  ],
    ['.mh-result-slide',            'img',    1.1,  0,    0.12 ],
    // .mh-booking__desc / .mh-form are the shared mobile booking block —
    // reused on index.html, promos.html and every services*/procedures*
    // page. The form itself reveals as one block (not per-field) so a
    // stalled observer can never leave an input stuck invisible.
    ['.mh-booking__desc',           'up',     1.0,  0.15, 0    ],
    ['.mh-form',                    'up',     1.05, 0.25, 0    ],

    // ── MOBILE — promos.html grid ────────────────────────────
    // Scoped to .mh-promos-cards because .mh-promo-card is a different,
    // already-covered element on index.html (the text panel nested
    // inside .mh-promo-slide, which handles its own reveal above).
    ['.mh-promos-heading',              'up', 1.05, 0,    0    ],
    ['.mh-promos-cards .mh-promo-card', 'up', 0.95, 0,    0.12 ],

    // ── MOBILE — prices.html accordions ──────────────────────
    // Only the (always-visible) accordion row animates — its collapsible
    // __body is already governed by its own open/close max-height
    // transition and must not also start from opacity:0.
    ['.mh-price-hero__title',       'up',     1.1,  0,    0    ],
    ['.mh-price-hero__sub',         'up',     0.95, 0.15, 0    ],
    ['.mh-price-accordion',         'up',     0.9,  0,    0.09 ],

    // ── MOBILE — services.html / services/procedures/* contact block ──
    ['.mh-services-contact__lines', 'left',   1.0,  0,    0    ],
    ['.mh-services-contact__map',   'right',  1.0,  0.15, 0    ],

    // ── MOBILE — shared footer (.mh-footer, ~30 pages) ───────
    ['.mh-footer__links',           'up',     0.85, 0,    0    ],
    ['.mh-footer__socials',         'up',     0.8,  0.15, 0    ],
    ['.mh-footer__wordmark',        'up',     1.05, 0.25, 0    ],
    ['.mh-footer__text',            'up',     0.9,  0.35, 0    ],
    ['.mh-footer__pill',            'up',     0.85, 0.45, 0    ],
    ['.mh-footer__legal',           'up',     0.8,  0.5,  0    ],

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
    ['.promo-card',                 'up',     1.1,  0,    0.16 ],
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
    ['.price-block',                'up',     0.6,  0,    0.08 ],

    // ── Stats & photos ─────────────────────────────────────
    // Homepage stats (#about-stats-home) are excluded — they run inside the
    // "Экспертная красота" section's own entrance sequence, timed to appear
    // only after the circle/device photo has finished, not on their own
    // independent scroll trigger. about.html's hero stats (.about-hero) are
    // also excluded — they run their own photo→title→cards entrance defined
    // inline in about.html, same reasoning as the homepage hero.
    ['.about-stat:not(#about-stats-home .about-stat):not(.about-hero .about-stat)', 'scale', 0.65, 0, 0.08],
    ['.about-ph',                   'img',    0.9,  0,    0.14 ],
    ['.about-photo-wrap:not(.about-hero .about-photo-wrap)', 'img', 0.9, 0.05, 0],
    ['.desc-photo',                 'img',    0.9,  0,    0    ],
    ['.svc-intro-photo',            'img',    0.9,  0,    0    ],
    ['.founder-photo',              'img',    0.9,  0,    0    ],
    ['.founder-name',               'up',     0.8,  0.05, 0    ],
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
    ['.adv-cell',                   'up',     0.65, 0,    0.1  ],

    // ── Contacts ──────────────────────────────────────────
    ['.contacts-info',              'up',     0.65, 0.1,  0    ],
    ['.contacts-links',             'up',     0.65, 0.2,  0    ],

    // ── Specialist detail ──────────────────────────────────
    ['.spec-hero__name',            'up',     0.85, 0.1,  0    ],
    ['.spec-hero__role',            'up',     0.6,  0.2,  0    ],
    ['.spec-hero__bio',             'up',     0.65, 0.28, 0    ],
    ['.spec-hero__stats',           'up',     0.65, 0.22, 0    ],
    ['.spec-hero__actions',         'up',     0.65, 0.32, 0    ],
    // Selectors below were drifting from the actual markup (spec-rev-card
    // -> spec-review-card, other-spec-card -> spec-other-card, edu-item ->
    // spec-edu-item) — silently matching nothing, so these sections never
    // animated on any of the 7 specialist pages. Corrected to the real
    // class names.
    ['.spec-review-card',           'up',     0.55, 0,    0.05 ],
    ['.spec-other-card',            'scale',  0.6,  0,    0.07 ],
    ['.spec-edu-item',              'up',     0.5,  0,    0.04 ],
    ['.spec-cert-card',             'scale',  0.55, 0,    0.06 ],
    ['.svc-indications__item, .mh-svc-indications__item', 'up', 0.5, 0, 0.05],
    // .spec-proc-card mirrors the homepage "Направления услуг" tiles
    // (.dir-tile, defined earlier in this list) — same scale/blur-in
    // reveal + stagger, so the specialist's procedure cards animate
    // identically to the services section on the homepage. Overrides
    // the plain "up" data-rr the markup sets inline (dataset.rr gets
    // reassigned here before the element is observed).
    ['.spec-proc-card',             'scale',  1.0,  0,    0.12 ],

    // ── Promo card (sticky) ────────────────────────────────
    ['.promo-card.promo-card--sticky', 'right', 0.8, 0.15, 0  ],

    // ── Promo OFFER pages (laser-new-client / smas-lifting / rf-lifting)
    // desktop — slow, unhurried pacing per the "медленные" request. ──
    ['.promo-title h1',             'up',     1.1,  0,    0    ],
    ['.promo-offer__badge',         'up',     0.95, 0,    0    ],
    ['.promo-offer__desc',          'up',     0.9,  0.15, 0    ],
    ['.promo-offer__cta',           'up',     0.8,  0.3,  0    ],
    ['.promo-offer__media',         'img',    1.3,  0.1,  0    ],
    ['.promo-info__block',          'up',     0.95, 0,    0.15 ],
    ['.promo-others h2',            'up',     1.05, 0,    0    ],
    ['.promo-others .promo-tile',   'scale',  1.1,  0,    0.15 ],

    // ── Promo OFFER pages — mobile (.mh-promo-*) ─────────────────
    ['.mh-promo-hero__img',         'img',    1.2,  0,    0    ],
    ['.mh-promo-badge',             'up',     0.85, 0.15, 0    ],
    ['.mh-promo-hero__content h1',  'up',     0.95, 0.25, 0    ],
    ['.mh-promo-hero__content p',   'up',     0.9,  0.35, 0    ],
    ['.mh-promo-hero__cta',         'up',     0.8,  0.45, 0    ],
    ['.mh-promo-details h2',        'up',     1.0,  0,    0    ],
    ['.mh-promo-details p',         'up',     0.9,  0.15, 0    ],
    ['.mh-promo-adv h2',            'up',     1.0,  0,    0    ],
    ['.mh-promo-adv__row',          'up',     0.85, 0,    0.14 ],
    ['.mh-promo-terms h2',          'up',     0.9,  0,    0    ],
    ['.mh-promo-terms p',           'up',     0.85, 0.12, 0    ],
    ['.mh-promo-others h2',         'up',     1.0,  0,    0    ],
    ['.mh-promo-others__card',      'scale',  1.1,  0,    0.16 ],
  ];

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('rr-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px 0px 0px' });

  const seen = new WeakSet();

  // Site-wide (non-hero) reveals run a touch longer than their raw RULES
  // duration so the "materialize" effect reads as unhurried rather than a
  // quick snap-in — the homepage hero/about sequences set their own pace
  // directly via the Web Animations API and aren't affected by this.
  const SMOOTH = 1.18;

  function setup() {
    RULES.forEach(([sel, type, dur, baseDelay, stagger]) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.dataset.rr = type;
        el.style.setProperty('--rr-dur', (dur * SMOOTH) + 's');
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
    initMissionTypewriter();
    initStatCounters();
  }

  /* ── HOMEPAGE HERO parallax ─────────────────────────── */
  /* Applied to the .hero__bg-stage wrapper (not the individual .hero__bg
     slide layers), which handle their own per-slide Ken Burns zoom. */
  function initParallax() {
    const heroStage = document.querySelector('.hero__bg-stage');
    if (!heroStage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    /* scroll-linked transforms tend to lag a frame behind on mobile browsers,
       reading as sluggish — skip it there and keep just the per-slide zoom */
    if (window.matchMedia('(max-width: 767px)').matches) return;
    let heroH = heroStage.parentElement.offsetHeight;
    window.addEventListener('resize', () => { heroH = heroStage.parentElement.offsetHeight; }, { passive: true });
    heroStage.style.transform = 'translateY(0) scale(1.15)';
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY < heroH * 1.2)
            heroStage.style.transform = `translateY(${window.scrollY * 0.28}px) scale(1.15)`;
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
    if (window.matchMedia('(max-width: 767px)').matches) return;
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

  /* ── TYPEWRITER (mission statement) ─────────────────────
     Pre-renders the full text (so line-wrapping is correct from the
     start and nothing reflows while typing), wraps every character in
     its own span, then reveals them one at a time via opacity — an
     absolutely-positioned caret tracks the current character's rect. */
  function initMissionTypewriter() {
    const el = document.querySelector('[data-rr="type"]');
    if (!el || el.dataset.twDone) return;
    el.dataset.twDone = '1';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function wrapChars(node) {
      const spans = [];
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            const span = document.createElement('span');
            span.className = 'tw-ch';
            span.textContent = ch;
            frag.appendChild(span);
            spans.push(span);
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          spans.push(...wrapChars(child));
        }
      });
      return spans;
    }

    const chars = wrapChars(el);
    if (!chars.length) return;

    const caret = document.createElement('span');
    caret.className = 'tw-caret';
    el.appendChild(caret);

    function positionCaret(span) {
      const pRect = el.getBoundingClientRect();
      const cRect = span.getBoundingClientRect();
      caret.style.height = cRect.height + 'px';
      caret.style.transform = `translate(${cRect.right - pRect.left}px, ${cRect.top - pRect.top}px)`;
    }

    positionCaret(chars[0]);

    const typeObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        typeObs.disconnect();
        caret.classList.add('is-active');
        let i = 0;
        (function step() {
          if (i >= chars.length) {
            setTimeout(() => caret.classList.add('tw-done'), 600);
            return;
          }
          const span = chars[i];
          span.classList.add('is-in');
          positionCaret(span);
          const isSpace = span.textContent === ' ';
          i++;
          setTimeout(step, isSpace ? 26 : 14 + Math.random() * 24);
        })();
      });
    }, { threshold: 0.5 });
    typeObs.observe(el);
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

  /* ── STAT COUNTERS (specialist hero: "12+ лет опыта", "8 сертификатов") ──
     Same count-up pattern as main.js's initCounterAnimation (homepage
     .about-v2__stat-num), reimplemented here since specialist pages don't
     load main.js. Numbers count up from 0 once their block scrolls in,
     timed just after the block's own fade-up (see .spec-hero__stats in
     RULES) finishes materializing. */
  function initStatCounters() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function parseTarget(el) {
      const text = el.textContent.trim();
      const num = parseFloat(text.replace(/[^\d.]/g, ''));
      const suffix = text.replace(/[\d.\s]/g, '');
      return { num, suffix };
    }

    function animateCounter(el, target, suffix, duration) {
      const isInt = Number.isInteger(target);
      const start = performance.now();
      (function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = (isInt ? Math.round(current) : current.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      })(start);
    }

    // [group selector, number selector, count-up duration ms] — group is
    // what's observed (so all numbers in a row start together), number
    // selector is what actually gets counted up.
    const COUNTER_GROUPS = [
      ['.spec-hero__stats', '.spec-stat__num',  1400],
      // Mobile homepage "7+ / 3000+ / 12 / 40+" row — same mechanism,
      // just a slower count (1900ms) to match the slower mobile reveal
      // pace asked for elsewhere on this page.
      ['.mh-numbers',       '.mh-numbers__n',   1900],
    ];

    COUNTER_GROUPS.forEach(([groupSel, numSel, duration]) => {
      const groups = document.querySelectorAll(groupSel);
      if (!groups.length) return;

      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          obs.unobserve(entry.target);
          setTimeout(() => {
            entry.target.querySelectorAll(numSel).forEach((el) => {
              const { num, suffix } = parseTarget(el);
              if (!isNaN(num)) animateCounter(el, num, suffix, duration);
            });
          }, 300);
        });
      }, { threshold: 0.4 });

      groups.forEach((g) => obs.observe(g));
    });
  }

  /* ── NAVBAR ────────────────────────────────────────
     Header is always solid (matches the RA|RÉ Figma design) and hides
     as the page scrolls down, reappearing as soon as the user scrolls
     back up — standard auto-hide header pattern. */
  function initSmartNav() {
    var header = document.querySelector('.site-hd, .site-header');
    if (!header) return;

    header.classList.add('rr-nav-solid');

    var HIDE_AFTER = 80; // px — stay visible near the very top
    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      if (y <= HIDE_AFTER) {
        header.classList.remove('rr-nav-hidden');
      } else if (y > lastY) {
        header.classList.add('rr-nav-hidden');
      } else if (y < lastY) {
        header.classList.remove('rr-nav-hidden');
      }
      lastY = y;
    }

    update(); // run once on load

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () { update(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

  /* Several sections ship a separate mobile-layout and desktop-layout
     <video autoplay> for the same clip (e.g. index.html's .mh-hero__photo
     vs .hero__photo, both pointing at hero-clip.mp4), toggled via CSS
     display at the 767px breakpoint. Both still decode/play even while
     display:none, doubling CPU/battery cost for a video only one of
     which is ever visible — pause whichever copy isn't. */
  function syncOffscreenVideos() {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      if (v.offsetParent === null) {
        if (!v.paused) v.pause();
      } else if (v.paused) {
        v.play().catch(function () {});
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
    document.addEventListener('DOMContentLoaded', initSmartNav);
    document.addEventListener('DOMContentLoaded', syncOffscreenVideos);
  } else {
    setup();
    initSmartNav();
    syncOffscreenVideos();
  }
  var offscreenVideoResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(offscreenVideoResizeTimer);
    offscreenVideoResizeTimer = setTimeout(syncOffscreenVideos, 200);
  });
})();
