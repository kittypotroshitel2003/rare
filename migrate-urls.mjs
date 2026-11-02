// Одноразовый переезд редизайна на адреса старого сайта (см. url-map.json).
// Каждая страница из карты уезжает в <url>/index.html, а все внутренние
// ссылки во всех HTML переписываются на корневые (/assets/…, /uslugi/…),
// чтобы глубина вложенности папки больше ни на что не влияла.
//
//   node migrate-urls.mjs          — показать, что будет сделано
//   node migrate-urls.mjs --write  — выполнить (git mv + перезапись)

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const WRITE = process.argv.includes('--write');
const ROOT = process.cwd();
const map = JSON.parse(fs.readFileSync('url-map.json', 'utf8'));
const pages = map.pages;
const OLD_HOST = /https:\/\/rare\.a-4-to\.ru(\/[^"'\s<>)\\]*)?/g;

const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'temporary screenshots', 'Специалисты', 'услуги (1)', 'dist', '_env']);

function htmlFiles(dir = '.') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.posix.join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p.replace(/^\.\//, ''));
  }
  return out;
}

const isFile = (p) => { try { return fs.statSync(path.join(ROOT, p)).isFile(); } catch { return false; } };

// Ссылка (как она написана в файле fromFile) → корневой URL, либо null, если
// это не ссылка на файл проекта и трогать её не надо.
function resolveRef(value, fromFile) {
  if (!value || /^(?:[a-z][\w+.-]*:|#|\/\/|\{|\$)/i.test(value)) return null;
  const m = value.match(/^([^?#]*)(.*)$/);
  let p = m[1], suffix = m[2];
  if (!p) return null;
  let abs = p.startsWith('/')
    ? p.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), p));
  if (abs === '.' ) abs = '';
  if (abs.startsWith('..')) return null;
  if (abs === '' || abs.endsWith('/')) abs += 'index.html';
  try { abs = decodeURI(abs); } catch {}
  if (pages[abs]) return pages[abs] + suffix;
  if (isFile(abs)) return '/' + encodeURI(abs).replace(/%25/g, '%') + suffix;
  return null;
}

function rewrite(html, file) {
  let n = 0;
  const swap = (v) => { const r = resolveRef(v, file); if (r !== null && r !== v) { n++; return r; } return v; };

  // абсолютные ссылки на тестовый домен (canonical, og, JSON-LD) → боевой домен
  html = html.replace(OLD_HOST, (all, p = '/') => {
    const m = p.match(/^([^?#]*)(.*)$/);
    let key = m[1].replace(/^\//, '');
    if (key === '' || key.endsWith('/')) key += 'index.html';
    n++;
    if (pages[key]) return map.domain + pages[key] + m[2];
    return map.domain + m[1] + m[2];
  });

  // srcset: «url 2x, url 640w»
  html = html.replace(/\b((?:data-)?srcset|imagesrcset)=(["'])([^"']*)\2/g, (all, attr, q, val) =>
    `${attr}=${q}${val.split(',').map((part) => {
      const [u, ...rest] = part.trim().split(/\s+/);
      return [swap(u), ...rest].join(' ');
    }).join(', ')}${q}`);

  // url(...) в style-атрибутах и <style>
  html = html.replace(/url\((["']?)([^"')]+)\1\)/g, (all, q, val) => `url(${q}${swap(val.trim())}${q})`);

  // любые строки в кавычках без пробелов: атрибуты href/src/poster/content,
  // а также строки в инлайновых скриптах ('ratings.json', '../assets/…')
  html = html.replace(/(["'])([^"'\s<>(){}]+)\1/g, (all, q, val) => q + swap(val) + q);

  return { html, n };
}

const files = htmlFiles();
const unmappedPages = files.filter((f) => !pages[f]);
console.log(`HTML-файлов: ${files.length}, в карте: ${files.length - unmappedPages.length}`);
console.log('Вне карты (останутся на месте):', unmappedPages.join(', '));
for (const k of Object.keys(pages)) if (!files.includes(k)) console.log('!! в карте, но файла нет:', k);

const results = files.map((f) => ({ f, ...rewrite(fs.readFileSync(f, 'utf8'), f) }));

for (const { f, n } of results) {
  const dest = pages[f] ? pages[f].slice(1) + 'index.html' : f;
  console.log(`${String(n).padStart(4)}  ${f}${dest !== f ? '  →  ' + dest : ''}`);
}

if (!WRITE) { console.log('\nПробный прогон. Для выполнения: node migrate-urls.mjs --write'); process.exit(0); }

for (const { f, html } of results) {
  const dest = pages[f] ? pages[f].slice(1) + 'index.html' : f;
  if (dest !== f) {
    if (fs.existsSync(dest)) throw new Error(`Уже существует: ${dest}`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    execFileSync('git', ['mv', f, dest]);
  }
  fs.writeFileSync(dest, html);
}
console.log('\nГотово.');
