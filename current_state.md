---
status: in_progress
next_effort: medium
iteration: 8
updated_at: 2026-07-05T12:45:00.000Z
---

## Last completed
Tarefa 8 (Semana 2, `[build]`) **pulada (já existia)** + Tarefa 9 (Semana 2,
`[build]`): **"Vistos recentemente" via localStorage** no `site-goiania`.

- Tarefa 8 (calculadora multi-ambiente): verificado
  `src/pages/calculadora.astro` — o multi-ambiente já estava completo e
  funcional (botão "+ Adicionar ambiente" / `addRoom()`, remover linha, soma
  de áreas, folga clampada 5–20%, rejunte/argamassa sobre área instalada,
  prefill `?m2caixa=&produto=&nome=` e lead POST `/api/leads-consumidor`
  intactos). Matemática conferida manualmente com 3 casos via
  `m2ParaCaixas` de `src/lib/cart.ts` (ex.: 35+12=47 m² +10% = 51,7 →
  21 caixas de 2,5 m²; ceil + mínimo 1 caixa). Nenhum código alterado.
- Tarefa 9 implementada:
  - `src/lib/vistos.ts` — nova lib no padrão de `favoritos.ts`: localStorage
    `roi_vistos_v1`, só slugs, mais recente primeiro, cap 6
    (`getVistos()` / `registrarVisto(slug)`).
  - `src/components/VistosRecentemente.astro` — novo componente: seção
    `hidden` que embute payload mínimo do catálogo em
    `<script type="application/json" class="vistos__data">` (mesmo truque de
    /favoritos e /comparar), renderiza cards `.prod-card` via JS (estilos
    globais, sem is:global extra necessário) e some se a trilha estiver
    vazia. Prop `atual` (slug do produto atual): registra a visita e exclui
    o próprio produto da trilha. Track `vistos_click` no clique.
  - Plugado em `src/pages/index.astro` (home), `src/pages/porcelanato/index.astro`
    (hub) e `src/pages/porcelanato/produto/[slug].astro`
    (`atual={produto.slug}`), sempre como última seção do `<main>`.
- Verificação: `astro build` verde (93 páginas);
  `node src/scripts/check-feed.mjs` OK (30 itens); classe `vistos` presente em
  `dist/index.html`, `dist/porcelanato/index.html` e páginas de produto;
  `data-atual` correto no produto; `roi_vistos_v1` no JS embutido. Páginas não
  são novas → sitemap/llms.txt/busca inalterados.

## Next step
Tarefa 10 do `macro_plan.md` (Semana 2, `[build]`): **Follow-up do a11y-audit
(ciclo 15)** no `site-goiania`.
- Ler `Docs/Obsidian/90-medicao/a11y-audit.md` (na raiz do repo ROI Labs, não
  dentro de site-goiania): aplicar o que ficou documentado lá e é seguro sem
  decisão de design.
- Re-inspecionar as páginas novas das semanas 1–2: guias AEO
  (`src/pages/guia/*`), glossário (`src/pages/glossario.astro`), filtros do hub
  (`src/pages/porcelanato/index.astro`), e também as novidades client-side
  (favoritos↔comparador, seção "Vistos recentemente" em
  `src/components/VistosRecentemente.astro`) — corrigir alt/label/contraste
  óbvios.
- Atualizar o arquivo `a11y-audit.md` com o que foi aplicado/pendente.
- Verificação padrão antes de commitar (push = deploy em produção):
  `npx astro build` verde + `node src/scripts/check-feed.mjs` em
  `site-goiania/`. Sem páginas novas → sitemap/llms.txt/busca não mudam.
