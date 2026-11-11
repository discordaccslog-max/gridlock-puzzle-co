'use strict';
// Product pages. Every number shown comes from the generated puzzle data (see stats.js).
const { esc } = require('./layout');
const SVG = require('../../src/js/player/svg');

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const VAR = { classic: 'Classic', killer: 'Killer', jigsaw: 'Jigsaw', diagonal: 'Diagonal', evenodd: 'Even-Odd' };
const fmt = x => (Number.isInteger(x) ? String(x) : x.toFixed(1));

function table(head, rows, foot) {
  return `<div class="table-scroll"><table class="contents-table"><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i && /^[\d.]+$/.test(String(c)) ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody>
${foot ? `<tfoot><tr>${foot.map((c, i) => `<td${i && /^[\d.]+$/.test(String(c)) ? ' class="num"' : ''}>${c}</td>`).join('')}</tr></tfoot>` : ''}</table></div>`;
}

function figure(svg, caption) { return `<figure class="preview">${svg}<figcaption>${esc(caption)}</figcaption></figure>`; }

function first(book, fn) { return book.puzzles.find(fn); }

const PLAYER = `<ul>
<li>Play in your browser: tap or click a square, then type, or use the on-screen keypad or letter keyboard so your phone’s keyboard never covers the grid.</li>
<li>Full keyboard support with arrow keys, Tab and Backspace.</li>
<li>Check a single entry or the whole puzzle, take a hint, or reveal the solution.</li>
<li>An optional timer you can hide, and pencil marks for sudoku.</li>
<li>Progress saves automatically on your device, with a reset button on every puzzle.</li>
<li>Print any puzzle on a clean page, and print its answer key separately.</li>
<li>Filter your library by type, variant, difficulty and solved status.</li>
</ul>`;

const NEEDS = `<p>A modern web browser on a computer, tablet or phone. There is nothing to install and no account to create. Puzzles load from the web, so you need a connection to open them; your progress is stored in that browser.</p>`;

function buyBox(p, dark) {
  return `<aside class="buy-box" aria-label="Price and purchase">
<p class="label">${p.tier === 'expert' ? 'Expert Edition' : 'Core Books'}</p>
<p class="price"><span data-price="${p.id}">$${p.price}</span><small>USD</small></p>
<div class="buy-area" data-buy="${p.id}" data-root="../../"></div>
<p class="terms">Instant access with a license key · <a href="../../refunds/">14-day refund policy</a> · Applicable taxes are shown at checkout.</p>
</aside>`;
}

function howBuying() {
  return `<ol class="steps">
<li><h3>Buy</h3><p>Pay securely at checkout. Prices are in US dollars, and any applicable taxes are shown before you pay.</p></li>
<li><h3>Get your key</h3><p>Your license key appears on the confirmation page straight away. Copy it and keep it safe.</p></li>
<li><h3>Unlock and play</h3><p>Enter the key on the <a href="../../unlock/">Unlock page</a> and your book opens in your library, on any of your devices.</p></li>
</ol>`;
}

/* ---------- per-product content ---------- */

function dailyGrid(book, s) {
  const st = s.sudoku.classic;
  const rows = ['easy', 'medium', 'hard', 'expert'].map(d => [cap(d), s.byDifficulty[d] || 0, st.avgGivensBy[d], {
    easy: 'Naked and hidden singles only', medium: 'Adds locked candidates and naked pairs',
    hard: 'Adds hidden pairs and triples, naked triples and X-Wing', expert: 'Adds Swordfish, XY-Wing, XYZ-Wing, quads or a short forcing chain',
  }[d]]);
  return {
    lede: `${s.total} classic 9×9 sudoku, each with exactly one solution and rated by the solving techniques it needs.`,
    facts: [['Puzzles', s.total], ['Type', 'Classic sudoku'], ['Levels', 'Easy to expert'], ['Starting digits', `${st.minGivens}–${st.maxGivens}`]],
    inside: `<p>Every grid follows the classic rule: each row, column and 3×3 box holds the digits 1 to 9 once. The starting digits are placed symmetrically, and each puzzle was checked by a solver to have exactly one solution. Difficulty is not a guess: it is the hardest technique a step-by-step solver needed to finish the grid.</p>` +
      table(['Level', 'Puzzles', 'Average starting digits', 'Techniques needed'], rows, ['Total', s.total, fmt(st.avgGivens), '']),
    previews: [
      figure(SVG.sudoku(first(book, p => p.difficulty === 'easy'), { label: 'Easy sudoku preview' }), 'An easy grid from the book'),
      figure(SVG.sudoku(first(book, p => p.difficulty === 'expert'), { label: 'Expert sudoku preview' }), 'An expert grid from the book'),
    ],
  };
}

function hiddenLines(book, s) {
  const w = s.wordsearch;
  const rows = [['Easy', w.easy.count, `${w.easy.size}×${w.easy.size}`, fmt(w.easy.avgWords), 'Across, down and diagonally down to the right'],
    ['Medium', w.medium.count, `${w.medium.size}×${w.medium.size}`, fmt(w.medium.avgWords), 'All eight directions, including backwards'],
    ['Hard', w.hard.count, `${w.hard.size}×${w.hard.size}`, fmt(w.hard.avgWords), 'All eight directions, with the theme’s own letters as decoys']];
  return {
    lede: `${s.total} themed word searches, from orchard fruits to orchestra pits, with ${s.totalWords} words to find.`,
    facts: [['Puzzles', s.total], ['Words to find', s.totalWords], ['Levels', 'Easy, medium, hard'], ['Grid sizes', `${w.easy.size}×${w.easy.size} to ${w.hard.size}×${w.hard.size}`]],
    inside: `<p>Each puzzle has its own theme and its own word list, written for this book. Every listed word is hidden exactly once, a check the builder runs on every finished grid, so you never find a word twice or chase one that is not there.</p>` +
      table(['Level', 'Puzzles', 'Grid', 'Average words', 'Directions'], rows, ['Total', s.total, '', '', '']),
    previews: [figure(SVG.wordsearch(first(book, p => p.difficulty === 'hard'), { label: 'Word search preview' }), 'A hard grid from the book')],
  };
}

function cipherRoom(book, s) {
  const c = s.cryptogram;
  const rows = [['Easy', c.byDifficulty.easy || 0, '3', 'Longer sentences with three letters given'],
    ['Medium', c.byDifficulty.medium || 0, '2', 'Two letters given'],
    ['Hard', c.byDifficulty.hard || 0, '1', 'One letter given'],
    ['Expert', c.byDifficulty.expert || 0, '0', 'Solved from scratch']];
  return {
    lede: `${s.total} substitution ciphers that decode into traditional proverbs and original sayings.`,
    facts: [['Puzzles', s.total], ['Proverbs', c.proverbs], ['Original sayings', c.sayings], ['Average length', fmt(c.avgLetters) + ' letters']],
    inside: `<p>Each cryptogram is a sentence in which every letter has been swapped for another; no letter ever stands for itself. The texts are traditional proverbs and sayings written for this book, never attributed quotations. Before a puzzle was accepted, a solver searched our whole vocabulary for any other readable decoding, and starting letters were added only where needed so that each puzzle has exactly one answer.</p>` +
      table(['Level', 'Puzzles', 'Starting letters', 'Notes'], rows, ['Total', s.total, '', '']),
    previews: [figure(SVG.cryptogram(first(book, p => p.difficulty === 'medium'), { label: 'Cryptogram preview', maxLines: 3 }), 'A medium cryptogram from the book')],
  };
}

function deductionFiles(book, s) {
  const L = s.logic;
  const sizes = d => Object.keys(L[d].sizes).map(k => k.replace('×', ' categories × ') + ' items').join(', ');
  const rows = ['easy', 'medium', 'hard', 'expert'].map(d => [cap(d), L[d].count, sizes(d), fmt(L[d].avgClues)]);
  return {
    lede: `${s.total} logic grid puzzles, from small three-category warm-ups to four-category grids with five items each.`,
    facts: [['Puzzles', s.total], ['Largest grid', `${s.logicAll.maxCategories} categories × ${s.logicAll.maxItems}`], ['Levels', 'Easy to expert'], ['Guessing needed', 'None']],
    inside: `<p>Each puzzle sets a small scene, such as a street potluck, a kite festival or a quilting bee, and gives a set of clues. Mark the grid with × and ● until every match is found. Every puzzle was checked by an exhaustive solver to have exactly one solution, and by a second solver to make sure it can be finished by deduction alone. Harder levels use fewer direct clues and more comparisons such as “arrived exactly 30 minutes before”.</p>` +
      table(['Level', 'Puzzles', 'Grid size', 'Average clues'], rows, ['Total', s.total, '', '']),
    previews: [figure(SVG.logic(first(book, p => p.difficulty === 'medium'), { label: 'Logic grid preview' }), 'A medium grid from the book')],
  };
}

function inkAndClue(book, s) {
  const x = s.crossword;
  const rows = [['Mini', x.mini.count, `${x.mini.size}×${x.mini.size}`, fmt(x.mini.avgEntries), 'Easy'],
    ['Midi', x.midi.count, `${x.midi.size}×${x.midi.size}`, fmt(x.midi.avgEntries), 'Medium']];
  return {
    lede: `${s.total} themed crosswords in mini and midi sizes, every clue written for this book.`,
    facts: [['Puzzles', s.total], ['Clues', x.mini.totalEntries + x.midi.totalEntries], ['Theme entries', x.mini.themeEntries + x.midi.themeEntries], ['Sizes', `${x.mini.size}×${x.mini.size} and ${x.midi.size}×${x.midi.size}`]],
    inside: `<p>Each crossword has a theme, such as the bakery, the toolbox or a snow day, and its theme entries are marked with a ★. The grids are in the blocked style used by quick crosswords in Britain, Ireland and Australia: alternate squares are shared between an across and a down answer, every grid has rotational symmetry, and every answer is a real word or common phrase. The length of each answer is shown after its clue.</p>` +
      table(['Size', 'Puzzles', 'Grid', 'Average clues', 'Level'], rows, ['Total', s.total, '', '', '']),
    previews: [
      figure(SVG.crossword(first(book, p => p.variant === 'mini'), { label: 'Mini crossword preview' }), 'A 7×7 mini from the book'),
      figure(SVG.crossword(first(book, p => p.variant === 'midi'), { label: 'Midi crossword preview' }), 'An 11×11 midi from the book'),
    ],
  };
}

function coreCollection(books, stats, products) {
  const ids = ['daily-grid', 'hidden-lines', 'cipher-room', 'deduction-files', 'ink-and-clue'];
  const total = ids.reduce((t, id) => t + stats[id].total, 0);
  const rows = ids.map(id => [`<a href="../${id}/">${esc(products.byId(id).name)}</a>`, stats[id].total]);
  return {
    lede: `All five Core Books in one library, ${total} puzzles in total, unlocked by a single key.`,
    facts: [['Puzzles', total], ['Books', 5], ['Keys needed', 1], ['Puzzle types', 5]],
    inside: `<p>The Core Collection is the complete set of Core Books. One license key opens all five on your library shelf, and each book works exactly as it does on its own.</p>` +
      table(['Book', 'Puzzles'], rows, ['Total', total]),
    previews: [
      figure(SVG.sudoku(first(books['daily-grid'], p => p.difficulty === 'medium'), { label: 'Sudoku preview' }), 'From The Daily Grid'),
      figure(SVG.crossword(first(books['ink-and-clue'], p => p.variant === 'mini'), { label: 'Crossword preview' }), 'From Ink & Clue'),
    ],
  };
}

function variantSudoku(book, s, base) {
  const v = s.sudoku;
  const rows = ['killer', 'jigsaw', 'diagonal', 'evenodd'].map(k => [VAR[k], v[k].byDifficulty.hard || 0, v[k].byDifficulty.expert || 0, fmt(v[k].avgGivens)]);
  const dgExpert = base.sudoku.classic.avgGivensBy.expert;
  return {
    lede: `${s.total} hard and expert sudoku across four variants that each add a rule to the classic grid.`,
    facts: [['Puzzles', s.total], ['Variants', 4], ['Levels', 'Hard and expert'], ['Killer starting digits', v.killer.maxGivens]],
    inside: `<p>Every puzzle uses the classic rules plus one more: <strong>Killer</strong> cages with target sums, <strong>Jigsaw</strong> irregular regions, <strong>Diagonal</strong> grids where both long diagonals also hold 1 to 9, and <strong>Even-Odd</strong> grids where shaded cells take even digits only. Each was checked by a solver to have exactly one solution under its variant’s rules.</p>` +
      table(['Variant', 'Hard', 'Expert', 'Average starting digits'], rows, ['Total', Object.values(v).reduce((t, x) => t + (x.byDifficulty.hard || 0), 0), Object.values(v).reduce((t, x) => t + (x.byDifficulty.expert || 0), 0), '']),
    harder: [
      ['Added rules', '4', 'Every grid adds cages, irregular regions, diagonals or parity shading to the classic rules.'],
      ['No easy levels', '0', 'There are no easy or medium puzzles here; every grid needs hard or expert techniques.'],
      ['Empty killer grids', String(v.killer.maxGivens), `Killer puzzles start with ${v.killer.maxGivens === 0 ? 'no digits at all' : 'at most ' + v.killer.maxGivens + ' digits'}; you work only from ${fmt(v.killer.avgCages)} cages per grid.`],
      ['Fewer starting digits', fmt(v.jigsaw.avgGivens), `Jigsaw grids start with ${fmt(v.jigsaw.avgGivens)} digits on average, against ${fmt(dgExpert)} in The Daily Grid’s expert puzzles.`],
    ],
    previews: ['killer', 'jigsaw', 'diagonal', 'evenodd'].map(k => figure(SVG.sudoku(first(book, p => p.variant === k && p.difficulty === 'expert'), { label: VAR[k] + ' sudoku preview' }), `An expert ${VAR[k]} grid from the book`)),
  };
}

function logicCasebook(book, s, base) {
  const L = s.logicAll, B = base.logicAll;
  const rows = Object.keys(L.sizes).map(k => [k + ' items', L.sizes[k]]);
  const story = book.puzzles[0];
  return {
    lede: `${s.total} extended deduction cases, each built around an original short mystery and a larger, multi-category grid.`,
    facts: [['Cases', s.total], ['Categories per case', L.maxCategories], ['Largest grid', L.maxCells + ' squares'], ['Original stories', L.stories]],
    inside: `<p>Each case opens with a short, lighthearted story: a misplaced heirloom, a mixed-up delivery, a scrambled seating plan. The story sets the scene and asks a question; the clues do the rest. When you finish, the case closes with a short epilogue drawn from your solution. Every case was checked by an exhaustive solver to have exactly one solution and can be finished by deduction alone.</p>` +
      table(['Grid', 'Cases'], rows, ['Total', s.total]) +
      `<p class="muted">From the first case, “${esc(story.title)}”: ${esc(story.story[0])}</p>`,
    harder: [
      ['Categories', String(L.maxCategories), `Every case has ${L.maxCategories} categories to match, against at most ${B.maxCategories} in The Deduction Files.`],
      ['Grid squares', String(L.maxCells), `The largest casebook grid has ${L.maxCells} squares to mark; the largest Deduction Files grid has ${B.maxCells}.`],
      ['Clues per case', fmt(L.avgClues), `An average of ${fmt(L.avgClues)} clues per case, against ${fmt(B.avgClues)} in The Deduction Files.`],
      ['Direct links', fmt(L.directLinks), `Only ${fmt(L.directLinks)} clues per case state a match outright; the rest are negatives, either-ors and comparisons.`],
    ],
    previews: [figure(SVG.logic(book.puzzles.find(p => p.categories[0].items.length === 6) || story, { label: 'Casebook grid preview', cell: 15 }), 'A six-item casebook grid')],
  };
}

function cartographers(book, s, base) {
  const x = s.crossword.full, ic = base.crossword;
  return {
    lede: `${s.total} full-size 15×15 crosswords, each built around an original theme drawn from places, maps and travel.`,
    facts: [['Puzzles', s.total], ['Grid', '15×15'], ['Clues', x.totalEntries], ['Theme entries', x.themeEntries]],
    inside: `<p>Rivers of the world, mountain ranges, harbor life, old trade routes, polar expeditions: every puzzle has a theme from the map, with theme entries marked ★ and placed in the longest answers in the grid. Like all our crosswords, these use the blocked style, with rotational symmetry, real words and phrases only, and original clues throughout.</p>` +
      table(['Puzzles', 'Grid', 'Average clues', 'Longest answer'], [[x.count, '15×15', fmt(x.avgEntries), x.longest + ' letters']]),
    harder: [
      ['Grid size', '15×15', `Full-size grids, against ${ic.mini.size}×${ic.mini.size} and ${ic.midi.size}×${ic.midi.size} in Ink & Clue.`],
      ['Clues per puzzle', fmt(x.avgEntries), `An average of ${fmt(x.avgEntries)} clues, against ${fmt(ic.midi.avgEntries)} in an Ink & Clue midi.`],
      ['Theme answers', fmt(x.avgLongTheme), `Theme answers average ${fmt(x.avgLongTheme)} letters, many of them two- and three-word place names.`],
      ['Longest answer', String(x.longest), `Answers run up to ${x.longest} letters, the full width of the grid.`],
    ],
    previews: [figure(SVG.crossword(book.puzzles[0], { label: '15 by 15 crossword preview' }), `“${book.puzzles[0].title}” from the book`)],
  };
}

function blackLabel(book, s, base) {
  const v = s.sudoku, vs = base.vs.sudoku;
  const types = s.byType;
  const ws = s.crossword.themeless;
  const cg = s.cryptogram;
  const lg = s.logicAll;
  const rows = [
    ['Expert variant sudoku', types.sudoku, 'Killer, Jigsaw, Diagonal and Even-Odd at expert level only'],
    ['Cryptograms with no word breaks', types.cryptogram, 'Spaces and punctuation removed'],
    ['Six-category logic grids', types.logic, `${lg.maxCategories} categories × ${lg.maxItems} items, no direct-link clues`],
    ['Themeless 15×15 crosswords', types.crossword, 'Harder, more oblique clues throughout'],
  ];
  const sampleClues = book.puzzles.find(p => p.type === 'crossword').across.concat(book.puzzles.find(p => p.type === 'crossword').down)
    .slice().sort((a, b) => b.clue.length - a.clue.length).slice(0, 3).map(e => `“${esc(e.clue)}” ${esc(e.enumeration)}`).join(', ');
  return {
    lede: `${s.total} new puzzles at the highest difficulty in our catalog, none repeated from any other book.`,
    facts: [['Puzzles', s.total], ['Puzzle types', 4], ['Level', 'Expert only'], ['Repeated puzzles', 'None']],
    inside: `<p>The Black Label Collection gathers the hardest puzzles we make, in four types, all rated expert and all newly built for this collection. A catalog-wide check confirms that no puzzle in it appears in any other book.</p>` +
      table(['Section', 'Puzzles', 'What makes it hard'], rows, ['Total', s.total, '']),
    harder: [
      ['Killer starting digits', String(v.killer.maxGivens), `Killer grids start with no digits and every one is rated expert; their cages average ${fmt(v.killer.avgCageSize)} squares, against ${fmt(vs.killer.avgCageSize)} in Variant Sudoku.`],
      ['Fewer givens', fmt(v.diagonal.avgGivens), `Diagonal grids start with ${fmt(v.diagonal.avgGivens)} digits on average (Variant Sudoku experts: ${fmt(vs.diagonal.avgGivensBy.expert)}); Jigsaw ${fmt(v.jigsaw.avgGivens)} (vs ${fmt(vs.jigsaw.avgGivensBy.expert)}); Even-Odd ${fmt(v.evenodd.avgGivens)} with ${fmt(v.evenodd.avgShaded)} shaded cells (vs ${fmt(vs.evenodd.avgGivensBy.expert)} with ${fmt(vs.evenodd.avgShaded)}).`],
      ['No word breaks', String(cg.unspaced), `All ${cg.unspaced} cryptograms run as one unbroken line of about ${Math.round(cg.avgLetters)} letters, so you find the words as well as the letters. Each starts with ${fmt(cg.avgHints)} letters on average, and each has exactly one readable answer.`],
      ['Six categories', String(lg.maxCategories), `Logic grids with ${lg.maxCategories} categories and ${lg.maxCells} squares, and no clue that states a match outright.`],
      ['Harder clues', String(ws.count), `Themeless 15×15 grids with ${fmt(ws.avgEntries)} clues each, written to misdirect, for example ${sampleClues}.`],
    ],
    previews: [
      figure(SVG.sudoku(first(book, p => p.variant === 'killer'), { label: 'Killer sudoku preview' }), 'A Killer grid: no starting digits'),
      figure(SVG.crossword(first(book, p => p.type === 'crossword'), { label: 'Themeless crossword preview' }), 'A themeless 15×15'),
      figure(SVG.cryptogram(first(book, p => p.type === 'cryptogram'), { label: 'Unbroken cryptogram preview', maxLines: 3 }), 'An unbroken cryptogram'),
      figure(SVG.logic(first(book, p => p.type === 'logic'), { label: 'Six-category logic grid preview', cell: 12, labelWidth: 108, labelHeight: 108 }), 'A six-category grid'),
    ],
  };
}

function build(product, ctx) {
  const { books, stats, products } = ctx;
  const id = product.id;
  let c;
  if (id === 'daily-grid') c = dailyGrid(books[id], stats[id]);
  else if (id === 'hidden-lines') c = hiddenLines(books[id], stats[id]);
  else if (id === 'cipher-room') c = cipherRoom(books[id], stats[id]);
  else if (id === 'deduction-files') c = deductionFiles(books[id], stats[id]);
  else if (id === 'ink-and-clue') c = inkAndClue(books[id], stats[id]);
  else if (id === 'core-collection') c = coreCollection(books, stats, products);
  else if (id === 'variant-sudoku') c = variantSudoku(books[id], stats[id], stats['daily-grid']);
  else if (id === 'logic-casebook') c = logicCasebook(books[id], stats[id], stats['deduction-files']);
  else if (id === 'cartographers-crosswords') c = cartographers(books[id], stats[id], stats['ink-and-clue']);
  else if (id === 'black-label') c = blackLabel(books[id], stats[id], { vs: stats['variant-sudoku'] });
  const expert = product.tier === 'expert';
  const others = products.products.filter(p => p.id !== id && p.tier === product.tier);
  const body = `<div class="${expert ? 'expert product-dark' : ''}">
<div class="wrap">
  <div class="product-hero">
    <div>
      <p class="tier-tag${expert ? ' foil-tag' : ''}">${expert ? 'Expert Edition' : 'Core Books'}</p>
      <h1>${esc(product.name)}</h1>
      <p class="lede">${c.lede}</p>
      <dl class="facts">${c.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </div>
    ${buyBox(product, expert)}
  </div>
  ${c.harder ? `<section class="section tight" aria-labelledby="harder"><div class="section-head"><h2 id="harder">What makes it ${id === 'cartographers-crosswords' ? 'bigger' : 'harder'}</h2></div>
  <div class="harder">${c.harder.map(([k, big, text]) => `<div><p class="label">${k}</p><p class="big foil">${big}</p><p>${text}</p></div>`).join('')}</div></section>` : ''}
</div>
</div>
<div class="wrap">
  <section class="section tight" aria-labelledby="inside"><div class="section-head"><h2 id="inside">What’s inside</h2><p class="label">${c.facts[0][1]} ${id === 'logic-casebook' ? 'cases' : 'puzzles'}</p></div>
  ${c.inside}</section>
  <section class="section tight" aria-labelledby="previews"><div class="section-head"><h2 id="previews">A look at the grids</h2></div>
  <div class="previews">${c.previews.join('')}</div></section>
  <section class="section tight" aria-labelledby="player"><div class="section-head"><h2 id="player">How the online player works</h2></div>
  <div class="columns">${PLAYER}</div></section>
  <section class="section tight" aria-labelledby="needs"><div class="section-head"><h2 id="needs">What you need</h2></div>${NEEDS}</section>
  <section class="section tight" aria-labelledby="buying"><div class="section-head"><h2 id="buying">Buying and access</h2></div>${howBuying()}
  <p style="margin-top:24px">Changed your mind? Every purchase can be refunded in full within 14 days; see the <a href="../../refunds/">Refund Policy</a>. Questions? Read the <a href="../../faq/">FAQ</a>.</p></section>
  <section class="section tight" aria-labelledby="more"><div class="section-head"><h2 id="more">More ${expert ? 'Expert Editions' : 'Core Books'}</h2></div>
  <ul class="btn-row" style="list-style:none;padding:0">${others.map(o => `<li><a class="btn ghost small" href="../${o.id}/">${esc(o.shortName)} · $${o.price}</a></li>`).join('')}</ul></section>
</div>`;
  return {
    title: product.name + ' · Gridlock Puzzle Co.',
    description: c.lede + ' $' + product.price + ', instant access with a license key.',
    body,
    lede: c.lede,
  };
}

module.exports = { build };
