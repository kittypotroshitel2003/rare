/**
 * Адаптивная загрузка изображений: srcset + sizes по реальным размерам.
 *
 * Скрипт не угадывает, какой ширины показывается картинка, — он открывает
 * страницы в браузере на трёх ширинах и замеряет. По замерам режет варианты
 * (с запасом на retina) и прописывает в разметку srcset и точный sizes.
 * Телефон качает вариант под свой экран, десктоп — свой.
 *
 * Нужен запущенный `node serve.mjs` и cwebp в системе.
 *
 *   node build-responsive-images.mjs            замерить, нарезать, прописать
 *   node build-responsive-images.mjs --check    только показать, что сделает
 */
import puppeteer from 'puppeteer';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const check = process.argv.includes('--check');
const BREAKS = [390, 768, 1440];          // телефон / планшет / десктоп
const RETINA = 2;                          // плотность, под которую держим запас
const MIN_GAIN = 1.25;                     // меньше — нарезка не окупается

const PAGES = [
  'index.html', 'about.html', 'services.html', 'prices.html', 'promos.html',
  'certificates.html', 'legal.html', 'specialists/index.html', 'reviews/index.html',
  'articles/index.html', 'articles/article-hair-loss.html', 'articles/article-men-epilation.html',
  'promos/smas-lifting.html', 'services/procedures/smas-lifting.html',
  'services/procedures/laser-epilation.html', 'services/procedures/injection-cosmetology.html',
  ...fs.readdirSync('specialists').filter((f) => f.endsWith('.html')).map((f) => 'specialists/' + f),
];

/* ── 1. Замер ──────────────────────────────────────────────────────── */

const seen = {};
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
for (const w of BREAKS) {
  for (const pg of PAGES) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900 });
    try { await page.goto(`${BASE}/${pg}`, { waitUntil: 'load', timeout: 40000 }); } catch { await page.close(); continue; }
    // раскрываем скрытое, иначе половина картинок не получит размеров
    await page.evaluate(() => {
      document.querySelectorAll('[data-rr]').forEach((e) => e.classList.add('rr-in'));
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => i.setAttribute('loading', 'eager'));
    });
    // без прокрутки часть картинок так и остаётся нулевого размера —
    // карусели и блоки, которые проявляются по мере скролла
    await page.evaluate(async () => {
      const step = Math.floor(innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
      scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 900));
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll('img')]
        .map((i) => ({ src: i.getAttribute('src') || '', w: Math.round(i.getBoundingClientRect().width), nat: i.naturalWidth }))
        .filter((x) => x.src && x.w > 0 && !x.src.startsWith('data:') && !/\.svg(\?|$)/.test(x.src)));
    for (const r of rows) {
      const file = r.src.replace(/^(\.\.\/)+/, '').split('?')[0];
      seen[file] = seen[file] || { nat: 0, by: {} };
      if (r.nat) seen[file].nat = r.nat;
      seen[file].by[w] = Math.max(seen[file].by[w] || 0, r.w);
    }
    await page.close();
  }
}
await browser.close();

/* ── 2. Нарезка ────────────────────────────────────────────────────── */

const plan = [];
for (const [file, info] of Object.entries(seen)) {
  if (!fs.existsSync(file) || !info.nat) continue;
  const maxShown = Math.max(...Object.values(info.by));
  if (!maxShown || info.nat <= maxShown * RETINA * MIN_GAIN) continue;

  // ширины, которые реально нужны: 1x и 2x каждого брейкпоинта, не больше оригинала
  const wanted = [];
  for (const b of BREAKS) {
    const shown = info.by[b];
    if (!shown) continue;
    for (const d of [1, RETINA]) {
      const px = Math.min(info.nat, Math.ceil((shown * d) / 50) * 50);
      if (px < 200) continue;
      if (!wanted.some((x) => Math.abs(x - px) / px < 0.15)) wanted.push(px);
    }
  }
  let widths = wanted.filter((x) => x < info.nat * 0.9).sort((a, b) => a - b);
  // не больше трёх вариантов на картинку: дальше выигрыш в трафике уже
  // меньше, чем беспорядок в папке assets
  if (widths.length > 3) widths = [widths[0], widths[Math.floor(widths.length / 2)], widths[widths.length - 1]];
  if (!widths.length) continue;
  plan.push({ file, nat: info.nat, by: info.by, widths });
}

let made = 0, savedBytes = 0;
for (const p of plan) {
  const dir = path.dirname(p.file), base = path.basename(p.file, '.webp');
  p.variants = [];
  for (const w of p.widths) {
    const out = path.join(dir, `${base}-${w}.webp`);
    if (!check && !fs.existsSync(out)) {
      execFileSync('cwebp', ['-quiet', '-q', '85', '-metadata', 'none', '-resize', String(w), '0', p.file, '-o', out]);
      made++;
    }
    if (fs.existsSync(out)) { p.variants.push({ w, out }); savedBytes += fs.statSync(p.file).size - fs.statSync(out).size; }
    else p.variants.push({ w, out });
  }
}

/* ── 3. Разметка ───────────────────────────────────────────────────── */

function sizesAttr(by) {
  const parts = [];
  if (by[390]) parts.push(`(max-width: 767px) ${by[390]}px`);
  if (by[768]) parts.push(`(max-width: 1024px) ${by[768]}px`);
  parts.push(`${by[1440] || by[768] || by[390]}px`);
  return parts.join(', ');
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'assets', 'temporary screenshots', 'docs'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const byFile = Object.fromEntries(plan.map((p) => [p.file, p]));
let touched = 0, tags = 0;
for (const html of walk('.').map((f) => f.replace(/^\.\//, ''))) {
  let src = fs.readFileSync(html, 'utf8');
  const before = src;
  src = src.replace(/<img\b[^>]*>/g, (tag) => {
    const m = tag.match(/\ssrc="((?:\.\.\/)*)(assets\/[^"?]+\.webp)(\?[^"]*)?"/);
    if (!m) return tag;
    const p = byFile[m[2]];
    if (!p || !p.variants.length) return tag;
    const prefix = m[1], q = m[3] || '';
    const set = p.variants.map((v) => `${prefix}${v.out}${q} ${v.w}w`)
      .concat(`${prefix}${p.file}${q} ${p.nat}w`).join(', ');
    let out = tag.replace(/\s(srcset|sizes)="[^"]*"/g, '');
    out = out.replace(/\s*\/?>$/, ` srcset="${set}" sizes="${sizesAttr(p.by)}"${tag.endsWith('/>') ? '/>' : '>'}`);
    tags++;
    return out;
  });
  if (src !== before) { if (!check) fs.writeFileSync(html, src); touched++; }
}

console.log(`${check ? 'Будет нарезано' : 'Нарезано'} вариантов: ${check ? plan.reduce((a, p) => a + p.widths.length, 0) : made}`);
console.log(`Картинок под адаптив: ${plan.length}`);
console.log(`${check ? 'Будет обновлено' : 'Обновлено'} тегов <img>: ${tags} в ${touched} файлах`);
for (const p of plan.slice(0, 12)) {
  console.log(`  ${p.file.replace('assets/photos/', '')} — ${p.nat}px → ${p.widths.join(', ')}  [${sizesAttr(p.by)}]`);
}
