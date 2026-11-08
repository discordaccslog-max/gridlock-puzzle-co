'use strict';
// Crossword construction in the blocked style used by quick crosswords in Britain,
// Ireland, Australia and elsewhere: squares at (even row, even column) are shared by an
// across and a down entry, the squares between them belong to one entry only, and every
// entry starts and ends on a shared square. Grids have 180-degree rotational symmetry.

// All ways to split a line of length n into segments of length >= 3 separated by single
// black squares at odd positions. Returned as arrays of [start, length].
function splitPatterns(n, maxLen) {
  const out = [];
  const rec = (start, acc) => {
    for (let len = 3; start + len <= n; len += 2) {
      const seg = acc.concat([[start, len]]);
      if (start + len === n) { if (seg.every(([, l]) => l <= maxLen)) out.push(seg); }
      else if (start + len + 1 < n) rec(start + len + 1, seg);
    }
  };
  rec(0, []);
  return out;
}

function mirror(pattern, n) {
  return pattern.map(([s, l]) => [n - s - l, l]).reverse();
}

function buildTemplate(n, rng, opts, forced = { across: {}, down: {} }) {
  const maxFill = opts.maxFill || n;
  const lines = [];
  for (let i = 0; i < n; i += 2) lines.push(i);
  const all = splitPatterns(n, n);
  const weightOf = p => {
    let w = 1;
    for (const [, l] of p) w *= (opts.lengthWeights[l] || 0.05);
    return w;
  };
  const choose = (forceLen) => {
    const cands = all.filter(p => (forceLen ? p.some(([, l]) => l === forceLen) : true) &&
      p.every(([, l]) => l <= maxFill || l === forceLen));
    return rng.weighted(cands.map(p => [p, weightOf(p)]));
  };
  const make = () => {
    const across = Object.assign({}, forced.across), down = Object.assign({}, forced.down);
    for (const set of [across, down]) {
      for (const i of lines) {
        const j = n - 1 - i;
        if (set[i]) continue;
        const p = choose(0);
        if (i === j) {
          // self-symmetric middle line: pattern must equal its mirror
          const sym = all.filter(q => JSON.stringify(q) === JSON.stringify(mirror(q, n)) && q.every(([, l]) => l <= maxFill));
          set[i] = rng.weighted(sym.map(q => [q, weightOf(q)]));
        } else {
          set[i] = p; set[j] = mirror(p, n);
        }
      }
    }
    return { across, down };
  };
  return make();
}

function templateToSlots(n, tpl) {
  const black = [];
  for (let r = 0; r < n; r++) { black.push([]); for (let c = 0; c < n; c++) black[r].push(r % 2 === 1 && c % 2 === 1); }
  // squares not covered by any segment are black
  const covered = [];
  for (let r = 0; r < n; r++) { covered.push(new Array(n).fill(false)); }
  const slots = [];
  for (const r of Object.keys(tpl.across).map(Number)) {
    for (const [s, l] of tpl.across[r]) {
      const cells = [];
      for (let c = s; c < s + l; c++) { cells.push([r, c]); covered[r][c] = true; }
      slots.push({ dir: 'across', r, c: s, len: l, cells });
    }
  }
  for (const c of Object.keys(tpl.down).map(Number)) {
    for (const [s, l] of tpl.down[c]) {
      const cells = [];
      for (let r = s; r < s + l; r++) { cells.push([r, c]); covered[r][c] = true; }
      slots.push({ dir: 'down', r: s, c, len: l, cells });
    }
  }
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) black[r][c] = !covered[r][c];
  return { black, slots };
}

class Dictionary {
  constructor(entries) {
    // entries: [{ word, clue, hard }]
    this.byLen = {};
    for (const e of entries) {
      const L = e.word.length;
      (this.byLen[L] = this.byLen[L] || []).push(e);
    }
    this.index = {};
    for (const L of Object.keys(this.byLen)) {
      const list = this.byLen[L];
      const words = Math.ceil(list.length / 32);
      const idx = [];
      for (let p = 0; p < L; p++) {
        const per = {};
        for (let k = 0; k < list.length; k++) {
          const ch = list[k].word[p];
          if (!per[ch]) per[ch] = new Uint32Array(words);
          per[ch][k >> 5] |= 1 << (k & 31);
        }
        idx.push(per);
      }
      this.index[L] = { idx, words };
    }
  }
  matches(pattern) {
    // pattern: array of letters or null
    const L = pattern.length;
    const list = this.byLen[L];
    if (!list) return [];
    const { idx, words } = this.index[L];
    let acc = null;
    for (let p = 0; p < L; p++) {
      const ch = pattern[p];
      if (!ch) continue;
      const b = idx[p][ch];
      if (!b) return [];
      if (!acc) acc = b.slice();
      else for (let w = 0; w < words; w++) acc[w] &= b[w];
    }
    const out = [];
    if (!acc) { for (let k = 0; k < list.length; k++) out.push(k); return out; }
    for (let w = 0; w < words; w++) {
      let x = acc[w];
      while (x) {
        const t = x & -x;
        out.push((w << 5) + (31 - Math.clz32(t)));
        x ^= t;
      }
    }
    return out;
  }
  count(pattern) {
    const L = pattern.length;
    if (!this.byLen[L]) return 0;
    const { idx, words } = this.index[L];
    let acc = null;
    for (let p = 0; p < L; p++) {
      const ch = pattern[p];
      if (!ch) continue;
      const b = idx[p][ch];
      if (!b) return 0;
      if (!acc) acc = b.slice();
      else for (let w = 0; w < words; w++) acc[w] &= b[w];
    }
    if (!acc) return this.byLen[L].length;
    let n = 0;
    for (let w = 0; w < words; w++) { let x = acc[w]; while (x) { x &= x - 1; n++; } }
    return n;
  }
}

// Fills the open slots of a grid with dictionary words. `fixed` maps slot index -> entry.
function fill(n, slots, dict, rng, { fixed = {}, usage = new Map(), nodeLimit = 60000, banned = new Set() }) {
  const grid = [];
  for (let r = 0; r < n; r++) grid.push(new Array(n).fill(null));
  const cellSlots = {};
  slots.forEach((s, si) => s.cells.forEach(([r, c], k) => { (cellSlots[r * n + c] = cellSlots[r * n + c] || []).push([si, k]); }));
  const assigned = new Array(slots.length).fill(null);
  const used = new Set();
  const put = (si, entry) => {
    const changes = [];
    slots[si].cells.forEach(([r, c], k) => {
      if (grid[r][c] === null) { grid[r][c] = entry.word[k]; changes.push([r, c]); }
    });
    assigned[si] = entry; used.add(entry.word);
    return changes;
  };
  const undo = (si, changes) => {
    for (const [r, c] of changes) grid[r][c] = null;
    used.delete(assigned[si].word);
    assigned[si] = null;
  };
  for (const [si, entry] of Object.entries(fixed)) {
    const s = slots[+si];
    for (let k = 0; k < s.len; k++) {
      const [r, c] = s.cells[k];
      if (grid[r][c] && grid[r][c] !== entry.word[k]) return null;
    }
    put(+si, entry);
  }
  const pattern = si => slots[si].cells.map(([r, c]) => grid[r][c]);
  let nodes = 0;
  const rec = () => {
    if (++nodes > nodeLimit) return false;
    let best = -1, bestCount = Infinity;
    for (let si = 0; si < slots.length; si++) {
      if (assigned[si]) continue;
      const cnt = dict.count(pattern(si));
      if (cnt === 0) return false;
      const score = cnt - slots[si].len * 0.01;
      if (score < bestCount) { bestCount = score; best = si; }
    }
    if (best < 0) return true;
    const L = slots[best].len;
    let cands = dict.matches(pattern(best)).map(k => dict.byLen[L][k]).filter(e => !used.has(e.word) && !banned.has(e.word));
    cands = cands.map(e => [e, (usage.get(e.word) || 0) * 3 + rng.next() * 2.5]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    for (const e of cands.slice(0, 40)) {
      const changes = put(best, e);
      let ok = true;
      for (const [r, c] of slots[best].cells) {
        for (const [sj] of cellSlots[r * n + c]) {
          if (sj !== best && !assigned[sj] && dict.count(pattern(sj)) === 0) { ok = false; break; }
        }
        if (!ok) break;
      }
      if (ok && rec()) return true;
      undo(best, changes);
      if (nodes > nodeLimit) return false;
    }
    return false;
  };
  if (!rec()) return null;
  return { grid, assigned };
}

function whiteConnected(n, black) {
  let start = null, total = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!black[r][c]) { total++; if (!start) start = [r, c]; }
  const seen = new Set([start[0] * n + start[1]]);
  const stack = [start];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n || black[rr][cc] || seen.has(rr * n + cc)) continue;
      seen.add(rr * n + cc); stack.push([rr, cc]);
    }
  }
  return seen.size === total;
}

// longest straight run of black squares in any row or column (keeps grids from banding)
function longestBlackRun(n, black) {
  let best = 0;
  for (let r = 0; r < n; r++) {
    let run = 0, runC = 0;
    for (let c = 0; c < n; c++) {
      run = black[r][c] ? run + 1 : 0; best = Math.max(best, run);
      runC = black[c][r] ? runC + 1 : 0; best = Math.max(best, runC);
    }
  }
  return best;
}

function numberGrid(n, black, slots) {
  const starts = {};
  for (const s of slots) starts[s.r * n + s.c] = true;
  const numbers = {};
  let k = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (starts[r * n + c]) numbers[r * n + c] = ++k;
  return numbers;
}

/**
 * Builds one crossword.
 * opts: { size, lengthWeights, maxFill, themeEntries (array of {word, clue}), themeCount, clueKey ('clue'|'hard'),
 *         minEntries, maxEntries, usage, attempts }
 */
function construct(rng, dict, opts) {
  const n = opts.size;
  const all = splitPatterns(n, n);
  for (let attempt = 0; attempt < (opts.attempts || 400); attempt++) {
    const forced = { across: {}, down: {} };
    const plan = [];
    if (opts.themeEntries) {
      // choose theme pairs of equal length, then give each pair a symmetric line pair
      const byLen = {};
      for (const e of rng.shuffle(opts.themeEntries)) (byLen[e.word.length] = byLen[e.word.length] || []).push(e);
      const lens = Object.keys(byLen).map(Number).filter(L => L <= n && byLen[L].length >= 2 && (!opts.themeLengths || opts.themeLengths.includes(L)));
      if (!lens.length) return null;
      const pairs = [];
      const usedWords = new Set();
      for (let k = 0; k < opts.themePairs; k++) {
        const L = rng.weighted(lens.map(x => [x, (opts.themeLenWeights && opts.themeLenWeights[x]) || 1]));
        const pool = byLen[L].filter(e => !usedWords.has(e.word));
        if (pool.length < 2) continue;
        pairs.push([pool[0], pool[1]]); usedWords.add(pool[0].word); usedWords.add(pool[1].word);
      }
      if (pairs.length < opts.themePairs) continue;
      const lineIds = [];
      for (let i = 0; i < n; i += 2) if (i < n - 1 - i) { lineIds.push(['across', i]); if (!opts.themeAcrossOnly) lineIds.push(['down', i]); }
      const chosenLines = rng.shuffle(lineIds);
      let ok = true;
      pairs.forEach(([a, b], k) => {
        if (!ok) return;
        const [dir, line] = chosenLines[k];
        const L = a.word.length;
        const options = all.filter(p => p.some(([, l]) => l === L) && p.every(([, l]) => l === L || l <= (opts.maxFill || n)));
        if (!options.length) { ok = false; return; }
        const pat = rng.pick(options);
        const seg = rng.pick(pat.filter(([, l]) => l === L));
        forced[dir][line] = pat;
        forced[dir][n - 1 - line] = mirror(pat, n);
        plan.push({ dir, r: dir === 'across' ? line : seg[0], c: dir === 'across' ? seg[0] : line, len: L, entry: a });
        plan.push({ dir, r: dir === 'across' ? n - 1 - line : n - seg[0] - L, c: dir === 'across' ? n - seg[0] - L : n - 1 - line, len: L, entry: b });
      });
      if (!ok) continue;
      if (opts.themeAcrossOnly) {
        // pick down-column patterns so every segment crossing a theme entry still has words
        const letters = [];
        for (let r = 0; r < n; r++) letters.push(new Array(n).fill(null));
        for (const p of plan) for (let k = 0; k < p.len; k++) letters[p.r][p.c + k] = p.entry.word[k];
        const segOk = (col, pat) => pat.every(([s0, l]) => {
          const patt = [];
          for (let r = s0; r < s0 + l; r++) patt.push(letters[r][col]);
          return !patt.some(Boolean) || dict.count(patt) >= 2;
        });
        let feasible = true;
        for (let c = 0; c < n; c += 2) {
          if (c > n - 1 - c) break;
          const opts2 = all.filter(p => p.every(([, l]) => l <= (opts.maxFill || n)) && segOk(c, p) && segOk(n - 1 - c, mirror(p, n)));
          if (!opts2.length) { feasible = false; break; }
          const pat = rng.weighted(opts2.map(p => [p, p.reduce((w, [, l]) => w * (opts.lengthWeights[l] || 0.05), 1)]));
          forced.down[c] = pat;
          forced.down[n - 1 - c] = mirror(pat, n);
        }
        if (!feasible) continue;
      }
    }
    const tpl = buildTemplate(n, rng, opts, forced);
    const { black, slots } = templateToSlots(n, tpl);
    if (slots.length < (opts.minEntries || 0) || slots.length > (opts.maxEntries || 999)) continue;
    if (!whiteConnected(n, black)) continue;
    if (opts.maxRunBlack && longestBlackRun(n, black) > opts.maxRunBlack) continue;
    const fixed = {};
    let missing = false;
    for (const p of plan) {
      const si = slots.findIndex(t => t.dir === p.dir && t.r === p.r && t.c === p.c && t.len === p.len);
      if (si < 0) { missing = true; break; }
      fixed[si] = p.entry;
    }
    if (missing) continue;
    {
      const test = [];
      for (let r = 0; r < n; r++) test.push(new Array(n).fill(null));
      let clash = false;
      for (const [si, e] of Object.entries(fixed)) {
        slots[+si].cells.forEach(([r, c], k) => { if (test[r][c] && test[r][c] !== e.word[k]) clash = true; test[r][c] = e.word[k]; });
      }
      if (clash) continue;
    }
    const banned = new Set(opts.themeEntries ? opts.themeEntries.map(e => e.word) : []);
    const res = fill(n, slots, dict, rng, { fixed, usage: opts.usage, nodeLimit: opts.nodeLimit || 40000, banned });
    if (!res) continue;
    const numbers = numberGrid(n, black, slots);
    const themeSet = new Set(Object.keys(fixed).map(Number));
    const entries = slots.map((s, si) => {
      const e = res.assigned[si];
      return {
        n: numbers[s.r * n + s.c], dir: s.dir, r: s.r, c: s.c, len: s.len, answer: e.word,
        clue: opts.clueKey === 'hard' && !themeSet.has(si) ? e.hard : e.clue,
        theme: themeSet.has(si) || undefined, display: e.display,
      };
    });
    if (leaks(entries)) continue;
    for (const e of entries) e.enumeration = enumeration(e);
    const rows = [];
    for (let r = 0; r < n; r++) {
      let line = '';
      for (let c = 0; c < n; c++) line += black[r][c] ? '#' : res.grid[r][c];
      rows.push(line);
    }
    const across = entries.filter(e => e.dir === 'across').sort((a, b) => a.n - b.n);
    const down = entries.filter(e => e.dir === 'down').sort((a, b) => a.n - b.n);
    return { size: n, grid: rows, across, down };
  }
  return null;
}

function words(text) { return text.toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean); }

// A clue may not contain its own answer or any other answer in the same grid.
function leaks(entries) {
  const answers = entries.map(e => e.answer);
  for (const e of entries) {
    const joined = e.clue.toUpperCase().replace(/[^A-Z]/g, '');
    const toks = new Set(words(e.clue));
    if (e.answer.length >= 5 && joined.includes(e.answer)) return true;
    if (toks.has(e.answer) || toks.has(e.answer + 'S')) return true;
    for (const part of (e.display || e.answer).split(' ')) if (part.length > 3 && toks.has(part)) return true;
    for (const a of answers) if (a !== e.answer && a.length >= 4 && (toks.has(a) || toks.has(a + 'S'))) return true;
  }
  return false;
}

function enumeration(e) {
  if (!e.display) return '(' + e.answer.length + ')';
  return '(' + e.display.split(/[ -]/).map(p => p.length).join(',') + ')';
}

// Independent checks run on every finished crossword before it is accepted.
function verifyCrossword(p, wordSet) {
  const errors = [];
  const n = p.size;
  const g = p.grid;
  if (g.length !== n || g.some(row => row.length !== n)) errors.push('size');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if ((g[r][c] === '#') !== (g[n - 1 - r][n - 1 - c] === '#')) errors.push('symmetry at ' + r + ',' + c);
  }
  // recompute entries from the grid and compare
  const found = [];
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (g[r][c] === '#') { c++; continue; }
      let e = c; while (e < n && g[r][e] !== '#') e++;
      if (e - c >= 2) found.push({ dir: 'across', r, c, answer: g[r].slice(c, e) });
      c = e;
    }
  }
  for (let c = 0; c < n; c++) {
    let r = 0;
    while (r < n) {
      if (g[r][c] === '#') { r++; continue; }
      let e = r; let w = '';
      while (e < n && g[e][c] !== '#') { w += g[e][c]; e++; }
      if (e - r >= 2) found.push({ dir: 'down', r, c, answer: w });
      r = e;
    }
  }
  const listed = p.across.concat(p.down);
  if (found.length !== listed.length) errors.push('entry count ' + found.length + ' vs ' + listed.length);
  for (const f of found) {
    const m = listed.find(e => e.dir === f.dir && e.r === f.r && e.c === f.c);
    if (!m || m.answer !== f.answer) errors.push('entry mismatch ' + f.dir + ' ' + f.r + ',' + f.c);
    if (f.answer.length < 3) errors.push('short entry');
    if (wordSet && !wordSet.has(f.answer)) errors.push('unknown word ' + f.answer);
  }
  const answers = listed.map(e => e.answer);
  if (new Set(answers).size !== answers.length) errors.push('duplicate answer');
  for (const e of listed) if (!e.clue || e.clue.length < 2) errors.push('missing clue for ' + e.answer);
  if (leaks(listed)) errors.push('a clue contains an answer');
  // every white square must belong to at least one entry; no two adjacent unchecked squares in an entry
  for (const e of listed) {
    let run = 0;
    for (let k = 0; k < e.answer.length; k++) {
      const r = e.dir === 'across' ? e.r : e.r + k;
      const c = e.dir === 'across' ? e.c + k : e.c;
      const checked = listed.some(o => o !== e && o.dir !== e.dir &&
        (o.dir === 'across' ? o.r === r && c >= o.c && c < o.c + o.answer.length : o.c === c && r >= o.r && r < o.r + o.answer.length));
      run = checked ? 0 : run + 1;
      if (run >= 2) { errors.push('two unchecked in a row in ' + e.answer); break; }
    }
  }
  return errors;
}

module.exports = { construct, Dictionary, verifyCrossword, splitPatterns, leaks };
