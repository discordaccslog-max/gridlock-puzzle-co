'use strict';
// Shared helpers for loading the hand-written content and describing generated puzzles.

const fs = require('fs');
const path = require('path');
const blocklist = require('../content/blocklist');

const CONTENT = path.join(__dirname, '..', 'content');

function crosswordEntries() {
  const out = [];
  for (const f of fs.readdirSync(CONTENT).filter(f => /^xw-\d+\.txt$/.test(f)).sort()) {
    for (const line of fs.readFileSync(path.join(CONTENT, f), 'utf8').split(/\r?\n/)) {
      if (!line.trim() || line.startsWith('#')) continue;
      const [word, clue, hard] = line.split('|').map(x => (x || '').trim());
      if (!/^[A-Z]+$/.test(word) || !clue) continue;
      if (blocklist.wholeWord.has(word)) continue;
      if (blocklist.flaggedWords(clue).length || blocklist.flaggedWords(hard).length) continue;
      out.push({ word, clue, hard: hard || '' });
    }
  }
  return out;
}

function tokens(text) {
  return String(text).toUpperCase().replace(/[^A-Z ]/g, ' ').split(/\s+/).filter(Boolean);
}

// Every word used anywhere in the catalog, plus the common-word list. The cryptogram checker
// uses all of them when it looks for a second readable decoding.
function allWords() {
  const words = [];
  for (const e of crosswordEntries()) words.push(e.word);
  const T = require('../content/xw-themes');
  for (const g of ['mini', 'midi', 'cartographer']) for (const th of T[g]) for (const [w] of th.entries) words.push(...tokens(w));
  for (const [, list] of require('../content/wordsearch-themes')) words.push(...tokens(list));
  const S = require('../content/cryptogram-sentences');
  for (const t of [...S.proverbs, ...S.sayings, ...S.unspaced]) words.push(...tokens(t));
  words.push(...S.common.map(w => w.toUpperCase()));
  return Array.from(new Set(words));
}

function signature(p) {
  switch (p.type) {
    case 'sudoku': return 'S:' + p.variant + ':' + p.givens + ':' + (p.regions || '') + ':' + (p.even || '') + ':' + JSON.stringify(p.cages || '');
    case 'crossword': return 'X:' + p.grid.join('');
    case 'wordsearch': return 'W:' + p.grid.join('');
    case 'cryptogram': return 'C:' + p.plain.replace(/[^A-Z]/g, '');
    case 'logic': return 'L:' + p.categories.map(c => c.items.join(',')).join('|') + ':' + p.clues.join('|');
    default: return JSON.stringify(p);
  }
}

function itemLabel(item) {
  const s = String(item).replace(/^(the|a|an) /i, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fillReveal(template, cats, sol) {
  return template.replace(/\{([^}|]+)\|([^}=]+)=([^}]+)\}/g, (m, want, key, value) => {
    const kc = cats.findIndex(c => c.name === key);
    const wc = cats.findIndex(c => c.name === want);
    const kv = cats[kc].items.indexOf(value);
    const entity = sol[kc].indexOf(kv);
    return cats[wc].items[sol[wc][entity]];
  });
}

module.exports = { crosswordEntries, allWords, signature, itemLabel, fillReveal, tokens };
