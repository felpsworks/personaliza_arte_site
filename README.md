# PersonalizaArte · site

Site da PersonalizaArte, laboratório de personalização em Hortolândia-SP: gravação a laser e impressão 3D.

## Estrutura

Uma página real por assunto, cada uma com título, descrição e H1 próprios:

| Endereço | Arquivo |
| --- | --- |
| `/` | `index.html` |
| `/copos-personalizados/` | `copos-personalizados/index.html` |
| `/brindes-corporativos/` | `brindes-corporativos/index.html` |
| `/gravacao-a-laser/` | `gravacao-a-laser/index.html` |
| `/impressao-3d/` | `impressao-3d/index.html` |
| `/sobre/` | `sobre/index.html` |
| `/orcamento/` | `orcamento/index.html` |

### Loja (catálogo, páginas de produto e carrinho)

- A home (`index.html`) é o catálogo: categoria **Térmicos** com Copos Térmicos, Canecas e Garrafas.
- Cada produto tem página própria em `/produtos/<slug>/`.
- O carrinho (`assets/loja.js` e `assets/loja.css`) fica salvo no navegador do cliente e fecha o pedido pelo WhatsApp com código, cor e quantidade de cada item.
- **Para adicionar ou mudar produtos:**
  1. edite `ferramentas/produtos.json` (código, nome, textos, cores);
  2. coloque a foto em `img/produtos/<codigo>-400.webp` e `-800.webp` (quadrada, fundo branco);
  3. rode `python ferramentas/gerar_loja.py` na raiz do site, que regenera a home, as páginas de produto e o `sitemap.xml`.
- Códigos: `PA-CT` copos térmicos, `PA-CN` canecas, `PA-GR` garrafas.

- `assets/site.css` e `assets/site.js`: estilo e scripts compartilhados por todas as páginas. Ao alterar um deles, aumente o `?v=` no link das páginas (o arquivo fica em cache por 1 ano, veja `_headers`).
- Cabeçalho, rodapé e bloco de contato se repetem em cada página: ao mudar um deles, mude em todas.
- `img/`: fotos usadas no site
- `_redirects`: `/copos/natal` (anúncio do Google Ads) mostra a página de copos; URLs da loja antiga vão para a home
- `404.html`: página de endereço não encontrado
- `robots.txt` e `sitemap.xml`: orientação para buscadores (inclua no sitemap toda página nova)
- Links antigos com `#âncora` (ex.: `/#laser`) são levados para a página nova pelo início de `assets/site.js`

Site estático, sem etapa de build: nenhum framework, dependência ou chave secreta.

## Publicação

Hospedado no **Cloudflare Pages**, conectado a este repositório. Cada envio para a branch `main` publica uma nova versão automaticamente.

Configuração do projeto no Cloudflare Pages:

| Campo | Valor |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | *(vazio)* |
| Build output directory | `/` |

Domínios: `personalizaarte.com.br` (principal) e `www.personalizaarte.com.br` (redireciona para o principal).
