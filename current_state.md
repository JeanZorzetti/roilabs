---
status: in_progress
next_effort: medium
iteration: 3
updated_at: 2026-07-06T08:50:00.000Z
---

## Last completed
Tarefa 3 (Semana 1, Macro plan 3): guia AEO `/guia/erros-ao-comprar-porcelanato/`
no site-goiania. Criado `src/pages/guia/erros-ao-comprar-porcelanato.astro` no
padrão dos guias existentes (modelo: como-limpar-porcelanato.astro): BLUF no
hero, lista numerada de 10 erros (sem folga 10–15%, ignorar PEI, misturar
lote/calibre/tonalidade, polido em área molhada, escolher só pela foto,
esquecer frete/prazo, não conferir m²/caixa, cor de rejunte errada, formato
grande sem custo de assentamento, retificado vs bold) com ids `#erro-N`; cada
erro linka a ferramenta/guia que o resolve ("Como evitar:" → calculadora,
comparador, glossário via âncoras #pei/#lote/#m2-por-caixa/#retificado, guias
area-externa/quanto-custa/como-assentar/rejunte/como-escolher). JSON-LD com
FAQPage (8 perguntas) + BreadcrumbList. Registrado em `src/data/guias.ts`
(alimenta sitemap/llms.txt/busca/OG sozinho). `astro build` verde (96 páginas);
conferido que a URL aparece em dist/sitemap.xml, dist/llms.txt e
dist/busca-index.json e que o HTML emite FAQPage + BreadcrumbList.

## Next step
Tarefa 4 do `macro_plan.md` (Semana 1): guia AEO
`/guia/piso-vinilico-vs-porcelanato/` no site-goiania. Mesmo padrão do guia
existente `porcelanato-liquido-vs-porcelanato` (comparação com material
concorrente): comparativo honesto de custo/m² instalado, durabilidade,
resistência à umidade, conforto térmico/acústico e valor de revenda. Tabela
comparativa + FAQPage + BreadcrumbList no JSON-LD + CTA para
catálogo/calculadora. Seguir o padrão dos guias existentes (modelos:
`src/pages/guia/como-limpar-porcelanato.astro` e
`erros-ao-comprar-porcelanato.astro`), registrar o slug em `src/data/guias.ts`
(alimenta sitemap/llms/busca/OG sozinho), interlinkar glossário via âncoras
`#termo` (ids em `src/pages/glossario.astro`: pei, absorcao-de-agua, polido,
acetinado, retificado...), URLs sempre com barra final, `astro build` verde no
site-goiania antes do commit, conferir URL nova em dist/sitemap.xml,
dist/llms.txt e dist/busca-index.json.
