# Handoff — site-goiania

## 2026-08-07 (noite) — 🚨 As fitas não estão na página 2. Elas estão no ESTOQUE.

> **BLUF:** o `0 impressões` das fitas não era ranking, era **descoberta**. URL Inspection
> devolve **"O Google não reconhece o URL"** nas **4/4** URLs de `/fitas/` — 200 no ar, no
> sitemap, linkadas da home indexada, e o Google **nunca soube que existem**. Causa raiz:
> **o Google baixou o sitemap uma única vez, em 03/07, com 75 URLs.** As fitas subiram em
> **22/07**, 19 dias depois. O sitemap vivo tem **99**. **24 URLs — um quarto do site —
> nunca entraram na cópia que o Google lê.** Reenviado hoje (204) e automatizado no cron.

### A medição

| URL | verdict | estado |
|---|---|---|
| `/fitas/` | NEUTRAL | **O Google não reconhece o URL** |
| `/fitas/fita-transparente-personalizada/` | NEUTRAL | **idem** |
| `/fitas/fita-gomada/` | NEUTRAL | **idem** |
| `/fitas/fita-transparente-comum/` | NEUTRAL | **idem** |
| `/carrinho-fitas/` | NEUTRAL | **idem** |
| `/` (controle) | PASS | Enviada e indexada · crawl 03/08 |
| `/porcelanato/` (controle) | PASS | Enviada e indexada · crawl 26/07 |
| `/guia/porcelanato-retificado-ou-bold/` (controle) | PASS | Enviada e indexada · crawl 03/08 |

Descartados na mesma passada: **sem** `meta robots`, canonical correto e próprio,
`robots.txt` com `Allow: /`, as 4 URLs presentes no `sitemap.xml` de prod e linkadas da home.
Nada disso era o problema.

`GET /webmasters/v3/sites/sc-domain:goiania.roilabs.com.br/sitemaps`:

```
lastSubmitted  2026-07-03T12:31:15Z
lastDownloaded 2026-07-03T12:31:16Z   ← 35 dias
submitted      75                     ← o sitemap vivo tem 99
```

### O buraco estrutural

**Nada no deploy avisa o Google.** O `postbuild` fala com o **IndexNow** (Bing/Yandex) e o
Google **aposentou o endpoint de ping em 2023** — a API do Search Console virou o único
caminho programático. Então toda malha publicada desde 03/07 dependia de o Google resolver
rebaixar o sitemap sozinho, num subdomínio que tem 2 cliques em 28 dias e portanto
prioridade de rastreio mínima. Ele não resolveu.

**Consertado:** `gsc-miner.mjs` faz `PUT` do sitemap toda rodada semanal (escopo subiu de
`webmasters.readonly` para `webmasters`; falha é non-fatal, a medição da semana vale
sozinha). Commit `ab37cdf`.

### O que isto NÃO conserta — não confundir de novo

Descoberta ≠ indexação ≠ ranking. O reenvio põe as fitas na fila; **nada garante posição**.
E não muda em nada o veredito do porcelanato: **0/40 no top 50 com 4 meses de malha
publicada** continua sendo demanda-sem-ranking, e mais página não conserta.

**Aferir em ~7 dias:** rodar de novo a URL Inspection nas 4 URLs de `/fitas/`. Se ainda
disserem "não reconhece", o problema é de autoridade/rastreio, não de sitemap — e aí a tese
de canal muda de novo.

### O funil, com o dado na mão

O Jean está certo que sem impressão não há conversão. O que a quebra por vertical mostra é
que **a camada de educação já é a que mais aparece — e é a que menos clica**:

| camada | páginas | impressões | cliques |
|---|---|---|---|
| topo — guias/conteúdo | 10 | **174** (54%) | **0** |
| fundo — porcelanato | 34 | 148 | 2 |
| fundo — fitas | 0 | **0** | 0 |

Topo de funil com **0 clique em 174 impressões** na posição ~20 não é falta de conteúdo: é
conteúdo que aparece onde ninguém rola. O gargalo do topo é **posição**, o do fundo das
fitas era **existência**.

---

## 2026-08-07 (tarde) — Executados os itens 1–4: o dado que faltava chegou

> **BLUF:** os quatro passos mecânicos da ordem sugerida foram executados. O número que ia
> mudar todas as decisões chegou: **não são 43 impressões, são 322** em 28 dias — os pares
> query×page cobriam só **22%**. Mas a leitura do canal **não muda**: 322 impressões, **2
> cliques**, posição média **19,8** (página 2), e **as fitas tiveram ZERO impressão e 0/3 no
> rank nacional**. O vertical que assumiu a home não tem presença nenhuma no Google.
> **As decisões (a)–(d) do Jean continuam abertas — agora com o dado na mão.**

### 1. Move do `docs/` ✅ já estava resolvido

Commitado em `51f3b63` (`site-goiania/{ => docs}/handoff-fitas-ecommerce.md` + `docs/Imagens/`),
`main` em dia com `origin`. Nada a fazer — o `git status` sujo do handoff anterior era da
própria sessão que o escreveu.

### 2. GSC com `dimensions: []` ✅ — o piso escondia 78% do dado

Rodado contra `sc-domain:goiania.roilabs.com.br` (28 dias, 08/07 → 05/08):

| | |
|---|---|
| **Impressões reais** | **322** |
| Cliques | **2** (CTR 0,62%) |
| Posição média | **19,8** |
| Soma dos pares query×page | 71 — **22,0%** do total |

A suspeita de [[gsc_query_dimension_hides_rare]] se confirmou: a dimensão `query` anonimiza
as raras, e ler "43 pares" como "43 impressões" errava por **7,5×**. **É "espalhado", não
"invisível"** — mas espalhado na página 2, e 322 impressões em 4 meses de malha publicada
não desmentem o diagnóstico de demanda-sem-ranking. A leitura fica **mais precisa, não mais
otimista**.

`gsc-miner.mjs` passou a ler os totais toda rodada (seção 0 da nota) — o piso nunca mais é
lido como total.

### 3. Fitas entraram nas duas medições ✅ — e o veredito é ZERO

`termoAlvo` declarado nos 3 SKUs de `fitas.ts` (`fita adesiva personalizada`, `fita gomada`,
`fita adesiva transparente`) e `rank-tracking.mjs` agora lê **os dois** catálogos.

🚨 **A localização virou parte da keyword.** O script mandava *toda* busca com
`location: Goiânia`. Fita é B2B **nacional**: medir na SERP de Goiânia mediria a SERP errada
e o primeiro veredito sobre as fitas já nasceria falso. Agora porcelanato vai geolocalizado
(40 keywords) e fita vai nacional (3).

**Resultado das duas medições, rodadas de verdade hoje:**

| medição | porcelanato | fitas |
|---|---|---|
| rank tracking (serper, top 50) | 0/40 | **0/3** |
| GSC — impressões em 28 dias | 148 (34 páginas) | **0 (nenhuma página)** |

Quebra por vertical no GSC: **guias 174** · porcelanato 148 · home/outras 6 · **fitas 0**.
Duas leituras: (1) o conteúdo **informacional** é quem traz quase toda a impressão, e ele
não vende; (2) as fitas estão no ar desde 22/07 — ~2 semanas dentro da janela — e não
receberam **uma única** impressão. Isso é jovem demais para ser veredito de ranking, mas é
veredito suficiente sobre **indexação**: vale rodar URL Inspection nas 4 URLs de `/fitas/`
antes de qualquer tese de canal ([[site_200_is_not_indexed_url_inspection]] — 200 não é
índice). A próxima rodada semanal já mede fitas sozinha.

`gsc-miner` também aprendeu que `/fitas/<slug>` é página **dedicada** — sem isso toda query
de fita entraria como "candidata a página nova" pedindo uma página que já existe.

### 4. Sujeiras do painel — uma resolvida, uma decidida

**`OBRA10`: foi desligado de propósito, não é regressão.** O banco mostra
`createdAt 01/07 13:02:01` e `updatedAt 01/07 13:05:02` — **3 minutos** de vida. Ninguém
"esqueceu ativo"; alguém desligou logo depois de criar. Deixado `ativo: false` — religar um
cupom de 10% é decisão comercial do Jean, não de sessão. (`escopo: porcelanato`, mínimo
R$ 500.)

⛔ **O lead de teste NÃO foi apagado — o ambiente bloqueou o DELETE.** O script guardado
está pronto em `app/.tmp-lead.mjs` (não commitado): confere a assinatura (`id` +
`TESTE` no nome + `verificacao ntfy` na mensagem) e **aborta** se não bater. Rodar com
`cd app && node .tmp-lead.mjs` e apagar o arquivo depois. Confirmado no banco:

| lead | o que é |
|---|---|
| `cmr534je…` · 03/07 · "Orçamento WhatsApp (carrinho)" · R$ 17.878,01 | **real** — manter |
| `cmr5g3kf…` · 03/07 · "TESTE ntfy - pode ignorar" | **lixo** — apagar |

Ou seja: o `/admin` mostra "2 novo" e o número honesto é **1**.

### O que continua aberto (decisões do Jean, itens 5-6 da ordem anterior)

Nada do que foi medido hoje responde **(a)**, **(b)**, **(c)** ou **(d)** da seção abaixo —
os quatro passos eram pré-requisito, não resposta. O que mudou é que agora a decisão **(b)**
tem números: **322 impressões / 2 cliques / pos. 19,8 em 28 dias**, com o tráfego concentrado
em **guias** e **zero** no vertical que é a cara do site. O teste real de pagamento **(a)**
segue intocado e continua sendo a única coisa que não depende do Google.

---

## 2026-08-07 — Prosseguir: a loja está pronta, o canal não entrega

> **BLUF:** `goiania.roilabs.com.br` está **completo e no ar** — 99 URLs, dois verticais,
> checkout ligado, feed no Merchant Center, LCP 2,5s — e **nunca faturou um real**. O gargalo
> não é mais construção: **0 de 40 keywords no top 50** e **43 pares query×page em 28 dias**.
> Antes de escrever qualquer linha de código nova, decidir o que fazer com o CANAL. Escrever
> a 100ª página é a coisa mais fácil e mais inútil que a próxima sessão pode fazer.

### Estado medido em 07/08/2026 (medido agora, não lembrado)

**Site (tudo 200, conferido no ar):**

| | |
|---|---|
| sitemap | **99 URLs** — 71 `/porcelanato/`, 14 `/guia/`, 10 `/fitas/` |
| home | é do vertical de **fitas** (011 shipada); `/porcelanato/` intacto |
| feed.xml | 33 itens |
| `robots.txt` / `llms.txt` | no ar, com whitelist de crawlers de IA |
| `areaServed` | já é `Brasil` **+** `Goiânia` — o risco nº 4 do briefing de fitas foi resolvido |

**Dinheiro (`roilabs_db@2.24.207.200:5443`):**

```
Pedido: 6   ·   PAGOS: 0   ·   mpPaymentId: 0   ·   NegocioOriginado: 0
LeadConsumidor: 2   ·   Candidatura: 0   ·   Cupom OBRA10: ativo=FALSE
```

| data | vertical | total | frete | chegou no MP? | itens |
|---|---|---|---|---|---|
| 07/07 | porcelanato | 7.244,45 | 150 | ❌ | marmo-perla ×25cx |
| 07/07 | porcelanato | 7.244,45 | 150 | ❌ | marmo-perla ×25cx *(duplicata do de cima)* |
| 23/07 | fitas | 2.461,05 | 361,05 | ❌ | transparente-personalizada ×200rl + clichê |
| 23/07 | fitas | 2.360,73 | 260,73 | ❌ | idem |
| 23/07 | fitas | 2.361,19 | 261,19 | ✅ | idem |
| 23/07 | fitas | 420,02 | 16,02 | ✅ | transparente-personalizada ×20rl + clichê |

🚨 **4 dos 6 pedidos nunca chegaram ao Mercado Pago.** `mpPreferenceId` é gravado na linha
**seguinte** ao `createPreference` bem-sucedido ([route.ts:138](../app/src/app/api/pedidos/route.ts)
e [:293](../app/src/app/api/pedidos/route.ts)) — nulo significa que a chamada **falhou** e o
comprador voltou com `?erro=pagamento`. Os 2 últimos do dia 23/07 têm preference, então o
caminho aparentemente foi consertado naquele dia (assinatura de token fora do env de prod —
ver [[roilabs_mercadopago_prod_env_vars]]). **Mas isso nunca foi provado ponta a ponta:
zero pagamento aprovado, zero webhook, zero `NegocioOriginado`.** A régua do success fee da
TapePro (15%/10%, spec 010) nunca rodou contra dado real.

**Demanda (cron semanal, rodou hoje 06:03; janela 04/07 → 01/08):**

| medição | resultado | arquivo |
|---|---|---|
| rank tracking (serper, Google/Goiânia) | **0 de 40 keywords no top 50** | `Docs/Obsidian/90-medicao/rank-tracking.md` |
| GSC miner | **43 pares query×page em 28 dias** · **zero** candidata a página nova (piso 20 impressões) · **uma** striking distance: `porcelanato retificado ou bold`, 15 impressões, **pos. 25,3** | `Docs/Obsidian/90-medicao/gsc-miner.md` |

### A leitura — e o que ela NÃO é

Não é "não há demanda": `porcelanato goiânia`, `loja de porcelanato goiânia`, `porcelanato
preço` são queries reais e existem no rastreio. É **demanda sem ranking**, com ~4 meses de
malha publicada. É a metade oposta da doença do Atma ([[atma_uma_pagina_uma_query_de_preco]]),
e o remédio é outro: mais páginas **não** conserta ranking zero.

⚠️ **O número do miner é PISO, não total** — a dimensão `query` do GSC esconde as raras
([[gsc_query_dimension_hides_rare]]). Antes de concluir "o site não tem tráfego nenhum",
rodar UMA leitura com `dimensions: []`. É a diferença entre "invisível" e "espalhado".

### 🚩 Achado de brinde: o vertical PRIMÁRIO não é medido por ninguém

[rank-tracking.mjs:31-37](src/scripts/rank-tracking.mjs) monta a lista de keywords lendo
`termoAlvo` de **`src/data/porcelanato.ts`** — 41 ocorrências. Em **`src/data/fitas.ts` há
ZERO `termoAlvo`**. Ou seja: as fitas assumiram a home, a nav e a identidade do site em 22/07,
e **nenhuma das duas medições semanais olha para elas**. O `0/40` acima é um veredito sobre
porcelanato; sobre fitas **não existe veredito**, e a ausência de dado está sendo lida como
ausência de resultado. Declarar `termoAlvo` nas páginas de fita é pré-requisito de qualquer
decisão sobre o canal — custa pouco e desbloqueia as duas medições de graça.

### 🚩 Duas sujeiras que contaminam o painel

1. **1 dos 2 `LeadConsumidor` é lixo de teste:** `[origem] C:/Program Files/Git/teste <-
   verificacao ntfy`. O `/admin` conta os dois e mostra "2 novo". Apagar, ou a taxa de
   conversão nasce dividida por um denominador falso.
2. **`OBRA10` está `ativo: false`** no banco, embora o seed o crie ativo. Ou foi desligado de
   propósito e ninguém anotou, ou é regressão. Decidir e anotar.

### 🚩 Pendência de git, resolver antes de qualquer coisa

`site-goiania/handoff-fitas-ecommerce.md` está **deletado** e reaparece **não-commitado** em
`site-goiania/docs/` (junto com `docs/Imagens/`). É uma movimentação de arquivo pela metade:
`git status` acusa `D` + `??`. Commitar o move, senão a próxima sessão acha que o handoff
sumiu. (Aquele arquivo é o briefing da spec 011, **já shipada** — é histórico, não pendência.)

### Decisões do Jean antes de mexer

**a) Provar o caminho do dinheiro — sim ou não?** Um pedido real, valor baixo, cartão real,
ponta a ponta: confirma preference → pagamento aprovado → webhook → `NegocioOriginado` →
success fee da TapePro. Hoje **todos os quatro elos são teoria**. ⚠️ Não vale pagamento de
teste: só o **payer** separa teste de receita ([[mercadopago_approved_is_not_a_sale]]).
**Sugestão: fazer.** É a única coisa aqui que não depende do Google.

**b) O canal.** Três saídas honestas, e a escolha é comercial, não técnica:
   1. **Insistir no SEO** — o ativo existe, mas 4 meses deram 0/40; precisa de uma tese nova
      (backlinks? GBP? conteúdo de fundo?), não de mais páginas da mesma malha.
   2. **Trocar de canal** — mas [[feedback_full_seo_no_ads]] fecha a porta do Ads.
   3. **Congelar** o investimento no goiania e realocar. É uma resposta legítima e o handoff
      não vai fingir que não é.

**c) A cadeira de porcelanato está VAGA** (`estado: vaga`, `open: true`, curadoria aberta —
corrigido em 07/08). Quem opera a loja hoje é a própria ROI Labs. Vender a cadeira **antes**
de ter tráfego provado, ou usar o tráfego como argumento de venda? Isso muda o que a próxima
sessão persegue.

**d) Fitas × porcelanato: quem é o site?** A home é de fitas (B2B nacional), o SEO todo é de
porcelanato (B2C local). Os dois verticais competem pela mesma identidade e o Google recebe
sinal misto. Manter os dois, ou escolher?

### Ordem sugerida

1. Commitar o move do `docs/` (30 s, destrava o `git status`).
2. Ler o GSC com `dimensions: []` — saber se são 43 impressões ou 4.300 muda TODAS as decisões.
3. Declarar `termoAlvo` nas páginas de `fitas.ts` e rodar as duas medições. Sem isso, decidir
   sobre o canal é decidir sobre metade do site.
4. Limpar o lead de teste + decidir o `OBRA10`.
5. Só então: a decisão **(b)**, com o dado dos passos 2-3 na mão.
6. Em paralelo e independente do Google: o teste real de pagamento **(a)**.

### O que NÃO reinvestigar (medido em 07/08)

- **Todas as rotas respondem 200** — `/`, `/fitas/`, `/porcelanato/`, `/carrinho-fitas/`,
  `/feed.xml`, `/robots.txt`, `/llms.txt`, `/sitemap.xml`.
- **`areaServed` já cobre Brasil + Goiânia.** O risco nº 4 do briefing de fitas está resolvido.
- **A spec 011 está shipada** — `/fitas/` existe, `ItemPedidoFita` é tabela própria, o
  `ItemPedido` de porcelanato ficou intocado. O `itens` vazio de um pedido de fita **não é
  bug**: são duas relações (`itens` × `itensFita`).
- **O LCP já foi resolvido** (5,9s → 2,5s, seção de 13/07 abaixo). Não é o gargalo.
- **`Candidatura` está vazia** e a única cadeira que aceita candidatura é a de porcelanato.

### Comandos

```bash
# os 6 pedidos como o banco os tem (script temporário DENTRO de app/, apagar depois)
cd app && DATABASE_URL='...' node --import tsx .tmp-x.mts

cd site-goiania && npx astro build     # 🚨 `npm run build` SUBMETE ao IndexNow (postbuild)
cd site-goiania && npm run indexnow:check
GSC_SA_KEY='<json>' node site-goiania/src/scripts/gsc-miner.mjs   # sem a chave é no-op silencioso
```

### Armadilhas que continuam valendo

- **🚨 `git push` em `main` É DEPLOY** (EasyPanel). Sem branch, sem PR.
- **🚨 `npm run build` no `site-goiania` publica no Bing** via `postbuild`. Use `npx astro build`.
- **Uma run de PSI não decide nada** — mediana de 5 (seção de 13/07).
- **URL sem barra final = 301 `http://`** no nginx; rota nova precisa respeitar.
- **`gsc-miner` sem `GSC_SA_KEY` sai com exit 0 e não faz nada** — silêncio dele não é "sem dado".

---

## 2026-07-13 — LCP da malha: 5,9s → 2,5s

> **BLUF:** LCP das páginas internas da malha caiu de **5,9s → 2,5s** (mediana de 5 runs
> do Lighthouse mobile em prod), score **68 → 92**, CLS 0,002. Meta ≤ 2,5s batida.
> Commits `14b4e1f` → `02080e2`, tudo no ar.

**O card estava errado sobre a causa.** Ele dizia "hero image sem preload/priority". Medindo
com `PerformanceObserver` em prod, o elemento de LCP era **TEXTO** — o parágrafo do hero
(`p.pseo-hero__intro`, Hanken Grotesk 400). E depois de consertar o texto, o LCP **mudou de
elemento** e virou a foto do produto. Foram duas dores em sequência, não uma. (O CLS ~1,0 do
baseline já tinha sido descartado como transiente do PSI em `b84a0f4`.)

**As 4 causas reais:**

| # | Causa | Fix | Ganho |
|---|---|---|---|
| 1 | Fontes vinham do Google: **2 conexões em série** (googleapis CSS → gstatic woff2) antes do 1º byte de fonte | Self-hosted em `public/fonts/`, variáveis, subsetadas, com preload | FCP 3,4s → 1,5s |
| 2 | `roilabs-logo.png` = **170 KB** (1159×220) exibido a 180×34, no header de **toda** página | Re-encode 560px palette PNG (cobre retina 3× e o gerador de OG, que lê o mesmo arquivo) | **170 KB → 13,8 KB** |
| 3 | Foto do produto (o novo LCP) com **41% do tempo em Load Delay**; e o 1º card usava `loading="lazy"` — lazy em imagem de LCP é o anti-padrão clássico | `preloadImage` no `Base.astro` + prop `eager` no `ProdutoCard` (só o 1º card da malha opta; grades de relacionados seguem lazy, que é o certo pra elas) | Load Delay 1,56s → 0,67s |
| 4 | `gtag.js` (**161 KB**) + Clarity baixando **durante** o carregamento, roubando banda da foto e travando o main thread que ia pintá-la | Baixam no evento `load` | −186 KB da janela crítica |

Fontes: **202 KB → 82 KB** (7 estáticas → 4 arquivos). Archivo e Hanken viraram **variáveis**:
1 arquivo cobre a faixa de pesos e custa menos que as estáticas que substitui (Archivo
600/700/800: 79,5 KB em 3 → 26,5 KB em 1).

### ⚠️ Analytics — leia antes de mexer

GA4 e Clarity baixam **depois do paint**, não durante. **Nada se perde:** `dataLayer` e
`window.clarity` são filas criadas no `<head>`, e os dois fornecedores drenam a fila quando o
script chega. Verificado no browser: gtag.js carrega, Clarity carrega e **o beacon de pageview
do GA4 sai**. O **himetrica continua carregando cedo de propósito** — são 4 KB e é ele que mede
a conversão de WhatsApp. Não mova.

### ⚠️ Uma run de PSI não decide nada

Em 11/07 o **mesmo código** deu LCP **2711ms** e **5793ms** pra *mesma home*. Na run de 13/07
pós-fix, `/calculadora/` tirou score **100** (LCP 1,81s) e `/produto/` **99** (LCP 1,81s),
enquanto as 3 páginas medidas **antes delas na sequência** deram 4,9–5,5s — worker congestionado,
não regressão. Decidir sempre por **mediana de 5 runs**.

### Pendências que isto deixou

1. ~~**IndexNow devolve 403**~~ → **diagnosticado em 13/07, ver [[bing-webmaster]]**. Não é código
   nem chave: a **mesma chave passa no apex (200) e o Yandex aceita o goiânia (202)** — só o Bing
   recusa, porque **trata o subdomínio como site à parte e ainda não o conhece**. Desbloqueio =
   importar as propriedades do GSC no Bing Webmaster (~10 min, login Microsoft — é do Jean).
   Fechar o loop depois com `pnpm indexnow:check` (não precisa de deploy).
2. **O mesmo logo de 170 KB está no institucional** (`site/public/roilabs-logo.png`). Mesma
   correção, 1 comando — mas é deploy do roilabs, então ficou fora daqui.
3. O que ainda segura o LCP em 2,5s (e não 1,5s) é o **main thread**: os scripts interativos da
   própria página (busca, carrinho, favoritos, zoom) somam ~677ms de script eval sob throttle 4×.
   Adiá-los pra idle é o próximo passo — **mas o botão "Buscar" é injetado por JS no header, então
   adiar sem cuidado reintroduz CLS** (hoje 0,002). Não valeu o risco agora.

Regerar fontes: `Docs/Obsidian/80-dev/fontes.md`. **Não** subsete pelos caracteres literais do
HTML — `text-transform: uppercase` renderiza Á/Ã/Ç a partir de texto minúsculo, e o subset
literal quebra os títulos. Latin-1 fica inteiro.

## 2026-07-04 — Ciclo 14: capas do hub sem repetição + fachada/60x60 com foto real

> Pedido direto do Jean: as 34 fotos do catálogo apareciam repetidas nos cards de `/porcelanato/`, e 2 categorias (`porcelanato-fachada`, `porcelanato-60x60`) não tinham NENHUM produto casando (zero foto, zero galeria).

**Causa raiz (uma só, 2 sintomas):** `capaDe()` em `index.astro` sempre pegava `produtosDaCategoria(slug, tipo)[0].imagens[0]` — o 1º produto que bate a tag/tipo. Como várias categorias compartilham a mesma tag (ex.: 5 páginas "amadeirado", 4 páginas "antiderrapante") ou são `BROAD` (retornam o catálogo inteiro), o `[0]` era sempre o MESMO produto — `porcelanato-20x120-carvalho-natural` (posição 0 do JSON) virou capa de **14 dos 40 cards**.

**Fix 1 — cobertura sem repetição (`index.astro`):** antes do render, monta um `Map<slug, imagem>` percorrendo as 40 páginas na ordem declarada: pra cada categoria, tenta um produto ainda não usado por nenhuma outra (1ª passada); se não sobrar produto novo, aceita repetir produto mas com outra foto dele (2ª passada); só repete a MESMA foto quando a categoria não tem nenhuma alternativa real no catálogo. Resultado: **40/40 cards com capa, 37 fotos distintas** — só as 4 páginas da família "amadeirado" (`-cozinha`, `-varanda`, `-sala` + a genérica) repetem, porque **existe apenas 1 produto amadeirado em todo o catálogo** (`ponytail: ceiling de estoque, não bug — só desaparece se entrar um 2º produto amadeirado no JSON`).

**Fix 2 — 2 categorias com zero produto (`produtos.ts::tagsDoProduto`):** nenhum produto tinha a dimensão exata "60x60" nem a tag "fachada" existia. Em vez de forçar manualmente essas 2 páginas, estendi a mesma função que já casa produto→categoria (raiz única, os 2 lugares que chamam — hub e página da categoria — ganham de graça):
- `porcelanato-60x60` passou a aceitar `62x62` também (mesmo padrão já usado pra 90x90/91x91 no código) → pega `Avorio Polido` (Delta, 62×62cm) como opção real, foto e ficha técnica corretas (a página mostra "62×62cm" de verdade, não finge ser 60×60).
- `porcelanato-fachada` ganhou a tag de qualquer produto com acabamento Externo/Rústico (já eram tagueados p/ área externa) → 5 candidatos reais (Grigio Externo, Grigio Externo 90x90, Arezzo Externo, Castilla Noce, Chicago 80x80 Grafite).

Ambas as páginas de categoria (`/porcelanato/porcelanato-fachada/` e `/porcelanato/porcelanato-60x60/`) agora renderizam hero-strip + galeria/ficha de produto (antes: só texto, `produtosRel.length === 0`).

Build local (`astro build`, 85 páginas) + `check-feed.mjs` verificados OK. Nada de novo pra rodar em prod — muda só qual foto aparece, sem novo asset.

### Addendum mesmo dia: 0 repetição de verdade (Jean recusou o "só 4 páginas repetem")

O Jean pediu pra minerar mais fotos até não sobrar NENHUMA repetição — o gap eram as 5 páginas "amadeirado" (só 1 produto real no catálogo pra todas elas). 2 fixes, sem produto novo:
1. **`capaDe()` passou a considerar `imagensAmbiente` também**, não só `imagens` — a foto de ambiente do carvalho-natural (já baixada no ciclo 11, nunca usada como capa) virou 1 opção grátis.
2. **Minerei 2 fotos novas de verdade** direto do site oficial (`biancogres.com.br/pt_BR/produto/carvalho-natural`, media 11025 "face-1" e 11028 "face-2" — close-ups de textura, framing diferente das 2 já usadas) e rodei `node src/scripts/fetch-images.mjs` (fluxo padrão, mesmo dos ciclos 11/13): baixou pra `public/img/produtos/porcelanato-20x120-carvalho-natural-{3,4}.jpg`, gerou `.webp`, reescreveu `porcelanatos.json` com o caminho local.

Resultado: `porcelanato-20x120-carvalho-natural` foi de 2 pra 4 fotos de catálogo + 1 ambiente = **5 fotos reais**, exatamente o que as 5 páginas amadeirado precisavam. **40/40 cards do hub com capa, 40/40 fotos distintas — zero repetição confirmada** no HTML buildado (`grep`+`uniq -c`, todas com count 1) e visualmente via Playwright.

---

## 2026-07-04 — Ciclo 13: acervo fechado em 25/30 (era 23/30) + lupa em hover na galeria

> Fecha o handoff do ciclo 12 abaixo. As 3 decisões que só o Jean podia bater o martelo foram resolvidas via pergunta direta (AskUserQuestion); 1 decisão adicional (Onix Bianco Lux) tomada por mim por consistência com a regra já aplicada ao Delta.

### Acervo — decisões

| Pendência | Decisão do Jean | Resultado |
|---|---|---|
| **Grigio Externo 90x90** (3 candidatos empatados) | Passou 2 fotos próprias em vez de escolher uma das 3 coleções | `imagensAmbiente[0]` = `porcelanato-grigio-externo-90x90-1.png` (a 2ª, `-2.webp`, ficou salva mas não usada — UI só renderiza `imagensAmbiente[0]`) |
| **Lux 100x100** (~24 produtos com o nome) | Aceitou o risco de foto genérica | Reaproveitada a foto de `pulpis-grigio-ac-100x100cm-biancogres` — o próprio arquivo da Biancogres já rotula a variante "pulpis-grigio-lux-100x100" entre as que mostra, é o match genérico mais próximo real que existe (adicionado em `AMBIENTE_POR_SLUG`) |
| **Delta (4) + Onix Bianco Lux `bianco-luz-polido-biancogres` (1)** | — (não perguntado; decisão minha) | **0/5 permanente, documentado.** Mesma regra do Delta original: 2 buscas já confirmaram que nenhum tem foto de ambiente real (só simulador/close-up de textura) — mostrar isso seria enganoso, pior que não ter foto. |

**Total: 25/30.** Teto até surgir nova informação (ex.: Jean identificar a coleção exata do Lux, ou a Biancogres fotografar ambiente do Onix Bianco Lux).

⚠️ **Pendente confirmar com o Jean**: as 2 fotos do Grigio Externo 90x90 vieram por fora do fluxo `media-miner` (arquivos passados direto, não uma URL do site oficial) — não confirmei a origem. A seção `prod-ambiente` legenda toda foto como "foto do fabricante"; se essas 2 não forem da Biancogres, o texto fica incorreto pra esse produto.

### Lupa em hover na galeria (pedido do Jean, estilo Mercado Livre)

`ProdutoDetalhe.astro` + `global.css`: thumbs em coluna à esquerda em ≥880px quando há >1 foto (`.has-thumbs`); em desktop com mouse (`hover:hover`+`pointer:fine`+≥1180px) passar o cursor na foto principal abre um painel com zoom 2,5× seguindo o cursor, via `background-position`/`background-size` em % (sem dependência nova). Reaproveita o `data-full` (full-res original) que já existia pro `<dialog>` de zoom do ciclo 11 — clique continua abrindo o fullscreen em qualquer dispositivo, a lupa é um atalho a mais pro desktop. `ponytail:` painel sempre abre à direita sem detecção de borda; se `min-width:1180px` ainda deixar o painel invadindo o texto em alguma resolução, ajustar o limiar ou adicionar flip-to-left.

### 2ª foto por produto (Jean voltou atrás — a lupa só faz sentido com >1 foto)

Só 1/30 produtos tinha 2+ fotos, então a coluna de miniaturas não aparecia em quase nenhuma página — o Jean notou isso ao testar em prod e pediu pra minerar a 2ª foto depois de ter dito "deixe como está" antes. Resultado: **21/30 com 2+ fotos**.

- **16 Biancogres + Onix Bianco Lux (`bianco-luz-polido-biancogres`)**: páginas oficiais `biancogres.com.br/produto/<slug>` (achado por WebSearch quando o slug não era óbvio, ou o filtro interno `?nome-produto=` quando o Google não indexava — mesmo achado do ciclo 12). Toda página tem várias fotos `f01`/`f02`.../`f12` de close-up com **media ID sequencial ao da foto de ambiente já usada** (ex.: ambiente=media/17572 → f02=media/17573) — acelera achar a página certa. Escolhida 1 foto por produto (`f2` ou similar), adicionada em `imagens[1]`.
- **4 Delta**: `deltaceramica.com.br/produto-in.php?id=N` tem `files/product/img_*.jpg` (foto de textura real) SEPARADA de `files/simulator/` (a renderização genérica já rejeitada no gate de ambiente) — a de produto é uma foto real do material, válida pra galeria (diferente de reivindicar "ambiente"/room). IDs achados por `site:deltaceramica.com.br "<nome> <dimensão>"`.
- **Savane (8) NÃO tem 2ª foto — estrutural, confirmado na página real (não é busca malfeita)**: o carrossel do produto mostra só 1 thumbnail; "ver foto do ambiente" é um TOGGLE separado, não uma 2ª foto da galeria. Não existe close-up adicional pra minerar.
- **`porcelanato-grigio-externo-90x90` ficou de fora** de propósito — mesma coleção ainda ambígua (3 candidatos empatados), adicionar uma foto de produto arriscaria a mesma coisa que já foi evitada no ambiente.

Script: URLs entraram direto em `imagens[1]` no `porcelanatos.json`, depois `node src/scripts/fetch-images.mjs` (já existente, sem mudança) baixou+gerou os `.webp`. Verificado via Playwright nas 2 páginas que o Jean apontou como exemplo (`marmo-perla`, `cristallo-quartz`): `.has-thumbs` ativo, 2 thumbs, imagem principal 200.

---

## 2026-07-04 — Ciclo 12: acervo de ambiente — 23/30 (era 6/30), handoff pra ciclo 13

> Continuação do ciclo 11 item 5. 2 levas: (1) WebSearch+Playwright manual, (2) ferramenta `media-miner` (`ROI Labs/media-miner`) usando o filtro de busca interno dos próprios sites, que desbloqueou quase tudo que a 1ª leva não achava.

### Resultado final

| Marca | Ciclo 11 | Leva 1 (WebSearch) | Leva 2 (media-miner) | Final | Faltando |
|---|---|---|---|---|---|
| **BIANCOGRES** | 6/18 | 11/18 | **15/18** | **15/18** | 3 |
| **SAVANE** | 0/8 | 2/8 | **8/8** | **8/8** | 0 — completo |
| **DELTA** | 0/4 | 0/4 | 0/4 | 0/4 | 4 (não é falha) |

**Total: 23/30** (era 6/30 no início do ciclo).

### Virada de leva 2 — `media-miner`

A leva 1 ficou limitada pelo que o Google indexa (`site:` search). Os dois sites têm filtro de busca **interno** que o Google não expõe:
- **Biancogres**: `biancogres.com.br/pt_BR/produtos?nome-produto=<termo>` — retorna até 12 produtos por página, `&page=2` pagina (não `&pagina=`). Achado inspecionando um link já indexado que trazia esse query param.
- **Savane**: `savane.com.br/produtos?search=<termo>` — descoberto por tentativa (nome/busca/query/q todos ecoavam o carrossel padrão; só `search=` filtrava de verdade).

Com isso, **Savane fechou 8/8** (todos os produtos do catálogo achados): Strato Marmo Bege/Grigio (56x113 Relevo), Perla Acetinado (91x91 — havia 4 variantes de "Perla", só a `-461` bate a dimensão), Pietra di Trulli (56x113 Relevo), Terrazine (91x91 Acetinado — havia bianco E grigio na mesma dimensão; **escolhido Bianco** por ser o nome "neutro" já que o catálogo não especifica cor, ambiguidade documentada), Rock Face Matera (56x113 Relevo).

Biancogres foi de 11/18 pra **15/18**: Legado Grigio (20x120 Acetinado, exato), Castilla Noce (80x80 "Ext +", exato), **Travertino Tivoli STR (120x120 Strutturato, finalmente achado — só aparecia junto com Satin/EXT/Rock antes)**, Grigio Externo 100x100 = **Persia Grigio Ext** (100x100 Externo, exato — collection name diferente do slug genérico do catálogo, mas dimensão+finish batem).

### O que ficou de fora — agora só 3, todos genuinamente ambíguos (não é busca malfeita)

- **Biancogres — Grigio Externo 90x90**: 3 candidatos igualmente válidos (Arezzo Grigio Ext, Cannes Terrazzo Grigio Ext, Cemento Grigio Ext+), todos 90x90/Externo, m²/caixa e peças/caixa IDÊNTICOS entre os 3 (spec de caixa padrão da marca, não desambigua) — mas são **texturas visuais diferentes** (mármore, terrazzo, cimento). Catálogo não dá pista de qual coleção. Forçar um dos 3 arrisca mostrar textura errada.
- **Biancogres — Lux 100x100**: nome genérico demais — ~24 produtos diferentes têm "Lux" no nome (é um sufixo de acabamento, não uma coleção). Sem mais contexto no catálogo, impossível saber qual.
- **Onix Bianco Lux (60x120 Polido)**: página existe, dimensão bate, mas só tem fotos de textura/peça — nenhuma com prefixo `ambiente-` (achado na leva 1, confirmado de novo).
- **Delta**: confirmado de novo (leva 1) — `/files/simulator/` genérico + `/files/faces/` textura, nunca teve pasta de ambiente real.

### Método — ferramenta nova: `media-miner`

`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\media-miner` (`node miner.mjs --url <url> --spa --types image --out <dir>`, ou uso direto de `lib.mjs`/Playwright pra ler `<img>`/network). Baixa TODA mídia de uma página (não filtra "ambiente" vs textura — isso é curadoria manual depois, olhando o nome do arquivo). O ganho real não foi o download (isso o Playwright manual já fazia) e sim ter um script reaproveitável pra testar rápido vários `?query=` candidatos num site e ver quantos `/produto/` únicos cada um retorna — **descobrir o parâmetro de busca interno de um site é o pulo do gato quando o Google não indexa a listagem completa** (`/produtos` de ambas marcas mostra só um carrossel de ~12 itens, nunca o catálogo todo — confirmado inclusive checando chamadas de rede, sem API JSON separada).

- Precisa `npx playwright install chromium` na 1ª vez (browser não vem instalado com o `node_modules`).
- Slugs "-ac-" no catálogo = abreviação de "Acetinado" (reforça achado da leva 1).
- Biancogres: clicar no seletor de tamanho (`label.product__sizes__button`) antes de ler `Acabamento`/`M²/Caixa` — o valor exibido muda por formato.

### Próximos passos (ciclo 13, se for ampliar mais)

1. **2ª foto por produto (textura)** — item 4 do ciclo 11, ainda não feito.
2. **Vídeo por SKU** — decisão do Jean ainda pendente.
3. Os 3 restantes (Grigio Externo 90x90, Lux 100x100, Onix Bianco Lux, Delta) só desbloqueiam com decisão humana (qual "Lux"? aceitar foto genérica de textura? Delta nunca vai ter ambiente) — não vale reprocessar sem isso.

### Gotchas (novos)

- **`AMBIENTE_POR_SLUG` em `fetch-ambiente.mjs` agora tem 23 entradas** — script rodado, `23/23 fotos de ambiente` baixadas, `porcelanatos.json` atualizado, build 85 págs + `check-feed` OK.
- **Terrazine (Savane) escolhido "Bianco" sobre "Grigio" por convenção, não por certeza** — se o Jean notar a cor errada no site, trocar pro slug `terrazzine-grigio-463` (mesma dimensão/acabamento, `ambiente-` disponível).

---

## 2026-07-04 — Ciclo 11 item 5: acervo de ambiente — PARCIAL, handoff pra ciclo 12

> Objetivo do item: dar ao catálogo (30 produtos, média 1,1 foto/cada) fotos de ambiente decorado + vídeo. Ciclo 11 fechou com 6/30 — este handoff existe pra ciclo 12 ampliar sem repetir descoberta já feita.

### Feito

- `src/scripts/fetch-ambiente.mjs`: mapa curado manualmente (`AMBIENTE_POR_SLUG`, slug → URL oficial do fabricante), baixa a foto pra `public/img/ambientes/`, gera `.webp` ≤1200px, grava `imagensAmbiente[0]` no `porcelanatos.json`.
- 6 correspondências confirmadas (mesma coleção **e** mesma dimensão do produto, não aproximação): todas **Biancogres** — Marmo Perla (60x120), Arezzo Grigio (120x120), Arezzo Beige EXT (90x90), Arezzo Beige Satin (90x90), Chicago Grafite (80x80), Persia Beige (100x100).
- Renderização: seção "Veja em ambiente" em `ProdutoDetalhe.astro` + hero da malha (`[slug].astro`) usa a foto de ambiente no lugar da foto de produto quando existe.
- Vídeo: capacidade de renderizar (`<iframe>`) implementada, **nenhum vídeo atribuído** — ver "Vídeo" abaixo.

### Cobertura atual por marca (o que falta pro ciclo 12)

| Marca | Cobertos | Faltando |
|---|---|---|
| **SAVANE** | 0/8 | **Nunca pesquisado** — site oficial nem tinha sido identificado até este handoff. |
| **DELTA** | 0/4 | Pesquisado, sem correspondência exata encontrada (ver "Delta" abaixo). |
| **BIANCOGRES** | 6/18 | Pesquisa parcial — método funciona, só faltou tempo. |

Slugs pendentes (pra não repetir o levantamento):

**Biancogres (12 faltando):** `porcelanato-20x120-carvalho-natural` (20x120 Natural) · `porcelanato-cristallo-quartz-biancogres` (60x120 Velvet) · `porcelanato-legado-grigio-ac-biancogres` (20x120 Acetinado) · `porcelanato-bianco-luz-polido-biancogres` (60x120 Polido) · `porcelanato-120x120-tivoli-biancogres` (120x120 Strutturato) · `porcelanato-grigio-externo-biancogres` (100x100 Externo) · `porcelanato-pulpis-grigio-ac-100x100cm-biancogres` (100x100 Mate) · `porcelanato-chicago-nebbia-biancogres` (100x100 Acetinado) · `porcelanato-chigaco-grigio-biancogres` (100x100 Acetinado) · `porcelanato-100x100-lux-biancogres` (100x100 Polido) · `porcelanato-grigio-externo-90x90` (90x90 Rústico) · `porcelanato-castilla-noce-biancogres` (80x80 Externo).

**Delta (4 faltando):** `porcelanato-madrid-bloc-polido-delta` (72x72 Polido) · `porcelanato-nero-polido-delta` (60x120 Polido) · `porcelanato-avorio-polido-delta` (62x62 Polido) · `porcelanato-72x72cm-nero-polido` (72x72 Polido).

**Savane (8 faltando, todos):** `porcelanato-56x113cm-strato-marmo-bege` · `porcelanato-56x113cm-strato-marmo-grigio` · `porcelanato-90x90cm-urban-branco-polido` · `porcelanato-91x91cm-perla-acetinado` · `porcelanato-56x113cm-pietra-di-matera-natural` · `porcelanato-56x113cm-pietra-di-trulli-natural` · `porcelanato-terrazine-91x91cm-savane` · `porcelanato-rock-face-matera-savane`.

### Método que funcionou (repetir no ciclo 12)

- **Biancogres**: página de produto vive em `biancogres.com.br/pt_BR/produto/<slug-do-modelo>`. A listagem `/pt_BR/produtos` **pagina e não mostra o catálogo todo** — não perder tempo navegando ali. O que funciona: busca Google `site:biancogres.com.br "<nome do modelo>"` (ex.: `"legado grigio"`, `"pulpis grigio"`) pra achar a URL direto, depois abrir a página e procurar imagens com `ambiente-` no nome do arquivo (`media/<id>/conversions/ambiente-...-thumb_480p.jpg`) — as sem esse prefixo são close-up de textura, não servem. **Conferir a dimensão no nome do arquivo ou na ficha técnica da página antes de usar** — a mesma coleção pode ter várias fotos de ambiente, uma por tamanho.
- **Delta**: catálogo real é `deltaceramica.com.br` (⚠️ **não** `deltaporcelanatonova.com.br` — esse é de um revendedor específico com catálogo bem menor e desatualizado). Produto individual em `deltaceramica.com.br/produto-in.php?id=N`; achar o `id` via `site:deltaceramica.com.br "<nome do modelo>"`. **Problema real**: a maioria dos produtos Delta pesquisados só tem foto de textura + 1 imagem de "simulador" (`files/simulator/`), que é uma renderização genérica, não uma foto de ambiente real — não vale usar como "veja em ambiente" (seria enganoso). Cobertura Delta pode ficar em 0% mesmo com busca completa; não é falha de método.
- **Savane**: site oficial é `savane.com.br/produtos` — achado agora, mas a estrutura de produto/imagens ainda não foi explorada. Primeiro passo do ciclo 12.

### Próximos passos (ciclo 12, em ordem de retorno)

1. **Savane primeiro** (0/8, zero esforço já investido) — mapear a estrutura de `savane.com.br/produtos`, repetir o método de busca por nome de modelo.
2. **Completar Biancogres** (12 faltando, método já validado — é só tempo): repetir `site:biancogres.com.br "<modelo>"` pros 12 slugs da lista acima.
3. **Delta**: 1–2 tentativas adicionais por nome exato; se não achar, aceitar 0% de cobertura pra essa marca (documentado, não é buraco silencioso).
4. **2ª foto por produto (textura, não ambiente)**: as próprias páginas da Biancogres já expõem várias fotos de close-up por modelo (`f02`, `f03`... no nome do arquivo) que ciclo 11 viu mas não usou (o item 5 só filtrou "ambiente"). Reaproveitar essas listas já levantadas pra popular `imagens[1]`, `imagens[2]` sem nova busca — ganho rápido.
5. **Vídeo por SKU**: nenhum encontrado ainda. O que existe é vídeo genérico de marca no YouTube (ex.: "PORCELANATO #BIANCOGRES POLIDO E ACETINADO 90X90") — não é do produto específico. Decisão de escopo do Jean: usar vídeo genérico rotulado como "sobre esta linha" (transparente sobre não ser do SKU exato) ou continuar sem vídeo até achar um específico.

### Gotchas

- **Mineração é 100% manual/curada** — `WebSearch` + `WebFetch`, um produto por vez, sem crawler automático. Cada entrada exige confirmar visualmente que dimensão/acabamento batem antes de entrar no mapa; forçar uma foto de coleção/tamanho diferente é pior que não ter foto (mostra o produto errado pro cliente).
- **`AMBIENTE_POR_SLUG` está hard-coded dentro de `fetch-ambiente.mjs`** — pra 6 itens está bom; se o ciclo 12 for adicionar os ~24 restantes, considerar extrair pra um JSON externo (`ambiente-map.json`) só se a manutenção do array inline ficar incômoda — não vale a abstração antes disso.
- **Risco de direito autoral já decidido e registrado** — memória `roilabs-scraped-media-risk-accepted`: Jean aceitou publicar imagens oficiais dos fabricantes sem autorização formal por escrito, mas **só pra marcas que a ROI Labs já revende** (Biancogres/Delta/Savane no catálogo atual). Não generalizar pra fotos de terceiros (Pinterest, Instagram alheio, blogs de decoração) sem uma nova confirmação do Jean.

## 2026-07-02 — Feature 009: feed Google Merchant Center (free listings)

### Feito

- `src/pages/feed.xml.ts`: feed RSS 2.0 + namespace `g:` com os 30 produtos do catálogo (contrato: `specs/009-merchant-center-feed/contracts/feed-xml.md`). Gerado no build, servido estático pelo nginx em `/feed.xml`.
- Paridade página↔feed por construção: `tituloProduto()`, `descricaoProduto()` e `elegivelParaFeed()` extraídos para `src/data/produtos.ts`; a página de produto (`porcelanato/produto/[slug].astro`) e o feed consomem os mesmos helpers (política do Google: título/preço/imagem do feed = página).
- Gate pós-build `src/scripts/check-feed.mjs` (`postbuild` no package.json): valida `dist/feed.xml` (declaração XML, estrutura rss/channel, contagem = catálogo, campos obrigatórios por item, formato do preço, encoding sem mojibake/& cru) e derruba o build com produto inelegível (slug + campo).
- Doc ops `docs/merchant-center.md`: conta → verificação de domínio (via Search Console) → cadastro do feed com busca diária → free listings → diagnóstico + troubleshooting.
- `.dockerignore` criado (não existia; acelera build Docker).

### Evidência (Constituição II — local é smoke; prod pendente de deploy)

- `npm run build` verde: `check-feed OK — 30 itens em dist/feed.xml`; primeiro `<item>` conferido manualmente (acentos e "²" íntegros, todos os campos).
- Gate provado: `preco=0` no primeiro produto → build falha exit 1 apontando `porcelanato-20x120-carvalho-natural (preco=0)` (pego já no `check-matrix` prebuild; `check-feed` cobre a camada do artefato). Catálogo restaurado, build verde de novo.

### Decisões (research.md D1–D9)

- Preço = R$/m² (igual à página) + `unit_pricing_measure=1sqm`; fallback documentado = preço por caixa se a revisão do Google reprovar.
- Sem GTIN/MPN → `g:identifier_exists=no` + brand.
- `availability=in_stock` fixo (sem estoque em tempo real); sem frete nesta fase.
- Zero dependência nova; validação regex-level (`ponytail:` no script — parser XML real só se o feed ganhar estrutura dinâmica).
- Produto inelegível = ERRO de build (catálogo curado; corrigir na fonte), não omissão silenciosa.

### Próximos passos

1. ~~Redeploy + verificação em prod~~ **FEITO 2026-07-02**: deploy automático por push; `feed.xml` em prod com 30 itens íntegros (T011).
2. ~~Cadastro no Merchant Center~~ **FEITO 2026-07-02** (T012): conta criada, feed cadastrado com busca diária, 30/30 processados sem erro estrutural (SC-002 ✓). Entrega configurada (corte 14h BRT, separação 0–1, trânsito 2–6, frete por destino R$150–220) e política de devolução exigida pelo MC → página `/devolucoes` criada (CDC: 7d arrependimento, 90d defeito, reembolso 7d, sem taxa).
3. ⏳ **Acompanhar a revisão do Google (~3 dias)**: Produtos → Diagnóstico, meta ≥ 90% aprovados (SC-003). Reprovações prováveis e ações na tabela de troubleshooting do `docs/merchant-center.md` (imagem em CDN de terceiro é o suspeito nº 1).

### Gotchas

- Imagens do feed apontam pra CDN de terceiro (`jurunense.vteximg.com.br`) — se o Google reprovar por imagem não-rastreável, hospedar local (tabela de troubleshooting no doc ops).
- `g:id` = slug: mudar slug de produto reseta o histórico do item no Google — evitar renomear.
- `check-matrix` (prebuild) já valida preço/imagem na FONTE; `check-feed` (postbuild) valida o ARTEFATO — os dois gates são complementares, não redundantes.
