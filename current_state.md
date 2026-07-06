---
status: in_progress
next_effort: medium
iteration: 16
updated_at: 2026-07-06T21:50:00.000Z
---

## Last completed
**Tarefa 15 concluída** (Semana 4, SplitJud): glossário de honorários
advocatícios em `/glossario` no repo SplitJud (`apps/site`), commit `aa1a68f`
pushado manualmente para `JeanZorzetti/splitjud` main. Entregue:
- `apps/site/src/pages/glossario.astro` — 18 termos em 4 grupos (tipos de
  honorários; sucumbência na prática; parceria entre advogados; divisão e
  repasse): contratuais, sucumbência, êxito/quota litis, arbitrados, dativos,
  assistenciais, recursais, natureza alimentar, destaque, contrato de
  parceria, correspondente, associado, substabelecimento com/sem reserva,
  contrato de risco, rateio, repasse, tabela OAB. Definição BLUF 2–4 frases,
  âncora `#termo` estável por termo, índice de chips no topo.
- Schema: `WebPage` + `DefinedTermSet`/`DefinedTerm` (18) + `BreadcrumbList`
  fundidos no `@graph` existente via `jsonLd` do PublicLayout — validado no
  HTML buildado: parseia, zero `@id` duplicado, placeholders de `schema.ts`
  intocados. Convenção de URL do SplitJud (sem barra final) mantida.
- Interlink: 24 links para os 6 artigos do blog + 10 para `/calculadora`;
  link no Footer (seção Conteúdo) e entrada no `public/llms.txt`.
- `npm run build` verde (16 páginas; sitemap automático via @astrojs/sitemap
  inclui a página). Working tree do SplitJud limpo após push.

## Next step
**Tarefa 16** do `macro_plan.md` (Semana 4, `[medium]`, repo SplitJud em
`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud`, só `apps/site`):
**2–3 artigos novos do cluster honorários.** Passos:
1. Pré-check: `git -C "...\splitjud" status` — precisa estar em `main` limpo.
2. Conferir os 6 slugs existentes em `apps/site/src/content/blog/`
   (divisao-de-honorarios-advocaticios, honorarios-sucumbencia-vs-contratuais,
   contrato-de-parceria-entre-advogados, tabela-de-honorarios-oab,
   gestao-financeira-escritorio-de-advocacia,
   repasse-de-honorarios-correspondentes) — não repetir ângulo.
3. Escrever 2–3 artigos novos: (a) "Advogado associado: remuneração e divisão
   de honorários"; (b) "Saída de sócio do escritório: o que acontece com os
   honorários dos casos em andamento"; (c) "Honorários de sucumbência: como
   dividir quando mais de um advogado atuou". Mesmo padrão dos existentes
   (BLUF, FAQ, interlink com artigos/calculadora/glossário novo `/glossario`
   com âncoras `#termo`), com **`datePublished` visível e no schema desde já**
   (gotcha do handoff: artigos atuais não têm data — checar o frontmatter do
   content collection em `content.config.ts` antes; se não houver campo de
   data, adicionar sem quebrar os artigos existentes).
4. Registrar os artigos novos no `public/llms.txt` (seção "Artigos do blog").
5. `npm run build` verde em `apps/site`; commit e **push manual**:
   `git -C "...\splitjud" push origin main` (o runner só pusha este repo).
6. `current_state.md` continua aqui neste repo. NÃO tocar `apps/app`,
   `prisma/`, `.env*`, nem `[PLACEHOLDER_*]` de `apps/site/src/lib/schema.ts`.
