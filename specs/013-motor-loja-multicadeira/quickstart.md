# Quickstart — como verificar a 013 em ambiente real

**Constituição II é não-negociável**: build e typecheck locais não provam nada neste stack (o
OneDrive corrompe `node_modules`). Nada abaixo aceita "compilou" como evidência.

E há uma restrição própria desta feature: **não existe prova ponta a ponta de pagamento** —
teste com cartão real foi cancelado pelo Jean em 07/08 e não se reabre. Toda a verificação de
dinheiro é **soma no banco** e **teste unitário**. Nenhuma afirmação de receita sai desta
entrega.

## Pré-requisitos

- Acesso ao Postgres de produção pelo endpoint externo (o schema é aplicado **manualmente**; o
  runner standalone não aplica).
- `.env` do `/app` conferido **antes** de qualquer investigação de erro (Constituição I):
  `DATABASE_URL`, `MP_ACCESS_TOKEN`, `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_BASE_URL`,
  `MELHOR_ENVIO_CEP_ORIGEM`. Caractere especial (`$`, `#`) e comentário inline em URL são a
  causa-raiz mais comum aqui.
- ⚠️ **Nunca rodar `npm run build` no `/site-goiania` para explorar** — o `postbuild` submete ao
  IndexNow. Para build exploratório: `npx astro build`.

## 1. Antes de migrar — capturar a linha de base

```bash
cd app
node --import tsx scripts/verify-013-sums.mjs > /tmp/sums-antes.txt
cat /tmp/sums-antes.txt
```

**Esperado**: 6 pedidos, total **R$ 22.091,89**, com a contagem de itens por pedido e o preço
unitário de cada item. Guardar o arquivo — é a única linha de base que existe.

Se o total divergir de R$ 22.091,89 **antes** de qualquer mudança, parar: a premissa da SC-003
mudou e a spec precisa saber disso antes de a migração rodar.

## 2. Aplicar o schema (fase 2)

```bash
cd app
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
                        --to-schema-datamodel prisma/schema.prisma --script
```

Ler o SQL gerado **antes** de aplicar — é o preview seguro do `db push`. Confirmar que ele só
**adiciona** colunas anuláveis e não dropa nada. Então:

```bash
npx prisma db push
```

## 3. Backfill explícito e a prova de SC-003

```bash
node --import tsx scripts/migrate-013-backfill.mjs --dry-run   # imprime, não grava
node --import tsx scripts/migrate-013-backfill.mjs
node --import tsx scripts/verify-013-sums.mjs > /tmp/sums-depois.txt
diff /tmp/sums-antes.txt /tmp/sums-depois.txt
```

**Esperado**: `diff` vazio. Qualquer linha de diferença é a migração tendo mexido em dinheiro —
reverter antes de seguir.

O verificador também precisa reportar, e **exigir zero**:

```text
itens com unidade IS NULL ............ 0     # @default não reescreve linha gravada
itens onde quantidade × unitário ≠ subtotal ... 0
itens de fita não copiados ........... 0
```

## 4. Testes unitários (rodam em qualquer lugar)

```bash
cd app && npm test
```

**Esperado**: todos os arquivos passam, incluindo os três novos —
`item-unificado.test.mjs`, `carrinho-uma-cadeira.test.mjs`, `loja-config.test.mjs`.

O teste que mais importa e que **não existe hoje**: o rateio do desconto entre as linhas do
Mercado Pago fechando exatamente com o total do pedido.

```bash
cd site-goiania && node src/scripts/check-cart-math.mjs && node src/scripts/check-lojas.mjs
```

## 5. As 99 URLs (SC-002) — o ativo que a feature existe para proteger

Depois do deploy do site:

```bash
curl -s https://goiania.roilabs.com.br/sitemap.xml | grep -c "<loc>"
```

**Esperado**: 99. Então conferir que cada URL responde 200 — não 301, não 404. Redirect **não**
satisfaz FR-008.

⚠️ **Validar o corpo, nunca só o status**: sitemap servido em 200 com corpo de HTML é um modo de
falha já visto neste portfólio. Confirmar que o corpo começa com `<?xml`.

⚠️ **Nunca usar `curl -k`** — ele esconde erro de certificado, e o browser do comprador não
esconde.

Uma semana depois: conferir no GSC que o download do sitemap segue com **0 erro**. As Crawl
Stats são **média de 90 dias** — datar qualquer falha antes de atribuí-la a esta entrega.

## 6. As duas lojas, no browser, em produção (fase 3)

Sem pagar. Até a tela do Mercado Pago e parar.

| Passo | Porcelanato | Fitas |
|---|---|---|
| vitrine → produto → adicionar | `/porcelanato/` | `/fitas/` |
| carrinho abre com o item | `/carrinho` | `/carrinho` (redirecionado de `/carrinho-fitas`) |
| unidade e preço exibidos | m², preço/m² | rolo, faixa aplicada |
| simulador de m² reabre preenchido | ✅ | n/a |
| frete | CEP de Goiânia → valor | CEP nacional → cotação |
| cupom | `OBRA10` aplica | `OBRA10` **recusa** (escopo) |
| clichê | n/a | fita personalizada avisa R$ 80 |
| checkout | chega ao MP com o total certo | idem, com CPF/CNPJ obrigatório |

**Contar as etapas** de cada fluxo e comparar com antes (SC-007): o número tem de ser o mesmo.

### O carrinho antigo do comprador real

Com um `roi_cart_v1` ou `roi_cart_fitas_v1` já no `localStorage`, abrir `/carrinho`: os itens
têm de aparecer, na cadeira certa. Um link compartilhado antigo (`/carrinho?c=<token>`) tem de
continuar abrindo.

### FR-005a — o carrinho de uma cadeira só

Com porcelanato no carrinho, tentar adicionar uma fita: o item **não entra**, e a tela diz de
qual cadeira o carrinho é. Nada é removido sem ação explícita.

## 7. A prova de que o motor existe (SC-001 e SC-006, fase 4)

Declarar a cadeira de teste conforme [contracts/loja-config.md](./contracts/loja-config.md),
percorrer a compra de um produto de **assinatura recorrente** até a intenção de pagamento, e:

```bash
git diff --name-only
```

**Esperado**: **apenas** `site-goiania/src/data/lojas.ts` e o catálogo novo. Qualquer outro
arquivo é a feature reprovando o próprio critério.

Conferir no banco que o item gravado tem `unidade='assinatura'`, `recorrencia='mensal'`,
`assinaturaEstado='ativa'` e o valor do ciclo em `precoUnitario`.

Remover a cadeira de teste e conferir que a loja volta ao estado anterior.

## 8. SC-004 — a superfície encolheu

```bash
git ls-files site-goiania/src/pages/carrinho*.astro site-goiania/src/lib/cart*.ts
```

**Esperado depois da fase 5**: um carrinho, um `cart.ts`, e `itens_pedido_fita` inexistente no
schema. Antes: 931 linhas em 2 arquivos de carrinho e 2 tabelas de item.

## Ao fechar

`handoff.md` atualizado (feito / decisões / próximos passos / pendências / gotchas), commit e
push — sem perguntar (Constituição V).
