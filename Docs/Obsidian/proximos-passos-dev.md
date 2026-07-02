---
tipo: checklist
status: vivo
data: 2026-07-01
dono: Jean (dev)
---

# ✅ Próximos passos — DEV (Jean)

> [!info] Onde estamos (2026-07-01)
> **MVP no ar e muito além dele.** `roilabs.com.br` (site + blog GEO) e `app.roilabs.com.br` (admin Next 16) em produção desde 2026-06-29. Além da intermediação (candidaturas kanban + mapa de cadeiras), o admin já roda o **e-commerce de porcelanato** (carrinho + checkout Mercado Pago), **centros de custo** editáveis, **painel financeiro** mensal + CSV, **cupons** geríveis sem deploy e a **camada parceiro** (success fee via Asaas) — features 002→007, todas shippadas na `main`.
> **Nada de código bloqueia.** O único pendente do MVP é **configurar as chaves do Asaas** (integração externa do success fee) — as verificações em prod das telas 005/006 já foram feitas. Backlog de dev novo (pós-MVP) na [[#🆕 Backlog de dev (novo — pós-MVP)|seção abaixo]]. O estratégico do vault segue `decided` — ver [[INDEX]].

> [!warning] O que NÃO é seu
> Fechar 1º fornecedor (Gate 3), piso de take rate em R$, prospecção de players = **Maria Eduarda / campo**. Não entram aqui.

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
- [ ] **007 — configurar o Asaas**: chaves + webhook (integração externa, separada do Mercado Pago do checkout) para a cobrança do success fee valer em prod.

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
