'use strict';
// About, FAQ, Contact and policy pages.
const { SITE } = require('./layout');

const updated = `<p class="updated">Last updated: ${SITE.updated}</p>`;
const revised = `<p class="updated">Last updated: November 11, 2026</p>`;
const contactLink = r => `<a href="${r}contact/">contact us through the Contact page</a>`;

function head(title, kicker) {
  return `<div class="wrap"><header class="page-head"><span class="kicker">${kicker}</span><h1>${title}</h1></header></div>`;
}

const FAQ = r => [
  ['How do license keys work?', `<p>Every purchase comes with a license key, a code that looks like <code>GRID-DG-7KQ4M-X9D2P-H6TR</code>. The two characters after GRID say which product it is for, and the last group is a check that catches typing mistakes. Your key appears on your order confirmation page the moment your payment goes through. Enter it once and your puzzle books open in your library. There is no account and no password.</p>`],
  ['What do I receive after I buy?', `<p>You receive a license key, delivered on the order confirmation page the moment your payment goes through. The key unlocks the online puzzle book or books you bought: enter it on the <a href="${r}unlock/">Unlock page</a> and they appear in your library, ready to play in your web browser on a computer, tablet or phone. There are no files to download and nothing is shipped.</p><p>The confirmation page lets you copy your key, save a PDF of your order confirmation, or print it. We do not send the key by email, so please keep a copy. Every puzzle can also be printed for your own use.</p>`],
  ['Where do I enter my key?', `<p>On the <a href="${r}unlock/">Unlock page</a>, which you can reach at any time from the <strong>Have a key?</strong> link at the top of every page. Type the characters after GRID, or paste the whole key into the first box. The confirmation page also has an <strong>Open my puzzles</strong> button that fills it in for you.</p>`],
  ['How should I save my key?', `<p>Copy it somewhere you keep important things: a password manager, a note on your phone, or the email you used to pay. The confirmation page has a <strong>Copy key</strong> button, a <strong>Save confirmation</strong> button that downloads a PDF of your order confirmation with your key, and a <strong>Print</strong> button. Your library page also lists the keys saved on that device.</p>`],
  ['Can I use more than one device?', `<p>Yes. The same key works on any number of your own computers, tablets and phones. On each new device, open the Unlock page and enter the key again.</p>`],
  ['What if I lose my key?', `<p>If the device you unlocked still shows your library, the key is listed there. Otherwise, ${contactLink(r)} with your order number and we will send a replacement.</p>`],
  ['What is the difference between Core Books and Expert Editions?', `<p>The five Core Books cover the classics: sudoku, word search, cryptograms, logic grids and crosswords, each with a range from easy to expert. The Expert Editions are built to be harder in specific ways you can check: added sudoku rules such as cages and irregular regions, larger logic grids with more categories, full 15×15 crossword grids, fewer starting digits, and cryptograms with the word breaks removed. Each Expert Edition page lists exactly how it differs.</p>`],
  ['Can I print the puzzles?', `<p>Yes. Every puzzle has a <strong>Print</strong> button that produces a clean page with just the puzzle and its clues, and an <strong>Answer key</strong> button that prints the solution separately.</p>`],
  ['Does my progress sync between devices?', `<p>No. Progress is saved in the browser on each device, and it never leaves that device. A puzzle you start on your laptop will not appear half-finished on your phone. Each puzzle has a <strong>Reset progress</strong> button if you want to start it again.</p>`],
  ['Can teachers or puzzle clubs use these?', `<p>Each purchase is a personal license. If you would like to use the puzzles with a class or a club, ${contactLink(r)} and tell us roughly how many people you have in mind; we offer group licenses.</p>`],
  ['What is your refund policy?', `<p>You can have a full refund on any purchase within 14 days, with no reason needed. ${contactLink(r).replace('contact us', 'Contact us')} with your order number. Refunds go back to the original payment method within 5 business days of your request. The full details are in the <a href="${r}refunds/">Refund Policy</a>.</p>`],
];

function faqHtml(r, items) {
  return items.map(([q, a]) => `<details><summary>${q}</summary><div>${a}</div></details>`).join('\n');
}

const pages = {
  about: r => ({
    title: 'About Gridlock Puzzle Co.',
    description: 'Gridlock Puzzle Co. makes online puzzle books of sudoku, crosswords, cryptograms, logic grids and word searches that you unlock with a key and play in your browser.',
    body: head('About', 'Gridlock Puzzle Co.') + `<div class="wrap prose">
<p class="lede">Gridlock Puzzle Co. makes puzzle books for people who like the back page of the newspaper best.</p>
<p>We publish collections of sudoku, crosswords, cryptograms, logic grids and word searches. Each collection is an online puzzle book: you buy it once, unlock it with a key, and play it in any modern web browser on a computer, tablet or phone. Every puzzle can also be printed, because some puzzles are simply better with a pencil.</p>
<h2>How the puzzles are made</h2>
<p>We write our own word lists, clues, sayings and stories, and we build every grid with software we wrote for the purpose. Before a puzzle goes into a book, a solver checks it. Every sudoku has exactly one solution under its rules, and its difficulty is set by the hardest solving technique it needs. Every logic grid has one solution and can be finished by deduction alone. Every cryptogram has exactly one readable answer. In every word search, each word appears exactly once. Any puzzle that fails a check is thrown out and replaced.</p>
<h2>Why we do it this way</h2>
<p>We wanted puzzle books that are fair: no guessing, no broken grids, and no clues that only make sense to the person who wrote them. We also wanted them to be easy to own. There is no account to create, nothing to install, and nothing tracking how you play. Your key opens your books, and your progress stays on your own device.</p>
<h2>Two shelves</h2>
<p>The <a href="${r}index.html#books">Core Books</a> cover the five classic puzzle types, each from easy to expert. The <a href="${r}index.html#expert">Expert Editions</a> go further with added rules, larger grids and fewer starting clues, and every Expert Edition page says exactly what is different.</p>
<p>If you have a question, ${contactLink(r)}.</p>
</div>`,
  }),

  faq: r => ({
    title: 'Frequently asked questions · Gridlock Puzzle Co.',
    description: 'Answers about license keys, unlocking on more than one device, saving and replacing keys, printing puzzles, progress, group licenses and refunds.',
    body: head('Questions and answers', 'FAQ') + `<div class="wrap"><div class="faq prose">${faqHtml(r, FAQ(r))}</div>
<p style="margin-top:28px">Still stuck? ${contactLink(r).replace('contact us', 'Contact us')}.</p></div>`,
  }),

  contact: r => ({
    title: 'Contact · Gridlock Puzzle Co.',
    description: 'How to reach Gridlock Puzzle Co. for help with license keys, refunds, group licenses and puzzle questions, and what to include when you write.',
    body: head('Contact', 'Get in touch') + `<div class="wrap prose">
<p class="lede">We read every message and reply within two business days.</p>
<p data-support-email hidden class="note">Email us at <span data-email-slot></span></p>
<h2>What to include</h2>
<ul>
<li><strong>Your order number</strong>, from your payment receipt.</li>
<li><strong>The email address you used at checkout</strong>, so we can find your order.</li>
<li>For a lost key, which product it was for. For a puzzle question, the book and puzzle number.</li>
</ul>
<h2>What we can help with</h2>
<ul>
<li>Replacing a lost license key.</li>
<li>Refunds within 14 days of purchase; see the <a href="${r}refunds/">Refund Policy</a>.</li>
<li>Group licenses for teachers and puzzle clubs.</li>
<li>Reporting a puzzle you believe has an error. We check every report and correct any mistake.</li>
<li>Requests about your personal information; see the <a href="${r}privacy/">Privacy Policy</a>.</li>
</ul>
</div>`,
  }),

  refunds: r => ({
    title: 'Refund Policy · Gridlock Puzzle Co.',
    description: 'Full refunds on any Gridlock Puzzle Co. purchase requested within 14 days, with no reason required.',
    body: head('Refund Policy', 'Policies') + `<div class="wrap prose">${updated}
<h2>Full refunds within 14 days</h2>
<p>You can have a full refund on any purchase if you ask within 14 days of buying it. You do not need to give a reason.</p>
<h2>How to ask</h2>
<p>To request a refund, ${contactLink(r)} and include your order number. Including the email address you used at checkout helps us find your order quickly.</p>
<h2>When you will get your money back</h2>
<p>Refunds go back to the original payment method. We issue them within 5 business days of your request. Your payment provider may take a few more days to show the refund on your statement.</p>
</div>`,
  }),

  delivery: r => ({
    title: 'Delivery Policy · Gridlock Puzzle Co.',
    description: 'How Gridlock Puzzle Co. delivers its digital puzzle books: a license key shown on the order confirmation page immediately after payment. No physical shipment.',
    body: head('Delivery Policy', 'Policies') + `<div class="wrap prose">${revised}
<h2>What you receive</h2>
<p>Every Gridlock Puzzle Co. product is digital: one or more online puzzle books that you play in a web browser. When you buy, you receive a license key that unlocks the book or books in your purchase. There are no files to download and nothing to install.</p>
<h2>How delivery works, step by step</h2>
<ol>
<li><strong>Agree and check out.</strong> On the product page, tick the box to agree to the <a href="${r}terms/">Terms of Service</a> and <a href="${r}refunds/">Refund Policy</a>, then select <strong>Buy now</strong>. You pay on our payment provider\u2019s secure checkout page.</li>
<li><strong>Payment goes through.</strong> As soon as your payment is complete, the payment provider sends you back to our order confirmation page for your product.</li>
<li><strong>Your key is delivered.</strong> The order confirmation page shows your license key straight away, together with the product name, the date and time, and your order reference when the payment provider supplies one. Delivery is complete at this point.</li>
<li><strong>Keep a copy.</strong> Use <strong>Copy key</strong>, <strong>Save confirmation</strong> (a PDF of your order details and key) or <strong>Print</strong>. We do not send the key by email, so please save it before you leave the page.</li>
<li><strong>Unlock.</strong> Select <strong>Open my puzzles</strong>, or enter your key on the <a href="${r}unlock/">Unlock page</a>. Your books appear on your library shelf right away.</li>
<li><strong>Play.</strong> Open a book and play in your browser on a computer, tablet or phone. Every puzzle can also be printed.</li>
</ol>
<h2>When delivery happens</h2>
<p>Immediately after your payment is complete, on the order confirmation page. There is no waiting period and no manual processing.</p>
<h2>No physical shipment</h2>
<p>Nothing is mailed or shipped, and there are no shipping charges.</p>
<h2>Using more than one device</h2>
<p>The same key works on any of your own devices. On each new device, enter the key on the <a href="${r}unlock/">Unlock page</a>. Your puzzle progress is saved separately on each device.</p>
<h2>Lost keys</h2>
<p>If you lose your key, ${contactLink(r)} with your order number and we will send you a replacement.</p>
<h2>How long you have access</h2>
<p>Online access continues for as long as Gridlock Puzzle Co. operates. Every puzzle can also be printed, along with its answer key, so you can keep a paper copy.</p>
</div>`,
  }),

  privacy: r => ({
    title: 'Privacy Policy · Gridlock Puzzle Co.',
    description: 'Gridlock Puzzle Co. uses no cookies, analytics or advertising trackers. License keys and puzzle progress stay in your own browser.',
    body: head('Privacy Policy', 'Policies') + `<div class="wrap prose">${updated}
<p>This policy explains what information Gridlock Puzzle Co. handles and why. The short version: we collect as little as we can, and we never sell it.</p>
<h2>No cookies, analytics or trackers</h2>
<p>This site uses no cookies, no analytics and no advertising trackers.</p>
<h2>Your keys and progress stay on your device</h2>
<p>License keys you enter and your puzzle progress are saved only in your own browser’s local storage. They are never sent to us or anyone else. You can remove your keys at any time with <strong>Sign out on this device</strong> in your library, and clear a puzzle’s progress with <strong>Reset progress</strong>. Clearing your browser’s site data removes both.</p>
<h2>Payments</h2>
<p>Payments are handled by a third-party payment provider, which collects your payment details under its own privacy policy. Gridlock Puzzle Co. never sees your full card details.</p>
<h2>Order information we receive</h2>
<p>From the payment provider we receive order information: your name, your email address, the products you bought and your country. We use it only to provide support, to process refunds, and to meet our tax and accounting obligations.</p>
<h2>We never sell your information</h2>
<p>Your personal information is never sold, and never shared for advertising.</p>
<h2>Hosting and fonts</h2>
<p>Like any website, the pages are delivered by a hosting provider, and the typefaces are delivered by Google Fonts. Your browser contacts their servers to load the pages and fonts, which means they receive the standard technical details of a web request, such as your IP address. We do not receive that information, and none of your keys or progress is included in those requests.</p>
<h2>Your rights</h2>
<p>Wherever you live, you can ask us to:</p>
<ul>
<li><strong>Access</strong> the personal information we hold about you;</li>
<li><strong>Correct</strong> it if it is wrong;</li>
<li><strong>Delete</strong> it, except where the law requires us to keep it;</li>
<li><strong>Object</strong> to how we use it.</li>
</ul>
<p>These include your rights under the EU and UK General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). To use any of them, ${contactLink(r)}. We will not treat you differently for exercising your rights.</p>
<h2>How long we keep information</h2>
<p>We keep order information only as long as we need it to support your purchase and to meet legal and accounting requirements, such as keeping tax records for the period the law requires. After that we delete it.</p>
<h2>Children</h2>
<p>This site is not directed at children under 13, and we do not knowingly collect personal information from them.</p>
<h2>Changes to this policy</h2>
<p>If we change this policy, we will post the new version on this page and update the date at the top. If a change materially affects how we use information we already hold, we will also tell affected customers by email before it takes effect.</p>
<h2>Questions</h2>
<p>For any privacy question or request, ${contactLink(r)}.</p>
</div>`,
  }),

  terms: r => ({
    title: 'Terms of Service · Gridlock Puzzle Co.',
    description: 'The terms for buying and using Gridlock Puzzle Co. online puzzle books, including the personal-use license.',
    body: head('Terms of Service', 'Policies') + `<div class="wrap prose">${revised}
<h2>1. Accepting these terms</h2>
<p>By buying from Gridlock Puzzle Co. or using this site, you agree to these terms. If you do not agree, please do not buy or use the products.</p>
<h2>2. What you are buying</h2>
<p>Our products are online puzzle books. Each purchase comes with a license key that unlocks the book or books it covers. The puzzles are played in a web browser, and each one can be printed.</p>
<h2>3. Your license</h2>
<p>When you buy a product, we give you a personal license to play its puzzles and to print copies for your own personal use. Your key is for your own personal use. You may not share, publish, sell or transfer your key, and you may not share, publish or sell the puzzles, clues, stories or answers.</p>
<h2>4. Teachers and puzzle clubs</h2>
<p>If you would like to use the puzzles with a class, club or other group, ${contactLink(r)} about a group license.</p>
<h2>5. Prices, taxes and payment</h2>
<p>Prices are shown in US dollars on each product page. Pricing, applicable taxes and payment are handled by our payment provider at checkout, where you will see the final amount before you pay.</p>
<h2>6. Agreeing before checkout</h2>
<p>Before you can go to checkout, you must agree to these Terms of Service and our <a href="${r}refunds/">Refund Policy</a> by ticking the agreement box on the product page. The buy button stays disabled until you do. By completing a purchase, you confirm that you have read and accepted both.</p>
<h2>7. Delivery and refunds</h2>
<p>Your license key is delivered on the order confirmation page immediately after payment, as described in our <a href="${r}delivery/">Delivery Policy</a>. Refunds are covered by our <a href="${r}refunds/">Refund Policy</a>.</p>
<h2>8. Ownership</h2>
<p>All puzzles, clues, word lists, stories and site content are owned by Gridlock Puzzle Co. Buying a product gives you the license described above, not ownership of the content.</p>
<h2>9. Warranties</h2>
<p>We check every puzzle carefully and work to keep the site running well. To the extent permitted by law, the products and site are provided “as is”, without warranties of any kind, express or implied.</p>
<h2>10. Limitation of liability</h2>
<p>To the extent permitted by law, our total liability for any claim relating to a product or this site is limited to the amount you paid for that product.</p>
<h2>11. Changes to these terms</h2>
<p>We may update these terms from time to time. We will post the new version on this page and update the date at the top. The terms in effect when you made a purchase apply to that purchase.</p>
<h2>12. Contact</h2>
<p>If you have a question about these terms, ${contactLink(r)}.</p>
</div>`,
  }),

  disclaimer: r => ({
    title: 'Disclaimer · Gridlock Puzzle Co.',
    description: 'Gridlock Puzzle Co. puzzles are for entertainment. Every puzzle is checked for a single correct solution; report any error through the Contact page.',
    body: head('Disclaimer', 'Policies') + `<div class="wrap prose">${updated}
<h2>For entertainment</h2>
<p>Our puzzles are made for entertainment.</p>
<h2>Accuracy</h2>
<p>Every puzzle has been checked to have a single correct solution. If you find an error, please report it: ${contactLink(r)}, and it will be corrected.</p>
<h2>Difficulty ratings</h2>
<p>Difficulty ratings describe the solving techniques a puzzle requires. They are a guide only; how hard a puzzle feels depends on the solver.</p>
<h2>Independence</h2>
<p>Gridlock Puzzle Co. is independent. We are not affiliated with any newspaper, puzzle publisher, puzzle competition or game maker.</p>
</div>`,
  }),
};

module.exports = { pages, FAQ, faqHtml, contactLink };
