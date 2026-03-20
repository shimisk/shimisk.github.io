/* ============================================================
   board.js — board rendering, cell selection, highlights,
               note grid display, numpad used-state
   ============================================================ */

import { state } from './state.js';

/* ── Full board re-render ─────────────────────────────────── */
export function renderBoard() {
  const board = document.getElementById('sudoku-board');
  board.innerHTML = '';
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      board.appendChild(buildCell(r, c));
  highlightRelated();
  updateNumpadUsed();
}

function buildCell(r, c) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.dataset.row = r;
  cell.dataset.col = c;

  if (c === 2 || c === 5) cell.dataset.boxRight  = '1';
  if (r === 2 || r === 5) cell.dataset.boxBottom = '1';

  const val = state.userGrid[r][c];

  if (state.givenGrid[r][c]) {
    cell.classList.add('given', 'has-value');
    cell.textContent = val;
  } else if (val !== 0) {
    cell.classList.add('user-input', 'has-value');
    if (val !== state.solved[r][c]) cell.classList.add('error');
    const span = document.createElement('span');
    span.className = 'cell-val';
    span.textContent = val;
    cell.appendChild(span);
  }

  cell.appendChild(buildNotesGrid(r, c));
  cell.addEventListener('click', () => selectCell(r, c));
  return cell;
}

function buildNotesGrid(r, c) {
  const wrap = document.createElement('div');
  wrap.className = 'cell-notes';
  for (let n = 1; n <= 9; n++) {
    const nd = document.createElement('div');
    nd.className = 'cell-note';
    nd.dataset.note = n;
    if (state.noteGrid[r][c].has(n)) {
      nd.classList.add('has-note');
      nd.textContent = n;
    }
    wrap.appendChild(nd);
  }
  return wrap;
}

/* ── Refresh notes in one cell ────────────────────────────── */
export function refreshCellNotes(r, c) {
  const cell = getCellEl(r, c);
  if (!cell) return;
  cell.querySelectorAll('.cell-note').forEach(nd => {
    const n = +nd.dataset.note;
    const has = state.noteGrid[r][c].has(n);
    nd.classList.toggle('has-note', has);
    nd.textContent = has ? n : '';
  });
}

/* ── Cell selection ───────────────────────────────────────── */
export function selectCell(r, c) {
  if (state.gameOver) return;
  state.selectedCell = { r, c };
  highlightRelated();
}

export function highlightRelated() {
  document.querySelectorAll('.cell')
    .forEach(el => el.classList.remove('selected', 'highlighted', 'same-num'));

  if (!state.selectedCell) return;
  const { r, c } = state.selectedCell;
  const selVal = state.userGrid[r][c];

  document.querySelectorAll('.cell').forEach(el => {
    const er = +el.dataset.row, ec = +el.dataset.col;
    const sameBox =
      Math.floor(er / 3) === Math.floor(r / 3) &&
      Math.floor(ec / 3) === Math.floor(c / 3);
    if (er === r || ec === c || sameBox) el.classList.add('highlighted');
    if (selVal !== 0 && state.userGrid[er][ec] === selVal)
      el.classList.add('same-num');
  });

  getCellEl(r, c)?.classList.add('selected');
}

/* ── Win / loss helpers ───────────────────────────────────── */
export function markAllComplete() {
  document.querySelectorAll('.cell').forEach(c => c.classList.add('complete'));
}

export function revealErrors() {
  document.querySelectorAll('.cell.error').forEach(el => {
    const r = +el.dataset.row, c = +el.dataset.col;
    setUserCellValue(el, state.solved[r][c]);
    el.classList.remove('error');
    el.classList.add('hint-cell');
  });
}

/* ── Set a value onto a cell element ──────────────────────── */
export function setUserCellValue(cellEl, num) {
  const notesDiv = cellEl.querySelector('.cell-notes');
  if (notesDiv) notesDiv.style.display = 'none';
  cellEl.classList.add('has-value');
  let span = cellEl.querySelector('.cell-val');
  if (!span) {
    span = document.createElement('span');
    span.className = 'cell-val';
    cellEl.appendChild(span);
  }
  span.textContent = num;
}

/* ── Grey out fully-used numpad digits ────────────────────── */
export function updateNumpadUsed() {
  const counts = Array(10).fill(0);
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (state.userGrid[r][c] !== 0 && state.userGrid[r][c] === state.solved[r][c])
        counts[state.userGrid[r][c]]++;
  document.querySelectorAll('.num-btn').forEach(btn => {
    const n = +btn.dataset.num;
    if (n >= 1 && n <= 9) btn.classList.toggle('used', counts[n] >= 9);
  });
}

/* ── Util ─────────────────────────────────────────────────── */
export function getCellEl(r, c) {
  return document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
}
