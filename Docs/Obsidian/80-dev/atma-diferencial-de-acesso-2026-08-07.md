# Por que a Atma tem acesso e os outros 34 não — medido em 07/08/2026

**BLUF: a Atma não tem diferencial de SEO. Ela tem UMA página que respondeu uma pergunta de
preço que o Brasil já fazia em massa.** 86% do tráfego do projeto vem de
`/blog/quanto-custa-alinhador-invisivel` (88% no pico de abril). Todo o resto do portfólio
falha por uma de duas razões — e as duas têm remédios opostos.

Fonte: Search Console, janela de 28 dias fechando em D-3 (04/08/2026), 35 hosts de
`roihub/data/projects.json`, mais série mensal de 16 meses. Scripts descartáveis, não
commitados (`gsc-diff.mjs` / `gsc-fundo.mjs`, em scratchpad) — a apuração de valor
permanente é esta tabela, não o script.

## O placar

| projeto | impr | cli | pos **mediana** | páginas | queries | q/página |
|---|---|---|---|---|---|---|
| **atma** | 4.619 | 100 | **9,3** | **13** | 347 | **26,7** |
| sirius | 2.054 | 26 | 31,3 | 75 | 71 | 0,9 |
| aftercare | 2.038 | **0** | 79,5 | 9 | 107 | 11,9 |
| estetiacrm | 1.129 | 22 | 17,0 | 52 | 21 | 0,4 |
| polarisia | 691 | 31 | 33,0 | 81 | 19 | 0,2 |
| nimblabs | 405 | **0** | 90,7 | 9 | 64 | 7,1 |
| goiania | 329 | 2 | 59,0 | 46 | 41 | 0,9 |
| context | 146 | 0 | 48,0 | 7 | 26 | 3,7 |
| reviewshield | 79 | 0 | 63,0 | 8 | 9 | 1,1 |
| tapepro | 71 | 2 | 43,0 | 23 | 7 | 0,3 |

20 dos 35 projetos têm **zero** impressão. O `portfolio` não tem propriedade nenhuma no GSC
(é `*.vercel.app` — domínio de fornecedor fica fora de toda propriedade).

**Queries não-branded na página 1: Atma 189. Os outros 34 projetos SOMADOS: 31.**
A Atma é o único projeto da casa cuja query MEDIANA está na página 1.

## As quatro explicações que os dados matam

1. **Não é volume de conteúdo — é o inverso.** A Atma tem 13 páginas com impressão contra 75
   do sirius, 81 do polarisia, 52 do estetiacrm. Seis vezes menos página, o dobro de impressão.
2. **Não é esforço por artigo.** O artigo vencedor tem 870 linhas e é o **6º maior de 22** no
   próprio repo. O maior de todos (`alinhador-invisivel-formatura-casamento-2026`, 1.317 linhas,
   51% maior) não aparece nem no top-8 de páginas. **36× de diferença** entre o vencedor
   (3.977 impr) e o 2º blog post (110 impr) — mesmo domínio, mesma stack, mesmo schema, mesmo
   autor, mesmo mês. **Nenhuma variável técnica difere, logo nenhuma variável técnica explica.**
3. **Não é SEO técnico.** @graph, FAQPage, sitemap, llms.txt: a conformidade já mede isso em
   35/35. É piso de entrada, não diferencial.
4. **Não é "ter blog".** É **uma** página do blog. As outras 18 da Atma somam 14% do tráfego.

## O que a Atma tem de fato

**243 das 347 queries são variações de preço** — "quanto custa aparelho invisível",
"alinhador invisível valor", "aparelho invisível mais barato" — uma intenção única com
centenas de fraseados, todos servidos pela mesma página, posição mediana **8,7**.

E **57% das impressões nem aparecem na dimensão `query`** (1.975 linhas contra 4.619 no total
do site): é cauda longa anonimizada pelo GSC. O tamanho da cauda É o ativo.

O critério que a Atma acertou, e que é a única coisa replicável aqui:
**pergunta de PREÇO + produto de CONSUMO + em português + demanda de massa + intenção
comercial + respondida INTEIRA num lugar só.**

## Os outros falham por DUAS doenças, com remédios opostos

### (A) Não há demanda para consertar
`sirius`, `polarisia`, `estetiacrm`, `goiania`, `context`, `tapepro`, `fabrica`.

As queries não-branded são B2B de nicho: `crm solar` = 54 impressões/mês, `sistema para
dermatologia` = 125, `ia para varejo` = 2. **Mesmo em posição #1 isso daria dezenas de cliques
por mês.** Metade do que existe é a própria marca (`sirius crm` 473 impr de 2.054;
`polaris ia` 55 de 691).

**Trabalho de SEO não move esta doença.** Escrever mais artigo aqui é produzir para uma
plateia que não existe. O diagnóstico correto é de PRODUTO/MERCADO, não de conteúdo.

### (B) Há demanda e não há ranking
`aftercare`, `nimblabs`, `reviewshield`.

A aftercare tem **107 queries e 1.973 impressões não-branded — e ZERO clique**, porque a
posição mediana é **79,5** (página 8). A nimblabs: **90,7**. São sites em inglês disputando
com incumbentes estabelecidos.

Aqui a demanda existe e o gargalo é autoridade de domínio — que leva anos e **não se resolve
escrevendo mais artigo**. Ver [[project_nimblabs_portfolio]] (kill D+90/180/270 via GSC): esta
é exatamente a condição que a régua de kill existe para encerrar.

**A Atma é o único caso do portfólio onde demanda existente e posição de página 1 coincidem.**

## ⚠️ O modelo que se quer replicar ESTÁ QUEBRADO

| | jan | fev | mar | **abr** | mai | jun | **jul** | ago (4d) |
|---|---|---|---|---|---|---|---|---|
| impressões | 30.299 | 49.900 | 79.348 | **95.178** | 56.397 | 16.370 | **1.162** | 3.536 |
| cliques | 315 | 517 | 836 | 878 | **929** | 328 | 52 | 57 |

É a desindexação (reindexada em 31/07 — ver [[site_200_is_not_indexed_url_inspection]]). O
ritmo de agosto (~884 impr/dia) é **28% do pico de abril** (~3.173/dia). A recuperação está em
curso e ainda não fechou.

**Leitura:** "replicar a Atma" tem sido perseguir uma máquina que perdeu 99% do tráfego em três
meses. O ativo a copiar é o **critério de escolha da query**, nunca o estado atual do projeto.

## Ressalvas da medição

- **A dimensão `query` é PISO**, não total — o GSC omite as raras. Ver
  [[gsc_query_dimension_hides_rare]]. Os totais desta tabela vêm de `dimensions: []`.
- **A série da Atma começa em 11/01/2026 porque foi quando a propriedade foi verificada**, já
  em 364 impressões/dia e subindo. Isso é backfill de verificação, não rampa orgânica: **a
  idade real do site não é medível a partir daqui.**
- **`gscInicio` está vazio em 33 dos 35 cards** de `projects.json` — só `goiania` (28/06) e
  `tapepro` (21/07) o têm. Comparar projetos por idade hoje é impossível sem preencher isso.
- Janela de 28 dias fechando em D-3; a janela desliza na meia-noite UTC.
