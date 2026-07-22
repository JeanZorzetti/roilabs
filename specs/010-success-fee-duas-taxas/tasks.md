---
description: "Task list — 010 success fee com duas taxas"
---

# Tasks: Success fee com duas taxas (aquisição vs recorrência)

**Input**: Design documents from `specs/010-success-fee-duas-taxas/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: INCLUÍDOS apenas para a lógica pura de dinheiro (função de cálculo, classificação, normalização de doc) — exigência do caminho de dinheiro (Const. II + quickstart Gate 1). Sem suíte de endpoint (YAGNI, segue o padrão do repo que só testa libs puras).

**Organization**: Tarefas agrupadas por user story. Paths relativos à raiz do monorepo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1–US4 (mapeia o spec)

---

## Phase 1: Setup

- [ ] T001 Confirmar ambiente do `/app`: `npx prisma generate` ok e `DATABASE_URL` do `roilabs_db@2.24.207.200:5443` alcançável do host que vai rodar o `db push` (Const. I/II).

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: schema + libs puras + cálculo. Nenhuma user story roda antes disto.

- [ ] T002 Schema: em `app/prisma/schema.prisma` adicionar — `Parceiro.comissaoAquisicao` + `Parceiro.comissaoRecorrencia` (`Decimal? @db.Decimal(6,4)`, `comissaoPct` mantido deprecado); `NegocioOriginado.clienteDoc` (String?), `.classificacao` (String?), `.taxaAplicada` (`Decimal? @db.Decimal(6,4)`, **nullable nesta etapa**) + `@@index([parceiroId, clienteDoc])`; `Pedido.compradorDoc` (String?). (data-model.md)
- [ ] T003 [P] Criar `app/src/lib/doc.ts`: `normalizarDoc` (só dígitos) + `validarDoc` (CPF 11 / CNPJ 14 dígitos) — puro.
- [ ] T004 [P] Criar `app/test/doc.test.mjs`: self-check de `doc.ts` (pontuação some; tamanho inválido rejeita). Escrever ANTES, falhar antes de T003.
- [ ] T005 Criar `app/src/lib/classificar-negocio.ts`: função pura `classificarNegocio(clienteDoc, anteriores) → 'aquisicao'|'recorrencia'` (doc vazio → aquisição; existe anterior não-perdido com mesmo doc → recorrência) (research.md D3). Depende de T003.
- [ ] T006 Criar `app/test/classificar-negocio.test.mjs`: doc vazio → aquisição; histórico não-perdido → recorrência; único anterior perdido → aquisição. Escrever ANTES, falhar antes de T005.
- [ ] T007 Alterar `app/src/lib/success-fee.ts`: `NegocioCalc += taxaAplicada`; `calcularFaturaMensal(negocios)` (sem `comissaoPct`) soma `valor = Σ money(n.valor × n.taxaAplicada)` sobre os elegíveis; `base = Σ valor` (research.md D4).
- [ ] T008 Atualizar `app/test/success-fee.test.mjs`: cenário 2 negócios mesmo cliente → 1000×0.15=150 + 1000×0.10=100 → fatura 250 / base 2000; arredondamento por negócio sem drift. Ajustar ANTES, falhar antes de T007.
- [ ] T009 Aplicar schema: `prisma db push` no `roilabs_db` (host real) com as colunas novas (`taxaAplicada` ainda nullable). Depende de T002. Validar no host (Const. II).

**Checkpoint**: schema no ar, libs puras verdes.

---

## Phase 3: User Story 1 - Definir as duas taxas por parceiro (P1) 🎯 MVP

**Goal**: operador define aquisição 15% / recorrência 10% por parceiro e salva.

**Independent Test**: em `/admin/parceiros`, salvar 0.15/0.10, reabrir e ver os dois; `1` numa taxa é barrado.

- [ ] T010 [US1] `app/src/app/api/parceiros/route.ts` (POST + GET): aceitar/validar `comissaoAquisicao` e `comissaoRecorrencia` em [0,1] (400 fora do range); GET expõe as duas; ignorar `comissaoPct` do body (contracts/parceiros.md).
- [ ] T011 [US1] `app/src/app/api/parceiros/[id]/route.ts` (PATCH): validar as 2 taxas; `estagio='ativa'` e `podeGerar` exigem as **duas** + `cpfCnpj` (substitui a exigência de `comissaoPct`).
- [ ] T012 [US1] `app/src/app/admin/parceiros/parceiros-form.tsx`: dois campos (aquisição/recorrência) com placeholder `fração 0–1 (ex.: 0.15 = 15%)`; validação [0,1] no cliente.
- [ ] T013 [P] [US1] `app/src/app/admin/parceiros/[id]/page.tsx`: exibir as duas taxas (× 100 %) em vez de `comissaoPct`.

**Checkpoint**: taxas duplas definíveis e persistidas.

---

## Phase 4: User Story 2 - Faturar aplicando a taxa correta por negócio (P1)

**Goal**: cada negócio é cobrado 15% (1ª compra ganha do cliente) ou 10% (recorrência), somando por negócio; auditável no demonstrativo.

**Independent Test**: 2 pedidos pagos com o mesmo CPF/CNPJ → 1º negócio 15%, 2º 10%; fatura = soma por negócio; demonstrativo bate.

- [ ] T014 [US2] `app/src/app/api/negocios/route.ts` (POST): ler `pedido.compradorDoc` → `normalizarDoc`; classificar via `classificarNegocio` (buscar anteriores não-perdidos do mesmo `parceiroId`+`clienteDoc`); gravar `clienteDoc`/`classificacao`/`taxaAplicada` (da taxa vigente do parceiro); exigir parceiro com as 2 taxas. GET expõe `classificacao`/`taxaAplicada` (contracts/negocios.md).
- [ ] T015 [US2] `app/src/app/api/faturas/route.ts` (POST): trocar validação `comissaoPct===null` por "faltam as 2 taxas"; montar `NegocioCalc` com `taxaAplicada` do negócio; chamar o novo `calcularFaturaMensal(negocios)` (contracts/faturas.md).
- [ ] T016 [US2] `app/src/app/admin/parceiros/[id]/demonstrativo/page.tsx`: breakdown por negócio (classificação + taxa aplicada + subtotal) e total conferindo com a soma (SC-002).
- [ ] T017 [US2] Captura no checkout `site-goiania`: campo **opcional** "CPF ou CNPJ" no formulário de checkout (`site-goiania/src/pages/*` do carrinho/pedido) enviado ao criar o Pedido (contracts/checkout-pedido.md, Q1).
- [ ] T018 [US2] Persistir `compradorDoc` na criação do Pedido no `/app` (rota que cria o `Pedido`): `normalizarDoc`+`validarDoc`; grava dígitos, `null` se inválido/ausente (não bloqueia B2C).

**Checkpoint**: fatura cobra a taxa certa por negócio, ponta a ponta.

---

## Phase 5: User Story 3 - Compatibilidade com parceiros e faturas existentes (P2)

**Goal**: nada existente muda de valor; parceiros legados ganham as 2 taxas iguais à antiga.

**Independent Test**: rodar o backfill 2× (idempotente); nenhuma `FaturaSuccessFee` muda `valor`.

- [ ] T019 [US3] Criar `app/scripts/migrate-010-backfill.mjs` (idempotente): parceiros → `comissaoAquisicao=comissaoRecorrencia=comissaoPct`; negócios abertos (`faturaId=null`, sem `taxaAplicada`) → `taxaAplicada=parceiro.comissaoPct`, `classificacao='legado'`, `clienteDoc` do pedido; não tocar negócios faturados/faturas emitidas (research.md D6).
- [ ] T020 [US3] Rodar o backfill no host real 2× e verificar: `valor` de todas as faturas existentes inalterado; TapePro com `comissaoAquisicao=comissaoRecorrencia=0.15` (depois setar recorrência 0.10 pela UI) (SC-004).
- [ ] T021 [US3] Segunda etapa da migração: tornar `NegocioOriginado.taxaAplicada` **NOT NULL** em `app/prisma/schema.prisma` + `db push` (só após T020, quando todo negócio aberto já tem taxa).

**Checkpoint**: migração fechada, zero regressão de valor.

---

## Phase 6: User Story 4 - Snapshot congelado / rastreabilidade (P2)

**Goal**: taxa e classificação de um negócio nunca mudam depois de criadas.

**Independent Test**: alterar as taxas do parceiro e reabrir negócios já criados → `taxaAplicada`/`classificacao` inalteradas.

- [ ] T022 [US4] Garantir imutabilidade: revisar `app/src/app/api/negocios/[id]/route.ts` e `app/src/app/api/parceiros/[id]/route.ts` para que nenhuma transição de estágio nem edição de taxa reescreva `taxaAplicada`/`classificacao`/`clienteDoc`; adicionar assert/self-check simples que muda a taxa do parceiro e confirma o negócio congelado (FR-005).

**Checkpoint**: auditoria garantida.

---

## Phase 7: Polish & Validação (Cross-Cutting)

- [ ] T023 [P] Rodar os self-checks (Gate 1): `doc.test.mjs`, `classificar-negocio.test.mjs`, `success-fee.test.mjs` — todos verdes.
- [ ] T024 Validação E2E real (Gate 3, Const. II) no EasyPanel/navegador: fluxo do quickstart (2 pedidos mesmo doc → 15%+10%, demonstrativo bate, snapshot congelado, checkout grava `compradorDoc` só dígitos).
- [ ] T025 `specs/010-success-fee-duas-taxas/handoff.md` (feito/decisões/pendências/gotchas) — Const. V.
- [ ] T026 [P] Atualizar o vault `Docs/Obsidian/80-dev/` com a regra de duas taxas (aquisição/recorrência) e a migração (opcional, memória durável).

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T009)** bloqueia tudo.
  - Ordem interna: T002→T009 (schema→push); libs puras T003→T004, T005→T006, T007→T008 (teste antes da impl); T009 depois de T002.
- **US1 (T010–T013)**, **US2 (T014–T018)**, **US4 (T022)**: dependem do Foundational. US2 depende de T005 (classificação) e T007 (cálculo).
- **US3 (T019–T021)**: backfill depois do push (T009); T021 (NOT NULL) só depois de T020. US3 é prereq para faturar **negócios legados** corretamente (novos negócios já nascem com `taxaAplicada` via T014).
- **Polish (T023–T026)**: depois das stories desejadas.

### Ordem recomendada (1 dev, sequencial)

T001 → T002 → T003/T004 → T005/T006 → T007/T008 → T009 → **US1** (MVP) → **US2** → **US3** → **US4** → Polish.

### Parallel Opportunities

- T003 (doc.ts) e T005 (classificar) são libs diferentes, mas T005 depende de T003 → sequencial. T004/T006/T008 (testes) [P] entre si (arquivos distintos).
- T013 [P] (page.tsx) paralelo a T010–T012 (arquivos distintos) dentro de US1.
- T017 (site-goiania) [P] em relação a T014–T016 (app) dentro de US2 — apps diferentes.

---

## Implementation Strategy

### MVP (US1)

Setup + Foundational + US1 → operador já define as duas taxas por parceiro (fecha o buraco que gerou o typo 100%). Parar e validar.

### Incremental

US1 → US2 (cobrança correta, o coração) → US3 (migração/compat) → US4 (auditoria). Cada uma testável e deployável (push→deploy automático). Gate 3 (E2E real) declara "pronto".

---

## Notes

- Caminho de dinheiro: T007/T008 (cálculo) e T014 (snapshot) são os pontos críticos — self-check obrigatório antes de deploy; "pronto" só com E2E real (Const. II).
- `comissaoPct` fica deprecado (não dropar) — `ponytail:` no schema.
- Commit + push ao fechar cada story (deploy automático por push).
