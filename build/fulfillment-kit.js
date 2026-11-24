'use strict';
/*
 * Builds the fulfillment evidence kit for payment processor reviews.
 *   npm install                          (once: installs playwright-core)
 *   npx playwright-core install ffmpeg   (once: the video encoder Playwright uses)
 *   npm run kit                          (or: node build/fulfillment-kit.js [site-url])
 *
 * Needs STRIPE_SECRET_KEY and LICENSE_SECRET with the same values as the live site (from the
 * environment or .env.local), and a completed order for each product to show, placed through
 * the live site's payment links. Stripe test mode works while the live site uses test links.
 *
 * For each product with an order, walks the purchase-to-delivery flow on the live site in
 * Microsoft Edge (set KIT_CHANNEL=chrome to use Chrome), using that real order for the
 * confirmation step, then reads the delivery records back from the Stripe payment. Writes
 * everything to fulfillment-kit/ (or KIT_OUT): screenshots of each step, one screen recording,
 * the saved confirmation PDFs, verified reviewer keys, a pasteable business and fulfillment
 * summary, and Fulfillment-Overview.pdf. fulfillment-kit/ is in .gitignore and .vercelignore,
 * so it is never committed or published.
 *
 * The payment step happens on Stripe's site and is described in writing only. The kit's own
 * visits to the confirmation pages and its unlocks are recorded on the orders it uses.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) {
  console.error('playwright-core is not installed. Run: npm install');
  process.exit(1);
}
require('./env');
const { SITE } = require('./pages/layout.js');
const L = require('../api/_license');
const S = require('../api/_stripe');
const { issue, catalog } = require('./issue-key.js');
const config = require('../src/js/site-config.js');

const BASE = (process.argv[2] || process.env.KIT_BASE || SITE.url).replace(/\/?$/, '/');
const CHANNEL = process.env.KIT_CHANNEL || 'msedge';
const ROOT = path.join(__dirname, '..');
const OUT = process.env.KIT_OUT ? path.resolve(process.env.KIT_OUT) : path.join(ROOT, 'fulfillment-kit');
const SHOTS = path.join(OUT, 'screenshots');
const PDFIMG = path.join(OUT, '.pdf-images');
const VIEW = { width: 1280, height: 800 };
const VIDEO_PRODUCT = 'core-collection';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

const products = catalog.products;
const bookTitle = id => catalog.book(id).title;
const rel = f => path.relative(OUT, f).split(path.sep).join('/');
const today = new Date();
const dateLong = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const supportEmail = (config.supportEmail || '').trim();
const priceRange = '$' + Math.min(...products.map(p => p.price)) + ' to $' + Math.max(...products.map(p => p.price));
const url = p => BASE + p;
const plainName = p => p.name.replace(/’/g, "'");
const RECORD_FIELDS = [
  ['gridlock_key', 'License key'], ['gridlock_product', 'Product'],
  ['gridlock_delivered_at', 'Key first shown'], ['gridlock_delivered_ip', 'Shown to IP address'], ['gridlock_delivered_agent', 'Browser'],
  ['gridlock_views', 'Times shown'], ['gridlock_last_view_at', 'Last shown'],
  ['gridlock_unlocked_at', 'First unlocked'], ['gridlock_unlocked_ip', 'Unlocked from IP address'], ['gridlock_unlocked_agent', 'Browser'],
  ['gridlock_unlocks', 'Times unlocked'], ['gridlock_last_unlock_at', 'Last unlocked'],
];

/* ------------------------------------------------------------------ helpers */

async function liveCatalog() {
  const res = await fetch(url('js/products.js'), { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load ' + url('js/products.js') + ' (' + res.status + ')');
  const ctx = vm.createContext({});
  vm.runInContext(await res.text(), ctx);
  return ctx.GRIDLOCK_PRODUCTS;
}

// The newest paid order for each product, found through the live site's payment links.
async function findOrders(liveCat) {
  const links = [];
  for (let after; ;) {
    const page = await S.stripe('GET', 'payment_links', { limit: 100, starting_after: after });
    links.push(...page.data);
    if (!page.has_more || !page.data.length) break;
    after = page.data[page.data.length - 1].id;
  }
  const normal = u => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/$/, ''); } catch (e) { return ''; } };
  const orders = {};
  for (const p of products) {
    const live = (liveCat.byId(p.id) || {}).checkoutUrl;
    const link = live && links.find(l => normal(l.url) === normal(live));
    if (!link) continue;
    const list = await S.stripe('GET', 'checkout/sessions', { payment_link: link.id, status: 'complete', limit: 20 });
    const s = list.data.find(x => x.payment_status === 'paid' && x.payment_intent);
    if (s) orders[p.id] = { id: s.id, paymentIntent: typeof s.payment_intent === 'object' ? s.payment_intent.id : s.payment_intent, test: s.id.startsWith('cs_test_') };
  }
  return orders;
}

async function readRecords(order) {
  const pi = await S.stripe('GET', 'payment_intents/' + encodeURIComponent(order.paymentIntent));
  const m = pi.metadata || {};
  const out = {};
  for (const [k] of RECORD_FIELDS) if (m[k]) out[k] = m[k];
  return out;
}

// Hides the last part of an IP address in documents meant for other people.
function maskIp(ip) {
  if (!ip) return '';
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.replace(/\.\d+$/, '.x');
  return ip.split(':').slice(0, 3).join(':') + ':…';
}

// Renders saved confirmation PDFs with pdf.js on a local-only origin, so they can be screenshotted.
const pdfFiles = new Map();
const scriptCache = new Map();
async function routeRenderer(context) {
  await context.route('https://kit.render/**', async route => {
    const u = new URL(route.request().url());
    if (u.pathname === '/viewer.html') return route.fulfill({ contentType: 'text/html', body: VIEWER_HTML });
    if (u.pathname.startsWith('/file/')) {
      const buf = pdfFiles.get(decodeURIComponent(u.pathname.slice(6)));
      return buf ? route.fulfill({ contentType: 'application/pdf', body: buf }) : route.fulfill({ status: 404, body: '' });
    }
    if (u.pathname === '/pdf.min.js' || u.pathname === '/pdf.worker.min.js') {
      if (!scriptCache.has(u.pathname)) {
        const r = await fetch(PDFJS + u.pathname.slice(1));
        if (!r.ok) throw new Error('Could not load pdf.js from cdnjs');
        scriptCache.set(u.pathname, await r.text());
      }
      return route.fulfill({ contentType: 'text/javascript', body: scriptCache.get(u.pathname) });
    }
    return route.fulfill({ status: 404, body: '' });
  });
}
const VIEWER_HTML = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:#d9d6cf}#doc{display:inline-flex;flex-direction:column;gap:18px;padding:28px}
canvas{display:block;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.22)}</style><div id="doc"></div>
<script src="/pdf.min.js"></script><script>
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
(async () => {
  const name = new URLSearchParams(location.search).get('f');
  const pdf = await pdfjsLib.getDocument('/file/' + encodeURIComponent(name)).promise;
  for (let i = 1; i <= pdf.numPages; i++) {
    const pg = await pdf.getPage(i), vp = pg.getViewport({ scale: 1.6 });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
    document.getElementById('doc').appendChild(c);
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  }
  window.__pages = pdf.numPages; window.__rendered = true;
})().catch(e => { window.__error = String(e); window.__rendered = true; });
</script>`;

async function renderPdf(context, file, outPng) {
  const name = path.basename(path.dirname(file)) + '-' + path.basename(file);
  pdfFiles.set(name, fs.readFileSync(file));
  const page = await context.newPage();
  await page.setViewportSize({ width: 1100, height: 1000 });
  await page.goto('https://kit.render/viewer.html?f=' + encodeURIComponent(name));
  await page.waitForFunction(() => window.__rendered === true, null, { timeout: 30000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error('pdf.js could not render ' + file + ': ' + err);
  await page.locator('#doc').screenshot({ path: outPng });
  await page.locator('#doc').screenshot({ path: jpegFor(outPng), type: 'jpeg', quality: 82 });
  await page.close();
}

function jpegFor(png) { return path.join(PDFIMG, rel(png).replace(/\//g, '__').replace(/\.png$/, '.jpg')); }

async function settle(page, ms) {
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(ms == null ? 350 : ms);
}

async function caption(page, text) {
  await page.evaluate(t => {
    let el = document.getElementById('kit-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kit-caption';
      Object.assign(el.style, {
        position: 'fixed', left: '50%', bottom: '20px', transform: 'translateX(-50%)', zIndex: '2147483647',
        background: 'rgba(20,20,20,0.93)', color: '#fff', font: '600 17px/1.4 "Hanken Grotesk", Arial, sans-serif',
        padding: '11px 18px', borderRadius: '6px', maxWidth: '1120px', textAlign: 'center', pointerEvents: 'none',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
  }, text);
}

function cardHtml(kicker, title, lines) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap">
<style>html,body{margin:0;height:100%;background:#f3efe4;color:#141414;font-family:"Hanken Grotesk",Arial,sans-serif}
.c{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 120px;box-sizing:border-box;
background-image:linear-gradient(rgba(20,20,20,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.05) 1px,transparent 1px);background-size:28px 28px}
.k{color:#b0122b;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:15px}
h1{font-size:46px;line-height:1.1;letter-spacing:-.02em;margin:14px 0 22px;max-width:900px}
p{font-size:21px;line-height:1.5;margin:0 0 12px;max-width:940px;color:#2b2b2b}</style>
<div class="c"><div class="k">${esc(kicker)}</div><h1>${esc(title)}</h1>${lines.map(l => '<p>' + esc(l) + '</p>').join('')}</div>`;
}

async function smoothScroll(page, y, ms) {
  await page.evaluate(top => window.scrollTo({ top, behavior: 'smooth' }), y);
  await page.waitForTimeout(ms || 900);
}

/* Solves the open puzzle with the same input events a player's clicks and keys produce. */
function installSolver() {
  const key = (el, k) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const book = new URLSearchParams(location.search).get('book');
  let actions = [];
  function build(p) {
    const out = [];
    if (p.type === 'sudoku') {
      const board = document.querySelector('.sudoku');
      const cells = Array.from(board.querySelectorAll('.cell'));
      for (let i = 0; i < 81; i++) if (p.givens[i] === '0') out.push(() => { cells[i].click(); key(board, p.solution[i]); });
    } else if (p.type === 'crossword') {
      const n = p.size, sol = p.grid.join('');
      const board = document.querySelector('.xw');
      const btns = Array.from(document.querySelectorAll('.clue-lists button[data-k]'));
      const cellEls = Array.from(board.querySelectorAll('.cell'));
      const entries = p.across.map(e => Object.assign({ dir: 'across' }, e)).concat(p.down.map(e => Object.assign({ dir: 'down' }, e)));
      entries.forEach((e, k) => out.push(() => {
        const cells = [];
        for (let t = 0; t < e.len; t++) cells.push(e.dir === 'across' ? e.r * n + e.c + t : (e.r + t) * n + e.c);
        if (cells.every(ci => cellEls[ci].querySelector('.v').textContent)) return;
        btns[k].click();
        for (let j = cells.findIndex(ci => !cellEls[ci].querySelector('.v').textContent); j < cells.length; j++) key(board, sol[cells[j]]);
      }));
    } else if (p.type === 'wordsearch') {
      const board = document.querySelector('.ws');
      const cellEls = Array.from(board.querySelectorAll('.cell'));
      const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      const ev = (type, P) => board.dispatchEvent(new PointerEvent(type, { clientX: P.x, clientY: P.y, bubbles: true, pointerId: 1 }));
      p.words.forEach(w => out.push(() => {
        const r = board.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) board.scrollIntoView({ block: 'center' });
        const a = cellEls[w.r * p.size + w.c];
        const b = cellEls[(w.r + w.dr * (w.word.length - 1)) * p.size + (w.c + w.dc * (w.word.length - 1))];
        const A = center(a), B = center(b);
        ev('pointerdown', A); ev('pointermove', B); ev('pointerup', B);
      }));
    } else if (p.type === 'cryptogram') {
      const wrap = document.querySelector('.crypto');
      const slots = Array.from(wrap.querySelectorAll('.slot'));
      const plain = p.plain.replace(/[^A-Z]/g, '');
      const seen = {};
      slots.forEach((s, k) => {
        const c = s.getAttribute('data-c');
        if (seen[c] || p.hints[c]) return;
        seen[c] = true;
        out.push(() => { s.click(); key(wrap, plain[k]); });
      });
    } else if (p.type === 'logic') {
      const L = Gridlock.svg.logicLayout(p), nn = p.categories[0].items.length;
      Array.from(document.querySelectorAll('.lg td[data-r]')).forEach(td => {
        const gr = +td.dataset.r, gc = +td.dataset.c;
        const a = L.rows[Math.floor(gr / nn)], b = L.cols[Math.floor(gc / nn)];
        if (Gridlock.svg.logicTruth(p, a, gr % nn, b, gc % nn)) out.push(() => { td.click(); td.click(); });
      });
    }
    return out;
  }
  window.__kit = {
    async prepare() {
      const n = +((location.hash.match(/p=(\d+)/) || [])[1] || 1);
      const d = await (await fetch('../data/' + book + '.json')).json();
      const p = d.puzzles[n - 1];
      actions = build(p);
      return { n, id: p.id, type: p.type, variant: p.variant || '', difficulty: p.difficulty || '', count: actions.length };
    },
    async run(from, to, delay) {
      for (let i = from; i < Math.min(to, actions.length); i++) {
        actions[i]();
        if (delay) await new Promise(r => setTimeout(r, delay));
      }
      return actions.length;
    },
    state() {
      const b = document.querySelector('.solved-banner');
      const s = document.querySelector('.status-line');
      return { solved: !!b && b.classList.contains('show'), banner: b ? b.textContent.trim() : '', status: s ? s.textContent.trim() : '' };
    },
  };
}

async function showPuzzle(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.puzzle-view') || document.querySelector('.sudoku, .xw, .ws, .crypto, .lg');
    window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - 84));
  });
  await page.waitForTimeout(250);
}

/* ------------------------------------------------- one product, start to finish */

async function captureProduct(browser, p, idx, order, liveUrl) {
  const dir = path.join(SHOTS, String(idx + 1).padStart(2, '0') + '-' + p.id);
  fs.mkdirSync(dir, { recursive: true });
  const context = await browser.newContext({ viewport: VIEW, colorScheme: 'light', locale: 'en-US', reducedMotion: 'reduce', acceptDownloads: true });
  await routeRenderer(context);
  const page = await context.newPage();
  const shots = {};
  const checks = [];
  const check = (label, ok, detail) => {
    checks.push({ label, ok: !!ok, detail: detail == null ? '' : String(detail) });
    if (!ok) console.log('    FAIL ' + label + (detail ? ': ' + detail : ''));
  };
  async function shot(name, opts, target) {
    const f = path.join(dir, name + '.png');
    const t = target || page;
    await t.screenshot(Object.assign({ path: f }, opts));
    await t.screenshot(Object.assign({}, opts, { path: jpegFor(f), type: 'jpeg', quality: 82 }));
    shots[name] = rel(f);
  }
  const buyState = () => page.evaluate(() => {
    const l = document.querySelector('.buy-area .buy-link'), b = document.querySelector('.buy-area .agree input');
    if (!l || !b) return null;
    return { href: l.getAttribute('href'), disabled: l.getAttribute('aria-disabled') === 'true', checked: b.checked,
      label: document.querySelector('.buy-area .agree label').textContent.trim(), hint: document.querySelector('.buy-area .agree-hint').textContent.trim() };
  });

  // Step 1: product page
  await page.goto(url(p.productPath), { waitUntil: 'networkidle' });
  await settle(page);
  const facts = await page.evaluate(() => {
    const box = document.querySelector('.buy-box');
    return { price: (box.querySelector('[data-price]') || {}).textContent || '', text: box.innerText,
      refundLink: !!box.querySelector('a[href$="refunds/"]'), termsLink: !!box.querySelector('.agree a[href$="terms/"]') };
  });
  const s0 = await buyState();
  check('Product page shows the price', facts.price === '$' + p.price, facts.price);
  check('Product page states the delivery method', /license key/i.test(facts.text), 'Instant access with a license key');
  check('Product page links the refund policy', facts.refundLink);
  check('Terms checkbox is shown with the buy button', !!s0 && /I agree to the Terms of Service and Refund Policy/.test(s0.label), s0 && s0.label);
  check('Buy button is disabled before agreeing', !!s0 && s0.disabled && !s0.href);
  await shot('01-product-page', { fullPage: true });
  await shot('02-product-page-top', {});
  await shot('03-buy-box-before-agreeing', {}, page.locator('.buy-box'));

  const before = page.url();
  await page.click('.buy-area .buy-link', { force: true });
  await page.waitForTimeout(400);
  const nudge = await page.evaluate(() => document.querySelector('.agree-hint').classList.contains('nudge') && document.activeElement === document.querySelector('.agree input'));
  check('Clicking the disabled buy button stays on the page and points to the checkbox', page.url() === before && nudge);
  await page.focus('.buy-area .agree input');
  await page.keyboard.press('Space');
  const s1 = await buyState();
  check('Ticking the box (keyboard) enables the buy button and links it to Stripe checkout', s1 && s1.checked && !s1.disabled && s1.href === liveUrl, s1 && s1.href);
  await page.keyboard.press('Space');
  const s2 = await buyState();
  check('Unticking the box disables the buy button again', s2 && !s2.checked && s2.disabled && !s2.href);
  await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  await shot('04-buy-box-after-agreeing', {}, page.locator('.buy-box'));

  // Step 2 (payment on Stripe's checkout) is not captured.
  // Step 3: order confirmation for a real order, as Stripe's redirect opens it
  const ref = order.id;
  await page.goto(url(p.thankYouPath) + '?session_id=' + ref, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-key-ready="true"], [data-state="failed"]:not([hidden])', { timeout: 20000 });
  await settle(page);
  const conf = await page.evaluate(() => {
    const dd = label => { const dt = Array.from(document.querySelectorAll('.order-details dt')).find(d => d.textContent.trim() === label); return dt ? dt.nextElementSibling.textContent.trim() : ''; };
    return { h1: document.querySelector('[data-state="ready"] h1').textContent.trim(), ready: !document.querySelector('[data-state="ready"]').hidden,
      failure: document.querySelector('[data-fail-message]').textContent, key: document.querySelector('[data-key-plain]').textContent.trim(),
      product: dd('Product'), time: dd('Date and time'), ref: dd('Order reference'),
      robots: (document.querySelector('meta[name="robots"]') || {}).content || '',
      buttons: Array.from(document.querySelectorAll('.thank-actions button, .thank-actions a')).map(b => b.textContent.trim()) };
  });
  if (!conf.ready) throw new Error('The confirmation page could not confirm order ' + ref + ': ' + conf.failure);
  const genuine = L.verify(L.secret(), conf.key);
  check('Confirmation checks the payment with Stripe, then says the order is complete and delivered', conf.ready && /Order complete/.test(conf.h1), conf.h1);
  check('Confirmation shows the product name', conf.product === p.name, conf.product);
  check('Confirmation shows the date and time', !!conf.time, conf.time);
  check('Confirmation shows the Stripe order reference', conf.ref === ref, conf.ref);
  check('Confirmation delivers the signed license key for this order', !!genuine && genuine.code === p.code && conf.key === L.forOrder(L.secret(), p.code, ref), conf.key);
  check('Confirmation offers Copy key, Save confirmation, Print and Open my puzzles',
    ['Copy key', 'Save confirmation', 'Print', 'Open my puzzles'].every(b => conf.buttons.includes(b)), conf.buttons.join(', '));
  check('Confirmation page is hidden from search engines', /noindex/.test(conf.robots), conf.robots);
  await shot('05-order-confirmation', { fullPage: true });
  await shot('06-order-confirmation-top', {});

  // Step 4: keep a copy: Save confirmation (PDF) and Print
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-save]')]);
  const pdfPath = path.join(dir, 'saved-confirmation.pdf');
  await download.saveAs(pdfPath);
  const pdfText = fs.readFileSync(pdfPath, 'latin1');
  check('Save confirmation downloads a PDF', pdfText.startsWith('%PDF-'), download.suggestedFilename());
  check('Saved PDF contains the key, product, order reference and policy links',
    [conf.key, ref, url('terms/'), url('refunds/'), url('delivery/')].every(s => pdfText.includes(s)) && pdfText.includes(p.name.replace(/’/g, "'")));
  await renderPdf(context, pdfPath, path.join(dir, '07-saved-confirmation-pdf.png'));
  shots['07-saved-confirmation-pdf'] = rel(path.join(dir, '07-saved-confirmation-pdf.png'));
  await page.emulateMedia({ media: 'print' });
  const printHides = await page.evaluate(() => getComputedStyle(document.querySelector('.thank-actions')).display === 'none' && getComputedStyle(document.querySelector('[data-key-plain]')).display !== 'none');
  check('Print layout keeps the key and order details and hides the buttons', printHides);
  await shot('08-print-view', { fullPage: true });
  await page.emulateMedia({ media: 'screen' });

  // Step 5: unlock
  await Promise.all([page.waitForURL(u => /\/unlock\/$/.test(new URL(u).pathname)), page.click('[data-open]')]);
  await page.waitForSelector('.unlock-stage.unlocked', { timeout: 15000 });
  await settle(page, 700);
  const unlockText = await page.evaluate(() => document.querySelector('.unlock-result').innerText);
  check('Open my puzzles carries the key to the Unlock page and unlocks it', /Unlocked/.test(unlockText) && p.books.every(b => unlockText.includes(bookTitle(b))));
  await shot('09-unlock', { fullPage: true });

  // Step 6: library
  await Promise.all([page.waitForURL(u => /\/library\/$/.test(new URL(u).pathname)), page.click('.unlock-result a.btn.red')]);
  await page.waitForSelector('.spine');
  await settle(page);
  const spines = await page.$$eval('.spine .t', els => els.map(e => e.textContent));
  check('Library shelf shows exactly the purchased books', spines.length === p.books.length && p.books.every(b => spines.includes(bookTitle(b))), spines.join(', '));
  await shot('10-library', { fullPage: true });

  // Step 7: the product in use
  await Promise.all([page.waitForURL(/\/play\//), page.click('.spine >> nth=0')]);
  await page.waitForSelector('.pcard', { timeout: 20000 });
  await settle(page);
  const contents = await page.$$eval('.pcard', els => els.length);
  check('Book opens with its puzzles listed', contents > 0, contents + ' puzzles');
  await shot('11-book-contents', {});
  await page.click('.pcard >> nth=0');
  await page.waitForSelector('.sudoku, .xw, .ws, .crypto, .lg', { timeout: 20000 });
  await settle(page, 500);
  await page.evaluate(installSolver);
  const info = await page.evaluate(() => window.__kit.prepare());
  const part = Math.max(1, Math.round(info.count * 0.4));
  await page.evaluate(([a, b]) => window.__kit.run(a, b, 0), [0, part]);
  await page.waitForTimeout(300);
  await shot('12-puzzle-in-progress', { fullPage: true });
  await page.evaluate(([a, b]) => window.__kit.run(a, b, 0), [part, info.count]);
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => window.__kit.state());
  check('Puzzle can be played to the end in the browser', st.solved, st.banner);
  await shot('13-puzzle-solved', { fullPage: true });
  await context.close();

  // The records the server wrote on the Stripe payment during this walkthrough
  const records = await readRecords(order);
  check('Delivery recorded on the Stripe payment (time, IP address, browser)',
    records.gridlock_key === conf.key && records.gridlock_delivered_at && records.gridlock_delivered_ip && +records.gridlock_views >= 1, records.gridlock_delivered_at);
  check('Unlock recorded on the Stripe payment (time, IP address, browser)',
    records.gridlock_unlocked_at && records.gridlock_unlocked_ip && +records.gridlock_unlocks >= 1, records.gridlock_unlocked_at);
  return { product: p, order, key: conf.key, time: conf.time, ref, shots, checks, records, puzzle: info, book: bookTitle(p.books[0]) };
}

/* -------------------------------------------------------- reviewer key check */

async function verifyReviewerKey(browser, p, key) {
  const context = await browser.newContext({ viewport: VIEW, colorScheme: 'light', locale: 'en-US', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const out = { unlocked: false, books: [], opens: false };
  try {
    await page.goto(url('unlock/'), { waitUntil: 'networkidle' });
    const chars = key.replace(/^GRID-/, '').replace(/-/g, '');
    const inputs = page.locator('.key-group input');
    for (let i = 0; i < chars.length; i++) await inputs.nth(i).fill(chars[i]);
    await page.click('[data-unlock] [type="submit"]');
    await page.waitForSelector('.unlock-stage.unlocked', { timeout: 10000 });
    out.unlocked = true;
    await page.goto(url('library/'), { waitUntil: 'networkidle' });
    out.books = await page.$$eval('.spine .t', els => els.map(e => e.textContent));
    await page.goto(url('play/?book=' + p.books[p.books.length - 1]), { waitUntil: 'networkidle' });
    await page.waitForSelector('.pcard', { timeout: 15000 });
    out.opens = true;
  } catch (e) { out.error = e.message.split('\n')[0]; }
  await context.close();
  out.ok = out.unlocked && out.opens && out.books.length === p.books.length && p.books.every(b => out.books.includes(bookTitle(b)));
  return out;
}

/* ------------------------------------------------------------------- video */

async function recordVideo(browser, p, order) {
  const tmp = path.join(OUT, '.video-tmp');
  const context = await browser.newContext({ viewport: VIEW, colorScheme: 'light', locale: 'en-US', acceptDownloads: true, recordVideo: { dir: tmp, size: VIEW } });
  await routeRenderer(context);
  const page = await context.newPage();
  const ref = order.id;
  const n = p.books.length;

  await page.setContent(cardHtml('Fulfillment walkthrough', 'Gridlock Puzzle Co.: from purchase to delivery', [
    'Recorded on ' + dateLong + ' on the live site, ' + BASE,
    'Product shown: ' + p.name + ' ($' + p.price + '), ' + (n > 1 ? 'which unlocks ' + n + ' online puzzle books.' : 'an online puzzle book.'),
    'Every product is delivered the same way: a license key on the order confirmation page, entered on the Unlock page. Nothing is shipped.',
  ]));
  await page.waitForTimeout(5500);

  await page.goto(url(p.productPath), { waitUntil: 'networkidle' });
  await settle(page);
  await caption(page, 'Step 1 · Product page: price, delivery by license key, refund policy and the terms checkbox');
  await page.waitForTimeout(2500);
  const height = await page.evaluate(() => document.body.scrollHeight - innerHeight);
  for (const y of [600, 1300, 2000]) if (y < height) await smoothScroll(page, y, 1300);
  await smoothScroll(page, 0, 1300);
  await caption(page, 'The buy button stays disabled until the buyer agrees to the Terms of Service and Refund Policy');
  await page.hover('.buy-area .buy-link', { force: true });
  await page.waitForTimeout(1200);
  await page.click('.buy-area .buy-link', { force: true });
  await page.waitForTimeout(2200);
  await page.click('.buy-area .agree input');
  await caption(page, 'Box ticked: the buy button turns on and leads to Stripe checkout');
  await page.waitForTimeout(3200);

  await page.setContent(cardHtml('Step 2 · Payment (not recorded)', 'The buyer pays on Stripe’s secure checkout', [
    'Selecting Buy now opens Stripe’s hosted checkout page. Card details are entered there, never on this site.',
    'When the payment is complete, Stripe sends the buyer back to the order confirmation page for the product, with the order reference in the address.',
    'The next screen is the confirmation page of a real order placed earlier' + (order.test ? ' in Stripe test mode.' : '.'),
  ]));
  await page.waitForTimeout(8500);

  await page.goto(url(p.thankYouPath) + '?session_id=' + ref, { waitUntil: 'networkidle' });
  await caption(page, 'Step 3 · Order confirmation: the page checks the payment with Stripe, then delivers the license key');
  await page.waitForTimeout(1800);
  await smoothScroll(page, 250, 900);
  await page.waitForSelector('[data-key-ready="true"]', { timeout: 20000 });
  await page.waitForTimeout(2200);
  await smoothScroll(page, 420, 1500);
  await caption(page, 'Step 4 · The buyer keeps a copy: Copy key, Save confirmation (PDF) or Print');
  await page.waitForTimeout(1500);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-save]')]);
  const pdfPath = path.join(tmp, 'video-confirmation.pdf');
  await download.saveAs(pdfPath);
  await page.waitForTimeout(1500);
  pdfFiles.set('video-confirmation.pdf', fs.readFileSync(pdfPath));
  await page.goto('https://kit.render/viewer.html?f=video-confirmation.pdf');
  await page.waitForFunction(() => window.__rendered === true, null, { timeout: 30000 });
  await caption(page, 'The saved confirmation PDF: product, date and time, order reference, license key, instructions and policy links');
  await page.waitForTimeout(5000);
  await page.goto(url(p.thankYouPath) + '?session_id=' + ref, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-key-ready="true"]', { timeout: 20000 });
  await smoothScroll(page, 420, 900);
  await caption(page, 'Step 5 · Open my puzzles takes the key to the Unlock page');
  await page.waitForTimeout(1800);
  await Promise.all([page.waitForURL(u => /\/unlock\/$/.test(new URL(u).pathname)), page.click('[data-open]')]);
  await caption(page, 'Step 5 · The key is entered and checked by the server on the Unlock page');
  await page.waitForSelector('.unlock-stage.unlocked', { timeout: 15000 });
  await page.waitForTimeout(3200);
  await Promise.all([page.waitForURL(u => /\/library\/$/.test(new URL(u).pathname)), page.click('.unlock-result a.btn.red')]);
  await page.waitForSelector('.spine');
  await caption(page, 'Step 6 · Library: ' + (n > 1 ? 'the ' + n + ' books in ' + p.name + ' are on the shelf' : p.name + ' is on the shelf'));
  await page.waitForTimeout(3500);
  await Promise.all([page.waitForURL(/\/play\//), page.click('.spine >> nth=0')]);
  await page.waitForSelector('.pcard', { timeout: 20000 });
  await caption(page, 'Step 7 · The book opens in the browser with its puzzles listed');
  await page.waitForTimeout(2500);
  await page.click('.pcard >> nth=0');
  await page.waitForSelector('.sudoku, .xw, .ws, .crypto, .lg', { timeout: 20000 });
  await page.waitForTimeout(600);
  await showPuzzle(page);
  await caption(page, 'Step 7 · Playing a puzzle in the browser');
  await page.evaluate(installSolver);
  const info = await page.evaluate(() => window.__kit.prepare());
  await page.evaluate(n => window.__kit.run(0, n, 45), info.count);
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => window.__kit.state());
  await caption(page, st.solved ? 'Puzzle solved. Progress is saved on this device, and every puzzle can also be printed.' : 'Puzzle in progress');
  await page.waitForTimeout(3500);

  await page.setContent(cardHtml('Delivery complete', 'The buyer has received and used the product', [
    'Delivery happened on the order confirmation page immediately after payment: the license key was shown there, and the buyer could copy it, save it as a PDF or print it.',
    'The key unlocked the books on the Unlock page, and they are played in the web browser. Nothing is shipped and there is nothing to download or install.',
    'The delivery and the unlock were recorded on the payment in Stripe, with the time, IP address and browser.',
  ]));
  await page.waitForTimeout(6500);

  const video = page.video();
  await context.close();
  const file = path.join(OUT, 'Fulfillment-Walkthrough.webm');
  await video.saveAs(file);
  await video.delete();
  fs.rmSync(tmp, { recursive: true, force: true });
  return { file, solved: st.solved, productId: p.id };
}

/* ---------------------------------------------------------------- the texts */

function summaryText() {
  const support = supportEmail
    ? 'Email ' + supportEmail + ', or use our Contact page: ' + url('contact/') + '. We reply within two business days. Lost license keys are replaced on request.'
    : 'Through our Contact page: ' + url('contact/') + '. We reply within two business days. Lost license keys are replaced on request.';
  return [
    'BUSINESS AND FULFILLMENT SUMMARY: GRIDLOCK PUZZLE CO.',
    'Website: ' + BASE,
    '',
    'What we sell',
    'Digital puzzle books (sudoku, word search, cryptograms, logic grid puzzles and crosswords) that customers play online in a web browser and can print for personal use. ' +
      products.length + ' products, each a one-time purchase, priced from ' + priceRange + ' (USD):',
    ...products.map(p => '  - ' + p.name.replace(/’/g, "'") + ': $' + p.price + (p.books.length > 1 ? ' (' + p.books.length + ' books)' : '')),
    '',
    'How products are delivered',
    'Before checkout, the customer must tick a box agreeing to our Terms of Service and Refund Policy; the buy button stays disabled until they do. ' +
      'The customer pays on Stripe\'s hosted checkout page. When the payment is complete, Stripe redirects the customer to the order confirmation page for their product. ' +
      'That page checks the payment with Stripe and then shows a license key immediately, together with the product name, the date and time of the order, and the order reference. ' +
      'The customer can copy the key, save a PDF of the order confirmation, or print it. ' +
      'They enter the key on our Unlock page (' + url('unlock/') + ') and the puzzle books they bought appear in their online library, ready to play. The same key works on any of their own devices. ' +
      'Every delivery is recorded on the payment in Stripe: the time, IP address and browser when the key was shown and when it was unlocked.',
    '',
    'When delivery happens',
    'Immediately after payment, on the order confirmation page. There is no waiting period and no manual processing.',
    '',
    'Physical shipment',
    'None. All products are digital. Nothing is mailed or shipped, there are no shipping charges, and there are no files to download or software to install.',
    '',
    'Refund policy',
    'Full refund on any purchase requested within 14 days, with no reason needed. Customers ask through our Contact page with their order number. Refunds go back to the original payment method within 5 business days.',
    '',
    'Customer support',
    support,
    '',
    'Policies',
    '  Terms of Service: ' + url('terms/'),
    '  Refund Policy: ' + url('refunds/'),
    '  Delivery Policy: ' + url('delivery/'),
    '  Privacy Policy: ' + url('privacy/'),
    '  Contact: ' + url('contact/'),
  ].join('\n');
}

function reviewerText(reviewers) {
  return [
    'GRIDLOCK PUZZLE CO.: REVIEWER ACCESS',
    'One working license key per product. Each was checked on ' + BASE + ' on ' + dateLong + '.',
    '',
    'How to use a key',
    '  1. Open ' + url('unlock/'),
    '  2. Type or paste the key and select Unlock.',
    '  3. Select Open my library. The product\'s books are on the shelf; open one to play.',
    '  Keys are saved in the browser you use. To try another key, open the Unlock page again and enter it.',
    '',
    ...reviewers.map(r => '  ' + r.product.name.replace(/’/g, "'").padEnd(34) + r.key),
  ].join('\n');
}

function readmeText(results, missingLinks, noOrder) {
  const todo = [];
  if (!supportEmail) todo.push('SET A SUPPORT EMAIL. src/js/site-config.js has an empty supportEmail, so the Contact page currently shows no way to reach you, and the Delivery Policy, Refund Policy and lost-key instructions all send buyers there. Add the address, rebuild, deploy, then run the kit again so the summary includes it.');
  if (missingLinks.length) todo.push('CONNECT CHECKOUT. These products have no payment link on the live site, so their pages show no buy button and they are not in this kit: ' + missingLinks.map(p => p.id).join(', ') + '. Paste each payment link into checkoutUrl in src/js/products.js, rebuild and deploy.');
  if (noOrder.length) todo.push('PLACE AN ORDER. These products have a payment link but no completed order yet, so they are not in this kit: ' + noOrder.map(p => p.id).join(', ') + '. Buy each once (Stripe test mode is fine while the site uses test links), then run the kit again.');
  todo.push('CHECK THE AFTER-PAYMENT REDIRECT. Each Stripe payment link must send buyers to its order confirmation page with ?session_id={CHECKOUT_SESSION_ID} at the end (list below). Without the session ID the page cannot confirm the payment, and the buyer sees an error instead of their key.');
  todo.push('RUN THE KIT AGAIN (npm run kit) after any of the changes above, so every file matches the live site.');
  return [
    'GRIDLOCK PUZZLE CO.: FULFILLMENT KIT (read me first, for you only)',
    'Generated ' + dateLong + ' from ' + BASE,
    '',
    'FILES',
    '  Fulfillment-Overview.pdf              The document for payment processor reviews.',
    '  Business-and-Fulfillment-Summary.txt  The summary to paste into application forms.',
    '  reviewer-keys.txt                     One working license key per product, for reviewers.',
    '  Fulfillment-Walkthrough.webm          Screen recording of the full flow (opens in Chrome, Edge, Firefox or VLC).',
    '  screenshots/NN-product/               Every step for every product, plus the saved confirmation PDF.',
    '  capture-log.json                      Every automated check, the orders used and the records read back from Stripe.',
    '',
    'BEFORE YOU SUBMIT',
    ...todo.map((t, i) => '  ' + (i + 1) + '. ' + t),
    '',
    'AFTER-PAYMENT REDIRECT FOR EACH STRIPE PAYMENT LINK',
    ...products.map(p => '  ' + plainName(p).padEnd(34) + url(p.thankYouPath) + '?session_id={CHECKOUT_SESSION_ID}'),
    '',
    'HOW DELIVERY AND THE RECORDS WORK (so what you tell processors stays accurate)',
    '  - The order confirmation page asks the server to check the payment with Stripe. Only a paid order gets a key,',
    '    only for the product its payment link sells, and the same order always gets the same key.',
    '  - Keys are signed with LICENSE_SECRET, and the Unlock page asks the server to check every key. Changing the',
    '    secret makes every key issued so far stop working.',
    '  - The server writes the delivery and each unlock onto the Stripe payment (Payments, open the payment, Metadata):',
    '    the time, IP address and browser of the first view and the first unlock, how many times each happened, and the',
    '    latest of each. Use these as evidence in a dispute. This kit\'s own visits are recorded on the orders it used.',
    '  - A buyer who lost their key: find their payment in Stripe. The key is in its metadata as gridlock_key.',
    '  - A refund does not switch a key off, and books stay open on devices that were already unlocked.',
    '  - Reviewer keys (npm run key -- <product-id>) work without an order, and their use is not recorded.',
    '  - The lock is a soft one: the puzzle files themselves can still be fetched from the site, as before.',
    '  - The site does not email anything. The buyer keeps the key by copying it, saving the PDF or printing.',
    '',
    'This folder is listed in .gitignore and .vercelignore, so it is never committed or published.',
  ].join('\n');
}

/* --------------------------------------------------------- overview PDF html */

function overviewHtml(results, reviewers, video) {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const img = (r, name, cls, alt) => {
    const j = jpegFor(path.join(OUT, r.shots[name]));
    return `<img class="${cls || ''}" src="${rel(j)}" alt="${esc(alt || name)}">`;
  };
  const fig = (r, name, cap, cls) => `<figure>${img(r, name, cls, cap)}<figcaption>${esc(cap)}<span class="file">${esc(r.shots[name])}</span></figcaption></figure>`;
  const main = results.find(r => r.product.id === video.productId) || results[0];
  const testMode = results.some(r => r.order.test);
  const allChecks = results.reduce((n, r) => n + r.checks.length, 0);
  const passed = results.reduce((n, r) => n + r.checks.filter(c => c.ok).length, 0);
  const shownValue = (k, v) => /_ip$/.test(k) ? maskIp(v) : /_at$/.test(k) ? new Date(v).toUTCString().replace('GMT', 'UTC') : v;
  const steps = [
    ['Agree and check out', 'On the product page, the buyer ticks “I agree to the Terms of Service and Refund Policy”. The buy button stays disabled until the box is ticked. Selecting Buy now opens Stripe’s checkout.'],
    ['Pay', 'The buyer pays on Stripe’s hosted checkout page. Card details never touch this site.'],
    ['Receive the key', 'When payment is complete, Stripe redirects the buyer to the order confirmation page for the product. The page checks the payment with Stripe and shows the license key immediately, with the product name, date and time, and the order reference. Delivery is complete at this point, and it is recorded on the payment.'],
    ['Keep a copy', 'The buyer can copy the key, save a PDF of the order confirmation, or print it. The key is not emailed, so the page asks the buyer to save it.'],
    ['Unlock', 'Open my puzzles takes the key to the Unlock page. The server checks the key and records the unlock on the payment, and the books open. A buyer can also type the key there on any of their devices.'],
    ['Play', 'The books appear on the buyer’s library shelf and are played in the web browser on a computer, tablet or phone. Every puzzle can also be printed.'],
  ];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Gridlock Puzzle Co. Fulfillment Overview</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&display=swap">
<style>
@page { size: Letter; margin: 0.55in 0.6in 0.6in; }
* { box-sizing: border-box; }
body { font-family: "Hanken Grotesk", Arial, sans-serif; color: #141414; font-size: 10.5pt; line-height: 1.45; margin: 0; }
h1 { font-size: 30pt; line-height: 1.05; letter-spacing: -0.02em; margin: 0 0 10pt; }
h2 { font-size: 17pt; letter-spacing: -0.01em; margin: 0 0 8pt; padding-bottom: 5pt; border-bottom: 2px solid #141414; }
h3 { font-size: 12pt; margin: 14pt 0 5pt; }
p { margin: 0 0 7pt; }
.kicker { color: #b0122b; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; font-size: 9pt; margin-bottom: 8pt; }
.page { break-before: page; }
.cover { height: 9.6in; display: flex; flex-direction: column; justify-content: center;
  background-image: linear-gradient(rgba(20,20,20,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,20,20,.06) 1px, transparent 1px); background-size: 20px 20px; padding: 0 0.3in; }
.cover .lede { font-size: 13pt; max-width: 5.6in; }
.meta { margin-top: 18pt; font-size: 10pt; }
.meta div { margin-bottom: 3pt; }
ol.toc { margin: 18pt 0 0; padding-left: 16pt; font-size: 10.5pt; }
pre.paste { white-space: pre-wrap; font-family: "Hanken Grotesk", Arial, sans-serif; font-size: 8.9pt; line-height: 1.36; border: 1.5px solid #141414; padding: 10pt 12pt; margin: 0; background: #faf8f3; }
.note { border-left: 3px solid #b0122b; background: #faf3f3; padding: 6pt 9pt; font-size: 9.5pt; }
ol.flow { padding-left: 0; list-style: none; counter-reset: s; margin: 0; }
ol.flow li { counter-increment: s; position: relative; padding: 0 0 5pt 30pt; break-inside: avoid; }
ol.flow li::before { content: counter(s); position: absolute; left: 0; top: 0; width: 20pt; height: 20pt; border: 1.5px solid #141414; font-weight: 700; text-align: center; line-height: 18pt; font-size: 10pt; }
figure { margin: 0 0 10pt; break-inside: avoid; }
figure img { display: block; max-width: 100%; border: 1px solid #c9c4b8; }
figure img.tall { max-height: 7.7in; width: auto; margin: 0 auto; }
figure img.mid { max-height: 4in; width: auto; }
figure img.top { max-height: 2.9in; width: auto; }
figure img.short { max-height: 3.45in; width: auto; }
figure img.shorter { max-height: 2.9in; width: auto; }
figure img.box { max-width: 2.8in; }
figcaption { font-size: 8.8pt; color: #444; margin-top: 3pt; }
figcaption .file { display: block; color: #888; font-size: 7.8pt; }
.row { display: flex; gap: 12pt; align-items: flex-start; }
.row > figure { flex: 1; min-width: 0; }
.step-head { display: flex; gap: 10pt; align-items: baseline; margin: 0 0 6pt; }
.step-head .n { font-weight: 700; color: #b0122b; font-size: 11pt; white-space: nowrap; }
.step-head h3 { margin: 0; font-size: 14pt; }
.written { border: 1.5px dashed #141414; padding: 12pt 14pt; margin: 6pt 0 12pt; break-inside: avoid; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
th, td { text-align: left; padding: 3.5pt 6pt; border-bottom: 1px solid #d6d1c5; vertical-align: top; }
th { font-size: 8.4pt; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1.5px solid #141414; }
td.key, .key { font-family: "Courier New", monospace; font-weight: 700; font-size: 10pt; letter-spacing: 0.02em; white-space: nowrap; }
.ok { color: #1d6b35; font-weight: 700; }
.bad { color: #b0122b; font-weight: 700; }
.grid4 { display: grid; grid-template-columns: 1fr 1fr; gap: 9pt 12pt; }
.grid4 figure img { max-height: 2.2in; width: auto; max-width: 100%; }
ul.checks { columns: 2; column-gap: 16pt; padding-left: 13pt; font-size: 8.2pt; margin: 6pt 0 0; }
ul.checks li { break-inside: avoid; }
.small { font-size: 9pt; color: #444; }
</style></head><body>

<section class="cover">
  <div class="kicker">Fulfillment overview</div>
  <h1>Gridlock Puzzle Co.</h1>
  <p class="lede">How the online puzzle books sold at ${esc(BASE)} are delivered: a license key on the order confirmation page immediately after payment. No physical shipment.</p>
  <div class="meta">
    <div><strong>Website:</strong> ${esc(BASE)}</div>
    <div><strong>Prepared:</strong> ${esc(dateLong)}, from automated walkthroughs of the live site in Microsoft Edge</div>
    <div><strong>Products covered:</strong> ${results.length === products.length ? 'all ' + products.length : results.length + ' of ' + products.length}, each followed from product page to the product in use with a real order${testMode ? ' (Stripe test mode)' : ''}</div>
  </div>
  <ol class="toc">
    <li>Business and Fulfillment Summary</li>
    <li>How delivery works</li>
    <li>Step-by-step walkthrough with screenshots</li>
    <li>Every product, checked</li>
    <li>Delivery records</li>
    <li>Replacement keys</li>
    <li>Refunds</li>
    <li>Reviewer access</li>
  </ol>
</section>

<section class="page">
  <div class="kicker">1</div>
  <h2>Business and Fulfillment Summary</h2>
  <p class="small">Plain text, ready to paste into an application form. The same text is in Business-and-Fulfillment-Summary.txt.</p>
  <pre class="paste">${esc(summaryText())}</pre>
</section>

<section class="page">
  <div class="kicker">2</div>
  <h2>How delivery works</h2>
  <p>Every product is a set of one or more online puzzle books. What the buyer receives is a <strong>license key</strong> that unlocks those books on the site. The key is delivered on the order confirmation page as soon as Stripe returns the buyer to the site and the payment is confirmed. Nothing is shipped, and there is nothing to download or install.</p>
  <ol class="flow">${steps.map(s => `<li><strong>${esc(s[0])}.</strong> ${esc(s[1])}</li>`).join('')}</ol>
  <h3>Policies buyers agree to</h3>
  <p>Terms of Service: ${esc(url('terms/'))}<br>Refund Policy: ${esc(url('refunds/'))}<br>Delivery Policy: ${esc(url('delivery/'))}</p>
  <h3>Order confirmation pages</h3>
  <p class="small">Stripe redirects each buyer to the page for their product after payment, adding the order reference as <span class="key">?session_id=…</span>:</p>
  <table><tr><th>Product</th><th>Price</th><th>Order confirmation page</th></tr>
  ${products.map(p => `<tr><td>${esc(p.name)}</td><td>$${p.price}</td><td>${esc(url(p.thankYouPath))}</td></tr>`).join('')}</table>
</section>

<section class="page">
  <div class="kicker">3</div>
  <h2>Step-by-step walkthrough: ${esc(main.product.name)}</h2>
  <p>Captured on the live site on ${esc(dateLong)} with a real order${main.order.test ? ' placed in Stripe test mode' : ''}. Every other product follows the same steps (section 4). A screen recording of this walkthrough is in Fulfillment-Walkthrough.webm.</p>
  <div class="step-head"><span class="n">Step 1</span><h3>Product page</h3></div>
  <p>The price, the delivery method (“Instant access with a license key”), a link to the 14-day refund policy and the terms checkbox sit together in the buy box.</p>
  ${fig(main, '02-product-page-top', 'The top of the product page with the buy box.', 'top')}
  <div class="row">${fig(main, '03-buy-box-before-agreeing', 'Before agreeing: the buy button is disabled and a hint explains why.', 'box')}${fig(main, '04-buy-box-after-agreeing', 'After ticking the box: the buy button is enabled.', 'box')}</div>
</section>

<section class="page">
  ${fig(main, '01-product-page', 'The whole product page, including what the book contains and how the online player works.', 'tall')}
</section>

<section class="page">
  <div class="step-head"><span class="n">Step 2</span><h3>Payment on Stripe’s checkout (described, not captured)</h3></div>
  <div class="written">
    <p>Selecting <strong>Buy now</strong> opens Stripe’s hosted checkout page. The buyer enters their payment details there; they are never entered on or sent to this site.</p>
    <p>When the payment is complete, Stripe redirects the buyer to the order confirmation page for the product and adds the order reference to the address (<span class="key">?session_id=…</span>). The page uses it to check with Stripe that the order is paid, and for which product, before it shows the key.</p>
    <p class="small">The screenshots below show order <span class="key">${esc(main.ref)}</span>.</p>
  </div>
  <div class="step-head"><span class="n">Step 3</span><h3>Order confirmation: the product is delivered</h3></div>
  <p>Once Stripe confirms the payment, the page says the order is complete and shows the product, the date and time, the order reference and the license key, with instructions for opening the puzzles. The delivery is recorded on the payment (section 5).</p>
  ${fig(main, '06-order-confirmation-top', 'The order confirmation page as the buyer first sees it.')}
</section>

<section class="page">
  ${fig(main, '05-order-confirmation', 'The whole order confirmation page: key, actions, how to open the puzzles, what the key opens, and the policies.', 'tall')}
</section>

<section class="page">
  <div class="step-head"><span class="n">Step 4</span><h3>The buyer keeps a copy</h3></div>
  <p><strong>Save confirmation</strong> downloads a PDF made in the browser, containing the product, date and time, order reference, license key, how to open the puzzles, and links to the Terms of Service, Refund Policy and Delivery Policy. <strong>Print</strong> prints the page with the buttons hidden.</p>
  <div class="row">${fig(main, '07-saved-confirmation-pdf', 'The saved confirmation PDF (gridlock-order-confirmation-' + main.product.id + '.pdf).', 'mid')}${fig(main, '08-print-view', 'The printed confirmation page.', 'mid')}</div>
</section>

<section class="page">
  <div class="step-head"><span class="n">Step 5</span><h3>Unlock</h3></div>
  <p><strong>Open my puzzles</strong> carries the key to the Unlock page, which checks it and confirms which books it opens.</p>
  ${fig(main, '09-unlock', 'The Unlock page after the key is accepted.', 'short')}
  <div class="step-head"><span class="n">Step 6</span><h3>Library</h3></div>
  ${fig(main, '10-library', 'The library shelf with every book in the purchase.', 'short')}
</section>

<section class="page">
  <div class="step-head"><span class="n">Step 7</span><h3>The product in use</h3></div>
  <p>Each book opens in the browser with its puzzles listed. Puzzles are played with mouse, touch or keyboard; progress is saved on the device, and every puzzle can be printed.</p>
  ${fig(main, '11-book-contents', main.book + ': the list of puzzles.', 'shorter')}
  <div class="row">${fig(main, '12-puzzle-in-progress', 'A puzzle in progress.', 'mid')}${fig(main, '13-puzzle-solved', 'The same puzzle solved, with the Solved banner.', 'mid')}</div>
</section>

<section class="page">
  <div class="kicker">4</div>
  <h2>Every product, checked</h2>
  <p>Each product was walked through on the live site in a fresh browser with nothing saved, using a real order: product page, terms checkbox, order confirmation, saved PDF, print view, unlock, library, a puzzle played to the end, and the delivery records read back from Stripe. ${passed} of ${allChecks} automated checks passed.</p>
  <table><tr><th>Product</th><th>Price</th><th>Books unlocked</th><th>Puzzle played</th><th>Checks</th></tr>
  ${results.map(r => { const ok = r.checks.filter(c => c.ok).length; return `<tr><td>${esc(r.product.name)}</td><td>$${r.product.price}</td><td>${esc(r.product.books.map(bookTitle).join(', '))}</td><td>${esc(r.book)} #${r.puzzle.n} (${esc(r.puzzle.type)}${r.puzzle.variant ? ', ' + esc(r.puzzle.variant) : ''})</td><td class="${ok === r.checks.length ? 'ok' : 'bad'}">${ok}/${r.checks.length}</td></tr>`; }).join('')}
  </table>
  <p class="small" style="margin-top:8pt">The license keys visible in the screenshots belong to the orders used for these captures. All screenshots, the saved PDFs and every check result are included as separate files.</p>
</section>

${results.map((r, i) => `<section class="page">
  <div class="kicker">4.${i + 1}</div>
  <h2>${esc(r.product.name)} · $${r.product.price}</h2>
  <div class="grid4">
    ${fig(r, '04-buy-box-after-agreeing', 'Buy box with the terms checkbox ticked.')}
    ${fig(r, '06-order-confirmation-top', 'Order confirmation with the license key.')}
    ${fig(r, '10-library', 'Library after unlocking.')}
    ${fig(r, '13-puzzle-solved', r.book + ' #' + r.puzzle.n + ' played in the browser.')}
  </div>
  <ul class="checks">${r.checks.map(c => `<li><span class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'}</span> ${esc(c.label)}</li>`).join('')}</ul>
</section>`).join('\n')}

<section class="page">
  <div class="kicker">5</div>
  <h2>Delivery records</h2>
  <p>Every delivery is recorded automatically on the order’s payment in Stripe. When the order confirmation page shows the key, the server saves the time, IP address and browser of that first view, then counts later views. When the key is unlocked, it does the same for the unlock. These records are kept with the payment, so they can be produced for any order, for example in a dispute. The Privacy Policy and Delivery Policy tell buyers about them.</p>
  <p>The records for the order in section 3, as written during this walkthrough (IP addresses shortened here):</p>
  <table><tr><th>Field on the Stripe payment</th><th>Meaning</th><th>Value</th></tr>
  ${RECORD_FIELDS.filter(([k]) => main.records[k]).map(([k, label]) => `<tr><td class="key" style="font-size:8.4pt">${esc(k)}</td><td>${esc(label)}</td><td style="overflow-wrap:anywhere">${esc(shownValue(k, main.records[k]))}</td></tr>`).join('')}
  </table>
  <p class="small" style="margin-top:8pt">The records for every order used in this kit are in capture-log.json.</p>
</section>

<section class="page">
  <div class="kicker">6</div>
  <h2>Replacement keys</h2>
  <p>The order confirmation page asks buyers to keep a copy of their key (copy, PDF or print). On any device where the key has been entered, the library page lists it with a Copy key button.</p>
  <p>If a buyer loses their key, they contact us through the Contact page (${esc(url('contact/'))}) with their order number. We find the order in Stripe, where the key is saved on the payment, and send the same key again. This is stated in the Delivery Policy and on every order confirmation page.</p>
  <div class="kicker" style="margin-top:22pt">7</div>
  <h2>Refunds</h2>
  <p>Every purchase can be refunded in full if the buyer asks within 14 days, with no reason needed (${esc(url('refunds/'))}). Buyers ask through the Contact page with their order number. We issue the refund through Stripe to the original payment method within 5 business days; the provider may take a few more days to show it.</p>
  <p>Buyers agree to the Refund Policy, together with the Terms of Service, by ticking the box on the product page before the buy button turns on.</p>
</section>

<section class="page">
  <div class="kicker">8</div>
  <h2>Reviewer access</h2>
  <p>One working license key for each product, so you can open every product exactly as a buyer would. Each key below was entered on the live Unlock page on ${esc(dateLong)} and opened the books listed. These keys are not linked to an order, so their use is not recorded.</p>
  <ol class="flow">
    <li>Open <strong>${esc(url('unlock/'))}</strong></li>
    <li>Type or paste a key and select <strong>Unlock</strong>.</li>
    <li>Select <strong>Open my library</strong> and open a book to play.</li>
  </ol>
  <table><tr><th>Product</th><th>Reviewer key</th><th>Opens</th><th>Verified</th></tr>
  ${reviewers.map(r => `<tr><td>${esc(r.product.name)}</td><td class="key">${esc(r.key)}</td><td>${esc(r.product.books.map(bookTitle).join(', '))}</td><td class="${r.check.ok ? 'ok' : 'bad'}">${r.check.ok ? 'Yes' : 'No'}</td></tr>`).join('')}
  </table>
  <p class="small" style="margin-top:8pt">Keys are saved in the browser you use; you can enter several keys one after another. To see the order confirmation page a buyer is sent to after payment, open any address in section 2.</p>
</section>
</body></html>`;
}

/* -------------------------------------------------------------------- main */

(async () => {
  const t0 = Date.now();
  console.log('Fulfillment kit for ' + BASE);
  const stop = msg => { console.error(msg); process.exit(1); };
  if (!L.secret()) stop('LICENSE_SECRET is not set. Put the same value as on Vercel into .env.local (see "Delivery records" in the README).');
  if (!S.configured()) stop('STRIPE_SECRET_KEY is not set. Put the same key the live site uses into .env.local (see "Delivery records" in the README).');

  const liveCat = await liveCatalog();
  const orders = await findOrders(liveCat);
  const missingLinks = products.filter(p => !(liveCat.byId(p.id) || {}).checkoutUrl);
  const noOrder = products.filter(p => (liveCat.byId(p.id) || {}).checkoutUrl && !orders[p.id]);
  const shown = products.filter(p => orders[p.id]);
  if (missingLinks.length) console.log('  No payment link on the live site: ' + missingLinks.map(p => p.id).join(', '));
  if (noOrder.length) console.log('  No completed order yet: ' + noOrder.map(p => p.id).join(', '));
  if (!shown.length) stop('No product has a completed order to show. Buy at least one product through the live site, then run the kit again.');

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(PDFIMG, { recursive: true });
  const browser = await chromium.launch({ channel: CHANNEL, headless: true });
  const results = [];
  try {
    for (const p of shown) {
      process.stdout.write('  ' + p.name + ' ... ');
      const r = await captureProduct(browser, p, products.indexOf(p), orders[p.id], liveCat.byId(p.id).checkoutUrl);
      results.push(r);
      console.log(r.checks.filter(c => c.ok).length + '/' + r.checks.length + ' checks');
    }

    console.log('  Reviewer keys ...');
    const reviewers = [];
    for (const p of products) {
      const key = issue(p.id, 1)[0];
      const check = await verifyReviewerKey(browser, p, key);
      reviewers.push({ product: p, key, check });
      console.log('    ' + p.id.padEnd(26) + key + (check.ok ? '  ok' : '  FAILED ' + (check.error || check.books.join(', '))));
    }

    console.log('  Screen recording ...');
    const videoProduct = orders[VIDEO_PRODUCT] ? catalog.byId(VIDEO_PRODUCT) : shown[0];
    const video = await recordVideo(browser, videoProduct, orders[videoProduct.id]);

    console.log('  Overview PDF ...');
    const htmlFile = path.join(OUT, '.overview.html');
    fs.writeFileSync(htmlFile, overviewHtml(results, reviewers, video));
    const pdfContext = await browser.newContext();
    await pdfContext.route('https://kit.render/overview/**', async route => {
      const f = path.join(OUT, decodeURIComponent(new URL(route.request().url()).pathname.slice('/overview/'.length)));
      if (!f.startsWith(OUT) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
      const type = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png' }[path.extname(f)] || 'application/octet-stream';
      return route.fulfill({ contentType: type, body: fs.readFileSync(f) });
    });
    const page = await pdfContext.newPage();
    await page.goto('https://kit.render/overview/.overview.html', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const broken = await page.evaluate(() => Array.from(document.images).filter(i => !i.naturalWidth).map(i => i.getAttribute('src')));
    if (broken.length) throw new Error('Overview images did not load: ' + broken.join(', '));
    await page.pdf({ path: path.join(OUT, 'Fulfillment-Overview.pdf'), format: 'Letter', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:7.5pt;color:#888;width:100%;padding:0 0.6in;display:flex;justify-content:space-between;font-family:Arial"><span>Gridlock Puzzle Co. · Fulfillment overview · ' + dateLong + '</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>' });
    await pdfContext.close();

    fs.writeFileSync(path.join(OUT, 'Business-and-Fulfillment-Summary.txt'), summaryText() + '\n');
    fs.writeFileSync(path.join(OUT, 'reviewer-keys.txt'), reviewerText(reviewers) + '\n');
    fs.writeFileSync(path.join(OUT, 'READ-ME-FIRST.txt'), readmeText(results, missingLinks, noOrder) + '\n');
    fs.writeFileSync(path.join(OUT, 'capture-log.json'), JSON.stringify({
      site: BASE, generated: today.toISOString(), browser: CHANNEL,
      notShown: { noPaymentLink: missingLinks.map(p => p.id), noOrder: noOrder.map(p => p.id) },
      products: results.map(r => ({ id: r.product.id, order: r.order, issuedKey: r.key, confirmationTime: r.time, puzzle: r.puzzle, checks: r.checks, stripeRecords: r.records, screenshots: r.shots })),
      reviewerKeys: reviewers.map(r => ({ id: r.product.id, key: r.key, verified: r.check })),
      video: { file: rel(video.file), product: video.productId, puzzleSolved: video.solved },
    }, null, 2));
    fs.rmSync(htmlFile, { force: true });
    fs.rmSync(PDFIMG, { recursive: true, force: true });

    const all = results.flatMap(r => r.checks);
    const failed = all.filter(c => !c.ok).length + reviewers.filter(r => !r.check.ok).length + (video.solved ? 0 : 1);
    console.log('Done in ' + Math.round((Date.now() - t0) / 1000) + 's: ' + shown.length + ' of ' + products.length + ' products, ' +
      (all.length - all.filter(c => !c.ok).length) + '/' + all.length + ' checks passed, ' +
      reviewers.filter(r => r.check.ok).length + '/' + reviewers.length + ' reviewer keys verified.');
    console.log('Kit: ' + OUT);
    if (!supportEmail) console.log('Note: supportEmail is empty in src/js/site-config.js; see READ-ME-FIRST.txt.');
    process.exitCode = failed ? 1 : 0;
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
