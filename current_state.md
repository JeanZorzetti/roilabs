---
status: in_progress
next_effort: medium
iteration: 9
updated_at: 2026-07-05T13:10:00.000Z
---

## Last completed
Tarefa 10 (Semana 2, `[build]`): **Follow-up do a11y-audit** — re-inspeção
concluída, **nenhuma correção de código necessária**.

- Auditoria original (ciclo 15) já tinha aplicado os itens mecânicos
  (aria-labels em calculadora/carrinho); nada pendente lá além do achado de
  contraste `--hivis`, que segue como decisão de design do dono.
- Re-inspecionado o source de todas as páginas novas das semanas 1–2:
  - Guias novos (`guia/porcelanato-area-externa`, `guia/rejunte-porcelanato`,
    `guia/porcelanato-liquido-vs-porcelanato`): conteúdo puro, sem
    img/input/button. OK.
  - `glossario.astro`: âncoras "#" com `aria-label`. OK.
  - Filtros do hub (`porcelanato/index.astro`): selects dentro de `<label>`,
    contador `role="status"` + `aria-live`, botão com texto. OK.
  - Favoritos↔comparador (`favoritos.astro`, `comparar.astro`): botões com
    texto/`aria-label`/`aria-pressed`, imgs JS com alt. OK.
  - `VistosRecentemente.astro` e `inspire-se/[ambiente].astro`: alts
    descritivos. OK.
- `Docs/Obsidian/90-medicao/a11y-audit.md` atualizado com a seção
  "Follow-up — páginas novas das semanas 1–2 (2026-07-05)".
- Sem mudança de código em site-goiania → build não necessário nesta
  iteração (só docs).

## Next step
Tarefa 11 do `macro_plan.md` (Semana 3, `[plan]`): **2 artigos AEO no blog do
`/site`** (o site institucional B2B da ROI Labs, em `site/`, Astro), mirando o
fornecedor candidato:
- (a) "Pago pelo sucesso vs agência de marketing: a conta real para quem vende
  material de construção";
- (b) "Exclusividade de nicho: por que só existe uma cadeira de porcelanato em
  Goiânia".
- Padrão: BLUF, FAQPage schema, números honestos — usar a fórmula do success
  fee que o simulador `/simulador` do `/site` (ciclo 15) já replica (ler o
  código do simulador para extrair a fórmula, não inventar números).
- CTA para `/simulador/` e para o form de candidatura.
- Verificar antes como o blog do `/site` está estruturado (coleção/paths dos
  posts existentes) e seguir o mesmo padrão de registro; páginas novas entram
  em sitemap, `llms.txt` e busca interna do `/site`, conforme padrão existente.
- URLs sempre com barra final. Verificação antes de commitar (push = deploy):
  `npx astro build` verde dentro de `site/`.
