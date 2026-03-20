/* ============================================================
   timer.js — game timer
   ============================================================ */

import { state } from './state.js';

let _interval = null;

export function startTimer() {
  clearInterval(_interval);
  updateDisplay();
  _interval = setInterval(() => {
    state.elapsed++;
    updateDisplay();
  }, 1000);
}

export function stopTimer() {
  clearInterval(_interval);
  _interval = null;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  const el = document.getElementById('game-timer');
  if (el) el.textContent = formatTime(state.elapsed);
}
