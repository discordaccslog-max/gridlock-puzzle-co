/* Unlock page: segmented key entry that auto-advances on typing or paste. */
(function () {
  var root = document.querySelector('[data-unlock]');
  if (!root) return;
  var license = window.GRIDLOCK_LICENSE, catalog = window.GRIDLOCK_PRODUCTS;
  var form = root.querySelector('form');
  var entry = root.querySelector('.key-entry');
  var inputs = Array.prototype.slice.call(root.querySelectorAll('.key-group input'));
  var err = root.querySelector('.key-error');
  var stage = root.querySelector('.unlock-stage');
  var result = root.querySelector('.unlock-result');
  var allowed = new RegExp('[^' + license.ALPHABET + ']', 'g');
  var badChar = new RegExp('[^' + license.ALPHABET + ']');

  function value() { return inputs.map(function (i) { return i.value; }).join(''); }
  function fill(text, from) {
    var raw = String(text).toUpperCase().replace(/[\s‐-―-]+/g, '');
    if (raw.indexOf('GRID') === 0) raw = raw.slice(4);
    var clean = raw.replace(allowed, '');
    var k = from || 0;
    for (var t = 0; t < clean.length && k < inputs.length; t++, k++) inputs[k].value = clean[t];
    (inputs[Math.min(k, inputs.length - 1)]).focus();
    if (clean.length < raw.length) showError('Some characters were left out: keys never use 0, O, 1, I or L.');
    else clearError();
  }
  function showError(msg) { err.textContent = msg; entry.classList.add('bad'); }
  function clearError() { err.textContent = ''; entry.classList.remove('bad'); }

  inputs.forEach(function (input, idx) {
    input.addEventListener('input', function () {
      var v = input.value.toUpperCase();
      if (v.length > 1) { input.value = ''; fill(v, idx); return; }
      if (v && badChar.test(v)) {
        input.value = '';
        showError(/[0O1IL]/.test(v) ? 'Keys never use 0, O, 1, I or L. Look for a similar character such as Q, D, 7 or J.' : 'Keys use only letters and the digits 2 to 9.');
        return;
      }
      input.value = v;
      clearError();
      if (v && idx < inputs.length - 1) inputs[idx + 1].focus();
      if (idx === inputs.length - 1 && v) root.querySelector('[type="submit"]').focus();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !input.value && idx > 0) { inputs[idx - 1].value = ''; inputs[idx - 1].focus(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && idx > 0) { inputs[idx - 1].focus(); e.preventDefault(); }
      else if (e.key === 'ArrowRight' && idx < inputs.length - 1) { inputs[idx + 1].focus(); e.preventDefault(); }
    });
    input.addEventListener('paste', function (e) {
      var text = (e.clipboardData || window.clipboardData).getData('text');
      e.preventDefault();
      fill(text, /^\s*GRID/i.test(text) || text.replace(/[^A-Z0-9]/gi, '').length >= 16 ? 0 : idx);
    });
    input.addEventListener('focus', function () { input.select(); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = license.addKey(value());
    if (!r.ok) { showError(r.message); stage.classList.remove('unlocked'); return; }
    clearError();
    entry.classList.add('good');
    var books = r.product.books.map(function (id) { return catalog.book(id); });
    result.innerHTML = '<h2>Unlocked</h2><p class="lede">' + (r.already ? 'This key was already saved on this device. ' : '') +
      (books.length > 1 ? 'Your key opens ' + books.length + ' books:' : 'Your key opens <strong>' + esc(books[0].title) + '</strong>.') + '</p>' +
      (books.length > 1 ? '<ul>' + books.map(function (b) { return '<li>' + esc(b.title) + '</li>'; }).join('') + '</ul>' : '') +
      (r.stored ? '' : '<p class="note">This browser is not allowing saved data, so the books will stay open only until you close this page.</p>') +
      '<p class="btn-row"><a class="btn red" href="../library/">Open my library</a><button type="button" class="btn ghost" data-another>Enter another key</button></p>';
    stage.classList.add('unlocked');
    result.setAttribute('tabindex', '-1');
    setTimeout(function () { result.focus(); }, 400);
    result.querySelector('[data-another]').addEventListener('click', function () {
      inputs.forEach(function (i) { i.value = ''; });
      entry.classList.remove('good');
      stage.classList.remove('unlocked');
      result.innerHTML = '';
      inputs[0].focus();
    });
  });

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // a key handed over from the thank-you page
  var pending = null;
  try { pending = sessionStorage.getItem('gridlock.pendingKey'); sessionStorage.removeItem('gridlock.pendingKey'); } catch (e) { pending = null; }
  if (pending) {
    fill(pending, 0);
    var note = root.querySelector('[data-pending-note]');
    if (note) note.hidden = false;
    setTimeout(function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); }, 700);
  }
})();
