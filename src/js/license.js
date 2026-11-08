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

  /*
   * Administrator keys (product code AD) open every book. Only SHA-256 hashes of these keys are
   * stored here, so they cannot be worked out from this file. Create a new one with
   * `node build/admin-key.js`; remove a hash from the list to revoke that key.
   */
  var ADMIN_CODE = 'AD';
  var ADMIN_HASHES = ['264618500c6edef557caaee8b73bca31e0e47748cbea5d3d7501aefb32d4adfd'];

  function sha256(ascii) {
    var K = [], H = [], primes = [];
    for (var n = 2; primes.length < 64; n++) {
      var isPrime = true;
      for (var j = 0; j < primes.length; j++) if (n % primes[j] === 0) { isPrime = false; break; }
      if (isPrime) primes.push(n);
    }
    var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) >>> 0; };
    for (var p = 0; p < 64; p++) { K[p] = frac(Math.pow(primes[p], 1 / 3)); if (p < 8) H[p] = frac(Math.sqrt(primes[p])); }
    var bytes = [];
    for (var c = 0; c < ascii.length; c++) bytes.push(ascii.charCodeAt(c) & 0xff);
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (var s = 7; s >= 0; s--) bytes.push(s >= 4 ? 0 : (bitLen >>> (s * 8)) & 0xff);
    var rotr = function (x, r) { return (x >>> r) | (x << (32 - r)); };
    for (var off = 0; off < bytes.length; off += 64) {
      var w = [];
      for (var t = 0; t < 64; t++) {
        if (t < 16) w[t] = (bytes[off + t * 4] << 24) | (bytes[off + t * 4 + 1] << 16) | (bytes[off + t * 4 + 2] << 8) | bytes[off + t * 4 + 3];
        else {
          var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
          var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
          w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
        }
      }
      var a = H[0], b = H[1], cc = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (var r = 0; r < 64; r++) {
        var t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[r] + w[r]) | 0;
        var t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & cc) ^ (b & cc))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = cc; cc = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + cc) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  function adminProduct() {
    return { id: 'admin', code: ADMIN_CODE, name: 'Administrator access (every book)', shortName: 'Administrator access', tier: 'admin',
      books: products().books.map(function (b) { return b.id; }) };
  }

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
    if (code === ADMIN_CODE) {
      var adminKey = format(code, body, check);
      if (ADMIN_HASHES.indexOf(sha256(adminKey)) >= 0) return { ok: true, key: adminKey, product: adminProduct() };
      return { ok: false, message: 'That key does not check out. Compare it with the key on your order confirmation page; one character may be off.' };
    }
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
