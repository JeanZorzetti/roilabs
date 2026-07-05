---
status: in_progress
next_effort: medium
iteration: 6
updated_at: 2026-07-05T12:40:00.000Z
---

## Last completed
Tarefa 6 (Semana 2, `[plan]`): **Filtros e ordenação no hub `/porcelanato/`**
do `site-goiania`. Client-side puro, sem API, progressive enhancement:
- `src/components/ProdutoCard.astro` — o `<a class="prod-card">` agora emite
  `data-marca`, `data-dim` e `data-preco` (inofensivo nas outras páginas que
  usam o card; evitou wrapper div no grid).
- `src/pages/porcelanato/index.astro` — `<form class="prod-filtros">` acima do
  `.prod-grid` do catálogo: selects de **marca** e **formato** (opções
  computadas no build de `produtos.ts`), ordenação **preço/m² asc/desc**,
  contador "N de 30 produtos" (aria-live), botão "Limpar filtros" e mensagem
  de estado vazio. Script inline: filtra via `style.display`, reordena via
  CSS `order` (grid item) — **nenhum DOM criado por JS**, então os estilos
  novos ficaram scoped normalmente (gotcha evitado na raiz). Estado sincroniza
  com `?marca=&formato=&ordem=` via `history.replaceState` e é lido no load
  (valores validados contra as options antes de aplicar).
- Sem JS: grid inteiro renderizado (o build emite tudo), selects inertes.
- Verificação: `astro build` verde (93 páginas), 30 cards com `data-preco` no
  dist, form presente; `node src/scripts/check-feed.mjs` OK (30 itens).
  Página não é nova → sitemap/llms.txt/busca inalterados.
- Observação p/ tarefa 8 (mantida): a `/calculadora` já tem botão
  "+ Adicionar ambiente" — verificar se multi-ambiente já existe antes de
  construir.

## Next step
Tarefa 7 do `macro_plan.md` (Semana 2, `[build]`): **Favoritos ↔ comparador**
no `site-goiania`.
- Na página `/favoritos` (feita no ciclo 15): botão "Comparar favoritos" que
  monta o deep-link `?p=slug1,slug2,slug3` do `/comparar` com até 3 favoritos.
- No `/comparar`: botão de favoritar em cada coluna de produto.
- **Verificar ANTES o que já existe**: ler `src/pages/favoritos.astro`,
  `src/pages/comparar.astro` e `src/components/FavToggle.astro` — o ciclo 15
  pode já ter deixado parte pronta (se tudo existir, registrar "pulado (já
  existia)" e ir para a tarefa 8).
- Padrão localStorage dos favoritos já existe (`FavToggle.astro`); comparador
  usa `?p=` e `history.replaceState` (ver `comparar.astro:263,328`).
- Gotcha: DOM criado por JS não recebe scoped styles → `<style is:global>` se
  precisar criar elementos.
- URLs sempre com barra final. `astro build` verde +
  `node src/scripts/check-feed.mjs` antes de commitar (push = deploy em
  produção). Páginas não são novas → sitemap/llms/busca não mudam.
