/*
 * Thank-you page: the order confirmation. Issues a license key in the browser, reveals it like a
 * split-flap board, and shows the order details: product, date and time, and the order reference
 * if the payment provider added one to the URL. "Save confirmation" downloads a PDF made in the
 * browser; nothing is sent anywhere.
 */
(function () {
  var root = document.querySelector('[data-thank-you]');
  if (!root) return;
  var catalog = window.GRIDLOCK_PRODUCTS, license = window.GRIDLOCK_LICENSE;
  var product = catalog.byId(root.getAttribute('data-thank-you'));
  var board = root.querySelector('.flapboard');
  var plain = root.querySelector('[data-key-plain]');
  var live = root.querySelector('[data-key-live]');
  var copyBtn = root.querySelector('[data-copy]');
  var saveBtn = root.querySelector('[data-save]');
  var printBtn = root.querySelector('[data-print]');
  var openBtn = root.querySelector('[data-open]');
  var copied = root.querySelector('[data-copied]');

  // Keep the same key and time if this tab is refreshed; a new visit issues a new key.
  var storeKey = 'gridlock.issued.' + product.id;
  var timeKey = 'gridlock.issued-at.' + product.id;
  var key = null, issuedAt = null;
  try { key = sessionStorage.getItem(storeKey); issuedAt = Number(sessionStorage.getItem(timeKey)) || null; } catch (e) { key = null; }
  if (!key || !license.parse(key).ok) {
    key = license.generate(product.code);
    issuedAt = Date.now();
    try { sessionStorage.setItem(storeKey, key); sessionStorage.setItem(timeKey, String(issuedAt)); } catch (e) { /* not kept across refresh */ }
  }
  if (!issuedAt) issuedAt = Date.now();

  /* ---------- order details ---------- */
  var when = new Date(issuedAt).toLocaleString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  root.querySelector('[data-order-time]').textContent = when;

  // Payment providers add their own reference to the return URL under different names.
  var REF_PARAMS = ['session_id', 'order_id', 'order', 'transaction_id', 'txn_id', 'token'];
  var params = new URLSearchParams(location.search);
  var orderRef = '';
  for (var i = 0; i < REF_PARAMS.length && !orderRef; i++) {
    var v = params.get(REF_PARAMS[i]);
    if (v) orderRef = v.replace(/[^A-Za-z0-9_.:\-]/g, '').slice(0, 120);
  }
  if (orderRef) {
    root.querySelector('[data-order-ref]').textContent = orderRef;
    root.querySelector('[data-order-ref-row]').hidden = false;
  }

  /* ---------- key reveal ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  board.innerHTML = '';
  var tiles = [];
  var seg = null;
  key.split('').forEach(function (ch) {
    if (ch === '-') { board.appendChild(Object.assign(document.createElement('span'), { className: 'dash', textContent: '-' })); seg = null; return; }
    if (!seg) { seg = document.createElement('span'); seg.className = 'seg'; board.appendChild(seg); }
    var tile = document.createElement('span');
    tile.className = 'ch';
    tile.setAttribute('aria-hidden', 'true');
    tile.style.setProperty('--i', String(tiles.length));
    var inner = document.createElement('span');
    inner.textContent = reduce ? ch : '';
    tile.appendChild(inner);
    seg.appendChild(tile);
    tiles.push({ el: tile, inner: inner, ch: ch });
  });

  function done() {
    plain.textContent = key;
    live.textContent = 'Your license key is ' + key.split('').join(' ') + '.';
    copyBtn.disabled = false; saveBtn.disabled = false; openBtn.removeAttribute('aria-disabled');
    root.setAttribute('data-key-ready', 'true');
  }
  if (reduce) done();
  else {
    var A = license.ALPHABET;
    tiles.forEach(function (t, idx) {
      var flips = 0;
      setTimeout(function spin() {
        if (flips < 5) {
          t.inner.textContent = A[Math.floor(Math.random() * A.length)];
          flips++;
          setTimeout(spin, 45);
        } else {
          t.inner.textContent = t.ch;
          t.el.classList.add('flip');
          if (idx === tiles.length - 1) setTimeout(done, 450);
        }
      }, idx * 70);
    });
  }

  /* ---------- actions ---------- */
  copyBtn.addEventListener('click', function () {
    var ok = function () { copied.textContent = 'Copied to your clipboard.'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(key).then(ok, fallback);
    else fallback();
    function fallback() {
      var r = document.createRange();
      r.selectNodeContents(plain);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      copied.textContent = 'Key selected. Press Ctrl+C or Cmd+C to copy it.';
    }
  });

  var abs = function (rel) { return new URL(rel, location.href).href; };

  function confirmationLines() {
    var books = product.books.map(function (id) { return catalog.book(id).title; });
    var lines = [
      { t: 'Gridlock Puzzle Co.', size: 20, bold: true },
      { t: 'Order confirmation', size: 14, bold: true, gap: 4 },
      { t: 'Order complete. Your purchase has been delivered as the license key below. Nothing is shipped.', gap: 12 },
      { t: 'Product: ' + product.name },
      { t: 'Date and time: ' + when },
    ];
    if (orderRef) lines.push({ t: 'Order reference: ' + orderRef });
    lines.push({ t: 'Delivery: digital, license key shown on the order confirmation page', gap: 10 });
    lines.push({ t: 'License key: ' + key, size: 13, bold: true, gap: 14 });
    lines.push({ t: 'This key opens: ' + books.join(', '), gap: 14 });
    lines.push({ t: 'How to open your puzzles', bold: true, size: 12 });
    lines.push({ t: '1. Go to the Unlock page and enter the key: ' + abs('../../unlock/') });
    lines.push({ t: '2. Your puzzle books appear in your library: ' + abs('../../library/') });
    lines.push({ t: '3. Open a book and play in your web browser. Any puzzle can also be printed.' });
    lines.push({ t: '4. To play on another device, enter the same key on that device.', gap: 14 });
    lines.push({ t: 'Lost your key? Contact us through the Contact page with your order number for a replacement: ' + abs('../../contact/'), gap: 14 });
    lines.push({ t: 'Policies', bold: true, size: 12 });
    lines.push({ t: 'Terms of Service: ' + abs('../../terms/') });
    lines.push({ t: 'Refund Policy: ' + abs('../../refunds/') });
    lines.push({ t: 'Delivery Policy: ' + abs('../../delivery/') });
    return lines;
  }

  saveBtn.addEventListener('click', function () {
    var blob = makePdf(confirmationLines());
    var name = 'gridlock-order-confirmation-' + product.id + '.pdf';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    copied.textContent = 'Saved as ' + name + '.';
  });

  printBtn.addEventListener('click', function () { window.print(); });

  openBtn.addEventListener('click', function () {
    try { sessionStorage.setItem('gridlock.pendingKey', key); } catch (e) { /* the unlock page will ask for it */ }
  });

  /* ---------- a small text-only PDF, written by hand ---------- */
  function ascii(s) {
    return String(s).replace(/[   ]/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-')
      .replace(/·/g, '-').replace(/…/g, '...').replace(/×/g, 'x').replace(/[^\x20-\x7e]/g, '');
  }
  function esc(s) { return ascii(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function wrap(text, size) {
    var max = Math.floor(500 / (size * 0.52));
    var words = ascii(text).split(' '), out = [], line = '';
    words.forEach(function (w) {
      while (w.length > max) { if (line) { out.push(line); line = ''; } out.push(w.slice(0, max)); w = w.slice(max); }
      if ((line + ' ' + w).trim().length > max) { out.push(line); line = w; } else line = (line ? line + ' ' : '') + w;
    });
    if (line) out.push(line);
    return out;
  }
  function makePdf(blocks) {
    var pages = [[]], y = 760;
    blocks.forEach(function (b) {
      var size = b.size || 10.5, lead = size * 1.4;
      wrap(b.t, size).forEach(function (ln) {
        if (y < 60) { pages.push([]); y = 760; }
        pages[pages.length - 1].push('BT /' + (b.bold ? 'F2' : 'F1') + ' ' + size + ' Tf 50 ' + y.toFixed(1) + ' Td (' + esc(ln) + ') Tj ET');
        y -= lead;
      });
      y -= b.gap || 2;
    });
    var objs = [];
    var pageIds = pages.map(function (_, k) { return 5 + k * 2; });
    objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[2] = '<< /Type /Pages /Kids [' + pageIds.map(function (n) { return n + ' 0 R'; }).join(' ') + '] /Count ' + pages.length + ' >>';
    objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    pages.forEach(function (ops, k) {
      var stream = ops.join('\n');
      objs[5 + k * 2] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (6 + k * 2) + ' 0 R >>';
      objs[6 + k * 2] = '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream';
    });
    var out = '%PDF-1.4\n', offsets = [];
    for (var n = 1; n < objs.length; n++) { offsets[n] = out.length; out += n + ' 0 obj\n' + objs[n] + '\nendobj\n'; }
    var xref = out.length;
    out += 'xref\n0 ' + objs.length + '\n0000000000 65535 f \n';
    for (var m = 1; m < objs.length; m++) out += ('0000000000' + offsets[m]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + objs.length + ' /Root 1 0 R /Info << /Title (Gridlock Puzzle Co. order confirmation) >> >>\nstartxref\n' + xref + '\n%%EOF\n';
    return new Blob([out], { type: 'application/pdf' });
  }
})();
