import puppeteer from './node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { mkdirSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'temporary screenshots');
mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3];

// auto-increment: screenshot-N[-label].png
const existing = readdirSync(outDir)
  .map(f => /^screenshot-(\d+)/.exec(f))
  .filter(Boolean)
  .map(m => parseInt(m[1], 10));
const n = (existing.length ? Math.max(...existing) : 0) + 1;
const name = `screenshot-${n}${label ? '-' + label : ''}.png`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: path.join(outDir, name), fullPage: true });
console.log(`Saved: temporary screenshots/${name}`);
await browser.close();
