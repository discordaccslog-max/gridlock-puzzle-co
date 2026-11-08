/*
 * License keys, entirely in the browser.
 * Format: GRID-<product code>-<5 random>-<5 random>-<4 check>, e.g. GRID-DG-7KQ4M-X9D2P-H6TR.
 * The alphabet leaves out characters that are easy to confuse (0, O, 1, I, L).
 * The check characters are calculated from the product code and the random section.
 * Unlocked keys are kept in this browser's localStorage only.
 */
(function (root) {
  var ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  var PREFIX = 'GRID';
  var STORE = 'gridlock.keys.v1';
  var BODY = 10;
  var CHECK = 4;

  function fnv(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    // final avalanche so neighbouring inputs produce unrelated check values
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }

  function checksum(code, body) {
    var n = fnv(PREFIX + '|' + code + '|' + body + '|gridlock-puzzle-co') % Math.pow(ALPHABET.length, CHECK);
    var out = '';
    for (var i = 0; i < CHECK; i++) { out = ALPHABET[n % ALPHABET.length] + out; n = Math.floor(n / ALPHABET.length); }
    return out;
  }

  function randomBody() {
    var out = '';
    var limit = 256 - (256 % ALPHABET.length);
    var buf = new Uint8Array(32);
    while (out.length < BODY) {
      root.crypto.getRandomValues(buf);
      for (var i = 0; i < buf.length && out.length < BODY; i++) if (buf[i] < limit) out += ALPHABET[buf[i] % ALPHABET.length];
    }
    return out;
  }

  function format(code, body, check) {
    return [PREFIX, code, body.slice(0, 5), body.slice(5), check].join('-');
  }

  function generate(code) {
    var body = randomBody();
    return format(code, body, checksum(code, body));
  }

  function products() { return root.GRIDLOCK_PRODUCTS; }

  // Returns { ok, key, product } or { ok: false, message }.
  function parse(input) {
    var raw = String(input || '').toUpperCase().replace(/[\s‐-―-]+/g, '');
    if (raw.indexOf(PREFIX) === 0) raw = raw.slice(PREFIX.length);
    if (!raw.length) return { ok: false, message: 'Type or paste your key to continue.' };
    var bad = raw.replace(new RegExp('[' + ALPHABET + ']', 'g'), '');
    if (bad.length) {
      if (/[0O1IL]/.test(bad)) return { ok: false, message: 'Keys never use 0, O, 1, I or L. Check for a similar-looking character, such as Q, D, 7 or J.' };
      return { ok: false, message: 'That key has a character that keys never contain. Keys use only letters and the digits 2 to 9.' };
    }
    if (raw.length !== 2 + BODY + CHECK) {
      return { ok: false, message: 'That key is ' + (raw.length < 2 + BODY + CHECK ? 'too short' : 'too long') + '. A key has 16 characters after GRID, for example GRID-DG-7KQ4M-X9D2P-H6TR.' };
    }
    var code = raw.slice(0, 2), body = raw.slice(2, 2 + BODY), check = raw.slice(2 + BODY);
    var product = products().byCode(code);
    if (!product) return { ok: false, message: 'The product code “' + code + '” is not one of ours. It is the two characters right after GRID.' };
    if (checksum(code, body) !== check) return { ok: false, message: 'That key does not check out. Compare it with the key on your order confirmation page; one character may be off.' };
    return { ok: true, key: format(code, body, check), product: product };
  }

  function read() {
    try { var v = JSON.parse(root.localStorage.getItem(STORE) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function save(list) {
    try { root.localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  // Saved keys are re-validated on every read, so edited storage cannot unlock anything.
  function savedKeys() {
    var out = [];
    read().forEach(function (entry) {
      var r = parse(entry && entry.key);
      if (r.ok) out.push({ key: r.key, product: r.product, added: entry.added });
    });
    return out;
  }

  function addKey(input) {
    var r = parse(input);
    if (!r.ok) return r;
    var list = read();
    var already = list.some(function (e) { return e && e.key === r.key; });
    if (!already) list.push({ key: r.key, added: new Date().toISOString() });
    r.stored = save(list);
    r.already = already;
    return r;
  }

  function unlockedBooks() {
    var set = {};
    savedKeys().forEach(function (k) { k.product.books.forEach(function (b) { set[b] = true; }); });
    return set;
  }

  function signOut() { try { root.localStorage.removeItem(STORE); } catch (e) { /* storage unavailable */ } }

  root.GRIDLOCK_LICENSE = {
    ALPHABET: ALPHABET, generate: generate, parse: parse, addKey: addKey, savedKeys: savedKeys,
    unlockedBooks: unlockedBooks, signOut: signOut, checksum: checksum, format: format,
  };
})(this);
