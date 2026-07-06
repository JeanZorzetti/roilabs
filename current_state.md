---
status: in_progress
next_effort: medium
iteration: 6
updated_at: 2026-07-06T12:05:00.000Z
---

## Last completed
Tarefa 6 (Semana 2, Macro plan 3): **hub `/guia/`** no site-goiania. Não existia
`src/pages/guia/index.astro` (conferido) — criado índice dos 11 guias agrupado
pela jornada (escolher → comparar → orçar → instalar → manter), fonte única
`src/data/guias.ts` com guard de build (build quebra se um guia novo não for
classificado numa etapa), + 3 cards de ferramentas (glossário, calculadora,
comparador). Schema: CollectionPage + ItemList + BreadcrumbList. Descoberta:
`/guia/` adicionado em `sitemap.xml.ts`, `llms.txt.ts` (linha no topo de "Guias
de decisão"), `busca-index.json.ts` (entrada tipo Guia) e link "Guias" no
`Footer.astro`. URLs com barra final. `astro build` verde (98 páginas, era 97);
conferido em dist: `guia/index.html`, `/guia/` no sitemap.xml, llms.txt e
busca-index.json.

## Next step
Tarefa 7 do `macro_plan.md` (Semana 2, `[medium]`): **RSS/Atom nos 2 sites**.
Nenhum dos sites tem `/rss.xml` (o site-goiania tem `feed.xml.ts`, que é feed
de PRODUTOS para Merchant Center — não é RSS de conteúdo; não confundir nem
mexer nele). Criar:
(a) `/rss.xml` no `/site` a partir da content collection do blog (mesma fonte
que `llms.txt.ts` do /site usa);
(b) `/rss.xml` no site-goiania a partir de `src/data/guias.ts`.
Padrão: endpoint `.ts` gerando XML na mão (como `sitemap.xml.ts`), sem
dependência nova. Adicionar `<link rel="alternate" type="application/rss+xml">`
no `<head>` do layout Base de cada site e referenciar o feed no llms.txt de
cada site. URLs com barra final nos links dos itens. `astro build` verde nos 2
sites antes do commit.
