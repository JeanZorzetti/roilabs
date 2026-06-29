# Data Model — Fase 1

Duas tabelas novas no `roilabs_db`, aplicadas por `prisma db push` **MANUAL** (Constituição). Padrões Next 16: snake_case com `@@map`, dinheiro em `Decimal`.

## Pedido (`@@map("pedidos")`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String cuid | PK |
| `nome` | String | contato |
| `whatsapp` | String | contato |
| `email` | String? | opcional |
| `entrega` | String | `retirada` \| `entrega` \| `a_combinar` |
| `cep` | String? | null em retirada |
| `frete` | Decimal(10,2)? | valor; **null = a combinar** (FR-016) |
| `total` | Decimal(10,2) | produto + frete (recalculado no servidor) |
| `statusPagamento` | String | `pendente` \| `pago` \| `reembolsado` (default `pendente`) — `@map("status_pagamento")` |
| `statusFulfillment` | String | `aguardando` \| `confirmado` \| `reembolsado` (default `aguardando`) — `@map("status_fulfillment")` |
| `mpPreferenceId` | String? | `@map("mp_preference_id")` |
| `mpPaymentId` | String? **@unique** | `@map("mp_payment_id")` — **chave de idempotência do webhook (D4)** |
| `consent` | Boolean | LGPD (default false) |
| `itens` | ItemPedido[] | relação |
| `createdAt` | DateTime | `@default(now())` `@map("created_at")` |
| `updatedAt` | DateTime | `@updatedAt` `@map("updated_at")` |

**Transições de estado**
- Criação: `statusPagamento=pendente`, `statusFulfillment=aguardando`.
- Webhook aprovado: `pendente → pago` (idempotente por `mpPaymentId`); fulfillment segue `aguardando` (= reserva, FR-012).
- Operação: `aguardando → confirmado` OU lote indisponível → refund MP → `statusPagamento=reembolsado` + `statusFulfillment=reembolsado` (FR-013).
- Nunca regride (`pago` não volta a `pendente`).

## ItemPedido (`@@map("itens_pedido")`)

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String cuid | PK |
| `pedidoId` | String | `@map("pedido_id")`, FK → Pedido, `onDelete: Cascade` |
| `slug` | String | produto (chave em `porcelanatos.json`) |
| `caixas` | Int | quantidade (caixas fechadas) |
| `m2` | Decimal(10,2) | m² cobertos pelas caixas |
| `precoM2` | Decimal(10,2) | `@map("preco_m2")` — **snapshot** do preço/m² no momento da compra |
| `subtotal` | Decimal(10,2) | `caixas × m²/caixa × preço/m²` (servidor) |

## Regras de cálculo (servidor — FR-002/FR-005)
- `m2_caixa` e `preco` vêm da fonte espelhada (`app/src/lib/precos.ts`), nunca do cliente.
- `subtotal = caixas × m2_caixa × preco`; `total = Σ subtotais + frete` (frete null não soma).
- Item com `slug` inexistente na fonte é descartado (edge case da spec).

## Não persistido
`FaixaFrete` é config em código (`app/src/lib/frete.ts`), não tabela — sem CRUD (YAGNI).
