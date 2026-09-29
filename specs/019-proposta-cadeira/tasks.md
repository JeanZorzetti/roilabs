# Tasks: Proposta de cadeira guardada, com link próprio da ROI Labs

**Input**: Design documents from `/specs/019-proposta-cadeira/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: só a regra pura (`montarPropostaCadeira`) ganha teste. O resto se prova em produção (constituição II).

## Phase 1: Setup

- [x] T001 Add `model PropostaCadeira` (`id`, `slug @unique`, `criadaEm`, `doc Json`, `@@index([criadaEm])`, `@@map("propostas_cadeira")`) in app/prisma/schema.prisma
- [x] T002 Run `prisma migrate diff` against production; apply only the `CREATE TABLE` + indexes via `db execute`; confirm `--exit-code` 0 (quickstart step 1)

## Phase 2: Foundational (blocks every story)

- [x] T003 Split the discount rule out of `REGRAS_CONTRATO` into `REGRAS_NEGOCIACAO` and render both on app/src/app/admin/precos/page.tsx (admin screen unchanged)
- [x] T004 Add `PropostaCadeiraDoc` types, `PROPOSTA_VALIDADE_DIAS = 15` and pure `montarPropostaCadeira(entrada, paraQuem, agora)` (client-facing commission text per model, frozen entry lines, estimate `null` at zero pace, conditions) in app/src/lib/precos-cadeira.ts
- [x] T005 Extend app/test/precos-cadeira.test.mjs: 3 models, distributor-adjusted rates, zero pace → `estimativa: null`, validity +15 days, and no internal text (`regra`, CFO/CFM, discount rule, faixa label) anywhere in the doc

**Checkpoint**: `node --import tsx test/precos-cadeira.test.mjs` passes.

## Phase 3: User Story 1 — Guardar a proposta e mandar o link (P1) 🎯 MVP

**Goal**: guardar no simulador → cartão em Propostas com link → página pública da ROI Labs.

**Independent Test**: quickstart step 3, first two bullets.

- [x] T006 [US1] Create app/src/app/admin/propostas/actions.ts with `guardarPropostaCadeira` (auth, validation, server-side `simular`, create, redirect) and `excluirPropostaCadeira`, per contracts/actions.md
- [x] T007 [US1] Add "Para quem" + "Guardar proposta" (`useActionState`, hidden raw fields, pending lock, inline error) and replace "Nada é salvo aqui" in app/src/app/admin/precos/simulador.tsx
- [x] T008 [P] [US1] Add optional `site` prop and `ROI_APP` constant to app/src/components/vertice/DocLink.tsx
- [x] T009 [US1] Create app/src/components/vertice/PropostaCadeiraCard.tsx (para quem, nicho, entrada, comissão/mês, 1º ano, validade/vencida, link, excluir)
- [x] T010 [US1] Read both sources in parallel, merge by date, keep each error visible, and update the copy in app/src/app/admin/propostas/page.tsx
- [x] T011 [US1] Run `design-review` for the public page (art-direction → conversion-copy → ux-writing → accessibility → responsive), then add the `/* ---- proposta pública ---- */` block in app/src/app/globals.css
- [x] T012 [US1] Create app/src/app/p/[slug]/page.tsx (slug regex, `notFound`, noindex, reads only `doc`, expired banner) and app/src/app/p/[slug]/not-found.tsx

**Checkpoint**: US1 end to end in production.

## Phase 4: User Story 2 — As duas propostas convivem (P2)

- [x] T013 [US2] Add the "Vértice" type chip and remove "Editar esta proposta" (plus the outdated comment about /admin/precos) in app/src/components/vertice/ProposalCard.tsx

## Phase 5: User Story 3 — Responder pelo WhatsApp (P3)

- [x] T014 [US3] End the public page with "Falar com a ROI Labs no WhatsApp" via `waLink('5562993265713', …)` citing nicho and para quem, in app/src/app/p/[slug]/page.tsx

## Phase 6: Polish

- [x] T015 `npm test` (whole suite) and a local `next build` check in a worktree outside OneDrive if the local build misbehaves
- [x] T016 Commit only this feature's paths (`git commit -- <paths>`: the tree has other writers), push `main`
- [x] T017 Production pass (quickstart step 3) with `ui-verification`: 3 widths, console, keyboard, WhatsApp link; delete the test proposals
- [x] T018 Write specs/019-proposta-cadeira/handoff.md; commit + push

## Dependencies

- T001 → T002 → T006. T004 → T005, T006, T012. T003 before T004 (same file).
- US1 (T006–T012) is the MVP. T013 and T014 are independent after T012.
- T008 is parallel to T006/T007.
