// Build tool: converts the volledige Businessanalyse course markdown source
// (niveau 1, 2 en 3) naar static HTML pages voor leren.eductus.nl.
// Vervangt de per-niveau hardcoded varianten van build.js door één generieke run.
// Run: node build-all.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'businessanalyse');
const OUT = path.resolve(__dirname, '..', 'businessanalyse');
const FIG_OUT = path.join(OUT, 'figuren');

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const figurePlaceholders = new Map();
let figurePlaceholderSeq = 0;

const DELIVERABLES = [
  { file: 'reader.md', slug: 'reader', label: 'Reader' },
  { file: 'werkboek.md', slug: 'werkboek', label: 'Werkboek' },
  { file: 'docentenhandleiding.md', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { file: 'slidedeck.md', slug: 'slidedeck', label: 'Slidedeck' },
];

const BRAND = 'Businessanalyse';

const NIVEAUS = [
  { dir: 'niveau-1', label: 'Niveau 1 — Fundament', range: [1, 10] },
  { dir: 'niveau-2', label: 'Niveau 2 — Professional', range: [11, 22] },
  { dir: 'niveau-3', label: 'Niveau 3 — Expert', range: [23, 30] },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function firstH1(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

// ---------- Figure lookup: glob figuren/deel-XX/figuur-<label>-*.svg ----------
const figureFileCache = new Map();
function findFigureFile(dealDir, label) {
  if (!figureFileCache.has(dealDir)) {
    const dir = path.join(SRC, 'figuren', dealDir);
    figureFileCache.set(dealDir, fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  }
  const files = figureFileCache.get(dealDir);
  const prefix = `figuur-${label}-`;
  return files.find(f => f.startsWith(prefix) && f.endsWith('.svg'));
}

// ---------- Copy alle figuren (alle delen + casusdossier) ----------
function copyFiguren() {
  ensureDir(FIG_OUT);
  let count = 0;
  const srcRoot = path.join(SRC, 'figuren');
  for (const sub of fs.readdirSync(srcRoot)) {
    const from = path.join(srcRoot, sub);
    if (!fs.statSync(from).isDirectory()) continue;
    const to = path.join(FIG_OUT, sub);
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
    out = out.replace(`<p>${placeholder}</p>`, figHtml).replace(placeholder, figHtml);
  }
  return out;
}

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

function main() {
  ensureDir(OUT);
  const svgCount = copyFiguren();
  const missing = new Set();
  let pageCount = 0;

  // alle delen over alle niveaus plat, met niveau-context, voor cross-niveau prev/next
  const allParts = [];
  for (const niv of NIVEAUS) {
    for (const num of range(niv.range[0], niv.range[1])) {
      const dealDir = `deel-${pad(num)}`;
      const readerPath = path.join(SRC, niv.dir, dealDir, 'reader.md');
      const text = fs.readFileSync(readerPath, 'utf8');
      const h1 = firstH1(text) || `Deel ${num}`;
      allParts.push({ num, dealDir, title: h1, niveauDir: niv.dir, niveauLabel: niv.label });
    }
  }

  for (const niv of NIVEAUS) {
    // ---- casusdossier ----
    const casusSrcPath = path.join(SRC, niv.dir, '00-casusdossier.md');
    if (fs.existsSync(casusSrcPath)) {
      const raw = fs.readFileSync(casusSrcPath, 'utf8');
      const dirDepth = 1;
      const withFig = replaceFiguren(raw, 'casusdossier', dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = firstH1(raw) || `Casusdossier — ${niv.label}`;
      const outDir = path.join(OUT, niv.dir);
      ensureDir(outDir);
      const html = page({
        title,
        breadcrumb: `<a href="../index.html">Cursusoverzicht</a> &rsaquo; ${niv.label} &rsaquo; Casusdossier`,
        bodyHtml, nav: null, dirDepth,
      });
      fs.writeFileSync(path.join(outDir, '00-casusdossier.html'), html, 'utf8');
      pageCount++;
    }

    // ---- deel-pagina's ----
    const nivParts = allParts.filter(p => p.niveauDir === niv.dir);
    for (const part of nivParts) {
      const globalIdx = allParts.indexOf(part);
      const prev = allParts[globalIdx - 1]; // undefined alleen voor deel-1
      const next = allParts[globalIdx + 1]; // undefined alleen voor deel-30
      const outDir = path.join(OUT, niv.dir, part.dealDir);
      ensureDir(outDir);
      const dirDepth = 2;

      for (const dlv of DELIVERABLES) {
        const srcPath = path.join(SRC, niv.dir, part.dealDir, dlv.file);
        if (!fs.existsSync(srcPath)) continue;
        const raw = fs.readFileSync(srcPath, 'utf8');
        const withFig = replaceFiguren(raw, part.dealDir, dirDepth, missing);
        const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
        const title = `${dlv.label} — ${part.title}`;

        const tabs = DELIVERABLES.map(d => {
          const exists = fs.existsSync(path.join(SRC, niv.dir, part.dealDir, d.file));
          if (!exists) return '';
          const active = d.slug === dlv.slug ? ' class="active"' : '';
          return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
        }).join('');

        let prevLink = '<span></span>';
        if (prev) {
          const crossNiveau = prev.niveauDir !== part.niveauDir;
          const href = crossNiveau ? `../../${prev.niveauDir}/${prev.dealDir}/reader.html` : `../${prev.dealDir}/reader.html`;
          prevLink = `<a class="ba-prevnext prev" href="${href}">&larr; ${escapeHtml(prev.title)}</a>`;
        }
        let nextLink = '<span></span>';
        if (next) {
          const crossNiveau = next.niveauDir !== part.niveauDir;
          const href = crossNiveau ? `../../${next.niveauDir}/${next.dealDir}/reader.html` : `../${next.dealDir}/reader.html`;
          nextLink = `<a class="ba-prevnext next" href="${href}">${escapeHtml(next.title)} &rarr;</a>`;
        }

        const navTop = `<div class="ba-tabs">${tabs}</div>`;
        const navBottom = `<nav class="ba-partnav">${prevLink}${nextLink}</nav>`;

        const html = page({
          title,
          breadcrumb: `<a href="../../index.html">Cursusoverzicht</a> &rsaquo; ${niv.label.split(' — ')[0]} &rsaquo; Deel ${part.num} &rsaquo; ${dlv.label}`,
          bodyHtml,
          nav: { top: navTop, bottom: navBottom },
          dirDepth,
        });
        fs.writeFileSync(path.join(outDir, `${dlv.slug}.html`), html, 'utf8');
        pageCount++;
      }
    }
  }

  console.log(`Klaar. ${pageCount} pagina's gebouwd over alle 3 niveaus (30 delen + 3 casusdossiers).`);
  console.log(`SVG's gekopieerd: ${svgCount}`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een SVG-bestand.');
  }
}

main();
