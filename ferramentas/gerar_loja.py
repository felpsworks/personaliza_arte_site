# Gera a home (catálogo) e as páginas de produto a partir de ferramentas/produtos.json.
# Uso (na raiz do site):  python ferramentas/gerar_loja.py
# Cabeçalho, rodapé e bloco de contato são copiados de sobre/index.html.
import json, os, re, html
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://personalizaarte.com.br'
WA = 'https://wa.me/5519981862800'
V = '14'  # versão de loja.css / loja.js (aumente ao alterar esses arquivos)

data = json.load(open(os.path.join(ROOT, 'ferramentas', 'produtos.json'), encoding='utf-8'))
base = open(os.path.join(ROOT, 'sobre', 'index.html'), encoding='utf-8').read()

head = base[:base.index('</head>')]
shell_top = base[base.index('<body>') + len('<body>'):base.index('</header>') + len('</header>')]
contact = base[base.index('<!-- ============ CONTATO'):base.index('</main>')]
footer = re.search(r'\n<footer>.*?</footer>', base, re.S).group(0).strip()
wafloat = re.search(r'<a class="wa-float".*?</a>', base, re.S).group(0)

esc = lambda s: html.escape(s, quote=True)
LOJA_HEAD = f'<link rel="stylesheet" href="/assets/loja.css?v={V}">'
SITE_CSS = '<link rel="stylesheet" href="/assets/site.css?v=1">'
LOJA_JS = f'<script src="/assets/loja.js?v={V}" defer></script>'

def page_head(path, title, desc, image=None, preload=''):
    h = head
    url = SITE + '/' + path
    h = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', h)
    h = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(desc)}">', h)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', h)
    h = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">', h)
    h = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{esc(title)}">', h)
    h = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{esc(desc)}">', h)
    if image:
        h = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{SITE}{image}">', h)
    h = re.sub(r'<link rel="preload" as="image"[^>]*>\n?', '', h)
    if LOJA_HEAD not in h:
        h = h.replace(SITE_CSS, SITE_CSS + '\n' + LOJA_HEAD)
    if preload:
        h = h.replace(SITE_CSS, preload + '\n' + SITE_CSS)
    return h

def write(path, title, desc, main, image=None, preload=''):
    out = (page_head(path, title, desc, image, preload) + '</head>\n<body>' + shell_top + '\n\n<main>\n' + main.strip('\n') + '\n\n'
           + contact + '</main>\n\n' + footer + '\n\n' + wafloat + '\n\n'
           + f'<script src="/assets/site.js?v=1" defer></script>\n{LOJA_JS}\n</body>\n</html>\n')
    f = os.path.join(ROOT, path, 'index.html')
    os.makedirs(os.path.dirname(f), exist_ok=True)
    open(f, 'w', encoding='utf-8', newline='').write(out)
    print('ok /' + path)

# ---------- dados ----------
PROD = []
for cat in data['categorias']:
    for sub in cat['subcategorias']:
        for p in sub['produtos']:
            if p['cores'] == 'padrao': p['cores'] = data['cores_padrao']
            p['sub'] = sub; p['cat'] = cat; p['min'] = sub.get('minimo', 1); PROD.append(p)

def img(p, w, cls='', lazy=True, sizes=None):
    a = f' loading="lazy"' if lazy else ' fetchpriority="high"'
    srcset = f'/img/produtos/{p["foto"]}-400.webp 400w, /img/produtos/{p["foto"]}-800.webp 800w'
    return (f'<img src="/img/produtos/{p["foto"]}-{w}.webp" srcset="{srcset}" sizes="{sizes or "(max-width:600px) 50vw, 300px"}" '
            f'width="800" height="800" alt="{esc(p["nome"])} personalizado com gravação a laser"{a}{(" class=" + chr(34) + cls + chr(34)) if cls else ""}>')

def swatches(p, max_n=9):
    s = ''.join(f'<i style="--c:{hx}" title="{esc(n)}"></i>' for n, hx in p['cores'][:max_n])
    return f'<div class="sw" aria-label="{len(p["cores"])} cores disponíveis">{s}</div>'

def min_html(p):
    return 'A partir de <b>1 unidade</b>' if p['min'] == 1 else f'Pedido mínimo: <b>{p["min"]} unidades</b>'

def min_txt(p):
    return 'a partir de 1 unidade' if p['min'] == 1 else f'pedido mínimo de {p["min"]} unidades'

def data_attrs(p):
    cores = '|'.join(n for n, _ in p['cores'])
    return (f'data-codigo="{p["codigo"]}" data-nome="{esc(p["nome"])}" data-url="/produtos/{p["slug"]}/" '
            f'data-foto="/img/produtos/{p["foto"]}-400.webp" data-cores="{esc(cores)}" data-min="{p['min']}"')

import unicodedata
def norm(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t.lower()) if unicodedata.category(c) != 'Mn')

def card(p):
    busca = esc(norm(' '.join([p['nome'], p['codigo'], p['resumo'], p['sub']['nome']] + [n for n, _ in p['cores']])))
    return f'''<article class="pcard" data-busca="{busca}">
          <a class="pc-link" href="/produtos/{p['slug']}/">
            <div class="pc-img">{img(p, 400)}</div>
            {swatches(p)}
            <h4>{esc(p['nome'])}</h4>
            <p>{esc(p['resumo'])}</p>
          </a>
          <div class="pc-meta"><span>Cód: <b>{p['codigo']}</b></span><span>{min_html(p)}</span></div>
          <button type="button" class="btn primary pc-add" {data_attrs(p)}><span class="l">Adicionar ao carrinho</span><span class="s">Adicionar</span></button>
        </article>'''

ICON = {
 'laser': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/><circle cx="12" cy="12" r="3"/></svg>',
 'um': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></svg>',
 'previa': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 'envio': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
 'estrela': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"/></svg>',
}
BF_ITEMS = ''.join(f'<div class="bf">{ICON[k]}<div><b>{t}</b><span>{s}</span></div></div>' for k, t, s in [
    ('laser', 'Gravação a laser', 'não descasca nem desbota'),
    ('um', 'A partir de 1 unidade', 'presente ou lote'),
    ('previa', 'Prévia antes de gravar', 'você aprova a arte'),
    ('envio', 'Retirada ou envio', 'Hortolândia e região'),
    ('estrela', '5,0 no Google', '38 avaliações'),
])
# faixa em movimento: o grupo aparece duas vezes para o loop ficar contínuo (a cópia é ignorada por leitores de tela)
BENEFITS = f'''  <section class="benefits" aria-label="Vantagens">
    <div class="marquee"><div class="mq-track"><div class="mq-group">{BF_ITEMS}</div><div class="mq-group" aria-hidden="true">{BF_ITEMS}</div></div></div>
  </section>'''

BANNER = '''  <section class="hero-banner" aria-label="PersonalizaArte">
    <img src="/img/banner-home-1000.webp" srcset="/img/banner-home-640.webp 640w, /img/banner-home-1000.webp 1000w, /img/banner-home-1584.webp 1584w" sizes="100vw" width="1584" height="672" fetchpriority="high" alt="Oficina da PersonalizaArte com máquina de gravação a laser, impressora 3D e copos, canecas, garrafas e chaveiros personalizados">
  </section>
'''
BANNER_PRELOAD = '<link rel="preload" as="image" type="image/webp" fetchpriority="high" imagesrcset="/img/banner-home-640.webp 640w, /img/banner-home-1000.webp 1000w, /img/banner-home-1584.webp 1584w" imagesizes="100vw">'

STEPS = '''  <section class="band">
    <div class="in">
      <div class="head"><div class="eyebrow">Como funciona</div><h2>Etapas do seu pedido</h2></div>
      <div class="steps">
        <div class="step"><span class="n">1</span><h3>Monte o carrinho</h3><p>Escolha os modelos, as cores e a quantidade.</p></div>
        <div class="step"><span class="n">2</span><h3>Envie pelo WhatsApp</h3><p>O pedido vai pronto. Mande também o nome, a logo ou a arte.</p></div>
        <div class="step"><span class="n">3</span><h3>Aprove a prévia</h3><p>Você vê como a gravação vai ficar e só aprova quando gostar.</p></div>
        <div class="step"><span class="n">4</span><h3>Gravação e entrega</h3><p>Gravamos a laser e combinamos retirada em Hortolândia ou envio.</p></div>
      </div>
    </div>
  </section>'''

# ---------- home ----------
ARROW = '<svg class="sub-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
# Na home, todas as subcategorias ficam numa única seção "Gravação a Laser"
SECAO_HOME = 'Gravação a Laser'
cat_sections = []
subs_html = []
for cat in data['categorias']:
    for sub in cat['subcategorias']:
        prods = [p for p in PROD if p['sub'] is sub]
        n = len(prods)
        subs_html.append(f'''    <details class="subcat" id="{sub['id']}" open>
      <summary><h3>{esc(sub['nome'])}</h3>{ARROW}</summary>{f'{chr(10)}      <p class="sub-mat">Material: <b>{esc(sub["material"])}</b></p>' if sub.get('material') else ''}
      <div class="pgrid">
        {(chr(10) + '        ').join(card(p) for p in prods)}
      </div>
    </details>''')
cat_sections.append(f'''  <section class="band shop" id="gravacao-laser">
    <div class="in">
      <div class="head"><div class="eyebrow">Categoria</div><h2>{SECAO_HOME}</h2></div>
      <div class="busca" role="search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input type="search" id="busca" placeholder="Pesquisar produto…" aria-label="Pesquisar produto" autocomplete="off" enterkeyhint="search">
        <button type="button" class="busca-x" id="busca-x" aria-label="Limpar pesquisa" hidden>×</button>
      </div>
      <div class="meu-prod">
        <button type="button" class="btn-meu" id="meu-produto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/></svg>Gravar/cortar meu produto</button>
        <small>Já possui a peça? Realizamos a gravação ou o corte a laser no seu produto.</small>
      </div>
      <p class="busca-vazio" id="busca-vazio" hidden>Nenhum produto encontrado. <a href="https://wa.me/5519981862800" target="_blank" rel="noopener">Pergunte pelo WhatsApp</a> se fazemos o que você procura.</p>
{chr(10).join(subs_html)}
    </div>
  </section>''')
home = BANNER + f'''  <section class="shop-intro">
    <div class="in">
      <div>
        <h1>Copos, garrafas, canetas e cadernos personalizados</h1>
        <p>Escolha o modelo, a cor e a quantidade. Gravamos a laser o nome, a logo ou a frase que você quiser, a partir de 1 unidade.</p>
      </div>
    </div>
  </section>

{BENEFITS}

{(chr(10) + chr(10)).join(cat_sections)}

{STEPS}

  <section class="niches">
    <div class="in">
      <div class="head"><div class="eyebrow">Também fazemos</div><h2>Outras formas de personalizar</h2></div>
      <div class="niche-grid">
        <a class="niche n-laser" href="/brindes-corporativos/">
          <div class="niche-photo"><img src="/img/lote.webp" alt="Pedido de brindes corporativos com dezenas de copos térmicos embalados" loading="lazy" style="object-position:50% 70%"></div>
          <div class="niche-body">
            <span class="niche-tag">Para empresas</span>
            <h3>Brindes corporativos</h3>
            <p>Copos, canecas e garrafas com a logo da empresa, do time ou do evento. Do lote pequeno ao pedido grande.</p>
            <span class="go">Ver brindes corporativos <i>→</i></span>
          </div>
        </a>
        <a class="niche n-3d" href="/impressao-3d/">
          <div class="niche-photo"><img src="/img/porta-3d.webp" alt="Porta-canetas hexagonal, vaso geométrico, engrenagem e luminária espiral brancos impressos em 3D" loading="lazy"></div>
          <div class="niche-body">
            <span class="niche-tag">Laboratório 02</span>
            <h3>Impressão 3D</h3>
            <p>Peças decorativas, utilitárias e chaveiros impressos em 3D na cor que você escolher, incluindo a Linha Fitness com nome.</p>
            <span class="go">Ver impressão 3D <i>→</i></span>
          </div>
        </a>
      </div>
    </div>
  </section>
  <div class="home-strip"><div class="in">
    <div><strong><span class="stars" aria-hidden="true">★★★★★</span> 5,0</strong> · 38 avaliações no Google</div>
    <div><strong>Hortolândia, SP</strong> · retirada no local ou envio para Campinas, Sumaré, Indaiatuba, Monte Mor e Nova Odessa</div>
    <div><strong>Você aprova antes</strong> · prévia de toda personalização</div>
  </div></div>
'''
write('', 'Copos Personalizados e Gravação a Laser em Hortolândia | PersonalizaArte',
      'Copos, canecas e garrafas térmicas personalizados com gravação a laser em Hortolândia-SP. Escolha o modelo e a cor e peça pelo WhatsApp, a partir de 1 unidade.', home,
      image='/img/banner-home.jpg', preload=BANNER_PRELOAD)

CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'
GRAVAR = ['Nome', 'Logo da empresa', 'Frase', 'Data', 'Monograma', 'Escudo de time']
def _selo(path, t, sub):
    return (f'<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>'
            f'<span><b>{t}</b><small>{sub}</small></span></li>')
SELOS = ''.join([
    _selo('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', 'Prévia da arte', 'Você aprova antes de gravar'),
    _selo('<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.8z"/>', 'Gravação a laser', 'Permanente, não desbota'),
    _selo('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 'Hortolândia-SP', 'Retirada ou envio'),
    _selo('<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.4A9 9 0 1 1 21 12z"/>', 'Atendimento rápido', 'Direto pelo WhatsApp'),
])

# ---------- páginas de produto ----------
for p in PROD:
    rel = [q for q in PROD if q['sub'] is p['sub'] and q is not p] or [q for q in PROD if q is not p][:3]
    if len(rel) < 3: rel += [q for q in PROD if q is not p and q not in rel][:3 - len(rel)]
    cores = ''.join(
        f'<label class="cor"><input type="radio" name="cor" value="{esc(n)}"{" checked" if i == 0 else ""}><i style="--c:{hx}"></i><span>{esc(n)}</span></label>'
        for i, (n, hx) in enumerate(p['cores']))
    msg = f'Olá, PersonalizaArte! Tenho interesse no {p["nome"]} (cód. {p["codigo"]}).'
    destaques = ''.join(f'<li>{CHECK}{esc(x)}</li>' for x in p['destaques'])
    ideal = ''.join(f'<span class="chip">{esc(x)}</span>' for x in p['sub'].get('ideal', []))
    gravar = ''.join(f'<span class="chip">{x}</span>' for x in GRAVAR)
    ncor = len(p['cores'])
    cor_txt = esc(p['cores'][0][0]) if ncor == 1 else f'{ncor} opções: ' + esc(', '.join(n for n, _ in p['cores']))
    rows = ([['Código', p['codigo']], ['Categoria', p['sub']['nome']]] + p.get('specs', [])
            + [['Cores', None], ['Pedido mínimo', '1 unidade' if p['min'] == 1 else f"{p['min']} unidades"],
               ['Personalização', 'Gravação a laser de nome, logo, frase ou data'], ['Prévia da arte', 'Sim, você aprova antes de gravar']])
    specs = ''.join(f'<tr><th scope="row">{esc(k)}</th><td>{cor_txt if v is None else esc(v)}</td></tr>' for k, v in rows)
    main = f'''  <nav class="crumbs in" aria-label="Você está em"><a href="/">Início</a><span>›</span><a href="/#{p['sub']['id']}">{esc(p['sub']['nome'])}</a><span>›</span><span aria-current="page">{esc(p['nome'])}</span></nav>
  <section class="band pdp">
    <div class="in pdp-grid">
      <div class="pdp-media">
        <button type="button" class="pdp-img" data-zoom="/img/produtos/{p['foto']}-800.webp" aria-label="Ampliar a foto">{img(p, 800, lazy=False, sizes="(max-width:860px) 100vw, 560px")}<span class="zoom-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21M11 8v6M8 11h6"/></svg></span></button>
      </div>
      <div class="pdp-info" {data_attrs(p)}>
        <div class="eyebrow">{esc(p['sub']['nome'])} · Cód. {p['codigo']}</div>
        <h1>{esc(p['nome'])}</h1>
        <p class="pdp-rate"><span class="stars" aria-hidden="true">★★★★★</span> <b>5,0</b> no Google · 38 avaliações</p>
        <p class="pdp-desc">{esc(p['resumo'])}</p>
        <fieldset class="cores"><legend>Cor: <b class="cor-nome">{esc(p['cores'][0][0])}</b></legend>{cores}</fieldset>
        <div class="qtd-row">
          <label class="qtd"><span>Quantidade</span><span class="qtd-box"><button type="button" class="q-menos" aria-label="Diminuir">−</button><input type="number" class="q-val" min="{p['min']}" value="{p['min']}" inputmode="numeric" aria-label="Quantidade"><button type="button" class="q-mais" aria-label="Aumentar">+</button></span></label>
          <span class="min">{min_html(p)}</span>
        </div>
        <div class="pdp-ctas">
          <button type="button" class="btn primary big pdp-add">Adicionar ao carrinho</button>
          <a class="btn ghost pdp-wa" href="{WA}?text={quote(msg)}" target="_blank" rel="noopener"><svg><use href="#wa"/></svg>Tirar dúvida no WhatsApp</a>
        </div>
        <ul class="selos">{SELOS}</ul>
      </div>
    </div>
  </section>

  <section class="band pdp-det">
    <div class="in det-grid">
      <div class="det-txt">
        <h2>Detalhes do produto</h2>
        <p>{esc(p['descricao'])}</p>
        <ul class="det-list">{destaques}</ul>
        <h3>Ideal para</h3>
        <div class="chips">{ideal}</div>
        <h3>O que podemos gravar</h3>
        <div class="chips">{gravar}</div>
      </div>
      <div class="det-spec">
        <h2>Especificações</h2>
        <table class="spec">{specs}</table>
      </div>
    </div>
  </section>

{STEPS}

  <section class="band shop">
    <div class="in">
      <div class="head"><div class="eyebrow">Veja também</div><h2>Outros modelos</h2></div>
      <div class="pgrid">
        {(chr(10) + '        ').join(card(q) for q in rel[:4])}
      </div>
    </div>
  </section>
'''
    fem = p['nome'].split()[0] in ('Caneca', 'Garrafa', 'Caneta', 'Taça')
    adj = 'Personalizada' if fem else 'Personalizado'
    titulo = p['nome'] if 'personalizad' in p['nome'].lower() else f"{p['nome']} {adj}"
    write(f'produtos/{p["slug"]}/', f'{titulo} | PersonalizaArte',
          f'{titulo if titulo != p["nome"] or "personalizad" in p["nome"].lower() else p["nome"]} com gravação a laser em Hortolândia. {p["resumo"]} Cód. {p["codigo"]}, {min_txt(p)}.',
          main, image=f'/img/produtos/{p["foto"]}-800.webp')

# ---------- carrinho em todas as páginas ----------
for dirpath, _, files in os.walk(ROOT):
    if '.git' in dirpath or 'ferramentas' in dirpath: continue
    for fn in files:
        if fn != 'index.html' and not (fn == '404.html'): continue
        if fn == '404.html': continue
        f = os.path.join(dirpath, fn); s = open(f, encoding='utf-8').read(); o = s
        s = re.sub(r'/assets/loja\.(css|js)\?v=\d+', lambda m: f'/assets/loja.{m.group(1)}?v={V}', s)
        if LOJA_HEAD.split('?')[0] not in s:
            s = s.replace(SITE_CSS, SITE_CSS + '\n' + LOJA_HEAD, 1)
        if '/assets/loja.js' not in s:
            s = s.replace('</body>', LOJA_JS + '\n</body>', 1)
        if s != o: open(f, 'w', encoding='utf-8', newline='').write(s); print('carrinho em', os.path.relpath(f, ROOT))

# ---------- sitemap ----------
urls = ['', 'copos-personalizados/', 'brindes-corporativos/', 'gravacao-a-laser/', 'impressao-3d/', 'sobre/', 'orcamento/'] + [f'produtos/{p["slug"]}/' for p in PROD]
import datetime
hoje = datetime.date.today().isoformat()
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
    f'  <url><loc>{SITE}/{u}</loc><lastmod>{hoje}</lastmod></url>\n' for u in urls) + '</urlset>\n'
open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='').write(sm)
print('sitemap', len(urls), 'urls')
