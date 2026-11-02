// Переносит статьи со старого сайта rare-anapa.ru по их прежним адресам.
//
//   node build-articles.mjs <папка со скачанными страницами старого сайта> <список slug'ов>
//
// Для каждой статьи берёт заголовок, дату, текст и картинки со старой
// страницы (картинки скачиваются в assets/photos/articles/ и жмутся в webp),
// собирает страницу по шаблону уже перенесённой статьи (effect-maski/) и
// кладёт её в <slug>/index.html. Затем пересобирает карточки на
// /category/stati-i-novosti/ и навигацию «предыдущая/следующая» во всех статьях.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [OLD_DIR, SLUGS_FILE] = process.argv.slice(2);
if (!OLD_DIR || !SLUGS_FILE) {
  console.error('usage: node build-articles.mjs <old-pages-dir> <slugs.txt>');
  process.exit(1);
}

const DOMAIN = 'https://rare-anapa.ru';
const REDIRECTS = JSON.parse(fs.readFileSync('url-map.json', 'utf8')).redirects;
const TEMPLATE = 'effect-maski/index.html';
const LISTING = 'category/stati-i-novosti/index.html';
const IMG_DIR = 'assets/photos/articles';
const TMP_DIR = path.join(OLD_DIR, '_img');
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

// рубрики фильтра на странице статей (face / body / hair)
const RUBRIC = {
  'kakaya-gialuronovaya-kislota-luchshe': 'body',
  'talasso-blog': 'body',
  'lpg-cellu-m6-integral-top-1-v-mire-endermologii-pochemu-original-ne-zamenit-analogami': 'body',
  'lazernoe-lechenie-volos-v-trihologii': 'hair',
};
const RUBRIC_NAME = { face: 'Лицо и омоложение', body: 'Тело', hair: 'Волосы' };

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const isoDate = (ru) => {
  const [d, m, y] = ru.trim().split(/\s+/);
  return `${y}-${String(MONTHS.indexOf(m) + 1).padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const decode = (s) => s
  .replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—')
  .replace(/&#171;|&laquo;/g, '«').replace(/&#187;|&raquo;/g, '»')
  .replace(/&#8220;|&#8221;|&#8222;/g, '"').replace(/&#8217;|&#8216;/g, '’')
  .replace(/&#8230;|&hellip;/g, '…').replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&#(\d+);/g, (a, n) => String.fromCodePoint(+n));
const text = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const jsonStr = (s) => JSON.stringify(s);
const clip = (s, n) => {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.:;–—-]+$/, '') + '…';
};

// ── картинки ────────────────────────────────────────────────────────────
function download(url, file) {
  execFileSync('curl', ['-sfL', '-m', '60', '-A', 'Mozilla/5.0', '-o', file, url]);
}
function widthOf(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', file]).toString();
  return +out.match(/pixelWidth: (\d+)/)[1];
}
// скачивает оригинал (без суффикса -300x146 от WordPress), жмёт в webp:
// основной файл до maxW и уменьшенные копии под srcset
function fetchImage(url, name, maxW, variants) {
  url = url.replace(/^http:/, 'https:');
  const full = url.replace(/-\d+x\d+(\.\w+)$/, '$1');
  const ext = path.extname(full).split('?')[0] || '.jpg';
  const tmp = path.join(TMP_DIR, name + ext);
  if (!fs.existsSync(tmp)) {
    try { download(full, tmp); } catch { download(url, tmp); }
  }
  const w = widthOf(tmp);
  const mainW = Math.min(w, maxW);
  const out = { src: `/${IMG_DIR}/${name}.webp`, w: mainW, set: [] };
  const enc = (width, file) => {
    if (!fs.existsSync(file)) execFileSync('cwebp', ['-quiet', '-q', '80', '-resize', String(width), '0', tmp, '-o', file]);
  };
  enc(mainW, `${IMG_DIR}/${name}.webp`);
  for (const v of variants) {
    if (v >= mainW) continue;
    enc(v, `${IMG_DIR}/${name}-${v}.webp`);
    out.set.push(`/${IMG_DIR}/${name}-${v}.webp ${v}w`);
  }
  out.set.push(`${out.src} ${mainW}w`);
  return out;
}

// ── разбор старой статьи ────────────────────────────────────────────────
function cleanInline(h) {
  return h
    .replace(/<\/?span[^>]*>/g, '')
    .replace(/<b>/g, '<strong>').replace(/<\/b>/g, '</strong>')
    .replace(/<(strong|em|i|br)\b[^>]*>/g, '<$1>')
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>/g, (a, href) => {
      href = decode(href);
      const local = href.match(/^https?:\/\/rare-anapa\.ru(\/[^"]*)$/);
      // сразу на конечный адрес, без цепочки через 301
      if (local) return `<a href="${REDIRECTS[local[1]] || local[1]}">`;
      return `<a href="${esc(href)}" target="_blank" rel="noopener">`;
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseOld(slug) {
  const t = fs.readFileSync(path.join(OLD_DIR, slug + '.html'), 'utf8');
  const title = text(t.match(/<h1>([\s\S]*?)<\/h1>/)[1]);
  const dateRu = text(t.match(/<div class="date">([\s\S]*?)<\/div>/)[1]);
  const metaDesc = (t.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const cover = t.match(/property="og:image" content="([^"]+)"/)[1];

  let body = t.slice(t.indexOf('<div class="date">'), t.indexOf('<div class="footer">'));
  body = body.replace(/^<div class="date">[\s\S]*?<\/div>\s*<\/div>/, '').replace(/(\s*<\/div>)+\s*$/, '');

  // разбиваем на блоки верхнего уровня
  const blocks = [];
  const re = /<(p|h[1-6]|ul|ol|blockquote|figure|div|table)\b[^>]*>/g;
  let m;
  while ((m = re.exec(body))) {
    const tag = m[1];
    let depth = 1, i = re.lastIndex;
    const open = new RegExp(`<${tag}\\b`, 'g'), close = new RegExp(`</${tag}>`, 'g');
    while (depth > 0) {
      open.lastIndex = i; close.lastIndex = i;
      const o = open.exec(body), c = close.exec(body);
      if (!c) { i = body.length; break; }
      if (o && o.index < c.index) { depth++; i = o.index + 1; } else { depth--; i = c.index + c[0].length; }
    }
    blocks.push({ tag, html: body.slice(m.index, i) });
    re.lastIndex = i;
  }

  const out = [];
  for (const b of blocks) {
    const imgs = [...b.html.matchAll(/<img\b[^>]*>/g)].map((x) => ({
      src: (x[0].match(/\bsrc="([^"]+)"/) || [])[1],
      alt: decode((x[0].match(/\balt="([^"]*)"/) || [])[1] || ''),
    }));
    for (const img of imgs) if (img.src) out.push({ type: 'img', ...img });
    const inner = b.html.replace(/^<[^>]+>/, '').replace(/<\/\w+>$/, '');
    if (!text(inner.replace(/<img\b[^>]*>/g, '')).replace(/[_\s]/g, '')) continue;
    if (/^h[1-6]$/.test(b.tag)) {
      out.push({ type: 'h', level: b.tag === 'h2' || b.tag === 'h1' ? 2 : 3, html: text(inner) });
    } else if (b.tag === 'ul' || b.tag === 'ol') {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((x) => cleanInline(x[1])).filter(Boolean);
      out.push({ type: 'list', tag: b.tag, items });
    } else {
      out.push({ type: 'p', html: cleanInline(inner.replace(/<img\b[^>]*>/g, '')) });
    }
  }

  const firstP = out.find((x) => x.type === 'p');
  const lead = firstP ? text(firstP.html) : title;
  return {
    slug, title, dateRu, date: isoDate(dateRu), cover, blocks: out,
    description: metaDesc ? decode(metaDesc) : clip(lead, 160),
    excerpt: clip(metaDesc ? decode(metaDesc) : lead, 120),
    rubric: RUBRIC[slug] || 'face',
  };
}

// ── сборка контента ─────────────────────────────────────────────────────
function renderContent(a) {
  const parts = [];
  let section = null;
  const flush = () => { if (section) parts.push(`    <div class="article-section">\n${section.join('\n')}\n    </div>`); section = null; };
  let imgN = 0;
  for (const b of a.blocks) {
    if (b.type === 'img') {
      flush();
      const img = fetchImage(b.src, `${a.slug.slice(0, 60)}-${++imgN}`, 1600, [700]);
      const alt = b.alt && !/^\s*$/.test(b.alt) ? b.alt : a.title;
      parts.push(`    <figure class="article-inline-img article-inline-img--natural">\n      <img src="${img.src}" alt="${esc(alt)}" loading="lazy" decoding="async" srcset="${img.set.join(', ')}" sizes="(max-width: 767px) 100vw, 800px"/>\n    </figure>`);
      continue;
    }
    if (b.type === 'h') {
      const tag = `      <h${b.level}>${esc(b.html)}</h${b.level}>`;
      // h2 сразу перед h3 — это один блок, а не пустой раздел из одного заголовка
      if (section && section.length === 1 && /<h2>/.test(section[0]) && b.level === 3) { section.push(tag); continue; }
      flush(); section = [tag]; continue;
    }
    if (!section) section = [];
    if (b.type === 'p') section.push(`      <p>${b.html}</p>`);
    if (b.type === 'list') section.push(`      <${b.tag}>\n${b.items.map((li) => `        <li>${li}</li>`).join('\n')}\n      </${b.tag}>`);
  }
  flush();
  return parts.join('\n');
}

function schemaAuto(a) {
  const url = `${DOMAIN}/${a.slug}/`;
  return `<!-- schema:auto — сгенерировано build-schema.mjs, править вручную не нужно -->
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MedicalWebPage', '@id': `${url}#webpage`, url, name: a.title, description: a.description,
      inLanguage: 'ru-RU', isPartOf: { '@id': `${DOMAIN}/#organization` }, publisher: { '@id': `${DOMAIN}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: `${DOMAIN}/` },
        { '@type': 'ListItem', position: 2, name: 'Статьи', item: `${DOMAIN}/category/stati-i-novosti/` },
        { '@type': 'ListItem', position: 3, name: a.title },
      ],
    },
  ],
}, null, 2)}
</script>
<!-- /schema:auto -->`;
}

function blogPosting(a, coverSrc) {
  return `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'BlogPosting', headline: a.title, description: a.description,
  image: DOMAIN + coverSrc, datePublished: a.date,
  author: { '@type': 'Organization', name: 'RA|RÉ', url: `${DOMAIN}/` },
  publisher: { '@type': 'Organization', '@id': `${DOMAIN}/#organization`, name: 'RA|RÉ', logo: { '@type': 'ImageObject', url: `${DOMAIN}/assets/icons/logo.svg` } },
  mainEntityOfPage: `${DOMAIN}/${a.slug}/`,
}, null, 2)}
</script>`;
}

function replaceOnce(html, re, value, what) {
  if (!re.test(html)) throw new Error(`шаблон: не найден блок «${what}»`);
  return html.replace(re, () => value);
}

const template = fs.readFileSync(TEMPLATE, 'utf8');
const slugs = fs.readFileSync(SLUGS_FILE, 'utf8').split(/\s+/).filter(Boolean);
const built = [];

for (const slug of slugs) {
  const a = parseOld(slug);
  const cover = fetchImage(a.cover, `${slug.slice(0, 60)}-cover`, 2000, [350, 700, 1250]);
  let h = template;
  h = replaceOnce(h, /<title>[\s\S]*?<\/title>/, `<title>${esc(a.title)} — RA|RÉ Клиника экспертной косметологии в Анапе</title>`, 'title');
  h = replaceOnce(h, /<meta name="description" content="[^"]*"\/>/, `<meta name="description" content="${esc(a.description)}"/>`, 'description');
  h = replaceOnce(h, /<link rel="canonical" href="[^"]*"\/>/, `<link rel="canonical" href="${DOMAIN}/${slug}/"/>`, 'canonical');
  h = replaceOnce(h, /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema.org",\s*"@type": "BlogPosting"[\s\S]*?<\/script>/, blogPosting(a, cover.src), 'BlogPosting');
  h = replaceOnce(h, /<!-- schema:auto[\s\S]*?<!-- \/schema:auto -->/, schemaAuto(a), 'schema:auto');
  h = replaceOnce(h, /<span class="article-bc__current">[\s\S]*?<\/span>/, `<span class="article-bc__current">${esc(clip(a.title, 48))}</span>`, 'breadcrumb');
  h = replaceOnce(h, /<p class="article-meta-simple">[\s\S]*?<\/p>/, `<p class="article-meta-simple"><time datetime="${a.date}">${a.dateRu}</time></p>`, 'date');
  h = replaceOnce(h, /<h1 class="article-title-simple">[\s\S]*?<\/h1>/, `<h1 class="article-title-simple">${esc(a.title)}</h1>`, 'h1');
  h = replaceOnce(h, /<div class="article-hero-img__frame">[\s\S]*?<\/div>/,
    `<div class="article-hero-img__frame">\n    <img src="${cover.src}" alt="${esc(a.title)}" fetchpriority="high" srcset="${cover.set.join(', ')}" sizes="(max-width: 767px) 100vw, 1170px"/>\n  </div>`, 'hero');
  h = replaceOnce(h, /<div class="article-content">[\s\S]*?\n  <\/div>\n<\/section>/, `<div class="article-content">\n${renderContent(a)}\n  </div>\n</section>`, 'content');
  fs.mkdirSync(slug, { recursive: true });
  fs.writeFileSync(`${slug}/index.html`, h);
  built.push({ ...a, cover });
  console.log('✓', slug);
}

// ── список статей + навигация ───────────────────────────────────────────
let listing = fs.readFileSync(LISTING, 'utf8');
const gridRe = /(<div class="art-grid" id="art-grid">)([\s\S]*?)(\n  <\/div>\n  <p class="art-empty")/;
const cards = [...listing.match(gridRe)[2].matchAll(/\n    <a href="\/([^"]+)\/" class="art-card"[\s\S]*?<\/a>\n/g)]
  .map((m) => ({
    slug: m[1],
    html: m[0].trim(),
    date: m[0].match(/datetime="([^"]+)"/)[1],
    title: text(m[0].match(/<h2 class="art-card__title">([\s\S]*?)<\/h2>/)[1]),
  }));
const bySlug = new Map(cards.map((c) => [c.slug, c]));
for (const a of built) {
  bySlug.set(a.slug, {
    slug: a.slug, date: a.date, title: a.title,
    html: `<a href="/${a.slug}/" class="art-card" data-rubric="${a.rubric}">
      <span class="art-card__frame">
        <img src="${a.cover.src}" alt="${esc(a.title)}" loading="lazy" decoding="async" srcset="${a.cover.set.join(', ')}" sizes="(max-width: 767px) 350px, (max-width: 1024px) 624px, 374px"/>
        <span class="art-card__rubric">${RUBRIC_NAME[a.rubric]}</span>
      </span>
      <span class="art-card__meta"><time datetime="${a.date}">${a.dateRu}</time></span>
      <h2 class="art-card__title">${esc(a.title)}</h2>
      <p class="art-card__excerpt">${esc(a.excerpt)}</p>
    </a>`,
  });
}
const all = [...bySlug.values()].sort((x, y) => y.date.localeCompare(x.date));
listing = listing.replace(gridRe, (m, open, mid, close) => `${open}\n\n${all.map((c) => '    ' + c.html).join('\n\n')}\n${close}`);
fs.writeFileSync(LISTING, listing);

const ARROW_L = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_R = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
all.forEach((c, i) => {
  const newer = all[i - 1], older = all[i + 1];
  const prev = older
    ? `    <a class="article-nav__link article-nav__link--prev" href="/${older.slug}/">
      <span class="article-nav__arrow">${ARROW_L}</span>
      <span class="article-nav__text"><span class="article-nav__label">Предыдущая статья</span><span class="article-nav__title">${esc(older.title)}</span></span>
    </a>`
    : '    <span class="article-nav__spacer" aria-hidden="true"></span>';
  const next = newer
    ? `    <a class="article-nav__link article-nav__link--next" href="/${newer.slug}/">
      <span class="article-nav__text"><span class="article-nav__label">Следующая статья</span><span class="article-nav__title">${esc(newer.title)}</span></span>
      <span class="article-nav__arrow">${ARROW_R}</span>
    </a>`
    : '';
  const file = `${c.slug}/index.html`;
  const page = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, replaceOnce(page, /<nav class="article-nav wrap"[\s\S]*?<\/nav>/,
    `<nav class="article-nav wrap" aria-label="Другие статьи">\n${prev}\n${next}\n  <a class="article-nav__all" href="/category/stati-i-novosti/">Все статьи</a>\n</nav>`, 'article-nav'));
});
console.log(`\nстатей в списке: ${all.length}`);
