/* BookingHub embed script (inline + popup) */
(function () {
  function getBaseUrl(script) {
    try {
      return new URL(script.src).origin;
    } catch (e) {
      return window.location.origin;
    }
  }

  function createIframe(src, height) {
    var iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.loading = 'lazy';
    iframe.style.width = '100%';
    iframe.style.height = height;
    iframe.style.border = '0';
    iframe.style.borderRadius = '12px';
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    return iframe;
  }

  function initInline(script) {
    var slug = script.getAttribute('data-slug');
    if (!slug) return;

    var baseUrl = script.getAttribute('data-base-url') || getBaseUrl(script);
    var height = script.getAttribute('data-height') || '900px';
    var target = script.getAttribute('data-target');

    var wrapper = document.createElement('div');
    wrapper.className = 'bookinghub-widget';
    wrapper.style.width = '100%';

    var iframe = createIframe(baseUrl + '/widget/' + slug, height);
    wrapper.appendChild(iframe);

    if (target) {
      var mount = document.querySelector(target);
      if (!mount) return;
      mount.appendChild(wrapper);
    } else {
      script.parentNode.insertBefore(wrapper, script.nextSibling);
    }
  }

  function initPopup(script) {
    var slug = script.getAttribute('data-slug');
    if (!slug) return;

    var baseUrl = script.getAttribute('data-base-url') || getBaseUrl(script);
    var height = script.getAttribute('data-height') || '900px';
    var buttonText = script.getAttribute('data-button-text') || 'Termin buchen';

    var button = document.createElement('button');
    button.type = 'button';
    button.textContent = buttonText;
    button.style.position = 'fixed';
    button.style.right = '24px';
    button.style.bottom = '24px';
    button.style.zIndex = '9999';
    button.style.padding = '12px 16px';
    button.style.borderRadius = '999px';
    button.style.border = '0';
    button.style.background = '#111827';
    button.style.color = '#fff';
    button.style.fontSize = '14px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 12px 30px rgba(17, 24, 39, 0.2)';

    var overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(15, 23, 42, 0.55)';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9998';

    var modal = document.createElement('div');
    modal.style.width = 'min(960px, 92vw)';
    modal.style.height = height;
    modal.style.background = '#fff';
    modal.style.borderRadius = '16px';
    modal.style.boxShadow = '0 30px 80px rgba(15, 23, 42, 0.25)';
    modal.style.position = 'relative';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '12px';
    closeBtn.style.right = '12px';
    closeBtn.style.width = '32px';
    closeBtn.style.height = '32px';
    closeBtn.style.border = '0';
    closeBtn.style.borderRadius = '999px';
    closeBtn.style.background = '#f3f4f6';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.lineHeight = '1';

    var iframe = createIframe(baseUrl + '/widget/' + slug, '100%');
    iframe.style.flex = '1';

    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    function openModal() {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }

    button.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });

    document.body.appendChild(button);
    document.body.appendChild(overlay);
  }

  function init(script) {
    if (!script || script.getAttribute('data-initialized') === '1') return;
    script.setAttribute('data-initialized', '1');

    var mode = (script.getAttribute('data-mode') || 'inline').toLowerCase();
    if (mode === 'popup') {
      initPopup(script);
    } else {
      initInline(script);
    }
  }

  var current = document.currentScript;
  if (current && current.hasAttribute('data-bookinghub')) {
    init(current);
    return;
  }

  var scripts = document.querySelectorAll('script[data-bookinghub]');
  for (var i = 0; i < scripts.length; i += 1) {
    init(scripts[i]);
  }
})();
