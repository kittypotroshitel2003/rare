/* ── Навигатор по услугам (services.html, ≤1024px) ───────────────────
   Аккордеон направлений, поиск по названиям и подбор по проблеме.

   Данные берутся из разметки, а не дублируются в скрипте: список
   процедур и их привязка к проблемам лежат в HTML, поэтому страница
   остаётся полноценной и без JS — все 33 ссылки видны поисковику,
   а человек с отключённым скриптом просто видит раскрытые списки. */
(function () {
  'use strict';

  var nav = document.getElementById('svc-nav');
  if (!nav) return;

  var items = Array.prototype.slice.call(nav.querySelectorAll('.svc-acc__item'));
  var rows = Array.prototype.slice.call(nav.querySelectorAll('.svc-acc__row'));
  var problems = Array.prototype.slice.call(nav.querySelectorAll('.svc-problem'));
  var input = document.getElementById('svc-search-input');
  var clearBtn = document.getElementById('svc-search-clear');
  var hint = document.getElementById('svc-search-hint');
  var empty = document.getElementById('svc-nav-empty');

  function panelOf(item) { return item.querySelector('.svc-acc__panel'); }
  function toggleOf(item) { return item.querySelector('.svc-acc__toggle'); }

  function setOpen(item, open) {
    panelOf(item).hidden = !open;
    toggleOf(item).setAttribute('aria-expanded', String(open));
  }

  /* Обычный режим: аккордеон, одно направление за раз. Гармошка «по
     одному» здесь уместна — с семью раскрытыми списками экран снова
     превращается в бесконечную ленту, от которой и уходили. */
  items.forEach(function (item) {
    toggleOf(item).addEventListener('click', function () {
      var open = panelOf(item).hidden;
      if (filtering()) { setOpen(item, open); return; }
      items.forEach(function (o) { setOpen(o, o === item && open); });
    });
  });

  var activeProblem = null;
  function filtering() { return activeProblem !== null || (input && input.value.trim() !== ''); }

  function norm(s) { return s.toLowerCase().replace(/ё/g, 'е').trim(); }

  function reset() {
    items.forEach(function (item) { item.hidden = false; setOpen(item, false); });
    rows.forEach(function (r) { r.hidden = false; });
    empty.hidden = true;
    hint.textContent = '';
  }

  function applyFilter(match, label) {
    var total = 0;
    items.forEach(function (item) {
      var shown = 0;
      Array.prototype.forEach.call(item.querySelectorAll('.svc-acc__row'), function (r) {
        var ok = match(r);
        r.hidden = !ok;
        if (ok) shown++;
      });
      item.hidden = shown === 0;
      setOpen(item, shown > 0);
      total += shown;
    });
    empty.hidden = total > 0;
    hint.textContent = total > 0 ? label(total) : '';
    return total;
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  function runSearch() {
    var q = norm(input.value);
    clearBtn.hidden = q === '';
    if (q === '') { if (activeProblem) applyProblem(activeProblem, true); else reset(); return; }
    if (activeProblem) { activeProblem = null; problems.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); }
    applyFilter(
      function (r) {
        var dirName = norm(r.closest('.svc-acc__item').querySelector('.svc-acc__name').textContent);
        return norm(r.textContent).indexOf(q) !== -1 || dirName.indexOf(q) !== -1;
      },
      function (n) { return 'Нашли ' + n + ' ' + plural(n, 'услугу', 'услуги', 'услуг'); }
    );
  }

  function applyProblem(btn, keep) {
    var procs = (btn.dataset.procs || '').split(/\s+/);
    applyFilter(
      function (r) { return procs.indexOf(r.dataset.proc) !== -1; },
      function (n) { return 'Подобрали ' + n + ' ' + plural(n, 'услугу', 'услуги', 'услуг'); }
    );
    if (!keep) { activeProblem = btn; }
  }

  problems.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = activeProblem === btn;
      problems.forEach(function (b) { b.setAttribute('aria-pressed', String(!on && b === btn)); });
      if (on) { activeProblem = null; reset(); return; }
      if (input) { input.value = ''; clearBtn.hidden = true; }
      applyProblem(btn);
    });
  });

  if (input) {
    input.addEventListener('input', runSearch);
    clearBtn.addEventListener('click', function () { input.value = ''; input.focus(); runSearch(); });
  }

  reset();
})();
