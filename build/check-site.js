'use strict';
/*
 * Checks the built site in docs/:
 *  - every relative href and src in every HTML file resolves to a real file
 *  - every #fragment link points at an id that exists on the target page
 *  - no leftover placeholder text anywhere in the project
 * Run: node build/check-site.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs');
let problems = 0;

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules' && f !== '.git' && f !== 'fulfillment-kit' && f !== '.vercel') walk(p, out); }
    else out.push(p);
  }
  return out;
}

const htmlFiles = walk(OUT).filter(f => f.endsWith('.html'));
const idsCache = {};
function idsOf(file) {
  if (!idsCache[file]) {
    const html = fs.readFileSync(file, 'utf8');
    idsCache[file] = new Set(Array.from(html.matchAll(/\sid="([^"]+)"/g)).map(m => m[1]));
  }
  return idsCache[file];
}
function resolveTarget(fromFile, url, baseDir) {
  const clean = url.split('#')[0].split('?')[0];
  let target = clean ? path.resolve(baseDir || path.dirname(fromFile), clean) : fromFile;
  if (clean.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, 'index.html');
  return target;
}

let links = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  // the 404 page resolves links against the site root
  const baseDir = path.basename(file) === '404.html' ? OUT : null;
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const url = m[1];
    if (!url || /^(https?:|mailto:|data:|javascript:)/.test(url)) continue;
    links++;
    if (url.startsWith('#')) {
      const frag = url.slice(1);
      if (frag && !/^p=\d+$/.test(frag) && frag !== 'help' && !idsOf(file).has(frag)) { problems++; console.log('missing anchor', path.relative(OUT, file), url); }
      continue;
    }
    const target = resolveTarget(file, url, baseDir);
    if (!fs.existsSync(target)) { problems++; console.log('broken link', path.relative(OUT, file), '->', url); continue; }
    const frag = url.split('#')[1];
    if (frag && target.endsWith('.html') && !idsOf(target).has(frag)) { problems++; console.log('missing anchor', path.relative(OUT, file), url); }
  }
}

// links built by scripts: library -> play, play -> library/unlock/products, thank-you -> unlock
const scripted = [['library/index.html', '../play/'], ['play/index.html', '../library/'], ['play/index.html', '../unlock/'], ['thank-you/daily-grid/index.html', '../../unlock/']];
for (const [from, url] of scripted) {
  const target = resolveTarget(path.join(OUT, from), url);
  if (!fs.existsSync(target)) { problems++; console.log('broken scripted link', from, url); }
}
const products = require('../src/js/products');
for (const p of products.products) {
  for (const rel of [p.productPath, p.thankYouPath]) if (!fs.existsSync(path.join(OUT, rel, 'index.html'))) { problems++; console.log('missing page', rel); }
  for (const b of p.books) if (!fs.existsSync(path.join(OUT, 'data', b + '.json'))) { problems++; console.log('missing data', b); }
}

// placeholder text
const patterns = [/\bTODO\b/, /\bFIXME\b/, /lorem/i, /ipsum/i, /coming soon/i, /\bTBD\b/, /\bplaceholder text\b/i, /\[insert/i, /your-?email@/i, /example\.com/i, /\bXXX\b/];
const scanFiles = walk(ROOT).filter(f => /\.(html|css|js|json|txt|md|xml)$/.test(f) && !f.includes(path.join('build', 'check-site.js')) && !f.includes('verify-report') && !f.includes('gen-log'));
for (const f of scanFiles) {
  const text = fs.readFileSync(f, 'utf8');
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) { problems++; console.log('placeholder-like text', path.relative(ROOT, f), JSON.stringify(text.slice(Math.max(0, m.index - 30), m.index + 30))); }
  }
}
// thank-you pages must be noindex and not in the sitemap or linked from public pages
const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf8');
if (/thank-you/.test(sitemap)) { problems++; console.log('thank-you page in sitemap'); }
for (const file of htmlFiles) {
  const rel = path.relative(OUT, file).replace(/\\/g, '/');
  const html = fs.readFileSync(file, 'utf8');
  if (rel.startsWith('thank-you/') && !/name="robots" content="noindex/.test(html)) { problems++; console.log('thank-you page without noindex', rel); }
  if (!rel.startsWith('thank-you/') && /thank-you\//.test(html)) { problems++; console.log('public page links to a thank-you page', rel); }
  if (!/<title>[^<]{8,}<\/title>/.test(html)) { problems++; console.log('missing title', rel); }
  if (!/<meta name="description" content="[^"]{30,}">/.test(html)) { problems++; console.log('missing description', rel); }
}
const titles = htmlFiles.map(f => (fs.readFileSync(f, 'utf8').match(/<title>([^<]+)<\/title>/) || [])[1]);
const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dupTitles.length) { problems++; console.log('duplicate titles', dupTitles); }

console.log(htmlFiles.length, 'pages,', links, 'links checked,', scanFiles.length, 'files scanned');
if (problems) { console.log(problems, 'problems'); process.exit(1); }
console.log('site check passed');
