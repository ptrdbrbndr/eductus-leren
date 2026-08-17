// Generieke markdown -> pptx-converter voor de slidedecks van Nederlandse pensioenverzekering.
// Parseert "## Slide N — Titel"-secties regelgewijs (geen markdown-it nodig — slidedeck-markdown
// is bewust plat: losse regels, geen geneste structuren). Docentnotities (*Docentnotitie: ...*)
// gaan naar het sprekernotitieveld, niet op de dia zelf.
// Run: node build-pptx.js
'use strict';
const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'pensioenverzekeringen', 'pensioenverzekering-cursus');
const FIG_DIR = path.resolve(__dirname, '..', 'pensioenverzekeringen', 'figuren');
const OUT = path.resolve(__dirname, '..', 'pensioenverzekeringen');
const CURSUS = 'Nederlandse pensioenverzekering';

const NAVY = '14213D', BLUE = '2563A8', AMBER = 'E9A13B', WHITE = 'FFFFFF', INK = '333333';
const FONT_HEADING = 'Georgia';
const FONT_BODY = 'Calibri';

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament' },
  { n: 2, dir: 'niveau-2', parts: range(11, 21), label: 'Niveau 2 — Uitvoering en advies' },
  { n: 3, dir: 'niveau-3', parts: range(22, 30), label: 'Niveau 3 — Expert' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }

function buildFigMap() {
  const map = {};
  if (!fs.existsSync(FIG_DIR)) return map;
  for (const dealDir of fs.readdirSync(FIG_DIR)) {
    const full = path.join(FIG_DIR, dealDir);
    if (!fs.statSync(full).isDirectory()) continue;
    const re = /^figuur-(\d+-\d+)\.png$/i;
    for (const f of fs.readdirSync(full)) {
      const m = f.match(re);
      if (m) map[m[1]] = path.join(full, f);
    }
  }
  return map;
}

function pngDimensions(pngPath) {
  const buf = Buffer.alloc(24);
  const fd = fs.openSync(pngPath, 'r');
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// ---------- parse "## Slide N — Titel" secties ----------
function parseSlides(raw) {
  const lines = raw.split('\n');
  const slides = [];
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^##\s*Slide\s+(\d+)\s*(?:—|-)\s*(.*)$/);
    if (m) {
      if (cur) slides.push(cur);
      cur = { num: Number(m[1]), title: m[2].trim(), lines: [] };
      continue;
    }
    if (!cur) continue;
    if (/^---\s*$/.test(line)) continue; // scheidingslijn tussen slides
    cur.lines.push(line);
  }
  if (cur) slides.push(cur);
  return slides;
}

// ---------- slide-body-regels -> gestructureerde items ----------
function structureSlideBody(lines) {
  const items = [];
  let notes = [];
  let quote = [];
  let listBuf = [];
  let listOrdered = false;

  function flushList() {
    if (listBuf.length) { items.push({ type: 'list', ordered: listOrdered, entries: listBuf }); listBuf = []; }
  }
  function flushQuote() {
    if (quote.length) { items.push({ type: 'quote', text: quote.join(' ') }); quote = []; }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); flushQuote(); continue; }

    const notitieMatch = line.match(/^\*Docentnotitie:\s*(.*)\*\s*$/);
    if (notitieMatch) { flushList(); flushQuote(); notes.push(notitieMatch[1]); continue; }

    const figMatch = line.match(/^\[FIGUUR\s+([\w.\-]+)(?:\s*:\s*([^\]]+))?\]\s*$/);
    if (figMatch) { flushList(); flushQuote(); items.push({ type: 'figure', label: figMatch[1], caption: figMatch[2] }); continue; }

    const quoteMatch = line.match(/^>\s*(.*)$/);
    if (quoteMatch) { flushList(); quote.push(stripEmphasis(quoteMatch[1])); continue; }
    flushQuote();

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (bulletMatch) { listOrdered = false; listBuf.push(stripEmphasis(bulletMatch[1])); continue; }
    if (orderedMatch) { listOrdered = true; listBuf.push(stripEmphasis(orderedMatch[1])); continue; }

    flushList();
    items.push({ type: 'para', text: stripEmphasis(line) });
  }
  flushList();
  flushQuote();
  return { items, notes: notes.join(' ') };
}

function stripEmphasis(s) {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}

// ---------- 1 slide bouwen ----------
function addSlide(pres, slideData, ctx, figMap, missing) {
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  // titelbalk
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: NAVY } });
  slide.addText(`Slide ${slideData.num} — ${slideData.title}`, {
    x: 0.4, y: 0, w: 12.5, h: 0.9, fontFace: FONT_HEADING, fontSize: 22, bold: true,
    color: WHITE, valign: 'middle',
  });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.9, w: 13.33, h: 0.05, fill: { color: BLUE } });

  const { items, notes } = structureSlideBody(slideData.lines);
  let y = 1.25;
  const maxY = 6.9;

  for (const item of items) {
    if (y >= maxY) break;
    if (item.type === 'para') {
      slide.addText(item.text, { x: 0.6, y, w: 12.1, h: 0.5, fontFace: FONT_BODY, fontSize: 18, color: INK });
      y += 0.55;
    } else if (item.type === 'quote') {
      slide.addShape(pres.ShapeType.rect, { x: 0.6, y, w: 12.1, h: 0.7, fill: { color: 'FBF3E7' }, line: { color: AMBER, width: 1.5 } });
      slide.addText(item.text, {
        x: 0.8, y, w: 11.7, h: 0.7, fontFace: FONT_HEADING, fontSize: 18, bold: true, italic: true,
        color: NAVY, align: 'center', valign: 'middle',
      });
      y += 0.85;
    } else if (item.type === 'list') {
      const h = Math.min(0.42 * item.entries.length, maxY - y);
      slide.addText(
        item.entries.map((t, idx) => ({
          text: (item.ordered ? `${idx + 1}. ` : '') + t,
          options: { bullet: item.ordered ? false : { code: '2022' }, breakLine: true },
        })),
        { x: 0.7, y, w: 12.0, h, fontFace: FONT_BODY, fontSize: 17, color: INK, valign: 'top' },
      );
      y += h + 0.15;
    } else if (item.type === 'figure') {
      const pngPath = figMap[item.label];
      if (!pngPath) { missing.add(item.label); slide.addText(`[Figuur ${item.label} ontbreekt]`, { x: 0.6, y, w: 12, h: 0.4, italic: true, color: 'AA0000', fontFace: FONT_BODY, fontSize: 14 }); y += 0.5; continue; }
      const dim = pngDimensions(pngPath);
      const maxW = 10.5, maxH = maxY - y;
      let w = maxW, h = w * (dim.height / dim.width);
      if (h > maxH) { h = maxH; w = h * (dim.width / dim.height); }
      const x = (13.33 - w) / 2;
      slide.addImage({ path: pngPath, x, y, w, h });
      y += h + 0.1;
    }
  }

  // voettekst
  slide.addText(`${ctx.cursus} · ${ctx.niveauLabel} · Deel ${ctx.deel}`, {
    x: 0.4, y: 7.15, w: 8, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: '888888',
  });
  slide.addText(String(slideData.num), {
    x: 12.6, y: 7.15, w: 0.5, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: '888888', align: 'right',
  });

  if (notes) slide.addNotes(notes);
}

async function buildOne(part, figMap, missing) {
  const srcPath = path.join(SRC, part.niveauDir, `deel-${pad(part.num)}-slidedeck.md`);
  if (!fs.existsSync(srcPath)) return false;
  const raw = fs.readFileSync(srcPath, 'utf8');
  const slides = parseSlides(raw);

  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'DUCTUS_16x9', width: 13.33, height: 7.5 });
  pres.layout = 'DUCTUS_16x9';
  pres.author = 'Ductus B.V.';
  pres.company = 'Ductus B.V.';
  pres.title = `${CURSUS} — Deel ${part.num} — Slidedeck`;

  const ctx = { cursus: CURSUS, niveauLabel: part.niveauLabel, deel: part.num };
  for (const s of slides) addSlide(pres, s, ctx, figMap, missing);

  const outDir = path.join(OUT, part.niveauDir, `deel-${pad(part.num)}`);
  fs.mkdirSync(outDir, { recursive: true });
  await pres.writeFile({ fileName: path.join(outDir, 'slidedeck.pptx') });
  return true;
}

async function main() {
  const figMap = buildFigMap();
  const missing = new Set();
  let count = 0;
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const ok = await buildOne({ niveau: lvl.n, num, niveauDir: lvl.dir, niveauLabel: lvl.label }, figMap, missing);
      if (ok) count++;
    }
    console.log(`Niveau ${lvl.n} klaar.`);
  }
  console.log(`Klaar. ${count} pptx-bestanden gebouwd.`);
  if (missing.size) console.log('WAARSCHUWING — ontbrekende figuren:', [...missing].join(', '));
}

main();
