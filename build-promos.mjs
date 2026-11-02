// build-promos.mjs — one source of truth for the clinic's current promotions.
//
// The current offers appear in many places: the promos.html grid (desktop
// tiles + mobile cards), the banner strip and mobile carousel on the home
// page, the banner strip on services.html, a single relevant banner on a few
// procedure pages, and one detail page per offer under promos/. Editing them
// by hand drifted (August offers were still live in October), so this script
// rewrites every one of those spots from the PROMOS list below.
//
// Content mirrors https://rare-anapa.ru/category/akcii/ — photos are the
// clinic's own shoot (our interior, our doctors), cropped by mkimg into
// assets/photos/promo-<id>{,-1250,-650}.webp (landscape) and
// promo-<id>-m{,-700,-350}.webp (portrait, for phones).
//
// Usage: node build-promos.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const URL_MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'url-map.json'), 'utf8'));
const promoURL = (id) => URL_MAP.pages[`promos/${id}.html`] || ({
  'peeling-course': '/kurs-pilingov/',
  'laser-new': '/lazernaya-epilyacziya-dlya-novyh-paczientov/',
})[id];
const currentFile = (file) => URL_MAP.pages[file] ? URL_MAP.pages[file].slice(1) + 'index.html' : file;

// Templates retain their original relative links; normalize them to the current
// public URLs before writing, including assets and booking anchors.
function currentLinks(html, originalFile) {
  const resolve = (value) => {
    if (!value || /^(?:[a-z][\w+.-]*:|#|\/\/)/i.test(value)) return value;
    const [, pathname, suffix] = value.match(/^([^?#]*)(.*)$/);
    const key = pathname.startsWith('/') ? pathname.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(originalFile), pathname));
    return (URL_MAP.pages[key] || '/' + key) + suffix;
  };
  html = html.replace(/\b(href|src|poster)="([^"{}]+)"/g, (_, attr, value) => `${attr}="${resolve(value)}"`);
  return html.replace(/\bsrcset="([^"]+)"/g, (_, value) => `srcset="${value.split(',').map(part => {
    const [url, ...descriptor] = part.trim().split(/\s+/);
    return [resolve(url), ...descriptor].join(' ');
  }).join(', ')}"`);
}

const PROMOS = [
  {
    id: 'first-visit',
    title: 'Скидка до 20% на первый визит',
    label: 'Скидка до 20% на первый визит',
    num: { upto: true, value: '20%' },
    desc: 'В честь знакомства дарим скидку на любые услуги в первое посещение.',
    badge: 'Скидка до 20%',
    lead: 'В честь знакомства с вами дарим скидку до 20% на любые услуги клиники в первое посещение.',
    about: { h: 'О предложении', p: 'Скидка действует на любую процедуру или консультацию, если вы приходите в RA|RÉ впервые. Администратор подскажет точный размер скидки при записи.' },
    alt: 'Гостья в зоне ожидания клиники RA|RÉ',
    meta: 'Скидка до 20% на любые услуги при первом посещении клиники RA|RÉ в Анапе.',
  },
  {
    id: 'cleansing-peeling',
    img: 'cleansing',
    title: 'Чистка + пилинг + фотобиомодуляция',
    label: 'Чистка + пилинг + фотобиомодуляция',
    num: { value: '9 500', unit: '₽' },
    desc: 'Вместо 11 900 ₽ — выгода 2 400 ₽ на комплексе для свежести кожи.',
    badge: '9 500 ₽ вместо 11 900 ₽',
    lead: 'В ноябре комплекс «Чистка + Пилинг + Фотобиомодуляция» — 9 500 ₽ вместо 11 900 ₽. Выгода 2 400 ₽.',
    about: { h: 'О комплексе', p: 'Кожа очищается от загрязнений и ороговевших клеток, а фотобиомодуляция успокаивает и ускоряет восстановление, оставляя лицо свежим и ухоженным.' },
    list: { h: 'Что входит в комплекс', items: [
      'Чистка лица — убирает загрязнения и открывает поры.',
      'Пилинг — выравнивает рельеф и тон кожи.',
      'Фотобиомодуляция — успокаивает кожу и ускоряет восстановление.',
    ] },
    terms: 'Предложение действует в ноябре.',
    alt: 'Чистка лица в клинике RA|RÉ',
    meta: 'Чистка + пилинг + фотобиомодуляция за 9 500 ₽ вместо 11 900 ₽ в ноябре. Выгода 2 400 ₽ — RA|RÉ, Анапа.',
  },
  {
    id: 'biorevit-photo',
    img: 'glow',
    title: 'Биоревитализация + фотоомоложение',
    label: 'Биоревитализация + фотоомоложение',
    num: { value: '25 500', unit: '₽' },
    desc: 'Вместо 30 500 ₽ — выгода 5 000 ₽ на увлажнении и фотоомоложении.',
    badge: '25 500 ₽ вместо 30 500 ₽',
    lead: 'В ноябре комплекс «Биоревитализация + Фотоомоложение» — 25 500 ₽ вместо 30 500 ₽. Выгода 5 000 ₽.',
    about: { h: 'О комплексе', p: 'Кожа получает интенсивное увлажнение изнутри и импульсное омоложение снаружи, становясь более гладкой, увлажнённой и однородной по тону.' },
    list: { h: 'Что входит в комплекс', items: [
      'Биоревитализация — глубоко увлажняет кожу изнутри.',
      'Фотоомоложение на фотосистеме Nordlys — усиливает эффект и выравнивает тон.',
    ] },
    terms: 'Предложение действует в ноябре.',
    alt: 'Фотоомоложение на аппарате Nordlys в клинике RA|RÉ',
    meta: 'Биоревитализация + фотоомоложение за 25 500 ₽ вместо 30 500 ₽ в ноябре. Выгода 5 000 ₽ — RA|RÉ, Анапа.',
  },
  {
    id: 'rf-exosomes',
    img: 'rf-needling',
    title: 'Микроигольчатый RF + экзосомы + фотобиомодуляция',
    label: 'Микроигольчатый RF (2 зоны) + экзосомы + фотобиомодуляция',
    num: { value: '40 000', unit: '₽' },
    desc: 'Вместо 49 300 ₽ — выгода 9 300 ₽ на комплексе из трёх процедур.',
    badge: '40 000 ₽ вместо 49 300 ₽',
    lead: 'В ноябре микроигольчатый RF (2 зоны) + Экзосомы + Фотобиомодуляция — 40 000 ₽ вместо 49 300 ₽. Выгода 9 300 ₽.',
    about: { h: 'О комплексе', p: 'Комплекс глубоко обновляет кожу, запускает выработку коллагена и ускоряет восстановление, возвращая плотность, упругость и здоровое сияние.' },
    list: { h: 'Что входит в комплекс', items: [
      'Микроигольчатый RF, 2 зоны — запускает выработку коллагена.',
      'Экзосомы — запускают восстановление клеток.',
      'Фотобиомодуляция — закрепляет результат.',
    ] },
    terms: 'Предложение действует в ноябре.',
    alt: 'Микроигольчатый RF-лифтинг Sylfirm в клинике RA|RÉ',
    meta: 'Микроигольчатый RF (2 зоны) + экзосомы + фотобиомодуляция за 40 000 ₽ вместо 49 300 ₽ в ноябре — RA|RÉ, Анапа.',
  },
  {
    id: 'cashback',
    title: 'Кешбэк до 10% на всё',
    label: 'Кешбэк до 10% на всё',
    num: { upto: true, value: '10%' },
    desc: 'Копите рубли и оплачивайте ими до 100% стоимости процедуры.',
    badge: 'Кешбэк до 10%',
    lead: 'С каждой процедуры на ваш счёт в личном кабинете возвращается 3%, а при покупке подарочного сертификата от 5 000 ₽ — 10%. Оплачивайте кешбэком до 100% стоимости процедуры.',
    list: { h: 'Как это работает', items: [
      '3% от стоимости каждой процедуры возвращается на счёт в личном кабинете.',
      '10% — при покупке подарочного сертификата на сумму от 5 000 ₽.',
      'Кешбэк зачисляется сразу после оплаты, и его можно потратить уже на следующую процедуру.',
    ] },
    terms: 'Кешбэк не начисляется при покупке акционных предложений, комбо-процедур и абонементов на LPG-массаж. Оплатить кешбэком можно до 100% стоимости процедуры. Подарочным сертификатом с кешбэком может воспользоваться только пациент, который ещё не посещал клинику.',
    alt: 'Ресепшен клиники RA|RÉ',
    meta: 'Кешбэк 3% с каждой процедуры и 10% при покупке сертификата от 5 000 ₽ в клинике RA|RÉ, Анапа.',
  },
  {
    id: 'laser-combo',
    img: 'laser',
    title: 'Лазерная эпиляция с выгодой',
    label: 'Комбо на лазерную эпиляцию',
    num: { upto: true, value: '25%' },
    desc: 'Бикини, подмышки, ноги и руки — комплексом выгоднее, чем по отдельности.',
    badge: 'Скидка до 25%',
    lead: 'Скидки на лазерную эпиляцию до 25%: для вас действуют комбо-предложения на александритовом лазере Candela.',
    list: { h: 'Комбо-предложения', items: [
      'Бикини тотальное + подмышки — 4 300 ₽ вместо 5 900 ₽.',
      'Бикини тотальное + подмышки + голени — 8 700 ₽ вместо 10 900 ₽.',
      'Бикини тотальное + подмышки + ноги полностью — 11 600 ₽ вместо 14 600 ₽.',
      'Бикини тотальное + подмышки + ноги полностью + руки полностью — 14 900 ₽ вместо 19 300 ₽.',
      'Бикини тотальное + подмышки + лицо полностью — 6 800 ₽ вместо 8 600 ₽.',
    ] },
    alt: 'Лазерная эпиляция Candela в клинике RA|RÉ',
    meta: 'Комбо-предложения на лазерную эпиляцию Candela со скидкой до 25% — клиника RA|RÉ, Анапа.',
  },
  {
    id: 'peeling-course',
    img: 'peeling-course',
    title: 'Курс из 3 пилингов',
    label: 'Курс из 3 пилингов',
    num: { value: '15%' },
    desc: 'Скидка на весь курс из трёх процедур в ноябре.',
    badge: 'Скидка 15% на весь курс',
    lead: 'В ноябре скидка 15% на весь курс из 3 пилингов.',
    about: { h: 'О курсе', p: 'Регулярное отшелушивание обновляет кожу, выравнивает рельеф и тон, а курс усиливает результат от процедуры к процедуре.' },
    terms: 'Предложение действует в ноябре. Скидка 15% на весь курс из 3 пилингов.',
    alt: 'Нанесение состава кистью на кожу лица в клинике RA|RÉ',
    meta: 'Курс из 3 пилингов со скидкой 15% в ноябре — клиника RA|RÉ, Анапа.',
  },
  {
    id: 'laser-new',
    img: 'laser-new',
    title: 'Лазерная эпиляция для новых пациентов',
    label: 'Лазерная эпиляция для новых пациентов',
    num: { value: '30%' },
    desc: 'Скидка для новых пациентов при обработке от двух зон.',
    badge: 'Скидка 30%',
    lead: 'В ноябре скидка 30% на лазерную эпиляцию для новых пациентов при обработке от двух зон.',
    about: { h: 'О предложении', p: 'Стойкое уменьшение нежелательных волос с первого курса, а скидка делает знакомство с процедурой максимально выгодным.' },
    terms: 'Предложение действует в ноябре. Скидка 30% для новых пациентов при обработке от двух зон.',
    alt: 'Лазерная эпиляция зоны ног в клинике RA|RÉ',
    meta: 'Лазерная эпиляция со скидкой 30% для новых пациентов при обработке от двух зон в ноябре — RA|RÉ, Анапа.',
  },
];

// Which promo a procedure page shows in its single-banner slot.
const PROCEDURE_PROMO = {
  'services/procedures/smas-lifting.html': 'first-visit',
  'services/procedures/rf-volnewmer.html': 'first-visit',
  'services/procedures/laser-epilation.html': 'laser-combo',
};

const imgBase = (p) => `promo-${p.img || p.id}`;

/* ── helpers ─────────────────────────────────────────────────────────── */

// The number on a card: «до» and «₽» are set smaller than the figure so a
// long price still fits the panel and the figure stays the thing you read.
function numHTML(p) {
  if (p.num.unit) return `<span class="promo-price">${p.num.value}<span class="promo-unit">${p.num.unit}</span></span>`;
  const upto = p.num.upto ? '<span class="promo-upto">до</span>' : '';
  return `${upto}${p.num.value}`;
}

const ARR14 = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 1.5L1 12.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M6 1H12C12.5 1 12.7 1 12.85 1.15C13 1.3 13 1.5 13 2V8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARR20 = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M18 6H10M18 6V14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARR_MH = '<svg class="mh-arrow" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const landscape = (p, pre, sizes) =>
  p.photo ? `src="/assets/photos/${p.photo}"` : `src="${pre}assets/photos/${imgBase(p)}.webp" srcset="${pre}assets/photos/${imgBase(p)}-650.webp 650w, ${pre}assets/photos/${imgBase(p)}-1250.webp 1250w, ${pre}assets/photos/${imgBase(p)}.webp 2000w" sizes="${sizes}"`;
const portrait = (p, pre) =>
  p.photo ? `src="/assets/photos/${p.photo}"` : `src="${pre}assets/photos/${imgBase(p)}-m.webp" srcset="${pre}assets/photos/${imgBase(p)}-m-350.webp 350w, ${pre}assets/photos/${imgBase(p)}-m-700.webp 700w, ${pre}assets/photos/${imgBase(p)}-m.webp 1050w" sizes="(max-width: 767px) 350px, 350px"`;

const indent = (s, n) => s.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');

/* ── markup per spot ─────────────────────────────────────────────────── */

// promos.html desktop grid and the "other promos" grid on detail pages
const tile = (p, pre, hrefPre) => `<a href="${promoURL(p.id)}" class="promo-tile">
  <img ${landscape(p, pre, '(max-width: 767px) 350px, (max-width: 1024px) 624px, 572px')} alt="${p.alt}" class="promo-tile__img" loading="lazy"/>
  <div class="promo-tile__panel">
    <div class="promo-tile__top">
      <p class="promo-tile__title">${p.label}</p>
      <span class="promo-tile__arr">${ARR14}</span>
    </div>
    <div class="promo-tile__body">
      <p class="promo-tile__num">${numHTML(p)}</p>
      <p class="promo-tile__desc">${p.desc}</p>
    </div>
  </div>
</a>`;

// promos.html / services.html / procedure pages — mobile card
const mhCard = (p, pre, hrefPre) => `<a href="${promoURL(p.id)}" class="mh-promo-card">
  <img ${portrait(p, pre)} alt="${p.alt}" loading="lazy"/>
  <div class="mh-promo-card__panel">
    <div class="mh-promo-card__head">
      <p class="mh-promo-card__label">${p.label}</p>
      <span class="mh-promo-arr">${ARR14}</span>
    </div>
    <div class="mh-promo-card__body">
      <p class="mh-promo-card__pct">${numHTML(p)}</p>
      <p class="mh-promo-card__desc">${p.desc}</p>
    </div>
  </div>
</a>`;

// wide banner strip (home, services, procedure pages)
const banner = (p, pre, hrefPre) => `<div class="promo-banner">
  <img class="promo-banner__photo" ${landscape(p, pre, '(max-width: 1024px) 624px, 1170px')} alt="${p.alt}" loading="lazy"/>
  <a href="${promoURL(p.id)}" class="promo-banner__card">
    <div class="promo-banner__top">
      <p class="promo-banner__label">${p.label}</p>
      <span class="promo-banner__arr" aria-hidden="true">
        ${ARR20}
      </span>
    </div>
    <div class="promo-banner__bottom">
      <p class="promo-banner__pct">${numHTML(p)}</p>
      <p class="promo-banner__desc">${p.desc}</p>
    </div>
  </a>
</div>`;

// home page mobile carousel slide
const mhSlide = (p) => `<a href="${promoURL(p.id)}" class="mh-promo-slide">
  <div class="mh-promo-imgwrap">
    <img ${portrait(p, '')} alt="" loading="lazy"/>
  </div>
  <div class="mh-promo-card">
    <div class="mh-promo-card-head">
      <p class="mh-promo-card-label">${p.label}</p>
      <span class="mh-promo-arr">${ARR_MH}</span>
    </div>
    <div class="mh-promo-card-body">
      <p class="mh-promo-card-pct">${numHTML(p)}</p>
      <p class="mh-promo-card-desc">${p.desc}</p>
    </div>
  </div>
</a>`;

// mobile "other promos" card on a detail page
const mhOther = (p) => `<a href="${promoURL(p.id)}" class="mh-promo-others__card">
  <img ${portrait(p, '../')} alt="${p.alt}" loading="lazy"/>
  <div class="mh-promo-others__panel">
    <div class="mh-promo-others__head">
      <p class="mh-promo-others__title">${p.label}</p>
      <span class="mh-promo-others__arr">${ARR14}</span>
    </div>
    <div class="mh-promo-others__body">
      <p class="mh-promo-others__num">${numHTML(p)}</p>
      <p class="mh-promo-others__desc">${p.desc}</p>
    </div>
  </div>
</a>`;

/* ── replace the inside of a <div> found by its opening tag ──────────── */

function replaceDivInner(html, openTag, inner, file) {
  const start = html.indexOf(openTag);
  if (start < 0) throw new Error(`${file}: not found — ${openTag}`);
  const bodyStart = start + openTag.length;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = bodyStart;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) break;
  }
  if (depth !== 0) throw new Error(`${file}: unbalanced — ${openTag}`);
  // keep the indentation of the closing tag
  const lineStart = html.lastIndexOf('\n', m.index) + 1;
  const closeIndent = html.slice(lineStart, m.index);
  const childIndent = closeIndent.length + 2;
  return html.slice(0, bodyStart) + '\n' + indent(inner, childIndent) + '\n' + closeIndent + html.slice(m.index);
}

function edit(file, fn) {
  const p = path.join(ROOT, currentFile(file));
  const before = fs.readFileSync(p, 'utf8');
  const after = currentLinks(fn(before), file);
  if (after !== before) fs.writeFileSync(p, after);
  console.log((after !== before ? 'updated ' : 'unchanged ') + file);
}

const all = (fn) => PROMOS.map(fn).join('\n');

/* ── listing / banner spots ──────────────────────────────────────────── */

edit('promos.html', (h) => {
  h = replaceDivInner(h, '<div class="promos-grid">', all((p) => tile(p, '', 'promos/')), 'promos.html');
  h = replaceDivInner(h, '<div class="mh-promos-cards">', all((p) => mhCard(p, '', 'promos/')), 'promos.html');
  return h;
});

edit('index.html', (h) => {
  h = replaceDivInner(h, '<div class="promo-banner-strip" id="promo-banner-strip">', all((p) => banner(p, '', 'promos/')), 'index.html');
  h = replaceDivInner(h, '<div class="mh-carousel-track" id="mh-promo-track">', all(mhSlide), 'index.html');
  return h;
});

edit('services.html', (h) => {
  h = replaceDivInner(h, '<div class="promo-banner-strip" id="promo-banner-strip-desktop">', all((p) => banner(p, '', 'promos/')), 'services.html');
  h = replaceDivInner(h, '<div class="mh-promos-cards" id="mh-promos-cards">', all((p) => mhCard(p, '', 'promos/')), 'services.html');
  return h;
});

for (const [file, id] of Object.entries(PROCEDURE_PROMO)) {
  const p = PROMOS.find((x) => x.id === id);
  edit(file, (h) => {
    h = replaceDivInner(h, '<div class="promo-banner-strip" id="promo-banner-strip-desktop">', banner(p, '../../', '../../promos/'), file);
    h = replaceDivInner(h, '<div class="mh-promos-cards" id="mh-promos-cards" data-rr="scale">', mhCard(p, '../../', '../../promos/'), file);
    return h;
  });
}

/* ── detail pages ────────────────────────────────────────────────────── */

const TEMPLATE = path.join(ROOT, 'promo-detail.template.html');
const tpl = fs.readFileSync(TEMPLATE, 'utf8');

const listHTML = (items, cls) => items.map((t, i) =>
  `<div class="${cls}"><b>${String(i + 1).padStart(2, '0')}.</b><p>${t}</p></div>`).join('\n');

function detail(p) {
  const others = PROMOS.filter((x) => x.id !== p.id).slice(0, 2);
  const cta = (href) => `<a href="${href}" class="promo-offer__cta">Записаться
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18L18 6M18 6H10M18 6V14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>`;
  const blocks = [];
  if (p.about) blocks.push(`<div class="promo-info__block">
  <h2>${p.about.h}</h2>
  <p>${p.about.p}</p>
</div>`);
  if (p.list) blocks.push(`<div class="promo-info__block">
  <h2>${p.list.h}</h2>
  <div class="promo-info__list">
${indent(listHTML(p.list.items, 'promo-info__item'), 4)}
  </div>
</div>`);
  if (p.terms) blocks.push(`<div class="promo-info__block promo-info__terms">
  <h2>Условия акции</h2>
  <p>${p.terms}</p>
</div>`);

  const mhBlocks = [];
  if (p.about) mhBlocks.push(`<section class="mh-promo-details">
  <h2>${p.about.h}</h2>
  <p>${p.about.p}</p>
</section>`);
  if (p.list) mhBlocks.push(`<section class="mh-promo-adv">
  <h2>${p.list.h}</h2>
  <div class="mh-promo-adv__list">
${indent(listHTML(p.list.items, 'mh-promo-adv__row'), 4)}
  </div>
</section>`);
  if (p.terms) mhBlocks.push(`<section class="mh-promo-terms">
  <h2>Условия акции</h2>
  <p>${p.terms}</p>
</section>`);

  const body = `<section class="promo-title"><div class="wrap">
  <h1>${p.title}</h1>
</div></section>

<section class="promo-offer"><div class="wrap">
  <div class="promo-offer__layout">
    <div class="promo-offer__text">
      <p class="promo-offer__badge">${p.badge}</p>
      <p class="promo-offer__desc">${p.lead}</p>
      ${cta('../index.html#booking')}
    </div>
    <div class="promo-offer__media">
      <img ${landscape(p, '../', '(max-width: 767px) 350px, (max-width: 1024px) 336px, 632px')} alt="${p.alt}"/>
    </div>
  </div>
</div></section>

<section class="promo-info">
  <div class="wrap">
${indent(blocks.join('\n'), 4)}
  </div>
</section>

<section class="promo-others"><div class="wrap">
  <h2>Другие действующие акции</h2>
  <div class="promo-others__grid">
${indent(others.map((o) => tile(o, '../', '')).join('\n'), 4)}
  </div>
</div></section>

<div class="mh-promo">
  <section class="mh-promo-hero">
    <div class="mh-promo-hero__img">
      <img ${landscape(p, '../', '(max-width: 767px) 350px, 632px')} alt="${p.alt}"/>
    </div>
    <div class="mh-promo-hero__content">
      <span class="mh-promo-badge">${p.badge}</span>
      <h1>${p.title}</h1>
      <p>${p.lead}</p>
      <a href="../index.html#booking-mobile" class="mh-promo-hero__cta">Записаться</a>
    </div>
  </section>

${indent(mhBlocks.join('\n\n'), 2)}

  <section class="mh-promo-others">
    <h2>Другие действующие акции</h2>
    <div class="mh-promo-others__list">
${indent(others.map(mhOther).join('\n'), 6)}
    </div>
  </section>
</div>

`;
  return tpl
    .replace('{{TITLE}}', `${p.title} — акция клиники RA|RÉ в Анапе`)
    .replace('{{META}}', p.meta)
    .replace('{{CANONICAL}}', `https://rare-anapa.ru${promoURL(p.id)}`)
    .replace('{{BODY}}\n', body);
}

for (const p of PROMOS) {
  const output = path.join(ROOT, promoURL(p.id), 'index.html');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, currentLinks(detail(p), `promos/${p.id}.html`));
  console.log(`wrote promos/${p.id}.html`);
}
