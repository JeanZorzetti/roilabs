# Tasks: A carteira inteira como cadeiras vendáveis

**Input**: Design documents from `/specs/012-carteira-cadeiras-ecommerce/`

**Prerequisites**: [plan.md](./plan.md) ✅ · [spec.md](./spec.md) ✅ · [research.md](./research.md) ✅ · [data-model.md](./data-model.md) ✅ · [contracts/webhook-carteira.md](./contracts/webhook-carteira.md) ✅

**Tests**: **INCLUÍDOS** — pedidos explicitamente pela spec. `contracts/webhook-carteira.md`
define 7 testes de contrato obrigatórios e `SC-007` exige prova de idempotência. Caminho de
dinheiro sem teste não fecha.

**Escopo (Fase 0 concluída em 07/08):** 7 cadeiras, **2 adaptadores**.
Mercado Pago → `atma` (já ligado), `polarisia`, `estetiacrm`, `vertice`.
Stripe → `sirius`, `context`, `orion`. **Kiwify: zero cadeira, não construir.**

## Convenções deste repo (não descobrir de novo)

- **Teste é `node --import tsx test/*.test.mjs`**, sem framework. ⚠️ **A lista em
  `app/package.json` é explícita — arquivo de teste novo TEM de ser adicionado lá à mão, senão
  nunca roda.** Teste que não roda não reprova nada.
- **`prisma db push` é MANUAL**, de máquina que alcança o host. `migrate diff --script` antes,
  como preview.
- **Build local não vale** (Constituição II). "Pronto" exige Docker/EasyPanel ou browser em
  produção.
- Next 16: `params: Promise<…>` + `await params`; prisma singleton `@/lib/prisma`.

---

## Phase 1: Setup

**Purpose**: preparar o terreno sem tocar em nada que fatura.

- [X] T001 Criar a árvore `app/src/lib/carteira/` e `app/src/lib/carteira/adaptadores/` conforme a Structure Decision de [plan.md](./plan.md)
- [X] T002 [P] Registrar em `app/.env.example` os nomes das env vars de segredo por conta de parceiro (padrão `WEBHOOK_SECRET_<GATEWAY>_<PARCEIRO>`), sem valores
- [X] T003 [P] Confirmar que `stripe` está em `app/package.json`; adicionar como dependência se ausente (o SDK hoje vive nos repos dos parceiros, não neste)
- [X] T003a ⚠️ **Linha de base de `SC-003`, tirada ANTES do `db push`**: exportar `id, total, frete, status` de **todos** os pedidos e `id, pedidoId, valor, taxaAplicada` de todos os `negocios_originados` para arquivo versionado, com contagem. Sem este snapshot, "zero regressão" é afirmação, não medição

---

## Phase 2: Foundational (BLOQUEIA todas as user stories)

**Purpose**: schema e núcleo de registro. Nada de US1–US6 começa antes disto fechar.

### Schema — na ordem de `data-model.md` §6

- [X] T004 Adicionar `model VendaParceiro` em `app/prisma/schema.prisma` com `@@unique([gateway, eventoId])`, `payload Json`, **`parceiroId` ANULÁVEL** (null = não atribuída, FR-005) e `motivoDescarte`
- [X] T005 Adicionar `model CredencialGateway` em `app/prisma/schema.prisma` com `@@unique([gateway, contaRef])` e `segredoRef` guardando o **NOME** da env var
- [X] T006 Adicionar `estado`, `daCasa`, `exibirDaCasa` e a identidade do projeto (`siteUrl @unique`, `repoUrl`) ao `model Cadeira` em `app/prisma/schema.prisma` — sem `siteUrl`/`repoUrl`, FR-007 e FR-011 não têm onde escrever
- [X] T006a Adicionar `model ProdutoCadeira` em `app/prisma/schema.prisma` conforme `data-model.md` §4.5, com `@unique` em `cadeiraId` e `checkoutUrl` anulável — é a fonte do preço de FR-013
- [X] T007 ⚠️ Tornar `NegocioOriginado.pedidoId` **anulável** e adicionar `origem` (`@default("pedido")`), `vendaId` e `clienteRef` (+ `@@index([parceiroId, clienteRef])`) em `app/prisma/schema.prisma`
- [X] T007a ⚠️ Acrescentar as **relações inversas** que as tabelas novas exigem: `Parceiro { vendas VendaParceiro[]  credenciais CredencialGateway[] }` e `Cadeira { produto ProdutoCadeira? }`. Sem elas o `prisma generate` **falha** — e ele roda antes do `next build`
- [X] T008 Rodar `npx prisma migrate diff --script` e **ler o SQL** antes de qualquer `db push` — preview seguro registrado na spec 010
- [X] T009 Aplicar o schema com `prisma db push` MANUAL, de máquina que alcança o host; anexar o output — rodado em 2026-08-07, output em [snapshots/db-push-012.txt](./snapshots/db-push-012.txt). Exigiu `--accept-data-loss` pelo aviso do `@unique` em `cadeiras.site_url`: coluna **nova**, toda nula, zero duplicata possível
- [X] T010 Escrever `app/scripts/migrate-012-backfill.mjs` gravando `origem='pedido'` explicitamente em toda linha existente de `negocios_originados` — o `@default` **não** reescreve linha já gravada
- [X] T011 Rodar o backfill e conferir contagem antes/depois: zero linha com `origem` nula — `0/0`, a tabela estava **vazia** em produção (portão passou por vacuidade, ver T072a)

### ⚠️ A varredura que é tarefa, não observação

- [X] T012 Varrer **todas** as leituras de `NegocioOriginado` em `app/src/` que filtram ou agrupam por `pedidoId`, e listar cada ocorrência com arquivo:linha antes de alterar qualquer uma
- [X] T013 Corrigir cada ocorrência de T012 para tratar `origem='webhook'` explicitamente — `pedidoId` anulável faz consulta antiga ignorar negócio de webhook **em silêncio** (mesma landmine do `freteMotivo` na 010)
- [X] T014 Escrever `app/test/negocio-origem.test.mjs` provando a invariante de origem: das 4 combinações `(pedidoId, vendaId)`, só 2 podem gravar
- [X] T015 Adicionar `app/test/negocio-origem.test.mjs` à lista de `test` em `app/package.json` — **sem isto ele nunca roda**

### Núcleo de registro

- [X] T016 Implementar `app/src/lib/carteira/registrar-venda.ts` com os passos 4–6 de [contracts/webhook-carteira.md](./contracts/webhook-carteira.md): gravar `VendaParceiro`, conferir `contaRef`, criar `NegocioOriginado`
- [X] T017 Em `registrar-venda.ts`, aplicar a **regra ordenada** de `contracts/webhook-carteira.md`: (1) `recorrente=true` → recorrência; (2) negócio anterior do mesmo cliente (`clienteDoc`, senão `clienteRef`) → recorrência; (3) senão aquisição. ⚠️ Reusar a função da spec 010 **sem reimplementar** (`app/test/classificar-negocio.test.mjs` já a cobre) — o passo 1 é o envelope, não uma segunda regra
- [X] T017a ⚠️ Estender `app/test/classificar-negocio.test.mjs` com o caso que motivou a regra 1: **renovação de assinatura sem CPF**. Sem ela a regra crua da 010 ("sem doc → aquisição") cobraria **15% em toda renovação mensal** onde o contrato promete 10%
- [X] T018 Em `registrar-venda.ts`, aplicar FR-010: cadeira com `daCasa=true` grava a venda e **não** gera success fee
- [X] T019 [P] Implementar `app/src/lib/carteira/credenciais.ts` resolvendo `CredencialGateway` por `(gateway, parceiroId)` e lendo o segredo da env via `segredoRef` — nunca do banco
- [X] T020 [P] Escrever `app/test/registrar-venda.test.mjs` cobrindo idempotência (colisão de `@@unique`), conta divergente e cadeira da casa
- [X] T021 Adicionar `app/test/registrar-venda.test.mjs` à lista de `test` em `app/package.json`

**Checkpoint**: schema aplicado, backfill conferido, leituras varridas, núcleo testado. US1 pode começar.

---

## Phase 3: User Story 1 — A venda da cadeira SaaS chega até a carteira (P1) 🎯 MVP

**Goal**: uma compra no gateway do parceiro vira `NegocioOriginado` sozinha, sem digitação.

**Independent Test**: completar uma compra real no gateway de **uma** cadeira e ver o negócio
nascer classificado, com taxa congelada, sem intervenção manual.

### Rota e adaptador Mercado Pago (cobre 4 cadeiras — começar por ele)

- [X] T022 [US1] Criar `app/src/app/api/carteira/webhook/[gateway]/[parceiroId]/route.ts` com `export const dynamic = 'force-dynamic'` e `await params` (Next 16)
- [X] T023 [US1] Implementar na rota a ordem obrigatória do contrato: resolver credencial (404) → verificar assinatura (401) → consultar gateway → **conferir a conta e decidir o `parceiroId`** → gravar. **Nenhum estado tocado antes do passo 2, e a conta é conferida ANTES da única escrita** — gravar primeiro e conferir depois faz a linha nascer atribuída ao parceiro errado
- [X] T024 [US1] Implementar `app/src/lib/carteira/adaptadores/mercadopago.ts`: verificação de assinatura **com o segredo daquela conta** e `getPayment` para ler status/valor reais
- [X] T025 [US1] Generalizar `verifyWebhookSignature` em `app/src/lib/mercadopago.ts` para aceitar o segredo como argumento, **mantendo a assinatura atual funcionando** com `MP_WEBHOOK_SECRET` — `/api/pagamentos/webhook` não pode mudar de comportamento
- [X] T025a [US1] ⚠️ Escrever `app/test/mercadopago-assinatura-regressao.test.mjs` provando que a **chamada antiga de um argumento** produz o mesmo resultado de hoje. T025 mexe na função que `/api/pagamentos/webhook` usa — o único caminho que fatura (FR-005a) — e alterar caminho de dinheiro sem teste de regressão é o que a Constituição II proíbe
- [X] T025b [US1] Adicionar `app/test/mercadopago-assinatura-regressao.test.mjs` à lista de `test` em `app/package.json`
- [X] T026 [US1] Implementar a tabela de status do contrato: 200 (ok/retry/irrelevante), 401, 404, 409, 5xx. **200 para evento irrelevante é deliberado** — erro faria o gateway reenviar para sempre
- [X] T027 [US1] Registrar evento não-atribuível com `parceiroId = null` e `motivoDescarte = 'conta-divergente'`, **payload preservado**, sem criar negócio (FR-005)
- [X] T027a [US1] Implementar FR-006 em `registrar-venda.ts`: payer de conta de teste grava a venda com `motivoDescarte = 'payer-teste'` e **não** conta como receita, mesmo com `approved` + `live_mode: true`

### Testes de contrato — os 7 de `contracts/webhook-carteira.md`

- [X] T028 [P] [US1] Escrever `app/test/webhook-carteira.test.mjs` casos 1–3: assinatura inválida → 401 sem gravar; mesmo evento 2× → 1 venda e 1 negócio; **dois retries simultâneos** → idem
- [X] T029 [P] [US1] Acrescentar casos 4–7: conta divergente → 409; payer de teste → não conta receita; cadeira `daCasa` → fee zero; falha ao consultar gateway → 5xx sem gravar
- [X] T030 [US1] Adicionar `app/test/webhook-carteira.test.mjs` à lista de `test` em `app/package.json`

### Adaptador Stripe (cobre `sirius`, `context`, `orion`)

- [X] T031 [US1] Implementar `app/src/lib/carteira/adaptadores/stripe.ts` com verificação de `Stripe-Signature` por segredo de endpoint e leitura do status na API
- [X] T032 [US1] Estender `app/test/webhook-carteira.test.mjs` com os mesmos 7 casos para Stripe — o núcleo é o mesmo, a assinatura não

### Ligar a primeira cadeira de verdade

- [ ] T033 [US1] Cadastrar `CredencialGateway` da primeira cadeira e publicar a env do segredo na EasyPanel
- [ ] T034 [US1] Apontar o webhook no painel do gateway do parceiro para a URL com o `parceiroId` correto
- [X] T035 [US1] ⚠️ Garantir que o `log.warn` do 401 chega a alguém (alerta) — segredo derivado do painel faz a venda parar de ser gravada **em silêncio**, e este é o único sinal
- [ ] T036 [US1] **Venda real com cartão real em produção** → conferir `VendaParceiro` + `NegocioOriginado` + fee. É `SC-001`: a receita provada sai de R$ 0,00 aqui ou não sai
- [ ] T037 [US1] Reenviar o mesmo evento em produção e provar que produz **um** negócio (`SC-007`)

**Checkpoint**: US1 entregue. A carteira apura receita por máquina. **Este é o MVP.**

---

## Phase 4: User Story 2 — Uma cadeira ocupada vira produto comprável (P1)

**Goal**: o cliente compra; cadeira sem gateway não finge que vende.

**Independent Test**: compra de ponta a ponta em produção numa cadeira publicada.

- [X] T038 [US2] Implementar a validação de servidor de `ProdutoCadeira`: `modoCobranca='parceiro'` exige `checkoutUrl` não-vazio — o Prisma não declara CHECK, então é código + teste. *(O schema em si já entrou na T006a: adicionar coluna aqui exigiria um segundo `db push` manual no host, no meio da entrega.)*
- [X] T039 [US2] Implementar em `app/src/lib/carteira/` a decisão de fluxo: `carrinho` → caminho existente de `Pedido`; `parceiro` → saída para o gateway com atribuição que permita ligar a venda de volta (US1)
- [X] T040 [US2] Implementar FR-008 em `app/src/app/api/cadeiras/route.ts`: cadeira sem gateway ligado **não** expõe checkout
- [X] T041 [P] [US2] Deixar explícito na saída para o gateway de quem é a página de pagamento — comprador que não sabe a quem paga é chargeback
- [X] T042 [P] [US2] Escrever `app/test/cadeira-checkout.test.mjs`: cadeira sem gateway não oferece checkout; modo `carrinho` e modo `parceiro` roteiam diferente
- [X] T043 [US2] Adicionar `app/test/cadeira-checkout.test.mjs` à lista de `test` em `app/package.json`

---

## Phase 5: User Story 3 — A página da cadeira é conteúdo, não card (P1)

**Goal**: página que responde a pergunta que trouxe o visitante — tipicamente **quanto custa**.

**Independent Test**: publicar, submeter à indexação, e em 30 dias conferir impressão para query
**não-branded**.

⚠️ **Conteúdo antes de quantidade.** A medição da Atma mostra 86% do tráfego numa página que
responde uma pergunta de preço inteira, e que esforço por artigo **não prediz nada**. Publicar 7
páginas finas é o resultado a evitar.

- [X] T044 [US3] Criar o template de página de cadeira em `site-goiania/src/pages/` servindo conteúdo no **HTML inicial** (FR-012) — não shell de SPA
- [X] T045 [US3] Incluir `Product`/`Offer` com preço e `FAQPage` dentro do `@graph` único do site (FR-013)
- [X] T046 [US3] Implementar FR-009: cadeira em estado não-vendável **não** gera URL pública indexável nem entra no sitemap
- [X] T047 [P] [US3] Escrever o verificador do piso de FR-014 (≥800 palavras no HTML inicial, preço explícito no corpo, ≥6 FAQ). ⚠️ **Não contar palavra com `sed 's/<script[^>]*>.*<\/script>//g'`** — em HTML minificado o `.*` guloso devolve 0 palavra em página com `<h1>`
- [ ] T048 [US3] Escrever a página da **primeira** cadeira e passar no verificador de T047
- [ ] T049 [US3] Escrever as páginas das 6 cadeiras restantes, uma a uma, cada uma passando no verificador
- [ ] T050 [US3] Rodar o verificador contra todas as páginas publicadas e provar `SC-006`: nenhuma abaixo do piso

---

## Phase 6: User Story 5 — Cadeira vaga vendida ao ICP B2B (P2)

**Goal**: o institucional mostra estado real e vende a cadeira vaga.

**Independent Test**: abrir o institucional deslogado, ver estado vindo da API, completar candidatura.

- [X] T051 [US5] Atualizar `app/src/lib/seats.ts` com `estado`, `daCasa` e `exibirDaCasa` no SEED das 8 cadeiras existentes
- [X] T052 [US5] Marcar `daCasa=true` em todas as cadeiras da casa e `exibirDaCasa=true` **apenas** em `sirius`, `meridian` e `orion` — a lista de exceções é **dado**, nunca condição no código (FR-010a)
- [X] T053 [US5] Expor `estado` e a exibição resolvida em `app/src/app/api/cadeiras/route.ts`
- [X] T054 [US5] Atualizar o fallback sem JS em `site/src/pages/index.astro` para espelhar o SEED (FR-019)
- [X] T055 [US5] Implementar FR-020: cadeira ocupada **não** é oferecida para candidatura
- [X] T056 [US5] ⚠️ Escrever `app/test/agregado-sem-casa.test.mjs` provando FR-010: **nenhum agregado de faturamento, fee ou "receita da carteira" soma cadeira da casa**
- [X] T057 [US5] Adicionar `app/test/agregado-sem-casa.test.mjs` à lista de `test` em `app/package.json`
- [ ] T057a [US5] 🚨 **A carteira é INVISÍVEL no institucional — descoberto 07/08 pelo Jean ("não vi diferença em `roilabs.com.br`"), e nenhuma task acima cobre.** Duas causas somadas: (a) o skeleton estático de `site/src/pages/index.astro:28-37` espelha `DEFAULT_SEATS`, então o fetch reescreve **os mesmos valores** e a página renderiza igual com a API em 200 ou em 500; (b) o laço casa **por índice** sobre os 8 `<li>` do grid (`index.astro:219`) e a API devolve **16** cadeiras — as 9 de projeto têm `ordem` ≥ 8 e **nunca são renderizadas**. `estado`, `rotulo`, `siteUrl`, `produto` e `checkout` são servidos e lidos por ninguém. **T053/T054/T055 cumpriram FR-019 ao pé da letra e mesmo assim o objetivo não aconteceu.** ⚠️ **Decisão de produto antes de código** (3 saídas no handoff) — e ao exibir, usar `rotulo`, **nunca** `daCasa`: 4 das 9 são da casa sem exibição pública (FR-010a). O `ponytail:` em `index.astro:213` já nomeou o gatilho ("se a contagem divergir, casar por id"); ela divergiu

---

## Phase 7: User Story 4 — O domínio deixa de ser geográfico (P2) ⚠️ maior risco

**Goal**: reposicionar sem destruir as 41 páginas pSEO + 5 guias com histórico no GSC.

**Independent Test**: toda URL antiga em 301, sitemap com corpo válido, impressões de volta em 30 dias.

**Por último de propósito** — é a única fase que pode destruir ativo existente.

- [ ] T058 [US4] Confirmar com o Jean o label do subdomínio (assumido `loja.roilabs.com.br`) — **um label só**, cert Universal não cobre segundo nível
- [ ] T059 [US4] Criar o host na EasyPanel e no DNS; **verificar o handshake TLS sem `curl -k`** (a flag esconde exatamente o erro de cert que derruba o browser)
- [X] T060 [US4] Montar o mapa completo URL antiga → URL nova das 41 páginas pSEO + 5 guias, arquivo a arquivo
- [ ] T061 [US4] Implementar os **301** (nunca 302, nunca 404) para todo o mapa de T060
- [ ] T062 [US4] Reorganizar `site-goiania/src/pages/` com porcelanato sob pasta própria, mantendo o **conteúdo** da malha intacto (FR-018)
- [ ] T063 [US4] Submeter o sitemap novo e **validar o CORPO** (`<?xml`), nunca o status 200 — 200 em sitemap não prova deploy
- [ ] T064 [US4] Conferir `errors: 0` no download do sitemap pelo Google (FR-016)
- [ ] T065 [US4] Registrar a data do corte e conferir em D+30 que as impressões da malha voltaram ao patamar pré-corte (`SC-004`)

---

## Phase 8: User Story 6 — As 27 sem produto entram sem virar página fina (P3)

**Goal**: "todos os 35 estão lá" ser verdade sem publicar 27 páginas vazias.

**Independent Test**: cadastrar uma em `em-preparacao` e ver que não gera URL nem checkout.

- [ ] T066 [US6] Cadastrar as cadeiras restantes com `estado='em-preparacao'`, incluindo **`orcaobra`** (saiu da fase 1 por bloqueio de produto, não de fiação). **Parcial em 07/08:** `siteUrl`/`repoUrl` das 9 já cadastradas saíram de `roihub/data/projects.json` e estão no banco de produção. As **26** que faltam travam numa decisão, não em acesso: o SEED casa por **`niche`**, e `niche` das 26 não existe escrito em lugar nenhum — inventá-lo cria cadeira duplicada. `daCasa` idem. Ver "Decisões pendentes" no handoff
- [X] T067 [US6] Provar que cadeira `em-preparacao` não gera URL pública indexável nem oferece checkout — `ehIndexavel` e `decidirCheckout` reprovam o estado em [cadeira-checkout.test.mjs:57-61,70](../../app/test/cadeira-checkout.test.mjs), e **em produção** as duas cadeiras `em-preparacao` (`meridian`, `orcaobra`) servem `checkout: {tipo:'indisponivel', motivo:'estado'}` e `produto: null`. ⚠️ O portão do **sitemap** (`cadeirasPublicadas()`) segue sem exercício real: `site-goiania/src/data/cadeiras.ts` está vazio, então essa metade passa por vacuidade até a T048
- [X] T068 [US6] Implementar FR-011 como **teste**, não constraint: `app/test/cadeira-repo-unico.test.mjs` provando que nenhuma cadeira compartilha `repoUrl` com outra (`goiania` e `roilabs` são o mesmo repo). ⚠️ `@@unique` em `repoUrl` proibiria para sempre um repo servir dois sites legítimos — o teste é onde a decisão aparece se isso mudar
- [X] T068a [US6] Adicionar `app/test/cadeira-repo-unico.test.mjs` à lista de `test` em `app/package.json`
- [X] T069 [US6] ⚠️ Ao apurar o estado dos hosts, **não ler "200" como caminho de cobrança** em `tapevision`, `potencialarquitetado` e `pathfinder` — os três servem tudo em 200 (shell de SPA)

---

## Phase 9: Polish & Cross-Cutting

- [X] T070 [P] Conferir que os **7 arquivos novos de teste** estão na lista de `test` de `app/package.json` (`negocio-origem`, `registrar-venda`, `webhook-carteira`, `mercadopago-assinatura-regressao`, `cadeira-checkout`, `agregado-sem-casa`, `cadeira-repo-unico`) e então rodar `npm test`. ⚠️ **Conferir a LISTA, não o output**: o script é cadeia de `&&` e o primeiro erro interrompe — arquivo que nunca apareceu pode ser ausência ou pode ser interrupção
- [ ] T071 [P] Rodar `roihub/scripts/gateways.mjs` e conferir `SC-002`: ao menos 3 das 6 cadeiras que serviam preço mudaram de balde. ⚠️ Cadeira SaaS com checkout no parceiro sai como **"gateway servido"**, não "ligado" — o critério é o balde correto para o modo, não "ligado" para todas
- [ ] T072 Verificação em ambiente real (Constituição II): Docker/EasyPanel ou browser em produção, com output anexado. Build local não vale
- [X] T072a ⚠️ Reexportar o snapshot de T003a e **diffar**: zero pedido com valor alterado, zero negócio com `taxaAplicada` alterada. É `SC-003`, e ele só fecha com o diff anexado — **passou pelo `db push`**: 6 pedidos e 0 negócios, zero valor alterado ([sc003-antes.json](./snapshots/sc003-antes.json) × [sc003-depois.json](./snapshots/sc003-depois.json)). ⚠️ **Reexportar o `depois` de novo depois da T036**: este diff cobre a migração, não a primeira venda de webhook
- [X] T073 Atualizar `specs/012-carteira-cadeiras-ecommerce/handoff.md` com o que foi feito, decisões e gotchas descobertos
- [ ] T074 Commit + push (Constituição V)

---

## Dependências

```text
Setup (T001-T003a)        ← T003a é o snapshot de SC-003, ANTES de qualquer schema
   ↓
Foundational (T004-T021)  ← BLOQUEIA TUDO · schema inteiro, UM db push
   ↓
US1 (T022-T037) 🎯 MVP ─── entrega SC-001
   ↓
US2 (T038-T043) ─── depende de US1 (atribuição da venda)
   ↓
US3 (T044-T050) ─── depende de US2 (o que a página oferece)
   ↓
US5 (T051-T057) ─┐  ⚠️ T052 exige T066 feita antes (ver abaixo)
US4 (T058-T065) ─┼── independentes entre si; US4 por último (maior risco)
US6 (T066-T068a) ─┘
   ↓
Polish (T070-T074)
```

⚠️ **T066 → T052 é dependência entre fases.** T052 marca `exibirDaCasa=true` em `sirius`,
`meridian` e `orion`, mas **`meridian` não está entre as 8 do SEED nem entre as 7 da fase 1** — ele
só nasce como cadeira na T066 (Fase 8). Rodar T052 antes escreve numa linha inexistente. As fases
ficam na ordem publicada; a dependência é que manda.

**US4 não bloqueia ninguém** e pode ser adiada indefinidamente sem travar receita — é
posicionamento, não dinheiro.

## Paralelismo

- **Setup**: T002 e T003 juntos.
- **Foundational**: T019 e T020 juntos (arquivos distintos).
- **US1**: T028 e T029 juntos (mesmo arquivo, seções distintas — coordenar).
- **US2**: T041 e T042 juntos.
- **Polish**: T070 e T071 juntos.

⚠️ **Schema (T004-T011) é estritamente sequencial** — é caminho de dinheiro com migração.

## Estratégia de entrega

**MVP = Phase 1 + 2 + 3 (T001–T037).** Entrega `SC-001`: a receita provada da carteira sai de
R$ 0,00, apurada por máquina. Tudo depois disso é ampliação.

**Um adaptador, uma cadeira, ponta a ponta antes de replicar.** Replicar antes de provar um é
multiplicar defeito — e este é o caminho de dinheiro.

**Ordem de valor decrescente**: US1 (receita apurável) → US2 (comprável) → US3 (tráfego) →
US5 (vender cadeira vaga) → US6 (completude) → US4 (posicionamento).
