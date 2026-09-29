# Tasks: Contrato da cadeira, emitido a partir da proposta

**Input**: Design documents from `/specs/020-contrato-cadeira/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: um arquivo de autoteste (`test/contrato-cadeira.test.mjs`) para a lógica pura: montagem, pendências, hash,
vigência. As telas são verificadas no navegador (constituição II).

Todos os caminhos são relativos a `app/`.

## Phase 1: Setup

- [x] T001 Add `model ContratoCadeira` (`contratos_cadeira`) and the inverse relation on `PropostaCadeira` in prisma/schema.prisma, per data-model.md (FK `RESTRICT`, `UNIQUE` on `proposta_id` and `slug`)
- [x] T002 Export `splitLines` from src/lib/vertice/contract.ts (no behavior change)

## Phase 2: Foundational (blocks all stories)

- [x] T003 Write src/lib/contrato-cadeira.ts: types `ContratoCadeiraInput`/`ContratoCadeiraDoc`, `montarContratoCadeira(input, proposta, slugProposta, agora)` with the clauses of FR-008 to FR-014, `pendenciasDoContrato()`, `hashDoc()` (sorted-keys JSON + SHA-256), `cpfValido()`
- [x] T004 [P] Write test/contrato-cadeira.test.mjs: 3 models, PF×PJ (no liability cap, domicile forum), proposal without deliverables → pending, `[marcador]` → pending, no estimate/ritmo in doc, hash stable under key reorder, start date + 12 months, CPF check digits; add it to `npm test` in package.json
- [x] T005 Generate the SQL with `prisma migrate diff` and apply only the `CREATE TABLE contratos_cadeira` + indexes + FK to production (quickstart.md, before any code push)

## Phase 3: User Story 1 - Emitir o contrato (P1) 🎯 MVP

**Goal**: "Emitir contrato" no cartão da proposta de cadeira abre o formulário e grava o contrato congelado.
**Independent Test**: emitir de uma proposta de teste e ver o contrato na lista com o link e as pendências.

- [x] T006 [US1] Write src/app/admin/contratos/cadeira/actions.ts: `salvarContratoCadeira` (create/edit, re-reads the proposal, limits, `UNIQUE` → friendly error) and `excluirContratoCadeira` (`deleteMany where aceitoEm null`), both behind `isAuthed()`
- [x] T007 [US1] Write src/app/admin/contratos/cadeira/page.tsx: `?proposta=` / `?editar=`; proposal terms read-only (entrada, comissão, anexo), party fields, início, foro, pagamento, extra; contratada prefilled from the last cadeira contract; expired-proposal and no-deliverables warnings; accepted → locked message
- [x] T008 [US1] Add "Emitir contrato" to src/components/vertice/PropostaCadeiraCard.tsx when the proposal has no contract

## Phase 4: User Story 2 - Ler e aceitar pelo link (P1)

**Goal**: `app.roilabs.com.br/c/<slug>` mostra o contrato e aceita com nome, CPF e caixa.
**Independent Test**: aceitar por janela anônima e conferir o registro de aceite no banco.

- [x] T009 [US2] Write src/app/c/[slug]/actions.ts: `aceitarContratoCadeira` per contracts/actions.md (validation → `?erro=`, hash check, optimistic `updateMany`, IP/UA)
- [x] T010 [US2] Write src/app/c/[slug]/page.tsx and src/app/c/[slug]/not-found.tsx per contracts/pagina-publica.md, reusing the `.prop-*` skin
- [x] T011 [P] [US2] Add the few `.contrato-*` classes (numbered clauses, parties, acceptance form, error) to src/app/globals.css

## Phase 5: User Story 3 - Proposta e contrato juntos (P2)

**Goal**: cada tela mostra o outro lado.
**Independent Test**: proposta sem contrato, com pendente e com aceito, nas duas telas.

- [x] T012 [US3] src/app/admin/propostas/page.tsx: include the contract (`id, slug, aceitoEm, aceitoPor, doc`) and pass it to the card
- [x] T013 [US3] src/components/vertice/PropostaCadeiraCard.tsx: contract state (pendências / aguardando / aceito em … por …) with the `/c/` link and the edit path
- [x] T014 [P] [US3] Write src/components/vertice/ContratoCadeiraCard.tsx (badge "Cadeira", title, proposal of origin, pendências, `DocLink` on `ROI_APP`, aceite state, edit/delete only when not accepted)
- [x] T015 [US3] src/app/admin/contratos/page.tsx: `Promise.allSettled` over Vértice + cadeira, merged by date, error per source; title "Contratos · Admin ROI Labs"; empty state points to Propostas

## Phase 6: User Story 4 - Corrigir e excluir com segurança (P3)

- [x] T016 [US4] src/app/admin/propostas/actions.ts: `excluirPropostaCadeira` translates Prisma `P2003` into the friendly error; the card hides "Excluir" when there is a contract
- [x] T017 [US4] Confirm edit flow: `?editar=` reopens with `input`, save rewrites the same slug, accepted contract is refused by the action (covered by T006/T007; verify in browser)

## Phase 7: Polish & Verification

- [x] T018 Run `accessibility` + `ux-writing` over the acceptance form and the admin form; fix findings
- [x] T019 `npm test` + `npx tsc --noEmit`; Docker build if the OneDrive lies
- [x] T020 Push to `main`; production run of quickstart.md steps 1–9 with `ui-verification` (3 widths, keyboard, console); clean the test rows
- [x] T021 Write specs/020-contrato-cadeira/handoff.md (feito / decisões / próximos passos / pendências / gotchas), update memory, commit + push

## Dependencies & Execution Order

- T001 → T003 (types) → T004; T001 → T005 (DB before code push).
- US1 (T006–T008) needs T003. US2 (T009–T011) needs T003 and a saved contract to test. US3 needs US1. US4 needs US1.
- T020 needs T005 applied in production.

## Parallel Opportunities

- T004 ∥ T006/T007 once T003 exists. T011 ∥ T009/T010. T014 ∥ T012/T013.

## Implementation Strategy

MVP = US1 + US2 (emit and accept). US3 is the literal "integrate" and ships in the same push because it is small.
US4 is mostly guaranteed by the DB (`RESTRICT`, `aceitoEm null` filters). One push at the end, after T005.
