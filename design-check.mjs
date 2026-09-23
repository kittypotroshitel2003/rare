/**
 * Проверка вёрстки: гоняет страницы по набору ширин и ищет то, что бросается
 * в глаза сразу — переполнение, обрезанный текст, растянутые картинки,
 * наложение декора на текст, мелкие цели нажатия, мёртвую пагинацию.
 *
 *   node design-check.mjs                     все страницы, все ширины
 *   node design-check.mjs --width=820         одна ширина
 *   node design-check.mjs --page=index        одна страница
 *   node design-check.mjs --json              машиночитаемый вывод
 *
 * Выходной код 1, если есть ошибки (предупреждения код не меняют).
 */

import puppeteer from 'puppeteer';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const PAGES = [
  'index', 'about', 'services', 'prices', 'promos', 'certificates', 'legal',
  'specialists/index', 'reviews/index',
  'specialists/yana-vladimirovna', 'specialists/mariya-viktorovna',
  'services/procedures/smas-lifting', 'services/procedures/laser-epilation',
  'services/procedures/botulinoterapiya', 'services/procedures/cleansing',
  'promos/smas-lifting',
  'articles/index', 'articles/article-hair-loss', 'articles/article-office-syndrome',
];
const WIDTHS = [375, 430, 768, 820, 1024, 1100, 1200, 1440];
/** ниже этой ширины считаем экран сенсорным — там важен размер целей нажатия */
const TOUCH_MAX = 1024;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const widths = args.width ? [Number(args.width)] : WIDTHS;
const pages = args.page ? [args.page] : PAGES;

/* ---------------------------------------------------------------------------
   Проверки выполняются внутри страницы: здесь нет доступа к Node,
   только к DOM. Возвращаем плоский список находок.
   -------------------------------------------------------------------------- */
function collectFindings(touch) {
  const found = [];
  const add = (level, check, message, el) =>
    found.push({ level, check, message, el: el ? describe(el) : null });

  function describe(el) {
    const cls = (el.className || '').toString().trim().split(/\s+/)[0];
    let out = el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '');
    // без класса по тегу не найти — дописываем файл или родителя
    if (!el.id && !cls) {
      if (el.tagName === 'IMG' && el.currentSrc) out += ' [' + el.currentSrc.split('/').pop() + ']';
      else if (el.parentElement) {
        const pc = (el.parentElement.className || '').toString().trim().split(/\s+/)[0];
        if (pc) out += ' в .' + pc;
      }
    }
    return out;
  }

  function visible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false;
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  }

  /** есть ли выше по дереву предок, который обрезает содержимое */
  function clippedByAncestor(el) {
    let n = el.parentElement;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (/hidden|auto|scroll|clip/.test(cs.overflowX + cs.overflowY)) return true;
      n = n.parentElement;
    }
    return false;
  }

  const all = Array.prototype.slice.call(document.body.querySelectorAll('*'));
  const shown = all.filter(visible);

  /* 1. Переполнение страницы по горизонтали */
  if (document.documentElement.scrollWidth > window.innerWidth + 1) {
    add(
      'ошибка',
      'переполнение',
      'страница шире окна: ' + document.documentElement.scrollWidth + ' при ' + window.innerWidth
    );
  }

  /* 2. Элементы, вылезшие за край окна и ничем не обрезанные */
  shown.forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') return;
    if (cs.pointerEvents === 'none') return; // декору выходить за кадр можно
    // интересен только смысловой слой: текст и то, на что нажимают
    const meaningful =
      /^(H1|H2|H3|H4|P|A|BUTTON|INPUT|SELECT|LABEL|LI)$/.test(el.tagName) &&
      (el.textContent || '').trim().length > 1;
    if (!meaningful) return;
    const b = el.getBoundingClientRect();
    const out = Math.round(Math.max(b.right - window.innerWidth, -b.left));
    if (out > 2 && !clippedByAncestor(el)) {
      add('внимание', 'за краем', 'выходит за край окна на ' + out + ' px', el);
    }
  });

  /* 3. Обрезанный текст. Проверяем только сами подписи, а не контейнеры:
        у лент и кадров обрезка — это приём, а не ошибка. */
  const TEXT_TAGS = /^(H1|H2|H3|H4|P|SPAN|A|BUTTON|LI|DT|DD|LABEL|FIGCAPTION)$/;
  shown.forEach((el) => {
    if (!TEXT_TAGS.test(el.tagName)) return;
    if (el.querySelector('img, video, picture, svg')) return;
    const cs = getComputedStyle(el);
    if (!/hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY) && cs.textOverflow !== 'ellipsis') return;
    if (!(el.textContent || '').trim()) return;
    const dx = el.scrollWidth - el.clientWidth;
    const dy = el.scrollHeight - el.clientHeight;
    if (dx > 2) add('ошибка', 'обрезан текст', 'текст не влезает по ширине на ' + dx + ' px', el);
    else if (dy > 2 && !/auto|scroll/.test(cs.overflowY)) {
      add('ошибка', 'обрезан текст', 'текст не влезает по высоте на ' + dy + ' px', el);
    }
  });

  /* 4. Картинки: битые и растянутые */
  Array.prototype.slice.call(document.images).forEach((img) => {
    if (!visible(img)) return;
    if (img.complete && img.naturalWidth === 0) {
      add('ошибка', 'битая картинка', 'не загрузилась: ' + (img.currentSrc || img.src), img);
      return;
    }
    if (!img.naturalWidth || !img.naturalHeight) return;
    const fit = getComputedStyle(img).objectFit;
    if (fit !== 'fill' && fit !== 'none') return; // cover и contain пропорции не ломают
    // offsetWidth/Height не учитывают transform: иначе повёрнутые стрелки
    // выглядят как растянутые
    const w = img.offsetWidth;
    const h = img.offsetHeight;
    if (w < 24 || h < 24) return; // иконки меряем на глаз, не здесь
    const shownRatio = w / h;
    const realRatio = img.naturalWidth / img.naturalHeight;
    const off = Math.abs(shownRatio - realRatio) / realRatio;
    if (off > 0.08) {
      add(
        'ошибка',
        'пропорции картинки',
        'растянута на ' + Math.round(off * 100) + '%: показана ' + shownRatio.toFixed(2) + ', файл ' + realRatio.toFixed(2),
        img
      );
    }
  });

  /* 5. Декор поверх текста.
        Декор в этом проекте помечен pointer-events: none — по нему и ищем. */
  const texts = Array.prototype.slice
    .call(document.querySelectorAll('h1, h2, h3, .h1, .h2, .h3, button, .btn, a'))
    .filter((el) => visible(el) && (el.textContent || '').trim().length > 1);

  /** цепочка предков с ключами «z-index + позиция среди соседей» */
  function stack(el) {
    const chain = [];
    let n = el;
    while (n && n !== document.body && n.parentElement) {
      const cs = getComputedStyle(n);
      chain.unshift({
        node: n,
        z: cs.zIndex === 'auto' ? 0 : Number(cs.zIndex) || 0,
        i: Array.prototype.indexOf.call(n.parentElement.children, n),
      });
      n = n.parentElement;
    }
    return chain;
  }

  /** рисуется ли a поверх b */
  function paintsAbove(a, b) {
    const A = stack(a);
    const B = stack(b);
    let k = 0;
    while (k < A.length && k < B.length && A[k].node === B[k].node) k++;
    if (k >= A.length || k >= B.length) return false; // один внутри другого
    if (A[k].z !== B[k].z) return A[k].z > B[k].z;
    return A[k].i > B[k].i;
  }

  const decor = shown.filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.pointerEvents !== 'none' || cs.position !== 'absolute') return false;
    if (Number(cs.opacity) <= 0.5) return false;
    // только слои, которые что-то рисуют: обёртки-контейнеры не в счёт
    return el.tagName === 'IMG' || el.tagName === 'SVG' || cs.backgroundImage !== 'none';
  });

  /** прямоугольник по самим строкам текста, а не по блоку-контейнеру */
  function inkRect(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const list = Array.prototype.slice.call(r.getClientRects()).filter((x) => x.width && x.height);
    if (!list.length) return el.getBoundingClientRect();
    return {
      left: Math.min.apply(null, list.map((x) => x.left)),
      right: Math.max.apply(null, list.map((x) => x.right)),
      top: Math.min.apply(null, list.map((x) => x.top)),
      bottom: Math.max.apply(null, list.map((x) => x.bottom)),
      get width() { return this.right - this.left; },
      get height() { return this.bottom - this.top; },
    };
  }

  /** какая доля наложения приходится на непрозрачные пиксели картинки.
      У вырезок вроде игрока прямоугольник охвата почти весь прозрачный,
      и без этой проверки любой заголовок рядом считался бы перекрытым. */
  const probe = document.createElement('canvas');
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  function opaqueShare(img, box, ov) {
    if (img.tagName !== 'IMG' || !img.naturalWidth) return 1;
    const W = Math.min(img.naturalWidth, 160);
    const H = Math.min(img.naturalHeight, 160);
    let data;
    try {
      probe.width = W;
      probe.height = H;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      data = ctx.getImageData(0, 0, W, H).data;
    } catch (e) {
      return 1; // не смогли прочитать — считаем непрозрачной
    }
    let opaque = 0;
    let total = 0;
    for (let gy = 0; gy < 6; gy++) {
      for (let gx = 0; gx < 6; gx++) {
        const px = ov.left + (ov.right - ov.left) * ((gx + 0.5) / 6);
        const py = ov.top + (ov.bottom - ov.top) * ((gy + 0.5) / 6);
        const u = (px - box.left) / box.width;
        const v = (py - box.top) / box.height;
        if (u < 0 || u > 1 || v < 0 || v > 1) continue;
        total++;
        const ix = Math.min(W - 1, Math.floor(u * W));
        const iy = Math.min(H - 1, Math.floor(v * H));
        if (data[(iy * W + ix) * 4 + 3] > 40) opaque++;
      }
    }
    return total ? opaque / total : 1;
  }

  /** повёрнут ли элемент или его предки: у таких прямоугольник охвата врёт */
  function rotated(el) {
    let n = el;
    while (n && n !== document.body) {
      const t = getComputedStyle(n).transform;
      if (t && t !== 'none') {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m) {
          const v = m[1].split(',').map(Number);
          if (Math.abs(v[1]) > 0.02 || Math.abs(v[2]) > 0.02) return true;
        } else if (/rotate|matrix3d/.test(t)) return true;
      }
      n = n.parentElement;
    }
    return false;
  }

  texts.forEach((t) => {
    const a = inkRect(t);
    const area = a.width * a.height;
    if (!area) return;
    decor.forEach((d) => {
      if (d.contains(t) || t.contains(d)) return;
      if (!paintsAbove(d, t)) return; // лежит под текстом — не мешает
      if (rotated(d)) return; // у повёрнутого слоя охват не совпадает с картинкой
      const b = d.getBoundingClientRect();
      const ov = {
        left: Math.max(a.left, b.left),
        right: Math.min(a.right, b.right),
        top: Math.max(a.top, b.top),
        bottom: Math.min(a.bottom, b.bottom),
      };
      const w = ov.right - ov.left;
      const h = ov.bottom - ov.top;
      if (w <= 0 || h <= 0) return;
      const share = ((w * h) / area) * opaqueShare(d, b, ov);
      if (share > 0.3) {
        add(
          'внимание',
          'декор на тексте',
          describe(d) + ' закрывает ' + Math.round(share * 100) + '% строки «' + (t.textContent || '').trim().slice(0, 28) + '»',
          t
        );
      }
    });
  });

  /* 6. Размер целей нажатия на сенсорных ширинах */
  if (touch) {
    Array.prototype.slice
      .call(document.querySelectorAll('a, button, input, select, [role="tab"]'))
      .filter(visible)
      .forEach((el) => {
        const b = el.getBoundingClientRect();
        if (getComputedStyle(el).display === 'inline') return; // ссылка в строке текста
        if (Math.min(b.width, b.height) >= 24) return;
        if (Math.max(b.width, b.height) >= 48) return; // широкая ссылка — по ней попасть легко
        add('внимание', 'цель нажатия', Math.round(b.width) + '×' + Math.round(b.height) + ' — меньше 24 px', el);
      });
  }

  /* 7. Пагинация: точек больше, чем реальных положений ленты */
  Array.prototype.slice.call(document.querySelectorAll('[data-slider]')).forEach((slider) => {
    const track = slider.querySelector('[data-slider-track]');
    const dots = Array.prototype.slice
      .call(slider.querySelectorAll('[data-slider-dot]'))
      .filter((d) => !d.hidden && visible(d));
    if (!track || !dots.length) return;
    // прямые дети могут быть display: contents — тогда слайды уровнем ниже
    let slides = Array.prototype.filter.call(track.children, (c) => c.getBoundingClientRect().width > 0);
    if (!slides.length) {
      slides = [];
      Array.prototype.forEach.call(track.children, (c) =>
        Array.prototype.push.apply(slides, Array.prototype.slice.call(c.children))
      );
    }
    if (!slides.length) return;
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
    const step = slides[0].getBoundingClientRect().width + gap;
    const maxShift = Math.max(0, track.scrollWidth - track.parentElement.clientWidth - 4);
    const realPages =
      step < 10 ? slides.length : Math.max(1, Math.min(slides.length, Math.ceil(maxShift / step) + 1));
    if (dots.length !== realPages) {
      add(
        'ошибка',
        'пагинация',
        'точек ' + dots.length + ', а положений ленты ' + realPages,
        slider
      );
    }
  });

  /* 8. Неиспользованная ширина: блок прижат влево и не добирает ширину
        родителя. Так вылезали лента форматов (786 из 1020) и список слотов
        (535 из 1020) — справа оставалась мёртвая полоса. */
  shown.forEach((el) => {
    if (el.childElementCount < 2) return;
    if (!(el.textContent || '').trim()) return; // обёртки логотипов и иконок узкие по делу
    const parent = el.parentElement;
    if (!parent || parent === document.body) return;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') return;
    if (cs.float !== 'none') return;
    const ps = getComputedStyle(parent);
    // интересуют только блоки в обычном потоке колонки или блока
    if (/flex|grid/.test(ps.display) && ps.flexDirection !== 'column') return;

    const pb = parent.getBoundingClientRect();
    const inner = {
      left: pb.left + parseFloat(ps.paddingLeft),
      right: pb.right - parseFloat(ps.paddingRight),
    };
    const width = inner.right - inner.left;
    if (width < 400) return; // на узких экранах полоса незаметна

    // сегментированные переключатели и пилюли узкие по замыслу.
    // Определяем их по разметке, а не по скруглению: форма кнопок менялась.
    if (parseFloat(cs.borderTopLeftRadius) > 24) return;
    if (el.matches('[role="tablist"], [data-switch]')) return;
    if (el.querySelector(':scope > [aria-selected], :scope > [aria-pressed]')) return;
    if (/^inline/.test(cs.display)) return;

    const b = el.getBoundingClientRect();
    if (b.left - inner.left > 8) return; // блок не прижат влево — возможно, он центрирован
    const unused = inner.right - b.right;
    if (unused > width * 0.2) {
      add(
        'внимание',
        'пустая полоса',
        'занимает ' + Math.round((b.width / width) * 100) + '% ширины, справа пусто ' + Math.round(unused) + ' px',
        el
      );
    }
  });

  /* 8. Сетка: левый край текста в секциях должен совпадать */
  const edges = [];
  Array.prototype.slice.call(document.querySelectorAll('body > section, body > footer, body > div > section')).forEach((sec) => {
    const lefts = Array.prototype.slice
      .call(sec.querySelectorAll('h2, .h2'))
      .filter((el) => {
        if (!visible(el) || !(el.textContent || '').trim()) return false;
        const cs = getComputedStyle(el);
        if (cs.textAlign === 'center' || cs.textAlign === 'right') return false;
        let n = el;
        while (n && n !== sec) {
          const ns = getComputedStyle(n);
          // абсолютные слои живут по своим координатам
          if (ns.position === 'absolute') return false;
          // родитель центрирует коробку заголовка — это не сбитая сетка
          if (/flex|grid/.test(ns.display) && ns.alignItems === 'center' && ns.flexDirection === 'column') return false;
          // заголовок внутри карточки отбит её внутренним полем
          if (ns.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(ns.borderTopLeftRadius) > 8) return false;
          n = n.parentElement;
        }
        return true;
      })
      .map((el) => Math.round(el.getBoundingClientRect().left));
    if (!lefts.length) return;
    edges.push({ sec, left: Math.min.apply(null, lefts) });
  });

  if (edges.length > 2) {
    const counts = {};
    edges.forEach((e) => (counts[e.left] = (counts[e.left] || 0) + 1));
    const common = Number(
      Object.keys(counts).sort((a, b) => counts[b] - counts[a] || Number(a) - Number(b))[0]
    );
    edges.forEach((e) => {
      if (Math.abs(e.left - common) > 4) {
        add(
          'внимание',
          'сетка',
          'левый край ' + e.left + ' px, у большинства секций ' + common + ' px',
          e.sec
        );
      }
    });
  }

  return found;
}

/* ------------------------------ прогон ------------------------------------ */

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const report = [];

for (const width of widths) {
  for (const name of pages) {
    await page.setViewport({ width, height: 900 });
    await page.goto(`${BASE}/${name}.html`, { waitUntil: 'load', timeout: 60000 });
    // гасим вступительную анимацию и раскрываем всё, что появляется по скроллу,
    // иначе половина страницы измеряется в смещённом состоянии
    await page.evaluate(() => {
      document.body.classList.add('screenshot-mode');
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => i.setAttribute('loading', 'eager'));
    });
    await new Promise((r) => setTimeout(r, 900));

    const findings = await page.evaluate(collectFindings, width <= TOUCH_MAX);
    findings.forEach((f) => report.push({ width, page: name, ...f }));
  }
}

await browser.close();

/* ------------------------------ вывод ------------------------------------- */

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const errors = report.filter((r) => r.level === 'ошибка');
  const warns = report.filter((r) => r.level === 'внимание');

  const print = (list, title) => {
    if (!list.length) return;
    console.log('\n' + title + ' — ' + list.length);
    const byWidth = {};
    list.forEach((r) => ((byWidth[r.width] = byWidth[r.width] || []).push(r)));
    Object.keys(byWidth)
      .sort((a, b) => a - b)
      .forEach((w) => {
        console.log('\n  ширина ' + w);
        const seen = new Set();
        byWidth[w].forEach((r) => {
          const key = r.page + r.check + r.message + r.el;
          if (seen.has(key)) return;
          seen.add(key);
          console.log(
            '    ' + r.page.padEnd(24) + r.check.padEnd(20) + (r.el ? r.el.padEnd(30) : ''.padEnd(30)) + r.message
          );
        });
      });
  };

  print(errors, 'ОШИБКИ');
  print(warns, 'ВНИМАНИЕ');

  console.log(
    '\nПроверено: ' + pages.length + ' стр. × ' + widths.length + ' ширин. ' +
      'Ошибок: ' + errors.length + ', предупреждений: ' + warns.length + '.'
  );
}

process.exit(report.some((r) => r.level === 'ошибка') ? 1 : 0);
