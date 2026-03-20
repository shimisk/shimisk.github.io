/* ============================================================
   app.js — entry point: boot, home screen, routing, event wiring
   ============================================================ */

import { state } from './state.js';
import { startGame, useHint, showScreen, persistProgress, endGameLoss } from './game.js';
import { toggleNoteMode, inputNum, initKeyboard } from './input.js';
import {
  loadState, saveState, getStreak, getDateKey,
  isDoneToday, isFailedToday
} from './storage.js';
import { stopTimer } from './timer.js';

let activeDateKey = getDateKey();

/* ── Boot ───────────────────────────────────────────────────── */
function boot() {
  state.appState = loadState();
  initKeyboard();
  wireButtons();
  wireDailyRefresh();
  initHome();
  showScreen('screen-home');

  if ('serviceWorker' in navigator) {
    registerServiceWorkerWithAutoUpdate();
  }
}

function registerServiceWorkerWithAutoUpdate() {
  let reloading = false;

  const handleControllerChange = () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  };

  navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

  navigator.serviceWorker.register('./sw.js').then(registration => {
    const requestUpdateCheck = () => {
      registration.update().catch(() => {});
    };

    window.addEventListener('focus', requestUpdateCheck);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestUpdateCheck();
    });

    // Trigger an explicit check right after registration completes.
    requestUpdateCheck();
  }).catch(() => {});
}

function wireDailyRefresh() {
  const refreshIfDateChanged = () => {
    const today = getDateKey();
    if (today === activeDateKey) return;
    activeDateKey = today;
    initHome();
  };

  const scheduleNextMidnightRefresh = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 300);
    setTimeout(() => {
      refreshIfDateChanged();
      scheduleNextMidnightRefresh();
    }, next.getTime() - now.getTime());
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshIfDateChanged();
  });

  window.addEventListener('focus', refreshIfDateChanged);
  scheduleNextMidnightRefresh();
}

/* ── Home screen ────────────────────────────────────────────── */
export function initHome() {
  state.appState = loadState();

  ['easy', 'medium', 'hard'].forEach(m => {
    document.getElementById(`streak-${m}`).textContent = getStreak(state.appState, m);

    const done   = isDoneToday(state.appState, m);
    const failed = isFailedToday(state.appState, m);
    const card   = document.querySelector(`.mode-${m}`);
    const status = document.getElementById(`status-${m}`);

    card.classList.remove('mode-done', 'mode-failed');
    card.disabled = false;

    // Remove old listener by cloning the node
    const fresh = card.cloneNode(true);
    card.parentNode.replaceChild(fresh, card);

    if (done) {
      status.textContent = '✅';
      fresh.classList.add('mode-done');
      fresh.disabled = true;
    } else if (failed) {
      status.textContent = '💔';
      fresh.classList.add('mode-failed');
      fresh.disabled = true;
    } else {
      status.textContent = '';
      fresh.addEventListener('click', () => launchGame(m));
    }
  });

  document.getElementById('daily-date').textContent =
    new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
}

/* ── Launch game ────────────────────────────────────────────── */
function launchGame(mode) {
  startGame(mode);
  showScreen('screen-game');
}

/* ── Go home ────────────────────────────────────────────────── */
export function goHome() {
  stopTimer();
  if (!state.gameOver) persistProgress();
  initHome();
  showScreen('screen-home');
}

/* ── Wire static buttons (run once on boot) ─────────────────── */
function wireButtons() {
  document.getElementById('btn-back')
    .addEventListener('click', goHome);

  document.getElementById('btn-note-mode')
    .addEventListener('click', toggleNoteMode);

  document.getElementById('btn-hint')
    .addEventListener('click', useHint);

  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => inputNum(+btn.dataset.num));
  });

  document.getElementById('btn-loss-home')
    .addEventListener('click', () => {
      document.getElementById('loss-overlay').classList.remove('active');
      goHome();
    });

  document.getElementById('btn-win-home')
    .addEventListener('click', goHome);
}

/* ── Go ─────────────────────────────────────────────────────── */
boot();
