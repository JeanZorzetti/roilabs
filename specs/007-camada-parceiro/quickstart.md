# Quickstart — Validação em ambiente real: Camada Parceiro

Const. II: verificar em ambiente real (Docker/EasyPanel ou prod). Const. I: **envs Asaas primeiro**.

## Pré-requisitos
- `DATABASE_URL` correta (paridade prod).
- **US3 (cobrança)**: `ASAAS_API_KEY`, `ASAAS_API_URL` (sandbox = `https://sandbox.asaas.com/api/v3`), `ASAAS_WEBHOOK_TOKEN` configuradas; webhook do Asaas apontando para `/api/parceiros/webhook`. US1+US2 não precisam disso.

## 1. Migração (MANUAL no host)
```bash
cd "ROI Labs/app"
npx prisma db push   # cria parceiros, negocios_originados, faturas_success_fee
```

## 2. Teste da lógica pura (local, confiável)
```bash
node --import tsx test/success-fee.test.mjs
```
Cobre `calcularFaturaMensal`: inclui só `ganho ∧ faturável ∧ não-reembolsado ∧ não-faturado`; exclui isentos, perdidos, reembolsados e já faturados; `valor = base × pct`.

## 3. US1 — parceiros + sondagem (navegador admin)
- `/admin/parceiros`: criar parceiro numa cadeira (estágio `sondagem`); ativar informando o % (`ativa`); riscar um que recusou; marcar `contratoEm` num ativo → vira "ocupada".

## 4. US2 — repasse (a partir de /admin/pedidos)
- Num `Pedido` **pago**, ação "Repassar a parceiro" → escolher parceiro **ativo**; negócio criado `repassado`, `faturavel=true`, `valor`=total − frete (valor de produto). Repassar o mesmo pedido de novo (com negócio ativo) → bloqueado (409).
- Repassar outro marcando **isento** (motivo obrigatório) → `faturavel=false`.
- Tentar repassar a parceiro `riscado/pausado` → bloqueado.
- Avançar estágio até `ganho`.

## 5. US3 — fatura + cobrança Asaas (sandbox)
- `POST` gerar fatura do mês para o parceiro → soma % × valor dos negócios ganhos faturáveis; cobrança criada no **Asaas sandbox** (conferir no painel sandbox).
- Simular pagamento no sandbox → webhook chega → fatura vira `paga`; negócios não recobram.
- Conferir que negócio **isento** e de `Pedido` **reembolsado** ficaram fora.

## 6. US4 — Painel
- Cadeira com contratado → "ocupada" (nome); cadeira só com sondagem/ativa → "em prospecção" (contagem); sem parceiro → "aberta".

## Evidência p/ handoff
- Output do teste `tsx`.
- Screenshots: parceiro ativado, repasse (faturável + isento), fatura emitida no Asaas sandbox, webhook conciliando para `paga`.
