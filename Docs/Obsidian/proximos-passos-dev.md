---
tipo: checklist
status: vivo
data: 2026-06-29
dono: Jean (dev)
---

# ✅ Próximos passos — DEV (Jean)

> [!info] Onde estamos
> O **código está pronto e na `main`**: `/site` (Astro), `/app` (admin Next 16 — candidaturas kanban + mapa de cadeiras) e o blog GEO. Working tree limpo, tudo pushado.
> **Nada de código novo bloqueia.** O que falta é colocar no ar (ops) + 2 decisões de arquitetura. O estratégico do vault está todo `decided` — ver [[INDEX]].

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

## ✅ Resolvido — Logo (Task 2)

- [x] **Task 2 — Logo.** ✔ Verificado (2026-06-29): variante **clara** (off-white) com chevron laranja hi-vis aplicada no header (`Header.astro` → `roilabs-logo.png`), **visível no header escuro** e alinhada à paleta. Assets otimizados e presentes: logo 173KB, icon 93KB, og-image 31KB, favicon + apple-touch-icon ligados no `Base.astro`. Os 2 gotchas (preta some no escuro / grunge vs. clean) **resolvidos**.

## 👤 Não-dev (Maria Eduarda / campo)

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
