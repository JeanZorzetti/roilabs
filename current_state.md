---
status: in_progress
next_effort: medium
iteration: 9
updated_at: 2026-07-06T16:00:00.000Z
---

## Last completed
Tarefa 9 (Semana 2, Macro plan 3): **Expansão da malha — pulado (sem dado GSC
ainda)**, conforme a válvula prevista na própria tarefa.
`Docs/Obsidian/90-medicao/gsc-miner.md` não existe (verificado por glob no
diretório: só a11y-audit.md, rank-tracking.csv/md e striking-distance.md).
O arquivo depende do secret `GSC_SA_KEY`, previsto ~07-15. Nenhuma página de
malha criada — a disciplina do piso de volume segue valendo. Nenhum código
tocado, nenhum build necessário.

## Next step
Tarefa 10 do `macro_plan.md` (Semana 2, `[medium]`): **Passada CLS/perf
verificável no build**, nos 2 sites deste repo (`/site` e `/site-goiania`,
ambos Astro estático):
- `width`/`height` (ou `aspect-ratio`) em toda `<img>` que não tiver;
- `loading="lazy"` + `decoding="async"` onde faltar — **NUNCA** na imagem
  LCP/hero de cada página;
- conferir `preload` de fonte/imagem de hero onde fizer sentido;
- conferir o tamanho dos scripts client das páginas interativas do goiânia
  (comparar, filtros do hub `/porcelanato/`, favoritos).
Verificar via `astro build` de cada site + preview/Playwright. **NÃO usar
Lighthouse local** (não-confiável nesta máquina). Commitar só com os 2 builds
verdes (cada push deploya direto em produção). Lembrete geral: `npm install`/
`tsc` locais são não-confiáveis (OneDrive, errno -4094), mas `astro build`
funciona.
