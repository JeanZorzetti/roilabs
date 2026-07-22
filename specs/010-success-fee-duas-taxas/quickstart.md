# Quickstart / Validação: Success fee com duas taxas

Roteiro para provar a feature ponta a ponta. Caminho de dinheiro → o gate 1 (self-check) é obrigatório antes de qualquer deploy; o gate 3 (E2E real) é o que declara "pronto" (Const. II).

## Pré-requisitos

- `app/` com `@prisma/client` gerado; `DATABASE_URL` do `roilabs_db@…:5443` (host real).
- `prisma db push` aplicado + `node scripts/migrate-010-backfill.mjs` rodado (backfill).

## Gate 1 — self-check da função pura (local, obrigatório)

```
cd app && node --test test/success-fee.test.mjs
# (ou o runner atual do repo: node test/success-fee.test.mjs)
```

Deve cobrir:
- 2 negócios do mesmo cliente novo → 150 (15%) + 100 (10%) = fatura **250**, base **2000**.
- Negócio não-`ganho`/reembolsado/já-faturado → excluído.
- Soma por negócio == total (sem drift de centavos).
- `classificar-negocio.test.mjs`: doc vazio → aquisição; doc com histórico ganho → recorrência; doc cujo único anterior é perdido → aquisição.

## Gate 2 — smoke da migração (host real)

- Rodar o backfill 2× (idempotente): parceiros existentes ficam com `aquisicao==recorrencia==comissaoPct` antigo; nenhuma `FaturaSuccessFee` muda `valor`.
- Conferir o parceiro TapePro: `comissaoAquisicao` e `comissaoRecorrencia` = 0.15 (backfill do 0.15 atual); depois setar recorrência = 0.10 pela UML.

## Gate 3 — E2E real (EasyPanel/navegador, declara "pronto")

1. `/admin/parceiros`: definir TapePro aquisição 0.15 / recorrência 0.10; tentar salvar `1` numa taxa → barrado.
2. Criar 2 Pedidos pagos com o **mesmo** CPF/CNPJ do comprador; repassar ambos ao TapePro (`/admin/pedidos` → repasse) e marcá-los `ganho`.
   - 1º negócio → `classificacao=aquisicao`, `taxaAplicada=0.15`.
   - 2º negócio → `recorrencia`, `0.10`.
3. Gerar a fatura da competência (`/api/faturas` via UI): `valor` = soma por negócio; abrir o **demonstrativo** e conferir a taxa por negócio + total batendo (SC-002).
4. Alterar as taxas do parceiro e reabrir os negócios já criados → `taxaAplicada` inalterada (FR-005).
5. Checkout `goiania`: finalizar um pedido informando CNPJ com pontuação → `Pedido.compradorDoc` salvo só com dígitos; finalizar outro sem doc → pedido criado, `compradorDoc=null`.

## Referências

- Contratos: [contracts/](./contracts/) · Modelo: [data-model.md](./data-model.md) · Decisões: [research.md](./research.md).
