---
status: in_progress
next_effort: medium
iteration: 1
updated_at: 2026-07-05T11:55:00.000Z
---

## Last completed
Tarefa 1 (Semana 1): criado o glossário de porcelanato em `/glossario/` no
`site-goiania`:
- `src/pages/glossario.astro` — 19 termos em 4 grupos (Material e qualidade,
  Acabamento de superfície, Medidas e formato, Instalação), cada um com
  definição BLUF de 2–4 frases, âncora estável (`#pei`, `#retificado`,
  `#argamassa-colante`...), índice de âncoras no topo e links para os guias,
  a malha e a calculadora. Schema `DefinedTermSet` + `DefinedTerm` (um nó por
  termo com `url` na âncora) + `BreadcrumbList`.
- Registrado em `sitemap.xml.ts`, `llms.txt.ts` (seção Ferramentas),
  `busca-index.json.ts` (uma entrada com keywords de todos os termos),
  `open-graph/[...route].ts` (OG gerado) e link "Glossário" no `Footer.astro`.
- `astro build` verde (86 páginas); conferido em `dist/`: página, PNG do OG e
  URL presente em sitemap/llms.txt/busca-index.

Nota: as âncoras existem para deep-link a partir de guias/produtos, mas os
guias existentes NÃO foram editados para apontar pro glossário (fica natural
fazer isso na tarefa 14, refresh de descoberta, se valer a pena).

## Next step
Tarefa 2 do `macro_plan.md` (Semana 1): **Guia AEO
`/guia/porcelanato-area-externa/`** no `site-goiania`.
- Verificar antes se já existe (hoje só existem 4 guias em `src/pages/guia/`:
  como-escolher, porcelanato-ou-ceramica, polido-ou-acetinado, quanto-custa).
- Conteúdo: antiderrapante (coeficiente de atrito ≥0,4 NBR 13818), PEI,
  absorção de água, formatos para área externa/garagem/piscina; tabela
  comparativa; FAQPage; linkar produtos reais do catálogo que atendem —
  filtrar por atributos reais em `src/data/produtos.ts`, NÃO inventar specs.
- Registrar em `src/data/guias.ts` (isso já propaga para sitemap, llms.txt,
  busca-index e OG automaticamente — os 4 arquivos derivam de `guias`).
- Padrão a copiar: `src/pages/guia/porcelanato-polido-ou-acetinado.astro`
  (Base + Header/Footer/Faq/WhatsappCta, jsonLdNodes com FAQPage +
  BreadcrumbList, hero BLUF, tabela `comp-table`, CTA duplo, relacionados).
- Cuidado: existe a categoria `/porcelanato/porcelanato-area-externa/` na
  malha — o guia responde a dúvida ANTES da categoria, sem canibalizar
  (mesma relação dos guias existentes com suas categorias). Linkar o
  glossário novo (`/glossario/#antiderrapante`, `#pei`, `#absorcao-de-agua`).
- URLs sempre com barra final. `astro build` verde antes de commitar
  (deploy automático em produção no push).
