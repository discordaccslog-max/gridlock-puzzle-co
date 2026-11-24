'use strict';
/*
 * GET /api/order/?session_id=cs_...  (called by the order confirmation page)
 * Confirms the Stripe Checkout Session is paid, works out the product from its payment link,
 * returns the license key for that order, and records the delivery on the Stripe payment:
 * time, IP address and browser of the first view, plus a view count and the latest view.
 */
const L = require('./_license');
const S = require('./_stripe');

module.exports = async function order(req, res) {
  if (req.method !== 'GET') return S.send(res, 405, { ok: false, code: 'method', message: 'Use GET.' });
  const sessionId = String((req.query && req.query.session_id) || '').trim();
  if (!S.SESSION_ID.test(sessionId)) return S.send(res, 400, { ok: false, code: 'no-order', message: 'This address does not contain a valid order reference.' });
  const sec = L.secret();
  if (!sec || !S.configured()) return S.send(res, 503, { ok: false, code: 'not-configured', message: 'Order confirmation is not available right now. Please try again shortly.' });

  try {
    let session;
    try {
      session = await S.stripe('GET', 'checkout/sessions/' + encodeURIComponent(sessionId), { expand: ['payment_intent'] });
    } catch (e) {
      if (e.status === 404) return S.send(res, 404, { ok: false, code: 'unknown-order', message: 'We could not find this order with our payment provider.' });
      throw e;
    }
    if (session.status !== 'complete' || !['paid', 'no_payment_required'].includes(session.payment_status)) {
      return S.send(res, 402, { ok: false, code: 'unpaid', message: 'Your payment has not completed yet. Your key appears here as soon as it does, so please try again in a minute.' });
    }
    const link = session.payment_link ? await S.stripe('GET', 'payment_links/' + encodeURIComponent(session.payment_link)) : null;
    const product = link && S.productForLink(link.url);
    if (!product) return S.send(res, 409, { ok: false, code: 'unknown-product', message: 'This order is not for one of our puzzle books.' });

    const key = L.forOrder(sec, product.code, session.id);
    const pi = session.payment_intent && typeof session.payment_intent === 'object' ? session.payment_intent : null;
    const now = new Date().toISOString();
    let deliveredAt = now, recorded = false;
    if (pi) {
      const m = pi.metadata || {};
      const ip = S.clientIp(req);
      const fields = { gridlock_key: key, gridlock_product: product.id, gridlock_views: (+m.gridlock_views || 0) + 1, gridlock_last_view_at: now, gridlock_last_view_ip: ip };
      if (m.gridlock_delivered_at) deliveredAt = m.gridlock_delivered_at;
      else Object.assign(fields, { gridlock_delivered_at: now, gridlock_delivered_ip: ip, gridlock_delivered_agent: S.agent(req) });
      try { await S.record(pi.id, fields); recorded = true; } catch (e) { console.error('Could not record delivery on', pi.id, e.message); }
    } else {
      console.warn('No payment to record delivery on for', session.id);
    }
    return S.send(res, 200, { ok: true, key, product: product.id, order: session.id, purchasedAt: new Date(session.created * 1000).toISOString(), deliveredAt, recorded });
  } catch (e) {
    console.error('Order lookup failed for', sessionId, e.status || '', e.message);
    return S.send(res, 502, { ok: false, code: 'lookup-failed', message: 'We could not reach our payment provider to confirm your order. Please try again in a moment.' });
  }
};
