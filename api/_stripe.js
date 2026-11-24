'use strict';
/*
 * Small helpers for the API: Stripe requests (plain fetch, no SDK), the buyer's IP address and
 * browser, product lookup by payment link, and JSON responses. STRIPE_SECRET_KEY is set in the
 * Vercel project settings.
 */
const catalog = require('../src/js/products.js');

const BASE = (process.env.STRIPE_API_BASE || 'https://api.stripe.com').replace(/\/$/, '');
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

function configured() { return !!(process.env.STRIPE_SECRET_KEY || '').trim(); }

function encode(params) {
  const out = [];
  (function add(obj, prefix) {
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      const name = prefix ? prefix + '[' + k + ']' : k;
      if (Array.isArray(v)) v.forEach(x => out.push(encodeURIComponent(name + '[]') + '=' + encodeURIComponent(x)));
      else if (typeof v === 'object') add(v, name);
      else out.push(encodeURIComponent(name) + '=' + encodeURIComponent(String(v)));
    }
  })(params || {}, '');
  return out.join('&');
}

async function stripe(method, path, params) {
  const form = encode(params);
  const url = BASE + '/v1/' + path + (method === 'GET' && form ? '?' + form : '');
  const headers = { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY.trim() };
  if (method !== 'GET') headers['Content-Type'] = 'application/x-www-form-urlencoded';
  const res = await fetch(url, { method, headers, body: method === 'GET' ? undefined : form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || 'Stripe request failed (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Writes metadata onto a payment. An empty value would delete the field, so empty values are skipped.
function record(paymentIntentId, fields) {
  const metadata = {};
  for (const [k, v] of Object.entries(fields)) if (v !== '' && v != null) metadata[k] = String(v).slice(0, 500);
  return stripe('POST', 'payment_intents/' + encodeURIComponent(paymentIntentId), { metadata });
}

function clientIp(req) {
  const h = req.headers || {};
  const raw = h['x-vercel-forwarded-for'] || h['x-forwarded-for'] || h['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '';
  return String(raw).split(',')[0].trim();
}

function agent(req) { return String((req.headers || {})['user-agent'] || '').slice(0, 400); }

const normal = u => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/$/, ''); } catch (e) { return ''; } };

function productForLink(url) {
  const target = normal(url);
  return (target && catalog.products.find(p => p.checkoutUrl && normal(p.checkoutUrl) === target)) || null;
}

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(status).json(body);
}

module.exports = { catalog, configured, stripe, record, clientIp, agent, productForLink, send, SESSION_ID };
