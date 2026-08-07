# Fase 1 — Data Model: o motor de loja multicadeira

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

Três conceitos novos, um deles no banco. Tudo o mais é preservação do que já existe.

---

## 1. Unidade de venda (`site-goiania/src/data/unidades.ts`)

Dado, não código (FR-003). Três entradas na entrega; a quarta é adicionada por quem precisar
dela, sem tocar em carrinho ou checkout.

| Campo | Tipo | Papel |
|---|---|---|
| `id` | `'m2' \| 'rolo' \| 'assinatura'` | chave gravada no item de pedido |
| `rotulo` | `string` | singular exibido ("m²", "rolo", "mês") |
| `rotuloPlural` | `string` | usado na linha do carrinho |
| `entregaFisica` | `boolean` | **FR-018a** — `false` ⇒ nenhum endereço é coletado, nenhuma etapa de entrega aparece |
| `precificar(produto, quantidade)` | função | devolve `{ precoUnitario, detalhe }` |

`precificar` é o único ponto onde uma unidade encosta em lógica, e ele devolve **também a
justificativa** — é o que torna FR-004 satisfeito por construção em vez de por disciplina.

| Unidade | `precificar` devolve | `detalhe` |
|---|---|---|
| `m2` | `precoUnitario = produto.preco` (fixo por m²) | `{ caixas, m2PorCaixa, perda? }` |
| `rolo` | `precoUnitario` da faixa que a quantidade alcança | `{ faixaMin, faixaMax }` |
| `assinatura` | `precoUnitario = valor do ciclo` | `{}` — a recorrência mora em coluna própria |

**Regra de arredondamento**: `subtotal = arredondar(quantidade × precoUnitario, 2)`, com a mesma
função `money()` que a rota já usa. A invariante é testável e vale nas três unidades — é o
`test/item-unificado.test.mjs`.

⚠️ **Validação de entrada (não simplificar)**: `quantidade` vinda do cliente é sempre
re-derivada no servidor a partir do catálogo, como já acontece hoje nos dois ramos. O carrinho
manda **o que** e **quanto**, nunca **por quanto**.

---

## 2. Cadeira-loja (`site-goiania/src/data/lojas.ts` + espelho em `app/src/lib/lojas.ts`)

O registro que faz FR-001 valer: abrir loja = uma entrada aqui + um catálogo.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `string` | chave gravada em `Pedido.cadeira`. Os dois valores atuais (`porcelanato`, `fitas`) são preservados |
| `prefixoRota` | `string` | **FR-007a** — o segmento da URL. Único entre cadeiras; hoje `porcelanato` e `fitas`, iguais ao que já está no ar |
| `unidade` | `id de unidade` | **FR-003** |
| `catalogo` | `Produto[]` | **FR-007** — vazio ⇒ nenhuma vitrine pública indexável |
| `modoCobranca` | `'roilabs' \| 'parceiro'` | **FR-014/FR-015** — eixo independente da unidade |
| `checkoutUrl` | `string \| null` | obrigatório quando `modoCobranca = 'parceiro'` |
| `pagoA` | `string` | **FR-016** — exibido ao comprador **antes** de pagar |
| `frete` | `'tabela-cep' \| 'cotacao' \| 'nenhum'` | **FR-018a** — como a cadeira cobra, quando a unidade tem entrega |
| `docObrigatorio` | `boolean` | `true` em fitas (sem doc, a taxa da 010 sai errada por omissão) |
| `cupomEscopo` | `string` | **FR-018** — cupom de uma cadeira não desconta item de outra |
| `linhaFixa` | `{ quandoSlug, valor, isentoSeJaComprou } \| null` | o clichê. Ver o teto declarado em [plan.md](./plan.md#complexity-tracking) |
| `publicada` | `boolean` | **FR-007b** — `false` ⇒ URLs continuam respondendo, compra fechada |

### Estados da cadeira-loja

```text
  declarada sem catálogo ──> nenhuma vitrine indexável            (FR-007)
  declarada sem cobrança ──> vitrine existe, checkout recusa      (FR-006)
  publicada = true       ──> vende                                 (estado normal)
  publicada = false      ──> URLs em 200, produtos indisponíveis,
                             sem caminho de compra, pedidos antigos
                             seguem legíveis no admin              (FR-007b)
```

Despublicar **nunca** remove rota. É a transição que protege as 99 URLs.

### Invariantes verificadas no build (`check-lojas.mjs`, no `prebuild`)

1. `prefixoRota` único entre cadeiras.
2. `slug` único **dentro** de cada catálogo.
3. `modoCobranca = 'parceiro'` ⇒ `checkoutUrl` presente e `https` absoluto.
4. Cadeira publicada ⇒ catálogo não vazio.
5. Todo produto tem preço > 0 e imagem — **o gate que já derruba o build hoje** (FR-019).

O build quebra, não avisa. É o padrão que `check-cadeiras.mjs` já estabeleceu neste repo.

---

## 3. Item de pedido unificado (`app/prisma/schema.prisma`)

`ItemPedido` generalizado. `ItemPedidoFita` deixa de existir na fase 5.

### Colunas novas

| Campo Prisma | Coluna | Tipo | Papel |
|---|---|---|---|
| `unidade` | `unidade` | `String` | `m2` · `rolo` · `assinatura` |
| `quantidade` | `quantidade` | `Decimal(10,3)` | 3 casas: m² fracionário existe, rolo e mês são inteiros |
| `precoUnitario` | `preco_unitario` | `Decimal(10,2)` | o unitário **aplicado** |
| `detalhe` | `detalhe` | `Json?` | a justificativa do preço (FR-004) |
| `recorrencia` | `recorrencia` | `String?` | `mensal` · `anual`; null nas unidades avulsas |
| `assinaturaRef` | `assinatura_ref` | `String?` | id da assinatura **no gateway** — o que a 014 vai procurar |
| `assinaturaEstado` | `assinatura_estado` | `String?` | `ativa` · `cancelada`; a 013 só grava `ativa` |

`subtotal` já existe e não muda. Os snapshots de comissão (`pisoSnapshot`,
`modalidadeSnapshot`, `comissaoSnapshot`, `aliqIntermediacaoSnapshot`, `aliqWLSnapshot`)
**permanecem intactos** — são lidos pela régua de success fee da 010 (FR-012).

### Colunas legadas (vivas da fase 2 até a fase 5)

`caixas`, `m2`, `preco_m2` em `itens_pedido`; a tabela `itens_pedido_fita` inteira. Existem para
que a verificação compare contra o **dado original**, não contra a própria migração.

### O mapa da migração (FR-011 — `UPDATE` explícito, linha a linha)

| Origem | `unidade` | `quantidade` | `precoUnitario` | `detalhe` | `subtotal` |
|---|---|---|---|---|---|
| `itens_pedido` (porcelanato) | `'m2'` | `m2` | `preco_m2` | `{caixas, m2PorCaixa}` | **inalterado** |
| `itens_pedido_fita` | `'rolo'` | `rolos` | `preco_rolo` | `{faixaMin, faixaMax}` | **copiado** |

Nenhum valor é recalculado. `preco_m2` e `preco_rolo` atravessam a migração como estão — é o que
faz `quantidade × precoUnitario = subtotal` fechar sem tocar em dinheiro.

⚠️ **`@default` não reescreve linha gravada.** As colunas novas nascem anuláveis e são
preenchidas por `UPDATE`; a verificação conta linhas com `unidade IS NULL` e exige **zero** antes
de seguir. Esta landmine já custou caro duas vezes neste repo.

---

## 4. Pedido (`Pedido`) — o que muda

| Campo | Mudança |
|---|---|
| `vertical` | vira o campo Prisma **`cadeira`**, com `@map("vertical")`. **Coluna e valores intocados** |
| `itensFita` | relação removida na fase 5; `itens` passa a ser a leitura única (FR-017 / US5) |
| todo o resto | inalterado — `total`, `frete`, `freteMotivo`, `cupomCodigo`, `desconto`, `mpPaymentId` (a chave de idempotência de FR-013), `statusPagamento`, `statusFulfillment` |

**FR-005 (um pedido = uma cadeira)** já é verdade hoje e continua sendo: `cadeira` é campo do
pedido, não do item, então um pedido misto **não tem onde ser representado**. A invariante é
estrutural, não uma validação que se pode esquecer de chamar.

---

## 5. Carrinho no browser (`site-goiania/src/lib/cart.ts`)

Não é banco, mas é dado com formato e migração — e é onde FR-005a vive.

```ts
// chave única: roi_cart_v2
{ cadeira: string, itens: [{ slug, quantidade, extras? }] }
```

| Regra | Como |
|---|---|
| **FR-005a** — carrinho de uma cadeira só | `cadeira` é escalar. Adicionar item de outra cadeira devolve `{ ok: false, cadeiraAtual }` e a tela avisa. Nada é removido sem ação explícita |
| Conversão dos carrinhos abertos | primeira leitura migra `roi_cart_v1` (porcelanato) e `roi_cart_fitas_v1` (fitas) e apaga as chaves antigas |
| `extras` | preserva `ambientes[]` e `perda` do simulador de m² — dado de display que **nunca** vai ao servidor |
| Link compartilhado | `decodeCart` aceita o token v1 (`{slug, caixas}` ⇒ cadeira `porcelanato`) e o v2. Token de 30 dias emitido antes da entrega continua abrindo |
