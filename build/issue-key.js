'use strict';
/*
 * Issues license keys for a product, for example a replacement for a buyer who lost theirs.
 *   node build/issue-key.js daily-grid        one key for The Daily Grid
 *   node build/issue-key.js daily-grid 3      three keys
 *   node build/issue-key.js --list            product ids
 * Keys come from the same code the order confirmation page uses (src/js/license.js), so they
 * work on the Unlock page straight away. Nothing is written to disk.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadLicense() {
  const ctx = vm.createContext({ crypto: require('crypto').webcrypto });
  for (const f of ['products.js', 'license.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', f), 'utf8'), ctx, { filename: f });
  }
  return { catalog: ctx.GRIDLOCK_PRODUCTS, license: ctx.GRIDLOCK_LICENSE };
}

function issue(productId, count) {
  const { catalog, license } = loadLicense();
  const p = catalog.byId(productId);
  if (!p) throw new Error('Unknown product "' + productId + '". Run with --list to see product ids.');
  return Array.from({ length: count || 1 }, () => {
    const key = license.generate(p.code);
    if (!license.parse(key).ok) throw new Error('Generated key failed its own check: ' + key);
    return key;
  });
}

module.exports = { loadLicense, issue };

if (require.main === module) {
  const [id, n] = process.argv.slice(2);
  const { catalog } = loadLicense();
  if (!id || id === '--list') {
    console.log('Product ids:');
    catalog.products.forEach(p => console.log('  ' + p.id.padEnd(26) + p.name));
    process.exit(id ? 0 : 1);
  }
  const count = Math.max(1, Math.min(100, parseInt(n, 10) || 1));
  const p = catalog.byId(id);
  const keys = issue(id, count);
  console.log((count === 1 ? 'License key' : count + ' license keys') + ' for ' + (p ? p.name : id) + ':');
  keys.forEach(k => console.log('  ' + k));
  console.log('The buyer enters it on the Unlock page.');
}
