---
status: in_progress
next_effort: medium
iteration: 17
updated_at: 2026-07-05T19:20:00.000Z
---

## Last completed
**Tarefa 17 (Semana 4, `[plan]`, SplitJud) concluída.** Calculadora pública de
divisão de honorários em `apps/site/src/pages/calculadora.astro`
(`/calculadora`). Pré-check ok (`main` limpo). Commit `bff4f53` pushado em
`github.com/JeanZorzetti/splitjud` main.

- Matemática replicada de `apps/app/src/hooks/useSplitsView.ts` (SÓ a lógica,
  nada importado): percentual = `total × pct / 100`, fixo = valor pactuado,
  restante fica com o escritório. Verificado com asserts em Node (10000 → 30%
  = 3000, fixo 500, resto 6500).
- Client-side puro (vanilla JS no `<script>` do Astro): valor total +
  linhas de participantes (nome, modo %/fixo, valor), adicionar/remover,
  tabela de resultado com "Restante (escritório)" e aviso quando repasses
  excedem o total. Nada é enviado a servidor.
- AEO: BLUF, seção "Como a conta é feita" com exemplo, 5 FAQs visíveis +
  `FAQPage` e `WebPage` no `@graph` (base ORG/WEBSITE/PERSON via `buildGraph`,
  sem duplicar entidades — 1 só `Organization` no HTML; `[PLACEHOLDER_*]`
  intocados). CTA para `https://app.splitjud.com.br/auth`. Interlinks para os
  3 artigos principais do blog.
- Descoberta: link "Calculadora" no Header (nav), "Calculadora de honorários"
  no Footer, entrada no `public/llms.txt`; sitemap automático
  (@astrojs/sitemap) já inclui `/calculadora` (conferido no `sitemap-0.xml`).
- `npm run build` verde em `apps/site` (15 páginas).

## Next step
Executar a **tarefa 18 do macro_plan.md** (`[build]`, SplitJud): **interlink +
descoberta no SplitJud**.

1. Repo: `C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud` (confirmar `main`
   limpo antes; sujo → `status: blocked`). Trabalhar SÓ em `apps/site` e
   `docs/`.
2. Ligar artigos ↔ landing ↔ calculadora: links contextuais nos 6 artigos de
   `apps/site/src/content/blog/` apontando para `/calculadora` (e entre si
   onde fizer sentido), e da home (`index.astro`) para a calculadora. A
   calculadora já linka 3 artigos; Header/Footer/llms.txt já a listam
   (feito na tarefa 17).
3. Conferir `llms.txt` e sitemap com TODAS as páginas novas do mês (6 artigos
   + calculadora) — sitemap é automático via @astrojs/sitemap, llms.txt é
   manual em `apps/site/public/llms.txt` (hoje só lista páginas principais;
   avaliar listar os artigos do blog).
4. Conferir que o `@graph` das páginas novas integra o grafo único de
   `apps/site/src/lib/schema.ts` sem duplicar entidades e SEM tocar nos
   `[PLACEHOLDER_*]`.
5. `npm run build` verde em `apps/site` antes de commitar; push manual
   (`git -C "...\splitjud" push origin main`). `current_state.md` continua
   neste repo (ROI Labs).
