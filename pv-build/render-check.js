const { chromium } = require('playwright');
const path = require('path');

const OUTDIR = 'C:/Users/piete/AppData/Local/Temp/claude/C--Users-piete/6c8cb550-45dc-48f2-8c3d-88f58348acc2/scratchpad';

const figs = [
  ['1-1', 'deel-01'], ['1-2', 'deel-01'], ['1-3', 'deel-01'], ['1-4', 'deel-01'],
  ['2-1', 'deel-02'], ['3-2', 'deel-03'], ['4-1', 'deel-04'], ['5-1', 'deel-05'],
  ['6-1', 'deel-06'], ['6-2', 'deel-06'], ['7-1', 'deel-07'], ['8-1', 'deel-08'],
  ['9-1', 'deel-09'], ['12-1', 'deel-12'], ['14-1', 'deel-14'], ['15-1', 'deel-15'],
  ['19-1', 'deel-19'], ['19-2', 'deel-19'], ['27-1', 'deel-27'], ['3-1', 'deel-03'], ['3-3', 'deel-03'],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1450, height: 780 } });
  for (const [label, dir] of figs) {
    const p = path.resolve(__dirname, '..', 'pensioenverzekeringen', 'figuren', dir, `figuur-${label}.svg`);
    const url = 'file:///' + p.split(path.sep).join('/');
    await page.goto(url);
    await page.screenshot({ path: path.join(OUTDIR, `fig-${label}.png`) });
  }
  await browser.close();
  console.log('done, ' + figs.length + ' screenshots');
})();
