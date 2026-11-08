'use strict';
/*
 * Builds the finished static site into docs/ from src/ (CSS and JavaScript),
 * generated/ (puzzle data) and the page templates in build/pages/.
 * Run: node build/site.js   (after node build/generate.js)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { page, esc, SITE, LOGO } = require('./pages/layout');
const { bookStats } = require('./pages/stats');
const productPages = require('./pages/products');
const info = require('./pages/info');
const products = require('../src/js/products');
const SVG = require('../src/js/player/svg');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs');
const GEN = path.join(ROOT, 'generated');

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }
function write(rel, content) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b);
  }
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

/* ---------- data ---------- */
const books = {};
const stats = {};
for (const b of products.books) {
  const file = path.join(GEN, b.id + '.json');
  if (!fs.existsSync(file)) throw new Error('missing generated data for ' + b.id + '; run node build/generate.js');
  books[b.id] = JSON.parse(fs.readFileSync(file, 'utf8'));
  stats[b.id] = bookStats(books[b.id]);
}
const CS = require('./content/cryptogram-sentences');
const unspacedText = Object.fromEntries([...CS.proverbs, ...CS.sayings, ...CS.unspaced].map(t => [t.toUpperCase().replace(/[^A-Z]/g, ''), t]));
const sample = JSON.parse(fs.readFileSync(path.join(GEN, 'sample.json'), 'utf8'));

// Puzzle data shipped to the browser: the generator's internal clue records stay behind.
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
for (const [id, book] of Object.entries(books).concat([['sample', sample]])) {
  const slim = { id: book.id, title: book.title, puzzles: book.puzzles.map(p => {
    const q = Object.assign({}, p);
    delete q.clueData;
    if (q.type === 'cryptogram' && !q.text) q.text = unspacedText[q.plain.replace(/[^A-Z]/g, '')];
    if (q.type === 'crossword') { q.across = q.across.map(slimEntry); q.down = q.down.map(slimEntry); }
    return q;
  }) };
  write('data/' + id + '.json', JSON.stringify(slim));
}
function slimEntry(e) {
  const o = { n: e.n, r: e.r, c: e.c, len: e.len, answer: e.answer, clue: e.clue, enumeration: e.enumeration };
  if (e.theme) o.theme = true;
  if (e.display) o.display = e.display;
  return o;
}
const productCount = id => {
  const p = products.byId(id);
  return p.books.reduce((t, b) => t + stats[b].total, 0);
};

/* ---------- static assets ---------- */
copyDir(path.join(ROOT, 'src', 'css'), path.join(OUT, 'css'));
copyDir(path.join(ROOT, 'src', 'js'), path.join(OUT, 'js'));
write('.nojekyll', '');
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="3" fill="#f3efe4"/>
<rect x="2.5" y="2.5" width="27" height="27" fill="none" stroke="#141414" stroke-width="2"/>
<path d="M11.5 2.5v27M20.5 2.5v27M2.5 11.5h27M2.5 20.5h27" stroke="#141414" stroke-width="1.5"/>
<rect x="3.5" y="3.5" width="7" height="7" fill="#141414"/><rect x="21.5" y="21.5" width="7" height="7" fill="#141414"/><rect x="12.5" y="12.5" width="7" height="7" fill="#b0122b"/></svg>`);
write('og-image.png', ogImage());

/* ---------- pages ---------- */
const sitemap = [];
function emit(out, opts, inSitemap = true) {
  write(out, page(Object.assign({ out }, opts)));
  if (inSitemap && !opts.noindex) sitemap.push(out.replace(/index\.html$/, ''));
}

// home
emit('index.html', {
  title: 'Gridlock Puzzle Co. · Online puzzle books you unlock with a key',
  ogTitle: 'Gridlock Puzzle Co.',
  description: 'Sudoku, crosswords, cryptograms, logic grids and word searches in online puzzle books. Unlock with a key, play in your browser on any device, and print any puzzle.',
  body: homeBody(),
  scripts: ['js/license.js', 'js/player/svg.js', 'js/player/core.js', 'js/player/crossword.js', 'js/home.js'],
  current: 'books',
});

// products and thank-you pages
for (const p of products.products) {
  const pp = productPages.build(p, { books, stats, products });
  emit(`products/${p.id}/index.html`, { title: pp.title, description: pp.description, body: pp.body, ogType: 'product' });
  emit(`thank-you/${p.id}/index.html`, {
    title: 'Thank you · ' + p.name,
    description: 'Your Gridlock Puzzle Co. license key for ' + p.name + '.',
    body: thankYouBody(p),
    noindex: true,
    scripts: ['js/license.js', 'js/thank-you.js'],
  }, false);
}

emit('unlock/index.html', {
  title: 'Unlock your puzzles · Gridlock Puzzle Co.',
  description: 'Enter your Gridlock Puzzle Co. license key to open your puzzle books on this device. Keys work on any number of your devices.',
  body: unlockBody(), scripts: ['js/license.js', 'js/unlock.js'], current: 'unlock',
});
emit('library/index.html', {
  title: 'My library · Gridlock Puzzle Co.',
  description: 'Your unlocked Gridlock Puzzle Co. puzzle books on this device, with your saved keys and a sign-out option.',
  body: libraryBody(), scripts: ['js/license.js', 'js/library.js'], current: 'library',
});
emit('play/index.html', {
  title: 'Puzzle player · Gridlock Puzzle Co.',
  description: 'Play your unlocked Gridlock Puzzle Co. puzzle books in the browser.',
  body: '<div class="wrap" data-player><div class="player-head" data-player-head></div><div data-player-body></div></div>',
  scripts: ['js/license.js', 'js/player/svg.js', 'js/player/core.js', 'js/player/sudoku.js', 'js/player/crossword.js', 'js/player/wordsearch.js', 'js/player/cryptogram.js', 'js/player/logic.js', 'js/play.js'],
  noindex: true,
}, false);

for (const key of ['about', 'faq', 'contact', 'terms', 'privacy', 'refunds', 'delivery', 'disclaimer']) {
  const pg = info.pages[key]('../');
  emit(key + '/index.html', { title: pg.title, description: pg.description, body: pg.body, current: key === 'about' || key === 'faq' ? key : undefined });
}

// 404: served by GitHub Pages at any missing path, so it sets its own base first.
write('404.html', page({
  out: '404.html',
  base: `<script>(function(){var s=location.pathname.split('/'),b='/';if(/\\.github\\.io$/.test(location.hostname)&&s[1])b='/'+s[1]+'/';document.write('<base href="'+b+'">');})();</script>`,
  title: 'Page not found · Gridlock Puzzle Co.',
  description: 'This page does not exist. Find our puzzle books, your library or the unlock page from here.',
  noindex: true,
  body: `<div class="wrap section"><span class="kicker">Error 404</span>
<div class="hero-grid" aria-hidden="true" style="--size:clamp(40px,9vw,70px);grid-template-columns:repeat(4,var(--size));margin-bottom:28px">${'LOST'.split('').map(ch => `<span class="hc"><span class="ch">${ch}</span></span>`).join('')}</div>
<h1>This square is empty</h1><p class="lede">The page you were looking for is not here. It may have moved, or the link may have a typo.</p>
<p class="btn-row"><a class="btn red" href="index.html">Go to the home page</a><a class="btn ghost" href="library/">My library</a><a class="btn ghost" href="unlock/">Have a key?</a></p></div>`,
}));

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(u => `  <url><loc>${SITE.url}${u}</loc><lastmod>2026-11-08</lastmod></url>`).join('\n')}
</urlset>
`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}sitemap.xml\n`);
fs.writeFileSync(path.join(GEN, 'manifest.json'), JSON.stringify(Object.fromEntries(products.products.map(p => [p.id, productCount(p.id)])), null, 2));
console.log('site built:', sitemap.length, 'pages in sitemap');

/* ---------- page bodies ---------- */

function homeBody() {
  const tagline = [['P', 'U', 'Z', 'Z', 'L', 'E', 'S'], ['W', 'O', 'R', 'T', 'H', '#', '#'], ['T', 'H', 'E', '#', 'I', 'N', 'K']];
  const nums = { '0,0': 1, '1,0': 2, '2,0': 3, '2,4': 4 };
  let li = 0, bi = 0;
  const heroCells = tagline.map((row, r) => row.map((ch, c) => {
    if (ch === '#') return `<span class="hc b" style="--b:${bi++}"><span class="fill"></span></span>`;
    const red = r === 2 && c >= 4;
    return `<span class="hc${red ? ' red' : ''}">${nums[r + ',' + c] ? `<span class="num">${nums[r + ',' + c]}</span>` : ''}<span class="caret" style="--i:${li}"></span><span class="ch" style="--i:${li++}">${ch}</span></span>`;
  }).join('')).join('');

  const core = products.products.filter(p => p.tier === 'core');
  const expert = products.products.filter(p => p.tier === 'expert');
  const art = {
    'daily-grid': `<div class="anim-sudoku" aria-hidden="true">${[5, 0, 1, 0, 9, 0, 4, 0, 2].map((d, i) => d ? `<span class="given">${d}</span>` : `<span><i style="--d:${i}">${[0, 3, 0, 7, 0, 8, 0, 6, 0][i]}</i></span>`).join('')}</div>`,
    'hidden-lines': `<div class="anim-search" aria-hidden="true">${'QJMTRWBLOZAPKITESNIXNUFWDYHEVG'.split('').map(ch => `<b>${ch}</b>`).join('')}<span class="sweep"></span></div>`,
    'cipher-room': `<div class="anim-flap" aria-hidden="true">${['X', 'Q', 'F', 'H', 'Z'].map((c, i) => `<span class="flap" style="--d:${i}"><span class="front">${c}</span><span class="back">${'CLUES'[i]}</span></span>`).join('')}</div>`,
    'deduction-files': `<div class="anim-logic" aria-hidden="true">${['x', 'o', 'x', 'x', 'x', 'x', 'o', 'x', 'o', 'x', 'x', 'x', 'x', 'x', 'x', 'o'].map((m, i) => `<span><i class="${m}" style="--d:${i % 7}">${m === 'o' ? '●' : '×'}</i></span>`).join('')}</div>`,
    'ink-and-clue': `<div class="anim-xw" aria-hidden="true">${['b', 'b', 'S', 'b', 'b', 'C', 'L', 'U', 'E', 'S', 'b', 'b', 'N', 'b', 'b'].map((ch, i) => ch === 'b' ? '<span class="b"></span>' : (i >= 5 && i < 10 ? `<span><i style="--d:${i - 5}">${ch}</i></span>` : `<span>${ch}</span>`)).join('')}<span class="cursor"></span></div>`,
    'core-collection': `<div class="anim-stack" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<span class="${i === 2 ? 'r' : ''}" style="--d:${i};--h:${[10, 24, 4, 18, 12][i]}"></span>`).join('')}</div>`,
  };
  const sub = {
    'daily-grid': 'Classic sudoku from easy to expert.',
    'hidden-lines': 'Themed word searches in three sizes.',
    'cipher-room': 'Ciphers that decode into proverbs and sayings.',
    'deduction-files': 'Logic grids solved by deduction alone.',
    'ink-and-clue': 'Themed mini and midi crosswords.',
    'core-collection': 'All five Core Books, one key.',
  };
  const tile = p => `<a class="tile${p.id === 'core-collection' ? ' collection' : ''}" href="products/${p.id}/">${p.id === 'core-collection' ? '<span class="badge">All five books</span>' : ''}<span class="tile-shadow" aria-hidden="true"></span>
<div class="art">${art[p.id]}</div><h3>${esc(p.name)}</h3><p class="sub">${sub[p.id]}</p>
<div class="meta"><span class="price" data-price="${p.id}">$${p.price}</span><span class="count">${productCount(p.id)} puzzles</span></div></a>`;

  const eart = {
    'variant-sudoku': SVG.sudoku(books['variant-sudoku'].puzzles.find(p => p.variant === 'killer'), { label: 'Killer sudoku' }),
    'logic-casebook': SVG.logic(books['logic-casebook'].puzzles[0], { label: 'Casebook grid', cell: 11, labelWidth: 4, labelHeight: 4 }),
    'cartographers-crosswords': SVG.crossword(books['cartographers-crosswords'].puzzles[1], { label: '15 by 15 crossword' }),
    'black-label': SVG.sudoku(books['black-label'].puzzles.find(p => p.variant === 'jigsaw'), { label: 'Jigsaw sudoku' }),
  };
  const esub = {
    'variant-sudoku': 'Killer, Jigsaw, Diagonal and Even-Odd sudoku at hard and expert levels.',
    'logic-casebook': 'Original short mysteries with five-category grids.',
    'cartographers-crosswords': 'Full 15×15 crosswords themed on places, maps and travel.',
    'black-label': 'Our hardest puzzles in four types: expert variant sudoku, unbroken cryptograms, six-category logic grids and themeless 15×15 crosswords. None repeated from any other book.',
  };
  const etile = (p, featured) => featured
    ? `<a class="etile featured" href="products/${p.id}/"><div class="art">${eart[p.id]}</div><div class="copy"><span class="stamp foil">The flagship</span><h3>${esc(p.name)}</h3><p class="sub">${esub[p.id]}</p>
<div class="meta"><span class="price" data-price="${p.id}">$${p.price}</span><span class="count">${productCount(p.id)} puzzles</span></div></div></a>`
    : `<a class="etile" href="products/${p.id}/"><span class="stamp">Expert Edition</span><div class="art">${eart[p.id]}</div><h3>${esc(p.name)}</h3><p class="sub">${esub[p.id]}</p>
<div class="meta"><span class="price" data-price="${p.id}">$${p.price}</span><span class="count">${productCount(p.id)} puzzles</span></div></a>`;

  const faqItems = info.FAQ('').filter((_, i) => [0, 3, 5, 7].includes(i));
  return `<section class="hero">
  <div class="wrap hero-inner">
    <div>
      <h1 class="sr-only">Gridlock Puzzle Co.: puzzles worth the ink</h1>
      <div class="hero-grid" aria-hidden="true">${heroCells}</div>
    </div>
    <div>
      <span class="kicker">Online puzzle books</span>
      <p class="lede">Sudoku, crosswords, cryptograms, logic grids and word searches, built by hand and checked by machine. Unlock a book with a key, play it in your browser on any device, and print any page you like.</p>
      <p class="btn-row"><a class="btn red" href="#books">Browse the books</a><a class="btn ghost" href="#sample">Try a free puzzle</a></p>
      <div class="hero-meta"><span>No account</span><span>No app to install</span><span>14-day refunds</span></div>
    </div>
  </div>
</section>
<div class="wrap section tight">
  <div class="facts-strip">
    <div><h3>Checked, every one</h3><p>Every puzzle is verified by a solver before it goes in a book: one solution, no guessing.</p></div>
    <div><h3>Played in your browser</h3><p>On a computer, tablet or phone, with on-screen keypads, hints, checks and a timer you can hide.</p></div>
    <div><h3>Printable</h3><p>Every puzzle prints on a clean page, with a separate answer key.</p></div>
  </div>
</div>
<section class="section" id="sample" aria-labelledby="sample-title">
  <div class="wrap">
    <div class="section-head"><h2 id="sample-title">Try a free puzzle</h2><p class="label">Not part of any book</p></div>
    <p class="tier-intro">A 7×7 mini crossword in the blocked style our crosswords use. Click a square, type, and use Tab to move between clues.</p>
    <div data-sample><p class="label">Loading the sample…</p></div>
  </div>
</section>
<section class="section" id="books" aria-labelledby="core-title">
  <div class="wrap">
    <div class="section-head"><h2 id="core-title">Core Books</h2><p class="label">Five classics, easy to expert</p></div>
    <p class="tier-intro">The five classic puzzle types, each in its own book, each with a range of difficulty. Buy one, or get all five with the Core Collection.</p>
    <div class="tiles">${core.map(tile).join('')}</div>
  </div>
</section>
<section class="expert section" id="expert" aria-labelledby="expert-title">
  <div class="wrap">
    <div class="section-head"><h2 id="expert-title"><span class="foil">Expert Editions</span></h2><p class="label">Larger grids · added rules · fewer givens</p></div>
    <p class="tier-intro">Built to be harder in ways you can measure: cages and irregular regions, five- and six-category grids, full 15×15 crosswords and cryptograms without word breaks. Each page lists exactly what is different.</p>
    <div class="expert-tiles">${etile(expert.find(p => p.id === 'black-label'), true)}${expert.filter(p => p.id !== 'black-label').map(p => etile(p, false)).join('')}</div>
  </div>
</section>
<section class="section" aria-labelledby="how-title">
  <div class="wrap">
    <div class="section-head"><h2 id="how-title">How it works</h2></div>
    <ol class="steps">
      <li><h3>Buy a book</h3><p>Choose a book and pay at checkout. Prices are in US dollars, with any taxes shown before you pay.</p></li>
      <li><h3>Get your key</h3><p>Your license key appears on the confirmation page straight away. Copy it and keep it somewhere safe.</p></li>
      <li><h3>Unlock and play</h3><p>Enter the key on the <a href="unlock/">Unlock page</a>. Your books open in your library, on as many of your devices as you like.</p></li>
    </ol>
  </div>
</section>
<section class="section tight" aria-labelledby="faq-title">
  <div class="wrap">
    <div class="section-head"><h2 id="faq-title">Questions</h2><a class="btn ghost small" href="faq/">All questions</a></div>
    <div class="faq">${info.faqHtml('', faqItems)}</div>
  </div>
</section>`;
}

function thankYouBody(p) {
  const bookList = p.books.map(id => `<li>${esc(products.book(id).title)}</li>`).join('');
  return `<div class="wrap section" data-thank-you="${p.id}">
  <span class="kicker">Order confirmed</span>
  <h1>Thank you.</h1>
  <p class="lede">Your license key for <strong>${esc(p.name)}</strong> is ready.</p>
  <div class="keybox">
    <p class="label">Your license key</p>
    <div class="flapboard" aria-hidden="true"></div>
    <p class="key-plain" data-key-plain></p>
    <p class="sr-only" aria-live="polite" data-key-live></p>
    <div class="btn-row">
      <button type="button" class="btn" data-copy disabled>Copy key</button>
      <button type="button" class="btn ghost" data-save disabled>Save as a text file</button>
      <a class="btn red" data-open href="../../unlock/" aria-disabled="true">Open my puzzles</a>
    </div>
    <p class="muted" data-copied aria-live="polite"></p>
    <div class="save-note"><strong>Save your key now.</strong> Copy it into a password manager or a note, or save the text file. You will need it to open your puzzles on another device, or on this one after clearing your browser data.</div>
  </div>
  <section class="section tight">
    <h2>This key opens</h2>
    <ul class="thank-books">${bookList}</ul>
    <p>Enter the key on the <a href="../../unlock/">Unlock page</a> on each device you want to use. If you ever lose it, <a href="../../contact/">contact us through the Contact page</a> with your order number for a replacement.</p>
  </section>
  <noscript><p class="note">This page needs JavaScript turned on to create your key. Please turn it on and reload the page.</p></noscript>
</div>`;
}

function unlockBody() {
  const groups = [2, 5, 5, 4];
  let k = 0;
  const entry = groups.map(g => `<span class="key-group">${Array.from({ length: g }, () => {
    k++;
    return `<input type="text" inputmode="text" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Key character ${k} of 16">`;
  }).join('')}</span>`).join('<span class="sep" aria-hidden="true">-</span>');
  const burst = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return `<i style="--x:${Math.round(Math.cos(a) * 90)}px;--y:${Math.round(Math.sin(a) * 90)}px"></i>`;
  }).join('');
  return `<div class="wrap" data-unlock>
  <header class="page-head"><span class="kicker">Have a key?</span><h1>Unlock your puzzles</h1></header>
  <div class="unlock-stage">
    <div style="position:relative">
      <svg class="padlock" viewBox="0 0 120 140" aria-hidden="true">
        <path class="shackle" d="M34 64V42a26 26 0 0 1 52 0v22" fill="none" stroke="currentColor" stroke-width="10"/>
        <g class="body"><rect x="14" y="60" width="92" height="72" fill="currentColor"/>
        <rect x="52" y="84" width="16" height="26" fill="var(--paper)"/><rect x="56" y="100" width="8" height="18" fill="var(--paper)"/></g>
      </svg>
      <div class="burst" aria-hidden="true">${burst}</div>
    </div>
    <div>
      <form novalidate>
        <p class="note" data-pending-note hidden>The key from your order confirmation is filled in for you.</p>
        <p id="key-label" class="label">License key</p>
        <p class="muted">Type the characters after GRID. You can also paste your whole key into the first box.</p>
        <div class="key-entry" role="group" aria-labelledby="key-label"><span class="prefix" aria-hidden="true">GRID</span><span class="sep" aria-hidden="true">-</span>${entry}</div>
        <p class="key-error" role="alert"></p>
        <p class="btn-row"><button type="submit" class="btn red">Unlock</button><a class="btn ghost" href="../library/">My library</a></p>
      </form>
      <div class="unlock-result" aria-live="polite"></div>
    </div>
  </div>
  <section class="section tight">
    <div class="columns">
      <h2>Good to know</h2>
      <p>Your key is on the order confirmation page you saw after paying. Keys never contain 0, O, 1, I or L, so there are no look-alike characters.</p>
      <p>One key works on any number of your own devices; just enter it again on each one. Unlocked books stay open on this device until you sign out from your library.</p>
      <p>Lost your key? <a href="../contact/">Contact us through the Contact page</a> with your order number and we will send a replacement.</p>
    </div>
  </section>
</div>`;
}

function libraryBody() {
  return `<div class="wrap" data-library>
  <header class="page-head"><span class="kicker">On this device</span><h1>My library</h1></header>
  <p data-library-status aria-live="polite" class="muted"></p>
  <div data-shelf></div>
  <section class="section tight" aria-labelledby="keys-title">
    <div class="section-head"><h2 id="keys-title">Saved keys</h2><a class="btn ghost small" href="../unlock/">Add another key</a></div>
    <div data-keys></div>
    <p style="margin-top:20px"><button type="button" class="btn ghost" data-signout hidden>Sign out on this device</button></p>
    <p class="muted">Signing out removes your keys from this browser. Your puzzle progress stays on this device, and you can unlock again at any time with your key.</p>
  </section>
</div>`;
}

/* ---------- Open Graph image: the wordmark drawn in crossword squares ---------- */
function ogImage() {
  const W = 1200, H = 630;
  const px = Buffer.alloc(W * H * 3);
  const paper = [243, 239, 228], ink = [20, 20, 20], red = [176, 18, 43], line = [222, 216, 202];
  const fill = (x0, y0, w, h, c) => {
    for (let y = Math.max(0, y0); y < Math.min(H, y0 + h); y++) for (let x = Math.max(0, x0); x < Math.min(W, x0 + w); x++) {
      const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
    }
  };
  fill(0, 0, W, H, paper);
  for (let x = 0; x < W; x += 30) fill(x, 0, 1, H, line);
  for (let y = 0; y < H; y += 30) fill(0, y, W, 1, line);
  const font = {
    G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
    C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
    P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'], U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
    Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'], ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  };
  const word = (text, x0, y0, s, gap, color) => {
    let x = x0;
    for (const ch of text) {
      const g = font[ch];
      g.forEach((row, r) => row.split('').forEach((b, c) => { if (b === '1') fill(x + c * s + gap, y0 + r * s + gap, s - gap * 2, s - gap * 2, color); }));
      x += 6 * s;
    }
  };
  word('GRIDLOCK', 72, 150, 22, 2, ink);
  word('PUZZLE CO.', 74, 400, 12, 1, ink);
  // a crossword block with one cherry square
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = 940 + c * 46, y = 380 + r * 46;
    fill(x, y, 46, 46, ink);
    const black = (r === 0 && c === 3) || (r === 3 && c === 0) || (r === 1 && c === 1);
    if (!black) fill(x + 3, y + 3, 40, 40, (r === 2 && c === 2) ? red : paper);
  }
  fill(72, 330, 1056, 4, ink);
  // encode PNG
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
