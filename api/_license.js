'use strict';
/*
 * License keys signed with a server secret (LICENSE_SECRET). Used by the API and by
 * build/issue-key.js. A key is GRID-<product code>-<7 body>-<7 check> characters, shown in
 * groups of 5-5-4 (GRID-DG-7KQ4M-X9D2P-H6TR). The check characters are an HMAC of the code and
 * body, so only the server can make or verify a key. A key for an order uses a body derived from
 * the Stripe Checkout Session ID, so the same order always gets the same key.
 */
const crypto = require('crypto');

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const BODY = 7;
const CHECK = 7;
const LIMIT = 256 - (256 % ALPHABET.length);

function secret() {
  const s = (process.env.LICENSE_SECRET || '').trim();
  return s.length >= 32 ? s : null;
}

// n alphabet characters from an HMAC stream, without modulo bias
function chars(sec, label, n) {
  let out = '';
  for (let i = 0; out.length < n; i++) {
    const buf = crypto.createHmac('sha256', sec).update(label + '|' + i).digest();
    for (const b of buf) {
      if (b < LIMIT) out += ALPHABET[b % ALPHABET.length];
      if (out.length === n) break;
    }
  }
  return out;
}

function randomBody() {
  let out = '';
  while (out.length < BODY) {
    for (const b of crypto.randomBytes(16)) if (b < LIMIT && out.length < BODY) out += ALPHABET[b % ALPHABET.length];
  }
  return out;
}

function format(code, body, check) {
  const s = body + check;
  return ['GRID', code, s.slice(0, 5), s.slice(5, 10), s.slice(10)].join('-');
}

function split(input) {
  let raw = String(input || '').toUpperCase().replace(/[\s‐-―-]+/g, '');
  if (raw.startsWith('GRID')) raw = raw.slice(4);
  if (raw.length !== 2 + BODY + CHECK || !new RegExp('^[' + ALPHABET + ']+$').test(raw)) return null;
  return { code: raw.slice(0, 2), body: raw.slice(2, 2 + BODY), check: raw.slice(2 + BODY) };
}

const sign = (sec, code, body) => chars(sec, 'check:' + code + ':' + body, CHECK);

function forOrder(sec, code, orderId) {
  const body = chars(sec, 'order:' + orderId, BODY);
  return format(code, body, sign(sec, code, body));
}

function issue(sec, code) {
  const body = randomBody();
  return format(code, body, sign(sec, code, body));
}

// Returns { key, code } for a genuine key, or null.
function verify(sec, input) {
  const k = split(input);
  if (!k) return null;
  const expected = Buffer.from(sign(sec, k.code, k.body));
  const given = Buffer.from(k.check);
  if (!crypto.timingSafeEqual(expected, given)) return null;
  return { key: format(k.code, k.body, k.check), code: k.code };
}

module.exports = { ALPHABET, secret, forOrder, issue, verify, split, format };
