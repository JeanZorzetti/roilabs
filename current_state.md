---
status: in_progress
next_effort: medium
iteration: 4
updated_at: 2026-07-05T12:15:00.000Z
---

## Last completed
Tarefa 4 (Semana 1): criado o guia AEO **`/guia/porcelanato-liquido-vs-porcelanato/`**
no `site-goiania`:
- `src/pages/guia/porcelanato-liquido-vs-porcelanato.astro` — BLUF no hero
  (líquido = resina epóxi autonivelante, NÃO é porcelanato; risca, amarela
  com UV, repolimento em 5–10 anos), seção "dois produtos com nome parecido",
  tabela comparativa de 7 critérios (custo instalado, durabilidade, sol
  direto, juntas, aplicação, reparo, revenda), seção "quando cada um faz
  sentido" (honesta: líquido vale em piso monolítico industrial/decorativo),
  FAQ com 7 perguntas (FAQPage) + BreadcrumbList, CTA triplo (catálogo +
  calculadora + WhatsApp), relacionados.
- Faixas de preço da resina marcadas explicitamente como "faixas de mercado
  para referência, não orçamento"; preços de porcelanato remetem ao guia
  quanto-custa (que usa o catálogo real).
- Links para glossário conferidos contra ids reais de `glossario.astro`:
  `#polido`, `#absorcao-de-agua`, `#pei`, `#junta`, `#retificado`,
  `#formato-grande`, `#lote`.
- Registrado em `src/data/guias.ts` (sitemap, llms.txt, busca-index e OG
  derivam automaticamente) — agora são 7 guias.
- `astro build` verde (91 páginas); URL presente em dist/sitemap.xml,
  dist/llms.txt e dist/busca-index.json; `node src/scripts/check-feed.mjs`
  OK (30 itens).
- Observação p/ tarefa 8 (mantida do ciclo anterior): a `/calculadora` já tem
  botão "+ Adicionar ambiente" — verificar se multi-ambiente já existe antes
  de construir.

## Next step
Tarefa 5 do `macro_plan.md` (Semana 1, `[plan]`): **Galeria Inspire-se por
ambiente** no `site-goiania`.
- Investigar as fotos `imagensAmbiente` do catálogo em `src/data/produtos`
  (diretório/arquivo de dados dos 30 produtos): dá para classificar por
  ambiente (cozinha, sala, banheiro) via heurística por nome de arquivo ou
  nome de produto, ou por curadoria manual no data file?
- Se sim: criar sub-páginas `/inspire-se/cozinha/`, `/inspire-se/sala/`,
  `/inspire-se/banheiro/` — SÓ os ambientes com ≥4 fotos — linkadas da
  galeria principal `/inspire-se/` (que já existe, ciclo anterior).
- Se a classificação não parar em pé (nomes de arquivo opacos, sem sinal de
  ambiente), registrar o porquê em `current_state.md` e PULAR — o plano manda
  não forçar.
- Página nova = registrar em sitemap, llms.txt e busca interna seguindo o
  padrão existente (ver como `/inspire-se/` já é registrada; guias derivam de
  `src/data/guias.ts`, outras páginas podem ter registro manual em
  `sitemap.xml.ts`/`llms.txt.ts`/`busca-index.json.ts`).
- URLs sempre com barra final. `astro build` verde + conferir URLs novas em
  dist/sitemap.xml, dist/llms.txt, dist/busca-index.json e rodar
  `node src/scripts/check-feed.mjs` antes de commitar (deploy automático em
  produção no push).
