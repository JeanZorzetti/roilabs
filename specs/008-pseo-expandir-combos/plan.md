# Implementation Plan: Expandir a malha pSEO de porcelanato (combos validados por volume)

**Branch**: `008-pseo-expandir-combos` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-pseo-expandir-combos/spec.md`

## Summary

Expandir a malha de páginas de alta intenção do `site-goiania` (hoje 31 categorias + 30 produtos) adicionando **todos os combos** (tipo × característica × ocasião × dimensão × acabamento × intenção local) com **volume ≥ 200/mês** validado no **OpenSEO** (única fonte). Abordagem técnica: **puramente data-driven** — novas entradas no array `src/data/porcelanato.ts` (interface `PorcelanatoPage` já existente), consumidas pelo template `porcelanato/[slug].astro` via `getStaticPaths`; o gate `check-matrix.mjs` (prebuild) garante slug único + volume > 0 + campos obrigatórios. Sem novo código de motor. Sitemap já auto-inclui; `llms.txt` é corrigido (remover "bairro") e passa a ser gerado da fonte. **× bairro fica fora** (herda D8). Execução **bloqueada até o OpenSEO estar no ar** (hoje `localhost:3001` inacessível).

## Technical Context

**Language/Version**: TypeScript 5 / Astro 5 (site estático) — Node build → nginx

**Primary Dependencies**: Astro (`getStaticPaths`, content estático), array TS tipado (`PorcelanatoPage`), utilitário `Jsonld.astro` (`buildJsonLdNodes`); OpenSEO self-hosted (`open-seo/`, compose) como fonte de volume (dados DataForSEO)

**Storage**: Nenhum runtime — dados em arquivo (`src/data/porcelanato.ts`, `porcelanatos.json`). Sem DB novo. (Leads consumidor já persistem no `/app`, fora de escopo aqui.)

**Testing**: `src/scripts/check-matrix.mjs` (assert slug único, volume > 0, título/atributos/FAQ presentes) — roda no `prebuild` e quebra o build. Verificação real = Docker/navegador em prod (Constituição II).

**Target Platform**: Estático servido por nginx (EasyPanel), `goiania.roilabs.com.br`

**Project Type**: Web (site estático Astro) — extensão de app existente, single project

**Performance Goals**: N/A novo (páginas estáticas pré-renderadas; sem meta de latência de servidor). Objetivo é de cobertura SEO, não de throughput.

**Constraints**: Conteúdo honesto (sem atributo/inventário fabricado — Const. III/IV); ≥ 200/mês como **regra de seleção** dos combos novos; OpenSEO única fonte, sem fallback; × bairro proibido (D8). O gate de build (`check-matrix`) permanece `volume > 0` (invariante de honestidade) — **1 página existente tem volume 190** e é grandfathered; adiciona-se um **warning não-fatal** para entradas < 200.

**Scale/Scope**: 31 → ~60-80 páginas de categoria (todos os combos que qualificam). ~30-50 entradas novas no array. Sem novo nicho, sem novo polo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Conformidade |
|---|---|
| **I. Env-first** | ✅ 1º passo de execução = confirmar OpenSEO no ar + créditos DataForSEO (`localhost:3001`). Hoje FORA → bloqueia implement, não o plan. |
| **II. Verificação real** | ✅ DoD exige build no Docker + verificação no navegador em prod (páginas, sitemap, JSON-LD no Rich Results). Nada de "compilou local". |
| **III. Simplicidade (YAGNI)** | ✅ Zero código de motor novo — só dados + 1 ajuste no gate + 1 rota de `llms.txt` gerada. Sem abstração nova. Menor diff possível. |
| **IV. Qualidade voltada ao usuário** | ✅ Cada página nova = conteúdo rico PT-BR (BLUF, como escolher, FAQ), padrão das existentes. Proibido thin/doorway/atributo falso. |
| **V. Spec-driven + entrega fechada** | ✅ Fluxo Spec Kit em curso; ao fechar, `handoff.md` co-localizado + commit + push. |

**Restrições da Constituição aplicáveis:** "conteúdo informacional antes de inventário falso" (III) → páginas sem produto casado seguem informacionais; "pSEO regional + GEO/AEO, nicho como pasta" → mantém `porcelanato/` no `site-goiania`. **Sem violações. Complexity Tracking vazio.**

## Project Structure

### Documentation (this feature)

```text
specs/008-pseo-expandir-combos/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (data-shape + gate + keyword-selection)
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
site-goiania/
├── src/
│   ├── data/
│   │   ├── porcelanato.ts        # ← ALVO: +30-50 entradas PorcelanatoPage validadas
│   │   ├── produtos.ts           # (inalterado) carrega porcelanatos.json
│   │   └── README.md             # guia de autoria (atualizar se o piso mudar)
│   ├── pages/
│   │   ├── porcelanato/
│   │   │   ├── [slug].astro       # (inalterado) template — gera as páginas novas
│   │   │   ├── index.astro        # (inalterado) silo — lista tudo automaticamente
│   │   │   └── produto/[slug].astro
│   │   ├── sitemap.xml.ts         # (inalterado) auto-inclui slugs novos
│   │   └── llms.txt.ts            # ← NOVO: gerar llms.txt da fonte (substitui manual)
│   └── scripts/
│       └── check-matrix.mjs       # ← AJUSTE leve: mantém erro em volume ≤ 0; +warning < 200
└── public/
    └── llms.txt                   # ← REMOVER (vira rota gerada) OU corrigir se manual

open-seo/                          # fonte de volume (subir via compose antes de minerar)
```

**Structure Decision**: Single project, extensão data-driven do app `site-goiania` existente. Nenhuma pasta/app novo. O único código novo é a rota `llms.txt.ts` (paridade com `sitemap.xml.ts`) e um warning leve no `check-matrix.mjs`; todo o resto é dado.

## Complexity Tracking

> Sem violações de constituição. Nada a justificar.
