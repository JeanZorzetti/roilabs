# Implementation Plan: Painel Administrativo e Financeiro

**Branch**: `005-painel-financeiro` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-painel-financeiro/spec.md`

## Summary

Duas telas server-rendered no admin existente, ambas pura agregação sobre dados que já existem (sem schema novo, sem dependência nova):

1. **Painel** (`/admin`, vira a home): cartões de estado do negócio — candidaturas/leads novos (24h/7d) e por status, GMV pago e nº de pedidos do mês, fila de pedidos pagos aguardando fulfillment, cadeiras abertas × em estudo por polo, conversão lead→pedido aproximada. Cada cartão linka para a lista de detalhe.
2. **Financeiro** (`/admin/financeiro`): resultado real por mês (GMV pago, líquido Intermediação × White Label, nº pedidos) calculado a partir do **snapshot congelado de cada `ItemPedido`**, reusando `calcIntermediacao`/`calcWL`/`resolverParametros` de `lib/centros-custo` (fonte única — FR-011). Botão de export CSV (uma linha por pedido pago) via rota API.

Abordagem técnica: extrair uma função pura `lib/financeiro.ts` (agrega itens pagos por mês usando as fórmulas existentes) — único pedaço de lógica nova, coberto por teste `tsx`. As páginas são thin server components no padrão dos admins atuais (`force-dynamic`, Prisma singleton, design system LIGHT). Auth herdada do `admin/layout.tsx` (`requireAuth`); CSV protegido por `isAuthed`.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: `@prisma/client` v6 (existente) — **nenhuma dependência nova** (Constituição III)

**Storage**: PostgreSQL (EasyPanel), modelos existentes (`Candidatura`, `LeadConsumidor`, `Pedido`/`ItemPedido`, `Cadeira`, `ParametroCentroCusto`, `SkuConfig`) — **sem migração** (clarificações fixaram `createdAt` como mês e nenhum estado de ocupação)

**Testing**: `node --import tsx test/*.test.mjs` para a lógica pura nova (`lib/financeiro.ts`) — confiável local; UI verificada em ambiente real (Docker/EasyPanel ou navegador prod) por Constituição II

**Target Platform**: Next standalone na EasyPanel; navegador (admin autenticado)

**Project Type**: Web app (painel admin dentro de `ROI Labs/app`)

**Performance Goals**: Agregação server-side sobre dataset pequeno (1 polo, dezenas de pedidos); cada tela < 1s; SC-001 leitura do estado em < 10s

**Constraints**: design system LIGHT (`globals.css`: `.page/.card/.cc-*`, sem inline escuro — Constituição IV); páginas `force-dynamic`; acesso só admin autenticado; reuso obrigatório das fórmulas de centro de custo (FR-011)

**Scale/Scope**: 2 páginas novas + 1 rota CSV + 1 lib pura + mover a página de candidaturas; polo único hoje, agrupamento por polo já genérico

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Conformidade |
|---|---|
| I. Env-first | N/A — nenhuma env/config nova; nada a debugar de conexão. ✅ |
| II. Verificação em ambiente real (NÃO-NEGOCIÁVEL) | Lógica pura de `lib/financeiro.ts` validada por teste `tsx` local; **painel/financeiro/CSV verificados em prod (navegador) ou Docker EasyPanel** antes de declarar pronto. Sem alegar sucesso por build local. ✅ |
| III. Simplicidade deliberada (YAGNI) | Sem dep nova; sem schema novo; reuso das fórmulas existentes; 1 lib nova justificada (agrupamento por mês + fonte única). Sem abstração especulativa. ✅ |
| IV. Qualidade de página voltada ao usuário | Painel e financeiro com design system LIGHT existente, cartões ricos e legíveis (não tela mínima). ✅ |
| V. Spec-driven + entrega fechada | Seguindo `specify→clarify→plan→tasks→implement`; `handoff.md` + commit/push ao fechar. ✅ |

**Resultado**: PASS, sem violações. Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/005-painel-financeiro/
├── plan.md              # Este arquivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1 (entidades existentes + derivações; sem migração)
├── quickstart.md        # Phase 1 (guia de validação real)
├── contracts/
│   └── financeiro-csv.md # Phase 1 (contrato da rota de export)
└── tasks.md             # Phase 2 (/speckit-tasks — não criado aqui)
```

### Source Code (repository root: `ROI Labs/app`)

```text
ROI Labs/app/src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                 # MODIFICAR: vira o Painel (era Candidaturas)
│   │   ├── candidaturas/page.tsx    # NOVO: conteúdo atual de /admin movido p/ cá
│   │   ├── painel-cards.tsx         # NOVO (se preciso): cartões/links do painel (server)
│   │   ├── nav.tsx                  # MODIFICAR: + "Painel" (home) e "Financeiro"; ajustar link Candidaturas
│   │   └── financeiro/
│   │       └── page.tsx             # NOVO: tabela por mês + botão export
│   └── api/
│       └── financeiro/
│           └── csv/route.ts         # NOVO: GET → text/csv (1 linha por pedido pago), isAuthed
└── lib/
    └── financeiro.ts                # NOVO: agregação pura por mês reusando lib/centros-custo
```

**Structure Decision**: Tudo dentro do app Next existente (`ROI Labs/app`), seguindo os padrões dos admins atuais. A **home `/admin` passa a ser o Painel** (requisito "tela home do /admin"); a página de Candidaturas atual é movida para `/admin/candidaturas` e o login continua caindo em `/admin` (agora o cockpit). `lib/financeiro.ts` é a única peça de lógica nova e concentra a fórmula (sem duplicar `calcIntermediacao`/`calcWL`).

## Complexity Tracking

> Sem violações de constituição — nada a justificar.
