# Implementation Plan: O motor de loja que serve qualquer cadeira ocupada

**Branch**: `013-motor-loja-multicadeira` (trabalho direto em `main`) | **Date**: 2026-08-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-motor-loja-multicadeira/spec.md`

## Summary

Colapsar as **duas lojas coladas** (`porcelanato` e `fitas`) em **um motor**: um carrinho, uma
tabela de item de pedido, um caminho de checkout — parametrizados por dois dados novos,
**cadeira-loja** e **unidade de venda**. A 3ª cadeira passa a custar um catálogo + uma linha de
configuração.

A refatoração é **interna e invisível**: nenhuma das 99 URLs se move, nenhum fluxo de compra
muda de etapa, e os 6 pedidos gravados continuam somando R$ 22.091,89. O que torna isso viável
sem inventar arquitetura é que os dois verticais já são **estruturalmente o mesmo fluxo** —
`localStorage` → form-POST 303 → Mercado Pago — divergindo em cinco pontos concretos e
enumeráveis (unidade, regra de preço, frete, obrigatoriedade do documento, linha fixa do
clichê). Cada um desses cinco vira **campo de configuração da cadeira**, não ramo de código.

A chave técnica que desbloqueia a migração sem risco: o item de porcelanato migra como
**unidade `m2`**, não `caixa`. Assim `quantidade × precoUnitario = subtotal` vale para os dois
verticais com os números **exatamente** iguais aos já gravados (`preco_m2` é preservado byte a
byte), e o número de caixas vira detalhe de exibição. Sem essa escolha, unificar exigiria
recalcular preço unitário — e recalcular é o que quebra FR-010.

## Technical Context

**Language/Version**: TypeScript 5.x · Node 20+ · Astro 5 (site estático) · Next.js 16 App Router (app)

**Primary Dependencies**: Astro, Next 16, Prisma 6, Mercado Pago (preference + webhook),
Melhor Envio (frete de fitas). **Nenhuma dependência nova é adicionada nesta feature.**

**Storage**: Postgres (EasyPanel). Schema aplicado por `prisma db push` **manual**, de uma
máquina que alcança o host — o runner standalone não aplica (Constituição, Restrições Técnicas).

**Testing**: `node --import tsx test/*.test.mjs` no `/app` (19 arquivos hoje, rodados em série
pelo `npm test`); scripts de gate no `prebuild`/`postbuild` do `/site-goiania`
(`check-cart-math.mjs`, `check-matrix.mjs`, `check-cadeiras.mjs`, `check-feed.mjs`).

**Target Platform**: `site-goiania` → Astro estático servido por nginx em
`goiania.roilabs.com.br`. `app` → Next standalone em `app.roilabs.com.br`. Ambos EasyPanel/Docker.

**Project Type**: Web — site estático (vitrine + carrinho no browser) + serviço Next (checkout,
webhook, admin, banco). O carrinho é 100% cliente; **o servidor é a única autoridade de dinheiro**.

**Performance Goals**: nenhuma meta nova. Restrição: não regredir o LCP das páginas de produto
(o carrinho é `noindex`, mas as páginas de produto são o ativo). O bundle do carrinho unificado
não pode crescer a ponto de aparecer no LCP das páginas que o importam.

**Constraints**:
- **99 URLs do sitemap são intocáveis** (FR-008). Redirect não satisfaz.
- **Zero prova ponta a ponta de pagamento** — teste com cartão real está cancelado (Out of
  scope). Toda a verificação de dinheiro é por **soma no banco** e **teste unitário**, nunca por
  compra real. Nenhuma afirmação de receita pode ser feita a partir desta entrega.
- Migração de dados sobre **6 pedidos reais**, sem janela de manutenção declarada.
- Build local não prova nada (Constituição II).

**Scale/Scope**: 99 URLs · 2 cadeiras hoje → 3+ depois · ~100 SKUs de porcelanato + 3 de fita ·
6 pedidos · 931 linhas de carrinho a colapsar em um.

## Constitution Check

*GATE: passa antes da Fase 0 e é re-avaliado depois da Fase 1.*

| Princípio | Como este plano satisfaz | Status |
|---|---|---|
| **I. Env vars primeiro** | Nenhuma env var nova. O plano registra que qualquer falha de frete/pagamento durante a migração se investiga **primeiro** em `MELHOR_ENVIO_*` e nos tokens do MP — o alerta de `alertarFreteQuebrado` já diz isso na própria mensagem, e o comportamento é preservado. | ✅ |
| **II. Verificação em ambiente real** | Nenhuma task fecha com "build passou". Os gates são: `npm test` no app (unitário, roda em qualquer lugar), **soma dos 6 pedidos consultada no Postgres de produção**, e **navegação no browser em produção** nas duas lojas. A quickstart lista os comandos e o output esperado. | ✅ |
| **III. Simplicidade deliberada (YAGNI)** | Zero dependência nova. Dois conceitos novos (cadeira-loja, unidade de venda) e ambos são **exigidos literalmente** por FR-001/FR-003 — não são abstração especulativa. Três atalhos deliberados ficam marcados com teto e upgrade (ver Complexity Tracking). O saldo é **negativo em código**: SC-004 exige que a superfície encolha. | ✅ |
| **IV. Qualidade de página** | FR-009 é mais forte que o princípio: as telas do comprador não podem nem *parecer* diferentes. Nenhuma tela nova é criada; a página de cadeira continua sendo escopo da 012. | ✅ |
| **V. Spec-driven e entrega fechada** | `specify → clarify → plan` cumpridos; `tasks`/`implement` na sequência. `handoff.md` já existe na pasta e é atualizado no fechamento, com commit + push. | ✅ |

**Restrições técnicas verificadas:** monorepo por app respeitado (nada novo fora de
`site-goiania/src` e `app/src`); `prisma db push` manual previsto como task própria; patterns
Next 16 (`params: Promise<…>`, `getAuthFromRequest`, singleton `@/lib/prisma`, `@@map`
snake_case) já valem no código tocado e são mantidos; LLM não entra nesta feature.

**Resultado do gate:** PASS, com 3 itens em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/013-motor-loja-multicadeira/
├── plan.md              # Este arquivo
├── research.md          # Fase 0 — as 5 decisões de arquitetura e o que foi rejeitado
├── data-model.md        # Fase 1 — o item unificado, a cadeira-loja, a unidade de venda
├── quickstart.md        # Fase 1 — como verificar em ambiente real (Constituição II)
├── contracts/
│   ├── pedidos-post.md  # O contrato do form-POST de checkout (o que muda e o que não muda)
│   └── loja-config.md   # O contrato de "abrir uma cadeira": o que declarar, o que o build exige
├── checklists/
│   └── requirements.md  # já existe
├── handoff.md           # já existe — atualizado no fechamento
└── tasks.md             # Fase 2 — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
site-goiania/src/                      # Astro estático — vitrine, carrinho, checkout (form)
├── data/
│   ├── lojas.ts                       # NOVO — o registro de cadeiras-loja (FR-001)
│   ├── unidades.ts                    # NOVO — as 3 unidades de venda (FR-003)
│   ├── produtos.ts                    # catálogo porcelanato (existente, inalterado)
│   ├── fitas.ts                       # catálogo fitas (existente, inalterado)
│   └── cadeiras.ts                    # páginas de cadeira da 012 (NÃO tocado aqui)
├── lib/
│   ├── cart.ts                        # REESCRITO — carrinho único, multicadeira
│   └── cart-fitas.ts                  # REMOVIDO ao fim da fase 3
├── pages/
│   ├── carrinho.astro                 # REESCRITO — o único carrinho
│   ├── carrinho-fitas.astro           # vira redirect (é noindex, não é ativo de busca)
│   ├── porcelanato/**                 # URLs INTOCADAS
│   └── fitas/**                       # URLs INTOCADAS
└── scripts/
    ├── check-cart-math.mjs            # ESTENDIDO — cobre as 3 unidades
    └── check-lojas.mjs                # NOVO — prefixo único, slug único, catálogo não-vazio

app/                                   # Next 16 — checkout, webhook, admin, banco
├── prisma/schema.prisma               # ItemPedido generalizado; ItemPedidoFita removido na fase 3
├── scripts/
│   ├── migrate-013-backfill.mjs       # NOVO — backfill explícito, linha a linha (FR-011)
│   └── verify-013-sums.mjs            # NOVO — a prova de SC-003, rodável antes E depois
├── src/lib/
│   ├── lojas.ts                       # NOVO — espelho servidor do registro de cadeiras
│   ├── precos.ts / precos-fitas.ts    # mantidos como fonte de preço por cadeira
│   └── cupons.ts                      # escopo por cadeira (renomeia 'vertical' → 'cadeira')
├── src/app/api/pedidos/route.ts       # REESCRITO — um caminho, sem ramo por vertical
├── src/app/admin/pedidos/page.tsx     # uma leitura de itens (FR-017 / US5)
└── test/
    ├── item-unificado.test.mjs        # NOVO — quantidade × unitário = subtotal, nas 3 unidades
    ├── carrinho-uma-cadeira.test.mjs  # NOVO — FR-005/FR-005a
    └── loja-config.test.mjs           # NOVO — cadeira sem cobrança/sem catálogo não vende
```

**Structure Decision**: o monorepo existente é mantido sem nenhuma pasta nova de topo. Todo o
motor mora em dois lugares que já existem — `site-goiania/src` (comprador) e `app/src`
(dinheiro). O registro de cadeiras é **duplicado de propósito** entre os dois (`data/lojas.ts` e
`lib/lojas.ts`): o site é estático e não pode importar do app, e um pacote compartilhado para
~40 linhas de configuração seria a abstração que a Constituição III proíbe. A trava contra
divergência é um teste, no mesmo padrão que `check-matrix.mjs` já usa entre dois repos.

## Fases de execução

A ordem existe para que **nenhum passo isolado possa derrubar a loja**. Cada fase é deployável
e reversível sozinha.

### Fase 1 — O dado, sem trocar o comportamento

Declarar `unidades.ts` e `lojas.ts` com as duas cadeiras que já existem, e fazer o código atual
**ler daí** em vez de constantes espalhadas. Nenhum arquivo de rota muda, nenhuma tela muda.
Ao fim da fase, `porcelanato` e `fitas` são configuração, mas ainda usam seus dois carrinhos.

*Prova:* o site continua idêntico; `check-lojas.mjs` passa; nenhuma URL mudou.

### Fase 2 — O item de pedido unificado (a fase de risco)

Adicionar as colunas novas a `itens_pedido`, **sem remover nenhuma antiga**. Rodar
`migrate-013-backfill.mjs`, que copia `itens_pedido_fita` → `itens_pedido` e preenche as colunas
novas dos itens de porcelanato existentes. Rodar `verify-013-sums.mjs` **antes e depois** e
comparar.

*Prova:* soma dos 6 pedidos igual a R$ 22.091,89 nos dois lados; contagem de itens por pedido
igual; `preco_m2` e `preco_rolo` preservados nas colunas legadas para conferência cruzada.

⚠️ **A coluna nova não reescreve linha gravada** (FR-011, e a landmine já registrada duas vezes
neste repo). O backfill é `UPDATE` explícito por linha, nunca `@default`.

### Fase 3 — O motor (carrinho e checkout únicos)

Reescrever `cart.ts` como carrinho multicadeira com uma chave de `localStorage`, reescrever
`carrinho.astro` como o único carrinho, e colapsar `pedidoFitas` no caminho principal de
`/api/pedidos`. `carrinho-fitas.astro` vira redirect. `admin/pedidos` passa a ler uma relação só.

*Prova:* `npm test` no app; compra completa até a tela do Mercado Pago nas duas lojas, **em
produção**, sem pagar; as 99 URLs respondem.

### Fase 4 — A prova de que o motor existe

Declarar uma cadeira de teste (assinatura recorrente, 2 produtos fictícios, `publicada: false`
até a hora do teste), percorrer a compra, e conferir com `git diff --name-only` que **só arquivos
de dado** foram tocados. Remover a cadeira depois.

*Prova:* SC-001 e SC-006 medidos, não afirmados.

### Fase 5 — A limpeza

Remover `cart-fitas.ts`, o modelo `ItemPedidoFita`, a tabela `itens_pedido_fita` e as colunas
legadas de `itens_pedido`. **Só depois** de a fase 3 estar em produção e verificada.

*Prova:* SC-004 medido — um carrinho, uma tabela de item.

## Complexity Tracking

> Três atalhos e uma duplicação deliberados. Cada um tem teto e caminho de upgrade declarados,
> como a Constituição III exige.

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| **Registro de cadeiras duplicado** entre `site-goiania/src/data/lojas.ts` e `app/src/lib/lojas.ts` | O site é Astro estático e não importa do app; são dois containers e dois deploys | Um pacote npm compartilhado (ou workspace) para ~40 linhas de config adiciona build step, versionamento e um terceiro lugar para quebrar. **Teto:** quando a config passar de ~5 cadeiras ou divergir na prática apesar do teste. **Upgrade:** extrair para `packages/lojas`. **Trava hoje:** teste de paridade, mesmo padrão do `check-matrix.mjs` |
| **`linhaFixa` (clichê) como regra declarada na cadeira**, com um único uso hoje | FR-001 proíbe ramo de código por cadeira, e o clichê é dinheiro real já cobrado (R$ 80, isento para arte repetida) | Deixar o `if (slug === 'fita-transparente-personalizada')` dentro da rota mantém exatamente o ramo por vertical que a feature existe para eliminar. **Teto:** um único formato de regra (slug-gatilho + valor + isenção por compra anterior); qualquer regra que não caiba nele **não** deve ganhar campo novo. **Upgrade:** se surgir uma segunda forma de linha fixa, aí sim modelar |
| **Colunas legadas mantidas vivas por uma fase inteira** (`caixas`, `m2`, `preco_m2`, `rolos`, `preco_rolo`, `faixa_min/max`) | É a única forma de conferir a migração **contra o dado original** em vez de contra a própria migração | Migrar e dropar no mesmo passo torna o erro irreversível e a conferência circular — e não há teste de pagamento ponta a ponta para pegar o estrago depois. **Teto:** removidas na fase 5, depois da fase 3 verificada em produção. **Upgrade:** N/A, é remoção |
| **Endereço/frete continuam com dois modelos** (tabela por CEP · cotação Melhor Envio) | São dois provedores reais e diferentes; unificá-los seria uma segunda refatoração de dinheiro no mesmo diff | Um cálculo único exigiria escolher um provedor para as duas lojas — mudança comercial, não técnica. **Teto:** a escolha é campo da cadeira (`frete: 'tabela-cep' \| 'cotacao' \| 'nenhum'`), três valores fechados. **Upgrade:** quando uma 4ª forma aparecer, e não antes |

## Constitution Check — re-avaliação pós-Fase 1

O design fechado não introduziu violação nova. Duas observações que só apareceram depois de
desenhar:

- **Princípio III ficou mais forte, não mais fraco.** O desenho final adiciona 3 arquivos de
  dado, 3 arquivos de teste e 2 scripts, e **remove** um carrinho inteiro, uma lib de carrinho,
  um modelo Prisma, uma tabela e um ramo de rota. O rateio de desconto do Mercado Pago, hoje
  duplicado byte a byte nos dois ramos, passa a existir uma vez.
- **Princípio II ganhou um item que a Fase 0 não tinha visto**: o link de carrinho
  compartilhado (`/carrinho?c=<token>`, validade de 30 dias) vive **fora** do browser do
  comprador e não pode ser convertido de antemão. A verificação dele entrou na quickstart.

Um risco fica **registrado e não resolvido** por decisão da spec: o caminho pagamento → webhook
→ negócio → success fee segue sem prova ponta a ponta, porque o teste com cartão real está
cancelado. FR-012 e FR-013 são preservação de comportamento verificada por teste unitário e por
leitura do banco — **não** são prova de que o dinheiro chega.

## O que este plano deliberadamente NÃO faz

- **Não move nenhuma URL.** `/loja/<cadeira>/…` é a 012, US4.
- **Não migra catálogo para o banco.** Continua arquivo versionado (Assumption da spec).
- **Não liga cobrança recorrente.** O 1º ciclo é cobrado; a renovação é a spec 014.
- **Não testa pagamento com cartão real.** Cancelado pelo Jean, não reabrir.
- **Não publica cadeira nenhuma.** Publicar é a 012.
