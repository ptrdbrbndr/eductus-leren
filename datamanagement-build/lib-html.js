// HTML-rendering variant of 04-Broncode/generator/lib.js's docx helpers. Consumed by the
// SAME content*.js reader()/opdrachten/docent/slides data as the docx/pptx generator —
// this module just renders that data to HTML strings instead of docx Paragraph objects.
'use strict';

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function runsToHtml(text) {
  const runs = Array.isArray(text) ? text : [{ text }];
  return runs.map(r => {
    let t = escapeHtml(r.text || '');
    if (r.bold) t = `<strong>${t}</strong>`;
    if (r.italics) t = `<em>${t}</em>`;
    return t;
  }).join('');
}

const DISCLAIMER = [
  'Deze cursusmap is onafhankelijk ontwikkeld door Ductus B.V. Ductus is niet gelieerd aan, geaccrediteerd door of goedgekeurd door DAMA International, IIBA, IAPP, de EDM Association of Microsoft.',
  'Dit materiaal bereidt voor op de genoemde examens en vervangt het officiële examenmateriaal niet. Bodies of knowledge, handboeken en examenblueprints worden hier niet gereproduceerd; deelnemers schaffen die bronnen zelf aan.',
  'Alle genoemde merken zijn eigendom van hun respectieve houders. Examengegevens gecontroleerd in augustus 2026 — verifieer vóór inschrijving bij de bron.',
];

// figMap: { 'N-M': 'figuren/deel-NN/figuur-N-M.svg' } relative to the OUT root.
// dirDepth: how many '../' to prepend to reach the OUT root from the page being built
// (constant 2 for this course: datamanagement/niveau-N/deel-NN/<file>.html).
function makeL(figMap, dirDepth, missing) {
  const up = '../'.repeat(dirDepth);

  function h1(text) { return `<h2>${escapeHtml(text)}</h2>`; }
  function h2(text) { return `<h3>${escapeHtml(text)}</h3>`; }
  function h3(text) { return `<h4>${escapeHtml(text)}</h4>`; }
  function p(text) { return `<p>${runsToHtml(text)}</p>`; }
  function bul(items) {
    return [`<ul>${items.map(t => `<li>${runsToHtml(t)}</li>`).join('')}</ul>`];
  }
  function num(items) {
    return [`<ol>${items.map(t => `<li>${runsToHtml(t)}</li>`).join('')}</ol>`];
  }
  function table(headers, rows) {
    const head = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
    const body = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${runsToHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table>${head}${body}</table>`;
  }
  function callout(title, lines) {
    return `<blockquote><p><strong>${escapeHtml(title)}</strong></p>${lines.map(l => `<p>${runsToHtml(l)}</p>`).join('')}</blockquote>`;
  }
  function spacer() { return ''; }
  function pageBreak() { return '<hr>'; }
  function coverBlock() { return []; } // rendered separately by the page builder, not from content
  function fig(label, caption) {
    const cap = String(caption || '').trim();
    const relPath = figMap[label];
    if (!relPath) {
      missing.add(label);
      return `<p class="dmg-figure-missing"><em>[Figuur ${escapeHtml(label)} ontbreekt: ${escapeHtml(cap)}]</em></p>`;
    }
    const src = up + relPath;
    return `<figure class="dmg-figure"><img src="${src}" alt="${escapeHtml(cap)}" loading="lazy"><figcaption>Figuur ${escapeHtml(label)} — ${escapeHtml(cap)}</figcaption></figure>`;
  }

  return { h1, h2, h3, p, bul, num, table, callout, spacer, pageBreak, coverBlock, fig, DISCLAIMER, escapeHtml, runsToHtml };
}

module.exports = { makeL, escapeHtml, runsToHtml, DISCLAIMER };
