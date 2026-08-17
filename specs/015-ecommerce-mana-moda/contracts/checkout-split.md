# Contrato — checkout com split no Mercado Pago

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Research D2**: [../research.md](../research.md)

O que muda no caminho de dinheiro quando a cadeira tem `split`, e — mais importante — **o que
não pode mudar** quando ela não tem.

---

## 0. A regra que protege o que já fatura

`LojaConfig.split === null` ⇒ **nada** deste contrato se aplica. `createPreference` é chamada
como hoje, com `MERCADOPAGO_ACCESS_TOKEN`, sem `marketplace_fee`, e a `notification_url` sem
parâmetro. Porcelanato e fitas passam pelo mesmo código de antes.

Isso é a mesma regra que a 012 fixou em FR-005a ao tornar `secretOverride` opcional: **o caminho
que já cobra hoje não muda de comportamento por causa do caminho novo.**

O teste de regressão que já existe (`test/mercadopago-assinatura-regressao.test.mjs`) cobre a
chamada de um argumento; o novo cobre a de dois.

---

## 1. Credencial — resolvida antes de qualquer chamada ao gateway

Reusa `lib/carteira/credenciais.ts` **sem alteração**:

```text
CredencialGateway(gateway='mercadopago', parceiroId=<Maná>, ativo=true)
  segredoRef = 'WEBHOOK_SECRET_MANA'   → env com o secret de assinatura da conta da Maná
  nomeEnvToken(segredoRef)
             = 'GATEWAY_TOKEN_MANA'    → env com o access_token OAuth da conta da Maná
```

`resolverCredencial('mercadopago', parceiroId)` devolve `null` quando a credencial não existe,
está inativa, **ou a env não foi publicada**. Os três casos são a mesma resposta de propósito.

**`null` ⇒ a cadeira não vende.** O checkout volta para o carrinho com `?erro=sem_cobranca`.
Nunca cai no token da ROI Labs por fallback — cobrar na conta errada é pior que não cobrar.

⚠️ **Constituição I:** falha de checkout da Maná investiga-se **nesta ordem**:
`GATEWAY_TOKEN_MANA` → `WEBHOOK_SECRET_MANA` → `MELHOR_ENVIO_*` → só então o código.

---

## 2. Preference — o que muda no corpo

```diff
  POST https://api.mercadopago.com/checkout/preferences
- Authorization: Bearer $MERCADOPAGO_ACCESS_TOKEN
+ Authorization: Bearer $GATEWAY_TOKEN_MANA          ← conta da Maná
  {
    items: [...],                                     (inalterado: 1 linha por item + frete)
    external_reference: pedido.id,                    (inalterado)
    back_urls / auto_return,                          (inalterado)
-   notification_url: "{app}/api/pagamentos/webhook"
+   notification_url: "{app}/api/pagamentos/webhook?cadeira=mana"
+   marketplace_fee: <10% de (produto − desconto)>
  }
```

### `marketplace_fee` — a base de cálculo

```text
base = max(0, totalProduto − desconto)      ← MESMO alvo do rateio de desconto que já existe
fee  = arredondar(base × 0.10, 2)
```

⚠️ **O frete fica fora.** É custo de transportadora, não venda. É a mesma base que
`NegocioOriginado.valor = total − frete` já usa neste repo desde a 007.

⚠️ **Nunca somar os `unit_price` das linhas do MP para achar a base.** O rateio de desconto
distribui centavos entre as linhas e a última absorve a diferença — a soma bate com `base`, mas
depender disso amarra a comissão a um detalhe de apresentação do gateway. A base vem do cálculo
do servidor, uma vez, em `lib/comissao.ts` (função pura, testada).

### Onde a comissão é gravada

`ItemPedido` **não** ganha coluna. O que se grava é o que reconstrói a apuração:
- `Pedido.total`, `Pedido.frete`, `Pedido.desconto` (já existem);
- a alíquota vem de `lojas.ts` (`split.comissaoPct`), versionada em git.

Isso é suficiente para o demonstrativo do parceiro e para conferir contra o painel do MP.
**Se a alíquota mudar um dia**, aí sim vira snapshot por pedido — e é o teto declarado
(hoje seria coluna para valor que não muda).

---

## 3. Webhook — resolver a conta antes de tocar estado

```text
POST /api/pagamentos/webhook?cadeira=mana

1. cadeira = query.cadeira ?? null
2. cadeira == null  ⇒ CAMINHO DE HOJE, sem nenhuma diferença
                      (secret = MERCADOPAGO_WEBHOOK_SECRET, token global)
3. cadeira != null  ⇒ loja = getLoja(cadeira); loja.split == null ⇒ 400
                      cred = resolverCredencial(loja.split.gateway, parceiroId da cadeira)
                      cred == null ⇒ 404 SEM ler o corpo
4. verifyWebhookSignature({...}, cred.segredo)     ← ANTES de qualquer estado (FR-003a da 012)
5. getPayment(dataId, cred.token)                  ← a conta da Maná; o token global não enxerga
6. daí em diante: fluxo normal + débito de estoque (contracts/estoque-variacao.md)
```

⚠️ **Passo 4 antes do passo 5, sempre.** Assinatura inválida com secret da conta certa significa
uma de duas coisas — a env divergiu do painel do MP (pagamentos param de ser registrados **em
silêncio**) ou alguém está forjando. As duas merecem log em `warn` e 401.

⚠️ **`?cadeira=` é dado de quem chama, não é autoridade.** Ele só escolhe **qual segredo** valida
a assinatura. Um remetente que mente sobre a cadeira falha na validação do passo 4, porque não
tem o segredo daquela conta. A autoridade continua sendo a assinatura, nunca o parâmetro.

### Mudanças de assinatura (as duas mínimas, mesmo padrão da 012)

```ts
getPayment(id: string, tokenOverride?: string)
refund(paymentId: string, tokenOverride?: string)
```

Omitido ⇒ `MERCADOPAGO_ACCESS_TOKEN`, comportamento idêntico ao de hoje.

---

## 4. O que o comprador vê antes de pagar

`pagoA: 'Maná Moda'` já é campo da cadeira desde a 013 (FR-016 dela) e a tela de checkout o
exibe. Com split isso deixa de ser cortesia e vira **exato**: quem recebe é a Maná, e a fatura
do cartão vai trazer o nome dela.

Texto de interface passa por `ux-writing` no `implement` — a frase precisa dizer quem cobra sem
sugerir que a ROI Labs saiu da relação.

---

## 5. Como isto é verificado (Constituição II — e o limite)

| Verificação | Como | Prova o quê |
|---|---|---|
| fee correto | `test/comissao-flat.test.mjs` — base sem frete, arredondamento, desconto | a **conta** |
| regressão | `test/mercadopago-assinatura-regressao.test.mjs` + novo caso de 2 args | que porcelanato/fitas não mudaram |
| fiação ponta a ponta | **usuário de teste do MP** (sandbox marketplace): preference na conta da Maná → pagamento → webhook validado com a secret dela → estoque debitado → fee visível no painel | a **fiação** |
| dinheiro real chegando | — | ⛔ **não é provado.** Cartão real vetado em 07/08 |

⚠️ A última linha precisa sobreviver ao handoff. Sandbox verde **não** autoriza nenhuma
afirmação de receita.
