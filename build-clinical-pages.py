"""Build the three clinical pages updated in November 2026.
Content source: content/clinical-pages-2026-11.json (supplied clinic documents).
Run from the repository root: python3 build-clinical-pages.py
"""
from pathlib import Path
import json,re,html
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'content/clinical-pages-2026-11.json').read_text())
URL='/uslugi/udalenie-fillerov-pod-kontrolem-uzi/'
esc=lambda s:html.escape(s,quote=True)

def image(name,alt,loading='lazy'):
 return f'<img src="/assets/photos/{name}-1024.webp" srcset="/assets/photos/{name}-400.webp 400w, /assets/photos/{name}-700.webp 700w, /assets/photos/{name}-1024.webp 1024w" sizes="(max-width: 767px) calc(100vw - 40px), 44vw" alt="{esc(alt)}" loading="{loading}" decoding="async" width="1024" height="1536"/>'

def section_replace(s,cls,new):
 pattern=r'<section class="'+re.escape(cls)+r'(?: [^"]*)?"[^>]*>[\s\S]*?</section>'
 s,n=re.subn(pattern,lambda m:new,s,count=1);assert n==1,cls
 return s

def schema(s,objects):
 s=re.sub(r'<script type="application/ld\+json">[\s\S]*?</script>\s*','',s)
 s=re.sub(r'<!-- (?:/?schema:auto)[^>]*-->\s*','',s)
 return s.replace('</head>','<script type="application/ld+json">'+json.dumps(objects,ensure_ascii=False,indent=2)+'</script>\n</head>')

def metadata(s,title,description,url):
 s=re.sub(r'<title>.*?</title>','<title>'+esc(title)+'</title>',s)
 s=re.sub(r'<meta name="description" content="[^"]*"\s*/>',lambda m:'<meta name="description" content="'+esc(description)+'"/>',s)
 return re.sub(r'<link rel="canonical" href="[^"]*"\s*/>',lambda m:'<link rel="canonical" href="https://rare-anapa.ru'+url+'"/>',s)

def faq_pairs(paragraphs):
 out=[]
 for p in paragraphs:
  if p.endswith('?'):out.append([p,[]])
  elif out:out[-1][1].append(p)
 return out

def faq_cards(pairs,mobile=False):
 cards=[]
 for i,(q,ans) in enumerate(pairs):
  prefix='mh-svc-faq-card' if mobile else 'svc-faq-card'
  classes=prefix+(' svc-faq-card' if mobile else '')
  extra=lambda part:' svc-faq-card__'+part if mobile else ''
  cards.append(f'''<div class="{classes}"><span class="svc-faq-card__bar"></span><div class="svc-faq-card__body">
<button type="button" class="{prefix}__q{extra('q')}"><span class="svc-faq-card__q-text">{esc(q)}</span><span class="{prefix}__toggle{extra('toggle')}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></span></button>
<div class="{prefix}__a{extra('a')}">{''.join('<p>'+esc(p)+'</p>' for p in ans)}</div></div></div>''')
 return ''.join(cards)

def faq_schema(pairs):
 return {'@type':'FAQPage','mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':'\n\n'.join(a)}} for q,a in pairs]}

def build_filler():
 p=D['filler'];title=p[0];intro=p[1:3];bullets=p[3:7]
 ah=p.index('Зачем нужен УЗ-контроль при удалении филлеров');ih=p.index('Показания');ch=p.index('Противопоказания');ph=p.index('Стоимость удаления филлеров под контролем УЗИ');fh=p.index('Частые вопросы об удалении филлеров')
 indications=p[ih+1:ch];contra=p[ch+1:ph];faqs=faq_pairs(p[fh+1:])
 s=(ROOT/'uslugi/ultrazvukovaya-diagnostika/index.html').read_text()
 s=s.replace('page--service-procedure','page--service-procedure page--filler-removal')
 # Current page body class can differ across service templates.
 s=s.replace('<body class="page page--inner">','<body class="page page--inner page--filler-removal">')
 if 'page--filler-removal' not in s:s=s.replace('<body class="','<body class="page--filler-removal ',1)
 s=metadata(s,title+' | RA|RÉ','Удаление гиалуронового филлера под контролем УЗИ в RA|RÉ, Анапа. Оценка расположения препарата, прицельная коррекция, показания, стоимость и консультация врача.',URL)
 for mobile in [False,True]:
  pre='mh-svc' if mobile else 'svc';anchor='#booking-mobile' if mobile else '#booking'
  nav=f'<nav class="{pre}-breadcrumb" aria-label="Хлебные крошки"><a href="/">Главная</a><span>›</span><a href="/uslugi/">Услуги</a><span>›</span><span>Удаление филлеров под контролем УЗИ</span></nav>'
  text=f'<h1 class="{pre}-hero__title">{esc(title)}</h1><div class="{pre}-hero__desc">'+''.join('<p>'+esc(t)+'</p>' for t in intro)+'</div>'
  text+=f'<ul class="{pre}-hero__bullets">'+''.join('<li>'+esc(t)+'</li>' for t in bullets)+'</ul>'
  cta=f'<a href="{anchor}" class="'+('mh-btn-primary' if mobile else 'pill-btn hero__cta')+'">Записаться на консультацию</a>'
  media=f'<div class="{pre}-hero__media">{image("filler-uzi-doctor","Врач клиники RA|RÉ рядом с ультразвуковым аппаратом","eager")}</div>'
  hero=f'<section class="{pre}-hero'+(' wrap' if not mobile else '')+'">'+(nav+text+cta+media if mobile else '<div class="svc-hero__col">'+text+cta+'</div>'+media)+'</section>'
  s=section_replace(s,pre+'-hero',hero)
  if not mobile:s=re.sub(r'<span class="svc-breadcrumb__current">[^<]+</span>','<span class="svc-breadcrumb__current">Удаление филлеров под контролем УЗИ</span>',s,count=1)
  about='<section class="filler-about'+(' filler-about--mobile' if mobile else '')+'"><div><h2>'+esc(p[ah])+'</h2>'+''.join('<p>'+esc(t)+'</p>' for t in p[ah+1:ih])+'</div><figure>'+image('filler-uzi-device','Крупный план ультразвукового аппарата клиники RA|RÉ')+'</figure></section>'
  marker='<div class="'+('mh-svc-dark-group' if mobile else 'svc-dark-group')+'">';assert marker in s;s=s.replace(marker,about+'\n'+marker,1)
  def col(items,label):
   rows=[]
   for i,t in enumerate(items):
    h,desc=t.split('\n',1);h=re.sub(r'^\d+\.\s*','',h)
    rows.append(f'<div class="{pre}-indications__item"><div class="{pre}-indications__item-row"><span class="{pre}-indications__num">{i+1:02}</span><div><p class="{pre}-indications__item-title">{esc(h)}</p><p class="{pre}-indications__item-desc">{esc(desc)}</p></div></div></div>')
   return f'<div class="{pre}-indications__col"><span class="{pre}-indications__badge">{label}</span><div class="{pre}-indications__list">'+''.join(rows)+'</div></div>'
  cols=col(indications,'Показания')+col(contra,'Противопоказания')
  inds=f'<section class="{pre}-indications"><h2 class="{pre}-indications__heading">Показания и противопоказания</h2>'+(cols if mobile else '<div class="svc-indications__cols">'+cols+'</div>')+'</section>'
  s=section_replace(s,pre+'-indications',inds)
  rows=''.join(f'<div class="{pre}-price-row"><span class="{pre}-price-row__name">{esc(r["name"])}</span><span class="{pre}-price-row__price">{r["value"]} ₽</span></div>' for r in D['prices'])
  prices=f'<section class="{pre}-prices"><h2 class="{pre}-prices__heading">Стоимость удаления филлеров под контролем УЗИ</h2><div class="filler-price-table">{rows}</div><p class="svc-price-note">Стоимость по действующему <a href="/prajs/">прайсу клиники</a>. Необходимый объём коррекции врач определяет на консультации.</p>{cta}</section>'
  s=section_replace(s,pre+'-prices',prices)
  faq=f'<section class="{pre}-faq"><h2 class="{pre}-faq__heading">Частые вопросы об удалении филлеров</h2><div class="svc-faq__stack">{faq_cards(faqs,mobile)}</div></section>'
  s=section_replace(s,pre+'-faq',faq)
 s=re.sub(r'<option value="filler-removal"[^>]*>.*?</option>\s*','',s)
 s=s.replace('value="ultrasound-diagnostics" selected','value="ultrasound-diagnostics"').replace('<option value="ultrasound-diagnostics">Ультразвуковая диагностика</option>','<option value="ultrasound-diagnostics">Ультразвуковая диагностика</option>\n<option value="filler-removal" selected>Удаление филлеров под контролем УЗИ</option>')
 s=s.replace('</head>','<link rel="stylesheet" href="/css/pages/clinical-update.css?v=202611051500"/>\n</head>')
 s= schema(s,{'@context':'https://schema.org','@graph':[{'@type':'Service','name':title,'url':'https://rare-anapa.ru'+URL,'provider':{'@type':'MedicalClinic','name':'RA|RÉ','url':'https://rare-anapa.ru/'}},faq_schema(faqs),{'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Главная','item':'https://rare-anapa.ru/'},{'@type':'ListItem','position':2,'name':'Услуги','item':'https://rare-anapa.ru/uslugi/'},{'@type':'ListItem','position':3,'name':title}]}]})
 out=ROOT/URL.strip('/')/'index.html';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(s)

def build_problem(kind,file,label):
 p=D[kind];what=p.index('Что может помочь в нашей клинике');faq=p.index('Частые вопросы');faqs=faq_pairs([t for t in p[faq+1:] if not t.startswith('SEO')])
 intro_end=p.index('С чего начинается лечение акне' if kind=='acne' else 'Что мешает коже оставаться гладкой')
 intro=p[1:intro_end];steps=p[intro_end+1:what]
 section=lambda h,body:'<div class="article-section"><h2>'+esc(h)+'</h2>'+body+'</div>'
 body='<div class="article-section clinical-intro">'+''.join('<p>'+esc(t)+'</p>' for t in intro)+'</div>'
 body+=section(p[intro_end],''.join('<h3>'+esc(steps[i])+'</h3><p>'+esc(steps[i+1])+'</p>' for i in range(0,len(steps),2)))
 methods=p[what+1:faq];links=['/uslugi/priyom-kosmetologa/','/uslugi/fdt-revixan/','/uslugi/esteticheskaya-kosmetologiya/chistki/','/uslugi/esteticheskaya-kosmetologiya/piling-2/'] if kind=='acne' else ['/uslugi/lazernaya-epilyacziya/']
 cards=[];i=0
 while i+2<len(methods) and methods[i+2].startswith('Кнопка:'):
  btn=methods[i+2].split('«',1)[1].rsplit('»',1)[0]
  cards.append('<article class="clinical-method"><h3>'+esc(methods[i])+'</h3><p>'+esc(methods[i+1])+'</p><a class="prob-procs__all" href="'+links[len(cards)]+'">'+esc(btn)+'</a></article>');i+=3
 body+=section(p[what],'<div class="clinical-methods">'+''.join(cards)+'</div>'+''.join('<p>'+esc(t)+'</p>' for t in methods[i:]))
 body+=section('Частые вопросы',''.join('<details class="clinical-faq"><summary>'+esc(q)+'</summary>'+''.join('<p>'+esc(t)+'</p>' for t in a)+'</details>' for q,a in faqs))
 page=ROOT/file;s=page.read_text();start=s.index('<nav class="article-bc');end=s.index('<footer class="mh-footer">',start)
 replacement='<nav class="article-bc wrap" aria-label="Хлебные крошки"><a href="/">Главная</a><span>›</span><a href="/#wish">Я хочу</a><span>›</span><span class="article-bc__current">'+label+'</span></nav><section class="article-top wrap"><h1 class="article-title-simple">'+esc(p[0])+'</h1></section><section class="article-content-wrap wrap"><div class="article-content">'+body+'</div></section>\n'
 s=s[:start]+replacement+s[end:]
 if kind=='acne':title='Лечение акне в Анапе: консультация и подбор лечения | RA|RÉ';desc='Акне, повторные высыпания и постакне: с чего начать лечение в клинике RA|RÉ в Анапе. Консультация врача, подбор ухода и методов коррекции.'
 else:title='Лазерная эпиляция в Анапе — гладкое тело | RA|RÉ';desc='Гладкое тело без ежедневного бритья: лазерная эпиляция в клинике RA|RÉ в Анапе. Оценка кожи и волос, планирование курса, подготовка и ответы на вопросы.'
 url='/'+str(Path(file).parent)+'/'
 s=metadata(s,title,desc,url)
 if '/css/pages/clinical-update.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="/css/pages/clinical-update.css?v=202611051500"/>\n</head>')
 s=schema(s,{'@context':'https://schema.org','@graph':[{'@type':'WebPage','name':p[0],'url':'https://rare-anapa.ru'+url,'description':desc},faq_schema(faqs)]})
 page.write_text(s)

build_filler()
build_problem('acne','lechenie-akne-v-anape/index.html','Вылечить акне')
build_problem('smooth','lazernaya-epilyacziya-anapa/index.html','Гладкое тело')
print('Built filler removal, acne, and smooth body pages.')
