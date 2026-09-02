// Document preview popup
// All linked docs are PDFs, previewed inline via native browser PDF rendering.
// Mobile browsers get the OS's own full-tab PDF viewer instead of an iframe —
// far more reliable there than embedding a PDF inside a modal iframe.
(function () {
  var modal = null;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;

  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'doc-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;visibility:hidden;pointer-events:none;';
    modal.innerHTML =
      '<div id="doc-overlay" style="position:absolute;inset:0;background:rgba(28,28,28,0.75);backdrop-filter:blur(6px);opacity:0;transition:opacity 0.3s ease"></div>' +
      '<div id="doc-card" style="position:relative;z-index:1;background:#FFFFFF;border-radius:16px;width:min(900px,calc(100vw - 32px));height:min(86vh,900px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.3);opacity:0;transform:scale(0.96) translateY(12px);transition:opacity 0.35s ease,transform 0.35s cubic-bezier(0.34,1.56,0.64,1)">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(48,54,46,0.12);flex-shrink:0">' +
          '<span id="doc-title" style="font-size:15px;font-weight:500;color:#30362E;letter-spacing:-0.01em"></span>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">' +
            '<a id="doc-open-tab" href="" target="_blank" rel="noopener noreferrer" title="Открыть в новой вкладке" style="width:32px;height:32px;border-radius:50%;background:rgba(48,54,46,0.08);display:flex;align-items:center;justify-content:center;color:#30362E;text-decoration:none;transition:background 0.2s">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>' +
            '</a>' +
            '<button id="doc-close" style="width:32px;height:32px;border-radius:50%;border:none;background:rgba(48,54,46,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;color:#30362E;transition:background 0.2s" aria-label="Закрыть">✕</button>' +
          '</div>' +
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
    document.getElementById('doc-frame').src = href + '#toolbar=1&view=FitH';
    document.getElementById('doc-open-tab').href = href;
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
    document.querySelectorAll('a[href$=".pdf"]').forEach(function (a) {
      if (a.closest('#doc-modal')) return;

      // Mobile: let the link behave natively (target="_blank" already set in
      // markup) so the OS's own full-tab PDF viewer opens it — more reliable
      // there than an iframe inside a modal.
      if (isMobile) return;

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
