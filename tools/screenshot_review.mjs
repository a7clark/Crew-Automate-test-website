/**
 * tools/screenshot_review.mjs
 *
 * Two-pass screenshot capture for review and polish cycles.
 *
 * Pass 1 (--pass=1): Screenshots every section into "temporary screenshots/pass1/"
 * Pass 2 (--pass=2): Screenshots every section into "temporary screenshots/pass2/"
 *
 * After both passes, run with --diff to open both side-by-side in the terminal
 * (filenames printed for easy Finder/IDE comparison).
 *
 * Usage:
 *   node tools/screenshot_review.mjs --pass=1
 *   node tools/screenshot_review.mjs --pass=2
 *   node tools/screenshot_review.mjs --diff
 */

import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { mkdirSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.join(__dirname, '..');

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

const arg  = process.argv.find(a => a.startsWith('--')) ?? '--pass=1';
const mode = arg.replace('--', '');

async function capturePass(passName) {
  const outDir = path.resolve(root, 'temporary screenshots', passName);
  mkdirSync(outDir, { recursive: true });

  const htmlFile = path.resolve(root, 'index.html');
  console.log(`\n📸 Pass: ${passName.toUpperCase()}`);
  console.log(`   File: ${htmlFile}`);
  console.log(`   Out:  ${outDir}\n`);

  const browser = await puppeteer.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('file://' + htmlFile, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  });

  for (const { label, selector } of SECTIONS) {
    const el = await page.$(selector);
    if (!el) { console.warn(`  ⚠️  Not found: ${selector}`); continue; }
    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 350));
    await el.screenshot({ path: path.join(outDir, `${label}.png`) });
    console.log(`  ✅ ${label}`);
  }

  await browser.close();
  console.log(`\n✅ ${passName} complete.\n`);
}

function showDiff() {
  const base = path.resolve(root, 'temporary screenshots');
  const p1   = path.join(base, 'pass1');
  const p2   = path.join(base, 'pass2');

  if (!existsSync(p1) || !existsSync(p2)) {
    console.error('Run --pass=1 and --pass=2 before diffing.');
    process.exit(1);
  }

  const files = readdirSync(p1).filter(f => f.endsWith('.png'));
  console.log('\n📊 Screenshot Comparison\n');
  console.log('Section'.padEnd(30) + 'Pass 1'.padEnd(55) + 'Pass 2');
  console.log('─'.repeat(130));
  for (const f of files) {
    const label = f.replace('.png', '');
    const f1    = path.join(p1, f);
    const f2    = path.join(p2, f);
    const has2  = existsSync(f2);
    console.log(
      label.padEnd(30) +
      f1.padEnd(55) +
      (has2 ? f2 : '❌ missing')
    );
  }
  console.log('\nOpen both directories in Finder to compare:\n');
  console.log(`  pass1: ${p1}`);
  console.log(`  pass2: ${p2}\n`);
}

if (mode === 'pass=1') await capturePass('pass1');
else if (mode === 'pass=2') await capturePass('pass2');
else if (mode === 'diff') showDiff();
else {
  console.error('Usage: node tools/screenshot_review.mjs --pass=1 | --pass=2 | --diff');
  process.exit(1);
}
