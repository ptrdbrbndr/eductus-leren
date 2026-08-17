// Generieke markdown -> docx-converter voor Nederlandse pensioenverzekering.
// Anders dan de losse hand-geschreven build-<deel>.js-scripts bij eerdere cursussen
// (zie eductus-trainingen/Risico management/tooling/docx-build/) parst dit script de
// bestaande markdown-bron generiek via markdown-it, net als pv-build/build.js voor HTML.
// Run: node build-docx.js
'use strict';
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const sharp = require('sharp');
const {
  h1, h2, h3, bodyRuns, bullet, calloutBox, uitwerkingBox,
  documentHeader, simpleTable, figureImage, buildDocument, saveDocx,
  NAVY, BLUE, FONT_BODY, FONT_HEADING,
} = require('./docx-styles');
const { Paragraph, TextRun, PageBreak } = require('docx');

const SRC = path.resolve(__dirname, '..', '..', 'eductus-trainingen', 'pensioenverzekeringen', 'pensioenverzekering-cursus');
const FIG_DIR = path.resolve(__dirname, '..', 'pensioenverzekeringen', 'figuren');
const OUT = path.resolve(__dirname, '..', 'pensioenverzekeringen');
const CURSUS = 'Nederlandse pensioenverzekering';

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

const DELIVERABLES = [
  { file: 'reader', label: 'Reader' },
  { file: 'werkboek', label: 'Werkboek' },
  { file: 'docentenhandleiding', label: 'Docentenhandleiding' },
];

const NIVEAUS = [
  { n: 1, dir: 'niveau-1', parts: range(1, 10), label: 'Niveau 1 — Fundament' },
  { n: 2, dir: 'niveau-2', parts: range(11, 21), label: 'Niveau 2 — Uitvoering en advies' },
  { n: 3, dir: 'niveau-3', parts: range(22, 30), label: 'Niveau 3 — Expert' },
];

function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }
function pad(n) { return String(n).padStart(2, '0'); }

// ---------- figuur-label -> absoluut pad naar de PNG (gerasterized door rasterize-figures.js) ----------
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

const FIG_SENTINEL_RE = /^\[FIGUUR\s+([\w.\-]+)(?:\s*:\s*([^\]]+))?\]\s*$/gm;
const FIG_INLINE_RE = /\[FIGUUR\s+([\w.\-]+)\]/g;

// Standalone figuurmarkers -> eigen sentinel-paragraaf zodat markdown-it ze als aparte
// paragraph-tokens ziet; inline-verwijzingen (docentenhandleiding-tabellen) -> platte tekst.
function preprocessFigures(raw) {
  raw = raw.replace(FIG_SENTINEL_RE, (whole, label, caption) => {
    const cap = caption ? caption.trim() : '';
    return `\n\n@@FIGURE ${label}@@${cap}@@\n\n`;
  });
  raw = raw.replace(FIG_INLINE_RE, (whole, label) => `figuur ${label}`);
  return raw;
}

// ---------- inline tokens (bold/italic/plain) -> runs voor bodyRuns() ----------
function inlineToRuns(inlineToken) {
  const runs = [];
  let bold = false, italics = false;
  for (const t of inlineToken.children || []) {
    if (t.type === 'strong_open') bold = true;
    else if (t.type === 'strong_close') bold = false;
    else if (t.type === 'em_open') italics = true;
    else if (t.type === 'em_close') italics = false;
    else if (t.type === 'softbreak' || t.type === 'hardbreak') runs.push({ text: ' ' });
    else if (t.type === 'text' || t.type === 'code_inline') runs.push({ text: t.content, bold, italics });
  }
  if (!runs.length) runs.push({ text: '' });
  return runs;
}

function plainText(inlineToken) {
  return (inlineToken.children || []).map(t => t.content || '').join('');
}

// ---------- markdown-tokens -> array van docx-Paragraph/Table ----------
function tokensToDocx(tokens, figMap, missing) {
  const out = [];
  let i = 0;
  let orderedIdx = [];
  while (i < tokens.length) {
    const t = tokens[i];

    if (t.type === 'heading_open') {
      const inline = tokens[i + 1];
      const text = plainText(inline);
      const level = Number(t.tag.slice(1));
      if (level <= 1) out.push(h1(text));
      else if (level === 2) out.push(h2(text));
      else out.push(h3(text));
      i += 3;
      continue;
    }

    if (t.type === 'paragraph_open') {
      const inline = tokens[i + 1];
      const raw = plainText(inline);
      const figMatch = raw.match(/^@@FIGURE\s+([\w.\-]+)@@(.*)@@$/s);
      if (figMatch) {
        const [, label, caption] = figMatch;
        const pngPath = figMap[label];
        if (!pngPath) {
          missing.add(label);
          out.push(bodyRuns([{ text: `[Figuur ${label} ontbreekt]`, italics: true }]));
        } else {
          const meta = sharp(pngPath);
          out.push({ __figure: true, pngPath, caption: caption ? `Figuur ${label} — ${caption}` : `Figuur ${label}` });
        }
        i += 3;
        continue;
      }
      if (/^Uitwerking\b/.test(raw) || /^Uitwerking\s*\(/.test(raw)) {
        out.push({ __uitwerking: raw });
        i += 3;
        continue;
      }
      out.push(bodyRuns(inlineToRuns(inline)));
      i += 3;
      continue;
    }

    if (t.type === 'bullet_list_open' || t.type === 'ordered_list_open') {
      const ordered = t.type === 'ordered_list_open';
      let n = 0;
      i++;
      while (tokens[i] && tokens[i].type !== 'bullet_list_close' && tokens[i].type !== 'ordered_list_close') {
        if (tokens[i].type === 'list_item_open') {
          i++;
          // verzamel alle paragraaf-inlines binnen dit list-item (meestal 1)
          const parts = [];
          while (tokens[i] && tokens[i].type !== 'list_item_close') {
            if (tokens[i].type === 'inline') parts.push(tokens[i]);
            i++;
          }
          n++;
          parts.forEach((inl, idx) => {
            const runs = inlineToRuns(inl);
            if (ordered && idx === 0) runs.unshift({ text: `${n}. ` });
            out.push(bullet(runs.map(r => r.text).join(''), 0));
          });
        } else i++;
      }
      i++; // sluit *_list_close
      continue;
    }

    if (t.type === 'blockquote_open') {
      i++;
      const paras = [];
      while (tokens[i] && tokens[i].type !== 'blockquote_close') {
        if (tokens[i].type === 'inline') paras.push(plainText(tokens[i]));
        i++;
      }
      i++; // sluit blockquote_close
      out.push(calloutBox(null, paras));
      continue;
    }

    if (t.type === 'table_open') {
      i++;
      let header = [];
      const rows = [];
      while (tokens[i] && tokens[i].type !== 'table_close') {
        if (tokens[i].type === 'tr_open') {
          const cells = [];
          i++;
          let isHeaderRow = false;
          while (tokens[i] && tokens[i].type !== 'tr_close') {
            if (tokens[i].type === 'th_open') isHeaderRow = true;
            if (tokens[i].type === 'inline') cells.push(plainText(tokens[i]));
            i++;
          }
          i++; // tr_close
          if (isHeaderRow) header = cells; else rows.push(cells);
          continue;
        }
        i++;
      }
      i++; // table_close
      if (header.length) out.push(simpleTable(header, rows));
      continue;
    }

    if (t.type === 'hr') { out.push(new Paragraph({ children: [], spacing: { after: 100 } })); i++; continue; }

    i++;
  }
  return out;
}

// __uitwerking en __figure markers omzetten naar echte docx-elementen (na de tokenwalk,
// zodat aaneengesloten "Uitwerking."-alinea's samen in één box komen).
function finalizeElements(elements) {
  const out = [];
  let i = 0;
  while (i < elements.length) {
    const el = elements[i];
    if (el && el.__uitwerking !== undefined) {
      const group = [el.__uitwerking];
      i++;
      while (elements[i] && elements[i].__uitwerking !== undefined) { group.push(elements[i].__uitwerking); i++; }
      out.push(uitwerkingBox(group));
      continue;
    }
    if (el && el.__figure) {
      out.push(...figureImage(el.pngPath, el.caption, 460));
      i++;
      continue;
    }
    out.push(el);
    i++;
  }
  return out;
}

async function buildOne(part, dlv, figMap, missing) {
  const srcPath = path.join(SRC, part.niveauDir, `deel-${pad(part.num)}-${dlv.file}.md`);
  if (!fs.existsSync(srcPath)) return false;
  let raw = fs.readFileSync(srcPath, 'utf8');
  raw = preprocessFigures(raw);
  const title = firstH1(raw) || `Deel ${part.num}`;
  const tokens = md.parse(raw, {});
  const bodyElements = finalizeElements(tokensToDocx(tokens, figMap, missing));

  const children = [
    ...documentHeader(`${dlv.label} — ${title}`, part.niveauLabel, CURSUS),
    ...bodyElements,
  ];
  const doc = buildDocument(CURSUS, `Deel ${part.num}`, part.niveauLabel, children);
  const outDir = path.join(OUT, part.niveauDir, `deel-${pad(part.num)}`);
  fs.mkdirSync(outDir, { recursive: true });
  await saveDocx(doc, path.join(outDir, `${dlv.file}.docx`));
  return true;
}

function firstH1(text) {
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

async function main() {
  const figMap = buildFigMap();
  const missing = new Set();
  let count = 0;
  for (const lvl of NIVEAUS) {
    for (const num of lvl.parts) {
      const part = { niveau: lvl.n, num, niveauDir: lvl.dir, niveauLabel: lvl.label };
      for (const dlv of DELIVERABLES) {
        const ok = await buildOne(part, dlv, figMap, missing);
        if (ok) count++;
      }
    }
    console.log(`Niveau ${lvl.n} klaar.`);
  }
  console.log(`Klaar. ${count} docx-bestanden gebouwd.`);
  if (missing.size) console.log('WAARSCHUWING — ontbrekende figuren:', [...missing].join(', '));
}

main();
