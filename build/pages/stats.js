'use strict';
// Facts about each book, computed directly from the generated puzzle data. Product pages
// quote these numbers; nothing on a product page is an estimate.

const DIFFS = ['easy', 'medium', 'hard', 'expert'];

function avg(list) { return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0; }
function round1(x) { return Math.round(x * 10) / 10; }
function countBy(list, fn) {
  const out = {};
  for (const x of list) { const k = fn(x); out[k] = (out[k] || 0) + 1; }
  return out;
}

function bookStats(book) {
  const ps = book.puzzles;
  const s = { total: ps.length, byType: countBy(ps, p => p.type), byDifficulty: countBy(ps, p => p.difficulty), byVariant: countBy(ps, p => p.variant) };
  const sud = ps.filter(p => p.type === 'sudoku');
  if (sud.length) {
    s.sudoku = {};
    for (const v of ['classic', 'killer', 'jigsaw', 'diagonal', 'evenodd']) {
      const list = sud.filter(p => p.variant === v);
      if (!list.length) continue;
      s.sudoku[v] = {
        count: list.length,
        byDifficulty: countBy(list, p => p.difficulty),
        avgGivens: round1(avg(list.map(p => p.givenCount))),
        minGivens: Math.min(...list.map(p => p.givenCount)),
        maxGivens: Math.max(...list.map(p => p.givenCount)),
        avgGivensBy: Object.fromEntries(DIFFS.map(d => [d, list.filter(p => p.difficulty === d)]).filter(([, l]) => l.length).map(([d, l]) => [d, round1(avg(l.map(p => p.givenCount)))])),
        avgCages: v === 'killer' ? round1(avg(list.map(p => p.cages.length))) : undefined,
        avgCageSize: v === 'killer' ? round1(avg(list.map(p => 81 / p.cages.length))) : undefined,
        avgShaded: v === 'evenodd' ? round1(avg(list.map(p => p.even.split('').filter(x => x === '1').length))) : undefined,
        techniques: Array.from(new Set(list.flatMap(p => p.techniques))),
      };
    }
  }
  const xw = ps.filter(p => p.type === 'crossword');
  if (xw.length) {
    s.crossword = {};
    for (const v of ['mini', 'midi', 'full', 'themeless']) {
      const list = xw.filter(p => p.variant === v);
      if (!list.length) continue;
      const entries = list.map(p => p.across.length + p.down.length);
      s.crossword[v] = {
        count: list.length, size: list[0].size,
        avgEntries: round1(avg(entries)), totalEntries: entries.reduce((a, b) => a + b, 0),
        themeEntries: list.reduce((t, p) => t + p.across.concat(p.down).filter(e => e.theme).length, 0),
        longest: Math.max(...list.flatMap(p => p.across.concat(p.down).map(e => e.len))),
        avgLongTheme: round1(avg(list.flatMap(p => p.across.concat(p.down).filter(e => e.theme).map(e => e.len)))),
      };
    }
  }
  const ws = ps.filter(p => p.type === 'wordsearch');
  if (ws.length) {
    s.wordsearch = {};
    for (const d of ['easy', 'medium', 'hard']) {
      const list = ws.filter(p => p.difficulty === d);
      if (!list.length) continue;
      s.wordsearch[d] = { count: list.length, size: list[0].size, avgWords: round1(avg(list.map(p => p.words.length))), totalWords: list.reduce((t, p) => t + p.words.length, 0) };
    }
    s.totalWords = ws.reduce((t, p) => t + p.words.length, 0);
  }
  const cg = ps.filter(p => p.type === 'cryptogram');
  if (cg.length) {
    s.cryptogram = {
      byDifficulty: countBy(cg, p => p.difficulty),
      byHints: countBy(cg, p => Object.keys(p.hints).length),
      proverbs: cg.filter(p => p.source === 'proverb').length,
      sayings: cg.filter(p => p.source === 'saying').length,
      avgLetters: round1(avg(cg.map(p => p.plain.replace(/[^A-Z]/g, '').length))),
      avgHints: round1(avg(cg.map(p => Object.keys(p.hints).length))),
      unspaced: cg.filter(p => p.variant === 'unspaced').length,
    };
  }
  const lg = ps.filter(p => p.type === 'logic');
  if (lg.length) {
    s.logic = {};
    for (const d of DIFFS) {
      const list = lg.filter(p => p.difficulty === d);
      if (!list.length) continue;
      const sizes = countBy(list, p => p.categories.length + '×' + p.categories[0].items.length);
      s.logic[d] = { count: list.length, sizes, avgClues: round1(avg(list.map(p => p.clues.length))), cells: Math.max(...list.map(p => gridCells(p))) };
    }
    s.logicAll = {
      maxCategories: Math.max(...lg.map(p => p.categories.length)),
      maxItems: Math.max(...lg.map(p => p.categories[0].items.length)),
      maxCells: Math.max(...lg.map(gridCells)),
      minCells: Math.min(...lg.map(gridCells)),
      avgClues: round1(avg(lg.map(p => p.clues.length))),
      directLinks: round1(avg(lg.map(p => p.clueData.filter(c => c.t === 'same').length))),
      stories: lg.filter(p => p.story).length,
      sizes: countBy(lg, p => p.categories.length + ' categories × ' + p.categories[0].items.length),
    };
  }
  return s;
}

function gridCells(p) {
  const k = p.categories.length, n = p.categories[0].items.length;
  return (k * (k - 1) / 2) * n * n;
}

module.exports = { bookStats, DIFFS, gridCells };
