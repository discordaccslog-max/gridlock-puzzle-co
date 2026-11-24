'use strict';
/*
 * POST /api/activate/  { key, session_id? }  (called by the Unlock page)
 * Checks the key's signature. When the key belongs to an order, records the unlock on the
 * Stripe payment: time, IP address and browser of the first unlock, plus an unlock count and
 * the latest unlock. The order is found from session_id when the buyer comes straight from the
 * confirmation page, otherwise by searching payments for the key.
 */
const L = require('./_license');
const S = require('./_stripe');

module.exports = async function activate(req, res) {
  if (req.method !== 'POST') return S.send(res, 405, { ok: false, code: 'method', message: 'Use POST.' });
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const sec = L.secret();
  if (!sec) return S.send(res, 503, { ok: false, code: 'not-configured', message: 'Keys cannot be checked right now. Please try again shortly.' });

  const v = L.verify(sec, body.key);
  if (!v) return S.send(res, 400, { ok: false, code: 'invalid', message: 'That key does not check out. Compare it with the key on your order confirmation page; one character may be off.' });
  const product = S.catalog.byCode(v.code);
  if (!product) return S.send(res, 400, { ok: false, code: 'invalid', message: 'The product code “' + v.code + '” is not one of ours. It is the two characters right after GRID.' });

  let recorded = false;
  if (S.configured()) {
    try {
      let pi = null;
      const sessionId = String(body.session_id || '');
      if (S.SESSION_ID.test(sessionId)) {
        const session = await S.stripe('GET', 'checkout/sessions/' + encodeURIComponent(sessionId), { expand: ['payment_intent'] }).catch(() => null);
        if (session && session.payment_intent && typeof session.payment_intent === 'object' && L.forOrder(sec, product.code, session.id) === v.key) pi = session.payment_intent;
      }
      if (!pi) {
        const found = await S.stripe('GET', 'payment_intents/search', { query: "metadata['gridlock_key']:'" + v.key + "'", limit: 1 });
        pi = (found.data && found.data[0]) || null;
      }
      if (pi) {
        const m = pi.metadata || {};
        const now = new Date().toISOString();
        const ip = S.clientIp(req);
        const fields = { gridlock_unlocks: (+m.gridlock_unlocks || 0) + 1, gridlock_last_unlock_at: now, gridlock_last_unlock_ip: ip };
        if (!m.gridlock_unlocked_at) Object.assign(fields, { gridlock_unlocked_at: now, gridlock_unlocked_ip: ip, gridlock_unlocked_agent: S.agent(req) });
        await S.record(pi.id, fields);
        recorded = true;
      }
    } catch (e) {
      console.error('Could not record unlock for', v.key.slice(0, 7), e.status || '', e.message);
    }
  }
  return S.send(res, 200, { ok: true, product: product.id, recorded });
};
