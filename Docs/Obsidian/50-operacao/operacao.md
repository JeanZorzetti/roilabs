---
status: decided
depends_on:
  - "[[oferta]]"
---

# Operação — SLA, Arquitetura e Deploy

> **Pergunta que este nó responde:** como o hub roda tecnicamente e quem é responsável por quê?

## Decisão atual

**Matriz de responsabilidades (SLA):**

- **Fornecedor:** curadoria de estoque, precisão de dados, embalagem e despacho no prazo.
- **ROI Labs:** infraestrutura multitenant, integridade das APIs, SEO e interface de vendas.

**Arquitetura event-driven:** alteração de estoque/preço no ERP do fornecedor dispara webhook → atualização instantânea no hub. Mensageria em vez de update manual.

**Multitenancy + Taxonomic Mapping:** suporta taxonomias divergentes (moda "cor/tamanho" até construção "PEI/resistência").

**Esteira de deploy:** novos parceiros no ar em **horas, não semanas**.

**Legacy ERPs:** parceiro sem API moderna → **requisito mínimo tecnológico** para entrada, ou middleware de extração (Gatekeeper) para não comprometer a integridade do estoque.

**Stack:** Next.js com SSR para indexação rápida (base do [[gtm]] pSEO).

## Depende de

- [[oferta]] — o que é prometido (deploy em horas, catálogo, White Label) define o que a operação precisa entregar.

## Decisões fechadas

- ✅ **Requisito técnico mínimo (2 tiers):** Tier A = API/webhook de estoque+preço (ideal). Tier B = export estruturado agendado (CSV/planilha), aceitável **com Gatekeeper**. Sem nenhum dos dois → não entra.
- ✅ **Gatekeeper: buy/integrador no MVP.** Não construir middleware sob medida por ERP no início. Construir só quando um mesmo ERP se repetir em vários parceiros (padrão que justifica automatizar).

## Notas

Origem: [[Blueprint Estratégico_ Hub de Infraestrutura Digital ROI Labs]] §3 e §5.
