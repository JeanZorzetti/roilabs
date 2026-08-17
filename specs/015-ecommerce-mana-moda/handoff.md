# Handoff — 015 Maná Moda Social, fim da Fase 1

**Status em 17/08/2026**: Fase 1 completa, commitada e pushada no branch `015-ecommerce-mana-moda`.
Fases 2–8 pendentes. Este documento é para a **próxima sessão continuar a partir da Fase 2** —
não é o `handoff.md` final (esse é a T072, escrito no fechamento da Fase 8, e vai reescrever
este arquivo com o estado completo da feature).

Leia primeiro: [tasks.md](./tasks.md) (a lista de tasks) e [plan.md](./plan.md) (o porquê da
ordem das fases). Este handoff só resume o que já existe e o que vem a seguir.

## O que existe agora (Fase 1 — "o dado, sem vender nada")

Nenhuma rota nova, nenhum host novo, nenhum schema. O site no ar está **idêntico** ao de antes
desta feature — confirmado pelo `astro build` com exatamente 99 `<loc>` no sitemap (as URLs da
Maná não entram ainda) e por `git diff --stat` não tocar `pages/porcelanato/**`, `pages/fitas/**`,
`api/pedidos/route.ts` nem `schema.prisma`.

Criado/alterado:
- `site-goiania/src/data/unidades.ts` — unidade `peca` (peça inteira ≥ 1)
- `site-goiania/src/data/mana.ts` **(novo)** — catálogo real: 4 produtos, 24 SKUs
- `app/src/lib/precos-mana.ts` **(novo)** — espelho servidor, autoridade de preço/peso
- `site-goiania/src/data/lojas.ts` + `app/src/lib/lojas.ts` — cadeira `mana` registrada com
  `publicada: false`; campos novos `emailObrigatorio`/`split` em **todas** as cadeiras
  (porcelanato/fitas com `split: null` — comportamento de hoje intocado byte a byte)
- `site-goiania/src/scripts/check-mana.mjs` **(novo gate)**, registrado no `prebuild`
- `check-lojas.mjs` e `check-cart-math.mjs` estendidos com as invariantes da unidade `peca`/`split`
- `app/test/mana-paridade.test.mjs` **(novo)**, no `npm test`
- `site-goiania/public/img/mana/*.jpg` — 4 fotos reais, otimizadas (eram até 46MB em SVG com
  C2PA embutido; extraídas e redimensionadas para ≤265KB cada com `sharp`)

Gate da Fase 1 (T011) — tudo verde nesta sessão: `check-lojas` · `check-mana` · `check-cart-math`
· `astro build` (99 URLs) · `tsc --noEmit` · `npm test` (26 arquivos) · prova negativa do diff.

## Catálogo v1 — de onde veio e o que falta

O catálogo **não veio de um sistema de produto** — a Maná não tinha um. Foi montado nesta sessão
a partir de (a) scraping do Instagram `@manamodasocial` (alt-text OCR de posts promocionais) e
(b) fotos e preços reais que o Jean repassou de um catálogo de WhatsApp/loja física. É
**deliberadamente enxuto**: 4 produtos, todos com tamanhos únicos `P/M/G/GG` (decisão do Jean —
não há tabela de disponibilidade por tamanho ainda) e **peso pesquisado, não medido**
(pesquisa de peso médio de roupa social — camisa 200-300g, calça 400-600g, terno 1000-1500g —
ponto médio de cada faixa). Isso é um **knob de operador**, não fato: a T038/T064 já preveem
recalibrar o peso contra o Melhor Envio real antes da Fase 7 (publicar). Se a Maná quiser
crescer o catálogo antes da Fase 7, é só adicionar produtos em `mana.ts` + `precos-mana.ts`
(mesmo formato, `check-mana.mjs` valida a paridade automaticamente).

## Próximo passo: Fase 2 — o host e a vitrine (T012–T023)

Primeira fase que **toca produção**: registro DNS de `mana.roilabs.com.br` no Cloudflare,
alteração do `nginx.conf` do site que está no ar, e deploy do host novo. **Não é seguro
autoexecutar sem confirmação explícita do Jean** — são ações em sistema compartilhado, difíceis
de reverter na hora (cert emitido contra NXDOMAIN não se re-emite sozinho — já custou caro na 012).

Ordem interna que importa (tasks.md §Dependências): **T021 (DNS) antes de T023 (gate)** — o
cert TLS depende do DNS já resolver. T017 depende de T012+T014+T015.

Antes de começar, ler:
- [quickstart.md §Fase 2](./quickstart.md) — comandos e output esperado de cada prova
- [research.md](./research.md) D1 — por que a URL fica `mana.roilabs.com.br/mana/<produto>/`
  (prefixo redundante, decisão deliberada) e o que custaria tirar o prefixo

## Avisos que atravessam a feature inteira (não só a Fase 2)

- 🚨 `git push` em `main` é **deploy**. Este trabalho fica no branch `015-ecommerce-mana-moda`
  até o gate da fase correspondente fechar — merge só depois.
- 🚨 `npm run build` no `site-goiania` **submete ao IndexNow**. Build exploratório é
  `npx astro build`.
- ⚠️ Banco: `2.24.207.200:5443/roilabs_db`. `:5445` é o `roihub_db` — schema errado se apontar lá.
- ⚠️ O `DATABASE_URL` do `.env` da raiz aponta para o host interno do Docker e tem um `]` colado
  no fim — usar o endpoint externo sem o `]` (quickstart.md §0).
- 🚩 A frase que precisa sobreviver até o fim: **sandbox verde do MP (Fase 4) prova a fiação,
  não prova que dinheiro real chega.** Cartão real segue vetado.

## Estado das fotos

As fotos originais (repassadas em `specs/015-ecommerce-mana-moda/fotos/`, até 46MB cada, SVG
com C2PA embutido) **não foram commitadas** — estão no `.gitignore` porque bloariam o repo. A
versão que o site usa é a otimizada em `site-goiania/public/img/mana/` (essa está no git). Se
o catálogo crescer, o fluxo é: receber a foto → extrair/otimizar com `sharp` (mesmo script usado
nesta sessão, `resize-mana-photos.mjs`, ficou no scratchpad da sessão — não está no repo) →
salvar direto em `public/img/mana/`.
