/* Cryptogram player, with or without word breaks. */
(function () {
  var G = window.Gridlock;

  G.types.cryptogram = function (boardCol, side, p, saved, ctx) {
    var unspaced = p.variant === 'unspaced';
    var key = {}; // cipher -> plain (truth)
    for (var i = 0; i < p.cipher.length; i++) if (/[A-Z]/.test(p.cipher[i])) key[p.cipher[i]] = p.plain[i];
    var guess = {};
    Object.keys(p.hints).forEach(function (c) { guess[c] = p.hints[c]; });
    if (saved && saved.g) Object.keys(saved.g).forEach(function (c) { if (!p.hints[c]) guess[c] = saved.g[c]; });
    var wrong = {}, locked = false;
    var slots = [];
    var sel = 0;

    var wrap = G.el('div', { class: 'crypto' + (unspaced ? ' unspaced' : ''), role: 'group', 'aria-label': 'Cryptogram' + (unspaced ? ' with no word breaks' : '') });
    var units = unspaced ? [p.cipher] : p.cipher.split(' ');
    units.forEach(function (word) {
      var w = G.el('div', { class: 'word' });
      word.split('').forEach(function (ch) {
        if (/[A-Z]/.test(ch)) {
          var s = G.el('div', { class: 'slot', role: 'button', tabindex: '-1', 'data-c': ch, 'data-k': slots.length },
            '<span class="p" aria-hidden="true"></span><span class="c" aria-hidden="true">' + ch + '</span>');
          slots.push(s);
          w.appendChild(s);
        } else w.appendChild(G.el('span', { class: 'punct', 'aria-hidden': 'true' }, G.esc(ch)));
      });
      wrap.appendChild(w);
    });
    boardCol.appendChild(wrap);
    while (sel < slots.length - 1 && p.hints[slots[sel].getAttribute('data-c')]) sel++;
    var kb = G.letterKeyboard({ onKey: function (k) { type(k); } });
    boardCol.appendChild(kb);

    var counts = {};
    slots.forEach(function (s) { var c = s.getAttribute('data-c'); counts[c] = (counts[c] || 0) + 1; });
    var freq = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var nHints = Object.keys(p.hints).length;
    side.innerHTML = '<div class="panel"><h3>How it works</h3><p>Every letter stands for a different letter, and none stands for itself. Choose a code letter and type your guess; it fills in everywhere that code letter appears.' +
      (unspaced ? ' Spaces and punctuation have been removed, so you also need to find the word breaks.' : '') + '</p>' +
      '<p class="muted">' + (nHints ? nHints + (nHints === 1 ? ' starting letter is' : ' starting letters are') + ' filled in.' : 'No starting letters: this one is solved from scratch.') + '</p></div>' +
      '<div class="panel"><h3>Code letter counts</h3><div class="freq">' + freq.map(function (c) { return '<span>' + c + ' ' + counts[c] + '</span>'; }).join('') + '</div></div>';

    var readable = G.el('div', { class: 'reveal-box', hidden: 'hidden' });
    side.insertBefore(readable, side.firstChild);
    function usedPlain() { var u = {}; Object.keys(guess).forEach(function (c) { if (guess[c]) u[guess[c]] = c; }); return u; }
    function render() {
      var cur = slots[sel] ? slots[sel].getAttribute('data-c') : null;
      slots.forEach(function (s, k) {
        var c = s.getAttribute('data-c');
        s.querySelector('.p').textContent = guess[c] || '';
        s.classList.toggle('given', !!p.hints[c]);
        s.classList.toggle('sel', k === sel);
        s.classList.toggle('same', k !== sel && c === cur);
        s.classList.toggle('wrong', !!wrong[c]);
        s.setAttribute('tabindex', k === sel ? '0' : '-1');
        s.setAttribute('aria-label', 'Code letter ' + c + ', ' + (guess[c] ? (p.hints[c] ? 'given as ' : 'your guess ') + guess[c] : 'no guess') + (wrong[c] ? ', marked wrong' : ''));
      });
      var done = Object.keys(key).every(function (x) { return guess[x] === key[x]; });
      readable.hidden = !done;
      if (done) readable.innerHTML = '<h3>The answer</h3><p style="margin:0">' + G.esc(p.text || p.plain) + '</p>';
      var u = usedPlain();
      kb.querySelectorAll('button[data-k]').forEach(function (b) { var k = b.getAttribute('data-k'); if (k.length === 1) b.classList.toggle('used', !!u[k]); });
    }
    function focusSel() { if (slots[sel]) slots[sel].focus({ preventScroll: false }); }
    function select(k) { sel = Math.max(0, Math.min(slots.length - 1, k)); render(); focusSel(); }
    function advance() {
      for (var t = 1; t < slots.length; t++) {
        var k = (sel + t) % slots.length;
        var c = slots[k].getAttribute('data-c');
        if (!guess[c]) { select(k); return; }
      }
      select(Math.min(slots.length - 1, sel + 1));
    }
    function type(k) {
      if (locked || !slots[sel]) return;
      var c = slots[sel].getAttribute('data-c');
      if (k === 'Backspace') {
        if (p.hints[c]) { ctx.status('That letter was given at the start.', ''); return; }
        delete guess[c]; delete wrong[c]; render(); ctx.changed(); return;
      }
      if (!/^[A-Z]$/.test(k)) return;
      if (p.hints[c]) { ctx.status('That letter was given at the start.', ''); advance(); return; }
      if (k === c) { ctx.status('No letter stands for itself, so ' + c + ' cannot be ' + k + '.', 'bad'); return; }
      var u = usedPlain();
      if (u[k] && u[k] !== c) {
        if (p.hints[u[k]]) { ctx.status(k + ' is already a starting letter.', 'bad'); return; }
        delete guess[u[k]]; delete wrong[u[k]];
        ctx.status('Moved ' + k + ' here from code letter ' + u[k] + '.', '');
      }
      guess[c] = k; delete wrong[c];
      render(); ctx.changed(); advance();
    }

    wrap.addEventListener('click', function (e) {
      var s = e.target.closest('.slot');
      if (s) select(+s.getAttribute('data-k'));
    });
    wrap.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || (k === 'Tab' && !e.shiftKey)) {
        if (k === 'Tab' && sel === slots.length - 1) return;
        select(sel + 1); e.preventDefault(); return;
      }
      if (k === 'ArrowLeft' || (k === 'Tab' && e.shiftKey)) {
        if (k === 'Tab' && sel === 0) return;
        select(sel - 1); e.preventDefault(); return;
      }
      if (k === 'Home') { select(0); e.preventDefault(); return; }
      if (k === 'End') { select(slots.length - 1); e.preventDefault(); return; }
      if (k === 'Backspace' || k === 'Delete') { type('Backspace'); e.preventDefault(); return; }
      if (/^[a-zA-Z]$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) { type(k.toUpperCase()); e.preventDefault(); }
    });
    render();

    return {
      getState: function () { var g = {}; Object.keys(guess).forEach(function (c) { if (!p.hints[c]) g[c] = guess[c]; }); return { g: g }; },
      isEmpty: function () { return Object.keys(guess).every(function (c) { return p.hints[c]; }); },
      isSolved: function () { return Object.keys(key).every(function (c) { return guess[c] === key[c]; }); },
      checkEntry: function () {
        var c = slots[sel].getAttribute('data-c');
        if (!guess[c]) return { ok: false, msg: 'Type a guess for code letter ' + c + ' first.' };
        if (guess[c] === key[c]) { delete wrong[c]; render(); return { ok: true, msg: 'Code letter ' + c + ' is ' + guess[c] + '. Correct.' }; }
        wrong[c] = true; render();
        return { ok: false, msg: 'Code letter ' + c + ' is not ' + guess[c] + '.' };
      },
      checkAll: function () {
        wrong = {};
        var bad = 0, open = 0;
        Object.keys(key).forEach(function (c) { if (!guess[c]) open++; else if (guess[c] !== key[c]) { wrong[c] = true; bad++; } });
        render();
        if (bad) return { ok: false, msg: bad + (bad === 1 ? ' letter is' : ' letters are') + ' wrong and crossed out.' };
        return { ok: true, msg: open ? 'Everything so far is correct. ' + open + ' code letters to go.' : 'Everything is correct.' };
      },
      hint: function () {
        var c = slots[sel].getAttribute('data-c');
        if (guess[c] === key[c]) {
          var open = Object.keys(key).filter(function (x) { return guess[x] !== key[x]; });
          if (!open.length) return { msg: 'Nothing left to solve.' };
          c = open[Math.floor(Math.random() * open.length)];
        }
        var u = usedPlain();
        if (u[key[c]] && u[key[c]] !== c) delete guess[u[key[c]]];
        guess[c] = key[c]; delete wrong[c];
        for (var k = 0; k < slots.length; k++) if (slots[k].getAttribute('data-c') === c) { sel = k; break; }
        render(); focusSel();
        return { msg: 'Hint: code letter ' + c + ' is ' + key[c] + '.' };
      },
      reveal: function () { Object.keys(key).forEach(function (c) { guess[c] = key[c]; }); wrong = {}; render(); },
      reset: function () { guess = {}; Object.keys(p.hints).forEach(function (c) { guess[c] = p.hints[c]; }); wrong = {}; locked = false; render(); },
      lock: function () { locked = true; },
      focus: focusSel,
      printBody: function (withSolution) {
        var hints = Object.keys(p.hints).map(function (c) { return c + ' = ' + p.hints[c]; }).join(', ');
        return G.svg.cryptogram(p, { showSolution: withSolution, width: 640 }) +
          '<p>' + (hints ? 'Starting letters: ' + hints + '.' : 'No starting letters.') + (unspaced ? ' Word breaks and punctuation have been removed.' : '') + '</p>' +
          (withSolution ? '<p><strong>Answer:</strong> ' + G.esc(p.text || p.plain) + '</p>' : '');
      },
    };
  };
})();
