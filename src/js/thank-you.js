/* Thank-you page: issues a license key in the browser and reveals it like a split-flap board. */
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
  var openBtn = root.querySelector('[data-open]');
  var copied = root.querySelector('[data-copied]');

  // Keep the same key if this tab is refreshed; a new visit issues a new key.
  var storeKey = 'gridlock.issued.' + product.id;
  var key = null;
  try { key = sessionStorage.getItem(storeKey); } catch (e) { key = null; }
  if (!key || !license.parse(key).ok) {
    key = license.generate(product.code);
    try { sessionStorage.setItem(storeKey, key); } catch (e) { /* not kept across refresh */ }
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  board.innerHTML = '';
  var tiles = [];
  var seg = null;
  key.split('').forEach(function (ch, i) {
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
  }
  if (reduce) done();
  else {
    var A = license.ALPHABET;
    tiles.forEach(function (t, i) {
      var flips = 0;
      var start = i * 70;
      setTimeout(function spin() {
        if (flips < 5) {
          t.inner.textContent = A[Math.floor(Math.random() * A.length)];
          flips++;
          setTimeout(spin, 45);
        } else {
          t.inner.textContent = t.ch;
          t.el.classList.add('flip');
          if (i === tiles.length - 1) setTimeout(done, 450);
        }
      }, start);
    });
  }

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

  saveBtn.addEventListener('click', function () {
    var text = 'Gridlock Puzzle Co.\r\n' + product.name + '\r\n\r\nLicense key: ' + key + '\r\n\r\n' +
      'Enter this key on the Unlock page of the Gridlock Puzzle Co. website to open your puzzles on any device.\r\n';
    var blob = new Blob([text], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gridlock-license-key.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    copied.textContent = 'Saved as gridlock-license-key.txt.';
  });

  openBtn.addEventListener('click', function () {
    try { sessionStorage.setItem('gridlock.pendingKey', key); } catch (e) { /* the unlock page will ask for it */ }
  });
})();
