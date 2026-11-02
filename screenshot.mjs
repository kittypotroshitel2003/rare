import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// node screenshot.mjs <local-url> [label] [viewport-width]
const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

// auto-increment
const existing = fs.readdirSync(dir).filter(f => /^screenshot-\d+.*\.(png|webp)$/.test(f));
const nums = existing.map(f => parseInt(f.match(/^screenshot-(\d+)/)?.[1] || '0'));
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const filename = `screenshot-${next}${label}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: Number(process.argv[4]) || 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
// Freeze reveal effects only in this test browser so offscreen cards are
// visible in full-page captures and text is never captured mid-blur.
await page.addStyleTag({ content: '[data-rr] { opacity: 1 !important; animation: none !important; filter: none !important; transform: none !important; }' });
await page.evaluate(async () => {
  document.querySelectorAll('img[loading="lazy"]').forEach(img => img.loading = 'eager');
  await document.fonts.ready;
  await Promise.all(Array.from(document.images, img => img.decode().catch(() => {})));
});
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Saved: temporary screenshots/${filename}`);
