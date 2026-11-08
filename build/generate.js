'use strict';
/*
 * Gridlock Puzzle Co. puzzle generator.
 *
 * Generates every puzzle in every book, checks each one as it is made, and writes
 * generated/<book>.json. Run `node build/generate.js` for everything or
 * `node build/generate.js --only=cipher-room,ink-and-clue` for specific books.
 *
 * Word sources: every word list, clue, sentence, theme and story under build/content/ was
 * written for Gridlock Puzzle Co. from the team's own vocabulary; no public word list,
 * published puzzle or quotation was copied. Traditional proverbs in
 * build/content/cryptogram-sentences.js are public-domain sayings with no attribution.
 * build/content/blocklist.js removes offensive, violent, political and brand-name words.
 */

const fs = require('fs');
const path = require('path');
const { RNG } = require('./lib/rng');
const sudoku = require('./gen/sudoku');
const xw = require('./gen/crossword');
const ws = require('./gen/wordsearch');
const cg = require('./gen/cryptogram');
const logic = require('./gen/logic');
const blocklist = require('./content/blocklist');
const content = require('./lib/content');

const OUT = path.join(__dirname, '..', 'generated');
fs.mkdirSync(OUT, { recursive: true });

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const only = args.only ? args.only.split(',') : null;
const want = id => !only || only.includes(id);

function log(...m) { console.log(new Date().toISOString().slice(11, 19), ...m); }
function pad(n) { return String(n).padStart(3, '0'); }
function write(id, book) {
  fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(book));
  log('wrote', id, book.puzzles.length, 'puzzles');
}
function finishBook(id, prefix, title, puzzles) {
  puzzles.forEach((p, i) => { p.id = prefix + '-' + pad(i + 1); p.n = i + 1; });
  write(id, { id, title, puzzles });
}

// signatures of every puzzle already generated, so no puzzle repeats anywhere in the catalog
const seen = new Set();
for (const f of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) {
  if (!f.endsWith('.json') || f === 'manifest.json') continue;
  const id = f.replace('.json', '');
  if (only && only.includes(id)) continue;
  const book = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
  for (const p of book.puzzles || []) seen.add(content.signature(p));
}
function fresh(p) {
  const sig = content.signature(p);
  if (seen.has(sig)) return false;
  seen.add(sig);
  return true;
}

/* ---------------- sudoku ---------------- */

function sudokuBatch(rng, spec, count) {
  const out = [];
  let tries = 0;
  while (out.length < count) {
    tries++;
    const p = sudoku.generate(rng, spec);
    if (!p || !fresh(p)) continue;
    if (spec.maxGivens && p.givenCount > spec.maxGivens) continue;
    const errors = sudoku.verifyPuzzle(p);
    if (errors.length) { log('discarded sudoku:', errors.join('; ')); continue; }
    out.push(p);
  }
  log('  sudoku', spec.variant, sudoku.LEVEL_NAMES[spec.level], count, 'in', tries, 'attempts');
  return out;
}

const VARIANT_TITLES = { classic: 'Classic Sudoku', killer: 'Killer Sudoku', jigsaw: 'Jigsaw Sudoku', diagonal: 'Diagonal Sudoku', evenodd: 'Even-Odd Sudoku' };

function titleSudoku(list) { list.forEach(p => { p.title = VARIANT_TITLES[p.variant]; }); return list; }

if (want('daily-grid')) {
  const rng = new RNG('daily-grid-v1');
  log('daily-grid');
  const puzzles = [
    ...sudokuBatch(rng, { variant: 'classic', level: 1, symmetric: true, stopAt: 36 }, 50),
    ...sudokuBatch(rng, { variant: 'classic', level: 2, symmetric: true }, 50),
    ...sudokuBatch(rng, { variant: 'classic', level: 3, symmetric: true }, 50),
    ...sudokuBatch(rng, { variant: 'classic', level: 4, symmetric: true }, 50),
  ];
  finishBook('daily-grid', 'dg', 'The Daily Grid: Classic Sudoku', titleSudoku(puzzles));
}

const killerCore = [[2, 26], [3, 36], [4, 26], [5, 12]];
const killerBL = [[2, 12], [3, 34], [4, 34], [5, 20]];

if (want('variant-sudoku')) {
  const rng = new RNG('variant-sudoku-v1');
  log('variant-sudoku');
  const puzzles = [];
  for (const variant of ['killer', 'jigsaw', 'diagonal', 'evenodd']) {
    const base = { variant, symmetric: variant === 'diagonal' || variant === 'evenodd', cageWeights: killerCore, shadeMin: 12, shadeMax: 18 };
    puzzles.push(...sudokuBatch(rng, Object.assign({ level: 3 }, base), 12));
    puzzles.push(...sudokuBatch(rng, Object.assign({ level: 4 }, base), 13));
  }
  finishBook('variant-sudoku', 'vs', 'Variant Sudoku: Expert Edition', titleSudoku(puzzles));
}

/* ---------------- crosswords ---------------- */

const xwEntries = content.crosswordEntries();
const xwDict = new xw.Dictionary(xwEntries);
const xwHardDict = new xw.Dictionary(xwEntries.filter(e => e.hard));
const xwWordSet = new Set(xwEntries.map(e => e.word));
const XT = require('./content/xw-themes');
const toThemeEntry = ([w, clue]) => ({ word: w.replace(/[^A-Z]/g, ''), clue, display: w.includes(' ') ? w : undefined });
for (const group of ['mini', 'midi', 'cartographer']) for (const th of XT[group]) for (const [w] of th.entries) xwWordSet.add(w.replace(/[^A-Z]/g, ''));

const XW_CFG = {
  mini: { size: 7, themeAcrossOnly: true, themePairs: 1, themeLengths: [7], lengthWeights: { 3: 1, 7: 2 }, minEntries: 10, maxEntries: 14 },
  midi: { size: 11, themeAcrossOnly: true, themePairs: 2, themeLengths: [5, 7, 11], themeLenWeights: { 5: 1, 7: 2, 11: 2 }, lengthWeights: { 3: 0.5, 5: 3, 7: 3, 11: 0.6 }, minEntries: 18, maxEntries: 26, maxRunBlack: 5 },
  full: { size: 15, themeAcrossOnly: true, themePairs: 2, themeLengths: [9, 11, 15], themeLenWeights: { 9: 1, 11: 2, 15: 2 }, maxFill: 11, lengthWeights: { 3: 0.3, 5: 2, 7: 3, 9: 3, 11: 1.5 }, minEntries: 26, maxEntries: 40, maxRunBlack: 5, nodeLimit: 150000 },
  themeless: { size: 15, maxFill: 11, lengthWeights: { 3: 0.3, 5: 2, 7: 3, 9: 3, 11: 1.5 }, minEntries: 28, maxEntries: 40, maxRunBlack: 5, nodeLimit: 150000, clueKey: 'hard' },
};

function crossword(rng, cfgName, theme, usage, dict) {
  const rounds = cfgName === 'full' ? 24 : 10;
  for (let round = 0; round < rounds; round++) {
    const opts = Object.assign({ usage, attempts: 300 }, XW_CFG[cfgName]);
    // later rounds may also use 7-letter theme pairs in full-size grids
    if (cfgName === 'full' && round >= 12) opts.themeLengths = [7, 9, 11, 15];
    if (theme) opts.themeEntries = theme.entries.map(toThemeEntry);
    const p = xw.construct(rng, dict || xwDict, opts);
    if (!p) continue;
    const errors = xw.verifyCrossword(p, xwWordSet);
    if (errors.length) { log('discarded crossword:', errors.join('; ')); continue; }
    const out = Object.assign({ type: 'crossword', variant: cfgName, title: theme ? theme.title : null }, p);
    if (!fresh(out)) continue;
    for (const e of out.across.concat(out.down)) if (!e.theme) usage.set(e.answer, (usage.get(e.answer) || 0) + 1);
    return out;
  }
  return null;
}

const XW_DIFFICULTY = { mini: 'easy', midi: 'medium', full: 'hard', themeless: 'expert' };

if (want('ink-and-clue')) {
  const rng = new RNG('ink-and-clue-v1');
  log('ink-and-clue');
  const usage = new Map();
  const puzzles = [];
  for (const group of ['mini', 'midi']) {
    for (const th of XT[group]) {
      const p = crossword(new RNG('ink-and-clue-v1:' + group + ':' + th.title), group, th, usage);
      if (!p) { log('  could not build', group, th.title); continue; }
      p.difficulty = XW_DIFFICULTY[group];
      puzzles.push(p);
    }
  }
  finishBook('ink-and-clue', 'ic', 'Ink & Clue: Crosswords', puzzles);
}

if (want('cartographers-crosswords')) {
  const rng = new RNG('cartographers-v1');
  log('cartographers-crosswords');
  const usage = new Map();
  const puzzles = [];
  for (const th of XT.cartographer) {
    const p = crossword(new RNG('cartographers-v1:' + th.title), 'full', th, usage);
    if (!p) { log('  could not build', th.title); continue; }
    p.difficulty = XW_DIFFICULTY.full;
    puzzles.push(p);
  }
  finishBook('cartographers-crosswords', 'cc', 'The Cartographer\'s Crosswords', puzzles);
}

/* ---------------- word search ---------------- */

if (want('hidden-lines')) {
  const rng = new RNG('hidden-lines-v1');
  log('hidden-lines');
  const themes = require('./content/wordsearch-themes');
  const levels = [['easy', 12, 12, 10], ['medium', 14, 15, 12], ['hard', 15, 18, 14]];
  const puzzles = [];
  themes.forEach(([title, list], i) => {
    const [difficulty, size, count, minCount] = levels[i % 3];
    const words = list.split(/\s+/).filter(w => !blocklist.wholeWord.has(w));
    let p = null;
    for (let t = 0; t < 20 && !p; t++) {
      const cand = ws.generate(rng, { title, words, difficulty, size, count, minCount, blocked: blocklist.gridScan });
      if (cand && !ws.verifyWordsearch(cand, blocklist.gridScan).length && fresh(cand)) p = cand;
    }
    if (!p) { log('  could not build word search', title); return; }
    puzzles.push(p);
  });
  // group by difficulty so the book reads gentle to tricky
  const order = { easy: 0, medium: 1, hard: 2 };
  puzzles.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  finishBook('hidden-lines', 'hl', 'Hidden Lines: Word Search', puzzles);
}

/* ---------------- cryptograms ---------------- */

const lexicon = new cg.Lexicon(content.allWords().filter(w => !blocklist.wholeWord.has(w)));

if (want('cipher-room')) {
  const rng = new RNG('cipher-room-v1');
  log('cipher-room');
  const S = require('./content/cryptogram-sentences');
  const pool = [...S.proverbs.map(t => [t, 'proverb']), ...S.sayings.map(t => [t, 'saying'])];
  const built = [];
  for (const [text, source] of pool) {
    const r = cg.build(rng, { text, unspaced: false, baseHints: 0, maxHints: 3, lex: lexicon });
    if (r) built.push({ text, source, r, need: Object.keys(r.hints).length });
  }
  log('  sentences with a unique reading:', built.length, 'of', pool.length);
  const LEVELS = [['expert', 0], ['hard', 1], ['medium', 2], ['easy', 3]];
  const used = new Set();
  const puzzles = [];
  for (const [difficulty, hints] of LEVELS) {
    const cands = rng.shuffle(built.filter(b => !used.has(b.text) && b.need <= hints));
    // easier levels get the longer sentences
    cands.sort((a, b) => (hints >= 2 ? b.text.length - a.text.length : a.text.length - b.text.length));
    for (const b of cands.slice(0, 30)) {
      used.add(b.text);
      const h = Object.assign({}, b.r.hints);
      const letters = Array.from(new Set(b.r.cipher.replace(/[^A-Z]/g, '').split(''))).filter(c => !h[c]);
      const inv = {};
      for (const [p, c] of Object.entries(b.r.key)) inv[c] = p;
      for (const c of rng.shuffle(letters).slice(0, hints - Object.keys(h).length)) h[c] = inv[c];
      const p = { type: 'cryptogram', variant: 'classic', difficulty, title: b.source === 'proverb' ? 'Proverb' : 'Saying', source: b.source, cipher: b.r.cipher, plain: b.r.plain, hints: h };
      const errors = cg.verifyCryptogram(p, lexicon);
      if (errors.length) { log('  discarded cryptogram:', errors.join('; ')); continue; }
      if (!fresh(p)) continue;
      puzzles.push(p);
    }
  }
  const order = { easy: 0, medium: 1, hard: 2, expert: 3 };
  puzzles.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  finishBook('cipher-room', 'cr', 'The Cipher Room: Cryptograms', puzzles);
}

/* ---------------- logic grids ---------------- */

const LT = require('./content/logic-themes');
const CB = require('./content/casebook');
const MIX = {
  easy: { same: 3, diff: 3, either: 1.2, less: 1 },
  medium: { same: 2, diff: 3, either: 2, neither: 1, less: 1.5, by: 0.8 },
  hard: { same: 1, diff: 3, either: 2, neither: 1.5, pair: 1, less: 2, by: 1.2 },
  expert: { same: 0.4, diff: 3, either: 2, neither: 1.5, pair: 2, alldiff: 0.8, less: 2, by: 1.5 },
  black: { diff: 3, either: 2.5, neither: 2, pair: 2.5, alldiff: 1, less: 2, by: 1.8 },
};
const NUMBER_WORDS = { 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six' };

function logicFromTheme(rng, theme, { n, k, mix, maxSame, titleIndex, difficulty, variant }) {
  // choose people and category items for this puzzle
  const catsChosen = [theme.cats.find(c => c.ordinal), ...rng.shuffle(theme.cats.filter(c => !c.ordinal))].filter(Boolean);
  const nonOrd = catsChosen.filter(c => !c.ordinal);
  const ord = catsChosen.find(c => c.ordinal);
  const useCats = (ord && k >= 3 ? [ord] : []).concat(nonOrd).slice(0, k - 1);
  // keep display order: non-ordinal categories first, ordinal last
  useCats.sort((a, b) => (a.ordinal ? 1 : 0) - (b.ordinal ? 1 : 0));
  const people = rng.sample(theme.people, n).sort();
  const cats = [LT.people(people)].concat(useCats.map(c => Object.assign({}, c, {
    items: c.ordinal ? c.items.slice(0, n) : rng.sample(c.items, n).sort(),
  })));
  cats.entityPlural = theme.entityPlural;
  cats.plural = !!theme.plural;
  const ordinal = cats.findIndex(c => c.ordinal);
  const spec = { n, k, ordinal };
  const res = logic.generate(rng, spec, { mix, maxSame });
  if (!res) return null;
  return packLogic(res, cats, spec, {
    title: theme.titles ? theme.titles[titleIndex % theme.titles.length] : theme.title,
    intro: theme.intro ? theme.intro.replace('{N}', NUMBER_WORDS[n]) : null,
    difficulty, variant,
  });
}

function packLogic(res, cats, spec, meta) {
  const p = {
    type: 'logic', variant: meta.variant, difficulty: meta.difficulty, title: meta.title,
    intro: meta.intro || undefined,
    categories: cats.map(c => ({ name: c.name, items: c.items.slice(), labels: c.items.map(content.itemLabel), ordinal: !!c.ordinal || undefined })),
    clues: res.clues.map(cl => logic.renderClue(cl, cats, spec.ordinal)),
    clueData: res.clues,
    solution: res.sol,
    ordinal: spec.ordinal,
  };
  return p;
}

function verifyLogicPuzzle(p) {
  const spec = { n: p.categories[0].items.length, k: p.categories.length, ordinal: p.ordinal };
  const errors = [];
  let r;
  try { r = logic.countSolutions(spec, p.clueData, 2, 2e7); } catch (e) { errors.push('count did not finish'); return errors; }
  if (r.count !== 1) errors.push('solutions: ' + r.count);
  else if (JSON.stringify(r.sols[0]) !== JSON.stringify(p.solution)) errors.push('solution mismatch');
  const d = logic.deduce(spec, p.clueData);
  if (!d.ok) errors.push('not solvable by deduction alone');
  for (const t of p.clues) for (const w of blocklist.flaggedWords(t)) errors.push('blocked word ' + w);
  return errors;
}

if (want('deduction-files')) {
  const rng = new RNG('deduction-files-v1');
  log('deduction-files');
  const plan = [
    ['easy', 4, 3, MIX.easy, undefined, 15],
    ['medium', 4, 4, MIX.medium, undefined, 15],
    ['hard', 5, 4, MIX.hard, 3, 15],
    ['expert', 5, 4, MIX.expert, 1, 15],
  ];
  const puzzles = [];
  let ti = 0;
  for (const [difficulty, n, k, mix, maxSame, count] of plan) {
    let made = 0, guard = 0;
    while (made < count && guard++ < count * 6) {
      const theme = LT.core[ti % LT.core.length];
      const p = logicFromTheme(rng, theme, { n, k, mix, maxSame, titleIndex: Math.floor(ti / LT.core.length), difficulty, variant: 'standard' });
      ti++;
      if (!p) continue;
      const errors = verifyLogicPuzzle(p);
      if (errors.length) { log('  discarded logic:', errors.join('; ')); continue; }
      if (!fresh(p)) continue;
      puzzles.push(p); made++;
    }
    log('  logic', difficulty, made);
  }
  finishBook('deduction-files', 'df', 'The Deduction Files: Logic Grids', puzzles);
}

function casePuzzle(rng, c, difficulty) {
  const n = c.people.length;
  const cats = [LT.people(c.people)].concat(c.cats.map(x => Object.assign({}, x)));
  cats.sort((a, b) => (a.name === 'Name' ? -1 : b.name === 'Name' ? 1 : (a.ordinal ? 1 : 0) - (b.ordinal ? 1 : 0)));
  cats.entityPlural = c.entityPlural;
  cats.plural = !!c.plural;
  const ordinal = cats.findIndex(x => x.ordinal);
  const spec = { n, k: cats.length, ordinal };
  for (let t = 0; t < 6; t++) {
    const res = logic.generate(rng, spec, { mix: n === 6 ? MIX.expert : MIX.hard, maxSame: n === 6 ? 1 : 2 });
    if (!res) continue;
    const p = packLogic(res, cats, spec, { title: c.title, difficulty, variant: 'casebook' });
    p.story = c.story;
    p.question = c.question;
    p.reveal = content.fillReveal(c.reveal, cats, res.sol);
    const errors = verifyLogicPuzzle(p);
    for (const para of c.story.concat([c.question, p.reveal])) for (const w of blocklist.flaggedWords(para)) errors.push('blocked word ' + w);
    if (errors.length) { log('  discarded case:', errors.join('; ')); continue; }
    if (!fresh(p)) continue;
    return p;
  }
  return null;
}

if (want('logic-casebook')) {
  const rng = new RNG('logic-casebook-v1');
  log('logic-casebook');
  const puzzles = [];
  for (const c of CB.five) { const p = casePuzzle(rng, c, 'hard'); if (p) puzzles.push(p); else log('  could not build case', c.title); }
  for (const c of CB.six) { const p = casePuzzle(rng, c, 'expert'); if (p) puzzles.push(p); else log('  could not build case', c.title); }
  finishBook('logic-casebook', 'lc', 'The Logic Casebook', puzzles);
}

/* ---------------- the black label collection ---------------- */

if (want('black-label')) {
  const rng = new RNG('black-label-v1');
  log('black-label');
  const puzzles = [];
  // expert variant sudoku: zero-given killers with bigger cages, and sparser grids for the rest
  puzzles.push(...titleSudoku(sudokuBatch(rng, { variant: 'killer', level: 4, cageWeights: killerBL }, 10)));
  puzzles.push(...titleSudoku(sudokuBatch(rng, { variant: 'jigsaw', level: 4, maxGivens: 19 }, 10)));
  puzzles.push(...titleSudoku(sudokuBatch(rng, { variant: 'diagonal', level: 4, symmetric: true, maxGivens: 21 }, 10)));
  puzzles.push(...titleSudoku(sudokuBatch(rng, { variant: 'evenodd', level: 4, symmetric: true, shadeMin: 8, shadeMax: 12, maxGivens: 23 }, 10)));
  // cryptograms without word breaks
  const S = require('./content/cryptogram-sentences');
  let made = 0;
  for (const text of S.unspaced) {
    if (made >= 25) break;
    const r = cg.build(rng, { text, unspaced: true, baseHints: 4, maxHints: 7, lex: lexicon });
    if (!r) { log('  no unique unspaced reading for:', text.slice(0, 40)); continue; }
    const p = { type: 'cryptogram', variant: 'unspaced', difficulty: 'expert', title: 'Unbroken Cipher', source: 'saying', cipher: r.cipher, plain: r.plain, hints: r.hints, text };
    const errors = cg.verifyCryptogram(p, lexicon);
    if (errors.length) { log('  discarded unspaced cryptogram:', errors.join('; ')); continue; }
    if (!fresh(p)) continue;
    puzzles.push(p); made++;
    log('  unspaced cryptogram', made, Object.keys(r.hints).length, 'starting letters');
  }
  // six-category logic grids
  let li = 0, lmade = 0;
  while (lmade < 20 && li < 80) {
    const theme = LT.sixCategory[li % LT.sixCategory.length];
    const p = logicFromTheme(rng, theme, { n: 5, k: 6, mix: MIX.black, maxSame: 0, titleIndex: Math.floor(li / LT.sixCategory.length), difficulty: 'expert', variant: 'six' });
    li++;
    if (!p) continue;
    const errors = verifyLogicPuzzle(p);
    if (errors.length) { log('  discarded six-category logic:', errors.join('; ')); continue; }
    if (!fresh(p)) continue;
    puzzles.push(p); lmade++;
  }
  log('  six-category logic', lmade);
  // themeless 15x15 crosswords with harder clues
  const usage = new Map();
  let xmade = 0;
  for (let i = 0; i < 40 && xmade < 15; i++) {
    const p = crossword(rng, 'themeless', null, usage, xwHardDict);
    if (!p) continue;
    p.title = 'Themeless No. ' + (xmade + 1);
    p.difficulty = 'expert';
    puzzles.push(p); xmade++;
  }
  log('  themeless crosswords', xmade);
  finishBook('black-label', 'bl', 'The Black Label Collection', puzzles);
}

/* ---------------- free sample (not part of any product) ---------------- */

if (want('sample')) {
  const rng = new RNG('free-sample-v1');
  const theme = { title: 'The Puzzle Page', entries: [
    ['PUZZLES', 'What fills the back page of a good newspaper'], ['ANSWERS', 'What every empty grid is waiting for'],
    ['SQUARES', 'Boxes on a crossword grid'], ['ERASERS', 'Pencil-top helpers for second thoughts'] ] };
  for (const [w] of theme.entries) xwWordSet.add(w);
  const p = crossword(rng, 'mini', theme, new Map());
  p.difficulty = 'easy';
  p.id = 'sample-001'; p.n = 1;
  write('sample', { id: 'sample', title: 'Free Sample', puzzles: [p] });
}

log('done');
