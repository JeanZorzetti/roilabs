# Contrato — webhook Asaas (server-to-server, sem CORS)

Espelha `api/pagamentos/webhook` (MP): valida autenticidade ANTES de tocar estado; idempotente.

## `POST /api/parceiros/webhook`
- **Auth**: header `asaas-access-token` deve bater com `process.env.ASAAS_WEBHOOK_TOKEN` (senão `401`). (Asaas envia o token configurado no painel.)
- Body Asaas: `{ event, payment: { id, status, externalReference, ... } }`.
- Só interessa evento de pagamento confirmado/recebido (`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`) e estorno (`PAYMENT_REFUNDED`).
- Localiza a `FaturaSuccessFee` por `asaasPaymentId = payment.id` (ou `externalReference = fatura.id`).
- **Idempotente**: se a fatura já está `paga` com esse `asaasPaymentId` ⇒ no-op `{ ok:true }`.
- Pagamento confirmado ⇒ `status='paga'` (avança só; nunca paga→emitida). Os negócios já estão vinculados (marcados como faturados na emissão) — não recobrar (SC-006).
- Retorna `200 { ok:true }` sempre que processado/ignorado; nunca vaza estado sem token válido.

**Env necessárias** (Const. I): `ASAAS_API_KEY`, `ASAAS_API_URL` (sandbox×prod), `ASAAS_WEBHOOK_TOKEN`. Documentar em `.env.example`.
