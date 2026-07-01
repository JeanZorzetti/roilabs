# Contrato — faturas / cobrança Asaas (`isAuthed`)

## `POST /api/faturas` — gerar a fatura mensal e emitir cobrança
Body: `{ parceiroId, competencia }` (`'YYYY-MM'`).
- Exige `Parceiro.estagio='ativa'`, `comissaoPct != null` e `cpfCnpj != null` (senão `400`; documento é obrigatório p/ criar cliente Asaas).
- Seleciona negócios elegíveis (`estagio='ganho'` ∧ `faturavel` ∧ pedido não reembolsado ∧ `faturaId=null`) via `calcularFaturaMensal` (lib pura).
- Se nenhum elegível ⇒ `400 { ok:false, motivo:'sem negócios faturáveis' }`.
- Cria `FaturaSuccessFee` (`base`, `valor`, `status='emitida'`), vincula os negócios (`faturaId`), e **emite a cobrança no Asaas** (`garantirCliente` + `criarCobranca`) gravando `asaasPaymentId`.
- Idempotência: `@@unique([parceiroId, competencia])` — re-gerar o mesmo mês ⇒ `409`.
- Falha no Asaas ⇒ fatura fica `status='erro'` (negócios não marcados como pagos); retentável.
- Sucesso `201 { ok:true, id, valor }`.

## `GET /api/faturas?parceiroId=…`
Lista faturas do parceiro (competência, valor, status, link da cobrança).
