/* Logic grid player, including casebook stories. */
(function () {
  var G = window.Gridlock;

  G.types.logic = function (boardCol, side, p, saved, ctx) {
    var cats = p.categories, k = cats.length, n = cats[0].items.length;
    var L = G.svg.logicLayout(p);
    var marks = {}; // "a.i.b.j" -> 1 (x) or 2 (o)
    var struck = {};
    var autoX = true;
    if (saved) { marks = saved.m || {}; struck = saved.s || {}; if (saved.ax === false) autoX = false; }
    var wrong = {}, locked = false, revealedAll = false;
    var keyOf = function (a, i, b, j) { return a + '.' + i + '.' + b + '.' + j; };
    var truth = function (a, i, b, j) { return G.svg.logicTruth(p, a, i, b, j); };

    // grid coordinates: rows = blocks x n, cols = column categories x n
    var R = L.rows.length * n, C = L.cols.length * n;
    var cellAt = function (gr, gc) {
      var bi = Math.floor(gr / n), ci = Math.floor(gc / n);
      if (ci >= L.blocks[bi].length) return null;
      return { a: L.rows[bi], i: gr % n, b: L.cols[ci], j: gc % n, gr: gr, gc: gc };
    };
    var selR = 0, selC = 0;

    var table = G.el('table', { class: 'lg', role: 'grid', 'aria-label': 'Logic grid' });
    var thead = G.el('thead');
    var tr1 = G.el('tr'), tr2 = G.el('tr');
    tr1.appendChild(G.el('td', { class: 'empty', colspan: 2, rowspan: 1 }));
    tr2.appendChild(G.el('td', { class: 'empty', colspan: 2 }));
    L.cols.forEach(function (cat) {
      tr1.appendChild(G.el('th', { class: 'cat', colspan: n, scope: 'colgroup' }, G.esc(cats[cat].name)));
      cats[cat].labels.forEach(function (lab) { tr2.appendChild(G.el('th', { class: 'colh', scope: 'col' }, '<span>' + G.esc(lab) + '</span>')); });
    });
    thead.appendChild(tr1); thead.appendChild(tr2);
    table.appendChild(thead);
    var tbody = G.el('tbody');
    var tds = {};
    L.rows.forEach(function (cat, bi) {
      for (var i = 0; i < n; i++) {
        var tr = G.el('tr');
        if (i === 0) tr.appendChild(G.el('th', { class: 'catv', rowspan: n, scope: 'rowgroup' }, G.esc(cats[cat].name)));
        tr.appendChild(G.el('th', { class: 'rowh', scope: 'row' }, G.esc(cats[cat].labels[i])));
        L.blocks[bi].forEach(function (cat2, ci) {
          for (var j = 0; j < n; j++) {
            var gr = bi * n + i, gc = ci * n + j;
            var cls = [];
            if (j === 0) cls.push('gl');
            if (i === 0) cls.push('gt');
            if (j === n - 1) cls.push('gr');
            if (i === n - 1) cls.push('gb');
            var td = G.el('td', { class: cls.join(' '), role: 'gridcell', tabindex: '-1', 'data-r': gr, 'data-c': gc });
            tds[gr + ',' + gc] = td;
            tr.appendChild(td);
          }
        });
        var rest = (L.cols.length - L.blocks[bi].length) * n;
        if (rest) tr.appendChild(G.el('td', { class: 'empty', colspan: rest }));
        tbody.appendChild(tr);
      }
    });
    table.appendChild(tbody);
    var wrapDiv = G.el('div', { class: 'logic-wrap' });
    wrapDiv.appendChild(table);
    boardCol.appendChild(wrapDiv);

    var opts = G.el('div', { class: 'toolbar' });
    var axLabel = G.el('label', { style: 'display:flex;gap:8px;align-items:center;font-size:15px' }, '<input type="checkbox"' + (autoX ? ' checked' : '') + '> Auto-fill × when I place a ●');
    opts.appendChild(axLabel);
    boardCol.appendChild(opts);
    axLabel.querySelector('input').addEventListener('change', function (e) { autoX = e.target.checked; ctx.changed(); });

    // summary table of matches found so far
    var summary = G.el('div', { class: 'panel' });
    boardCol.appendChild(summary);

    // story, question, clues
    if (p.story) {
      side.appendChild(G.el('div', { class: 'story' }, p.story.map(function (para) { return '<p>' + G.esc(para) + '</p>'; }).join('') + '<p class="q">' + G.esc(p.question) + '</p>'));
    } else if (p.intro) {
      side.appendChild(G.el('div', { class: 'panel' }, '<p style="margin:0">' + G.esc(p.intro) + '</p>'));
    }
    var revealBox = G.el('div', { class: 'reveal-box', hidden: 'hidden' });
    if (p.reveal) side.appendChild(revealBox);
    var cluePanel = G.el('div', { class: 'panel' }, '<h3>Clues</h3>');
    var ol = G.el('ol', { class: 'clue-check' });
    p.clues.forEach(function (text, ci) {
      var li = G.el('li', null, '<input type="checkbox" aria-label="Mark clue ' + (ci + 1) + ' as used"' + (struck[ci] ? ' checked' : '') + '><span>' + G.esc(text) + '</span>');
      if (struck[ci]) li.classList.add('struck');
      ol.appendChild(li);
      li.querySelector('input').addEventListener('change', function (e) { struck[ci] = e.target.checked; li.classList.toggle('struck', e.target.checked); ctx.changed(); });
    });
    cluePanel.appendChild(ol);
    side.appendChild(cluePanel);

    function render() {
      for (var gr = 0; gr < R; gr++) for (var gc = 0; gc < C; gc++) {
        var cl = cellAt(gr, gc);
        if (!cl) continue;
        var td = tds[gr + ',' + gc];
        var m = marks[keyOf(cl.a, cl.i, cl.b, cl.j)] || 0;
        td.textContent = m === 1 ? '×' : m === 2 ? '●' : '';
        td.classList.toggle('x', m === 1);
        td.classList.toggle('o', m === 2);
        td.classList.toggle('wrong', !!wrong[keyOf(cl.a, cl.i, cl.b, cl.j)]);
        var isSel = gr === selR && gc === selC;
        td.classList.toggle('sel', isSel);
        td.classList.toggle('hl', !isSel && (gr === selR || gc === selC) && Math.floor(gr / n) === Math.floor(selR / n) && Math.floor(gc / n) === Math.floor(selC / n));
        td.setAttribute('tabindex', isSel ? '0' : '-1');
        td.setAttribute('aria-label', cats[cl.a].labels[cl.i] + ' and ' + cats[cl.b].labels[cl.j] + ': ' + (m === 1 ? 'crossed out' : m === 2 ? 'match' : 'blank') + (wrong[keyOf(cl.a, cl.i, cl.b, cl.j)] ? ', marked wrong' : ''));
      }
      // summary from category 0 rows
      var html = '<h3>Matches so far</h3><div class="table-scroll"><table class="answer-table"><thead><tr>' + cats.map(function (c) { return '<th scope="col">' + G.esc(c.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
      for (var e = 0; e < n; e++) {
        html += '<tr><th scope="row">' + G.esc(cats[0].labels[e]) + '</th>';
        for (var c = 1; c < k; c++) {
          var found = '';
          for (var j = 0; j < n; j++) if (marks[keyOf(0, e, c, j)] === 2) found = cats[c].labels[j];
          html += '<td>' + (found ? G.esc(found) : '<span class="muted">—</span>') + '</td>';
        }
        html += '</tr>';
      }
      summary.innerHTML = html + '</tbody></table></div>';
      if (p.reveal && (revealedAll || isSolved())) { revealBox.hidden = false; revealBox.innerHTML = '<p style="margin:0">' + G.esc(p.reveal) + '</p>'; }
      else revealBox.hidden = true;
    }
    function setMark(cl, m) {
      var key = keyOf(cl.a, cl.i, cl.b, cl.j);
      if (m) marks[key] = m; else delete marks[key];
      delete wrong[key];
      if (m === 2 && autoX) {
        for (var t = 0; t < n; t++) {
          if (t !== cl.j && !marks[keyOf(cl.a, cl.i, cl.b, t)]) marks[keyOf(cl.a, cl.i, cl.b, t)] = 1;
          if (t !== cl.i && !marks[keyOf(cl.a, t, cl.b, cl.j)]) marks[keyOf(cl.a, t, cl.b, cl.j)] = 1;
        }
      }
    }
    function act(m) {
      if (locked) return;
      var cl = cellAt(selR, selC);
      if (!cl) return;
      var cur = marks[keyOf(cl.a, cl.i, cl.b, cl.j)] || 0;
      setMark(cl, m === 'cycle' ? (cur + 1) % 3 : (cur === m ? 0 : m));
      render(); ctx.changed();
    }
    function select(gr, gc, focus) {
      if (!cellAt(gr, gc)) return;
      selR = gr; selC = gc; render();
      if (focus) tds[gr + ',' + gc].focus({ preventScroll: false });
    }
    table.addEventListener('click', function (e) {
      var td = e.target.closest('td[data-r]');
      if (!td) return;
      select(+td.getAttribute('data-r'), +td.getAttribute('data-c'), true);
      act('cycle');
    });
    table.addEventListener('keydown', function (e) {
      var dr = 0, dc = 0;
      if (e.key === 'ArrowUp') dr = -1; else if (e.key === 'ArrowDown') dr = 1; else if (e.key === 'ArrowLeft') dc = -1; else if (e.key === 'ArrowRight') dc = 1;
      if (dr || dc) {
        var r1 = selR + dr, c1 = selC + dc;
        while (r1 >= 0 && r1 < R && c1 >= 0 && c1 < C && !cellAt(r1, c1)) { r1 += dr; c1 += dc; }
        if (r1 >= 0 && r1 < R && c1 >= 0 && c1 < C) select(r1, c1, true);
        e.preventDefault(); return;
      }
      if (e.key === 'x' || e.key === 'X') { act(1); e.preventDefault(); }
      else if (e.key === 'o' || e.key === 'O' || e.key === '.') { act(2); e.preventDefault(); }
      else if (e.key === ' ' || e.key === 'Enter') { act('cycle'); e.preventDefault(); }
      else if (e.key === 'Backspace' || e.key === 'Delete') { act(0); e.preventDefault(); }
    });

    function allCells(fn) {
      for (var bi = 0; bi < L.rows.length; bi++) L.blocks[bi].forEach(function (b) {
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) fn(L.rows[bi], i, b, j);
      });
    }
    function isSolved() {
      var ok = true;
      allCells(function (a, i, b, j) {
        var m = marks[keyOf(a, i, b, j)] || 0;
        if (truth(a, i, b, j) ? m !== 2 : m === 2) ok = false;
      });
      return ok;
    }
    render();

    function solutionTable() {
      var html = '<table class="answer-table"><thead><tr>' + cats.map(function (c) { return '<th>' + G.esc(c.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
      for (var e = 0; e < n; e++) {
        html += '<tr>';
        for (var c = 0; c < k; c++) html += '<td>' + G.esc(cats[c].labels[p.solution[c][e]]) + '</td>';
        html += '</tr>';
      }
      return html + '</tbody></table>';
    }

    return {
      getState: function () { return { m: marks, s: struck, ax: autoX }; },
      isEmpty: function () { return !Object.keys(marks).length && !Object.keys(struck).some(function (x) { return struck[x]; }); },
      isSolved: isSolved,
      checkEntry: function () {
        var cl = cellAt(selR, selC);
        var key = keyOf(cl.a, cl.i, cl.b, cl.j);
        var m = marks[key] || 0;
        if (!m) return { ok: false, msg: 'Mark the selected square with × or ● first.' };
        var t = truth(cl.a, cl.i, cl.b, cl.j);
        var right = (m === 2) === t;
        if (right) { delete wrong[key]; render(); return { ok: true, msg: 'That mark is correct.' }; }
        wrong[key] = true; render();
        return { ok: false, msg: 'That mark is wrong.' };
      },
      checkAll: function () {
        wrong = {};
        var bad = 0, open = 0;
        allCells(function (a, i, b, j) {
          var m = marks[keyOf(a, i, b, j)] || 0, t = truth(a, i, b, j);
          if (!m) { if (t) open++; return; }
          if ((m === 2) !== t) { wrong[keyOf(a, i, b, j)] = true; bad++; }
        });
        render();
        if (bad) return { ok: false, msg: bad + (bad === 1 ? ' mark is' : ' marks are') + ' wrong and shaded red.' };
        return { ok: true, msg: open ? 'No mistakes so far. ' + open + ' matches still to find.' : 'Every mark is correct.' };
      },
      hint: function () {
        var fix = null, add = null;
        allCells(function (a, i, b, j) {
          var m = marks[keyOf(a, i, b, j)] || 0, t = truth(a, i, b, j);
          if (!fix && m && (m === 2) !== t) fix = { a: a, i: i, b: b, j: j };
          if (!add && t && m !== 2) add = { a: a, i: i, b: b, j: j };
        });
        var target = fix || add;
        if (!target) return { msg: 'Nothing left to find.' };
        setMark(target, truth(target.a, target.i, target.b, target.j) ? 2 : 1);
        render();
        return { msg: (fix ? 'Fixed a mistake: ' : 'Hint: ') + cats[target.a].labels[target.i] + (truth(target.a, target.i, target.b, target.j) ? ' matches ' : ' does not match ') + cats[target.b].name.toLowerCase() + ' “' + cats[target.b].labels[target.j] + '”.' };
      },
      reveal: function () {
        allCells(function (a, i, b, j) { marks[keyOf(a, i, b, j)] = truth(a, i, b, j) ? 2 : 1; });
        wrong = {}; revealedAll = true; render();
      },
      reset: function () { marks = {}; struck = {}; wrong = {}; revealedAll = false; locked = false; ol.querySelectorAll('li').forEach(function (li) { li.classList.remove('struck'); li.querySelector('input').checked = false; }); render(); },
      lock: function () { locked = true; render(); },
      focus: function () { var td = tds[selR + ',' + selC]; if (td) td.focus({ preventScroll: true }); },
      printBody: function (withSolution) {
        var story = p.story ? '<div class="story-print">' + p.story.map(function (s) { return '<p>' + G.esc(s) + '</p>'; }).join('') + '<p><strong>' + G.esc(p.question) + '</strong></p></div>' : (p.intro ? '<p>' + G.esc(p.intro) + '</p>' : '');
        var clues = '<div class="pcols"><h2>Clues</h2>' + p.clues.map(function (c, i) { return '<p>' + (i + 1) + '. ' + G.esc(c) + '</p>'; }).join('') + '</div>';
        if (withSolution) return G.svg.logic(p, { showSolution: true }) + solutionTable() + (p.reveal ? '<p>' + G.esc(p.reveal) + '</p>' : '');
        return story + G.svg.logic(p, {}) + clues;
      },
    };
  };
})();
