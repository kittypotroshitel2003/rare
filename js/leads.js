/* ============================================================
   ОТПРАВКА ЗАЯВОК — RRLeads.send(form)

   Все формы сайта (запись, обратная связь, попап) после своей
   проверки полей вызывают RRLeads.send(form) — до form.reset(),
   пока значения ещё на месте. Заявка уходит на /api/lead
   (server/rare-leads.py): письмо на почту клиники + дубль в
   Клиентикс. Если отправить не получилось, внизу экрана
   появляется плашка с телефоном, чтобы заявка не потерялась молча.
   ============================================================ */
(function () {
  'use strict';

  var ENDPOINT = '/api/lead';
  var PHONE = '+7 (900) 276-11-16';

  function val(form, selector) {
    var el = form.querySelector(selector);
    if (!el) return '';
    if (el.tagName === 'SELECT') {
      var opt = el.options[el.selectedIndex];
      return opt && !opt.disabled && el.value ? opt.textContent.trim() : '';
    }
    return (el.value || '').trim();
  }

  /* Что за форма: заголовок попапа, ближайший заголовок секции или <h1> */
  function context(form) {
    var modal = form.closest('[role="dialog"], .bkm, .bm-modal');
    var heading = modal && modal.querySelector('h2, h3');
    if (!heading) {
      var section = form.closest('section, aside, footer');
      heading = section && section.querySelector('h2, h3');
    }
    var eyebrow = modal && modal.querySelector('.bkm__eyebrow');
    var parts = [heading && heading.textContent, eyebrow && eyebrow.textContent];
    return parts.filter(Boolean).map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).join(' — ');
  }

  function notifyFailure() {
    if (document.getElementById('rr-lead-fail')) return;
    var bar = document.createElement('div');
    bar.id = 'rr-lead-fail';
    bar.setAttribute('role', 'alert');
    bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2000;max-width:520px;margin:0 auto;' +
      'padding:16px 20px;border-radius:12px;background:#30362e;color:#fdfcf8;font:400 15px/1.5 Inter,sans-serif;' +
      'box-shadow:0 12px 32px rgba(48,54,46,0.28);';
    bar.innerHTML = 'Заявка не отправилась — проблема со связью. Позвоните нам: ' +
      '<a href="tel:+79002761116" style="color:#cfe0c8;text-decoration:underline">' + PHONE + '</a>';
    document.body.appendChild(bar);
    setTimeout(function () { bar.remove(); }, 12000);
  }

  function send(form) {
    var hp = form.querySelector('input[name="website"]');
    var payload = {
      name: val(form, '[name="name"]'),
      phone: val(form, 'input[type="tel"], [name="phone"]'),
      service: val(form, 'select[name="service"], select[name="procedure"], [name="procedure"]'),
      comment: val(form, 'textarea, [name="message"], [name="comment"]'),
      form: context(form),
      page: location.href.split('#')[0],
      page_title: document.title.split(' — ')[0],
      website: hp ? hp.value : ''
    };
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
      keepalive: true
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return true;
    }).catch(function () {
      notifyFailure();
      return false;
    });
  }

  /* Поле-ловушка для ботов: человек его не видит и не заполняет */
  function addHoneypot(form) {
    if (form.querySelector('input[name="website"]')) return;
    var hp = document.createElement('input');
    hp.type = 'text';
    hp.name = 'website';
    hp.tabIndex = -1;
    hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
    form.appendChild(hp);
  }

  function armForms() { document.querySelectorAll('form').forEach(addHoneypot); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armForms);
  else armForms();
  /* формы попапов собираются скриптами позже */
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (n.tagName === 'FORM') addHoneypot(n);
        else if (n.querySelectorAll) n.querySelectorAll('form').forEach(addHoneypot);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.RRLeads = { send: send };
})();
