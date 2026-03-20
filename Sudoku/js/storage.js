/* ============================================================
   storage.js — localStorage helpers, streaks, daily state
   ============================================================ */

const STORAGE_KEY = 'sudoku_sweetie';

export function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getStreak(state, mode) {
  return state.streaks?.[mode] || 0;
}

export function isDoneToday(state, mode) {
  return state.lastCompleted?.[mode] === getDateKey();
}

export function isFailedToday(state, mode) {
  return state.lastFailed?.[mode] === getDateKey();
}

export function updateStreak(state, mode) {
  if (!state.streaks)       state.streaks = {};
  if (!state.lastCompleted) state.lastCompleted = {};

  const today = getDateKey();
  if (state.lastCompleted[mode] === today) return; // already counted

  // Missed days do not break the streak; only failures reset it.
  state.streaks[mode] = (state.streaks[mode] || 0) + 1;
  state.lastCompleted[mode] = today;
}

export function recordFailure(state, mode) {
  if (!state.streaks) state.streaks = {};
  if (!state.lastFailed) state.lastFailed = {};
  state.streaks[mode] = 0;
  state.lastFailed[mode] = getDateKey();
}

export function saveProgress(state, mode, data) {
  const key = `progress_${mode}_${getDateKey()}`;
  state[key] = data;
  saveState(state);
}

export function loadProgress(state, mode) {
  const key = `progress_${mode}_${getDateKey()}`;
  return state[key] || null;
}

export function clearProgress(state, mode) {
  const key = `progress_${mode}_${getDateKey()}`;
  delete state[key];
  saveState(state);
}
