/* ── Отложенная загрузка видео ───────────────────────────────────────
   Ролики на страницах процедур весят 3–12 МБ, и раньше они начинали
   качаться сразу при открытии страницы — причём оба сразу: в разметке
   есть десктопный и мобильный экземпляр с одним и тем же src, и второй
   скачивался, даже будучи скрытым через display:none.

   Теперь src проставляется только тогда, когда ролик действительно
   нужен: он в зоне видимости, он отрисован (а не скрытый дубль) и
   соединение позволяет. На мобильных автозапуск включается лишь когда
   браузер прямо сообщает о быстром соединении — Safari о соединении
   молчит, поэтому там остаётся постер и запуск по тапу. Так страница
   не съедает мегабайты без спроса на плохом интернете.

   Главная страница сюда не входит: её ролики остаются как были.  */
(function () {
  'use strict';

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var saveData = !!(conn && conn.saveData);
  var slow = !!(conn && /^(slow-2g|2g|3g)$/.test(conn.effectiveType || ''));

  function isMobile() { return window.matchMedia('(max-width: 767px)').matches; }

  // На мобильных ролик не запускается сам никогда: даже на быстром 4G это
  // 3–12 МБ ради фона, который человек не просил. Постер виден сразу,
  // видео подгружается по тапу. На десктопе поведение прежнее.
  function mayAutoplay() {
    if (isMobile()) return false;
    if (saveData || slow) return false;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Скрытый дубль не отрисован — у него нет ни offsetParent, ни прямоугольников.
  function isRendered(el) {
    return !!(el.offsetParent || el.getClientRects().length);
  }

  function attach(video) {
    if (!video || !video.dataset || !video.dataset.src) return video;
    if (!video.getAttribute('src')) {
      video.setAttribute('src', video.dataset.src);
      video.preload = 'auto';
      video.load();
    }
    return video;
  }

  function start(video) {
    attach(video);
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  var io = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          if (isRendered(e.target) && mayAutoplay()) start(e.target);
        });
      }, { rootMargin: '200px 0px' })
    : null;

  function init() {
    var autoplay = mayAutoplay();
    Array.prototype.forEach.call(document.querySelectorAll('video[data-src]'), function (v) {
      // Пока ролик не играет, на постере должна стоять кнопка воспроизведения:
      // её показывает .is-paused на контейнере (service-procedure.css).
      var media = v.parentElement;
      if (!autoplay && media && media.classList &&
          (media.classList.contains('svc-hero__media') || media.classList.contains('mh-svc-hero__media'))) {
        media.classList.add('is-paused');
      }
      if (io) io.observe(v);
      else if (autoplay && isRendered(v)) start(v);
    });
  }

  // service-procedure.js дёргает attach/start перед воспроизведением по клику.
  window.rareVideo = { attach: attach, start: start };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
