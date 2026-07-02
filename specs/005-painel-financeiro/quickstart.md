# Quickstart — Validação: Painel Administrativo e Financeiro

Guia de validação end-to-end. Detalhes de fórmula/estruturas em [data-model.md](./data-model.md) e [contracts/financeiro-csv.md](./contracts/financeiro-csv.md).

## Pré-requisitos
- App `ROI Labs/app` rodando contra o Postgres real (EasyPanel) ou Docker — **não confiar em build local** (Constituição II).
- Sessão admin válida (login em `/login`).

## 1. Teste de unidade da lógica (local, confiável)
```bash
cd "ROI Labs/app"
node --import tsx test/financeiro.test.mjs
```
**Esperado**: `all assertions passed`. Cobre:
- Agrupamento por mês (`YYYY-MM` a partir de `createdAt`).
- Estabilidade de snapshot: alterar parâmetros vigentes não muda meses passados.
- Fallback sem snapshot: item legado usa parâmetros vigentes e conta em `semSnapshot`.
- Soma por modalidade: cada item no seu centro oficial; total Interm. + WL coerente.

## 2. Painel (`/admin`) — navegador em produção
- Acesse `/admin` autenticado → deve carregar o **Painel** (não mais a lista de candidaturas).
- Confira contra contagem manual no banco:
  - Candidaturas/Leads novos 24h e 7d, e por status.
  - GMV pago e nº de pedidos do mês corrente.
  - Pedidos pagos aguardando fulfillment (fila de ação).
  - Cadeiras abertas (`open=true`) × em estudo (`open=false`) por polo.
  - Conversão lead→pedido (rotulada "aproximada").
- Clique cada cartão → cai na lista certa (`/admin/candidaturas`, `/admin/leads`, `/admin/pedidos`, `/admin/cadeiras`).
- Banco zerado em uma janela → cartões mostram **0**, sem erro (FR-008).

## 3. Financeiro (`/admin/financeiro`) — navegador em produção
- Tabela por mês: GMV pago, líquido Intermediação, líquido White Label, nº pedidos.
- Edite um parâmetro em `/admin/centros-de-custo` e recarregue o Financeiro → **meses passados não mudam** (estabilidade de snapshot).
- Itens sem snapshot aparecem sinalizados.

## 4. Export CSV
- Botão "baixar CSV" → baixa `text/csv` (uma linha por pedido pago).
- Abrir no Excel pt-BR: acentos corretos (BOM), `;` como separador, datas `dd/MM/yyyy`.
- **Reconciliação**: somar `gmv` e `liquido` do CSV do período = totais da tela (SC-004).

## Definition of Done (Constituição II + V)
- [ ] `financeiro.test.mjs` verde local.
- [ ] Painel e Financeiro conferidos no navegador em produção (ou Docker), com print/observação anexada.
- [ ] CSV reconcilia com a tela.
- [ ] `handoff.md` escrito; commit + push.
