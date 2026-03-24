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
const i18n = window.PetbookI18n;
const t = (key, vars) => (i18n ? i18n.t(key, vars) : key);

function getLocalizedPetType(type) {
  const typeKeyByValue = {
    Dog: 'petTypeDog',
    Cat: 'petTypeCat',
    Rabbit: 'petTypeRabbit',
    Hamster: 'petTypeHamster',
    Bird: 'petTypeBird',
    Fish: 'petTypeFish',
    Turtle: 'petTypeTurtle',
    Other: 'petTypeOther'
  };

  const key = typeKeyByValue[type];
  return key ? t(key) : (type || '');
}

function applyStaticTranslations() {
  document.documentElement.lang = i18n ? i18n.getLanguage() : 'en';
  document.title = t('appTitle');

  const navLabels = document.querySelectorAll('.bottom-nav .nav-label');
  if (navLabels[0]) navLabels[0].textContent = t('navCare');
  if (navLabels[1]) navLabels[1].textContent = t('navSchedule');
  if (navLabels[2]) navLabels[2].textContent = t('navHealth');

  const headerActions = document.querySelectorAll('.header-actions .btn-icon');
  if (headerActions[0]) {
    headerActions[0].setAttribute('title', t('openStore'));
    headerActions[0].setAttribute('aria-label', t('openStore'));
  }
  if (headerActions[1]) {
    headerActions[1].setAttribute('title', t('sendFeedback'));
    headerActions[1].setAttribute('aria-label', t('sendFeedback'));
  }
  if (headerActions[2]) {
    headerActions[2].setAttribute('title', t('settingsButton'));
    headerActions[2].setAttribute('aria-label', t('settingsButton'));
  }

  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitle) {
    appleTitle.setAttribute('content', t('appTitle'));
  }
}

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

function getNowTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function enforceNotificationPermissionState() {
  const permission = 'Notification' in window ? Notification.permission : 'denied';
  if (permission === 'granted') {
    return;
  }

  if (!state.notificationSettings) {
    state.notificationSettings = { medicine: false, vets: false };
    save();
    return;
  }

  if (state.notificationSettings.medicine || state.notificationSettings.vets) {
    state.notificationSettings.medicine = false;
    state.notificationSettings.vets = false;
    save();
  }
}

function getNotificationConfig() {
  enforceNotificationPermissionState();
  const permission = 'Notification' in window ? Notification.permission : 'denied';
  const canToggle = permission === 'granted';
  return {
    medicine: canToggle && !!state.notificationSettings?.medicine,
    vets: canToggle && !!state.notificationSettings?.vets,
    permission,
    canToggle
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
  const nowTime = getNowTimeString();
  let changed = false;

  for (const pet of state.pets) {
    if (settings.medicine) {
      for (let medicineIndex = 0; medicineIndex < (pet.medicines || []).length; medicineIndex++) {
        const medicine = pet.medicines[medicineIndex];
        const hasTime = !!medicine.time;
        const isTimeDueToday = hasTime && medicine.time <= nowTime;
        const isLegacyDateDue = !!medicine.nextDue && medicine.nextDue <= today;
        if (!isTimeDueToday && !isLegacyDateDue) {
          continue;
        }
        const medicineIdentity = medicine.id || `${medicine.name || 'medicine'}:${medicine.time || medicine.nextDue || ''}:${medicineIndex}`;
        const key = `medicine:${pet.id}:${medicineIdentity}`;
        if (hasNotifiedToday(key)) {
          continue;
        }
        const dueDetail = medicine.time
          ? ` ${t('atLabel')} ${medicine.time}`
          : medicine.nextDue
            ? ` (${medicine.nextDue})`
            : '';
        await showReminderNotification(
          t('notificationMedicineTitle', { name: pet.name }),
          t('notificationMedicineBody', { medicine: medicine.name || t('sectionMedicine'), detail: dueDetail }),
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
        const isToday = appointment.date === today;
        if (isToday && appointment.time && appointment.time > nowTime) {
          continue;
        }
        const appointmentIdentity = appointment.id || `${appointment.reason || 'appointment'}:${appointment.date || ''}:${appointmentIndex}`;
        const key = `vet:${pet.id}:${appointmentIdentity}`;
        if (hasNotifiedToday(key)) {
          continue;
        }
        const appointmentDetail = [appointment.date, appointment.time].filter(Boolean).join(` ${t('atLabel')} `);
        await showReminderNotification(
          t('notificationVetTitle', { name: pet.name }),
          t('notificationVetBody', { reason: appointment.reason || t('sectionVetAppointments'), detail: appointmentDetail ? ` (${appointmentDetail})` : '' }),
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
    showToast(t('toastNotificationUnsupported'));
    return;
  }

  if (isIOSDevice() && !isStandaloneDisplayMode()) {
    showToast(t('toastInstallForIOSNotifications'));
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    showToast(t('toastNotificationsEnabled'));
    await runDueNotificationChecks();
  } else {
    showToast(t('toastNotificationsNotEnabled'));
  }
  openModal('settings');
}

function toggleNotificationSetting(settingKey) {
  if (!state.notificationSettings || !(settingKey in state.notificationSettings)) {
    return;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    enforceNotificationPermissionState();
    showToast(t('toastEnableNotificationsFirst'));
    openModal('settings');
    return;
  }

  state.notificationSettings[settingKey] = !state.notificationSettings[settingKey];
  save();

  if (state.notificationSettings[settingKey] && 'Notification' in window && Notification.permission !== 'granted') {
    showToast(t('toastEnableNotificationsFirst'));
  } else {
    showToast(t('toastSettingsUpdated'));
  }

  openModal('settings');
}

function changeLanguage(languageCode) {
  if (i18n) {
    i18n.setLanguage(languageCode, true);
  }
  render();
  openModal('settings');
  showToast(t('toastLanguageUpdated'));
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
  applyStaticTranslations();
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
      <div class="pet-chip-name pet-chip-name-muted">${t('addChip')}</div>
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
        <h2>${t('welcomeTitle')}</h2>
        <p>${t('welcomeCopy')}</p>
        <button class="btn-primary" data-action="open-modal" data-modal="addPet">${t('addPetCta')}</button>
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
        <button class="share-btn" data-action="share-pet">📤 ${t('share')}</button>
        <button class="btn-icon btn-icon-muted" data-action="open-modal" data-modal="editPet" title="${t('editPet')}">✏️</button>
      </div>
    `
    : `<button class="share-btn" data-action="share-pet">📤 ${t('share')}</button>`;

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
    { icon: '💊', title: t('sectionMedicine'), key: 'medicines', renderFn: renderMedEntry },
    { icon: '🍽️', title: t('sectionFeeding'), key: 'feeding', renderFn: renderFeedEntry },
    { icon: '🦮', title: t('sectionRoutine'), key: 'routine', renderFn: renderRoutineEntry },
    { icon: '🎾', title: t('sectionFavorites'), key: 'favorites', renderFn: renderFavoritesEntry },
    { icon: '⚠️', title: t('sectionAllergies'), key: 'allergies', renderFn: renderAllergyEntry }
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
    ? t('noWeightInRange')
    : t('noWeightYet');

  const rangeButtons = Object.entries(WEIGHT_RANGE_LABELS).map(([range]) => `
    <button class="weight-range-btn ${activeRange === range ? 'active' : ''}" data-action="set-weight-range" data-range="${range}">${range === 'week' ? t('rangeWeek') : range === 'month' ? t('rangeMonth') : t('rangeYear')}</button>
  `).join('');

  return `
    <div class="section section-delay-1">
      <div class="section-header" data-action="toggle-section">
        <div class="section-title">
          <div class="section-icon section-icon-weight">⚖️</div>
          ${t('sectionWeightLog')}
        </div>
        <span class="section-toggle">▾</span>
      </div>
      <div class="section-body">
        <div class="weight-range-switcher">${rangeButtons}</div>
        ${renderWeightChart(chartWeights)}
        ${renderWeightEntries(listWeights, emptyMessage)}
        <button class="add-entry-btn" data-action="open-modal" data-modal="addWeight">${t('addWeight')}</button>
      </div>
    </div>
  `;
}

function renderCare(content, pet) {
  const localizedType = getLocalizedPetType(pet.type);
  const metaText = `${pet.breed || localizedType || ''} ${pet.age ? '· ' + pet.age : ''}`;
  content.innerHTML = `
    ${renderPetHeader(pet, metaText, true)}
    ${renderCareSections(pet)}
  `;
}

function renderSchedule(content, pet) {
  content.innerHTML = `
    ${renderPetHeader(pet, t('upcomingAppointments'), false)}
    ${renderSection('🏥', t('sectionVetAppointments'), 'vets', pet, renderVetEntry)}
  `;
}

function renderHealth(content, pet) {
  content.innerHTML = `
    ${renderPetHeader(pet, t('healthWeightMeta'), false)}
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
        ${items.length ? items.map((item) => renderFn(item)).join('') : `<div class="empty-note">${t('nothingAddedYet')}</div>`}
        <button class="add-entry-btn" data-action="open-modal" data-modal="${modalKey}">${t('addEntry')}</button>
      </div>
    </div>
  `;
}

function renderMedEntry(entry) {
  return `<div class="entry">
    <div class="entry-dot entry-dot-medicines"></div>
    <div class="entry-content">
      <div class="entry-label">${entry.name} <span class="entry-label-meta">${entry.dose || ''}</span></div>
      <div class="entry-detail">${entry.frequency || ''} ${entry.time ? `· ${t('timeLabel')}: ${entry.time}` : ''}${!entry.time && entry.nextDue ? `· ${t('nextLabel')}: ${entry.nextDue}` : ''}</div>
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
      <div class="entry-detail">${entry.time || ''} ${entry.duration ? '· ' + entry.duration + ' ' + t('unitMinutes') : ''} ${entry.notes ? '· ' + entry.notes : ''}</div>
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
      <div class="entry-detail">${entry.date || ''}${entry.time ? ' · ' + entry.time : ''} ${entry.vet ? '· ' + entry.vet : ''} ${entry.notes ? '· ' + entry.notes : ''}</div>
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

function handleActionChange(event) {
  const changeTarget = event.target.closest('[data-change-action]');
  if (!changeTarget) {
    return;
  }

  const { changeAction } = changeTarget.dataset;
  if (changeAction === 'change-language') {
    changeLanguage(changeTarget.value);
  }
}

function initEventHandlers() {
  document.addEventListener('click', handleActionClick);
  document.addEventListener('change', handleActionChange);
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
    <div class="modal-title">${t('removePetConfirmTitle', { name: pet.name })}</div>
    <p class="modal-copy">${t('removePetConfirmCopy', { name: pet.name })}</p>
    <div class="modal-actions">
      <button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
      <button class="btn-primary btn-primary-danger" data-action="delete-pet">${t('yesRemove')}</button>
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
  showToast(t('toastPetRemoved', { name }));
}

function updatePet() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const name = document.getElementById('f_name').value.trim();
  if (!name) {
    showToast(t('toastEnterName'));
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
  showToast(t('toastPetUpdated', { name }));
}

function selectEmoji(button, emoji) {
  document.querySelectorAll('.emoji-opt').forEach((option) => option.classList.remove('selected'));
  button.classList.add('selected');
  button.dataset.selected = emoji;
}

function savePet() {
  const name = document.getElementById('f_name').value.trim();
  if (!name) {
    showToast(t('toastEnterName'));
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
  showToast(t('toastPetAdded', { name }));
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
  showToast(t('toastSaved'));
}

function saveWeight() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const value = parseFloat(document.getElementById('f_weight').value);
  const date = document.getElementById('f_date').value;
  if (!value || !date) {
    showToast(t('toastFillAllFields'));
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
  showToast(t('toastWeightLogged'));
}

function shareWhatsApp() {
  const pet = getActivePet();
  if (!pet) {
    return;
  }

  const localizedType = getLocalizedPetType(pet.type);

  let msg = `🐾 *${pet.name}*`;
  if (pet.breed || localizedType) {
    msg += ` (${[localizedType, pet.breed].filter(Boolean).join(' · ')})`;
  }

  if (pet.age) {
    msg += ` · ${pet.age}`;
  }

  msg += '\n\n';

  if (pet.medicines?.length) {
    msg += `${t('shareMedicineHeader')}\n`;
    pet.medicines.forEach((entry) => {
      msg += `• ${entry.name}${entry.dose ? ' — ' + entry.dose : ''}${entry.frequency ? ' · ' + entry.frequency : ''}${entry.time ? ` · ${t('timeLabel')}: ${entry.time}` : ''}${!entry.time && entry.nextDue ? ` · ${t('nextLabel')}: ${entry.nextDue}` : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.feeding?.length) {
    msg += `${t('shareFeedingHeader')}\n`;
    pet.feeding.forEach((entry) => {
      msg += `• ${entry.time || ''}${entry.food ? ' — ' + entry.food : ''}${entry.amount ? ' · ' + entry.amount : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.routine?.length) {
    msg += `${t('shareRoutineHeader')}\n`;
    pet.routine.forEach((entry) => {
      msg += `• ${entry.name}${entry.time ? ' ' + t('atLabel') + ' ' + entry.time : ''}${entry.duration ? ' · ' + entry.duration + ' ' + t('unitMinutes') : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.vets?.length) {
    msg += `${t('shareVetsHeader')}\n`;
    pet.vets.forEach((entry) => {
      msg += `• ${entry.reason}${entry.date ? ' — ' + entry.date : ''}${entry.time ? ' ' + t('atLabel') + ' ' + entry.time : ''}${entry.vet ? ' · ' + entry.vet : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.favorites?.length) {
    msg += `${t('shareFavoritesHeader')}\n`;
    pet.favorites.forEach((entry) => {
      msg += `• ${entry.item}${entry.notes ? ' — ' + entry.notes : ''}\n`;
    });
    msg += '\n';
  }

  if (pet.allergies?.length) {
    msg += `${t('shareAllergiesHeader')}\n`;
    pet.allergies.forEach((entry) => {
      msg += `• ${entry.allergen}${entry.reaction ? ' (' + t('causesLabel') + ' ' + entry.reaction + ')' : ''}${entry.notes ? ' · ' + entry.notes : ''}\n`;
    });
    msg += '\n';
  }

  msg += t('sharedFrom');

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
  if (i18n) {
    i18n.setLanguage(i18n.getLanguage(), false);
  }
  state = await loadState();
  enforceNotificationPermissionState();
  currentTab = state.currentTab || 'care';
  initEventHandlers();
  render();
  startNotificationChecks();
}

void bootstrapApp();