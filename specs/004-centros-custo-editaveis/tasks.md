---
description: "Task list â€” Centros de custo editÃ¡veis e auditÃ¡veis"
---

# Tasks: Centros de custo editÃ¡veis e auditÃ¡veis

**Input**: Design documents from `specs/004-centros-custo-editaveis/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD nÃ£o foi pedido. Em vez de suÃ­te, a lÃ³gica de dinheiro/resoluÃ§Ã£o deixa
**asserts runnable** em `app/test/centros-custo.test.mjs` (ponytail self-check, `node --import tsx` + `assert`, sem framework â€” estende o existente do commit `58085b4`).

**OrganizaÃ§Ã£o**: por user story, na ordem de prioridade (P1 â†’ P3). ConstruÃ­do sobre o
commit `58085b4` (lib `centros-custo.ts` + pÃ¡gina `/admin/centros-de-custo`). **FÃ³rmulas
`calcIntermediacao`/`calcWL` nÃ£o mudam** (FR-016) â€” sÃ³ a origem dos parÃ¢metros.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependÃªncia pendente).
- Arquivos compartilhados entre stories (`centros-custo.ts`, `page.tsx`, `parametros-form.tsx`, `sku-row.tsx`, `test/centros-custo.test.mjs`) sÃ£o editados em **trechos distintos** e ficam **sequenciais entre fases** (nÃ£o [P]).

---

## Phase 1: Setup

**Purpose**: confirmar o ponto de partida (entrega `58085b4` no ar) e o acesso ao DB.

- [X] T001 Confirmar que `/admin/centros-de-custo` estÃ¡ no ar em `app.roilabs.com.br` e que a mÃ¡quina alcanÃ§a `roilabs_db @ 2.24.207.200` (prÃ©-requisito do `prisma db push` manual); anotar os nÃºmeros-Ã¢ncora atuais como baseline de nÃ£o-regressÃ£o.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: schema persistido + resolvedor de parÃ¢metros de que **todas** as stories dependem.

**âš ï¸ CRITICAL**: concluir antes de qualquer user story.

- [X] T002 Estender `app/prisma/schema.prisma`: adicionar `ParametroCentroCusto` (`@@map("parametro_centro_custo")`, unique `[escopo, chave]`) e `SkuConfig` (`@@map("sku_config")`, `slug @unique`), e as 5 colunas snapshot **nullable** em `ItemPedido` (`piso_snapshot`, `modalidade_snapshot`, `comissao_snapshot`, `aliq_intermediacao_snapshot`, `aliq_wl_snapshot`) conforme `data-model.md`. Aplicar por `prisma db push` **MANUAL** de mÃ¡quina que alcanÃ§a o host (ConstituiÃ§Ã£o â€” nÃ£o usar runner standalone).
- [X] T003 Estender `app/prisma/seed.ts`: upsert **idempotente** do `global` (`escopo:'global', chave:null`) com os defaults dos docs (`markup 0.30, comissao 0.10, aliqIntermediacao 0.102, aliqWL 0.062, cenario 'base'`); rodar `npm run db:seed` (depende de T002).
- [X] T004 Estender `app/src/lib/centros-custo.ts`: `resolverParametros(slug, camadas)`, `resolverPiso(slug, varejo, camadas)` e `resolverModalidade(slug, camadas)` com precedÃªncia **campo a campo** `SKU > linha > global > PARAMS` (FR-004/FR-009/FR-016); `PARAMS` permanece como default; **`calcIntermediacao`/`calcWL` inalteradas**.
- [X] T005 Estender `app/test/centros-custo.test.mjs`: asserts de precedÃªncia `SKU > linha > global`, heranÃ§a de campo nulo e reproduÃ§Ã£o da Ã¢ncora 9.100/7.000 com defaults; rodar `npm test` verde (depende de T004).

**Checkpoint**: schema + resolvedor prontos â€” stories podem comeÃ§ar.

---

## Phase 3: User Story 1 - Editar parÃ¢metros globais sem deploy (Priority: P1) ðŸŽ¯ MVP

**Goal**: editar markup/comissÃ£o/alÃ­quotas do global pela UI, persistido, com validaÃ§Ã£o de faixa; catÃ¡logo recalcula na hora, sem deploy.

**Independent Test**: mudar markup 30%â†’25% e ver atacado/lÃ­quidos recalcularem; comissÃ£o 150% Ã© recusada sem alterar o vigente.

- [X] T006 [US1] Criar `app/src/app/api/centros-custo/parametros/route.ts` (GET lÃª global+linhas; PATCH upsert por `escopo`/`chave`) com auth via `getAuthFromRequest()` e **validaÃ§Ã£o de faixa** server-side (`markup â‰¥ 0`; `comissao`/`aliq* âˆˆ [0,1]`), conforme `contracts/parametros.md`.
- [X] T007 [P] [US1] Criar island `app/src/app/admin/centros-de-custo/parametros-form.tsx` (client): editar markup/comissÃ£o/alÃ­quotas do global, validar faixas no cliente (defesa em profundidade), salvar via PATCH e dar refresh; mensagem de recusa clara (FR-003).
- [X] T008 [US1] Estender `app/src/app/admin/centros-de-custo/page.tsx`: carregar os parÃ¢metros vigentes (via `resolverParametros`, fallback `PARAMS`) e recalcular a tabela do catÃ¡logo a partir deles; montar o `parametros-form` (depende de T006, T007).

**Checkpoint**: US1 funcional e testÃ¡vel sozinha â€” MVP (editar % sem deploy).

---

## Phase 4: User Story 2 - Piso (atacado) real por SKU (Priority: P1)

**Goal**: cadastrar piso real por SKU (override do markup), marcar real vs estimado, sinalizar prejuÃ­zo.

**Independent Test**: cadastrar piso R$95 num SKU de varejo R$129/mÂ² â†’ usa 95 e marca "real"; remover â†’ volta a "estimado" por markup.

- [X] T009 [US2] Criar `app/src/app/api/centros-custo/sku/[slug]/route.ts` (PATCH upsert de `sku_config`: `piso`/`modalidadeAlvo`/`linha`/overrides; `null` limpa campo) com auth, `params: Promise<{slug}>` + `await params`, validaÃ§Ã£o de faixa, `slug` deve existir em `precos.ts`, retorna `{ok, prejuizo}` conforme `contracts/sku-config.md`.
- [X] T010 [P] [US2] Criar island `app/src/app/admin/centros-de-custo/sku-row.tsx` (client): editar o **piso** por SKU, salvar via PATCH, exibir marca **real/estimado** e aviso de **prejuÃ­zo** (FR-007/FR-008).
- [X] T011 [US2] Estender `app/src/app/admin/centros-de-custo/page.tsx`: usar `resolverPiso` por SKU na tabela (real vs estimado), exibir a marca e o sinal de prejuÃ­zo; montar `sku-row` por linha (depende de T009, T010).

**Checkpoint**: US1 + US2 independentes â€” parÃ¢metros globais editÃ¡veis + piso real por SKU.

---

## Phase 5: User Story 3 - ParÃ¢metros por linha/categoria (Priority: P2)

**Goal**: definir parÃ¢metros por linha (ex.: "premium") e associar SKUs; precedÃªncia `SKU > linha > global`.

**Independent Test**: criar linha `premium` markup 50%, associar 3 SKUs â†’ sÃ³ esses usam 50%; override de SKU vence a linha.

- [X] T012 [US3] Estender `app/src/app/admin/centros-de-custo/parametros-form.tsx`: gestÃ£o de linhas (criar/editar markup/comissÃ£o/alÃ­quotas por linha) via PATCH `escopo='linha'` (depende de T006, T007).
- [X] T013 [US3] Estender `app/src/app/admin/centros-de-custo/sku-row.tsx`: seletor de **linha** por SKU (PATCH `linha`) (depende de T010).
- [X] T014 [US3] Estender `app/test/centros-custo.test.mjs`: assert de precedÃªncia concreta â€” override de SKU vence linha vence global, campo nulo herda (depende de T004).

**Checkpoint**: US1â€“US3 independentes.

---

## Phase 6: User Story 4 - Snapshot de parÃ¢metros no pedido pago (Priority: P2)

**Goal**: congelar os parÃ¢metros por item ao pagar; agregado histÃ³rico estÃ¡vel; editar parÃ¢metros nÃ£o reescreve o passado.

**Independent Test**: apurar com markup 30%, marcar um pedido pago, mudar markup p/ 20% â†’ catÃ¡logo reflete 20%, pedido pago mantÃ©m 30%.

- [X] T015 [US4] Estender `app/src/app/api/pagamentos/webhook/route.ts`: ao transicionar `status_pagamento â†’ 'pago'`, congelar por item (`piso_snapshot`, `modalidade_snapshot`, `comissao_snapshot`, `aliq_intermediacao_snapshot`, `aliq_wl_snapshot`) via `resolver*` vigente, na mesma transaÃ§Ã£o idempotente (`mp_payment_id`).
- [X] T016 [US4] Estender `app/src/app/admin/centros-de-custo/page.tsx`: agregado de pedidos pagos apura via `*Snapshot` de cada item; item sem snapshot usa vigentes e Ã© marcado "sem snapshot" (FR-011/FR-012) (depende de T015).
- [X] T017 [P] [US4] Estender `app/test/centros-custo.test.mjs`: assert de **estabilidade** â€” reapurar um item com snapshot nÃ£o muda ao alterar os parÃ¢metros vigentes (depende de T004).

**Checkpoint**: US1â€“US4 independentes â€” histÃ³rico auditÃ¡vel.

---

## Phase 7: User Story 6 - Modalidade-alvo por SKU e agregado por centro oficial (Priority: P2)

**Goal**: marcar premiumâ†’WL por SKU; agregado de pagos com duas leituras rotuladas (real por modalidade oficial + referÃªncia hipotÃ©tica).

**Independent Test**: marcar 1 SKU premium, 2 pedidos pagos â†’ leitura real soma o premium no Centro WL e o comum em IntermediaÃ§Ã£o; referÃªncia hipotÃ©tica continua somando todos nos dois cenÃ¡rios.

- [X] T018 [US6] Estender `app/src/app/admin/centros-de-custo/sku-row.tsx`: marcar **modalidade-alvo** (`wl`|`intermediacao`) por SKU (PATCH `modalidadeAlvo`); sem marca = IntermediaÃ§Ã£o (depende de T010).
- [X] T019 [US6] Estender `app/src/app/admin/centros-de-custo/page.tsx`: exibir **duas leituras rotuladas** do agregado de pagos â€” (a) **real por modalidade oficial** (cada item no centro da sua `modalidade_snapshot`/`resolverModalidade`; sem marca â†’ IntermediaÃ§Ã£o) e (b) **referÃªncia hipotÃ©tica** (tudo IntermediaÃ§Ã£o vs tudo WL) (depende de T016, T018).
- [X] T020 [P] [US6] Estender `app/test/centros-custo.test.mjs`: assert de que SKU sem modalidade cai em IntermediaÃ§Ã£o e de que a soma da leitura real bate item a item (SC-007) (depende de T004).

**Checkpoint**: US1â€“US4 + US6 independentes.

---

## Phase 8: User Story 5 - CenÃ¡rio tributÃ¡rio selecionÃ¡vel (Priority: P3)

**Goal**: presets Conservador/Base/Otimista preenchem as alÃ­quotas; ajuste manual prevalece.

**Independent Test**: aplicar "Conservador" â†’ alÃ­quotas viram 6,0%/4,6%; ajustar uma Ã  mÃ£o â†’ prevalece e cenÃ¡rio marca "ajustado".

- [X] T021 [P] [US5] Adicionar o mapa `CENARIOS` (conservador/base/otimista â†’ alÃ­quotas) em `app/src/lib/centros-custo.ts` com os valores de `projecao-financeira` (ver `contracts/parametros.md`).
- [X] T022 [US5] Estender `app/src/app/admin/centros-de-custo/parametros-form.tsx`: botÃµes de preset que preenchem as alÃ­quotas do global; editar uma alÃ­quota Ã  mÃ£o faz `cenario='ajustado'` prevalecer (FR-013) (depende de T021, T007).

**Checkpoint**: US1â€“US6 completas.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T023 Rodar `npm test` (no `app/`) â€” todos os asserts verdes (precedÃªncia, Ã¢ncora, snapshot estÃ¡vel, modalidade default).
- [X] T024 VerificaÃ§Ã£o em ambiente real conforme `quickstart.md` (Docker/EasyPanel + navegador em prod): `db push` + seed no host, editar global/piso/linha/modalidade/cenÃ¡rio e ver recalcular sem deploy, marcar pedido pago e confirmar snapshot estÃ¡vel.
- [X] T025 [P] Escrever `specs/004-centros-custo-editaveis/handoff.md` (feito/decisÃµes/prÃ³ximos/pendÃªncias/gotchas) + commit & push (ConstituiÃ§Ã£o V).

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (P1)** â†’ sem dependÃªncias.
- **Foundational (P2)** â†’ depende do Setup; **bloqueia todas as stories** (schema + resolvedor).
- **US1 (P3 fase)** â†’ MVP; cria a rota de parÃ¢metros + form do global que US3/US5 estendem.
- **US2** â†’ cria a rota de SKU + `sku-row` que US3/US6 estendem.
- **US3, US4, US6 (P2)** â†’ apÃ³s Foundational + as rotas/islands de US1/US2; cada uma Ã© **demoÃ¡vel independente**.
- **US5 (P3)** â†’ apÃ³s US1 (estende o `parametros-form`).
- **Polish (P9)** â†’ apÃ³s as stories desejadas.

### Within Each User Story
- Arquivos compartilhados em ordem: `centros-custo.ts` (T004 â†’ T021), `page.tsx` (T008 â†’ T011 â†’ T016 â†’ T019), `parametros-form.tsx` (T007 â†’ T012 â†’ T022), `sku-row.tsx` (T010 â†’ T013 â†’ T018), `test/centros-custo.test.mjs` (T005 â†’ T014 â†’ T017 â†’ T020) sÃ£o **sequenciais**.
- Rota antes da UI que a consome (T006 antes de T008; T009 antes de T011).

### Parallel Opportunities
- **[P] entre arquivos distintos**: T007 (`parametros-form`) â€– T006 (route); T010 (`sku-row`) â€– T009 (route); T021 (`CENARIOS` em `centros-custo.ts`) â€– islands; os asserts (T017/T020) sÃ£o [P] vs tasks de implementaÃ§Ã£o de outros arquivos, mas **sequenciais entre si** (mesmo `test/`).
- Com 1 squad (modelo do dono), execuÃ§Ã£o Ã© majoritariamente **sequencial** Foundational â†’ P1 â†’ P2 â†’ P3; os [P] indicam onde nÃ£o hÃ¡ conflito de arquivo se houver banca extra.

---

## Implementation Strategy

### MVP (US1)
1. Setup (T001) + Foundational (T002â€“T005).
2. US1 (T006â€“T008) â†’ **validar isolado** (editar markup global, ver catÃ¡logo recalcular sem deploy) â†’ deploy/demo.

### Incremental
- + US2 (piso por SKU) â†’ demo Â· + US3 (linha) â†’ demo Â· + US4 (snapshot) â†’ demo Â· + US6 (modalidade + agregado) â†’ demo Â· + US5 (presets) â†’ demo.
- Cada story agrega valor sem quebrar as anteriores; rodar `npm test` a cada incremento que toca o resolvedor/fÃ³rmula.

### Fechamento (ConstituiÃ§Ã£o)
- VerificaÃ§Ã£o real (T024) com output anexado; `handoff.md` + commit/push (T025).

---

## Notes
- `[P]` = arquivos diferentes, sem dependÃªncia pendente.
- Invariante mantida: **fÃ³rmulas `calcIntermediacao`/`calcWL` intactas** (FR-016); a feature sÃ³ troca a origem dos parÃ¢metros (constante â†’ DB em camadas + snapshot).
- Schema por `prisma db push` **MANUAL** (ConstituiÃ§Ã£o); colunas snapshot sÃ£o **aditivas** (nullable) â€” nÃ£o tocam pedidos existentes.
- 1 task = 1 verde; commit apÃ³s cada task ou grupo lÃ³gico; parar em qualquer checkpoint p/ validar a story isolada.

