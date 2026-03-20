const DB_NAME = "diary_db";
const DB_VERSION = 2;
const ENTRIES = "entries_v2";
const LEGACY_ENTRIES = "entries";
const SETTINGS = "settings";
function makeEntryId(seed = "entry") {
  return `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(ENTRIES)) db.createObjectStore(ENTRIES, {
        keyPath: "id"
      });
      if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, {
        keyPath: "key"
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function migrateLegacyEntriesIfNeeded(db) {
  if (!db.objectStoreNames.contains(LEGACY_ENTRIES)) return;
  await new Promise((res, rej) => {
    const tx = db.transaction([ENTRIES, LEGACY_ENTRIES], "readwrite");
    const newStore = tx.objectStore(ENTRIES);
    const legacyStore = tx.objectStore(LEGACY_ENTRIES);
    const countReq = newStore.count();
    countReq.onerror = () => rej(countReq.error);
    countReq.onsuccess = () => {
      if (countReq.result > 0) {
        legacyStore.clear();
        return;
      }
      const legacyReq = legacyStore.getAll();
      legacyReq.onerror = () => rej(legacyReq.error);
      legacyReq.onsuccess = () => {
        const legacyEntries = legacyReq.result || [];
        for (const entry of legacyEntries) {
          newStore.put({
            ...entry,
            id: entry.id || makeEntryId(entry.date || "entry")
          });
        }
        legacyStore.clear();
      };
    };
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
}
export async function getAllEntries() {
  const db = await openDB();
  await migrateLegacyEntriesIfNeeded(db);
  return new Promise((res, rej) => {
    const r = db.transaction(ENTRIES, "readonly").objectStore(ENTRIES).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function saveEntry(entry) {
  const db = await openDB();
  const normalized = {
    ...entry,
    id: entry.id || makeEntryId(entry.date || "entry")
  };
  return new Promise((res, rej) => {
    const r = db.transaction(ENTRIES, "readwrite").objectStore(ENTRIES).put(normalized);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function deleteEntry(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction(ENTRIES, "readwrite").objectStore(ENTRIES).delete(id);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}
export async function clearAllEntries() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const stores = [ENTRIES];
    if (db.objectStoreNames.contains(LEGACY_ENTRIES)) stores.push(LEGACY_ENTRIES);
    const tx = db.transaction(stores, "readwrite");
    tx.objectStore(ENTRIES).clear();
    if (stores.includes(LEGACY_ENTRIES)) {
      tx.objectStore(LEGACY_ENTRIES).clear();
    }
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
}
export async function replaceAllEntries(entries) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const stores = [ENTRIES];
    if (db.objectStoreNames.contains(LEGACY_ENTRIES)) stores.push(LEGACY_ENTRIES);
    const tx = db.transaction(stores, "readwrite");
    const entryStore = tx.objectStore(ENTRIES);
    entryStore.clear();
    if (stores.includes(LEGACY_ENTRIES)) {
      tx.objectStore(LEGACY_ENTRIES).clear();
    }
    for (const entry of entries) {
      entryStore.put({
        ...entry,
        id: entry.id || makeEntryId(entry.date || "entry")
      });
    }
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
}
export async function getSetting(key) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction(SETTINGS, "readonly").objectStore(SETTINGS).get(key);
    r.onsuccess = () => res(r.result?.value ?? null);
    r.onerror = () => rej(r.error);
  });
}
export async function setSetting(key, value) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction(SETTINGS, "readwrite").objectStore(SETTINGS).put({
      key,
      value
    });
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}
export async function loadAllSettings() {
  const [theme, font, fontSize, lockEnabled] = await Promise.all([getSetting("theme"), getSetting("font"), getSetting("fontSize"), getSetting("lockEnabled")]);
  return {
    theme,
    font,
    fontSize,
    lockEnabled
  };
}