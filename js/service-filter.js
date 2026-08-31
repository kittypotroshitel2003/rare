(function () {
  var hash = window.location.hash.slice(1);
  if (!hash) return;

  var target = document.getElementById(hash);
  if (!target || !target.classList.contains('svcdir-card')) return;

  var desktopWrap = document.querySelector('.svcdir-cards');
  if (!desktopWrap) return;
  var desktopCards = desktopWrap.querySelectorAll('.svcdir-card');
  if (desktopCards.length <= 1) return;

  desktopCards.forEach(function (c) {
    if (c.id !== hash) c.style.display = 'none';
  });

  var mobileWrap = document.querySelector('.mh-services__stack');
  if (mobileWrap) {
    mobileWrap.querySelectorAll('.mh-service-card').forEach(function (c) {
      if (c.getAttribute('data-slug') !== hash) c.style.display = 'none';
    });
  }

  var titleEl = target.querySelector('.svcdir-card__title');
  var titleText = titleEl ? titleEl.textContent.trim() : '';
  if (!titleText) return;

  var h1 = document.querySelector('.svcdir-heading');
  if (h1) h1.textContent = titleText;
  var crumb = document.querySelector('.svcdir-breadcrumb__current');
  if (crumb) crumb.textContent = titleText;
  var mh2 = document.querySelector('.mh-services__head .mh-section-title');
  if (mh2) mh2.textContent = titleText;
  var mCrumb = document.querySelector('.mh-breadcrumb__current');
  if (mCrumb) mCrumb.textContent = titleText;
})();
