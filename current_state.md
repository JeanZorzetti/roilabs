---
status: in_progress
next_effort: low
iteration: 17
updated_at: 2026-07-06T22:00:00.000Z
---

## Last completed
**Tarefa 16 concluída** (Semana 4, SplitJud): 3 artigos novos do cluster
honorários no repo SplitJud (`apps/site`), commit `b4417d3` pushado
manualmente para `JeanZorzetti/splitjud` main. Entregue:
- `blog/advogado-associado-divisao-de-honorarios` — contrato de associação
  (Regulamento Geral OAB, averbação), tabela sócio × associado × empregado,
  cláusulas mínimas, exemplo de cálculo, riscos trabalhistas, FAQ.
- `blog/saida-de-socio-honorarios-casos-em-andamento` — apuração de haveres,
  tabela de tratamento dos créditos em formação, cláusulas de saída
  (proporcionalidade + pagamento condicionado ao recebimento), cliente que
  acompanha o sócio, FAQ.
- `blog/divisao-honorarios-sucumbencia-varios-advogados` — direito autônomo
  (Lei 8.906), troca de advogado no meio do processo, substabelecimento
  com/sem reserva, termo de divisão + destaque, FAQ.
- Padrão dos existentes: BLUF, H2 em pergunta, tabelas, FAQ, interlink com os
  6 artigos antigos + `/calculadora` + âncoras `#termo` do `/glossario`
  (8+ por artigo), CTA SplitJud com preços reais do repo. **`datePublished`
  visível e no schema** — o campo `publishedAt` já existia no content config
  e o template `[slug].astro` já renderiza `<time>` + Article JSON-LD
  (verificado no HTML buildado: `2026-07-06T00:00:00.000Z` nas 3 páginas).
- 3 entradas novas na seção "Artigos do blog" do `public/llms.txt`.
- `npm run build` verde (19 páginas; sitemap automático inclui os artigos).
  Working tree do SplitJud limpo após push.

## Next step
**Tarefa 17** do `macro_plan.md` (Semana 4, `[low]`, repo SplitJud em
`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\splitjud`, só `apps/site`):
**FAQ + breadcrumbs.** Passos:
1. Pré-check: `git -C "...\splitjud" status` — precisa estar em `main` limpo.
2. `apps/site/src/pages/faq.astro`: verificar se emite schema `FAQPage`; se
   não, adicionar a partir das perguntas REAIS já na página, integrando via
   prop `jsonLd` do layout no `@graph` único (mesmo mecanismo usado pelo
   `/glossario`), sem duplicar entidades e sem tocar `[PLACEHOLDER_*]` de
   `apps/site/src/lib/schema.ts`.
3. Conferir `BreadcrumbList` (JSON-LD, não só o nav visual) nos artigos do
   blog (`pages/blog/[slug].astro` — hoje tem breadcrumb visual mas conferir
   se emite BreadcrumbList no schema), no índice `/blog`, categorias,
   `/calculadora`, `/funcionalidades`, `/precos`, `/depoimentos`, `/faq`.
   `/glossario` já tem (tarefa 15). Adicionar onde faltar, sempre no `@graph`.
4. `npm run build` verde em `apps/site`; validar que o JSON-LD parseia no HTML
   buildado e não há `@id` duplicado; commit e **push manual**
   (`git -C "...\splitjud" push origin main` — o runner só pusha este repo).
5. `current_state.md` continua aqui neste repo (atualizar frontmatter:
   iteration 18, next_effort low — tarefa 18 é `[low]`). NÃO tocar
   `apps/app`, `prisma/`, `.env*`. Convenção de URL do SplitJud: SEM barra
   final.
