const LOCAL_STATE_KEY = 'petbook_v1';
const DB_NAME = 'petbook_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_ROW_KEY = 'state';
const DEFAULT_STATE = {
  pets: [],
  activePetId: null,
  currentTab: 'care',
  weightChartRange: 'month',
  notificationSettings: { medicine: true, vets: true },
  notificationLog: {}
};

let state = { ...DEFAULT_STATE };
let currentTab = state.currentTab;
let dbPromise = null;
const {
  TAB_ORDER,
  WEIGHT_RANGE_LABELS,
  SECTION_ICON_CLASSES,
  ENTRY_FIELDS
} = window.PetbookConstants;

function save() {
  state.currentTab = currentTab;
  void persistState(state);
}

function normalizeState(rawState) {
  const incoming = rawState && typeof rawState === 'object' ? rawState : {};
  const normalized = {
    ...DEFAULT_STATE,
    ...incoming,
    notificationSettings: {
      ...DEFAULT_STATE.notificationSettings,
      ...(incoming.notificationSettings || {})
    },
    notificationLog: {
      ...(incoming.notificationLog || {})
    }
  };

  if (normalized.currentTab === 'today') {
    normalized.currentTab = 'care';
  }

  if (!Array.isArray(normalized.pets)) {
    normalized.pets = [];
  }

  return normalized;
}

function openDb() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
  });

  return dbPromise;
}

function idbGetState() {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STATE_ROW_KEY);

    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
  }));
}

function idbSetState(nextState) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));

    store.put({ key: STATE_ROW_KEY, value: nextState });
  }));
}

function readLegacyLocalState() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) || 'null');
  } catch (_err) {
    return null;
  }
}

function writeLegacyLocalState(nextState) {
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(nextState));
  } catch (_err) {}
}

async function loadState() {
  try {
    const indexedDbState = await idbGetState();
    if (indexedDbState) {
      return normalizeState(indexedDbState);
    }
  } catch (_err) {
    // Fallback to localStorage if IndexedDB is unavailable.
  }

  const legacyState = readLegacyLocalState();
  const normalizedLegacyState = normalizeState(legacyState);

  try {
    await idbSetState(normalizedLegacyState);
  } catch (_err) {
    // Keep localStorage fallback only.
  }

  return normalizedLegacyState;
}

async function persistState(nextState) {
  try {
    await idbSetState(nextState);
  } catch (_err) {
    writeLegacyLocalState(nextState);
  }
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isIOSDevice() {
  const ua = navigator.userAgent || '';
  const isiOSUA = /iPad|iPhone|iPod/.test(ua);
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isiOSUA || isTouchMac;
}

function isStandaloneDisplayMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function getNotificationConfig() {
  return {
    medicine: !!state.notificationSettings?.medicine,
    vets: !!state.notificationSettings?.vets,
    permission: 'Notification' in window ? Notification.permission : 'denied'
  };
}

function markNotifiedOncePerDay(key) {
  const today = getTodayDateString();
  state.notificationLog[key] = today;
}

function hasNotifiedToday(key) {
  return state.notificationLog[key] === getTodayDateString();
}

async function showReminderNotification(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        await registration.showNotification(title, {
          body,
          tag,
          renotify: false
        });
        return;
      }
    }

    // Fallback if service worker registration is unavailable.
    new Notification(title, { body, tag });
  } catch (_err) {
    // Ignore notification dispatch errors to keep the app responsive.
  }
}

async function runDueNotificationChecks() {
  const settings = state.notificationSettings || { medicine: true, vets: true };
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const today = getTodayDateString();
  let changed = false;

  for (const pet of state.pets) {
    if (settings.medicine) {
      for (let medicineIndex = 0; medicineIndex < (pet.medicines || []).length; medicineIndex++) {
        const medicine = pet.medicines[medicineIndex];
        if (!medicine.nextDue || medicine.nextDue > today) {
          continue;
        }
        const medicineIdentity = medicine.id || `${medicine.name || 'medicine'}:${medicine.nextDue || ''}:${medicineIndex}`;
        const key = `medicine:${pet.id}:${medicineIdentity}`;
        if (hasNotifiedToday(key)) {
          continue;
        }
        await showReminderNotification(
          `${pet.name}: Medicine reminder`,
          `${medicine.name || 'Medicine'} is due${medicine.nextDue ? ` (${medicine.nextDue})` : ''}.`,
          key
        );
        markNotifiedOncePerDay(key);
        changed = true;
      }
    }

    if (settings.vets) {
      for (let appointmentIndex = 0; appointmentIndex < (pet.vets || []).length; appointmentIndex++) {
        const appointment = pet.vets[appointmentIndex];
        if (!appointment.date || appointment.date > today) {
          continue;
        }
        const appointmentIdentity = appointment.id || `${appointment.reason || 'appointment'}:${appointment.date || ''}:${appointmentIndex}`;
        const key = `vet:${pet.id}:${appointmentIdentity}`;
        if (hasNotifiedToday(key)) {
          continue;
        }
        await showReminderNotification(
          `${pet.name}: Vet appointment reminder`,
          `${appointment.reason || 'Appointment'} is due${appointment.date ? ` (${appointment.date})` : ''}.`,
          key
        );
        markNotifiedOncePerDay(key);
        changed = true;
      }
    }
  }

  if (changed) {
    save();
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Notifications are not supported in this browser.');
    return;
  }

  if (isIOSDevice() && !isStandaloneDisplayMode()) {
    showToast('On iPhone/iPad, install Petbook to Home Screen to enable notifications.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    showToast('Notifications enabled.');
    await runDueNotificationChecks();
  } else {
    showToast('Notifications were not enabled.');
  }
  openModal('settings');
}

function toggleNotificationSetting(settingKey) {
  if (!state.notificationSettings || !(settingKey in state.notificationSettings)) {
    return;
  }

  state.notificationSettings[settingKey] = !state.notificationSettings[settingKey];
  save();

  if (state.notificationSettings[settingKey] && 'Notification' in window && Notification.permission !== 'granted') {
    showToast('Enable notifications permission to receive reminders.');
  } else {
    showToast('Settings updated.');
  }

  openModal('settings');
}

function startNotificationChecks() {
  runDueNotificationChecks().catch(() => {});
  setInterval(() => {
    runDueNotificationChecks().catch(() => {});
  }, 60000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      runDueNotificationChecks().catch(() => {});
    }
  });

  window.addEventListener('focus', () => {
    runDueNotificationChecks().catch(() => {});
  });
}

function getActivePet() {
  return state.pets.find((pet) => pet.id === state.activePetId) || null;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function render() {
  renderPetBar();
  renderContent();
  syncActiveTab();
}

function renderPetBar() {
  const bar = document.getElementById('petBar');
  bar.innerHTML = state.pets.map((pet) => `
    <div class="pet-chip ${pet.id === state.activePetId ? 'active' : ''}" data-action="select-pet" data-pet-id="${pet.id}">
      <div class="pet-avatar">${pet.emoji || '🐾'}</div>
      <div class="pet-chip-name">${pet.name}</div>
    </div>
  `).join('') + `
    <div class="add-pet-chip" data-action="open-modal" data-modal="addPet">
      <button class="add-pet-btn">+</button>
      <div class="pet-chip-name pet-chip-name-muted">Add</div>
    </div>
  `;
}

function renderContent() {
  const content = document.getElementById('mainContent');
  const pet = getActivePet();

  if (!pet) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="big-emoji">🐾</div>
        <h2>Welcome to Petbook</h2>
        <p>Add your first pet to start tracking their care routine.</p>
        <button class="btn-primary" data-action="open-modal" data-modal="addPet">+ Add a Pet</button>
      </div>
    `;
    return;
  }

  if (currentTab === 'care') {
    renderCare(content, pet);
    return;
  }

  if (currentTab === 'schedule') {
    renderSchedule(content, pet);
    return;
  }

  renderHealth(content, pet);
}

function renderPetHeader(pet, metaText, withEditButton) {
  const editAction = withEditButton
    ? `
      <div class="pet-header-actions">
        <button class="share-btn" data-action="share-pet">📤 Share</button>
        <button class="btn-icon btn-icon-muted" data-action="open-modal" data-modal="editPet" title="Edit pet">✏️</button>
      </div>
    `
    : '<button class="share-btn" data-action="share-pet">📤 Share</button>';

  return `
    <div class="pet-header">
      <div class="pet-info">
        <div class="pet-big-avatar">${pet.emoji || '🐾'}</div>
        <div>
          <div class="pet-name">${pet.name}</div>
          <div class="pet-meta">${metaText}</div>
        </div>
      </div>
      ${editAction}
    </div>
  `;
}

function renderCareSections(pet) {
  return [
    { icon: '💊', title: 'Medicine', key: 'medicines', renderFn: renderMedEntry },
    { icon: '🍽️', title: 'Feeding', key: 'feeding', renderFn: renderFeedEntry },
    { icon: '🦮', title: 'Walks & Routine', key: 'routine', renderFn: renderRoutineEntry },
    { icon: '🎾', title: 'Favorite Toys & Things', key: 'favorites', renderFn: renderFavoritesEntry },
    { icon: '⚠️', title: 'Allergies', key: 'allergies', renderFn: renderAllergyEntry }
  ].map((section) => renderSection(section.icon, section.title, section.key, pet, section.renderFn)).join('');
}

function renderWeightChart(chartWeights) {
  if (!chartWeights.length) {
    return '';
  }

  const max = Math.max(...chartWeights.map((weight) => weight.value));
  return `<div class="weight-chart-scroll"><div class="weight-chart">${chartWeights.map((weight) => `
    <div class="weight-bar-wrap" title="${weight.value} kg on ${weight.date}">
      <div class="weight-bar" style="height:${Math.max(8, (weight.value / max) * 54)}px"></div>
      <div class="weight-bar-label">${weight.value}kg</div>
    </div>
  `).join('')}</div></div>`;
}

function renderWeightEntries(listWeights, emptyMessage) {
  return listWeights.slice().reverse().map((weight) => `
    <div class="entry">
      <div class="entry-dot"></div>
      <div class="entry-content">
        <div class="entry-label">${weight.value} kg</div>
        <div class="entry-detail">${weight.date}</div>
      </div>
      <div class="entry-actions">
        <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="weights" data-entry-id="${weight.id}">✕</button>
      </div>
    </div>
  `).join('') || `<div class="empty-note">${emptyMessage}</div>`;
}

function renderWeightSection(pet) {
  const chartWeights = getAggregatedWeights(pet.weights || []);
  const listWeights = getFilteredWeights(pet.weights || []);
  const activeRange = state.weightChartRange || 'month';
  const totalWeightEntries = (pet.weights || []).length;
  const emptyMessage = totalWeightEntries
    ? 'No weight entries in this range yet.'
    : 'No weight entries yet.';

  const rangeButtons = Object.entries(WEIGHT_RANGE_LABELS).map(([range, label]) => `
    <button class="weight-range-btn ${activeRange === range ? 'active' : ''}" data-action="set-weight-range" data-range="${range}">${label}</button>
  `).join('');

  return `
    <div class="section section-delay-1">
      <div class="section-header" data-action="toggle-section">
        <div class="section-title">
          <div class="section-icon section-icon-weight">⚖️</div>
          Weight Log
        </div>
        <span class="section-toggle">▾</span>
      </div>
      <div class="section-body">
        <div class="weight-range-switcher">${rangeButtons}</div>
        ${renderWeightChart(chartWeights)}
        ${renderWeightEntries(listWeights, emptyMessage)}
        <button class="add-entry-btn" data-action="open-modal" data-modal="addWeight">+ Add weight</button>
      </div>
    </div>
  `;
}

function renderCare(content, pet) {
  const metaText = `${pet.breed || pet.type || ''} ${pet.age ? '· ' + pet.age : ''}`;
  content.innerHTML = `
    ${renderPetHeader(pet, metaText, true)}
    ${renderCareSections(pet)}
  `;
}

function renderSchedule(content, pet) {
  content.innerHTML = `
    ${renderPetHeader(pet, 'Upcoming appointments', false)}
    ${renderSection('🏥', 'Vet Appointments', 'vets', pet, renderVetEntry)}
  `;
}

function renderHealth(content, pet) {
  content.innerHTML = `
    ${renderPetHeader(pet, 'Health & weight log', false)}
    ${renderWeightSection(pet)}
  `;
}

function renderSection(icon, title, key, pet, renderFn) {
  const items = pet[key] || [];
  const iconClass = SECTION_ICON_CLASSES[key] || '';
  const modalKey = `add_${key}`;
  return `
    <div class="section">
      <div class="section-header" data-action="toggle-section">
        <div class="section-title">
          <div class="section-icon ${iconClass}">${icon}</div>
          ${title}
        </div>
        <span class="section-toggle">▾</span>
      </div>
      <div class="section-body">
        ${items.length ? items.map((item) => renderFn(item)).join('') : '<div class="empty-note">Nothing added yet.</div>'}
        <button class="add-entry-btn" data-action="open-modal" data-modal="${modalKey}">+ Add entry</button>
      </div>
    </div>
  `;
}

function renderMedEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-medicines"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.name} <span class="entry-label-meta">${entry.dose || ''}</span></div>
      <div class="entry-detail">${entry.frequency || ''} ${entry.nextDue ? '· Next: ' + entry.nextDue : ''}</div>
    </div>
    <div class="entry-actions">
      <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="medicines" data-entry-id="${entry.id}">✕</button>
    </div>
  </div>`;
}

function renderFeedEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-feeding"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.time} <span class="entry-label-meta">${entry.amount || ''}</span></div>
      <div class="entry-detail">${entry.food || ''} ${entry.notes ? '· ' + entry.notes : ''}</div>
    </div>
    <div class="entry-actions">
      <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="feeding" data-entry-id="${entry.id}">✕</button>
    </div>
  </div>`;
}

function renderRoutineEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-routine"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.name}</div>
      <div class="entry-detail">${entry.time || ''} ${entry.duration ? '· ' + entry.duration + ' min' : ''} ${entry.notes ? '· ' + entry.notes : ''}</div>
    </div>
    <div class="entry-actions">
      <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="routine" data-entry-id="${entry.id}">✕</button>
    </div>
  </div>`;
}

function renderVetEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-vets"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.reason}</div>
      <div class="entry-detail">${entry.date || ''} ${entry.vet ? '· ' + entry.vet : ''} ${entry.notes ? '· ' + entry.notes : ''}</div>
    </div>
    <div class="entry-actions">
      <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="vets" data-entry-id="${entry.id}">✕</button>
    </div>
  </div>`;
}

function renderFavoritesEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-favorites"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.item}</div>
      <div class="entry-detail">${entry.notes || ''}</div>
    </div>
    <div class="entry-actions">
      <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="favorites" data-entry-id="${entry.id}">✕</button>
    </div>
  </div>`;
}

function renderAllergyEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-allergies"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.allergen} <span class="entry-label-meta">${entry.reaction || ''}</span></div>
      <div class="entry-detail">${entry.notes || ''}</div>
    </div>
    <div class="entry-actions">
      <button class="btn-small btn-del" data-action="delete-entry" data-entry-key="allergies" data-entry-id="${entry.id}">✕</button>
    </div>
  </div>`;
}

function getFilteredWeights(weights) {
  const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
  const activeRange = state.weightChartRange || 'month';
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);

  if (activeRange === 'week') {
    rangeStart.setDate(rangeStart.getDate() - 7);
  } else if (activeRange === 'month') {
    rangeStart.setMonth(rangeStart.getMonth() - 1);
  } else {
    rangeStart.setFullYear(rangeStart.getFullYear() - 1);
  }

  return sorted.filter((w) => new Date(`${w.date}T00:00:00`) >= rangeStart);
}

function getAggregatedWeights(weights) {
  const filtered = getFilteredWeights(weights);
  const activeRange = state.weightChartRange || 'month';

  if (activeRange === 'week') {
    // Group by day and average
    const dailyData = {};
    filtered.forEach((w) => {
      if (!dailyData[w.date]) {
        dailyData[w.date] = { sum: 0, count: 0, date: w.date };
      }
      dailyData[w.date].sum += w.value;
      dailyData[w.date].count++;
    });
    return Object.values(dailyData).map((d) => ({
      date: d.date,
      value: parseFloat((d.sum / d.count).toFixed(1))
    }));
  } else if (activeRange === 'month') {
    // Group by week and average
    const weeklyData = {};
    filtered.forEach((w) => {
      const date = new Date(w.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { sum: 0, count: 0, week: weekKey };
      }
      weeklyData[weekKey].sum += w.value;
      weeklyData[weekKey].count++;
    });
    return Object.values(weeklyData).map((w) => ({
      date: w.week,
      value: parseFloat((w.sum / w.count).toFixed(1))
    }));
  } else {
    // Group by month and average
    const monthlyData = {};
    filtered.forEach((w) => {
      const date = new Date(w.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[month]) {
        monthlyData[month] = { sum: 0, count: 0, month };
      }
      monthlyData[month].sum += w.value;
      monthlyData[month].count++;
    });
    return Object.values(monthlyData).map((m) => ({
      date: m.month,
      value: parseFloat((m.sum / m.count).toFixed(1))
    }));
  }
}

function setWeightRange(range) {
  if (!WEIGHT_RANGE_LABELS[range]) {
    return;
  }

  state.weightChartRange = range;
  save();
  renderContent();
}

function handleActionClick(event) {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) {
    return;
  }

  const { action } = actionTarget.dataset;

  switch (action) {
    case 'set-tab':
      setTab(actionTarget.dataset.tab);
      break;
    case 'select-pet':
      selectPet(actionTarget.dataset.petId);
      break;
    case 'open-modal':
      openModal(actionTarget.dataset.modal);
      break;
    case 'share-pet':
      shareWhatsApp();
      break;
    case 'toggle-section':
      toggleSection(actionTarget);
      break;
    case 'set-weight-range':
      setWeightRange(actionTarget.dataset.range);
      break;
    case 'delete-entry':
      deleteEntry(actionTarget.dataset.entryKey, actionTarget.dataset.entryId);
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'delete-pet':
      deletePet();
      break;
    case 'select-emoji':
      selectEmoji(actionTarget, actionTarget.dataset.emoji);
      break;
    case 'save-pet':
      savePet();
      break;
    case 'save-entry':
      saveEntry(actionTarget.dataset.entryKey, ENTRY_FIELDS[actionTarget.dataset.entryKey]);
      break;
    case 'save-weight':
      saveWeight();
      break;
    case 'update-pet':
      updatePet();
      break;
    case 'confirm-delete-pet':
      confirmDeletePet();
      break;
    case 'toggle-notification-setting':
      toggleNotificationSetting(actionTarget.dataset.setting);
      break;
    case 'request-notification-permission':
      requestNotificationPermission();
      break;
    default:
      break;
  }
}

function initEventHandlers() {
  document.addEventListener('click', handleActionClick);
  document.getElementById('modalOverlay').addEventListener('click', closeModalOutside);
  window.PetbookPickers.applyIOSPickers();
}

function syncActiveTab() {
  document.querySelectorAll('.nav-item').forEach((element, index) => {
    element.classList.toggle('active', TAB_ORDER[index] === currentTab);
  });
}

function selectPet(id) {
  state.activePetId = id;
  save();
  render();
}

function setTab(tab) {
  currentTab = tab;
  syncActiveTab();
  save();
  renderContent();
}

function toggleSection(header) {
  header.closest('.section').classList.toggle('collapsed');
}

function deleteEntry(key, id) {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  pet[key] = (pet[key] || []).filter((entry) => entry.id !== id);
  save();
  renderContent();
}

function openModal(type) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = window.PetbookModals.getModalContent(type, getActivePet, getNotificationConfig);
  overlay.classList.add('open');
  
  // Sync all picker displays after modal content loads
  setTimeout(() => {
    window.PetbookPickers.syncModalPickerDisplays(content);
  }, 0);
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(event) {
  if (event.target === document.getElementById('modalOverlay')) {
    closeModal();
  }
}

function confirmDeletePet() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-handle"></div>
    <div class="modal-title">Remove ${pet.name}? 🗑️</div>
    <p class="modal-copy">This will delete all of ${pet.name}'s data permanently. This cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn-secondary" data-action="close-modal">Cancel</button>
      <button class="btn-primary btn-primary-danger" data-action="delete-pet">Yes, remove</button>
    </div>
  `;
  overlay.classList.add('open');
}

function deletePet() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const name = pet.name;
  state.pets = state.pets.filter((item) => item.id !== pet.id);
  state.activePetId = state.pets.length ? state.pets[0].id : null;
  save();
  closeModal();
  render();
  showToast('👋 ' + name + ' removed.');
}

function updatePet() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const name = document.getElementById('f_name').value.trim();
  if (!name) {
    showToast('Please enter a name');
    return;
  }

  const selectedEmoji = document.querySelector('.emoji-opt.selected');
  pet.name = name;
  pet.breed = document.getElementById('f_breed').value.trim();
  pet.age = document.getElementById('f_age').value.trim();
  if (selectedEmoji) {
    pet.emoji = selectedEmoji.textContent;
  }

  save();
  closeModal();
  render();
  showToast('✓ ' + name + ' updated!');
}

function selectEmoji(button, emoji) {
  document.querySelectorAll('.emoji-opt').forEach((option) => option.classList.remove('selected'));
  button.classList.add('selected');
  button.dataset.selected = emoji;
}

function savePet() {
  const name = document.getElementById('f_name').value.trim();
  if (!name) {
    showToast('Please enter a name');
    return;
  }

  const selectedEmoji = document.querySelector('.emoji-opt.selected');
  const pet = {
    id: uid(),
    name,
    type: document.getElementById('f_type').value,
    breed: document.getElementById('f_breed').value.trim(),
    age: document.getElementById('f_age').value.trim(),
    emoji: selectedEmoji ? selectedEmoji.textContent : '🐾',
    medicines: [],
    feeding: [],
    routine: [],
    vets: [],
    weights: [],
    favorites: [],
    allergies: []
  };

  state.pets.push(pet);
  state.activePetId = pet.id;
  save();
  closeModal();
  render();
  showToast('🐾 ' + name + ' added!');
}

function saveEntry(key, fields) {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const entry = { id: uid() };
  for (const [property, elementId] of Object.entries(fields)) {
    const element = document.getElementById(elementId);
    if (element) {
      entry[property] = element.value.trim();
    }
  }

  if (!pet[key]) {
    pet[key] = [];
  }

  pet[key].push(entry);
  save();
  closeModal();
  renderContent();
  showToast('Saved!');
}

function saveWeight() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const value = parseFloat(document.getElementById('f_weight').value);
  const date = document.getElementById('f_date').value;
  if (!value || !date) {
    showToast('Please fill all fields');
    return;
  }

  if (!pet.weights) {
    pet.weights = [];
  }

  pet.weights.push({ id: uid(), value, date });
  pet.weights.sort((left, right) => new Date(left.date) - new Date(right.date));
  save();
  closeModal();
  renderContent();
  showToast('Weight logged!');
}

function shareWhatsApp() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  let msg = `🐾 *${pet.name}*`;
  if (pet.breed || pet.type) {
    msg += ` (${[pet.type, pet.breed].filter(Boolean).join(' · ')})`;
  }

  if (pet.age) {
    msg += ` · ${pet.age}`;
  }

  msg += '\n\n';

  if (pet.medicines?.length) {
    msg += `*💊 Medicine*\n`;
    pet.medicines.forEach((entry) => {
      msg += `• ${entry.name}${entry.dose ? ' — ' + entry.dose : ''}${entry.frequency ? ' · ' + entry.frequency : ''}${entry.nextDue ? ' · Next: ' + entry.nextDue : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.feeding?.length) {
    msg += `*🍽️ Feeding*\n`;
    pet.feeding.forEach((entry) => {
      msg += `• ${entry.time || ''}${entry.food ? ' — ' + entry.food : ''}${entry.amount ? ' · ' + entry.amount : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.routine?.length) {
    msg += `*🦮 Routine*\n`;
    pet.routine.forEach((entry) => {
      msg += `• ${entry.name}${entry.time ? ' at ' + entry.time : ''}${entry.duration ? ' · ' + entry.duration + ' min' : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.vets?.length) {
    msg += `*🏥 Vet Appointments*\n`;
    pet.vets.forEach((entry) => {
      msg += `• ${entry.reason}${entry.date ? ' — ' + entry.date : ''}${entry.vet ? ' · ' + entry.vet : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.favorites?.length) {
    msg += `*🎾 Favorite Toys & Things*\n`;
    pet.favorites.forEach((entry) => {
      msg += `• ${entry.item}${entry.notes ? ' — ' + entry.notes : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.allergies?.length) {
    msg += `*⚠️ Allergies*\n`;
    pet.allergies.forEach((entry) => {
      msg += `• ${entry.allergen}${entry.reaction ? ' (causes ' + entry.reaction + ')' : ''}${entry.notes ? ' · ' + entry.notes : ''}\n`;
    });
    msg += '\n';
  }

  msg += `_Shared from Petbook 🐾_`;

  if (navigator.share) {
    navigator.share({ title: '🐾 ' + pet.name + ' — Petbook', text: msg });
    return;
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

async function bootstrapApp() {
  state = await loadState();
  currentTab = state.currentTab || 'care';
  initEventHandlers();
  render();
  startNotificationChecks();
}

void bootstrapApp();