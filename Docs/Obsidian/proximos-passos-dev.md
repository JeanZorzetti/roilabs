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

## 🎯 Agora (2026-07-02) — lista autoritativa

### Caminho crítico (em ordem)

- [x] **1. Redeploy do `/site` e do `site-goiania` na EasyPanel.** Publica 5 entregas já na `main`: eventos himetrica (`7f3a4eb`), `llms.txt` automático da coleção (`ecb94e2`), `sameAs` LinkedIn+Instagram (`57f69c9`), `Service`+`Offer` na home + breadcrumbs nos artigos (`6deee61`) e OG image por artigo (`038a9ca`). Há commits novos → o cache de layer do Docker busta sozinho (gotcha `easypanel-docker-build-cache-stale-dist` não se aplica).
- [x] **2. Verificar em prod (browser, pós-deploy):**
	- `roilabs.com.br/llms.txt` lista os artigos do blog (gerado da coleção, não mais o manual);
	- OG de 1 artigo responde PNG em `/open-graph/...` e aparece no preview (opengraph.xyz ou similar);
	- JSON-LD da home valida com `Service`+`Offer` (validator.schema.org) e `sameAs` presente nos 2 sites;
	- **eventos himetrica chegando no painel**: `whatsapp_click` nos 2 sites, `candidatura_convertida` (institucional), `pedido_convertido`/`lead_convertido` (goiânia). Dedupe por sessionStorage — testar reload do `/obrigado` não duplica.
- [ ] **3. Configurar o Asaas (chaves + webhook)** — última pendência do MVP (feature 007). Sem isso a cobrança do success fee não roda. Integração externa, separada do Mercado Pago do checkout.

### Depois (dev, ranqueado por alavanca)

- [ ] **GSC: medir a malha pSEO.** Conferir propriedade de `goiania.roilabs.com.br` no Search Console, submeter sitemap e acompanhar **páginas indexadas das 39** — é a métrica de decisão do GTM ("medir indexadas", [[40-gtm]]). Primeiro checkpoint ~2 semanas pós-deploy.
- [x] **LP/ajustes para Google Ads** quando a campanha `porcelanato goiânia` (140/mês, CPC alto — âncora validada no Keyword Planner, [[mercado]]) for ao ar. Nada a fazer antes de a Duda decidir a campanha.
- **Bloqueado (não é dev agora):** Gatekeeper (buy, tier 2 de integração) depende de fechar o 1º fornecedor — Gate 3, campo.

## 🧭 Fora da caixa — próximo ciclo (2026-07-02)

> [!note] O que ninguém pediu mas o negócio precisa. Verificado contra o código: nada abaixo existe ainda (exceto onde indicado). Item grande = virar spec (009+) antes de codar.

### 🛡️ Proteger o que está no ar

- [ ] **Backup automático do Postgres.** `roilabs_db` tem pedidos pagos e leads reais e **zero backup**. `pg_dump` diário via cron no VPS + cópia semanal fora dele (qualquer object storage); testar 1 restore de verdade. É o item mais barato da lista contra o pior cenário.
- [ ] **Uptime monitor + alerta.** cron-job.org (grátis, padrão já usado no Compass) em 3 URLs: `app.roilabs.com.br/api/cadeiras` (prova app+DB vivos), home do goiânia e home do institucional. Hoje, checkout quebrado = ninguém fica sabendo até alguém reclamar.
- [ ] **Alerta de lead/pedido novo.** Hoje candidatura e pedido pago só aparecem pra quem abre o admin — em high-ticket local, velocidade de resposta É conversão. Lazy: fetch fire-and-forget pra um e-mail (Resend free tier) dentro do `POST /api/candidaturas` e do webhook de pagamento. Nada disso existe no código (verificado).

### 📣 Distribuição grátis (alavanca GEO/SEO que quase ninguém local usa)

- [x] **⭐ Google Merchant Center — CONCLUÍDO 2026-07-02 (spec 009).** Feed no ar (`goiania.roilabs.com.br/feed.xml`, 30 itens, verificado em prod), gate `check-feed` postbuild provado, conta criada e feed cadastrado com busca diária: **30/30 processados sem erro estrutural** (SC-002 ✓). Bônus da esteira: página `/devolucoes` (CDC) criada — era exigência do Merchant Center e o site não tinha. ⏳ Único watch-point: itens "Em análise" — conferir **Produtos → Diagnóstico** em ~3 dias (meta ≥ 90% aprovados, SC-003); reprovações → troubleshooting em `site-goiania/docs/merchant-center.md`.
- [x] **IndexNow no deploy — FEITO 2026-07-02.** `src/scripts/indexnow.mjs` nos DOIS sites (postbuild; no goiânia encadeado após o `check-feed`), chave `e72cab81d95c41fd915ce3331a10d1ad.txt` no `public/` de ambos. Testado local: HTTP 202 (9 URLs institucional, 72 goiânia). Ping é não-fatal (falha da API nunca quebra o build). A chave valida quando o `.txt` for ao ar → **vale de verdade no próximo redeploy dos 2 sites**.
- [ ] **`LocalBusiness` + Google Business Profile.** Quando houver endereço/telefone comercial: 1 nó `LocalBusiness` no @graph do goiânia; o GBP em si é ops (Duda). É o que disputa o **local pack** de `porcelanato goiânia` — a âncora de 140/mês do Keyword Planner ([[mercado]]).
- [ ] **Review engine → estrelas no SERP.** Pós-venda pede avaliação (link no `/obrigado` ou follow-up WhatsApp), admin grava, e as páginas de produto expõem `AggregateRating` quando ≥ 3 avaliações reais. **Ativar só com 3–5 pedidos entregues** — antes disso é schema vazio (e risco de penalidade).

### 💰 Converter mais com o que já existe

- [ ] **Orçamento por WhatsApp no carrinho.** O carrinho já tem link de compartilhar; adicionar botão "Receber orçamento no WhatsApp" que manda o link do carrinho pro nosso número + evento himetrica `orcamento_whatsapp`. Porcelanato é compra consultiva — captura o lead **antes** do checkout, onde a maioria desiste.
- [ ] **Admin no celular.** Duda opera de campo; passar `/admin` (kanban, pedidos, cadeiras) no mobile e consertar o que quebrar. Custo baixo, destrava a operação do dia a dia.
- [ ] **Demonstrativo do parceiro.** Quando a 1ª fatura Asaas rodar: página/PDF simples por parceiro (pedidos repassados no mês, total, % aplicado, valor da fatura). O modelo success-fee vive de **transparência** — o fornecedor precisa ver pelo que está pagando sem pedir print. Dados já existem na camada 007 (`NegócioOriginado` ↔ `Fatura`).

---

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
- **007 — configurar o Asaas**: movido para a lista autoritativa em [[#🎯 Agora (2026-07-02) — lista autoritativa|Agora]] (item 3).

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

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
