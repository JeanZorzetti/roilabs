# HANDOFF — links.roilabs.com.br (página de links)

> **Abrindo isto numa aba nova?** Leia o "Estado atual" e o "Se você é a próxima
> sessão" no fim. O resto é referência.
> Última atualização: **20/08/2026**, commit `098d7e4`.

## Estado atual — 20/08/2026

🟢 **NO AR** em https://links.roilabs.com.br/ — servido pelo **Vercel**,
com deploy automático a cada push no `main`. Não precisa mexer em painel
nenhum pra publicar: `git push` já republica.

O que a página mostra hoje:

- Título: **ROI Labs**
- Subtítulo (mono, caixa alta): **PARCEIRO DE CRESCIMENTO**
- Promessa: "Construímos sua venda online. / Você paga quando vende."
- 7 botões em pílula, só o do WhatsApp em laranja. Os dois primeiros são
  `.convite` — mais altos de propósito, com uma frase de 2 linhas + a marca
  embaixo na letra do subtítulo: **ROI LABS** (site) e **SIRIUS CRM**
  (siriuscrm.com.br).
- Selo "Em breve · dd/mm" **verde piscando** em 3 botões: Sirius CRM (01/09),
  operação no ar (05/09) e simulador (20/09). Os links continuam clicáveis.
- Instagram, LinkedIn, e-mail + rodapé

A prévia que aparece ao compartilhar (`assets/og-image.jpg`) repete esses três
primeiros itens no mesmo visual da página — desde `098d7e4` elas batem.

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
  Links reais tirados do `/site`: home, `siriuscrm.com.br`,
  `goiania.roilabs.com.br`, `/simulador/`, `wa.me/5562993265713`,
  `/#candidatar`, `/blog/`. O `/modelo/` saiu quando o 2º botão virou o
  convite do Sirius CRM (20/08/2026) — se quiser de volta, é um botão novo.
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
- Os 5 botões simples ficam com a mesma altura (o rótulo é uma linha só); os
  2 `.convite` são mais altos — cabem em 2 linhas até em 320px.
- Zero 404: os 4 caminhos locais (`/favicon.png`, `/assets/roilabs-icon.png` e
  os 2 `.woff2`) existem e carregam. JSON-LD parseia. Nenhum `href="#"`.
- Em produção: `<h1>` e subtítulo corretos, cache dos assets e fallback de URL
  conferidos com `curl`.
- **Rodada de 20/08/2026** (`098d7e4`), nas mesmas 4 larguras: nenhuma resposta
  `>= 400`, as duas fontes com `status: loaded`, o ícone novo entregue em
  192×192, os 7 botões todos com 60px de altura e `scrollWidth == innerWidth`
  nos quatro. `description` com 139 caracteres (cabe no snippet da busca).

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
- O rótulo do botão é uma linha só e centralizado: passando de ~28 caracteres
  ele quebra em duas linhas no celular e aquele botão fica mais alto que os
  vizinhos. Não quebra o layout, só desalinha a pilha.
- ⚠️ **Os selos "Em breve" têm data pra sair.** 01/09, 05/09 e 20/09 (2026).
  Passada a data, apagar a linha `<span class="breve">...</span>` do botão —
  o resto do layout se ajusta sozinho. Ninguém fez isso ainda.
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
4. **Não conserte o descasamento de cor/fonte com o `roilabs.com.br`.**
   É intencional (ver "Decisões"). Pergunte antes.

**Contexto do pedido original:** a página é pra bio do Instagram e do LinkedIn
da ROI Labs. O público é fornecedor regional de alto padrão chegando pelo
celular, muitas vezes em rede ruim — por isso a obsessão com peso e com
não fazer requisição externa.
