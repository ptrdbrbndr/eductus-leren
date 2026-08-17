// Build tool: converts the Business- en enterprise-architectuur course markdown source
// into static HTML pages for leren.eductus.nl (fase 2 — interactieve leesversie, bovenop
// het downloadblok van fase 1). Mirrort risico-build/build.js en pm-build/build.js; zie
// die scripts voor het oorspronkelijke patroon. Run: node build.js
//
// Afwijkingen t.o.v. risico-build/pm-build (bronstructuur is anders):
//  - Bronbestanden staan plat in niveau-N/ (deel-NN-reader.md etc.), geen deelmappen.
//  - Figuren zitten al gepubliceerd in enterprise-architectuur/figuren/deel-NN/*.png
//    (fase 1) en worden hier NIET opnieuw gekopieerd, alleen gelinkt via figures-manifest.json.
//  - Slidedeck.md gebruikt gewone "### Slide N — Titel"-koppen (geen "**Sheet N — ...**"
//    bold-markers zoals bij PM), dus alle vier deliverables lopen door dezelfde
//    markdown-it-pijplijn — geen apart sheet-parser nodig.
//  - [FIGUUR x-y: bijschrift]-tags staan altijd los op hun eigen regel (nooit in een kop),
//    dus geen normalizeSlideHeadingFigures() nodig zoals in risico-build.
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'EnterpriseArchitectuur');
const OUT = path.resolve(__dirname, '..', 'enterprise-architectuur');
const FIG_MANIFEST = path.join(SRC, '_bouwstenen', 'scripts', 'figures-manifest.json');

// Geen losse HTML-tags in de bronbestanden (geverifieerd), html:true is vooral een vangnet.
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Figure HTML wordt via placeholders geïnjecteerd (typographer zou ruwe HTML met quotes/
// paths verminken als die al vóór het renderen in de tekst stond), en na het renderen
// teruggezet — zelfde techniek als risico-build.
const figurePlaceholders = new Map();
let figurePlaceholderSeq = 0;

const DELIVERABLES = [
  { file: 'reader.md', slug: 'reader', label: 'Reader' },
  { file: 'werkboek.md', slug: 'werkboek', label: 'Werkboek' },
  { file: 'docentenhandleiding.md', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { file: 'slidedeck.md', slug: 'slidedeck', label: 'Slidedeck' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament' },
  { n: 2, dir: 'niveau-2', parts: range(11, 22), label: 'Niveau 2 — Professional' },
  { n: 3, dir: 'niveau-3', parts: range(23, 30), label: 'Niveau 3 — Expert' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 1. Figuur-label ("x-y") -> relatief pad in de al-gepubliceerde figuren/deel-NN/ ----------
function buildFigMap() {
  const manifest = JSON.parse(fs.readFileSync(FIG_MANIFEST, 'utf8'));
  const map = {};
  for (const [id, filename] of Object.entries(manifest)) {
    const dealNum = parseInt(id.split('-')[0], 10);
    const relPath = `figuren/deel-${pad(dealNum)}/${filename}`;
    if (!fs.existsSync(path.join(OUT, relPath))) {
      console.log(`WAARSCHUWING: manifest verwijst naar ontbrekend bestand ${relPath} (figuur ${id})`);
      continue;
    }
    map[id] = relPath;
  }
  return map;
}

// ---------- 2. Figure-marker vervanging: "[FIGUUR x-y: bijschrift]", los op eigen regel ----------
const FIGUUR_RE = /^\[FIGUUR\s+([\w.-]+):\s*(.+)\]$/gm;

function replaceFiguren(text, figMap, depth, missing) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const cap = caption.trim();
    const relPath = figMap[label];
    let html;
    if (!relPath) {
      missing.add(label);
      html = `<p class="ea-figure-missing"><em>[Figuur ${label} ontbreekt: ${escapeHtml(cap)}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = upDepth + relPath;
      html = `<figure class="ea-figure"><img src="${src}" alt="${escapeHtml(cap)}" loading="lazy"><figcaption>Figuur ${label} — ${escapeHtml(cap)}</figcaption></figure>`;
    }
    const placeholder = `EAFIGPLACEHOLDER${figurePlaceholderSeq++}EAFIGPLACEHOLDER`;
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

// ---------- 3. HTML page template ----------
// dirDepth = aantal niveaus omhoog naar enterprise-architectuur/ (OUT root, waar index.html
// + enterprise-architectuur.css + figuren/ staan)
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Business- en enterprise-architectuur — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}enterprise-architectuur.css">
</head>
<body>
<header class="ea-header">
  <div class="ea-header-inner">
    <a class="ea-brand" href="${root}index.html">Business- en enterprise-architectuur</a>
    <nav class="ea-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="ea-main">
${nav ? nav.top : ''}
<article class="ea-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="ea-footer">
  <p>Ductus-cursusfamilie · Business- en enterprise-architectuur · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const DOWNLOAD_FILES = [
  { file: 'reader.docx', label: 'Reader (.docx)' },
  { file: 'werkboek.docx', label: 'Werkboek (.docx)' },
  { file: 'docentenhandleiding.docx', label: 'Docentenhandleiding (.docx)' },
  { file: 'slidedeck.pptx', label: 'Slidedeck (.pptx)' },
];

// Downloads staan al in de outputmap zelf (fase 1 heeft ze daar neergezet), niet in SRC.
function downloadBox(outDir) {
  const items = DOWNLOAD_FILES.map(d => {
    const p = path.join(outDir, d.file);
    if (!fs.existsSync(p)) return '';
    const size = formatSize(fs.statSync(p).size);
    return `<li><a href="${d.file}">${d.label}</a><span class="ea-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="ea-download-box">
  <h2>Dit deel downloaden</h2>
  <ul>
  ${items}
  </ul>
</aside>`;
}

function firstH1(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

// "## Deel N · Reader — <Titel>" -> "<Titel>"
function dealTitleFromReader(text) {
  const m = text.match(/^##\s*Deel\s+\d+\s*·\s*Reader\s*—\s*(.+)$/m);
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
      const title = dealTitleFromReader(text) || firstH1(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, dealDir: `deel-${pad(num)}`, niveauDir: lvl.dir, title });
    }
  }

  let pageCount = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // enterprise-architectuur/niveau-N/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, `deel-${pad(part.num)}-${dlv.file}`);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, figMap, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, `deel-${pad(part.num)}-${d.file}`));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      // Valkuil (bekend uit eerdere buildscripts in deze familie, bv. DDD): het pad over een
      // niveaugrens heen moet een extra "../niveau-X/" bevatten, anders wijst het naar een
      // niet-bestaande map binnen hetzelfde niveau. Expliciet getest op deel 10↔11 en 22↔23.
      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.dealDir}/reader.html` : `../../${prev.niveauDir}/${prev.dealDir}/reader.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.dealDir}/reader.html` : `../../${next.niveauDir}/${next.dealDir}/reader.html`) : null;
      const prevLink = prev ? `<a class="ea-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="ea-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="ea-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(outDir)}\n<nav class="ea-partnav">${prevLink}${nextLink}</nav>`;

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

  // ---- index.html: volledig geregenereerd, zelfde ingreep als bij PM
  // (git show 8eb2dfc:project-en-programmamanagement/index.html vs. de huidige versie):
  // het downloadblok-per-deel (4 losse .docx/.pptx-links) wordt een link naar de
  // interactieve reader.html; de vier downloads zelf verhuizen naar de download-box
  // onderaan elke deliverable-pagina. Niveau-secties/titels/intro blijven inhoudelijk
  // hetzelfde, alleen de linkdoelen + lijstopmaak veranderen.
  const CERT = {
    1: 'TOGAF® EA Foundation (OGEA-101) + ArchiMate® 3 Part 1',
    2: 'TOGAF® EA Practitioner + ArchiMate® Part 2',
    3: 'Open CA (Open Certified Architect)',
  };
  const introHtml = `<p>Deze Ductus-opleiding behandelt business- en enterprise-architectuur in drie niveaus: het fundament (TOGAF® EA Foundation — de ADM, de architectuurdomeinen, ArchiMate® 3 Part 1), het professional-niveau (TOGAF® EA Practitioner — iteraties op programmaschaal, BIZBOK-businessarchitectuur, ArchiMate Part 2) en het expertniveau (Open CA — evidence-schrijfvaardigheid, portfoliobesluiten, boardverdediging). Een doorlopende casus bij pensioenuitvoerder "Meridiaan" (het werkgeversdossier WGP 2.0 → Programma Mutatieplatform → Programma Stelselovergang/Wtp) loopt door alle drie niveaus.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel, inclusief getekende figuren), een <strong>werkboek</strong> (opdrachten met modeluitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="ea-part-num">${p.num}</span><span class="ea-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="ea-level">
<h2>${lvl.label} <span class="ea-cert-note">— ${CERT[lvl.n]}</span></h2>
<ol class="ea-part-list">
${items}
</ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Business- en enterprise-architectuur — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="enterprise-architectuur.css">
</head>
<body>
<header class="ea-header">
  <div class="ea-header-inner">
    <a class="ea-brand" href="index.html">Business- en enterprise-architectuur</a>
    <nav class="ea-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="ea-main ea-index">
  <h1>Business- en enterprise-architectuur</h1>
  <p class="ea-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · TOGAF® EA Foundation/Practitioner · ArchiMate® · Open CA</p>
  ${introHtml}
  <p class="ea-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}

<section class="ea-level">
<h2>Toolbijlage</h2>
<p>Archi-referentiemateriaal: klikpaden voor de cursusbegrippen (business/application/technology-elementen, motivatie- en strategielaag, relaties, views en viewpoints, modelbeheer met coArchi) in Archi 5.x — toolneutraal, buiten de nummering van de dertig delen.</p>
<ul class="ea-part-downloads" style="margin-left:0"><li><a href="toolbijlage/toolbijlage.docx">Toolbijlage</a><span class="ea-size">14 KB</span></li></ul>
</section>
</main>
<footer class="ea-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's gebouwd, index.html geregenereerd.`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een gepubliceerde PNG.');
  }
}

main();
