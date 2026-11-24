# Gridlock Puzzle Co.

Storefront, puzzle generator and in-browser puzzle player for Gridlock Puzzle Co. The finished
static site lives in `docs/`; two small server functions in `api/` confirm orders and check keys.

## Hosting

The site is hosted on Vercel at https://gridlock-puzzle-co.vercel.app (project `gridlock-puzzle-co`).
`vercel.json` serves `docs/`, rebuilds it from source with `node build/site.js` on every deploy, and
adds trailing slashes so relative links resolve. Deploy with `vercel deploy --prod` from this folder.
Canonical URLs, Open Graph tags and `sitemap.xml` use the Vercel address (`SITE.url` in
`build/pages/layout.js`). GitHub Pages also publishes `docs/`, but every page there redirects to the
Vercel site, because orders and keys need the functions in `api/`.

## Layout

| Path | What it is |
| --- | --- |
| `build/content/` | Hand-written content: crossword vocabulary and clues, themes, word lists, sentences, logic themes, casebook stories, content filter |
| `build/gen/` | Generators and solvers for sudoku (5 rule sets), crosswords, word searches, cryptograms and logic grids |
| `build/generate.js` | Builds every book into `generated/*.json`, checking each puzzle as it is made |
| `build/verify.js` | Independent re-check of every generated puzzle |
| `build/site.js` | Builds the static site into `docs/` |
| `build/check-site.js` | Checks every internal link and anchor, titles, descriptions, and searches the project for unfinished text |
| `api/` | Vercel functions: order confirmation (`order.js`), key check (`activate.js`), key signing and Stripe helpers |
| `src/` | Stylesheet and browser JavaScript (player, license keys, page scripts) |
| `docs/` | The published site |

## Commands

```bash
npm run all        # generate, verify, build and check everything
npm run generate   # regenerate puzzle data (node build/generate.js --only=cipher-room to do one book)
npm run verify     # re-check every puzzle
npm run build      # rebuild docs/ and check it
npm run serve      # preview at http://localhost:8080/gridlock-puzzle-co/ (with the api/ functions)
npm run setup-secret        # once: create LICENSE_SECRET and add it to Vercel
npm run key -- daily-grid   # issue a key that is not tied to an order, for example for a reviewer
npm run kit        # build the fulfillment evidence kit (see below)
```

## Connecting payments

Payments go through Stripe Payment Links.

1. Open `src/js/products.js` and paste each product's payment link (`https://buy.stripe.com/...`)
   into its `checkoutUrl`. The buy button appears on that product page only when `checkoutUrl` is
   set, together with an "I agree to the Terms of Service and Refund Policy" checkbox; the button
   stays disabled until the box is ticked.
2. In Stripe, set each payment link's after-payment behaviour to redirect to that product's order
   confirmation page with the checkout session ID added, for example
   `https://gridlock-puzzle-co.vercel.app/thank-you/daily-grid/?session_id={CHECKOUT_SESSION_ID}`.
   The page needs `session_id` to confirm the payment.
3. Set up the server settings (see Delivery records), run `npm run build` and deploy.

## Support email

Set `supportEmail` in `src/js/site-config.js`. The Contact page and the footer show it as a mailto
link when it is set, and leave that line out when it is empty.

## Delivery records

The order confirmation page and the Unlock page call two Vercel functions in `api/`:

- `GET /api/order/?session_id=...` checks the Stripe Checkout Session is paid, works out the
  product from its payment link, returns the license key for that order, and records the delivery
  on the Stripe payment.
- `POST /api/activate/` checks a key's signature and, when the key belongs to an order, records the
  unlock on the Stripe payment.

The records are metadata on the payment (Stripe Dashboard, open the payment, Metadata):
`gridlock_key`, `gridlock_product`, the time, IP address and browser of the first view
(`gridlock_delivered_at`, `_ip`, `_agent`) and of the first unlock (`gridlock_unlocked_at`, `_ip`,
`_agent`), how many times each happened (`gridlock_views`, `gridlock_unlocks`), and the latest of
each. Use them as evidence in a dispute. The Privacy Policy and Delivery Policy describe them.

The functions need two settings in the Vercel project (production):

- `LICENSE_SECRET`, the secret keys are signed with. Run `npm run setup-secret` once: it creates a
  random secret, saves it in `.env.local` (never committed) and adds it to Vercel. Changing it later
  makes every key issued so far stop working.
- `STRIPE_SECRET_KEY`, your Stripe secret key (a restricted key with read access to Checkout
  Sessions and Payment Links and write access to Payment Intents is enough). Add it with
  `npx vercel env add STRIPE_SECRET_KEY production`, and put the same line in `.env.local` for the
  fulfillment kit.

Redeploy after changing either. Until both are set, the order confirmation page says it cannot
confirm orders right now, and only administrator keys can be unlocked.

For local testing, `npm run serve` runs the functions too, using `.env.local`.

## How license keys work

Keys look like `GRID-DG-7KQ4M-X9D2P-H6TR`: a product code and fourteen characters, using an alphabet
without 0, O, 1, I or L. Seven of them are a signature (an HMAC with `LICENSE_SECRET`), so only the
server can make or check a key. A key for an order is derived from the Stripe Checkout Session ID,
so the same order always gets the same key. The Unlock page saves a key in the browser's
localStorage after the server accepts it. The puzzle data itself is public on the site, so keys
deter casual sharing rather than enforce it, and a refund does not switch a key off.

## Administrator keys

Run `node build/admin-key.js` to create a key that opens every book. The key is printed once and
never saved; only its SHA-256 hash is added to `ADMIN_HASHES` in `src/js/license.js`, so it cannot be
worked out from the public site. Administrator keys are checked in the browser and work without the
server settings. Rebuild and deploy afterwards. To revoke a key, delete its hash from that list and
deploy again.

## Lost and reviewer keys

A buyer who lost their key: find their payment in Stripe; the key is in its metadata as
`gridlock_key`. For keys that are not tied to an order, such as reviewer keys, run
`npm run key -- <product-id>` (needs `LICENSE_SECRET` in `.env.local`); run it without a product id
to list them. Their use is not recorded.

## Fulfillment evidence kit

`npm run kit` walks the purchase-to-delivery flow on the live site in Microsoft Edge for every
product that has a completed order, using that real order for the confirmation step, then reads the
delivery records back from Stripe. It writes `fulfillment-kit/`: screenshots of every step, a screen
recording, the saved confirmation PDFs, one verified reviewer key per product, a pasteable business
and fulfillment summary, and `Fulfillment-Overview.pdf` for payment processor reviews. Start with
`fulfillment-kit/READ-ME-FIRST.txt`. The folder is in `.gitignore` and `.vercelignore`, so it is
never committed or published.

It needs `STRIPE_SECRET_KEY` and `LICENSE_SECRET` in `.env.local` with the same values as the live
site, and one completed order per product to show (Stripe test mode works while the site uses test
payment links). One-time setup: `npm install`, then `npx playwright-core install ffmpeg` (the video
encoder). Set `KIT_CHANNEL=chrome` to use Chrome instead of Edge, `KIT_OUT` to write somewhere else,
or pass another site address as an argument. The payment step happens on Stripe's site and is
described in writing, not captured. The kit's own visits are recorded on the orders it uses.
