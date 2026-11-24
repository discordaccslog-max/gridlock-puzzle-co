'use strict';
// Minimal server for previewing docs/ locally under a project-style path, with the api/
// functions mounted at /gridlock-puzzle-co/api/<name>/ (settings come from .env.local):
//   node build/serve.js  ->  http://localhost:8080/gridlock-puzzle-co/
const http = require('http');
const fs = require('fs');
const path = require('path');
require('./env');

const ROOT = path.join(__dirname, '..', 'docs');
const API = path.join(__dirname, '..', 'api');
const PREFIX = '/gridlock-puzzle-co';
const PORT = +process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/' || url === PREFIX) { res.writeHead(302, { Location: PREFIX + '/' }); return res.end(); }
  if (url.startsWith(PREFIX + '/api/')) return api(req, res, url.slice(PREFIX.length + 5).replace(/\/$/, ''));
  if (!url.startsWith(PREFIX + '/')) url = '/__missing__';
  let file = path.join(ROOT, url.slice(PREFIX.length));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('Serving docs/ at http://localhost:' + PORT + PREFIX + '/'));

// Runs an api/ function with the small part of Vercel's request and response helpers it uses.
function api(req, res, name) {
  const file = path.join(API, name + '.js');
  if (!/^[a-z-]+$/.test(name) || !fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"ok":false}'); }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    const raw = Buffer.concat(chunks).toString();
    req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
    try { req.body = /json/.test(req.headers['content-type'] || '') && raw ? JSON.parse(raw) : raw; } catch (e) { req.body = {}; }
    res.status = code => { res.statusCode = code; return res; };
    res.json = obj => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    try { await require(file)(req, res); } catch (e) { console.error(e); if (!res.headersSent) { res.statusCode = 500; res.end('{"ok":false}'); } }
  });
}
