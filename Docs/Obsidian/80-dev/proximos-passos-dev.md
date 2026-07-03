---
tipo: checklist
status: vivo
data: 2026-07-02
dono: Jean (dev)
---

# ✅ Próximos passos — DEV (Jean)

> [!info] Onde estamos (2026-07-02)
> **MVP no ar e muito além dele.** `roilabs.com.br` (site + blog GEO), `goiania.roilabs.com.br` (e-commerce + malha pSEO 39 páginas) e `app.roilabs.com.br` (admin Next 16) em produção. Features 001→008 shippadas na `main`, incluindo todo o backlog GEO/analytics de 07-01/07-02 (himetrica, llms.txt automático, sameAs, schema da home, OG por artigo).
> **Nada de código bloqueia.** O que resta é **deploy + verificação + 1 config externa** — a seção "agora" abaixo é a lista autoritativa. O estratégico do vault segue `decided` — ver [[INDEX]].

> [!warning] O que NÃO é seu
> Fechar 1º fornecedor (Gate 3), piso de take rate em R$, prospecção de players = **Maria Eduarda / campo**. Não entram aqui.

---

> [!important] 2026-07-03 — Faxina de backlog
> **Tudo que estava não-feito abaixo foi movido para [[backlog-pendencias]]** (não é prioridade agora). A lista ativa é a seção [[#🧭 Fora da caixa — ciclo 5 (2026-07-03)|Fora da caixa — ciclo 5]].

## 🎯 Agora (2026-07-02) — lista autoritativa

### Caminho crítico (em ordem)

- [x] **1. Redeploy do `/site` e do `site-goiania` na EasyPanel.** Publica 5 entregas já na `main`: eventos himetrica (`7f3a4eb`), `llms.txt` automático da coleção (`ecb94e2`), `sameAs` LinkedIn+Instagram (`57f69c9`), `Service`+`Offer` na home + breadcrumbs nos artigos (`6deee61`) e OG image por artigo (`038a9ca`). Há commits novos → o cache de layer do Docker busta sozinho (gotcha `easypanel-docker-build-cache-stale-dist` não se aplica).
- [x] **2. Verificar em prod (browser, pós-deploy):**
	- `roilabs.com.br/llms.txt` lista os artigos do blog (gerado da coleção, não mais o manual);
	- OG de 1 artigo responde PNG em `/open-graph/...` e aparece no preview (opengraph.xyz ou similar);
	- JSON-LD da home valida com `Service`+`Offer` (validator.schema.org) e `sameAs` presente nos 2 sites;
	- **eventos himetrica chegando no painel**: `whatsapp_click` nos 2 sites, `candidatura_convertida` (institucional), `pedido_convertido`/`lead_convertido` (goiânia). Dedupe por sessionStorage — testar reload do `/obrigado` não duplica.
- **3. Configurar o Asaas** → movido para [[backlog-pendencias]].

### Depois (dev, ranqueado por alavanca)

- [x] **LP/ajustes para Google Ads** quando a campanha `porcelanato goiânia` (140/mês, CPC alto — âncora validada no Keyword Planner, [[mercado]]) for ao ar. Nada a fazer antes de a Duda decidir a campanha.
- GSC (medição da malha) e Gatekeeper (bloqueado) → movidos para [[backlog-pendencias]].

## 🧭 Fora da caixa — próximo ciclo (2026-07-02)

> [!note] O que ninguém pediu mas o negócio precisa. Verificado contra o código: nada abaixo existe ainda (exceto onde indicado). Item grande = virar spec (009+) antes de codar.

### 🛡️ Proteger o que está no ar

- Backup do Postgres, uptime monitor e alerta de lead/pedido → movidos para [[backlog-pendencias]].

### 📣 Distribuição grátis (alavanca GEO/SEO que quase ninguém local usa)

- [x] **⭐ Google Merchant Center — CONCLUÍDO 2026-07-02 (spec 009).** Feed no ar (`goiania.roilabs.com.br/feed.xml`, 30 itens, verificado em prod), gate `check-feed` postbuild provado, conta criada e feed cadastrado com busca diária: **30/30 processados sem erro estrutural** (SC-002 ✓). Bônus da esteira: página `/devolucoes` (CDC) criada — era exigência do Merchant Center e o site não tinha. ⏳ Único watch-point: itens "Em análise" — conferir **Produtos → Diagnóstico** em ~3 dias (meta ≥ 90% aprovados, SC-003); reprovações → troubleshooting em [[merchant-center]].
- [x] **IndexNow no deploy — FEITO 2026-07-02.** `src/scripts/indexnow.mjs` nos DOIS sites (postbuild; no goiânia encadeado após o `check-feed`), chave `e72cab81d95c41fd915ce3331a10d1ad.txt` no `public/` de ambos. Testado local: HTTP 202 (9 URLs institucional, 72 goiânia). Ping é não-fatal (falha da API nunca quebra o build). A chave valida quando o `.txt` for ao ar → **vale de verdade no próximo redeploy dos 2 sites**.
- [x] **`LocalBusiness` + Google Business Profile.** Quando houver endereço/telefone comercial: 1 nó `LocalBusiness` no @graph do goiânia; o GBP em si é ops (Duda). É o que disputa o **local pack** de `porcelanato goiânia` — a âncora de 140/mês do Keyword Planner ([[mercado]]).
- Review engine (gateado em 3–5 pedidos entregues) → movido para [[backlog-pendencias]].

### 💰 Converter mais com o que já existe

- [x] **Orçamento por WhatsApp no carrinho — FEITO 2026-07-03 (`ea1e6de`).** Botão "Receber orçamento no WhatsApp" no carrinho manda o link `?c=` pro número comercial (`5562993265713`, mesmo fallback `PUBLIC_WHATSAPP`) + evento himetrica `orcamento_whatsapp`. Deploy automático por push. ⏳ conferir o evento no painel himetrica.
- [x] **Admin no celular — FEITO 2026-07-03 (`ea1e6de`, CSS-only).** ≤760px: nav vira trilho rolável, TODAS as tabelas (fin/cc/pedidos/leads) rolam na horizontal em vez de estourar, seat-rows e campos empilham. Kanban já era 1 coluna (@900px). ⏳ falta redeploy do `/app` + teste real no celular da Duda (sem credenciais local p/ E2E).
- [x] **Demonstrativo do parceiro — FEITO 2026-07-03 (`ea1e6de`), antes da 1ª fatura Asaas.** `/admin/parceiros/[id]/demonstrativo?mes=YYYY-MM`: negócios repassados do mês, base (total−frete), % aplicado, valor. Fatura emitida = autoridade (snapshot); sem fatura = prévia via `calcularFaturaMensal`. Botão Imprimir/PDF (print CSS esconde chrome do admin) — é o PDF que vai pro parceiro. Links: header do parceiro + competência na tabela de faturas. ⏳ redeploy do `/app`.

---

## 🧭 Fora da caixa — ciclo 2 (2026-07-03)

> [!success] CICLO 2 EXECUTADO 2026-07-03 — 5/5 itens em código, tudo na `main` e pushado.
> **Todo deploy é automático por push** (site, site-goiania e app) — tudo abaixo já está indo ao ar. Ops restantes: contas Resend e serper.dev → [[backlog-pendencias]].

### 🎯 Destravar o gate do negócio (fornecedor)

- [x] **⭐ CTA WhatsApp no site institucional — FEITO 2026-07-03 (`9e28bde`).** Botão verde "Chamar no WhatsApp" no hero + "Chamar no WhatsApp agora" no fim (seção candidatar), `wa.me/5562993265713` com texto pré-preenchido. A nota do ciclo assumia listener delegado no Base do `/site` — **não existia** (só no goiânia); adicionado, `whatsapp_click` agora dispara nos 2 sites. Deploy automático por push.

### 💰 Converter mais (B2C goiânia)

- [x] **Calculadora standalone — FEITO 2026-07-03 (`cb8945d`).** `goiania.roilabs.com.br/calculadora`: ambientes (largura×comprimento), folga 5–20%, m²/caixa informado pelo usuário, resultado em caixas fechadas (mesma matemática do carrinho, `m2ParaCaixas`). BLUF + passo-a-passo + FAQ 6 itens com FAQPage schema + CTA duplo (catálogo + WhatsApp). No sitemap, llms.txt e footer. Deploy automático por push.
- [x] **Confirmação de pedido + alertas internos — FEITO 2026-07-03 (`ef7bced`).** `lib/email.ts` (Resend via fetch, sem SDK; no-op sem chave; fire-and-forget). Webhook de pagamento manda confirmação ao cliente (itens, total, prazo 2–6 dias úteis, WhatsApp) + alerta interno de pedido pago; candidaturas e leads-consumidor mandam alerta de lead novo (fechou também o item do [[backlog-pendencias]], mesma infra). Já no ar como no-op; ⏳ conta Resend + env vars → [[backlog-pendencias]].

### 📣 Escalar o canal (pSEO/GEO)

- [x] **Dimensão MARCA — VALIDADA E SHIPPADA 2026-07-03 (`ede5eed`).** Mineração real (DataForSEO, Goiás): `biancogres` **390**/mês ✅ e `delta porcelanato` **260**/mês ✅ passam o piso ≥ 200; **savane (10) e TODAS as variações "+goiânia" (null) mortas sem custo**, como previsto. 2 páginas novas (`/porcelanato/porcelanato-biancogres`, 18 produtos; `/porcelanato/porcelanato-delta`, 4 produtos) via 1 linha de match por marca no `tagsDoProduto` + dados curados com fatos reais do catálogo. Malha agora tem **41 páginas**.
- [x] **Rank tracking semanal — FEITO 2026-07-03 (`f9c0229`).** `site-goiania/src/scripts/rank-tracking.mjs` (âncora + todos os termoAlvo da malha → posição top-50 Google Goiânia via DataForSEO) grava `rank-tracking.csv` (histórico) + `rank-tracking.md` (snapshot) aqui no vault. Cron: GitHub Actions toda segunda 09:00 UTC, commita o resultado (secret `DATAFORSEO_API_KEY` já setado no repo). **1ª rodada real: 18 keywords medidas, 0 no top 100** (malha tem ~2 semanas — baseline honesto). ⚠️ Crédito DataForSEO esgotou no meio da rodada e não será recarregado → **script migrado pra serper.dev** (2.500 buscas grátis; DataForSEO virou fallback). ⏳ criar conta + secret `SERPER_API_KEY` → [[backlog-pendencias]]. Quando o GSC maturar (~07-15), ele vira a fonte grátis definitiva.

## 🧭 Fora da caixa — ciclo 3 (2026-07-03)

> [!success] CICLO 3 EXECUTADO 2026-07-03 — 4/4 itens em código, tudo na `main` e pushado (deploy automático por push).
> Critério do ciclo: alavanca ÷ esforço com custo zero. Deliberadamente FORA: expandir malha pSEO (mineração de volume bloqueada sem saldo DataForSEO — GSC vira fonte grátis ~07-15), review engine (gate 3–5 pedidos) e WhatsApp Cloud API (pago).

### 💰 Converter mais (B2C goiânia)

- [x] **⭐ Carrinho capturado como lead no orçamento WhatsApp — FEITO 2026-07-03 (`75bef94`).** O clique em "Receber orçamento no WhatsApp" agora grava o carrinho no kanban de leads do admin: se o form de checkout já tem contato+LGPD, POST oportunista direto; senão aparece um micro-form opt-in ("deixe seu WhatsApp que nosso especialista te chama") — é o seguro contra quem abre o wa.me e nunca aperta enviar. Lead entra com resumo (N itens · total) + link `?c=` do carrinho. Novo evento himetrica `orcamento_lead`. ⏳ conferir evento no painel → [[backlog-pendencias]].

### 📣 Distribuição grátis (novo canal com o feed que já existe)

- [x] **⭐ Meta Catalog (Instagram + WhatsApp) — DOC PRONTA 2026-07-03 (`9379f3e`), dev zero.** O `feed.xml` do Merchant Center é aceito como está pelo Commerce Manager (formato Google, compatibilidade campo a campo verificada). Passo a passo ops em [[meta-catalog]]: catálogo E-commerce → feed URL diário → Instagram Shopping + catálogo no WhatsApp Business (Duda manda produto como card na conversa). ⏳ execução é ops (Duda) → [[backlog-pendencias]].

### 📊 Operar com ritual (medição ativa)

- [x] **Digest semanal por e-mail — FEITO 2026-07-03 (`7c782cb`).** `POST /api/cron/digest` no app (auth `X-Cron-Secret`): agrega 7 dias (leads consumidor, candidaturas, pedidos, pagos, GMV) e manda e-mail via `lib/email.ts` (mesmo no-op do ciclo 2), embutindo o snapshot do rank-tracking que o workflow de segunda acabou de commitar. Step novo no `rank-tracking.yml` (non-fatal, roda mesmo se o rank falhar). ⏳ setar `CRON_SECRET` (EasyPanel + GitHub secret) e conta Resend → [[backlog-pendencias]].

### 📱 Admin na mão da Duda

- [x] **PWA do admin — FEITO 2026-07-03 (`b0d153e`).** `manifest.ts` (Next metadata route) + ícones 192/512 (do `roilabs-icon.png`) + `appleWebApp` no layout: o admin instala na tela inicial do celular (Android/iOS), standalone, `start_url /admin`. Sem service worker por design (admin é dado vivo). ⏳ instalar no celular da Duda pós-redeploy → [[backlog-pendencias]].

## 🧭 Fora da caixa — ciclo 4 (2026-07-03)

> [!success] CICLO 4 EXECUTADO 2026-07-03 — 4/4 itens de código na `main` e pushados (deploy automático por push) + 2 docs de ops prontas.
> Critério do ciclo: fechar o loop do lead + GEO sem depender de mineração de volume. Deliberadamente FORA (de novo): expandir malha pSEO (GSC vira fonte ~07-15), review engine (gate 3–5 pedidos), WhatsApp Cloud API (pago).

### 💰 Converter mais (fechar o loop do lead)

- [x] **⭐ WhatsApp 1-click no admin de leads — FEITO 2026-07-03 (`97635ce`).** `/admin/leads`: o link seco no número virou botão "Chamar no WhatsApp" que abre o `wa.me` do lead com mensagem contextual pronta (primeiro nome + produto/resumo do carrinho + link `?c=` salvo). O link do carrinho, antes enterrado em `mensagem` (invisível na tabela), aparece como "carrinho →" na coluna Produto. Prefixo 55 igual ao card de candidatura. ⏳ testar em prod (deploy automático).
- [x] **Calculadora → lead — FEITO 2026-07-03 (`e6d511c`).** `/calculadora`: com resultado na tela, aparece micro-form opt-in ("Quer o preço dessa metragem?") — WhatsApp + LGPD, mesmo POST fire-and-forget do carrinho. O lead entra com o contexto do cálculo (m², folga, caixas). Novo evento himetrica `calculadora_lead`. ⏳ conferir evento no painel → [[backlog-pendencias]].

### 📣 Distribuição grátis (GEO sem mineração de volume)

- [x] **⭐ 3 guias de decisão AEO — FEITO 2026-07-03 (`4fdd4de`).** `/guia/porcelanato-polido-ou-acetinado/`, `/guia/porcelanato-ou-ceramica/` e `/guia/como-escolher-porcelanato/` — intenção-pergunta que vem ANTES da malha de categorias (zero canibalização, conferido contra os 41 slugs). BLUF + tabela comparativa + FAQPage + CTA duplo + interlink pesado (malha, calculadora, entre guias). Registro em `src/data/guias.ts` alimenta sitemap, llms.txt (seção "Guias de decisão"), hub `/porcelanato/` e "Veja também" da calculadora. Build: 79 páginas.
- [x] **Product schema completo — FEITO 2026-07-03 (`8d22fa6`).** Offer das 30 páginas de produto ganhou `sku` (= `g:id` do feed → liga rich result ao Merchant Center), `itemCondition`, `OfferShippingDetails` (GO, trânsito 2–7 dias espelhando `lib/frete.ts`) e `MerchantReturnPolicy` (7 dias CDC, FreeReturn, link `/devolucoes/`). Habilita anotação de frete/devolução no SERP e reforça a aprovação dos itens em análise. Sem `shippingRate` fixo de propósito (frete varia por faixa de CEP).
- [x] **Pinterest Catalogs — DOC PRONTA 2026-07-03, dev zero (a validar na 1ª ingestão).** Mesmo playbook do Meta Catalog: `feed.xml` direto no Pinterest (aceita XML formato Google). Passo a passo ops em [[pinterest-catalog]] — inclui claim do domínio (me acionar p/ meta tag) e fallback documentado se o parser reclamar. ⏳ execução ops → [[backlog-pendencias]].
- [x] **Bing Webmaster Tools — DOC PRONTA 2026-07-03 (~10 min, Jean).** Importação 1-click do GSC (verificação + sitemaps dos 2 sites) + conferir pings IndexNow que já disparam a cada deploy. É a ponta solta do GEO (Copilot cita o índice Bing). Passo a passo em [[bing-webmaster]]. ⏳ execução → [[backlog-pendencias]].

## 🧭 Fora da caixa — ciclo 5 (2026-07-03)

> [!success] CICLO 5 EXECUTADO 2026-07-03 — 5/5 itens em código, tudo na `main` e pushado (deploy automático por push).
> Critério do ciclo: fechar o loop da VENDA (não só do lead) + GEO sem mineração de volume. Deliberadamente FORA (de novo): expandir malha pSEO (GSC vira fonte ~07-15), review engine (gate 3–5 pedidos), WhatsApp Cloud API (pago).

### 💰 Fechar o loop da venda

- [x] **⭐ WhatsApp 1-click no admin de pedidos — FEITO 2026-07-03 (`9ce927d`).** O link seco no número em `/admin/pedidos` virou botão "Chamar no WhatsApp" com mensagem por estado: **pendente = recuperação de pagamento** ("quer que eu te envie um novo link?"), pago+aguardando = aprovado + prazo (2–6 dias úteis / retirada / frete a combinar), pago+confirmado = confirmado com fornecedor. Reembolsado = chat sem template. Bônus: helpers `lib/wa.ts` compartilhados (dedup leads/candidatura) e as tabelas de pedidos/leads saíram do inline-escuro pros tokens LIGHT (AA — ver [[roilabs-app-admin-design-system]]). ⏳ testar em prod pós-deploy.
- [x] **⭐ Fila de follow-up — FEITO 2026-07-03 (`ff2a9f1`).** `/admin/follow-up` (link na nav): 🛒 carrinhos salvos sem pedido pago (quente — recente converte) + 🧊 leads sem carrinho parados 48h+ em `novo`. Cada linha: WhatsApp 1-click + botão "Contatado ✓" (novo `PATCH /api/leads-consumidor/:id`, status novo|contatado|convertido|perdido) que tira da fila. Lógica única em `lib/follow-up.ts`, compartilhada com o digest. Match lead↔pedido pelos últimos 11 dígitos do WhatsApp.

### 📊 Operar com ritual

- [x] **Digest com "ação pendente" — FEITO 2026-07-03 (`c69722a`).** O e-mail semanal embute a mesma fila do follow-up (contagens + primeiros 5 nomes + link da fila) — cobra toda segunda até zerar. Segue no-op sem conta Resend → [[backlog-pendencias]].

### 📣 GEO sem mineração de volume

- [x] **⭐ Guia "quanto custa porcelanato" — FEITO 2026-07-03 (`2907adf`).** `/guia/quanto-custa-porcelanato/`: faixas de material **calculadas do catálogo real no build** (hoje R$ 65,99–144,99/m², tabela por acabamento — atualiza sozinha a cada publish), mão de obra + argamassa/rejunte como estimativa de mercado sinalizada, e a conta completa para 60 m². BLUF + FAQPage + CTA duplo + entrada no "Veja também" dos 3 guias. **Sem canibalizar**: a malha `porcelanato-preco` segue dona do termo transacional "porcelanato preço" e é interlinkada como catálogo. Registro em `guias.ts` → sitemap/llms.txt/hub/calculadora automáticos. Build: **80 páginas**.
- [x] **ItemList na malha + schema no hub — FEITO 2026-07-03 (`bab745d`).** Ajuste na verificação: a malha **já tinha** BreadcrumbList (em `buildJsonLdNodes`) — o que faltava era **ItemList** espelhando a galeria de produtos (cada item aponta pra página de produto, que tem o Product+Offer completo com sku=g:id do feed) e o hub `/porcelanato/` **sem schema nenhum** → ganhou BreadcrumbList + ItemList das 40 categorias.

## 🚀 Fase 1 — Subir o MVP no ar (caminho crítico, em ordem)

- [x] **Aplicar schema no DB.** De uma máquina que alcança `2.24.207.200`, dentro de `/app`: `npm install` → `npx prisma db push` → `npm run db:seed` (carrega as 6 cadeiras, idempotente). ⚠️ NÃO confiar no runner standalone p/ schema — fazer `db push` manual.
- [x] **Criar App `/app` na EasyPanel.** Build path = `/app`, Dockerfile já incluso (Next standalone, porta 3000), domínio `app.roilabs.com.br`. Env vars (de `.env.example`): `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`).
- [x] **Verificar o build real no Docker.** `next build` nunca rodou local (gotcha OneDrive corrompe `node_modules`). Build limpo é no Docker — conferir que sobe sem erro.
- [x] **Criar App `/site` na EasyPanel.** Build path = `/site`, Dockerfile (node build → nginx), domínio `roilabs.com.br`. Esse deploy nunca foi feito. Já leva o **blog GEO** junto (commit `701488d`).
- [x] **Redeploy do `/site`** para publicar o novo `action` do form (agora posta em `app.roilabs.com.br/api/candidaturas`, era Web3Forms placeholder). Se criar o App já com o código atual, está coberto.
- [x] **DNS:** `roilabs.com.br` → App do site; `app.roilabs.com.br` → App do admin.

## 🔎 Fase 2 — Validar (smoke test E2E em prod)

> [!success] Verificado em prod — 2026-06-29 (DNS propagou)
> Domínios finais no ar: `roilabs.com.br` e `app.roilabs.com.br` → **HTTP 200** @ `2.24.207.200`. E2E confirmado: `GET /api/cadeiras` = 6 cadeiras (DB+seed reais); `POST /api/candidaturas` → 303 → `/obrigado` (grava lead); `/admin` exige login (307); honeypot bloqueia; `/admin/cadeiras` operável.

- [x] Submeter o **form do site** → confirmar redirect `/obrigado` e a candidatura aparecendo no kanban do `/admin`.
- [x] **Login no `/admin`** (`ADMIN_PASSWORD`) e mudar o status de uma candidatura (novo → curadoria → aprovado).
- [x] `/admin/cadeiras`: abrir/fechar uma cadeira e editar status.
- [x] **Form REAL no browser** em `roilabs.com.br` com acento ("Goiânia") → confirmar que grava **sem mojibake**. Site tem `<meta charset=utf-8>`; o "Goi�nia" dos leads de teste veio de bytes ruins do terminal, não do app — confirmar pelo lead `UTF8 TEST`.
- [x] **Apagar os leads de teste** no `/admin` (`SMOKE TEST`, `UTF8 TEST`, `Teste Fluxo`) — agora há **botão "Apagar"** no card (commit `d62ebf4`). ⚠️ precisa do **redeploy do app** pro botão existir em prod.

## 🚀 Fase 3 — IMPLEMENTADO · falta redeploy (`0bef049`, `d62ebf4`)

> [!important] Ordem de redeploy: **app primeiro, depois site**
> **1º o app** (`/app`) → ship do `DELETE /api/candidaturas/:id` + botão Apagar **e do header CORS** em `GET /api/cadeiras` (sem ele o navegador bloqueia o fetch do mapa). **2º o site** (`/site`) → ship do script runtime. Ambos rebuildam porque o código mudou (cache-busta).

> [!warning] Por que o build-fetch falhou (corrigido em `0bef049`)
> A 1ª tentativa (`f603006`) buscava `/api/cadeiras` **no build**. O Docker cacheia o layer `RUN npm run build` → redeploy sem commit novo servia `dist` velho e **nunca refletia o admin** (foi o que o Jean viu: "deploy e restart não resolveram"). Trocado para **fetch no navegador (runtime)** — imune a cache.

- [x] **Cadeiras ↔ site — RESOLVIDO (runtime).** O site renderiza um skeleton estático (SEO/no-JS) e um `<script is:inline>` busca `/api/cadeiras` **no navegador**, sobrescrevendo status/aberta a cada load. `GET /api/cadeiras` ganhou `Access-Control-Allow-Origin`. Mudou cadeira no `/admin` → **só dar reload** em `roilabs.com.br`, **sem rebuild**. `seats.ts` + array do `index.astro` = só fallback no-JS.
- [x] **Apagar candidatura — RESOLVIDO.** `DELETE` na rota `[id]` (auth + idempotente) + botão "Apagar" no card (`window.confirm`).
- [x] **Kanban sem drag** (hoje muda status por `<select>`, ponytail). Só adicionar `@dnd-kit` (padrão do CRM SplitJud) se quiser arrastar — opcional.
- [x] **WhatsApp do card** assume número BR local e prefixa `55`. Se vier com DDI, ajustar.

## 🔒 Fase 4 — Segurança

- [x] **Rotacionar a senha do Postgres exposta** (`PAzo18**` em `roilabs_db`). Depois atualizar `DATABASE_URL` nas env vars da EasyPanel. (ver memória `secrets_to_rotate`)

---

## 🏗️ Fase 5 — Admin pós-MVP (SHIPPED, `main`)

> [!success] Tudo abaixo já está na `main` e no ar
> O admin cresceu muito além do MVP de intermediação. Ordem cronológica dos commits; todos deployados. As caixas marcam **código shippado**; as pendências abaixo são de **verificação/config em prod**, não de código.

- [x] **002/003 — E-commerce de porcelanato.** Carrinho (edição inline, simulador m², frete + prazo, cupom, link de compartilhar) + checkout Mercado Pago + admin de pedidos. Site `goiania.roilabs.com.br`.
- [x] **004 — Centros de custo editáveis.** Dois centros (Intermediação × White Label), parâmetros editáveis e auditáveis, apagar linha + recálculo na hora. Design system LIGHT (WCAG AA). `lib/centros-custo.ts` é a autoridade.
- [x] **005 — Painel + Financeiro.** `/admin` virou cockpit (candidaturas/leads 24h+7d, GMV do mês, fila de fulfillment, cadeiras por polo, conversão lead→pedido). `/admin/financeiro`: agregação mensal por modalidade com snapshot congelado + export CSV (`/api/financeiro/csv`). Candidaturas moveram para `/admin/candidaturas`.
- [x] **006 — Cupons no admin.** `CUPONS` hard-coded → tabela `cupons` + CRUD em `/admin/cupons` (criar/editar/expirar sem deploy). `validarCupom` async lendo do DB, servidor segue autoridade única (código nunca vai pro front). Guard 100% no checkout. **Migração aplicada em prod** (`OBRA10` semeado; rota `/api/cupom/validar` confirmada via curl).
- [x] **007 — Camada Parceiro (success fee).** `Parceiro` (sondagem|ativa|riscada|pausada + % negociado) ↔ `NegócioOriginado` (pedido pago repassado, total − frete) ↔ `Fatura` mensal cobrada via **Asaas**. Tática "moeda de troca" + sondagem antes do repasse. Schema **aplicado no Postgres real** (T019). Reflete a mecânica agora registrada em [[modelo]].

### 🔎 Pendências desta fase (verificação/ops em prod — não é código)

- [x] **005 — verificar no browser** `/admin` e `/admin/financeiro` em prod/Docker; conferir métricas vs. banco e baixar o CSV no Excel (T012).
- [x] **006 — verificar CRUD no browser**: criar `OBRA15` em `/admin/cupons`, editar/desativar/apagar, e um **checkout real com cupom** gravando `Pedido.cupomCodigo/desconto` (T015; a rota já foi confirmada por curl, falta a via navegador/checkout).
- **007 — configurar o Asaas**: movido para [[backlog-pendencias]].

## ✅ Resolvido — Logo (Task 2)

- [x] **Task 2 — Logo.** ✔ Verificado (2026-06-29): variante **clara** (off-white) com chevron laranja hi-vis aplicada no header (`Header.astro` → `roilabs-logo.png`), **visível no header escuro** e alinhada à paleta. Assets otimizados e presentes: logo 173KB, icon 93KB, og-image 31KB, favicon + apple-touch-icon ligados no `Base.astro`. Os 2 gotchas (preta some no escuro / grunge vs. clean) **resolvidos**.

## 🆕 Backlog de dev (novo — pós-MVP)

> [!note] Ranqueado por alavanca de negócio. Nada aqui bloqueia o que está no ar; é o que faz o modelo escalar. Verificado contra o código em 2026-07-01 (não são tarefas já feitas).

- [x] **⭐ Motor de páginas de alta intenção (pSEO) — FEITO (spec 008, no site-goiania).** A malha vive em `goiania.roilabs.com.br/porcelanato/{slug}` (é onde ela pertence — site do produto): 31+8 páginas validadas por volume (DataForSEO, piso ≥ 200), gate `check-matrix`, `llms.txt.ts` e `sitemap.xml.ts` automáticos. **Deploy + verificação em prod confirmados 2026-07-01** (T017). O institucional segue só `/`, `/blog`, `/obrigado` — por design.
- [x] **Medição de conversão — FEITO 2026-07-01.** Eventos himetrica (`window.himetrica.track`) nos dois sites: `whatsapp_click` (listener delegado em qualquer `wa.me`, no `Base.astro` do site-goiania — que **não tinha nem o tracker**, adicionado), `checkout_iniciado` (submit do carrinho; pode perder por navegação — o evento autoritativo é o do /obrigado), `pedido_convertido` (com status MP) / `lead_convertido` no `/obrigado` do site-goiania e `candidatura_convertida` no `/obrigado` do institucional (dedupe por sessionStorage). ⚠️ falta **redeploy dos 2 sites** pra valer em prod + conferir os eventos no painel himetrica.
- [x] **Auto-gerar `llms.txt` da content collection — FEITO 2026-07-02.** `site/src/pages/llms.txt.ts` lê a coleção `blog` (padrão do `sitemap.xml.ts`); artigos com título+description do frontmatter, ordenados por pubDate. `public/llms.txt` manual removido (fonte única). Novo artigo entra sozinho no sitemap E no llms.txt. Vale em prod no próximo deploy do `/site`.
- [x] **`sameAs` no Organization schema — FEITO 2026-07-02.** LinkedIn (`/company/roi-labs-curadoria`) + Instagram (`@roilabs.curadoria`) no `@graph` dos DOIS sites (`site` e `site-goiania`). Vale em prod no próximo redeploy. (SplitJud segue com a pendência dele — URLs do Aldo.)
- [x] **Schema da home + breadcrumbs — FEITO 2026-07-02.** Home injeta `Service` + `Offer` (Growth Partner, pago pelo sucesso) via `jsonLdNodes`; artigos ganharam `BreadcrumbList` (Home → Blog → título) no `Article.astro`. JSON-LD validado por parse no build. Vale em prod no próximo redeploy do `/site`.
- [x] **OG image por artigo — FEITO 2026-07-02.** `astro-og-canvas` (1 dep, sem binário nativo — Docker-safe): rota `open-graph/[...route].ts` gera 1 PNG por post da coleção (logo + título + description, fundo `#14171d`, borda laranja). `Base.astro` ganhou prop `ogImage`; artigos apontam pro PNG, demais páginas seguem no `og-image.jpg`. Visual conferido no build.

## 👤 Não-dev (Maria Eduarda / campo)

- Movidos para [[backlog-pendencias]] (Gate 3, piso de take rate, legal/fiscal).
