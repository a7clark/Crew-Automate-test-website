import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'temporary screenshots');
mkdirSync(outDir, { recursive: true });

const sections = [
  { label: '01 - Nav',           selector: 'nav' },
  { label: '02 - Hero',          selector: '.hero' },
  { label: '03 - Stats Bar',     selector: '.stats-bar' },
  { label: '04 - About',         selector: '.about' },
  { label: '05 - Benefits',      selector: '.benefits' },
  { label: '06 - How It Works',  selector: '.how' },
  { label: '07 - Testimonials',  selector: '.testimonials' },
  { label: '08 - CTA Section',   selector: '.cta-section' },
  { label: '09 - Footer',        selector: 'footer' },
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const filePath = 'file://' + path.join(__dirname, 'index.html');
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Let fonts and animations settle
  await new Promise(r => setTimeout(r, 2000));

  for (const { label, selector } of sections) {
    const el = await page.$(selector);
    if (!el) { console.warn(`Selector not found: ${selector}`); continue; }

    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));

    const filename = path.join(outDir, `${label}.png`);
    await el.screenshot({ path: filename });
    console.log(`Saved: ${filename}`);
  }

  await browser.close();
  console.log('\nAll screenshots saved to "temporary screenshots/"');
})();
