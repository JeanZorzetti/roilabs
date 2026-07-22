# Handoff — 011 E-commerce de fitas adesivas Tapepro

**Data**: 2026-07-22 · **Estado**: **NO AR**. Banco migrado, backfill conferido e código pushado (`2d742ec`). Restam os destravamentos de terceiro — e um deles afeta dinheiro *agora*.

> ⚠️ **Publicado antes das env vars do Melhor Envio, por decisão do Jean.** Consequência viva: **todo pedido de fita cai em `frete = null` / `freteMotivo = 'falha_tecnica'`** e o alerta dispara na 3ª ocorrência. É estado previsto no design (FR-015) — o pedido fecha e cobra só o produto — mas significa **vender sem frete calculado** até `MELHOR_ENVIO_TOKEN` + `MELHOR_ENVIO_CEP_ORIGEM` entrarem no EasyPanel. O frete desses pedidos precisa ser combinado na mão com o comprador.

---

## O que foi feito

### `/app` — dinheiro (Next 16 + Prisma)

| Arquivo | O quê |
|---|---|
| `prisma/schema.prisma` | `model ItemPedidoFita` (novo) · `Pedido.vertical` + `Pedido.freteMotivo` · `Cupom.escopo`. `ItemPedido` **intocado**. |
| `scripts/migrate-011-backfill.mjs` | Backfill idempotente: `Cupom.escopo='porcelanato'` e `Pedido.vertical='porcelanato'`, com a conferência do T010 impressa na saída. |
| `src/lib/precos-fitas.ts` | Autoridade de preço por faixa. **2 SKUs** — a personalizada está ausente de propósito (é o que a marca como só-orçamento). `precoPorQuantidade`, `temPrecoPublico`, `cargaDoCarrinho`. |
| `src/lib/frete-fitas.ts` | Melhor Envio com `AbortController` (4s). `mapearResposta` é pura. Separa `cep_nao_atendido` de `falha_tecnica` e loga CEP+status em toda falha técnica. |
| `src/app/api/frete/cotar/route.ts` | Novo. CORS fixo no origin do site, urlencoded sem preflight — espelho de `/api/cupom/validar`. 200 mesmo em contingência. |
| `src/lib/cupons.ts` | `escopo` em `CupomAvaliavel`, motivo `'escopo'`, 3º parâmetro `vertical` (default `porcelanato`, retrocompatível). Ordem: inativo → escopo → validade → mínimo. |
| `src/app/api/cupom/validar/route.ts` | Recebe `vertical`; recalcula o subtotal pela tabela do vertical certo. |
| `src/app/api/pedidos/route.ts` | Ramo `vertical=fitas` (função `pedidoFitas`). Porcelanato inalterado. Valida documento, item só-orçamento, mínimo e carrinho misto; re-cota o frete; alerta em 3 falhas técnicas seguidas. |
| `src/app/api/pagamentos/webhook/route.ts` | Confirmação de pagamento passa a listar os itens de fita — sem isso o comprador de fita recebia e-mail com a lista **vazia**. |
| `src/app/admin/pedidos/page.tsx` | Coluna **Vertical**, itens na unidade certa (com a faixa aplicada) e **motivo do frete** quando "a combinar". |
| `src/app/admin/cupons/` + `api/cupons/` | Seletor de escopo, default `porcelanato` (o default seguro é o restritivo). |
| `src/app/admin/centros-de-custo/page.tsx` | Lista também os SKUs de fita, usando o **menor unitário** (última faixa) e exibindo qual faixa gerou a simulação. Fitas caem na linha `fitas adesivas` por padrão. |
| `test/precos-fitas.test.mjs` · `test/frete-fitas.test.mjs` | Novos. `test/cupons.test.mjs` estendido. Todos wired no `npm test`. |

### `site-goiania` — catálogo, carrinho e SEO (Astro)

| Arquivo | O quê |
|---|---|
| `src/data/fitas.ts` | 3 SKUs: fatos do institucional + copy comercial própria + faixas exibidas + link para o institucional. |
| `src/lib/cart-fitas.ts` | Chave `roi_cart_fitas_v1`. Coexiste com `roi_cart_v1` por construção. |
| `src/pages/fitas/index.astro` | Vitrine, com a **modalidade visível já no card**. |
| `src/pages/fitas/[slug].astro` | Ficha técnica, tabela de faixas visível, seletor de rolos com unitário que acompanha a faixa **ou** formulário de orçamento. Link para o institucional. |
| `src/pages/carrinho-fitas.astro` | Rolos, CEP → `/api/frete/cotar`, CPF/CNPJ obrigatório, cupom com `vertical=fitas`, todas as mensagens de `?erro=`. |
| `src/pages/index.astro` | Home lidera com fitas; porcelanato vira vertical secundário com link. JSON-LD: `OnlineStore` nacional + `LocalBusiness` Goiânia. |
| `src/layouts/Base.astro` | `WebSite.name` e `Organization.areaServed` cobrindo os dois verticais. |
| sitemap · llms.txt · busca-index · feed · Footer · Header | Fitas registradas nos 4 índices (+ nav e rodapé), todas as URLs **com barra final**. |
| `src/scripts/check-matrix.mjs` | Trava de paridade: fato de fita divergente do institucional **quebra o build**. |
| `src/scripts/check-cart-math.mjs` | Matemática de rolos + fronteiras de faixa — **e finalmente wired no `prebuild`** (era órfão). |
| `src/scripts/check-feed.mjs` | Conta as fitas com preço público e **falha se a só-orçamento entrar no feed**. |

### Verificações que rodaram

```
app:   npm test → 10/10 verdes (success-fee inalterado = prova do FR-003)
app:   npx tsc --noEmit → limpo
site:  npm run build → 104 páginas, check-matrix + check-cart-math + check-feed verdes
site:  42 diretórios em dist/porcelanato · 86 URLs de porcelanato no sitemap · 4 links /porcelanato/ na home
```

### Verificação em PRODUÇÃO (T056, pós-deploy 2026-07-22)

```
porcelanato:  71/71 URLs → 200 (41 malha + 30 produto). Malha intacta.
fitas:        /fitas/, 3 produtos e /carrinho-fitas/ → 200, todas com barra final.
404 real:     /url-que-nao-existe/ → 404 (não soft-404).
home:         h1 "Fita adesiva para embalagem, com preço por rolo" — reposicionamento no ar.
4 índices:    sitemap 4 URLs de fita · llms.txt com seção de fitas · busca-index 4 entradas ·
              feed com fita-gomada + fita-transparente-comum e SEM a personalizada (FR-024).
frete:        POST /api/frete/cotar → falha_tecnica/200 (esperado sem env vars) · só-orçamento → vazio.
cupom:        POST /api/cupom/validar com vertical=fitas aceito; NAOEXISTE → invalido (não vazio),
              prova de que o subtotal foi recalculado pela tabela de fitas.
app health:   /api/health → 200.
```

> Janela de deploy: `/fitas/` respondeu 404 por ~1 min enquanto o nginx trocava o `dist` (o `/fitas/index.html` já servia 200). Resolveu sozinho — não é bug de rota.

---

## ⛔ Pendências de terceiro — agora com o site NO AR, viraram urgência

**Ordem de urgência mudou com a publicação:** T005 (env vars) e T002 (peso real) deixaram de ser pré-requisito de deploy e passaram a ser **correção de algo que já está vendendo**.


1. **T001 — token de sandbox do Melhor Envio.** Sem ele a cotação responde `falha_tecnica` (com o log dizendo qual env var falta).
2. **T002 — peso e dimensões da embalagem por rolo.** Estão em `precos-fitas.ts` como **estimativa calibrável** (`0,3 kg` BOPP · `1,1 kg` kraft) e marcadas com comentário. Entram **só** na cotação de frete, nunca no preço do produto. **Confirmar com o Tapepro e ajustar antes de publicar** — frete subestimado é prejuízo silencioso.
3. **T004 — CEP de origem de despacho.**
4. **T003 — fronteiras da tabela.** Implementadas a favor do comprador (`100` na faixa baixa da gomada; `200+` na mais barata), como o data-model decidiu. Se o Tapepro confirmar outra leitura, é **um número** em `precos-fitas.ts` + o espelho em `data/fitas.ts` e nos dois self-checks.

**T005 — env vars no EasyPanel do `/app`**: `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_BASE_URL` (sandbox), `MELHOR_ENVIO_CEP_ORIGEM`.

---

## ✅ Migração aplicada (2026-07-22) — o que foi feito, nesta ordem

```
1. prisma migrate diff --from-schema-datasource ... --script   # preview (aditivo puro)
2. prisma db push                                              # aplicado, 5,69s
3. node scripts/migrate-011-backfill.mjs                       # 0 linhas, conferência 100%
4. git push origin main                                        # 5aa93f2..2d742ec
```

O SQL saiu **puramente aditivo**: 2 `ADD COLUMN` com default, 1 anulável, 1 tabela nova + índice + FK. Zero `DROP`, zero `ALTER TYPE`.

Conferência pós-migração no banco real:

| Verificação | Resultado |
|---|---|
| `cupons.escopo` | `text NOT NULL DEFAULT 'porcelanato'` |
| `pedidos.vertical` | `text NOT NULL DEFAULT 'porcelanato'` |
| `pedidos.frete_motivo` | anulável — **`where: { freteMotivo: null }` devolve 2**, a landmine da 010 não se repetiu |
| `itens_pedido_fita` | criada, 0 linhas |
| Backfill (T010) | `cupons: porcelanato=1` · `pedidos: porcelanato=2` |
| Porcelanato | 2 itens em `itens_pedido` intactos |

> 💡 **Por que o backfill atualizou 0 linhas e ainda assim está certo:** `ADD COLUMN NOT NULL DEFAULT` do Postgres já grava o default nas linhas existentes, então o `updateMany` com `where: { not: 'porcelanato' }` não encontra nada. O valor do script é a **conferência**, não o update. Ele continua sendo necessário: se um dia a coluna nascer sem default, é ele que impede a leitura errada.

**Regra que continua valendo para a próxima migração:** o runner standalone **não** aplica schema. `db push` manual **sempre** antes do push do código.

---

## Pendências abertas

- **T046 — baseline no GSC** (posição e impressões da home e das 41 páginas) **antes** de publicar o reposicionamento. Sem baseline não há como avaliar o efeito do FR-025.
- **T046b / FR-033b — link inverso do institucional.** O e-commerce já linka para `tapepro.roilabs.com.br` em cada página de produto. O link de volta (institucional → e-commerce) vive no repo `ROI Labs/Tapepro/` e é **entrega separada**. Sem ele o cruzamento fica pela metade.
- **T052c — linha 'fitas adesivas' no Centro de Custo.** O código já joga os SKUs de fita nessa linha *quando ela existe* no banco. Se `ParametroCentroCusto(escopo='linha', chave='fitas adesivas')` ainda não estiver cadastrada, criar em `/admin/centros-de-custo`.
- **T054/T055/T057 — E2E real**: pedido de fita pago em produção, contingência de frete nas duas causas com recebimento do alerta, e troca de `MELHOR_ENVIO_BASE_URL` para produção conferindo uma cotação contra o valor esperado.
- **IndexNow segue 403** (`UserForbiddedToAccessSite`) — pendência antiga do subdomínio no Bing Webmaster, não desta feature. As URLs novas de fita não estão sendo pingadas.

---

## Gotchas registrados nesta entrega

- **Faixa de preço derivada de texto cobra errado.** A primeira versão do carrinho lia o piso da faixa do rótulo (`"15 a 100 rolos".replace(/\D/g,'')` → `15100`). Faixa em caminho de dinheiro tem campo `min` próprio, nunca parse de string.
- **`check-cart-math.mjs` era órfão desde sempre** — existia, passava, e não rodava em lugar nenhum. Agora está no `prebuild`. Vale conferir se outros repos têm o mesmo self-check decorativo.
- **Pedido de vertical novo quebra o e-mail de confirmação em silêncio**: o webhook montava a lista de itens só de `ItemPedido`, então o comprador de fita receberia "Pedido confirmado" com lista vazia. Tabela de item nova ⇒ auditar todo lugar que lê a antiga.
- **Cobertura geográfica no JSON-LD**: com dois verticais, `areaServed` de cidade escondia a venda nacional e `areaServed` de país mentiria sobre o porcelanato. Os dois nós coexistem, cada um no seu escopo.
