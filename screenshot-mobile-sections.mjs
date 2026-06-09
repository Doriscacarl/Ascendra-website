import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const files = fs.readdirSync(screenshotDir);
const indices = files.map(f => { const m = f.match(/^screenshot-(\d+)/); return m ? parseInt(m[1]) : 0; }).filter(n => n > 0);
let idx = indices.length ? Math.max(...indices) + 1 : 1;

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 }); // iPhone 15 Pro
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Force all reveals
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
});

const sections = [
  { id: '#system', label: 'mobile-system' },
  { id: '#industries', label: 'mobile-industries' },
  { id: '#packages', label: 'mobile-packages' },
  { id: '#contact', label: 'mobile-cta' },
];

for (const sec of sections) {
  await page.evaluate((id) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'instant' });
  }, sec.id);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(screenshotDir, `screenshot-${idx}-${sec.label}.png`) });
  console.log(`Saved: screenshot-${idx}-${sec.label}.png`);
  idx++;
}

await browser.close();
