# Phase 1 — Data Model: Painel Administrativo e Financeiro

**Sem migração.** Esta feature só lê modelos existentes e deriva estruturas em memória. Abaixo, os campos consumidos e as estruturas derivadas (não persistidas).

## Modelos existentes consumidos (somente leitura)

| Modelo | Campos usados | Uso |
|---|---|---|
| `Candidatura` | `status`, `createdAt` | Contagem nova (24h/7d) e por status no Painel |
| `LeadConsumidor` | `status`, `createdAt` | Contagem nova (24h/7d), por status, e denominador da conversão |
| `Pedido` | `statusPagamento`, `statusFulfillment`, `total`, `createdAt` | GMV/nº do mês; fila de fulfillment; numerador da conversão; bucket de mês = `createdAt` |
| `ItemPedido` | `subtotal`, `pisoSnapshot`, `modalidadeSnapshot`, `comissaoSnapshot`, `aliqIntermediacaoSnapshot`, `aliqWLSnapshot`, `slug`, relação `pedido.createdAt`/`statusPagamento` | Cálculo do líquido real por modalidade no Financeiro (via `lib/centros-custo`) |
| `Cadeira` | `open`, `polo` | Contagem aberta (`open=true`) × em estudo (`open=false`) por polo |
| `ParametroCentroCusto` / `SkuConfig` | (via `lib/centros-custo`) | Fallback de parâmetros vigentes p/ itens sem snapshot |

**Não há** campo de ocupação de cadeira nem carimbo "pago em" — decisões registradas nas Clarifications do spec.

## Estruturas derivadas (em memória, não persistidas)

### `PainelResumo` (Painel)
- `candidaturas`: `{ novas24h, novas7d, porStatus: Record<status, number> }`
- `leads`: `{ novos24h, novos7d, porStatus: Record<status, number> }`
- `mes`: `{ gmvPago, pedidosPagos }` (mês corrente, por `createdAt`)
- `fulfillmentPendente`: `number` (`statusPagamento='pago'` E `statusFulfillment='aguardando'`)
- `cadeiras`: `Array<{ polo, abertas, emEstudo }>`
- `conversao`: `{ pedidos7d, leads7d, taxa }` — janela de 7 dias, aproximada, rotulada

### `MesFinanceiro` (Financeiro) — uma entrada por mês com pedido pago
- `mes`: `string` (`YYYY-MM`, derivado de `pedido.createdAt`)
- `gmvPago`: `number` (soma de `subtotal` dos itens pagos do mês)
- `liquidoInter`: `number` (soma `calcIntermediacao(...).liquido` dos itens cuja modalidade oficial = intermediação)
- `liquidoWL`: `number` (soma `calcWL(...).liquido` dos itens cuja modalidade oficial = wl)
- `pedidos`: `number` (distintos no mês)
- `semSnapshot`: `number` (itens sem snapshot, apurados com parâmetros vigentes — sinalizado)

### `LinhaCSV` (export) — uma por pedido pago
- `data` (`dd/MM/yyyy` de `createdAt`), `pedidoId`, `gmv`, `modalidade`, `liquido`

## Regras / invariantes

- **Estabilidade de snapshot**: itens com `*Snapshot` usam os valores congelados; alterar parâmetros vigentes NÃO muda meses passados (FR-010). Já coberto pela mecânica de `lib/centros-custo` e por `centros-custo.test.mjs`.
- **Fallback sem snapshot**: item sem snapshot usa parâmetros vigentes (`resolverParametros({ global })`) e é contado em `semSnapshot`.
- **Modalidade oficial por item**: `modalidadeSnapshot ?? skuConfig.modalidadeAlvo ?? 'intermediacao'` (espelha o agregado atual de centros-de-custo).
- **Janelas 24h/7d**: relativas ao instante do request (`force-dynamic`).
- **Mês**: `createdAt` no fuso do servidor; documentar fuso no quickstart.
