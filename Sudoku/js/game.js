/* ============================================================
   game.js — startGame, win/loss, hints, confetti, screen routing
   ============================================================ */

import { state } from './state.js';
import { generateDailyPuzzle } from './sudoku.js';
import {
  loadState, saveState, getDateKey,
  saveProgress, loadProgress, clearProgress,
  updateStreak, recordFailure, getStreak,
  isDoneToday, isFailedToday
} from './storage.js';
import {
  renderBoard, markAllComplete, revealErrors,
  getCellEl, setUserCellValue, refreshCellNotes,
  updateNumpadUsed, highlightRelated
} from './board.js';
import {
  renderMistakeDots, resetNoteMode, registerGameCallbacks
} from './input.js';
import { startTimer, stopTimer, formatTime } from './timer.js';

/* ── Register callbacks into input.js (breaks circular dep) ── */
registerGameCallbacks(checkWin, endGameLoss, persistProgress);

/* ── Screen routing ─────────────────────────────────────────── */
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  setTimeout(() => document.getElementById(id)?.classList.add('active'), 10);
}

/* ── Start a game ───────────────────────────────────────────── */
export function startGame(mode) {
  if (isDoneToday(state.appState, mode) || isFailedToday(state.appState, mode)) return;

  state.gameMode     = mode;
  state.mistakes     = 0;
  state.hintsLeft    = 3;
  state.elapsed      = 0;
  state.gameOver     = false;
  state.selectedCell = null;

  const { puzzle, solved } = generateDailyPuzzle(mode);
  state.puzzle    = puzzle;
  state.solved    = solved;
  state.userGrid  = puzzle.map(r => [...r]);
  state.givenGrid = puzzle.map(r => r.map(v => v !== 0));
  state.noteGrid  = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );

  // Restore saved progress
  const saved = loadProgress(state.appState, mode);
  if (saved) {
    state.userGrid  = saved.userGrid;
    state.mistakes  = saved.mistakes;
    state.hintsLeft = saved.hintsLeft;
    state.elapsed   = saved.elapsed;
    if (saved.noteGrid)
      state.noteGrid = saved.noteGrid.map(row => row.map(s => new Set(s)));
  }

  resetNoteMode();
  renderMistakeDots();
  updateHintButton();
  updateModeBadge(mode);
  renderBoard();
  startTimer();
}

/* ── Persist progress ───────────────────────────────────────── */
export function persistProgress() {
  saveProgress(state.appState, state.gameMode, {
    userGrid:  state.userGrid,
    mistakes:  state.mistakes,
    hintsLeft: state.hintsLeft,
    elapsed:   state.elapsed,
    noteGrid:  state.noteGrid.map(row => row.map(s => [...s])),
  });
}

/* ── Check win ──────────────────────────────────────────────── */
export function checkWin() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (state.userGrid[r][c] !== state.solved[r][c]) return;
  endGameWin();
}

/* ── Win ────────────────────────────────────────────────────── */
function endGameWin() {
  state.gameOver = true;
  stopTimer();
  updateStreak(state.appState, state.gameMode);
  clearProgress(state.appState, state.gameMode);
  saveState(state.appState);

  const emojis = { easy: '🌸', medium: '🌻', hard: '💜' };
  const msgs   = {
    easy:   'so sweet and easy~ ♡',
    medium: 'you crushed it! ✨',
    hard:   'absolute galaxy brain! 💎',
  };

  document.getElementById('win-emoji').textContent     = emojis[state.gameMode];
  document.getElementById('win-sub').textContent       = msgs[state.gameMode];
  document.getElementById('win-time').textContent      = formatTime(state.elapsed);
  document.getElementById('win-mistakes').textContent  = state.mistakes;
  document.getElementById('win-streak').textContent    =
    `🔥${getStreak(state.appState, state.gameMode)}`;

  setTimeout(markAllComplete, 100);
  showScreen('screen-win');
  launchConfetti();
}

/* ── Loss ───────────────────────────────────────────────────── */
export function endGameLoss() {
  state.gameOver = true;
  stopTimer();
  recordFailure(state.appState, state.gameMode);
  clearProgress(state.appState, state.gameMode);
  saveState(state.appState);
  revealErrors();
  setTimeout(() => {
    document.getElementById('loss-overlay').classList.add('active');
  }, 600);
}

/* ── Hints ──────────────────────────────────────────────────── */
export function useHint() {
  if (state.gameOver || state.hintsLeft <= 0) return;

  let r, c;

  // Use selected cell if it's empty/wrong, otherwise find first available
  if (state.selectedCell) {
    ({ r, c } = state.selectedCell);
  }
  if (!state.selectedCell ||
      state.givenGrid[r][c] ||
      state.userGrid[r][c] === state.solved[r][c]) {
    let found = false;
    for (let i = 0; i < 81 && !found; i++) {
      const hr = Math.floor(i / 9), hc = i % 9;
      if (!state.givenGrid[hr][hc] && state.userGrid[hr][hc] !== state.solved[hr][hc]) {
        r = hr; c = hc; found = true;
      }
    }
    if (r === undefined) return;
    state.selectedCell = { r, c };
  }

  state.userGrid[r][c] = state.solved[r][c];
  state.noteGrid[r][c].clear();
  state.hintsLeft--;

  const cell = getCellEl(r, c);
  if (cell) {
    setUserCellValue(cell, state.solved[r][c]);
    cell.classList.remove('user-input', 'error');
    cell.classList.add('hint-cell', 'has-value');
  }

  updateHintButton();
  highlightRelated();
  updateNumpadUsed();
  persistProgress();
  checkWin();
}

/* ── UI helpers ─────────────────────────────────────────────── */
function updateHintButton() {
  const btn = document.getElementById('btn-hint');
  const cnt = document.getElementById('hint-count');
  if (btn) btn.disabled        = state.hintsLeft <= 0;
  if (cnt) cnt.textContent     = `(${state.hintsLeft})`;
}

function updateModeBadge(mode) {
  const badge = document.getElementById('game-mode-badge');
  if (!badge) return;
  badge.textContent     = mode.charAt(0).toUpperCase() + mode.slice(1);
  badge.style.background =
    mode === 'easy' ? '#fde8f0' : mode === 'medium' ? '#fdf3d4' : '#ede4f8';
}

/* ── Confetti ───────────────────────────────────────────────── */
function launchConfetti() {
  const container = document.getElementById('win-confetti');
  if (!container) return;
  const colors = ['#f9c6d0','#d4c4f0','#c4eedd','#fdeea3','#fdd9b5','#f4a0b5','#b8a4e8'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `animation-delay:${Math.random() * 0.8}s`,
      `animation-duration:${0.8 + Math.random() * 0.8}s`,
      `width:${6 + Math.random() * 8}px`,
      `height:${6 + Math.random() * 8}px`,
    ].join(';');
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 2500);
}
