# Gridlock Puzzle Co.

Storefront, puzzle generator and in-browser puzzle player for Gridlock Puzzle Co. The finished
static site lives in `docs/`.

## Hosting

The site is hosted on Vercel at https://gridlock-puzzle-co.vercel.app (project `gridlock-puzzle-co`).
`vercel.json` serves `docs/`, rebuilds it from source with `node build/site.js` on every deploy, and
adds trailing slashes so relative links resolve. Deploy with `vercel deploy --prod` from this folder.
Canonical URLs, Open Graph tags and `sitemap.xml` use the Vercel address (`SITE.url` in
`build/pages/layout.js`). The same `docs/` folder is also published by GitHub Pages.

## Layout

| Path | What it is |
| --- | --- |
| `build/content/` | Hand-written content: crossword vocabulary and clues, themes, word lists, sentences, logic themes, casebook stories, content filter |
| `build/gen/` | Generators and solvers for sudoku (5 rule sets), crosswords, word searches, cryptograms and logic grids |
| `build/generate.js` | Builds every book into `generated/*.json`, checking each puzzle as it is made |
| `build/verify.js` | Independent re-check of every generated puzzle |
| `build/site.js` | Builds the static site into `docs/` |
| `build/check-site.js` | Checks every internal link and anchor, titles, descriptions, and searches the project for unfinished text |
| `src/` | Stylesheet and browser JavaScript (player, license keys, page scripts) |
| `docs/` | The published site |

## Commands

```bash
npm run all        # generate, verify, build and check everything
npm run generate   # regenerate puzzle data (node build/generate.js --only=cipher-room to do one book)
npm run verify     # re-check every puzzle
npm run build      # rebuild docs/ and check it
npm run serve      # preview at http://localhost:8080/gridlock-puzzle-co/
```

## Connecting payments

Open `src/js/products.js` and paste each product's payment link into its `checkoutUrl`. The buy
button appears on that product page only when `checkoutUrl` is set. Set your payment provider to
redirect buyers to the product's thank-you page after payment; each product's path is in
`thankYouPath`, for example `thank-you/daily-grid/`. Then run `npm run build` (or edit
`docs/js/products.js` directly) and push.

## Support email

Set `supportEmail` in `src/js/site-config.js`. The Contact page and the footer show it as a mailto
link when it is set, and leave that line out when it is empty.

## How license keys work

Keys look like `GRID-DG-7KQ4M-X9D2P-H6TR`: a product code, ten random characters and four check
characters calculated from both, using an alphabet without 0, O, 1, I or L. The thank-you page
creates a key in the browser; the unlock page validates it and stores it in the browser's
localStorage. Everything runs client-side, so the site, its puzzle data and the key algorithm are
all public; keys deter casual sharing rather than enforce it.

## Administrator keys

Run `node build/admin-key.js` to create a key that opens every book. The key is printed once and
never saved; only its SHA-256 hash is added to `ADMIN_HASHES` in `src/js/license.js`, so it cannot be
worked out from the public site. Rebuild and deploy afterwards. To revoke a key, delete its hash from
that list and deploy again.
