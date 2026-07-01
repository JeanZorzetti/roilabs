# Phase 1 — Data Model: Camada Parceiro

Três modelos novos (snake_case `@@map`) + back-relations em modelos existentes. Percentuais como fração `[0,1]` `Decimal(6,4)` (convenção de `centros-custo`). Dinheiro `Decimal(10,2)`/`(12,2)`.

## `Parceiro` → tabela `parceiros`

| Campo | Tipo | Coluna | Notas |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | `id` | |
| `nome` | `String` | `nome` | Razão/loja |
| `whatsapp` | `String?` | `whatsapp` | |
| `email` | `String?` | `email` | Necessário p/ cobrança Asaas |
| `cpfCnpj` | `String?` | `cpf_cnpj` | Documento — opcional na sondagem, **obrigatório para faturar** (cliente Asaas) |
| `cidade` | `String?` | `cidade` | |
| `nicho` | `String` | `nicho` | Derivado da `Cadeira` escolhida (D5) |
| `polo` | `String @default("Goiânia")` | `polo` | |
| `cadeiraId` | `String?` | `cadeira_id` | FK → `Cadeira` (nicho canônico) |
| `candidaturaId` | `String?` | `candidatura_id` | FK → `Candidatura` (origem) |
| `estagio` | `String @default("sondagem")` | `estagio` | `sondagem` \| `ativa` \| `riscada` \| `pausada` |
| `comissaoPct` | `Decimal? @db.Decimal(6,4)` | `comissao_pct` | % negociado (fração). Exigido p/ faturar |
| `contratoEm` | `DateTime? @db.Date` | `contrato_em` | Assinado ⇒ **ocupa** a cadeira (D6) |
| `asaasCustomerId` | `String?` | `asaas_customer_id` | id do cliente no Asaas |
| `createdAt/updatedAt` | timestamps | `created_at`/`updated_at` | |

Relations: `cadeira Cadeira? @relation(...)`, `candidatura Candidatura? @relation(...)`, `negocios NegocioOriginado[]`, `faturas FaturaSuccessFee[]`. Índices: `@@index([estagio])`, `@@index([cadeiraId])`.

**Regras**: só `estagio='ativa'` recebe repasse (FR-003). Faturar exige `comissaoPct != null` **e** `cpfCnpj != null` (FR-008). Transições preservam histórico.

## `NegocioOriginado` → tabela `negocios_originados`

| Campo | Tipo | Coluna | Notas |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | `id` | |
| `pedidoId` | `String` | `pedido_id` | FK → `Pedido` pago |
| `parceiroId` | `String` | `parceiro_id` | FK → `Parceiro` ativo |
| `valor` | `Decimal @db.Decimal(10,2)` | `valor` | Snapshot do **valor de produto** do pedido = `total − (frete ?? 0)`; exclui frete (base do %) |
| `estagio` | `String @default("repassado")` | `estagio` | `repassado` \| `aceito` \| `ganho` \| `perdido` |
| `faturavel` | `Boolean @default(true)` | `faturavel` | Isenção pontual ⇒ `false` |
| `isencaoMotivo` | `String?` | `isencao_motivo` | Motivo quando isento |
| `faturaId` | `String?` | `fatura_id` | Setado quando entra numa fatura |
| `createdAt/updatedAt` | timestamps | | |

Relations: `pedido Pedido @relation(...)`, `parceiro Parceiro @relation(...)`, `fatura FaturaSuccessFee? @relation(...)`. Índices: `@@index([parceiroId])`, `@@index([estagio])`, `@@index([pedidoId])`.

**Regras**: entra na fatura sse `estagio='ganho'` **e** `faturavel=true` **e** `pedido.statusPagamento != 'reembolsado'` **e** `faturaId=null` (não recobrar — SC-006).

**Repasse único (FR-004a)**: um `Pedido` tem no máximo um negócio ativo (estágio ≠ `perdido`). O `POST /api/negocios` recusa se já existir negócio ativo para o `pedidoId`; só permite novo repasse se o anterior for `perdido`. (Prisma não faz unique condicional — regra aplicada na rota.)

## `FaturaSuccessFee` → tabela `faturas_success_fee`

| Campo | Tipo | Coluna | Notas |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | `id` | |
| `parceiroId` | `String` | `parceiro_id` | FK → `Parceiro` |
| `competencia` | `String` | `competencia` | `'YYYY-MM'` (mês) |
| `base` | `Decimal @db.Decimal(12,2)` | `base` | Σ valor dos negócios incluídos |
| `valor` | `Decimal @db.Decimal(12,2)` | `valor` | Comissão = base × `comissaoPct` |
| `status` | `String @default("emitida")` | `status` | `emitida` \| `paga` \| `erro` |
| `asaasPaymentId` | `String? @unique` | `asaas_payment_id` | Idempotência do webhook |
| `createdAt/updatedAt` | timestamps | | |

Relations: `parceiro Parceiro @relation(...)`, `negocios NegocioOriginado[]`. `@@unique([parceiroId, competencia])` (uma fatura por parceiro/mês). `@@map("faturas_success_fee")`.

## Modelos existentes — back-relations (sem colunas novas)

- `Cadeira`: `parceiros Parceiro[]`. Estado de ocupação **derivado** (D6), não armazenado.
- `Candidatura`: `parceiros Parceiro[]` (origem).
- `Pedido`: `negocios NegocioOriginado[]`. O `statusPagamento='reembolsado'` (já setado pelo webhook MP) exclui o negócio da fatura.

## Shape puro (consumido por `calcularFaturaMensal`)

```ts
type NegocioCalc = { id: string; valor: number; estagio: string; faturavel: boolean; pedidoReembolsado: boolean; jaFaturado: boolean };
// calcularFaturaMensal(comissaoPct: number, negocios: NegocioCalc[])
//   → { base: number; valor: number; negocioIds: string[] }
// inclui: estagio==='ganho' && faturavel && !pedidoReembolsado && !jaFaturado
```
