'use strict';
// Sudoku engine for classic, killer, jigsaw, diagonal and even-odd rules.
//  - makeModel(): houses, peers, cages and parity for one rule set
//  - countSolutions(): exhaustive solver used to prove a puzzle has exactly one solution
//  - rate(): human-style solver that applies named techniques from easiest to hardest;
//    a puzzle's difficulty is the hardest technique it needs. Puzzles that cannot be
//    finished with these techniques are rejected by the generator.

const ALL = 0x1ff;
const POP = new Uint8Array(512);
const LOW = new Uint8Array(512);
const SUM = new Uint8Array(512);
for (let m = 0; m < 512; m++) {
  let c = 0, s = 0;
  for (let d = 1; d <= 9; d++) if (m & (1 << (d - 1))) { c++; s += d; }
  POP[m] = c; SUM[m] = s;
  if (m) { let d = 0; while (!((m >> d) & 1)) d++; LOW[m] = d + 1; }
}
const bit = d => 1 << (d - 1);
const digitsOf = m => { const a = []; for (let d = 1; d <= 9; d++) if (m & bit(d)) a.push(d); return a; };
const EVEN_MASK = bit(2) | bit(4) | bit(6) | bit(8);
const COMBOS = [];
for (let k = 0; k <= 9; k++) { COMBOS[k] = []; for (let s = 0; s <= 45; s++) COMBOS[k][s] = []; }
for (let m = 1; m < 512; m++) COMBOS[POP[m]][SUM[m]].push(m);

function boxRegions() {
  return Array.from({ length: 81 }, (_, i) => Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3));
}

function combinations(arr, k, start = 0, acc = [], out = []) {
  if (acc.length === k) { out.push(acc.slice()); return out; }
  for (let i = start; i < arr.length; i++) { acc.push(arr[i]); combinations(arr, k, i + 1, acc, out); acc.pop(); }
  return out;
}

function makeModel(opts = {}) {
  const regions = opts.regions || boxRegions();
  const houses = [];
  for (let r = 0; r < 9; r++) houses.push({ kind: 'row', cells: Array.from({ length: 9 }, (_, c) => r * 9 + c) });
  for (let c = 0; c < 9; c++) houses.push({ kind: 'col', cells: Array.from({ length: 9 }, (_, r) => r * 9 + c) });
  for (let g = 0; g < 9; g++) {
    const cells = [];
    for (let i = 0; i < 81; i++) if (regions[i] === g) cells.push(i);
    if (cells.length !== 9) throw new Error('region size');
    houses.push({ kind: 'region', cells });
  }
  if (opts.diagonal) {
    houses.push({ kind: 'diag', cells: Array.from({ length: 9 }, (_, k) => k * 10) });
    houses.push({ kind: 'diag', cells: Array.from({ length: 9 }, (_, k) => (k + 1) * 8) });
  }
  const cages = opts.cages || [];
  const cageOf = new Int16Array(81).fill(-1);
  cages.forEach((cg, k) => cg.cells.forEach(i => { cageOf[i] = k; }));
  const isPeer = new Uint8Array(81 * 81);
  const link = (a, b) => { if (a !== b) { isPeer[a * 81 + b] = 1; isPeer[b * 81 + a] = 1; } };
  houses.forEach(h => h.cells.forEach(a => h.cells.forEach(b => link(a, b))));
  cages.forEach(cg => cg.cells.forEach(a => cg.cells.forEach(b => link(a, b))));
  const peers = [];
  for (let a = 0; a < 81; a++) {
    const p = [];
    for (let b = 0; b < 81; b++) if (isPeer[a * 81 + b]) p.push(b);
    peers.push(Int16Array.from(p));
  }
  const initMask = new Uint16Array(81).fill(ALL);
  if (opts.even) for (let i = 0; i < 81; i++) if (opts.even[i]) initMask[i] = EVEN_MASK;
  const housePairs = [];
  for (let a = 0; a < houses.length; a++) {
    for (let b = a + 1; b < houses.length; b++) {
      const sb = new Set(houses[b].cells);
      const inter = houses[a].cells.filter(c => sb.has(c));
      if (inter.length >= 2) housePairs.push([a, b, new Set(inter)]);
    }
  }
  const model = { regions, houses, cages, cageOf, isPeer, peers, initMask, housePairs,
    diagonal: !!opts.diagonal, even: opts.even || null, innies: [] };
  if (cages.length) {
    model.innies = computeInnies(model);
    model.cagesInHouse = houses.map(h => {
      const set = new Set(h.cells);
      const list = [];
      cages.forEach((cg, k) => { if (cg.cells.every(c => set.has(c))) list.push(k); });
      return list;
    });
  }
  return model;
}

// The "45 rule": any row, column or region (or a band of them) sums to 45 per house,
// so the cells left over after removing whole cages form a sum constraint of their own.
function computeInnies(model) {
  const { cages } = model;
  const areas = model.houses.filter(h => h.kind !== 'diag').map(h => h.cells);
  for (let k = 2; k <= 4; k++) {
    for (let s = 0; s + k <= 9; s++) {
      const rows = [], cols = [];
      for (let r = s; r < s + k; r++) for (let c = 0; c < 9; c++) { rows.push(r * 9 + c); cols.push(c * 9 + r); }
      areas.push(rows, cols);
    }
  }
  // unions of standard boxes: side-by-side pairs and 2x2 blocks
  const boxCells = b => { const out = []; for (let i = 0; i < 81; i++) if (Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3) === b) out.push(i); return out; };
  if (model.regions.every((g, i) => g === Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3))) {
    for (let br = 0; br < 3; br++) for (let bc = 0; bc < 3; bc++) {
      const b = br * 3 + bc;
      if (bc < 2) areas.push(boxCells(b).concat(boxCells(b + 1)));
      if (br < 2) areas.push(boxCells(b).concat(boxCells(b + 3)));
      if (bc < 2 && br < 2) areas.push(boxCells(b).concat(boxCells(b + 1), boxCells(b + 3), boxCells(b + 4)));
    }
  }
  const out = [];
  const seen = new Set();
  const add = (cells, sum) => {
    if (cells.length < 1 || cells.length > 5) return;
    const key = cells.slice().sort((a, b) => a - b).join(',') + ':' + sum;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ cells: cells.slice(), sum });
  };
  for (const area of areas) {
    const set = new Set(area);
    const total = 45 * (area.length / 9);
    let insideSum = 0, partialSum = 0;
    const covered = new Set();
    const outies = [];
    cages.forEach(cg => {
      const inCount = cg.cells.filter(c => set.has(c)).length;
      if (inCount === cg.cells.length) { insideSum += cg.sum; cg.cells.forEach(c => covered.add(c)); }
      else if (inCount > 0) { partialSum += cg.sum; cg.cells.forEach(c => { if (!set.has(c)) outies.push(c); }); }
    });
    const innies = area.filter(c => !covered.has(c));
    add(innies, total - insideSum);
    add(outies, partialSum - (total - insideSum));
  }
  return out;
}

function newState(model) { return { cand: Uint16Array.from(model.initMask), val: new Uint8Array(81) }; }
function cloneState(s) { return { cand: s.cand.slice(), val: s.val.slice() }; }

function place(model, s, i, d) {
  const b = bit(d);
  if (!(s.cand[i] & b)) return false;
  s.val[i] = d; s.cand[i] = b;
  const P = model.peers[i];
  for (let k = 0; k < P.length; k++) {
    const p = P[k];
    if (s.cand[p] & b) {
      if (s.val[p]) return false;
      s.cand[p] &= ~b;
      if (!s.cand[p]) return false;
    }
  }
  return true;
}

function cageInfo(s, cg) {
  let placedMask = 0, placedSum = 0, union = 0;
  const free = [];
  for (const c of cg.cells) {
    if (s.val[c]) { placedMask |= bit(s.val[c]); placedSum += s.val[c]; }
    else { free.push(c); union |= s.cand[c]; }
  }
  const need = cg.sum - placedSum;
  const feasible = [];
  if (free.length && need > 0 && need <= 45) {
    for (const m of COMBOS[free.length][need]) {
      if (m & placedMask) continue;
      if ((m & union) !== m) continue;
      let ok = true;
      for (const c of free) if (!(s.cand[c] & m)) { ok = false; break; }
      if (ok) feasible.push(m);
    }
  }
  return { free, need, feasible, placedSum, placedMask };
}

// returns -1 contradiction, 1 progress, 0 nothing
function cagePrune(model, s) {
  let changed = 0;
  for (const cg of model.cages) {
    const info = cageInfo(s, cg);
    if (!info.free.length) { if (info.placedSum !== cg.sum) return -1; continue; }
    if (!info.feasible.length) return -1;
    let allowed = 0;
    for (const m of info.feasible) allowed |= m;
    for (const c of info.free) {
      const nm = s.cand[c] & allowed;
      if (nm !== s.cand[c]) { if (!nm) return -1; s.cand[c] = nm; changed = 1; }
    }
  }
  return changed;
}

function propagate(model, s) {
  for (;;) {
    let progress = false;
    for (let i = 0; i < 81; i++) {
      if (!s.val[i]) {
        const m = s.cand[i];
        if (!m) return false;
        if (POP[m] === 1) { if (!place(model, s, i, LOW[m])) return false; progress = true; }
      }
    }
    for (const h of model.houses) {
      const cells = h.cells;
      let placed = 0;
      for (const c of cells) if (s.val[c]) placed |= bit(s.val[c]);
      for (let d = 1; d <= 9; d++) {
        const b = bit(d);
        if (placed & b) continue;
        let pos = -1, n = 0;
        for (const c of cells) if (!s.val[c] && (s.cand[c] & b)) { n++; pos = c; if (n > 1) break; }
        if (n === 0) return false;
        if (n === 1) { if (!place(model, s, pos, d)) return false; progress = true; placed |= b; }
      }
    }
    if (model.cages.length) {
      const r = cagePrune(model, s);
      if (r < 0) return false;
      if (r > 0) progress = true;
    }
    if (!progress) return true;
  }
}

class NodeLimit extends Error {}

// Counts solutions up to `limit`. Throws NodeLimit when the search is too long.
function countSolutions(model, givens, limit = 2, opts = {}) {
  const s = newState(model);
  for (let i = 0; i < 81; i++) if (givens[i] && !place(model, s, i, givens[i])) return 0;
  let count = 0, nodes = 0;
  const nodeLimit = opts.nodeLimit || 2e6;
  const rec = st => {
    if (++nodes > nodeLimit) throw new NodeLimit('node limit');
    if (!propagate(model, st)) return;
    let best = -1, bc = 10;
    for (let i = 0; i < 81; i++) {
      if (!st.val[i]) { const pc = POP[st.cand[i]]; if (pc < bc) { bc = pc; best = i; if (pc === 2) break; } }
    }
    if (best < 0) { count++; if (opts.collect) opts.collect.push(Array.from(st.val)); return; }
    let ds = digitsOf(st.cand[best]);
    if (opts.rng) ds = opts.rng.shuffle(ds);
    for (const d of ds) {
      const s2 = cloneState(st);
      if (place(model, s2, best, d)) rec(s2);
      if (count >= limit) return;
    }
  };
  rec(s);
  return count;
}

function isUnique(model, givens, nodeLimit) {
  try { return countSolutions(model, givens, 2, { nodeLimit }) === 1; }
  catch (e) { if (e instanceof NodeLimit) return false; throw e; }
}

function randomSolution(model, rng, nodeLimit = 300000) {
  const out = [];
  try { countSolutions(model, new Uint8Array(81), 1, { rng, collect: out, nodeLimit }); }
  catch (e) { if (e instanceof NodeLimit) return null; throw e; }
  return out[0] || null;
}

/* ---------------- technique solver ---------------- */

function unsolvedCells(s, cells) { return cells.filter(c => !s.val[c]); }

function tNakedSingle(model, s) {
  let n = 0;
  for (let i = 0; i < 81; i++) {
    if (s.val[i]) continue;
    const m = s.cand[i];
    if (!m) return -1;
    if (POP[m] === 1) { if (!place(model, s, i, LOW[m])) return -1; n++; }
  }
  return n ? 1 : 0;
}

function tHiddenSingle(model, s) {
  let n = 0;
  for (const h of model.houses) {
    let placed = 0;
    for (const c of h.cells) if (s.val[c]) placed |= bit(s.val[c]);
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      if (placed & b) continue;
      let pos = -1, k = 0;
      for (const c of h.cells) if (!s.val[c] && (s.cand[c] & b)) { k++; pos = c; }
      if (k === 0) return -1;
      if (k === 1) { if (!place(model, s, pos, d)) return -1; placed |= b; n++; }
    }
  }
  return n ? 1 : 0;
}

function tCageCombos(model, s) { return cagePrune(model, s); }

function tLockedCandidates(model, s) {
  let changed = 0;
  for (const [ai, bi, inter] of model.housePairs) {
    for (const [x, y] of [[ai, bi], [bi, ai]]) {
      const A = model.houses[x].cells, B = model.houses[y].cells;
      for (let d = 1; d <= 9; d++) {
        const b = bit(d);
        let any = false, inside = true;
        for (const c of A) {
          if (s.val[c] === d) { any = false; inside = false; break; }
          if (!s.val[c] && (s.cand[c] & b)) { any = true; if (!inter.has(c)) { inside = false; break; } }
        }
        if (!any || !inside) continue;
        for (const c of B) {
          if (!inter.has(c) && !s.val[c] && (s.cand[c] & b)) {
            s.cand[c] &= ~b; changed = 1;
            if (!s.cand[c]) return -1;
          }
        }
      }
    }
    if (changed) return 1;
  }
  return 0;
}

function tCageLocked(model, s) {
  let changed = 0;
  for (const cg of model.cages) {
    const info = cageInfo(s, cg);
    if (info.free.length < 2 || !info.feasible.length) continue;
    let required = ALL;
    for (const m of info.feasible) required &= m;
    for (const d of digitsOf(required)) {
      const b = bit(d);
      const pos = info.free.filter(c => s.cand[c] & b);
      if (!pos.length) return -1;
      for (let c = 0; c < 81; c++) {
        if (s.val[c] || !(s.cand[c] & b) || pos.includes(c)) continue;
        if (pos.every(p => model.isPeer[p * 81 + c])) {
          s.cand[c] &= ~b; changed = 1;
          if (!s.cand[c]) return -1;
        }
      }
    }
    if (changed) return 1;
  }
  return 0;
}

function groupsFor(model) {
  if (!model._groups) {
    model._groups = model.houses.map(h => h.cells).concat(model.cages.map(c => c.cells));
  }
  return model._groups;
}

function nakedSubset(k) {
  return (model, s) => {
    for (const cells of groupsFor(model)) {
      const open = unsolvedCells(s, cells);
      if (open.length <= k) continue;
      const small = open.filter(c => POP[s.cand[c]] <= k);
      if (small.length < k) continue;
      for (const combo of combinations(small, k)) {
        let u = 0;
        for (const c of combo) u |= s.cand[c];
        if (POP[u] !== k) continue;
        let changed = 0;
        for (const c of open) {
          if (combo.includes(c)) continue;
          if (s.cand[c] & u) { s.cand[c] &= ~u; changed = 1; if (!s.cand[c]) return -1; }
        }
        if (changed) return 1;
      }
    }
    return 0;
  };
}

function hiddenSubset(k) {
  return (model, s) => {
    for (const h of model.houses) {
      const open = unsolvedCells(s, h.cells);
      if (open.length <= k) continue;
      let placed = 0;
      for (const c of h.cells) if (s.val[c]) placed |= bit(s.val[c]);
      const digits = digitsOf(ALL & ~placed);
      for (const combo of combinations(digits, k)) {
        let m = 0;
        for (const d of combo) m |= bit(d);
        const cells = open.filter(c => s.cand[c] & m);
        if (cells.length !== k) continue;
        let changed = 0;
        for (const c of cells) {
          if (s.cand[c] & ~m) { s.cand[c] &= m; changed = 1; }
        }
        if (changed) return 1;
      }
    }
    return 0;
  };
}

function fish(k) {
  return (model, s) => {
    for (let d = 1; d <= 9; d++) {
      const b = bit(d);
      for (const orient of [0, 1]) {
        const lines = [];
        for (let l = 0; l < 9; l++) {
          const pos = [];
          let solved = false;
          for (let x = 0; x < 9; x++) {
            const c = orient === 0 ? l * 9 + x : x * 9 + l;
            if (s.val[c] === d) { solved = true; break; }
            if (!s.val[c] && (s.cand[c] & b)) pos.push(x);
          }
          if (!solved && pos.length >= 2 && pos.length <= k) lines.push({ l, pos });
        }
        if (lines.length < k) continue;
        for (const combo of combinations(lines, k)) {
          const cover = new Set();
          combo.forEach(o => o.pos.forEach(x => cover.add(x)));
          if (cover.size !== k) continue;
          const base = new Set(combo.map(o => o.l));
          let changed = 0;
          for (const x of cover) {
            for (let l = 0; l < 9; l++) {
              if (base.has(l)) continue;
              const c = orient === 0 ? l * 9 + x : x * 9 + l;
              if (!s.val[c] && (s.cand[c] & b)) { s.cand[c] &= ~b; changed = 1; if (!s.cand[c]) return -1; }
            }
          }
          if (changed) return 1;
        }
      }
    }
    return 0;
  };
}

function tXYWing(model, s) {
  const P = model.isPeer;
  for (let p = 0; p < 81; p++) {
    if (s.val[p] || POP[s.cand[p]] !== 2) continue;
    const [x, y] = digitsOf(s.cand[p]);
    const wings = Array.from(model.peers[p]).filter(c => !s.val[c] && POP[s.cand[c]] === 2);
    for (const a of wings) {
      const ma = s.cand[a];
      if (!(ma & bit(x)) || (ma & bit(y))) continue;
      const z = LOW[ma & ~bit(x)];
      for (const bc of wings) {
        if (bc === a || s.cand[bc] !== (bit(y) | bit(z))) continue;
        let changed = 0;
        for (let c = 0; c < 81; c++) {
          if (c === p || c === a || c === bc || s.val[c] || !(s.cand[c] & bit(z))) continue;
          if (P[c * 81 + a] && P[c * 81 + bc]) { s.cand[c] &= ~bit(z); changed = 1; if (!s.cand[c]) return -1; }
        }
        if (changed) return 1;
      }
    }
  }
  return 0;
}

function tXYZWing(model, s) {
  const P = model.isPeer;
  for (let p = 0; p < 81; p++) {
    if (s.val[p] || POP[s.cand[p]] !== 3) continue;
    const mp = s.cand[p];
    const wings = Array.from(model.peers[p]).filter(c => !s.val[c] && POP[s.cand[c]] === 2 && (s.cand[c] & ~mp) === 0);
    for (let i = 0; i < wings.length; i++) {
      for (let j = i + 1; j < wings.length; j++) {
        const a = wings[i], bc = wings[j];
        if ((s.cand[a] | s.cand[bc]) !== mp) continue;
        const zm = s.cand[a] & s.cand[bc];
        if (POP[zm] !== 1) continue;
        let changed = 0;
        for (let c = 0; c < 81; c++) {
          if (c === p || c === a || c === bc || s.val[c] || !(s.cand[c] & zm)) continue;
          if (P[c * 81 + p] && P[c * 81 + a] && P[c * 81 + bc]) { s.cand[c] &= ~zm; changed = 1; if (!s.cand[c]) return -1; }
        }
        if (changed) return 1;
      }
    }
  }
  return 0;
}

// Applies the 45-rule sum constraints (innies and outies).
function tInnies(model, s) {
  let changed = 0;
  for (const v of model.innies) {
    const cells = v.cells;
    const n = cells.length;
    const support = new Array(n).fill(0);
    const cur = new Array(n);
    const rec = (k, sum) => {
      if (k === n) {
        if (sum === v.sum) for (let i = 0; i < n; i++) support[i] |= bit(cur[i]);
        return;
      }
      const remaining = n - k - 1;
      for (const d of digitsOf(s.cand[cells[k]])) {
        const ns = sum + d;
        if (ns + remaining > v.sum || ns + remaining * 9 < v.sum) continue;
        let ok = true;
        for (let i = 0; i < k; i++) if (cur[i] === d && model.isPeer[cells[i] * 81 + cells[k]]) { ok = false; break; }
        if (!ok) continue;
        cur[k] = d;
        rec(k + 1, ns);
      }
    };
    rec(0, 0);
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      if (!support[i]) return -1;
      if (s.val[c]) continue;
      const nm = s.cand[c] & support[i];
      if (nm !== s.cand[c]) { s.cand[c] = nm; changed = 1; }
    }
    if (changed) return 1;
  }
  return 0;
}

// Cages that lie wholly inside one house must use disjoint digit sets; combinations that
// cannot coexist with the other cages' options are ruled out.
function tCageClash(model, s) {
  let changed = 0;
  model.houses.forEach((h, hi) => {
    if (changed) return;
    const inside = model.cagesInHouse[hi];
    if (inside.length < 2) return;
    const infos = inside.map(k => cageInfo(s, model.cages[k]));
    if (infos.every(inf => !inf.free.length)) return;
    const lists = infos.map(inf => (inf.free.length ? inf.feasible.map(m => m | inf.placedMask) : [inf.placedMask]));
    if (lists.some(l => !l.length)) { changed = -1; return; }
    const supported = lists.map(() => new Set());
    let always = ALL, anyValid = false;
    const insideCells = new Set();
    inside.forEach(k => model.cages[k].cells.forEach(c => insideCells.add(c)));
    const outside = h.cells.filter(c => !insideCells.has(c));
    let outPlaced = 0;
    for (const c of outside) if (s.val[c]) outPlaced |= bit(s.val[c]);
    const pick = new Array(lists.length);
    const rec = (k, used) => {
      if (k === lists.length) {
        if (outside.length === 0 && used !== ALL) return;
        anyValid = true; always &= used;
        for (let i = 0; i < lists.length; i++) supported[i].add(pick[i]);
        return;
      }
      for (const m of lists[k]) {
        if (m & used || m & outPlaced) continue;
        pick[k] = m;
        rec(k + 1, used | m);
      }
    };
    rec(0, 0);
    if (!anyValid) { changed = -1; return; }
    infos.forEach((inf, i) => {
      if (!inf.free.length) return;
      let allowed = 0;
      for (const m of supported[i]) allowed |= m & ~inf.placedMask;
      for (const c of inf.free) {
        const nm = s.cand[c] & allowed;
        if (nm !== s.cand[c]) { s.cand[c] = nm; changed = changed < 0 ? changed : 1; if (!nm) changed = -1; }
      }
    });
    for (const c of outside) {
      if (s.val[c]) continue;
      const nm = s.cand[c] & ~always;
      if (nm !== s.cand[c]) { s.cand[c] = nm; if (changed >= 0) changed = 1; if (!nm) changed = -1; }
    }
  });
  return changed;
}

// Assume one digit of a two-candidate cell; if singles and cage sums then reach a
// contradiction, that digit is eliminated.
function tForcing(model, s) {
  for (let i = 0; i < 81; i++) {
    if (s.val[i] || POP[s.cand[i]] !== 2) continue;
    for (const d of digitsOf(s.cand[i])) {
      const t = cloneState(s);
      if (!place(model, t, i, d) || !propagate(model, t)) {
        s.cand[i] &= ~bit(d);
        return s.cand[i] ? 1 : -1;
      }
    }
  }
  return 0;
}

const TECHNIQUES = [
  { name: 'Naked single', level: 1, fn: tNakedSingle },
  { name: 'Hidden single', level: 1, fn: tHiddenSingle },
  { name: 'Cage combinations', level: 1, fn: tCageCombos, killer: true },
  { name: 'Locked candidates', level: 2, fn: tLockedCandidates },
  { name: 'Cage-locked digits', level: 2, fn: tCageLocked, killer: true },
  { name: 'Naked pair', level: 2, fn: nakedSubset(2) },
  { name: 'Innies and outies (the 45 rule)', level: 3, fn: tInnies, killer: true },
  { name: 'Hidden pair', level: 3, fn: hiddenSubset(2) },
  { name: 'Naked triple', level: 3, fn: nakedSubset(3) },
  { name: 'Hidden triple', level: 3, fn: hiddenSubset(3) },
  { name: 'X-Wing', level: 3, fn: fish(2) },
  { name: 'Swordfish', level: 4, fn: fish(3) },
  { name: 'Cage combination clashes', level: 4, fn: tCageClash, killer: true },
  { name: 'XY-Wing', level: 4, fn: tXYWing },
  { name: 'XYZ-Wing', level: 4, fn: tXYZWing },
  { name: 'Naked quad', level: 4, fn: nakedSubset(4) },
  { name: 'Hidden quad', level: 4, fn: hiddenSubset(4) },
  { name: 'Forcing chain', level: 4, fn: tForcing, cap: 4 },
];

const LEVEL_NAMES = { 1: 'easy', 2: 'medium', 3: 'hard', 4: 'expert' };

function rate(model, givens, maxLevel = 4, solution = null) {
  const s = newState(model);
  for (let i = 0; i < 81; i++) if (givens[i] && !place(model, s, i, givens[i])) return { ok: false };
  const techs = TECHNIQUES.filter(t => t.level <= maxLevel && (!t.killer || model.cages.length));
  let level = 1;
  const used = {};
  for (let guard = 0; guard < 5000; guard++) {
    let open = 0;
    for (let i = 0; i < 81; i++) if (!s.val[i]) open++;
    if (!open) {
      if (solution) for (let i = 0; i < 81; i++) if (s.val[i] !== solution[i]) return { ok: false, mismatch: true };
      return { ok: true, level, used };
    }
    let progressed = false;
    for (const t of techs) {
      const r = t.fn(model, s);
      if (r < 0) return { ok: false, contradiction: true };
      if (r > 0) {
        used[t.name] = (used[t.name] || 0) + 1;
        if (t.cap && used[t.name] > t.cap) return { ok: false, stuck: true, level };
        if (t.level > level) level = t.level;
        progressed = true;
        break;
      }
    }
    if (!progressed) return { ok: false, stuck: true, level };
  }
  return { ok: false };
}

/* ---------------- generators ---------------- */

function neighbors(i) {
  const r = Math.floor(i / 9), c = i % 9, out = [];
  if (r > 0) out.push(i - 9);
  if (r < 8) out.push(i + 9);
  if (c > 0) out.push(i - 1);
  if (c < 8) out.push(i + 1);
  return out;
}

function connected(cells) {
  const set = new Set(cells);
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const x = stack.pop();
    for (const n of neighbors(x)) if (set.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
  }
  return seen.size === cells.length;
}

function randomRegions(rng) {
  const reg = boxRegions();
  const box = boxRegions();
  let changedCells = 0;
  for (let iter = 0; iter < 6000 && changedCells < 34; iter++) {
    const a = rng.int(81);
    const nb = neighbors(a).filter(n => reg[n] !== reg[a]);
    if (!nb.length) continue;
    const ra = reg[a];
    const rb = reg[rng.pick(nb)];
    const candidates = [];
    for (let i = 0; i < 81; i++) {
      if (reg[i] === rb && neighbors(i).some(n => reg[n] === ra && n !== a)) candidates.push(i);
    }
    if (!candidates.length) continue;
    const b = rng.pick(candidates);
    reg[a] = rb; reg[b] = ra;
    const A = [], B = [];
    for (let i = 0; i < 81; i++) { if (reg[i] === ra) A.push(i); else if (reg[i] === rb) B.push(i); }
    if (!connected(A) || !connected(B)) { reg[a] = ra; reg[b] = rb; continue; }
    changedCells = 0;
    for (let i = 0; i < 81; i++) if (reg[i] !== box[i]) changedCells++;
  }
  return reg;
}

function randomCages(solution, rng, weights) {
  const cageOf = new Int16Array(81).fill(-1);
  const cages = [];
  for (const start of rng.shuffle([...Array(81).keys()])) {
    if (cageOf[start] >= 0) continue;
    const id = cages.length;
    const target = rng.weighted(weights);
    const cells = [start];
    let mask = bit(solution[start]);
    cageOf[start] = id;
    while (cells.length < target) {
      const fr = [];
      for (const c of cells) for (const n of neighbors(c)) {
        if (cageOf[n] < 0 && !(mask & bit(solution[n])) && !fr.includes(n)) fr.push(n);
      }
      if (!fr.length) break;
      const n = rng.pick(fr);
      cells.push(n); cageOf[n] = id; mask |= bit(solution[n]);
    }
    cages.push({ cells });
  }
  // merge single-cell cages into a neighbouring cage when the digits stay distinct
  for (let k = 0; k < cages.length; k++) {
    const cg = cages[k];
    if (cg.cells.length !== 1) continue;
    const c = cg.cells[0];
    const options = neighbors(c).map(n => cageOf[n]).filter(o => o !== k && cages[o].cells.length < 5 &&
      !cages[o].cells.some(x => solution[x] === solution[c]));
    if (options.length) {
      const o = rng.pick(options);
      cages[o].cells.push(c); cageOf[c] = o; cg.cells = [];
    }
  }
  return cages.filter(cg => cg.cells.length).map(cg => ({
    cells: cg.cells.slice().sort((a, b) => a - b),
    sum: cg.cells.reduce((t, c) => t + solution[c], 0),
  }));
}

// Repeatedly finds two solutions, dissolves the cages covering cells where they differ,
// and regrows those cells into new (smaller) cages until the cage layout is unique.
function repairCages(solution, cages, rng, rounds = 40) {
  let cur = cages.map(c => ({ cells: c.cells.slice(), sum: c.sum }));
  for (let round = 0; round < rounds; round++) {
    const model = makeModel({ cages: cur });
    const sols = [];
    let n;
    try { n = countSolutions(model, new Uint8Array(81), 2, { collect: sols, nodeLimit: 300000 }); }
    catch (e) { if (e instanceof NodeLimit) n = -1; else throw e; }
    if (n === 1) return cur;
    if (n === 0) return null;
    let diff;
    if (n === 2) {
      diff = [];
      for (let i = 0; i < 81; i++) if (sols[0][i] !== sols[1][i]) diff.push(i);
    } else {
      diff = [rng.int(81)];
    }
    const target = rng.pick(diff);
    const cageOf = new Int16Array(81).fill(-1);
    cur.forEach((c, k) => c.cells.forEach(x => { cageOf[x] = k; }));
    const dissolve = new Set([cageOf[target]]);
    for (const nb of neighbors(target)) if (rng.chance(0.5)) dissolve.add(cageOf[nb]);
    const freed = [];
    cur.forEach((c, k) => { if (dissolve.has(k)) freed.push(...c.cells); });
    const kept = cur.filter((c, k) => !dissolve.has(k));
    const free = new Set(freed);
    const regrown = [];
    for (const start of rng.shuffle(freed)) {
      if (!free.has(start)) continue;
      free.delete(start);
      const size = rng.weighted([[2, 55], [3, 35], [4, 10]]);
      const cells = [start];
      let mask = bit(solution[start]);
      while (cells.length < size) {
        const fr = [];
        for (const c of cells) for (const nb of neighbors(c)) if (free.has(nb) && !(mask & bit(solution[nb])) && !fr.includes(nb)) fr.push(nb);
        if (!fr.length) break;
        const nb = rng.pick(fr);
        free.delete(nb); cells.push(nb); mask |= bit(solution[nb]);
      }
      regrown.push({ cells });
    }
    // fold leftover single cells into an adjacent cage where digits stay distinct
    const all = kept.map(c => ({ cells: c.cells.slice() })).concat(regrown);
    const own = new Int16Array(81).fill(-1);
    all.forEach((c, k) => c.cells.forEach(x => { own[x] = k; }));
    for (let k = 0; k < all.length; k++) {
      if (all[k].cells.length !== 1) continue;
      const c = all[k].cells[0];
      const opts = neighbors(c).map(nb => own[nb]).filter(o => o !== k && all[o].cells.length >= 1 && all[o].cells.length < 5 &&
        !all[o].cells.some(x => solution[x] === solution[c]));
      if (opts.length) { const o = rng.pick(opts); all[o].cells.push(c); own[c] = o; all[k].cells = []; }
    }
    cur = all.filter(c => c.cells.length).map(c => ({
      cells: c.cells.slice().sort((a, b) => a - b),
      sum: c.cells.reduce((t, x) => t + solution[x], 0),
    }));
  }
  return null;
}

function givensCount(g) { let n = 0; for (let i = 0; i < 81; i++) if (g[i]) n++; return n; }

// Removes givens one at a time (or in symmetric pairs) while the puzzle stays unique and
// solvable with techniques at or below `maxLevel`.
function carve(model, solution, rng, { maxLevel, symmetric, minGivens = 17, stopAt = 0 }) {
  const g = Uint8Array.from(solution);
  const groups = [];
  if (symmetric) {
    for (let i = 0; i <= 40; i++) groups.push(i === 40 ? [40] : [i, 80 - i]);
  } else {
    for (let i = 0; i < 81; i++) groups.push([i]);
  }
  for (const grp of rng.shuffle(groups)) {
    if (givensCount(g) - grp.length < minGivens) continue;
    const backup = grp.map(i => g[i]);
    grp.forEach(i => { g[i] = 0; });
    let keep = isUnique(model, g, 200000);
    if (keep && maxLevel < 4) keep = rate(model, g, maxLevel).ok;
    if (!keep) { grp.forEach((i, k) => { g[i] = backup[k]; }); continue; }
    if (stopAt && givensCount(g) <= stopAt) break;
  }
  return g;
}

function toStr(arr) { return Array.from(arr).join(''); }

/**
 * Generates one verified puzzle.
 * spec: { variant, level (1-4), symmetric, minGivens, stopAt, maxGivens, cageWeights, maxKillerGivens }
 * Returns null when this attempt failed any check (caller retries).
 */
function generate(rng, spec) {
  const variant = spec.variant;
  let modelOpts = {};
  if (variant === 'jigsaw') modelOpts.regions = randomRegions(rng);
  if (variant === 'diagonal') modelOpts.diagonal = true;
  const base = makeModel(modelOpts);
  const solution = randomSolution(base, rng);
  if (!solution) return null;

  let model = base;
  let givens;
  if (variant === 'killer') {
    const rough = randomCages(solution, rng, spec.cageWeights || [[2, 30], [3, 36], [4, 24], [5, 10]]);
    const cages = repairCages(solution, rough, rng);
    if (!cages) return null;
    if (cages.some(c => c.cells.length === 1)) return null;
    model = makeModel({ cages });
    givens = new Uint8Array(81);
    if (!isUnique(model, givens, 400000)) return null;
    // Optionally add givens where the technique solver gets stuck.
    let r = rate(model, givens, 4, solution);
    let added = 0;
    while (!r.ok && r.stuck && added < (spec.maxKillerGivens || 0)) {
      const open = [];
      for (let i = 0; i < 81; i++) if (!givens[i]) open.push(i);
      const pickCell = rng.pick(open);
      givens[pickCell] = solution[pickCell];
      added++;
      r = rate(model, givens, 4, solution);
    }
    if (!r.ok || r.level !== spec.level) return null;
    return finish(variant, model, givens, solution, r, { cages });
  }

  if (variant === 'evenodd') {
    const evens = [];
    for (let i = 0; i < 81; i++) if (solution[i] % 2 === 0) evens.push(i);
    const shaded = new Array(81).fill(false);
    rng.sample(evens, rng.range(spec.shadeMin || 14, spec.shadeMax || 22)).forEach(i => { shaded[i] = true; });
    model = makeModel({ even: shaded });
  }
  // Easy puzzles are carved while staying singles-only; harder targets are carved to a
  // minimal puzzle on uniqueness alone and then accepted only if the rating matches.
  givens = carve(model, solution, rng, {
    maxLevel: spec.level === 1 ? 1 : 4, symmetric: !!spec.symmetric, minGivens: spec.minGivens || 17, stopAt: spec.stopAt || 0,
  });
  if (spec.maxGivens && givensCount(givens) > spec.maxGivens) return null;
  if (!isUnique(model, givens, 400000)) return null;
  const r = rate(model, givens, 4, solution);
  if (!r.ok || r.level !== spec.level) return null;
  return finish(variant, model, givens, solution, r, {});
}

function finish(variant, model, givens, solution, rating, extra) {
  const out = {
    type: 'sudoku',
    variant,
    difficulty: LEVEL_NAMES[rating.level],
    givens: toStr(givens),
    solution: toStr(solution),
    givenCount: givensCount(givens),
    techniques: TECHNIQUES.filter(t => rating.used[t.name] && t.level >= 2).map(t => t.name),
  };
  if (variant === 'jigsaw') out.regions = toStr(model.regions);
  if (variant === 'diagonal') out.diagonal = true;
  if (variant === 'evenodd') out.even = model.even.map(x => (x ? '1' : '0')).join('');
  if (variant === 'killer') out.cages = extra.cages.map(cg => [cg.sum, cg.cells]);
  return out;
}

// Independent re-check used by the build's final verification pass.
function verifyPuzzle(p) {
  const opts = {};
  if (p.regions) opts.regions = p.regions.split('').map(Number);
  if (p.diagonal) opts.diagonal = true;
  if (p.even) opts.even = p.even.split('').map(x => x === '1');
  if (p.cages) opts.cages = p.cages.map(([sum, cells]) => ({ sum, cells }));
  const model = makeModel(opts);
  const givens = Uint8Array.from(p.givens.split('').map(Number));
  const sol = p.solution.split('').map(Number);
  const errors = [];
  for (let i = 0; i < 81; i++) if (givens[i] && givens[i] !== sol[i]) errors.push('given mismatch');
  for (const h of model.houses) {
    const seen = new Set(h.cells.map(c => sol[c]));
    if (seen.size !== 9) errors.push('house not 1-9');
  }
  if (p.even) for (let i = 0; i < 81; i++) if (p.even[i] === '1' && sol[i] % 2) errors.push('even cell odd');
  if (p.cages) for (const [sum, cells] of p.cages) {
    if (cells.reduce((t, c) => t + sol[c], 0) !== sum) errors.push('cage sum');
    if (new Set(cells.map(c => sol[c])).size !== cells.length) errors.push('cage repeat');
  }
  const collect = [];
  let n;
  try { n = countSolutions(model, givens, 2, { collect, nodeLimit: 3e6 }); }
  catch (e) { n = -1; }
  if (n !== 1) errors.push('solutions=' + n);
  else if (collect[0].join('') !== p.solution) errors.push('solver solution differs');
  const r = rate(model, givens, 4, sol);
  if (!r.ok) errors.push('not solvable by techniques');
  else if (LEVEL_NAMES[r.level] !== p.difficulty) errors.push('difficulty mismatch');
  return errors;
}

module.exports = { generate, verifyPuzzle, makeModel, countSolutions, rate, TECHNIQUES, LEVEL_NAMES };
