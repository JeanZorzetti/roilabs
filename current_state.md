---
status: in_progress
next_effort: medium
iteration: 5
updated_at: 2026-07-05T12:25:00.000Z
---

## Last completed
Tarefa 5 (Semana 1, `[plan]`): **Galeria Inspire-se por ambiente** no
`site-goiania`. A classificação parou em pé via **curadoria manual visual**
(olhei as 25 fotos de `imagensAmbiente` uma a uma — nome de arquivo/slug não
carrega sinal de ambiente):
- `src/data/ambientes.ts` — mapa curado slug→ambiente + metadados das
  sub-páginas. Ambientes criados: **sala** (5 fotos) e **área externa**
  (8 fotos únicas). Fora, com motivo documentado no arquivo: 5 fotos são
  close-up de textura (strato bege/grigio, urban branco, pietra di matera,
  rock face — não são ambiente); quarto só tem 2; banheiro tem 4 produtos mas
  só 3 fotos únicas (lux reusa a do pulpis); arezzo-beige reusa a foto do
  arezzo-externo (só o externo entrou).
- `src/pages/inspire-se/[ambiente].astro` — sub-páginas `/inspire-se/sala/` e
  `/inspire-se/area-externa/` (getStaticPaths de `ambientes.ts`), mesmo layout
  do mural principal, breadcrumb, cross-link entre ambientes e volta pro
  mural; alt text "Sala com X" / "Área externa com X".
- `inspire-se.astro` — linha "Ver por ambiente: Sala (5 fotos) · Área externa
  (8 fotos)" no hero.
- Registro nas 3 superfícies: `sitemap.xml.ts` (com extensão `image:` das
  fotos), `llms.txt.ts` (2 linhas em Ferramentas) e `busca-index.json.ts`
  (categoria "Inspiração").
- `astro build` verde (93 páginas); as 2 URLs conferidas em dist/sitemap.xml,
  dist/llms.txt e dist/busca-index.json; sub-páginas com 5 e 8 itens no dist;
  `node src/scripts/check-feed.mjs` OK (30 itens).
- Cozinha não foi criada: 0 fotos claras de cozinha no acervo atual.
- Observação p/ tarefa 8 (mantida): a `/calculadora` já tem botão
  "+ Adicionar ambiente" — verificar se multi-ambiente já existe antes de
  construir.

## Next step
Tarefa 6 do `macro_plan.md` (Semana 2, `[plan]`): **Filtros e ordenação no hub
`/porcelanato/`** do `site-goiania`.
- Client-side, sem API: filtrar por **marca** e **formato** (dimensão),
  ordenar por **preço/m² asc/desc**.
- Estado na query string (`?marca=&ordem=`) para link compartilhável.
- Progressive enhancement: sem JS o hub continua renderizando TUDO (o filtro
  só esconde/reordena o que o build já emitiu — não criar DOM via JS se der
  para evitar).
- Gotcha Astro: scoped styles não se aplicam a DOM criado por JS — se precisar
  criar elementos via JS, usar `<style is:global>` (ver como
  favoritos/comparador já lidam com isso).
- Hub é `src/pages/porcelanato/index.astro`; dados/atributos reais em
  `src/data/produtos.ts` (marca, dimensao, preco em `atributos`).
- URLs sempre com barra final em qualquer link emitido. `astro build` verde +
  `node src/scripts/check-feed.mjs` antes de commitar (deploy automático em
  produção no push). Página não é nova → sitemap/llms/busca não mudam.
