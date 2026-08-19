/* ── Shared interactive widgets for services/procedures/*.html:
   before/after drag-compare slider, FAQ accordion, women|men price
   toggle. Exposes nothing globally — self-initializes on load. */
(function () {

  function initCompareSliders() {
    document.querySelectorAll('.svc-compare').forEach(function (el) {
      var dragging = false;

      function setPos(clientX) {
        var rect = el.getBoundingClientRect();
        var pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));
        el.style.setProperty('--pos', pct + '%');
      }

      el.addEventListener('pointerdown', function (e) {
        dragging = true;
        el.setPointerCapture(e.pointerId);
        setPos(e.clientX);
      });
      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        setPos(e.clientX);
      });
      function stop(e) { dragging = false; if (e.pointerId != null) { try { el.releasePointerCapture(e.pointerId); } catch (err) {} } }
      el.addEventListener('pointerup', stop);
      el.addEventListener('pointercancel', stop);

      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'slider');
      el.setAttribute('aria-label', 'Сравнение до и после');
      el.setAttribute('aria-valuemin', '0');
      el.setAttribute('aria-valuemax', '100');
      el.addEventListener('keydown', function (e) {
        var cur = parseFloat(el.style.getPropertyValue('--pos')) || 50;
        if (e.key === 'ArrowLeft') { el.style.setProperty('--pos', Math.max(0, cur - 5) + '%'); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { el.style.setProperty('--pos', Math.min(100, cur + 5) + '%'); e.preventDefault(); }
      });
    });
  }

  function initFaqAccordions() {
    document.querySelectorAll('.svc-faq-card, .mh-svc-faq-card').forEach(function (card) {
      var btn = card.querySelector('.svc-faq-card__q, .mh-svc-faq-card__q');
      var answer = card.querySelector('.svc-faq-card__a, .mh-svc-faq-card__a');
      if (!btn || !answer) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var isOpen = card.classList.contains('is-open');
        if (isOpen) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          requestAnimationFrame(function () { answer.style.maxHeight = '0px'; });
          card.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          card.classList.add('is-open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          btn.setAttribute('aria-expanded', 'true');
          answer.addEventListener('transitionend', function handler() {
            if (card.classList.contains('is-open')) answer.style.maxHeight = 'none';
            answer.removeEventListener('transitionend', handler);
          });
        }
      });
    });
  }

  function initGenderToggle() {
    document.querySelectorAll('[data-gender-toggle]').forEach(function (toggle) {
      var scope = toggle.closest('[data-gender-scope]') || document;
      var women = toggle.querySelector('[data-gender="women"]');
      var men = toggle.querySelector('[data-gender="men"]');
      var womenPanel = scope.querySelector('[data-gender-panel="women"]');
      var menPanel = scope.querySelector('[data-gender-panel="men"]');
      if (!women || !men) return;
      function show(which) {
        women.classList.toggle('is-on', which === 'women');
        women.classList.toggle('is-off', which !== 'women');
        men.classList.toggle('is-on', which === 'men');
        men.classList.toggle('is-off', which !== 'men');
        if (womenPanel) womenPanel.style.display = which === 'women' ? '' : 'none';
        if (menPanel) menPanel.style.display = which === 'men' ? '' : 'none';
      }
      women.addEventListener('click', function () { show('women'); });
      men.addEventListener('click', function () { show('men'); });
    });
  }

  function initVideoControls() {
    document.querySelectorAll('.svc-hero__media, .mh-svc-hero__media').forEach(function (media) {
      var video = media.querySelector('video');
      if (!video) return;

      var indicator = document.createElement('div');
      indicator.className = 'svc-play-indicator';
      indicator.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l11-7L8 5z" fill="#fff"/></svg>';
      media.appendChild(indicator);

      var bar = document.createElement('div');
      bar.className = 'svc-video-bar';
      var fill = document.createElement('div');
      fill.className = 'svc-video-bar__fill';
      bar.appendChild(fill);
      media.appendChild(bar);

      function updateFill() {
        if (!video.duration) return;
        fill.style.width = (video.currentTime / video.duration * 100) + '%';
      }
      video.addEventListener('timeupdate', updateFill);
      video.addEventListener('play', function () { media.classList.remove('is-paused'); });
      video.addEventListener('pause', function () { media.classList.add('is-paused'); });

      media.addEventListener('click', function (e) {
        if (e.target.closest('.svc-sound-btn') || e.target.closest('.svc-video-bar')) return;
        if (video.paused) video.play(); else video.pause();
      });

      var seeking = false;
      function seekTo(clientX) {
        var rect = bar.getBoundingClientRect();
        var pct = (clientX - rect.left) / rect.width;
        pct = Math.max(0, Math.min(1, pct));
        if (video.duration) video.currentTime = pct * video.duration;
      }
      bar.addEventListener('pointerdown', function (e) {
        seeking = true;
        bar.setPointerCapture(e.pointerId);
        seekTo(e.clientX);
        e.stopPropagation();
      });
      bar.addEventListener('pointermove', function (e) { if (seeking) seekTo(e.clientX); });
      function stopSeek(e) { seeking = false; try { bar.releasePointerCapture(e.pointerId); } catch (err) {} }
      bar.addEventListener('pointerup', stopSeek);
      bar.addEventListener('pointercancel', stopSeek);
    });
  }

  function initResultsCarousels() {
    document.querySelectorAll('.svc-results, .mh-svc-results').forEach(function (section) {
      var slides = Array.from(section.querySelectorAll('.svc-compare-slide'));
      if (slides.length < 2) return;
      var dots = Array.from(section.querySelectorAll('.svc-results__dots .dot'));
      function render(index) {
        slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
        dots.forEach(function (d, i) { d.classList.toggle('dot--active', i === index); });
      }
      dots.forEach(function (d, i) {
        d.style.cursor = 'pointer';
        d.addEventListener('click', function () { render(i); });
      });
    });
  }

  function initSoundToggles() {
    document.querySelectorAll('.svc-sound-btn').forEach(function (btn) {
      var video = btn.previousElementSibling;
      if (!video || video.tagName !== 'VIDEO') return;
      btn.addEventListener('click', function () {
        video.muted = !video.muted;
        var on = !video.muted;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-pressed', String(on));
        btn.setAttribute('aria-label', on ? 'Выключить звук' : 'Включить звук');
        if (on) video.play().catch(function () {});
      });
    });
  }

  initCompareSliders();
  initFaqAccordions();
  initGenderToggle();
  initSoundToggles();
  initVideoControls();
  initResultsCarousels();
})();
