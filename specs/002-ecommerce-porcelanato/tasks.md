# Tasks: E-commerce de porcelanato sobre o pSEO existente

**Input**: `specs/002-ecommerce-porcelanato/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Testes**: a spec não pediu suíte de testes. Mantemos só os **self-checks runnable** exigidos pela Constituição/ponytail (T014) e a verificação E2E em ambiente real (T020). Sem framework.

**Convenções**: `[P]` = paralelizável (arquivos distintos). `[US#]` = user story. Em cada story, **backend antes do front**.

---

## Phase 1: Setup (infra compartilhada)

- [ ] **T001** [P] Espelhar fonte de preço: criar `app/src/lib/precos.ts` a partir de `site-goiania/porcelanatos.json` com `getProduto(slug) → { m2_caixa, preco } | null`. `// ponytail: cópia; sincronizar por build se divergir.`
- [ ] **T002** [P] Adicionar `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET` ao `app/.env.example` (Constituição I).
- [ ] **T003** [P] `app/src/lib/frete.ts`: `calcFrete(entrega, cep) → number | null` (retirada=0; tabela Grande Goiânia; fora=null "a combinar"). Stub de faixas; valores reais entram em T015.

## Phase 2: Foundational (BLOQUEIA todas as stories)

- [ ] **T004** Prisma: adicionar models `Pedido` (`@@map("pedidos")`) e `ItemPedido` (`@@map("itens_pedido")`) em `app/prisma/schema.prisma` conforme `data-model.md`; rodar `prisma generate`.
- [ ] **T005** Aplicar schema com `prisma db push` **MANUAL** em `roilabs_db @ 2.24.207.200:5443` (Constituição — não pelo runner standalone). ⚠️ requer acesso ao host.
- [ ] **T006** `app/src/lib/mercadopago.ts`: `createPreference(pedido)`, `getPayment(id)`, `verifyWebhookSignature(headers, body)`, `refund(paymentId)` (HTTP/SDK MP, token via env).
- [ ] **T007** [P] `site-goiania/src/lib/cart.ts`: estado em `localStorage`, `add/remove`, `m2ParaCaixas(m2, m2_caixa, perda=0.10) → max(1, ceil(m2*(1+perda)/m2_caixa))`, totais.

**Checkpoint**: fonte de preço, frete, MP, schema e carrinho prontos → stories podem começar.

---

## Phase 3: User Story 1 — Comprar e pagar online (P1) 🎯 MVP

**Objetivo**: produto → carrinho → checkout → pagamento Pix/cartão → pedido `pago`.
**Teste independente**: pagar com Pix de teste do MP e ver pedido `pago` na confirmação.

Backend:
- [ ] **T008** [US1] `app/src/app/api/pedidos/route.ts` — POST público (urlencoded): honeypot/consent, parse `itens`, **recalcula preço/total no servidor** (T001), frete (T003), grava `Pedido(pendente)`+`ItemPedido[]`, cria preferência MP (T006), **303 → `init_point`**. GET admin (auth `getAuthFromRequest`). Conforme `contracts/pedidos.md`.
- [ ] **T009** [US1] `app/src/app/api/pagamentos/webhook/route.ts` — POST do MP: valida `x-signature`, `getPayment`, **idempotente por `mpPaymentId`**, `approved → pago` (fulfillment segue `aguardando`). Conforme `contracts/pagamentos-webhook.md`.

Front (`site-goiania`):
- [ ] **T010** [P] [US1] `src/components/AddToCart.astro` (ilha: input m² → caixas via `cart.ts`) + inserir em `ProdutoDetalhe.astro` ao lado do `WhatsappCta`.
- [ ] **T011** [P] [US1] `src/components/CartCount.astro` (mini-contador) + link no `Header.astro`.
- [ ] **T012** [US1] `src/pages/carrinho.astro`: shell estático + ilha (lista itens, edita caixas, campos contato+entrega, hidden `<form>` urlencoded → `POST {APP}/api/pedidos`, submit segue 303).
- [ ] **T013** [US1] `src/pages/obrigado.astro`: ler `?pedido=` e exibir status do pedido (retorno do MP).
- [ ] **T014** [US1] `src/scripts/check-cart-math.mjs` (node+assert): `m2ParaCaixas` (ceil, +10%, mín.1) e `Σ subtotais == total` (sem frete).

**Checkpoint**: US1 funcional e testável de ponta a ponta (com retirada grátis, sem depender de US2).

---

## Phase 4: User Story 2 — Frete por região / "a combinar" (P2)

**Objetivo**: frete real no checkout por CEP.
**Teste independente**: CEP da Grande Goiânia → frete da tabela somado; "retirada" → R$0; CEP fora → "a combinar".

- [ ] **T015** [US2] Preencher faixas/valores reais da Grande Goiânia em `frete.ts`; no `carrinho.astro`, ao informar CEP/entrega, exibir frete + total atualizados (cálculo de exibição no front espelha o do servidor).
- [ ] **T016** [US2] Caminho "a combinar" ponta-a-ponta (FR-016): CEP fora da tabela → `frete=null`, total só produto, pedido marcado; refletir na confirmação e no admin.

**Checkpoint**: US1 + US2 funcionam; total online reflete frete.

---

## Phase 5: User Story 3 — Reserva, confirmação e reembolso (P2)

**Objetivo**: tratar todo pedido pago como reserva com desfecho.
**Teste independente**: marcar "lote indisponível" → `reembolsado` + estorno no MP; "disponível" → `confirmado`.

- [ ] **T017** [US3] Ligar `refund()` (T006) às transições de `data-model.md`: indisponível → refund → `reembolsado`/`reembolsado`.
- [ ] **T018** [US3] Ações na operação (`confirmar` / `reembolsar`) sobre um pedido (rota `POST /api/pedidos/:id/acao` ou server action, espelhando como `/admin/leads` muta estado).

**Checkpoint**: nenhum pedido pago fica sem desfecho (SC-004).

---

## Phase 6: User Story 4 — Operação de pedidos (P3)

**Objetivo**: listar pedidos para repasse manual.
**Teste independente**: pedido pago aparece com itens/total/frete/status.

- [ ] **T019** [US4] `app/src/app/admin/pedidos/page.tsx`: listagem espelhando `/admin/leads` (consome GET de T008), com os campos de repasse + botões de T018.

---

## Phase 7: Polish & verificação

- [ ] **T020** Rodar `quickstart.md` E2E em **ambiente real** (Docker/EasyPanel + MP teste), anexar evidência (Constituição II).
- [ ] **T021** Não-regressão pSEO (SC-003): diff do `dist/` do `site-goiania` antes/depois — mesmas rotas, mesmo `sitemap.xml`, JSON-LD inalterado.
- [ ] **T022** `specs/002-ecommerce-porcelanato/handoff.md` (feito/decisões/próximos/pendências/gotchas) + commit/push em `002-ecommerce-porcelanato` (Constituição V).

---

## Dependências & ordem

- **Setup (1)** → **Foundational (2)** bloqueia tudo.
- **US1 (P1)** depois da Fase 2 → **MVP**. Pode shippar só com retirada.
- **US2/US3 (P2)** depois da Fase 2; independentes entre si, integram com US1.
- **US4 (P3)** depois de US3 (consome ações).
- **Polish (7)** por último.

### Paralelizável
- T001/T002/T003 juntos; T007 em paralelo ao backend.
- Em US1: T010/T011 (front) em paralelo a T008/T009 (backend) após Fase 2.

### Gate de implementação (ops, antes de "pronto")
T005 (db push manual) e as credenciais MP de T002 dependem de acesso a host/conta — **env-first** (Constituição I). Sem elas, US1 não fecha em ambiente real.
