# Implementation Plan: Cupons no admin

**Branch**: `006-cupons-admin` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-cupons-admin/spec.md`

## Summary

Migrar o knob de cupons hoje hard-coded em [`lib/cupons.ts`](../../app/src/lib/cupons.ts) (`CUPONS` record) para uma tabela `Cupom` no Postgres + CRUD em `/admin/cupons`, para criar/editar/expirar/apagar cupons sem deploy. `validarCupom` continua sendo a autoridade única no servidor, agora lendo do banco.

Abordagem técnica (a mais barata que funciona):

1. **Refatorar `lib/cupons.ts` em duas peças**: uma função **pura** `avaliarCupom(cupom, subtotalProduto)` que mantém EXATAMENTE as regras de hoje (ativo, janelas de validade, mínimo, desconto clampado a `[0, subtotal]`) — testável com `tsx`; e `validarCupom(codigo, subtotalProduto)` que passa a ser **async**, busca o cupom no DB (`prisma.cupom.findUnique`) e delega para `avaliarCupom`. Isso preserva um teste puro confiável (Const. II) e o padrão `lib/financeiro.ts` (lógica pura + teste).
2. **Ajustar os 2 call sites** para `await validarCupom(...)`: [`api/cupom/validar/route.ts`](../../app/src/app/api/cupom/validar/route.ts) (CORS, exibição) e [`api/pedidos/route.ts`](../../app/src/app/api/pedidos/route.ts) (re-validação no checkout). O snapshot `Pedido.cupomCodigo/desconto` fica intacto.
3. **Modelo `Cupom`** (snake_case `@@map("cupons")`) espelhando o shape atual; migração via `prisma db push` MANUAL; **seed idempotente do `OBRA10`** (continuidade).
4. **Tela `/admin/cupons`** (server component `force-dynamic`, design system LIGHT, padrão `centros-de-custo`) + rotas API CRUD com `isAuthed`.

**Guard novo introduzido pela feature** (ver research.md D3): tornar cupons editáveis torna alcançável `desconto == subtotal` (percentual 100 ou fixo ≥ subtotal → clampado). O mapeamento Mercado Pago no checkout hoje assume `desconto < subtotal` (comentário `ponytail:` em `pedidos/route.ts:98`). Tratamento: um cupom que zeraria o produto é tratado no checkout como cupom inválido (cobra sem desconto + `avisoCupom`), reusando o caminho existente — sem linha de preço 0 no MP.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: `@prisma/client` v6 (existente) — **nenhuma dependência nova** (Const. III); sem lib de CSV/validação externa

**Storage**: PostgreSQL (EasyPanel). **Uma migração**: nova tabela `cupons`. Aplicada por `prisma db push` MANUAL de máquina que alcança o host (runner standalone NÃO aplica schema — memória `sofia_next_db_push_runner_fails`). `prisma generate` antes de `next build` (já no script `build`)

**Testing**: `node --import tsx test/cupons.test.mjs` para `avaliarCupom` (lógica pura de dinheiro — confiável local). Rotas/tela verificadas em ambiente real (navegador prod ou Docker EasyPanel) por Const. II

**Target Platform**: Next standalone na EasyPanel; site estático `goiania.roilabs.com.br` (consome `/api/cupom/validar` cross-origin); navegador admin autenticado

**Project Type**: Web app (admin dentro de `ROI Labs/app`)

**Performance Goals**: tabela minúscula (1 polo, poucos cupons); validação = 1 `findUnique` indexado por `codigo` único (< 50ms); telas < 1s

**Constraints**: servidor = autoridade única, código do cupom NUNCA no bundle do front (FR-007); os DOIS call sites de validação continuam funcionando; design system LIGHT (`globals.css`, sem inline escuro — Const. IV); páginas `force-dynamic`; escrita só admin autenticado (`isAuthed`); Next 16 `params: Promise<…>` + `await params` na rota dinâmica

**Scale/Scope**: 1 modelo novo + 1 migração + seed; refactor de 1 lib (pura + async) + 2 call sites ajustados; 1 tela admin + 1 form client + 2 rotas API (`/api/cupons`, `/api/cupons/[id]`); 1 teste `tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Conformidade |
|---|---|
| I. Env-first | `DATABASE_URL` já configurada (usada por todos os modelos atuais); nenhuma env nova. Risco de config = aplicar a migração no host certo → `db push` MANUAL documentado. ✅ |
| II. Verificação em ambiente real (NÃO-NEGOCIÁVEL) | `avaliarCupom` (dinheiro) coberto por teste `tsx` local confiável; **tela/rotas/CORS/checkout verificados em prod ou Docker** com evidência antes de declarar pronto. Sem alegar sucesso por build local (OneDrive corrompe `node_modules`). ✅ |
| III. Simplicidade deliberada (YAGNI) | Sem dep nova; 1 tabela só (sem contador de resgates — clarify fixou uso ilimitado); reuso dos padrões `centros-de-custo`/`seats`; refactor mínimo (extrai 1 fn pura). Guard 100%-cupom marcado com `ponytail:` + caminho de upgrade. ✅ |
| IV. Qualidade de página voltada ao usuário | `/admin/cupons` no design system LIGHT existente, lista + form ricos (não tela mínima). Site voltado ao cliente NÃO muda (mesmo contrato de `/api/cupom/validar`). ✅ |
| V. Spec-driven + entrega fechada | `specify→clarify→plan→tasks→implement`; `handoff.md` + commit/push ao fechar. ✅ |

**Resultado**: PASS, sem violações. Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/006-cupons-admin/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 (decisões: refactor puro, tipo de coluna de data, guard 100%)
├── data-model.md        # Phase 1 (modelo Cupom + mapeamento do shape atual)
├── quickstart.md        # Phase 1 (guia de validação em ambiente real)
├── contracts/
│   ├── cupom-validar.md  # contrato EXISTENTE (CORS) — deve permanecer idêntico
│   └── admin-cupons.md   # contrato NOVO do CRUD (isAuthed)
├── checklists/
│   └── requirements.md   # (do /speckit-specify)
└── tasks.md             # Phase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
ROI Labs/app/
├── prisma/
│   ├── schema.prisma                       # + model Cupom (@@map "cupons")
│   └── seed.ts                             # + seed idempotente do OBRA10
├── src/lib/
│   └── cupons.ts                           # refactor: avaliarCupom (pura) + validarCupom (async, lê DB)
├── src/app/api/
│   ├── cupom/validar/route.ts              # ajuste: await validarCupom (contrato inalterado)
│   ├── pedidos/route.ts                    # ajuste: await validarCupom + guard 100%-cupom no MP
│   └── cupons/
│       ├── route.ts                        # NOVO: GET (lista) + POST (criar), isAuthed
│       └── [id]/route.ts                   # NOVO: PATCH (editar) + DELETE (apagar), isAuthed
├── src/app/admin/cupons/
│   ├── page.tsx                            # NOVO: server component force-dynamic (lista)
│   └── cupons-form.tsx                     # NOVO: client form (criar/editar/ativar/apagar)
├── src/app/admin/nav.tsx                   # + link "Cupons"
└── test/
    └── cupons.test.mjs                     # NOVO: cobre avaliarCupom (regras + clamp)
```

**Structure Decision**: Web app existente (`ROI Labs/app`, Next 16). A tela reusa o padrão de `admin/centros-de-custo` (page server + form client) e o CRUD reusa o padrão de `api/centros-custo/parametros` (rota com validação server-side + `isAuthed`), com uma rota dinâmica `[id]` para editar/apagar. Seed segue `prisma/seed.ts` (idempotente, `findFirst`+`create`/`update`).

## Complexity Tracking

> Sem violações constitucionais. Nada a justificar.
