// Build tool: converts the Project- en programmamanagement course markdown source into
// static HTML pages for leren.eductus.nl (fase 2 — interactieve leesversie, bovenop het
// downloadblok van fase 1). Mirrort risico-build/build.js; zie dat script voor het
// oorspronkelijke patroon. Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Project-en programma management', 'pm-cursus');
const OPGEMAAKT = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Project-en programma management-opgemaakt');
const OUT = path.resolve(__dirname, '..', 'project-en-programmamanagement');
const FIG_OUT = path.join(OUT, 'figuren');

// Reader/werkboek/docentenhandleiding.md bevatten geen HTML-tags; slidedeck.md wordt via
// een eigen sheet-parser gerenderd (zie hieronder), niet via markdown-it. html:true is hier
// dus vooral een vangnet, net als bij risico-build.
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

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

// De opgemaakt-bronmap (docx/pptx + figuren + figure-specs.json) heet voor bijna elk deel
// "niveau-<n>-deel-<NN>", behalve deel 1 — dat is als proof-of-concept gebouwd onder een
// afwijkende naam ("...-opgemaakt-voorbeeld"), zie generate-pm-deel01.js.
function opgemaaktDirName(niveau, num) {
  if (num === 1) return 'niveau-1-deel-01-opgemaakt-voorbeeld';
  return `niveau-${niveau}-deel-${pad(num)}`;
}

// ---------- 1. Copy all figuren PNGs (platte map, geen submappen) ----------
// Figuur-id's ("<deel>-<num>", bv. "12-3") bevatten het deelnummer, dus zijn ze globaal
// uniek over de hele cursus — een platte map kan zonder naamsbotsingen, net als bij risico.
function copyFiguren(allParts) {
  ensureDir(FIG_OUT);
  let count = 0;
  for (const part of allParts) {
    const figDir = path.join(OPGEMAAKT, opgemaaktDirName(part.niveau, part.num), 'figuren');
    if (!fs.existsSync(figDir)) continue;
    for (const f of fs.readdirSync(figDir)) {
      if (f.toLowerCase().endsWith('.png')) {
        fs.copyFileSync(path.join(figDir, f), path.join(FIG_OUT, f));
        count++;
      }
    }
  }
  return count;
}

function loadFigureSpecs(niveau, num) {
  const p = path.join(OPGEMAAKT, opgemaaktDirName(niveau, num), 'figuren', 'figure-specs.json');
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// ---------- 2. Bare [FIGUUR ...]-restjes in reader/werkboek/docentenhandleiding ----------
// Volgens de cursusconventie staan figuurtags uitsluitend in slidedeck.md; dit is een
// vangnet mocht er toch een losse marker in de andere drie bestanden voorkomen.
const BARE_FIGURE_RE = /^\[FIGUUR \d+-\d+(:.*)?\]\s*$/gm;
function stripBareFigureTags(text) {
  return text.replace(BARE_FIGURE_RE, '');
}

// ---------- 3. Slidedeck: eigen sheet-parser ----------
// Format: "**Sheet N — Titel**" gevolgd door platte inhoudsregels, sheets gescheiden door
// een losse "---"-regel. Zie docx-build/pm-build-engine.js's parseSlidedeck() voor de
// pptx-tegenhanger van deze parser.
function parseSheets(mdText) {
  const rawBlocks = mdText.replace(/\r/g, '').split(/^---\s*$/m);
  const sheets = [];
  for (const block of rawBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) continue;
    const headerMatch = lines[0].match(/^\*\*Sheet (\d+) — (.+)\*\*$/);
    if (!headerMatch) continue; // documenttitel/"## Slidedeck"-regel vóór de eerste "---"
    sheets.push({
      number: Number(headerMatch[1]),
      title: headerMatch[2].trim(),
      contentLines: lines.slice(1),
    });
  }
  return sheets;
}

const FIGURE_TAG_RE = /^\[FIGUUR (\d+-\d+):\s*(.+)\]$/;

// Rendert één figuurtag als echte <figure>+PNG (niet-matrix) of een echte HTML-tabel
// (matrix — matrix-figuren hebben geen PNG, die worden in docx/pptx als tabel gerenderd).
function renderFigureTag(id, desc, figureSpecs, depth, missing) {
  const spec = figureSpecs[id];
  const captionText = `Figuur ${id} — ${escapeHtml(desc)}`;
  if (!spec) {
    missing.add(id);
    return `<p class="pm-figure-missing"><em>[Figuur ${id} ontbreekt: ${escapeHtml(desc)}]</em></p>`;
  }
  if (spec.category === 'matrix') {
    const { headers, rows } = spec.args;
    const thead = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map(row => `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
    return `<figure class="pm-figure pm-figure-table"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table><figcaption>${captionText}</figcaption></figure>`;
  }
  const pngPath = path.join(FIG_OUT, `${id}.png`);
  if (!fs.existsSync(pngPath)) {
    missing.add(id);
    return `<p class="pm-figure-missing"><em>[Figuur ${id} ontbreekt (geen PNG): ${escapeHtml(desc)}]</em></p>`;
  }
  const upDepth = '../'.repeat(depth);
  const src = `${upDepth}figuren/${id}.png`;
  return `<figure class="pm-figure"><img src="${src}" alt="${escapeHtml(desc)}" loading="lazy"><figcaption>${captionText}</figcaption></figure>`;
}

// Rendert de platte inhoudsregels van één sheet: opeenvolgende "- "/"* "-regels worden
// gegroepeerd tot één <ul>, een figuurtag wordt een figuur/tabel, overige regels worden
// alinea's (met inline **bold**/*italic* via markdown-it's renderInline).
function renderSheetBody(lines, figureSpecs, depth, missing) {
  let html = '';
  let bulletBuf = [];
  const flushBullets = () => {
    if (bulletBuf.length) {
      html += `<ul>${bulletBuf.map(b => `<li>${md.renderInline(b)}</li>`).join('')}</ul>`;
      bulletBuf = [];
    }
  };
  for (const line of lines) {
    const figMatch = line.match(FIGURE_TAG_RE);
    if (figMatch) {
      flushBullets();
      html += renderFigureTag(figMatch[1], figMatch[2], figureSpecs, depth, missing);
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      bulletBuf.push(line.slice(2).trim());
      continue;
    }
    flushBullets();
    html += `<p>${md.renderInline(line)}</p>`;
  }
  flushBullets();
  return html;
}

function renderSlidedeck(mdText, figureSpecs, depth, missing) {
  const sheets = parseSheets(mdText);
  let html = '<div class="pm-sheets">';
  for (const sheet of sheets) {
    html += `<section class="pm-sheet"><h2 class="pm-sheet-title"><span class="pm-sheet-num">Sheet ${sheet.number}</span>${escapeHtml(sheet.title)}</h2>`;
    html += renderSheetBody(sheet.contentLines, figureSpecs, depth, missing);
    html += '</section>';
  }
  html += '</div>';
  return html;
}

// ---------- 4. HTML page template ----------
// dirDepth = levels up to reach project-en-programmamanagement/ (OUT root, waar index.html
// + pm.css + figuren/ staan)
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Project- en programmamanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}pm.css">
</head>
<body>
<header class="pm-header">
  <div class="pm-header-inner">
    <a class="pm-brand" href="${root}index.html">Project- en programmamanagement</a>
    <nav class="pm-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="pm-main">
${nav ? nav.top : ''}
<article class="pm-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="pm-footer">
  <p>Ductus-cursusfamilie · Project- en programmamanagement · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
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

function downloadBox(outDir) {
  const items = DOWNLOAD_FILES.map(d => {
    const p = path.join(outDir, d.file);
    if (!fs.existsSync(p)) return '';
    const size = formatSize(fs.statSync(p).size);
    return `<li><a href="${d.file}">${d.label}</a><span class="pm-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="pm-download-box">
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
  const missing = new Set();

  const allParts = [];
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const dealDir = `deel-${pad(num)}`;
      const readerPath = path.join(SRC, lvl.dir, dealDir, 'reader.md');
      const text = fs.readFileSync(readerPath, 'utf8');
      const h1 = firstH1(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, dealDir, niveauDir: lvl.dir, title: h1 });
    }
  }

  const pngCount = copyFiguren(allParts);

  let pageCount = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // project-en-programmamanagement/niveau-N/deel-NN/<file>.html
    const figureSpecs = loadFigureSpecs(part.niveau, part.num);

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, part.dealDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');

      let bodyHtml;
      if (dlv.slug === 'slidedeck') {
        bodyHtml = renderSlidedeck(raw, figureSpecs, dirDepth, missing);
      } else {
        bodyHtml = md.render(stripBareFigureTags(raw));
      }
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, part.dealDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.dealDir}/reader.html` : `../../${prev.niveauDir}/${prev.dealDir}/reader.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.dealDir}/reader.html` : `../../${next.niveauDir}/${next.dealDir}/reader.html`) : null;
      const prevLink = prev ? `<a class="pm-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="pm-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="pm-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(outDir)}\n<nav class="pm-partnav">${prevLink}${nextLink}</nav>`;

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
    1: 'PRINCE2 7 Foundation + IPMA-D',
    2: 'PRINCE2 7 Practitioner + MSP 5e editie Foundation + IPMA-C',
    3: 'MSP 5e editie Practitioner + IPMA-B',
  };
  const introHtml = `<p>Deze Ductus-opleiding behandelt project- en programmamanagement in drie niveaus: het fundament (PRINCE2 7 — de zeven principes, practices en processen, aangevuld met wat IPMA-D daarnaast vraagt), programmamanagement (MSP 5e editie — van project naar programma, benefits management, governance, planning en stakeholders op programmaschaal) en het expertniveau (assessmentvaardigheid richting IPMA-B, programma's onder toezicht van DNB/AFM, transitie en invaren, en leiderschap onder druk). Niveau 1 en 2 volgen de doorlopende Meridiaan-casus (WGP 2.0 / Programma Mutatieplatform); niveau 3 gebruikt een eigen, losstaand dossier — de Stelselovergang/Wtp — zodat het op zichzelf kan functioneren.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="pm-part-num">${p.num}</span><span class="pm-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="pm-level">
  <h2>${lvl.label} <span class="pm-cert-note">— ${CERT[lvl.n]}</span></h2>
  <ol class="pm-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Project- en programmamanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="pm.css">
</head>
<body>
<header class="pm-header">
  <div class="pm-header-inner">
    <a class="pm-brand" href="index.html">Project- en programmamanagement</a>
    <nav class="pm-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="pm-main pm-index">
  <h1>Project- en programmamanagement</h1>
  <p class="pm-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · PRINCE2 7 Foundation/Practitioner → MSP 5e editie Foundation/Practitioner → IPMA D-C-B</p>
  ${introHtml}
  <p class="pm-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}

<section class="pm-level">
  <h2>Toolbijlage</h2>
  <p>OpenProject-referentiemateriaal: klikpaden voor de cursusbegrippen (Product Breakdown Structure, risicoregister, tranche, ...) in OpenProject Community Edition 14.x, plus korte Jira- en Azure DevOps-equivalenten vanaf deel 16/17 — toolneutraal, buiten de nummering van de dertig delen.</p>
  <div class="pm-part-downloads" style="margin-left:0">
    <a href="toolbijlage/toolbijlage.docx">Toolbijlage (.docx)</a>
  </div>
</section>
</main>
<footer class="pm-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's + index.html gebouwd.`);
  console.log(`PNG's gekopieerd: ${pngCount}`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log("Alle [FIGUUR ...]-tags in de slidedecks zijn gekoppeld aan een PNG of matrix-tabel.");
  }
}

main();
