# Data Model — Fase 1

Reusa o modelo da 002. **Uma única migração** (2 campos em `Pedido`); cupom e carrinho salvo **não viram tabela**.

## Delta de `Pedido` (`@@map("pedidos")`)

Campos novos (resto inalterado — ver `specs/002-ecommerce-porcelanato/data-model.md`):

| Campo | Tipo | Notas |
|---|---|---|
| `cupomCodigo` | String? | `@map("cupom_codigo")` — código aplicado (snapshot); null se sem cupom |
| `desconto` | Decimal(10,2)? | valor do desconto **recalculado no servidor** sobre o subtotal do produto; null se sem cupom |

**Total**: `total = Σ subtotais − (desconto ?? 0) + (frete ?? 0)` (servidor). `desconto` nunca excede o subtotal do produto. `ItemPedido` inalterado.

Migração: `prisma db push` **MANUAL** de máquina que alcança o host (Constituição). Pedidos da 002 ficam com `cupom_codigo=null`, `desconto=null` — compatível.

## `Cupom` — knob em código (NÃO persistido)

`app/src/lib/cupons.ts`, fonte de verdade da validação no servidor:

| Atributo | Tipo | Notas |
|---|---|---|
| `codigo` | String (chave) | case-insensitive na entrada |
| `tipo` | `'percentual' \| 'fixo'` | sempre sobre o **subtotal do produto** (nunca frete) |
| `valor` | number | % (0–100) se percentual; R$ se fixo |
| `validadeInicio` | Date? | opcional |
| `validadeFim` | Date? | opcional |
| `minimo` | number? | subtotal mínimo do produto p/ aplicar |
| `ativo` | boolean | liga/desliga sem remover |

`validarCupom(codigo, subtotalProduto)`:
- não existe / `ativo=false` → `{ok:false, motivo:'invalido'}`
- fora de `[validadeInicio, validadeFim]` → `{ok:false, motivo:'expirado'}`
- `subtotalProduto < minimo` → `{ok:false, motivo:'minimo'}`
- válido → `{ok:true, desconto}` onde `desconto = tipo==='percentual' ? subtotal×valor/100 : min(valor, subtotal)` (clamp ≤ subtotal; arredonda a 2 casas)

`// ponytail: knob em código; promover a tabela DB + admin CRUD quando a operação precisar criar cupom sem deploy.`

## `CarrinhoSalvo` — payload na URL (NÃO persistido)

Não há linha em banco. O link `/carrinho?c=<base64url(payload)>` carrega:

| Campo | Tipo | Notas |
|---|---|---|
| `v` | number | versão do formato (=1) |
| `ts` | number | epoch ms da geração (base da expiração de 30 dias) |
| `items` | `{slug, caixas}[]` | mesma forma do `localStorage`; **sem dinheiro** |

Restauração: decodifica → se `Date.now() − ts > 30 dias` → expirado (mensagem, não restaura); senão escreve `items` no `localStorage`. Nada do payload é confiável para valor — o servidor recalcula no checkout (FR-017).

`// ponytail: payload na URL; promover a token em DB se precisar revogar links ou medir abertura.`

## `AmbienteSimulado` — efêmero (client-only)

Parte opcional de um item do carrinho no `localStorage`, para reabrir o simulador pré-preenchido. **Nunca enviado ao servidor.**

| Campo | Tipo | Notas |
|---|---|---|
| `largura` | number | metros |
| `comprimento` | number | metros |

Extensão opcional do `CartItem` (localStorage): `ambientes?: AmbienteSimulado[]`, `perda?: number` (fração 0.05–0.20). Ausentes ⇒ item é o `{slug, caixas}` simples da 002 (retrocompatível).

## Regras de cálculo (inalteradas + desconto)

- Item/subtotal/frete: idênticos à 002 (`precos.ts`/`frete.ts`, servidor).
- `desconto`: re-validado no servidor no checkout (`cupons.ts`), só sobre o subtotal do produto.
- `total = Σ subtotais − (desconto ?? 0) + (frete ?? 0)`; nunca negativo.
