# Contrato: ramo novo de `POST /api/pagamentos/webhook`

## O que NÃO muda

Verificação de assinatura (`verifyWebhookSignature`), busca do `Payment` real via `getPayment`
(nunca confiar no corpo do POST), e todo o caminho de `type === 'payment'` para pedidos que NÃO
são de unidade `assinatura` continuam exatamente como hoje.

## Filtro de tipo (ver research.md — risco do nome do evento)

```text
ANTES: if (bodyType && bodyType !== 'payment') return ok
DEPOIS: if (bodyType && !['payment', 'subscription_authorized_payment'].includes(bodyType)) return ok
```

## Fluxo depois de `getPayment`

```text
pedido = findUnique(where: { id: payment.externalReference })
SE não achou pedido: return ok  (comportamento atual, sem mudança)

SE pedido.statusPagamento === 'pendente' E payment.status === 'approved':
  # Caminho do 1º ciclo — idêntico ao de hoje (transação que marca pago + snapshot de
  # centro de custo + e-mails), com UM acréscimo dentro da MESMA transação:
  SE algum item do pedido tem unidade === 'assinatura':
    criar Assinatura {
      itemPedidoId: item.id,
      pedidoId: pedido.id,
      slug: item.slug,
      lojaId: pedido.vertical,
      mpPreapprovalId: item.assinaturaRef,   # já setado no checkout
      recorrencia: item.recorrencia,
      estado: 'ativa',
      proximaCobranca: dataProximoCiclo(item.recorrencia),
      cancelToken: crypto.randomBytes(24).toString('hex'),
    }
    criar CicloCobranca { assinaturaId, resultado: 'sucesso', mpPaymentId: paymentId }
  # e-mail de confirmação (já existe) ganha, só para assinatura, o link de cancelamento

SENÃO SE pedido.statusPagamento === 'pago' E existe Assinatura para este pedido:
  # Caminho de RENOVAÇÃO — todo o código novo desta fase
  idempotência: SE já existe CicloCobranca com este mpPaymentId → return ok (FR-006)

  SE payment.status === 'approved':
    criar CicloCobranca { resultado: 'sucesso', mpPaymentId }
    SE assinatura.estado === 'inadimplente':
      estado = 'ativa'; janelaFalhaDesde = null
    proximaCobranca = dataProximoCiclo(assinatura.recorrencia)
    espelhar em ItemPedido.assinaturaEstado

  SENÃO (rejected/cancelled/qualquer não-approved):
    criar CicloCobranca { resultado: 'falha', motivo: payment.status, mpPaymentId }
    SE assinatura.estado === 'ativa':
      estado = 'inadimplente'; janelaFalhaDesde = now()
      enviar e-mail de falha ao comprador (FR-004), com o link de cancelamento
    # se já estava inadimplente, só o ciclo é gravado — janela não reseta (D2/data-model.md)
    espelhar em ItemPedido.assinaturaEstado

SENÃO: comportamento atual (pendente sem approved, ou pago sem assinatura) — sem mudança.
```

## Por que a criação da `Assinatura` fica dentro da transação existente

O bloco `$transaction` que já marca `pedido.statusPagamento = 'pago'` é o único lugar do
sistema onde "este ciclo 1 realmente foi pago" é um fato consolidado. Criar a `Assinatura` fora
dessa transação (por exemplo, um passo depois) abriria uma janela onde o pedido está pago mas a
assinatura ainda não existe — e um reprocessamento do webhook nesse intervalo duplicaria a
tentativa de criação. Dentro da mesma transação, ou os dois nascem juntos ou nenhum nasce.
