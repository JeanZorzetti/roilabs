# Implementation Plan: Camada Parceiro

**Branch**: `007-camada-parceiro` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-camada-parceiro/spec.md`

## Summary

Adicionar a camada que liga **cadeira → parceiro → negócio originado (pedido pago repassado) → success fee → cobrança Asaas**, sobre a app admin existente (`ROI Labs/app`), sem alterar os centros de custo do porcelanato.

Três entidades novas (`Parceiro`, `NegocioOriginado`, `FaturaSuccessFee`) + uma migração; telas admin para (a) cadastrar/sondar/ativar/riscar parceiros e gravar o % negociado, (b) repassar um `Pedido` pago a um parceiro (negócio, estágio, isenção pontual), (c) gerar a fatura mensal e emitir a cobrança. A monetização (US3) integra o **Asaas** via REST (`lib/asaas.ts`, espelhando `lib/mercadopago.ts` — sem SDK, token por env) + webhook idempotente para conciliar pagamento. O cálculo do fee é uma função **pura** (`lib/success-fee.ts`) testável com `tsx`. Painel/cadeiras passam a refletir ocupação real.

**Entrega em 2 incrementos** (o handoff previu feature grande):
1. **MVP (US1+US2)** — parceiros + repasses, **sem Asaas**. Já dá valor (estrutura de sondagem/prospecção + registro da "moeda de troca") e não trava atrás da configuração de pagamento.
2. **US3 + US4** — cálculo/fatura + cobrança Asaas + reflexo no Painel.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: `@prisma/client` v6 (existente). Integração **Asaas via REST (`fetch`)** — **sem dependência npm nova** (mesmo padrão de `mercadopago.ts`, Const. III).

**Storage**: PostgreSQL (EasyPanel). **Uma migração**: 3 tabelas novas (`parceiros`, `negocios_originados`, `faturas_success_fee`) + back-relations em `Cadeira`/`Candidatura`/`Pedido` (sem colunas novas nelas). `prisma db push` MANUAL no host; `prisma generate` antes de `next build`.

**Testing**: `node --import tsx test/success-fee.test.mjs` para o cálculo puro do fee (dinheiro — confiável local). Telas/rotas/webhook Asaas verificados em ambiente real (Docker/EasyPanel ou prod, Asaas **sandbox**) por Const. II.

**Target Platform**: Next standalone na EasyPanel; navegador admin autenticado; Asaas server-to-server (webhook sem CORS).

**Project Type**: Web app (admin dentro de `ROI Labs/app`)

**Performance Goals**: dataset pequeno (1 polo); agregação mensal por parceiro em memória; telas < 1s.

**Constraints**: **NOVAS envs** `ASAAS_API_KEY`, `ASAAS_API_URL` (sandbox×prod) e um segredo de webhook — Const. I (env-first) é o primeiro gate desta feature; a cobrança só é declarada funcionando com Asaas real (sandbox). Design system LIGHT; páginas `force-dynamic`; escrita só admin (`isAuthed`); Next 16 `params: Promise<…>`+`await`; snake_case `@@map`. Camada aditiva — **não tocar** em `lib/centros-custo.ts` nem no fluxo MP do checkout.

**Scale/Scope**: 3 modelos + 1 migração; ~3 telas admin (parceiros lista+detalhe, repasse a partir de pedidos, faturas) + rotas CRUD; 1 lib pura (`success-fee`) + 1 lib de integração (`asaas`) + 1 webhook; 1 teste `tsx`. Normalização de nicho resolvida por seleção de `Cadeira` (sem fuzzy match — ver research D5).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Conformidade |
|---|---|
| I. Env-first | **Ponto de maior atenção**: US3 exige `ASAAS_API_KEY`/`ASAAS_API_URL`/segredo de webhook. Documentar em `.env.example`, confirmar paridade com prod e validar em sandbox ANTES de declarar a cobrança pronta. US1+US2 não dependem de env nova. ✅ |
| II. Verificação em ambiente real (NÃO-NEGOCIÁVEL) | `success-fee` (dinheiro) por teste `tsx`; telas/CRUD/webhook Asaas verificados em prod/Docker com Asaas sandbox, evidência anexada. Sem alegar sucesso por build local. ✅ |
| III. Simplicidade deliberada (YAGNI) | 3 modelos justificados (parceiro, negócio, fatura são conceitos distintos). Asaas via `fetch` (sem SDK/dep nova). Sondagem = julgamento do operador (sem automação). Atribuição manual (sem engine de auto-roteamento). % por parceiro = 1 campo (sem engine de regras). Isenção = 1 flag+motivo. ✅ |
| IV. Qualidade de página voltada ao usuário | Telas admin no design system LIGHT, ricas (lista de parceiros com estágio/funil, detalhe com negócios+faturas) — não telas mínimas. ✅ |
| V. Spec-driven + entrega fechada | `specify→clarify→plan→tasks→implement`; `handoff.md` + commit/push ao fechar cada incremento. ✅ |

**Resultado**: PASS, sem violações. Complexity Tracking vazio. (Asaas não é dep npm nem abstração especulativa — é a integração de cobrança exigida pela feature.)

## Project Structure

### Documentation (this feature)

```text
specs/007-camada-parceiro/
├── plan.md
├── research.md          # D1 entidades · D2 fee puro · D3 Asaas REST+webhook · D4 exclusão reembolso · D5 normalização nicho · D6 ocupação da cadeira
├── data-model.md        # 3 modelos novos + relations; entidades existentes referenciadas
├── quickstart.md        # validação em ambiente real (sandbox Asaas)
├── contracts/
│   ├── admin-parceiros.md    # CRUD parceiros (isAuthed)
│   ├── admin-negocios.md     # repasse/estágio de negócios (isAuthed)
│   ├── admin-faturas.md      # gerar fatura + emitir cobrança (isAuthed)
│   └── asaas-webhook.md      # conciliação de pagamento (server-to-server)
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
ROI Labs/app/
├── prisma/
│   ├── schema.prisma                       # + Parceiro, NegocioOriginado, FaturaSuccessFee (+ back-relations)
│   └── seed.ts                             # (opcional) nada obrigatório; sem seed de parceiro
├── src/lib/
│   ├── success-fee.ts                      # NOVO: cálculo puro da fatura mensal (testável)
│   └── asaas.ts                            # NOVO: REST Asaas (criar cliente/cobrança, verificar), token por env
├── src/app/api/
│   ├── parceiros/route.ts                  # NOVO: GET+POST (isAuthed)
│   ├── parceiros/[id]/route.ts             # NOVO: PATCH (estágio/%/contrato) + DELETE
│   ├── negocios/route.ts                   # NOVO: POST (repassar pedido→parceiro), GET
│   ├── negocios/[id]/route.ts              # NOVO: PATCH (estágio/isenção)
│   ├── faturas/route.ts                    # NOVO: POST (gerar+emitir mês), GET
│   └── parceiros/webhook/route.ts          # NOVO: webhook Asaas (idempotente por asaas_payment_id)
├── src/app/admin/
│   ├── parceiros/page.tsx + parceiros-form.tsx        # NOVO: lista + cadastro/estágio
│   ├── parceiros/[id]/page.tsx                         # NOVO: detalhe (negócios + faturas)
│   └── pedidos/…                                       # + ação "Repassar a parceiro" na linha do pedido pago
├── src/app/admin/nav.tsx                   # + link "Parceiros"
└── test/success-fee.test.mjs               # NOVO: cobre o cálculo do fee
```

**Structure Decision**: Web app existente. Reusa os padrões já validados na 004/005/006: página server `force-dynamic` + form client (`parametros-form`/`cupons-form`), rotas CRUD com `isAuthed`, e o padrão de integração/idempotência de pagamento (`mercadopago.ts` + `pagamentos/webhook`) espelhado para o Asaas. O repasse parte da tela de **Pedidos** (onde o pedido pago já é listado).

## Complexity Tracking

> Sem violações constitucionais. Nada a justificar.
