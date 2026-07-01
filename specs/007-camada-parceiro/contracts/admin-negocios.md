# Contrato — negócios originados (repasse) (`isAuthed`)

## `POST /api/negocios` — repassar um pedido a um parceiro
Body: `{ pedidoId, parceiroId, isento?: boolean, isencaoMotivo? }`.
- Valida: `Pedido` existe e `statusPagamento='pago'`; `Parceiro` existe e `estagio='ativa'` (senão `400` — FR-003/US2-5).
- **Repasse único (FR-004a)**: recusa (`409`) se o `Pedido` já tem um negócio ativo (estágio ≠ `perdido`).
- `valor` = snapshot do **valor de produto** do `Pedido` = `total − (frete ?? 0)` (servidor, nunca do cliente; exclui frete — FR-007).
- `estagio` inicial `repassado`; `faturavel = !isento`; se `isento`, `isencaoMotivo` obrigatório.
- Sucesso `201 { ok:true, id }`. (O primeiro repasse é registrado por esta ação manual — FR-004.)

## `GET /api/negocios?parceiroId=…`
Lista negócios (para a tela de detalhe do parceiro).

## `PATCH /api/negocios/[id]` — estágio / isenção
`params: Promise<{id}>`+`await`. Body: `{ estagio?, faturavel?, isencaoMotivo? }`.
- `estagio ∈ {repassado,aceito,ganho,perdido}`; preserva histórico (FR-006).
- Não permite editar negócio já vinculado a uma fatura (`faturaId != null`) → `409`.
- `401` sem auth.
