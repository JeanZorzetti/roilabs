# Contrato — `POST /api/pedidos` com `vertical=fitas` (ALTERADO)

**Host**: `app.roilabs.com.br` · **Arquivo**: [`app/src/app/api/pedidos/route.ts`](../../../app/src/app/api/pedidos/route.ts)

O checkout hoje é form-POST 303 → Mercado Pago, e **recalcula todo o dinheiro no servidor**. Ganha um ramo para fitas. O ramo de porcelanato fica **byte a byte igual**.

## Novo campo discriminador

| Campo | Valores | Ausente ⇒ |
|---|---|---|
| `vertical` | `porcelanato` \| `fitas` | `porcelanato` (retrocompatível: carrinho antigo em cache continua funcionando) |

## Diferenças entre os ramos

| | `porcelanato` (inalterado) | `fitas` (novo) |
|---|---|---|
| Formato do item | `{ slug, caixas }` | `{ slug, rolos }` |
| Fonte de preço | `precos.ts` | `precos-fitas.ts` (**faixas por volume**, 2 SKUs) |
| Cálculo | `caixas × m2_caixa × precoM2` | `rolos × precoRolo(faixa)` |
| Persistência | `ItemPedido` | `ItemPedidoFita` |
| Frete | `frete.ts` (tabela Goiânia) | Melhor Envio (re-cotado) |
| `compradorDoc` | **opcional** | **obrigatório** (FR-007) |
| Quantidade mínima | não se aplica | `rolos ≥ minimoRolos` (FR-029) |
| Item desconhecido | descartado em silêncio *(comportamento atual)* | **rejeitado com erro** (FR-009) |

## Validações do ramo de fitas

Em ordem, todas **antes** de criar o pedido:

1. **CPF/CNPJ obrigatório e válido** — ausente ou malformado ⇒ `303 → /carrinho-fitas/?erro=documento`. Sem isso, todo negócio da 010 seria classificado como aquisição (15%) por omissão.
2. **Item sem preço público** — slug fora de `precos-fitas.ts` ⇒ `303 → ?erro=item_orcamento`. **Nunca descartar em silêncio** (FR-009). Esta é a diferença de comportamento mais importante em relação ao ramo de porcelanato, e é deliberada: descarte silencioso deixaria o comprador pagar um pedido incompleto.
3. **Quantidade abaixo do mínimo** ⇒ `303 → ?erro=minimo`.
4. **Carrinho misto** — se o payload trouxer slug dos dois verticais ⇒ `303 → ?erro=vertical_misto` (FR-028). O front já separa; isto é a trava do servidor.
5. **Cupom fora de escopo** ⇒ tratado como cupom rejeitado: cobra **sem** desconto e avisa (FR-036). Não bloqueia a venda.

## Frete no checkout

Re-cotado no servidor — o valor exibido no carrinho é display (FR-016).

```
cotação ok        → frete = valor · entrega = 'entrega'  · freteMotivo = null
cep_nao_atendido  → frete = null  · entrega = 'a_combinar' · freteMotivo = 'cep_nao_atendido'
falha_tecnica     → frete = null  · entrega = 'a_combinar' · freteMotivo = 'falha_tecnica'
```

`frete = null` ⇒ o total cobrado no Mercado Pago é **só o produto** (comportamento que o `Pedido` já suporta — reuso, não invenção).

**Divergência carrinho ↔ checkout** (FR-016): se o frete re-cotado diferir do exibido, o comprador precisa ver a diferença **antes** de pagar. Como o fluxo é um POST direto para o Mercado Pago, a divergência volta como aviso na tela de retorno — mesmo mecanismo do `aviso=cupom` que já existe.

**Alerta (FR-035)**: gravado `freteMotivo = 'falha_tecnica'`, contar pedidos de fita recentes com o mesmo motivo; ao atingir **3 consecutivos**, `sendAlert()`. Nunca alertar em `cep_nao_atendido`.

## Success fee (010) — sem mudança de regra

`NegocioOriginado.valor = total − frete`. Com `frete = null`, a base é o total inteiro (que já é só produto). A classificação aquisição/recorrência usa `compradorDoc`, agora sempre presente em fitas. **Nenhuma alteração no modelo da 010** — só passa a receber dados melhores.

## Códigos de erro (redirect 303 de volta ao carrinho)

| `?erro=` | Causa |
|---|---|
| `validacao` | Nome/WhatsApp ausente, honeypot, consentimento LGPD *(existente)* |
| `vazio` | Carrinho vazio ou ilegível *(existente)* |
| `pagamento` | Falha ao criar preferência no Mercado Pago *(existente)* |
| `documento` | **NOVO** — CPF/CNPJ ausente ou inválido em pedido de fita |
| `item_orcamento` | **NOVO** — item sem preço público no carrinho |
| `minimo` | **NOVO** — quantidade abaixo do mínimo do SKU |
| `vertical_misto` | **NOVO** — itens dos dois verticais no mesmo payload |

## Self-check

`site-goiania/src/scripts/check-cart-math.mjs` — estendido para rolos **e finalmente wired no `prebuild`** (hoje é órfão, ver research D7):

- `rolos × precoRolo(faixa) = subtotal`, sem arredondamento perdido
- **fronteiras de faixa** — o caso que mais quebra: 14/15/100/101 na gomada
- **faixas sem lacuna e sem sobreposição** por SKU (a tabela original do Tapepro tinha as duas — ver data-model)
- `fita-transparente-personalizada` **rejeitada no checkout** com `?erro=item_orcamento` — é só-orçamento (FR-040)
- soma dos subtotais = total de produto
- total = produto − desconto + frete, e com `frete = null` o frete não entra
- a matemática de porcelanato continua passando **sem alteração** (é a prova do FR-003)
