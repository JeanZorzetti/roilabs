---
status: in_progress
next_effort: medium
iteration: 4
updated_at: 2026-07-04T21:30:00.000Z
---

## Last completed
Ciclo 15, tarefa 4 (`[plan]` promovida a implementação direta, mesmo padrão
da tarefa 1 — Simulador de ROI para o fornecedor) em `/site`:

- Li `app/src/lib/success-fee.ts` **apenas leitura** (não importei nem
  modifiquei) para entender a fórmula: `calcularFaturaMensal` soma o valor
  dos negócios elegíveis (`base`) e calcula `valor = base * comissaoPct`
  (comissaoPct é 0–1, negociado por parceiro — não há default fixo no
  código, então o simulador expõe o % como campo editável, default 10%).
- Página nova `site/src/pages/simulador.astro`: formulário client-side
  (ticket médio, pedidos/mês, % negociado) que replica a MATEMÁTICA
  (`receita = ticket × pedidos`; `fee = receita × pct`; `líquido = receita
  - fee`) num `<script is:inline>` sem dependência nova, reaproveitando as
  classes de design já existentes (`.form-card`, `.readout`, `.metric`).
  CTA final aponta para `/#candidatar` (âncora do formulário de
  candidatura já existente na home, achei o id `id="candidatar"` em
  `site/src/pages/index.astro`).
- `sitemap.xml.ts` e `llms.txt.ts` do `/site` atualizados com a URL nova
  `/simulador/`, mesmo padrão das entradas existentes.
- Build verificado com `npx astro build` (dentro de `/site`): 11 páginas
  geradas (antes 10), sem erro; `/simulador/index.html` e a entrada em
  `dist/sitemap.xml` confirmados.
- Matemática conferida com 3 casos manuais: (450×40×10% → receita 18000,
  fee 1800, líquido 16200), (1000×10×15% → 10000/1500/8500), (0 → tudo 0).
  Todos batem com `base * comissaoPct` de `success-fee.ts`.

Não toquei em `/app`, pagamento, DB nem deploy. Nenhuma dependência nova.

## Next step
Tarefa 5 do `macro_plan.md` (Ciclo 15, última) — `[build]` **Auditoria
básica de acessibilidade em `/site-goiania`**:

- Rodar `npx astro build` dentro de `/site-goiania` e inspecionar o HTML
  gerado em `dist/` (não usar ferramenta paga) das páginas: hub
  (`/porcelanato/`), uma página de produto, `/calculadora/`, carrinho e
  `/orcamento/` (conferir nomes exatos de rota antes, podem ter mudado).
- Procurar por: `<img>` sem `alt` (ou `alt=""` em imagem não-decorativa),
  contraste baixo (comparar cores usadas no CSS com `--l-muted`/`--d-muted`
  contra fundo — checagem manual, sem ferramenta), `<input>`/`<select>`
  sem `<label>` associado (`for`/`id`).
- Registrar os achados em `Docs/Obsidian/90-medicao/a11y-audit.md` (criar
  se não existir).
- Corrigir DIRETO (sem pedir permissão) apenas o que for seguro e mecânico:
  alt text faltando (descrever a partir do nome do produto/contexto),
  label ausente (associar via `for`/`id` ou `aria-label` se não houver
  texto visível óbvio). NÃO mexer em contraste/cores do design system
  sozinho — só documentar como achado para decisão de design.
- Depois de corrigir: rodar `npx astro build` de novo pra confirmar que
  nada quebrou.
- Essa é a ÚLTIMA tarefa do `macro_plan.md` atual. Ao terminá-la e
  commitar, marcar `status: done` neste arquivo (todas as 5 tarefas do
  Ciclo 15 concluídas) — não inventar tarefa nova além do que está no
  `macro_plan.md`.
