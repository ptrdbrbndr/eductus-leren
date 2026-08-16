// Build tool: converts the "SAP voor Business Analysts" course markdown source into static
// HTML pages for leren.eductus.nl, naar het patroon van ddd-build/build.js (dezelfde
// Ductus-familiecursus-opzet: 3 niveaus, 30 delen, vier deliverables per deel).
//
// Verschil met ddd-build: de figuren zijn hier al gegenereerde PNG's (één map per deel,
// zie ../../eductus-trainingen/docx-build-sap/), geen los SVG-manifest — dus geen
// figuren-manifest.md nodig. De .docx/.pptx-deliverables zijn ook al gegenereerd en worden
// per deel gekopieerd naast de HTML, net als bij DDD's downloadkader.
//
// Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require(path.resolve(__dirname, '..', 'ddd-build', 'node_modules', 'markdown-it'));

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'SAP voor Business Analysts');
const OPGEMAAKT = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'SAP voor Business Analysts-opgemaakt');
const OUT = path.resolve(__dirname, '..', 'sap-voor-business-analysts');

// html: true (anders dan ddd-build) omdat de SAP-werkboeken <details><summary>Uitwerking</summary>
// gebruiken als inline-per-opdracht-onthulling, in plaats van DDD's "alle uitwerkingen
// achteraan"-conventie. Native <details> rendert zonder JS als uitklapbaar element.
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const figurePlaceholders = new Map();
let figurePlaceholderSeq = 0;

const DELIVERABLES = [
  { file: 'reader.md', slug: 'reader', label: 'Reader' },
  { file: 'werkboek.md', slug: 'werkboek', label: 'Werkboek' },
  { file: 'docentenhandleiding.md', slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { file: 'slidedeck.md', slug: 'slidedeck', label: 'Slidedeck' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundamenten' },
  { n: 2, dir: 'niveau-2', parts: range(11, 22), label: 'Niveau 2 — Professional' },
  { n: 3, dir: 'niveau-3', parts: range(23, 30), label: 'Niveau 3 — Expert' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

// ---------- 1. Figuur-markers: `[FIGUUR x-y] omschrijving` (backtick-gewrapt, geen manifest —
// de PNG staat al klaar in OPGEMAAKT/<niveauDir>/<dealDir>/figuren/figuur-x-y.png) ----------
const FIGUUR_RE = /`\[FIGUUR\s+([\d.]+-[\d.]+)\]\s*([^`]*)`/g;

function replaceFiguren(text, missing, dealDir) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const pngName = `figuur-${label}.png`;
    const exists = fs.existsSync(path.join(OPGEMAAKT, dealDir.niveauDir, dealDir.dealDir, 'figuren', pngName));
    let html;
    if (!exists) {
      missing.add(`${dealDir.dealDir}/${label}`);
      html = `<p class="sap-figure-missing"><em>[Figuur ${label} ontbreekt: ${escapeHtml(caption.trim())}]</em></p>`;
    } else {
      const alt = escapeHtml((caption || `Figuur ${label}`).trim());
      html = `<figure class="sap-figure"><img src="figuren/${pngName}" alt="${alt}" loading="lazy"><figcaption>Figuur ${label} — ${alt}</figcaption></figure>`;
    }
    const placeholder = `SAPFIGPLACEHOLDER${figurePlaceholderSeq++}SAPFIGPLACEHOLDER`;
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

// ---------- 2. HTML page template ----------
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — SAP voor Business Analysts — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}sap.css">
</head>
<body>
<header class="sap-header">
  <div class="sap-header-inner">
    <a class="sap-brand" href="${root}index.html">SAP voor Business Analysts</a>
    <nav class="sap-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="sap-main">
${nav ? nav.top : ''}
<article class="sap-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="sap-footer">
  <p>Ductus-cursusfamilie · SAP voor Business Analysts · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
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

const DOWNLOAD_FILES = [
  { file: 'reader.docx', label: 'Reader (.docx)' },
  { file: 'werkboek.docx', label: 'Werkboek (.docx)' },
  { file: 'docentenhandleiding.docx', label: 'Docentenhandleiding (.docx)' },
  { file: 'slidedeck.pptx', label: 'Slidedeck (.pptx)' },
];

function downloadBox(opgemaaktDeelDir) {
  const items = DOWNLOAD_FILES.map(d => {
    const p = path.join(opgemaaktDeelDir, d.file);
    if (!fs.existsSync(p)) return '';
    const size = formatSize(fs.statSync(p).size);
    return `<li><a href="${d.file}">${d.label}</a><span class="sap-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="sap-download-box">
  <h2>Dit deel downloaden</h2>
  <ul>
  ${items}
  </ul>
</aside>`;
}

// Kopieert de vier .docx/.pptx-bestanden en de figuren/-map van OPGEMAAKT naast de HTML in OUT.
function copyDeelAssets(niveauDir, dealDir, outDeelDir) {
  const srcDeelDir = path.join(OPGEMAAKT, niveauDir, dealDir);
  if (!fs.existsSync(srcDeelDir)) return;
  for (const d of DOWNLOAD_FILES) {
    const from = path.join(srcDeelDir, d.file);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(outDeelDir, d.file));
  }
  const figFrom = path.join(srcDeelDir, 'figuren');
  if (fs.existsSync(figFrom)) {
    const figTo = path.join(outDeelDir, 'figuren');
    ensureDir(figTo);
    for (const f of fs.readdirSync(figFrom)) {
      fs.copyFileSync(path.join(figFrom, f), path.join(figTo, f));
    }
  }
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

  let pageCount = 0;

  // ---- casusdossier-aanvulling (één, voor de hele cursus — geen per-niveau dossier zoals DDD) ----
  const casusSrcPath = path.join(SRC, 'casusdossier', 'casusdossier-sap-aanvulling.md');
  if (fs.existsSync(casusSrcPath)) {
    const raw = fs.readFileSync(casusSrcPath, 'utf8');
    const bodyHtml = md.render(raw.replace(/\.\.\/\.\.\/Testen en kwaliteitsborging\/casusdossier\/casusdossier-meridiaan\.md/g, '#'));
    const title = firstH1(raw) || 'Casusdossier-aanvulling';
    const html = page({
      title,
      breadcrumb: `<a href="../index.html">Cursusoverzicht</a> &rsaquo; Casusdossier-aanvulling`,
      bodyHtml,
      nav: null,
      dirDepth: 1,
    });
    fs.writeFileSync(path.join(OUT, '00-casusdossier-aanvulling.html'), html, 'utf8');
    pageCount++;
  }

  // ---- deel pages ----
  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2;

    copyDeelAssets(part.niveauDir, part.dealDir, outDir);

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, part.dealDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      const raw = fs.readFileSync(srcPath, 'utf8');
      const withFig = replaceFiguren(raw, missing, part);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, part.dealDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevLink = prev ? `<a class="sap-prevnext prev" href="../${prev.dealDir}/reader.html">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="sap-prevnext next" href="../${next.dealDir}/reader.html">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="sap-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(path.join(OPGEMAAKT, part.niveauDir, part.dealDir))}\n<nav class="sap-partnav">${prevLink}${nextLink}</nav>`;

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
  const introHtml = `<p>Deze Ductus-opleiding leert business analisten SAP zelfstandig lezen en beoordelen in een SAP-implementatietraject — geen configuratie- of programmeercursus, wel de vaardigheid om een consultant en ontwikkelaar te kunnen tegenspreken. De cursus volgt één doorlopende casus bij pensioenuitvoerder Meridiaan Pensioen (dezelfde organisatie als de cursus Testen en Kwaliteitsborging), waar business analist Sanne Wolters de vervanging van het kernadministratiesysteem Panorama door SAP FS-PM/FS-CM meemaakt: van haar eerste onbeantwoordbare vraag over productvarianten (deel 1) tot een masterproef over een discrepantie die pas na livegang wordt ontdekt (deel 30).</p>
<p>Anders dan de meeste Ductus-familiecursussen kent deze cursus geen extern certificeringsanker — er bestaat geen actuele, breed erkende SAP-certificering die specifiek op dit BA-domein aansluit (zie de opzet). In plaats daarvan bouwt de cursus een eigen bekwaamheidslijn op, met een eigen bekwaamheidstoets in de capstones van elk niveau.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="sap-part-num">${p.num}</span><span class="sap-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="sap-level">
  <h2>${lvl.label}</h2>
  <ol class="sap-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SAP voor Business Analysts — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="sap.css">
</head>
<body>
<header class="sap-header">
  <div class="sap-header-inner">
    <a class="sap-brand" href="index.html">SAP voor Business Analysts</a>
    <nav class="sap-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="sap-main sap-index">
  <h1>SAP voor Business Analysts</h1>
  <p class="sap-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · SAP zelfstandig leren lezen als business analist</p>
  ${introHtml}
  <a class="sap-casus-link" href="00-casusdossier-aanvulling.html">Casusdossier-aanvulling (hoofddossier Meridiaan staat bij de cursus Testen en Kwaliteitsborging)</a>
  <p class="sap-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}
</main>
<footer class="sap-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  fs.writeFileSync(path.join(OUT, 'sap.css'), CSS, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's + 1 casusdossier-aanvulling + index.html gebouwd.`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuur-PNG's (${missing.size}):`, [...missing].join(', '));
  } else {
    console.log('Alle [FIGUUR ...]-markers zijn gekoppeld aan een gegenereerde PNG.');
  }
}

// Zelfde visuele stijl als ddd.css (Ductus-huisstijl), klassenamen omgezet naar sap-*.
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

.sap-article details { margin: 1rem 0; background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--navy); border-radius: 6px; padding: .2rem 1.1rem; }
.sap-article details[open] { padding-bottom: .9rem; }
.sap-article summary { cursor: pointer; font-weight: 700; color: var(--navy); padding: .7rem 0; list-style: revert; }
.sap-article summary:hover { color: var(--amber); }

.sap-header { background: var(--navy); color: #fff; padding: .9rem 1.5rem; }
.sap-header-inner { max-width: 880px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: .5rem 1.2rem; align-items: baseline; }
.sap-brand { font-family: 'Cormorant Garamond', serif; font-weight: 700; font-size: 1.3rem; color: #fff; text-decoration: none; }
.sap-breadcrumb { font-size: .85rem; color: #CFE0F2; }
.sap-breadcrumb a { color: #CFE0F2; }
.sap-breadcrumb a:hover { color: var(--amber); }

.sap-main { max-width: 880px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
.sap-article p { margin: 1rem 0; }
.sap-article table { border-collapse: collapse; width: 100%; margin: 1.4rem 0; }
.sap-article th, .sap-article td { border: 1px solid var(--border); padding: .5rem .7rem; text-align: left; }
.sap-article th { background: #EEF2F7; }

.sap-tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.6rem; }
.sap-tabs a { display: inline-block; padding: .4rem .9rem; border-radius: 999px; background: #fff; border: 1px solid var(--border); text-decoration: none; font-weight: 500; font-size: .92rem; color: var(--navy); }
.sap-tabs a.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.sap-tabs a:hover:not(.active) { border-color: var(--amber); color: var(--amber); }

.sap-partnav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2.5rem; padding-top: 1.2rem; border-top: 1px solid var(--border); font-size: .95rem; }
.sap-prevnext { text-decoration: none; max-width: 45%; }
.sap-prevnext.next { text-align: right; }

.sap-figure { margin: 1.8rem 0; text-align: center; }
.sap-figure img { max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 6px; background: #fff; }
.sap-figure figcaption { margin-top: .5rem; font-size: .85rem; color: var(--sub); font-style: italic; }

.sap-footer { text-align: center; padding: 2rem 1rem; color: var(--sub); font-size: .85rem; }
.sap-footer a { color: var(--sub); }

.sap-download-box { margin-top: 2.5rem; background: var(--card); border: 1px solid var(--border); border-left: 4px solid var(--amber); border-radius: 8px; padding: 1.2rem 1.6rem; }
.sap-download-box h2 { margin: 0 0 .8rem; font-size: 1.25rem; border-bottom: none; padding-bottom: 0; }
.sap-download-box ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.sap-download-box li { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; padding: .5rem .7rem; border-radius: 6px; background: var(--bg); }
.sap-download-box a { text-decoration: none; font-weight: 600; color: var(--navy); }
.sap-download-box a:hover { color: var(--amber); }
.sap-download-size { font-size: .8rem; color: var(--sub); white-space: nowrap; }

.sap-downloads-note { margin-top: .6rem; font-size: .92rem; color: var(--sub); }

.sap-index .sap-subtitle { color: var(--sub); font-size: 1.05rem; margin-bottom: 1.6rem; }
.sap-level { margin-top: 2.4rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.4rem 1.6rem; }
.sap-casus-link { display: inline-block; margin: .2rem 0 1rem; font-size: .9rem; color: var(--navy); font-weight: 500; }
.sap-part-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .4rem; }
.sap-part-list a { display: flex; gap: .8rem; align-items: baseline; text-decoration: none; padding: .5rem .6rem; border-radius: 6px; }
.sap-part-list a:hover { background: #FBF6E9; }
.sap-part-num { font-family: 'Cormorant Garamond', serif; font-weight: 700; color: var(--amber); min-width: 1.6rem; }
.sap-part-title { color: var(--ink); }
`;

main();
