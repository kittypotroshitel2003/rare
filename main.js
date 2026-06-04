/* ============================================================
   RA|RÉ — main.js
   Global JS: animations, slider, modal, accordion, BA, etc.
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. IntersectionObserver fade-in ──────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('revealed');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
  }

  /* ── 3. Booking modal ─────────────────────────────────── */
  function initModal() {
    const overlay = document.getElementById('booking-modal');
    if (!overlay) return;

    const open = (preService) => {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (preService) {
        const sel = overlay.querySelector('[name="service"]');
        if (sel) {
          for (let opt of sel.options) {
            if (opt.value === preService || opt.textContent.toLowerCase().includes(preService.toLowerCase())) {
              sel.value = opt.value;
              break;
            }
          }
        }
      }
    };
    const close = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const closeBtn = overlay.querySelector('.modal__close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    document.querySelectorAll('a[href="#booking"], [data-booking]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const service = el.dataset.service || '';
        open(service);
      });
    });

    window.openBookingModal = open;
    window.closeBookingModal = close;
  }

  /* ── 4. Hero slider ───────────────────────────────────── */
  function initHeroSlider() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const slides = hero.querySelectorAll('.hero__slide');
    const dots = hero.querySelectorAll('.hero__dot');
    const progress = hero.querySelector('.hero__progress');
    if (!slides.length) return;

    let current = 0;
    let timer = null;

    const goTo = (idx) => {
      slides[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
      if (progress) {
        progress.classList.remove('running');
        void progress.offsetWidth; // reflow
        progress.classList.add('running');
      }
    };

    const next = () => goTo(current + 1);

    const startAuto = () => {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    };

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goTo(i);
        startAuto();
      });
    });

    goTo(0);
    startAuto();

    // Pause on hover
    hero.addEventListener('mouseenter', () => clearInterval(timer));
    hero.addEventListener('mouseleave', startAuto);

    // Touch/swipe
    let touchStartX = 0;
    hero.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) {
        goTo(dx < 0 ? current + 1 : current - 1);
        startAuto();
      }
    });
  }

  /* ── 4b. Hero V2 Slider ──────────────────────────────── */
  function initHeroV2Slider() {
    const slider = document.querySelector('.hero-v2__slider');
    if (!slider) return;
    const slides = slider.querySelectorAll('.hero-v2__slide');
    const countEl = slider.querySelector('.hero-v2__nav-count');
    const prevBtn = slider.querySelector('[data-hero-prev]');
    const nextBtn = slider.querySelector('[data-hero-next]');
    if (!slides.length) return;

    let current = 0;
    const total = slides.length;
    let timer = null;

    const pad = (n) => String(n).padStart(2, '0');

    const goTo = (idx) => {
      slides[current].classList.remove('hero-v2__slide--active');
      current = (idx + total) % total;
      slides[current].classList.add('hero-v2__slide--active');
      if (countEl) countEl.textContent = pad(current + 1) + ' / ' + pad(total);
    };

    const startAuto = () => {
      clearInterval(timer);
      timer = setInterval(() => goTo(current + 1), 6000);
    };

    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

    // Touch swipe
    let touchStartX = 0;
    slider.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) { goTo(dx < 0 ? current + 1 : current - 1); startAuto(); }
    });

    // Pause on hover
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', startAuto);

    goTo(0);
    startAuto();
  }

  /* ── 5. Accordion (FAQ + generic) ────────────────────── */
  function initAccordion() {
    document.querySelectorAll('.accordion-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.accordion-item');
        const body = item.querySelector('.accordion-body');
        const inner = item.querySelector('.accordion-body__inner');
        const isOpen = item.classList.contains('open');

        // Close all siblings
        const parent = item.parentElement;
        parent.querySelectorAll('.accordion-item.open').forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('open');
            const b = openItem.querySelector('.accordion-body');
            if (b) b.style.maxHeight = '0';
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          if (body) body.style.maxHeight = '0';
        } else {
          item.classList.add('open');
          if (body && inner) body.style.maxHeight = inner.scrollHeight + 'px';
        }
      });
    });

    // Price category accordion
    document.querySelectorAll('.price-category__header').forEach((hdr) => {
      hdr.addEventListener('click', () => {
        const cat = hdr.closest('.price-category');
        const body = cat.querySelector('.price-category__body');
        const isOpen = cat.classList.contains('open');
        cat.classList.toggle('open', !isOpen);
        if (body) body.style.maxHeight = isOpen ? '0' : body.scrollHeight + 'px';
      });
    });
  }

  /* ── 6. Before/After slider ───────────────────────────── */
  function initBASlider() {
    document.querySelectorAll('.ba-card').forEach((card) => {
      const after = card.querySelector('.ba-card__after');
      const divider = card.querySelector('.ba-card__divider');
      const handle = card.querySelector('.ba-card__handle');
      if (!after) return;

      let isDragging = false;

      const setPos = (x) => {
        const rect = card.getBoundingClientRect();
        let pct = ((x - rect.left) / rect.width) * 100;
        pct = Math.max(5, Math.min(95, pct));
        after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        if (divider) divider.style.left = pct + '%';
        if (handle) handle.style.left = pct + '%';
      };

      card.addEventListener('mousedown', (e) => { isDragging = true; setPos(e.clientX); });
      window.addEventListener('mousemove', (e) => { if (isDragging) setPos(e.clientX); });
      window.addEventListener('mouseup', () => { isDragging = false; });
      card.addEventListener('touchstart', (e) => { isDragging = true; setPos(e.touches[0].clientX); }, { passive: true });
      window.addEventListener('touchmove', (e) => { if (isDragging) setPos(e.touches[0].clientX); }, { passive: true });
      window.addEventListener('touchend', () => { isDragging = false; });
    });
  }

  /* ── 7. Countdown timer ───────────────────────────────── */
  function initCountdown() {
    document.querySelectorAll('[data-countdown]').forEach((el) => {
      const target = new Date(el.dataset.countdown);
      if (isNaN(target)) return;

      const daysEl = el.querySelector('[data-days]');
      const hoursEl = el.querySelector('[data-hours]');
      const minsEl = el.querySelector('[data-mins]');
      const secsEl = el.querySelector('[data-secs]');

      const pad = (n) => String(n).padStart(2, '0');

      const tick = () => {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
          if (daysEl) daysEl.textContent = '00';
          if (hoursEl) hoursEl.textContent = '00';
          if (minsEl) minsEl.textContent = '00';
          if (secsEl) secsEl.textContent = '00';
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (daysEl) daysEl.textContent = pad(d);
        if (hoursEl) hoursEl.textContent = pad(h);
        if (minsEl) minsEl.textContent = pad(m);
        if (secsEl) secsEl.textContent = pad(s);
      };

      tick();
      setInterval(tick, 1000);
    });
  }

  /* ── 8. Mobile burger menu ────────────────────────────── */
  function initBurger() {
    const burger = document.querySelector('.header__burger');
    const nav = document.querySelector('.mobile-nav');
    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('active');
      nav.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        burger.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── 9. Phone mask ────────────────────────────────────── */
  function applyPhoneMask(input) {
    input.addEventListener('input', (e) => {
      let v = input.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (v.startsWith('7')) v = v.slice(1);
      v = v.slice(0, 10);
      let result = '+7 (';
      if (v.length === 0) { input.value = ''; return; }
      if (v.length <= 3) {
        result += v;
      } else if (v.length <= 6) {
        result += v.slice(0, 3) + ') ' + v.slice(3);
      } else if (v.length <= 8) {
        result += v.slice(0, 3) + ') ' + v.slice(3, 6) + '-' + v.slice(6);
      } else {
        result += v.slice(0, 3) + ') ' + v.slice(3, 6) + '-' + v.slice(6, 8) + '-' + v.slice(8);
      }
      input.value = result;
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '+7 (') {
        input.value = '';
      }
    });
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '+7 (';
    });
    input.addEventListener('blur', () => {
      if (input.value === '+7 (') input.value = '';
    });
  }

  function initPhoneMasks() {
    document.querySelectorAll('input[type="tel"], input[data-phone]').forEach(applyPhoneMask);
  }

  /* ── 10. Form validation ──────────────────────────────── */
  function initForms() {
    document.querySelectorAll('form[data-validate]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let valid = true;

        form.querySelectorAll('[required]').forEach((field) => {
          const errEl = field.parentElement.querySelector('.form-error');
          field.classList.remove('error');
          if (errEl) errEl.textContent = '';

          if (!field.value.trim()) {
            valid = false;
            field.classList.add('error');
            if (errEl) errEl.textContent = 'Заполните поле';
          } else if (field.type === 'tel') {
            const digits = field.value.replace(/\D/g, '');
            if (digits.length < 11) {
              valid = false;
              field.classList.add('error');
              if (errEl) errEl.textContent = 'Введите полный номер';
            }
          } else if (field.type === 'checkbox' && !field.checked) {
            valid = false;
            field.classList.add('error');
            if (errEl) errEl.textContent = 'Необходимо согласие';
          }
        });

        if (valid) {
          const btn = form.querySelector('button[type="submit"]');
          const orig = btn ? btn.textContent : '';
          if (btn) { btn.textContent = 'Отправлено ✓'; btn.disabled = true; }
          setTimeout(() => {
            form.reset();
            if (btn) { btn.textContent = orig; btn.disabled = false; }
            if (typeof window.closeBookingModal === 'function') window.closeBookingModal();
          }, 2000);
        }
      });
    });
  }

  /* ── 11. Lightbox ─────────────────────────────────────── */
  function initLightbox() {
    const overlay = document.getElementById('lightbox') || (() => {
      const el = document.createElement('div');
      el.className = 'lightbox-overlay';
      el.id = 'lightbox';
      el.innerHTML = `<button class="lightbox-close" aria-label="Закрыть">✕</button><img src="" alt="" />`;
      document.body.appendChild(el);
      return el;
    })();

    const img = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    const open = (src, alt) => {
      img.src = src;
      img.alt = alt || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => { img.src = ''; }, 350);
    };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    document.querySelectorAll('[data-lightbox]').forEach((el) => {
      el.addEventListener('click', () => {
        const src = el.dataset.lightbox || el.querySelector('img')?.src || el.src;
        const alt = el.dataset.lightboxAlt || el.querySelector('img')?.alt || '';
        open(src, alt);
      });
    });
  }

  /* ── 12. Smooth scroll ────────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === '#' || href === '#booking') return;
      a.addEventListener('click', (e) => {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ── 13. Reviews slider (generic prev/next) ───────────── */
  function initReviewsSlider() {
    document.querySelectorAll('[data-slider]').forEach((wrap) => {
      const track = wrap.querySelector('[data-slider-track]');
      const prevBtn = wrap.querySelector('[data-slider-prev]');
      const nextBtn = wrap.querySelector('[data-slider-next]');
      if (!track) return;

      const items = track.querySelectorAll('[data-slide]');
      if (!items.length) return;

      let cur = 0;
      const max = items.length - 1;

      const show = (idx) => {
        items.forEach((item, i) => {
          item.style.display = i === idx ? '' : 'none';
        });
        if (prevBtn) prevBtn.disabled = idx === 0;
        if (nextBtn) nextBtn.disabled = idx === max;
      };

      if (prevBtn) prevBtn.addEventListener('click', () => { if (cur > 0) show(--cur); });
      if (nextBtn) nextBtn.addEventListener('click', () => { if (cur < max) show(++cur); });
      show(0);
    });
  }

  /* ── 14. Nav dropdown keyboard ────────────────────────── */
  function initNavDropdown() {
    document.querySelectorAll('.nav-item').forEach((item) => {
      const link = item.querySelector('.header__nav-link');
      const dropdown = item.querySelector('.nav-dropdown');
      if (!link || !dropdown) return;
      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');
      item.addEventListener('mouseenter', () => link.setAttribute('aria-expanded', 'true'));
      item.addEventListener('mouseleave', () => link.setAttribute('aria-expanded', 'false'));
    });
  }

  /* ── 15. Filter buttons ───────────────────────────────── */
  function initFilters() {
    document.querySelectorAll('.filter-bar').forEach((bar) => {
      const btns = bar.querySelectorAll('.filter-btn');
      const wrap = bar.closest('section') || document.body;
      const cards = wrap.querySelectorAll('[data-filter-item]');

      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          btns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const val = btn.dataset.filter || 'all';
          cards.forEach((card) => {
            const match = val === 'all' || card.dataset.filterItem === val;
            card.style.display = match ? '' : 'none';
          });
        });
      });
    });
  }

  /* ── Clinic Gallery ──────────────────────────────────── */
  function initClinicGallery() {
    const gallery = document.querySelector('.clinic-gallery');
    if (!gallery) return;
    const mainImg = gallery.querySelector('.clinic-gallery__main-img');
    const thumbs = gallery.querySelectorAll('.clinic-gallery__thumb');
    const currentEl = gallery.querySelector('.clinic-gallery__current');
    let current = 0;
    const images = Array.from(thumbs).map(function(t) { return t.querySelector('img').src; });

    function goTo(idx) {
      thumbs[current].classList.remove('clinic-gallery__thumb--active');
      current = (idx + images.length) % images.length;
      mainImg.classList.add('fading');
      setTimeout(function() {
        mainImg.src = images[current];
        mainImg.classList.remove('fading');
      }, 200);
      thumbs[current].classList.add('clinic-gallery__thumb--active');
      if (currentEl) currentEl.textContent = current + 1;
    }

    thumbs.forEach(function(thumb, i) { thumb.addEventListener('click', function() { goTo(i); }); });
    var prev = gallery.querySelector('.clinic-gallery__arrow--prev');
    var next = gallery.querySelector('.clinic-gallery__arrow--next');
    if (prev) prev.addEventListener('click', function() { goTo(current - 1); });
    if (next) next.addEventListener('click', function() { goTo(current + 1); });
  }

  /* ── Stats counter animation ─────────────────────────── */
  function initCounterAnimation() {
    const nums = document.querySelectorAll('.about-v2__stat-num');
    if (!nums.length) return;

    const parseTarget = (el) => {
      const text = el.dataset.target || el.textContent.trim();
      const num = parseFloat(text.replace(/[^\d.]/g, ''));
      const suffix = text.replace(/[\d.\s]/g, '');
      return { num, suffix };
    };

    const animateCounter = (el, target, suffix, duration) => {
      // store original so re-runs don't re-parse wrong value
      if (!el.dataset.target) el.dataset.target = el.textContent.trim();
      const start = performance.now();
      const isInt = Number.isInteger(target);
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = (isInt ? Math.round(current) : current.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    // Trigger counter when the stats container becomes revealed
    const statsBlock = document.querySelector('.about-v2__stats');
    if (!statsBlock) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          nums.forEach((el) => {
            const { num, suffix } = parseTarget(el);
            if (!isNaN(num)) animateCounter(el, num, suffix, 1800);
          });
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    obs.observe(statsBlock);
  }

  /* ── Init ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initCounterAnimation();
    initModal();
    initHeroSlider();
    initHeroV2Slider();
    initAccordion();
    initBASlider();
    initCountdown();
    initBurger();
    initPhoneMasks();
    initForms();
    initLightbox();
    initSmoothScroll();
    initReviewsSlider();
    initNavDropdown();
    initFilters();
    initClinicGallery();
  });
})();
