(function initPetbookPickers() {
  const pickerLayer = window.IOSPickerLayer;

  function applyIOSPickers() {
    if (!pickerLayer) return;
    pickerLayer.applyBodyClass({ className: 'ios-pickers' });
  }

  function syncPickerDisplay(inputId, displayId, emptyText) {
    if (!pickerLayer) return;
    pickerLayer.syncDisplayByIds(inputId, displayId, { emptyText: emptyText || '—' });
  }

  function openPicker(e, id) {
    if (!pickerLayer) return;
    pickerLayer.openPicker(e, id);
  }

  function syncModalPickerDisplays(contentElement) {
    if (!pickerLayer) return;
    pickerLayer.syncDisplaysInContainer(contentElement, {
      displaySuffix: 'Display'
    });
  }

  window.syncPickerDisplay = function exposedSyncPickerDisplay(inputId, displayId, emptyText) {
    syncPickerDisplay(inputId, displayId, emptyText);
  };
  window.openPicker = openPicker;
  window.PetbookPickers = {
    applyIOSPickers,
    syncModalPickerDisplays
  };
})();
