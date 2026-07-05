---
status: in_progress
next_effort: medium
iteration: 2
updated_at: 2026-07-05T12:10:00.000Z
---

## Last completed
Tarefa 2 (Semana 1): criado o guia AEO **`/guia/porcelanato-area-externa/`**
no `site-goiania`:
- `src/pages/guia/porcelanato-area-externa.astro` — BLUF no hero (acabamento
  externo/rústico/strutturato, atrito ≥0,4 NBR 13818), seção dos 3 critérios
  técnicos (atrito, absorção ≤0,5%, PEI/classe de abrasão), tabela comparativa
  por ambiente (varanda coberta, quintal/calçada, garagem, borda de piscina,
  rampa, fachada), seção de formato/instalação (AC-III, dupla colagem, junta
  3mm+, dilatação, caimento, sobra 10–15% → CTA calculadora), FAQ com 7
  perguntas (FAQPage schema) + BreadcrumbList, CTA duplo, relacionados.
- Grade de produtos reais: filtro por `tagsDoProduto` com tag
  `porcelanato-area-externa` ou `tipo:antiderrapante` → 6 produtos do catálogo
  (acabamentos Externo/Rústico/Strutturato), via `ProdutoCard`. Nenhuma spec
  inventada — classe AD citada só como "na ficha técnica de cada peça".
- Deep-links para o glossário da tarefa 1: `#antiderrapante`, `#pei`,
  `#absorcao-de-agua`, `#formato-grande`, `#argamassa-colante`, `#junta`
  (todas as âncoras conferidas em `glossario.astro`).
- Registrado em `src/data/guias.ts` (sitemap, llms.txt, busca-index e OG
  derivam automaticamente de `guias` — conferido no dist).
- `astro build` verde (89 páginas); `node src/scripts/check-feed.mjs` OK
  (30 itens). URL presente em sitemap.xml, llms.txt e busca-index.json.

## Next step
Tarefa 3 do `macro_plan.md` (Semana 1): **Guia AEO
`/guia/rejunte-porcelanato/`** no `site-goiania`.
- Verificar antes se já existe (hoje há 5 guias em `src/pages/guia/`:
  como-escolher, porcelanato-ou-ceramica, polido-ou-acetinado, quanto-custa,
  porcelanato-area-externa).
- Conteúdo: como escolher COR de rejunte (contraste vs tom-sobre-tom), tipos
  (cimentício, acrílico, epóxi — prós/contras/custo relativo) e como calcular
  a quantidade — o estimador de rejunte já existe na `/calculadora` (ciclo
  15), linkar como CTA, não duplicar a matemática na página.
- FAQPage + BreadcrumbList; registrar em `src/data/guias.ts` (sitemap,
  llms.txt, busca-index e OG derivam automaticamente).
- Padrão a copiar: `src/pages/guia/porcelanato-area-externa.astro` (mais
  recente; Base + Header/Footer/Faq/WhatsappCta, hero BLUF, tabela
  `comp-table`, CTA duplo, relacionados).
- Linkar o glossário: `/glossario/#rejunte`, `#junta`, `#argamassa-colante`
  (âncoras existem em `glossario.astro`).
- URLs sempre com barra final. `astro build` verde + conferir URL em
  dist/sitemap.xml, dist/llms.txt, dist/busca-index.json antes de commitar
  (deploy automático em produção no push).
