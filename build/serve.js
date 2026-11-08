'use strict';
// Minimal static server for previewing docs/ locally under a project-style path:
//   node build/serve.js  ->  http://localhost:8080/gridlock-puzzle-co/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'docs');
const PREFIX = '/gridlock-puzzle-co';
const PORT = +process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/' || url === PREFIX) { res.writeHead(302, { Location: PREFIX + '/' }); return res.end(); }
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
