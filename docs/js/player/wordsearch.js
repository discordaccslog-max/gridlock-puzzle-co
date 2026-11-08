/* Word search player: drag, tap-tap, or keyboard selection. */
(function () {
  var G = window.Gridlock;
  var NS = 'http://www.w3.org/2000/svg';

  G.types.wordsearch = function (boardCol, side, p, saved, ctx) {
    var n = p.size;
    var found = {};
    if (saved && saved.f) saved.f.forEach(function (w) { found[w] = true; });
    var anchor = -1, focusIdx = 0, locked = false;

    var board = G.el('div', { class: 'board ws', role: 'grid', 'aria-label': 'Word search grid, ' + n + ' by ' + n, style: '--n:' + n + ';touch-action:none' });
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'marks'); svg.setAttribute('viewBox', '0 0 ' + n + ' ' + n); svg.setAttribute('aria-hidden', 'true');
    board.appendChild(svg);
    var preview = document.createElementNS(NS, 'line');
    preview.setAttribute('stroke-width', '0.72'); preview.style.stroke = 'var(--red-soft)'; preview.style.opacity = '0';
    svg.appendChild(preview);
    var cells = [];
    for (var r = 0; r < n; r++) {
      var row = G.el('div', { role: 'row', style: 'display:contents' });
      for (var c = 0; c < n; c++) {
        var cell = G.el('div', { class: 'cell', role: 'gridcell', tabindex: '-1', 'data-i': r * n + c, 'aria-label': p.grid[r][c] + ', row ' + (r + 1) + ', column ' + (c + 1) }, p.grid[r][c]);
        row.appendChild(cell); cells.push(cell);
      }
      board.appendChild(row);
    }
    cells[0].setAttribute('tabindex', '0');
    boardCol.appendChild(board);

    var listPanel = G.el('div', { class: 'panel' });
    listPanel.appendChild(G.el('h3', null, 'Find these words'));
    var ul = G.el('ul', { class: 'wordlist' });
    p.words.forEach(function (w) { var li = G.el('li', { 'data-w': w.word }, G.esc(w.word)); ul.appendChild(li); });
    listPanel.appendChild(ul);
    var progress = G.el('p', { class: 'muted', style: 'margin:10px 0 0' });
    listPanel.appendChild(progress);
    side.appendChild(listPanel);
    side.appendChild(G.el('div', { class: 'panel' }, '<h3>How to select</h3><p>Drag from the first letter to the last, or tap the first letter and then the last. Keyboard: arrows to move, <kbd>Enter</kbd> on the first and last letters.</p>'));

    function lineFor(w) {
      var l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', w.c + 0.5); l.setAttribute('y1', w.r + 0.5);
      l.setAttribute('x2', w.c + w.dc * (w.word.length - 1) + 0.5); l.setAttribute('y2', w.r + w.dr * (w.word.length - 1) + 0.5);
      l.setAttribute('stroke-width', '0.72'); l.setAttribute('class', 'found');
      return l;
    }
    function render() {
      svg.querySelectorAll('line.found').forEach(function (l) { l.remove(); });
      var count = 0;
      p.words.forEach(function (w) {
        var li = ul.querySelector('[data-w="' + w.word + '"]');
        var isFound = !!found[w.word];
        li.classList.toggle('found', isFound);
        if (isFound) { svg.appendChild(lineFor(w)); count++; }
      });
      cells.forEach(function (cell, i) { cell.classList.toggle('anchor', i === anchor); });
      progress.textContent = count + ' of ' + p.words.length + ' found';
    }
    function rc(i) { return [Math.floor(i / n), i % n]; }
    function tryMatch(a, b) {
      var A = rc(a), B = rc(b);
      var dr = Math.sign(B[0] - A[0]), dc = Math.sign(B[1] - A[1]);
      var len = Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])) + 1;
      if (!(A[0] === B[0] || A[1] === B[1] || Math.abs(B[0] - A[0]) === Math.abs(B[1] - A[1]))) return null;
      for (var k = 0; k < p.words.length; k++) {
        var w = p.words[k];
        if (w.word.length !== len) continue;
        var er = w.r + w.dr * (len - 1), ec = w.c + w.dc * (len - 1);
        if ((w.r === A[0] && w.c === A[1] && er === B[0] && ec === B[1]) || (w.r === B[0] && w.c === B[1] && er === A[0] && ec === A[1])) return w;
      }
      return { miss: true, dr: dr, dc: dc, len: len };
    }
    function finish(a, b) {
      if (locked) return;
      if (a === b) return;
      var m = tryMatch(a, b);
      if (!m) { ctx.status('Words run in straight lines: across, down or diagonally.', ''); return; }
      if (m.miss) { ctx.status('That is not one of the listed words.', ''); return; }
      if (found[m.word]) { ctx.status(m.word + ' is already found.', ''); return; }
      found[m.word] = true;
      render();
      var left = p.words.filter(function (w) { return !found[w.word]; }).length;
      ctx.status('Found ' + m.word + '. ' + (left ? left + ' to go.' : ''), 'good');
      ctx.changed();
    }
    function showPreview(a, b) {
      var A = rc(a), B = rc(b);
      preview.setAttribute('x1', A[1] + 0.5); preview.setAttribute('y1', A[0] + 0.5);
      preview.setAttribute('x2', B[1] + 0.5); preview.setAttribute('y2', B[0] + 0.5);
      preview.style.opacity = '1';
    }
    function cellFromPoint(x, y) {
      var t = document.elementFromPoint(x, y);
      var cell = t && t.closest ? t.closest('.ws .cell') : null;
      return cell && board.contains(cell) ? +cell.getAttribute('data-i') : -1;
    }

    var dragFrom = -1, dragged = false;
    board.addEventListener('pointerdown', function (e) {
      var i = cellFromPoint(e.clientX, e.clientY);
      if (i < 0 || locked) return;
      dragFrom = i; dragged = false;
      try { board.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
      setFocus(i);
    });
    board.addEventListener('pointermove', function (e) {
      if (dragFrom < 0) return;
      var i = cellFromPoint(e.clientX, e.clientY);
      if (i >= 0 && i !== dragFrom) { dragged = true; showPreview(dragFrom, i); }
    });
    board.addEventListener('pointerup', function (e) {
      if (dragFrom < 0) return;
      var i = cellFromPoint(e.clientX, e.clientY);
      preview.style.opacity = '0';
      if (dragged && i >= 0) { finish(dragFrom, i); anchor = -1; render(); }
      else if (i >= 0) {
        if (anchor < 0) { anchor = i; render(); ctx.status('Now tap the last letter of the word.', ''); }
        else { var a = anchor; anchor = -1; render(); finish(a, i); }
      }
      dragFrom = -1;
    });
    board.addEventListener('pointercancel', function () { dragFrom = -1; preview.style.opacity = '0'; });

    function setFocus(i) {
      cells[focusIdx].setAttribute('tabindex', '-1');
      focusIdx = i;
      cells[i].setAttribute('tabindex', '0');
      cells[i].focus({ preventScroll: true });
      if (anchor >= 0 && anchor !== i) showPreview(anchor, i); else preview.style.opacity = '0';
    }
    board.addEventListener('keydown', function (e) {
      var r0 = Math.floor(focusIdx / n), c0 = focusIdx % n;
      var moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (moves[e.key]) {
        var m = moves[e.key];
        var r1 = Math.min(n - 1, Math.max(0, r0 + m[0])), c1 = Math.min(n - 1, Math.max(0, c0 + m[1]));
        setFocus(r1 * n + c1); e.preventDefault(); return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (anchor < 0) { anchor = focusIdx; render(); ctx.status('First letter marked. Move to the last letter and press Enter.', ''); }
        else { var a = anchor; anchor = -1; preview.style.opacity = '0'; render(); finish(a, focusIdx); }
        e.preventDefault();
      }
      if (e.key === 'Escape') { anchor = -1; preview.style.opacity = '0'; render(); }
    });
    render();

    return {
      getState: function () { return { f: Object.keys(found) }; },
      isEmpty: function () { return !Object.keys(found).length; },
      isSolved: function () { return p.words.every(function (w) { return found[w.word]; }); },
      checkEntry: function () {
        if (anchor >= 0) return { ok: true, msg: 'First letter is marked. Now choose the last letter.' };
        return { ok: true, msg: 'Every word you mark is checked straight away. Mark a first and last letter to try one.' };
      },
      checkAll: function () {
        var c = Object.keys(found).length;
        return { ok: true, msg: c + ' of ' + p.words.length + ' words found, all correct.' };
      },
      hint: function () {
        var left = p.words.filter(function (w) { return !found[w.word]; });
        if (!left.length) return { msg: 'All words are found.' };
        var w = left[Math.floor(Math.random() * left.length)];
        var cell = cells[w.r * n + w.c];
        cell.classList.remove('hint-flash'); void cell.offsetWidth; cell.classList.add('hint-flash');
        setFocus(w.r * n + w.c);
        return { msg: 'Hint: ' + w.word + ' starts at the flashing letter (row ' + (w.r + 1) + ', column ' + (w.c + 1) + ').' };
      },
      reveal: function () { p.words.forEach(function (w) { found[w.word] = true; }); render(); },
      reset: function () { found = {}; anchor = -1; locked = false; render(); },
      lock: function () { locked = true; },
      focus: function () { cells[focusIdx].focus({ preventScroll: true }); },
      printBody: function (withSolution) {
        return G.svg.wordsearch(p, { showSolution: withSolution }) + '<div class="pcols"><h2>Words</h2>' + p.words.map(function (w) { return '<p>' + w.word + '</p>'; }).join('') + '</div>';
      },
    };
  };
})();
