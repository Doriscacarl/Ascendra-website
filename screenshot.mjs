import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

function getNextIndex(label) {
  const files = fs.readdirSync(screenshotDir);
  const pattern = label
    ? new RegExp(`^screenshot-(\\d+)-${label}\\.png$`)
    : /^screenshot-(\d+)\.png$/;
  const indices = files
    .map(f => { const m = f.match(pattern); return m ? parseInt(m[1]) : 0; })
    .filter(n => n > 0);
  return indices.length ? Math.max(...indices) + 1 : 1;
}

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const index = getNextIndex(label);
const filename = label ? `screenshot-${index}-${label}.png` : `screenshot-${index}.png`;
const outPath = path.join(screenshotDir, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);
