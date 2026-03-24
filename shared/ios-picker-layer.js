(function initIOSPickerLayer() {
  function resolveElement(input) {
    if (!input) return null;
    if (typeof input === 'string') return document.getElementById(input);
    return input;
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function applyBodyClass(options) {
    const config = options || {};
    const className = config.className || 'ios-pickers';
    const target = config.target || document.body;
    if (!target) return;
    target.classList.toggle(className, isIOS());
  }

  function syncDisplay(input, display, options) {
    const inputElement = resolveElement(input);
    const displayElement = resolveElement(display);
    if (!inputElement || !displayElement) return;

    const config = options || {};
    const emptyText = config.emptyText || displayElement.dataset.emptyMessage || '—';
    const formatter = typeof config.formatter === 'function' ? config.formatter : null;
    const value = inputElement.value || '';

    if (value) {
      displayElement.textContent = formatter ? formatter(value, inputElement, displayElement) : value;
      return;
    }

    displayElement.textContent = emptyText;
  }

  function syncDisplayByIds(inputId, displayId, options) {
    syncDisplay(inputId, displayId, options);
  }

  function openPicker(event, input) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    const inputElement = resolveElement(input);
    if (!inputElement) return;

    if (typeof inputElement.showPicker === 'function') {
      try {
        inputElement.showPicker();
        return;
      } catch (_err) {}
    }

    inputElement.focus();
  }

  function syncDisplaysInContainer(container, options) {
    const root = resolveElement(container);
    if (!root) return;

    const config = options || {};
    const displaySuffix = config.displaySuffix || 'Display';
    const resolver = typeof config.inputIdResolver === 'function'
      ? config.inputIdResolver
      : function defaultResolver(displayId) {
          return displayId.endsWith(displaySuffix)
            ? displayId.slice(0, -displaySuffix.length)
            : displayId;
        };

    const displays = root.querySelectorAll(`[id$="${displaySuffix}"]`);
    displays.forEach((displayElement) => {
      const inputId = resolver(displayElement.id, displayElement);
      syncDisplayByIds(inputId, displayElement.id, { emptyText: config.emptyText, formatter: config.formatter });
    });
  }

  window.IOSPickerLayer = {
    isIOS,
    applyBodyClass,
    syncDisplay,
    syncDisplayByIds,
    openPicker,
    syncDisplaysInContainer
  };
})();
