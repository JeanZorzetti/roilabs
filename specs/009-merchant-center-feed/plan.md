# Implementation Plan: Feed de Produtos para Google Merchant Center (Free Listings)

**Branch**: `main` (repo trabalha na main; sem branch de feature) | **Date**: 2026-07-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-merchant-center-feed/spec.md`

## Summary

Expor `https://goiania.roilabs.com.br/feed.xml` — feed RSS 2.0 no vocabulário Google Merchant (`xmlns:g`), gerado em build a partir de `porcelanatos.json` via rota Astro (`src/pages/feed.xml.ts`, mesmo padrão de `sitemap.xml.ts`/`llms.txt.ts`). Título/descrição/preço saem dos MESMOS helpers usados pela página de produto (paridade por construção, não por disciplina). Validação pós-build sem dependência nova quebra o build se o feed sair malformado. Documentação ops (`docs/merchant-center.md`) cobre cadastro no Merchant Center + verificação de domínio.

## Technical Context

**Language/Version**: TypeScript (Astro 5.6, `site-goiania`), Node 20+ no Docker

**Primary Dependencies**: Astro (já instalado). **Zero dependência nova** — feed é template string (padrão do `sitemap.xml.ts`); validação é script Node puro.

**Storage**: `site-goiania/porcelanatos.json` (fonte única do catálogo, 30 produtos) via `src/data/produtos.ts`

**Testing**: script `check-feed.mjs` (postbuild) validando `dist/feed.xml`: bem-formado no nível exigido, campos obrigatórios por item, contagem = catálogo elegível, > 0

**Target Platform**: build estático Astro → nginx (Docker/EasyPanel), domínio `goiania.roilabs.com.br`

**Project Type**: site estático (rota adicional em app existente)

**Performance Goals**: N/A — arquivo estático servido pelo nginx; gerado 1× por build

**Constraints**: paridade obrigatória com a página de produto (título/imagem/preço — política Google); encoding UTF-8 sem mojibake; sem GTIN no catálogo

**Scale/Scope**: 30 itens hoje; cresce com o catálogo sem mudança de código

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação |
|---|---|
| I. Env vars primeiro | ✅ N/A — nenhuma env var nova; URL base é constante como no `sitemap.xml.ts`. |
| II. Verificação em ambiente real (NÃO-NEGOCIÁVEL) | ✅ Plano termina com verificação em prod: `curl` de `goiania.roilabs.com.br/feed.xml` pós-deploy + processamento no painel do Merchant Center. Build local só como smoke (OneDrive não-confiável — evidência final é Docker/prod). |
| III. Simplicidade deliberada (YAGNI) | ✅ Zero dependência nova; 1 rota + 1 script de validação + helpers extraídos (2 usos reais: página e feed — não é abstração especulativa). Validação regex-level marcada com `ponytail:` e teto documentado. |
| IV. Qualidade de página voltada ao usuário | ✅ N/A — saída é máquina-máquina (Google); nenhuma página de usuário criada. |
| V. Fluxo spec-driven e entrega fechada | ✅ Spec 009 → plan → tasks → implement; `handoff.md` co-localizado + commit/push ao fechar. |

**Pós-Phase 1**: sem violações; Complexity Tracking vazio.

## Project Structure

### Documentation (this feature)

```text
specs/009-merchant-center-feed/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── feed-xml.md      # contrato do feed (Phase 1)
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
site-goiania/
├── src/
│   ├── data/produtos.ts            # MODIFICA: extrai tituloProduto() + descricaoProduto() (hoje inline na página)
│   ├── pages/
│   │   ├── feed.xml.ts             # NOVO: rota do feed (padrão sitemap.xml.ts)
│   │   └── porcelanato/produto/[slug].astro  # MODIFICA: passa a usar os helpers extraídos
│   └── scripts/check-feed.mjs      # NOVO: validação pós-build do dist/feed.xml
├── docs/merchant-center.md         # NOVO: passo a passo ops (conta, domínio, cadastro do feed)
└── package.json                    # MODIFICA: script "postbuild" → check-feed
```

**Structure Decision**: tudo dentro de `site-goiania` (app do polo). Nenhum arquivo fora dele além dos artefatos da spec.
