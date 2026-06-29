# Handoff — 003 Melhorias do carrinho

**Data**: 2026-06-29 · **Branch base**: `main` · **Self-check**: ✅ `node site-goiania/src/scripts/check-cart-math.mjs` verde.

## Feito (código)

Implementação completa de tasks.md (T002–T026), construída sobre a 002 sem regredir checkout/pSEO.

| Área | Arquivos | Tasks |
|---|---|---|
| **Cart model** | `site-goiania/src/lib/cart.ts` — `perda?`/`ambientes?` no `CartItem` (retrocompatível), `clampPerda` (5–20%), `setM2`, `addFromSimulador`, `encodeCart`/`decodeCart`/`restoreCart` | T002, T003, T010, T023 |
| **Carrinho UX** | `site-goiania/src/pages/carrinho.astro` — edição inline m²⇄caixas, resumo transparente, estados vazio/carregando/erro+retry, frete+prazo, cupom, salvar/compartilhar+restaurar `?c=` | T004, T005, T014, T019, T024 |
| **Mini-cart** | `MiniCart.astro` (drawer 100% client-side, injetado via JS) + montado no `Header.astro`; reusa o badge do `CartCount` e o evento `roi-cart-change` | T006, T007 |
| **Simulador** | `SimuladorM2.astro` (ambientes l×c, folga clampada, prévia de caixas) + toggle em `AddToCart.astro` | T009, T011 |
| **Frete+prazo** | `app/src/lib/frete.ts` — `prazo` por faixa + `getFaixa()`; `calcFrete` virou wrapper | T013 |
| **Cupom (backend)** | `app/src/lib/cupons.ts` (knob, `OBRA10`=10% mín. R$500), `app/src/app/api/cupom/validar/route.ts` (JSON+CORS), checkout `api/pedidos/route.ts` (re-valida + escala unitPrice MP), `admin/pedidos/page.tsx` (coluna) | T016–T019, T021 |
| **Schema** | `app/prisma/schema.prisma` — `Pedido.cupomCodigo` + `Pedido.desconto` | T015 (migração pendente, ver abaixo) |
| **Obrigado** | `obrigado.astro` — aviso `?aviso=cupom` | T020 |
| **Self-checks** | `site-goiania/src/scripts/check-cart-math.mjs` — folga 5–20%, cupom (≥0, produto-only), link round-trip+expiração | T008, T012, T022, T025, T026 |

## Decisões / invariantes

- Carrinho client-side guarda **só caixas fechadas**; `perda`/`ambientes` são client-only, **nunca** enviados como dinheiro.
- Servidor é a **única fonte de dinheiro** no checkout (FR-017): preço (`precos.ts`), frete (`frete.ts`), cupom (`cupons.ts`) recalculados; cupom **re-validado** no checkout (FR-014).
- Desconto na preferência MP via **escala proporcional de `unitPrice`** (MP não aceita item negativo — D7).
- Cupom = **knob em código**; link de carrinho = **payload na URL** (sem tabela/cron).
- Mini-cart é island injetada por JS → **não entra no HTML pré-renderizado** de pSEO.

## ⚠️ Pendências de OPS (bloqueantes — fazer em ordem)

1. **MIGRAÇÃO ANTES DO DEPLOY DO APP (ordem importa).** A coluna nova é lida/escrita pelo checkout. Se o app subir antes da migração, **todo checkout quebra** (`column "cupom_codigo" does not exist`).
   - De máquina que alcança o host: `cd app && npx prisma db push` (Prisma 6, `DATABASE_URL` do `roilabs_db`). NÃO usar runner standalone (Constituição — ver memória `sofia_next_db_push_runner_fails`).
   - Pedidos da 002 ficam com `cupom_codigo=null`/`desconto=null` (compatível).
2. **Deploy** (após migração): `app` (Next) + `site-goiania` (Astro nginx) na EasyPanel — mesmo padrão da 002.
3. **CORS**: `/api/cupom/validar` responde `Access-Control-Allow-Origin: https://goiania.roilabs.com.br`. Conferir que o domínio do site bate (se mudar, atualizar a constante `SITE_ORIGIN`).

## Pendências de verificação (não dá p/ fazer daqui)

- **T001/T027** — snapshot pSEO + diff de conteúdo indexável/JSON-LD/sitemap vs. atual (sem node_modules no `site-goiania` local; build/Lighthouse só confiável em prod — memória `lighthouse_local_windows_onedrive_unreliable`).
- **T028** — E2E em prod (Docker + navegador + cartão de teste MP) cobrindo US1–US5; confirmar `total cobrado == total do servidor` e cupom escalado no MP.

## Gotchas

- `site-goiania` sem `node_modules` local → `astro check`/build não rodam aqui; verificação é em prod (Constituição II).
- Prisma local: global `npx prisma` = 7.8.0 e rejeita `url` no datasource; o app pina **6.3.0** e o build (`prisma generate && next build`) usa o local. Não "consertar" o datasource — é o padrão que está em prod.
- Mirror de frete (`carrinho.astro` FAIXAS) precisa do **mesmo `prazo`** de `app/src/lib/frete.ts` — manter em sync.
- Cupom 100% (fixo ≥ subtotal) geraria itens MP de R$0 → não há cupom assim no knob; se adicionar, pôr guarda (comentado `ponytail:` no checkout).
