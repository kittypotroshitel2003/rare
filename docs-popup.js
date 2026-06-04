// Document preview popup
(function () {
  var modal = null;

  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'doc-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;visibility:hidden;pointer-events:none;';
    modal.innerHTML =
      '<div id="doc-overlay" style="position:absolute;inset:0;background:rgba(46,65,40,0.75);backdrop-filter:blur(6px);opacity:0;transition:opacity 0.3s ease"></div>' +
      '<div id="doc-card" style="position:relative;z-index:1;background:#F3EEE8;border-radius:16px;width:min(900px,calc(100vw - 32px));height:min(82vh,900px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.3);opacity:0;transform:scale(0.96) translateY(12px);transition:opacity 0.35s ease,transform 0.35s cubic-bezier(0.34,1.56,0.64,1)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(53,40,26,0.12);flex-shrink:0">' +
          '<span id="doc-title" style="font-size:15px;font-weight:500;color:#35281a;letter-spacing:-0.01em"></span>' +
          '<button id="doc-close" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(53,40,26,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#35281a;transition:background 0.2s" aria-label="Закрыть">✕</button>' +
        '</div>' +
        '<iframe id="doc-frame" src="" style="flex:1;border:none;width:100%;background:#fff"></iframe>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('doc-close').addEventListener('click', closeDoc);
    document.getElementById('doc-overlay').addEventListener('click', closeDoc);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDoc(); });
  }

  function openDoc(href, title) {
    buildModal();
    // Use Google Docs viewer for non-PDF or embed directly for PDF
    var src = href.endsWith('.pdf')
      ? href + '#view=FitH'
      : 'https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent(location.origin + '/' + href.replace(/^\//, ''));
    document.getElementById('doc-frame').src = src;
    document.getElementById('doc-title').textContent = title || 'Документ';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
    document.getElementById('doc-overlay').style.opacity = '1';
    var card = document.getElementById('doc-card');
    card.style.opacity = '1';
    card.style.transform = 'scale(1) translateY(0)';
    document.body.style.overflow = 'hidden';
  }

  function closeDoc() {
    if (!modal) return;
    document.getElementById('doc-overlay').style.opacity = '0';
    var card = document.getElementById('doc-card');
    card.style.opacity = '0';
    card.style.transform = 'scale(0.96) translateY(12px)';
    setTimeout(function () {
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
      document.getElementById('doc-frame').src = '';
      document.body.style.overflow = '';
    }, 350);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href$=".pdf"], a[href$=".docx"], a[href*="license"], a[href*="processing"]').forEach(function (a) {
      if (a.closest('#doc-modal')) return;
      var originalHref = a.getAttribute('href');
      var title = a.textContent.trim();
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openDoc(originalHref, title);
      });
      a.removeAttribute('target');
    });
  });
})();
