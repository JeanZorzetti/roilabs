# Contrato: Faturas (deltas)

Rota: `POST /api/faturas` (gera fatura mensal + cobrança Asaas). Auth interna. Idempotente por `(parceiroId, competencia)`.

## Mudança — cálculo por negócio

Request inalterado (`parceiroId`, `competencia` YYYY-MM).

- **Validação**: troca `parceiro.comissaoPct === null` por "faltam as duas taxas". Erro: `parceiro precisa estar ativa, com as duas taxas e cpfCnpj`.
- **Cálculo**: `calcularFaturaMensal` deixa de receber `comissaoPct`. Cada `NegocioCalc` carrega `taxaAplicada` (do snapshot do negócio). Elegibilidade inalterada (`ganho && faturavel && !reembolsado && !jaFaturado`).
  - `base = Σ negócio.valor` (exibição).
  - `valor = Σ money(negócio.valor × negócio.taxaAplicada)` (arredondar por negócio).
- Emissão Asaas, transação e `status='erro'` no fallback: **inalterados**.

## Função pura (assinatura nova)

```
calcularFaturaMensal(negocios: NegocioCalc[]): FaturaCalculada
// NegocioCalc += taxaAplicada: number
// valor = Σ money(n.valor * n.taxaAplicada) sobre os elegíveis
```

## Aceitação (self-check em test/success-fee.test.mjs)

- 2 negócios do mesmo cliente novo: 1º `valor=1000 × 0.15=150`, 2º `valor=1000 × 0.10=100` → fatura `valor=250`, `base=2000`.
- Negócio não-`ganho`/reembolsado/já-faturado: excluído (igual hoje).
- Soma por negócio == total exibido (SC-002, zero drift de centavos).
- Fatura já emitida não recalcula (idempotência 409).
