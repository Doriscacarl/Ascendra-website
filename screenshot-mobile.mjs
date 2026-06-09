import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || 'mobile';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 }); // iPhone 15 Pro
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

const files = fs.readdirSync(screenshotDir);
const indices = files.map(f => { const m = f.match(/^screenshot-(\d+)/); return m ? parseInt(m[1]) : 0; }).filter(n => n > 0);
const idx = indices.length ? Math.max(...indices) + 1 : 1;
const outPath = path.join(screenshotDir, `screenshot-${idx}-${label}.png`);

await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log(`Saved: temporary screenshots/screenshot-${idx}-${label}.png`);
