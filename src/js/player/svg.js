/*
 * Static SVG renderings of puzzles. Used by the build for product-page previews and by the
 * player for printable puzzles and answer keys. Drawn in currentColor so they follow the theme.
 */
(function (root) {
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(w, h, body, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '">' + body + '</svg>';
  }
  var SERIF = "font-family=\"'Hanken Grotesk',Arial,sans-serif\" font-weight=\"600\"";
  var SANS = "font-family=\"'Hanken Grotesk',Arial,sans-serif\"";
  var MONO = "font-family=\"'Hanken Grotesk',Arial,sans-serif\" font-weight=\"500\"";

  /* ---------- sudoku ---------- */
  function sudoku(p, opts) {
    opts = opts || {};
    var C = 40, M = 4, W = C * 9 + M * 2;
    var regions = p.regions ? p.regions.split('').map(Number) : null;
    var reg = function (i) { return regions ? regions[i] : Math.floor(i / 27) * 3 + Math.floor((i % 9) / 3); };
    var out = [];
    out.push('<rect x="' + M + '" y="' + M + '" width="' + C * 9 + '" height="' + C * 9 + '" fill="none"/>');
    var i, r, c, x, y;
    if (p.diagonal) {
      for (i = 0; i < 9; i++) {
        out.push('<rect x="' + (M + i * C) + '" y="' + (M + i * C) + '" width="' + C + '" height="' + C + '" fill="currentColor" fill-opacity="0.08"/>');
        out.push('<rect x="' + (M + (8 - i) * C) + '" y="' + (M + i * C) + '" width="' + C + '" height="' + C + '" fill="currentColor" fill-opacity="0.08"/>');
      }
      out.push('<path d="M' + M + ' ' + M + 'L' + (M + 9 * C) + ' ' + (M + 9 * C) + 'M' + (M + 9 * C) + ' ' + M + 'L' + M + ' ' + (M + 9 * C) + '" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.2"/>');
    }
    if (p.even) {
      for (i = 0; i < 81; i++) if (p.even[i] === '1') {
        out.push('<circle cx="' + (M + (i % 9) * C + C / 2) + '" cy="' + (M + Math.floor(i / 9) * C + C / 2) + '" r="' + (C * 0.38) + '" fill="currentColor" fill-opacity="0.13"/>');
      }
    }
    // thin grid
    var thin = '';
    for (i = 1; i < 9; i++) {
      thin += 'M' + (M + i * C) + ' ' + M + 'V' + (M + 9 * C) + 'M' + M + ' ' + (M + i * C) + 'H' + (M + 9 * C);
    }
    out.push('<path d="' + thin + '" stroke="currentColor" stroke-opacity="0.35" stroke-width="1"/>');
    // region borders
    var thick = '';
    for (i = 0; i < 81; i++) {
      r = Math.floor(i / 9); c = i % 9; x = M + c * C; y = M + r * C;
      if (c < 8 && reg(i) !== reg(i + 1)) thick += 'M' + (x + C) + ' ' + y + 'V' + (y + C);
      if (r < 8 && reg(i) !== reg(i + 9)) thick += 'M' + x + ' ' + (y + C) + 'H' + (x + C);
    }
    out.push('<path d="' + thick + '" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>');
    out.push('<rect x="' + M + '" y="' + M + '" width="' + C * 9 + '" height="' + C * 9 + '" fill="none" stroke="currentColor" stroke-width="3.5"/>');
    // killer cages
    if (p.cages) {
      var cageOf = new Array(81);
      p.cages.forEach(function (cg, k) { cg[1].forEach(function (cell) { cageOf[cell] = k; }); });
      var d = '', inset = 4;
      for (i = 0; i < 81; i++) {
        r = Math.floor(i / 9); c = i % 9; x = M + c * C; y = M + r * C;
        var k = cageOf[i];
        var top = r === 0 || cageOf[i - 9] !== k, bottom = r === 8 || cageOf[i + 9] !== k;
        var left = c === 0 || cageOf[i - 1] !== k, right = c === 8 || cageOf[i + 1] !== k;
        if (top) d += 'M' + (x + (left ? inset : 0)) + ' ' + (y + inset) + 'H' + (x + C - (right ? inset : 0));
        if (bottom) d += 'M' + (x + (left ? inset : 0)) + ' ' + (y + C - inset) + 'H' + (x + C - (right ? inset : 0));
        if (left) d += 'M' + (x + inset) + ' ' + (y + (top ? inset : 0)) + 'V' + (y + C - (bottom ? inset : 0));
        if (right) d += 'M' + (x + C - inset) + ' ' + (y + (top ? inset : 0)) + 'V' + (y + C - (bottom ? inset : 0));
      }
      out.push('<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 2.5" stroke-opacity="0.9"/>');
      p.cages.forEach(function (cg) {
        var first = Math.min.apply(null, cg[1]);
        var cx = M + (first % 9) * C, cy = M + Math.floor(first / 9) * C;
        out.push('<rect x="' + (cx + 2) + '" y="' + (cy + 2) + '" width="' + (String(cg[0]).length * 6.5 + 3) + '" height="11" fill="var(--paper, #fff)"/>');
        out.push('<text x="' + (cx + 3) + '" y="' + (cy + 11) + '" font-size="10" ' + MONO + ' fill="currentColor">' + cg[0] + '</text>');
      });
    }
    // digits
    var fs = p.cages ? 21 : 26;
    for (i = 0; i < 81; i++) {
      var g = p.givens[i];
      var v = g !== '0' ? g : (opts.showSolution ? p.solution[i] : '');
      if (!v) continue;
      x = M + (i % 9) * C + C / 2; y = M + Math.floor(i / 9) * C + C / 2 + fs * 0.36 + (p.cages ? 2 : 0);
      var faint = g === '0';
      out.push('<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + fs + '" ' + (faint ? SANS + ' fill-opacity="0.62"' : SERIF) + ' fill="currentColor">' + v + '</text>');
    }
    return svg(W, W, out.join(''), opts.label || 'Sudoku grid');
  }

  /* ---------- crossword ---------- */
  function crossword(p, opts) {
    opts = opts || {};
    var n = p.size, C = n > 11 ? 28 : 34, M = 3, W = n * C + M * 2;
    var out = [];
    var nums = {};
    p.across.concat(p.down).forEach(function (e) { nums[e.r * n + e.c] = e.n; });
    var cells = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var ch = p.grid[r][c], x = M + c * C, y = M + r * C;
      if (ch === '#') cells += '<rect x="' + x + '" y="' + y + '" width="' + C + '" height="' + C + '" fill="currentColor"/>';
      else {
        cells += '<rect x="' + x + '" y="' + y + '" width="' + C + '" height="' + C + '" fill="none" stroke="currentColor" stroke-width="1"/>';
        if (nums[r * n + c]) cells += '<text x="' + (x + 2) + '" y="' + (y + C * 0.3) + '" font-size="' + (C * 0.27) + '" ' + MONO + ' fill="currentColor">' + nums[r * n + c] + '</text>';
        if (opts.showSolution) cells += '<text x="' + (x + C / 2) + '" y="' + (y + C * 0.78) + '" text-anchor="middle" font-size="' + (C * 0.56) + '" ' + SANS + ' font-weight="600" fill="currentColor">' + ch + '</text>';
      }
    }
    out.push(cells);
    out.push('<rect x="' + M + '" y="' + M + '" width="' + n * C + '" height="' + n * C + '" fill="none" stroke="currentColor" stroke-width="3"/>');
    return svg(W, W, out.join(''), opts.label || 'Crossword grid');
  }

  /* ---------- word search ---------- */
  function wordsearch(p, opts) {
    opts = opts || {};
    var n = p.size, C = 26, M = 4, W = n * C + M * 2;
    var out = ['<rect x="' + (M - 2) + '" y="' + (M - 2) + '" width="' + (n * C + 4) + '" height="' + (n * C + 4) + '" fill="none" stroke="currentColor" stroke-width="2.5"/>'];
    if (opts.showSolution) {
      p.words.forEach(function (w) {
        var x1 = M + w.c * C + C / 2, y1 = M + w.r * C + C / 2;
        var x2 = M + (w.c + w.dc * (w.word.length - 1)) * C + C / 2, y2 = M + (w.r + w.dr * (w.word.length - 1)) * C + C / 2;
        out.push('<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-opacity="0.18" stroke-width="' + (C * 0.78) + '" stroke-linecap="round"/>');
      });
    }
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      out.push('<text x="' + (M + c * C + C / 2) + '" y="' + (M + r * C + C * 0.7) + '" text-anchor="middle" font-size="' + (C * 0.58) + '" ' + MONO + ' fill="currentColor">' + p.grid[r][c] + '</text>');
    }
    return svg(W, W, out.join(''), opts.label || 'Word search grid');
  }

  /* ---------- cryptogram ---------- */
  function cryptogram(p, opts) {
    opts = opts || {};
    var CW = 22, W = opts.width || 560, LH = 58, x = 10, y = 34;
    var out = [];
    var units = p.variant === 'unspaced' ? [p.cipher] : p.cipher.split(' ');
    var plain = p.variant === 'unspaced' ? [p.plain] : p.plain.split(' ');
    var maxLines = opts.maxLines || 99, line = 0;
    for (var u = 0; u < units.length && line < maxLines; u++) {
      var word = units[u], pw = plain[u];
      var chars = word.split('');
      if (p.variant !== 'unspaced' && x + chars.length * CW > W - 10) { x = 10; y += LH; line++; if (line >= maxLines) break; }
      for (var k = 0; k < chars.length; k++) {
        if (p.variant === 'unspaced' && x + CW > W - 10) { x = 10; y += LH; line++; if (line >= maxLines) break; }
        var ch = chars[k];
        if (/[A-Z]/.test(ch)) {
          var shown = opts.showSolution || p.hints[ch] ? (p.hints[ch] || pw[k]) : '';
          out.push('<line x1="' + (x + 2) + '" y1="' + y + '" x2="' + (x + CW - 2) + '" y2="' + y + '" stroke="currentColor" stroke-width="1.5"/>');
          if (shown) out.push('<text x="' + (x + CW / 2) + '" y="' + (y - 5) + '" text-anchor="middle" font-size="17" ' + SANS + ' font-weight="600" fill="currentColor"' + (p.hints[ch] ? '' : ' fill-opacity="0.7"') + '>' + shown + '</text>');
          out.push('<text x="' + (x + CW / 2) + '" y="' + (y + 17) + '" text-anchor="middle" font-size="13" ' + MONO + ' fill="currentColor">' + ch + '</text>');
        } else {
          out.push('<text x="' + (x + CW / 2 - 4) + '" y="' + (y - 4) + '" text-anchor="middle" font-size="18" ' + SANS + ' fill="currentColor">' + esc(ch) + '</text>');
        }
        x += CW;
      }
      x += CW * 0.7;
    }
    var H = y + 28;
    return svg(W, H, out.join(''), opts.label || 'Cryptogram');
  }

  /* ---------- logic grid ---------- */
  function logicLayout(p) {
    var k = p.categories.length;
    var cols = [];
    for (var c = 1; c < k; c++) cols.push(c);
    var rows = [0];
    for (var r = k - 1; r >= 2; r--) rows.push(r);
    return { cols: cols, rows: rows, blocks: rows.map(function (rc, i) { return cols.slice(0, k - 1 - i); }) };
  }
  function logicTruth(p, a, i, b, j) {
    var sol = p.solution;
    var e = sol[a].indexOf(i);
    return sol[b][e] === j;
  }
  function logic(p, opts) {
    opts = opts || {};
    var L = logicLayout(p), n = p.categories[0].items.length, C = opts.cell || 18;
    var labW = opts.labelWidth || 118, labH = opts.labelHeight || 118;
    var W = labW + L.cols.length * n * C + 6, H = labH + L.rows.length * n * C + 6;
    var out = [];
    var short = function (s) { s = String(s); return s.length > 17 ? s.slice(0, 16) + '…' : s; };
    L.cols.forEach(function (cat, ci) {
      p.categories[cat].labels.forEach(function (lab, j) {
        var x = labW + (ci * n + j) * C + C * 0.68, y = labH - 6;
        out.push('<text transform="translate(' + x + ' ' + y + ') rotate(-90)" font-size="10" ' + MONO + ' fill="currentColor">' + esc(short(lab)) + '</text>');
      });
    });
    L.rows.forEach(function (cat, ri) {
      p.categories[cat].labels.forEach(function (lab, i) {
        out.push('<text x="' + (labW - 6) + '" y="' + (labH + (ri * n + i) * C + C * 0.7) + '" text-anchor="end" font-size="10" ' + MONO + ' fill="currentColor">' + esc(short(lab)) + '</text>');
      });
      L.blocks[ri].forEach(function (cat2, ci) {
        var x0 = labW + ci * n * C, y0 = labH + ri * n * C;
        var thin = '';
        for (var t = 1; t < n; t++) thin += 'M' + (x0 + t * C) + ' ' + y0 + 'V' + (y0 + n * C) + 'M' + x0 + ' ' + (y0 + t * C) + 'H' + (x0 + n * C);
        out.push('<path d="' + thin + '" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>');
        out.push('<rect x="' + x0 + '" y="' + y0 + '" width="' + n * C + '" height="' + n * C + '" fill="none" stroke="currentColor" stroke-width="2"/>');
        if (opts.showSolution) {
          for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (logicTruth(p, cat, i, cat2, j)) {
            out.push('<circle cx="' + (x0 + j * C + C / 2) + '" cy="' + (y0 + i * C + C / 2) + '" r="' + C * 0.28 + '" fill="currentColor"/>');
          }
        }
      });
    });
    return svg(W, H, out.join(''), opts.label || 'Logic grid');
  }

  var api = { sudoku: sudoku, crossword: crossword, wordsearch: wordsearch, cryptogram: cryptogram, logic: logic, logicLayout: logicLayout, logicTruth: logicTruth, esc: esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.Gridlock = root.Gridlock || {}; root.Gridlock.svg = api; }
})(this);
