'use strict';
// Logic grid puzzles. Category 0 holds the people (or subjects); every other category is a
// one-to-one assignment. Clues are generated from a hidden solution, then pruned to a minimal
// set. Two independent checks run on every puzzle:
//   countSolutions() - exhaustive search proving exactly one solution exists
//   deduce()         - propagation-only solver proving it can be solved without guessing

/* ---------------- clue semantics ---------------- */
// Items are [category, index]. holder(item) = entity (index in category 0) that has the item.

function evalClue(clue, holder, ordOf) {
  const h = it => holder(it[0], it[1]);
  switch (clue.t) {
    case 'same': return h(clue.a) === h(clue.b);
    case 'diff': return h(clue.a) !== h(clue.b);
    case 'either': { const x = h(clue.a); return x === h(clue.b) || x === h(clue.c); }
    case 'neither': { const c = h(clue.c); return h(clue.a) !== c && h(clue.b) !== c && h(clue.a) !== h(clue.b); }
    case 'pair': {
      const a = h(clue.a), b = h(clue.b), c = h(clue.c), d = h(clue.d);
      return a !== b && ((a === c && b === d) || (a === d && b === c));
    }
    case 'alldiff': { const s = new Set(clue.items.map(h)); return s.size === clue.items.length; }
    case 'less': return ordOf(clue.a) < ordOf(clue.b);
    case 'by': return ordOf(clue.b) - ordOf(clue.a) === clue.gap;
    default: throw new Error('clue type ' + clue.t);
  }
}

function clueItems(clue) {
  if (clue.items) return clue.items;
  return [clue.a, clue.b, clue.c, clue.d].filter(Boolean);
}

/* ---------------- exhaustive counter ---------------- */

function countSolutions(spec, clues, limit = 2, nodeLimit = 3e6) {
  const { n, k, ordinal } = spec;
  // assignment: val[c][e] = item, hold[c][v] = entity, -1 when unknown
  const val = [], hold = [];
  for (let c = 0; c < k; c++) { val.push(new Array(n).fill(-1)); hold.push(new Array(n).fill(-1)); }
  for (let e = 0; e < n; e++) { val[0][e] = e; hold[0][e] = e; }
  const ordOfEntity = e => (ordinal >= 0 ? val[ordinal][e] : -1);
  const holder = (c, v) => hold[c][v];
  const ordOf = it => (it[0] === ordinal ? it[1] : ordOfEntity(holder(it[0], it[1])));
  const ready = clue => {
    for (const it of clueItems(clue)) {
      const e = holder(it[0], it[1]);
      if (e < 0) return false;
      if ((clue.t === 'less' || clue.t === 'by') && it[0] !== ordinal && ordOfEntity(e) < 0) return false;
    }
    return true;
  };
  let count = 0, nodes = 0;
  const sols = [];
  const vars = [];
  for (let c = 1; c < k; c++) for (let e = 0; e < n; e++) vars.push([c, e]);
  const rec = idx => {
    if (count >= limit) return;
    if (++nodes > nodeLimit) throw new Error('logic node limit');
    if (idx === vars.length) { count++; sols.push(val.map(r => r.slice())); return; }
    const [c, e] = vars[idx];
    for (let v = 0; v < n; v++) {
      if (hold[c][v] >= 0) continue;
      val[c][e] = v; hold[c][v] = e;
      let ok = true;
      for (const cl of clues) if (ready(cl) && !evalClue(cl, holder, ordOf)) { ok = false; break; }
      if (ok) rec(idx + 1);
      val[c][e] = -1; hold[c][v] = -1;
      if (count >= limit) return;
    }
  };
  rec(0);
  return { count, sols };
}

/* ---------------- propagation solver ---------------- */

function popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }
function lowbit(x) { return 31 - Math.clz32(x & -x); }

function deduce(spec, clues) {
  const { n, k, ordinal } = spec;
  const full = (1 << n) - 1;
  // poss[c][e]: bitmask of items of category c that entity e may have
  const poss = [];
  for (let c = 0; c < k; c++) {
    poss.push([]);
    for (let e = 0; e < n; e++) poss[c].push(c === 0 ? 1 << e : full);
  }
  const holdersOf = (c, v) => { const out = []; for (let e = 0; e < n; e++) if (poss[c][e] & (1 << v)) out.push(e); return out; };
  let steps = 0;
  const bijection = () => {
    let changed = false;
    for (let c = 1; c < k; c++) {
      for (let e = 0; e < n; e++) {
        const m = poss[c][e];
        if (!m) return -1;
        if (popcount(m) === 1) {
          for (let f = 0; f < n; f++) if (f !== e && (poss[c][f] & m)) { poss[c][f] &= ~m; changed = true; if (!poss[c][f]) return -1; }
        }
      }
      for (let v = 0; v < n; v++) {
        const hs = holdersOf(c, v);
        if (!hs.length) return -1;
        if (hs.length === 1 && poss[c][hs[0]] !== (1 << v)) { poss[c][hs[0]] = 1 << v; changed = true; }
      }
    }
    return changed ? 1 : 0;
  };
  const gac = clue => {
    const items = clueItems(clue);
    const ord = clue.t === 'less' || clue.t === 'by';
    const domains = items.map(it => holdersOf(it[0], it[1]));
    const support = items.map(() => new Set());
    const ordSupport = items.map(() => new Map()); // entity -> Set of ordinal values
    const cur = new Array(items.length);
    const curOrd = new Array(items.length);
    const rec = j => {
      if (j === items.length) {
        const holder = (c, v) => { const idx = items.findIndex(it => it[0] === c && it[1] === v); return cur[idx]; };
        const ordOf = it => { const idx = items.findIndex(x => x[0] === it[0] && x[1] === it[1]); return curOrd[idx]; };
        if (!evalClue(clue, holder, ordOf)) return;
        for (let i = 0; i < items.length; i++) {
          support[i].add(cur[i]);
          if (ord) { if (!ordSupport[i].has(cur[i])) ordSupport[i].set(cur[i], new Set()); ordSupport[i].get(cur[i]).add(curOrd[i]); }
        }
        return;
      }
      const [c, v] = items[j];
      for (const e of domains[j]) {
        let ok = true;
        for (let i = 0; i < j; i++) {
          const [ci, vi] = items[i];
          if (ci === c && vi !== v && cur[i] === e) { ok = false; break; }
          if (ci === c && vi === v && cur[i] !== e) { ok = false; break; }
        }
        if (!ok) continue;
        cur[j] = e;
        if (!ord) { rec(j + 1); continue; }
        let values;
        if (c === ordinal) values = [v];
        else { values = []; for (let o = 0; o < n; o++) if (poss[ordinal][e] & (1 << o)) values.push(o); }
        for (const o of values) {
          let ok2 = true;
          for (let i = 0; i < j; i++) {
            if (cur[i] === e && curOrd[i] !== o) { ok2 = false; break; }
            if (cur[i] !== e && curOrd[i] === o) { ok2 = false; break; }
          }
          if (!ok2) continue;
          if (c !== ordinal && !(poss[ordinal][e] & (1 << o))) continue;
          curOrd[j] = o;
          rec(j + 1);
        }
      }
    };
    rec(0);
    let changed = false;
    for (let i = 0; i < items.length; i++) {
      const [c, v] = items[i];
      if (!support[i].size) return -1;
      if (c === 0) continue;
      for (const e of domains[i]) {
        if (!support[i].has(e)) { poss[c][e] &= ~(1 << v); changed = true; if (!poss[c][e]) return -1; }
      }
      if (ord && c !== ordinal && support[i].size === 1) {
        const e = [...support[i]][0];
        let allowed = 0;
        for (const o of ordSupport[i].get(e)) allowed |= 1 << o;
        if ((poss[ordinal][e] & allowed) !== poss[ordinal][e]) { poss[ordinal][e] &= allowed; changed = true; if (!poss[ordinal][e]) return -1; }
      }
    }
    return changed ? 1 : 0;
  };
  for (let guard = 0; guard < 500; guard++) {
    let progress = false;
    const b = bijection();
    if (b < 0) return { ok: false, contradiction: true };
    if (b > 0) progress = true;
    for (const cl of clues) {
      const r = gac(cl);
      if (r < 0) return { ok: false, contradiction: true };
      if (r > 0) { progress = true; steps++; }
    }
    if (!progress) break;
  }
  let solved = true;
  for (let c = 1; c < k; c++) for (let e = 0; e < n; e++) if (popcount(poss[c][e]) !== 1) solved = false;
  if (!solved) return { ok: false, stuck: true };
  const sol = poss.map(row => row.map(m => lowbit(m)));
  return { ok: true, sol, steps };
}

/* ---------------- generation ---------------- */

function randomSolution(rng, n, k) {
  const sol = [Array.from({ length: n }, (_, i) => i)];
  for (let c = 1; c < k; c++) sol.push(rng.shuffle(Array.from({ length: n }, (_, i) => i)));
  return sol;
}

function candidateClues(rng, spec, sol, mix, count) {
  const { n, k, ordinal } = spec;
  const holderOf = (c, v) => sol[c].indexOf(v);
  const ordOfEntity = e => sol[ordinal][e];
  const randItem = (excludeCats = []) => {
    const cats = [];
    for (let c = 0; c < k; c++) if (!excludeCats.includes(c)) cats.push(c);
    const c = rng.pick(cats);
    return [c, rng.int(n)];
  };
  const itemOf = (c, e) => [c, sol[c][e]];
  const out = [];
  const seen = new Set();
  const push = cl => {
    const key = JSON.stringify(cl);
    if (seen.has(key)) return;
    seen.add(key); out.push(cl);
  };
  let guard = 0;
  while (out.length < count && guard++ < count * 40) {
    const t = rng.weighted(Object.entries(mix).filter(([type]) => ordinal >= 0 || (type !== 'less' && type !== 'by')));
    if (t === 'same') {
      const e = rng.int(n);
      const [ca, cb] = rng.sample([...Array(k).keys()], 2);
      push({ t, a: itemOf(ca, e), b: itemOf(cb, e) });
    } else if (t === 'diff') {
      const [e1, e2] = rng.sample([...Array(n).keys()], 2);
      const [ca, cb] = rng.sample([...Array(k).keys()], 2);
      push({ t, a: itemOf(ca, e1), b: itemOf(cb, e2) });
    } else if (t === 'either') {
      const e = rng.int(n);
      const [ca, cb] = rng.sample([...Array(k).keys()], 2);
      const other = rng.pick([...Array(n).keys()].filter(x => x !== e));
      const opts = rng.shuffle([itemOf(cb, e), itemOf(cb, other)]);
      push({ t, a: itemOf(ca, e), b: opts[0], c: opts[1] });
    } else if (t === 'neither') {
      const [e1, e2, e3] = rng.sample([...Array(n).keys()], 3);
      const cats = rng.sample([...Array(k).keys()], 3);
      push({ t, a: itemOf(cats[0], e1), b: itemOf(cats[1], e2), c: itemOf(cats[2], e3) });
    } else if (t === 'pair') {
      const [e1, e2] = rng.sample([...Array(n).keys()], 2);
      const cats = rng.sample([...Array(k).keys()], 3);
      const swap = rng.chance(0.5);
      push({ t, a: itemOf(cats[0], e1), b: itemOf(cats[1], e2), c: itemOf(cats[2], swap ? e2 : e1), d: itemOf(cats[2], swap ? e1 : e2) });
    } else if (t === 'alldiff') {
      const es = rng.sample([...Array(n).keys()], 3);
      const cats = es.map(() => rng.int(k));
      if (new Set(cats).size === 1) continue;
      push({ t, items: es.map((e, i) => itemOf(cats[i], e)) });
    } else if (t === 'less' || t === 'by') {
      const [e1, e2] = rng.sample([...Array(n).keys()], 2);
      const lo = ordOfEntity(e1) < ordOfEntity(e2) ? e1 : e2;
      const hi = lo === e1 ? e2 : e1;
      const cats = [...Array(k).keys()].filter(c => c !== ordinal);
      const a = itemOf(rng.pick(cats), lo), b = itemOf(rng.pick(cats), hi);
      if (t === 'less') push({ t, a, b });
      else push({ t, a, b, gap: ordOfEntity(hi) - ordOfEntity(lo) });
    }
  }
  // sanity: every candidate must be true of the solution
  const holder = (c, v) => holderOf(c, v);
  const ordOf = it => (it[0] === ordinal ? it[1] : ordOfEntity(holderOf(it[0], it[1])));
  return out.filter(cl => evalClue(cl, holder, ordOf) && !trivial(cl, ordinal));
}

function trivial(cl, ordinal) {
  const items = clueItems(cl);
  // clues that compare an item with another item of its own category say nothing useful
  if (cl.t === 'same' || cl.t === 'diff') return cl.a[0] === cl.b[0];
  if (cl.t === 'either') return cl.a[0] === cl.b[0] || cl.b[0] !== cl.c[0];
  if (cl.t === 'neither') return cl.a[0] === cl.c[0] || cl.b[0] === cl.c[0];
  if (cl.t === 'pair') return cl.c[0] !== cl.d[0] || cl.a[0] === cl.c[0] || cl.b[0] === cl.c[0];
  if (cl.t === 'less' || cl.t === 'by') return cl.a[0] === ordinal || cl.b[0] === ordinal;
  if (cl.t === 'alldiff') return items.some((x, i) => items.some((y, j) => i < j && x[0] === y[0]));
  return false;
}

function solutionsEqual(a, b) { return a.every((row, c) => row.every((v, e) => b[c][e] === v)); }

/**
 * spec: { n, k, ordinal (category index or -1) }
 * opts: { mix: {type: weight}, maxClues, minClues }
 */
function generate(rng, spec, opts) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const sol = randomSolution(rng, spec.n, spec.k);
    const pool = candidateClues(rng, spec, sol, opts.mix, 600);
    if (pool.length < 20) continue;
    // add clues until propagation alone solves the puzzle
    let chosen = [];
    for (const cl of rng.shuffle(pool)) {
      chosen.push(cl);
      if (chosen.length < spec.n) continue;
      const d = deduce(spec, chosen);
      if (d.ok) break;
      if (chosen.length > 60) break;
    }
    let d = deduce(spec, chosen);
    if (!d.ok || !solutionsEqual(d.sol, sol)) continue;
    // remove clues that are not needed, keeping the puzzle deducible
    for (const cl of rng.shuffle(chosen.slice())) {
      const trial = chosen.filter(x => x !== cl);
      const dt = deduce(spec, trial);
      if (dt.ok) chosen = trial;
    }
    if (opts.maxClues && chosen.length > opts.maxClues) continue;
    if (opts.minClues && chosen.length < opts.minClues) continue;
    if (opts.maxSame !== undefined && chosen.filter(c => c.t === 'same').length > opts.maxSame) continue;
    let res;
    try { res = countSolutions(spec, chosen, 2); } catch (e) { continue; }
    if (res.count !== 1 || !solutionsEqual(res.sols[0], sol)) continue;
    return { sol, clues: orderClues(rng, chosen) };
  }
  return null;
}

function orderClues(rng, clues) {
  // a pleasant reading order: mix types, keep it stable per puzzle
  return rng.shuffle(clues);
}

/* ---------------- text ---------------- */

function fill(tpl, x) { return tpl.replace(/\{x\}/g, x); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function renderClue(cl, cats, ordinal) {
  const np = ([c, v]) => fill(cats[c].np, cats[c].items[v]);
  const pred = ([c, v]) => fill(cats[c].pred, cats[c].items[v]);
  const neg = ([c, v]) => fill(cats[c].neg, cats[c].items[v]);
  // put a named person in the subject position when one is involved
  const subjFirst = (a, b) => (b[0] === 0 && a[0] !== 0 ? [b, a] : [a, b]);
  switch (cl.t) {
    case 'same': { const [a, b] = subjFirst(cl.a, cl.b); return cap(np(a) + ' ' + pred(b) + '.'); }
    case 'diff': { const [a, b] = subjFirst(cl.a, cl.b); return cap(np(a) + ' ' + neg(b) + '.'); }
    case 'either': return cap(np(cl.a) + (cl.a[0] === 0 && cats.plural ? ' are' : ' is') + ' either ' + np(cl.b) + ' or ' + np(cl.c) + '.');
    case 'neither': return 'Neither ' + np(cl.a) + ' nor ' + np(cl.b) + ' ' + pred(cl.c) + '.';
    case 'pair': return 'Of ' + np(cl.a) + ' and ' + np(cl.b) + ', one ' + pred(cl.c) + ' and the other ' + pred(cl.d) + '.';
    case 'alldiff': {
      const names = cl.items.map(np);
      return cap(names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] + ' are three different ' + cats.entityPlural + '.');
    }
    case 'less': return cap(np(cl.a) + ' ' + cats[ordinal].less + ' ' + np(cl.b) + '.');
    case 'by': return cap(np(cl.a) + ' ' + fill(cats[ordinal].by, cats[ordinal].step(cl.gap)) + ' ' + np(cl.b) + '.');
    default: return '';
  }
}

module.exports = { generate, countSolutions, deduce, renderClue, evalClue };
