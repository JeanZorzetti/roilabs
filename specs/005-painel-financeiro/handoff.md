# Handoff — Feature 005: Painel Administrativo e Financeiro

**Data**: 2026-06-30 | **Branch**: 005-painel-financeiro

## O que foi feito

### US1 — Painel cockpit (`/admin`)
- `admin/candidaturas/page.tsx` — conteúdo anterior de `/admin` movido para cá (T001)
- `admin/page.tsx` — substituído pelo Painel: candidaturas/leads novos 24h+7d e por status, GMV pago do mês, fila de fulfillment pendente, cadeiras abertas×em estudo por polo, conversão lead→pedido 7d aproximada. Cada cartão linka para a lista de detalhe.
- `admin/nav.tsx` — "Painel" → `/admin` como primeiro item; "Candidaturas" → `/admin/candidaturas`; "Financeiro" → `/admin/financeiro` (T002+T008)
- `globals.css` — classes `.painel-section`, `.painel-card-link`, `.painel-card--alert`, `.painel-alert`, `.painel-win`, `.painel-abertas`, `.painel-estudo`, `.fin-table`, `.fin-inter`, `.fin-wl`, `.fin-warn` (T004)

### US2 — Financeiro por mês (`/admin/financeiro`)
- `lib/financeiro.ts` — funções puras `agregarPorMes` e `linhasPorPedido`, reusando `calcIntermediacao`/`calcWL`/`resolverParametros` de `lib/centros-custo` (FR-011). Snapshot congelado garante estabilidade de meses passados (FR-010). Fallback em parâmetros vigentes para itens sem snapshot, contados em `semSnapshot`. (T005)
- `admin/financeiro/page.tsx` — tabela todos os meses (mais recente primeiro), GMV + líq. Intermediação + líq. WL + pedidos + aviso de sem-snapshot + totais. (T007)

### US3 — Export CSV (`GET /api/financeiro/csv`)
- `api/financeiro/csv/route.ts` — protegida por `isAuthed`; params `de`/`ate` YYYY-MM opcionais com validação → 400; responde CSV com BOM, `;`, vírgula decimal, datas dd/MM/yyyy (T009)
- Botão "↓ Baixar CSV" na página de financeiro aponta para `/api/financeiro/csv` (T010)

### Testes
- `test/financeiro.test.mjs` — 5 asserts: agrupamento por mês, estabilidade de snapshot, fallback sem snapshot, soma por modalidade, array vazio. Rodou verde. (T006)
- `package.json` script `test` atualizado para incluir `financeiro.test.mjs`

## Decisões e gotchas

- **Sem migração de schema**: feature inteiramente de leitura sobre modelos existentes.
- **Mês = `createdAt` do pedido** (não há campo `paidAt`; clarificação Q2 do spec).
- **Snapshot: `markup` não é congelado** — apenas `comissao`, `aliqIntermediacao`, `aliqWL`, `pisoSnapshot`. Mirroring exato do centros-de-custo/page.tsx para garantir FR-011.
- **Modalidade por item**: `modalidadeSnapshot ?? skuModalidadeAlvo ?? 'intermediacao'`; a `skuModalidadeAlvo` é resolvida pelo caller (page/route) do `skuMap` antes de passar para `lib/financeiro.ts`.
- **CSV pedido misto**: cada item calculado na sua própria modalidade; coluna `modalidade` reporta a predominante (`ponytail:` comment no código).
- **Cadeiras**: contagem por `open` (aberta vs em estudo) por polo; sem estado "ocupada" (fora da feature, vai para Camada Parceiro).
- **Conversão lead→pedido**: razão 7d aproximada, rotulada assim no UI.
- **Nav: ativo correto**: `usePathname() === href` — `/admin` só ativa em exatamente `/admin`, não em sub-rotas (comportamento existente do nav, correto).

## Pendências / próximos passos

- **T012 — verificação em ambiente real**: abrir `/admin` e `/admin/financeiro` no browser prod/Docker EasyPanel; conferir métricas vs banco; baixar CSV e conferir no Excel.
- **Evolução futura** (fora do escopo 005):
  - `paidAt` no webhook se a defasagem pedido→pagamento cruzando mês virar material.
  - Filtro de período na tela de financeiro (hoje é tudo ou manual via URL).
  - Ocupação de cadeira por parceiro (Camada Parceiro).
