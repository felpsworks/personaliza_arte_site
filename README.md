# PersonalizaArte · site

Site da PersonalizaArte, laboratório de personalização em Hortolândia-SP: gravação a laser e impressão 3D.

## Estrutura

- `index.html`: o site completo, com as páginas Home, Gravação a Laser, Impressão 3D, Sobre nós e Orçamento, navegadas por `#âncora`
- `img/`: fotos usadas no site
- `robots.txt` e `sitemap.xml`: orientação para buscadores

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
