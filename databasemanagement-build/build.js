// Build tool: converts the Databasemanagement course markdown source into static HTML
// pages for leren.eductus.nl (fase 2 — interactieve leesversie, bovenop het downloadblok
// van fase 1). Analoog aan risico-build/build.js, aangepast aan:
//  - platte bronbestanden (niveau-N/deel-NN-<deliverable>.md, geen deelmappen)
//  - bare figuurmarkers [FIGUUR x-y] / [FIGUUR x-y: bijschrift] (geen **[...]**-vorm)
//  - deel 10 heeft een opdrachtdocument i.p.v. een reader
// Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Databasemanagement', 'databasecursus');
const FIGURES_SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Databasemanagement', 'databasecursus-output', '_figures');
const MANIFEST = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Databasemanagement', 'databasecursus-output', 'manifest.json');
const OUT = path.resolve(__dirname, '..', 'databasemanagement');
const FIG_OUT = path.join(OUT, 'figuren');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const figurePlaceholders = new Map();
let figurePlaceholderSeq = 0;

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', label: 'Niveau 1 — Fundament', cert: 'EDB PostgreSQL Associate' },
  { n: 2, dir: 'niveau-2', label: 'Niveau 2 — DBA en consultant', cert: 'EDB PostgreSQL Professional' },
  { n: 3, dir: 'niveau-3', label: 'Niveau 3 — Architect', cert: 'voorbereiding clustercertificering' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function firstH1(text) { const m = text.match(/^#\s+(.+)$/m); return m ? m[1].trim() : ''; }

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

// Marker: [FIGUUR 15-2] of [FIGUUR 15-2: bijschrift]
const FIGUUR_RE = /\[FIGUUR\s+([\w.\-]+)(?::\s*([^\]]+))?\]/g;

function replaceFiguren(text, depth, missing) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const relPath = fs.existsSync(path.join(FIGURES_SRC, `figuur-${label}.png`)) ? `figuren/figuur-${label}.png` : null;
    const hasCaption = !!(caption && caption.trim());
    const cap = hasCaption ? caption.trim() : '';
    let html;
    if (!relPath) {
      missing.add(label);
      html = `<p class="dbm-figure-missing"><em>[Figuur ${label} ontbreekt${hasCaption ? ': ' + escapeHtml(cap) : ''}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = upDepth + relPath;
      const alt = escapeHtml(hasCaption ? cap : `Figuur ${label}`);
      const figcaption = hasCaption ? `Figuur ${label} — ${escapeHtml(cap)}` : `Figuur ${label}`;
      html = `<figure class="dbm-figure"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${figcaption}</figcaption></figure>`;
    }
    const placeholder = `DBMFIGPLACEHOLDER${figurePlaceholderSeq++}DBMFIGPLACEHOLDER`;
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
<title>${escapeHtml(title)} — Databasemanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}databasemanagement.css">
</head>
<body>
<header class="dbm-header">
  <div class="dbm-header-inner">
    <a class="dbm-brand" href="${root}index.html">Databasemanagement</a>
    <nav class="dbm-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="dbm-main">
${nav ? nav.top : ''}
<article class="dbm-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="dbm-footer">
  <p>Ductus-cursusfamilie · Databasemanagement · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function downloadBox(outDir, files) {
  const items = files.map(d => {
    const p = path.join(outDir, d.file);
    if (!fs.existsSync(p)) return '';
    const size = formatSize(fs.statSync(p).size);
    return `<li><a href="${d.file}">${d.label}</a><span class="dbm-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="dbm-download-box">
  <h2>Dit deel downloaden</h2>
  <ul>
  ${items}
  </ul>
</aside>`;
}

function main() {
  ensureDir(OUT);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const pngCount = copyFiguren();
  const missing = new Set();

  const allParts = manifest.map(m => {
    const lvl = NIVEAUS.find(l => l.n === m.niveau);
    const outDirName = `deel-${pad(m.deel)}-${m.slug}`;
    return { niveau: m.niveau, num: m.deel, niveauDir: lvl.dir, outDirName, title: m.title };
  });

  let pageCount = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const srcDir = path.join(SRC, part.niveauDir);
    const outDir = path.join(OUT, part.niveauDir, part.outDirName);
    ensureDir(outDir);
    const dirDepth = 2; // databasemanagement/niveau-N/deel-NN-slug/<file>.html
    const nn = pad(part.num);
    const isCapstone10 = part.num === 10;

    const deliverables = isCapstone10
      ? [
          { file: `deel-${nn}-opdrachtdocument.md`, slug: 'opdrachtdocument', label: 'Opdrachtdocument', dlFile: 'opdrachtdocument.docx' },
          { file: `deel-${nn}-werkboek.md`, slug: 'werkboek', label: 'Werkboek', dlFile: 'werkboek.docx' },
          { file: `deel-${nn}-docentenhandleiding.md`, slug: 'docentenhandleiding', label: 'Docentenhandleiding', dlFile: 'docentenhandleiding.docx' },
          { file: `deel-${nn}-slides.md`, slug: 'slidedeck', label: 'Slidedeck', dlFile: 'slidedeck.pptx' },
        ]
      : [
          { file: `deel-${nn}-reader.md`, slug: 'reader', label: 'Reader', dlFile: 'reader.docx' },
          { file: `deel-${nn}-werkboek.md`, slug: 'werkboek', label: 'Werkboek', dlFile: 'werkboek.docx' },
          { file: `deel-${nn}-docentenhandleiding.md`, slug: 'docentenhandleiding', label: 'Docentenhandleiding', dlFile: 'docentenhandleiding.docx' },
          { file: `deel-${nn}-slides.md`, slug: 'slidedeck', label: 'Slidedeck', dlFile: 'slidedeck.pptx' },
        ];

    for (const dlv of deliverables) {
      const srcPath = path.join(srcDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      let raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = deliverables.map(d => {
        const exists = fs.existsSync(path.join(srcDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const firstSlug = (p) => (p.num === 10 ? 'opdrachtdocument' : 'reader');
      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.outDirName}/${firstSlug(prev)}.html` : `../../${prev.niveauDir}/${prev.outDirName}/${firstSlug(prev)}.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.outDirName}/${firstSlug(next)}.html` : `../../${next.niveauDir}/${next.outDirName}/${firstSlug(next)}.html`) : null;
      const prevLink = prev ? `<a class="dbm-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="dbm-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="dbm-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(outDir, deliverables.map(d => ({ file: d.dlFile, label: `${d.label} (${d.dlFile.endsWith('.pptx') ? '.pptx' : '.docx'})` })))}\n<nav class="dbm-partnav">${prevLink}${nextLink}</nav>`;

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

  // ---- NoSQL-elective (2 delen, buiten de niveau-manifest) ----
  const ELECTIVE = [
    { id: 'el-01', title: 'Document en key-value in de praktijk', mdBase: 'nosql-el-01' },
    { id: 'el-02', title: 'Wide-column en graaf in de praktijk', mdBase: 'nosql-el-02' },
  ];
  const electiveSrcDir = path.join(SRC, 'niveau-2');
  let electivePageCount = 0;
  for (let i = 0; i < ELECTIVE.length; i++) {
    const el = ELECTIVE[i];
    const prevEl = ELECTIVE[i - 1];
    const nextEl = ELECTIVE[i + 1];
    const outDir = path.join(OUT, 'nosql-elective', el.id);
    ensureDir(outDir);
    const dirDepth = 2; // databasemanagement/nosql-elective/el-0N/<file>.html

    const deliverables = [
      { file: `${el.mdBase}-reader.md`, slug: 'reader', label: 'Reader', dlFile: 'reader.docx' },
      { file: `${el.mdBase}-werkboek.md`, slug: 'werkboek', label: 'Werkboek', dlFile: 'werkboek.docx' },
      { file: `${el.mdBase}-docentenhandleiding.md`, slug: 'docentenhandleiding', label: 'Docentenhandleiding', dlFile: 'docentenhandleiding.docx' },
      { file: `${el.mdBase}-slides.md`, slug: 'slidedeck', label: 'Slidedeck', dlFile: 'slidedeck.pptx' },
    ];

    for (const dlv of deliverables) {
      const srcPath = path.join(electiveSrcDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${el.title}`;

      const tabs = deliverables.map(d => {
        const exists = fs.existsSync(path.join(electiveSrcDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevHref = prevEl ? `../${prevEl.id}/reader.html` : null;
      const nextHref = nextEl ? `../${nextEl.id}/reader.html` : null;
      const prevLink = prevEl ? `<a class="dbm-prevnext prev" href="${prevHref}">&larr; ${escapeHtml(prevEl.title)}</a>` : `<span></span>`;
      const nextLink = nextEl ? `<a class="dbm-prevnext next" href="${nextHref}">${escapeHtml(nextEl.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="dbm-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(outDir, deliverables.map(d => ({ file: d.dlFile, label: `${d.label} (${d.dlFile.endsWith('.pptx') ? '.pptx' : '.docx'})` })))}\n<nav class="dbm-partnav">${prevLink}${nextLink}</nav>`;

      const html = page({
        title,
        breadcrumb: `<a href="../../index.html">Cursusoverzicht</a> &rsaquo; NoSQL-elective &rsaquo; ${escapeHtml(el.title)} &rsaquo; ${dlv.label}`,
        bodyHtml,
        nav: { top: navTop, bottom: navBottom },
        dirDepth,
      });
      fs.writeFileSync(path.join(outDir, `${dlv.slug}.html`), html, 'utf8');
      electivePageCount++;
    }
  }

  const electiveIndexHtml = page({
    title: 'NoSQL-elective',
    breadcrumb: `<a href="../index.html">Cursusoverzicht</a> &rsaquo; NoSQL-elective`,
    bodyHtml: `<h1>NoSQL-elective</h1>
<p>Twee delen, los van de dertig-delen-hoofdlijn, geen aparte certificeringslijn. Bouwt voort op deel 21 (Security-verdieping en NoSQL in perspectief): waar dat deel de vier eerlijke NoSQL-scenario's naast PostgreSQL beargumenteerde, werkt deze elective ze daadwerkelijk uit in Redis, MongoDB, Cassandra en Neo4j.</p>
<ol class="dbm-part-list">
${ELECTIVE.map((el, i) => `<li><a href="${el.id}/reader.html"><span class="dbm-part-num">${i + 1}</span><span class="dbm-part-title">${escapeHtml(el.title)}</span></a></li>`).join('\n')}
</ol>`,
    nav: null,
    dirDepth: 1,
  });
  ensureDir(path.join(OUT, 'nosql-elective'));
  fs.writeFileSync(path.join(OUT, 'nosql-elective', 'index.html'), electiveIndexHtml, 'utf8');
  pageCount += electivePageCount;

  // ---- index.html ----
  const introHtml = `<p>Deze Ductus-opleiding behandelt databasemanagement op PostgreSQL in drie niveaus: het fundament (het relationele model, SQL, datamodellering en normalisatie, transacties, indexen en beveiliging), de DBA/consultant-laag (fysiek ontwerp, query-optimalisatie, geavanceerde indexering, concurrency, partitionering, back-up/herstel, replicatie, hoge beschikbaarheid en monitoring) en het architect-niveau (multi-fonds-architectuur, sharding met Citus, foreign data wrappers en federatie, event sourcing en geo-distributie). Eén doorlopende casus bij pensioenuitvoerder Meridiaan Pensioen, die in niveau 3 uitgroeit tot de Pensioenfederatie met twee aangesloten fondsen.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel). Deel 10 sluit niveau 1 af met een capstone: een opdrachtdocument in plaats van een reader.</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p => {
      const firstSlug = (p.num === 10) ? 'opdrachtdocument' : 'reader';
      return `<li><a href="${lvl.dir}/${p.outDirName}/${firstSlug}.html"><span class="dbm-part-num">${p.num}</span><span class="dbm-part-title">${escapeHtml(p.title)}</span></a></li>`;
    }).join('\n');
    return `<section class="dbm-level">
  <h2>${lvl.label} <span class="dbm-cert-note">— ${lvl.cert}</span></h2>
  <ol class="dbm-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Databasemanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="databasemanagement.css">
</head>
<body>
<header class="dbm-header">
  <div class="dbm-header-inner">
    <a class="dbm-brand" href="index.html">Databasemanagement</a>
    <nav class="dbm-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="dbm-main dbm-index">
  <h1>Databasemanagement</h1>
  <p class="dbm-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · PostgreSQL · EDB Associate → Professional → clustercertificering</p>
  ${introHtml}
  <p class="dbm-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader/opdrachtdocument, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}

<section class="dbm-level">
  <h2>Toolbijlagen en elective</h2>
  <p>Toolbijlage A: installatie en foutoplossing (niveau 1). Toolbijlage B: klikpaden voor pgAdmin en psql bij de belangrijkste handelingen uit de cursus. NoSQL-elective: document/key-value/wide-column/graaf naast PostgreSQL (niveau 2, buiten de dertig-delen-nummering).</p>
  <div class="dbm-part-downloads" style="margin-left:0">
    <a href="toolbijlage/toolbijlage-A-installatie.docx">Toolbijlage A (.docx)</a>
    <a href="toolbijlage/toolbijlage-B-klikpaden.docx">Toolbijlage B (.docx)</a>
    <a href="nosql-elective/index.html">NoSQL-elective</a>
  </div>
</section>
</main>
<footer class="dbm-footer">
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
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een PNG.');
  }
}

main();
