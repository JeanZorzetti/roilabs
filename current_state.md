---
status: in_progress
next_effort: low
iteration: 5
updated_at: 2026-07-06T11:58:53.000Z
---

## Last completed
Tarefa 5 (Semana 1, Macro plan 3): **glossário ida-e-volta** no site-goiania.
Auditoria da VOLTA (páginas → âncoras `#termo` de `/glossario/`):

- Os 7 guias mais novos/recentes (como-limpar, como-assentar, erros-ao-comprar,
  piso-vinilico-vs, area-externa, rejunte, liquido-vs) já linkavam o glossário
  (5–10 âncoras cada) — nada a fazer neles.
- Os 4 guias antigos sem volta receberam links no 1º uso de cada termo:
  `como-escolher-porcelanato.astro` (polido, acetinado, natural, junta, bold,
  pei, absorcao-de-agua, lote, calibre, argamassa-colante, formato-grande,
  rejunte), `porcelanato-ou-ceramica.astro` (absorcao-de-agua, retificado,
  junta, bold, antiderrapante, argamassa-colante, rejunte, pei),
  `porcelanato-polido-ou-acetinado.astro` (polido, acetinado, natural),
  `quanto-custa-porcelanato.astro` (natural, lote, argamassa-colante, rejunte,
  paginacao).
- Lado produto: ficha técnica em `src/components/ProdutoDetalhe.astro` linka
  "m² por caixa" → `#m2-por-caixa` e "Retificado" → `#retificado` — cobre todas
  as páginas `/porcelanato/produto/` e as páginas de malha com 1 produto. A
  malha `/porcelanato/[slug]` monta o corpo a partir de strings puras de
  `src/data/porcelanato` (comoEscolher/faq/intro, sem HTML) — injetar link lá
  exigiria reescrever dados; deixado de fora de propósito.

Validado: 17 âncoras usadas × 19 ids existentes em `glossario.astro` (todas
existem; esmaltado/tecnico/destonalizacao sem uso natural nas páginas), máx. 1
link por termo por página (sem duplicata), `astro build` verde (97 páginas) e
âncoras presentes no HTML de dist (guias + página de produto conferidos).

## Next step
Tarefa 6 do `macro_plan.md` (Semana 2, `[low]`): **hub `/guia/` (índice de
guias)** no site-goiania. Hoje os 11 guias são listados no hub `/porcelanato/`
e na calculadora, mas `/guia/` sem slug não é página (não existe
`src/pages/guia/index.astro` — conferir antes; se listagem dedicada equivalente
já existir, registrar "pulado (já existia)"). Criar índice agrupado por
intenção (escolher → comparar → orçar → instalar → manter) usando o registro
`src/data/guias.ts` como fonte, + cards para glossário/calculadora/comparador.
Requisitos: BreadcrumbList coerente, entrar em sitemap/llms.txt/busca interna
(o padrão de descoberta já lê `guias.ts` — conferir se a rota `/guia/` em si
precisa ser adicionada manualmente em sitemap.xml.ts/llms.txt.ts/
busca-index.json.ts), link no footer (`src/components/Footer.astro`), URLs
sempre com barra final. `astro build` verde no site-goiania antes do commit.
