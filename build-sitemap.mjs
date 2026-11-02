// Собирает sitemap.xml из всех страниц сайта (папка/index.html) и
// sitemap_index.xml — его адрес был прописан в robots.txt старого сайта,
// поэтому он должен продолжать работать.
//
//   node build-sitemap.mjs
//
// В карту попадают только конечные страницы, которые отдают 200: без
// редиректов (они живут в url-map.json → redirects) и без служебных файлов.

import fs from 'node:fs';
import path from 'node:path';

const DOMAIN = 'https://rare-anapa.ru';
const SKIP = new Set(['node_modules', '.git', '.claude', 'assets', 'css', 'js', 'styles', 'slides', 'docs', 'dist', '_env', 'temporary screenshots', 'Специалисты', 'услуги (1)']);

function pages(dir = '.') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const sub = path.posix.join(dir, e.name);
    if (fs.existsSync(path.join(sub, 'index.html'))) out.push(sub);
    out.push(...pages(sub));
  }
  return out;
}

const PRIORITY = [
  [/^\/$/, '1.0', 'weekly'],
  [/^\/(uslugi|prajs|category\/akcii)\/$/, '0.9', 'weekly'],
  [/^\/uslugi\//, '0.8', 'monthly'],
  [/^\/(about|speczialisty|sertifikaty|otzyvy|category\/stati-i-novosti)\/$/, '0.7', 'monthly'],
  [/^\/pravovaya-informacziya\/$/, '0.3', 'yearly'],
  [/./, '0.6', 'monthly'],
];

const urls = ['/', ...pages().map((d) => '/' + d.replace(/^\.\//, '') + '/')]
  .filter((u) => {
    const html = fs.readFileSync(path.join('.', u, 'index.html'), 'utf8');
    return !/<meta[^>]+name="robots"[^>]+noindex/i.test(html) && !/http-equiv="refresh"/i.test(html);
  })
  .sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));

const entry = (u) => {
  const [, priority, freq] = PRIORITY.find(([re]) => re.test(u));
  const file = path.join('.', u, 'index.html');
  const lastmod = fs.statSync(file).mtime.toISOString().slice(0, 10);
  return `  <url>\n    <loc>${DOMAIN}${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
};

fs.writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(entry).join('\n')}
</urlset>
`);

fs.writeFileSync('sitemap_index.xml', `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${DOMAIN}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </sitemap>
</sitemapindex>
`);

console.log(`sitemap.xml: ${urls.length} URL`);
