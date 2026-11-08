/* Library: the shelf of unlocked books on this device. */
(function () {
  var root = document.querySelector('[data-library]');
  if (!root) return;
  var license = window.GRIDLOCK_LICENSE, catalog = window.GRIDLOCK_PRODUCTS;
  var shelf = root.querySelector('[data-shelf]');
  var keysEl = root.querySelector('[data-keys]');
  var signOut = root.querySelector('[data-signout]');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function solvedCount(bookId) {
    try {
      var d = JSON.parse(localStorage.getItem('gridlock.progress.' + bookId) || '{}');
      return Object.keys(d).filter(function (k) { return d[k] && d[k].status === 'solved'; }).length;
    } catch (e) { return 0; }
  }

  function render() {
    var unlocked = license.unlockedBooks();
    var books = catalog.books.filter(function (b) { return unlocked[b.id]; });
    if (!books.length) {
      shelf.innerHTML = '<div class="shelf-empty"><h2>Your shelf is empty on this device</h2><p>Enter the license key from your order confirmation to put your books here. A key works on any number of your devices.</p>' +
        '<p class="btn-row"><a class="btn red" href="../unlock/">Enter a key</a><a class="btn ghost" href="../#books">See the books</a></p></div>';
      keysEl.innerHTML = '';
      signOut.hidden = true;
      return;
    }
    var coreN = 0;
    shelf.innerHTML = '<div class="shelf-wrap"><div class="shelf" role="list">' + books.map(function (b) {
      var cls = b.tier === 'expert' ? 'expert-spine' : 'core-' + (++coreN);
      var solved = solvedCount(b.id);
      return '<a role="listitem" class="spine ' + cls + (b.title.length > 22 ? ' long' : '') + '" href="../play/?book=' + b.id + '" aria-label="Open ' + esc(b.title) + (solved ? ', ' + solved + ' solved' : '') + '">' +
        '<span class="bands" aria-hidden="true"></span><span class="t" aria-hidden="true">' + esc(b.title) + '</span>' +
        '<span class="m" aria-hidden="true">' + (b.tier === 'expert' ? 'Expert' : 'Core') + (solved ? ' · ' + solved : '') + '</span></a>';
    }).join('') + '</div></div>';
    var keys = license.savedKeys();
    keysEl.innerHTML = '<ul class="saved-keys">' + keys.map(function (k) {
      return '<li><span><strong>' + esc(k.product.name) + '</strong><br><span class="key-plain">' + esc(k.key) + '</span></span>' +
        '<button type="button" class="btn ghost small" data-copy="' + esc(k.key) + '">Copy key</button></li>';
    }).join('') + '</ul>';
    signOut.hidden = false;
  }

  keysEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var key = b.getAttribute('data-copy');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(key).then(function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy key'; }, 1600); });
  });
  signOut.addEventListener('click', function () {
    if (!window.confirm('Sign out on this device? Your saved keys will be removed from this browser. Your puzzle progress stays here, and you can unlock again any time with your key.')) return;
    license.signOut();
    render();
    root.querySelector('[data-library-status]').textContent = 'Signed out. Your keys have been removed from this device.';
  });
  render();
})();
