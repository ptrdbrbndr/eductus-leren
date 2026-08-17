// Rasterize all pensioenverzekeringen SVG-figuren to PNG (voor inbedding in docx/pptx).
// Output naast de bron-svg: figuren/deel-NN/figuur-x-y.png
'use strict';
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const FIG_DIR = path.resolve(__dirname, '..', 'pensioenverzekeringen', 'figuren');

async function main() {
  let count = 0;
  for (const dealDir of fs.readdirSync(FIG_DIR)) {
    const full = path.join(FIG_DIR, dealDir);
    if (!fs.statSync(full).isDirectory()) continue;
    for (const f of fs.readdirSync(full)) {
      if (!f.toLowerCase().endsWith('.svg')) continue;
      const svgPath = path.join(full, f);
      const svg = fs.readFileSync(svgPath, 'utf8');
      const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1400 }, background: 'white' });
      const png = resvg.render().asPng();
      const pngPath = svgPath.replace(/\.svg$/i, '.png');
      // Bijsnijden op de echte inhoud (figuren laten vaak veel witruimte onderaan open
      // in het 1400x720-canvas) + een kleine witte marge terugzetten voor rust in het document.
      const trimmed = await sharp(png).trim({ background: '#ffffff', threshold: 8 }).png().toBuffer();
      const withMargin = await sharp(trimmed)
        .extend({ top: 24, bottom: 24, left: 24, right: 24, background: '#ffffff' })
        .png()
        .toBuffer();
      fs.writeFileSync(pngPath, withMargin);
      count++;
    }
  }
  console.log(`Klaar. ${count} PNG's gerasterized en bijgesneden.`);
}

main();
