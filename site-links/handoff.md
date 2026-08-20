# Handoff — links.roilabs.com.br (página de links)

## O que é
Página de links única (tipo Linktree), estática, para colar na bio do Instagram
e do LinkedIn. Um arquivo `index.html` + a pasta `assets/`. **Não tem build.**

## Feito
- Design reaproveitado do protótipo em `Desktop/Pasta das empresa/linkbio`
  (botões de vidro, ondas concêntricas do logo), **rebrandado** para o design
  system real do `/site`: grafite `#14171d`, laranja hi-vis `#ff5a1f`,
  Archivo / Hanken Grotesk / Space Mono.
- **Fontes self-hosted** (subset latin, baixado do Google Fonts para
  `assets/*.woff2`) — a página não faz nenhuma requisição externa. É o passo 4
  das "próximas" do `/site/handoff.md`, feito aqui primeiro.
- 7 botões, um só laranja (WhatsApp — a regra é: um destaque por página).
  Links reais tirados do `/site`: home, `/modelo/`, `goiania.roilabs.com.br`,
  `/simulador/`, `wa.me/5562993265713`, `/#candidatar`, `/blog/`.
- Sociais: Instagram `roilabs.curadoria`, LinkedIn `roi-labs-curadoria`,
  e-mail `parceria@roilabs.com.br` (os mesmos do `sameAs` do Base.astro).
- **UTM** `utm_source=linkinbio&utm_medium=bio&utm_campaign=links` nos links pro
  próprio site — o GA4 do institucional separa o tráfego da bio sozinho.
  Não tem UTM no `#candidatar` (âncora) nem no `wa.me`.
- SEO/social: canonical, OG completo com `og-image.jpg`, JSON-LD `ProfilePage`
  apontando pro `@id` da Organization do site principal (`#org`), favicon,
  apple-touch-icon.
- A11y: `focus-visible` laranja, `aria-label` em todos os ícones,
  `prefers-reduced-motion` respeitado nas ondas e na entrada.
- Deploy: `Dockerfile` (nginx puro, sem stage de build) + `nginx.conf`.

## Verificado
- Renderizado no Chrome headless via CDP: **360px** (`docW == innerWidth`, zero
  scroll horizontal) e **1366px**. Os 7 botões ficam com a mesma altura.
- Todos os caminhos locais (`/assets/...`, `/favicon.png`) existem; JSON-LD
  parseia; nenhum `href="#"` esquecido.

## Decisões
- **Sem build.** É uma página só; um pipeline Node pra isso era peso morto.
  Editar = abrir o `index.html` e trocar o texto entre os comentários `TROCAR`.
- **Pasta própria (`/site-links`), não uma rota do `/site`.** Subdomínio próprio
  = app próprio na EasyPanel, igual ao `site-goiania`. Também evita fazer o
  Astro rebuildar 15 páginas pra trocar um link da bio.
- **Fontes self-hosted em vez de Google Fonts.** É a página que abre mais no
  3G do celular (vem do Instagram); tirar o render-block valeu os 100 KB.
- **`assets/` com cache de 30 dias, não 1 ano.** Os nomes dos arquivos não têm
  hash — com cache de 1 ano, trocar o logo exigiria renomear o arquivo.

## Deploy (EasyPanel — manual, eu não tenho acesso ao painel)
1. Novo App a partir do repo `JeanZorzetti/roilabs`.
2. **Build path = `/site-links`**, builder = Dockerfile, porta 80.
3. Domínio `links.roilabs.com.br` + registro DNS apontando pra EasyPanel.
4. Colar `https://links.roilabs.com.br` na bio do Instagram e do LinkedIn.

Pra testar antes de subir, é só abrir o `index.html` no navegador — só os
caminhos absolutos (`/assets/...`) não resolvem assim; nesse caso rode um
servidor estático qualquer na pasta (`npx serve .`).

## Pendências / gotchas
- ⚠️ **O domínio.** O pedido veio como `links.roylabs.com.br` (com **y**), mas o
  repo, o site, os e-mails e o schema todos usam `roilabs` (com **i**). A página
  foi feita com `roilabs`. Se `roylabs.com.br` for um domínio de verdade que
  vocês têm, trocar em 4 lugares no `index.html`: `canonical`, `og:url`,
  `og:image` e `url` do JSON-LD.
- `assets/roilabs-icon.png` tem 93 KB pra exibir em 96px. Funciona, mas se um
  dia sobrar tempo, um resize pra 192px derruba isso pra ~10 KB.
- O texto `.apoio` (linha cinza monoespaçada dos botões) quebra em duas linhas
  passando de ~30 caracteres no celular. Não quebra o layout, só desalinha as
  alturas dos botões.
- As fontes em `assets/` são subset **latin** — cobre português inteiro, mas
  não cobre cirílico/grego. Não é um problema hoje.
