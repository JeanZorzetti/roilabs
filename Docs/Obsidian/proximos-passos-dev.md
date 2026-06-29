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

- [ ] **Aplicar schema no DB.** De uma máquina que alcança `2.24.207.200`, dentro de `/app`: `npm install` → `npx prisma db push` → `npm run db:seed` (carrega as 6 cadeiras, idempotente). ⚠️ NÃO confiar no runner standalone p/ schema — fazer `db push` manual.
- [ ] **Criar App `/app` na EasyPanel.** Build path = `/app`, Dockerfile já incluso (Next standalone, porta 3000), domínio `app.roilabs.com.br`. Env vars (de `.env.example`): `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`).
- [ ] **Verificar o build real no Docker.** `next build` nunca rodou local (gotcha OneDrive corrompe `node_modules`). Build limpo é no Docker — conferir que sobe sem erro.
- [ ] **Criar App `/site` na EasyPanel.** Build path = `/site`, Dockerfile (node build → nginx), domínio `roilabs.com.br`. Esse deploy nunca foi feito. Já leva o **blog GEO** junto (commit `701488d`).
- [ ] **Redeploy do `/site`** para publicar o novo `action` do form (agora posta em `app.roilabs.com.br/api/candidaturas`, era Web3Forms placeholder). Se criar o App já com o código atual, está coberto.
- [ ] **DNS:** `roilabs.com.br` → App do site; `app.roilabs.com.br` → App do admin.

## 🔎 Fase 2 — Validar (smoke test E2E em prod)

- [ ] Submeter o **form do site** → confirmar redirect `/obrigado` e a candidatura aparecendo no kanban do `/admin`.
- [ ] **Login no `/admin`** (`ADMIN_PASSWORD`) e mudar o status de uma candidatura (novo → curadoria → aprovado).
- [ ] `/admin/cadeiras`: abrir/fechar uma cadeira e editar status.

## 🔧 Fase 3 — Decisões de dev / dívida técnica

- [ ] **Cadeiras ↔ site (decisão de arquitetura).** O admin grava cadeiras no DB, mas o site Astro lê `seats[]` hard-coded. Decidir: rebuild a cada mudança **ou** site faz `fetch('/api/cadeiras')` no build/ISR (acopla site↔app). Implementar a escolhida. Fonte do seed espelha o array: `src/lib/seats.ts`.
- [ ] **Kanban sem drag** (hoje muda status por `<select>`, ponytail). Só adicionar `@dnd-kit` (padrão do CRM SplitJud) se quiser arrastar — opcional.
- [ ] **WhatsApp do card** assume número BR local e prefixa `55`. Se vier com DDI, ajustar.

## 🔒 Fase 4 — Segurança

- [ ] **Rotacionar a senha do Postgres exposta** (`PAzo18**` em `roilabs_db`). Depois atualizar `DATABASE_URL` nas env vars da EasyPanel. (ver memória `secrets_to_rotate`)

---

## ⏸️ Bloqueado — aguarda o dono (não é ação sua agora)

- [ ] **Task 2 — Logo.** A grunge atual briga com o site (laranja/clean). Aguardando o dono pedir a **variante que case**. Quando chegar: otimizar (~500px <100KB p/ header + 1200×630 og:image) e aplicar em header (site + admin), favicon e og:image.

## 👤 Não-dev (Maria Eduarda / campo)

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
