// Build tool: converts the Datamanagement course content (04-Broncode/generator/content*.js —
// the same JS objects that drive the docx/pptx generator, plus content16.js in this folder
// for deel 16 which has an older, separately-authored source set) into static HTML pages for
// leren.eductus.nl (fase 2 — interactieve leesversie, bovenop het downloadblok van fase 1).
//
// Unlike the sibling *-build scripts (risico-build, ea-build, ddd-build, ...), there is no
// markdown source here: the reader/werkboek/docentenhandleiding/slidedeck content lives as
// JS data (content.reader is a function that calls L helpers; content.opdrachten/docent/slides
// are plain arrays/objects). This script renders that data straight to HTML via lib-html.js,
// which implements the same L-helper interface (h1/h2/h3/p/bul/num/table/callout/...) as
// 04-Broncode/generator/lib.js but returns HTML strings instead of docx Paragraph objects.
//
// [FIGUUR label: caption]-style markers do not exist as text here — instead content*.js calls
// L.fig(label, caption) directly at the right spot in the reader text (a no-op in the docx
// build; lib.js's fig() there returns an empty paragraph). L.fig() in lib-html.js resolves
// the label against a figMap built by scanning datamanagement/figuren/deel-NN/*.svg and
// emits the <figure> HTML inline — no placeholder/regex trick needed since we're not going
// through a markdown parser.
'use strict';
const fs = require('fs');
const path = require('path');
const { makeL, escapeHtml } = require('./lib-html');

const GEN = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'datamanagement', '04-Broncode', 'generator');
const OUT = path.resolve(__dirname, '..', 'datamanagement');
const FIG_DIR = path.join(OUT, 'figuren');

const DELIVERABLES = [
  { slug: 'reader', label: 'Reader' },
  { slug: 'werkboek', label: 'Werkboek' },
  { slug: 'docentenhandleiding', label: 'Docentenhandleiding' },
  { slug: 'slidedeck', label: 'Slidedeck' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament', cert: 'CDMP Associate (≥60%)' },
  { n: 2, dir: 'niveau-2', parts: range(11, 21), label: 'Niveau 2 — Praktijk', cert: 'CDMP Practitioner (≥70% + 2 specialistexamens), IIBA-CBDA' },
  { n: 3, dir: 'niveau-3', parts: range(22, 29), label: 'Niveau 3 — Meesterschap', cert: 'CDMP Master (≥80%), DCAM, IAPP AIGP' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function loadContent(nr) {
  if (nr === 16) return require(path.join(__dirname, 'content16.js'));
  return require(path.join(GEN, `content${nr}.js`));
}

// ---------- figuren-manifest: scan datamanagement/figuren/deel-NN/*.svg ----------
function buildFigMap() {
  const map = {};
  if (!fs.existsSync(FIG_DIR)) return map;
  for (const dealDir of fs.readdirSync(FIG_DIR)) {
    const full = path.join(FIG_DIR, dealDir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) {
      const m = f.match(/^figuur-([\w.-]+)\.svg$/i);
      if (m) map[m[1]] = `figuren/${dealDir}/${f}`;
    }
  }
  return map;
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
    return `<li><a href="${d.file}">${d.label}</a><span class="dmg-download-size">${size}</span></li>`;
  }).filter(Boolean).join('\n');
  if (!items) return '';
  return `<aside class="dmg-download-box">
  <h2>Dit deel downloaden</h2>
  <ul>
  ${items}
  </ul>
</aside>`;
}

// ---------- deliverable body builders ----------
const LETTERS = ['A', 'B', 'C', 'D'];

function pageHead(title) {
  return `<h1>${escapeHtml(title.dealTitle)}</h1>\n<p><strong>${escapeHtml(title.niveauLabel)} · ${escapeHtml(title.deliverableLabel)}</strong></p>\n<hr>\n`;
}

function buildReaderBody(C, L, title) {
  const body = C.reader(L);
  return pageHead(title) + body.join('\n');
}

function buildWerkboekBody(C, L, title) {
  const out = [pageHead(title)];
  out.push(L.h1('Hoe je dit werkboek gebruikt'));
  (C.werkboekIntro || []).forEach(t => out.push(L.p(t)));
  out.push(L.table(['Opdracht', 'Wanneer', 'Werkvorm', 'Tijd'], C.opdrachtTabel || []));
  out.push(L.pageBreak());
  (C.opdrachten || []).forEach((o, i) => {
    out.push(L.h2(`Opdracht ${o.nr} — ${o.titel}`));
    out.push(`<p><em>${escapeHtml(o.tijd)}</em></p>`);
    out.push(L.p([{ text: 'Doel. ', bold: true }, { text: o.doel }]));
    out.push(...L.bul(o.stappen));
    out.push(L.p([{ text: 'Op te leveren. ', bold: true }, { text: o.oplevering }]));
    if (o.tip) out.push(L.callout('Tip', [o.tip]));
    if (i < C.opdrachten.length - 1) out.push(L.pageBreak());
  });
  out.push(L.pageBreak());
  out.push(L.h1('Zelftoets'));
  out.push(L.p(`${(C.quiz || []).length} meerkeuzevragen in de stijl van de scenariovragen die je op het examen tegenkomt. Deze vragen zijn door Ductus zelf opgesteld; het zijn geen examenvragen en ze zijn niet ontleend aan officieel examenmateriaal. De antwoorden krijg je van je docent.`));
  (C.quiz || []).forEach((item, i) => {
    out.push(`<p><strong>${i + 1}. ${escapeHtml(item.q)}</strong></p>`);
    out.push(`<ul>${item.o.map((opt, j) => `<li>${LETTERS[j]}. ${escapeHtml(opt)}</li>`).join('')}</ul>`);
  });
  out.push(L.pageBreak());
  out.push(L.h1('Reflectie'));
  out.push(L.p('Rond het deel af met korte antwoorden op de volgende vragen.'));
  (C.reflectie || []).forEach(q => out.push(L.h3(q)));
  return out.join('\n');
}

function buildDocentBody(C, L, title) {
  const D = C.docent || {};
  const out = [pageHead(title)];
  out.push(L.callout('Niet uitdelen aan deelnemers', ['Deze handleiding bevat de modelantwoorden en de sleutel van de zelftoets.']));
  out.push(L.h1('1. Voorbereiding'));
  out.push(L.h3('Wat de deelnemers vooraf hebben gedaan'));
  out.push(...L.bul(D.vooraf || []));
  out.push(L.h3('Wat jij klaarzet'));
  out.push(...L.bul(D.klaarzetten || []));
  out.push(L.h3('Waar dit deel vandaan komt en waar het heen gaat'));
  out.push(L.p(D.positionering || ''));
  out.push(L.h2('2. Dagindeling'));
  out.push(L.table(['Tijd', 'Onderdeel', 'Werkvorm', 'Let op'], D.dagindeling || []));
  out.push(L.pageBreak());
  out.push(L.h1('3. Modelantwoorden'));
  out.push(L.p('Er is per opdracht geen enkel juist antwoord. Beoordeel op consistentie en op expliciete aannames.'));
  (D.model || []).forEach(m => {
    out.push(L.h2(`Opdracht ${m.nr} — ${m.titel}`));
    out.push(L.h3('Een sterk antwoord bevat'));
    out.push(...L.bul(m.sterk || []));
    out.push(L.h3('Waar het meestal misgaat'));
    out.push(...L.bul(m.mis || []));
    out.push(L.callout('Openingsvraag voor de nabespreking', [m.vraag]));
  });
  out.push(L.pageBreak());
  out.push(L.h1('4. Sleutel bij de zelftoets'));
  (C.quiz || []).forEach((item, i) => {
    out.push(`<p><strong>${i + 1}. ${escapeHtml(item.q)}</strong></p>`);
    out.push(`<p><strong>Juist: ${LETTERS[item.a]}</strong> — ${escapeHtml(item.o[item.a])}</p>`);
    out.push(`<p><em>${escapeHtml(item.e)}</em></p>`);
  });
  out.push(L.pageBreak());
  out.push(L.h1('5. Discussievragen voor als je tijd overhoudt'));
  out.push(...L.num(D.discussie || []));
  out.push(L.h1('6. Differentiatie'));
  out.push(L.h3('Voor deelnemers die het snel oppikken'));
  out.push(...L.bul(D.snelle || []));
  out.push(L.h3('Voor deelnemers die vastlopen'));
  out.push(...L.bul(D.vast || []));
  out.push(L.h1('7. Veelgestelde vragen'));
  out.push(L.table(['Vraag', 'Antwoord'], D.faq || []));
  return out.join('\n');
}

function slideHeading(sp, i) {
  const bits = [sp.kicker, sp.titel].filter(Boolean);
  return `Slide ${i + 1}${bits.length ? ' — ' + bits.join(' · ') : ''}`;
}

function buildSlidedeckBody(C, L, title) {
  const out = [pageHead(title)];
  out.push(L.p(`${(C.slides || []).length} slides`));
  (C.slides || []).forEach((sp, i) => {
    out.push(L.h2(slideHeading(sp, i)));
    if (sp.t === 'cover') {
      out.push(L.p(sp.sub));
    } else if (sp.t === 'statement') {
      out.push(`<p><strong>${escapeHtml(sp.big)}</strong></p>`);
      if (sp.small) out.push(L.p(sp.small));
    } else if (sp.t === 'table') {
      if (sp.sub) out.push(L.p(sp.sub));
      out.push(L.table(sp.head, sp.rows));
      if (sp.foot) out.push(`<p><em>${escapeHtml(sp.foot)}</em></p>`);
    } else if (sp.t === 'cards') {
      if (sp.sub) out.push(L.p(sp.sub));
      (sp.items || []).forEach(it => {
        out.push(L.h3(it.n ? `${it.n}. ${it.h}` : it.h));
        if (it.b) out.push(L.p(it.b));
      });
      if (sp.foot) out.push(`<p><em>${escapeHtml(sp.foot)}</em></p>`);
    } else if (sp.t === 'twocol') {
      if (sp.sub) out.push(L.p(sp.sub));
      out.push(L.h3(sp.leftH || ''));
      out.push(...L.bul(sp.left || []));
      out.push(L.h3(sp.rightH || ''));
      out.push(...L.bul(sp.right || []));
      if (sp.foot) out.push(`<p><em>${escapeHtml(sp.foot)}</em></p>`);
    } else if (sp.t === 'stat') {
      out.push(`<p><strong>${escapeHtml(sp.big)}</strong> — ${escapeHtml(sp.bigsub || '')}</p>`);
      out.push(...L.bul(sp.right || []));
      if (sp.foot) out.push(`<p><em>${escapeHtml(sp.foot)}</em></p>`);
    } else if (sp.t === 'exam') {
      if (sp.sub) out.push(L.p(sp.sub));
      out.push(...L.bul(sp.left || []));
    }
    if (sp.notes) out.push(`<p class="dmg-slide-notes"><em>Sprekersnotitie: ${escapeHtml(sp.notes)}</em></p>`);
    out.push(L.pageBreak());
  });
  return out.join('\n');
}

const BUILDERS = { reader: buildReaderBody, werkboek: buildWerkboekBody, docentenhandleiding: buildDocentBody, slidedeck: buildSlidedeckBody };

// ---------- page shell ----------
function page({ pageTitle, breadcrumb, bodyHtml, navTop, navBottom, dirDepth }) {
  const root = '../'.repeat(dirDepth);
  const siteRoot = root + '../';
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(pageTitle)} — Datamanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}datamanagement.css">
</head>
<body>
<header class="dmg-header">
  <div class="dmg-header-inner">
    <a class="dmg-brand" href="${root}index.html">Datamanagement</a>
    <nav class="dmg-breadcrumb">${breadcrumb}</nav>
  </div>
</header>
<main class="dmg-main">
${navTop}
<article class="dmg-article">
${bodyHtml}
</article>
${navBottom}
</main>
<footer class="dmg-footer">
  <p>Ductus-cursusfamilie · Datamanagement · <a href="${root}index.html">terug naar cursusoverzicht</a> · <a href="${siteRoot}index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>`;
}

function main() {
  ensureDir(OUT);
  const figMap = buildFigMap();
  const missing = new Set();

  const allParts = [];
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const C = loadContent(num);
      allParts.push({ niveau: lvl.n, niveauDir: lvl.dir, niveauLabel: lvl.label, num, dealDir: `deel-${pad(num)}`, titel: C.titel, C });
    }
  }

  let pageCount = 0;
  const dirDepth = 2; // datamanagement/niveau-N/deel-NN/<file>.html

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    const prev = allParts[i - 1];
    const next = allParts[i + 1];
    const outDir = path.join(OUT, part.niveauDir, part.dealDir);
    ensureDir(outDir);
    const dealTitle = `Deel ${part.num} — ${part.titel}`;

    const prevHref = prev ? (prev.niveauDir === part.niveauDir ? `../${prev.dealDir}/reader.html` : `../../${prev.niveauDir}/${prev.dealDir}/reader.html`) : null;
    const nextHref = next ? (next.niveauDir === part.niveauDir ? `../${next.dealDir}/reader.html` : `../../${next.niveauDir}/${next.dealDir}/reader.html`) : null;
    const prevLink = prev ? `<a class="dmg-prevnext prev" href="${prevHref}">&larr; Deel ${prev.num} — ${escapeHtml(prev.titel)}</a>` : `<span></span>`;
    const nextLink = next ? `<a class="dmg-prevnext next" href="${nextHref}">Deel ${next.num} — ${escapeHtml(next.titel)} &rarr;</a>` : `<span></span>`;

    for (const dlv of DELIVERABLES) {
      const L = makeL(figMap, dirDepth, missing);
      const builder = BUILDERS[dlv.slug];
      const bodyHtml = builder(part.C, L, { dealTitle, niveauLabel: `${part.niveauLabel}`, deliverableLabel: dlv.label });

      const tabs = DELIVERABLES.map(d => {
        const active = d.slug === dlv.slug ? ' class="active"' : '';
        return `<a href="${d.slug}.html"${active}>${d.label}</a>`;
      }).join('');
      const navTop = `<div class="dmg-tabs">${tabs}</div>`;
      const navBottom = `${downloadBox(outDir)}\n<nav class="dmg-partnav">${prevLink}${nextLink}</nav>`;

      const html = page({
        pageTitle: `${dlv.label} — ${dealTitle}`,
        breadcrumb: `<a href="../../index.html">Cursusoverzicht</a> &rsaquo; Niveau ${part.niveau} &rsaquo; Deel ${part.num} &rsaquo; ${dlv.label}`,
        bodyHtml,
        navTop,
        navBottom,
        dirDepth,
      });
      fs.writeFileSync(path.join(outDir, `${dlv.slug}.html`), html, 'utf8');
      pageCount++;
    }
  }

  // ---- index.html: elk deel linkt nu naar reader.html i.p.v. rechtstreeks naar de downloads
  // (zelfde ingreep als bij DDD/EIP/BA/Risicomanagement/OutSystems) ----
  const introHtml = `<p>Deze Ductus-opleiding behandelt datamanagement volgens de DAMA-DMBOK2 in drie niveaus: het fundament (data als bedrijfsmiddel, databasics en modelleren, opslag en datastromen, datakwaliteit, data-analyse, visualisatie, governance/privacy/security), de praktijklaag (frameworks, modellering, metadata en catalogus, master- en referentiedata, datakwaliteitsmanagement als proces, governance operating model, privacy/security/compliance, data-analyse voor besluitvorming) en het meesterschapsniveau (enterprise data-architectuur, moderne dataplatformen, DCAM v3, federatieve governance, datawaardering, AI- en modelgovernance). Eén doorlopende casus bij pensioenuitvoerder Meridiaan Pensioen N.V., die in niveau 3 uitgroeit tot een fusie met Nautilus Pensioendiensten.</p>
<p>Elk deel bestaat uit vier onderdelen: een <strong>reader</strong> (leestekst met de casus en het instrument van dat deel, inclusief getekende figuren), een <strong>werkboek</strong> (opdrachten met uitwerkingen), een <strong>docentenhandleiding</strong> (voor wie het deel begeleidt) en een <strong>slidedeck</strong> (de presentatie bij het deel).</p>`;

  const levelBlocks = NIVEAUS.map(lvl => {
    const items = allParts.filter(p => p.niveau === lvl.n).map(p => `<div class="dmg-part">
  <a class="dmg-part-link" href="${lvl.dir}/${p.dealDir}/reader.html">
    <div class="dmg-part-head"><span class="dmg-part-num">${p.num}</span><span class="dmg-part-title">Deel ${p.num} — ${escapeHtml(p.titel)}</span></div>
  </a>
</div>`).join('\n');
    return `<section class="dmg-level">
<h2>${lvl.label} <span class="dmg-cert-note">— ${lvl.cert}</span></h2>
${items}
</section>`;
  }).join('\n');

  const indexHtml = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Datamanagement — Eductus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="datamanagement.css">
</head>
<body>
<header class="dmg-header">
  <div class="dmg-header-inner">
    <a class="dmg-brand" href="index.html">Datamanagement</a>
    <nav class="dmg-breadcrumb"><a href="../index.html">Alle Eductus-cursussen</a></nav>
  </div>
</header>
<main class="dmg-main">
  <h1>Datamanagement</h1>
  <p class="dmg-subtitle">Ductus-cursusfamilie · 3 niveaus · 29 delen · DAMA-DMBOK · CDMP Associate → Practitioner → Master</p>
  ${introHtml}
  ${levelBlocks}
</main>
<footer class="dmg-footer">
  <p>Ductus-cursusfamilie · <a href="../index.html">alle Eductus-cursussen</a></p>
</footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml, 'utf8');

  console.log(`Klaar. ${pageCount} deliverable-pagina's + index.html gebouwd.`);
  if (missing.size) {
    console.log(`WAARSCHUWING — ontbrekende figuurlabels (${missing.size}):`, [...missing].sort().join(', '));
  } else {
    console.log('Alle L.fig(...)-markers zijn gekoppeld aan een gepubliceerde SVG.');
  }
}

main();
