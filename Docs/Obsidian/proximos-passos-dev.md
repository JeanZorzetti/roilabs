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
- [ ] **Form REAL no browser** em `roilabs.com.br` com acento ("Goiânia") → confirmar que grava **sem mojibake**. Site tem `<meta charset=utf-8>`; o "Goi�nia" dos leads de teste veio de bytes ruins do terminal, não do app — confirmar pelo lead `UTF8 TEST`.
- [ ] **Apagar os leads de teste** no `/admin`: `SMOKE TEST - apagar`, `UTF8 TEST - apagar`, `Teste Fluxo`.

## 🔧 Fase 3 — Decisões de dev / dívida técnica

- [ ] **Cadeiras ↔ site (decisão de arquitetura).** O admin grava cadeiras no DB, mas o site Astro lê `seats[]` hard-coded. Decidir: rebuild a cada mudança **ou** site faz `fetch('/api/cadeiras')` no build/ISR (acopla site↔app). Implementar a escolhida. Fonte do seed espelha o array: `src/lib/seats.ts`.
- [ ] **Kanban sem drag** (hoje muda status por `<select>`, ponytail). Só adicionar `@dnd-kit` (padrão do CRM SplitJud) se quiser arrastar — opcional.
- [ ] **WhatsApp do card** assume número BR local e prefixa `55`. Se vier com DDI, ajustar.

## 🔒 Fase 4 — Segurança

- [x] **Rotacionar a senha do Postgres exposta** (`PAzo18**` em `roilabs_db`). Depois atualizar `DATABASE_URL` nas env vars da EasyPanel. (ver memória `secrets_to_rotate`)

---

## ✅ Resolvido — Logo (Task 2)

- [x] **Task 2 — Logo.** ✔ Verificado (2026-06-29): variante **clara** (off-white) com chevron laranja hi-vis aplicada no header (`Header.astro` → `roilabs-logo.png`), **visível no header escuro** e alinhada à paleta. Assets otimizados e presentes: logo 173KB, icon 93KB, og-image 31KB, favicon + apple-touch-icon ligados no `Base.astro`. Os 2 gotchas (preta some no escuro / grunge vs. clean) **resolvidos**.

## 👤 Não-dev (Maria Eduarda / campo)

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
