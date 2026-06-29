# Contrato — `/api/pagamentos/webhook` (`/app`)

Recebe notificações do Mercado Pago (server-to-server; sem CORS). Idempotente (D4).

## POST `/api/pagamentos/webhook`

**Request** (Mercado Pago)
- Query/body com `type=payment` e `data.id` (id do pagamento).
- Headers: `x-signature`, `x-request-id` (validação de autenticidade).

**Processamento**
1. **Valida assinatura** `x-signature` (HMAC com `MERCADOPAGO_WEBHOOK_SECRET` sobre `id` + `x-request-id` + `ts`). Inválida → **401**, sem mudar nada (FR-008).
2. Busca o pagamento no MP por `data.id` (fonte de verdade do status; não confiar no corpo).
3. Resolve o pedido por `external_reference` (= `pedido.id`).
4. **Idempotência**: se `pedido.mpPaymentId` já = `data.id` e status já aplicado → **200** no-op.
5. Mapeia status do pagamento:
   - `approved` → `statusPagamento = pago`, grava `mpPaymentId`; `statusFulfillment` segue `aguardando` (reserva, FR-012).
   - `refunded`/`charged_back` → `statusPagamento = reembolsado`, `statusFulfillment = reembolsado`.
   - `pending`/`in_process` → mantém `pendente`.
   - `rejected`/`cancelled` → mantém `pendente` (carrinho preservado).
6. Transições só avançam (nunca `pago → pendente`).

**Response**
- **200** sempre que processado (incl. no-op idempotente) — para o MP parar de reenviar.
- **401** assinatura inválida.

## Env necessárias
- `MERCADOPAGO_ACCESS_TOKEN` — criar preferência, consultar pagamento, refund.
- `MERCADOPAGO_WEBHOOK_SECRET` — validar `x-signature`.

> Constituição I: ambas via env na EasyPanel; nunca hard-coded. Debug de pagamento começa por elas + painel MP.
