(function () {
  'use strict';

  // ── Inject modal HTML ────────────────────────────────────────
  var modalHTML = `
<div id="booking-modal" class="bm-overlay" role="dialog" aria-modal="true" aria-labelledby="bm-title" aria-hidden="true">
  <div class="bm-card">
    <button class="bm-close" id="bm-close-btn" aria-label="Закрыть">&times;</button>
    <h2 class="bm-heading" id="bm-title">Записаться на приём</h2>
    <form class="bm-form" id="bm-form" novalidate>
      <div class="bm-field">
        <label class="bm-label" for="bm-name">Имя</label>
        <input class="bm-input" type="text" id="bm-name" name="name" placeholder="Ваше имя" autocomplete="given-name" />
      </div>
      <div class="bm-field">
        <label class="bm-label" for="bm-phone">Телефон <span class="bm-req">*</span></label>
        <input class="bm-input" type="tel" id="bm-phone" name="phone" placeholder="+7 (___) ___-__-__" required autocomplete="tel" />
      </div>
      <div class="bm-field">
        <label class="bm-label" for="bm-procedure">Процедура</label>
        <input class="bm-input" type="text" id="bm-procedure" name="procedure" placeholder="Название процедуры (необязательно)" />
      </div>
      <div class="bm-field">
        <label class="bm-label" for="bm-comment">Комментарий</label>
        <textarea class="bm-textarea" id="bm-comment" name="comment" rows="3" placeholder="Дополнительная информация (необязательно)"></textarea>
      </div>
      <div class="bm-error" id="bm-error" style="display:none;">Пожалуйста, укажите номер телефона.</div>
      <button class="bm-submit" type="submit">Отправить заявку</button>
    </form>
    <div class="bm-success" id="bm-success" style="display:none;">Спасибо! Мы свяжемся с вами.</div>
  </div>
</div>`;

  var styleCSS = `
#booking-modal.bm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 8, 5, 0.65);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0.3s;
}
#booking-modal.bm-overlay.bm-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              visibility 0s linear 0s;
}
.bm-card {
  background: var(--bg, #FBFAF3);
  border-radius: 4px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  position: relative;
  box-shadow: 0 24px 80px rgba(10, 8, 5, 0.28), 0 4px 16px rgba(10, 8, 5, 0.10);
  transform: translateY(16px);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
#booking-modal.bm-visible .bm-card {
  transform: translateY(0);
}
.bm-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: var(--text-muted, #79796D);
  cursor: pointer;
  padding: 4px 6px;
  transition: color 0.2s ease, opacity 0.2s ease;
  font-family: inherit;
}
.bm-close:hover { color: var(--text, #2a231a); }
.bm-close:focus-visible {
  outline: 2px solid var(--accent, #c9a97a);
  outline-offset: 2px;
  border-radius: 2px;
}
.bm-heading {
  font-family: var(--font-serif, 'Involve', Georgia, serif);
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 300;
  color: var(--text, #2a231a);
  letter-spacing: -0.02em;
  margin-bottom: 28px;
  line-height: 1.1;
}
.bm-form { display: flex; flex-direction: column; gap: 16px; }
.bm-field { display: flex; flex-direction: column; gap: 6px; }
.bm-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted, #79796D);
}
.bm-req { color: var(--accent, #c9a97a); }
.bm-input,
.bm-textarea {
  font-family: var(--font-sans, 'Involve', 'Helvetica Neue', Arial, sans-serif);
  font-size: 13px;
  font-weight: 300;
  color: var(--text, #2a231a);
  background: transparent;
  border: 1px solid rgba(121, 121, 109, 0.28);
  border-radius: 2px;
  padding: 12px 14px;
  line-height: 1.5;
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  outline: none;
}
.bm-input::placeholder,
.bm-textarea::placeholder { color: var(--text-light, #a09890); }
.bm-input:focus,
.bm-textarea:focus { border-color: var(--accent, #c9a97a); }
.bm-input:focus-visible,
.bm-textarea:focus-visible { outline: none; }
.bm-textarea { resize: vertical; min-height: 80px; }
.bm-error {
  font-size: 11px;
  color: #b04040;
  letter-spacing: 0.04em;
}
.bm-submit {
  font-family: var(--font-sans, 'Involve', 'Helvetica Neue', Arial, sans-serif);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  background: var(--dark, #1e1b16);
  color: var(--white, #ffffff);
  border: 1px solid var(--dark, #1e1b16);
  border-radius: 9999px;
  padding: 15px 34px;
  cursor: pointer;
  transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s ease;
  align-self: flex-start;
  margin-top: 4px;
}
.bm-submit:hover {
  background: var(--text-mid, #79796D);
  border-color: var(--text-mid, #79796D);
}
.bm-submit:active { transform: translateY(1px); }
.bm-submit:focus-visible {
  outline: 2px solid var(--accent, #c9a97a);
  outline-offset: 3px;
}
.bm-success {
  font-family: var(--font-serif, 'Involve', Georgia, serif);
  font-size: 18px;
  font-weight: 300;
  color: var(--text, #2a231a);
  text-align: center;
  padding: 20px 0 8px;
  letter-spacing: -0.01em;
}
`;

  // ── Inject style ─────────────────────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = styleCSS;
  document.head.appendChild(styleEl);

  // ── Inject modal into body ───────────────────────────────────
  var wrapper = document.createElement('div');
  wrapper.innerHTML = modalHTML.trim();
  document.body.appendChild(wrapper.firstChild);

  var modal = document.getElementById('booking-modal');
  var form  = document.getElementById('bm-form');
  var success = document.getElementById('bm-success');
  var errorEl = document.getElementById('bm-error');
  var closeBtn = document.getElementById('bm-close-btn');

  // ── Helpers ──────────────────────────────────────────────────
  function openModal() {
    // force reflow for transition
    modal.offsetHeight; // eslint-disable-line no-unused-expressions
    modal.classList.add('bm-visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // reset state
    form.style.display = 'flex';
    success.style.display = 'none';
    errorEl.style.display = 'none';
    // focus first input
    var firstInput = modal.querySelector('.bm-input');
    if (firstInput) setTimeout(function() { firstInput.focus(); }, 60);
  }

  function closeModal() {
    modal.classList.remove('bm-visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ── Click outside / close ────────────────────────────────────
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  closeBtn.addEventListener('click', closeModal);

  // ── ESC key ──────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('bm-visible')) closeModal();
  });

  // ── Form submit ──────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = document.getElementById('bm-phone').value.trim();
    if (!phone) {
      errorEl.style.display = 'block';
      document.getElementById('bm-phone').focus();
      return;
    }
    errorEl.style.display = 'none';
    form.style.display = 'none';
    success.style.display = 'block';
    setTimeout(closeModal, 2400);
  });

  // ── Intercept booking buttons ────────────────────────────────
  // Run after DOM ready; also handle dynamically added buttons via delegation
  function isBookingTrigger(el) {
    if (!el) return false;
    var tag = el.tagName;
    if (tag !== 'A' && tag !== 'BUTTON') return false;
    // Only intercept explicit #booking anchors
    var href = el.getAttribute('href') || '';
    if (href === '#booking') return true;
    // Standalone <button> elements with no href (e.g. inside forms)
    if (tag === 'BUTTON' && !href) {
      var cls = el.className || '';
      if (cls.indexOf('bm-') !== -1) return false; // skip modal own buttons
      if (cls.indexOf('booking') !== -1 || el.textContent.indexOf('Записаться') !== -1) return true;
    }
    return false;
  }

  document.addEventListener('click', function (e) {
    var el = e.target;
    // Walk up to find anchor or button
    while (el && el !== document.body) {
      if (el.tagName === 'A' || el.tagName === 'BUTTON') break;
      el = el.parentElement;
    }
    if (!isBookingTrigger(el)) return;
    // Don't intercept if explicitly marked as external
    if (el.dataset.noPopup) return;
    e.preventDefault();
    openModal();
  }, true);

})();
