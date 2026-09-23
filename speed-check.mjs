/**
 * Замер скорости загрузки: вес переданного, DOMContentLoaded, load и LCP
 * на мобильной и десктопной ширине.
 *
 *   node speed-check.mjs                        локальный сервер
 *   BASE_URL=https://rare.a-4-to.ru node speed-check.mjs
 *   node speed-check.mjs --page=index.html
 */
import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const arg = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? true];
}));
const PAGES = arg.page ? [arg.page] : [
  'index.html', 'services.html', 'prices.html', 'about.html',
  'specialists/index.html', 'services/procedures/smas-lifting.html',
  'articles/article-hair-loss.html', 'legal.html',
];
const VIEWS = [
  { name: 'мобильный', width: 390, height: 844 },
  { name: 'десктоп', width: 1440, height: 900 },
];

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const rows = [];

for (const view of VIEWS) {
  for (const p of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: view.width, height: view.height });
    await page.setCacheEnabled(false);
    // LCP доступен только через наблюдателя, заведённого до загрузки
    await page.evaluateOnNewDocument(() => {
      window.__lcp = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__lcp = Math.round(e.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    let bytes = 0;
    page.on('response', (r) => { bytes += Number(r.headers()['content-length'] || 0); });
    const t0 = Date.now();
    try {
      await page.goto(`${BASE}/${p}`, { waitUntil: 'load', timeout: 60000 });
    } catch { /* страница с видео может не отдать load — время всё равно снимем */ }
    await new Promise((r) => setTimeout(r, 2500));
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const fcp = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint');
      return {
        dcl: Math.round(nav.domContentLoadedEventEnd || 0),
        load: Math.round(nav.loadEventEnd || 0),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        lcp: window.__lcp || null,
      };
    });
    rows.push({ view: view.name, page: p, kb: Math.round(bytes / 1024), ...m, wall: Date.now() - t0 });
    await page.close();
  }
}
await browser.close();

for (const view of VIEWS) {
  const list = rows.filter((r) => r.view === view.name);
  console.log('\n' + view.name.toUpperCase());
  console.log('  ' + 'страница'.padEnd(42) + 'вес'.padStart(8) + 'DCL'.padStart(8) + 'load'.padStart(8) + 'LCP'.padStart(8));
  for (const r of list) {
    console.log('  ' + r.page.padEnd(42) + (r.kb + ' КБ').padStart(8) +
      (r.dcl + ' мс').padStart(8) + (r.load + ' мс').padStart(8) +
      ((r.lcp ?? '—') + (r.lcp ? ' мс' : '')).padStart(8));
  }
  const kb = list.reduce((a, c) => a + c.kb, 0) / list.length;
  const lcps = list.map((r) => r.lcp).filter(Boolean);
  console.log('  ' + 'среднее'.padEnd(42) + (Math.round(kb) + ' КБ').padStart(8) +
    ''.padStart(16) + (lcps.length ? Math.round(lcps.reduce((a, c) => a + c, 0) / lcps.length) + ' мс' : '—').padStart(8));
}
