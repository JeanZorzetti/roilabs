# Handoff — 013 motor de loja multicadeira

## 2026-08-07 — a spec nasceu; nenhuma linha de código foi tocada

> **BLUF:** existe agora uma spec para o `goiania` **parar de ser duas lojas coladas com fita**
> e virar um motor de loja que serve qualquer cadeira ocupada da carteira. Nada foi
> implementado: esta sessão produziu [spec.md](./spec.md) e o
> [checklist de qualidade](./checklists/requirements.md), ambos aprovados. **A próxima sessão
> começa em `/speckit-clarify`, não em código.**

---

## Por que esta spec existe (em uma tela)

Hoje o `goiania` tem **dois de tudo**: dois catálogos, dois carrinhos (**524 + 407 = 931
linhas**), duas tabelas de item de pedido (`itens_pedido` e `itens_pedido_fita`) e dois ramos
no mesmo endpoint de pedido. Abrir a loja da **terceira** cadeira ocupada, hoje, significa
copiar tudo isso de novo.

A própria spec 011 escreveu esse teto quando criou a duplicação:

> *"o teto é que uma terceira unidade de venda torna a duplicação insustentável. O caminho de
> upgrade — generalizar o item de pedido — fica registrado para quando isso acontecer."*

**A 013 é o saque desse teto.** Decisão do Jean em 07/08, escolhida entre três opções: construir
o **motor reutilizável** (catálogo, vitrine, carrinho, item de pedido e checkout escritos uma
vez), de modo que a cadeira nova seja **configuração + catálogo**, nunca código novo.

## A fronteira com a 012 — leia antes de abrir qualquer arquivo

| | spec 012 (aberta, 67/85) | spec 013 (esta) |
|---|---|---|
| o que faz | **publica** a página de cada cadeira: conteúdo, preço, botão | constrói o **motor** que a loja usa |
| entrega | 7 páginas de cadeira, 26 cadeiras cadastradas, migração de domínio | um carrinho, um item de pedido, uma vitrine |
| toca conteúdo? | sim, é o trabalho dela | **não, nenhum** |

🚩 **Não rode as duas no mesmo diff.** As duas mexem no mesmo site; juntas, nenhuma medição
(tráfego, receita, regressão) consegue apontar qual das duas causou o quê.

## Estado exato

| | |
|---|---|
| ✅ `spec.md` | 5 user stories (P1–P3), 19 FR, 7 SC, 6 edge cases, out-of-scope explícito |
| ✅ `checklists/requirements.md` | 16/16 itens passando, zero `[NEEDS CLARIFICATION]` |
| ✅ `.specify/feature.json` | aponta para `specs/013-motor-loja-multicadeira` |
| ⬜ `plan.md` · `tasks.md` | não existem ainda |
| ⬜ código | **zero arquivo tocado.** Nenhum branch, nenhuma migração |

## Ordem da próxima sessão

1. **`/speckit-clarify`** — as 3 decisões abaixo travam o plano. Não pule: cada uma muda
   comportamento visível ao comprador.
2. **`/speckit-plan`** — o Constitution Check vai cobrar Princípio II (verificação real) e III
   (YAGNI) explicitamente.
3. **`/speckit-tasks`** e só então **`/speckit-implement`**.

### As 3 decisões que o clarify precisa fechar

| # | pergunta | por que trava | sugestão |
|---|---|---|---|
| 1 | Comprador adiciona item de **outra cadeira** ao carrinho: recusa, troca ou dois carrinhos? | um pedido pertence a uma cadeira só (FR-005); sem regra, o carrinho aceita e o checkout falha | **recusar com aviso** — é a menor superfície e não perde o carrinho existente |
| 2 | **Parceiro sai da cadeira**: o que acontece com a URL que já ranqueava e com pedido pago não entregue? | URL que vira 404 depois de ranquear é destruição de ativo | decidir **antes** de existir a 3ª cadeira, não depois |
| 3 | Duas cadeiras com o **mesmo slug** de produto: como a URL e o carrinho desambiguam? | colisão silenciosa é a pior classe de bug de e-commerce | espaço de nomes por cadeira, mas **sem mudar as URLs de hoje** |

## O que MEDIR antes de tocar em código (baseline da migração)

O SC-003 exige igualdade exata de dinheiro antes/depois. **Leia o baseline do banco na hora,
não deste arquivo** — o número abaixo é de 07/08 e serve só para conferir que você está no
banco certo:

- `Pedido: 6` · soma dos totais **R$ 22.091,89** · `PAGOS: 0` · `mpPaymentId: 0`
- por vertical: porcelanato 2 (R$ 7.244,45 ×2, ambos duplicata) · fitas 4

```
2 × 7244,45  +  2461,05 + 2360,73 + 2361,19 + 420,02  =  22.091,89
```

Guarde também, antes de qualquer mudança: contagem de itens por pedido e preço unitário de cada
item. Total igual com item errado dentro é o falso-verde clássico desta migração.

## Armadilhas específicas desta feature

- 🚨 **`git push` em `main` É DEPLOY** (EasyPanel). Sem branch, sem PR — e esta feature mexe em
  caminho de dinheiro. Trabalhe em branch e só encoste em `main` com a verificação real na mão.
- 🚨 **`npm run build` no `site-goiania` submete ao IndexNow.** Build exploratório é
  `npx astro build`.
- 🚨 **As 99 URLs do sitemap são o único ativo orgânico do site** e o Google só as reconheceu em
  07/08 (FR-008). Refatoração que mova ou renomeie qualquer uma delas destrói isso, e o custo
  não aparece no build — aparece semanas depois no GSC.
- ⚠️ **`@default` do Prisma NÃO reescreve linha já gravada.** Foi assim que a 012 deixou 8
  cadeiras no default `'vaga'` sem nenhuma rodada de seed corrigir. Migração aqui é backfill
  **explícito**, conferido linha a linha (FR-011).
- ⚠️ **Coluna anulável casa linha arbitrária em filtro** (`where: { campo: null }`) e **FK
  anulável quebra `include` em TypeError**, não em filtro silencioso. Os dois já morderam neste
  repo.
- ⚠️ **Schema vai para o banco por `prisma db push` MANUAL**, de uma máquina que alcança o host.
  O runner standalone não aplica. Endpoint externo: `2.24.207.200:5443`, sem TLS — a
  `DATABASE_URL` do `.env` aponta para o host **interno** do Docker.
- ⚠️ **Existem dois bancos com senha igual e porta diferente.** O do `app` é `roilabs_db@:5443`.
  O `:5445` é o `roihub_db` e **não tem** tabela `Cadeira` — um seed apontado para lá cria o
  schema inteiro no projeto errado. Já quase aconteceu na 012.
- ⚠️ **`pedidoId` anulável em `NegocioOriginado` é landmine** (spec 012): cadeira cobrada pelo
  parceiro não gera pedido, então o campo é nulo **de propósito** — e é por isso que filtro por
  ele casa linha errada.
- ⚠️ **Verificação vale em ambiente real.** Build local neste stack não prova nada (OneDrive
  corrompe `node_modules`).

## O que está FORA, e não deve ser reaberto

- ⛔ **Teste de venda real com cartão real — cancelado pelo Jean em 07/08, sem discussão.**
  Consequência registrada e aceita: pagamento → webhook → negócio → success fee segue sem prova
  ponta a ponta. **Não sugerir de novo.**
- Publicar página de cadeira / escrever conteúdo → spec 012.
- Migrar domínio ou tirar o "goiania" do nome → spec 012, US4.
- Consertar ranking (`0/40` no top 50) ou falta de demanda → o motor liga a loja, não traz
  cliente. Ver [site-goiania/handoff.md](../../site-goiania/handoff.md), decisão (b).
- Google Ads — canal 100% orgânico, decisão registrada.

## Contexto vivo do site (para não medir de novo)

Do [handoff do site](../../site-goiania/handoff.md), medido em 07/08: 99 URLs no sitemap ·
sitemap baixado pelo Google com 0 erro · 3 dos 4 SKUs de fita saíram de "URL desconhecida" para
"Descoberta – não indexada" · **reaferir indexação ~14/08** · GSC 28 dias: 322 impressões, 2
cliques, posição 19,8, 0/43 no top 50 · LCP 2,5 s (resolvido, não é gargalo) · `LeadConsumidor`
= 1 (o de teste foi apagado em 07/08).

---

## 2026-08-08 — a 013 nunca buildou; o build está consertado e a migração é o próximo passo

> **BLUF:** o commit `4547e82` ("feat: unificar motor de loja multicadeira") **nunca foi
> buildado nem deployado**. App e site estavam quebrados desde ele, então produção continua
> rodando a imagem pré-013 — e é por isso que a loja segue faturando. Esta sessão consertou os
> dois builds na branch **`fix/013-build`** (2 commits, tudo verde). **A branch NÃO foi
> mergeada de propósito:** o código novo exige colunas que não existem no banco, e o merge
> dispara deploy. **A próxima sessão começa na MIGRAÇÃO, não em código.**

### Estado exato

| | |
|---|---|
| `main` (pushada, `ea78877`) | fixes de `daCasa` da 012 — ver [handoff da 012](../012-carteira-cadeiras-ecommerce/handoff.md) |
| branch `fix/013-build` | `11b0f57` + `a590fd9`. **Não mergeada, não pushada.** Working tree limpo |
| build app | ✅ `tsc` 0 erros · `npm test` exit 0 · `next build` exit 0 |
| build site | ✅ `npx astro build` exit 0 · `check-lojas` OK · **sitemap 99 URLs** (FR-008 intacto) |
| banco de produção | ❌ **schema ANTIGO.** `itens_pedido_fita` existe (8 linhas); as 7 colunas da 013 **não existem** |
| `tasks.md` | 0/30 marcados — e está **correto**, não desatualizado |

### 🚨 A ordem é obrigatória: migrar ANTES de mergear

O merge na `main` é deploy (EasyPanel). Deployar este código contra o banco atual quebra o
caminho de dinheiro, e isso **não é inferência** — está demonstrado. Qualquer leitura de
`itens` com o client novo contra o banco de hoje devolve:

```
P2022: The column `itens_pedido.unidade` does not exist in the current database
```

Consequência do deploy sem migrar: `/api/pedidos` não cria pedido nenhum, e
`/api/pagamentos/webhook` nunca marca pagamento como `pago`. **O build quebrado vinha, sem
querer, servindo de trava de segurança.**

### 🚩 As duas armadilhas JÁ ARMADAS na migração

**1. Os dois scripts de migração não rodam.** `verify-013-sums.mjs` e
`migrate-013-backfill.mjs` fazem `include: { itensFita: true }`, e o `4547e82` apagou o modelo
`ItemPedidoFita` do schema. Prisma devolve *Unknown field `itensFita`*. É um ovo-e-galinha: o
backfill precisa LER a tabela antiga, e o schema que permitiria lê-la foi removido no mesmo
commit. **A 013 removeu o modelo na fase errada** — o `tasks.md` põe isso em T026, na limpeza,
DEPOIS da migração.

Conserto (escolher um, antes de rodar qualquer coisa):
- **(a)** devolver `ItemPedidoFita` + a relação `itensFita` ao schema, migrar, e só então
  aplicar T026/T027 — é a ordem que o próprio `tasks.md` desenhou; ou
- **(b)** reescrever os dois scripts para ler `itens_pedido_fita` por `$queryRaw`.

**2. A primeira corrida mede o CHECK, não o dado.** Nenhum dos dois scripts jamais rodou.
Trate a primeira saída como teste do script; quem fecha é a segunda via.

### Baseline medido HOJE (08/08), por SQL cru

```
porcelanato | pendente | 7244.45      porcelanato | pendente | 7244.45
fitas       | pendente | 2461.05      fitas       | pendente | 2360.73
fitas       | pendente | 2361.19      fitas       | pendente |  420.02

Pedidos=6   SOMA=22091.89   PAGOS=0   mpPaymentId=0
itens_pedido = 2 linhas  ·  itens_pedido_fita = 8 linhas
```

**Depois do backfill, `itens_pedido` tem de ter 10 linhas.** Guarde os dois números: total
igual com item faltando dentro é o falso-verde clássico desta migração.

### Como alcançar o banco a partir da máquina de dev

O `DATABASE_URL` do `.env` da raiz aponta para o host **interno** do Docker
(`doc_crm_roilabs_db:5432`) e ainda tem um `]` colado no fim — nas **3** ocorrências. Receita:

```bash
cd app
DB=$(grep -m1 "^DATABASE_URL" ../.env | sed 's/^DATABASE_URL=//' | sed 's/\]$//' \
     | sed 's#@doc_crm_roilabs_db:5432#@2.24.207.200:5443#')
DATABASE_URL="$DB" node --import tsx scripts/verify-013-sums.mjs
```

⚠️ `:5445` é o **`roihub_db`**, projeto errado. O da loja é `:5443`.

### Sequência da próxima sessão

1. Consertar os scripts (armadilha 1) — sem isto nada roda
2. `verify-013-sums.mjs` → salvar `antes.txt`
3. `prisma db push` **manual** contra `2.24.207.200:5443` (o runner standalone não aplica)
4. `migrate-013-backfill.mjs --dry-run`, ler, então rodar de verdade
5. `verify-013-sums.mjs` → `depois.txt` e `diff` contra o `antes.txt`; conferir 10 linhas
6. Só então `git merge fix/013-build` + push, e **conferir o deploy no EasyPanel** (não assumir)
7. Marcar o `tasks.md` do que de fato foi feito

### O que esta sessão consertou (com evidência, não afirmação)

Três defeitos que o build quebrado escondia, além dos imports:

- **`pedidos/route.ts`** importava `cotarFrete`, `SLUG_PERSONALIZADA` e `SLUG_CLICHE` de
  `precos-fitas`, que nunca os exportou. O `cotarFrete` mora em `frete-fitas`; os dois `SLUG_*`
  eram consts locais antes da 013 e **não foram movidos para lugar nenhum**. O
  `SLUG_PERSONALIZADA` nem era usado. `LinhaFixa` ganhou `slug` e `rotulo` nos dois espelhos —
  o slug que DISPARA e o da linha CRIADA são coisas diferentes.
- **`pagamentos/webhook`** ainda consultava `prisma.itemPedidoFita` (modelo apagado) e
  `item.caixas` (coluna apagada). Agora é uma leitura só, e quem decide a exibição é a
  `unidade` do item, não o vertical do pedido.
- **`const itens = []` era `any[]`**, então a rota empurrava `caixas`/`m2`/`precoM2` para o
  `create` do Prisma sem o compilador ver. **O primeiro pedido após qualquer deploy teria
  estourado**, no caminho de dinheiro, com build verde. Tipar o array revelou mais dois: a
  cotação de frete de fita lia `detalhe.caixas`, campo que naquela cadeira nunca existe.
- **O site também não buildava:** `favoritos.astro` importava `encodeItems`, removido pela
  reescrita do carrinho. Restaurado como função de verdade (codifica lista arbitrária) e o
  `encodeCart` passou a delegar para ela.

Pedido criado ANTES da migração tem `unidade` nula: todos os renderizadores omitem a medida em
vez de escrever "undefined caixa(s)" para quem pagou. O endpoint de status continua servindo
`caixas` (derivado de `detalhe`, não coluna) porque o site é outro deploy e a página publicada
lê esse campo.

### Descobertas colaterais (não são desta feature)

- **A 014 não tem premissa.** Ela assume que a 013 cobra o 1º ciclo de assinatura. Não cobra: o
  dispatch de preço trata `m2` e `rolo`, e `assinatura` cai fora do laço em silêncio → `?erro=vazio`.
  T016(j)/T021/T022 nunca foram feitas.
- **A carteira da 012 não tem de quem cobrar.** Com `atma` e `porcelanato` corrigidos para
  `daCasa`, a TapePro é a única cadeira fora da casa — e ela vende pelo carrinho da ROI Labs,
  sem passar pela carteira. Detalhe no handoff da 012.

### Não reabrir

⛔ **Teste de venda real com cartão real — cancelado pelo Jean em 07/08.** Segue valendo.

---

## 2026-08-08 (sessão 2) — migração aplicada, merge em main feito, deploy PRECISA conferência visual

> **BLUF:** a armadilha 1 era maior do que a sessão anterior descreveu — `4547e82` não só
> removeu `itensFita`, **removeu também `caixas`/`m2`/`precoM2` de `ItemPedido`**, colunas que
> `migrate-013-backfill.mjs` e `verify-013-sums.mjs` leem diretamente. Um `db push` do schema
> como estava teria **dropado** as duas fontes que o backfill precisa ler, na frente da
> migração. Corrigido, migração rodada em produção, dinheiro bate exato. **A branch
> `fix/013-build` NÃO foi mergeada — falta só isso.**

### O que foi feito

1. Restaurado em `app/prisma/schema.prisma`: `caixas`/`m2`/`precoM2` em `ItemPedido` (como
   `Int?`/`Decimal?` — nullable, não como estavam antes, porque `pedidos/route.ts` já grava
   pedidos novos sem preenchê-las) + modelo `ItemPedidoFita` + relação `itensFita` em `Pedido`.
2. `prisma generate`, `tsc --noEmit`, `npm test`, `next build`, `astro build` — todos verdes.
3. Baseline conferido por SQL cru contra produção: idêntico ao registrado em 07/08 (6 pedidos,
   R$ 22.091,89, 0 pagos).
4. `prisma db push` — aditivo, sem prompt de perda de dado, confirmado no banco certo
   (`roilabs_db@2.24.207.200:5443`).
5. `verify-013-sums.mjs` pós-push/pré-backfill = baseline (2 itens com `unidade IS NULL`, 8
   fitas não copiadas — esperado).
6. `migrate-013-backfill.mjs --dry-run` conferido linha a linha, depois rodado de verdade: 2
   UPDATEs (porcelanato) + 8 INSERTs (fita).
7. `verify-013-sums.mjs` pós-backfill: **R$ 22.091,89 nos dois lados, totais por pedido
   idênticos byte a byte, 0 `unidade IS NULL`, 0 invariante quebrada, 0 fita não copiada.**
   `itens_pedido` foi de 2 para **10 linhas**, como previsto.
8. `tasks.md`: T007–T012 marcados (schema, os dois scripts, os 3 testes da Fase 2) — únicos
   marcados porque foram os únicos re-verificados nesta sessão; Fases 1/3/4/5 continuam `[ ]`
   por falta de auditoria, não por estarem incompletas.

### Estado exato

| | |
|---|---|
| banco de produção | ✅ schema novo aplicado, backfill rodado, dinheiro conferido |
| `fix/013-build` → `main` | ✅ fast-forward merge, `74581da`, **pushado para `origin/main`** |
| deploy EasyPanel | ✅ **confirmado pelo Jean em 08/08** ("subiu sim"). O rollout arrastou junto tudo que estava represado desde `4547e82` — a 013 inteira **e** commits da 012 que nunca tinham ido ao ar. |

### Rollback, se algo aparecer depois

Reverter `main` para `ea78877`. O banco migrado **não** quebra o código antigo: as colunas
legadas continuam presentes e as 7 novas são todas anuláveis.

### Não reabrir

⛔ Teste de venda real com cartão real. Segue valendo.

---

## PRÓXIMA SESSÃO — T016(j) · T021 · T022 (a unidade `assinatura`)

> **BLUF:** o motor da 013 está no ar, mas ele sabe precificar **duas** das três unidades. A
> `assinatura` cai fora do laço de precificação **em silêncio** e o comprador leva
> `?erro=vazio`. Essas 3 tasks fecham o buraco — e **a 014 inteira está bloqueada por elas**:
> a spec 014 assume que a 013 cobra o 1º ciclo, e ela não cobra. **Não abrir a 014 antes disto.**
> As armadilhas abaixo foram achadas lendo o código em 08/08, não estão no texto das tasks.

### O defeito, exato

[`app/src/app/api/pedidos/route.ts:91-125`](../../app/src/app/api/pedidos/route.ts#L91-L125) é
um `if (loja.unidade === 'm2') … else if (loja.unidade === 'rolo') …`. Sem `else`. Cadeira de
assinatura entra no laço, não casa nenhum ramo, **nenhum item é empilhado**, e três linhas
depois `if (itens.length === 0) return backTo(origin, 'vazio')`. Falha silenciosa no caminho de
dinheiro: nada loga, nada alerta, o comprador só vê "carrinho vazio".

### O que JÁ está pronto (não reconstruir)

| | |
|---|---|
| `precificarAssinatura` | ✅ escrito e completo em [`site-goiania/src/data/unidades.ts:65`](../../site-goiania/src/data/unidades.ts#L65) — devolve `{ precoUnitario: produto.preco, detalhe: {} }` |
| unidade `assinatura` registrada | ✅ `unidades.ts:91` — `entregaFisica: false`, rótulo "mês/meses" |
| colunas do banco | ✅ `recorrencia`, `assinaturaRef`, `assinaturaEstado` **já existem em produção**, anuláveis (migração de 08/08). **Zero trabalho de banco nestas tasks.** |
| teste da invariante | ✅ `app/test/item-unificado.test.mjs` já cobre as 3 unidades, assinatura inclusa |

### 🚩 As 5 armadilhas que o texto das tasks não conta

**1. T021 e T022 se contradizem.** T021 manda declarar a cadeira de teste com `publicada=false`.
T022 manda percorrer o checkout dela. Mas a rota barra na entrada:
`if (!loja.publicada) return backTo(origin, 'indisponivel')` ([route.ts:41](../../app/src/app/api/pedidos/route.ts#L41)).
Com `publicada=false` o T022 **não roda**. Decidir antes de começar: `publicada=true` temporário
(e tirar depois), ou um bypass explícito. Não descobrir isso no meio do teste.

**2. O servidor não tem catálogo da cadeira nova — este é o bloqueio real.**
`app/src/lib/lojas.ts` diz, em comentário, que **não importa catálogo de propósito**: o preço no
servidor vem de `@/lib/precos` (porcelanato) e `@/lib/precos-fitas` (fitas), duas libs
hardcoded por vertical. Uma cadeira `teste-saas` **não tem de onde a rota tirar preço**. Sem
resolver isto, T016(j) não tem o que precificar e T022 não tem o que comprar. É a decisão de
design que abre a sessão, não um detalhe de implementação.

**3. `unidades.ts` mora no site e o servidor não pode importar dele.** São dois containers e dois
deploys — o próprio `lojas.ts` do app registra isso. Então T016(d) ("recálculo de preço via
`unidades.ts`") é **irrealizável ao pé da letra** através da fronteira. Ou o servidor ganha seu
espelho de `unidades.ts` (mesma duplicação deliberada que já existe para `lojas.ts`, com teste
de paridade), ou o ramo de assinatura é escrito inline na rota. Escolher conscientemente.

**4. `recorrencia` não é campo de cadeira em lugar nenhum.** T021 pede a cadeira com
`recorrencia: 'mensal'`, mas nem `Loja` (site, `lojas.ts:24`) nem `LojaConfig`
(servidor, `app/src/lib/lojas.ts:26`) têm esse campo. Tem de entrar **nos dois espelhos** — e
os dois têm de continuar batendo.

**5. 🧊 O gate de build passa VAZIO para a cadeira nova.** `check-lojas.mjs` tem
`catalogMap = { produtos, fitas }` **hardcoded**. Catálogo que não esteja nesse mapa vira `[]`, e
aí as regras 2 (slug único), 4 (catálogo não vazio) e 5 (preço > 0 e imagem) passam **por
vacuidade** — o gate fica verde sem ter conferido nada. Registrar `teste-saas` no `catalogMap`
faz parte da task, senão o "check-lojas OK" não é evidência de coisa alguma.
(Mesma família de [[amostra_procurada_fora_do_percentual]] / portão que passa por base vazia.)

### Ordem sugerida

1. **Decidir** as armadilhas 2 e 3 (de onde vem o preço no servidor) — trava tudo.
2. **T016(j)**: ramo `assinatura` na rota — grava `unidade='assinatura'`, `quantidade=1`,
   `precoUnitario` = valor do ciclo, `recorrencia`, `assinaturaEstado='ativa'`. Cobra **só o 1º
   ciclo**. Junto: (i) unidade sem entrega física ⇒ sem endereço, `frete=0`.
3. **T021**: cadeira `teste-saas` + catálogo fictício, nos dois espelhos de `lojas.ts`, mais o
   `catalogMap` do `check-lojas.mjs`.
4. **T022**: percorrer vitrine → carrinho → checkout até a intenção de pagamento (**sem pagar**).
   Conferir no banco: `unidade`, `recorrencia`, `assinaturaEstado`, `precoUnitario`. Conferir na
   tela que **nenhuma etapa de entrega/frete aparece** (FR-018a).
5. **T023** fecha a fase: `git diff --name-only` deve mostrar **só** os arquivos da cadeira.
   Qualquer arquivo de rota/carrinho/checkout no diff **é a SC-001 reprovando** — o motor não
   provou que abre loja sem código novo.

### O que NÃO é destas tasks

- **`assinaturaRef` fica `null`** e está certo: `createPreference` do MP é pagamento avulso, não
  assinatura recorrente. Amarrar recorrência de verdade no gateway **é a 014**. T016(j) cobra o
  ciclo 1 e para aí.
- ⛔ Teste com cartão real — cancelado, segue valendo. Verificação de dinheiro é **soma no
  banco**, nunca pagamento.

### Verificação (as travas deste repo)

- `npm test` no `app` · `npx astro build` no `site-goiania` — **nunca `npm run build`**, que
  submete ao IndexNow.
- **Build local não prova nada** (OneDrive corrompe `node_modules`): a prova é em ambiente real.
- **`git push` em `main` é DEPLOY.** Trabalhar em branch; encostar em `main` só com a
  verificação na mão.
- As **99 URLs** do sitemap continuam sendo a restrição dominante — nenhuma pode mover.
