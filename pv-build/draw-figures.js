// One-off generator for the 21 hand-designed SVG figures of the "Nederlandse
// pensioenverzekering" course. Not part of the page build (build.js) — run once
// (or re-run after edits) to (re)write pensioenverzekeringen/figuren/deel-NN/figuur-x-y.svg.
// Ductus huisstijl: Midnight Navy #14213D, Ductus Blue #2563A8, Direction Amber #E9A13B,
// borders #E3E0D8 / #DFDCD3, white figure background, Cormorant Garamond (titels) + DM Sans (labels).
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'pensioenverzekeringen', 'figuren');

const NAVY = '#14213D';
const BLUE = '#2563A8';
const AMBER = '#E9A13B';
const SUB = '#55606F';
const BORDER = '#E3E0D8';
const BORDER2 = '#DFDCD3';
const PAPERTINT = '#FBF6E9';

const W = 1400, H = 720;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function text(x, y, lines, opts = {}) {
  const {
    size = 13, weight = 'normal', fill = SUB, family = 'DM Sans',
    anchor = 'middle', lineHeight = size * 1.3, style = 'normal',
  } = opts;
  const arr = Array.isArray(lines) ? lines : [lines];
  const tspans = arr.map((l, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`
  ).join('');
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" font-style="${style}" fill="${fill}" text-anchor="${anchor}">${tspans}</text>`;
}

function rect(x, y, w, h, opts = {}) {
  const { fill = '#FFFFFF', stroke = BORDER, strokeWidth = 1, rx = 8, dash = null } = opts;
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${d}/>`;
}

function line(x1, y1, x2, y2, opts = {}) {
  const { stroke = BORDER2, strokeWidth = 1.5, dash = null, marker = false } = opts;
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  const m = marker ? ` marker-end="url(#arrow)"` : '';
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"${d}${m}/>`;
}

function circleTag(cx, cy, r, opts = {}) {
  const { fill = AMBER, stroke = NAVY, strokeWidth = 1.5 } = opts;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
}

function defs() {
  return `<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${BLUE}"/></marker></defs>`;
}

function svg(bodyParts, { title } = {}) {
  const head = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#FFFFFF"/>
${defs()}`;
  const titleEl = title ? text(W / 2, 46, title, { size: 25, weight: 'bold', fill: NAVY, family: 'Cormorant Garamond', lineHeight: 30 }) : '';
  return `${head}
${titleEl}
${bodyParts.join('\n')}
</svg>`;
}

// A box with a header band + body lines, used a lot (columns, cards).
function card(x, y, w, h, { header, headerFill = NAVY, headerTextFill = '#FFFFFF', body = [], bodySize = 12.5, bodyFill = SUB, accent = null } = {}) {
  const parts = [];
  parts.push(rect(x, y, w, h, { stroke: BORDER, fill: '#FFFFFF' }));
  const headH = 40;
  parts.push(`<path d="M${x},${y + 8} a8,8 0 0 1 8,-8 h${w - 16} a8,8 0 0 1 8,8 v${headH - 8} h-${w} z" fill="${headerFill}"/>`);
  parts.push(text(x + w / 2, y + 26, header, { size: 15, weight: 'bold', fill: headerTextFill, family: 'Cormorant Garamond', anchor: 'middle' }));
  if (accent) parts.push(rect(x, y + headH, w, 4, { fill: accent, stroke: 'none', rx: 0 }));
  let cy = y + headH + 26;
  for (const row of body) {
    if (row.label) {
      parts.push(text(x + 14, cy, row.label, { size: 11, weight: 'bold', fill: NAVY, family: 'DM Sans', anchor: 'start', lineHeight: 14 }));
      cy += 15;
    }
    const lines = Array.isArray(row.value) ? row.value : [row.value];
    parts.push(text(x + 14, cy, lines, { size: bodySize, fill: bodyFill, family: 'DM Sans', anchor: 'start', lineHeight: bodySize * 1.35 }));
    cy += lines.length * bodySize * 1.35 + 12;
  }
  return parts.join('\n');
}

function writeFig(dealNum, label, bodyParts, title) {
  const dealDir = `deel-${String(dealNum).padStart(2, '0')}`;
  const outDir = path.join(OUT, dealDir);
  fs.mkdirSync(outDir, { recursive: true });
  const content = svg(bodyParts, { title });
  fs.writeFileSync(path.join(outDir, `figuur-${label}.svg`), content, 'utf8');
  console.log(`figuur-${label}.svg geschreven (${dealDir})`);
}

// ============================================================================
// FIGUUR 1-1 — De drie pijlers, met bron, verplichting, uitvoerder
// ============================================================================
{
  const cols = [
    { header: 'Eerste pijler — AOW', accent: BLUE, body: [
      { label: 'Bron', value: 'Overheid, volksverzekering' },
      { label: 'Verplichting', value: ['Omslagstelsel: premies', 'van vandaag betalen', 'uitkeringen van vandaag'] },
      { label: 'Uitvoerder', value: 'Sociale Verzekeringsbank (SVB)' },
    ]},
    { header: 'Tweede pijler — werknemerspensioen', accent: AMBER, body: [
      { label: 'Bron', value: ['Arbeidsvoorwaarde: cao-tafel', 'of arbeidscontract'] },
      { label: 'Verplichting', value: 'Kapitaaldekking: opbouw voor eigen uitkering' },
      { label: 'Uitvoerder', value: 'Fonds, verzekeraar, PPI of APF' },
    ]},
    { header: 'Derde pijler — individueel', accent: BLUE, body: [
      { label: 'Bron', value: 'Vrijwillig initiatief' },
      { label: 'Verplichting', value: ['Fiscaal gefaciliteerd', 'binnen de jaarruimte'] },
      { label: 'Uitvoerder', value: 'Lijfrenteverzekeraar of bank' },
    ]},
  ];
  const colW = 400, gap = 40, startX = (W - (colW * 3 + gap * 2)) / 2, y = 90, h = 300;
  const parts = [];
  cols.forEach((c, i) => {
    const x = startX + i * (colW + gap);
    parts.push(card(x, y, colW, h, c));
  });
  parts.push(text(W / 2, 440, 'De tweede pijler bouwt bovenop de AOW via de franchise — het salarisdeel waarover geen pensioen wordt opgebouwd', { size: 13, fill: SUB, style: 'italic' }));
  writeFig(1, '1-1', parts, 'De drie pijlers van het Nederlandse pensioenstelsel');
}

// ============================================================================
// FIGUUR 1-2 — Vier typen pensioenuitvoerders
// ============================================================================
{
  const cols = [
    { header: 'Fonds', accent: BLUE, body: [
      { label: 'Rechtsvorm', value: 'Stichting, geen winstoogmerk' },
      { label: 'Risicodragerschap', value: 'Collectief' },
      { label: 'Toezichtkader', value: 'FTK / Wtp-kader (DNB)' },
      { label: 'Contractduur', value: 'Doorlopend' },
    ]},
    { header: 'Verzekeraar', accent: AMBER, body: [
      { label: 'Rechtsvorm', value: 'N.V., winstoogmerk' },
      { label: 'Risicodragerschap', value: 'Contractueel bij de verzekeraar' },
      { label: 'Toezichtkader', value: 'Solvency II (DNB)' },
      { label: 'Contractduur', value: 'Bepaalde tijd (vaak 5 jaar)' },
    ]},
    { header: 'PPI', accent: BLUE, body: [
      { label: 'Rechtsvorm', value: 'N.V. / B.V., winstoogmerk' },
      { label: 'Risicodragerschap', value: 'Geen — herverzekerd' },
      { label: 'Toezichtkader', value: 'Prudentieel licht' },
      { label: 'Contractduur', value: 'Bepaalde tijd' },
    ]},
    { header: 'APF', accent: AMBER, body: [
      { label: 'Rechtsvorm', value: 'Stichting, per kring' },
      { label: 'Risicodragerschap', value: 'Collectief, per kring' },
      { label: 'Toezichtkader', value: 'FTK / Wtp-kader (DNB)' },
      { label: 'Contractduur', value: 'Doorlopend' },
    ]},
  ];
  const colW = 310, gap = 26.7, startX = (W - (colW * 4 + gap * 3)) / 2, y = 90, h = 340;
  const parts = [];
  cols.forEach((c, i) => {
    const x = startX + i * (colW + gap);
    parts.push(card(x, y, colW, h, c));
  });
  writeFig(1, '1-2', parts, 'Vier typen pensioenuitvoerders');
}

// ============================================================================
// FIGUUR 1-3 — Tijdlijn 2019-2028
// ============================================================================
{
  const parts = [];
  const axisY = 420, x0 = 120, x1 = 1280;
  parts.push(line(x0, axisY, x1, axisY, { stroke: BORDER2, strokeWidth: 2 }));
  const milestones = [
    { t: '2019', label: ['Pensioen-', 'akkoord'], x: 160 },
    { t: '2020', label: ['Hoofdlijnen-', 'notitie'], x: 340 },
    { t: '1 juli 2023', label: ['Wtp treedt', 'in werking'], x: 560 },
    { t: 'dec 2025', label: ['Transitieperiode met', '1 jaar verlengd'], x: 820 },
    { t: '1 jan 2028', label: ['Uiterste', 'transitiedatum'], x: 1080, main: true },
  ];
  // Transition band
  parts.push(rect(560, axisY - 14, 1080 - 560, 28, { fill: PAPERTINT, stroke: BORDER, rx: 6 }));
  parts.push(text((560 + 1080) / 2, axisY - 90, 'Transitieperiode 2023–2027 (verlengd)', { size: 13, fill: SUB, style: 'italic' }));
  // Extended compensation range, dashed
  parts.push(line(1080, axisY, 1250, axisY, { stroke: AMBER, strokeWidth: 3, dash: '6,5' }));
  parts.push(text(1250, axisY + 60, ['tot 1 jan 2037:', 'einde fiscale', 'compensatieruimte'], { size: 11, fill: SUB, anchor: 'end', lineHeight: 13 }));
  milestones.forEach(m => {
    const r = m.main ? 12 : 8;
    parts.push(circleTag(m.x, axisY, r, { fill: m.main ? AMBER : BLUE, stroke: NAVY }));
    parts.push(text(m.x, axisY - 24, m.t, { size: 13, weight: 'bold', fill: NAVY }));
    parts.push(text(m.x, axisY + 34, m.label, { size: 11.5, fill: SUB, lineHeight: 15 }));
  });
  writeFig(1, '1-3', parts, 'Tijdlijn: van pensioenakkoord tot uiterste transitiedatum');
}

// ============================================================================
// FIGUUR 1-4 — inleg versus waarde, 25-jarige naast 60-jarige
// ============================================================================
{
  const parts = [];
  const baseY = 480, barW = 90;
  function pair(cx, ageLabel, inlegH, waardeH, note) {
    parts.push(rect(cx - 110, baseY - inlegH, barW, inlegH, { fill: BLUE, stroke: 'none', rx: 4 }));
    parts.push(text(cx - 65, baseY - inlegH - 12, 'inleg', { size: 12, fill: NAVY }));
    parts.push(rect(cx + 20, baseY - waardeH, barW, waardeH, { fill: AMBER, stroke: 'none', rx: 4 }));
    parts.push(text(cx + 65, baseY - waardeH - 12, 'waarde op 67', { size: 12, fill: NAVY }));
    parts.push(line(cx - 130, baseY, cx + 130, baseY, { stroke: NAVY, strokeWidth: 2 }));
    parts.push(text(cx, baseY + 34, ageLabel, { size: 16, weight: 'bold', fill: NAVY, family: 'Cormorant Garamond' }));
    parts.push(text(cx, baseY + 56, note, { size: 12, fill: SUB }));
  }
  pair(430, '25-jarige', 60, 300, 'lange rendementsperiode');
  pair(970, '60-jarige', 60, 90, 'korte rendementsperiode');
  parts.push(text(W / 2, 100, 'Gelijke premie-inleg, sterk verschillende eindwaarde bij pensionering', { size: 14, fill: SUB, style: 'italic' }));
  parts.push(rect(200, 580, 1000, 44, { fill: PAPERTINT, stroke: BORDER, rx: 6 }));
  parts.push(text(W / 2, 607, 'Doorsneesystematiek: iedereen betaalt dezelfde premie — jongeren financieren feitelijk mee aan ouderen', { size: 12.5, fill: NAVY }));
  writeFig(1, '1-4', parts, 'Inleg versus waarde: 25-jarige naast 60-jarige');
}

// ============================================================================
// FIGUUR 2-1 — De pensioendriehoek
// ============================================================================
{
  const parts = [];
  const top = { x: 700, y: 130, label: 'Werkgever' };
  const left = { x: 380, y: 480, label: 'Werknemer' };
  const right = { x: 1020, y: 480, label: 'Pensioenuitvoerder' };
  function node(n) {
    parts.push(rect(n.x - 130, n.y - 34, 260, 68, { fill: NAVY, stroke: NAVY, rx: 10 }));
    parts.push(text(n.x, n.y + 6, n.label, { size: 18, weight: 'bold', fill: '#FFFFFF', family: 'Cormorant Garamond' }));
  }
  // Edges (drawn first, below nodes)
  parts.push(line(top.x - 60, top.y + 40, left.x + 60, left.y - 44, { stroke: BLUE, strokeWidth: 2.5, marker: true }));
  parts.push(line(top.x + 60, top.y + 40, right.x - 60, right.y - 44, { stroke: BLUE, strokeWidth: 2.5, marker: true }));
  parts.push(line(left.x + 130, left.y, right.x - 130, right.y, { stroke: BLUE, strokeWidth: 2.5, marker: true }));
  parts.push(node(top)); parts.push(node(left)); parts.push(node(right));
  // Edge labels
  parts.push(rect(430, 260, 260, 56, { fill: '#FFFFFF', stroke: BORDER, rx: 6 }));
  parts.push(text(560, 282, 'Pensioenovereenkomst', { size: 13, weight: 'bold', fill: NAVY }));
  parts.push(text(560, 300, '(arbeidsvoorwaarde)', { size: 11, fill: SUB }));
  parts.push(rect(830, 260, 260, 56, { fill: '#FFFFFF', stroke: BORDER, rx: 6 }));
  parts.push(text(960, 282, 'Uitvoeringsovereenkomst', { size: 13, weight: 'bold', fill: NAVY }));
  parts.push(text(960, 300, '(werkgever — uitvoerder)', { size: 11, fill: SUB }));
  parts.push(rect(570, 500, 260, 56, { fill: '#FFFFFF', stroke: BORDER, rx: 6 }));
  parts.push(text(700, 522, 'Pensioenreglement', { size: 13, weight: 'bold', fill: NAVY }));
  parts.push(text(700, 540, '(uitvoerder — deelnemer)', { size: 11, fill: SUB }));
  writeFig(2, '2-1', parts, 'De pensioendriehoek: drie partijen, drie documenten');
}

// ============================================================================
// FIGUUR 3-1 — Drie karakters: toezegging en risicodrager
// ============================================================================
{
  const cols = [
    { header: 'Uitkeringsovereenkomst', accent: BLUE, body: [
      { label: 'Toezegging', value: ['Een uitkomst:', 'vast bedrag per jaar'] },
      { label: 'Risicodrager', value: ['Collectief (fonds) of', 'verzekeraar (garantie)'] },
    ]},
    { header: 'Kapitaalovereenkomst', accent: AMBER, body: [
      { label: 'Toezegging', value: ['Een kapitaal op de', 'pensioendatum'] },
      { label: 'Risicodrager', value: ['Belegging: verzekeraar', 'Omzetting: deelnemer'] },
    ]},
    { header: 'Premieovereenkomst', accent: BLUE, body: [
      { label: 'Toezegging', value: ['Een premie:', 'een inspanning'] },
      { label: 'Risicodrager', value: 'Deelnemer' },
    ]},
  ];
  const colW = 380, gap = 40, startX = (W - (colW * 3 + gap * 2)) / 2, y = 110, h = 230;
  const parts = [];
  cols.forEach((c, i) => parts.push(card(startX + i * (colW + gap), y, colW, h, c)));
  parts.push(text(W / 2, 420, 'Drieluik: wie belooft wat, wie voert het uit, wie draagt het risico?', { size: 14, fill: SUB, style: 'italic' }));
  writeFig(3, '3-1', parts, 'Drie karakters: toezegging en risicodrager');
}

// ============================================================================
// FIGUUR 3-2 — Beslisboom regelingsvormen na de transitie
// ============================================================================
{
  const parts = [];
  parts.push(rect(500, 90, 400, 70, { fill: NAVY, rx: 10 }));
  parts.push(text(700, 118, 'Premieovereenkomst met', { size: 14, weight: 'bold', fill: '#FFFFFF' }));
  parts.push(text(700, 138, 'vlakke premie (verplicht na transitie)', { size: 13, fill: '#CFE0F2' }));
  const leaves = [
    { x: 220, header: 'Solidaire premieregeling', sub: ['Fonds, PPI, APF'], accent: BLUE },
    { x: 700, header: 'Flexibele premieregeling', sub: ['Fonds, PPI, APF'], accent: AMBER },
    { x: 1180, header: 'Premie-uitkerings-\novereenkomst', sub: ['Alleen verzekeraar'], accent: BLUE },
  ];
  leaves.forEach(lf => {
    parts.push(line(700, 160, lf.x, 260, { marker: true }));
    parts.push(rect(lf.x - 175, 260, 350, 100, { fill: '#FFFFFF', stroke: BORDER, rx: 8 }));
    parts.push(rect(lf.x - 175, 260, 8, 100, { fill: lf.accent, stroke: 'none', rx: 0 }));
    const headerLines = lf.header.split('\n');
    parts.push(text(lf.x, 292, headerLines, { size: 14.5, weight: 'bold', fill: NAVY, family: 'Cormorant Garamond', lineHeight: 18 }));
    parts.push(text(lf.x, 292 + headerLines.length * 18 + 10, lf.sub, { size: 12, fill: SUB }));
  });
  parts.push(text(W / 2, 430, 'De uitkeringsovereenkomst en de kapitaalovereenkomst dragen geen nieuwe opbouw meer', { size: 13, fill: SUB, style: 'italic' }));
  writeFig(3, '3-2', parts, 'Beslisboom: toegestane regelingsvormen na de transitie, per type uitvoerder');
}

// ============================================================================
// FIGUUR 3-3 — inleg € 1.000 op 25 vs. 60, eindwaarde bij gelijk rendement
// ============================================================================
{
  const parts = [];
  const baseY = 500, x0 = 220, x1 = 1180;
  parts.push(line(x0, baseY, x1, baseY, { stroke: NAVY, strokeWidth: 2 }));
  parts.push(text(x0, baseY + 26, '25 jaar', { size: 13, fill: NAVY, weight: 'bold' }));
  parts.push(text(x1, baseY + 26, '67 jaar (pensioendatum)', { size: 13, fill: NAVY, weight: 'bold', anchor: 'end' }));
  // curve for the 25yo investment: exponential-ish growth from x0 to x1
  parts.push(`<path d="M${x0},${baseY} C ${x0 + 300},${baseY - 20} ${x1 - 260},${baseY - 260} ${x1 - 60},${baseY - 340}" fill="none" stroke="${BLUE}" stroke-width="3"/>`);
  parts.push(circleTag(x0, baseY, 8, { fill: BLUE, stroke: NAVY }));
  parts.push(circleTag(x1 - 60, baseY - 340, 10, { fill: BLUE, stroke: NAVY }));
  parts.push(text(x0, baseY - 24, ['inleg 25-jarige:', '€ 1.000'], { size: 12, fill: SUB, lineHeight: 15, anchor: 'start' }));
  parts.push(text(x1 - 60, baseY - 360, 'eindwaarde: hoog', { size: 12.5, fill: NAVY, weight: 'bold' }));
  // 60yo shorter curve, starting later on the axis
  const x60 = x1 - 220;
  parts.push(`<path d="M${x60},${baseY} C ${x60 + 60},${baseY - 10} ${x1 - 90},${baseY - 40} ${x1 - 30},${baseY - 60}" fill="none" stroke="${AMBER}" stroke-width="3"/>`);
  parts.push(circleTag(x60, baseY, 8, { fill: AMBER, stroke: NAVY }));
  parts.push(circleTag(x1 - 30, baseY - 60, 10, { fill: AMBER, stroke: NAVY }));
  parts.push(text(x60, baseY + 46, ['inleg 60-jarige:', '€ 1.000'], { size: 12, fill: SUB, lineHeight: 15 }));
  parts.push(text(x1 - 30, baseY - 80, 'eindwaarde: laag', { size: 12.5, fill: NAVY, weight: 'bold' }));
  parts.push(text(W / 2, 150, 'Zelfde inleg, gelijk rendementspercentage, sterk verschillende looptijd', { size: 14, fill: SUB, style: 'italic' }));
  writeFig(3, '3-3', parts, 'Inleg € 1.000 op 25-jarige versus 60-jarige leeftijd, eindwaarde bij gelijk rendement');
}

// ============================================================================
// FIGUUR 4-1 — Beslisschema werkingssfeer
// ============================================================================
{
  const parts = [];
  parts.push(rect(500, 90, 400, 76, { fill: NAVY, rx: 10 }));
  parts.push(text(700, 122, 'Bedrijfsactiviteit van de', { size: 14, fill: '#CFE0F2' }));
  parts.push(text(700, 144, 'onderneming (feitelijk, niet statutair)', { size: 13, weight: 'bold', fill: '#FFFFFF' }));
  parts.push(rect(500, 210, 400, 60, { fill: '#FFFFFF', stroke: BORDER, rx: 8 }));
  parts.push(text(700, 236, 'Valt dit onder de tekst van het', { size: 13, fill: NAVY }));
  parts.push(text(700, 254, 'verplichtstellingsbesluit?', { size: 13, weight: 'bold', fill: NAVY }));
  parts.push(line(700, 166, 700, 210, { marker: true }));
  const outcomes = [
    { x: 230, label: 'Wel', sub: ['Verplichte aansluiting', 'bij het bpf'], accent: BLUE },
    { x: 700, label: 'Onduidelijk', sub: ['Nader onderzoek /', 'uitspraak vragen'], accent: AMBER },
    { x: 1170, label: 'Niet', sub: ['Geen verplichting;', 'vrij te kiezen'], accent: BLUE },
  ];
  outcomes.forEach(o => {
    parts.push(line(700, 270, o.x, 380, { marker: true }));
    parts.push(rect(o.x - 150, 380, 300, 90, { fill: '#FFFFFF', stroke: BORDER, rx: 8 }));
    parts.push(rect(o.x - 150, 380, 300, 6, { fill: o.accent, stroke: 'none', rx: 0 }));
    parts.push(text(o.x, 414, o.label, { size: 17, weight: 'bold', fill: NAVY, family: 'Cormorant Garamond' }));
    parts.push(text(o.x, 438, o.sub, { size: 12, fill: SUB, lineHeight: 15 }));
  });
  writeFig(4, '4-1', parts, 'Beslisschema werkingssfeer: van bedrijfsactiviteit naar verplichte aansluiting');
}

// ============================================================================
// FIGUUR 5-1 — De scheidslijnkaart: vier toetsen
// ============================================================================
{
  const parts = [];
  const toetsen = [
    { n: 1, q: 'Is het een premie-\novereenkomst?', no: 'Opbouw moet uiterlijk\n1-1-2028 eindigen' },
    { n: 2, q: 'Is de premie voor alle\ndeelnemers gelijk?', no: 'Niet-conform: mogelijk\neerbiedigende werking (deel 6)' },
    { n: 3, q: 'Blijft de premie binnen\nde fiscale grens?', no: 'Niet-conform: premie\nmoet worden aangepast' },
    { n: 4, q: 'Voldoet het nabestaanden-\npensioen aan het nieuwe kader?', no: 'Niet-conform: npartner\nmoet worden aangepast' },
  ];
  const colW = 290, gap = 33.3, startX = (W - (colW * 4 + gap * 3)) / 2, y = 120;
  toetsen.forEach((t, i) => {
    const x = startX + i * (colW + gap);
    parts.push(rect(x, y, colW, 90, { fill: NAVY, rx: 10 }));
    parts.push(text(x + colW / 2, y + 24, `Toets ${t.n}`, { size: 13, fill: AMBER, weight: 'bold' }));
    parts.push(text(x + colW / 2, y + 46, t.q.split('\n'), { size: 12.5, fill: '#FFFFFF', lineHeight: 16 }));
    parts.push(line(x + colW / 2, y + 90, x + colW / 2, y + 130, { marker: true }));
    parts.push(rect(x, y + 130, colW, 80, { fill: PAPERTINT, stroke: BORDER, rx: 8 }));
    parts.push(text(x + colW / 2, y + 154, 'bij "nee":', { size: 11, fill: SUB, style: 'italic' }));
    parts.push(text(x + colW / 2, y + 174, t.no.split('\n'), { size: 12, fill: NAVY, lineHeight: 15 }));
    if (i < toetsen.length - 1) {
      parts.push(line(x + colW, y + 45, x + colW + gap, y + 45, { marker: true, stroke: BLUE, strokeWidth: 2 }));
      parts.push(text(x + colW + gap / 2, y + 38, 'ja', { size: 11, fill: BLUE, weight: 'bold' }));
    }
  });
  parts.push(text(W / 2, 450, 'Alle vier "ja" → volledig Wtp-conform. Elke "nee" opent een eigen overgangsvraag.', { size: 13.5, fill: SUB, style: 'italic' }));
  writeFig(5, '5-1', parts, 'De scheidslijnkaart: vier toetsen achter elkaar');
}

// ============================================================================
// FIGUUR 6-1 — Wat artikel 220e wel en niet uitschakelt
// ============================================================================
{
  const parts = [];
  parts.push(text(W / 2, 100, 'Artikel 220e — eerbiedigende werking voor de progressieve premie', { size: 16, fill: NAVY, weight: 'bold' }));
  const toetsen = [
    { n: 2, q: 'Premie voor alle\ndeelnemers gelijk?', status: 'uitgeschakeld', accent: AMBER, note: 'staffel mag blijven staan' },
    { n: 3, q: 'Blijft binnen\nde fiscale grens?', status: 'blijft van kracht', accent: BLUE, note: 'moet nog worden getoetst' },
    { n: 4, q: 'Nabestaandenpensioen\nnaar nieuw kader?', status: 'blijft van kracht', accent: BLUE, note: 'moet worden aangepast' },
  ];
  const colW = 380, gap = 40, startX = (W - (colW * 3 + gap * 2)) / 2, y = 150;
  toetsen.forEach((t, i) => {
    const x = startX + i * (colW + gap);
    const active = t.status !== 'uitgeschakeld';
    parts.push(rect(x, y, colW, 190, { fill: '#FFFFFF', stroke: BORDER, rx: 10 }));
    parts.push(rect(x, y, colW, 44, { fill: active ? NAVY : '#B9BFC8', rx: 10 }));
    parts.push(rect(x, y + 34, colW, 10, { fill: active ? NAVY : '#B9BFC8', stroke: 'none', rx: 0 }));
    parts.push(text(x + colW / 2, y + 27, `Toets ${t.n}`, { size: 14, weight: 'bold', fill: '#FFFFFF' }));
    parts.push(text(x + colW / 2, y + 80, t.q.split('\n'), { size: 13.5, fill: NAVY, lineHeight: 17 }));
    parts.push(rect(x + 30, y + 120, colW - 60, 34, { fill: active ? '#EAF1F9' : '#F1EEE6', stroke: t.accent, rx: 6 }));
    parts.push(text(x + colW / 2, y + 141, t.status, { size: 12.5, weight: 'bold', fill: active ? BLUE : SUB }));
    parts.push(text(x + colW / 2, y + 172, t.note, { size: 11.5, fill: SUB, style: 'italic' }));
    if (!active) {
      parts.push(line(x + 20, y + 20, x + colW - 20, y + 20, { stroke: '#8A93A0', strokeWidth: 2 }));
    }
  });
  parts.push(text(W / 2, 400, 'Alleen toets 2 wordt uitgeschakeld — de regeling moet voor het overige worden verbouwd,', { size: 13, fill: SUB, style: 'italic' }));
  parts.push(text(W / 2, 420, 'niet ongewijzigd blijven.', { size: 13, fill: SUB, style: 'italic' }));
  writeFig(6, '6-1', parts, 'Wat artikel 220e wel en niet uitschakelt — één blokje uit de vier toetsen van deel 5');
}

// ============================================================================
// FIGUUR 6-2 — Twee regelingen naast elkaar in de tijd
// ============================================================================
{
  const parts = [];
  const axisY = 420, x0 = 200, x1 = 1220, splitX = 460;
  parts.push(line(x0, axisY, x1, axisY, { stroke: BORDER2, strokeWidth: 2 }));
  parts.push(line(splitX, axisY - 200, splitX, axisY + 30, { stroke: AMBER, strokeWidth: 2, dash: '5,4' }));
  parts.push(text(splitX, axisY - 210, 'omzetdatum', { size: 12, fill: NAVY, weight: 'bold' }));
  // Regeling oud: shrinking band, only before split extended a bit after (uitdovend)
  parts.push(`<path d="M${x0},${axisY - 90} L${splitX},${axisY - 90} L${x1 - 60},${axisY - 20} L${x1 - 60},${axisY} L${x0},${axisY} Z" fill="${BLUE}" fill-opacity="0.18" stroke="${BLUE}" stroke-width="2"/>`);
  parts.push(text(x0 + 20, axisY - 100, 'Regeling oud — progressieve staffel', { size: 13, weight: 'bold', fill: BLUE, anchor: 'start' }));
  parts.push(text(x0 + 20, axisY - 20, ['gesloten voor nieuwe instroom,', 'populatie dooft geleidelijk uit'], { size: 11.5, fill: SUB, lineHeight: 14, anchor: 'start' }));
  // Regeling nieuw: from splitX onward, growing band
  parts.push(`<path d="M${splitX},${axisY} L${x1},${axisY} L${x1},${axisY + 90} L${splitX},${axisY + 40} Z" fill="${AMBER}" fill-opacity="0.22" stroke="${AMBER}" stroke-width="2"/>`);
  parts.push(text(x1 - 20, axisY + 60, 'Regeling nieuw — vlakke premie', { size: 13, weight: 'bold', fill: '#8A6414', anchor: 'end' }));
  parts.push(text(x1 - 20, axisY + 100, ['open voor iedereen die na', 'de omzetting in dienst komt'], { size: 11.5, fill: SUB, lineHeight: 14, anchor: 'end' }));
  writeFig(6, '6-2', parts, 'Twee regelingen naast elkaar in de tijd: de gesloten groep dooft uit');
}

// ============================================================================
// FIGUUR 7-1 — Opbouw van een transitieplan
// ============================================================================
{
  const parts = [];
  const items = [
    { n: 1, t: 'De gemaakte keuzes', q: 'Welke regelingsvorm, welk premieniveau, wel of geen eerbiedigende werking — en waarom?' },
    { n: 2, t: 'De overwegingen', q: 'Welke varianten zijn beoordeeld en op welke gronden is gekozen?' },
    { n: 3, t: 'De effecten', q: 'Wat betekent de overgang per groep deelnemers, in vergelijkende berekeningen?' },
    { n: 4, t: 'De compensatie', q: 'Of er wordt gecompenseerd: voor wie, hoe hoog, hoe lang, hoe gefinancierd?' },
    { n: 5, t: 'De onderbouwing van evenwichtigheid', q: 'Waarom is dit geheel verdedigbaar tegenover alle groepen?' },
  ];
  let y = 88;
  const x = 160, w = 1080, rowH = 108;
  items.forEach(it => {
    parts.push(rect(x, y, w, rowH - 14, { fill: '#FFFFFF', stroke: BORDER, rx: 8 }));
    parts.push(circleTag(x + 40, y + (rowH - 14) / 2, 20, { fill: NAVY, stroke: NAVY }));
    parts.push(text(x + 40, y + (rowH - 14) / 2 + 6, String(it.n), { size: 16, weight: 'bold', fill: '#FFFFFF', family: 'Cormorant Garamond' }));
    parts.push(text(x + 90, y + 32, it.t, { size: 15.5, weight: 'bold', fill: NAVY, family: 'Cormorant Garamond', anchor: 'start' }));
    parts.push(text(x + 90, y + 55, it.q, { size: 12.5, fill: SUB, anchor: 'start' }));
    y += rowH;
  });
  writeFig(7, '7-1', parts, 'De opbouw van een transitieplan: vijf onderdelen, elk met zijn eigen vraag');
}

// ============================================================================
// FIGUUR 8-1 — Partnerpensioen oud en nieuw
// ============================================================================
{
  const parts = [];
  const axisY = 470, x0 = 260, x1 = 1140;
  // Oud: diensttijdafhankelijke opbouw — rising staircase
  parts.push(text(x0, 300, 'Partnerpensioen — oud', { size: 15, weight: 'bold', fill: BLUE }));
  parts.push(text(x0, 320, '(diensttijdafhankelijke opbouw)', { size: 11.5, fill: SUB }));
  const steps = 6;
  const stepW = (x1 - x0) / steps;
  const stairPts = [];
  for (let i = 0; i <= steps; i++) {
    const hgt = i * 22;
    stairPts.push(`${x0 + i * stepW},${axisY - hgt}`);
    if (i < steps) stairPts.push(`${x0 + (i + 1) * stepW},${axisY - hgt}`);
  }
  parts.push(`<polyline points="${stairPts.join(' ')}" fill="none" stroke="${BLUE}" stroke-width="3"/>`);
  parts.push(line(x0, axisY, x1, axisY, { stroke: NAVY, strokeWidth: 2 }));
  parts.push(text(x0, axisY + 20, '3 dienstjaren', { size: 11, fill: SUB, anchor: 'start' }));
  parts.push(text(x1, axisY + 20, '40 dienstjaren', { size: 11, fill: SUB, anchor: 'end' }));
  // Nieuw: flat line
  const flatY = axisY - 130;
  parts.push(text(x0, flatY - 34, 'Partnerpensioen — nieuw', { size: 15, weight: 'bold', fill: '#8A6414' }));
  parts.push(text(x0, flatY - 14, '(vast percentage van het salaris, op risicobasis)', { size: 11.5, fill: SUB }));
  parts.push(line(x0, flatY, x1, flatY, { stroke: AMBER, strokeWidth: 3 }));
  parts.push(text(x1, flatY - 10, 'max. 50% pensioengevend salaris', { size: 11.5, fill: SUB, anchor: 'end' }));
  writeFig(8, '8-1', parts, 'Partnerpensioen oud en nieuw: diensttijdafhankelijk versus vast percentage');
}

// ============================================================================
// FIGUUR 9-1 — Deelnemersreis met acht gebeurtenissen
// ============================================================================
{
  const parts = [];
  const axisY = 400, x0 = 130, x1 = 1270;
  parts.push(line(x0, axisY, x1, axisY, { stroke: BORDER2, strokeWidth: 2 }));
  const events = [
    { l: 'Toetreding', p: 'werkgever' },
    { l: 'Eerste informatie', p: 'uitvoerder' },
    { l: 'Mutaties tijdens\ndienstverband', p: 'werkgever' },
    { l: 'Uit dienst —\nwaardeoverdracht', p: 'deelnemer' },
    { l: 'Scheiding', p: 'deelnemer' },
    { l: 'Pensioendatum —\nkeuzes', p: 'deelnemer' },
    { l: 'Shoprecht /\nbedrag ineens', p: 'deelnemer' },
    { l: 'Overlijden', p: 'nabestaande' },
  ];
  const n = events.length;
  const step = (x1 - x0) / (n - 1);
  events.forEach((e, i) => {
    const x = x0 + i * step;
    const up = i % 2 === 0;
    parts.push(circleTag(x, axisY, 9, { fill: up ? BLUE : AMBER, stroke: NAVY }));
    parts.push(line(x, axisY, x, up ? axisY - 60 : axisY + 60, { stroke: BORDER2, strokeWidth: 1.5 }));
    const labelLines = e.l.split('\n');
    parts.push(text(x, up ? axisY - 68 : axisY + 84, labelLines, { size: 12, weight: 'bold', fill: NAVY, lineHeight: 15 }));
    parts.push(text(x, up ? axisY - 68 - labelLines.length * 15 - 6 : axisY + 84 + labelLines.length * 15, `wie: ${e.p}`, { size: 10.5, fill: SUB, style: 'italic' }));
  });
  writeFig(9, '9-1', parts, 'De deelnemersreis: acht gebeurtenissen en wie er moet handelen');
}

// ============================================================================
// FIGUUR 12-1 — Lifecycle-grafiek
// ============================================================================
{
  const parts = [];
  const x0 = 220, x1 = 1200, y0 = 480, y1 = 130;
  parts.push(line(x0, y0, x1, y0, { stroke: NAVY, strokeWidth: 2 }));
  parts.push(line(x0, y0, x0, y1, { stroke: NAVY, strokeWidth: 2 }));
  parts.push(text(x0 - 20, (y0 + y1) / 2, 'Percentage van het vermogen', { size: 12.5, fill: SUB, anchor: 'middle' }).replace('<text', '<text transform="rotate(-90 ' + (x0 - 40) + ' ' + ((y0 + y1) / 2) + ')"'));
  parts.push(text((x0 + x1) / 2, y0 + 40, 'Resterende looptijd tot pensioendatum (jaren)', { size: 12.5, fill: SUB }));
  parts.push(text(x0, y0 + 20, '40', { size: 11, fill: SUB }));
  parts.push(text(x1, y0 + 20, '0', { size: 11, fill: SUB }));
  const knik1x = x0 + (x1 - x0) * ((40 - 15) / 40);
  const knik2x = x0 + (x1 - x0) * ((40 - 8) / 40);
  // Aandelen line: flat high, then declines after knik1
  parts.push(`<path d="M${x0},${y1 + 10} L${knik1x},${y1 + 10} C ${knik1x + 100},${y1 + 10} ${knik2x - 40},${y0 - 90} ${x1},${y0 - 60}" fill="none" stroke="${BLUE}" stroke-width="3.5"/>`);
  parts.push(text(x0 + 20, y1 - 6, 'Aandelen (koersrisico)', { size: 13, weight: 'bold', fill: BLUE, anchor: 'start' }));
  // Rente/matching line: flat low, then rises after knik2
  parts.push(`<path d="M${x0},${y0 - 8} L${knik2x},${y0 - 8} C ${knik2x + 60},${y0 - 8} ${x1 - 80},${y1 + 40} ${x1},${y1 + 20}" fill="none" stroke="${AMBER}" stroke-width="3.5"/>`);
  parts.push(text(x0 + 20, y0 - 20, 'Vastrentend / matching (renterisico)', { size: 13, weight: 'bold', fill: '#8A6414', anchor: 'start' }));
  // Knikpunten
  parts.push(line(knik1x, y0, knik1x, y1, { stroke: BORDER2, dash: '4,4' }));
  parts.push(circleTag(knik1x, y1 + 10, 8, { fill: BLUE, stroke: NAVY }));
  parts.push(text(knik1x, y1 - 20, ['knikpunt 1:', '±15 jaar — start afbouw', 'aandelenrisico'], { size: 11, fill: NAVY, lineHeight: 13 }));
  parts.push(line(knik2x, y0, knik2x, y1, { stroke: BORDER2, dash: '4,4' }));
  parts.push(circleTag(knik2x, y0 - 8, 8, { fill: AMBER, stroke: NAVY }));
  parts.push(text(knik2x, y0 + 70, ['knikpunt 2:', '±8 jaar — start afbouw', 'renterisico'], { size: 11, fill: NAVY, lineHeight: 13 }));
  writeFig(12, '12-1', parts, 'Lifecycle: afbouw van aandelenrisico en renterisico in twee fasen');
}

// ============================================================================
// FIGUUR 14-1 — Tijdlijn van inventarisatie tot ingangsdatum
// ============================================================================
{
  const parts = [];
  const fases = [
    { t: 'Inventarisatie en\ndoelstellingen', w: 5 },
    { t: 'Offerteaanvraag en\n-vergelijking', w: 7 },
    { t: 'Arbeidsvoorwaardelijk\ntraject (incl. OR)', w: 10, parallel: true },
    { t: 'Definitieve\ncontractering', w: 5 },
    { t: 'Implementatie bij\nde uitvoerder', w: 10 },
  ];
  const x0 = 150, rowH = 60, barMaxW = 1000, totalW = fases.filter(f => !f.parallel).reduce((s, f) => s + f.w, 0);
  let x = x0, y = 130;
  const scale = barMaxW / (5 + 7 + 5 + 10 + 6); // rough total incl. parallel offset
  fases.forEach((f, i) => {
    const w = f.w * 42;
    const rowY = f.parallel ? y - rowH - 8 : y;
    const barX = f.parallel ? x0 + (5 + 7) * 42 - 3 * 42 : x;
    parts.push(rect(barX, rowY, w, rowH - 16, { fill: f.parallel ? PAPERTINT : NAVY, stroke: f.parallel ? AMBER : NAVY, rx: 6 }));
    const lines = f.t.split('\n');
    parts.push(text(barX + w / 2, rowY + (rowH - 16) / 2 - 4, lines, { size: 11, weight: 'bold', fill: f.parallel ? NAVY : '#FFFFFF', lineHeight: 13 }));
    parts.push(text(barX + w / 2, rowY + rowH - 20, `${f.w === 5 ? '4–6' : f.w === 7 ? '6–8' : f.w === 10 && !f.parallel ? '8–12' : f.w === 10 ? '8–12, parallel' : '4–6'} weken`, { size: 9.5, fill: f.parallel ? SUB : '#CFE0F2' }));
    if (!f.parallel) x += w + 6;
  });
  parts.push(line(x0, y + rowH + 30, x0 + totalW * 6, y + rowH + 30, { stroke: BORDER2 }));
  parts.push(circleTag(x0, y + rowH + 30, 8, { fill: BLUE, stroke: NAVY }));
  parts.push(text(x0, y + rowH + 52, 'start', { size: 11, fill: SUB }));
  parts.push(circleTag(x, y + rowH + 30, 10, { fill: AMBER, stroke: NAVY }));
  parts.push(text(x, y + rowH + 52, 'ingangsdatum', { size: 12, weight: 'bold', fill: NAVY }));
  parts.push(text(W / 2, 420, 'Totale doorlooptijd: zes tot negen maanden bij een voorspoedig traject', { size: 14, fill: SUB, style: 'italic' }));
  parts.push(text(W / 2, 448, '(reken altijd terug vanaf de gewenste ingangsdatum)', { size: 12, fill: SUB, style: 'italic' }));
  writeFig(14, '14-1', parts, 'Tijdlijn van inventarisatie tot ingangsdatum, met het kritieke pad');
}

// ============================================================================
// FIGUUR 15-1 — Twaalfstappenplan
// ============================================================================
{
  const parts = [];
  const steps = [
    'Werkingssfeer &\nvrijstelling', 'Diagnose van de\nregeling (4 toetsen)', 'Inventarisatie',
    'Hoofdkeuzes\nvoorbereiden', 'Arbeidsvoorwaardelijk\ntraject (OR)', 'Fiscale\ndoorrekening',
    'Offerteaanvraag &\nproductkeuze', 'Contractvorming', 'Transitieplan\nafronden',
    'Implementatie bij\nde uitvoerder', 'Communicatie naar\ndeelnemers', 'Ingang en nazorg',
  ];
  const cols = 6, boxW = 205, boxH = 100, gapX = 15, gapY = 40;
  const startX = (W - (cols * boxW + (cols - 1) * gapX)) / 2;
  const rowYs = [140, 140 + boxH + gapY];
  steps.forEach((s, i) => {
    const row = Math.floor(i / cols);
    const colIdx = row === 0 ? i : cols - 1 - (i - cols);
    const x = startX + colIdx * (boxW + gapX);
    const y = rowYs[row];
    parts.push(rect(x, y, boxW, boxH, { fill: '#FFFFFF', stroke: BORDER, rx: 8 }));
    parts.push(circleTag(x + 24, y + 22, 14, { fill: row === 0 ? BLUE : AMBER, stroke: NAVY }));
    parts.push(text(x + 24, y + 27, String(i + 1), { size: 12.5, weight: 'bold', fill: '#FFFFFF' }));
    parts.push(text(x + boxW / 2 + 5, y + 55, s.split('\n'), { size: 11, fill: NAVY, weight: 'bold', lineHeight: 14 }));
    // connectors
    if (row === 0 && colIdx < cols - 1) {
      parts.push(line(x + boxW, y + boxH / 2, x + boxW + gapX, y + boxH / 2, { marker: true }));
    }
    if (i === cols - 1) {
      parts.push(line(x + boxW / 2, y + boxH, x + boxW / 2, y + boxH + gapY, { marker: true }));
    }
    if (row === 1 && colIdx > 0) {
      parts.push(line(x, y + boxH / 2, x - gapX, y + boxH / 2, { marker: true }));
    }
  });
  parts.push(text(W / 2, 450, 'Elke stap koppelt terug naar het deel van de cursus waar het instrument vandaan komt', { size: 13, fill: SUB, style: 'italic' }));
  writeFig(15, '15-1', parts, 'Het transitiestappenplan: twaalf stappen met de verantwoordelijke partij');
}

// ============================================================================
// FIGUUR 19-1 — Vier dimensies van datakwaliteit
// ============================================================================
{
  const cols = [
    { header: 'Juistheid', accent: BLUE, body: [
      { label: 'Vraag', value: 'Komt het gegeven overeen met de werkelijkheid?' },
      { label: 'Voorbeeld schending', value: ['Verkeerde geboortedatum,', 'niet-bijgewerkte deeltijdfactor'] },
    ]},
    { header: 'Volledigheid', accent: AMBER, body: [
      { label: 'Vraag', value: 'Ontbreekt er iets?' },
      { label: 'Voorbeeld schending', value: ['Ontbrekende', 'partnerregistratie (deel 9)'] },
    ]},
    { header: 'Tijdigheid', accent: BLUE, body: [
      { label: 'Vraag', value: 'Is het op tijd doorgegeven en verwerkt?' },
      { label: 'Voorbeeld schending', value: ['Te laat doorgegeven mutatie', '→ dekkingsgat (deel 8)'] },
    ]},
    { header: 'Consistentie', accent: AMBER, body: [
      { label: 'Vraag', value: 'Komen de gegevens in verschillende systemen overeen?' },
      { label: 'Voorbeeld schending', value: ['Afwijkende deeltijdfactor tussen', 'salaris- en pensioenadministratie'] },
    ]},
  ];
  const colW = 310, gap = 26.7, startX = (W - (colW * 4 + gap * 3)) / 2, y = 110, h = 300;
  const parts = [];
  cols.forEach((c, i) => parts.push(card(startX + i * (colW + gap), y, colW, h, c)));
  writeFig(19, '19-1', parts, 'De vier dimensies van datakwaliteit, met een voorbeeld van schending');
}

// ============================================================================
// FIGUUR 19-2 — De mutatieketen
// ============================================================================
{
  const parts = [];
  const steps = [
    { t: 'De gebeurtenis', s: 'salariswijziging, geboorte,\nscheiding, indiensttreding' },
    { t: 'Werkgever', s: 'vastlegging in salaris- of\nHR-administratie' },
    { t: 'Salarisverwerker', s: '(indien uitbesteed —\noptionele schakel)', optional: true },
    { t: 'Pensioenuitvoerder', s: 'doorgifte: koppeling,\nhandmatig of combinatie' },
    { t: 'Verwerking', s: 'validatie, opname in\nadministratie, doorwerking' },
  ];
  const boxW = 220, gap = 26, startX = (W - (steps.length * boxW + (steps.length - 1) * gap)) / 2, y = 220, h = 130;
  steps.forEach((s, i) => {
    const x = startX + i * (boxW + gap);
    parts.push(rect(x, y, boxW, h, { fill: s.optional ? PAPERTINT : '#FFFFFF', stroke: s.optional ? AMBER : BORDER, dash: s.optional ? '6,4' : null, rx: 8 }));
    parts.push(circleTag(x + boxW / 2, y - 22, 16, { fill: NAVY, stroke: NAVY }));
    parts.push(text(x + boxW / 2, y - 17, String(i + 1), { size: 13, weight: 'bold', fill: '#FFFFFF' }));
    parts.push(text(x + boxW / 2, y + 34, s.t, { size: 14.5, weight: 'bold', fill: NAVY, family: 'Cormorant Garamond' }));
    parts.push(text(x + boxW / 2, y + 60, s.s.split('\n'), { size: 11, fill: SUB, lineHeight: 15 }));
    if (i < steps.length - 1) parts.push(line(x + boxW, y + h / 2, x + boxW + gap, y + h / 2, { marker: true, stroke: BLUE, strokeWidth: 2 }));
  });
  parts.push(text(W / 2, 420, 'Elke schakel is een potentiële plek voor verlies of vervorming van informatie', { size: 14, fill: SUB, style: 'italic' }));
  writeFig(19, '19-2', parts, 'De mutatieketen: van gebeurtenis tot verwerkte aanspraak');
}

// ============================================================================
// FIGUUR 27-1 — Productontwikkelingsproces bij een verzekeraar
// ============================================================================
{
  const parts = [];
  const steps = [
    'Marktsignaal &\nsegmentatie', 'Concept-\nontwerp', 'Doelgroep-\nbepaling',
    'Actuariële\ndoorrekening', 'Compliance- &\njuridische toetsing', 'Distributie-\nvoorbereiding', 'Lancering &\nmonitoring',
  ];
  const boxW = 165, gap = 15, startX = (W - (steps.length * boxW + (steps.length - 1) * gap)) / 2, y = 220, h = 110;
  steps.forEach((s, i) => {
    const x = startX + i * (boxW + gap);
    const last = i === steps.length - 1;
    parts.push(rect(x, y, boxW, h, { fill: last ? AMBER : NAVY, stroke: 'none', rx: 8 }));
    parts.push(circleTag(x + boxW / 2, y - 20, 15, { fill: last ? AMBER : BLUE, stroke: NAVY }));
    parts.push(text(x + boxW / 2, y - 15, String(i + 1), { size: 12.5, weight: 'bold', fill: last ? NAVY : '#FFFFFF' }));
    parts.push(text(x + boxW / 2, y + h / 2 + 4, s.split('\n'), { size: 12, weight: 'bold', fill: last ? NAVY : '#FFFFFF', lineHeight: 15 }));
    if (!last) parts.push(line(x + boxW, y + h / 2, x + boxW + gap, y + h / 2, { marker: true, stroke: BLUE, strokeWidth: 2 }));
  });
  // feedback loop arrow from last back to compliance/monitoring governance
  const lastX = startX + (steps.length - 1) * (boxW + gap);
  parts.push(`<path d="M${lastX + boxW / 2},${y + h + 4} C ${lastX + boxW / 2},${y + h + 70} ${startX + boxW / 2},${y + h + 70} ${startX + boxW / 2},${y + h + 4}" fill="none" stroke="${AMBER}" stroke-width="2" stroke-dasharray="6,4" marker-end="url(#arrow)"/>`);
  parts.push(text(W / 2, y + h + 100, 'Stap 7 is doorlopende productgovernance, geen eenmalige lancering-en-vergeten-aanpak', { size: 13, fill: SUB, style: 'italic' }));
  writeFig(27, '27-1', parts, 'Het productontwikkelingsproces bij een verzekeraar, van marktsignaal tot lancering');
}

console.log('Klaar — 21 figuren geschreven.');
