import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

const positions = await page.evaluate(() => {
  const sections = ['#system', '#industries', '#roi', '#packages', '#founder', '#contact'];
  const result = {};
  sections.forEach(id => {
    const el = document.querySelector(id);
    if (el) result[id] = Math.round(el.getBoundingClientRect().top + window.scrollY);
  });
  // Also check stats section (first section after hero)
  const allSections = document.querySelectorAll('section');
  result.totalSections = allSections.length;
  result.sectionTops = Array.from(allSections).map(s => Math.round(s.getBoundingClientRect().top + window.scrollY));
  result.pageHeight = document.body.scrollHeight;
  return result;
});

console.log(JSON.stringify(positions, null, 2));
await browser.close();
