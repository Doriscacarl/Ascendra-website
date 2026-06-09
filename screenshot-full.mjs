import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'full';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 2000));

// Scroll to trigger all reveals
await page.evaluate(() => {
  return new Promise(resolve => {
    let totalHeight = 0;
    const distance = 400;
    const timer = setInterval(() => {
      window.scrollBy(0, distance);
      totalHeight += distance;
      if (totalHeight >= document.body.scrollHeight) {
        window.scrollTo(0, 0);
        clearInterval(timer);
        setTimeout(resolve, 800);
      }
    }, 100);
  });
});

const files = fs.readdirSync(screenshotDir);
const indices = files.map(f => { const m = f.match(/^screenshot-(\d+)/); return m ? parseInt(m[1]) : 0; }).filter(n => n > 0);
const idx = indices.length ? Math.max(...indices) + 1 : 1;
const outPath = path.join(screenshotDir, `screenshot-${idx}-${label}.png`);

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved: temporary screenshots/screenshot-${idx}-${label}.png`);
