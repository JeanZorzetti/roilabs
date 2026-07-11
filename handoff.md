# Handoff — ROI Labs (roilabs.com.br)

> **STATUS 2026-06-29 — MVP NO AR e verificado em prod.**
> Site `https://roilabs.com.br` (marketing + recrutamento + blog GEO) e admin
> `https://app.roilabs.com.br` (candidaturas + mapa de cadeiras) — ambos HTTP 200
> @ `2.24.207.200` (EasyPanel). E2E confirmado no navegador real.
>
> **Checklist de dev vivo:** [`Docs/Obsidian/proximos-passos-dev.md`](Docs/Obsidian/proximos-passos-dev.md)
> (espelhado no Notion: "✅ Próximos passos — DEV (Jean)" sob o Hub).
> **Estratégia:** vault em [`Docs/Obsidian/INDEX.md`](Docs/Obsidian/INDEX.md) (8 nós, todos `decided`).

## Negócio (1 parágrafo)
ROI Labs = **Growth Partner** (não agência). Modelo BNI: 1 cadeira exclusiva por
nicho/polo, fornecedor paga 100% variável (pago pelo sucesso). **Polo 1 = Goiânia**,
nicho âncora = **revestimentos/porcelanato**.

## Arquitetura (monorepo, raiz = `ROI Labs/ROI Labs/`)
- **`/site`** — Astro 5 estático → nginx. Marketing + form de candidatura + blog GEO.
  Deploy EasyPanel: build path `/site`, `site/Dockerfile` (node build → nginx), domínio `roilabs.com.br`.
- **`/app`** — Next 16 App Router → standalone. Admin (login único cookie HMAC), APIs, kanban.
  Deploy EasyPanel: build path `/app`, `app/Dockerfile` (porta 3000), domínio `app.roilabs.com.br`.
- **DB:** Postgres `roilabs_db @ 2.24.207.200:5443`. 2 tabelas (`Candidatura`, `Cadeira`), `db push` (sem migrations).
- **Fluxo:** site (estático) → `POST app.roilabs.com.br/api/candidaturas` (urlencoded, sem preflight) → DB → kanban `/admin`.

## Feito
- **Ciclo 15 + investigação CLS (2026-07-11)** — detalhe em
  `Docs/Obsidian/80-dev/changelog-ciclos.md` § Ciclo 15:
  - **CLS ~1,0 hub/malha do baseline CWV = transitório do PSI, não bug** (re-medido 3
    métodos no mesmo build: hub 0, malha 0,002; `cwv.md` re-gerado 5/5). Sem fix de
    template; tripwire = cron de segunda. Problema real dos scores é **LCP ~5,9s**
    (próxima passada de perf). Gotcha útil: `PSI_API_KEY` recuperável localmente via
    API Keys API (`keyString`) com a SA do roihub (JSON em `Downloads/`).
  - **Ciclo 15 (dados do checkpoint-malha):** como-limpar ganhou seção "Mancha por
    acabamento" + 2 FAQs (cluster de 10+ queries); rejunte ganhou "Regra rápida por
    ambiente"; polido-ou-acetinado ganhou "O atalho por ambiente" com deep-links combo;
    +passada de interlink nos demais guias. **~20 links novos guia→malha** (como-limpar e
    rejunte tinham zero). Build 98 págs verde; deploy automático por push.
- **Macro plan 3 — mês 3 do loop autônomo (2026-07-06) — 19/19 tarefas** (resumo
  completo em `Docs/Obsidian/80-dev/changelog-ciclos.md`, seção "Macro plan 3"):
  - **site-goiania (semanas 1–2):** 4 guias AEO novos (como-limpar,
    como-assentar com HowTo, erros-ao-comprar, piso-vinilico-vs-porcelanato),
    back-links de guias/produto para as âncoras do glossário, hub `/guia/`
    (índice pela jornada), RSS `/rss.xml`, passada CLS/perf, auditoria
    schema/breadcrumb. Build: 98 páginas.
  - **/site (semana 3):** RSS `/rss.xml`; 2 artigos B2B novos (Google Shopping
    p/ material de construção; e-commerce próprio vs polo, com a conta do
    success fee); refresh de fatos + `dateModified` em `/polo-goiania/` e
    `/modelo/`; descoberta conferida. Build: 15 páginas.
  - **SplitJud (semana 4, repo `..\splitjud`, commits `aa1a68f`→`1c100d5`):**
    glossário de honorários `/glossario/` (18 termos, DefinedTermSet), 3
    artigos novos do cluster honorários, BreadcrumbList sitewide, RSS +
    llms.txt. Build: 19 páginas. Push manual lá a cada tarefa.
  - **Pulados por falta de dado (disciplina mantida):** striking distance
    (rank tracker 0/40 no top 100, snapshot em
    `90-medicao/striking-distance.md`) e expansão de malha (sem `gsc-miner.md`;
    `GSC_SA_KEY` previsto ~07-15).
  - **Gotcha recorrente:** fechamento do mês N deixa o `handoff.md` do
    splitjud sujo e bloqueia a 1ª tarefa cross-repo do mês N+1 — no
    fechamento, sempre commitar E pushar o splitjud (feito desta vez).
- **Macro plan 2 — mês 2 do loop autônomo (2026-07-05) — 19/19 tarefas** (resumo
  completo em `Docs/Obsidian/80-dev/changelog-ciclos.md`, seção "Macro plan 2"):
  - **site-goiania (semanas 1–2):** glossário `/glossario/` (19 termos +
    DefinedTermSet), 3 guias AEO novos (área externa, rejunte, porcelanato
    líquido vs porcelanato), Inspire-se por ambiente, filtros/ordenação no hub
    `/porcelanato/`, favoritos↔comparador, "vistos recentemente" (localStorage).
    Calculadora multi-ambiente pulada (já existia).
  - **/site (semana 3):** artigos B2B com a conta do success fee + CTAs, página
    `/modelo/` (FAQPage+HowTo), case `/polo-goiania/`, refresh de descoberta
    (sitemap/llms.txt/busca conferidos nos 2 sites).
  - **SplitJud (semana 4, repo `..\splitjud`):** 6 artigos GEO (3 novos F3 +
    recência nos 3 antigos), calculadora pública `/calculadora/`, interlink +
    llms.txt. Push manual lá a cada tarefa (runner não pusha aquele repo).
  - **Gotcha novo:** pré-check de working tree cross-repo bloqueou 1x (splitjud
    sujo) e retomou após o dono resolver — o mecanismo funciona. Placeholders
    `[PLACEHOLDER_*]` do schema do splitjud seguem aguardando o Aldo (T002).
- **Ciclo 8 "fora da caixa" (2026-07-04) — 4/4 itens, custo zero:**
  - **`/sobre` (Como funciona) no goiânia** — quem vende, 4 passos da compra (MP, entrega 2–7 dias, CDC), FAQPage schema; em sitemap/llms.txt/footer/busca.
  - **404 real + página útil** — nginx devolvia a home com 200 pra URL desconhecida (soft 404); agora `error_page 404` + `404.astro` com CTA catálogo/calculadora/WhatsApp + guias.
  - **SearchAction no @graph + deep-link `?q=`** — sitelinks searchbox; SiteSearch abre pré-preenchido via `/?q=termo`.
  - **CWV semanal via PageSpeed Insights** — `cwv-psi.mjs` no cron de segunda → `90-medicao/cwv.{csv,md}`; no-op sem `PSI_API_KEY` (anônimo dá 429). ⏳ secret.
  - 3 itens propostos caíram na verificação: relacionados no produto, FAQ da malha e digest→ntfy **já existiam**.
- **Ciclo 6 "fora da caixa" (2026-07-03, commits `a554300`→`f5271fc`) — 5/5 itens, custo zero:**
  - **Microsoft Clarity nos 2 sites** (`a554300`) — tag gateada em `PUBLIC_CLARITY_ID` (no-op sem env). ⏳ ops: criar 2 projetos + env de build na EasyPanel.
  - **Push ntfy.sh nos alertas internos** (`c9eb662`) — `sendAlert` despacha e-mail + push (canais independentes, cada um no-op sem a própria env). Sem conta: o tópico é o segredo. ⏳ `NTFY_TOPIC` + assinar no app ntfy.
  - **Atribuição first-touch** (`20a7fa1`) — landing page (com UTMs) + referrer externo em `localStorage.rlft`, enviado como `origem` por TODOS os caminhos de lead; servidor grava como sufixo `[origem]` na `mensagem` (sem migração — DB de prod inalcançável daqui); coluna Origem em `/admin/leads`. Coluna real no próximo `db push` manual.
  - **OG por página no goiânia** (`94d3e6b`) — produto usa a foto real; malha/guias/hub/calculadora ganham PNG `astro-og-canvas` (receita do `/site`). Preview rico nos links de WhatsApp.
  - **GSC miner** (`f5271fc`) — Search Console API via service account (zero-dep), gera candidatas a página nova + striking distance no vault, no cron semanal do rank-tracking (no-op sem `GSC_SA_KEY`). Runbook `Docs/Obsidian/80-dev/gsc-miner-setup.md`; ativar ~07-15.
- **Ciclo 4 "fora da caixa" (2026-07-03, commits `97635ce`→`8d22fa6`) — 4 itens de código + 2 docs ops:**
  - **WhatsApp 1-click no `/admin/leads`** — botão "Chamar no WhatsApp" abre o chat com mensagem contextual (nome + produto/carrinho + link `?c=`); link do carrinho exposto na tabela.
  - **Calculadora → lead** — micro-form opt-in pós-resultado em `/calculadora` (WhatsApp + LGPD), lead entra com o contexto do cálculo; evento `calculadora_lead`.
  - **3 guias de decisão AEO em `/guia/`** (polido×acetinado, porcelanato×cerâmica, como escolher) — BLUF + FAQPage + tabelas + interlink; registro `src/data/guias.ts` alimenta sitemap/llms.txt/hub/calculadora. 79 páginas no build.
  - **Product schema completo** — Offer com `sku` (= g:id do feed), `OfferShippingDetails` (2–7 dias, GO) e `MerchantReturnPolicy` (7d CDC → `/devolucoes/`).
  - **Docs ops:** Pinterest Catalogs (`Docs/Obsidian/80-dev/pinterest-catalog.md`, mesmo feed.xml) e Bing Webmaster (`bing-webmaster.md`, importar do GSC). Execução pendente em `backlog-pendencias`.
- **Ciclo 2 "fora da caixa" (2026-07-03, commits `9e28bde`→`f9c0229`) — 5/5 itens:**
  - **CTA WhatsApp no `/site`** (hero + seção candidatar, `.btn--whats`) + listener `whatsapp_click` no Base (não existia no institucional, só no goiânia).
  - **`/calculadora` standalone no site-goiania** — matemática do carrinho (`m2ParaCaixas`), FAQ/AEO com FAQPage schema, CTA duplo, no sitemap/llms.txt/footer.
  - **E-mail transacional no `/app`** (`lib/email.ts`, Resend via fetch, no-op sem chave): confirmação de pedido ao cliente no webhook MP + alertas internos (pedido pago, candidatura, lead B2C). ⏳ ops: conta Resend + `RESEND_API_KEY`/`EMAIL_FROM`/`ALERT_EMAIL` na EasyPanel (backlog).
  - **Dimensão MARCA na malha** — validada por volume real (Goiás): biancogres 390 ✅, delta porcelanato 260 ✅, savane/`+goiânia` mortos. 2 páginas novas via tag de marca no `tagsDoProduto`; malha = 41 páginas.
  - **Rank tracking semanal** — `site-goiania/src/scripts/rank-tracking.mjs` (top-50 Goiânia) → `Docs/Obsidian/rank-tracking.{csv,md}`; cron GitHub Actions seg 09:00 UTC. Fonte: **serper.dev** (`SERPER_API_KEY`, 2.500 grátis; ⏳ criar conta — backlog); DataForSEO = fallback (saldo zerado 07-03). Baseline 07-03: 0 no top 100.
  - **Deploy: TODOS os apps (site, site-goiania, app) são automáticos por push** — nada de redeploy manual.
- **Fase 1:** schema+seed (6 cadeiras), os 2 Apps na EasyPanel, DNS dos 2 domínios, form ligado à API.
- **Fase 2 (E2E em prod):** form→303→`/obrigado`→kanban; login+troca de status; `/admin/cadeiras`; UTF-8 limpo; leads de teste apagados.
- **Fase 3 (admin controla o site):**
  - **Mapa de cadeiras AO VIVO (runtime fetch).** `index.astro` renderiza skeleton estático (SEO/no-JS) + `<script is:inline>` que busca `/api/cadeiras` **no navegador** e sobrescreve status/aberta. `GET /api/cadeiras` tem `Access-Control-Allow-Origin: *`. **Editar cadeira no `/admin` → F5 no site reflete, SEM rebuild.** (commit `0bef049`)
  - **Apagar candidatura.** `DELETE /api/candidaturas/:id` (auth, idempotente) + botão "Apagar" no card (`window.confirm`). (commit `d62ebf4`)
- **Fase 4:** senha do Postgres rotacionada.
- **Fase 5 — Camada Parceiro (spec `007-camada-parceiro`, 2026-07-01):** liga cadeira → parceiro → negócio originado (pedido pago repassado) → success fee → cobrança Asaas, sobre a app de porcelanato existente (`/app`). 3 modelos novos (`Parceiro`, `NegocioOriginado`, `FaturaSuccessFee`) + back-relations. Implementado **US1+US2+US3+US4 completos** (todas as 4 user stories da spec):
  - **US1** — `/admin/parceiros`: cadastrar/sondar/ativar/riscar parceiro por cadeira, gravar %/CPF-CNPJ/contrato. Conversão a partir de `Candidatura` aprovada (dropdown de cadeira, sem fuzzy match).
  - **US2** — ação "Repassar a parceiro" em `/admin/pedidos` (pedido pago → parceiro ativo); `valor` = total−frete calculado no servidor; isenção pontual com motivo; repasse único por pedido (409 se já ativo); `/admin/parceiros/[id]` lista os negócios e avança estágio até `ganho`.
  - **US3** — `lib/success-fee.ts` (`calcularFaturaMensal`, função pura, testada em `test/success-fee.test.mjs`) + `lib/asaas.ts` (REST via `fetch`, sem SDK, espelha `lib/mercadopago.ts`) + `api/faturas` (gera fatura do mês + emite cobrança) + `api/parceiros/webhook` (concilia pagamento, idempotente por `asaasPaymentId`).
  - **US4** — `lib/ocupacao.ts` (`derivarOcupacao`, D6): estado da cadeira (ocupada por contratado | em prospecção | aberta) refletido no Painel (`/admin`) e em `/admin/cadeiras`, sem duplicar status em `Cadeira`.
  - **Verificado localmente:** `tsc --noEmit` limpo, `next build` limpo, `npm test` (5 suítes, incl. `success-fee.test.mjs`) passando.

- **GEO — IndexNow no deploy (2026-07-02, `7a53d58`):** `src/scripts/indexnow.mjs` como postbuild nos DOIS sites (`/site` e `/site-goiania`; no goiânia encadeado após `check-feed`). Envia todas as URLs do `dist/sitemap.xml` a `api.indexnow.org`; chave pública `e72cab81d95c41fd915ce3331a10d1ad.txt` no `public/` de ambos. Ping não-fatal (falha da API não quebra o build). Testado local: HTTP 202 (9 URLs institucional, 72 goiânia). **Chave só valida quando o `.txt` estiver em prod → redeploy dos 2 sites ativa de verdade.**

- **Trio de conversão (2026-07-03, `ea1e6de`):** (1) carrinho do goiânia ganhou botão "Receber orçamento no WhatsApp" (link `?c=` → `wa.me/5562993265713` + evento `orcamento_whatsapp`); (2) `/admin/parceiros/[id]/demonstrativo?mes=` — demonstrativo mensal imprimível do success fee (fatura emitida = autoridade, senão prévia via `calcularFaturaMensal`; print CSS = PDF pro parceiro); (3) admin mobile ≤760px (nav rolável, tabelas com scroll horizontal, seat-rows empilhadas). site-goiania sobe por push; **`/app` precisa de redeploy manual** pra (2) e (3) valerem.

## Pendências — Camada Parceiro (007), MANUAL

- ~~`prisma db push` no host~~ — **feito 2026-07-01**: 3 tabelas novas (`parceiros`, `negocios_originados`, `faturas_success_fee`) aplicadas em `roilabs_db@2.24.207.200:5443`, verificadas via `prisma.count()` (0 registros, prontas para uso).
- **Envs Asaas na EasyPanel:** `ASAAS_API_KEY`, `ASAAS_API_URL` (sandbox primeiro), `ASAAS_WEBHOOK_TOKEN` — apontar o webhook do Asaas para `/api/parceiros/webhook`. Sem essas envs, US3 (fatura/cobrança) não funciona; US1+US2 não dependem delas.
- **Verificação em ambiente real (Const. II, não feita ainda por falta de DB local):** seguir `specs/007-camada-parceiro/quickstart.md` (US1→US4) em prod/Docker, com Asaas em **sandbox** antes de produção; anexar evidência (screenshots + output do `tsx`).
- **Commit/push deste incremento:** pendente de confirmação do dono antes de subir pra `main` (repo tem outras mudanças não commitadas de sessões anteriores — ver `git status`).

## Decisões (confirmadas com o dono)
- Admin = **leads + cadeiras** (sem gestão de conteúdo por ora).
- Auth = **login único** interno (cookie HMAC, sem NextAuth).
- DB = Postgres existente, `db push` (MVP, 2 tabelas).
- Mapa de cadeiras = **runtime fetch** (não build-time — ver gotcha abaixo).

## Pendências / gotchas (LEIA antes de mexer)
- **★ Build-time fetch NÃO reflete o DB.** O Docker cacheia o layer `RUN npm run build`; redeploy sem commit novo serve `dist` velho. Por isso o mapa de cadeiras é **runtime fetch (navegador)**, não build. Não voltar pra build-time. (foi o bug que custou uma rodada)
- **Deploy do mapa = 2 Apps:** o app precisa do **CORS** (`/api/cadeiras`) e o site do **script runtime**. Redeploy: **app primeiro, site depois.**
- **`npm install` em pasta OneDrive corrompe `node_modules`** (errno -4094). Build/`tsc` local é **não-confiável** (resolve módulos errado). **Verificação real = Docker (EasyPanel) ou navegador.**
- **Schema:** fazer `db push` MANUAL de uma máquina que alcança `2.24.207.200`. NÃO confiar no runner standalone.
- **Cadeiras:** `seats.ts` (em `/app`) + array do `index.astro` (em `/site`) = **só fallback no-JS**; a verdade é o DB (a UI ao vivo sobrescreve).
- **Patterns Next16 do dono:** params `Promise`+`await params`; `getAuthFromRequest()→auth.id`; prisma singleton `@/lib/prisma`; `prisma generate` antes do `next build`; tabelas snake_case `@@map`.

## Como rodar / verificar
- Repo local: `c:\Users\jeanz\OneDrive\Desktop\ROI Labs\ROI Labs`. `gh` autenticado (`JeanZorzetti`, repo PRIVADO).
- Site Astro: `cd site && npm run dev`. App Next: `cd app && npm run dev`.
- Verificar prod sem browser: `curl -I https://roilabs.com.br` / `curl https://app.roilabs.com.br/api/cadeiras`.
- Verificar o mapa ao vivo: abrir `roilabs.com.br`, conferir request `GET app.roilabs.com.br/api/cadeiras` = 200 sem erro de CORS no console.
