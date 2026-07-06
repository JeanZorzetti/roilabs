---
status: in_progress
next_effort: high
iteration: 7
updated_at: 2026-07-06T14:55:00.000Z
---

## Last completed
Tarefa 7 (Semana 2, Macro plan 3): **RSS nos 2 sites**. Nenhum tinha `/rss.xml`
(conferido; o `feed.xml.ts` do goiânia é feed de PRODUTOS Merchant Center e não
foi tocado). Criados, sem dependência nova, XML na mão (padrão `sitemap.xml.ts`):
(a) `site/src/pages/rss.xml.ts` — RSS 2.0 da content collection do blog (6
itens, mais novo primeiro, `pubDate` do frontmatter, guid = URL com barra
final); (b) `site-goiania/src/pages/rss.xml.ts` — RSS 2.0 de
`src/data/guias.ts` (11 itens, ordem invertida do registro; itens sem
`<pubDate>` porque guias.ts não tem data por guia — comentário `ponytail:`
no arquivo). `<link rel="alternate" type="application/rss+xml">` adicionado no
`<head>` dos dois `Base.astro`; feed referenciado nos dois `llms.txt.ts`.
Builds verdes: /site 13 páginas, site-goiania 98 páginas; conferido em dist:
rss.xml válido nos 2, referência no llms.txt e link no head.

## Next step
Tarefa 8 do `macro_plan.md` (Semana 2, `[high]`): **Striking distance com dados
reais**. Ler `Docs/Obsidian/90-medicao/rank-tracking.csv` (histórico semanal do
serper.dev) e `rank-tracking.md`. Identificar termos na posição 8–40 e reforçar
a página correspondente: title/meta/H2, 1–2 FAQs novas respondendo variações do
termo, interlinks internos apontando para ela com âncora exata. Registrar
análise e ações em `Docs/Obsidian/90-medicao/striking-distance.md` (vault, não
em docs/ do repo). Se tudo ainda estiver fora do top 100 (baseline 07-03 era
0), registrar o snapshot honesto no mesmo arquivo e pular o reforço — não
forçar. Se mexer em páginas, `astro build` verde antes do commit.
