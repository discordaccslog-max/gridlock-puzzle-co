/*
 * Gridlock Puzzle Co. product catalog.
 * To start selling a product, paste its payment link into `checkoutUrl`. Product pages
 * render the buy button only when `checkoutUrl` is not empty, so no page ever shows a
 * button that does nothing. Prices are in US dollars.
 * The license code (two characters) is part of every key for that product.
 */
(function (root) {
  var products = [
    { id: 'daily-grid', code: 'DG', name: 'The Daily Grid: Classic Sudoku', shortName: 'The Daily Grid', tier: 'core', price: 10,
      thankYouPath: 'thank-you/daily-grid/', productPath: 'products/daily-grid/', books: ['daily-grid'], checkoutUrl: '' },
    { id: 'hidden-lines', code: 'WS', name: 'Hidden Lines: Word Search', shortName: 'Hidden Lines', tier: 'core', price: 12,
      thankYouPath: 'thank-you/hidden-lines/', productPath: 'products/hidden-lines/', books: ['hidden-lines'], checkoutUrl: '' },
    { id: 'cipher-room', code: 'CR', name: 'The Cipher Room: Cryptograms', shortName: 'The Cipher Room', tier: 'core', price: 15,
      thankYouPath: 'thank-you/cipher-room/', productPath: 'products/cipher-room/', books: ['cipher-room'], checkoutUrl: '' },
    { id: 'deduction-files', code: 'DF', name: 'The Deduction Files: Logic Grids', shortName: 'The Deduction Files', tier: 'core', price: 19,
      thankYouPath: 'thank-you/deduction-files/', productPath: 'products/deduction-files/', books: ['deduction-files'], checkoutUrl: '' },
    { id: 'ink-and-clue', code: 'XW', name: 'Ink & Clue: Crosswords', shortName: 'Ink & Clue', tier: 'core', price: 24,
      thankYouPath: 'thank-you/ink-and-clue/', productPath: 'products/ink-and-clue/', books: ['ink-and-clue'], checkoutUrl: '' },
    { id: 'core-collection', code: 'CC', name: 'The Core Collection', shortName: 'The Core Collection', tier: 'core', price: 49,
      thankYouPath: 'thank-you/core-collection/', productPath: 'products/core-collection/',
      books: ['daily-grid', 'hidden-lines', 'cipher-room', 'deduction-files', 'ink-and-clue'], checkoutUrl: '' },
    { id: 'variant-sudoku', code: 'VS', name: 'Variant Sudoku: Expert Edition', shortName: 'Variant Sudoku', tier: 'expert', price: 35,
      thankYouPath: 'thank-you/variant-sudoku/', productPath: 'products/variant-sudoku/', books: ['variant-sudoku'], checkoutUrl: '' },
    { id: 'logic-casebook', code: 'CB', name: 'The Logic Casebook', shortName: 'The Logic Casebook', tier: 'expert', price: 45,
      thankYouPath: 'thank-you/logic-casebook/', productPath: 'products/logic-casebook/', books: ['logic-casebook'], checkoutUrl: '' },
    { id: 'cartographers-crosswords', code: 'CX', name: 'The Cartographer’s Crosswords', shortName: 'The Cartographer’s Crosswords', tier: 'expert', price: 55,
      thankYouPath: 'thank-you/cartographers-crosswords/', productPath: 'products/cartographers-crosswords/', books: ['cartographers-crosswords'], checkoutUrl: '' },
    { id: 'black-label', code: 'BK', name: 'The Black Label Collection', shortName: 'The Black Label Collection', tier: 'expert', price: 75,
      thankYouPath: 'thank-you/black-label/', productPath: 'products/black-label/', books: ['black-label'], checkoutUrl: '' },
  ];

  // Books are what appear on the library shelf; a product unlocks one or more books.
  var books = [
    { id: 'daily-grid', title: 'The Daily Grid', subtitle: 'Classic Sudoku', tier: 'core', product: 'daily-grid' },
    { id: 'hidden-lines', title: 'Hidden Lines', subtitle: 'Word Search', tier: 'core', product: 'hidden-lines' },
    { id: 'cipher-room', title: 'The Cipher Room', subtitle: 'Cryptograms', tier: 'core', product: 'cipher-room' },
    { id: 'deduction-files', title: 'The Deduction Files', subtitle: 'Logic Grids', tier: 'core', product: 'deduction-files' },
    { id: 'ink-and-clue', title: 'Ink & Clue', subtitle: 'Crosswords', tier: 'core', product: 'ink-and-clue' },
    { id: 'variant-sudoku', title: 'Variant Sudoku', subtitle: 'Expert Edition', tier: 'expert', product: 'variant-sudoku' },
    { id: 'logic-casebook', title: 'The Logic Casebook', subtitle: 'Expert Edition', tier: 'expert', product: 'logic-casebook' },
    { id: 'cartographers-crosswords', title: 'The Cartographer’s Crosswords', subtitle: 'Expert Edition', tier: 'expert', product: 'cartographers-crosswords' },
    { id: 'black-label', title: 'The Black Label Collection', subtitle: 'Expert Edition', tier: 'expert', product: 'black-label' },
  ];

  function find(list, key, value) {
    for (var i = 0; i < list.length; i++) if (list[i][key] === value) return list[i];
    return null;
  }

  var api = {
    products: products,
    books: books,
    byId: function (id) { return find(products, 'id', id); },
    byCode: function (code) { return find(products, 'code', code); },
    book: function (id) { return find(books, 'id', id); },
    formatPrice: function (p) { return '$' + p.price; },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GRIDLOCK_PRODUCTS = api;
})(this);
