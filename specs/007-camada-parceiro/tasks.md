---
description: "Task list — Camada Parceiro (007)"
---

# Tasks: Camada Parceiro

**Input**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: incluído teste `tsx` para o cálculo puro do fee (`success-fee`) — Const. II (dinheiro).

**Increment strategy** (research D7): **MVP = Foundational + US1 + US2** (parceiros + repasses, sem Asaas). **Incremento 2 = US3 + US4** (fatura/cobrança Asaas + painel). Cada incremento commitável/verificável isolado.

## Format: `[ID] [P?] [Story] Description` — raiz de código: `ROI Labs/app/`

---

## Phase 1: Setup
_(sem setup dedicado — roda sobre a app Next/Prisma existente)_

---

## Phase 2: Foundational (bloqueia todas as stories)

- [X] T001 Adicionar 3 modelos em `prisma/schema.prisma` conforme [data-model.md](./data-model.md): `Parceiro` (`@@map parceiros`, **incl. `cpfCnpj String? @map("cpf_cnpj")`** — C1), `NegocioOriginado` (`@@map negocios_originados`), `FaturaSuccessFee` (`@@map faturas_success_fee`) + back-relations em `Cadeira`/`Candidatura`/`Pedido` (sem colunas novas). Rodar `prisma generate`.

**Checkpoint**: `prisma.parceiro`/`negocioOriginado`/`faturaSuccessFee` tipados disponíveis.

---

## Phase 3: User Story 1 — Registrar parceiros e sondagem (P1) 🎯 MVP

**Goal**: cadastrar parceiros, transicionar estágio (sondagem→ativa→pausada|riscada), gravar % e contrato.
**Independent Test**: criar 2 parceiros numa cadeira, ativar um com %, riscar outro, marcar contrato → estados refletidos.

- [X] T002 [US1] `api/parceiros/route.ts` — `GET` (lista) + `POST` (cria; `cadeiraId` obrigatório deriva `nicho`; estágio `sondagem`; `isAuthed`), padrão `api/cupons`. Ver [contracts/admin-parceiros.md](./contracts/admin-parceiros.md).
- [X] T003 [P] [US1] `api/parceiros/[id]/route.ts` — `PATCH` (estágio/`comissaoPct`/`cpfCnpj`/`contratoEm`/dados; `ativa` sem `%` ⇒ 400) + `DELETE` (só sem negócios/faturas ⇒ senão 409). `params: Promise<{id}>`+`await`, `isAuthed`.
- [X] T004 [US1] `admin/parceiros/page.tsx` (server `force-dynamic`): lista parceiros por cadeira com estágio/% e ocupação derivada (design system LIGHT).
- [X] T005 [US1] `admin/parceiros/parceiros-form.tsx` (client): criar/editar/estágio/% chamando as rotas, `router.refresh()`; conversão a partir de `Candidatura` (dropdown de cadeira — D5).
- [X] T006 [US1] `admin/nav.tsx` — adicionar link "Parceiros" → `/admin/parceiros`.

**Checkpoint**: gestão de parceiros funcional.

---

## Phase 4: User Story 2 — Repassar pedido pago a parceiro (P1) 🎯 MVP

**Goal**: registrar negócio originado (pedido→parceiro), estágio, isenção pontual; 1º repasse manual.
**Independent Test**: repassar um pedido pago a parceiro ativo (faturável) e outro isento; avançar até ganho; bloquear parceiro riscado.

- [X] T007 [US2] `api/negocios/route.ts` — `POST` (repasse: valida `Pedido pago` + `Parceiro ativo`; **recusa 409 se o pedido já tem negócio ativo ≠ perdido — FR-004a/C2**; `valor` = **total − frete** no servidor — F1; `faturavel=!isento`; isento exige motivo) + `GET ?parceiroId`. `isAuthed`. Ver [contracts/admin-negocios.md](./contracts/admin-negocios.md).
- [X] T008 [P] [US2] `api/negocios/[id]/route.ts` — `PATCH` (estágio `repassado|aceito|ganho|perdido`, isenção; bloqueia se já faturado ⇒ 409). `isAuthed`.
- [X] T009 [US2] `admin/parceiros/[id]/page.tsx` (detalhe): negócios do parceiro + controles de estágio (usa T008).
- [X] T010 [US2] Ação "Repassar a parceiro" na tela `admin/pedidos` (linha do pedido **pago**): seleciona parceiro ativo → `POST /api/negocios`.

**Checkpoint**: MVP (US1+US2) entregável — parceiros + repasses sem Asaas. **Commit + verificação real (quickstart 3–4) + handoff parcial.**

---

## Phase 5: User Story 3 — Success fee + cobrança Asaas (P2)

**Goal**: fatura mensal por parceiro + cobrança Asaas + conciliação.
**Independent Test**: gerar fatura de parceiro ativo com negócios ganhos → cobrança no Asaas sandbox → webhook marca paga; isento/reembolsado excluídos.

- [X] T011 [US3] `lib/success-fee.ts` — função **pura** `calcularFaturaMensal(comissaoPct, negocios)` (inclui `ganho ∧ faturável ∧ não-reembolsado ∧ não-faturado`; `valor=base×pct`).
- [X] T012 [P] [US3] `test/success-fee.test.mjs` (`node --import tsx`) cobrindo inclusão/exclusão e `valor=base×pct`; adicionar ao script `test` do `package.json`.
- [X] T013 [US3] **Env-first (Const. I)**: adicionar `ASAAS_API_KEY`, `ASAAS_API_URL`, `ASAAS_WEBHOOK_TOKEN` ao `.env.example`; `lib/asaas.ts` (REST `fetch`, sem SDK) — `garantirCliente`, `criarCobranca`, `verificarPagamento` (espelha `lib/mercadopago.ts`). Ver [contracts/asaas-webhook.md](./contracts/asaas-webhook.md).
- [X] T014 [US3] `api/faturas/route.ts` — `POST` (exige parceiro `ativa` + `comissaoPct` + **`cpfCnpj` — C1**; gera fatura do mês via `calcularFaturaMensal`, vincula negócios, emite cobrança Asaas, grava `asaasPaymentId`; falha Asaas ⇒ `status='erro'`; re-gerar mês ⇒ 409) + `GET ?parceiroId`. `isAuthed`. Ver [contracts/admin-faturas.md](./contracts/admin-faturas.md).
- [X] T015 [US3] `api/parceiros/webhook/route.ts` — webhook Asaas (valida `ASAAS_WEBHOOK_TOKEN` antes de tocar estado; idempotente por `asaasPaymentId`; confirma ⇒ `paga`). Espelha `api/pagamentos/webhook`.
- [X] T016 [US3] Na tela `admin/parceiros/[id]`: seção Faturas (gerar mês, listar competência/valor/status/link da cobrança).

**Checkpoint**: monetização funcional (Asaas sandbox verificado).

---

## Phase 6: User Story 4 — Ocupação real no Painel (P3)

- [X] T017 [US4] Derivar estado da cadeira (ocupada por contratado | em prospecção | aberta — D6) e refletir no Painel (`admin` home / feature 005) e no `admin/cadeiras`, sem duplicar status em `Cadeira`.

---

## Phase 7: Polish & verificação

- [X] T018 [P] Rodar `tsx` e anexar output (Const. II).
- [ ] T019 **MANUAL no host**: `prisma db push` (3 tabelas). Runner standalone não aplica schema.
- [ ] T020 **Env prod (Const. I)**: setar `ASAAS_*` na EasyPanel + apontar webhook Asaas → `/api/parceiros/webhook`; validar em **sandbox** antes de prod.
- [ ] T021 Verificação em ambiente real por [quickstart.md](./quickstart.md) (US1–US4) com evidência.
- [X] T022 `handoff.md` co-localizado + commit + push por incremento (Const. V).

---

## Dependencies
- **T001** bloqueia tudo.
- **US1 (T002–T006)** e **US2 (T007–T010)** após T001; US2 usa `Parceiro ativo` de US1. T003/T008 `[P]` (rotas `[id]` distintas).
- **US3 (T011–T016)** após US2 (precisa de negócios ganhos). T012 `[P]` após T011. T013 (Asaas/env) antes de T014/T015.
- **US4 (T017)** após US1 (contrato/estágio).
- **Polish**: T019 após T001; T020 após T013; T021 após todas.

## Notas
- Camada **aditiva**: não tocar `lib/centros-custo.ts` nem o fluxo MP do checkout.
- `Pedido.statusPagamento='reembolsado'` (já setado pelo webhook MP) é o sinal de exclusão de negócio reembolsado (D4).
