/* Home page: hero animation and the free sample crossword. */
(function () {
  var grid = document.querySelector('.hero-grid');
  if (grid) grid.classList.add('animate');

  var host = document.querySelector('[data-sample]');
  if (!host || !window.Gridlock || !window.Gridlock.mountPuzzle) return;
  fetch('data/sample.json').then(function (r) { return r.json(); }).then(function (data) {
    window.Gridlock.mountPuzzle(host, data.puzzles[0], { store: window.Gridlock.Store('sample'), bookTitle: 'Free sample' });
  }).catch(function () {
    host.innerHTML = '<p class="muted">The sample puzzle could not be loaded. Please refresh the page.</p>';
  });
})();
