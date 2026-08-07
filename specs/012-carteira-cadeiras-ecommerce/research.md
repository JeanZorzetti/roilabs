# Research — 012 carteira de cadeiras

**Data**: 2026-08-07 · Tudo aqui é **medido**, não lembrado. Comandos e datas nas seções.

## 1. Quantos gateways as 8 cadeiras da fase 1 realmente usam

`roihub/scripts/gateways-repo.mjs` (API do GitHub, lê `package.json` + `.env*` de 35 repos) +
`roihub/scripts/gateways.mjs` (HTTP contra produção). Ambos zero LLM, corridos em 2026-08-07.

| cadeira | SDK no repo | gateway efetivo | modo de cobrança |
|---|---|---|---|
| `atma` | mercadopago | **Mercado Pago** | parceiro (já ligado) |
| `sirius` | mercadopago **+ stripe** | ⚠️ ambíguo | parceiro |
| `polarisia` | mercadopago | **Mercado Pago** | parceiro |
| `estetiacrm` | mercadopago | **Mercado Pago** | parceiro |
| `vertice` | mercadopago | **Mercado Pago** | parceiro |
| `context` | stripe | **Stripe** | parceiro |
| `orion` | stripe | **Stripe** | parceiro |
| `orcaobra` | *nada no código* | **Kiwify** (link externo) | parceiro |

**Conclusão que dimensiona o trabalho: 3 adaptadores, não 8.** Mercado Pago cobre 5 cadeiras,
Stripe 2–3, Kiwify 1. *Webhook por gateway ≠ webhook por cadeira.*

⚠️ **`sirius` tem os dois SDKs** e nada no HTML servido diz qual cobra — ele fatura por tier de
organização no próprio banco, e nenhuma página dele carregaria gateway. **Não presumir**: a
cadeira do `sirius` exige confirmar com que conta ele cobra antes de configurar webhook.

⚠️ **`orcaobra` não tem SDK nenhum** — Kiwify por link externo não deixa dependência no
`package.json`. Um inventário só de código nunca o veria. É o caso que prova por que as duas
metades (repo × HTML servido) têm de ser cruzadas.

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
