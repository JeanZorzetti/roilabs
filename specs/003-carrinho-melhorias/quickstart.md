# Quickstart — verificação em ambiente real (Fase 1)

Constituição II: nada é "funcionando" via build local (OneDrive corrompe `node_modules`). Verifique em **Docker/EasyPanel + navegador em prod**, com **credenciais de teste do Mercado Pago**.

## Pré-requisitos
- `app` no ar (`app.roilabs.com.br`) com `DATABASE_URL` + creds MP de teste via env.
- `site-goiania` no ar (`goiania.roilabs.com.br`), build estático.
- Migração aplicada: `prisma db push` **MANUAL** (Pedido + `cupom_codigo`, `desconto`).
- Pelo menos 1 cupom de teste ativo em `app/src/lib/cupons.ts` (ex.: `OBRA10` = 10% percentual).

## Self-checks runnable (rápidos, antes do deploy)
```
node site-goiania/src/scripts/check-cart-math.mjs
```
Cobre: `m²→caixas` com folga 5–20% e mín. 1 (US2); math de cupom percentual/fixo, nunca negativo, só sobre produto (US4); round-trip encode→decode do link de carrinho (US5).

## Cenários (navegador em prod)

### US1 — carrinho editável + mini-cart
1. Adicione um produto; em qualquer página de pSEO, confira o **badge do mini-cart** no header e o drawer.
2. No `/carrinho`, edite os **m²** de um item inline → caixas/m²/subtotal/total atualizam (mín. 1 caixa). Edite por **caixas** também.
3. Remova o último item → **estado vazio** com CTA para a vitrine. Force erro (offline) → **estado de erro** com "tentar de novo".
4. **pSEO intacto**: `curl` uma página de categoria/produto e confirme **conteúdo indexável + JSON-LD + sitemap inalterados** (o mini-cart é island `client:only` e adiciona chrome ao header — **não** se espera HTML byte-a-byte idêntico; o que não pode mudar é o conteúdo/JSON-LD/sitemap e o fato de a página seguir pré-renderizada) (SC-006).

### US2 — simulador de m²
5. Em `AddToCart`, alterne para "calcular por ambiente"; informe 2 cômodos (ex.: 4×3,5 e 3×2,5), folga 10% → confira área somada, folga aplicada e caixas (arredonda ↑). Mude a folga p/ 5% e 20% → caixas recalculam; tente 0%/90% → **clampa** a 5%/20% com aviso.

### US3 — frete + prazo no carrinho
6. Informe um CEP coberto (ex.: Goiânia `74xxx`) → **frete + prazo** no resumo, somados ao total. Selecione **retirada** → frete R$ 0. CEP fora das faixas → **"a combinar"** (total só do produto).

### US4 — cupom
7. Aplique `OBRA10` → linha de **desconto** e total abatido (confira que NÃO incide sobre o frete). Aplique cupom inexistente/expirado → **recusa com mensagem**, total inalterado. Aplique outro cupom → **substitui** (1 por carrinho).
8. **Checkout**: finalize com cupom válido e pague com **cartão de teste MP** → confirme que o **total cobrado == total do servidor** e que o `Pedido` gravou `cupom_codigo`/`desconto`. (FR-014/017)

### US5 — salvar/recuperar link
9. Gere o link de compartilhar; abra em **aba anônima** → itens/quantidades idênticos. Adultere `caixas` no payload e finalize → o **servidor recalcula** (sem confiar no link). Simule `ts` > 30 dias → **link expirado** com mensagem.

## Critério de aceite da verificação
- SC-002: total do carrinho == total recalculado no checkout (zero divergência).
- SC-004: só cupom validado no servidor abate o total cobrado.
- SC-006: zero regressão de pSEO (HTML/sitemap idênticos) + checkout/pagamento da 002 funcionando.
