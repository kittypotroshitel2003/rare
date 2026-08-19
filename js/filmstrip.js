/* ── FILMSTRIP — generic horizontal-scroll carousel + pagination dots ──
   Shared by index.html and about.html (previously duplicated verbatim
   in each page's inline <script>). Exposes window.makeFilmstrip so each
   page's own call sites (e.g. makeFilmstrip('interior-row', 'interior-dots',
   '.interior-item')) stay where they are, next to that page's other wiring. */
(function () {
  function makeFilmstrip(stripId, dotsId, itemSelector) {
    var strip = document.getElementById(stripId);
    var dotsEl = document.getElementById(dotsId);
    if (!strip || !dotsEl) return;

    var items = Array.from(strip.querySelectorAll(itemSelector));
    var stops = [];
    var dots = [];

    function itemOffset(item) {
      return item.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
    }
    function computeStops() {
      var maxScroll = Math.max(0, strip.scrollWidth - strip.clientWidth);
      var result = [];
      items.forEach(function(item) {
        var v = Math.min(itemOffset(item), maxScroll);
        if (!result.length || v - result[result.length - 1] > 2) result.push(v);
      });
      if (!result.length) result.push(0);
      return result;
    }
    function activeIndex() {
      var pos = strip.scrollLeft;
      var closest = 0, closestDist = Infinity;
      stops.forEach(function(s, i) {
        var dist = Math.abs(s - pos);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }
    function updateDots() {
      if (!dots.length) return;
      var idx = activeIndex();
      dots.forEach(function(d, i) { d.classList.toggle('dot--active', i === idx); });
    }
    function build() {
      stops = computeStops();
      dotsEl.innerHTML = '';
      dots = stops.map(function(stopLeft, i) {
        var d = document.createElement('button');
        d.className = 'dot' + (i === 0 ? ' dot--active' : '');
        d.setAttribute('aria-label', 'Слайд ' + (i + 1));
        d.addEventListener('click', function() {
          strip.scrollTo({ left: stopLeft, behavior: 'smooth' });
        });
        dotsEl.appendChild(d);
        return d;
      });
    }

    var scrollTimer;
    strip.addEventListener('scroll', function() {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateDots, 50);
    }, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() { build(); updateDots(); }, 150);
    });

    build();
  }

  window.makeFilmstrip = makeFilmstrip;
})();
