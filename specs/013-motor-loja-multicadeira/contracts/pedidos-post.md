# Contrato — `POST /api/pedidos` (checkout)

**Consumidor**: o carrinho estático em `goiania.roilabs.com.br`, via `<form method="POST">`
urlencoded (sem preflight CORS). **Resposta**: `303` para o Mercado Pago, ou `303` de volta ao
carrinho com `?erro=<codigo>`.

O que segue é o contrato **depois** da 013. O que muda é marcado; o resto é preservação
deliberada — um carrinho já publicado e em cache no browser tem de continuar funcionando.

## Campos do formulário

| Campo | Estado | Regra |
|---|---|---|
| `cadeira` | **NOVO** | id da cadeira-loja. **Ausente ⇒ `porcelanato`** — é o que mantém funcionando o carrinho antigo em cache, mesma tática que a 011 usou com `vertical` |
| `vertical` | **ACEITO, DEPRECIADO** | `'fitas'` continua sendo aceito e mapeado para `cadeira='fitas'`. Carrinhos em cache no browser ainda mandam este campo |
| `itens` | **FORMATO NOVO** | JSON `[{ slug, quantidade }]`. Os formatos antigos (`caixas`, `rolos`) continuam sendo aceitos e normalizados |
| `nome`, `whatsapp` | inalterado | obrigatórios |
| `email` | inalterado | opcional |
| `compradorDoc` | inalterado | obrigatório **se** `cadeira.docObrigatorio`; validado com `validarDoc` |
| `cep` | inalterado | ignorado quando a unidade não tem entrega física (FR-018a) |
| `entrega` | inalterado | só nas cadeiras com `frete: 'tabela-cep'` |
| `cupom` | inalterado | re-validado no servidor, no escopo da cadeira |
| `origin` | inalterado | base do site estático, para os redirects de volta |
| `consent` | inalterado | `'1'` obrigatório (LGPD) |
| `botcheck` | inalterado | honeypot; preenchido ⇒ `?erro=validacao` |

## Invariantes que NÃO podem mudar

1. **O cliente nunca manda dinheiro.** Preço, subtotal, desconto e frete são recalculados no
   servidor a partir do catálogo. Qualquer valor no corpo é ignorado.
2. **Cupom é re-validado no checkout**, e cupom rejeitado **cobra sem desconto + avisa**
   (`&aviso=cupom`) em vez de barrar a compra.
3. **Cupom que zeraria o produto é tratado como rejeitado** — o Mercado Pago não tem linha
   negativa, e uma linha de preço 0 quebraria a preferência.
4. **O rateio do desconto entre as linhas do MP fecha exatamente**: a última linha recebe a
   diferença acumulada, de forma que `Σ linhas + frete = total do pedido`. Hoje esse algoritmo
   está **duplicado** nos dois ramos; passa a existir uma vez e ganha teste.
5. **`mpPaymentId` é a chave de idempotência do webhook** (`@unique`). Reprocessar o mesmo
   evento não cria segundo pedido nem segundo negócio (FR-013).
6. **Frete não cotado ⇒ `a_combinar`, nunca estimado.** O pedido é criado assim e o comprador é
   avisado (`&aviso=frete`).
7. **Item sem preço público é rejeitado, nunca descartado em silêncio** — descarte silencioso
   faria o comprador pagar um pedido incompleto sem perceber.
8. **Falha ao criar a preferência do MP deixa o pedido `pendente` e loga o `pedidoId`** — é o
   único rastro de qual pedido nunca chegou ao pagamento.

## Regras novas

| Regra | Comportamento | Requisito |
|---|---|---|
| Cadeira desconhecida | `303 ?erro=vazio` | — |
| Cadeira sem meio de cobrança | `303 ?erro=sem_cobranca`, **nenhum pedido criado** | FR-006 |
| Cadeira despublicada | `303 ?erro=indisponivel`, **nenhum pedido criado** | FR-007b |
| `modoCobranca = 'parceiro'` | **nenhum pedido interno**; o comprador vai para o `checkoutUrl` da cadeira, tendo visto `pagoA` antes | FR-015 / FR-016 |
| Itens de cadeiras diferentes | `303 ?erro=cadeira_mista`. O front já impede; o servidor é a trava | FR-005 |
| Unidade sem entrega física | endereço não é coletado nem gravado; frete = 0 | FR-018a |
| Unidade `assinatura` | grava `recorrencia` e `assinaturaEstado='ativa'`; **cobra só o 1º ciclo** | FR-003a |

## Códigos de erro (`?erro=`)

Preservados: `vazio`, `validacao`, `pagamento`, `documento`, `item_orcamento`, `minimo`.

`vertical_misto` → renomeado para **`cadeira_mista`**, mantendo o texto antigo mapeado no
carrinho (um redirect antigo em cache pode chegar com o código velho).

Novos: `sem_cobranca`, `indisponivel`.

## `GET /api/pedidos` (admin)

Passa a incluir **uma** relação de itens (`itens`), não duas. É o FR-017 / US5: a tela deixa de
adivinhar em qual relação os itens estão.
