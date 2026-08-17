const {
  Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, Header, Footer, PageNumber,
  ImageRun, ShadingType, VerticalAlign, TableOfContents, Packer,
} = require("docx");
const fs = require("fs");

// Ductus huisstijl (officieel: Midnight Navy / Ductus Blue / Direction Amber)
const NAVY = "14213D";
const BLUE = "2563A8";
const AMBER = "E9A13B";
const WHITE = "FFFFFF";
const LIGHT_GREY = "F2F2F2";

const FONT_HEADING = "Georgia"; // vervanger voor Cormorant Garamond
const FONT_BODY = "Calibri";    // vervanger voor DM Sans

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 160 },
    border: { bottom: { color: NAVY, space: 4, style: BorderStyle.SINGLE, size: 12 } },
    children: [new TextRun({ text, bold: true, color: NAVY, font: FONT_HEADING, size: 36 })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, color: BLUE, font: FONT_HEADING, size: 28 })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 100 },
    children: [new TextRun({ text, bold: true, color: NAVY, font: FONT_HEADING, size: 24 })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 140, line: 300 },
    children: [new TextRun({ text, font: FONT_BODY, size: 22, ...opts })],
  });
}

// inline runs support (bold/italic segments) — pass array of {text, bold, italic}
function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 140, line: 300 },
    ...opts,
    children: runs.map(r => new TextRun({ font: FONT_BODY, size: 22, ...r })),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT_BODY, size: 22 })],
  });
}

// Callout voor casusfragmenten — navy balk links, lichte achtergrond
function calloutBox(titleText, paragraphs) {
  const inner = [];
  if (titleText) {
    inner.push(new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: titleText, bold: true, color: NAVY, font: FONT_HEADING, size: 24 })],
    }));
  }
  paragraphs.forEach(p => {
    inner.push(new Paragraph({
      spacing: { after: 100, line: 280 },
      children: [new TextRun({ text: p, font: FONT_BODY, size: 22, italics: true })],
    }));
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LIGHT_GREY },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LIGHT_GREY },
      right: { style: BorderStyle.SINGLE, size: 2, color: LIGHT_GREY },
      left: { style: BorderStyle.SINGLE, size: 36, color: BLUE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: LIGHT_GREY, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 160, bottom: 160, left: 220, right: 220 },
            children: inner,
          }),
        ],
      }),
    ],
  });
}

// Positioneringsbox voor kernzinnen / rode-draad-citaten — amber accent, gecentreerd
function positioneringBox(quoteText) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 24, color: AMBER },
      bottom: { style: BorderStyle.SINGLE, size: 24, color: AMBER },
      right: { style: BorderStyle.NONE, size: 0, color: WHITE },
      left: { style: BorderStyle.NONE, size: 0, color: WHITE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "FBF3E7", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 200, bottom: 200, left: 300, right: 300 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: quoteText, bold: true, italics: true, color: NAVY, font: FONT_HEADING, size: 26 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Uitwerkingenvak (werkboek) — amber-rand, duidelijk label
function uitwerkingBox(paragraphs) {
  const inner = [
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: "UITWERKING", bold: true, color: WHITE, font: FONT_HEADING, size: 22 })],
    }),
  ];
  paragraphs.forEach(p => {
    inner.push(new Paragraph({
      spacing: { after: 100, line: 280 },
      children: [new TextRun({ text: p, font: FONT_BODY, size: 22 })],
    }));
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: AMBER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: AMBER },
      right: { style: BorderStyle.SINGLE, size: 4, color: AMBER },
      left: { style: BorderStyle.SINGLE, size: 4, color: AMBER },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 40, bottom: 0, left: 220, right: 220 },
            children: [inner[0]],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "FBF3E7", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 160, bottom: 160, left: 220, right: 220 },
            children: inner.slice(1),
          }),
        ],
      }),
    ],
  });
}

// TMAP-lensblok (niveau 1-2) — blauwe rand, lichte achtergrond, "TMAP-LENS"-label
function tmapLensBox(paragraphs) {
  const inner = [
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: "TMAP-LENS", bold: true, color: WHITE, font: FONT_HEADING, size: 22 })],
    }),
  ];
  paragraphs.forEach(p => {
    inner.push(new Paragraph({
      spacing: { after: 100, line: 280 },
      children: [new TextRun({ text: p, font: FONT_BODY, size: 22 })],
    }));
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      right: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
      left: { style: BorderStyle.SINGLE, size: 4, color: BLUE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: BLUE, type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 40, bottom: 0, left: 220, right: 220 },
            children: [inner[0]],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "EAF0F8", type: ShadingType.CLEAR, color: "auto" },
            margins: { top: 160, bottom: 160, left: 220, right: 220 },
            children: inner.slice(1),
          }),
        ],
      }),
    ],
  });
}

// Titelpagina-kop (titel + niveau/cursus-regel) — gedeeld door reader/werkboek/docentenhandleiding
function documentHeader(title, niveau, cursus) {
  return [
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 44, color: NAVY, font: FONT_HEADING })], spacing: { after: 120 } }),
    new Paragraph({ children: [new TextRun({ text: `${niveau} · ${cursus}`, italics: true, size: 22, color: BLUE, font: FONT_BODY })], spacing: { after: 300 } }),
  ];
}

function simpleTable(headerRow, dataRows) {
  const mkCell = (text, isHeader) => new TableCell({
    shading: isHeader ? { fill: NAVY, type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({
        text, font: FONT_BODY, size: 20,
        bold: isHeader, color: isHeader ? WHITE : "000000",
      })],
    })],
  });
  const rows = [
    new TableRow({ tableHeader: true, children: headerRow.map(t => mkCell(t, true)) }),
    ...dataRows.map((r, i) => new TableRow({
      children: r.map(t => mkCell(t, false)),
    })),
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
    },
    rows,
  });
}

function pngDimensions(buf) {
  // PNG IHDR-chunk: bytes 16-19 = width, 20-23 = height (big-endian)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function figureImage(pngPath, caption, widthPx = 500) {
  const buf = fs.readFileSync(pngPath);
  const dim = pngDimensions(buf);
  const heightPx = Math.round(widthPx * (dim.height / dim.width));
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 80 },
      children: [
        new ImageRun({
          data: buf,
          transformation: { width: widthPx, height: heightPx },
          type: "png",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: caption, italics: true, size: 18, color: "555555", font: FONT_BODY })],
    }),
  ];
}

function makeHeaderFooter(cursusnaam, deelLabel, niveauLabel) {
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { color: BLUE, space: 4, style: BorderStyle.SINGLE, size: 6 } },
        children: [
          new TextRun({ text: `${cursusnaam} · ${niveauLabel} · ${deelLabel}`, size: 16, color: BLUE, font: FONT_BODY }),
        ],
      }),
    ],
  });
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "Pagina ", size: 16, color: "888888", font: FONT_BODY }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888", font: FONT_BODY }),
          new TextRun({ text: " van ", size: 16, color: "888888", font: FONT_BODY }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "888888", font: FONT_BODY }),
        ],
      }),
    ],
  });
  return { header, footer };
}

function buildDocument(cursusnaam, deelLabel, niveauLabel, bodyChildren) {
  const { header, footer } = makeHeaderFooter(cursusnaam, deelLabel, niveauLabel);
  return new Document({
    styles: {
      default: {
        document: { run: { font: FONT_BODY, size: 22 } },
      },
    },
    sections: [
      {
        properties: {},
        headers: { default: header },
        footers: { default: footer },
        children: bodyChildren,
      },
    ],
  });
}

async function saveDocx(doc, outPath) {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
}

module.exports = {
  NAVY, BLUE, AMBER, WHITE, LIGHT_GREY, FONT_HEADING, FONT_BODY,
  h1, h2, h3, body, bodyRuns, bullet, calloutBox, positioneringBox,
  uitwerkingBox, tmapLensBox, documentHeader, simpleTable, figureImage, buildDocument, saveDocx,
};
