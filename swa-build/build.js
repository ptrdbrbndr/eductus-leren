// Build tool: converts the Software-architectuur course markdown source into static HTML pages
// for leren.eductus.nl (interactieve leesversie, bovenop het downloadblok).
// Adapted from risico-build/build.js. Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Software-architectuur', 'software-architectuur-cursus');
const FIGURES_SRC = path.join(SRC, 'tooling', 'figures');
const TOOLBIJLAGE_SRC = path.join(SRC, 'toolbijlage-structurizr', 'toolbijlage.docx');
const OUT = path.resolve(__dirname, '..', 'software-architectuur');
const FIG_OUT = path.join(OUT, 'figuren');
const TOOLBIJLAGE_OUT = path.join(OUT, 'toolbijlage', 'toolbijlage.docx');

// Geen <details>/<summary> blokken aangetroffen in de bronbestanden van deze cursus
// (geverifieerd: 0 treffers in niveau-1/2/3), maar html:true blijft aan staan voor
// het geval een enkel deel toch losse HTML bevat — kost niets als het niet voorkomt.
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Figure HTML is injected via placeholders (rendered markdown text goes through
// typographer, which would mangle raw HTML like quotes/paths), then swapped in
// after rendering.
const figurePlaceholders = new Map(); // placeholder -> html
let figurePlaceholderSeq = 0;

// LET OP — afwijkend van risico-build: de brondbestanden per deel heten
// 01-reader.md / 02-werkboek.md / 03-slidedeck.md / 04-docentenhandleiding.md
// (genummerd), terwijl de gepubliceerde .docx/.pptx-bestanden wél de kale
// namen dragen (reader.docx, werkboek.docx, ...). srcFile en slug/downloadFile
// zijn daarom hier uit elkaar getrokken.
const DELIVERABLES = [
  { srcFile: '01-reader.md', slug: 'reader', label: 'Reader' },
  { srcFile: '02-werkboek.md', slug: 'werkboek', label: 'Werkboek' },
  { srcFile: '03-slidedeck.md', slug: 'slidedeck', label: 'Slidedeck' },
  { srcFile: '04-docentenhandleiding.md', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
];

const DOWNLOAD_FILES = [
  { file: 'reader.docx', label: 'Reader (.docx)' },
  { file: 'werkboek.docx', label: 'Werkboek (.docx)' },
  { file: 'docentenhandleiding.docx', label: 'Docentenhandleiding (.docx)' },
  { file: 'slidedeck.pptx', label: 'Slidedeck (.pptx)' },
];

// LET OP — afwijkend van risico-build: niveau-1 t/m niveau-3, deel-01 t/m
// deel-28 (10 + 11 + 7), geen deel-29/30, geen slug in de mapnamen.
const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament' },
  { n: 2, dir: 'niveau-2', parts: range(11, 21), label: 'Niveau 2 — Professional' },
  { n: 3, dir: 'niveau-3', parts: range(22, 28), label: 'Niveau 3 — Expert' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

// ---------- 1. Build figuur-label -> relatief pad, door tooling/figures/*.png te scannen ----------
// Bestandsnaam: figuur-<deel>-<num>-<slug>.png -> label "<deel>-<num>"
function buildFigMap() {
  const map = {};
  const re = /^figuur-(\d+-\d+)-.*\.png$/i;
  for (const f of fs.readdirSync(FIGURES_SRC)) {
    const m = f.match(re);
    if (m) map[m[1]] = `figuren/${f}`;
  }
  return map;
}

// ---------- 2. Copy all figuren PNGs (platte map, geen submappen) ----------
function copyFiguren() {
  ensureDir(FIG_OUT);
  let count = 0;
  for (const f of fs.readdirSync(FIGURES_SRC)) {
    if (f.toLowerCase().endsWith('.png')) {
      fs.copyFileSync(path.join(FIGURES_SRC, f), path.join(FIG_OUT, f));
      count++;
    }
  }
  return count;
}

// ---------- 2b. Copy deliverable docx/pptx per deel + de toolbijlage ----------
// risico-build deed dit niet (dat was destijds een losse handmatige stap); voor
// software-architectuur zit het hier expliciet in het script zodat de downloadbox
// se relatieve links (href="reader.docx" etc.) daadwerkelijk resolven.
function copyDeliverableFiles(allParts) {
  let count = 0;
  for (const part of allParts) {
    const srcDir = path.join(SRC, part.niveauDir, part.dealDir);
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    for (const d of DOWNLOAD_FILES) {
      const srcPath = path.join(srcDir, d.file);
      if (!fs.existsSync(srcPath)) continue;
      copyFileWithRetry(srcPath, path.join(outDir, d.file));
      count++;
    }
  }
  return count;
}

function copyToolbijlage() {
  if (!fs.existsSync(TOOLBIJLAGE_SRC)) return false;
  ensureDir(path.dirname(TOOLBIJLAGE_OUT));
  copyFileWithRetry(TOOLBIJLAGE_SRC, TOOLBIJLAGE_OUT);
  return true;
}

// WPS Office's achtergrond-indexer kan een kortstondige lock op .docx/.pptx
// leggen (EBUSY); twee retries met een korte pauze lossen dat in de praktijk op.
function copyFileWithRetry(src, dst, attempt = 0) {
  try {
    fs.copyFileSync(src, dst);
  } catch (err) {
    if (err.code === 'EBUSY' && attempt < 2) {
      const wait = 1500;
      const until = Date.now() + wait;
      while (Date.now() < until) { /* korte busy-wait, geen node-sleep beschikbaar zonder async */ }
      return copyFileWithRetry(src, dst, attempt + 1);
    }
    throw err;
  }
}

// ---------- 3. Figure marker replacement ----------
// Deze cursus gebruikt EEN ANDERE marker-syntax dan risicomanagement. Daar stond
// **[FIGUUR 15-2]** *bijschrift...* (bold marker + losse cursieve bijschriftregel).
// Hier staat het bijschrift ín de marker zelf, op één regel, zonder opmaak:
//   [FIGUUR 1-1: De cursusboog van niveau 1 — post-mortem ... (deel 10)]
// Geverifieerd (grep over niveau-1/2/3): geen enkele marker loopt over meerdere
// regels (elke marker sluit zijn "]" op dezelfde regel), en er komt geen variant
// voor waarbij de marker in een "### Slide N — ..."-kop zelf staat (de marker
// staat in het slidedeck-bronbestand altijd los, op de regel ONDER de kop) —
// dus de heading-normalisatiestap uit risico-build is hier niet nodig.
const FIGUUR_RE = /\[FIGUUR\s+([\w.\-]+):\s*([^\]]+)\]/g;

function replaceFiguren(text, figMap, depth, missing) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const relPath = figMap[label];
    const cap = caption.trim();
    let html;
    if (!relPath) {
      missing.add(label);
      html = `<p class="swa-figure-missing"><em>[Figuur ${label} ontbreekt: ${escapeHtml(cap)}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = upDepth + relPath;
      const alt = escapeHtml(cap);
      const figcaption = `Figuur ${label} — ${escapeHtml(cap)}`;
      html = `<figure class="swa-figure"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${figcaption}</figcaption></figure>`;
    }
    const placeholder = `SWAFIGPLACEHOLDER${figurePlaceholderSeq++}SWAFIGPLACEHOLDER`;
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

// ---------- 4. HTML page template ----------
// dirDepth = levels up to reach software-architectuur/ (OUT root, waar index.html + swa.css + figuren/ staan)
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Softwarearchitectuur — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}swa.css">
</head>
<body>
<header class="swa-header">
  <div class="swa-header-inner">
    <a class="swa-brand" href="${root}index.html">Softwarearchitectuur</a>
    <nav class="swa-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="swa-main">
${nav ? nav.top : ''}
<article class="swa-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="swa-footer">
  <p>Ductus-cursusfamilie · Softwarearchitectuur · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function downloadBox(srcDir) {
  const items = DOWNLOAD_FILES.map(d => {
    const p = path.join(srcDir, d.file);
    if (!fs.existsSync(p)) return '';
    const size = formatSize(fs.statSync(p).size);
    return `<li><a href="${d.file}">${d.label}</a><span class="swa-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="swa-download-box">
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

function main() {
  ensureDir(OUT);
  const figMap = buildFigMap();
  const pngCount = copyFiguren();
  const missing = new Set();

  const allParts = [];
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      // LET OP — afwijkend van risico-build: geen slug, de deelmap heet exact deel-NN.
      const dealDir = `deel-${pad(num)}`;
      const readerPath = path.join(SRC, lvl.dir, dealDir, '01-reader.md');
      const text = fs.readFileSync(readerPath, 'utf8');
      const h1 = firstH1(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, dealDir, niveauDir: lvl.dir, title: h1 });
    }
  }

  const docxCount = copyDeliverableFiles(allParts);
  const toolbijlageCopied = copyToolbijlage();

  let pageCount = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // software-architectuur/niveau-N/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, part.dealDir, dlv.srcFile);
      if (!fs.existsSync(srcPath)) continue;
      let raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, figMap, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, part.dealDir, d.srcFile));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.dealDir}/reader.html` : `../../${prev.niveauDir}/${prev.dealDir}/reader.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.dealDir}/reader.html` : `../../${next.niveauDir}/${next.dealDir}/reader.html`) : null;
      const prevLink = prev ? `<a class="swa-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="swa-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="swa-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(path.join(SRC, part.niveauDir, part.dealDir))}\n<nav class="swa-partnav">${prevLink}${nextLink}</nav>`;

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
  const CERT = {
    1: 'iSAQB CPSA Foundation',
    2: 'iSAQB CPSA Advanced',
    3: 'iSAQB CPSA Advanced — certificeringstraject',
  };
  const introHtml = `<p>Deze Ductus-opleiding bereidt voor op het iSAQB® CPSA-traject (Certified Professional for Software Architecture, Foundation en Advanced) en behandelt softwarearchitectuur in drie niveaus: het fundament (wat architectuur is en niet is, van eisen naar architectuurdrijvers, ontwerpprincipes, architectuurstijlen, kwaliteitstactieken, documentatie en evaluatie), de professional-laag (strategisch en tactisch domeingedreven ontwerp, microservices, event sourcing/CQRS, cloud- en uitrolarchitectuur, securityarchitectuur, evolutionaire architectuur, gevorderde evaluatie en stakeholdercommunicatie) en het expertniveau (architectuur op schaal, migratie en modernisering, trade-offs onder druk, verdedigbaar stoppen en melden, en de masterproef als simulatie van het examinatoreninterview). De cursus is technologieneutraal; voor documentatie hanteren wij arc42 en het C4-model als referentienotatie, met Structurizr als open-source referentietool — didactische keuzes, geen normatieve. Eén doorlopende casus bij pensioenuitvoerder Meridiaan Pensioen, van het vastgelopen project Mutatie 1.0 tot de herbouw als het Mutatieplatform.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="swa-part-num">${p.num}</span><span class="swa-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="swa-level">
  <h2>${lvl.label} <span class="swa-cert-note">— ${CERT[lvl.n]}</span></h2>
  <ol class="swa-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Softwarearchitectuur — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="swa.css">
</head>
<body>
<header class="swa-header">
  <div class="swa-header-inner">
    <a class="swa-brand" href="index.html">Softwarearchitectuur</a>
    <nav class="swa-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="swa-main swa-index">
  <h1>Softwarearchitectuur</h1>
  <p class="swa-subtitle">Ductus-cursusfamilie · 3 niveaus · 28 delen · iSAQB CPSA Foundation → CPSA Advanced → certificeringstraject</p>
  ${introHtml}
  <p class="swa-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}

<section class="swa-level">
  <h2>Toolbijlage</h2>
  <p>Structurizr als referentietool voor C4-diagrammen (context, container, component) via tekst-als-code — technologieneutraal ten opzichte van de cursusinhoud zelf, buiten de nummering van de achtentwintig delen.</p>
  <div class="swa-part-downloads" style="margin-left:0">
    <a href="toolbijlage/toolbijlage.docx">Toolbijlage (.docx)</a>
  </div>
</section>
</main>
<footer class="swa-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's + index.html gebouwd.`);
  console.log(`PNG's gekopieerd: ${pngCount}`);
  console.log(`docx/pptx gekopieerd: ${docxCount}`);
  console.log(`Toolbijlage gekopieerd: ${toolbijlageCopied ? 'ja' : 'NEE — bestand niet gevonden'}`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een PNG.');
  }
}

main();
