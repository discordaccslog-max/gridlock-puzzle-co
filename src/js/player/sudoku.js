/* Sudoku player: classic, killer, jigsaw, diagonal and even-odd. */
(function () {
  var G = window.Gridlock;
  var RULES = {
    classic: 'Fill each row, column and 3×3 box with 1–9.',
    killer: 'Fill each row, column and box with 1–9. Each dashed cage adds up to its number, with no repeats inside a cage.',
    jigsaw: 'Fill each row, column and bold irregular region with 1–9.',
    diagonal: 'Fill each row, column, box and both shaded diagonals with 1–9.',
    evenodd: 'Fill each row, column and box with 1–9. Shaded circles hold even digits only.',
  };

  G.types.sudoku = function (boardCol, side, p, saved, ctx) {
    var givens = p.givens.split('').map(Number);
    var sol = p.solution.split('').map(Number);
    var regions = p.regions ? p.regions.split('').map(Number) : givens.map(function (_, i) { return Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3); });
    var even = p.even ? p.even.split('').map(function (x) { return x === '1'; }) : null;
    var cageOf = new Array(81).fill(-1);
    if (p.cages) p.cages.forEach(function (cg, k) { cg[1].forEach(function (c) { cageOf[c] = k; }); });
    var vals = givens.slice();
    var notes = new Array(81).fill(0);
    if (saved && saved.v && saved.v.length === 81) {
      saved.v.split('').forEach(function (ch, i) { if (!givens[i]) vals[i] = +ch; });
      if (saved.n) notes = saved.n.slice(0, 81);
    }
    var sel = givens.indexOf(0);
    if (sel < 0) sel = 0;
    var noteMode = false, locked = false;
    var wrong = {};

    var board = G.el('div', { class: 'board sudoku' + (p.cages ? ' killer' : ''), role: 'grid', 'aria-label': (G.VARIANT_NAMES[p.variant] || 'Classic') + ' sudoku, 9 by 9' });
    var cells = [];
    for (var r = 0; r < 9; r++) {
      var row = G.el('div', { role: 'row', style: 'display:contents' });
      for (var c = 0; c < 9; c++) {
        var i = r * 9 + c;
        var cls = 'cell';
        if (c < 8 && regions[i] !== regions[i + 1]) cls += ' br';
        if (r < 8 && regions[i] !== regions[i + 9]) cls += ' bb';
        if (even && even[i]) cls += ' even';
        if (p.diagonal && (r === c || r + c === 8)) cls += ' diag';
        var cell = G.el('div', { class: cls, role: 'gridcell', tabindex: '-1', 'data-i': i });
        if (p.cages) {
          var k = cageOf[i];
          var same = function (j) { return j >= 0 && j < 81 && cageOf[j] === k; };
          var cc = 'cage';
          if (r > 0 && same(i - 9)) cc += ' t nt';
          if (r < 8 && same(i + 9)) cc += ' b nb';
          if (c > 0 && same(i - 1)) cc += ' l nl';
          if (c < 8 && same(i + 1)) cc += ' r nr';
          cell.appendChild(G.el('span', { class: cc, 'aria-hidden': 'true' }));
          if (Math.min.apply(null, p.cages[k][1]) === i) cell.appendChild(G.el('span', { class: 'sum', 'aria-hidden': 'true' }, String(p.cages[k][0])));
        }
        cell.appendChild(G.el('span', { class: 'v', 'aria-hidden': 'true' }));
        cell.appendChild(G.el('span', { class: 'notes', 'aria-hidden': 'true' }));
        row.appendChild(cell);
        cells.push(cell);
      }
      board.appendChild(row);
    }
    if (p.diagonal) {
      board.appendChild(G.el('div', { class: 'diag-lines', 'aria-hidden': 'true' },
        '<svg viewBox="0 0 9 9" preserveAspectRatio="none" width="100%" height="100%"><path d="M0 0L9 9M9 0L0 9" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" vector-effect="non-scaling-stroke" fill="none"/></svg>'));
    }
    boardCol.appendChild(board);

    var pad = G.el('div', { class: 'keypad', role: 'group', 'aria-label': 'Number pad' });
    for (var d = 1; d <= 9; d++) pad.appendChild(G.el('button', { type: 'button', 'data-d': d, 'aria-label': 'Enter ' + d }, String(d)));
    pad.appendChild(G.el('button', { type: 'button', class: 'wide', 'data-act': 'erase', 'aria-label': 'Erase square' }, 'Erase'));
    var noteBtn = G.el('button', { type: 'button', class: 'wide', 'data-act': 'notes', 'aria-pressed': 'false' }, 'Notes');
    pad.appendChild(noteBtn);
    boardCol.appendChild(pad);

    side.innerHTML = '<div class="panel"><h3>Rules</h3><p>' + RULES[p.variant] + '</p>' +
      '<p class="muted">Tap a square, then a number. Use Notes for pencil marks.</p></div>' +
      (p.techniques && p.techniques.length ? '<div class="panel"><h3>Techniques needed</h3><p>' + G.esc(p.techniques.join(', ')) + '</p></div>' : '');

    function peersOf(i) {
      var r0 = Math.floor(i / 9), c0 = i % 9, out = {};
      for (var j = 0; j < 81; j++) {
        var r1 = Math.floor(j / 9), c1 = j % 9;
        if (r1 === r0 || c1 === c0 || regions[j] === regions[i]) out[j] = true;
        if (p.diagonal && ((r0 === c0 && r1 === c1) || (r0 + c0 === 8 && r1 + c1 === 8))) out[j] = true;
        if (p.cages && cageOf[j] === cageOf[i]) out[j] = true;
      }
      return out;
    }
    function label(i) {
      var r1 = Math.floor(i / 9) + 1, c1 = i % 9 + 1;
      var s = 'Row ' + r1 + ', column ' + c1 + ', ';
      if (givens[i]) s += 'given ' + givens[i];
      else if (vals[i]) s += vals[i] + (wrong[i] ? ', marked wrong' : '');
      else if (notes[i]) { var list = []; for (var d1 = 1; d1 <= 9; d1++) if (notes[i] & (1 << d1)) list.push(d1); s += 'notes ' + list.join(' '); }
      else s += 'empty';
      if (p.cages) { var cg = p.cages[cageOf[i]]; s += ', cage of ' + cg[1].length + ' adding to ' + cg[0]; }
      if (even && even[i]) s += ', even only';
      return s;
    }
    function render() {
      var peers = peersOf(sel);
      var sv = vals[sel];
      var counts = new Array(10).fill(0);
      for (var i = 0; i < 81; i++) {
        var cell = cells[i];
        var v = vals[i];
        if (v) counts[v]++;
        cell.querySelector('.v').textContent = v ? String(v) : '';
        var nEl = cell.querySelector('.notes');
        if (!v && notes[i]) {
          var h = '';
          for (var d1 = 1; d1 <= 9; d1++) h += '<span>' + (notes[i] & (1 << d1) ? d1 : '') + '</span>';
          nEl.innerHTML = h;
        } else nEl.innerHTML = '';
        cell.classList.toggle('given', !!givens[i]);
        cell.classList.toggle('user', !givens[i] && !!v);
        cell.classList.toggle('sel', i === sel);
        cell.classList.toggle('peer', i !== sel && !!peers[i]);
        cell.classList.toggle('same', i !== sel && !!sv && v === sv);
        cell.classList.toggle('wrong', !!wrong[i]);
        cell.setAttribute('tabindex', i === sel ? '0' : '-1');
        cell.setAttribute('aria-selected', i === sel ? 'true' : 'false');
        cell.setAttribute('aria-label', label(i));
      }
      pad.querySelectorAll('button[data-d]').forEach(function (b) { b.classList.toggle('done', counts[+b.getAttribute('data-d')] >= 9); });
      noteBtn.setAttribute('aria-pressed', noteMode ? 'true' : 'false');
    }
    function select(i, focus) { sel = i; render(); if (focus) cells[i].focus(); }
    function enter(d, asNote) {
      if (locked || givens[sel]) return;
      if (asNote || noteMode) {
        if (vals[sel]) return;
        notes[sel] ^= (1 << d);
      } else {
        vals[sel] = vals[sel] === d ? 0 : d;
        delete wrong[sel];
        if (vals[sel]) {
          // clear this digit from pencil marks of peers
          var peers = peersOf(sel);
          Object.keys(peers).forEach(function (j) { notes[j] &= ~(1 << d); });
        }
      }
      render();
      ctx.changed();
    }
    function erase() {
      if (locked || givens[sel]) return;
      vals[sel] = 0; notes[sel] = 0; delete wrong[sel];
      render(); ctx.changed();
    }
    function nextEmpty(from, dir) {
      for (var k = 1; k < 81; k++) {
        var j = from + dir * k;
        if (j < 0 || j > 80) return -1;
        if (!vals[j]) return j;
      }
      return -1;
    }

    board.addEventListener('click', function (e) {
      var cell = e.target.closest('.cell');
      if (cell) select(+cell.getAttribute('data-i'), true);
    });
    board.addEventListener('keydown', function (e) {
      var k = e.key;
      var r0 = Math.floor(sel / 9), c0 = sel % 9;
      if (k === 'ArrowUp') { select(((r0 + 8) % 9) * 9 + c0, true); e.preventDefault(); return; }
      if (k === 'ArrowDown') { select(((r0 + 1) % 9) * 9 + c0, true); e.preventDefault(); return; }
      if (k === 'ArrowLeft') { select(r0 * 9 + (c0 + 8) % 9, true); e.preventDefault(); return; }
      if (k === 'ArrowRight') { select(r0 * 9 + (c0 + 1) % 9, true); e.preventDefault(); return; }
      if (k === 'Tab') {
        var j = nextEmpty(sel, e.shiftKey ? -1 : 1);
        if (j >= 0) { select(j, true); e.preventDefault(); }
        return;
      }
      if (k === 'Backspace' || k === 'Delete' || k === '0') { erase(); e.preventDefault(); return; }
      if (k === 'n' || k === 'N') { noteMode = !noteMode; render(); ctx.status(noteMode ? 'Notes on: digits go in as pencil marks.' : 'Notes off.'); e.preventDefault(); return; }
      var code = e.code && /^Digit[1-9]$/.test(e.code) ? +e.code.slice(5) : (/^[1-9]$/.test(k) ? +k : 0);
      if (code) { enter(code, e.shiftKey); e.preventDefault(); }
    });
    pad.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-d')) enter(+b.getAttribute('data-d'), false);
      else if (b.getAttribute('data-act') === 'erase') erase();
      else if (b.getAttribute('data-act') === 'notes') { noteMode = !noteMode; render(); ctx.status(noteMode ? 'Notes on: numbers go in as pencil marks.' : 'Notes off.'); }
    });
    render();

    function rc(i) { return 'row ' + (Math.floor(i / 9) + 1) + ', column ' + (i % 9 + 1); }
    return {
      getState: function () { return { v: vals.join(''), n: notes }; },
      isEmpty: function () { return vals.every(function (v, i) { return v === givens[i]; }) && notes.every(function (n) { return !n; }); },
      isSolved: function () { return vals.every(function (v, i) { return v === sol[i]; }); },
      checkEntry: function () {
        if (givens[sel]) return { ok: true, msg: 'That square is a starting digit.' };
        if (!vals[sel]) return { ok: false, msg: 'Select a filled square to check it.' };
        if (vals[sel] === sol[sel]) { delete wrong[sel]; render(); return { ok: true, msg: 'The ' + vals[sel] + ' at ' + rc(sel) + ' is correct.' }; }
        wrong[sel] = true; render();
        return { ok: false, msg: 'The ' + vals[sel] + ' at ' + rc(sel) + ' is not right.' };
      },
      checkAll: function () {
        var bad = 0, empty = 0;
        wrong = {};
        for (var i = 0; i < 81; i++) { if (!vals[i]) empty++; else if (vals[i] !== sol[i]) { wrong[i] = true; bad++; } }
        render();
        if (bad) return { ok: false, msg: bad + (bad === 1 ? ' square is' : ' squares are') + ' wrong and marked with a slash.' };
        return { ok: true, msg: empty ? 'Everything so far is correct. ' + empty + ' squares to go.' : 'Everything is correct.' };
      },
      hint: function () {
        var target = (!vals[sel] || vals[sel] !== sol[sel]) && !givens[sel] ? sel : -1;
        if (target < 0) {
          var open = [];
          for (var i = 0; i < 81; i++) if (vals[i] !== sol[i]) open.push(i);
          if (!open.length) return { msg: 'No squares left to fill.' };
          target = open[Math.floor(Math.random() * open.length)];
        }
        vals[target] = sol[target]; notes[target] = 0; delete wrong[target];
        select(target, true);
        return { msg: 'Hint: ' + rc(target) + ' is ' + sol[target] + '.' };
      },
      reveal: function () { vals = sol.slice(); wrong = {}; render(); },
      reset: function () { vals = givens.slice(); notes = new Array(81).fill(0); wrong = {}; locked = false; render(); },
      lock: function () { locked = true; },
      focus: function () { cells[sel].focus(); },
      printBody: function (withSolution) {
        return G.svg.sudoku(p, { showSolution: withSolution }) + '<p>' + RULES[p.variant] + '</p>';
      },
    };
  };
})();
