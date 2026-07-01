---
description: "Task list for Cupons no admin"
---

# Tasks: Cupons no admin

**Input**: Design documents from `specs/006-cupons-admin/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/admin-cupons.md](./contracts/admin-cupons.md), [contracts/cupom-validar.md](./contracts/cupom-validar.md)

**Tests**: Só a lógica pura de dinheiro (`avaliarCupom`) recebe teste runnable (`tsx`) — Const. II/III. Rotas/tela/CORS/checkout verificados em ambiente real (quickstart).

**Organization**: Tarefas agrupadas por user story. Raiz de código: `ROI Labs/app/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: US1 = Gestão sem deploy · US2 = Continuidade da validação · US3 = Validação de inputs

---

## Phase 1: Setup

**Purpose**: Sem setup dedicado — a feature roda sobre a app Next/Prisma existente. (Estrutura e padrões já estabelecidos por `centros-de-custo`.)

_(sem tarefas)_

---

## Phase 2: Foundational (pré-requisito bloqueante)

**Purpose**: O modelo `Cupom` é fonte de verdade para TODAS as stories (CRUD escreve; validação lê). Bloqueia US1, US2 e US3.

- [X] T001 Adicionar `model Cupom` em `ROI Labs/app/prisma/schema.prisma` (`@@map("cupons")`) conforme [data-model.md](./data-model.md) — `codigo @unique` (upper), `tipo`, `valor Decimal(10,2)`, `validadeInicio/Fim DateTime? @db.Date`, `minimo Decimal?(10,2)`, `ativo Boolean @default(true)`, `created_at/updated_at` — e rodar `prisma generate`.

**Checkpoint**: `prisma.cupom` disponível no client tipado.

---

## Phase 3: User Story 1 — Operador gerencia cupons sem deploy (Priority: P1) 🎯 MVP (com US2)

**Goal**: CRUD de cupons no admin — criar, editar, ativar/desativar, apagar — sem deploy.

**Independent Test**: Logar no admin, criar `OBRA15` (15%, mínimo R$ 800), vê-lo na lista; editar o percentual; desativar; apagar. (A validação no site/checkout é exercida junto com US2.)

- [X] T002 [US1] Criar `ROI Labs/app/src/app/api/cupons/route.ts` — `GET` (lista todos, `isAuthed`) + `POST` (criar, `isAuthed`, normaliza `codigo`→upper+trim), respostas JSON `{ ok }` no padrão de `api/centros-custo/parametros/route.ts`. (Validação completa dos campos entra no US3/T012.)
- [X] T003 [P] [US1] Criar `ROI Labs/app/src/app/api/cupons/[id]/route.ts` — `PATCH` (editar) + `DELETE` (apagar, `deleteMany` idempotente), `isAuthed`, `params: Promise<{ id }>` + `await params`. Conforme [contracts/admin-cupons.md](./contracts/admin-cupons.md).
- [X] T004 [US1] Criar `ROI Labs/app/src/app/admin/cupons/page.tsx` (server component `force-dynamic`): listar `prisma.cupom.findMany` numa tabela do design system LIGHT (código, tipo, valor, validade, mínimo, ativo).
- [X] T005 [US1] Criar `ROI Labs/app/src/app/admin/cupons/cupons-form.tsx` (client): criar/editar/ativar/apagar chamando as rotas, `router.refresh()` após cada mutação (padrão `lead-card`/`parametros-form`), `confirm()` no apagar.
- [X] T006 [US1] Atualizar `ROI Labs/app/src/app/admin/nav.tsx` — adicionar link "Cupons" → `/admin/cupons`.

**Checkpoint**: Tela de cupons funcional (lista + criar/editar/ativar/apagar).

---

## Phase 4: User Story 2 — Validação continua funcionando nos 2 call sites (Priority: P1)

**Goal**: `validarCupom` passa a ler do DB sem quebrar exibição (site/CORS) nem checkout; `OBRA10` preservado.

**Independent Test**: Com um cupom válido no banco, exercitar `/api/cupom/validar` (site) e criar um pedido com cupom; conferir que o pedido grava `cupomCodigo`/`desconto` corretos e que batem com a regra.

- [X] T007 [US2] Refatorar `ROI Labs/app/src/lib/cupons.ts`: extrair função **pura** `avaliarCupom(c: CupomAvaliavel | null, subtotalProduto)` mantendo EXATAMENTE as regras atuais (inválido/inativo/expirado/mínimo; `desconto = round2(min(max(0,bruto),subtotal))`); tornar `validarCupom(codigo, subtotalProduto)` **async** buscando `prisma.cupom.findUnique({ where:{ codigo: upper } })`, normalizando datas p/ epoch e delegando a `avaliarCupom`. Preservar `ResultadoCupom`/`Motivo` (contrato externo inalterado). Remover o `CUPONS` hard-coded.
- [X] T008 [P] [US2] Criar `ROI Labs/app/test/cupons.test.mjs` (`node --import tsx`) cobrindo `avaliarCupom`: percentual/fixo, ativo×inativo, janelas de validade (início/fim), mínimo não atingido, clamp do desconto em `[0, subtotal]`. Adicionar ao script `test` do `package.json`.
- [X] T009 [US2] Ajustar `ROI Labs/app/src/app/api/cupom/validar/route.ts` para `await validarCupom(...)`; contrato de resposta e CORS **inalterados** ([contracts/cupom-validar.md](./contracts/cupom-validar.md)).
- [X] T010 [US2] Ajustar `ROI Labs/app/src/app/api/pedidos/route.ts` para `await validarCupom(...)`; adicionar guard: cupom que zeraria o produto (`desconto == subtotal`) é tratado como inválido no checkout (cobra sem desconto + `avisoCupom`, reusando o caminho existente — sem linha de preço 0 no Mercado Pago; marcar `ponytail:` com o teto). Snapshot `cupomCodigo/desconto` intacto.
- [X] T011 [US2] Adicionar seed idempotente de `OBRA10` (percentual 10, mínimo 500, ativo) em `ROI Labs/app/prisma/seed.ts` (padrão `findFirst`+`create`/`update`) — continuidade FR-010.

**Checkpoint**: Ambos os pontos de validação funcionam lendo do DB; `OBRA10` preservado.

---

## Phase 5: User Story 3 — Operador impedido de cadastrar cupons inválidos (Priority: P2)

**Goal**: Salvamento recusa dados incoerentes com mensagem específica (integridade dos dados de desconto).

**Independent Test**: Tentar salvar código duplicado, percentual 120, valor -10, data-início > data-fim → cada um recusado com mensagem própria; nenhum cupom inválido persiste.

- [X] T012 [US3] Adicionar validação server-side ao `POST` de `api/cupons/route.ts` e ao `PATCH` de `api/cupons/[id]/route.ts`: `codigo` não-vazio e único (`409`; no PATCH a unicidade ignora o próprio `id`); `tipo ∈ {percentual,fixo}`; `percentual ⇒ 0≤valor≤100`; `fixo ⇒ valor≥0`; `minimo≥0` se presente; `validadeInicio ≤ validadeFim` se ambas. Erros `400/409` com `{ ok:false, motivo }` específico (FR-012).
- [X] T013 [US3] Exibir o `motivo` de falha no `cupons-form.tsx` (mensagem específica ao usuário quando o salvamento é recusado).

**Checkpoint**: Nenhum cupom inválido é persistido; mensagens claras.

---

## Phase 6: Polish & verificação

- [X] T014 Aplicar a migração no host: `prisma db push` MANUAL de máquina que alcança o Postgres (o runner standalone NÃO aplica schema) + rodar `db:seed` para criar `cupons` e semear `OBRA10` (Const. II — ambiente real).
- [ ] T015 Verificação em ambiente real por [quickstart.md](./quickstart.md) (navegador prod / Docker EasyPanel): criar cupom no admin **sem deploy** → validar no site (CORS) e no checkout; `OBRA10` sem interrupção; apagar cupom usado num pedido → pedido mantém `cupomCodigo/desconto`; inputs inválidos recusados. Anexar evidência.
- [ ] T016 Escrever `specs/006-cupons-admin/handoff.md` (feito/decisões/próximos/pendências/gotchas) + commit & push (Const. V).

---

## Dependencies

- **Foundational (T001)** antes de tudo.
- **US1 (T002–T006)**: após T001. T002 e T003 [P] (arquivos de rota distintos); T004/T005/T006 arquivos distintos.
- **US2 (T007–T011)**: T007 após T001; T008/T009/T010 após T007; T011 após T001. Independente de US1 (arquivos distintos).
- **US3 (T012–T013)**: T012 refina as rotas de US1 (após T002/T003); T013 refina o form de US1 (após T005).
- **Polish (T014–T016)**: T014 após T001+T011; T015 após todas; T016 por último.

## Parallel opportunities

- T003 [P] (rota `[id]`) em paralelo com T002 (rota coleção).
- T008 [P] (teste de `avaliarCupom`) em paralelo com T009/T010 depois de T007.

## Implementation strategy

- **MVP** = Foundational (T001) + **US1 + US2** juntas: os dois P1 são acoplados — criar cupom sem deploy só tem valor demonstrável quando a validação lê do DB. Entregam o objetivo da feature.
- **Incremento 2** = US3 (endurecimento da validação de inputs).
- Fechar com T014 (migração real) + T015 (verificação real) + T016 (handoff/push). Cada incremento é commitável isolado.
