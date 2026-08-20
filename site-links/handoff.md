# Handoff — links.roilabs.com.br (página de links)

## O que é
Página de links única (tipo Linktree), estática, para colar na bio do Instagram
e do LinkedIn. Um arquivo `index.html` + a pasta `assets/`. **Não tem build.**

## Feito
- Visual **copiado do protótipo** em `Desktop/Pasta das empresa/linkbio`:
  paleta breu/carvão + laranja `#F5551E`, Plus Jakarta Sans + JetBrains Mono,
  botões de vidro em **pílula** (`border-radius:999px`) com o rótulo
  centralizado, e as ondas concêntricas do logo ao fundo.
  ⚠️ Isso **não** bate com o design system do `/site` (`#ff5a1f`,
  Archivo/Hanken Grotesk) — foi pedido assim, ver "Decisões".
- **Fontes self-hosted** (subset latin, em `assets/*.woff2`) — a página não faz
  nenhuma requisição externa. São variable fonts: um arquivo por família cobre
  todos os pesos (67 KB somados).
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
- Renderizado no Chrome headless via CDP em **360px**, **390px** e **1366px**:
  `document.scrollWidth == innerWidth` nos três, zero scroll horizontal.
  Os 7 botões ficam com a mesma altura (o rótulo é uma linha só).
- Nenhum 404 no servidor estático: os 4 caminhos locais (`/favicon.png`,
  `/assets/roilabs-icon.png` e os 2 `.woff2`) existem e carregam.
- JSON-LD parseia; nenhum `href="#"` esquecido.

## Decisões
- **O visual é o do protótipo `linkbio`, não o do `roilabs.com.br`.** Decisão do
  Jean (20/08/2026), com o trade-off na mesa: a página de links deixou de bater
  com o site institucional de propósito. Se algum dia isso incomodar, o commit
  `585c078` tem a versão rebrandada (cinza `#14171d`, Archivo, botão retangular
  com linha de apoio e seta) — dá pra voltar de lá.
- **Botão = pílula com uma linha só.** O protótipo não tem a linha de apoio nem
  a seta que a v1 tinha; elas saíram junto. Efeito colateral bom: some o gotcha
  de altura desalinhada quando a linha de apoio quebrava em duas.
- **Sem build.** É uma página só; um pipeline Node pra isso era peso morto.
  Editar = abrir o `index.html` e trocar o texto entre os comentários `TROCAR`.
  (O `linkbio` tem um `build.js` só porque embute fonte e logo em base64 no
  HTML; aqui os arquivos ficam soltos em `assets/`, então não precisa.)
- **Pasta própria (`/site-links`), não uma rota do `/site`.** Subdomínio próprio
  = app próprio na EasyPanel, igual ao `site-goiania`. Também evita fazer o
  Astro rebuildar 15 páginas pra trocar um link da bio.
- **Fontes self-hosted em vez de Google Fonts.** É a página que abre mais no
  3G do celular (vem do Instagram); tirar o render-block valeu os 67 KB.
- **`assets/` com cache de 30 dias, não 1 ano.** Os nomes dos arquivos não têm
  hash — com cache de 1 ano, trocar o logo exigiria renomear o arquivo.

## Deploy — Vercel (manual, eu não tenho acesso ao painel)

⚠️ **Ao contrário do resto do repo, esta página NÃO vai pra EasyPanel.**
`roilabs.com.br` e `goiania.roilabs.com.br` estão na EasyPanel (nginx,
`2.24.207.200`). O `links.` já estava apontado pro **Vercel** (`76.76.21.21`,
DNS na Cloudflare) servindo uma página antiga, de 1,8 KB, que **não existe em
lugar nenhum deste repo** — foi publicada fora do git. Como o domínio já estava
validado lá, a decisão (Jean, 20/08/2026) foi ficar no Vercel em vez de mexer
em DNS.

Passos no painel do Vercel:
1. New Project → importar `JeanZorzetti/roilabs`.
2. **Root Directory = `site-links`**, Framework Preset = **Other**,
   Build Command e Output Directory **vazios** (é HTML estático puro).
3. No projeto ANTIGO que tem o domínio: Settings → Domains → remover
   `links.roilabs.com.br`. Aí adicionar o domínio no projeto novo.
4. Colar `https://links.roilabs.com.br` na bio do Instagram e do LinkedIn.

Depois disso todo push no `main` republica a página sozinho.

O `vercel.json` refaz o que o `nginx.conf` fazia: cache de 30 dias em
`/assets/` e o fallback de qualquer URL pro `index.html`.
**Não verificado por mim** (não tenho acesso ao painel): se com Root Directory
apontando pra subpasta o Vercel ignorar o `vercel.json`, é porque ele espera o
arquivo na raiz do repo — é o primeiro lugar pra olhar se o cache não pegar.

O `Dockerfile` + `nginx.conf` ficaram na pasta de propósito: se um dia o
`links.` voltar pra EasyPanel, é só criar o App com build path `/site-links` e
trocar o registro A na Cloudflare de `76.76.21.21` pra `2.24.207.200`.

Pra testar antes de subir, é só abrir o `index.html` no navegador — só os
caminhos absolutos (`/assets/...`) não resolvem assim; nesse caso rode um
servidor estático qualquer na pasta (`npx serve .`).

## Pendências / gotchas
- ⚠️ **O domínio.** O pedido veio como `links.roylabs.com.br` (com **y**), mas o
  repo, o site, os e-mails e o schema todos usam `roilabs` (com **i**). A página
  foi feita com `roilabs`. Se `roylabs.com.br` for um domínio de verdade que
  vocês têm, trocar em 4 lugares no `index.html`: `canonical`, `og:url`,
  `og:image` e `url` do JSON-LD.
- ⚠️ **O `og-image.jpg` ainda é o da v1** (cinza + laranja do site). Não está
  errado, mas quem clicar no link compartilhado vê uma prévia com uma cara e
  abre uma página com outra. Refazer quando der.
- `assets/roilabs-icon.png` tem 93 KB pra exibir em 96px. Funciona, mas se um
  dia sobrar tempo, um resize pra 192px derruba isso pra ~10 KB.
- O rótulo do botão é uma linha só e centralizado: passando de ~28 caracteres
  ele quebra em duas linhas no celular e aquele botão fica mais alto que os
  vizinhos. Não quebra o layout, só desalinha a pilha.
- As fontes em `assets/` são subset **latin** — cobre português inteiro, mas
  não cobre cirílico/grego. Não é um problema hoje.
