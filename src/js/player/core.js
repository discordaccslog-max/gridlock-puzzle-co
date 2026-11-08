/*
 * Gridlock player: one engine for every book. Loads a book's puzzle data, shows the puzzle
 * library with filters, and mounts the right puzzle type. Progress is saved automatically in
 * this browser's localStorage and never leaves the device.
 */
(function () {
  var G = window.Gridlock = window.Gridlock || {};
  G.types = G.types || {};

  var TYPE_NAMES = { sudoku: 'Sudoku', crossword: 'Crossword', wordsearch: 'Word search', cryptogram: 'Cryptogram', logic: 'Logic grid' };
  var VARIANT_NAMES = {
    classic: 'Classic', killer: 'Killer', jigsaw: 'Jigsaw', diagonal: 'Diagonal', evenodd: 'Even-Odd',
    mini: 'Mini 7×7', midi: 'Midi 11×11', full: 'Full 15×15', themeless: 'Themeless 15×15',
    standard: 'Standard', casebook: 'Casebook case', six: 'Six categories', unspaced: 'No word breaks',
  };
  var DIFF_ORDER = ['easy', 'medium', 'hard', 'expert'];
  G.TYPE_NAMES = TYPE_NAMES;
  G.VARIANT_NAMES = VARIANT_NAMES;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  G.el = el;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  G.esc = esc;
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  G.cap = cap;
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }

  /* ---------- storage ---------- */
  function Store(bookId) {
    var key = 'gridlock.progress.' + bookId;
    var data = {};
    try { data = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { data = {}; }
    return {
      get: function (pid) { return data[pid] || null; },
      set: function (pid, rec) {
        data[pid] = rec;
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage full or blocked */ }
      },
      remove: function (pid) {
        delete data[pid];
        try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage blocked */ }
      },
      all: function () { return data; },
    };
  }
  G.Store = Store;
  function pref(name, value) {
    try {
      if (value === undefined) return localStorage.getItem('gridlock.pref.' + name);
      localStorage.setItem('gridlock.pref.' + name, value);
    } catch (e) { return null; }
    return value;
  }

  function describe(p) {
    var parts = ['Puzzle ' + p.n, VARIANT_NAMES[p.variant] || '', cap(p.difficulty)];
    if (p.type === 'crossword' && (p.variant === 'mini' || p.variant === 'midi' || p.variant === 'full')) parts[1] = VARIANT_NAMES[p.variant];
    return parts.filter(Boolean).join(' · ');
  }
  function heading(p) {
    if (p.type === 'crossword' && p.title) return p.title;
    if (p.type === 'logic' || p.type === 'wordsearch') return p.title;
    if (p.type === 'cryptogram') return p.variant === 'unspaced' ? 'Unbroken Cipher' : (p.source === 'proverb' ? 'A Proverb' : 'A Saying');
    return p.title || TYPE_NAMES[p.type];
  }
  G.heading = heading;

  /* ---------- a single puzzle ---------- */
  G.mountPuzzle = function (container, puzzle, opts) {
    opts = opts || {};
    var store = opts.store;
    var rec = store ? store.get(puzzle.id) : null;
    var elapsed = rec && rec.time ? rec.time : 0;
    var status = rec ? rec.status : 'new';
    var timerHidden = pref('timerHidden') === '1';

    container.innerHTML = '';
    var view = el('div', { class: 'puzzle-view' });
    var title = el('div', { class: 'puzzle-title' },
      '<p class="label">' + esc((opts.bookTitle ? opts.bookTitle + ' · ' : '') + describe(puzzle)) + '</p>' +
      '<h2 id="pz-title" tabindex="-1">' + esc(heading(puzzle)) + '</h2>');
    var banner = el('div', { class: 'solved-banner', role: 'status' });
    var toolbar = el('div', { class: 'toolbar', role: 'toolbar', 'aria-label': 'Puzzle tools' });
    var tools = [
      ['check-entry', puzzle.type === 'wordsearch' ? 'Check word' : 'Check entry'],
      ['check-all', 'Check puzzle'],
      ['hint', 'Hint'],
      ['reveal', 'Reveal solution'],
    ];
    tools.forEach(function (t) { toolbar.appendChild(el('button', { type: 'button', class: 'btn ghost small', 'data-act': t[0] }, esc(t[1]))); });
    toolbar.appendChild(el('span', { class: 'sp' }));
    var timerEl = el('span', { class: 'timer', 'aria-label': 'Time spent' }, fmtTime(elapsed));
    toolbar.appendChild(timerEl);
    var timerBtn = el('button', { type: 'button', class: 'btn ghost small', 'data-act': 'timer', 'aria-pressed': timerHidden ? 'true' : 'false' }, timerHidden ? 'Show timer' : 'Hide timer');
    toolbar.appendChild(timerBtn);
    [['print', 'Print'], ['print-key', 'Answer key'], ['reset', 'Reset progress']].forEach(function (t) {
      toolbar.appendChild(el('button', { type: 'button', class: 'btn ghost small', 'data-act': t[0] }, t[1]));
    });
    var statusLine = el('p', { class: 'status-line', 'aria-live': 'polite' });
    var layout = el('div', { class: 'play-layout' });
    var boardCol = el('div', { class: 'board-col' });
    var side = el('div', { class: 'side-panel' });
    layout.appendChild(boardCol); layout.appendChild(side);
    view.appendChild(title); view.appendChild(banner); view.appendChild(toolbar); view.appendChild(statusLine); view.appendChild(layout);
    container.appendChild(view);
    if (timerHidden) timerEl.hidden = true;

    var saveTimer = null;
    function persist() {
      if (!store) return;
      var finished = status === 'solved' || status === 'revealed';
      store.set(puzzle.id, { state: ctrl.getState(), status: finished ? status : (ctrl.isEmpty && ctrl.isEmpty() ? 'new' : 'progress'), time: Math.floor(elapsed), at: Date.now() });
    }
    function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); }

    function showSolved(revealed) {
      banner.innerHTML = revealed
        ? '<strong>Solution revealed.</strong><span>Reset progress to try this one again.</span>'
        : '<strong>Solved.</strong><span>' + (timerHidden ? 'Nicely done.' : 'Time ' + fmtTime(elapsed) + '.') + '</span>';
      banner.classList.add('show');
    }
    function setStatus(msg, kind) {
      statusLine.textContent = msg || '';
      statusLine.className = 'status-line' + (kind ? ' ' + kind : '');
    }

    var ctx = {
      changed: function () {
        if (status === 'new') status = 'progress';
        if (status !== 'solved' && status !== 'revealed' && ctrl.isSolved()) {
          status = 'solved';
          ctrl.lock && ctrl.lock();
          showSolved(false);
          setStatus({ wordsearch: 'Every word found. Puzzle solved.', cryptogram: 'Decoded. Puzzle solved.', logic: 'Every match is correct. Puzzle solved.' }[puzzle.type] || 'Every square is correct. Puzzle solved.', 'good');
        }
        scheduleSave();
      },
      status: setStatus,
      finished: function () { return status === 'solved' || status === 'revealed'; },
    };

    var factory = G.types[puzzle.type];
    var ctrl = factory(boardCol, side, puzzle, rec && rec.state, ctx);
    if (status === 'solved' || status === 'revealed') { ctrl.lock && ctrl.lock(); showSolved(status === 'revealed'); }

    // timer
    var tick = setInterval(function () {
      if (document.hidden || status === 'solved' || status === 'revealed' || !document.body.contains(view)) return;
      if (status === 'new') return;
      elapsed += 1;
      timerEl.textContent = fmtTime(elapsed);
      if (Math.floor(elapsed) % 10 === 0) persist();
    }, 1000);

    toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'timer') {
        timerHidden = !timerHidden;
        pref('timerHidden', timerHidden ? '1' : '0');
        timerEl.hidden = timerHidden;
        btn.textContent = timerHidden ? 'Show timer' : 'Hide timer';
        btn.setAttribute('aria-pressed', timerHidden ? 'true' : 'false');
        return;
      }
      if (act === 'print' || act === 'print-key') { printPuzzle(puzzle, ctrl, act === 'print-key', opts.bookTitle); return; }
      if (act === 'reset') {
        if (!window.confirm('Reset progress on this puzzle? Your entries and time will be cleared on this device.')) return;
        ctrl.reset();
        status = 'new'; elapsed = 0; timerEl.textContent = fmtTime(0);
        banner.classList.remove('show');
        if (store) store.remove(puzzle.id);
        setStatus('Progress reset.', '');
        ctrl.focus && ctrl.focus();
        return;
      }
      if (ctx.finished() && act !== 'reveal') { setStatus(status === 'revealed' ? 'The solution is showing. Reset progress to play again.' : 'Already solved.', 'good'); return; }
      if (act === 'check-entry') { var r1 = ctrl.checkEntry(); setStatus(r1.msg, r1.ok ? 'good' : 'bad'); }
      if (act === 'check-all') { var r2 = ctrl.checkAll(); setStatus(r2.msg, r2.ok ? 'good' : 'bad'); }
      if (act === 'hint') { var r3 = ctrl.hint(); setStatus(r3.msg, ''); if (status === 'new') status = 'progress'; ctx.changed(); }
      if (act === 'reveal') {
        if (ctx.finished()) return;
        if (!window.confirm('Reveal the full solution? This marks the puzzle as revealed.')) return;
        ctrl.reveal();
        status = 'revealed';
        ctrl.lock && ctrl.lock();
        showSolved(true);
        setStatus('Solution revealed.', '');
        persist();
      }
      ctrl.focus && ctrl.focus();
    });

    return {
      destroy: function () { clearInterval(tick); persist(); ctrl.destroy && ctrl.destroy(); },
      focusTitle: function () { var h = view.querySelector('#pz-title'); if (h) h.focus(); },
    };
  };

  /* ---------- printing ---------- */
  function printPuzzle(p, ctrl, withSolution, bookTitle) {
    var area = document.getElementById('print-area');
    if (!area) { area = el('div', { id: 'print-area' }); document.body.appendChild(area); }
    area.innerHTML = '<h1>' + esc(heading(p)) + (withSolution ? ' — Answer key' : '') + '</h1>' +
      '<div class="pmeta">' + esc((bookTitle ? bookTitle + ' · ' : '') + describe(p)) + '</div>' +
      ctrl.printBody(withSolution) +
      '<div class="foot">Gridlock Puzzle Co. · Printed for personal use</div>';
    document.body.classList.add('printing');
    var done = function () { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); setTimeout(done, 500); }, 60);
  }

  /* ---------- help ---------- */
  var HELP = {
    sudoku: {
      classic: '<p>Fill every row, every column and every 3×3 box with the digits 1 to 9, each exactly once. The starting digits cannot be changed.</p>',
      killer: '<p>Classic rules, plus <strong>cages</strong>: each dashed outline shows a target sum in its corner. The digits in a cage must add up to that number, and no digit repeats within a cage. Killer puzzles here start with an empty grid.</p>',
      jigsaw: '<p>Classic rules, except the nine boxes are replaced by nine <strong>irregular regions</strong> outlined in bold. Every row, column and region holds 1 to 9 once.</p>',
      diagonal: '<p>Classic rules, plus both <strong>long diagonals</strong> (the shaded lines from corner to corner) must each contain 1 to 9 once.</p>',
      evenodd: '<p>Classic rules, plus every cell with a <strong>shaded circle</strong> must hold an even digit: 2, 4, 6 or 8. Unshaded cells can hold any digit.</p>',
      keys: '<p><kbd>1</kbd>–<kbd>9</kbd> enter a digit, <kbd>Backspace</kbd> or <kbd>0</kbd> clears, arrow keys move, <kbd>Tab</kbd> jumps to the next empty square. Press <kbd>N</kbd> (or use the Notes button) to switch to pencil marks; hold <kbd>Shift</kbd> with a digit to add a pencil mark directly.</p>',
      levels: '<p>Difficulty describes the hardest technique a puzzle needs. Easy: singles only. Medium: locked candidates and naked pairs. Hard: hidden pairs and triples, naked triples, X-Wing, and for Killer the 45 rule (innies and outies). Expert: Swordfish, XY-Wing, XYZ-Wing, quads, cage combination clashes, or a short forcing chain from a two-candidate square.</p>',
    },
    crossword: '<p>These are blocked-style crosswords, the format used by quick crosswords in Britain, Ireland and Australia. Squares where an across and a down entry meet are shared; the squares between them belong to one entry only, so each clue has to do its own work. The number in brackets after a clue gives the length, with word breaks shown as (5,4).</p><p>Click or tap a square to select it, and again to switch between across and down. Theme entries are marked with a ★.</p><p><kbd>A</kbd>–<kbd>Z</kbd> type, <kbd>Backspace</kbd> deletes, arrow keys move, <kbd>Space</kbd> switches direction, <kbd>Tab</kbd> and <kbd>Shift</kbd>+<kbd>Tab</kbd> move to the next or previous clue.</p>',
    wordsearch: '<p>Every word in the list is hidden exactly once in the grid, in a straight line. Easy puzzles run across, down and diagonally down to the right. Medium and hard puzzles also run backwards, upwards and along every diagonal, and hard grids use the theme’s own letters as decoys.</p><p>Drag from the first letter to the last, or tap the first letter and then the last. With a keyboard, move with the arrow keys and press <kbd>Enter</kbd> on the first and last letters.</p>',
    cryptogram: '<p>Each letter of the original text has been replaced by a different letter, and the same substitution is used throughout. No letter ever stands for itself. Work out the original sentence; when you enter a letter, it fills every square with the same code letter.</p><p>Starting letters, if any, are filled in for you. In puzzles marked <em>No word breaks</em>, spaces and punctuation are removed, so you also have to find where each word begins and ends.</p><p><kbd>A</kbd>–<kbd>Z</kbd> type, <kbd>Backspace</kbd> clears, arrow keys and <kbd>Tab</kbd> move between code letters.</p>',
    logic: '<p>Each person or item in the first category matches exactly one item in every other category, and no two share an item. Use the clues to work out every match. In the grid, mark a square with an <strong>×</strong> when two items cannot go together and a <strong>●</strong> when they do. The puzzle is solved when every ● is in place.</p><p>Click or tap a square to cycle blank, ×, ●. With a keyboard, move with the arrow keys, press <kbd>X</kbd> for ×, <kbd>O</kbd> for ●, and <kbd>Space</kbd> to cycle. Placing a ● can automatically fill the rest of its row and column with ×. Tick off clues as you use them.</p><p>Every puzzle has exactly one solution, and every one can be finished by deduction alone, without guessing.</p>',
    common: '<p><strong>Check entry</strong> checks the square or word you have selected. <strong>Check puzzle</strong> marks every wrong entry. <strong>Hint</strong> fills in one correct answer. <strong>Reveal solution</strong> shows everything. Progress and time save automatically in this browser; <strong>Reset progress</strong> clears them. <strong>Print</strong> gives a clean copy to solve on paper, and <strong>Answer key</strong> prints the solution.</p>',
  };
  G.renderHelp = function (types, variants) {
    var out = '<div class="help-grid">';
    if (types.indexOf('sudoku') >= 0) {
      out += '<section><h3>Sudoku</h3>';
      ['classic', 'killer', 'jigsaw', 'diagonal', 'evenodd'].forEach(function (v) {
        if (variants.indexOf(v) >= 0) out += '<h4>' + VARIANT_NAMES[v] + '</h4>' + HELP.sudoku[v];
      });
      out += '<h4>Keys</h4>' + HELP.sudoku.keys + '<h4>Difficulty</h4>' + HELP.sudoku.levels + '</section>';
    }
    ['crossword', 'wordsearch', 'cryptogram', 'logic'].forEach(function (t) {
      if (types.indexOf(t) >= 0) out += '<section><h3>' + TYPE_NAMES[t] + 's</h3>' + HELP[t] + '</section>';
    });
    out += '<section><h3>Tools</h3>' + HELP.common + '</section></div>';
    return out;
  };

  /* ---------- the play page ---------- */
  G.app = function (root) {
    var params = new URLSearchParams(location.search);
    var bookId = params.get('book');
    var catalog = window.GRIDLOCK_PRODUCTS;
    var book = bookId && catalog.book(bookId);
    var head = root.querySelector('[data-player-head]');
    var body = root.querySelector('[data-player-body]');
    if (!book) {
      head.innerHTML = '<h1>Choose a book</h1>';
      body.innerHTML = '<div class="locked-box"><p>That link does not point to one of our books. Your unlocked books are on your library shelf.</p><p class="btn-row"><a class="btn" href="../library/">Go to my library</a></p></div>';
      return;
    }
    document.title = book.title + ' · Gridlock Puzzle Co.';
    var unlocked = window.GRIDLOCK_LICENSE.unlockedBooks();
    var product = catalog.byId(book.product);
    head.innerHTML = '<div><div class="crumbs"><a href="../library/">My library</a><span aria-hidden="true">/</span><span>' + esc(book.title) + '</span></div>' +
      '<h1>' + esc(book.title) + '</h1></div><div class="btn-row"><a class="btn ghost small" href="#help">How to play</a><a class="btn ghost small" href="#">All puzzles</a></div>';
    if (!unlocked[bookId]) {
      body.innerHTML = '<div class="locked-box"><h2>This book is not unlocked on this device yet</h2>' +
        '<p>Enter the license key from your order confirmation to open it here. Keys work on any number of your devices; just enter the key again on each one.</p>' +
        '<p class="btn-row"><a class="btn red" href="../unlock/">Enter a key</a><a class="btn ghost" href="../' + product.productPath + '">About this book</a></p></div>';
      return;
    }
    body.innerHTML = '<p class="label">Loading puzzles…</p>';
    var store = Store(bookId);
    var current = null;
    fetch('../data/' + bookId + '.json').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var puzzles = data.puzzles;
      window.addEventListener('hashchange', route);
      route();

      function route() {
        if (current) { current.destroy(); current = null; }
        var h = location.hash.replace(/^#/, '');
        var m = /^p=(\d+)$/.exec(h);
        if (m) {
          var n = +m[1];
          var p = puzzles[n - 1];
          if (p) return showPuzzle(p, n);
        }
        if (h === 'help') return showHelp();
        showIndex();
      }

      function showHelp() {
        var types = [], variants = [];
        puzzles.forEach(function (p) { if (types.indexOf(p.type) < 0) types.push(p.type); if (variants.indexOf(p.variant) < 0) variants.push(p.variant); });
        body.innerHTML = '<div class="section-head"><h2 id="help-title" tabindex="-1">How to play</h2><a class="btn ghost small" href="#">Back to all puzzles</a></div>' + G.renderHelp(types, variants);
        document.getElementById('help-title').focus();
        window.scrollTo(0, 0);
      }

      function filterValues(key, order) {
        var vals = [];
        puzzles.forEach(function (p) { if (vals.indexOf(p[key]) < 0) vals.push(p[key]); });
        if (order) vals.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
        return vals;
      }

      function showIndex() {
        var saved = {};
        try { saved = JSON.parse(sessionStorage.getItem('gridlock.filters.' + bookId) || '{}'); } catch (e) { saved = {}; }
        var types = filterValues('type');
        var variants = filterValues('variant');
        var diffs = filterValues('difficulty', DIFF_ORDER);
        var sel = function (name, label, values, names) {
          if (values.length < 2) return '';
          return '<label>' + label + '<select data-filter="' + name + '"><option value="">All</option>' +
            values.map(function (v) { return '<option value="' + esc(v) + '"' + (saved[name] === v ? ' selected' : '') + '>' + esc(names ? (names[v] || cap(v)) : cap(v)) + '</option>'; }).join('') + '</select></label>';
        };
        body.innerHTML = '<div class="filters" role="group" aria-label="Filter puzzles">' +
          sel('type', 'Type', types, TYPE_NAMES) + sel('variant', 'Variant', variants, VARIANT_NAMES) + sel('difficulty', 'Difficulty', diffs) +
          '<label>Status<select data-filter="status"><option value="">All</option>' +
          [['new', 'Not started'], ['progress', 'In progress'], ['solved', 'Solved'], ['revealed', 'Revealed']].map(function (o) {
            return '<option value="' + o[0] + '"' + (saved.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
          }).join('') + '</select></label><span class="count" aria-live="polite"></span></div><ul class="puzzle-list"></ul>';
        var list = body.querySelector('.puzzle-list');
        var countEl = body.querySelector('.count');
        function render() {
          var f = {};
          body.querySelectorAll('[data-filter]').forEach(function (s) { f[s.getAttribute('data-filter')] = s.value; });
          try { sessionStorage.setItem('gridlock.filters.' + bookId, JSON.stringify(f)); } catch (e) { /* ignore */ }
          var shown = 0, solved = 0;
          var html = '';
          puzzles.forEach(function (p) {
            var rec = store.get(p.id);
            var st = rec ? rec.status : 'new';
            if (st === 'solved') solved++;
            if (f.type && p.type !== f.type) return;
            if (f.variant && p.variant !== f.variant) return;
            if (f.difficulty && p.difficulty !== f.difficulty) return;
            if (f.status && st !== f.status) return;
            shown++;
            var stLabel = { new: 'Not started', progress: 'In progress', solved: 'Solved', revealed: 'Revealed' }[st];
            var sub = p.type === 'sudoku' ? VARIANT_NAMES[p.variant] + ' sudoku' : heading(p);
            html += '<li><a class="pcard ' + st + '" href="#p=' + p.n + '"><span class="no">' + p.n + '</span><span class="ty">' + esc(sub) + '</span>' +
              '<span class="df">' + esc(cap(p.difficulty)) + (p.type !== 'sudoku' && VARIANT_NAMES[p.variant] && p.variant !== 'standard' && p.variant !== 'classic' ? ' · ' + esc(VARIANT_NAMES[p.variant]) : '') + '</span>' +
              '<span class="st">' + stLabel + '</span></a></li>';
          });
          list.innerHTML = html || '<li class="muted">No puzzles match these filters.</li>';
          countEl.textContent = shown + ' of ' + puzzles.length + ' shown · ' + solved + ' solved';
        }
        body.querySelectorAll('[data-filter]').forEach(function (s) { s.addEventListener('change', render); });
        render();
      }

      function showPuzzle(p, n) {
        body.innerHTML = '';
        var host = el('div');
        body.appendChild(host);
        current = G.mountPuzzle(host, p, { store: store, bookTitle: book.title });
        var nav = el('nav', { class: 'nav-pz', 'aria-label': 'Puzzle navigation' });
        nav.innerHTML = (n > 1 ? '<a class="btn ghost small" href="#p=' + (n - 1) + '">← Puzzle ' + (n - 1) + '</a>' : '<span></span>') +
          '<a class="btn ghost small" href="#">All puzzles</a>' +
          (n < puzzles.length ? '<a class="btn ghost small" href="#p=' + (n + 1) + '">Puzzle ' + (n + 1) + ' →</a>' : '<span></span>');
        body.appendChild(nav);
        window.scrollTo(0, 0);
        current.focusTitle();
      }
    }).catch(function () {
      body.innerHTML = '<div class="locked-box"><p>The puzzles could not be loaded. Check your connection and reload the page. Your progress is safe in this browser.</p></div>';
    });
  };
})();
