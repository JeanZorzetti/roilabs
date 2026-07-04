---
status: in_progress
next_effort: medium
iteration: 2
updated_at: 2026-07-04T20:10:00.000Z
---

## Last completed
Ciclo 15, tarefa 2 (`[build]` estimador de acessórios na `/calculadora`,
`site-goiania/src/pages/calculadora.astro`):

- Confirmei que `atributos.dimensao` no catálogo (`produtos.ts`/`porcelanato.ts`)
  é texto livre com múltiplos formatos por produto (ex.
  `'90×90 cm / 120×60 cm'`, `'60×60 a 120×120 cm'`) — não dá pra parsear com
  segurança pra uma única dimensão numérica. Optei pela abordagem (b) do
  `current_state.md` anterior: campo novo "Tamanho da peça" (`<select>`
  `.calc__tamanho`) com 3 faixas e coeficiente fixo de rejunte por m²
  (peça pequena até 30×30 → 0,5 kg/m²; média 45×45–60×60 → 0,35 kg/m²,
  selecionada por padrão; grande 60×120+ → 0,25 kg/m²) — valores de mercado
  pra junta ~2mm.
- Argamassa: regra de bolso `sacos = ceil(area_m2 * 5 / 20)` (5 kg/m² de
  consumo médio, saco de 20 kg).
- Ambas as estimativas usam a área **medida** (sem a folga de corte — folga
  é sobra de caixa fechada, não material espalhado no piso).
- Novo parágrafo `.calc__acessorios` abaixo do resultado de caixas, com o
  texto "Estimativa de material: ~X kg de rejunte · Y saco(s) de argamassa
  (20 kg) — confirme com o revendedor." (mesmo disclaimer pedido no plano).
- Recalcula em `refresh()` junto com o resto (mesmo listener `input`/`change`
  do restante do form), limpo quando a área é zerada.

Verificado com `npx astro build` (86 páginas, sem erro) e conferi a
matemática na mão: ambiente de 20 m², peça média (0,35 kg/m²) →
7,00 kg de rejunte e `ceil(20*5/20)=5` sacos de argamassa — bate com a
fórmula. Confirmei no HTML gerado (`dist/calculadora/index.html`) que os
elementos `.calc__tamanho` e `.calc__acessorios` estão presentes. Não rodei
`npm run build` (dispara `postbuild`/`indexnow.mjs`, que faz POST real —
evitado conforme instrução do plano).

Não toquei em `/app`, pagamento, DB nem deploy. Nenhuma dependência nova.

## Next step
Tarefa 3 do `macro_plan.md` (Ciclo 15) — `[build]` **Galeria "Inspire-se"
reaproveitando as fotos de ambiente** em `/site-goiania`:

- Criar página nova (ex. `src/pages/inspire-se.astro` — escolher slug final
  olhando o padrão de URLs já usado, ex. `/porcelanato/`, `/comparar/`) que
  reúne as fotos de `imagensAmbiente` (campo já existente em cada produto —
  ver `produtos.ts`/`porcelanato.ts`) de todos os produtos do catálogo, num
  mural tipo lookbook/masonry. Zero mineração nova de fotos — já foram
  baixadas nos ciclos 11-14.
- Cada foto do mural deve linkar pro produto de origem
  (`/porcelanato/produto/<slug>/`), reaproveitando o padrão de link já usado
  em `ProdutoCard.astro`/`favoritos.astro`.
- Atualizar `sitemap.xml.ts` (`src/pages/sitemap.xml.ts`) incluindo a nova
  rota (a página é indexável, diferente de `/carrinho`/`/favoritos` que são
  `noindex` por serem pessoais — este mural é conteúdo público/SEO).
- Atualizar `llms.txt` (procurar arquivo, provável
  `public/llms.txt` ou gerado por script) com a nova página.
- Antes de escrever qualquer código: grep em `handoff.md` por "inspire" ou
  "lookbook" pra confirmar que não foi proposto e descartado em ciclo
  anterior (regra do topo do `macro_plan.md`).
- Depois de implementar: rodar `npx astro build` (não `npm run build`) e
  conferir visualmente (`astro preview` ou abrindo o HTML gerado) que as
  fotos renderizam e os links apontam pro produto certo.

Depois da tarefa 3, seguem as tarefas 4 (`[plan]` simulador de ROI em
`/site`) e 5 (`[build]` auditoria a11y) — ver `macro_plan.md` para o texto
completo de cada uma.
