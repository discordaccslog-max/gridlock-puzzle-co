'use strict';
// Page shell shared by every page. All links are relative so the site works at any path,
// including a GitHub Pages project path.

const SITE = {
  name: 'Gridlock Puzzle Co.',
  url: 'https://gridlock-puzzle-co.vercel.app/',
  updated: 'November 8, 2026',
  year: 2026,
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function relRoot(outPath) {
  const depth = outPath.split('/').length - 1;
  return depth ? '../'.repeat(depth) : '';
}

const LOGO = '<svg viewBox="0 0 30 30" aria-hidden="true"><rect x="1" y="1" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"/>' +
  '<path d="M10.3 1v28M19.7 1v28M1 10.3h28M1 19.7h28" stroke="currentColor" stroke-width="1.4"/>' +
  '<rect x="1.8" y="1.8" width="7.8" height="7.8" fill="currentColor"/><rect x="20.4" y="20.4" width="7.8" height="7.8" fill="currentColor"/>' +
  '<rect x="11" y="11" width="8" height="8" fill="#b0122b"/></svg>';

function header(r, current) {
  const link = (href, label, key) => `<a href="${r}${href}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap masthead">
    <a class="logo" href="${r}index.html" aria-label="Gridlock Puzzle Co. home">${LOGO}<span class="logo-word">Gridlock<small>PUZZLE CO.</small></span></a>
    <nav class="nav" id="site-nav" aria-label="Main">
      ${link('index.html#books', 'Books', 'books')}
      ${link('library/', 'My library', 'library')}
      ${link('faq/', 'FAQ', 'faq')}
      ${link('about/', 'About', 'about')}
      <a class="key-link" href="${r}unlock/"${current === 'unlock' ? ' aria-current="page"' : ''}>Have a key?</a>
    </nav>
    <button type="button" class="theme-toggle" aria-label="Switch color theme"></button>
    <button type="button" class="menu-toggle" aria-controls="site-nav" aria-expanded="false" aria-label="Menu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
  </div>
</header>`;
}

function footer(r) {
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <p class="footer-name">Gridlock Puzzle Co.</p>
      <p class="muted">Online puzzle books, unlocked with a key and played in your browser.</p>
      <p data-support-email hidden>Support: <span data-email-slot></span></p>
    </div>
    <nav aria-label="Policies and contact">
      <ul class="footer-links">
        <li><a href="${r}terms/">Terms</a></li>
        <li><a href="${r}privacy/">Privacy</a></li>
        <li><a href="${r}refunds/">Refunds</a></li>
        <li><a href="${r}delivery/">Delivery</a></li>
        <li><a href="${r}disclaimer/">Disclaimer</a></li>
        <li><a href="${r}contact/">Contact</a></li>
      </ul>
    </nav>
  </div>
  <div class="wrap"><p class="copyright">&copy; <span data-year>${SITE.year}</span> Gridlock Puzzle Co. All rights reserved.</p></div>
</footer>`;
}

/**
 * opts: { out, title, description, body, current, scripts:[...], noindex, ogType, head, bodyClass, base }
 */
function page(opts) {
  const r = opts.base !== undefined ? '' : relRoot(opts.out);
  const canonicalPath = opts.out.replace(/index\.html$/, '');
  const url = SITE.url + canonicalPath;
  const scripts = ['js/site-config.js', 'js/products.js'].concat(opts.scripts || []).concat(['js/site.js']);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${opts.base ? opts.base + '\n' : ''}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
${opts.noindex ? '<meta name="robots" content="noindex, nofollow">' : `<link rel="canonical" href="${url}">`}
<meta property="og:site_name" content="Gridlock Puzzle Co.">
<meta property="og:title" content="${esc(opts.ogTitle || opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:type" content="${opts.ogType || 'website'}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Gridlock Puzzle Co. wordmark built from crossword squares">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f3efe4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${r}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap">
<link rel="stylesheet" href="${r}css/style.css">
<script>try{var t=localStorage.getItem('gridlock.theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);}catch(e){}</script>
${opts.head || ''}
</head>
<body${opts.bodyClass ? ` class="${opts.bodyClass}"` : ''}>
${header(r, opts.current)}
<main id="main">
${opts.body}
</main>
${footer(r)}
${scripts.map(s => `<script src="${r}${s}"></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = { page, esc, relRoot, SITE, LOGO };
