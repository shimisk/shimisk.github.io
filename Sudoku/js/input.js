/* ============================================================
   input.js — number input (normal + note mode),
               note mode toggle, keyboard navigation
   ============================================================ */

import { state } from './state.js';
import {
  getCellEl, setUserCellValue, refreshCellNotes,
  highlightRelated, updateNumpadUsed, selectCell
} from './board.js';

// These are injected by game.js after init to avoid circular deps
let _checkWin     = () => {};
let _endGameLoss  = () => {};
let _persistProgress = () => {};

export function registerGameCallbacks(checkWin, endGameLoss, persistProgress) {
  _checkWin        = checkWin;
  _endGameLoss     = endGameLoss;
  _persistProgress = persistProgress;
}

/* ── Note mode toggle ──────────────────────────────────────── */
export function toggleNoteMode() {
  state.noteMode = !state.noteMode;
  const btn    = document.getElementById('btn-note-mode');
  const numpad = document.getElementById('numpad');
  btn.classList.toggle('active', state.noteMode);
  btn.textContent = state.noteMode ? '✏️ on' : '✏️ notes';
  numpad.classList.toggle('note-active', state.noteMode);
}

export function resetNoteMode() {
  state.noteMode = false;
  const btn    = document.getElementById('btn-note-mode');
  const numpad = document.getElementById('numpad');
  if (btn)    { btn.classList.remove('active'); btn.textContent = '✏️ notes'; }
  if (numpad) { numpad.classList.remove('note-active'); }
}

/* ── Mistake dots ───────────────────────────────────────────── */
export function renderMistakeDots() {
  document.querySelectorAll('.mistake-dots .dot')
    .forEach((d, i) => d.classList.toggle('active', i < state.mistakes));
}

/* ── Main input handler ────────────────────────────────────── */
export function inputNum(num) {
  if (!state.selectedCell || state.gameOver) return;
  const { r, c } = state.selectedCell;
  if (state.givenGrid[r][c]) return;
  const cell = getCellEl(r, c);
  if (!cell) return;

  if (state.noteMode) {
    handleNoteInput(r, c, num);
  } else {
    handleNormalInput(r, c, num, cell);
  }
}

function handleNoteInput(r, c, num) {
  if (num === 0) {
    state.noteGrid[r][c].clear();
    refreshCellNotes(r, c);
    _persistProgress();
    return;
  }
  if (state.userGrid[r][c] !== 0) return;
  if (state.noteGrid[r][c].has(num)) state.noteGrid[r][c].delete(num);
  else                                state.noteGrid[r][c].add(num);
  refreshCellNotes(r, c);
  _persistProgress();
}

function handleNormalInput(r, c, num, cell) {
  if (num === 0) {
    state.userGrid[r][c] = 0;
    const span = cell.querySelector('.cell-val');
    if (span) span.textContent = '';
    const notesDiv = cell.querySelector('.cell-notes');
    if (notesDiv) notesDiv.style.display = '';
    cell.classList.remove('user-input', 'error', 'hint-cell', 'has-value');
    refreshCellNotes(r, c);
    highlightRelated();
    _persistProgress();
    return;
  }

  state.userGrid[r][c] = num;
  state.noteGrid[r][c].clear();
  clearRelatedNotes(r, c, num);

  setUserCellValue(cell, num);
  cell.classList.add('user-input');
  cell.classList.remove('error', 'hint-cell');

  if (num !== state.solved[r][c]) {
    state.mistakes++;
    cell.classList.add('error');
    renderMistakeDots();
    if (state.mistakes >= 3) { _endGameLoss(); return; }
  } else {
    void cell.offsetWidth;
    cell.classList.add('correct-flash');
  }

  highlightRelated();
  updateNumpadUsed();
  _persistProgress();
  _checkWin();
}

/* ── Clear a number from notes in same row / col / box ──────── */
function clearRelatedNotes(r, c, num) {
  const boxR = Math.floor(r / 3) * 3;
  const boxC = Math.floor(c / 3) * 3;
  for (let i = 0; i < 9; i++) {
    state.noteGrid[r][i].delete(num); refreshCellNotes(r, i);
    state.noteGrid[i][c].delete(num); refreshCellNotes(i, c);
  }
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++) {
      state.noteGrid[boxR + dr][boxC + dc].delete(num);
      refreshCellNotes(boxR + dr, boxC + dc);
    }
}

/* ── Keyboard ───────────────────────────────────────────────── */
export function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (state.gameOver) return;

    if (e.key >= '1' && e.key <= '9') { inputNum(+e.key); return; }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { inputNum(0); return; }
    if (e.key === 'n' || e.key === 'N') { toggleNoteMode(); return; }

    if (!state.selectedCell) return;
    const { r, c } = state.selectedCell;
    if (e.key === 'ArrowUp'    && r > 0) { e.preventDefault(); selectCell(r - 1, c); }
    if (e.key === 'ArrowDown'  && r < 8) { e.preventDefault(); selectCell(r + 1, c); }
    if (e.key === 'ArrowLeft'  && c > 0) { e.preventDefault(); selectCell(r, c - 1); }
    if (e.key === 'ArrowRight' && c < 8) { e.preventDefault(); selectCell(r, c + 1); }
  });
}
