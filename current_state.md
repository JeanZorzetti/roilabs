---
status: in_progress
next_effort: medium
iteration: 2
updated_at: 2026-07-06T08:45:00.000Z
---

## Last completed
Tarefa 2 (Semana 1, Macro plan 3): guia AEO `/guia/como-assentar-porcelanato/`
no site-goiania. Criado `src/pages/guia/como-assentar-porcelanato.astro` no
padrão dos guias existentes (modelo: como-limpar-porcelanato.astro): BLUF no
hero, tabela AC-I/AC-II/AC-III, passo a passo de 8 etapas (conferência de
lote/calibre, contrapiso, argamassa, esquadro/paginação, desempenadeira
dentada, dupla colagem ≥60 cm, junta mínima 1,5–2 mm com nivelador, rejunte
após ~72 h) com ids `#passo-N`, seção honesta "quando contratar profissional"
(formato grande, área externa, box). JSON-LD com **HowTo** (steps apontando
para as âncoras) + FAQPage (8 perguntas) + BreadcrumbList. Interlink com
glossário via âncoras (#argamassa-colante, #junta, #rejunte, #nivelador,
#formato-grande, #absorcao-de-agua), guias irmãos (rejunte, limpar,
quanto-custa, escolher, area-externa) e CTA para `/calculadora/`. Registrado
em `src/data/guias.ts` (alimenta sitemap/llms.txt/busca/OG sozinho).
`astro build` verde (95 páginas); conferido que a URL aparece em
dist/sitemap.xml, dist/llms.txt e dist/busca-index.json e que o HTML emite
HowTo + FAQPage + BreadcrumbList.

## Next step
Tarefa 3 do `macro_plan.md` (Semana 1): guia AEO
`/guia/erros-ao-comprar-porcelanato/` no site-goiania. 8–12 erros reais e como
evitar (comprar sem folga de 5–15%, ignorar PEI do ambiente, misturar
lotes/calibre/tonalidade, polido em área molhada/externa, esquecer frete e
prazo, rejunte de cor errada, não conferir m²/caixa...). Cada erro deve linkar
o guia/ferramenta que o resolve (calculadora, comparador, glossário, guias).
FAQPage + BreadcrumbList no JSON-LD. Seguir o padrão dos guias existentes
(modelos: `src/pages/guia/como-limpar-porcelanato.astro` e
`como-assentar-porcelanato.astro`), registrar o slug em `src/data/guias.ts`
(alimenta sitemap/llms/busca/OG sozinho), interlinkar glossário via âncoras
`#termo` (ids em `src/pages/glossario.astro`: pei, lote, calibre,
destonalizacao, m2-por-caixa, polido, retificado...), URLs sempre com barra
final, `astro build` verde no site-goiania antes do commit, conferir URL nova
em dist/sitemap.xml, dist/llms.txt e dist/busca-index.json.
