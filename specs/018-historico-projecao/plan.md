# Implementation Plan: Histórico de consultas da Projeção

**Branch**: `018-historico-projecao` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/018-historico-projecao/spec.md`

## Summary

A rota paga da Projeção grava a resposta da DataForSEO numa tabela nova (`projecao_consultas`) e devolve o `id`. A tela
troca a URL para `/admin/projecao?consulta=<id>`; essa URL, aberta depois, carrega a consulta do banco no servidor e
entrega à mesma tela como estado inicial, sem chamada paga. A lista mora em `/admin/projecao/consultas` (server
component), e cada linha recalcula a projeção com `projetar()`, a conta pura da 017, e mostra a faixa conservador–otimista.

## Technical Context

**Language/Version**: TypeScript 5.7, Node 22

**Primary Dependencies**: Next 16 (App Router, standalone), React 19, Prisma 6 (`@prisma/client`), Tailwind 3. Nada novo.

**Storage**: Postgres `roilabs_db` (o mesmo do admin). Uma tabela nova, aplicada à mão (constituição). Antes do
`db push`, `prisma migrate diff` contra o banco de produção para ver o SQL exato: se o diff trouxer qualquer coisa além
do `CREATE TABLE projecao_consultas`, aplicar só o `CREATE` via `db execute` e registrar o drift no handoff.

**Testing**: `node --import tsx test/projecao.test.mjs` (a suíte da 017) ganha o caso do resumo da lista, com um exemplo
sintético (o repo é público; os termos reais não entram nele). Verificação de verdade em produção (constituição II).

**Target Platform**: EasyPanel (Docker), `app.roilabs.com.br`. O push em `main` publica em ~2 min.

**Project Type**: web app (monorepo, pasta `app/`).

**Performance Goals**: a lista com 200 consultas (teto) recalcula 200 × `projetar()` no servidor, que é conta pura e roda
em milissegundos. Sem cache.

**Constraints**: termos nunca no log (017 FR-013); o horário é mostrado em America/Sao_Paulo, e o servidor roda em UTC.

**Scale/Scope**: 1 operador, poucas consultas por semana.

## Constitution Check

| Princípio | Como o plano cumpre |
|---|---|
| I. Env primeiro | A rota nova não pede env var nova. Usa `DATABASE_URL`, que já existe no app. |
| II. Verificação real | "Pronto" = consulta real em produção entrando no histórico, a lista e a consulta aberta vistas no navegador nas 3 larguras. |
| III. YAGNI | Uma tabela e uma página nova. O detalhe reaproveita a tela da 017, e não há tela de detalhe duplicada, paginação, busca, edição ou exclusão. Teto de 200 linhas marcado com `ponytail:`. |
| IV. Qualidade de página | Lista com hierarquia (quem → quando → o que deu), estados vazio, erro e não encontrada, e procedência na tela. |
| V. Spec-driven | spec → plan → tasks → implement; handoff + commit + push no fim. |

Nenhuma violação.

## Decisões (research)

- **D1. Gravar no servidor, na rota paga.** Gravar pelo cliente depois da resposta dependeria da aba aberta, e FR-001
  pede 100%. Falha ao gravar vira `id: null` na resposta, sem 5xx, porque a DataForSEO já cobrou e a projeção vale.
- **D2. Gravar a resposta da fonte, não a projeção.** Volume, mensal e dificuldade não mudam. A projeção é recalculada
  com as premissas do código (spec, Clarifications). Os termos vão num `jsonb` com o mesmo formato de `TermoConsultado`.
- **D3. Detalhe = a tela da 017 com estado inicial.** `page.tsx` lê `searchParams.consulta`, busca no banco e passa
  `inicial` ao `<Projecao>`. Nada de rota de API de leitura: o server component lê o Prisma direto.
- **D4. URL da consulta nova.** Depois de gravar, `history.replaceState` põe `?consulta=<id>`: recarregar a página ou
  copiar o link reabre a mesma consulta sem pagar. O Next 16 integra `replaceState` ao roteador.
- **D5. Lista em server component, sem JS no cliente.** A linha inteira é um link para a consulta. No celular, a
  `pr-table` já existente vira cartões com `data-label`.
- **D6. Resumo da linha em `lib/projecao.ts`** (`resumirConsulta`): demanda somada, média do ano 1 no conservador e no
  otimista, unidade e se o nicho gravado ainda existe. É a única lógica nova com ramo, e leva o teste.
- **D7. Importar as duas consultas da Karla** com um script único, que lê os JSONs da resposta real e grava com
  `criadaEm = consultadoEm`. **O script e os JSONs ficam fora do repo:** o `roilabs` é público no GitHub, e os termos
  contam a estratégia do parceiro (017, FR-013). Rodou uma vez, do scratchpad da sessão de 28/09.

## Project Structure

### Documentation (this feature)

```text
specs/018-historico-projecao/
├── spec.md
├── plan.md
├── data-model.md
├── contracts/api.md
├── quickstart.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code

```text
app/
├── prisma/schema.prisma                     # + model ConsultaProjecao (@@map "projecao_consultas")
├── src/lib/projecao.ts                      # + resumirConsulta(), tipo ConsultaGuardada
├── src/app/api/projecao/consultar/route.ts  # recebe nicho + paraQuem, grava, devolve id
├── src/app/admin/projecao/page.tsx          # lê ?consulta, conta as guardadas, link no action
├── src/app/admin/projecao/projecao.tsx      # campo "Para quem", estado inicial, aviso de não guardada
├── src/app/admin/projecao/consultas/page.tsx  # NOVO: a lista
└── test/projecao.test.mjs                   # + resumirConsulta (exemplo sintético: o repo é público)
```

**Structure Decision**: tudo dentro da pasta da Projeção. A lista é subrota dela, e o Tailwind já varre
`src/app/admin/projecao` (017), então a pasta nova herda as classes.

## Complexity Tracking

Nenhuma.
