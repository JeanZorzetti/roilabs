# Data Model: Success fee com duas taxas

Deltas sobre o schema existente (`app/prisma/schema.prisma`). Tipos Prisma; tabelas snake_case via `@@map` (convenção do dono). Nada é removido nesta feature.

## Parceiro (alterado)

| Campo | Tipo | Notas |
|-------|------|-------|
| `comissaoAquisicao` | `Decimal? @db.Decimal(6,4) @map("comissao_aquisicao")` | Fração [0,1]. Taxa da 1ª compra ganha de um cliente. Exigida p/ faturar. |
| `comissaoRecorrencia` | `Decimal? @db.Decimal(6,4) @map("comissao_recorrencia")` | Fração [0,1]. Taxa das compras seguintes. Exigida p/ faturar. |
| `comissaoPct` | `Decimal?` (mantido) | **Deprecado** — não mais lido pelo cálculo. Backfill origina as duas novas a partir dele. `ponytail:` dropar em `db push` futuro. |

**Regras**: ambas em [0,1]; `estagio='ativa'` e faturamento exigem `comissaoAquisicao` **e** `comissaoRecorrencia` (substitui a exigência de `comissaoPct`). Default de novo parceiro/contrato = 0.15 / 0.10 (FR-009), editável.

## NegocioOriginado (alterado)

| Campo | Tipo | Notas |
|-------|------|-------|
| `clienteDoc` | `String? @map("cliente_doc")` | CPF/CNPJ normalizado (só dígitos) do comprador do Pedido, **snapshot na criação**. Chave de agrupamento aquisição/recorrência. Null = sem doc → aquisição. |
| `classificacao` | `String` (default sem — setado na criação) | `aquisicao` \| `recorrencia` \| `legado` (backfill). Congelado (FR-005). |
| `taxaAplicada` | `Decimal @db.Decimal(6,4) @map("taxa_aplicada")` | Fração [0,1] aplicada a este negócio, snapshot da taxa do parceiro na criação. |

**Índice**: `@@index([parceiroId, clienteDoc])` — para achar negócios anteriores do mesmo cliente+parceiro na classificação.

**Transições**: `estagio` (repassado→aceito→ganho | perdido) inalterado. `classificacao`/`taxaAplicada`/`clienteDoc` são **imutáveis** após a criação.

**Elegibilidade de fatura** (inalterada): `estagio='ganho' && faturavel && !pedidoReembolsado && !jaFaturado`. A novidade é que o **valor cobrado** por negócio = `valor × taxaAplicada`.

## Pedido (alterado)

| Campo | Tipo | Notas |
|-------|------|-------|
| `compradorDoc` | `String? @map("comprador_doc")` | CPF/CNPJ normalizado do comprador. Coletado no checkout B2C como **opcional** (Q1); obrigatório no futuro fluxo B2B/orçamento. Propaga para `NegocioOriginado.clienteDoc` no repasse. |

## FaturaSuccessFee (inalterado no schema)

- Campos iguais (`base`, `valor`, `competencia`, `status`, `asaasPaymentId`). O que muda é **como `valor` é calculado**: `Σ (negócio.valor × negócio.taxaAplicada)` em vez de `base × comissaoPct`. `base` continua `Σ valor`. Faturas já emitidas ficam intactas (FR-006).

## Entidade conceitual: Cliente

- Não é tabela. É o comprador identificado por `compradorDoc` (CPF/CNPJ normalizado). "Primeira compra" = não existe negócio anterior não-perdido do mesmo `clienteDoc` com o mesmo parceiro (D3).

## Migração (D6)

`prisma db push` MANUAL (host `roilabs_db@…:5443`) + `scripts/migrate-010-backfill.mjs`:
1. Parceiros: `comissaoAquisicao = comissaoRecorrencia = comissaoPct` onde nulas.
2. Negócios abertos (`faturaId=null`, sem `taxaAplicada`): `taxaAplicada = parceiro.comissaoPct`, `classificacao='legado'`, `clienteDoc` = doc do pedido (se houver).
3. Negócios faturados / faturas emitidas: intactos.

> Nota de migração: `taxaAplicada` é `NOT NULL` no schema final, mas o backfill precisa rodar **antes** de a coluna virar obrigatória. Aplicar em 2 passos: (a) adicionar como opcional + backfill; (b) tornar `NOT NULL`. Alternativa: adicionar já `NOT NULL` com default temporário e remover o default após o backfill. Decidir no implement conforme o que o `db push` aceitar sem downtime (Const. II — validar no host real).
