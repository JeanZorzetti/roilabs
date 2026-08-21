# HANDOFF — links.roilabs.com.br (página de links)

> **Abrindo isto numa aba nova?** Leia o "Estado atual" e o "Se você é a próxima
> sessão" no fim. O resto é referência.
> Última atualização: **21/08/2026**, commit `ea444fc` + a troca das frases
> dos botões 1, 2 e 3 (commit logo abaixo dele no `git log`).

## Estado atual — 21/08/2026

🟢 **NO AR** em https://links.roilabs.com.br/ — servido pelo **Vercel**,
com deploy automático a cada push no `main`. Não precisa mexer em painel
nenhum pra publicar: `git push` já republica.

O que a página mostra hoje:

- Título: **ROI Labs**
- Subtítulo (mono, caixa alta): **PARCEIRO DE CRESCIMENTO**
- Promessa: "Construímos sua venda online. / Você paga quando vende."
- 7 botões em pílula, nesta ordem:

  | # | o que diz | marca | selo | vai pra |
  |---|---|---|---|---|
  | 1 | Tenha um parceiro de crescimento. | ROI LABS | — | `roilabs.com.br` |
  | 2 | Descubra como melhorar seu funil de vendas. | SIRIUS CRM | Em breve · 01/09 | `siriuscrm.com.br` |
  | 3 | Melhore sua operação com ERP qualificado | ORION ERP | Em breve · 05/09 | `orion.roilabs.com.br` |
  | 4 | Diga adeus às planilhas. Automatize suas finanças. | MERIDIAN | Em breve · 20/09 | `meridian.roilabs.com.br` |
  | 5 | Candidatar minha empresa | — | — | `roilabs.com.br/#candidatar` |
  | 6 | **Falar no WhatsApp** (o único laranja) | — | — | `wa.me/5562993265713` |
  | 7 | Blog | — | — | `roilabs.com.br/blog/` |

  Os 4 primeiros são `.convite`: mais altos de propósito, com a frase em até 2
  linhas e a marca embaixo, na mesma letra do subtítulo do topo. Os selos
  "Em breve" são chips **verdes piscando**; os links continuam clicáveis.
  ⚠️ Desde 21/08/2026 a frase do botão 1 cabe em **uma linha só**, então ele é
  ~30px mais baixo que os outros 3 `.convite` (106px contra 137px em 320px de
  largura). Não é bug: é a frase curta. Pra igualar, alongue a frase — não mexa
  no CSS.
- Instagram, LinkedIn, e-mail + rodapé

A prévia que aparece ao compartilhar (`assets/og-image.jpg`) repete o logo, o
título, o subtítulo e a promessa no mesmo visual da página — ela **não** mostra
os botões, então mexer em botão não obriga a regerar o JPG.

## O que é
Página de links única (tipo Linktree), estática, para colar na bio do Instagram
e do LinkedIn. Um `index.html` + a pasta `assets/`. **Não tem build.**

Editar = abrir o `index.html` e trocar o texto entre os comentários `TROCAR`.
Tudo que é editável está antes do comentário "DAQUI PRA BAIXO É O VISUAL" —
**menos** os 4 campos de texto do `<head>` (`title`, `description`, `og:title`,
`og:description`), que também estão marcados com `TROCAR` lá em cima.

O `og-image.src.html` é uma peça à parte: é a **fonte da imagem de prévia**
(`assets/og-image.jpg`), não é linkado de lugar nenhum e não faz parte da
página. Ver "Trocar o texto da página" abaixo.

## Como está feito
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
  A lista completa está na tabela do "Estado atual". Em 21/08/2026 a pilha
  deixou de ser "links do site" e virou **vitrine de produto**: 3 botões passaram
  a vender Sirius CRM, Orion ERP e Meridian. Nessa troca saíram da página
  `roilabs.com.br/modelo/`, `goiania.roilabs.com.br` (a operação no ar) e
  `roilabs.com.br/simulador/`. Nenhum deles está linkado em outro lugar da
  página — se algum fizer falta, é um botão novo, não um "voltar atrás".
- Sociais: Instagram `roilabs.curadoria`, LinkedIn `roi-labs-curadoria`,
  e-mail `parceria@roilabs.com.br` (os mesmos do `sameAs` do Base.astro).
- **UTM** `utm_source=linkinbio&utm_medium=bio&utm_campaign=links` nos links pro
  próprio site — o GA4 do institucional separa o tráfego da bio sozinho.
  Não tem UTM no `#candidatar` (âncora) nem no `wa.me`.
- SEO/social: canonical, OG completo com `og-image.jpg`, JSON-LD `ProfilePage`
  apontando pro `@id` da Organization do site principal (`#org`), favicon,
  apple-touch-icon.
- O `assets/roilabs-icon.png` é **192px em paleta de 256 cores (26 KB)**, feito a
  partir do PNG de 256px/93 KB que está em `site/public/`. É o mesmo desenho: a
  paleta só descarta cores do antialiasing. Se precisar refazer, o caminho foi
  redimensionar com `System.Drawing` e reencodar com median cut (o `/site` ainda
  usa o de 93 KB — isso aqui não mexeu nele).
- A11y: `focus-visible` laranja, `aria-label` em todos os ícones,
  `prefers-reduced-motion` respeitado nas ondas e na entrada.

## Trocar o texto da página (e a prévia junto)

O mesmo texto vive em **três lugares**. Trocar só um deixa a página dizendo uma
coisa e a prévia do WhatsApp dizendo outra — foi exatamente o que aconteceu
entre `d91c4eb` e agora. A ordem:

1. **`index.html`, no corpo:** `<h1>`, `.assinatura`, `.promessa`.
2. **`index.html`, no `<head>`:** `title`, `description`, `og:title`,
   `og:description` (bloco marcado com `TROCAR` logo no começo do arquivo).
3. **`og-image.src.html`:** os mesmos `<h1>`, `.assinatura` e `.promessa`,
   e regere o JPG:

```powershell
# 1. servidor estático na pasta (os caminhos são absolutos, file:// não serve:
#    as fontes .woff2 não carregam e o JPG sai com fonte de sistema)
npx serve . -l 8099

# 2. screenshot em 1200x630
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new `
  --disable-gpu --no-sandbox --hide-scrollbars --user-data-dir="$env:TEMP\chrome-og" `
  --force-device-scale-factor=1 --window-size=1200,630 `
  --screenshot="og.png" --virtual-time-budget=5000 `
  "http://localhost:8099/og-image.src.html"

# 3. PNG -> JPG qualidade 84 (System.Drawing; não precisa instalar nada)
```

⚠️ **Sem `--user-data-dir` o `--screenshot` do Chrome falha calado nesta
máquina** — sai com sucesso e não escreve arquivo nenhum. Perdi um ciclo nisso.

Em 21/08/2026 a og-image foi regerada de novo (título "ROI Labs") por outro
caminho, que também funciona e não depende de `System.Drawing`: servir a pasta
com um `http.createServer` de 10 linhas em Node, tirar o PNG com `--screenshot`,
e converter pra JPG numa página de apoio que desenha o PNG num `<canvas>` e
imprime `canvas.toDataURL('image/jpeg', 0.84)` no DOM — dá pra ler esse dataURL
com `--dump-dom` e gravar o base64 em arquivo pelo Node. Saiu com 39 KB.
Nessa rodada o `--screenshot` funcionou **sem** `--user-data-dir`; se falhar
calado de novo, o flag continua sendo a primeira coisa a tentar.

Qualidade 84 dá ~52 KB sem banding visível no gradiente escuro; 78 economiza
6 KB e começa a sujar o degradê atrás do logo. O `og:image` só é baixado por
crawler, não pesa no carregamento da página — não vale apertar mais.

## Deploy — Vercel

⚠️ **Ao contrário do resto do repo, esta página NÃO está na EasyPanel.**
`roilabs.com.br` e `goiania.roilabs.com.br` estão na EasyPanel (nginx,
`2.24.207.200`). O `links.` já estava apontado pro **Vercel** (`76.76.21.21`,
DNS na Cloudflare) servindo uma página antiga de 1,8 KB que **não existia em
lugar nenhum deste repo** — foi publicada fora do git, e foi substituída.
Como o domínio já estava validado no Vercel, a decisão (Jean, 20/08/2026) foi
ficar lá em vez de mexer em DNS.

Configuração do projeto no Vercel (já feita pelo Jean em 20/08/2026):
- Repo `JeanZorzetti/roilabs`
- **Root Directory = `site-links`**
- Framework Preset = **Other**, Build Command e Output Directory **vazios**
- Domínio `links.roilabs.com.br` movido do projeto antigo pra este

O `vercel.json` refaz o que o `nginx.conf` fazia. **Confirmado em produção:**
`/assets/*` responde com `Cache-Control: public, max-age=2592000` (30 dias) e
uma URL inexistente cai no `index.html` com 200 em vez de 404. A dúvida de
onde o Vercel lê o `vercel.json` com Root Directory em subpasta ficou
respondida: **ele lê da subpasta**, funciona onde está.

O `Dockerfile` + `nginx.conf` ficaram na pasta de propósito: se um dia o
`links.` voltar pra EasyPanel, é só criar o App com build path `/site-links` e
trocar o registro A na Cloudflare de `76.76.21.21` pra `2.24.207.200`.

Pra testar antes de subir, abra o `index.html` no navegador — só os caminhos
absolutos (`/assets/...`) não resolvem assim; nesse caso rode um servidor
estático qualquer na pasta (`npx serve .`).

## Decisões (e por quê)
- **O visual é o do protótipo `linkbio`, não o do `roilabs.com.br`.** Decisão do
  Jean (20/08/2026), com o trade-off na mesa: a página de links deixou de bater
  com o site institucional de propósito. Se algum dia isso incomodar, o commit
  `585c078` tem a versão rebrandada (cinza `#14171d`, Archivo, botão retangular
  com linha de apoio e seta) — dá pra voltar de lá.
- **Botão = pílula com uma linha só.** O protótipo não tem a linha de apoio nem
  a seta que a v1 tinha; elas saíram junto. Efeito colateral bom: sumiu o gotcha
  de altura desalinhada quando a linha de apoio quebrava em duas.
- **`.convite` quebra essa regra de propósito (21/08/2026).** Pedido do Jean:
  os botões de produto passaram a ter uma frase de venda + a marca embaixo, o
  que os deixa mais altos que os simples. Não é desalinhamento acidental — é
  hierarquia. Se um dia todos tiverem que voltar à mesma altura, o caminho é
  encurtar as frases, não mexer no CSS.
- **O selo "Em breve" é verde, não laranja.** A regra de um destaque laranja por
  página continua valendo: o laranja é do WhatsApp. Verde também é o que a
  pessoa já lê como "status", não como "clique aqui".
- **O selo pisca em respiro, não em liga-desliga.** Opacidade indo a zero num
  texto que a pessoa lê no celular é ilegível e cansa em dois ciclos. A animação
  varia cor/fundo/borda/glow e o texto nunca some. Fica dentro do bloco
  `prefers-reduced-motion: no-preference` — quem desliga animação vê o chip
  verde parado, legível.
- **Botão de produto aponta pro produto.** Quando o rótulo passou a vender
  Sirius/Orion/Meridian, o `href` foi junto (`siriuscrm.com.br`,
  `orion.roilabs.com.br`, `meridian.roilabs.com.br` — os 3 responderam 200 em
  21/08/2026). Rótulo dizendo uma coisa e link levando pra outra é o tipo de
  detalhe que queima confiança de quem veio do Instagram.
- **O `.ondas` NÃO foi copiado igual ao protótipo.** Lá o container tem
  `width:0` e, por ser `position:fixed`, o `overflow-x:hidden` do body não
  segura: o círculo maior vaza pra direita e alarga a página no celular. Aqui é
  `inset:0` + `overflow:hidden`. **Não "simplifique" isso de volta.**
- **`&nbsp;` entre "ROI" e "Labs" no `<h1>`.** Segura o nome junto: o nome
  nunca quebra no meio.
- **Sem build.** É uma página só; um pipeline Node pra isso era peso morto.
  (O `linkbio` tem um `build.js` só porque embute fonte e logo em base64 no
  HTML; aqui os arquivos ficam soltos em `assets/`, então não precisa.)
- **Pasta própria (`/site-links`), não uma rota do `/site`.** Subdomínio próprio
  = app próprio. Também evita fazer o Astro rebuildar 15 páginas pra trocar um
  link da bio.
- **Fontes self-hosted em vez de Google Fonts.** É a página que abre mais no
  3G do celular (vem do Instagram); tirar o render-block valeu os 67 KB.
- **`assets/` com cache de 30 dias, não 1 ano.** Os nomes dos arquivos não têm
  hash — com cache de 1 ano, trocar o logo exigiria renomear o arquivo.

## Verificado (Chrome headless via CDP)
- **320px, 360px, 390px e 1366px**: `document.scrollWidth == innerWidth` nos
  quatro, zero scroll horizontal.
- O título ("ROI Labs") cabe em uma linha em qualquer largura.
- Os 3 botões simples ficam com a mesma altura (o rótulo é uma linha só); os
  4 `.convite` são mais altos — as 4 frases cabem em 2 linhas até em 320px.
- Zero 404: os 4 caminhos locais (`/favicon.png`, `/assets/roilabs-icon.png` e
  os 2 `.woff2`) existem e carregam. JSON-LD parseia. Nenhum `href="#"`.
- Em produção: `<h1>` e subtítulo corretos, cache dos assets e fallback de URL
  conferidos com `curl`.
- **Rodada de 20/08/2026** (`098d7e4`), nas mesmas 4 larguras: nenhuma resposta
  `>= 400`, as duas fontes com `status: loaded`, o ícone novo entregue em
  192×192, os 7 botões todos com 60px de altura e `scrollWidth == innerWidth`
  nos quatro. `description` com 139 caracteres (cabe no snippet da busca).
- **Rodada de 21/08/2026** (esta sessão), por screenshot em 500px e em 320px
  (iframe — ver o gotcha do headless abaixo): as 4 frases dos `.convite` quebram
  em 2 linhas, nenhuma estoura a pílula, os selos verdes ficam legíveis nas duas
  pontas do piscar, e a og-image regerada bate com o `<h1>` novo.
- **Rodada de 21/08/2026, 2ª sessão** (frases dos botões 1, 2 e 3 trocadas):
  screenshot local em 520px + medição a 320px via iframe e `--dump-dom`.
  A 320px: `scrollWidth == innerWidth == 320`, nenhum `.rotulo` estoura a
  pílula, e as alturas ficaram 106 / 137 / 137 / 137 / 60 / 60 / 60 px — o
  botão 1 é o mais baixo dos `.convite` porque a frase nova cabe em 1 linha.
  Depois do push, os 7 rótulos foram relidos direto da produção.

## Histórico dos commits

| commit | o que foi |
|---|---|
| `585c078` | v1 da página: protótipo `linkbio` rebrandado pro design system do `/site` |
| `65d363d` | adota o visual do protótipo inteiro (cores, fontes, botão pílula) |
| `c6cbe95` | `vercel.json` + handoff do deploy no Vercel |
| `d91c4eb` | título vira "ECOSSISTEMA ROILABS", subtítulo vira "Centralize suas vendas agora" |
| `361ad4c` | "ROILABS" volta a ser "ROI Labs" (com `&nbsp;`) |
| `098d7e4` | og-image regerada no visual atual (+ `og-image.src.html`), metas do `<head>` alinhadas ao `<h1>`, ícone 93 KB → 26 KB |
| `758e750` | handoff atualizado + como regerar a og-image |
| `64ffbda` | título vira "ROI Labs" (menor e mais pesado), subtítulo vira "Parceiro de crescimento"; metas e og-image regeradas |
| `73e0ce4` | 1º botão vira `.convite`: frase de venda + "ROI LABS" embaixo |
| `963233d` | 2º botão vira o convite do Sirius CRM (`/modelo/` sai da página) |
| `75f4a00` | selo "Em breve · dd/mm" em 3 botões |
| `41f86ac` | o selo fica verde e pisca (respiro, dentro do `prefers-reduced-motion`) |
| `42c4c95` | 3º e 4º botões viram Orion ERP e Meridian (saem `goiania` e `/simulador/`); WhatsApp e "Candidatar" trocam de lugar |
| `ea444fc` | handoff carimba o hash do commit anterior |
| _(este)_ | frases dos botões 1, 2 e 3 encurtadas (ROI Labs / Sirius / Orion); marcas, selos, links e ordem intocados |

## Pendências / gotchas
- ⚠️ **O domínio.** O pedido original veio como `links.roylabs.com.br` (com
  **y**), mas o repo, o site, os e-mails e o schema todos usam `roilabs` (com
  **i**) — e é o `roilabs` que está no ar e funcionando. Se `roylabs.com.br`
  algum dia virar domínio de verdade, trocar em 4 lugares no `index.html`:
  `canonical`, `og:url`, `og:image` e `url` do JSON-LD.
- ⚠️ **O WhatsApp e o LinkedIn guardam a prévia antiga em cache.** A og-image
  nova já está no ar, mas quem já compartilhou o link antes de 20/08/2026 pode
  continuar vendo a imagem da v1 por dias. Pra forçar: rodar a URL no
  [Post Inspector do LinkedIn](https://www.linkedin.com/post-inspector/) e no
  [Sharing Debugger do Facebook](https://developers.facebook.com/tools/debug/)
  (o WhatsApp usa o cache do Facebook). **Ninguém fez isso ainda.**
- Nos botões **simples** o rótulo é uma linha só e centralizado: passando de ~28
  caracteres ele quebra em duas linhas no celular e aquele botão fica mais alto
  que os vizinhos. Não quebra o layout, só desalinha a pilha. Se o texto for
  mesmo de 2 linhas, use `.convite` — que é feito pra isso.
- ⚠️ **Os selos "Em breve" têm data pra sair.** 01/09, 05/09 e 20/09 (2026).
  Passada a data, apagar a linha `<span class="breve">...</span>` do botão —
  o resto do layout se ajusta sozinho. Ninguém fez isso ainda.
- ⚠️ **`orion.roilabs.com.br` está na lista de subdomínios a aposentar.**
  `Docs/Obsidian/80-dev/roilabs-subdominios-aposentados.md` põe o `orion.` entre
  os "10 mortos" que iriam redirecionar 301 pro apex. Em 21/08/2026 ele responde
  200 e é pra onde o botão do Orion aponta — mas se aquela regra da Cloudflare
  for aplicada, o botão passa a cair na home do `roilabs.com.br` **sem avisar**.
  Antes de aplicar a regra, decida o destino do Orion e troque o `href` aqui.
- O WhatsApp deixou de ser o 5º botão e virou o 6º (troca pedida em 21/08/2026,
  ele e o "Candidatar minha empresa" trocaram de lugar). Os `animation-delay`
  da entrada são por `nth-child`, então seguem a posição, não o botão — não
  precisa mexer neles ao reordenar.
- As fontes em `assets/` são subset **latin** — cobre português inteiro, mas
  não cobre cirílico/grego. Não é um problema hoje.

## Se você é a próxima sessão

**Regras desta pasta:**
1. **Commitar e dar push sem perguntar.** É a preferência do Jean neste repo.
   O push publica: `main` → Vercel → `links.roilabs.com.br` em ~30s.
2. **`git` está sombreado no PowerShell** desta máquina — resolve pra um arquivo
   vazio em `system32`. Use o caminho completo:
   `"C:\Program Files\Git\cmd\git.exe"`.
3. **Verifique antes de dizer que está pronto.** O jeito que funcionou aqui:
   subir um servidor estático na pasta, abrir no Chrome headless via CDP
   (`--remote-debugging-port`), medir `document.scrollWidth == innerWidth` em
   320/360/390/1366 e tirar screenshot. Depois do push, confirmar em produção
   com `curl https://links.roilabs.com.br/`.
   ⚠️ Pro screenshot, use **`Page.captureScreenshot` via CDP**, não a flag
   `--screenshot` com `--window-size`: a flag captura numa largura e faz o
   layout em outra, e a imagem sai com a coluna cortada na direita mesmo com a
   página inteira certa. Já me fez achar que tinha quebrado o layout.
   O motivo (descoberto em 21/08/2026): o headless tem **largura mínima de
   janela ~500px**. Pedir `--window-size=320` renderiza a 500 e recorta pra 320
   — a página parece deslocada e cortada, e não está. Sem CDP, o jeito barato de
   ver 320px de verdade é uma página com `<iframe width="320">` apontando pro
   servidor local, e tirar screenshot dela.
   Pra flagrar uma animação num frame específico, `--virtual-time-budget=N`
   congela o relógio em N ms — foi assim que os dois extremos do selo piscando
   foram conferidos (900ms = apagado, 1780ms = aceso).
   ⚠️ **`--screenshot` falha calado quando sobrou processo `chrome.exe` da
   rodada anterior** (descoberto em 21/08/2026, 2ª sessão). Sai com sucesso e
   não escreve arquivo nenhum, ou escreve "Acesso negado" se o PNG de destino
   ainda estiver travado. A cura: `Get-Process chrome | Stop-Process -Force`
   antes de cada captura, e um nome de arquivo novo. Isso explica melhor o
   comportamento que antes foi atribuído ao `--user-data-dir` — com o Chrome
   limpo, funcionou com e sem o flag.
   ⚠️ **`--dump-dom` não imprime nada quando o stdout é capturado direto pelo
   PowerShell** (`$x = & chrome ...` volta vazio). Use
   `Start-Process -RedirectStandardOutput arquivo.txt -Wait` e leia o arquivo.
   Combinado com o iframe de 320px, dá pra **medir** o layout em vez de olhar
   screenshot: um `<script>` na página de apoio lê o `contentDocument` do
   iframe (mesma origem), escreve as medidas num `<pre>`, e o dump traz tudo.
   Mais confiável que imagem pra "estourou a pílula?" e "tem scroll lateral?".
4. **Não conserte o descasamento de cor/fonte com o `roilabs.com.br`.**
   É intencional (ver "Decisões"). Pergunte antes.

**Contexto do pedido original:** a página é pra bio do Instagram e do LinkedIn
da ROI Labs. O público é fornecedor regional de alto padrão chegando pelo
celular, muitas vezes em rede ruim — por isso a obsessão com peso e com
não fazer requisição externa.
