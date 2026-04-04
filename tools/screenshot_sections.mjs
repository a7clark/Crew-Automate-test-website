/**
 * tools/screenshot_sections.mjs
 *
 * Captures a screenshot of each named section in an HTML file.
 *
 * Usage:
 *   node tools/screenshot_sections.mjs [htmlFile] [outputDir]
 *
 * Defaults:
 *   htmlFile  → index.html (relative to repo root)
 *   outputDir → "temporary screenshots"
 */

import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.join(__dirname, '..');

const htmlFile = process.argv[2] ?? 'index.html';
const outDir   = process.argv[3] ?? 'temporary screenshots';

const absHtml  = path.resolve(root, htmlFile);
const absOut   = path.resolve(root, outDir);
mkdirSync(absOut, { recursive: true });

// ─── Sections to capture ──────────────────────────────────────────────────────
// Edit this list to match the sections in your page.
const SECTIONS = [
  { label: '01 - Nav',          selector: 'nav' },
  { label: '02 - Hero',         selector: '.hero' },
  { label: '03 - Stats Bar',    selector: '.stats-bar' },
  { label: '04 - About',        selector: '.about' },
  { label: '05 - Benefits',     selector: '.benefits' },
  { label: '06 - How It Works', selector: '.how' },
  { label: '07 - Testimonials', selector: '.testimonials' },
  { label: '08 - CTA Section',  selector: '.cta-section' },
  { label: '09 - Footer',       selector: 'footer' },
];

(async () => {
  console.log(`\n📸 Screenshotting: ${absHtml}`);
  console.log(`   Output dir:      ${absOut}\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page    = await browser.newPage();

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file://' + absHtml, { waitUntil: 'networkidle0' });

  // Let fonts, canvas animations, and reveal classes settle
  await new Promise(r => setTimeout(r, 2500));

  // Force all .reveal elements visible before screenshotting
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });

  let saved = 0;
  for (const { label, selector } of SECTIONS) {
    const el = await page.$(selector);
    if (!el) {
      console.warn(`  ⚠️  Selector not found: ${selector} — skipping`);
      continue;
    }

    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 350));

    const filePath = path.join(absOut, `${label}.png`);
    await el.screenshot({ path: filePath });
    console.log(`  ✅ ${label}`);
    saved++;
  }

  await browser.close();
  console.log(`\nDone. ${saved}/${SECTIONS.length} screenshots saved to "${outDir}/"\n`);
})();
