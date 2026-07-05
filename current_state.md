---
status: in_progress
next_effort: medium
iteration: 3
updated_at: 2026-07-05T09:15:00.000Z
---

## Last completed
Tarefa 3 (Semana 1): criado o guia AEO **`/guia/rejunte-porcelanato/`** no
`site-goiania`:
- `src/pages/guia/rejunte-porcelanato.astro` — BLUF no hero (tom-sobre-tom
  meio tom mais escuro como padrão; epóxi em área molhada; 0,25–0,5 kg/m²),
  seção de cor (tom-sobre-tom vs contraste + armadilhas branco/pigmento),
  tabela comparativa dos 3 tipos (cimentício, acrílico, epóxi — como é, onde
  usar, custo relativo), seção de quantidade (regra kg/m² por tamanho de peça,
  igual aos coeficientes 0,5/0,35/0,25 do estimador da `/calculadora`; área
  instalada sem folga; espera de 72h) com CTA para a calculadora — a
  matemática NÃO foi duplicada na página, só a regra prática citada.
- FAQ com 7 perguntas (FAQPage schema) + BreadcrumbList; CTA duplo
  (calculadora + WhatsApp); relacionados.
- Deep-links do glossário conferidos em `glossario.astro`: `#junta`,
  `#rejunte` implícito via glossário geral, `#retificado`, `#paginacao`,
  `#calibre`, `#argamassa-colante`.
- Registrado em `src/data/guias.ts` (sitemap, llms.txt, busca-index e OG
  derivam automaticamente).
- `astro build` verde (90 páginas); URL presente em dist/sitemap.xml,
  dist/llms.txt e dist/busca-index.json; `node src/scripts/check-feed.mjs`
  OK (30 itens).
- Observação p/ tarefa 8: a `/calculadora` já tem botão "+ Adicionar
  ambiente" — verificar se multi-ambiente já existe antes de construir.

## Next step
Tarefa 4 do `macro_plan.md` (Semana 1): **Guia AEO
`/guia/porcelanato-liquido-vs-porcelanato/`** no `site-goiania`.
- Verificar antes se já existe (hoje há 6 guias em `src/pages/guia/`:
  como-escolher, porcelanato-ou-ceramica, polido-ou-acetinado, quanto-custa,
  porcelanato-area-externa, rejunte-porcelanato).
- Conteúdo: busca de alto volume que confunde porcelanato líquido (resina
  epóxi autonivelante aplicada no piso) com porcelanato (placa cerâmica).
  Comparativo honesto de custo/m², durabilidade, aplicação, manutenção;
  CTA para catálogo `/porcelanato/` e `/calculadora/`. FAQPage +
  BreadcrumbList.
- Padrão a copiar: `src/pages/guia/rejunte-porcelanato.astro` ou
  `porcelanato-area-externa.astro` (Base + Header/Footer/Faq/WhatsappCta,
  hero BLUF, tabela `comp-table`, CTA duplo, relacionados). Registrar em
  `src/data/guias.ts` (sitemap, llms.txt, busca-index e OG derivam
  automaticamente).
- Glossário: âncoras existentes úteis — `/glossario/#absorcao-de-agua`,
  `#pei`, `#esmaltado` (conferir ids em `glossario.astro` antes de linkar).
- URLs sempre com barra final. `astro build` verde + conferir URL em
  dist/sitemap.xml, dist/llms.txt, dist/busca-index.json e rodar
  `node src/scripts/check-feed.mjs` antes de commitar (deploy automático em
  produção no push).
