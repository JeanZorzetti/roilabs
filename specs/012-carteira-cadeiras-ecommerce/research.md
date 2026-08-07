# Research — 012 carteira de cadeiras

**Data**: 2026-08-07 · Tudo aqui é **medido**, não lembrado. Comandos e datas nas seções.

## 1. Quantos gateways as 8 cadeiras da fase 1 realmente usam

`roihub/scripts/gateways-repo.mjs` (API do GitHub, lê `package.json` + `.env*` de 35 repos) +
`roihub/scripts/gateways.mjs` (HTTP contra produção). Ambos zero LLM, corridos em 2026-08-07.

| cadeira | SDK no repo | gateway efetivo | entra na fase 1? |
|---|---|---|---|
| `atma` | mercadopago | **Mercado Pago** | ✅ (já ligado) |
| `polarisia` | mercadopago | **Mercado Pago** | ✅ |
| `estetiacrm` | mercadopago | **Mercado Pago** | ✅ |
| `vertice` | mercadopago | **Mercado Pago** | ✅ |
| `sirius` | mercadopago **+ stripe** | **Stripe** *(confirmado 07/08)* | ✅ |
| `context` | stripe | **Stripe** | ✅ |
| `orion` | stripe | **Stripe** | ✅ |
| `orcaobra` | *nada no código* | Kiwify (link externo) | ❌ **fora** — ver §1.2 |

**Conclusão que dimensiona o trabalho: 2 adaptadores para 7 cadeiras.** Mercado Pago cobre 4,
Stripe cobre 3. *Webhook por gateway ≠ webhook por cadeira.*

### 1.1 A ambiguidade do `sirius`, resolvida

Ele tem os **dois** SDKs no `package.json` e nada no HTML servido diz qual cobra — fatura por tier
de organização no próprio banco, e nenhuma página dele carregaria gateway. **Confirmado pelo Jean
em 2026-08-07: Stripe.** O `mercadopago` no `package.json` é dependência escrita e não usada —
**inventário de código dá palpite, não veredito.**

### 1.2 🚩 `orcaobra` SAI da fase 1 — e o motivo não é técnico

Ele estava no balde "gateway servido e nenhuma régua lendo", que parece um problema de fiação.
**Não é.** Decisão do Jean (07/08): *"precisa de investimento em código, eu fiz ele em um dia,
acho ele um produto ruim do jeito que está."*

Ligar cobrança num produto que o dono considera ruim não produz receita — produz uma página de
checkout para algo que não deveria estar à venda. Ele volta para o balde de **"transformar em
vendável"**, junto com os 27, e a cadeira dele fica `em-preparacao`.

**Consequência direta: o adaptador Kiwify serve ZERO cadeira e não se constrói.** Fica registrado
para quando `orcaobra` ou outra cadeira Kiwify voltar — construir adaptador sem cadeira é o
scaffolding "para depois" que a Constituição III proíbe.

**Esta é a segunda vez que a resposta do Jean ENCOLHE o escopo** (a primeira tirou a generalização
do `ItemPedido`). O padrão vale registrar: perguntar antes de construir tem devolvido mais corte
do que adição.

## 2. O que JÁ EXISTE e deve ser reusado, não reescrito

`app/src/app/api/pagamentos/webhook/route.ts` (Mercado Pago, porcelanato/fitas). O padrão dele é
correto e vira o molde dos 3 adaptadores:

1. **Verifica a assinatura ANTES de tocar estado** (`verifyWebhookSignature`), e o comentário já
   registra por que o 401 importa: ou o segredo derivou do painel — e aí pagamentos param de ser
   gravados em silêncio — ou alguém está forjando notificação.
2. **Nunca confia no corpo**: chama `getPayment(dataId)` porque "MP is the source of truth for
   status".
3. **Idempotente** por `mpPaymentId` (`@unique` no schema).
4. **Avança só para frente** — nunca `pago → pendente`.
5. Efeitos colaterais (e-mail, alerta) são fire-and-forget e **não quebram o webhook**.

**Mas ele é single-tenant e não serve como está:** o segredo é `MP_WEBHOOK_SECRET` (global, conta
da própria ROI Labs) e a atribuição é `externalReference → Pedido.id`. Cadeira de parceiro tem
**conta própria** (segredo próprio) e **não tem `Pedido`**.

**Decisão: não tocar nesse arquivo.** É o caminho que fatura hoje — mesma disciplina da spec 011
com o caminho do porcelanato. Os adaptadores da carteira nascem em rotas próprias.

## 3. O bloqueio de schema, encontrado no arquivo e não suposto

```prisma
model NegocioOriginado {
  pedidoId String @map("pedido_id")            // NOT NULL
  pedido   Pedido @relation(fields: [pedidoId], references: [id])   // relação obrigatória
```

**Uma venda SaaS não tem `Pedido`, logo hoje ela não consegue virar `NegocioOriginado`.**

Alternativa considerada e **rejeitada**: criar um `Pedido` sintético. `Pedido` exige `nome`,
`whatsapp`, `entrega` e `total`, e teria de receber `whatsapp` e `entrega` falsos — poluir o
caminho de dinheiro com dado inventado para satisfazer uma FK. Rejeitada por isso.

**Escolhido**: `pedidoId` anulável + discriminador de origem + invariante "exatamente uma origem"
(ver `data-model.md`).

## 4. Como cada gateway assina e identifica a conta

O que decide se **um** endpoint serve N contas ou se é preciso um por conta:

| gateway | assinatura | identifica a conta em |
|---|---|---|
| Mercado Pago | `x-signature` (HMAC-SHA256 sobre `id` + `x-request-id` + ts), segredo **por webhook** | `user_id` do pagamento consultado |
| Stripe | `Stripe-Signature`, segredo **por endpoint** | `account`/conta dona da chave |
| Kiwify | token próprio no payload/header | conta dona da loja |

**Consequência de projeto:** como o segredo é **por conta** nos três, o receptor precisa saber
*qual parceiro* antes de validar. Resolvido roteando por **path** (`/webhook/mercadopago/[parceiroId]`)
em vez de descobrir pelo corpo — descobrir pelo corpo exigiria confiar no corpo antes de validar a
assinatura, que é exatamente o que o item 2.1 proíbe.

## 5. Limitação que nenhuma implementação remove

**O webhook prova que a venda ocorreu; não prova que TODAS ocorreram.** O parceiro é dono da conta
do gateway. E o incentivo é assimétrico: como o success fee incide sobre o que chega, **forjar
venda a mais é contra o interesse dele; sub-reportar é a favor** — deixar de configurar o webhook,
trocar a conta, ou vender por fora.

Portanto **completude não é verificável** por esta feature. Todo número publicado tem de dizer
"vendas reportadas por webhook", nunca "vendas do parceiro" (SC-001a). Detectar sub-reporte é
conciliação contra extrato, e está fora de escopo.
