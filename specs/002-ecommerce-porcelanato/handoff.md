# Handoff — 002-ecommerce-porcelanato

**Data**: 2026-06-29 | **Branch**: `002-ecommerce-porcelanato`

---

## Feito

| Task | Arquivo(s) |
|---|---|
| T001 Espelho de preços | `app/src/lib/precos.ts` — `getProduto(slug)` com os 30 SKUs; server-side (FR-005). |
| T002 Env vars MP | `app/.env.example` — `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET`. |
| T003 Tabela de frete | `app/src/lib/frete.ts` — `calcFrete()`: retirada=0, 5 faixas Grande Goiânia, fora=null (FR-016). |
| T004 Prisma models | `app/prisma/schema.prisma` — `Pedido` + `ItemPedido` (snake_case `@@map`, Decimal). `prisma validate` ✓ |
| T005 db push | **Pendente (manual)** — ops aplica em `roilabs_db @ 2.24.207.200:5443` via máquina que alcança o host. |
| T006 MP SDK | `app/src/lib/mercadopago.ts` — `createPreference`, `getPayment`, `refund`, `verifyWebhookSignature`. HTTP puro (sem SDK). |
| T007 Cart front | `site-goiania/src/lib/cart.ts` — localStorage, `m2ParaCaixas`, add/remove/setCaixas, `lines()`, `totalProduto()`. |
| T008 POST/GET `/api/pedidos` | Checkout urlencoded → recalcula server-side → cria `Pedido`+`ItemPedido` → MP 303. GET admin autenticado. |
| T009 `/api/pagamentos/webhook` | Valida `x-signature`, idempotente por `mpPaymentId`, avança estado (nunca regride). |
| T010 AddToCart island | `site-goiania/src/components/AddToCart.astro` — m² → caixas live; wired em `ProdutoDetalhe`. |
| T011 CartCount + Header | `CartCount.astro` badge em tempo real; `Header.astro` com ícone carrinho. |
| T012 `/carrinho` | `site-goiania/src/pages/carrinho.astro` — island de itens, campos de contato/entrega, CEP com frete live, form urlencoded → `/app`. |
| T013 `/obrigado` | Adaptada para mostrar status do pagamento MP (`collection_status`) com mensagem por estado; limpa cart no approved. |
| T014 Self-check | `site-goiania/src/scripts/check-cart-math.mjs` — `node` + `assert`, passa em CI. |
| T015/T016 Frete + a_combinar | Faixas reais (Grande Goiânia) em `frete.ts`; mirror no carrinho.astro; total "produto + frete" / "a combinar". |
| T017/T018 Ações de pedido | `app/src/app/api/pedidos/[id]/acao/route.ts` — POST `confirmar`→`confirmado`, `reembolsar`→refund MP→`reembolsado`. |
| T019 Admin pedidos | `admin/pedidos/page.tsx` + `pedido-row.tsx` (client) — listagem com itens, badges de status, botões confirmar/reembolsar. Nav atualizada. |

---

## Decisões

- **Checkout cross-origin**: form urlencoded + 303 (sem CORS, sem preflight) — idêntico ao `leads-consumidor`. D2.
- **Preço espelhado, nunca do cliente**: `app/src/lib/precos.ts` hardcoded dos 30 SKUs. FR-005. Sincronizar manualmente ou por script de build se catálogo crescer.
- **Frete estático**: tabela de 5 faixas CEP em `frete.ts`. Trocar por API de transportadora somente se sair do polo. D6.
- **Sem SDK MP**: 4 calls HTTP diretos — `createPreference`, `getPayment`, `refund`, signature verify com HMAC-SHA256. Sem dependência nova. D1.
- **`obrigado.astro`**: usa `collection_status` do MP na URL de retorno (display-only; estado real vem do webhook). Cart limpo no approved/pending.
- **Webhook auth**: HMAC `id:{dataId};request-id:{xRId};ts:{ts};` com `MERCADOPAGO_WEBHOOK_SECRET`. 401 se inválido.

---

## Próximos / Pendências

| Prioridade | Item |
|---|---|
| **BLOQUEIO** (ops) | **T005** — `prisma db push` manual em `2.24.207.200:5443` para criar `pedidos` + `itens_pedido`. |
| **BLOQUEIO** (ops) | Setar `MERCADOPAGO_ACCESS_TOKEN` + `MERCADOPAGO_WEBHOOK_SECRET` (TEST) na EasyPanel `/app`. |
| **BLOQUEIO** (ops) | Configurar `notification_url` no painel MP → `https://app.roilabs.com.br/api/pagamentos/webhook`. |
| Verificação E2E | T020 — seguir `quickstart.md` passo a passo em prod com credenciais de teste (Constituição II). |
| Não-regressão pSEO | T021 — diff `dist/` antes/depois: mesmas rotas, mesmo `sitemap.xml`. |
| Trocar creds | Após validar com TEST, trocar para credenciais de produção do Mercado Pago na EasyPanel. |

---

## Gotchas

- **`prisma generate` no build**: o `app/package.json` já tem `"build": "prisma generate && next build"`. Funciona em Docker; não roda local (OneDrive corrompe node_modules, Constituição II).
- **Prisma 6.3.0 no projeto, npx pega 7**: o `prisma.config.ts` ainda não existe — enquanto só usamos `validate` / `generate`, não afeta. Se precisar de `prisma migrate`, confirmar versão.
- **Frete front ≠ server**: `carrinho.astro` tem uma cópia da tabela de faixas (para display live); o servidor em `frete.ts` é a autoridade. Se as faixas mudarem, atualizar nos dois lugares.
- **`obrigado.astro` era página de lead**: adaptada para servir ambos os casos (sem `?pedido=` → mensagem de lead; com `?pedido=` → status do pedido). Sem breaking change.
- **m²/caixa no self-check**: usa `produtos[0]` e `produtos[1]` do catálogo — vai falhar se o JSON for vazio ou trocado. OK para a garantia do math.
