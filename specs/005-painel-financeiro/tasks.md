---
description: "Task list for Painel Administrativo e Financeiro"
---

# Tasks: Painel Administrativo e Financeiro

**Input**: Design documents from `specs/005-painel-financeiro/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/financeiro-csv.md](./contracts/financeiro-csv.md)

**Tests**: Apenas a lógica pura nova (`lib/financeiro.ts`) recebe teste runnable (`tsx`) — Constituição II/III. UI é verificada em ambiente real (quickstart).

**Organization**: Tarefas agrupadas por user story. Raiz de código: `ROI Labs/app/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- **[Story]**: US1 = Painel · US2 = Financeiro · US3 = Export CSV

---

## Phase 1: Setup (estrutura compartilhada)

**Purpose**: Liberar `/admin` para virar a home do Painel sem quebrar Candidaturas.

- [ ] T001 Mover Candidaturas: criar `ROI Labs/app/src/app/admin/candidaturas/page.tsx` com o conteúdo atual de `ROI Labs/app/src/app/admin/page.tsx`, ajustando o import de `./lead-card` para `../lead-card` (a app continua renderizando candidaturas em `/admin` até o US1 substituir).
- [ ] T002 Atualizar `ROI Labs/app/src/app/admin/nav.tsx`: relinkar "Candidaturas" para `/admin/candidaturas` e adicionar "Painel" → `/admin` como primeiro item. (O link "Financeiro" entra no US2.)

**Checkpoint**: `/admin` e `/admin/candidaturas` renderizam candidaturas; nav coerente.

---

## Phase 2: Foundational (pré-requisitos bloqueantes)

**Purpose**: Nenhum bloqueio global — US1 roda sobre Prisma + design system já existentes; a lib compartilhada do Financeiro (`lib/financeiro.ts`) é criada no US2 (primeiro consumidor) e reusada pelo US3.

_(sem tarefas — formatação BRL/pt-BR fica inline em cada página, como nas telas atuais; sem helper especulativo — Constituição III)_

---

## Phase 3: User Story 1 — Painel inicial (Priority: P1) 🎯 MVP

**Goal**: `/admin` vira o cockpit que mostra o estado do negócio de relance, com cada cartão linkando para a lista de detalhe.

**Independent Test**: Abrir `/admin` autenticado; cada métrica bate com contagem manual no banco; cada cartão navega para a lista certa; janela sem dados mostra 0 sem erro.

- [ ] T003 [US1] Substituir `ROI Labs/app/src/app/admin/page.tsx` pelo Painel (server component `force-dynamic`): via Prisma — candidaturas/leads novos 24h e 7d e `groupBy(status)`; `aggregate` de GMV pago e `count` de pedidos do mês corrente (bucket por `createdAt`); `count` de pedidos `statusPagamento='pago'` E `statusFulfillment='aguardando'`; `groupBy(polo, open)` de cadeiras; conversão lead→pedido aproximada (pedidos pagos ÷ leads nos **últimos 7 dias**, rotulada "7d, aproximada"). Renderizar cartões com classes do design system (`.page/.cc-cards/.cc-card`), cada um envolto em `<Link>` para `/admin/candidaturas`, `/admin/leads`, `/admin/pedidos`, `/admin/cadeiras`. **Agrupar em seções (Captação · Demanda · Marketplace · Mês) com ênfase visual e mini-contexto por cartão — página rica, não números crus (Constituição IV).**
- [ ] T004 [P] [US1] Adicionar estilo do painel em `ROI Labs/app/src/app/globals.css`: grid de cartões agrupados por seção, com títulos de seção e ênfase AA (reusar `.cc-card*` existentes sempre que possível; sem inline escuro).

**Checkpoint**: Painel completo e navegável — MVP entregável.

---

## Phase 4: User Story 2 — Financeiro real por mês (Priority: P2)

**Goal**: Tela `/admin/financeiro` com resultado real por mês (GMV, líquido Interm. × WL, nº pedidos) a partir dos snapshots, reusando as fórmulas de centro de custo.

**Independent Test**: Com pedidos pagos em ≥2 meses, cada linha bate com cálculo manual; editar parâmetros vigentes NÃO altera meses passados; itens sem snapshot sinalizados.

- [ ] T005 [US2] Criar `ROI Labs/app/src/lib/financeiro.ts`: função pura `agregarPorMes(itensPagos, globalParams)` → `MesFinanceiro[]` (chave `YYYY-MM` por `createdAt`), reusando `resolverParametros`/`calcIntermediacao`/`calcWL`/`PARAMS` de `@/lib/centros-custo`; modalidade oficial = `modalidadeSnapshot ?? skuConfig.modalidadeAlvo ?? 'intermediacao'`; contar `semSnapshot`. (Também serve o US3.)
- [ ] T006 [P] [US2] Criar `ROI Labs/app/test/financeiro.test.mjs` (`node --import tsx`): asserts de agrupamento por mês, estabilidade de snapshot, fallback sem snapshot e soma por modalidade. Adicionar ao script `test` do `package.json`.
- [ ] T007 [US2] Criar `ROI Labs/app/src/app/admin/financeiro/page.tsx` (server component `force-dynamic`): carregar `itemPedido` pagos (com `pedido.createdAt` + snapshots) e parâmetros globais, chamar `agregarPorMes`, renderizar tabela com **todos os meses (mais recente primeiro, sem filtro de período na tela)** — GMV, líq Interm., líq WL, nº pedidos, flag de `semSnapshot` — com classes do design system.
- [ ] T008 [US2] Atualizar `ROI Labs/app/src/app/admin/nav.tsx`: adicionar "Financeiro" → `/admin/financeiro`.

**Checkpoint**: Financeiro por mês correto e estável a snapshot.

---

## Phase 5: User Story 3 — Export CSV (Priority: P3)

**Goal**: Baixar CSV (uma linha por pedido pago) que reconcilia com a tela.

**Independent Test**: Baixar CSV; abrir no Excel pt-BR (acentos, `;`, datas); somar `gmv`/`liquido` = totais da tela.

- [ ] T009 [US3] Criar `ROI Labs/app/src/app/api/financeiro/csv/route.ts` (`GET`, `isAuthed`): validar `de`/`ate` (`YYYY-MM`) → `400` se inválido; montar CSV uma-linha-por-pedido via `@/lib/financeiro`; responder `text/csv; charset=utf-8` com BOM, delimitador `;`, decimais com vírgula, datas `dd/MM/yyyy`, `Content-Disposition: attachment`. Conforme [contracts/financeiro-csv.md](./contracts/financeiro-csv.md).
- [ ] T010 [US3] Adicionar botão/link "baixar CSV" em `ROI Labs/app/src/app/admin/financeiro/page.tsx` apontando para `/api/financeiro/csv` sem params (exporta todos os pedidos pagos; `de`/`ate` ficam como uso manual via URL).

**Checkpoint**: Export funcional e reconciliado.

---

## Phase 6: Polish & verificação

- [ ] T011 [P] Conferir estado vazio (banco zerado em uma janela) → ambas as telas mostram 0 sem erro (FR-008).
- [ ] T012 Verificação em ambiente real por [quickstart.md](./quickstart.md) (navegador prod / Docker EasyPanel): métricas do painel vs contagem manual; estabilidade de snapshot no financeiro; reconciliação do CSV. Anexar evidência (Constituição II).
- [ ] T013 Escrever `specs/005-painel-financeiro/handoff.md` (feito/decisões/próximos/pendências/gotchas) + commit & push (Constituição V).

---

## Dependencies

- **Setup (T001–T002)** antes de tudo (libera `/admin` para o Painel).
- **US1 (T003–T004)** depende só do Setup → **MVP**. Independente de US2/US3.
- **US2 (T005–T008)**: T005 antes de T006/T007; T008 independente. Independente de US1 (arquivos distintos; nav é o único arquivo compartilhado, editado em T002 e T008).
- **US3 (T009–T010)**: T009 precisa de T005 (`lib/financeiro`); T010 precisa de T007 (página financeiro). → US3 após US2.
- **Polish (T011–T013)** após as stories alvo.

## Parallel opportunities

- T004 [P] (globals.css) em paralelo com a lógica de T003 (page.tsx) — arquivos diferentes.
- T006 [P] (test) em paralelo com T007 (page) depois de T005 pronto.
- T011 [P] (estado vazio) independente.

## Implementation strategy

- **MVP** = Phase 1 + Phase 3 (US1). Entrega o cockpit diário sozinho.
- **Incremento 2** = US2 (Financeiro). **Incremento 3** = US3 (CSV).
- Cada incremento é commitável e verificável isolado; fechar com T012 (real) + T013 (handoff/push).
