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
