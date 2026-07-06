---
status: in_progress
next_effort: low
iteration: 12
updated_at: 2026-07-06T13:40:00.000Z
---

## Last completed
Tarefa 12 (Semana 3, Macro plan 3): **2 artigos B2B novos no blog do `/site`**,
ângulos conferidos contra os 6 slugs existentes (nenhum repetido):
- `google-shopping-loja-material-construcao.md` — passo a passo real do
  Merchant Center baseado na spec 009 e no ops-doc
  `Docs/Obsidian/80-dev/merchant-center.md`: free listings, verificação de
  domínio via Search Console, feed RSS 2.0 `xmlns:g` de 30 itens gerado no
  build, paridade por construção, gate `check-feed`, tabela de reprovações
  (`unit_pricing_measure`, `identifier_exists=no`, imagem no domínio próprio,
  devoluções). Sem métricas inventadas.
- `ecommerce-proprio-vs-polo-pronto.md` — CAPEX/OPEX de montar sozinho vs
  success fee, usando a fórmula do `/simulador` (receita = ticket × pedidos;
  fatura = receita × pct), exemplo rotulado como hipotético (mesmos defaults
  do simulador: R$ 450 × 40 × 10%). Tabela comparativa + seção honesta de
  quando e-commerce próprio ainda vale.
Ambos no padrão dos existentes: BLUF, 6 FAQs no frontmatter (viram FAQPage),
`pubDate: 2026-07-06`, interlink `/modelo/`, `/polo-goiania/`, `/simulador/`,
cross-link entre os dois e com 2 artigos antigos, CTA `/#candidatar`.
`astro build` verde (15 páginas); confirmado no dist: ambos em sitemap.xml,
llms.txt e rss.xml (2 hits cada), OG png gerado, JSON-LD com Article +
FAQPage + BreadcrumbList + datePublished.

## Next step
Tarefa 13 do `macro_plan.md` (Semana 3, `[low]`): **Refresh do case
`/polo-goiania/` e da `/modelo/`** no `/site`
(`site/src/pages/polo-goiania.astro` e `modelo.astro`). Atualizar os fatos
verificáveis que ficaram velhos: nº de páginas do build atual do site-goiania
(98 no último build da tarefa 11 — reconferir rodando `astro build` lá se for
citar), glossário com 19 termos, 11+ guias (11 em `guias.ts` + hub `/guia/`),
comparador, filtros do hub, acervo ambientado (Inspire-se), feed Merchant de
30 itens, RSS novo. Atualizar `dateModified` no schema das duas páginas.
Nada de métrica inventada de venda/tráfego — só o que o build/repo prova.
Rodar `astro build` do `/site` verde antes de commitar (push deploya direto).
Lembrete: `npm install`/`tsc` locais não-confiáveis (OneDrive, errno -4094);
`astro build` funciona.
