# Quickstart — como verificar a cadeira Maná em ambiente real

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Data model**: [data-model.md](./data-model.md)

Constituição II: build local **não prova nada** neste stack (o OneDrive corrompe `node_modules`,
errno -4094). Nada aqui fecha com "compilou". Cada bloco traz **o comando** e **o output que
conta como prova**.

Ordem = ordem das fases do plano. Não pule: a fase 3 (estoque) precisa estar verde antes de a
fase 4 (split) poder cobrar qualquer coisa.

---

## 0. Antes de tudo — alcançar o banco certo

```bash
# ⚠️ O DATABASE_URL do .env da raiz aponta para o host INTERNO do Docker
#    (doc_crm_roilabs_db:5432) e tem um `]` colado no fim das 3 ocorrências.
#    Daqui, use o endpoint externo e tire o `]`:
export DATABASE_URL='postgresql://<user>:<senha>@2.24.207.200:5443/roilabs_db'
```

⚠️ **`:5445` é o `roihub_db`** — outro projeto, mesma senha. Um `db push` apontado para lá cria
o schema inteiro no lugar errado. Já quase aconteceu na 012.

**Prova de que você está no banco certo** (deve listar `pedidos`, `cadeiras`, `itens_pedido`):

```bash
psql "$DATABASE_URL" -c "\dt" | grep -E 'pedidos|cadeiras|itens_pedido'
```

### Baseline — medir ANTES de tocar em qualquer coisa

```bash
psql "$DATABASE_URL" -c "
  SELECT vertical, count(*), sum(total), count(*) FILTER (WHERE status_pagamento='pago') AS pagos
  FROM pedidos GROUP BY vertical ORDER BY vertical;"
```

Guarde o output. É contra ele que se confere que a 015 **não moveu dinheiro de porcelanato nem de
fitas**. Ler o baseline do banco **na hora** — nunca de um arquivo de handoff.

---

## Fase 1 — O dado (nada muda no ar)

```bash
cd site-goiania
node src/scripts/check-lojas.mjs      # espera: [OK] 3 cadeira(s) validadas
node src/scripts/check-mana.mjs       # espera: [OK] N sku(s) — paridade catálogo × servidor
npx astro build                       # ⚠️ npx, NÃO npm run build (esse submete ao IndexNow)
grep -c '<loc>' dist/sitemap.xml      # espera: 99  ← as URLs da Maná NÃO entram aqui
```

```bash
cd ../app && npx tsc --noEmit && npm test
```

**Prova:** os 3 gates verdes, sitemap ainda com **99** URLs, `npm test` verde.
**Prova negativa que importa:** `git diff --stat` não toca `pages/porcelanato/**`, `pages/fitas/**`,
`route.ts` de pedidos, nem `schema.prisma`.

---

## Fase 2 — O host

### Antes do deploy: o DNS precisa existir

```bash
dig +short mana.roilabs.com.br        # tem que resolver ANTES de o EasyPanel emitir o cert
```

⚠️ DNS em **Cloudflare**. Cert emitido contra NXDOMAIN não se re-emite sozinho — a 012 já
registrou essa conta.

### Depois do deploy

```bash
# TLS de verdade — SEM -k. `-k` esconde exatamente o erro que se está procurando.
curl -sS -o /dev/null -w '%{http_code} %{ssl_verify_result}\n' https://mana.roilabs.com.br/mana/

# 301 do host antigo para o novo (mata a duplicata de conteúdo)
curl -sSI https://goiania.roilabs.com.br/mana/ | head -1        # espera: 301
curl -sSI https://goiania.roilabs.com.br/mana/ | grep -i location  # espera: mana.roilabs.com.br

# arquivos de raiz: o root do nginx é COMPARTILHADO — estes não podem vazar o do porcelanato
curl -sS https://mana.roilabs.com.br/sitemap.xml | grep -c 'porcelanato'   # espera: 0
curl -sS https://mana.roilabs.com.br/sitemap.xml | grep -c '<loc>'         # espera: nº de URLs da Maná
curl -sS https://mana.roilabs.com.br/robots.txt

# canonical aponta para o host CERTO (Base.astro com siteBase)
curl -sS https://mana.roilabs.com.br/mana/<produto>/ | grep -i 'rel="canonical"'

# o goiania não regrediu
curl -sSI https://goiania.roilabs.com.br/fitas/ | head -1        # espera: 200
```

**Prova:** todos acima. **E no browser**, nos dois hosts: a vitrine da Maná abre com marca própria
(não o header do porcelanato) e **não há botão de compra** (cadeira ainda `publicada: false`).

---

## Fase 3 — Estoque

```bash
cd app
npx prisma db push          # ⚠️ MANUAL, desta máquina. O runner standalone não aplica.
node scripts/seed-015-mana.mjs --dry-run    # confere o que vai escrever, sem escrever
node scripts/seed-015-mana.mjs
node scripts/verify-015-estoque.mjs         # espera: todas as linhas fecham, exit 0
```

```bash
# disponibilidade ao vivo, com CORS do host certo
curl -sS -H 'Origin: https://mana.roilabs.com.br' \
  'https://app.roilabs.com.br/api/estoque?cadeira=mana' | head -c 400
# espera: {"ok":true,"estoque":{...}}  + header access-control-allow-origin do host da Maná

# origem fora da allowlist NÃO recebe o header
curl -sSI -H 'Origin: https://exemplo.com' \
  'https://app.roilabs.com.br/api/estoque?cadeira=mana' | grep -ci 'access-control-allow-origin'
# espera: 0
```

**Prova do débito (a que conta):** depois de um pedido de teste aprovado, no Postgres —

```bash
psql "$DATABASE_URL" -c "
  SELECT sku, quantidade, updated_at FROM estoque_variacao
  WHERE cadeira='mana' ORDER BY updated_at DESC LIMIT 5;"
```

A quantidade caiu exatamente pelo que foi vendido, e `updated_at` é do horário do pagamento.
**Log dizendo que debitou não é prova** — a consulta é.

**Prova da corrida:** `npm test` com `estoque-corrida.test.mjs` verde (rollback + `sem_estoque` +
`refund` chamado uma vez) **e** a reentrada (2ª notificação do mesmo `paymentId` não debita de novo).

---

## Fase 4 — Split

### Antes: as envs precisam estar publicadas na EasyPanel

```bash
# Constituição I — conferir NESTA ordem antes de olhar qualquer código
GATEWAY_TOKEN_MANA        # access_token OAuth da conta MP da Maná
WEBHOOK_SECRET_MANA       # secret de assinatura da conta MP da Maná
```

Env ausente ⇒ `resolverCredencial` devolve `null` ⇒ a cadeira **não vende** (nunca cai no token
da ROI Labs). Isso é o comportamento correto, e é fácil confundir com bug.

### A verificação (sandbox, usuário de teste do MP)

```text
1. compra completa até a tela do MP em https://mana.roilabs.com.br/mana/<produto>/
2. pagar com USUÁRIO DE TESTE do Mercado Pago
3. conferir, na ORDEM:
   a. painel do MP da Maná    → pagamento aprovado, marketplace_fee = 10% do produto
   b. log do app              → "webhook: pedido pago" com o pedidoId
   c. psql                    → pedidos.status_pagamento='pago' E pago_em preenchido
   d. psql                    → estoque_variacao debitado
   e. e-mail de confirmação   → chegou, com os itens e o valor certos
```

⛔ **Cartão real segue vetado** (Jean, 07/08). Sandbox prova a **fiação** — token certo, fee certo,
assinatura do webhook certa, débito certo. **Não** prova que o dinheiro real chega, e nenhuma
afirmação de receita pode sair desta entrega.

**Prova de não-regressão (obrigatória):** repetir uma compra até a tela do MP em **fitas** e em
**porcelanato**, sem pagar, e conferir que a preference sai na conta da ROI Labs e que a
`notification_url` **não** tem `?cadeira=`.

---

## Fase 5 — Painel do parceiro

```bash
# escopo: sessão de A não lê B, nem com ?parceiroId=B na URL
# separação: cookie de parceiro em /admin ⇒ 401; cookie de admin em /parceiro ⇒ 401
cd app && npm test    # sessao-parceiro.test.mjs
```

**Prova do número (a que conta):** o total do painel conferido contra o banco, não contra a tela —

```bash
psql "$DATABASE_URL" -c "
  SELECT sum(total - coalesce(frete,0)) AS produto,
         round(sum(round((total - coalesce(frete,0)) * 0.10, 2)), 2) AS comissao
  FROM pedidos
  WHERE vertical='mana' AND status_pagamento='pago'
    AND pago_em >= date_trunc('month', now());"
```

Os dois números batem com `vendido` e `comissaoRetida` da tela, **centavo a centavo**.

⚠️ SC-003 só fecha quando **a Maná** entra e confere sozinha. Tela em 200 não é isso.

---

## Fase 6 — Pós-venda

```bash
cd app && npm test    # pos-venda-janela.test.mjs
```

No browser, em produção:

| Caso | Esperado |
|---|---|
| pedido pago há 3 dias | solicitação **aceita**, escolha reembolso/troca registrada |
| pedido pago há 8 dias | **recusa** com mensagem própria (janela do CDC) |
| pedido com `pago_em` NULL (anterior à feature) | **recusa** — correto e explícito |
| troca sem `skuDesejado` | **recusa** (invariante de servidor) |
| troca com SKU esgotado | **recusa** |

**Prova:** a linha em `solicitacoes_pos_venda` no banco, com `resultado` e `estado='aberta'`, e a
solicitação aparecendo na fila do `/admin`.

---

## Fase 7 — Publicar

```bash
# lojas.ts (site e servidor): publicada: true — nos DOIS espelhos
cd site-goiania && node src/scripts/check-lojas.mjs && npx astro build
cd ../app && node scripts/seed-015-mana.mjs        # cadeira na carteira + parceiro + credencial
```

```bash
psql "$DATABASE_URL" -c "
  SELECT niche, estado, site_url, da_casa FROM cadeiras WHERE site_url LIKE '%mana%';"
# espera: ocupada-vendavel · https://mana.roilabs.com.br/ · da_casa = false
```

**Prova de SC-005:** `mana.roilabs.com.br` público no browser, cadeira aparecendo como ocupada na
carteira com 10%, e o sitemap **baixado** pelo Google com `errors: 0`.

⚠️ **200 no sitemap não é prova de nada.** O Google não rebaixa cópia velha sozinho — conferir
`lastDownloaded` no GSC, e submeter por `PUT` na API se ele não baixar. Já custou 1/4 de um site
nesta casa.

---

## Checklist de fechamento (nada pode faltar)

- [ ] baseline de `pedidos` por vertical **igual** ao do passo 0 para porcelanato e fitas
- [ ] `npm test` verde no `app`; `check-lojas` + `check-mana` verdes no `site-goiania`
- [ ] 99 URLs no sitemap do goiania; sitemap da Maná sem nenhuma URL de porcelanato
- [ ] `/mana/*` no host antigo em **301**; TLS do host novo sem `-k`
- [ ] débito de estoque conferido **por `psql`**, não por log
- [ ] split conferido no painel do MP da Maná (sandbox) + não-regressão nas outras duas cadeiras
- [ ] painel do parceiro conferido contra `SELECT`, centavo a centavo
- [ ] `handoff.md` escrito, commitado e **pushado** (Princípio V)
- [ ] 🚩 handoff registra, com todas as letras: **sandbox verde ≠ receita provada**
