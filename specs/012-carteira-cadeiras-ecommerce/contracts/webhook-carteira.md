# Contrato — webhook de venda de parceiro

**Rota**: `POST /api/carteira/webhook/[gateway]/[parceiroId]`
**Gateways**: `mercadopago` · `stripe`

*Kiwify não se constrói: serve zero cadeira depois que `orcaobra` saiu da fase 1 (research §1.2).
Gatilho para construir: uma cadeira Kiwify entrar em `ocupada-vendavel`.*

**Por que o parceiro está no PATH e não é descoberto pelo corpo:** o segredo de assinatura é
**por conta** nos dois gateways, então o receptor precisa saber qual parceiro é **antes** de
validar. Descobrir pelo corpo obrigaria a ler o corpo antes de verificar a assinatura — e ler
entrada não autenticada no caminho de dinheiro é exatamente o que este contrato existe para
impedir. O `parceiroId` no path **não é credencial**: ele é público e não autentica nada; quem
autentica é a assinatura.

## Ordem de execução — não reordenar

1. **Resolver `CredencialGateway`** por `(gateway, parceiroId)`. Não encontrada ou `ativo=false`
   → **404**, sem ler o corpo.
2. **Verificar a assinatura** com o segredo daquela conta (lido da env via `segredoRef`).
   Inválida → **401** + `log.warn`. **Nada de estado tocado até aqui** (FR-003a).
3. **Consultar o gateway** pelo id do evento para obter status, valor **e a conta dona do
   pagamento** (FR-003b). O corpo da notificação nunca é fonte de verdade.
4. **Conferir a conta.** Bateu com `contaRef` da credencial → `parceiroId` resolvido.
   Divergiu → `parceiroId = null` e `motivoDescarte = 'conta-divergente'`.
5. **Gravar `VendaParceiro`** — uma escrita só, com o `parceiroId` já decidido. Colisão em
   `@@unique([gateway, eventoId])` → **200 `{ok:true}`** e encerra: é retry, não erro.
   Se `parceiroId` é nulo → **409**, e **não** cria negócio (FR-005).
6. **Criar `NegocioOriginado`** com `origem='webhook'`, classificação e taxa congeladas na criação
   (spec 010), **exceto** se a cadeira for `daCasa=true` → grava a venda e **não** gera fee
   (FR-010).
7. Efeitos colaterais (alerta) **fire-and-forget** — nunca derrubam o webhook.

## Respostas

| status | quando | o gateway deve |
|---|---|---|
| `200 {ok:true}` | processado, **ou** retry já conhecido, **ou** evento irrelevante | parar de reenviar |
| `401` | assinatura inválida | — (é forja ou segredo derivado) |
| `404` | parceiro/credencial inexistente ou inativa | parar |
| `409` | conta do pagamento ≠ conta da credencial | parar; exige apuração humana |
| `5xx` | falha ao consultar o gateway | **reenviar** |

**`200` para evento irrelevante é deliberado:** devolver erro faz o gateway reenviar para sempre
um evento que nunca vai importar. Só `5xx` pede retry, e só para falha transitória de consulta.

⚠️ **Retry de evento divergente devolve 200, não 409** — a colisão da `@@unique` encerra antes.
Deliberado: o 409 da primeira entrega já pediu apuração humana; repeti-lo não acrescenta sinal.

## Classificação aquisição × recorrência

**Regra ordenada — para na primeira que casar:**

1. `VendaParceiro.recorrente = true` (renovação de assinatura, lida **do gateway**) →
   **`recorrencia`**. Renovação é recorrência por definição e não depende de identificar o cliente.
2. Existe `NegocioOriginado` anterior do mesmo cliente com o mesmo parceiro → **`recorrencia`**.
   Chave: `clienteDoc` quando o gateway entrega documento, senão `clienteRef` (id/e-mail no
   gateway). **As duas colunas existem em `NegocioOriginado`** (`data-model.md` §1).
3. Caso contrário → **`aquisicao`**.

⚠️ **A regra 1 existe porque "sem doc → `aquisicao`" da spec 010 foi escrita para compra única de
porcelanato.** Aplicada crua a assinatura SaaS — onde MP e Stripe entregam e-mail e quase nunca
CPF — ela cobraria **15% de aquisição em toda renovação mensal**, contra os 10% de recorrência que
o contrato do parceiro promete. A regra da 010 fica **intacta** no passo 3; o que muda é que
renovação nunca chega lá.

## Teste de contrato (o mínimo que precisa existir)

1. Assinatura inválida → 401 **e nenhuma linha gravada**.
2. Mesmo evento entregue 2× → **uma** `VendaParceiro` e **um** `NegocioOriginado` (SC-007).
3. Dois retries **simultâneos** → idem (é a `@@unique`, não o `if`, que segura).
4. Pagamento de conta diferente da credencial → 409, venda gravada com **`parceiroId` nulo** e
   `motivoDescarte='conta-divergente'`, sem negócio. **Nenhuma linha atribuída ao parceiro errado.**
5. Payer de teste → venda gravada com `motivoDescarte='payer-teste'`, **não** contada como
   receita (FR-006).
6. Cadeira `daCasa` → venda gravada, **fee zero** (FR-010).
7. Falha ao consultar o gateway → 5xx, **nada gravado**.

## Configuração por cadeira (o que é operação, não código)

Para cada cadeira: criar `CredencialGateway`, publicar a env do segredo na EasyPanel, e apontar o
webhook no painel do gateway do parceiro para a URL com o `parceiroId` correto.

⚠️ **Segredo derivado do painel faz a venda parar de ser gravada em silêncio** — é o cenário que o
comentário do webhook existente já registra. O `log.warn` do 401 é o único sinal; ele precisa
chegar a alguém.
