# Handoff — e-commerce de fitas adesivas no `goiania.roilabs.com.br`

**Criado**: 2026-07-22 · **Status**: briefing para `/speckit-specify` (spec 011). **Nada implementado ainda.**

> **BLUF:** `goiania.roilabs.com.br` **já é um e-commerce funcionando** — o trabalho não é criar um, é **adicionar um segundo vertical (fitas Tapepro) como catálogo primário** sem quebrar o de porcelanato, que tem 41 páginas indexadas e histórico no GSC. O código assume "porcelanato vendido por m²" em **quatro camadas**, incluindo a autoridade de dinheiro no servidor e a tabela do banco. O bloqueio mais sério não é catálogo: é **frete** — a tabela cobre só a Grande Goiânia e o Tapepro é B2B nacional.

## Decisões já travadas (Jean, 22/07)

1. **Dois catálogos, fitas em primeiro lugar.** Mantém porcelanato (preserva o SEO); fitas assume a hierarquia principal (home, nav, identidade do site).
2. **Modelo híbrido:** preço público para SKU padrão (compra direta no carrinho) + orçamento para personalizado/volume. Isso **muda** a decisão comercial anterior do Tapepro ("não publicar preço"), que valia para o institucional `tapepro.roilabs.com.br`.

## O que já existe (verificado no código, não de memória)

| Camada | Onde | Estado |
|---|---|---|
| Catálogo | [porcelanatos.json](ROI Labs/site-goiania/porcelanatos.json) + [produtos.ts](ROI Labs/site-goiania/src/data/produtos.ts) | 30 SKUs, helpers de título/descrição/feed/tags/relacionados |
| Malha pSEO | [porcelanato.ts](ROI Labs/site-goiania/src/data/porcelanato.ts) | 41 páginas indexadas + 5 guias AEO |
| Carrinho | localStorage `{slug, caixas}` + [MiniCart.astro](ROI Labs/site-goiania/src/components/MiniCart.astro) | client-only, pSEO intacto |
| Checkout | [api/pedidos/route.ts](ROI Labs/app/src/app/api/pedidos/route.ts) | form-POST 303 → Mercado Pago; **servidor recalcula todo o dinheiro** (FR-005) |
| **Preço (autoridade)** | [precos.ts](ROI Labs/app/src/lib/precos.ts) | `slug → [m2_caixa, preco]` **espelhado à mão** |
| Frete | [frete.ts](ROI Labs/app/src/lib/frete.ts) | tabela estática, 5 faixas de CEP |
| Pedido/Item | [schema.prisma](ROI Labs/app/prisma/schema.prisma) | `ItemPedido` = `caixas`/`m2`/`precoM2` |

## Os 4 acoplamentos que decidem o trabalho

**1. A unidade "m²/caixa" está cravada em 4 camadas.** Fita vende por **rolo**, não por m². Atinge:
- `Produto.atributos` — `preco` é R$/m², mais `m2_caixa`, `dimensao`, `acabamento`, `retificado`, `classe_ad` (tudo cerâmica);
- `precos.ts` — a autoridade do servidor é literalmente `[m2_caixa, preco]`;
- `ItemPedido` no banco — colunas `caixas`, `m2`, `precoM2`;
- carrinho, `SimuladorM2`, calculadora e comparador.

**A decisão de arquitetura nº 1 é como introduzir unidade.** Duas saídas: (a) generalizar para `{unidade, quantidade, precoUnitario}` — mexe no caminho de dinheiro e exige migração de `ItemPedido` (retrocompat com pedidos antigos); (b) tratar fita como vertical paralelo com suas próprias tabelas/campos, aceitando duplicação. (a) é mais limpo e mais arriscado; (b) é mais feio e mais barato. **Não escolher isso antes de codar = retrabalho garantido.**

**2. ⚠️ Frete é o bloqueio real, e ninguém decidiu.** `frete.ts` só conhece **CEP 74000–75399 (Grande Goiânia)**; fora disso devolve `null` = "a combinar" (total online = só produto, operação fecha depois). Para um catálogo **nacional**, isso significa que **quase todo pedido cai em "a combinar"** — o cliente paga só o produto e o frete vira negociação manual. Ou se aceita isso como modelo (viável no B2B, é orçamento disfarçado), ou entra cálculo por transportadora/Correios — que é a única parte deste projeto que provavelmente exige API paga. **Decidir antes de prometer checkout nacional.**

**3. Híbrido quebra duas invariantes hoje implícitas.** O código assume que todo produto tem preço > 0:
- `elegivelParaFeed` exige `preco > 0`, e [check-feed.mjs](ROI Labs/site-goiania/src/scripts/check-feed.mjs) **falha o build** com produto inválido — SKU só-orçamento precisa ser excluído do feed **por design**, não por acidente;
- o checkout dropa silenciosamente item cujo slug não está em `precos.ts` (`getProduto` → `null`). Um SKU de orçamento que vaze pro carrinho **some sem erro**. Precisa de caminho explícito "este item é orçamento" em vez de cair nesse buraco.

**4. Frete/entrega e a malha assumem Goiânia no texto.** Copy, JSON-LD (`areaServed`), guias e a própria marca do site dizem "em Goiânia". Com fitas nacionais em primeiro plano, isso vira inconsistência de SEO e de promessa.

## Riscos de SEO (o ativo que não pode quebrar)

- **41 páginas da malha + 5 guias estão indexadas** e levaram meses. Reordenar a home/nav para fitas **não pode** alterar URLs de porcelanato, nem remover os links internos que sustentam a malha.
- `nginx` tem duas correções vivas que qualquer rota nova precisa respeitar: **barra final obrigatória** (URL sem barra = 301 `http://`, já queimou 46% do crawl) e **404 real** (`try_files =404`, senão vira soft-404 com 200).
- Rota nova sugerida: **`/fitas/`** como namespace, espelhando o padrão de `/porcelanato/`. Registrar em `sitemap.xml.ts`, `llms.txt.ts`, `busca-index.json.ts` e footer — são 4 lugares, e esquecer um é o erro recorrente aqui.

## Conexão com a spec 010 (recém-shipada)

- O **Tapepro já está ativo e faturável** no `/app`: `cpfCnpj=44724076000135`, aquisição **0.15**, recorrência **0.10**, `podeGerar=true`.
- Pedido pago deste catálogo → repasse ao Tapepro cria `NegocioOriginado` que **congela taxa e classificação na criação**. Como o modelo já distingue aquisição de recorrência pelo **CPF/CNPJ do comprador**, o checkout de fitas **deve tornar `compradorDoc` obrigatório** (hoje é opcional, pensado para o B2C de porcelanato) — em B2B é o que faz a regra de 15%/10% funcionar de verdade. Sem doc, todo negócio é classificado como aquisição (15%).
- Já existe a linha **'fitas adesivas'** no Centro de Custo, **inerte** até haver SKU de fita com preço. Ela passa a valer quando este projeto publicar preço.

## Decisões a fechar antes de escrever código

1. Unidade: generalizar `ItemPedido`/`precos.ts` ou vertical paralelo?
2. Frete nacional: "a combinar" para tudo fora de Goiânia, ou API de transportadora?
3. Quais SKUs entram com preço público e quais são só orçamento? (define o feed e o carrinho)
4. Identidade do site: vira "loja de fitas que também vende porcelanato"? Afeta home, `<title>`, JSON-LD, e o `areaServed` nacional vs local.
5. Catálogo de fitas: quantos SKUs, com foto e ficha real? Hoje o institucional cita 3 tipos (BOPP personalizada, gomada kraft/nylon, comum) **sem preço e sem ficha estruturada** — esse conteúdo **não existe ainda** e é pré-requisito.

## Próximo passo

Este projeto é não-trivial e o repo tem `.specify/` → **entrar pelo Spec Kit, não codar direto**:

```
/speckit-specify   # usar este handoff como input; travar as 5 decisões acima
/speckit-clarify   # varrer bordas (frete, híbrido, migração de ItemPedido)
/speckit-plan → /speckit-tasks → /speckit-implement
```

**Gate de verificação (caminho de dinheiro, Const. II):** qualquer mudança em `precos.ts`/`ItemPedido`/frete exige self-check puro **e** E2E real com pedido pago — o mesmo padrão da 002/003/010. `check-cart-math.mjs` e `check-feed.mjs` já existem e devem continuar verdes.
