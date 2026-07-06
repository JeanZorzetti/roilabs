---
status: in_progress
next_effort: high
iteration: 10
updated_at: 2026-07-06T12:10:00.000Z
---

## Last completed
Tarefa 10 (Semana 2, Macro plan 3): **Passada CLS/perf verificável no build.**
Auditoria de todas as `<img>` dos 2 sites; a maioria já estava coberta
(containers com `aspect-ratio` no global.css, logos com width/height, fontes
com preconnect + display=swap). Corrigido o que faltava — tudo em
`site-goiania`:
- **Masonry do Inspire-se** (`inspire-se.astro` + `inspire-se/[ambiente].astro`):
  única fonte real de CLS — imagens de altura variável sem dimensão intrínseca.
  Novo helper `src/data/img-dims.ts` (sharp, dep transitiva do Astro, lê
  width/height em build) + atributos `width`/`height` nas `<img>` +
  `height: auto` no CSS.
- **LCP das páginas de produto**: `fetchpriority="high"` na imagem principal
  do `ProdutoDetalhe.astro` (sem lazy, como já estava).
- `decoding="async"` em todas as imagens lazy (ProdutoCard, thumbs/ambiente do
  ProdutoDetalhe, inspire-se, capas do hub, templates JS de
  favoritos/VistosRecentemente, strip do `[slug].astro`); thumbs ganharam
  `width/height=64`.
- Scripts client conferidos no dist: maior é cart 14,7 KB; comparar 3,9 KB,
  calculadora 3,9 KB, favoritos 1,9 KB — nada a cortar.
- `/site`: nada a corrigir (única `<img>` é o logo do Header, já com dims; sem
  imagens em conteúdo). `astro build` do site-goiania verde (98 páginas);
  atributos confirmados no HTML do dist. Lighthouse local não usado, conforme
  o plano.

## Next step
Tarefa 11 do `macro_plan.md` (Semana 2, `[high]`): **Auditoria schema +
breadcrumb** no site-goiania. Varrer as páginas criadas nos meses 1–2 e na
semana 1 deste plano — guias de `/guia/` (11, registrados em
`src/data/guias.ts`), `/glossario/`, `/comparar/`, `/favoritos/`,
`/inspire-se/` e sub-páginas por ambiente, `/sobre/`, hub `/guia/` (índice) —
e conferir em cada uma:
- `BreadcrumbList` presente e coerente com a hierarquia real;
- JSON-LD que parseia no build (validar os `<script type="application/ld+json">`
  do dist com JSON.parse);
- nenhuma entidade duplicada no `@graph` da página.
Corrigir as faltas, rodar `astro build` do site-goiania (verde antes de
commitar — push deploya direto em produção) e registrar o resultado
(páginas auditadas × corrigidas) no `current_state.md`. Lembrete: `npm
install`/`tsc` locais não-confiáveis (OneDrive, errno -4094); `astro build`
funciona.
