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
- **Logo:** variante clara (off-white + chevron laranja) aplicada no header, favicon, og:image — visível no header escuro.

## Decisões (confirmadas com o dono)
- Admin = **leads + cadeiras** (sem gestão de conteúdo por ora).
- Auth = **login único** interno (cookie HMAC, sem NextAuth).
- DB = Postgres existente, `db push` (MVP, 2 tabelas).
- Mapa de cadeiras = **runtime fetch** (não build-time — ver gotcha abaixo).

## Próximos passos (dev — opcionais, sob demanda)
- [ ] **Drag no kanban** (`@dnd-kit`, padrão do CRM SplitJud) — hoje muda status por `<select>`.
- [ ] **DDI no WhatsApp** — o card prefixa `55` assumindo número BR local; parsear se vierem leads de fora.
- [ ] **pSEO `goiania.roilabs.com.br`** — quando entrar gestão de conteúdo programático.
- _Não-dev (Maria Eduarda/campo): fechar 1º fornecedor, piso de take rate em R$, resíduo legal com contador/advogado._

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
