'use strict';
/*
 * Creates an administrator license key that opens every book.
 *   node build/admin-key.js
 * The key is printed once and never written to disk; only its SHA-256 hash is added to
 * ADMIN_HASHES in src/js/license.js. Rebuild and deploy afterwards. To revoke a key, delete its
 * hash from that list and deploy again.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const pick = n => Array.from({ length: n }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
const key = ['GRID', 'AD', pick(5), pick(5), pick(4)].join('-');
const hash = crypto.createHash('sha256').update(key).digest('hex');

const file = path.join(__dirname, '..', 'src', 'js', 'license.js');
const src = fs.readFileSync(file, 'utf8');
const m = src.match(/var ADMIN_HASHES = \[([^\]]*)\];/);
if (!m) throw new Error('ADMIN_HASHES not found in src/js/license.js');
const hashes = m[1].split(',').map(s => s.trim()).filter(Boolean);
hashes.push("'" + hash + "'");
fs.writeFileSync(file, src.replace(m[0], 'var ADMIN_HASHES = [' + hashes.join(', ') + '];'));

console.log('Administrator key (shown once, store it somewhere safe):');
console.log('  ' + key);
console.log('Added its hash to src/js/license.js (' + hashes.length + ' admin key' + (hashes.length === 1 ? '' : 's') + ' active).');
console.log('Next: node build/site.js, then deploy.');
