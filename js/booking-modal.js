/* ============================================================
   BOOKING MODAL + маска телефона.

   Раньше «Записаться» и «Онлайн-запись» вели на якорь #booking, а со
   внутренних страниц — на главную, то есть человек терял страницу, с
   которой решил записаться. Теперь любой такой клик открывает форму
   поверх текущей страницы, а заголовок попапа называет контекст:
   процедуру, специалиста или акцию.

   Разметка собирается здесь, а не в 58 HTML-файлах: список услуг
   клонируется из формы, которая уже есть на странице, поэтому состав
   услуг остаётся единым и не расходится.
   ============================================================ */
(function () {
  'use strict';

  /* ── Маска телефона ────────────────────────────────────────────
     Российский номер: в поле физически не набрать ничего, кроме
     +7 (XXX) XXX-XX-XX. Ведущие 7/8 съедаются, вставка из буфера
     чистится, курсор при обычном наборе остаётся в конце. */
  function formatPhone(raw) {
    var d = (raw || '').replace(/\D/g, '');
    if (d[0] === '8' || d[0] === '7') d = d.slice(1);
    d = d.slice(0, 10);
    if (!d) return '';
    var out = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) out += ')';
    if (d.length > 3) out += ' ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }

  function phoneDigits(v) {
    var d = (v || '').replace(/\D/g, '');
    if (d[0] === '8' || d[0] === '7') d = d.slice(1);
    return d.slice(0, 10);
  }

  function bindPhoneMask(input) {
    if (!input || input.dataset.bkmMask) return;
    input.dataset.bkmMask = '1';
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel');
    input.setAttribute('maxlength', '18');

    /* каретка всегда уходит в конец: номер набирают слева направо, а
       попытка сохранить позицию внутри маски даёт скачки курсора,
       когда вставляются скобки и дефисы */
    function reformat(el) {
      var next = formatPhone(el.value);
      if (next !== el.value) el.value = next;
      var end = el.value.length;
      try { el.setSelectionRange(end, end); } catch (err) { /* не для всех типов полей */ }
    }
    input.addEventListener('input', function () { reformat(this); });
    /* поле не префиксуем «+7 (» заранее: тогда набранная первой восьмёрка
       считалась бы уже цифрой номера (+7 (891)…), а её нужно съедать как
       междугородний код — префикс подставляется с первой значащей цифрой */
    input.addEventListener('focus', function () {
      var el = this;
      setTimeout(function () {
        var end = el.value.length;
        try { el.setSelectionRange(end, end); } catch (err) {}
      }, 0);
    });
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text');
      this.value = formatPhone(this.value + text);
      reformat(this);
    });
  }

  /* ── Контекст страницы → заголовок попапа ──────────────────── */
  function pageContext() {
    var path = window.location.pathname;
    function h1() {
      var el = document.querySelector('h1');
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }
    function crumb() {
      var el = document.querySelector('.svc-breadcrumb__current, .mh-svc-breadcrumb__current');
      return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }
    if (/\/services\/procedures\//.test(path)) {
      return { title: 'Запись на процедуру', eyebrow: crumb() || h1() };
    }
    if (/\/promos\//.test(path)) {
      return { title: 'Запись по акции', eyebrow: h1() };
    }
    if (/\/promos\.html$/.test(path)) {
      return { title: 'Запись по акции', eyebrow: '' };
    }
    if (/\/specialists\/index\.html$|\/specialists\/?$/.test(path)) {
      return { title: 'Запись к специалисту', eyebrow: '' };
    }
    if (/\/specialists\//.test(path)) {
      return { title: 'Запись к специалисту', eyebrow: h1() };
    }
    if (/\/articles\//.test(path)) {
      return { title: 'Запись на консультацию', eyebrow: '' };
    }
    if (/\/prices\.html$/.test(path)) {
      return { title: 'Запись на приём', eyebrow: 'Стоимость подтвердим на консультации' };
    }
    if (/\/services\.html$/.test(path)) {
      return { title: 'Запись на приём', eyebrow: 'Услугу можно выбрать в форме' };
    }
    if (/\/certificates\.html$/.test(path)) {
      return { title: 'Онлайн-запись', eyebrow: 'Сертификат тоже оформим по заявке' };
    }
    return { title: 'Онлайн-запись', eyebrow: '' };
  }

  /* ── Список услуг ──────────────────────────────────────────────
     По умолчанию клонируем селект страницы — он уже содержит нужный
     состав и выбранную услугу. Запасной список нужен там, где формы
     на странице нет (акции, сертификаты, отзывы, правовая). */
  var SERVICES = [
    ['cosmetologist-consultation', 'Приём косметолога'],
    ['trichologist-consultation',  'Приём трихолога'],
    ['nutritionist-consultation',  'Приём нутрициолога'],
    ['ultrasound-diagnostics',     'Ультразвуковая диагностика'],
    ['smas-lifting',               'SMAS лифтинг'],
    ['rf-volnewmer',               'Монополярный RF-лифтинг Volnewmer'],
    ['rf-sylfirm',                 'Микроигольчатый RF-лифтинг Sylfirm X'],
    ['nordlys',                    'Фотосистема IPL Nordlys'],
    ['photorejuvenation',          'Фотоомоложение'],
    ['acne-treatment',             'Лечение акне'],
    ['rosacea-treatment',          'Лечение купероза и розацеа'],
    ['pigmentation-removal',       'Устранение пигментации'],
    ['laser-resurfacing',          'Лазерная шлифовка'],
    ['laser-epilation',            'Лазерная эпиляция'],
    ['photodynamic-therapy',       'Фотодинамическая терапия Revixan'],
    ['microcurrent-therapy',       'Микротоковая терапия'],
    ['injection-cosmetology',      'Инъекционная косметология'],
    ['prp-therapy',                'PRP-терапия'],
    ['contour-plastic',            'Контурная пластика'],
    ['botulinoterapiya',           'Ботулинотерапия'],
    ['kollagenoterapiya',          'Коллагенотерапия'],
    ['carboxy',                    'Карбокситерапия'],
    ['biorevitalization',          'Биоревитализация'],
    ['mesotherapy',                'Мезотерапия'],
    ['fat-reduction',              'Устранение локальных жировых отложений'],
    ['hydra-touch',                'Гидропилинг Hydra Touch H2'],
    ['lpg-massage',                'LPG массаж'],
    ['exosomes',                   'Экзосомы'],
    ['aesthetic-cosmetology',      'Эстетическая косметология'],
    ['peeling',                    'Пилинг'],
    ['cleansing',                  'Чистки'],
    ['spa-care',                   'Спа процедуры для лица и тела'],
    ['rsl-beautylizer',            'RSL Beautylizer (RSL-скульптурирование)'],
    ['other',                      'Другое']
  ];

  function serviceOptions() {
    var src = document.querySelector('select[name="service"]:not(#bkm-service)');
    if (src) return src.innerHTML;
    var slug = (window.location.pathname.match(/\/services\/procedures\/([^/]+)\.html$/) || [])[1] || '';
    var html = '<option value="" disabled' + (slug ? '' : ' selected') + '>Выбрать услугу</option>';
    SERVICES.forEach(function (o) {
      html += '<option value="' + o[0] + '"' + (o[0] === slug ? ' selected' : '') + '>' + o[1] + '</option>';
    });
    return html;
  }

  /* ── Разметка ──────────────────────────────────────────────── */
  var ctx = pageContext();
  var modal = document.createElement('div');
  modal.className = 'bkm';
  modal.id = 'booking-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'bkm-title');
  modal.innerHTML =
    '<div class="bkm__overlay" data-bkm-close></div>' +
    '<div class="bkm__card">' +
      '<button type="button" class="bkm__close" data-bkm-close aria-label="Закрыть">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '</button>' +
      (ctx.eyebrow ? '<p class="bkm__eyebrow" id="bkm-eyebrow"></p>' : '') +
      '<h2 class="bkm__title" id="bkm-title"></h2>' +
      '<p class="bkm__desc">Оставьте контакты — менеджер перезвонит, подтвердит удобное время и ответит на вопросы. Работаем ежедневно с 9:00 до 20:00.</p>' +
      '<form class="bkm__form" novalidate>' +
        '<div class="bkm__field" data-field="name">' +
          '<label for="bkm-name">Ваше имя*</label>' +
          '<input id="bkm-name" name="name" type="text" placeholder="Анна" autocomplete="name"/>' +
          '<span class="bkm__err">Пожалуйста, введите имя</span>' +
        '</div>' +
        '<div class="bkm__field" data-field="phone">' +
          '<label for="bkm-phone">Телефон*</label>' +
          '<input id="bkm-phone" name="phone" type="tel" placeholder="+7 (___) ___-__-__"/>' +
          '<span class="bkm__err">Введите корректный номер</span>' +
        '</div>' +
        '<div class="bkm__field" data-field="service">' +
          '<label for="bkm-service">Услуга</label>' +
          '<div class="bkm__select">' +
            '<select id="bkm-service" name="service"></select>' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><polyline points="6,9 12,15 18,9"/></svg>' +
          '</div>' +
        '</div>' +
        '<button type="submit" class="bkm__submit">Записаться' +
          '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18L18 6M18 6H10M18 6V14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
        '<p class="bkm__legal">Отправляя форму, вы соглашаетесь с обработкой персональных данных.</p>' +
      '</form>' +
    '</div>';

  function mount() {
    document.body.appendChild(modal);
    modal.querySelector('#bkm-title').textContent = ctx.title;
    var eb = modal.querySelector('#bkm-eyebrow');
    if (eb) eb.textContent = ctx.eyebrow;

    modal.querySelector('#bkm-service').innerHTML = serviceOptions();

    bindPhoneMask(modal.querySelector('#bkm-phone'));
    document.querySelectorAll('input[type="tel"]').forEach(bindPhoneMask);
    wire();
  }

  /* ── Открытие/закрытие ─────────────────────────────────────── */
  var lastFocused = null;

  function open() {
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var first = modal.querySelector('#bkm-name');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function close() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    clearAll();
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  /* ── Валидация ─────────────────────────────────────────────── */
  function field(name) { return modal.querySelector('[data-field="' + name + '"]'); }

  function setError(name, msg) {
    var f = field(name);
    if (!f) return;
    f.classList.remove('has-error', 'has-ok');
    void f.offsetWidth;                       /* перезапуск shake */
    f.classList.add('has-error');
    var err = f.querySelector('.bkm__err');
    if (err && msg) err.textContent = msg;
  }
  function setOk(name) {
    var f = field(name);
    if (f) { f.classList.remove('has-error'); f.classList.add('has-ok'); }
  }
  function clearField(name) {
    var f = field(name);
    if (f) f.classList.remove('has-error', 'has-ok');
  }
  function clearAll() {
    modal.querySelectorAll('.bkm__field').forEach(function (f) {
      f.classList.remove('has-error', 'has-ok');
    });
  }

  function validateName(silent) {
    var v = modal.querySelector('#bkm-name').value.trim();
    if (!v) { if (!silent) setError('name', 'Пожалуйста, введите имя'); return false; }
    if (v.length < 2) { if (!silent) setError('name', 'Слишком короткое имя'); return false; }
    if (!silent) setOk('name');
    return true;
  }
  function validatePhone(silent) {
    var v = modal.querySelector('#bkm-phone').value;
    var d = phoneDigits(v);
    if (!d.length) { if (!silent) setError('phone', 'Пожалуйста, введите телефон'); return false; }
    if (d.length < 10) { if (!silent) setError('phone', 'Введите номер полностью'); return false; }
    if (!silent) setOk('phone');
    return true;
  }

  function success() {
    close();
    if (typeof window.openBookingPopup === 'function') {
      setTimeout(window.openBookingPopup, 220);
    }
  }

  function wire() {
    modal.querySelectorAll('[data-bkm-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      /* фокус не должен уходить из открытого диалога */
      var items = modal.querySelectorAll('button, input, select, a[href]');
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    var nameEl = modal.querySelector('#bkm-name');
    var phoneEl = modal.querySelector('#bkm-phone');
    nameEl.addEventListener('blur', function () { if (this.value.trim()) validateName(); });
    phoneEl.addEventListener('blur', function () { if (phoneDigits(this.value).length) validatePhone(); });
    nameEl.addEventListener('input', function () { clearField('name'); });
    phoneEl.addEventListener('input', function () { clearField('phone'); });

    modal.querySelector('.bkm__form').addEventListener('submit', function (e) {
      e.preventDefault();
      var okName = validateName();
      var okPhone = validatePhone();
      if (!okName) { nameEl.focus(); return; }
      if (!okPhone) { phoneEl.focus(); return; }
      this.reset();
      success();
    });

    /* Любая кнопка записи открывает форму здесь же. Ловим на document,
       чтобы работали и кнопки, которые появляются позже (плавающий
       виджет онлайн-записи, карусели). */
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('a[href]') : null;
      if (!el || modal.contains(el)) return;
      var href = el.getAttribute('href') || '';
      if (!/#booking(-mobile)?$/.test(href)) return;
      e.preventDefault();
      open();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
