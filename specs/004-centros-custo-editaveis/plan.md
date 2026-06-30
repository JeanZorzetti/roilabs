# Implementation Plan: Centros de custo editáveis e auditáveis

**Branch**: `004-centros-custo-editaveis` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-centros-custo-editaveis/spec.md`

## Summary

Tornar os dois centros de custo (entregues no commit `58085b4`) **editáveis sem deploy**
e **auditáveis**. Hoje os parâmetros são constantes (`PARAMS` em
`app/src/lib/centros-custo.ts`). A feature troca a **origem** dos parâmetros — de
constante para **configuração persistida em Postgres com camadas de override
`SKU > linha > global`** —, mantendo as **fórmulas `calcIntermediacao`/`calcWL`
inalteradas** (FR-016). Adiciona: **piso real por SKU** (override do markup), **linha**
(agrupa parâmetros), **modalidade-alvo por SKU** (flag manual premium→WL), **presets de
cenário** tributário, e **snapshot por item no pagamento** para o histórico não mudar ao
editar parâmetros. O agregado de pagos ganha **duas leituras**: real por modalidade
oficial + referência hipotética. Tudo dentro do `/app` Next 16 existente; **2 tabelas
novas** (`parametro_centro_custo`, `sku_config`) + **colunas snapshot aditivas** em
`itens_pedido`; nenhuma dependência nova, nenhum segredo novo.

## Technical Context

**Language/Version**: TypeScript. Next 16 App Router (`/app`, standalone). Node 20 no build.

**Primary Dependencies**: Prisma 6 + `@/lib/prisma` (singleton), auth de cookie HMAC
(`@/lib/session`) — **já existentes**. **Zero dependência nova** (sem zod, sem libs de
form; validação de faixa é manual, FR-003).

**Storage**: Postgres `roilabs_db` (existente). **2 tabelas novas** + colunas em
`itens_pedido`, aplicadas por `prisma db push` **MANUAL** de máquina que alcança o host
(Constituição — não confiar no runner standalone). Seed idempotente do **global** com os
defaults dos docs.

**Testing**: Verificação em ambiente real (Constituição II) — Docker/EasyPanel + navegador
em prod. Self-check runnable (ponytail) estendido em `test/centros-custo.test.mjs`:
(a) precedência `SKU > linha > global` e herança de campo nulo; (b) reprodução da âncora
9.100/7.000 com defaults; (c) estabilidade do snapshot (editar parâmetro não muda a
apuração congelada); (d) SKU sem modalidade-alvo cai em Intermediação.

**Target Platform**: rotas Next standalone em `app.roilabs.com.br`. Sem mudança no
`site-goiania`.

**Project Type**: Web — backend/admin existente (`/app`) estendido. Sem frontend público.

**Performance Goals**: SC-001 — alterar uma % e ver o impacto em ≤ 30 s. A página
`/admin/centros-de-custo` é `force-dynamic`: lê parâmetros + ~30 SKUs + itens de pedidos
pagos por request; volume baixo (1 polo), sem meta de throughput.

**Constraints**: OneDrive corrompe `node_modules` → verificação só confiável em
Docker/navegador (Constituição II). Patterns Next 16 obrigatórios: `params: Promise<…>` +
`await params`; `getAuthFromRequest()`; prisma singleton; `prisma generate` antes de
`next build`; tabelas snake_case `@@map`. Toda escrita de parâmetro exige **sessão válida**
(FR-005) e **validação de faixa** server-side (FR-003) — nunca confiar no cliente. PT-BR
na UI; código/commits em inglês.

**Scale/Scope**: 1 polo (Goiânia), ~30 SKUs, poucos pedidos pagos. Edição feita por 1
operador (admin único). Sem concorrência relevante (last-write-wins, edge case coberto).

## Constitution Check

*GATE: passar antes da Fase 0; re-checar após a Fase 1.*

| Princípio | Avaliação |
|---|---|
| **I. Env-first** | OK. **Sem segredo novo**: reusa `DATABASE_URL` + `AUTH_SECRET`/`ADMIN_PASSWORD`. Debug de persistência começa pelos `.env` da EasyPanel e pela conexão ao `roilabs_db`. |
| **II. Verificação real (NÃO-NEGOCIÁVEL)** | OK. Nada declarado "funcionando" via build local (OneDrive). Verificação = `prisma db push` + seed no host real, edição/persistência/snapshot no navegador em prod, `npm test` verde (ver `quickstart.md`). |
| **III. Simplicidade (YAGNI)** | OK. **2 tabelas** (exigidas: editar sem deploy ⇒ persistência; camadas ⇒ spec) + **colunas aditivas** (snapshot). Fora: versionamento de diffs, multiusuário/papéis, ERP, gráficos/export (Out of Scope da spec). Resolução de parâmetros é função pura sobre `centros-custo.ts` (fórmula intacta). Tetos marcados `ponytail:` (ver `research.md`). |
| **IV. Qualidade voltada ao usuário** | OK. A página de edição estende o design da `/admin/centros-de-custo` atual (mesmos tokens/tabela); estados claros (real ⟂ hipotético rotulados; estimado ⟂ real; prejuízo sinalizado). |
| **V. Spec-driven + entrega fechada** | OK. No fluxo Spec Kit; `handoff.md` + commit/push ao fechar a implementação. |

**Resultado: PASS.** Sem violações → sem Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-centros-custo-editaveis/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 (decisões D1–D7)
├── data-model.md        # Fase 1 (2 tabelas novas + delta itens_pedido + regra de resolução)
├── quickstart.md        # Fase 1 (verificação em ambiente real)
├── contracts/           # Fase 1
│   ├── parametros.md        # GET/PATCH /api/centros-custo/parametros (global + linhas)
│   └── sku-config.md        # GET/PATCH /api/centros-custo/sku/[slug] (piso/modalidade/override)
└── tasks.md             # Fase 2 (/speckit-tasks — NÃO criado aqui)
```

### Source Code (repository root)

```text
app/                                         # EXISTENTE (Next 16) — estendido
├── prisma/
│   ├── schema.prisma                        # ESTENDE: + ParametroCentroCusto, + SkuConfig;
│   │                                        #          itens_pedido += colunas snapshot (nullable)
│   └── seed.ts                              # ESTENDE: upsert idempotente do global (defaults dos docs)
└── src/
    ├── lib/
    │   ├── centros-custo.ts                 # ESTENDE: resolverParametros/Modalidade/Piso (camadas);
    │   │                                    #          PARAMS vira o DEFAULT (fallback sem DB); fórmulas intactas
    │   ├── precos.ts                        # EXISTENTE — inalterada (listarProdutos já exportado)
    │   └── session.ts / auth.ts             # EXISTENTE — reuso para proteger as rotas de escrita
    └── app/
        ├── api/centros-custo/
        │   ├── parametros/route.ts          # NOVO: GET (lê) + PATCH (grava global/linha) — auth + faixa
        │   └── sku/[slug]/route.ts          # NOVO: PATCH piso/modalidade/override por SKU — auth + faixa
        ├── api/pagamentos/webhook/route.ts  # ESTENDE: ao virar 'pago', congela snapshot por item
        └── admin/centros-de-custo/
            ├── page.tsx                     # ESTENDE: form de parâmetros + 2 leituras de agregado + tabela editável
            ├── parametros-form.tsx          # NOVO (client): edita global/linha/cenário, valida faixas
            └── sku-row.tsx                  # NOVO (client): edita piso/modalidade/override por SKU
test/
└── centros-custo.test.mjs                   # ESTENDE: precedência de camadas + snapshot estável + âncora
```

**Structure Decision**: tudo dentro do `/app` existente (sem novo app, sem tocar
`site-goiania`). A camada de **cálculo** (`centros-custo.ts`) permanece pura e com a
**fórmula intacta** (FR-016); só ganha um **resolvedor de parâmetros** que combina as
camadas e cai no `PARAMS` (defaults dos docs) quando o DB não tem nada (FR-004). O
**servidor é a única fonte de verdade** dos parâmetros: a UI só edita via rotas
autenticadas com validação de faixa (FR-003/005). O **snapshot** é gravado no ponto onde
o pagamento é confirmado (`webhook`), espelhando o snapshot de `precoM2` da 002.
`// ponytail: parâmetros em 2 tabelas + snapshot por item; promover a versionamento/auditoria por usuário só se a operação precisar de trilha de quem-mudou-o-quê.`

## Phases

- **Fase 0 — Pesquisa/decisões** (`research.md`): D1 forma de persistência (2 tabelas vs config única); D2 onde e o que congelar no snapshot (por item em `itens_pedido`); D3 defaults via fallback `PARAMS` + seed do global; D4 valores dos presets de cenário (de `projecao-financeira`); D5 regra de resolução e herança de campo nulo; D6 superfície de edição (rotas REST + islands client); D7 as duas leituras do agregado.
- **Fase 1 — Design** (`data-model.md`, `contracts/`, `quickstart.md`): `ParametroCentroCusto` (global+linha) e `SkuConfig` (piso/modalidade/override) modelados; delta de `itens_pedido` (colunas snapshot nullable); contratos das 2 rotas de escrita; roteiro de verificação real.
- **Fase 2 — Tasks** (`/speckit-tasks`): NÃO gerado aqui. Sequência prevista por user story (P1 editar global + piso por SKU → P2 linha + snapshot + modalidade/agregado → P3 presets), schema/seed e resolvedor antes da UI.

## Complexity Tracking

> Sem violações de Constitution Check — seção não aplicável.
