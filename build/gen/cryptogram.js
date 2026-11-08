'use strict';
// Substitution cryptograms. Keys never map a letter to itself. A solver searches the whole
// catalog vocabulary for every readable decoding consistent with the ciphertext, the given
// starting letters and the no-self-mapping rule; a puzzle is accepted only when exactly one exists.

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function derangedKey(rng) {
  for (;;) {
    const p = rng.shuffle(A.split(''));
    if (p.every((ch, i) => ch !== A[i])) {
      const key = {};
      A.split('').forEach((ch, i) => { key[ch] = p[i]; });
      return key;
    }
  }
}

function encrypt(text, key) {
  return text.toUpperCase().split('').map(ch => (key[ch] ? key[ch] : ch)).join('');
}

function pattern(word) {
  const seen = {};
  let next = 0, out = '';
  for (const ch of word) {
    if (seen[ch] === undefined) seen[ch] = String.fromCharCode(97 + next++);
    out += seen[ch];
  }
  return out;
}

class Lexicon {
  constructor(words) {
    this.words = Array.from(new Set(words.map(w => w.toUpperCase()).filter(w => /^[A-Z]+$/.test(w))));
    this.byPattern = new Map();
    for (const w of this.words) {
      const p = pattern(w);
      if (!this.byPattern.has(p)) this.byPattern.set(p, []);
      this.byPattern.get(p).push(w);
    }
    this.maxLen = Math.max(...this.words.map(w => w.length));
  }
  candidates(cipherWord) { return this.byPattern.get(pattern(cipherWord)) || []; }
}

// Solve a spaced cryptogram: returns up to `limit` distinct plaintexts.
function solveSpaced(cipher, hints, lex, limit = 2, nodeLimit = 200000) {
  const cwords = Array.from(new Set(cipher.split(/[^A-Z]+/).filter(Boolean)));
  const order = cwords.map(w => ({ w, cands: lex.candidates(w) }))
    .sort((a, b) => a.cands.length - b.cands.length || b.w.length - a.w.length);
  const c2p = {}, p2c = {};
  for (const [c, p] of Object.entries(hints)) { c2p[c] = p; p2c[p] = c; }
  const results = [];
  let nodes = 0, aborted = false;
  const rec = k => {
    if (results.length >= limit || aborted) return;
    if (++nodes > nodeLimit) { aborted = true; return; }
    if (k === order.length) {
      results.push(cipher.split('').map(ch => c2p[ch] || ch).join(''));
      return;
    }
    const { w, cands } = order[k];
    for (const cand of cands) {
      const added = [];
      let ok = true;
      for (let i = 0; i < w.length; i++) {
        const c = w[i], p = cand[i];
        if (c === p) { ok = false; break; }
        if (c2p[c]) { if (c2p[c] !== p) { ok = false; break; } continue; }
        if (p2c[p]) { ok = false; break; }
        c2p[c] = p; p2c[p] = c; added.push(c);
      }
      if (ok) rec(k + 1);
      for (const c of added) { delete p2c[c2p[c]]; delete c2p[c]; }
      if (results.length >= limit || aborted) return;
    }
  };
  rec(0);
  return { results, aborted };
}

// Solve with word breaks removed: the solver must also find where words begin and end.
function solveUnspaced(cipher, hints, lex, limit = 2, nodeLimit = 600000) {
  const s = cipher.replace(/[^A-Z]/g, '');
  const n = s.length;
  // candidate words for each start position, by pattern of the cipher span
  const spans = [];
  for (let i = 0; i < n; i++) {
    const list = [];
    for (let L = 1; L <= Math.min(lex.maxLen, n - i); L++) {
      const span = s.slice(i, i + L);
      for (const w of lex.candidates(span)) list.push(w);
    }
    spans.push(list);
  }
  const c2p = {}, p2c = {};
  for (const [c, p] of Object.entries(hints)) { c2p[c] = p; p2c[p] = c; }
  const found = new Set();
  const dead = new Set();
  let nodes = 0, aborted = false;
  const key = i => i + ':' + A.split('').map(ch => c2p[ch] || '.').join('');
  const rec = i => {
    if (found.size >= limit || aborted) return false;
    if (++nodes > nodeLimit) { aborted = true; return false; }
    if (i === n) { found.add(s.split('').map(ch => c2p[ch]).join('')); return true; }
    const k = key(i);
    if (dead.has(k)) return false;
    let any = false;
    for (const w of spans[i]) {
      const added = [];
      let ok = true;
      for (let j = 0; j < w.length; j++) {
        const c = s[i + j], p = w[j];
        if (c === p) { ok = false; break; }
        if (c2p[c]) { if (c2p[c] !== p) { ok = false; break; } continue; }
        if (p2c[p]) { ok = false; break; }
        c2p[c] = p; p2c[p] = c; added.push(c);
      }
      if (ok && rec(i + w.length)) any = true;
      for (const c of added) { delete p2c[c2p[c]]; delete c2p[c]; }
      if (found.size >= limit || aborted) return any;
    }
    if (!any) dead.add(k);
    return any;
  };
  rec(0);
  return { results: Array.from(found), aborted };
}

/**
 * Builds one cryptogram.
 * opts: { text, unspaced, baseHints, maxHints, lex, rng }
 * Starting letters are added until the decoding is unique; returns null if that needs more than maxHints.
 */
function build(rng, { text, unspaced, baseHints, maxHints, lex }) {
  const plainFull = text.toUpperCase();
  const plain = unspaced ? plainFull.replace(/[^A-Z]/g, '') : plainFull;
  for (let keyTry = 0; keyTry < 4; keyTry++) {
    const key = derangedKey(rng);
    const cipher = encrypt(plain, key);
    const inv = {};
    for (const [p, c] of Object.entries(key)) inv[c] = p;
    const letters = Array.from(new Set(cipher.replace(/[^A-Z]/g, '').split('')));
    const hints = {};
    for (const c of rng.shuffle(letters).slice(0, baseHints)) hints[c] = inv[c];
    let solved = false;
    for (let guard = 0; guard <= maxHints; guard++) {
      const { results, aborted } = unspaced ? solveUnspaced(cipher, hints, lex) : solveSpaced(cipher, hints, lex);
      if (!aborted && results.length === 1 && results[0] === plain) { solved = true; break; }
      if (Object.keys(hints).length >= maxHints) break;
      // reveal a letter that separates two readings, or any unrevealed letter if the search was cut short
      let pick = null;
      if (!aborted && results.length >= 2) {
        const a = results[0], b = results[1];
        const cands = [];
        for (let i = 0; i < cipher.length; i++) if (a[i] !== b[i] && /[A-Z]/.test(cipher[i]) && !hints[cipher[i]]) cands.push(cipher[i]);
        pick = cands.length ? rng.pick(cands) : null;
      }
      if (!pick) {
        const open = letters.filter(c => !hints[c]);
        if (!open.length) break;
        // prefer the most frequent unrevealed letter when the search could not finish
        const freq = {};
        for (const ch of cipher) if (open.includes(ch)) freq[ch] = (freq[ch] || 0) + 1;
        pick = open.sort((x, y) => freq[y] - freq[x])[0];
      }
      hints[pick] = inv[pick];
    }
    if (!solved) continue;
    return { cipher, plain, hints, key };
  }
  return null;
}

function verifyCryptogram(p, lex) {
  const errors = [];
  const plain = p.plain, cipher = p.cipher;
  if (plain.length !== cipher.length) errors.push('length');
  const map = {}, rev = {};
  for (let i = 0; i < plain.length; i++) {
    const a = cipher[i], b = plain[i];
    if (/[A-Z]/.test(a) !== /[A-Z]/.test(b)) { errors.push('alignment'); break; }
    if (!/[A-Z]/.test(a)) { if (a !== b) errors.push('punctuation'); continue; }
    if (a === b) errors.push('letter maps to itself');
    if (map[a] && map[a] !== b) errors.push('inconsistent key');
    if (rev[b] && rev[b] !== a) errors.push('key not one-to-one');
    map[a] = b; rev[b] = a;
  }
  for (const [c, pl] of Object.entries(p.hints)) if (map[c] !== pl) errors.push('bad hint');
  const r = p.variant === 'unspaced' ? solveUnspaced(cipher, p.hints, lex, 2, 2e6) : solveSpaced(cipher, p.hints, lex, 2, 2e6);
  if (r.aborted) errors.push('uniqueness search did not finish');
  else if (r.results.length !== 1) errors.push('readable decodings: ' + r.results.length);
  else if (r.results[0] !== plain) errors.push('solver found a different text');
  return errors;
}

module.exports = { build, verifyCryptogram, Lexicon, solveSpaced, solveUnspaced, pattern };
