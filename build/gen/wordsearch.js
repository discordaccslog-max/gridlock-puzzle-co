'use strict';
// Word search construction. Every listed word is placed once, the remaining squares are
// filled, and the finished grid is scanned in all eight directions: each listed word must
// occur exactly once and no blocked word may appear anywhere. Failing grids are refilled.

const DIRS = {
  easy: [[0, 1], [1, 0], [1, 1]],
  medium: [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]],
  hard: [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]],
};
const ALL8 = DIRS.medium;
const FREQ = 'EEEEEEEEEEEETTTTTTTTTAAAAAAAAOOOOOOOIIIIIIINNNNNNNSSSSSSHHHHHHRRRRRRDDDDLLLLCCCUUUMMMWWFFGGYYPPBBVKJXQZ';

function reverse(s) { return s.split('').reverse().join(''); }

// Drop words that are palindromes or that contain (or are contained in) another chosen
// word forwards or backwards; either would make "appears exactly once" impossible.
function compatible(words) {
  const out = [];
  for (const w of words) {
    if (w === reverse(w)) continue;
    const clash = out.some(o => o.includes(w) || w.includes(o) || o.includes(reverse(w)) || reverse(w).includes(o));
    if (!clash) out.push(w);
  }
  return out;
}

function countOccurrences(grid, word) {
  const n = grid.length;
  let count = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c] !== word[0]) continue;
    for (const [dr, dc] of ALL8) {
      let k = 1;
      for (; k < word.length; k++) {
        const rr = r + dr * k, cc = c + dc * k;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n || grid[rr][cc] !== word[k]) break;
      }
      if (k === word.length) count++;
    }
  }
  return count;
}

function containsBlocked(grid, blocked) {
  const n = grid.length;
  const lines = [];
  for (let r = 0; r < n; r++) lines.push(grid[r].join(''));
  for (let c = 0; c < n; c++) { let s = ''; for (let r = 0; r < n; r++) s += grid[r][c]; lines.push(s); }
  for (let d = -(n - 1); d <= n - 1; d++) {
    let a = '', b = '';
    for (let r = 0; r < n; r++) {
      const c1 = r + d, c2 = n - 1 - r + d;
      if (c1 >= 0 && c1 < n) a += grid[r][c1];
      if (c2 >= 0 && c2 < n) b += grid[r][c2];
    }
    lines.push(a, b);
  }
  for (const line of lines) {
    const both = line + '|' + reverse(line);
    for (const w of blocked) if (w.length >= 3 && both.includes(w)) return w;
  }
  return null;
}

function generate(rng, { title, words, difficulty, size, count, minCount, blocked }) {
  const dirs = DIRS[difficulty];
  const pool = compatible(rng.shuffle(words.filter(w => w.length >= 3 && w.length <= size)));
  if (pool.length < (minCount || count)) return null;
  count = Math.min(count, pool.length);
  for (let attempt = 0; attempt < 60; attempt++) {
    const chosen = compatible(rng.shuffle(pool)).slice(0, count).sort((a, b) => b.length - a.length);
    const grid = [];
    for (let r = 0; r < size; r++) grid.push(new Array(size).fill(null));
    const placed = [];
    let failed = false;
    for (const w of chosen) {
      const options = [];
      for (const [dr, dc] of dirs) {
        for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
          const er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1);
          if (er < 0 || ec < 0 || er >= size || ec >= size) continue;
          let overlap = 0, ok = true;
          for (let k = 0; k < w.length; k++) {
            const ch = grid[r + dr * k][c + dc * k];
            if (ch === null) continue;
            if (ch !== w[k]) { ok = false; break; }
            overlap++;
          }
          if (ok && overlap < w.length) options.push({ r, c, dr, dc, overlap });
        }
      }
      if (!options.length) { failed = true; break; }
      // prefer crossings, more strongly on harder grids
      const bias = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 1.5 : 0.6;
      const pick = rng.weighted(options.map(o => [o, 1 + o.overlap * bias]));
      for (let k = 0; k < w.length; k++) grid[pick.r + pick.dr * k][pick.c + pick.dc * k] = w[k];
      placed.push({ word: w, r: pick.r, c: pick.c, dr: pick.dr, dc: pick.dc });
    }
    if (failed) continue;
    // fill letters: hard grids reuse the theme's own letters as decoys
    const themeLetters = chosen.join('');
    for (let fillTry = 0; fillTry < 40; fillTry++) {
      const g = grid.map(row => row.map(ch => ch || (difficulty === 'hard' && rng.chance(0.55) ? rng.pick(themeLetters) : rng.pick(FREQ))));
      if (containsBlocked(g, blocked)) continue;
      if (chosen.every(w => countOccurrences(g, w) === 1)) {
        return {
          type: 'wordsearch', title, difficulty, size,
          grid: g.map(row => row.join('')),
          words: placed.sort((a, b) => a.word.localeCompare(b.word)),
        };
      }
    }
  }
  return null;
}

function verifyWordsearch(p, blocked) {
  const errors = [];
  const g = p.grid.map(row => row.split(''));
  if (g.length !== p.size || g.some(r => r.length !== p.size)) errors.push('size');
  for (const w of p.words) {
    const n = countOccurrences(g, w.word);
    if (n !== 1) errors.push(w.word + ' occurs ' + n + ' times');
    for (let k = 0; k < w.word.length; k++) {
      if (g[w.r + w.dr * k][w.c + w.dc * k] !== w.word[k]) { errors.push('placement ' + w.word); break; }
    }
  }
  const bad = containsBlocked(g, blocked);
  if (bad) errors.push('blocked word in grid');
  return errors;
}

module.exports = { generate, verifyWordsearch, compatible };
