---

description: "Task list template for feature implementation"
---

# Tasks: Cobrança recorrente de assinatura

**Input**: Design documents from `/specs/014-cobranca-recorrente/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídas — o plan.md e o quickstart.md as pedem explicitamente como gate de
verificação (Constituição II: "nenhuma task fecha com build passou"). Três arquivos:
`assinatura-dedupe.test.mjs`, `assinatura-maquina-estado.test.mjs`,
`assinatura-cancel-token.test.mjs`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e
teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1/US2/US3/US4, mapeando para spec.md
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Monorepo por app (Constituição): tudo em `app/` (Next 16 App Router) + 1 arquivo novo em
`.github/workflows/`. `site-goiania` (Astro estático) não é tocado nesta feature.

---

## Phase 1: Setup

Nenhuma tarefa de setup — zero dependência nova (research.md D1), projeto já inicializado.
Ver "O que este plano deliberadamente NÃO faz" no plan.md.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema, funções de gateway e helper de data — usados por TODAS as user stories.

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase estar completa.

- [X] T001 Adicionar `model Assinatura` e `model CicloCobranca` em `app/prisma/schema.prisma`
      conforme data-model.md (campos, `@@map`, `@@index([estado])` em Assinatura,
      `@@index([assinaturaId])` em CicloCobranca, relação 1:N); atualizar o comentário de
      `ItemPedido.assinaturaEstado` (linha ~105) de `ativa | cancelada` para
      `ativa | inadimplente | cancelada`
- [ ] T002 Rodar `prisma db push` manual (Constituição — Restrições Técnicas) contra o Postgres
      de produção do `app` e confirmar `assinaturas`/`ciclos_cobranca` criadas
      (`\d assinaturas`, `\d ciclos_cobranca`)
- [X] T003 [P] Criar helper `dataProximoCiclo(recorrencia: string, de?: Date): Date` em
      `app/src/lib/mercadopago.ts` (ou novo `app/src/lib/assinaturas.ts` se preferir isolar do
      arquivo de gateway) — `mensal` soma 1 mês, `anual` soma 12 meses a partir de `de`
      (default `now()`); usado pelo webhook em US1 e US2
- [X] T004 [P] Implementar `createPreapproval(input): Promise<{ id: string; initPoint: string }>`
      em `app/src/lib/mercadopago.ts`, mesmo padrão fetch de `createPreference` (linha 33):
      `POST /preapproval` com `external_reference`, `reason`, `payer_email`,
      `auto_recurring: { frequency, frequency_type: 'months', transaction_amount, currency_id }`,
      `back_url`, `notification_url` (contracts/checkout-assinatura.md)
- [X] T005 [P] Implementar `cancelPreapproval(preapprovalId: string): Promise<void>` em
      `app/src/lib/mercadopago.ts` — `PUT /preapproval/{id}` com `{ status: 'cancelled' }`,
      mesmo client HTTP/token de `createPreference`/`getPayment`

**Checkpoint**: schema no banco + funções de gateway prontas — user stories podem começar.

---

## Phase 3: User Story 1 - Cobrança automática dos ciclos seguintes (Priority: P1) 🎯 MVP

**Goal**: assinar gera autorização recorrente (não cobrança única); o 1º ciclo pago cria a
`Assinatura`; ciclos seguintes aprovados pelo MP são registrados sem ação do comprador.

**Independent Test**: assinar um plano de teste em sandbox, autorizar, e confirmar no Postgres
que `assinaturas`/`ciclos_cobranca` foram gravadas sem nenhuma ação manual além da autorização
inicial (quickstart.md passos 1-2).

### Tests for User Story 1

- [X] T006 [P] [US1] Escrever `app/test/assinatura-dedupe.test.mjs` — mesmo `mpPaymentId`
      processado 2x no ramo de renovação não cria 2 `CicloCobranca` (FR-006); deve falhar antes
      da implementação do webhook em T010

### Implementation for User Story 1

- [X] T007 [US1] Em `app/src/app/api/pedidos/route.ts`: tornar `email` obrigatório no form quando
      `loja.unidade === 'assinatura'` (regra fixa, sem campo novo em `LojaConfig` — YAGNI,
      contracts/checkout-assinatura.md)
- [X] T008 [US1] Em `app/src/app/api/pedidos/route.ts`: branch
      `SE loja.unidade === 'assinatura'` chama `createPreapproval` (T004) em vez de
      `createPreference` depois de `prisma.pedido.create`; grava
      `itensPedido.update({ assinaturaRef: preapprovalId })`; redirect 303 para `initPoint`;
      em erro, mesmo fallback `backTo(origin, 'pagamento', cadeiraId)` de hoje
      (contracts/checkout-assinatura.md)
- [X] T009 [US1] Em `app/src/app/api/pagamentos/webhook/route.ts`: ampliar o filtro de tipo
      (linha 40) de `bodyType !== 'payment'` para aceitar também
      `'subscription_authorized_payment'` (research.md — risco do nome do evento)
- [X] T010 [US1] Em `app/src/app/api/pagamentos/webhook/route.ts`: dentro da transação que já
      marca `pedido.statusPagamento = 'pago'` (linha ~85), SE algum item tem
      `unidade === 'assinatura'`: criar `Assinatura` (estado `ativa`, `proximaCobranca` via T003,
      `cancelToken: crypto.randomBytes(24).toString('hex')`) e `CicloCobranca` (`resultado:
      'sucesso'`, `mpPaymentId`) — contracts/webhook-assinatura.md, "Caminho do 1º ciclo"
- [X] T011 [US1] Em `app/src/app/api/pagamentos/webhook/route.ts`: novo ramo
      `SENÃO SE pedido.statusPagamento === 'pago' E existe Assinatura`: idempotência por
      `mpPaymentId` (se já existe `CicloCobranca`, `return ok`); SE `payment.status ===
      'approved'`, criar `CicloCobranca(resultado: 'sucesso')`, recalcular `proximaCobranca`
      (T003), espelhar em `ItemPedido.assinaturaEstado` — só o caminho de sucesso nesta story
      (contracts/webhook-assinatura.md, "Caminho de RENOVAÇÃO")
- [X] T012 [US1] Rodar `assinatura-dedupe.test.mjs` (T006) e confirmar verde

**Checkpoint**: US1 funcional e testável de forma independente (quickstart.md passos 1-2).

---

## Phase 4: User Story 2 - Falha de cobrança não cancela a assinatura sozinha (Priority: P1)

**Goal**: cobrança de renovação que falha vira `inadimplente` (não `cancelada`), avisa o
comprador, tenta de novo; só o cron cancela depois de esgotar a janela.

**Independent Test**: forçar falha de uma cobrança de renovação em sandbox e conferir que a
assinatura fica `inadimplente` (não `cancelada`), o e-mail sai, e o cron só cancela depois da
janela esgotada (quickstart.md passos 3-5).

### Tests for User Story 2

- [X] T013 [P] [US2] Escrever `app/test/assinatura-maquina-estado.test.mjs` — cobre as
      transições de data-model.md: `ativa→inadimplente` (1ª falha), `inadimplente→inadimplente`
      (falha seguinte não reseta `janelaFalhaDesde`), `inadimplente→ativa` (sucesso),
      `inadimplente→cancelada` (cron após janela esgotada, `cancelPreapproval` chamado ANTES do
      update); deve falhar antes de T014/T016

### Implementation for User Story 2

- [X] T014 [US2] Em `app/src/app/api/pagamentos/webhook/route.ts`: completar o ramo de renovação
      (T011) com o caminho de falha — `payment.status` não-approved cria
      `CicloCobranca(resultado: 'falha', motivo: payment.status)`; SE `assinatura.estado ===
      'ativa'`, seta `inadimplente` + `janelaFalhaDesde = now()`; SE já `inadimplente`, só grava
      o ciclo (janela não reseta); espelha `ItemPedido.assinaturaEstado`
      (contracts/webhook-assinatura.md)
- [X] T015 [US2] Disparar e-mail de aviso de falha (FR-004) em `app/src/lib/email.ts` (nova
      função ou reaproveitar `sendAlert`/padrão existente), chamado do ramo de falha em T014,
      incluindo o link `/assinatura/cancelar?token=<cancelToken>`
- [X] T016 [US2] Criar `app/src/app/api/cron/assinaturas/route.ts` — mesmo padrão de
      `app/src/app/api/cron/digest/route.ts` (header `X-Cron-Secret` vs `CRON_SECRET`,
      `dynamic = 'force-dynamic'`); busca `estado: 'inadimplente'`, `janelaFalhaDesde` além da
      janela configurada (constante `JANELA_DIAS`); para cada uma: chama `cancelPreapproval`
      (T005) e só em caso de sucesso grava `estado: 'cancelada'`, `proximaCobranca: null`,
      `canceladaEm: now()` (ordem importa — data-model.md, FR-009)
- [X] T017 [US2] Criar `.github/workflows/cobranca-assinaturas.yml` — mesmo padrão de
      `.github/workflows/rank-tracking.yml` mas agendado 1×/dia, chamando
      `POST /api/cron/assinaturas` com o secret do GitHub Actions
- [X] T018 [US2] Rodar `assinatura-maquina-estado.test.mjs` (T013) e confirmar verde

**Checkpoint**: US1 + US2 funcionais — o caminho automático completo (cobrar, falhar, reagendar,
cancelar por esgotamento) está de pé.

---

## Phase 5: User Story 3 - Cancelamento pelo próprio comprador (Priority: P2)

**Goal**: comprador cancela sozinho via link com token opaco; próxima cobrança para; acesso ao
ciclo já pago continua até o fim do período.

**Independent Test**: usar o link de cancelamento como comprador sem envolver o time, e conferir
que `proximaCobranca` vira `null` e `estado` vira `cancelada` (quickstart.md passo 6).

### Tests for User Story 3

- [X] T019 [P] [US3] Escrever `app/test/assinatura-cancel-token.test.mjs` — token válido cancela
      só a própria assinatura (FR-011); token inválido/trocado por 1 caractere retorna 404 sem
      alterar nenhuma linha; cancelar assinatura já `cancelada` é idempotente (200); deve falhar
      antes de T020

### Implementation for User Story 3

- [X] T020 [US3] Criar função compartilhada `cancelarAssinatura(assinatura)` (em
      `app/src/lib/mercadopago.ts` ou novo `app/src/lib/assinaturas.ts` de T003) — chama
      `cancelPreapproval` (T005) primeiro, só então `update Assinatura { estado: 'cancelada',
      proximaCobranca: null, canceladaEm: now() }` + `update ItemPedido { assinaturaEstado:
      'cancelada' }` (mesma ordem de US2, data-model.md)
- [X] T021 [US3] Criar `app/src/app/api/assinaturas/cancelar/route.ts` — `POST` por `{ token }`:
      `findUnique(cancelToken)`, 404 se não achou (mesma resposta para token errado ou de outra
      pessoa — FR-011), 200 idempotente se já `cancelada`, senão chama `cancelarAssinatura` (T020)
      (contracts/cancelamento.md)
- [X] T022 [US3] Criar `app/src/app/assinatura/cancelar/page.tsx` — tela pública sem auth: lê
      `?token=`, mostra produto/valor/próxima cobrança, aviso explícito de "sem reembolso, acesso
      continua até o fim do ciclo" (US3 AC2), 1 botão que faz o POST de T021, confirmação sem
      opção de desfazer
- [X] T023 [US3] Rodar `assinatura-cancel-token.test.mjs` (T019) e confirmar verde

**Checkpoint**: US1 + US2 + US3 funcionais — autoatendimento de cancelamento completo.

---

## Phase 6: User Story 4 - Visibilidade do estado de cada assinatura (Priority: P3)

**Goal**: time interno vê estado, última e próxima cobrança de qualquer assinatura num único
lugar, e pode cancelar pela mesma função que o self-service usa.

**Independent Test**: consultar uma assinatura qualquer em `/admin/assinaturas` e obter estado,
última tentativa e próxima cobrança prevista sem cruzar tabelas manualmente.

### Implementation for User Story 4

- [X] T024 [US4] Estender `app/src/app/api/assinaturas/cancelar/route.ts` (T021) para aceitar
      cancelamento por `{ id }` atrás de `isAuthed()` (`app/src/lib/auth.ts`), reaproveitando
      `cancelarAssinatura` (T020) — contracts/cancelamento.md, "Cancelamento pelo time"
- [X] T025 [US4] Criar `app/src/app/admin/assinaturas/page.tsx` — lista todas as `Assinatura`
      com `estado`, `proximaCobranca`, e o `CicloCobranca` mais recente (data/resultado); ação de
      cancelar chamando T024 (FR-008)

**Checkpoint**: todas as user stories funcionais de forma independente.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T026 Rodar `node --import tsx test/*.test.mjs` completo no `/app` e confirmar as 3 suítes
      novas + as 19+ existentes verdes (regressão do checkout atual)
- [ ] T027 Executar quickstart.md ponta a ponta em sandbox MP real (não build local —
      Constituição II): passos 1-7, incluindo a confirmação do `bodyType` real do webhook
      (research.md, risco não resolvido) e ajuste do filtro em T009 se o nome vier diferente do
      previsto
- [X] T028 Remover a cadeira `teste-saas` de `lojas.ts` e as linhas de teste do Postgres
      (quickstart.md passo 7 — não sujar SC-001/SC-003 quando a 1ª cadeira real chegar)
- [ ] T029 Criar `handoff.md` em `specs/014-cobranca-recorrente/` documentando o resultado da
      verificação em sandbox (T027) e o nome confirmado do evento webhook; commit + push

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: sem dependências — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: depende só de Foundational
- **US2 (Phase 4)**: depende de Foundational; o ramo de renovação que estende (T014) é o mesmo
  bloco de código que T011 (US1) cria — na prática, US2 só pode ser implementada depois de US1
  tocar `webhook/route.ts`, mesmo sendo testável de forma independente depois disso
- **US3 (Phase 5)**: depende de Foundational (schema com `cancelToken`, `cancelPreapproval`);
  independente de US1/US2 no código, mas só faz sentido testar ponta a ponta com uma assinatura
  já criada por US1
- **US4 (Phase 6)**: depende de Foundational e de T020/T021 (US3) para o cancelamento admin;
  a leitura (T025) só depende do schema
- **Polish (Phase 7)**: depende de todas as stories desejadas estarem completas

### Parallel Opportunities

- T003, T004, T005 (Phase 2) — arquivos/funções independentes dentro de `mercadopago.ts`, sem
  dependência entre si
- T006 (teste US1) pode ser escrito em paralelo a T007/T008
- T013 (teste US2) pode ser escrito em paralelo a T014/T015/T016/T017
- T019 (teste US3) pode ser escrito em paralelo a T020/T021/T022

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Phase 2: Foundational (schema + `db push` + funções de gateway)
2. Completar Phase 3: US1 — cobrança automática do 2º ciclo em diante
3. **PARAR e VALIDAR**: quickstart.md passos 1-2 em sandbox
4. US1 sozinha não fecha a feature (uma assinatura sem tratamento de falha nem cancelamento não
   é o produto pedido pela spec), mas é o menor incremento que prova a decisão de arquitetura
   (D1 — Preapproval) funciona de ponta a ponta

### Incremental Delivery

1. Foundational → US1 (cobra automaticamente) → US2 (não perde assinante por falha recuperável,
   completa o par P1+P1 que a spec considera indissociável) → US3 (autoatendimento) → US4
   (visibilidade do time) → Polish
2. Cada story soma valor sem quebrar a anterior; US2 e US1 tocam o mesmo arquivo
   (`webhook/route.ts`) em sequência, não em paralelo, para evitar conflito de merge

---

## Notes

- Nenhuma dependência nova (research.md D1) — todas as tasks reaproveitam `mercadopago.ts`,
  `email.ts`, `auth.ts`, o padrão de cron HTTP + GitHub Actions
- Zero prova com cartão real (plan.md, Constraints) — toda verificação é sandbox MP + leitura de
  Postgres + teste unitário
- `site-goiania` (Astro) não é tocado — todas as tasks vivem em `app/` ou `.github/workflows/`
