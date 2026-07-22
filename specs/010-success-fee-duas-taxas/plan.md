# Implementation Plan: Success fee com duas taxas (aquisição vs recorrência)

**Branch**: `main` (repo faz push direto em main) | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-success-fee-duas-taxas/spec.md`

## Summary

Substituir a taxa única de success fee (`Parceiro.comissaoPct`) por **duas taxas por parceiro** — aquisição (1ª compra ganha de um cliente) e recorrência — e cobrar cada negócio com a taxa certa. A classificação (aquisição/recorrência) e a taxa são **congeladas na criação do negócio** (padrão do snapshot do `ItemPedido` da camada 007), identificando o cliente pelo **CPF/CNPJ do comprador** (novo campo no `Pedido`, coletado obrigatoriamente no fluxo B2B/orçamento e opcional no checkout B2C). A fatura mensal passa a **somar por negócio** (`Σ valor × taxaAplicada`) em vez de `base × taxa única`. Compatível com parceiros/faturas existentes (backfill das duas taxas a partir da taxa antiga; faturas emitidas ficam intactas).

## Technical Context

**Language/Version**: TypeScript · Next.js 16 (App Router, standalone) para `/app`; Astro estático para `/site-goiania` (checkout).

**Primary Dependencies**: Prisma 6.3 (`@prisma/client`), Postgres (`roilabs_db@2.24.207.200:5443`), Asaas (cobrança, já integrado via `@/lib/asaas`). Sem dependência nova.

**Storage**: Postgres. Schema aplicado por `prisma db push` MANUAL de uma máquina que alcança o host (Const. — runner standalone não aplica schema). Migração inclui backfill.

**Testing**: Função pura `calcularFaturaMensal` já tem `test/success-fee.test.mjs` (node, assert). Estender esse teste é o gate de correção do cálculo (caminho de dinheiro). E2E real = navegador/EasyPanel (Const. II).

**Target Platform**: `/app` Docker Next standalone (EasyPanel, `app.roilabs.com.br`); checkout no `site-goiania` (`goiania.roilabs.com.br`).

**Project Type**: Web — monorepo por app (`/app` admin Next + Prisma, `/site-goiania` Astro).

**Performance Goals**: N/A (operação administrativa + 1 campo a mais no checkout). Sem meta de latência específica.

**Constraints**: Caminho de dinheiro — cálculo explícito, auditável, snapshot por negócio; nenhuma fatura existente pode mudar de valor (FR-006).

**Scale/Scope**: Poucos parceiros (unidades), dezenas de negócios/mês. Escala não é gargalo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Variáveis de Ambiente Primeiro** — N/A (não é debug); a migração usa `DATABASE_URL` do `roilabs_db`, já confirmada nesta sessão. ✅
- **II. Verificação em Ambiente Real (NÃO-NEGOCIÁVEL)** — O cálculo (dinheiro) é isolado numa função pura com self-check (`test/success-fee.test.mjs`); estendê-lo é obrigatório. "Pronto" só com E2E no EasyPanel/navegador (gerar fatura real de teste). Build local não conta. ✅
- **III. Simplicidade Deliberada (YAGNI)** — Reusa o padrão de snapshot da 007 (`ItemPedido`) e a função pura existente; sem abstração nova. Mantém a coluna `comissaoPct` como **deprecada** (não dropa — drop em prod é risco desnecessário agora); marcado com `ponytail:`. Duas taxas são exigência de negócio, não especulação. ✅
- **IV. Qualidade de Página Voltada ao Usuário** — Telas de parceiro/demonstrativo e o campo de CPF/CNPJ no checkout usam o design system light; o demonstrativo mostra a taxa por negócio de forma clara (não genérica). ✅
- **V. Fluxo Spec-Driven e Entrega Fechada** — Este plano + `research.md`/`data-model.md`/`contracts/`/`quickstart.md`; entrega fecha com `handoff.md` + commit/push. ✅

**Resultado: PASS. Sem violação → sem Complexity Tracking.**

## Project Structure

### Documentation (this feature)

```text
specs/010-success-fee-duas-taxas/
├── plan.md              # Este arquivo
├── research.md          # Decisões (algoritmo de classificação, migração, tie-break)
├── data-model.md        # Mudanças de schema (Parceiro, NegocioOriginado, Pedido)
├── quickstart.md        # Roteiro de validação E2E (dinheiro)
├── contracts/           # Contratos de API que mudam
│   ├── parceiros.md
│   ├── negocios.md
│   ├── faturas.md
│   └── checkout-pedido.md
└── tasks.md             # (/speckit-tasks — não criado aqui)
```

### Source Code (repository root)

```text
app/                                  # admin Next + Prisma
├── prisma/
│   ├── schema.prisma                 # + comissaoAquisicao/comissaoRecorrencia (Parceiro),
│   │                                 #   + clienteDoc/classificacao/taxaAplicada (NegocioOriginado),
│   │                                 #   + compradorDoc (Pedido)
│   └── seed.ts                        # inalterado
├── scripts/
│   └── migrate-010-backfill.mjs       # NOVO: backfill das 2 taxas + taxaAplicada dos negócios abertos
├── src/lib/
│   ├── success-fee.ts                 # calcularFaturaMensal passa a somar por negócio (taxaAplicada)
│   ├── classificar-negocio.ts         # NOVO: pura — aquisição vs recorrência + normalizar doc
│   └── doc.ts                         # NOVO: normalizar/validar CPF·CNPJ (só dígitos)
├── src/app/api/
│   ├── negocios/route.ts              # POST: snapshot classificação+taxa na criação
│   ├── faturas/route.ts               # POST: valida 2 taxas; usa taxaAplicada por negócio
│   └── parceiros/[id]/route.ts + route.ts  # aceitar/validar as 2 taxas
├── src/app/admin/parceiros/
│   ├── parceiros-form.tsx             # 2 campos de taxa
│   └── [id]/demonstrativo/page.tsx    # breakdown por negócio (classificação + taxa)
└── test/success-fee.test.mjs          # estender: soma por negócio; + test/classificar-negocio.test.mjs (NOVO)

site-goiania/                          # checkout B2C
└── src/pages/carrinho.astro (ou pedido)  # campo CPF/CNPJ opcional → compradorDoc
```

**Structure Decision**: Monorepo existente. O grosso vive no `/app` (schema, cálculo, telas admin); o `site-goiania` só ganha a captura opcional do CPF/CNPJ no checkout. O futuro fluxo de orçamento B2B (fitas) — onde o doc é obrigatório — ainda não existe (será o e-commerce do Tapepro no `goiania`), então esta feature entrega o campo no `Pedido` + a captura no checkout atual e deixa a obrigatoriedade B2B para quando o fluxo de orçamento nascer (documentado no `research.md`).

## Complexity Tracking

> Sem violações de constituição — seção não aplicável.
