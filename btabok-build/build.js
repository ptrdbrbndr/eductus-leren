// Build tool: converts the BTABoK course markdown source into static HTML pages for
// leren.eductus.nl (fase 2 — interactieve leesversie, bovenop het downloadblok van fase 1).
// Mirrort ea-build/build.js en risico-build/build.js; zie die scripts voor het oorspronkelijke
// patroon. Run: node build.js
//
// Afwijkingen t.o.v. ea-build (bronstructuur en slidedeck-dialect zijn anders):
//  - Bronbestanden staan in deel-mappen met nummerprefix: niveau-N/deel-NN/01-reader.md,
//    02-werkboek.md, 03-slidedeck.md, 04-docentenhandleiding.md (EA heeft platte
//    niveau-N/deel-NN-reader.md zonder deelmappen).
//  - Figuren zijn nog NIET eerder gepubliceerd (BTABoK-fase 1 was een kaal downloadblok
//    zonder figuren) — dit script kopieert figuren/*.svg vanuit de brongenerator
//    (eductus-trainingen/BTABOK/figuren/) naar btabok/figuren/deel-NN/*.svg.
//  - [FIGUUR x-y: bijschrift]-tags staan los op hun eigen regel in reader.md (colonvorm),
//    maar in slidedeck.md staan ze binnen een sjabloonblok en gebruiken vaak een em-dash of
//    helemaal geen bijschrift ("[FIGUUR x-y — bijschrift]" / "[FIGUUR x-y]") — de regex hier
//    ondersteunt alle drie vormen (colon, em-dash/streepje, bare).
//  - slidedeck.md gebruikt het BTABoK-sjabloondialect **[titleSlide]**/**[bulletsSlide]**/
//    **[figureSlide]**/**[tableSlide]**/**[bigStatement]**/**[quoteSlide]**/**[opdrachtSlide]**/
//    **[sectionHeader]**/**[agendaSlide]**, gescheiden door een losse "---"-regel — geen
//    "### Slide N — Titel"-koppen zoals bij EA en geen "## Slide N — Type: Titel" zoals bij
//    OutSystems. Daarom een eigen blok-parser or hier (zelfde dialect als
//    eductus-trainingen/BTABOK/scripts/md-to-pptx.js, bewust gedupliceerd i.p.v. cross-repo
//    geïmporteerd — build-scripts in deze repo blijven zelfstandig, zelfde reden als bij EA).
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'BTABOK', 'btabok-cursus');
const FIG_SRC_DIR = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'BTABOK', 'figuren');
const OUT = path.resolve(__dirname, '..', 'btabok');

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const figurePlaceholders = new Map();
let figurePlaceholderSeq = 0;

const DELIVERABLES = [
  { file: '01-reader.md', slug: 'reader', label: 'Reader' },
  { file: '02-werkboek.md', slug: 'werkboek', label: 'Werkboek' },
  { file: '04-docentenhandleiding.md', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { file: '03-slidedeck.md', slug: 'slidedeck', label: 'Slidedeck' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — De kern' },
  { n: 2, dir: 'niveau-2', parts: range(11, 22), label: 'Niveau 2 — Engagement, waarde en specialisatie' },
  { n: 3, dir: 'niveau-3', parts: range(23, 30), label: 'Niveau 3 — Board-gereedheid en praktijkleiderschap' },
];

const CERT = {
  1: 'CITA-F',
  2: 'CITA-A',
  3: 'CITA-S / CITA-P',
};

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 1. Figuren: kopiëren + manifest -> relatief pad ----------
function publishFigures() {
  const manifest = JSON.parse(fs.readFileSync(path.join(FIG_SRC_DIR, 'manifest.json'), 'utf8'));
  const map = {};
  for (const entry of manifest) {
    const dealDir = `deel-${pad(entry.deel)}`;
    const outDir = path.join(OUT, 'figuren', dealDir);
    ensureDir(outDir);
    const srcSvg = path.join(FIG_SRC_DIR, entry.svg);
    const destSvg = path.join(outDir, entry.svg);
    fs.copyFileSync(srcSvg, destSvg);
    map[entry.id] = `figuren/${dealDir}/${entry.svg}`;
  }
  return { map, manifest };
}

// ---------- 2. Figuur-marker parsing (drie vormen: colon, em-dash/streepje, bare) ----------
// Voor reader/werkboek/docentenhandleiding (markdown-it-pijplijn): marker los op eigen regel.
const FIGUUR_BLOCK_RE = /^\[FIGUUR\s+([\w.-]+)(?:\s*[:—-]\s*(.+))?\]$/gm;

function figureHtml(id, caption, figMap, depth, missing) {
  const relPath = figMap[id];
  if (!relPath) {
    missing.add(id);
    return `<p class="btabok-figure-missing"><em>[Figuur ${escapeHtml(id)} ontbreekt${caption ? ': ' + escapeHtml(caption) : ''}]</em></p>`;
  }
  const upDepth = '../'.repeat(depth);
  const src = upDepth + relPath;
  const alt = caption || `Figuur ${id}`;
  const capHtml = caption ? `Figuur ${escapeHtml(id)} — ${escapeHtml(caption)}` : `Figuur ${escapeHtml(id)}`;
  return `<figure class="btabok-figure"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy"><figcaption>${capHtml}</figcaption></figure>`;
}

function replaceFiguren(text, figMap, depth, missing) {
  return text.replace(FIGUUR_BLOCK_RE, (whole, id, caption) => {
    const html = figureHtml(id, (caption || '').trim(), figMap, depth, missing);
    const placeholder = `BTABOKFIGPLACEHOLDER${figurePlaceholderSeq++}BTABOKFIGPLACEHOLDER`;
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

// ---------- 3. Slidedeck-blokdialect -> HTML ("Slide N — Label: Titel", zelfde vorm als
// OutSystems' slidedeck.html, maar dan geparst uit **[label]**-blokken i.p.v. "## Slide N" ----------
const KNOWN_LABELS = new Set([
  'titleSlide', 'sectionHeader', 'bulletsSlide', 'figureSlide', 'tableSlide',
  'bigStatement', 'quoteSlide', 'opdrachtSlide', 'agendaSlide',
]);
const LABEL_DISPLAY = {
  titleSlide: 'Titel', sectionHeader: 'Sectie', bulletsSlide: 'Bullets', figureSlide: 'Figuur',
  tableSlide: 'Tabel', bigStatement: 'Statement', quoteSlide: 'Citaat', opdrachtSlide: 'Opdracht',
  agendaSlide: 'Agenda',
};

function splitSlideBlocks(text) {
  return text.split(/\r?\n---\r?\n/).map(b => b.trim()).filter(Boolean);
}

function parseSlideBlock(raw) {
  const lines = raw.split('\n');
  const out = { label: null, headings: [], bullets: [], numbered: [], tableRows: [], quote: [], plain: [], figure: null };
  let i = 0;
  const labelMatch = (lines[0] || '').match(/^\*\*\[([a-zA-Z]+)\]\*\*\s*$/);
  if (labelMatch) { out.label = labelMatch[1]; i = 1; }
  let rawTableLines = [];
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    let m;
    if ((m = t.match(/^\[FIGUUR[^\]]*\]$/i))) { out.figure = m[0].slice(1, -1); continue; }
    if ((m = t.match(/^#{1,3}\s+(.+)/))) { out.headings.push(m[1]); continue; }
    if (t.startsWith('|')) { rawTableLines.push(t); continue; }
    if (t.startsWith('>')) { out.quote.push(t.replace(/^>\s?/, '')); continue; }
    if ((m = t.match(/^-\s+(.+)/))) { out.bullets.push(m[1]); continue; }
    if ((m = t.match(/^\d+\.\s+(.+)/))) { out.numbered.push(m[1]); continue; }
    out.plain.push(t);
  }
  if (rawTableLines.length) {
    let rows = rawTableLines.filter(l => !/^\|[\s\-|]+\|$/.test(l))
      .map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    out.tableRows = rows;
  }
  return out;
}

function inline(text) { return md.renderInline(text || ''); }

function slideTitle(d) {
  if (d.headings.length) return d.headings[0];
  if (d.quote.length) return d.quote.join(' ').slice(0, 80);
  if (d.plain.length) return d.plain[0];
  return '';
}

function renderSlideBody(d, figMap, depth, missing) {
  const parts = [];
  const subHeadings = d.headings.slice(1);
  if (subHeadings.length) parts.push(`<p><em>${subHeadings.map(h => inline(h)).join(' &middot; ')}</em></p>`);
  if (d.numbered.length) parts.push(`<ol>${d.numbered.map(t => `<li>${inline(t)}</li>`).join('')}</ol>`);
  if (d.bullets.length) parts.push(`<ul>${d.bullets.map(t => `<li>${inline(t)}</li>`).join('')}</ul>`);
  if (d.tableRows.length) {
    const [header, ...body] = d.tableRows;
    const thead = `<thead><tr>${header.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    parts.push(`<table>${thead}${tbody}</table>`);
  }
  if (d.quote.length) parts.push(`<blockquote><p>${d.quote.map(q => inline(q)).join(' ')}</p></blockquote>`);
  if (d.plain.length) parts.push(d.plain.map(p => `<p>${inline(p)}</p>`).join(''));
  if (d.figure) {
    const idm = d.figure.match(/FIGUUR\s+([\w.-]+)/i);
    const id = idm ? idm[1] : null;
    const capm = d.figure.match(/^FIGUUR\s+[\w.-]+\s*[:—-]\s*(.+)$/i);
    const caption = capm ? capm[1].trim() : '';
    if (id) parts.push(figureHtml(id, caption, figMap, depth, missing));
  }
  return parts.join('\n');
}

function slidedeckToHtml(text, figMap, depth, missing) {
  const blocks = splitSlideBlocks(text);
  const out = [];
  let n = 0;
  for (const raw of blocks) {
    const d = parseSlideBlock(raw);
    if (!d.label || !KNOWN_LABELS.has(d.label)) continue;
    n++;
    const title = slideTitle(d);
    const heading = `Slide ${n} — ${LABEL_DISPLAY[d.label] || d.label}${title ? ': ' + escapeHtml(title) : ''}`;
    out.push(`<h2>${heading}</h2>\n${renderSlideBody(d, figMap, depth, missing)}\n<hr>`);
  }
  return { html: out.join('\n'), slideCount: n };
}

// ---------- 4. HTML page template ----------
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — BTABoK — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}btabok.css">
</head>
<body>
<header class="btabok-header">
  <div class="btabok-header-inner">
    <a class="btabok-brand" href="${root}index.html">BTABoK</a>
    <nav class="btabok-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="btabok-main">
${nav ? nav.top : ''}
<article class="btabok-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="btabok-footer">
  <p>Ductus-cursusfamilie · BTABoK · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
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
    return `<li><a href="${d.file}">${d.label}</a><span class="btabok-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="btabok-download-box">
  <h2>Dit deel downloaden</h2>
  <ul>
  ${items}
  </ul>
</aside>`;
}

function dealTitleFromReader(text) {
  const m = text.match(/^#\s*Deel\s+\d+\s*[—-]\s*(.+)$/m);
  return m ? m[1].trim() : '';
}

function main() {
  ensureDir(OUT);
  const { map: figMap } = publishFigures();
  const missing = new Set();

  const allParts = [];
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const readerPath = path.join(SRC, lvl.dir, `deel-${pad(num)}`, '01-reader.md');
      const text = fs.readFileSync(readerPath, 'utf8');
      const title = dealTitleFromReader(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, dealDir: `deel-${pad(num)}`, niveauDir: lvl.dir, title });
    }
  }

  let pageCount = 0;
  let totalSlides = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const srcDir = path.join(SRC, part.niveauDir, part.dealDir);
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // btabok/niveau-N/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(srcDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');

      let bodyHtml;
      if (dlv.slug === 'slidedeck') {
        const { html, slideCount } = slidedeckToHtml(raw, figMap, dirDepth, missing);
        totalSlides += slideCount;
        // Titel + korte meta boven de slides, zelfde stijl als de andere deliverables.
        const metaLine = raw.match(/^\*\*(.+)\*\*\s*$/m);
        bodyHtml = `<h1>Deel ${part.num} — ${escapeHtml(part.title)}</h1>\n<p>Slidedeck &middot; Ductus-cursus BTABoK &middot; Niveau ${part.niveau} &middot; deel ${part.num} van 30 &middot; ${slideCount} slides</p>\n${html}`;
      } else {
        const withFig = replaceFiguren(raw, figMap, dirDepth, missing);
        bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      }

      const title = `${dlv.label} — Deel ${part.num} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(srcDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      // Valkuil (bekend uit eerdere buildscripts in deze familie, bv. EA/DDD): het pad over
      // een niveaugrens heen moet een extra "../niveau-X/" bevatten, anders wijst het naar
      // een niet-bestaande map binnen hetzelfde niveau. Expliciet getest op deel 10↔11 en
      // 22↔23 in de smoke-test na de build.
      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.dealDir}/reader.html` : `../../${prev.niveauDir}/${prev.dealDir}/reader.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.dealDir}/reader.html` : `../../${next.niveauDir}/${next.dealDir}/reader.html`) : null;
      const prevLink = prev ? `<a class="btabok-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="btabok-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="btabok-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(outDir)}\n<nav class="btabok-partnav">${prevLink}${nextLink}</nav>`;

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

  // ---- index.html: downloadblok-per-deel wordt een link naar de interactieve reader.html;
  // de vier downloads verhuizen naar de download-box onderaan elke deliverable-pagina.
  const introHtml = `<p>Deze Ductus-opleiding is gebaseerd op de BTABoK (Business Technology Architecture Body of Knowledge) van Iasa Global en bereidt deelnemers voor op de certificeringslijn CITA-F &rarr; CITA-A &rarr; CITA-S/CITA-P — uitdrukkelijk als voorbereiding, nooit als vervanging van het officiële examenmateriaal. De doorlopende casus volgt architect Claudette Vermeer bij pensioenuitvoerder Meridiaan Pensioen: van een mislukt assessmentgesprek met CIO Bart Hoekstra, via het transformatieprogramma Mutatieplatform, naar het bouwen en leiden van een architectuurpraktijk tijdens de Wtp-stelselovergang.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel, inclusief getekende figuren), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="btabok-part-num">${p.num}</span><span class="btabok-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="btabok-level">
<h2>${lvl.label} <span class="btabok-cert-note">(${CERT[lvl.n]})</span></h2>
<ol class="btabok-part-list">
${items}
</ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BTABoK — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="btabok.css">
</head>
<body>
<header class="btabok-header">
  <div class="btabok-header-inner">
    <a class="btabok-brand" href="index.html">BTABoK</a>
    <nav class="btabok-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="btabok-main">
  <h1>BTABoK</h1>
  <p class="btabok-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · Iasa Global · CITA-F &rarr; CITA-A &rarr; CITA-S/CITA-P</p>
  ${introHtml}
  <p class="btabok-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}

<section class="btabok-level">
<h2>Toolbijlage</h2>
<p>Klikpaden in Excalidraw (gratis, open-source) voor de belangrijkste Ductus-werkvormen uit deze cursus: het verdienmodelblad, de stakeholderkaart, het besluitenlogboek, de klantreiskaart, de roadmapkaart en het praktijkcharter. Buiten de nummering van de dertig delen.</p>
<ul class="btabok-part-downloads" style="margin-left:0"><li><a href="toolbijlage/toolbijlage.docx">Toolbijlage (.docx)</a></li></ul>
</section>
</main>
<footer class="btabok-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's gebouwd (${totalSlides} slides totaal in de slidedecks), index.html geregenereerd.`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een gepubliceerde SVG.');
  }
}

main();
