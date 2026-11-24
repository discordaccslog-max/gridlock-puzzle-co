'use strict';
/*
 * One-time setup of LICENSE_SECRET, the secret the server signs license keys with.
 *   npm run setup-secret
 * Creates a random secret, saves it in .env.local (never committed) so build/issue-key.js and the
 * fulfillment kit can use it, and adds it to the Vercel project's production environment.
 * The secret is never printed. Redeploy afterwards so the site picks it up.
 * Changing the secret later makes every key issued so far stop working, so run this once.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const file = path.join(__dirname, '..', '.env.local');
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
let secret = (existing.match(/^LICENSE_SECRET="?([^"\r\n]+)"?/m) || [])[1];
if (secret) {
  console.log('.env.local already has LICENSE_SECRET; using it.');
} else {
  secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(file, (existing && !existing.endsWith('\n') ? existing + '\n' : existing) + 'LICENSE_SECRET="' + secret + '"\n');
  console.log('Saved a new LICENSE_SECRET in .env.local. Keep a copy somewhere safe.');
}

console.log('Adding LICENSE_SECRET to the Vercel project (production) ...');
const r = spawnSync('npx', ['--yes', 'vercel', 'env', 'add', 'LICENSE_SECRET', 'production'], { input: secret, stdio: ['pipe', 'inherit', 'inherit'], shell: true, cwd: path.join(__dirname, '..') });
if (r.status !== 0) {
  console.error('Vercel did not accept it. If LICENSE_SECRET already exists there, it must be the same value as in .env.local.');
  process.exit(1);
}
console.log('Done. Redeploy (npx vercel deploy --prod) so the site uses it.');
