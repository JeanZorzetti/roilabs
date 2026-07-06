---
status: in_progress
next_effort: medium
iteration: 1
updated_at: 2026-07-06T08:40:00.000Z
---

## Last completed
Tarefa 1 (Semana 1, Macro plan 3): guia AEO `/guia/como-limpar-porcelanato/`
no site-goiania. Criado `src/pages/guia/como-limpar-porcelanato.astro` no
padrão dos 7 guias existentes (modelo: rejunte-porcelanato.astro): BLUF no
hero, tabela de limpeza por acabamento (polido/acetinado/natural-técnico/
externo, rotina diária vs pesada), seção "o que nunca usar" (ácido muriático,
cera, abrasivo em polido), manchas comuns (véu de cimento, ferrugem, tinta,
caneta, limo) e pós-obra em ordem. 8 FAQs com FAQPage + BreadcrumbList no
JSON-LD, interlink com âncoras do glossário (#polido, #acetinado, #natural,
#antiderrapante, #rejunte, #junta, #pei, #absorcao-de-agua,
#argamassa-colante), guias irmãos e calculadora. Registrado em
`src/data/guias.ts` (que alimenta sitemap/llms.txt/busca/OG dinâmico —
nenhuma outra mudança necessária). `astro build` verde (94 páginas);
conferido que a URL nova aparece em dist/sitemap.xml, dist/llms.txt e
dist/busca-index.json e que o HTML emite FAQPage.

## Next step
Tarefa 2 do `macro_plan.md` (Semana 1): guia AEO
`/guia/como-assentar-porcelanato/` no site-goiania. Etapas reais (preparo do
contrapiso, argamassa AC-II/AC-III conforme uso, dupla colagem em formato
grande, junta mínima, nivelador, rejunte após cura) com schema **HowTo** +
FAQPage. Ser honesto: recomendar profissional para grandes formatos. CTA para
a `/calculadora/` (caixas + argamassa/rejunte que ela já estima). Seguir o
padrão dos guias existentes (modelo: `src/pages/guia/rejunte-porcelanato.astro`,
criado ontem: `como-limpar-porcelanato.astro`), registrar o slug em
`src/data/guias.ts` (alimenta sitemap/llms/busca/OG sozinho), interlinkar
glossário via âncoras `#termo` (ids em `src/pages/glossario.astro`), URLs
sempre com barra final, `astro build` verde antes do commit.
