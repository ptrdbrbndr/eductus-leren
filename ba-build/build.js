// Build tool: converts the Businessanalyse course markdown source (niveau 2 only,
// deel 11 t/m 22 + casusdossier) into static HTML pages for leren.eductus.nl.
// Mirrors the pattern of ../ddd-build/build.js, adapted to ba- classes and
// scoped to niveau-2 only (niveau 1 and niveau 3 are out of scope for this run).
// Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'businessanalyse');
const OUT = path.resolve(__dirname, '..', 'businessanalyse');
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

const BRAND = 'Businessanalyse';
const LEVEL_LABEL = 'Niveau 2 — Professional';
const NIVEAU_DIR = 'niveau-2';
const PARTS = range(11, 22);

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

// ---------- Figure lookup: glob figuren/deel-XX/figuur-<label>-*.svg ----------
const figureFileCache = new Map(); // "deel-11" -> [filenames]
function findFigureFile(dealDir, label) {
  if (!figureFileCache.has(dealDir)) {
    const dir = path.join(SRC, 'figuren', dealDir);
    figureFileCache.set(dealDir, fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  }
  const files = figureFileCache.get(dealDir);
  const prefix = `figuur-${label}-`;
  return files.find(f => f.startsWith(prefix) && f.endsWith('.svg'));
}

// ---------- Copy only the niveau-2-specific figuren (deel-11 .. deel-22) ----------
// The casusdossier figuren folder belongs to niveau 1 (figuur-C-1-*) and is
// intentionally skipped here.
function copyFiguren() {
  ensureDir(FIG_OUT);
  let count = 0;
  for (const num of PARTS) {
    const dealDir = `deel-${pad(num)}`;
    const from = path.join(SRC, 'figuren', dealDir);
    if (!fs.existsSync(from)) continue;
    const to = path.join(FIG_OUT, dealDir);
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

// ---------- Figure marker replacement ----------
// Matches [FIGUUR <label>: omschrijving...] or [FIGUUR <label>].
const FIGUUR_RE = /\[FIGUUR\s+([A-Za-z0-9.\-]+)\s*:?\s*([^\]]*)\]/g;

function replaceFiguren(text, dealDir, depth, missing) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const fname = findFigureFile(dealDir, label);
    let html;
    if (!fname) {
      missing.add(`${dealDir}/${label}`);
      html = `<p class="ba-figure-missing"><em>[Figuur ${label} ontbreekt: ${escapeHtml(caption.trim())}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = `${upDepth}figuren/${dealDir}/${fname}`;
      const alt = escapeHtml((caption || `Figuur ${label}`).trim());
      html = `<figure class="ba-figure"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>Figuur ${label} — ${alt}</figcaption></figure>`;
    }
    const placeholder = `BAFIGPLACEHOLDER${figurePlaceholderSeq++}BAFIGPLACEHOLDER`;
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

// ---------- HTML page template ----------
// dirDepth = levels up to reach businessanalyse/ (OUT root, where ba.css + figuren/ live)
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — ${BRAND} — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}ba.css">
</head>
<body>
<header class="ba-header">
  <div class="ba-header-inner">
    <a class="ba-brand" href="${root}index.html">${BRAND}</a>
    <nav class="ba-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="ba-main">
${nav ? nav.top : ''}
<article class="ba-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="ba-footer">
  <p>Ductus-cursusfamilie · ${BRAND} · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function firstH1(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function main() {
  ensureDir(OUT);
  const svgCount = copyFiguren();
  const missing = new Set();

  // Collect part titles first (from reader.md H1)
  const allParts = []; // {num, dealDir, title}
  for (const num of PARTS) {
    const dealDir = `deel-${pad(num)}`;
    const readerPath = path.join(SRC, NIVEAU_DIR, dealDir, 'reader.md');
    const text = fs.readFileSync(readerPath, 'utf8');
    const h1 = firstH1(text) || `Deel ${num}`;
    allParts.push({ num, dealDir, title: h1 });
  }

  // Title of niveau-1 deel-10 (source only — niveau 1 output is out of scope here),
  // used for the deel-11 "previous" partnav link per the assignment.
  const prevLevelReaderPath = path.join(SRC, 'niveau-1', 'deel-10', 'reader.md');
  const prevLevelTitle = fs.existsSync(prevLevelReaderPath)
    ? (firstH1(fs.readFileSync(prevLevelReaderPath, 'utf8')) || 'Deel 10')
    : 'Deel 10';

  let pageCount = 0;

  // ---- casusdossier niveau 2 ----
  const casusSrcPath = path.join(SRC, NIVEAU_DIR, '00-casusdossier.md');
  if (fs.existsSync(casusSrcPath)) {
    const raw = fs.readFileSync(casusSrcPath, 'utf8');
    const dirDepth = 1; // businessanalyse/niveau-2/00-casusdossier.html
    const withFig = replaceFiguren(raw, '00-casusdossier', dirDepth, missing);
    const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
    const title = firstH1(raw) || `Casusdossier — ${LEVEL_LABEL}`;
    const outDir = path.join(OUT, NIVEAU_DIR);
    ensureDir(outDir);
    const html = page({
      title,
      breadcrumb: `<a href="../index.html">Cursusoverzicht</a> &rsaquo; ${LEVEL_LABEL} &rsaquo; Casusdossier`,
      bodyHtml,
      nav: null,
      dirDepth,
    });
    fs.writeFileSync(path.join(outDir, '00-casusdossier.html'), html, 'utf8');
    pageCount++;
  }

  // ---- deel pages (11 t/m 22) ----
  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1]; // undefined for deel-11 -> falls back to niveau-1 deel-10
    const next = allParts[i + 1]; // undefined for deel-22 -> left empty per assignment
    const outDir = path.join(OUT, NIVEAU_DIR, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // businessanalyse/niveau-2/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, NIVEAU_DIR, part.dealDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, part.dealDir, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, NIVEAU_DIR, part.dealDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      let prevLink;
      if (prev) {
        prevLink = `<a class="ba-prevnext prev" href="../${prev.dealDir}/reader.html">&larr; ${escapeHtml(prev.title)}</a>`;
      } else {
        // deel-11: previous part lives in niveau 1, which sits one directory up.
        prevLink = `<a class="ba-prevnext prev" href="../../niveau-1/deel-10/reader.html">&larr; ${escapeHtml(prevLevelTitle)}</a>`;
      }
      const nextLink = next
        ? `<a class="ba-prevnext next" href="../${next.dealDir}/reader.html">${escapeHtml(next.title)} &rarr;</a>`
        : `<span></span>`; // deel-22: volgende deel (niveau 3, deel 23) volgt later

      const navTop = `<div class="ba-tabs">${tabs}</div>`;
      const navBottom = `<nav class="ba-partnav">${prevLink}${nextLink}</nav>`;

      const html = page({
        title,
        breadcrumb: `<a href="../../index.html">Cursusoverzicht</a> &rsaquo; Niveau 2 &rsaquo; Deel ${part.num} &rsaquo; ${dlv.label}`,
        bodyHtml,
        nav: { top: navTop, bottom: navBottom },
        dirDepth,
      });
      fs.writeFileSync(path.join(outDir, `${dlv.slug}.html`), html, 'utf8');
      pageCount++;
    }
  }

  // ---- ba.css (only written if it does not already exist, so a niveau-1 run
  // that ran first is never clobbered) ----
  const cssPath = path.join(OUT, 'ba.css');
  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, CSS, 'utf8');
    console.log('ba.css geschreven (bestond nog niet).');
  } else {
    console.log('ba.css bestond al — niet overschreven.');
  }

  console.log(`Klaar. ${pageCount} pagina's gebouwd (niveau 2: deel 11 t/m 22 + casusdossier).`);
  console.log(`SVG's gekopieerd: ${svgCount}`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een SVG-bestand.');
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
table { border-collapse: collapse; width: 100%; margin: 1.4rem 0; font-size: .95rem; }
th, td { border: 1px solid var(--border); padding: .5rem .7rem; text-align: left; vertical-align: top; }
th { background: #EFEAE0; color: var(--navy); }

.ba-header { background: var(--navy); color: #fff; padding: .9rem 1.5rem; }
.ba-header-inner { max-width: 880px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: .5rem 1.2rem; align-items: baseline; }
.ba-brand { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.3rem; color: #fff; text-decoration: none; }
.ba-breadcrumb { font-size: .85rem; color: #CFE0F2; }
.ba-breadcrumb a { color: #CFE0F2; }
.ba-breadcrumb a:hover { color: var(--amber); }

.ba-main { max-width: 880px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.ba-article p { margin: 1rem 0; }

.ba-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.6rem; }
.ba-tabs a { display: inline-block; padding: .4rem .9rem; border-radius: 999px; background: #fff; border: 1px solid var(--border); text-decoration: none; font-weight: 500; font-size: .92rem; color: var(--navy); }
.ba-tabs a.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.ba-tabs a:hover:not(.active) { border-color: var(--amber); color: var(--amber); }

.ba-partnav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2.5rem; padding-top: 1.2rem; border-top: 1px solid var(--border); font-size: .95rem; }
.ba-prevnext { text-decoration: none; max-width: 45%; }
.ba-prevnext.next { text-align: right; }

.ba-figure { margin: 1.8rem 0; text-align: center; }
.ba-figure img { max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 6px; background: #fff; }
.ba-figure figcaption { margin-top: .5rem; font-size: .85rem; color: var(--sub); font-style: italic; }

.ba-footer { text-align: center; padding: 2rem 1rem; color: var(--sub); font-size: .85rem; }
.ba-footer a { color: var(--sub); }

.ba-download-box { margin-top: 2.5rem; background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--amber); border-radius: 8px; padding: 1.2rem 1.6rem; }
.ba-download-box h2 { margin: 0 0 .8rem; font-size: 1.25rem; border-bottom: none; padding-bottom: 0; }
.ba-download-box ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.ba-download-box li { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding: .5rem .7rem; border-radius: 6px; background: var(--bg); }
.ba-download-box a { text-decoration: none; font-weight: 600; color: var(--navy); }
.ba-download-box a:hover { color: var(--amber); }
.ba-download-size { font-size: .8rem; color: var(--sub); white-space: nowrap; }

.ba-downloads-note { margin-top: .6rem; font-size: .92rem; color: var(--sub); }

.ba-index .ba-subtitle { color: var(--sub); font-size: 1.05rem; margin-bottom: 1.6rem; }
.ba-level { margin-top: 2.4rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.4rem 1.6rem; }
.ba-casus-link { display: inline-block; margin: .2rem 0 1rem; font-size: .9rem; color: var(--navy); font-weight: 500; }
.ba-part-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .4rem; }
.ba-part-list a { display: flex; gap: .8rem; align-items: baseline; text-decoration: none; padding: .5rem .6rem; border-radius: 6px; }
.ba-part-list a:hover { background: #FBF6E9; }
.ba-part-num { font-family: 'Cormorant Garamond', serif; font-weight: 700; color: var(--amber); min-width: 1.6rem; }
.ba-part-title { color: var(--ink); }
`;

main();
