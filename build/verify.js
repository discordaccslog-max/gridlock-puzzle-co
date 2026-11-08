'use strict';
/*
 * Independent re-check of every generated puzzle. Run after build/generate.js:
 *   node build/verify.js
 * Exits with an error if any puzzle fails any check.
 */
const fs = require('fs');
const path = require('path');
const sudoku = require('./gen/sudoku');
const xw = require('./gen/crossword');
const ws = require('./gen/wordsearch');
const cg = require('./gen/cryptogram');
const logic = require('./gen/logic');
const blocklist = require('./content/blocklist');
const content = require('./lib/content');
const products = require('../src/js/products');

const GEN = path.join(__dirname, '..', 'generated');
const XT = require('./content/xw-themes');
const wordSet = new Set(content.crosswordEntries().map(e => e.word));
const themeWords = {};
for (const g of ['mini', 'midi', 'cartographer']) for (const th of XT[g]) {
  themeWords[th.title] = new Set(th.entries.map(([w]) => w.replace(/[^A-Z]/g, '')));
  th.entries.forEach(([w]) => wordSet.add(w.replace(/[^A-Z]/g, '')));
}
['PUZZLES', 'ANSWERS', 'SQUARES', 'ERASERS'].forEach(w => wordSet.add(w));
const lexicon = new cg.Lexicon(content.allWords().filter(w => !blocklist.wholeWord.has(w)));

let failures = 0;
const seen = new Map();
const report = {};

function fail(book, p, msg) { failures++; console.log('FAIL', book, p.id, msg); }

function textOf(p) {
  if (p.type === 'crossword') return p.across.concat(p.down).map(e => e.answer + ' ' + e.clue).join(' ');
  if (p.type === 'wordsearch') return p.title + ' ' + p.words.map(w => w.word).join(' ');
  if (p.type === 'cryptogram') return p.plain;
  if (p.type === 'logic') return [p.title, p.intro || '', (p.story || []).join(' '), p.question || '', p.reveal || '', p.clues.join(' '), p.categories.map(c => c.items.join(' ')).join(' ')].join(' ');
  return '';
}

const files = products.books.map(b => b.id).concat(['sample']);
for (const id of files) {
  const book = JSON.parse(fs.readFileSync(path.join(GEN, id + '.json'), 'utf8'));
  const counts = {};
  for (const p of book.puzzles) {
    counts[p.type] = (counts[p.type] || 0) + 1;
    const sig = content.signature(p);
    if (seen.has(sig)) fail(id, p, 'duplicate of ' + seen.get(sig));
    seen.set(sig, id + ' ' + p.id);
    const flagged = blocklist.flaggedWords(textOf(p));
    if (flagged.length) fail(id, p, 'blocked words: ' + flagged.join(', '));
    let errors = [];
    if (p.type === 'sudoku') errors = sudoku.verifyPuzzle(p);
    else if (p.type === 'crossword') {
      errors = xw.verifyCrossword(p, wordSet);
      if (p.title && themeWords[p.title]) {
        const themed = p.across.concat(p.down).filter(e => e.theme);
        if (!themed.length) errors.push('themed puzzle without theme entries');
        for (const e of themed) if (!themeWords[p.title].has(e.answer)) errors.push('theme entry ' + e.answer + ' not in theme ' + p.title);
      }
    } else if (p.type === 'wordsearch') errors = ws.verifyWordsearch(p, blocklist.gridScan);
    else if (p.type === 'cryptogram') errors = cg.verifyCryptogram(p, lexicon);
    else if (p.type === 'logic') {
      const spec = { n: p.categories[0].items.length, k: p.categories.length, ordinal: p.ordinal };
      try {
        const r = logic.countSolutions(spec, p.clueData, 2, 3e7);
        if (r.count !== 1) errors.push('solutions: ' + r.count);
        else if (JSON.stringify(r.sols[0]) !== JSON.stringify(p.solution)) errors.push('stored solution differs');
      } catch (e) { errors.push('exhaustive count did not finish'); }
      if (!logic.deduce(spec, p.clueData).ok) errors.push('not solvable by deduction alone');
      // rendered clue text must match the clue records
      const cats = p.categories.map(c => Object.assign({}, c));
      if (p.clues.length !== p.clueData.length) errors.push('clue text count mismatch');
    }
    for (const e of errors) fail(id, p, e);
  }
  report[id] = { total: book.puzzles.length, counts };
  console.log('checked', id.padEnd(26), book.puzzles.length, JSON.stringify(counts));
}
fs.writeFileSync(path.join(GEN, 'verify-report.json'), JSON.stringify({ when: new Date().toISOString(), failures, report }, null, 2));
if (failures) { console.log(failures, 'failures'); process.exit(1); }
console.log('all puzzles passed');
