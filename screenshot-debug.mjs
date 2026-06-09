import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

// Trigger reveals by scrolling through
await page.evaluate(() => {
  return new Promise(resolve => {
    window.scrollTo(0, document.body.scrollHeight);
    setTimeout(resolve, 1200);
  });
});

// Get positions with reveals applied
const info = await page.evaluate(() => {
  const sections = document.querySelectorAll('section');
  return {
    scrollY: window.scrollY,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio,
    sections: Array.from(sections).map((s, i) => ({
      index: i,
      id: s.id || '',
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      height: Math.round(s.offsetHeight)
    }))
  };
});
console.log(JSON.stringify(info, null, 2));

// Now take screenshot at stats section (section index 1)
const statsTop = info.sections[1]?.top || 0;
await page.evaluate((sy) => { window.scrollTo(0, sy); }, statsTop);
await new Promise(r => setTimeout(r, 800));

const files = fs.readdirSync(screenshotDir);
const indices = files.map(f => { const m = f.match(/^screenshot-(\d+)/); return m ? parseInt(m[1]) : 0; }).filter(n => n > 0);
const idx = indices.length ? Math.max(...indices) + 1 : 1;
await page.screenshot({ path: path.join(screenshotDir, `screenshot-${idx}-debug-stats.png`), fullPage: false });

// Screenshot system section
const systemTop = info.sections[2]?.top || 0;
await page.evaluate((sy) => { window.scrollTo(0, sy); }, systemTop);
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(screenshotDir, `screenshot-${idx+1}-debug-system.png`), fullPage: false });

await browser.close();
console.log(`Screenshots saved.`);
