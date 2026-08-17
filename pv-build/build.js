// Build tool: converts the "Nederlandse pensioenverzekering" course markdown source into
// static HTML pages for leren.eductus.nl. Bron is FLAT genaamd (deel-NN-<type>.md, geen
// deelmappen) — zie eductus-trainingen/pensioenverzekeringen/pensioenverzekering-cursus.
// Figuren zijn losse, met de hand getekende SVG's die al in de output-figuren-map staan
// (pensioenverzekeringen/figuren/deel-NN/figuur-x-y.svg) — dit script kopieert ze niet,
// het verwijst er alleen naar (en meldt ontbrekende figuren).
// Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'pensioenverzekeringen', 'pensioenverzekering-cursus');
const OUT = path.resolve(__dirname, '..', 'pensioenverzekeringen');
const FIG_OUT = path.join(OUT, 'figuren');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Figure block HTML (het volledige <figure>) wordt via placeholders geïnjecteerd, zodat
// markdown-it's typographer de rauwe HTML (quotes/paden in alt-tekst) niet verminkt.
const figurePlaceholders = new Map();
let figurePlaceholderSeq = 0;

const DELIVERABLES = [
  { file: 'reader', slug: 'reader', label: 'Reader' },
  { file: 'werkboek', slug: 'werkboek', label: 'Werkboek' },
  { file: 'docentenhandleiding', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { file: 'slidedeck', slug: 'slidedeck', label: 'Slidedeck' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament', sub: 'Wft Pensioen-niveau' },
  { n: 2, dir: 'niveau-2', parts: range(11, 21), label: 'Niveau 2 — Uitvoering en advies', sub: null },
  { n: 3, dir: 'niveau-3', parts: range(22, 30), label: 'Niveau 3 — Expert', sub: null },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

// ---------- 1. Figuur-label -> relatief pad, door FIG_OUT/deel-NN/figuur-x-y.svg te scannen ----------
function buildFigMap() {
  const map = {};
  if (!fs.existsSync(FIG_OUT)) return map;
  for (const dealDir of fs.readdirSync(FIG_OUT)) {
    const full = path.join(FIG_OUT, dealDir);
    if (!fs.statSync(full).isDirectory()) continue;
    const re = /^figuur-(\d+-\d+)\.svg$/i;
    for (const f of fs.readdirSync(full)) {
      const m = f.match(re);
      if (m) map[m[1]] = `figuren/${dealDir}/${f}`;
    }
  }
  return map;
}

// ---------- 2. Figure marker replacement ----------
// Standalone vorm (eigen regel, reader/slidedeck):
//   [FIGUUR 5-1: De scheidslijnkaart — vier toetsen ...]
//   [FIGUUR 1-1]
// -> volledig figuurblok met afbeelding + (indien aanwezig) bijschrift.
//
// Inline vorm (binnen een tabelcel of zin, alleen in docentenhandleiding):
//   | College, [FIGUUR 5-1] |
//   Teken de grafiek uit [FIGUUR 12-1] zelf op de flap...
// -> kleine tekstlink naar de figuur, geen los blok (zou tabellen/zinnen breken).

const STANDALONE_RE = /^\[FIGUUR\s+([\w.\-]+)(?:\s*:\s*([^\]]+))?\]\s*$/gm;
const INLINE_RE = /\[FIGUUR\s+([\w.\-]+)\]/g;

function replaceStandaloneFiguren(text, figMap, depth, missing) {
  return text.replace(STANDALONE_RE, (whole, label, caption) => {
    const relPath = figMap[label];
    const hasCaption = !!(caption && caption.trim());
    const cap = hasCaption ? caption.trim() : '';
    let html;
    if (!relPath) {
      missing.add(label);
      html = `<p class="pv-figure-missing"><em>[Figuur ${label} ontbreekt${hasCaption ? ': ' + escapeHtml(cap) : ''}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = upDepth + relPath;
      const alt = escapeHtml(hasCaption ? cap : `Figuur ${label}`);
      const figcaption = hasCaption ? `Figuur ${label} — ${escapeHtml(cap)}` : `Figuur ${label}`;
      html = `<figure class="pv-figure"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${figcaption}</figcaption></figure>`;
    }
    const placeholder = `PVFIGPLACEHOLDER${figurePlaceholderSeq++}PVFIGPLACEHOLDER`;
    figurePlaceholders.set(placeholder, html);
    return `\n\n${placeholder}\n\n`;
  });
}

function replaceInlineFiguren(text, figMap, depth) {
  return text.replace(INLINE_RE, (whole, label) => {
    const relPath = figMap[label];
    if (!relPath) return `<em>[figuur ${label} ontbreekt]</em>`;
    const upDepth = '../'.repeat(depth);
    return `<a class="pv-figref" href="${upDepth}${relPath}">figuur ${label}</a>`;
  });
}

function restoreFigurePlaceholders(html) {
  let out = html;
  for (const [placeholder, figHtml] of figurePlaceholders) {
    out = out.replace(`<p>${placeholder}</p>`, figHtml).replace(placeholder, figHtml);
  }
  return out;
}

// ---------- 3. HTML page template ----------
// dirDepth = niveaus omhoog naar OUT root (pensioenverzekeringen/), waar index.html + pv.css + figuren/ staan
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Nederlandse pensioenverzekering — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}pv.css">
</head>
<body>
<header class="pv-header">
  <div class="pv-header-inner">
    <a class="pv-brand" href="${root}index.html">Nederlandse pensioenverzekering</a>
    <nav class="pv-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="pv-main">
${nav ? nav.top : ''}
<article class="pv-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="pv-footer">
  <p>Ductus-cursusfamilie · Nederlandse pensioenverzekering · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
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
  const figMap = buildFigMap();
  const missing = new Set();

  const allParts = [];
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const readerPath = path.join(SRC, lvl.dir, `deel-${pad(num)}-reader.md`);
      const text = fs.readFileSync(readerPath, 'utf8');
      const h1 = firstH1(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, niveauDir: lvl.dir, title: h1 });
    }
  }

  let pageCount = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const dealDir = `deel-${pad(part.num)}`;
    const outDir = path.join(OUT, part.niveauDir, dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // pensioenverzekeringen/niveau-N/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, `deel-${pad(part.num)}-${dlv.file}.md`);
      if (!fs.existsSync(srcPath)) continue;
      let raw = fs.readFileSync(srcPath, 'utf8');
      raw = replaceStandaloneFiguren(raw, figMap, dirDepth, missing);
      raw = replaceInlineFiguren(raw, figMap, dirDepth);
      const bodyHtml = restoreFigurePlaceholders(md.render(raw));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, `deel-${pad(part.num)}-${d.file}.md`));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevDealDir = prev ? `deel-${pad(prev.num)}` : null;
      const nextDealDir = next ? `deel-${pad(next.num)}` : null;
      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prevDealDir}/reader.html` : `../../${prev.niveauDir}/${prevDealDir}/reader.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${nextDealDir}/reader.html` : `../../${next.niveauDir}/${nextDealDir}/reader.html`) : null;
      const prevLink = prev ? `<a class="pv-prevnext prev" href="${prevHref}">&larr; ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="pv-prevnext next" href="${nextHref}">${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="pv-tabs">${tabs}</div>`;
      const navBottom = `<nav class="pv-partnav">${prevLink}${nextLink}</nav>`;

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
  const introHtml = `<p>Deze Ductus-opleiding behandelt de Nederlandse pensioenverzekering in drie niveaus: het fundament (het pensioenstelsel, de pensioendriehoek, soorten pensioenovereenkomsten, verplichtstelling, de scheidslijn Wtp/niet-Wtp, overgangsrecht, risicodekkingen en de deelnemersreis), de professional-laag rond uitvoering en advies (het fiscale kader, producten en lifecycles, de uitkeringsfase, offerte en acceptatie, transitie in verzekerde regelingen, waardeoverdracht en invaren, communicatie en zorgplicht, data en mutatieprocessen, toezicht en geschillen) en het expert-niveau (pensioenrecht gevorderd, compensatie en evenwichtige belangenafweging, grensoverschrijdend pensioen en IORP II, DGA/ODV/derde pijler, productontwikkeling, actuariële grondslagen en solvabiliteit). Eén doorlopende casus loopt door alle dertig delen: Van Doorn Techniek, pensioenuitvoerder Meridiaan Pensioen, Bpf Techniek &amp; Installatie en Pensioenfonds Delta Chemie.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel). Deel 15 (niveau 2) en deel 30 (niveau 3) zijn tweedaagse delen.</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/deel-${pad(p.num)}/reader.html"><span class="pv-part-num">${p.num}</span><span class="pv-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="pv-level">
  <h2>${lvl.label}${lvl.sub ? ` <span class="pv-cert-note">— ${escapeHtml(lvl.sub)}</span>` : ''}</h2>
  <ol class="pv-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nederlandse pensioenverzekering — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="pv.css">
</head>
<body>
<header class="pv-header">
  <div class="pv-header-inner">
    <a class="pv-brand" href="index.html">Nederlandse pensioenverzekering</a>
    <nav class="pv-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="pv-main pv-index">
  <h1>Nederlandse pensioenverzekering</h1>
  <p class="pv-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · Wft Basis/Vermogen/Pensioen &rarr; Leergang Pensioenrecht/RPA</p>
  ${introHtml}
  ${levelBlocks}
</main>
<footer class="pv-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's + index.html gebouwd.`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle standalone [FIGUUR ...]-markers zijn gekoppeld aan een SVG.');
  }
}

main();
