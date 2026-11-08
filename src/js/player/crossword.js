/* Crossword player for blocked-style grids of any size. */
(function () {
  var G = window.Gridlock;

  G.letterKeyboard = function (opts) {
    var kb = G.el('div', { class: 'lkb' + (opts.autoHide ? ' auto-hide' : ''), role: 'group', 'aria-label': 'Letter keyboard' });
    var rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    rows.forEach(function (letters, ri) {
      var row = G.el('div', { class: 'row r' + (ri + 1) });
      if (ri === 1) row.appendChild(G.el('span', { class: 'spacer' }));
      if (ri === 2 && opts.leftKey) row.appendChild(G.el('button', { type: 'button', class: 'wide', 'data-k': opts.leftKey[0] }, opts.leftKey[1]));
      letters.split('').forEach(function (ch) { row.appendChild(G.el('button', { type: 'button', 'data-k': ch, 'aria-label': ch }, ch)); });
      if (ri === 1) row.appendChild(G.el('span', { class: 'spacer' }));
      if (ri === 2) row.appendChild(G.el('button', { type: 'button', class: 'wide', 'data-k': 'Backspace', 'aria-label': 'Delete' }, '⌫'));
      kb.appendChild(row);
    });
    kb.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (b) opts.onKey(b.getAttribute('data-k'));
    });
    return kb;
  };

  G.types.crossword = function (boardCol, side, p, saved, ctx) {
    var n = p.size;
    var entries = p.across.map(function (e) { return Object.assign({ dir: 'across' }, e); })
      .concat(p.down.map(function (e) { return Object.assign({ dir: 'down' }, e); }));
    var acrossOf = {}, downOf = {};
    entries.forEach(function (e, k) {
      e.k = k;
      e.cells = [];
      for (var t = 0; t < e.len; t++) {
        var idx = e.dir === 'across' ? e.r * n + e.c + t : (e.r + t) * n + e.c;
        e.cells.push(idx);
        (e.dir === 'across' ? acrossOf : downOf)[idx] = k;
      }
    });
    var solution = p.grid.join('');
    var letters = solution.split('').map(function (ch) { return ch === '#' ? '#' : ''; });
    if (saved && saved.l && saved.l.length === n * n) saved.l.split('').forEach(function (ch, i) { if (letters[i] !== '#') letters[i] = ch === '.' ? '' : ch; });
    var wrong = {}, revealedCells = {};
    var locked = false;
    var first = entries[0].cells[0];
    var sel = first, dir = acrossOf[first] !== undefined ? 'across' : 'down';

    var bar = G.el('div', { class: 'clue-bar', 'aria-live': 'polite' });
    var board = G.el('div', { class: 'board xw', role: 'grid', 'aria-label': 'Crossword grid, ' + n + ' by ' + n, style: '--n:' + n });
    var cells = [];
    var numAt = {};
    entries.forEach(function (e) { numAt[e.cells[0]] = e.n; });
    for (var r = 0; r < n; r++) {
      var row = G.el('div', { role: 'row', style: 'display:contents' });
      for (var c = 0; c < n; c++) {
        var i = r * n + c;
        var block = solution[i] === '#';
        var cell = G.el('div', { class: 'cell' + (block ? ' block' : ''), role: 'gridcell', 'data-i': i });
        if (!block) {
          cell.setAttribute('tabindex', '-1');
          if (numAt[i]) cell.appendChild(G.el('span', { class: 'n', 'aria-hidden': 'true' }, String(numAt[i])));
          cell.appendChild(G.el('span', { class: 'v', 'aria-hidden': 'true' }));
        } else cell.setAttribute('aria-hidden', 'true');
        row.appendChild(cell);
        cells.push(cell);
      }
      board.appendChild(row);
    }
    boardCol.appendChild(bar);
    boardCol.appendChild(board);
    var kb = G.letterKeyboard({ onKey: key, leftKey: ['Space', 'A/D'] });
    boardCol.appendChild(kb);

    var hasTheme = entries.some(function (e) { return e.theme; });
    var lists = G.el('div', { class: 'clue-lists' });
    ['across', 'down'].forEach(function (d) {
      var sec = G.el('div');
      sec.appendChild(G.el('h3', null, d === 'across' ? 'Across' : 'Down'));
      var ol = G.el('ol');
      entries.filter(function (e) { return e.dir === d; }).forEach(function (e) {
        var li = G.el('li');
        var b = G.el('button', { type: 'button', 'data-k': e.k },
          '<span class="cn">' + e.n + '</span><span>' + (e.theme ? '<span class="star" aria-label="theme entry">★ </span>' : '') + G.esc(e.clue) + ' <span class="muted">' + G.esc(e.enumeration || '(' + e.len + ')') + '</span></span>');
        li.appendChild(b); ol.appendChild(li);
        e.btn = b;
      });
      sec.appendChild(ol);
      lists.appendChild(sec);
    });
    var panel = G.el('div', { class: 'panel' });
    panel.appendChild(lists);
    if (hasTheme) panel.appendChild(G.el('p', { class: 'theme-note' }, '★ marks the theme entries' + (p.title ? ' for “' + G.esc(p.title) + '”' : '') + '.'));
    side.appendChild(panel);

    function entryAt(i, d) { var k = (d === 'across' ? acrossOf : downOf)[i]; return k === undefined ? null : entries[k]; }
    function current() { return entryAt(sel, dir) || entryAt(sel, dir === 'across' ? 'down' : 'across'); }
    function render() {
      var e = current();
      if (e && e.dir !== dir) dir = e.dir;
      var inWord = {};
      if (e) e.cells.forEach(function (x) { inWord[x] = true; });
      for (var i = 0; i < n * n; i++) {
        if (solution[i] === '#') continue;
        var cell = cells[i];
        cell.querySelector('.v').textContent = letters[i];
        cell.classList.toggle('sel', i === sel);
        cell.classList.toggle('word', !!inWord[i] && i !== sel);
        cell.classList.toggle('wrong', !!wrong[i]);
        cell.classList.toggle('revealed', !!revealedCells[i]);
        cell.setAttribute('tabindex', i === sel ? '0' : '-1');
        var a = entryAt(i, 'across'), dn = entryAt(i, 'down');
        cell.setAttribute('aria-label', (a ? a.n + ' across' : '') + (a && dn ? ', ' : '') + (dn ? dn.n + ' down' : '') +
          ', ' + (letters[i] ? 'letter ' + letters[i] : 'empty') + (wrong[i] ? ', marked wrong' : ''));
      }
      var cross = entryAt(sel, dir === 'across' ? 'down' : 'across');
      entries.forEach(function (x) {
        x.btn.classList.toggle('active', x === e);
        x.btn.classList.toggle('cross', x === cross);
        x.btn.classList.toggle('done', x.cells.every(function (ci) { return !!letters[ci]; }));
      });
      if (e) {
        bar.innerHTML = '<span class="cn">' + e.n + (e.dir === 'across' ? 'A' : 'D') + '</span><span>' + (e.theme ? '★ ' : '') + G.esc(e.clue) + ' <span class="muted">' + G.esc(e.enumeration || '') + '</span></span>';
        var list = e.btn.closest('ol');
        var top = e.btn.offsetTop - list.offsetTop;
        if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - 30) list.scrollTop = top - 40;
      }
    }
    function focusSel() { cells[sel].focus({ preventScroll: true }); }
    function selectCell(i, toggle) {
      if (solution[i] === '#') return;
      if (toggle && i === sel && entryAt(i, 'across') && entryAt(i, 'down')) dir = dir === 'across' ? 'down' : 'across';
      sel = i;
      if (!entryAt(i, dir)) dir = dir === 'across' ? 'down' : 'across';
      render(); focusSel();
    }
    function selectEntry(e, firstEmpty) {
      dir = e.dir;
      var target = e.cells[0];
      if (firstEmpty) for (var t = 0; t < e.cells.length; t++) if (!letters[e.cells[t]]) { target = e.cells[t]; break; }
      sel = target; render(); focusSel();
    }
    function step(delta) {
      var e = current();
      var pos = e.cells.indexOf(sel);
      var np = pos + delta;
      if (np >= 0 && np < e.cells.length) { sel = e.cells[np]; }
    }
    function move(dr, dc) {
      var r0 = Math.floor(sel / n), c0 = sel % n;
      for (var k = 1; k < n; k++) {
        var r1 = r0 + dr * k, c1 = c0 + dc * k;
        if (r1 < 0 || c1 < 0 || r1 >= n || c1 >= n) return;
        var j = r1 * n + c1;
        if (solution[j] !== '#') {
          sel = j;
          var axis = dc ? 'across' : 'down';
          if (entryAt(j, axis)) dir = axis;
          render(); focusSel();
          return;
        }
      }
    }
    function nextEntry(delta) {
      var e = current();
      var k = (e.k + delta + entries.length) % entries.length;
      selectEntry(entries[k], true);
    }
    function key(k) {
      if (k === 'Space') { if (entryAt(sel, 'across') && entryAt(sel, 'down')) { dir = dir === 'across' ? 'down' : 'across'; render(); } focusSel(); return; }
      if (locked) return;
      if (k === 'Backspace') {
        if (letters[sel]) { letters[sel] = ''; delete wrong[sel]; }
        else { step(-1); letters[sel] = ''; delete wrong[sel]; }
        render(); focusSel(); ctx.changed(); return;
      }
      if (/^[A-Z]$/.test(k)) {
        letters[sel] = k; delete wrong[sel]; delete revealedCells[sel];
        var e = current();
        var pos = e.cells.indexOf(sel);
        if (pos < e.cells.length - 1) sel = e.cells[pos + 1];
        render(); focusSel(); ctx.changed();
      }
    }

    board.addEventListener('click', function (e) {
      var cell = e.target.closest('.cell');
      if (cell && !cell.classList.contains('block')) selectCell(+cell.getAttribute('data-i'), true);
    });
    board.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowLeft') { move(0, -1); e.preventDefault(); }
      else if (k === 'ArrowRight') { move(0, 1); e.preventDefault(); }
      else if (k === 'ArrowUp') { move(-1, 0); e.preventDefault(); }
      else if (k === 'ArrowDown') { move(1, 0); e.preventDefault(); }
      else if (k === 'Tab') { nextEntry(e.shiftKey ? -1 : 1); e.preventDefault(); }
      else if (k === ' ') { key('Space'); e.preventDefault(); }
      else if (k === 'Backspace' || k === 'Delete') { key('Backspace'); e.preventDefault(); }
      else if (/^[a-zA-Z]$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) { key(k.toUpperCase()); e.preventDefault(); }
    });
    lists.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]');
      if (b) selectEntry(entries[+b.getAttribute('data-k')], true);
    });
    render();

    function markWrong(list) {
      var bad = 0, empty = 0;
      list.forEach(function (i) {
        if (!letters[i]) empty++;
        else if (letters[i] !== solution[i]) { wrong[i] = true; bad++; }
        else delete wrong[i];
      });
      return { bad: bad, empty: empty };
    }
    function allCells() { var out = []; for (var i = 0; i < n * n; i++) if (solution[i] !== '#') out.push(i); return out; }
    return {
      getState: function () { return { l: letters.map(function (ch) { return ch === '#' ? '#' : (ch || '.'); }).join('') }; },
      isEmpty: function () { return letters.every(function (ch) { return ch === '#' || !ch; }); },
      isSolved: function () { return letters.every(function (ch, i) { return ch === solution[i]; }); },
      checkEntry: function () {
        var e = current();
        var res = markWrong(e.cells);
        render();
        var name = e.n + ' ' + e.dir;
        if (res.bad) return { ok: false, msg: name + ': ' + res.bad + (res.bad === 1 ? ' letter is' : ' letters are') + ' wrong.' };
        return { ok: true, msg: res.empty ? name + ': correct so far, ' + res.empty + ' to fill.' : name + ' is correct.' };
      },
      checkAll: function () {
        wrong = {};
        var res = markWrong(allCells());
        render();
        if (res.bad) return { ok: false, msg: res.bad + (res.bad === 1 ? ' letter is' : ' letters are') + ' wrong and marked.' };
        return { ok: true, msg: res.empty ? 'Everything so far is correct. ' + res.empty + ' squares to go.' : 'Everything is correct.' };
      },
      hint: function () {
        var e = current();
        var target = letters[sel] !== solution[sel] ? sel : -1;
        if (target < 0) e.cells.some(function (i) { if (letters[i] !== solution[i]) { target = i; return true; } return false; });
        if (target < 0) { var open = allCells().filter(function (i) { return letters[i] !== solution[i]; }); if (!open.length) return { msg: 'Nothing left to fill.' }; target = open[0]; }
        letters[target] = solution[target]; revealedCells[target] = true; delete wrong[target];
        sel = target; render(); focusSel();
        var a = entryAt(target, dir) || current();
        return { msg: 'Hint: revealed a letter in ' + a.n + ' ' + a.dir + '.' };
      },
      reveal: function () { allCells().forEach(function (i) { if (letters[i] !== solution[i]) revealedCells[i] = true; letters[i] = solution[i]; }); wrong = {}; render(); },
      reset: function () { letters = solution.split('').map(function (ch) { return ch === '#' ? '#' : ''; }); wrong = {}; revealedCells = {}; locked = false; render(); },
      lock: function () { locked = true; },
      focus: focusSel,
      printBody: function (withSolution) {
        var cl = function (d) {
          return '<h2>' + (d === 'across' ? 'Across' : 'Down') + '</h2>' + entries.filter(function (e) { return e.dir === d; }).map(function (e) {
            return '<p><strong>' + e.n + '</strong> ' + (e.theme ? '★ ' : '') + G.esc(e.clue) + ' ' + G.esc(e.enumeration || '') + (withSolution ? ' — <em>' + (e.display || e.answer) + '</em>' : '') + '</p>';
          }).join('');
        };
        return G.svg.crossword(p, { showSolution: withSolution }) + '<div class="pcols">' + cl('across') + cl('down') + '</div>';
      },
    };
  };
})();
