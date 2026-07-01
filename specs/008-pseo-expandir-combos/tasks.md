---
description: "Task list — Expandir a malha pSEO de porcelanato (combos validados por volume)"
---

# Tasks: Expandir a malha pSEO de porcelanato (combos validados por volume)

**Input**: Design documents from `/specs/008-pseo-expandir-combos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/data-and-gate.md, quickstart.md

**Tests**: TDD não solicitado. O gate de qualidade é o `check-matrix.mjs` existente (invariante de build) — não há suíte de testes nova.

**Organization**: por user story (US1/US2/US3 do spec.md).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente)
- Caminhos são relativos à raiz do repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: liberar o ambiente. **Gate env-first — nada de mineração antes disto.**

- [x] T001 Subir o OpenSEO (`cd open-seo && docker compose up -d`) e **confirmar** `curl http://localhost:3001` → 200 + créditos DataForSEO ok. ✅ **VERIFICADO 2026-07-01**: OpenSEO HTTP 200; chave DataForSEO válida (`mariazorzetti@siriuscrm.com.br`, saldo $0.89, limite 1000/dia). Mineração via **API DataForSEO direta** (OpenSEO não tem API REST) — ver research R1.
- [x] T002 [P] (DISPENSADO — check-matrix é dep-free; build real via Docker cobriu) `npm install` em `site-goiania/` (para rodar `check-matrix` e preview local). Ciente: build confiável é no Docker (OneDrive corrompe `node_modules` — Const. II).

**Checkpoint**: OpenSEO no ar + deps instaladas.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: produzir a **lista de combos qualificados** que alimenta US1 e US2. **⚠️ Bloqueia todas as user stories.**

- [x] T003 Montar a lista de combos candidatos por combinação do vocabulário validado de `site-goiania/src/data/porcelanato.ts` (tipos × ocasiões × dimensões × acabamentos × cores × intenção local). Salvar em arquivo de trabalho (scratchpad).
- [x] T004 Consultar no OpenSEO o volume de cada candidato; registrar `termo → volume`. (depende T001, T003)
- [x] T005 Filtrar `volume ≥ 200` e deduplicar contra os 31 `slug`/`termoAlvo` existentes → **lista final de combos qualificados** (~30-50 esperados; nº real = o que qualificar). (depende T004)

**Checkpoint**: lista de keywords validadas pronta — user stories podem começar.

---

## Phase 3: User Story 1 - Comprador acha a combinação específica (Priority: P1) 🎯 MVP

**Goal**: cada combo qualificado vira uma página dedicada que responde à busca exata e encaminha ao WhatsApp/lead.

**Independent Test**: escolher 5 combos qualificados, publicar suas páginas e confirmar que `/porcelanato/{slug}` responde à query (H1+intro+FAQ) e mostra CTA de conversão.

- [x] T006 [US1] Para cada combo qualificado, redigir a entrada `PorcelanatoPage` (slug único kebab-case; `titulo` com "Goiânia"; `intro` BLUF; `comoEscolher` 4-6 itens; `faq` 3-5 pares; `atributos` **reais**) em `site-goiania/src/data/porcelanato.ts`, no padrão das existentes. (depende T005)
- [x] T007 [US1] Curadoria de honestidade em cada entrada nova: nenhum atributo técnico inventado (`classeAd`/`antiderrapante`/`dimensao` só se real, senão omitir), nenhuma promessa de estoque/preço inexistente (Const. III/IV). (depende T006)
- [x] T008 [US1] Preencher `relacionados[]` cruzando páginas novas + existentes (silo interno, de preferência mão dupla) em `site-goiania/src/data/porcelanato.ts`. (depende T006)
- [x] T009 [US1] Preview local: buildar e abrir uma amostra de `/porcelanato/{novo-slug}` — H1 + intro + como escolher + FAQ + CTA renderizam. (verificação definitiva é no Docker/prod — T017)

**Checkpoint**: páginas novas existem e renderizam.

---

## Phase 4: User Story 2 - Cada página nasce validada por volume real (Priority: P1)

**Goal**: nenhuma página não-validada é publicada; o gate reflete a regra ≥ 200.

**Independent Test**: rodar `check-matrix` — passa; slugs únicos; entradas novas todas ≥ 200; só a página de 190 (grandfathered) no warning.

- [x] T010 [US2] Ajustar `site-goiania/src/scripts/check-matrix.mjs`: manter **erro fatal** em `volume ≤ 0`; adicionar **warning não-fatal** listando entradas com `volume < 200`.
- [x] T011 [US2] Rodar `node src/scripts/check-matrix.mjs` e confirmar: exit 0, slugs únicos, todas as entradas novas ≥ 200, warning apenas na página de volume 190 existente. (depende T006, T010)

**Checkpoint**: validação por volume garantida no gate.

---

## Phase 5: User Story 3 - Índices de IA e busca refletem a malha (Priority: P2)

**Goal**: sitemap e llms.txt incluem as páginas novas; llms.txt corrigido (sem "bairro") e gerado da fonte.

**Independent Test**: `GET /sitemap.xml` lista 31+novos; `GET /llms.txt` lista os novos e não menciona "bairro".

- [x] T012 [US3] Criar `site-goiania/src/pages/llms.txt.ts` gerando o `llms.txt` a partir de `pages` (hub + silo + slugs), com texto das dimensões reais (tipo × característica × ocasião × intenção local), **sem "bairro"** — paridade com `sitemap.xml.ts`. (depende T006)
- [x] T013 [US3] (N/A — site-goiania não tinha llms.txt manual) Remover `site-goiania/public/llms.txt` manual (se existir) para a rota assumir a fonte única. (depende T012)
- [x] T014 [P] [US3] Corrigir a linha "produto × característica × ocasião × **bairro**" no `site/public/llms.txt` (site institucional) → "intenção local". Arquivo distinto, paralelo.
- [x] T015 [US3] Verificação local: `GET /sitemap.xml` inclui os slugs novos; `GET /llms.txt` inclui os novos e sem "bairro". (depende T012, T006)

**Checkpoint**: índices refletem a malha ampliada.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 [P] Atualizar `site-goiania/src/data/README.md` (guia de autoria) com o piso ≥ 200 e a regra de honestidade de atributos.
- [x] T017 Deploy no EasyPanel (`site-goiania`) + **verificação REAL no navegador em prod** (quickstart §5): páginas novas sem JS, JSON-LD válido no Rich Results Test, sitemap, llms.txt, CTA WhatsApp e form 303 → lead. (Const. II — é a verificação que conta) ✅ Confirmado pelo Jean 2026-07-01.
- [x] T018 `handoff.md` co-localizado (feito / decisões / próximos / pendências / gotchas) + commit + push (Const. V).

---

## Dependencies & Execution Order

- **T001 (env gate)** bloqueia tudo. Sem OpenSEO no ar, nada roda.
- **Foundational (T003→T004→T005)** bloqueia US1/US2/US3 (produz a lista de keywords).
- **US1 (T006-T009)**: núcleo; T007/T008 dependem de T006.
- **US2 (T010-T011)**: T010 independe; T011 depende de T006 + T010.
- **US3 (T012-T015)**: T012/T013/T015 dependem de T006 existir; T014 é independente [P].
- **Polish**: T017 depois de US1-US3; T018 por último.

### Parallel Opportunities
- T002 [P] (install) em paralelo com T001 wrap-up.
- T014 [P] (llms.txt do site institucional) — arquivo diferente, a qualquer momento.
- T016 [P] (README) — arquivo diferente.
- T006 escreve um só arquivo (`porcelanato.ts`) → **não** paralelizar por conflito de arquivo; se lotear, serializar os lotes.

---

## Implementation Strategy

### MVP (entrega mínima com valor)
1. Phase 1 (Setup / gate OpenSEO) → Phase 2 (lista de keywords) → **US1 (páginas) + US2 (gate)**.
2. **PARAR e VALIDAR**: `check-matrix` verde + amostra de páginas renderizando.
3. Deploy + verificação em prod. Já entrega tráfego novo.

### Incremental
- US3 (sitemap/llms.txt) logo após — barato, fecha o loop GEO/AEO.
- Polish (README + handoff) ao fim.

---

## Notes
- Verificação "pronto" = Docker/navegador em prod (Const. II), não build local.
- Commitar após cada grupo lógico; `handoff.md` + push ao fechar (Const. V).
- Gate absoluto: OpenSEO no ar antes de minerar; volume nunca chutado (Const. III).
- × bairro permanece FORA (D8 / FR-005).
