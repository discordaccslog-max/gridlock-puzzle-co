/* Shared behavior for every page: theme toggle, menu, buy buttons, contact details. */
(function () {
  var doc = document.documentElement;

  /* ---- theme ---- */
  function effectiveTheme() {
    var set = doc.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function labelToggle(btn) {
    var dark = effectiveTheme() === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
  }
  document.querySelectorAll('.theme-toggle').forEach(function (btn) {
    labelToggle(btn);
    btn.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      doc.setAttribute('data-theme', next);
      try { localStorage.setItem('gridlock.theme', next); } catch (e) { /* preference not saved */ }
      document.querySelectorAll('.theme-toggle').forEach(labelToggle);
    });
  });

  /* ---- mobile menu ---- */
  var menuBtn = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    });
  }

  /* ---- footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---- support email (only shown when configured) ---- */
  var cfg = window.GRIDLOCK_CONFIG || {};
  document.querySelectorAll('[data-support-email]').forEach(function (el) {
    var email = (cfg.supportEmail || '').trim();
    if (!email) { el.remove(); return; }
    var a = document.createElement('a');
    a.href = 'mailto:' + email;
    a.textContent = email;
    var slot = el.querySelector('[data-email-slot]') || el;
    slot.textContent = '';
    slot.appendChild(a);
    el.hidden = false;
  });

  /* ---- prices and buy buttons from products.js ---- */
  var catalog = window.GRIDLOCK_PRODUCTS;
  if (catalog) {
    document.querySelectorAll('[data-price]').forEach(function (el) {
      var p = catalog.byId(el.getAttribute('data-price'));
      if (p) el.textContent = catalog.formatPrice(p);
    });
    // The buy button and the terms checkbox appear together, and only once a checkout link is set.
    // The button stays disabled until the buyer agrees to the Terms of Service and Refund Policy.
    document.querySelectorAll('[data-buy]').forEach(function (el) {
      var p = catalog.byId(el.getAttribute('data-buy'));
      el.textContent = '';
      if (!p || !p.checkoutUrl) return;
      var r = el.getAttribute('data-root') || '';
      var id = 'agree-' + p.id;
      var waiting = 'Tick the box to agree to the Terms of Service and Refund Policy. The buy button turns on once you do.';
      var ready = 'Thank you. You can continue to checkout.';
      el.innerHTML =
        '<div class="agree"><input type="checkbox" id="' + id + '" aria-describedby="' + id + '-hint">' +
        '<label for="' + id + '">I agree to the <a href="' + r + 'terms/">Terms of Service</a> and <a href="' + r + 'refunds/">Refund Policy</a></label></div>' +
        '<a class="btn red buy-link" role="link" aria-disabled="true" aria-describedby="' + id + '-hint" rel="noopener"></a>' +
        '<p class="agree-hint" id="' + id + '-hint" aria-live="polite"></p>';
      var box = el.querySelector('input');
      var link = el.querySelector('.buy-link');
      var hint = el.querySelector('.agree-hint');
      link.textContent = 'Buy now · ' + catalog.formatPrice(p);
      function sync() {
        if (box.checked) {
          link.href = p.checkoutUrl;
          link.removeAttribute('aria-disabled');
          hint.textContent = ready;
          hint.classList.remove('nudge');
        } else {
          link.removeAttribute('href');
          link.setAttribute('aria-disabled', 'true');
          hint.textContent = waiting;
        }
      }
      box.addEventListener('change', sync);
      link.addEventListener('click', function (e) {
        if (box.checked) return;
        e.preventDefault();
        hint.classList.remove('nudge'); void hint.offsetWidth; hint.classList.add('nudge');
        box.focus();
      });
      sync();
    });
  }

  /* ---- keep the background grid aligned with the content column ---- */
  function alignGrid() {
    var wrap = document.querySelector('.wrap');
    if (!wrap) return;
    var cell = parseFloat(getComputedStyle(doc).getPropertyValue('--cell')) || 28;
    var left = wrap.getBoundingClientRect().left;
    doc.style.setProperty('--grid-x', (left % cell) + 'px');
  }
  alignGrid();
  window.addEventListener('resize', alignGrid);
})();
