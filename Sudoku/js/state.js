/* ============================================================
   state.js — single shared mutable state object.
   No imports. Every other module imports from here.
   ============================================================ */

export const state = {
  appState:     {},
  gameMode:     'easy',
  puzzle:       null,
  solved:       null,
  userGrid:     null,
  givenGrid:    null,
  noteGrid:     null,
  selectedCell: null,
  mistakes:     0,
  hintsLeft:    3,
  elapsed:      0,
  gameOver:     false,
  noteMode:     false,
};
