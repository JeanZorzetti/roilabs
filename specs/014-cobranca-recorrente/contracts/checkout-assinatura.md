# Contrato: `POST /api/pedidos` para `loja.unidade === 'assinatura'`

## O que NÃO muda

Todo o parsing de form, validação de honeypot/consent, doc obrigatório, cálculo de item
(`getProdutoAssinatura`), gravação de `Pedido`/`ItemPedido`, cupom e frete continuam
**idênticos** ao que a 013 já faz. Este contrato cobre só o passo final: qual chamada ao gateway
substitui `createPreference` quando `loja.unidade === 'assinatura'`.

## O que muda

Depois de `pedido = await prisma.pedido.create(...)` (idêntico), o branch de integração MP
passa a ser:

```text
SE loja.unidade === 'assinatura':
  chamar createPreapproval({
    externalReference: pedido.id,        // mesmo valor que createPreference usa hoje
    reason: itens[0].slug,                // rótulo da assinatura na página MP
    payerEmail: form.email,               // Preapproval EXIGE payer_email (Checkout Pro não)
    transactionAmount: itens[0].subtotal, // preço do ciclo, snapshot já calculado
    frequency: recorrencia === 'anual' ? 12 : 1,
    frequencyType: 'months',
    backUrl: <mesmo backTo usado hoje>,
    notificationUrl: <mesma /api/pagamentos/webhook>,
  })
  → { id: preapprovalId, initPoint }

  UPDATE itens_pedido SET assinatura_ref = preapprovalId WHERE id = item.id
  (mesmo padrão do `prisma.pedido.update({ mpPreferenceId: pref.id })` de hoje, mas na
  linha do ITEM, porque assinaturaRef mora no ItemPedido, não no Pedido)

  redirect 303 → initPoint

SENÃO: comportamento atual, sem mudança (createPreference).
```

## Pré-requisito descoberto nesta fase

`payer_email` é obrigatório para `Preapproval` e hoje o form de checkout não exige e-mail (é
opcional em `Pedido.email`). Para a cadeira de unidade `assinatura`, o e-mail passa a ser
**obrigatório no form** (mesma trava de `docObrigatorio`, um campo `emailObrigatorio` novo em
`LojaConfig` ou — mais simples — regra fixa: "toda loja de unidade assinatura exige e-mail",
sem campo de config novo, porque hoje só essa unidade precisaria dele (YAGNI: não generalizar
uma config que teria um único valor possível).

## Erros e fallback

Se `createPreapproval` falhar (rede, token, e-mail ausente), mesmo padrão de hoje:
`backTo(origin, 'pagamento', cadeiraId)` — o pedido fica gravado com `mpPreapprovalId` nunca
setado, o comprador cai de volta no carrinho e pode tentar de novo. Nenhuma `Assinatura` é
criada neste momento (ela só nasce no webhook, na confirmação — ver `webhook-assinatura.md`).
