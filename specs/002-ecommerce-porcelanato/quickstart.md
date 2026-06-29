# Quickstart / Verificação em ambiente real — Fase 1

Build/typecheck local NÃO contam (Constituição II — OneDrive corrompe `node_modules`). Verificação = Docker/EasyPanel + navegador em prod + pagamento de **teste** do Mercado Pago.

## Pré-requisitos (ops)
1. Conta Mercado Pago da ROI; gerar **credenciais de teste** (access token + webhook secret).
2. Setar na EasyPanel (`/app`): `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` (Constituição I).
3. Configurar a `notification_url` do webhook no painel MP → `https://app.roilabs.com.br/api/pagamentos/webhook`.
4. Aplicar schema: `prisma db push` **MANUAL** de máquina que alcança `2.24.207.200:5443` (não pelo runner).

## Self-checks (rodam no CI/local, sem ambiente real)
```bash
node site-goiania/src/scripts/check-cart-math.mjs   # m²→caixas (ceil, +10%, mín.1) e Σ subtotais
```

## E2E em prod (navegador)
1. Página de produto → informar m² → "Adicionar ao carrinho" → conferir caixas/subtotal.
2. `/carrinho` → editar caixas, escolher **retirada** (frete R$0) ou **entrega** + CEP da Grande Goiânia (frete da tabela); CEP fora → "a combinar".
3. Finalizar → redireciona ao Mercado Pago → pagar com **Pix/cartão de teste** (sandbox).
4. Voltar em `/obrigado?pedido=...` → status do pedido visível.
5. Confirmar no `/admin/pedidos` (ou no banco) que o pedido está `pago` + `aguardando` (reserva).
6. **Idempotência**: reenviar a notificação de teste do MP → status não muda, sem pedido duplicado.
7. **Reembolso**: ação "lote indisponível" → conferir `reembolsado` e o estorno no painel MP.

## Critério de "pronto" (Constituição II)
Nenhum item declarado funcionando sem o passo E2E acima com output/print anexado. Trocar credenciais de teste por produção é passo de ops separado.

## Não-regressão de pSEO (SC-003)
Comparar o `dist/` do `site-goiania` antes/depois: mesmas rotas indexáveis, mesmo `sitemap.xml`, JSON-LD inalterado nas páginas de produto/categoria. As adições são só carrinho/`/carrinho` (client-side).
