# Quickstart — verificar em ambiente real (Constituição II)

Sem cadeira de unidade `assinatura` publicada em produção (spec Assumptions), a verificação
ponta a ponta usa a MESMA cadeira de teste que a 013 usou (`teste-saas`, T021/T024) — declará-la
de novo, temporariamente, `publicada: false` até a hora do teste, remover depois. Nenhuma prova
usa cartão real (restrição cancelada, herdada da 013).

## Pré-requisitos

- `MERCADOPAGO_ACCESS_TOKEN` de **sandbox** válido (não o de produção — evita cobrança real).
- `prisma db push` já rodado manualmente com `Assinatura`/`CicloCobranca` no banco.
- `CRON_SECRET` presente (reaproveitado do digest).

## 1. Checkout cria a autorização, não uma cobrança única

```bash
# Simula o POST do carrinho estático para a cadeira de teste
curl -X POST https://app.roilabs.com.br/api/pedidos \
  -d "cadeira=teste-saas" -d "nome=Teste" -d "whatsapp=5562999999999" \
  -d "email=teste@example.com" -d "consent=1" \
  -d 'itens=[{"slug":"teste-saas-basico","quantidade":1}]'
```
**Esperado**: 303 para uma URL `mercadopago.com/subscriptions/checkout?preapproval_id=...`
(não `checkout/v1/...` de preference). Ler no Postgres: `itens_pedido.assinatura_ref` já
preenchido com o `preapproval_id`, `assinatura_estado='ativa'`.

## 2. Autorizar em sandbox e conferir o 1º ciclo

Completar a autorização com um [cartão de teste do MP](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test/cards)
(sandbox). Esperado no Postgres:

```sql
select estado, mp_preapproval_id, proxima_cobranca from assinaturas where item_pedido_id = '<id>';
select resultado, mp_payment_id from ciclos_cobranca where assinatura_id = '<id>';
-- 1 linha, resultado='sucesso'
```

## 3. Confirmar o nome do evento webhook (risco do research.md)

Ler o log do webhook (`log.info`/`log.warn`) no momento da autorização acima — o `bodyType`
recebido é a resposta ao risco registrado no plan.md. Se vier um terceiro nome não previsto,
ajustar o filtro em `webhook/route.ts` ANTES de considerar a Fase 2 fechada.

## 4. Forçar falha e conferir a máquina de estado

Sandbox MP tem cartões que simulam recusa. Depois de uma falha registrada:

```sql
select estado, janela_falha_desde from assinaturas where id = '<id>';
-- estado='inadimplente', janela_falha_desde preenchido
```
E o e-mail de aviso (FR-004) chegou (`RESEND_API_KEY` de teste, ou log do Resend rejeitando por
chave ausente — confere que a chamada foi tentada).

## 5. Cron cancela quem esgotou a janela

```bash
curl -X POST https://app.roilabs.com.br/api/cron/assinaturas -H "X-Cron-Secret: $CRON_SECRET"
```
Rodar duas vezes: uma com `janela_falha_desde` dentro da janela (nada muda) e outra com a data
manualmente retrocedida no banco além da janela (a assinatura vira `cancelada`,
`proxima_cobranca` vira `null`). Conferir que `cancelPreapproval` foi chamado (log) antes do
update.

## 6. Link de cancelamento

Abrir `https://app.roilabs.com.br/assinatura/cancelar?token=<cancel_token da linha 2>` no
navegador (produção real, não build local — Constituição II), confirmar cancelamento, e repetir
a query do passo 2: `estado='cancelada'`, `proxima_cobranca` nulo. Tentar de novo com um token
trocado por 1 caractere: esperado 404, nenhuma linha alterada.

## 7. Limpeza

Remover a cadeira `teste-saas` de `lojas.ts` (mesmo passo que a 013 já fez em T024) e as linhas
de teste do Postgres, para não sujar SC-001/SC-003 quando a 1ª cadeira real chegar.
