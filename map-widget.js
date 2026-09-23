/* ── YANDEX MAP with a custom RA|RÉ logo placemark ───────────────────
   Replaces the old <iframe src="yandex.ru/map-widget/..."> embeds with
   a JS API–rendered map so the placemark can be branded instead of a
   stock Yandex pin. Targets every `.rr-map` element on the page (each
   carries its own lat/lng/zoom via data attributes, so this same
   script works unmodified everywhere the map is embedded).

   Карта всегда стоит в самом низу страницы, но её API и тайлы тянулись
   сразу при открытии — около 200 КБ трафика до того, как человек вообще
   доскроллит. Теперь инициализация ждёт, пока карта не окажется рядом с
   экраном. */
(function () {
  var maps = document.querySelectorAll('.rr-map');
  if (!maps.length) return;

  var API_KEY = 'bd33d691-d18e-4f4c-85ef-e6b195ad4ea5';
  var scriptUrl = 'https://api-maps.yandex.ru/2.1/?apikey=' + API_KEY + '&lang=ru_RU';

  function whenReady(cb) {
    if (window.ymaps) { window.ymaps.ready(cb); return; }
    var script = document.createElement('script');
    script.src = scriptUrl;
    script.onload = function () { window.ymaps.ready(cb); };
    document.head.appendChild(script);
  }

  function logoPath(el) {
    /* figure out how many folders deep the current page is, same trick
       used by booking-widget.js, so the logo asset resolves correctly
       regardless of which page embeds the map */
    var segments = window.location.pathname.split('/').filter(Boolean);
    var depth = Math.max(0, segments.length - 1);
    return '../'.repeat(depth) + 'assets/icons/logo.svg';
  }

  function build() {
    var ymaps = window.ymaps;
    var PlacemarkLayout = ymaps.templateLayoutFactory.createClass(
      '<div class="rr-map-pin">' +
      '<img src="' + logoPath() + '" alt="RA|RÉ" class="rr-map-pin__logo"/>' +
      '<span class="rr-map-pin__tail"></span>' +
      '</div>'
    );

    maps.forEach(function (el) {
      var lat = parseFloat(el.getAttribute('data-lat'));
      var lng = parseFloat(el.getAttribute('data-lng'));
      var zoom = parseInt(el.getAttribute('data-zoom'), 10) || 16;

      var map = new ymaps.Map(el, {
        center: [lat, lng],
        zoom: zoom,
        controls: ['zoomControl']
      }, {
        suppressMapOpenBlock: true
      });
      map.behaviors.disable('scrollZoom');

      var placemark = new ymaps.Placemark([lat, lng], {}, {
        iconLayout: PlacemarkLayout,
        iconShape: { type: 'Rectangle', coordinates: [[-42, -58], [42, 0]] }
      });
      map.geoObjects.add(placemark);
    });
  }

  var started = false;
  function startOnce() {
    if (started) return;
    started = true;
    whenReady(build);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) { io.disconnect(); startOnce(); return; }
      }
    }, { rootMargin: '400px 0px' });
    Array.prototype.forEach.call(maps, function (el) { io.observe(el); });
  } else {
    startOnce();
  }
})();
