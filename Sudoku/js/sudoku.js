/* ============================================================
   sudoku.js — puzzle generation, solving, validation
   ============================================================ */

export function seedRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

function fillBoard(board, rand) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = shuffle([1,2,3,4,5,6,7,8,9], rand);
        for (const n of nums) {
          if (isValid(board, r, c, n)) {
            board[r][c] = n;
            if (fillBoard(board, rand)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function generateSolvedBoard(rand) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board, rand);
  return board;
}

export function hasUniqueSolution(board) {
  const copy = board.map(r => [...r]);
  let count = 0;
  function solve() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (copy[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(copy, r, c, n)) {
              copy[r][c] = n;
              solve();
              copy[r][c] = 0;
              if (count > 1) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  solve();
  return count === 1;
}

export function removeCells(solved, clues, rand) {
  const puzzle = solved.map(r => [...r]);
  const cells = shuffle([...Array(81).keys()], rand);
  let removed = 0;
  const target = 81 - clues;
  for (const idx of cells) {
    if (removed >= target) break;
    const r = Math.floor(idx / 9), c = idx % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[r][c] = backup;
    }
  }
  return puzzle;
}

export const CLUES = { easy: 46, medium: 36, hard: 28 };

export function getDailySeed(mode) {
  const d = new Date();
  const str = `${d.getFullYear()}${d.getMonth()}${d.getDate()}${mode}`;
  let hash = 0;
  for (const ch of str) {
    hash = ((hash << 5) - hash) + ch.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateDailyPuzzle(mode) {
  const seed = getDailySeed(mode);
  const rand = seedRand(seed);
  const solved = generateSolvedBoard(rand);
  const puzzle = removeCells(solved, CLUES[mode], seedRand(seed));
  return { puzzle, solved };
}
