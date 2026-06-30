# Data Model — Centros de custo editáveis (Fase 1)

Postgres `roilabs_db`. Convenção do projeto: tabelas snake_case via `@@map`, `Decimal`
para dinheiro/percentual, `prisma db push` **manual**. Percentuais guardados como **fração
[0,1]** (ex.: 10% = `0.10`), coerente com `PARAMS` em `centros-custo.ts`.

## Modelos novos

### ParametroCentroCusto  (`@@map("parametro_centro_custo")`)

Camadas `global` e `linha`. Campos de parâmetro **nullable** = herda a camada acima.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String cuid | PK |
| `escopo` | String | `'global'` \| `'linha'` |
| `chave` | String? | `NULL` no global; nome da linha quando `escopo='linha'` |
| `markup` | Decimal? `@db.Decimal(6,4)` | fração; atacado = varejo / (1+markup) |
| `comissao` | Decimal? `@db.Decimal(6,4)` | fração sobre o varejo (intermediação) |
| `aliqIntermediacao` | Decimal? `@db.Decimal(6,4)` `@map("aliq_intermediacao")` | imposto s/ serviço |
| `aliqWL` | Decimal? `@db.Decimal(6,4)` `@map("aliq_wl")` | imposto s/ GMV |
| `cenario` | String? | só no global: `'conservador'\|'base'\|'otimista'\|'ajustado'` |
| `updatedAt` | DateTime `@updatedAt @map("updated_at")` | |

- **Unicidade:** `@@unique([escopo, chave])` — um global, uma linha por nome.
- **Regras (validadas no servidor, FR-003):** `markup ≥ 0`; `comissao, aliq* ∈ [0,1]`. Valor inválido ⇒ recusa, mantém o anterior.
- **Seed:** upsert idempotente de `{escopo:'global', chave:null}` com os defaults dos docs (`markup 0.30, comissao 0.10, aliqIntermediacao 0.102, aliqWL 0.062, cenario 'base'`).

### SkuConfig  (`@@map("sku_config")`)

Dado por-SKU: linha, piso real, modalidade-alvo e overrides de parâmetro. Tudo opcional.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | String cuid | PK |
| `slug` | String `@unique` | produto (chave de `precos.ts`) |
| `linha` | String? | nome de uma `ParametroCentroCusto` escopo=`linha` |
| `piso` | Decimal? `@db.Decimal(10,2)` | **atacado real /m²**; ausente ⇒ estima por markup |
| `modalidadeAlvo` | String? `@map("modalidade_alvo")` | `'wl'\|'intermediacao'`; ausente ⇒ Intermediação |
| `markup` | Decimal? `@db.Decimal(6,4)` | override por SKU |
| `comissao` | Decimal? `@db.Decimal(6,4)` | override por SKU |
| `aliqIntermediacao` | Decimal? `@db.Decimal(6,4)` `@map("aliq_intermediacao")` | override por SKU |
| `aliqWL` | Decimal? `@db.Decimal(6,4)` `@map("aliq_wl")` | override por SKU |
| `updatedAt` | DateTime `@updatedAt @map("updated_at")` | |

- **Regras:** mesmas faixas dos parâmetros; `piso ≥ 0` (piso > varejo é **permitido**, mas sinalizado como prejuízo — FR-008/edge); `modalidadeAlvo ∈ {wl, intermediacao}`.
- **Órfão:** `slug` que sumiu de `precos.ts` não quebra a página; é sinalizado para limpeza (edge case).

## Delta em modelo existente

### ItemPedido  (`itens_pedido`) — colunas snapshot **aditivas** (todas nullable)

Congeladas quando o pedido vira `pago` (D2). `NULL` ⇒ pedido anterior à feature.

| Campo novo | Tipo | Notas |
|---|---|---|
| `pisoSnapshot` | Decimal? `@db.Decimal(10,2)` `@map("piso_snapshot")` | atacado usado na apuração |
| `modalidadeSnapshot` | String? `@map("modalidade_snapshot")` | `'wl'\|'intermediacao'` oficial do item |
| `comissaoSnapshot` | Decimal? `@db.Decimal(6,4)` `@map("comissao_snapshot")` | |
| `aliqIntermediacaoSnapshot` | Decimal? `@db.Decimal(6,4)` `@map("aliq_intermediacao_snapshot")` | |
| `aliqWLSnapshot` | Decimal? `@db.Decimal(6,4)` `@map("aliq_wl_snapshot")` | |

> Nenhuma coluna existente muda; migração é só **ADD COLUMN**. `markup` não é congelado: o
> `pisoSnapshot` já é o custo final resolvido.

## Regra de resolução (pura, em `centros-custo.ts`)

Para um `slug` com `varejo` (de `precos.ts`), dadas as 3 camadas carregadas:

```
resolverParametros(slug):
  para cada campo em {markup, comissao, aliqIntermediacao, aliqWL}:
    valor = primeiro não-nulo em [ sku_config(slug), linha(sku_config.linha), global ]
            ?? PARAMS[campo]            # fallback defaults dos docs (FR-004)
resolverPiso(slug, varejo):
  sku_config.piso  ??  atacadoDe(varejo, markupResolvido)
resolverModalidade(slug):
  sku_config.modalidadeAlvo  ??  'intermediacao'
```

Precedência **`SKU > linha > global > PARAMS`**, **campo a campo**. Os valores resolvidos
alimentam `calcIntermediacao`/`calcWL` (fórmulas intactas, FR-016).

**Apuração de um item pago (agregado real):** usa os `*Snapshot` do item; se ausentes,
usa `resolver*` vigente e marca "sem snapshot".

## Identidade & ciclo de vida

- **Parâmetro/SkuConfig:** sem estado; última gravação vence (sem concorrência relevante).
- **Snapshot:** escrito uma vez, na transição → `pago` (idempotente por `mp_payment_id`); imutável depois. Editar parâmetros não o toca (FR-011).

## Entidades efêmeras (não persistidas)

- **Resolução efetiva de um SKU** e o **resultado dos dois centros** são calculados por
  request na página (catálogo = parâmetros vigentes; agregado pago = snapshot). Nada além
  das 3 tabelas acima é persistido.
