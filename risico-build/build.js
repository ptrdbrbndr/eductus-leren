// Build tool: converts the Risicomanagement course markdown source into static HTML pages
// for leren.eductus.nl (fase 2 — interactieve leesversie, bovenop het downloadblok van fase 1).
// Run: node build.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Risico management', 'risicomanagement-cursus');
const FIGURES_SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'Risico management', 'tooling', 'figures');
const OUT = path.resolve(__dirname, '..', 'risicomanagement');
const FIG_OUT = path.join(OUT, 'figuren');

// <details>/<summary> blokken (werkboek-uitwerkingen) staan als losse HTML-tags in
// de bron; die moeten door markdown-it heen kunnen. Verder komen er geen losse
// HTML-tags in de bronbestanden voor (geverifieerd), dus html:true is hier veilig.
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

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
  { n: 2, dir: 'niveau-2', parts: range(11, 22), label: 'Niveau 2 — Professional' },
  { n: 3, dir: 'niveau-3', parts: range(23, 30), label: 'Niveau 3 — Expert' },
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

// ---------- 3. Figure marker replacement ----------
// Normale vorm (reader/werkboek/docentenhandleiding en de meeste slidedeck-passages):
//   **[FIGUUR 15-2]** *bijschrift...*
// In slidedeck.md staat de marker soms in de dia-kop zelf, met het bijschrift als
// losse cursieve alinea eronder, bv.:
//   ## Slide 8 — [FIGUUR 1-1]
//
//   *Tijdlijn WGP 2.0 — ...*
// Die vorm wordt eerst omgezet naar de normale vorm (kop zonder marker + bold-marker
// met bijschrift eronder), zodat één regex de rest kan afhandelen.
function normalizeSlideHeadingFigures(text) {
  // Variant met een direct volgend cursief bijschrift.
  text = text.replace(
    /^(##\s*Slide\s+\d+\s*(?:—|-)\s*)\[FIGUUR\s+([\w.\-]+)\](.*)\n\n\*([^*\n]+)\*/gm,
    (whole, headPrefix, label, trailing, caption) => `${headPrefix}Figuur ${label}${trailing}\n\n**[FIGUUR ${label}]** *${caption}*`
  );
  // Overige gevallen: marker in de kop zonder direct volgend bijschrift.
  text = text.replace(
    /^(##\s*Slide\s+\d+\s*(?:—|-)\s*)\[FIGUUR\s+([\w.\-]+)\](.*)$/gm,
    (whole, headPrefix, label, trailing) => `${headPrefix}Figuur ${label}${trailing}\n\n**[FIGUUR ${label}]**`
  );
  return text;
}

const FIGUUR_RE = /\*\*\[FIGUUR\s+([\w.\-]+)\]\*\*(?:\s*\*([^*\n]+)\*)?/g;

function replaceFiguren(text, figMap, depth, missing) {
  return text.replace(FIGUUR_RE, (whole, label, caption) => {
    const relPath = figMap[label];
    const hasCaption = !!(caption && caption.trim());
    const cap = hasCaption ? caption.trim() : '';
    let html;
    if (!relPath) {
      missing.add(label);
      html = `<p class="risico-figure-missing"><em>[Figuur ${label} ontbreekt${hasCaption ? ': ' + escapeHtml(cap) : ''}]</em></p>`;
    } else {
      const upDepth = '../'.repeat(depth);
      const src = upDepth + relPath;
      const alt = escapeHtml(hasCaption ? cap : `Figuur ${label}`);
      const figcaption = hasCaption ? `Figuur ${label} — ${escapeHtml(cap)}` : `Figuur ${label}`;
      html = `<figure class="risico-figure"><img src="${src}" alt="${alt}" loading="lazy"><figcaption>${figcaption}</figcaption></figure>`;
    }
    const placeholder = `RISICOFIGPLACEHOLDER${figurePlaceholderSeq++}RISICOFIGPLACEHOLDER`;
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
// dirDepth = levels up to reach risicomanagement/ (OUT root, waar index.html + risico.css + figuren/ staan)
function page({ title, breadcrumb, bodyHtml, nav, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} — Risicomanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}risico.css">
</head>
<body>
<header class="risico-header">
  <div class="risico-header-inner">
    <a class="risico-brand" href="${root}index.html">Risicomanagement</a>
    <nav class="risico-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="risico-main">
${nav ? nav.top : ''}
<article class="risico-article">
${bodyHtml}
</article>
${nav ? nav.bottom : ''}
</main>
<footer class="risico-footer">
  <p>Ductus-cursusfamilie · Risicomanagement · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
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

function downloadBox(srcDir) {
  const items = DOWNLOAD_FILES.map(d => {
    const p = path.join(srcDir, d.file);
    if (!fs.existsSync(p)) return '';
    const size = formatSize(fs.statSync(p).size);
    return `<li><a href="${d.file}">${d.label}</a><span class="risico-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="risico-download-box">
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
      const dealDir = fs.readdirSync(path.join(SRC, lvl.dir)).find(d => d.startsWith(`deel-${pad(num)}-`));
      const readerPath = path.join(SRC, lvl.dir, dealDir, 'reader.md');
      const text = fs.readFileSync(readerPath, 'utf8');
      const h1 = firstH1(text) || `Deel ${num}`;
      allParts.push({ niveau: lvl.n, num, dealDir, niveauDir: lvl.dir, title: h1 });
    }
  }

  let pageCount = 0;

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dirDepth = 2; // risicomanagement/niveau-N/deel-NN/<file>.html

    for (const dlv of DELIVERABLES) {
      const srcPath = path.join(SRC, part.niveauDir, part.dealDir, dlv.file);
      if (!fs.existsSync(srcPath)) continue;
      let raw = fs.readFileSync(srcPath, 'utf8');
      if (dlv.slug === 'slidedeck') raw = normalizeSlideHeadingFigures(raw);
      const withFig = replaceFiguren(raw, figMap, dirDepth, missing);
      const bodyHtml = restoreFigurePlaceholders(md.render(withFig));
      const title = `${dlv.label} — ${part.title}`;

      const tabs = DELIVERABLES.map(d => {
        const exists = fs.existsSync(path.join(SRC, part.niveauDir, part.dealDir, d.file));
        if (!exists) return '';
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');

      const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.dealDir}/reader.html` : `../../${prev.niveauDir}/${prev.dealDir}/reader.html`) : null;
      const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.dealDir}/reader.html` : `../../${next.niveauDir}/${next.dealDir}/reader.html`) : null;
      const prevLink = prev ? `<a class="risico-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.title)}</a>` : `<span></span>`;
      const nextLink = next ? `<a class="risico-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.title)} &rarr;</a>` : `<span></span>`;

      const navTop = `<div class="risico-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(path.join(SRC, part.niveauDir, part.dealDir))}\n<nav class="risico-partnav">${prevLink}${nextLink}</nav>`;

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
    1: 'ISO 31000 Foundations (CRMF)',
    2: 'M_o_R 4 Practitioner + IRM Certificate ERM Level 5',
    3: 'DNB-geschiktheidstoetsing sleutelfunctie risicobeheer',
  };
  const introHtml = `<p>Deze Ductus-opleiding behandelt risicomanagement in drie niveaus: het fundament (de risicozin, kwalitatieve analyse, het register, monitoring en escalatie), de professional-laag (M_o_R 4, kwantitatieve technieken tot en met Monte Carlo-simulatie, bow-tie-analyse, geaggregeerd risico, IT/cyberrisico, rapportage en risicocultuur) en het expert-niveau (risicomanagement onder wettelijk toezicht — Solvency II, IORP II, DORA — strategisch, operationeel en financieel risico, ethiek onder druk, en de masterproef). Eén doorlopende casus bij pensioenuitvoerder Meridiaan Pensioen, van het gestrande risicoregister van project WGP 2.0 tot een wettelijk escalatieadvies als sleutelfunctiehouder risicobeheer.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p =>
      `<li><a href="${lvl.dir}/${p.dealDir}/reader.html"><span class="risico-part-num">${p.num}</span><span class="risico-part-title">${escapeHtml(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="risico-level">
  <h2>${lvl.label} <span class="risico-cert-note">— ${CERT[lvl.n]}</span></h2>
  <ol class="risico-part-list">
  ${items}
  </ol>
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Risicomanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="risico.css">
</head>
<body>
<header class="risico-header">
  <div class="risico-header-inner">
    <a class="risico-brand" href="index.html">Risicomanagement</a>
    <nav class="risico-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="risico-main risico-index">
  <h1>Risicomanagement</h1>
  <p class="risico-subtitle">Ductus-cursusfamilie · 3 niveaus · 30 delen · ISO 31000/CRMF → M_o_R 4 Practitioner + IRM ERM Level 5 → DNB-geschiktheid sleutelfunctie risicobeheer</p>
  ${introHtml}
  <p class="risico-downloads-note">Elk deel is ook te downloaden als Word- en PowerPoint-bestand (reader, werkboek, docentenhandleiding, slidedeck) — open een deel en gebruik het kader &ldquo;Dit deel downloaden&rdquo; onderaan de pagina.</p>
  ${levelBlocks}

<section class="risico-level">
  <h2>Toolbijlage</h2>
  <p>Monte Carlo-simulatie in Python en Excel, een toolneutrale bow-tie-notatiekaart, en klikpaden in Eramba Community Edition (gratis, open-source GRC-software) — buiten de nummering van de dertig delen.</p>
  <div class="risico-part-downloads" style="margin-left:0">
    <a href="toolbijlage/toolbijlage.docx">Toolbijlage (.docx)</a>
  </div>
</section>
</main>
<footer class="risico-footer">
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
