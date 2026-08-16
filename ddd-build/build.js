// Build tool: converts the DDD course markdown source into static HTML pages
// for leren.eductus.nl. Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Domain-Driven Design');
const OUT = path.resolve(__dirname, '..', 'domain-driven-design');
const FIG_OUT = path.join(OUT, 'figuren');

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

// Figure HTML is injected via placeholders (rendered markdown text goes through
// typographer, which would mangle raw HTML like quotes/paths), then swapped in
// after rendering.
const figurePlaceholders = new Map(); // placeholder -> html
let figurePlaceholderSeq = 0;

const DELIVERABLES = [
  { file: 'reader.md', slug: 'reader', label: 'Reader' },
  { file: 'werkboek.md', slug: 'werkboek', label: 'Werkboek' },
  { file: 'docentenhandleiding.md', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { file: 'slidedeck.md', slug: 'slidedeck', label: 'Slidedeck' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament' },
  { n: 2, dir: 'niveau-2', parts: range(11, 22), label: 'Niveau 2 — Het landschap' },
  { n: 3, dir: 'niveau-3', parts: range(23, 30), label: 'Niveau 3 — Masterproef' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

// ---------- 1. Parse figuren-manifest.md: label -> relative svg path ----------
function parseManifest() {
  const text = fs.readFileSync(path.join(SRC, 'figuren-manifest.md'), 'utf8');
  const map = {};
  const lineRe = /\|\s*FIGUUR\s+([A-Za-z0-9.\-]+)\s*\|.*?`(figuren\/[^`]+\.svg)`/;
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(lineRe);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

// ---------- 2. Copy all figuren SVGs ----------
function copyFiguren() {
  const src = path.join(SRC, 'figuren');
  ensureDir(FIG_OUT);
  const dirs = fs.readdirSync(src, { withFileTypes: true }).filter(d => d.isDirectory());
  let count = 0;
  for (const d of dirs) {
    const from = path.join(src, d.name);
    const to = path.join(FIG_OUT, d.name);
    ensureDir(to);
    for (const f of fs.readdirSync(from)) {
      if (f.endsWith('.svg')) {
        fs.copyFileSync(path.join(from, f), path.join(to, f));
        count++;
      }
    }
  }
  return count;
}

// ---------- 3. Figure marker replacement ----------
// Matches [FIGUUR <label>: omschrijving...] or [FIGUUR <label>] possibly across lines.
const FIGUUR_RE = /\[FIGUUR\s+([A-Za-z0-9.\-]+)\s*:?\s*([^\]]*)\]/g;

function replaceFiguren(text, figMap, depth, missing) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const relPath = figMap[label];
    let html;
    if (!relPath) {
      missing.add(label);
      html = `<p class="ddd-figure-missing"><em>[Figuur ${label} ontbreekt in manifest: ${escapeHtml(caption.trim())}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = upDepth + relPath;
      const alt = escapeHtml((caption || `Figuur ${label}`).trim());
      html = `<figure class="ddd-figure"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>Figuur ${label} — ${alt}</figcaption></figure>`;
    }
    const placeholder = `DDDFIGPLACEHOLDER${figurePlaceholderSeq++}DDDFIGPLACEHOLDER`;
    figurePlaceholders.set(placeholder, html);
    return `\n\n${placeholder}\n\n`;
  });
}

function restoreFigurePlaceholders(html) {
  let out = html;
  for (const [placeholder, figHtml] of figurePlaceholders) {
    // markdown-it wraps the placeholder paragraph in <p>...</p>
    out = out.replace(`<p>${placeholder}</p>`, figHtml).replace(placeholder, figHtml);
  }
  return out;
}

// ---------- 4. HTML page template ----------
// dirDepth = levels up to reach domain-driven-design/ (OUT root, where index.html + ddd.css + figuren/ live)
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Domain-Driven Design — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}ddd.css">
</head>
<body>
<header class="ddd-header">
  <div class="ddd-header-inner">
    <a class="ddd-brand" href="${root}index.html">Domain-Driven Design</a>
    <nav class="ddd-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="ddd-main">
${nav ? nav.top : ''}
<article class="ddd-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="ddd-footer">
  <p>Ductus-cursusfamilie · Domain-Driven Design · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 5. Build per-part metadata (title) ----------
function firstH1(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function main() {
  ensureDir(OUT);
  const figMap = parseManifest();
  const svgCount = copyFiguren();
  const missing = new Set();

  // Collect part titles first (from reader.md H1)
  const allParts = []; // {niveau, num, dir, title}
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const dealDir = `deel-${pad(num)}`;
      const readerPath = path.join(SRC, lvl.dir, dealDir, 'reader.md');
      const text = fs.readFileSync(readerPath, 'utf8');
      const h1 = firstH1(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, dealDir, niveauDir: lvl.dir, title: h1 });
    }
  }

  function partByNum(num) { return allParts.find(p => p.num === num); }

  let pageCount = 0;

  // ---- casusdossiers (one per niveau) ----
  for (const lvl of NIVEAUS) {
    const srcPath = path.join(SRC, lvl.dir, '00-casusdossier.md');
    if (!fs.existsSync(srcPath)) continue;
    const raw = fs.readFileSync(srcPath, 'utf8');
    const dirDepth = 1; // domain-driven-design/niveau-N/00-casusdossier.html
    const withFig = replaceFiguren(raw, figMap, dirDepth, missing);
    const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
    const title = firstH1(raw) || `Casusdossier — ${lvl.label}`;
    const outDir = path.join(OUT, lvl.dir);
    ensureDir(outDir);
    const html = page({
      title,
      breadcrumb: `<a href="../index.html">Cursusoverzicht</a> &rsaquo; ${lvl.label} &rsaquo; Casusdossier`,
      bodyHtml,
      nav: null,
      dirDepth,
    });
    fs.writeFileSync(path.join(outDir, '00-casusdossier.html'), html, 'utf8');
    pageCount++;
  }

  // ---- deel pages ----
  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // domain-driven-design/niveau-N/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, part.dealDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, figMap, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, part.dealDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevLink = prev ? `<a class="ddd-prevnext prev" href="../${prev.dealDir}/reader.html">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="ddd-prevnext next" href="../${next.dealDir}/reader.html">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="ddd-tabs">${tabs}</div>`;
      const navBottom = `<nav class="ddd-partnav">${prevLink}${nextLink}</nav>`;

      const html = page({
        title,
        breadcrumb: `<a href="../../index.html">Cursusoverzicht</a> &rsaquo; Niveau ${part.niveau} &rsaquo; Deel ${part.num} &rsaquo; ${dlv.label}`,
        bodyHtml,
        nav: { top: navTop, bottom: navBottom },
        dirDepth,
      });
      fs.writeFileSync(path.join(outDir, `${dlv.slug}.html`), html, 'utf8');
      pageCount++;
    }
  }

  // ---- index.html ----
  const opzetPath = path.join(SRC, '00-analyse-en-opzet.md');
  let introHtml = '';
  if (fs.existsSync(opzetPath)) {
    const opzet = fs.readFileSync(opzetPath, 'utf8');
    // Use section "5. casusinvulling" niveau descriptions + generic intro paragraph.
    introHtml = `<p>Deze Ductus-opleiding bereidt voor op de iSAQB Advanced Level-module <em>Domain-Driven Design</em> en behandelt DDD in drie niveaus: het fundament (entities, value objects, aggregates, domain events), het complete applicatielandschap (bounded contexts, context mapping, EventStorming, teamtopologie) en een masterproefscenario met boardsimulatie. De cursus volgt één doorlopende casus bij pensioenuitvoerder Meridiaan Pensioen, van het Nabestaandenloket in niveau 1 tot de fusie met Kustveer in niveau 3.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;
  }

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="ddd-part-num">${p.num}</span><span class="ddd-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    const casusHref = fs.existsSync(path.join(SRC, lvl.dir, '00-casusdossier.md'))
      ? `<a class="ddd-casus-link" href="${lvl.dir}/00-casusdossier.html">Casusdossier ${lvl.label.split('—')[0].trim()}</a>` : '';
    return `<section class="ddd-level">
  <h2>${lvl.label}</h2>
  ${casusHref}
  <ol class="ddd-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Domain-Driven Design — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="ddd.css">
</head>
<body>
<header class="ddd-header">
  <div class="ddd-header-inner">
    <a class="ddd-brand" href="index.html">Domain-Driven Design</a>
    <nav class="ddd-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="ddd-main ddd-index">
  <h1>Domain-Driven Design</h1>
  <p class="ddd-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · voorbereiding op de iSAQB Advanced Level-module Domain-Driven Design</p>
  ${introHtml}
  ${levelBlocks}
</main>
<footer class="ddd-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  // ---- ddd.css ----
  fs.writeFileSync(path.join(OUT, 'ddd.css'), CSS, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's + ${NIVEAUS.length} casusdossiers + index.html gebouwd.`);
  console.log(`SVG's gekopieerd: ${svgCount}`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een SVG uit het manifest.');
  }
}

const CSS = `
:root {
  --navy: #1A4F8B;
  --amber: #E8A020;
  --ink: #0D1B2A;
  --sub: #5B6675;
  --bg: #F5F4F0;
  --card: #FFFFFF;
  --border: #E3E0D8;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: 'DM Sans', system-ui, sans-serif;
  line-height: 1.65;
}
h1, h2, h3, h4 { font-family: 'Cormorant Garamond', Georgia, serif; color: var(--navy); font-weight: 600; line-height: 1.2; }
h1 { font-size: 2.6rem; margin: 0 0 .4rem; }
h2 { font-size: 1.9rem; margin-top: 2.2rem; border-bottom: 2px solid var(--amber); padding-bottom: .3rem; }
h3 { font-size: 1.4rem; margin-top: 1.6rem; }
a { color: var(--navy); }
a:hover { color: var(--amber); }
blockquote {
  border-left: 4px solid var(--amber);
  margin: 1.2rem 0;
  padding: .4rem 1rem;
  background: #FBF6E9;
  color: var(--ink);
}
code { background: #EEF2F7; padding: .1em .35em; border-radius: 3px; font-size: .9em; }
pre { background: #0D1B2A; color: #F5F4F0; padding: 1rem; border-radius: 6px; overflow-x: auto; }

.ddd-header { background: var(--navy); color: #fff; padding: .9rem 1.5rem; }
.ddd-header-inner { max-width: 880px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: .5rem 1.2rem; align-items: baseline; }
.ddd-brand { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.3rem; color: #fff; text-decoration: none; }
.ddd-breadcrumb { font-size: .85rem; color: #CFE0F2; }
.ddd-breadcrumb a { color: #CFE0F2; }
.ddd-breadcrumb a:hover { color: var(--amber); }

.ddd-main { max-width: 880px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.ddd-article p { margin: 1rem 0; }

.ddd-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.6rem; }
.ddd-tabs a { display: inline-block; padding: .4rem .9rem; border-radius: 999px; background: #fff; border: 1px solid var(--border); text-decoration: none; font-weight: 500; font-size: .92rem; color: var(--navy); }
.ddd-tabs a.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.ddd-tabs a:hover:not(.active) { border-color: var(--amber); color: var(--amber); }

.ddd-partnav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2.5rem; padding-top: 1.2rem; border-top: 1px solid var(--border); font-size: .95rem; }
.ddd-prevnext { text-decoration: none; max-width: 45%; }
.ddd-prevnext.next { text-align: right; }

.ddd-figure { margin: 1.8rem 0; text-align: center; }
.ddd-figure img { max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 6px; background: #fff; }
.ddd-figure figcaption { margin-top: .5rem; font-size: .85rem; color: var(--sub); font-style: italic; }

.ddd-footer { text-align: center; padding: 2rem 1rem; color: var(--sub); font-size: .85rem; }
.ddd-footer a { color: var(--sub); }

.ddd-index .ddd-subtitle { color: var(--sub); font-size: 1.05rem; margin-bottom: 1.6rem; }
.ddd-level { margin-top: 2.4rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.4rem 1.6rem; }
.ddd-casus-link { display: inline-block; margin: .2rem 0 1rem; font-size: .9rem; color: var(--navy); font-weight: 500; }
.ddd-part-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .4rem; }
.ddd-part-list a { display: flex; gap: .8rem; align-items: baseline; text-decoration: none; padding: .5rem .6rem; border-radius: 6px; }
.ddd-part-list a:hover { background: #FBF6E9; }
.ddd-part-num { font-family: 'Cormorant Garamond', serif; font-weight: 700; color: var(--amber); min-width: 1.6rem; }
.ddd-part-title { color: var(--ink); }
`;

main();
