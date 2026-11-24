'use strict';
/*
 * Issues license keys that are not tied to an order, for example for reviewers.
 *   node build/issue-key.js daily-grid        one key for The Daily Grid
 *   node build/issue-key.js daily-grid 3      three keys
 *   node build/issue-key.js --list            product ids
 * Keys are signed with LICENSE_SECRET, read from the environment or .env.local, so it must be
 * the same value as on Vercel (see `npm run setup-secret`). Nothing is written to disk.
 * A buyer's own key never needs reissuing: it is saved on their Stripe payment as gridlock_key.
 */
require('./env');
const L = require('../api/_license');
const catalog = require('../src/js/products.js');

function issue(productId, count) {
  const sec = L.secret();
  if (!sec) throw new Error('LICENSE_SECRET is not set. Put the same value as on Vercel into .env.local; see "Delivery records" in the README.');
  const p = catalog.byId(productId);
  if (!p) throw new Error('Unknown product "' + productId + '". Run with --list to see product ids.');
  return Array.from({ length: count || 1 }, () => L.issue(sec, p.code));
}

module.exports = { issue, catalog };

if (require.main === module) {
  const [id, n] = process.argv.slice(2);
  if (!id || id === '--list') {
    console.log('Product ids:');
    catalog.products.forEach(p => console.log('  ' + p.id.padEnd(26) + p.name));
    process.exit(id ? 0 : 1);
  }
  const count = Math.max(1, Math.min(100, parseInt(n, 10) || 1));
  try {
    const keys = issue(id, count);
    console.log((count === 1 ? 'License key' : count + ' license keys') + ' for ' + catalog.byId(id).name + ':');
    keys.forEach(k => console.log('  ' + k));
    console.log('Enter it on the Unlock page.');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
