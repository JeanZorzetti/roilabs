---
description: "Task list — Melhorias do carrinho do e-commerce de porcelanato"
---

# Tasks: Melhorias do carrinho do e-commerce de porcelanato

**Input**: Design documents from `specs/003-carrinho-melhorias/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD não foi pedido. Em vez de suíte, cada story que tem lógica de dinheiro/conversão deixa **um assert runnable** em `site-goiania/src/scripts/check-cart-math.mjs` (ponytail self-check, `node` + `assert`, sem framework).

**Organização**: por user story (P1 → P3). Construído sobre a 002 (arquivos existentes), sem regredir pSEO/checkout.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem dependência pendente).
- Arquivos compartilhados entre stories (`cart.ts`, `carrinho.astro`, `api/pedidos/route.ts`) são editados em **funções/trechos distintos** e ficam **sequenciais entre fases** (não [P]).

---

## Phase 1: Setup

**Purpose**: baseline para medir regressão de pSEO.

- [ ] T001 Capturar snapshot de referência do `site-goiania/dist/` (build atual em prod) para o diff de regressão de pSEO (SC-006); confirmar que `/carrinho` e o checkout da 002 estão no ar.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: modelo de carrinho compartilhado de que US2/US5 dependem.

**⚠️ CRITICAL**: concluir antes de US2/US5.

- [x] T002 Estender `CartItem` em `site-goiania/src/lib/cart.ts` com `perda?: number` e `ambientes?: {largura:number;comprimento:number}[]` opcionais; manter `getCart()` retrocompatível (ignora campos desconhecidos, default de perda = `PERDA_DEFAULT`). Não envia esses campos como dinheiro ao servidor.

**Checkpoint**: base do carrinho pronta — stories podem começar.

---

## Phase 3: User Story 1 - Carrinho claro e editável que converte (Priority: P1) 🎯 MVP

**Goal**: editar quantidade (m²/caixas) na própria página, resumo transparente, mini-cart no header, estados vazio/erro/loading, CTA forte mobile-first.

**Independent Test**: com itens no carrinho, alterar m² inline e ver caixas/m²/subtotal/total atualizarem (mín. 1 caixa); remover último item → estado vazio; abrir mini-cart em outra página e ver a contagem correta.

- [x] T003 [US1] Adicionar helper `setM2(slug, m2)` em `site-goiania/src/lib/cart.ts` (converte via `m2ParaCaixas` usando `item.perda || PERDA_DEFAULT` e grava as caixas; reusa a invariante de caixas fechadas).
- [x] T004 [US1] Redesenhar `site-goiania/src/pages/carrinho.astro`: edição inline por **m²** e por **caixas** por item, resumo transparente (caixas × m² cobertos × preço, subtotal, total com suas linhas), CTA de finalizar evidente, layout mobile-first (depende de T003).
- [x] T005 [US1] Adicionar estados explícitos **vazio** (CTA p/ vitrine), **carregando** e **erro** (ação "tentar de novo") em `site-goiania/src/pages/carrinho.astro` (depende de T004).
- [x] T006 [P] [US1] Criar island drawer `site-goiania/src/components/MiniCart.astro` (lista resumida + badge de contagem; escuta o evento `roi-cart-change` já emitido por `cart.ts`).
- [x] T007 [US1] Montar o MiniCart + badge no `site-goiania/src/components/Header.astro` em todas as páginas, **como island `client:only`** — o widget é injetado client-side e **não entra no HTML pré-renderizado/indexável** das páginas de pSEO (depende de T006).
- [x] T008 [P] [US1] Assert runnable de `m²→caixas` (arredonda ↑, mín. 1) em `site-goiania/src/scripts/check-cart-math.mjs`.

**Checkpoint**: US1 funcional e testável sozinha — MVP.

---

## Phase 4: User Story 2 - Simulador de m² por ambiente (Priority: P2)

**Goal**: somar área por cômodo, folga ajustável clampada 5–20% (default 10%), converter em caixas fechadas (mín. 1); **coexiste** com a entrada direta de m².

**Independent Test**: informar 2 ambientes com medidas conhecidas + folga 10% → área somada, área com folga e caixas batem; mudar folga p/ 5% recalcula; 0%/90% clampam a 5%/20%.

- [x] T009 [P] [US2] Criar island `site-goiania/src/components/SimuladorM2.astro`: lista de ambientes (largura×comprimento), soma `Σ(l×c)`, input de folga **clampado a 5–20%** (default 10%), prévia de caixas via `m2ParaCaixas`.
- [x] T010 [US2] Adicionar `addFromSimulador(slug, ambientes, perda)` em `site-goiania/src/lib/cart.ts` (calcula caixas e persiste `ambientes`/`perda` opcionais no item p/ reabrir o simulador) (depende de T002).
- [x] T011 [US2] Estender `site-goiania/src/components/AddToCart.astro` p/ alternar entre "m² direto" (existente) e "calcular por ambiente" (SimuladorM2), sem substituir (depende de T009, T010).
- [x] T012 [P] [US2] Asserts de clamp de folga (0%/90% → 5%/20%) e área→caixas em `site-goiania/src/scripts/check-cart-math.mjs`.

**Checkpoint**: US1 + US2 funcionam independentes.

---

## Phase 5: User Story 3 - Frete e prazo por CEP dentro do carrinho (Priority: P2)

**Goal**: mostrar frete + prazo da faixa no próprio carrinho (antes do checkout), retirada grátis, "a combinar" fora de faixa.

**Independent Test**: CEP coberto → frete + prazo somados ao total no carrinho; "retirada" → frete R$ 0; CEP fora de faixa → "a combinar" com total só do produto.

- [x] T013 [P] [US3] Estender `app/src/lib/frete.ts`: adicionar `prazo` a cada `Faixa` (valores reais por faixa = knob da operação) e `getFaixa(cep) => {valor,prazo,regiao}|null`; manter `calcFrete` como wrapper (não quebra `/api/pedidos`).
- [x] T014 [US3] Atualizar o mirror + UI de frete em `site-goiania/src/pages/carrinho.astro` p/ exibir **frete + prazo** no resumo (input de CEP; retirada → R$ 0; fora de faixa → "a combinar"), espelhando a tabela de T013.

**Checkpoint**: US1–US3 independentes.

> Nota: exibir prazo na confirmação (`obrigado.astro`) ficou **fora de escopo** — FR-009 pede prazo só no carrinho; `prazo` é derivável do CEP por `getFaixa`, sem persistir em `Pedido`.

---

## Phase 6: User Story 4 - Cupom de desconto (Priority: P3)

**Goal**: aplicar cupom percentual/fixo (só sobre o produto) com display no carrinho e **re-validação autoritativa no checkout**; 1 cupom por carrinho.

**Independent Test**: cupom válido → linha de desconto no total recalculado; cupom expirado/inexistente → recusa sem mudar o total; no checkout, desconto cobrado = validado no servidor.

- [x] T015 [US4] Adicionar `cupomCodigo` + `desconto` ao model `Pedido` em `app/prisma/schema.prisma` e aplicar por `prisma db push` **MANUAL** de máquina que alcança o host (Constituição — não usar runner standalone).
- [x] T016 [P] [US4] Criar knob `app/src/lib/cupons.ts` com `validarCupom(codigo, subtotalProduto)` (tipos `percentual`/`fixo`, `validade`, `minimo`, `ativo`; desconto ≤ subtotal, só sobre o produto). Incluir 1 cupom de teste ativo (ex.: `OBRA10`).
- [x] T017 [US4] Criar `app/src/app/api/cupom/validar/route.ts` (POST urlencoded → JSON `{ok,desconto,motivo}`, recomputa subtotal via `precos.ts`, header `Access-Control-Allow-Origin: https://goiania.roilabs.com.br`) conforme `contracts/cupom-validar.md` (depende de T016).
- [x] T018 [US4] Estender o checkout `app/src/app/api/pedidos/route.ts` conforme `contracts/checkout-delta.md`: parse `cupom`, re-validar no servidor, `total = produto − desconto + frete`, **escalar `unitPrice` dos itens MP** p/ casar o total (sem item negativo), persistir `cupomCodigo`/`desconto`; se o cupom deixou de valer, cobrar sem desconto e anexar `&aviso=cupom` ao `back_url` (depende de T015, T016).
- [x] T019 [US4] Adicionar campo de cupom + linha de desconto em `site-goiania/src/pages/carrinho.astro`: POST p/ `/api/cupom/validar`, exibir desconto ou mensagem clara de recusa, **1 cupom por carrinho** (reaplicar substitui) (depende de T017).
- [x] T020 [US4] Exibir aviso de cupom invalidado no checkout (`?aviso=cupom`) em `site-goiania/src/pages/obrigado.astro` — fecha FR-014 ("o visitante é avisado") (depende de T018).
- [x] T021 [P] [US4] Exibir coluna `cupom`/`desconto` por pedido em `app/src/app/admin/pedidos/page.tsx`.
- [x] T022 [P] [US4] Asserts de math de cupom (percentual/fixo, nunca negativo, só sobre o produto) em `site-goiania/src/scripts/check-cart-math.mjs`.

**Checkpoint**: US1–US4 independentes.

---

## Phase 7: User Story 5 - Salvar e recuperar o carrinho por link (Priority: P3)

**Goal**: gerar link compartilhável (payload na URL, válido 30 dias) que restaura itens/quantidades; expirado → mensagem.

**Independent Test**: montar carrinho, gerar link, abrir em sessão limpa → itens/quantidades idênticos; simular `ts` > 30 dias → link expirado com mensagem.

- [x] T023 [P] [US5] Adicionar `encodeCart()` / `decodeCart(token)` em `site-goiania/src/lib/cart.ts`: base64url de `{v:1, ts, items:[{slug,caixas}]}`; `decodeCart` checa idade ≤ 30 dias (retorna itens ou `'expired'`).
- [x] T024 [US5] Botão "salvar/compartilhar" (gera `/carrinho?c=<payload>`) + restauração no load (lê `?c=`, restaura no `localStorage`, expirado → mensagem clara) em `site-goiania/src/pages/carrinho.astro` (depende de T023).
- [x] T025 [P] [US5] Assert de round-trip `encode→decode` + expiração em `site-goiania/src/scripts/check-cart-math.mjs`.

**Checkpoint**: US1–US5 independentes.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T026 Rodar `node site-goiania/src/scripts/check-cart-math.mjs` — todos os asserts verdes (m²→caixas, folga, cupom, link).
- [ ] T027 Verificar **zero regressão de pSEO**: comparar **conteúdo indexável + JSON-LD + sitemap** das páginas vs. snapshot de T001 — **não** diff byte-a-byte do HTML (o mini-cart é island `client:only` e adiciona chrome legítimo ao header). Confirmar que nenhuma página deixou de ser pré-renderizada e que o `sitemap` é idêntico em cobertura (SC-006/FR-018).
- [ ] T028 Verificação em ambiente real conforme `quickstart.md` (Docker/EasyPanel + navegador em prod, cartão de teste MP) cobrindo US1–US5; confirmar `total cobrado == total do servidor` (SC-002/004) e o recompute de frete/guest herdados da 002 (FR-011/FR-019).
- [x] T029 [P] Escrever `specs/003-carrinho-melhorias/handoff.md` (feito/decisões/próximos/pendências/gotchas) + commit & push (Constituição V).

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (P1)** → sem dependências.
- **Foundational (P2)** → depende do Setup; **bloqueia US2 e US5** (modelo `CartItem` estendido).
- **US1 (P3)** → MVP; entrega o carrinho redesenhado que US3/US4/US5 estendem na mesma página.
- **US2–US5** → após Foundational; cada uma é **demoável independente**, mas US3/US4/US5 inserem UI no `carrinho.astro` de US1 (build após T004 na prática).
- **Polish (P8)** → após as stories desejadas.

### Within Each User Story
- Arquivos compartilhados editados em ordem: `cart.ts` (T002→T003→T010→T023), `carrinho.astro` (T004→T005→T014→T019→T024) e `api/pedidos/route.ts` (só T018) são **sequenciais**.
- Modelos/knobs antes dos endpoints (T015/T016 antes de T017/T018); endpoint antes da UI que o consome (T017 antes de T019; T018 antes de T020).

### Parallel Opportunities
- **[P] entre arquivos distintos**: T006 (MiniCart) ‖ T008 (asserts); T009 (Simulador) ‖ T012; T013 (frete.ts) é [P]; T016 (cupons.ts) ‖ T021 (admin) ‖ T022; T023 (encode) ‖ T025.
- Com 1 squad (modelo do dono), execução é majoritariamente **sequencial** P1→P3; os [P] indicam onde não há conflito de arquivo se houver banca extra.

---

## Implementation Strategy

### MVP (US1)
1. Setup (T001) + Foundational (T002).
2. US1 (T003–T008) → **validar isolado** (editar m²/caixas, mini-cart, estados) → deploy/demo.

### Incremental
- + US2 (simulador) → demo · + US3 (frete+prazo) → demo · + US4 (cupom) → demo · + US5 (link) → demo.
- Cada story agrega valor sem quebrar as anteriores; rodar `check-cart-math.mjs` + o check de conteúdo pSEO (T027) a cada incremento que toca dinheiro/pSEO.

### Fechamento (Constituição)
- Verificação real (T028) com output anexado; `handoff.md` + commit/push (T029).

---

## Notes
- `[P]` = arquivos diferentes, sem dependência pendente.
- Invariante mantida: o carrinho client-side guarda **caixas fechadas**; **todo dinheiro é recalculado no servidor** no checkout (FR-017), inclusive cupom e itens vindos de link.
- 1 task = 1 verde; commit após cada task ou grupo lógico; parar em qualquer checkpoint p/ validar a story isolada.
