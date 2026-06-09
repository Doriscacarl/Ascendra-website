import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const scrollY = parseInt(process.argv[3] || '0');
const label = process.argv[4] || 'shot';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Force ALL reveal elements to be visible
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
});

await page.evaluate((sy) => { window.scrollTo(0, sy); }, scrollY);
await new Promise(r => setTimeout(r, 600));

const files = fs.readdirSync(screenshotDir);
const indices = files.map(f => { const m = f.match(/^screenshot-(\d+)/); return m ? parseInt(m[1]) : 0; }).filter(n => n > 0);
const idx = indices.length ? Math.max(...indices) + 1 : 1;
const outPath = path.join(screenshotDir, `screenshot-${idx}-${label}.png`);

await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Saved: temporary screenshots/screenshot-${idx}-${label}.png`);
