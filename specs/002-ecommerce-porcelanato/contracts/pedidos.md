# Contrato — `/api/pedidos` (`/app`)

## POST `/api/pedidos` (público, checkout)

Criar pedido + preferência de pagamento. **Cross-origin do site estático** → requisição simples (sem preflight), igual `leads-consumidor`.

**Request**
- `Content-Type: application/x-www-form-urlencoded`
- Campos:
  | campo | obrig. | descrição |
  |---|---|---|
  | `nome` | sim | contato |
  | `whatsapp` | sim | contato |
  | `email` | não | opcional |
  | `entrega` | sim | `retirada` \| `entrega` |
  | `cep` | se `entrega` | CEP do destino |
  | `itens` | sim | JSON: `[{"slug":"...","caixas":3}, ...]` |
  | `consent` | sim | `1` (LGPD) |
  | `botcheck` | — | honeypot (vazio) |

  > **Ignorados se enviados**: qualquer `preco`/`total`/`subtotal` do cliente. O servidor recalcula (FR-005).

**Processamento**
1. Honeypot/consent: se `botcheck` preenchido ou `consent≠1` → 303 `/carrinho?erro=validacao`.
2. Parse `itens`; descarta slug inexistente; se vazio → 303 `/carrinho?erro=vazio`.
3. Recalcula por item via `precos.ts`: `caixas`, `m2 = caixas × m2_caixa`, `subtotal`.
4. Frete via `frete.ts`: `retirada`→0; CEP na tabela→valor; CEP fora→`a_combinar` (frete null).
5. `total = Σ subtotais + (frete ?? 0)`.
6. Cria `Pedido(pendente/aguardando)` + `ItemPedido[]`.
7. Cria preferência Mercado Pago (itens + `external_reference = pedido.id` + `back_urls` → `/obrigado?pedido={id}` + `notification_url` → `/api/pagamentos/webhook`); grava `mpPreferenceId`.

**Response**
- Sucesso: **303** `Location: {init_point do MP}`.
- Erro de validação: **303** `Location: {site}/carrinho?erro=...`.
- Erro do MP/servidor: **303** `/carrinho?erro=pagamento` (pedido permanece `pendente`).

## GET `/api/pedidos` (admin)
- Auth: `getAuthFromRequest()` → `auth.id` (espelha `/admin/leads`). Sem auth → 401.
- Retorna pedidos (itens, total, frete, `statusPagamento`, `statusFulfillment`, datas) para a operação. Paginação simples por data desc.

## Ações de operação (sobre um pedido)
- `confirmar` → `statusFulfillment = confirmado`.
- `reembolsar` (lote indisponível) → refund MP por `mpPaymentId` → `statusPagamento = reembolsado`, `statusFulfillment = reembolsado`.

  > Forma (rota dedicada `POST /api/pedidos/:id/acao` vs. server action) decidida em `/speckit-tasks`, espelhando como `/admin/leads` muta estado.
