# Tasks: E-commerce Maná Moda Social Masculina

**Input**: Design documents from `/specs/015-ecommerce-mana-moda/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos. Esta feature abre um **caminho de dinheiro novo** (split no MP) e um **estado que não existia** (estoque finito). Constituição II: nenhuma task fecha com "build passou".

**Organization**: Tasks agrupadas pelas **7 fases de execução do plan.md** — cada fase é deployável e reversível sozinha — e cruzadas com as user stories (US1, US2, US3) ou `INFRA`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1 (compra ponta a ponta) · US2 (parceiro acompanha e recebe) · US3 (cadeira na carteira) · INFRA (gate/infra compartilhada)
- Caminho de arquivo exato em toda descrição

## Path Conventions

- **`site-goiania/src/`**: Astro estático — vitrine, carrinho, checkout (form). Serve **dois hosts** do mesmo build
- **`app/src/`**: Next 16 — checkout, webhook, admin, banco, painel do parceiro
- **`app/prisma/`**: schema (`db push` **manual**, nunca pelo runner)
- **`app/scripts/`**: seed e verificação
- **`app/test/`**: `node --import tsx test/*.test.mjs`

## Armadilhas que valem para TODAS as tasks

- 🚨 `git push` em `main` é **deploy**. Esta feature trabalha no branch `015-ecommerce-mana-moda`.
- 🚨 `npm run build` no `site-goiania` **submete ao IndexNow**. Build exploratório é `npx astro build`.
- ⚠️ Banco: `2.24.207.200:5443/roilabs_db`. **`:5445` é o `roihub_db`** e não tem estas tabelas.
- ⚠️ O `DATABASE_URL` do `.env` da raiz aponta para o host **interno** do Docker e tem um `]` colado no fim das 3 ocorrências.
- ⚠️ Status 200 não é prova — nem de sitemap baixado, nem de página indexada, nem de venda.

---

## Fase 1: O dado, sem vender nada

**Purpose**: A unidade `peca`, o catálogo e os dois espelhos nascem com gate automático. Nenhuma rota nova, nenhum host novo, nenhum schema. **O site no ar não muda em nada.**

**Goal (US1)**: a base de dados que permite a 4ª unidade de venda existir sem tocar em carrinho nem em checkout.

- [X] T001 [INFRA] Adicionar a 4ª unidade `peca` em `site-goiania/src/data/unidades.ts` conforme data-model.md §1: `id:'peca'`, `rotulo:'peça'`, `rotuloPlural:'peças'`, `entregaFisica:true`, e `precificar(variacao, quantidade)` devolvendo `{ precoUnitario: variacao.preco, detalhe: { produtoSlug, tamanho, cor } }`. `quantidade` é **inteiro ≥ 1** (peça fracionária não existe). Invariante preservada: `subtotal = arredondar(quantidade × precoUnitario, 2)`
- [X] T002 [P] [US1] Criar `site-goiania/src/data/mana.ts` com as interfaces `VariacaoMana` / `ProdutoMana` de data-model.md §2 e o catálogo real. Convenção de `sku`: `<produto-slug>-<tamanho>-<cor-slug>`, minúsculo, sem acento, **imutável**. ⚠️ `sku` é a chave; `tamanho`/`cor` são rótulos de exibição — renomear a cor **não** cria SKU novo. `copyComercial` são 2–3 parágrafos próprios da Maná (Constituição IV), **não** o texto do porcelanato com as palavras trocadas
- [X] T003 [P] [US1] Criar `app/src/lib/precos-mana.ts` — espelho servidor, autoridade de preço e peso (data-model.md §3): `getVariacao(sku): VariacaoPreco | null` e `listarSkus(): string[]`, mapeando `sku → { preco, pesoKg, produtoSlug, tamanho, cor }`. Mesmo papel de `precos.ts` e `precos-fitas.ts`: **nunca confiar no dinheiro nem no peso vindos do cliente**
- [X] T004 [US1] Adicionar a cadeira `mana` em `site-goiania/src/data/lojas.ts` com todos os campos de data-model.md §4: `unidade:'peca'`, `catalogo: produtosMana`, `modoCobranca:'roilabs'`, `checkoutUrl:null`, `pagoA:'Maná Moda'`, `frete:'cotacao'`, `docObrigatorio:true`, **`emailObrigatorio:true`** (campo novo), **`split:{ gateway:'mercadopago', comissaoPct:0.10 }`** (campo novo), `cupomEscopo:'mana'`, `linhaFixa:null`, **`publicada:false`**
- [X] T005 [US1] Espelhar a cadeira em `app/src/lib/lojas.ts` e adicionar `emailObrigatorio` (booleano **explícito**, sem default implícito) e `split` a **todas** as cadeiras já existentes, com `split: null` em porcelanato e fitas. ⚠️ `split: null` significa "o caminho de hoje, byte a byte" — não derivar `split` de `modoCobranca`, são eixos diferentes (quem opera a loja × qual conta recebe)
- [X] T006 [P] [INFRA] Criar `site-goiania/src/scripts/check-mana.mjs` com as 6 invariantes de data-model.md §3: (1) conjuntos de `sku` **iguais** entre `mana.ts` e `precos-mana.ts`; (2) `preco` e `pesoKg` idênticos nos dois; (3) `sku` único em todo o catálogo; (4) `sku` sem colisão com slug de porcelanato ou de fita; (5) todo produto com imagem e toda variação com `preco > 0` e `pesoKg > 0`; (6) `publicada:true` ⇒ delega a checagem de estoque ao `verify-015-estoque.mjs` (o build não alcança o Postgres). **O build quebra, não avisa** — preço divergente é a vitrine anunciando um valor e o checkout cobrando outro
- [X] T007 [INFRA] Registrar `check-mana.mjs` no `prebuild` do `site-goiania/package.json`, no mesmo padrão de `check-lojas.mjs` e `check-cadeiras.mjs`
- [X] T008 [P] [INFRA] Estender `site-goiania/src/scripts/check-lojas.mjs` com as invariantes novas de data-model.md §4: `split != null` ⇒ `comissaoPct` em `(0, 1]` e `gateway` conhecido; `emailObrigatorio` presente e booleano em **toda** cadeira
- [X] T009 [P] [INFRA] Estender `site-goiania/src/scripts/check-cart-math.mjs` para cobrir a unidade `peca`: `subtotal = arredondar(quantidade × precoUnitario, 2)` com `quantidade` inteira ≥ 1
- [X] T010 [P] [US1] Criar `app/test/mana-paridade.test.mjs` — mesma checagem do gate de build, do lado do servidor: conjuntos de SKU iguais, preço e peso idênticos, `sku` único e sem colisão de namespace com as outras duas cadeiras
- [X] T011 [US1] **Gate da Fase 1** (quickstart §Fase 1): `node src/scripts/check-lojas.mjs` e `node src/scripts/check-mana.mjs` verdes; `npx astro build` com **exatamente 99** `<loc>` no sitemap (as URLs da Maná **não** entram aqui); `npx tsc --noEmit && npm test` verdes no `app`. **Prova negativa obrigatória**: `git diff --stat` não toca `pages/porcelanato/**`, `pages/fitas/**`, `api/pedidos/route.ts` nem `schema.prisma`

**Checkpoint**: o site no ar está idêntico. A unidade nova existe como dado, com trava. Nenhuma linha de dinheiro se moveu.

---

## Fase 2: O host e a vitrine (sem checkout)

**Purpose**: `mana.roilabs.com.br` no ar servindo `/mana/**` do **mesmo build**, com marca própria e arquivos de raiz próprios. Cadeira segue `publicada:false` ⇒ URLs em 200 e **sem caminho de compra**.

**Goal (US1)**: a vitrine existe e é indexável no host certo, sem que nenhuma venda possa acontecer ainda.

- [X] T012 [US1] Adicionar a prop opcional `siteBase` em `site-goiania/src/layouts/Base.astro` — usada por `canonical`, `og:url` e pelo nó `WebSite` do `@graph`; sem a prop, o comportamento é o de hoje (`Astro.site` = goiania). ~5 linhas, contra duplicar o layout inteiro (research.md D1)
- [X] T013 [P] [US1] Criar `site-goiania/src/components/HeaderMana.astro` e `FooterMana.astro` — marca da Maná (Instagram `instagram.com/manamodasocial`), **não** o header do porcelanato
- [X] T014 [P] [US1] Criar `site-goiania/src/components/SeletorVariacao.astro` — tamanho × cor **renderizado no HTML inicial** (não pode entrar no caminho do LCP; o JS só marca o que está esgotado). Invocar a skill `accessibility`: `role="radiogroup"` + `aria-labelledby`, navegação por setas, foco visível, estado esgotado **anunciado** (`aria-disabled` + texto associado), nunca só cor
- [X] T015 [US1] Alterar `site-goiania/src/components/AddToCart.astro` para aceitar o `sku` da variação. ⚠️ O carrinho **não muda de formato**: `{cadeira, itens:[{slug, quantidade}]}` continua igual — na Maná o `slug` é o `sku` (research.md D3)
- [X] T016 [US1] Criar `site-goiania/src/pages/mana/index.astro` — vitrine da Maná, design próprio, listando os produtos com `chamadaVitrine`
- [X] T017 [US1] Criar `site-goiania/src/pages/mana/[slug].astro` — página de produto com `getStaticPaths` do catálogo, `SeletorVariacao`, `AddToCart`, `copyComercial`, `specs`, imagens com `alt`, e `Base.astro` recebendo `siteBase` do host da Maná
- [X] T018 [P] [US1] Criar `site-goiania/src/pages/mana/sitemap.xml.ts` — **só** URLs da Maná, com o host `mana.roilabs.com.br`. Nenhuma URL de porcelanato pode vazar aqui
- [X] T019 [P] [US1] Criar `site-goiania/src/pages/mana/robots.txt.ts` e `site-goiania/src/pages/mana/llms.txt.ts` — o root do nginx é **compartilhado**, então estes arquivos precisam existir separados
- [X] T020 [US1] Alterar `site-goiania/nginx.conf`: (a) 2º `server{}` para `mana.roilabs.com.br` com `location = /sitemap.xml`, `= /robots.txt`, `= /llms.txt` apontando para as versões de `/mana/` e `error_page 404` próprio; (b) no server do goiania, `location /mana/ { return 301 https://mana.roilabs.com.br$request_uri; }` — sem isso o mesmo HTML responde 200 nos dois hosts (conteúdo duplicado auto-infligido); (c) `absolute_redirect off` (armadilha já registrada: URL sem barra devolvia 301 para `http://`)
- [X] T021 [US1] Criar o registro DNS de `mana.roilabs.com.br` no **Cloudflare antes do deploy** e confirmar com `dig +short mana.roilabs.com.br`. ⚠️ Cert emitido contra NXDOMAIN **não se re-emite sozinho** — a 012 já pagou essa conta. Feito pelo Jean no dashboard (registro inicial apontou pra Vercel por engano, corrigido para `2.24.207.200`); confirmado via 1.1.1.1 e 8.8.8.8
- [X] T022 [US1] Passar todo texto de interface da vitrine pela skill `ux-writing` — títulos, rótulos de variação, estado esgotado, estado vazio e CTA
- [X] T023 [US1] **Gate da Fase 2** (quickstart §Fase 2): TLS do host novo completa handshake **sem `-k`** (`-k` esconde exatamente o erro que se procura); `mana.roilabs.com.br/mana/<produto>/` em 200; `goiania.roilabs.com.br/mana/` em **301** com `location` para o host novo; `mana.roilabs.com.br/sitemap.xml` com **0** ocorrências de `porcelanato`; `canonical` apontando para o host da Maná; `goiania.roilabs.com.br/fitas/` ainda em 200. **E no browser, nos dois hosts**: marca própria e **nenhum botão de compra**
  - Verificado em produção 17/08 (PR #6 mesclada): TLS ok sem `-k`; produto em 200; 301 de `goiania.roilabs.com.br/mana/camisa-social-manga-longa/` → `https://mana.roilabs.com.br/mana/camisa-social-manga-longa/`; sitemap da Maná com 5 `<loc>` e 0 `porcelanato`; canonical correto; `goiania.roilabs.com.br/fitas/` 200 e sitemap do goiania com as 99 URLs intactas; 0 ocorrências de "Adicionar ao carrinho" no HTML da página de produto (botão de compra ausente enquanto `publicada:false`); `HeaderMana`/`FooterMana` presentes (marca própria)

**Checkpoint**: a loja é visível e não vendável. As 99 URLs do goiania seguem intactas.

---

## Fase 3: O estoque (a fase que impede vender o que não existe)

**Purpose**: Estado no banco, débito **condicional e atômico**, e a corrida da última unidade resolvida no Postgres — nunca na aplicação.

**Goal (US1)**: FR-003, FR-008 e FR-016. **Estoque é dinheiro: vender unidade inexistente cobra o comprador por nada.**

- [ ] T024 [US1] Alterar `app/prisma/schema.prisma`: model `EstoqueVariacao` conforme data-model.md §5 (`@@unique([cadeira, sku])`, `@@map("estoque_variacao")`, `quantidade Int @default(0)`) e a coluna `pagoEm DateTime? @map("pago_em")` em `Pedido`. ⚠️ `pagoEm` é **anulável de propósito e sem backfill** — pedido anterior à feature nasce `NULL` e a janela do CDC nunca abre para ele. `@default` não reescreve linha gravada
- [ ] T025 [US1] Rodar `npx prisma db push` **manualmente**, desta máquina, contra `2.24.207.200:5443/roilabs_db` (o runner standalone não aplica). Confirmar com `psql`: `\dt` traz `estoque_variacao` e `\d pedidos` traz `pago_em`. ⚠️ Conferir que não é o `:5445`
- [ ] T026 [P] [US1] Criar `app/src/lib/estoque.ts` — débito condicional: `updateMany({ where: { cadeira, sku, quantidade: { gte: n } }, data: { quantidade: { decrement: n } } })`, devolvendo `count === 1`. ⚠️ **A guarda de não-negativo É este `where`** — não simplificar para `decrement` solto (estoque vai a negativo em silêncio e retry do MP debita duas vezes) nem para `findUnique` + `if` + `update` (read-then-write é corrida entre os dois retries, que são o comportamento **normal** do gateway)
- [ ] T027 [P] [US1] Criar `app/src/lib/cors.ts` — allowlist com os 2 hosts, e **remover** o `SITE_ORIGIN` hard-coded hoje duplicado em `/api/cupom/validar` e `/api/frete/cotar`, consumindo a allowlist nas duas. ⚠️ **Nunca `*`**: posição de estoque e validação de cupom não são conteúdo público para qualquer origem. Origem fora da lista recebe resposta **sem** header de CORS. Expor também `originValido(origin): string | null` e usá-lo em `app/src/app/api/pedidos/route.ts` para `backTo()` e `backUrl`: hoje `origin` vem do **form do cliente** (`route.ts:35`) e só é checado com `startsWith('http')`, o que aceita qualquer host — é redirect aberto pós-checkout, já existente e que a 015 dobraria. Origem fora da allowlist cai no default **da cadeira**, não no `'https://goiania.roilabs.com.br'` hard-coded de `route.ts:25/254/294`, que para a Maná é o host errado
- [ ] T028 [US1] Criar `app/src/app/api/estoque/route.ts` — `GET ?cadeira=mana` devolvendo `{ ok:true, estoque:{ "<sku>": <qtd> } }`, com CORS pela allowlist. Sem preço, sem dado de comprador. SKU **sem linha** simplesmente não aparece
- [ ] T029 [US1] Fazer a vitrine ler `/api/estoque` no browser e marcar as variações esgotadas no `SeletorVariacao`. ⚠️ **Falha fechada**: SKU ausente é tratado como **esgotado**; endpoint fora do ar ⇒ vitrine não marca nada e **o servidor recusa no checkout**. Nenhuma decisão de estoque acontece no cliente
- [ ] T030 [US1] Alterar `app/src/app/api/pedidos/route.ts` para a unidade `peca`: preço e peso vindos de `precos-mana.ts`, `emailObrigatorio` da cadeira aplicado (FR-014), e recusa de SKU sem linha de estoque ou com quantidade 0. ⚠️ Esta recusa é **cortesia, não garantia** — entre o checkout e a aprovação passa tempo. Quem tratá-la como garantia vai desativar a única que existe
- [ ] T031 [US1] Alterar `app/src/app/api/pagamentos/webhook/route.ts` — passo ① do contrato: `$transaction(async tx => …)` **interativa** (o array não permite decidir com base em `count`), gravando `statusPagamento='pago'`, `mpPaymentId`, `pagoEm=now()`, o débito condicional de cada item de unidade `peca` e os snapshots de centro de custo já existentes. Qualquer `count === 0` ⇒ `throw` ⇒ **rollback de tudo**
- [ ] T032 [US1] Implementar os passos ②③④ **fora** da transação: pedido → `statusPagamento='reembolsado'` + `statusFulfillment='sem_estoque'`; depois `refund(paymentId, tokenDaContaQueCobrou)`; depois e-mail ao comprador + alerta interno. ⚠️ **③ nunca dentro de ①** (I/O externo em transação transforma timeout do gateway em lock no banco). Se ③ falhar, o pedido **já está marcado** por ② — dinheiro retido **com registro** nunca é o pior caso; "pago sem dinheiro" é
- [ ] T033 [P] [US1] Criar `app/scripts/seed-015-mana.mjs` com `--dry-run`, **idempotente por `siteUrl`** (nunca por rótulo). Nesta fase escreve só as linhas de `EstoqueVariacao` por SKU com a quantidade inicial. ⚠️ Um `update` parcial que não chega no banco deixa o default valendo **para sempre** — o `--dry-run` existe para conferir o que vai escrever
- [ ] T034 [P] [US1] Criar `app/scripts/verify-015-estoque.mjs` — para cada SKU: `estoqueInicial − Σ quantidade vendida em pedidos PAGOS == quantidade atual`; exit ≠ 0 em qualquer divergência, reportando qual dos 4 sintomas do contrato (atual maior ⇒ reposição não registrada; atual menor ⇒ débito duplo, investigar retry **antes** de repor; SKU sem linha; linha sem SKU)
- [ ] T035 [P] [US1] Criar `app/test/estoque-corrida.test.mjs` — (a) `count === 0` ⇒ rollback + `sem_estoque` + `refund` chamado **exatamente uma vez**; (b) **reentrada**: 2ª notificação do mesmo `paymentId` encontra o pedido já `pago` e **não debita de novo**
- [ ] T036 [US1] **Gate da Fase 3** (quickstart §Fase 3): `verify-015-estoque.mjs` fecha com exit 0; `estoque-corrida.test.mjs` verde; `/api/estoque` respondendo com o header de CORS do host da Maná e **sem** header para origem fora da allowlist; e o débito de um pedido de teste conferido **por `psql`** em `estoque_variacao` (quantidade caiu pelo exato vendido, `updated_at` no horário do pagamento). **Log dizendo que debitou não é prova**

**Checkpoint**: nenhuma venda real ainda — a cadeira continua despublicada. O que existe é a garantia de que ela não venderá o que não tem.

---

## Fase 4: O split (o caminho de dinheiro novo)

**Purpose**: A preference sai na conta MP da Maná com `marketplace_fee` de 10%, e o webhook resolve a credencial da conta certa **antes de tocar estado**.

**Goal (US1, US2, US3)**: FR-007 e FR-010 satisfeitos **por construção** — o líquido nunca chega a ficar com a ROI Labs. US3 começa aqui, não na Fase 7: a credencial do split é FK de `Parceiro`, então a cadeira precisa existir na carteira **antes** de qualquer cobrança.

- [ ] T037 [P] [US1] Criar `app/src/lib/comissao.ts` — função **pura**: `base = max(0, totalProduto − desconto)`, `fee = arredondar(base × comissaoPct, 2)`. ⚠️ **O frete fica fora** (é custo de transportadora, não venda — mesma base que `NegocioOriginado.valor = total − frete` já usa desde a 007). ⚠️ **Nunca somar os `unit_price` das linhas do MP** para achar a base: o rateio de desconto distribui centavos entre as linhas, e amarrar a comissão a um detalhe de apresentação do gateway é o defeito
- [ ] T038 [US1] Renomear `app/src/lib/frete-fitas.ts` → `app/src/lib/frete-cotacao.ts` e inverter a dependência: `cotarFrete` recebe a **carga já resolvida** em vez de derivá-la de `precos-fitas.ts`. Fita continua resolvendo por `cargaDoCarrinho`; a Maná resolve por `pesoKg` do SKU. ⚠️ **Peso vem sempre do catálogo, nunca do cliente** (FR-006 da 011: peso do browser é frete subestimado sob demanda). ⚠️ Marcar no código que `EST_BASE`, `EST_RS_POR_KG` e `bandaFrete` foram calibrados para **rolo de fita** — roupa é volume alto e peso baixo (peso cubado). Enquanto `MELHOR_ENVIO_TOKEN` não estiver publicado, a estimativa da Maná é **knob de operador não calibrado** e precisa ser conferida contra frete real antes da Fase 7. ⚠️ Atualizar os **3 importadores reais no mesmo commit**, senão `tsc` e `npm test` quebram e o gate de todas as fases seguintes fica vermelho: `app/src/app/api/pedidos/route.ts:8`, `app/src/app/api/frete/cotar/route.ts:2` e `app/test/frete-fitas.test.mjs:8` — este último renomeado para `app/test/frete-cotacao.test.mjs`
- [ ] T039 [US1] Alterar `app/src/lib/mercadopago.ts`: `getPayment(id, tokenOverride?)` e `refund(paymentId, tokenOverride?)` — mesmo padrão que `verifyWebhookSignature(opts, secretOverride)` já abriu na 012; e `createPreference` aceitando `marketplace_fee` e `notification_url` com `?cadeira=`. **Argumento omitido ⇒ `MERCADOPAGO_ACCESS_TOKEN` e comportamento idêntico ao de hoje**
- [ ] T040 [US1] Alterar `app/src/app/api/pedidos/route.ts` para cadeira com `split`: `resolverCredencial('mercadopago', parceiroId)` **antes** de qualquer chamada ao gateway; preference criada com `GATEWAY_TOKEN_MANA`, `marketplace_fee` de `lib/comissao.ts`, `notification_url` com `?cadeira=mana`. ⚠️ `null` ⇒ volta ao carrinho com `?erro=sem_cobranca` — **nunca** cai no token da ROI Labs por fallback: cobrar na conta errada é pior que não cobrar
- [ ] T041 [US1] Alterar o webhook para resolver a conta **antes** de validar: `cadeira = query.cadeira ?? null`; `null` ⇒ caminho de hoje **sem nenhuma diferença**; `loja.split == null` ⇒ 400; `cred == null` ⇒ 404 **sem ler o corpo**; então `verifyWebhookSignature(..., cred.segredo)` (passo 4) e só depois `getPayment(dataId, cred.token)` (passo 5). ⚠️ **`?cadeira=` é dado de quem chama, não é autoridade** — ele só escolhe qual segredo valida; a autoridade continua sendo a assinatura. Assinatura inválida ⇒ `warn` + 401
- [ ] T041a [US1] Executar o fluxo **OAuth do Mercado Pago** com a Maná: a conta MP dela autoriza a aplicação marketplace da ROI Labs, e a resposta devolve o `access_token` (→ `GATEWAY_TOKEN_MANA`) e o `user_id` (→ `CredencialGateway.contaRef`). ⚠️ É esta task que **produz** o valor que T042 publica — sem ela T042 não tem o que publicar. Anotar a data de emissão: o token expira em ~180 dias e, quando expirar, a cadeira **para de vender** (falha fechada, fácil de confundir com bug)
- [ ] T042 [US1] Publicar `GATEWAY_TOKEN_MANA` e `WEBHOOK_SECRET_MANA` na EasyPanel **antes** do deploy desta fase, e registrar a data de renovação do token OAuth (~180 dias) para o handoff. ⚠️ Constituição I — qualquer falha de checkout da Maná investiga-se **nesta ordem**: `GATEWAY_TOKEN_MANA` → `WEBHOOK_SECRET_MANA` → `MELHOR_ENVIO_*` → só então o código
- [ ] T042a [US3] Estender `app/scripts/seed-015-mana.mjs` para criar **agora** as linhas de que a credencial depende: `Cadeira` com `niche='Moda social masculina'`, **`siteUrl='https://mana.roilabs.com.br/'` (a CHAVE — nunca o rótulo)**, `repoUrl=null`, `daCasa=false`, `exibirDaCasa=false` e **`estado='ocupada-sem-produto'`** — um dos 4 estados que `app/src/lib/seats.ts:13` declara, e o único honesto enquanto a loja não vende; e `Parceiro` com `nome='Maná Moda Social Masculina'`, `estagio='ativa'`, `cadeiraId`, `comissaoAquisicao = comissaoRecorrencia = 0.10`. Idempotente **por `siteUrl`**. ⚠️ `daCasa:false` sem dúvida: a regra fail-closed do `seats.ts` existe porque `false` errado faz a ROI Labs cobrar fee de si mesma e **inflar** a receita da carteira — a Maná é terceiro real. ⚠️ **Sem estas duas linhas, `CredencialGateway.parceiroId` (T043) não tem FK e `resolverCredencial(gateway, parceiroId)` (T041) nunca resolve — a Fase 4 inteira não roda**
- [ ] T043 [US1] Estender `app/scripts/seed-015-mana.mjs` para gravar a `CredencialGateway` da Maná: `gateway='mercadopago'`, `contaRef=<user_id MP da Maná>`, `segredoRef='WEBHOOK_SECRET_MANA'` (token derivado por `nomeEnvToken` ⇒ `GATEWAY_TOKEN_MANA`). ⚠️ Guarda o **nome** da env var, **nunca o valor** do segredo
- [ ] T044 [P] [US1] Criar `app/test/comissao-flat.test.mjs` — base sem frete, arredondamento, desconto aplicado antes da alíquota, base negativa impossível
- [ ] T045 [P] [US1] Estender `app/test/mercadopago-assinatura-regressao.test.mjs` com o caso de **2 argumentos** (o teste de hoje cobre só a chamada de 1). Prova que porcelanato e fitas não mudaram de comportamento
- [ ] T046 [US1] Exibir `pagoA: 'Maná Moda'` na tela de checkout (o campo já existe desde a 013). Com split isso deixa de ser cortesia e vira **exato** — a fatura do cartão traz o nome da Maná. Passar a frase pela skill `ux-writing`: dizer quem cobra **sem** sugerir que a ROI Labs saiu da relação
- [ ] T047 [US1] **Gate da Fase 4** (quickstart §Fase 4): compra completa com **usuário de teste do MP** conferida nesta ordem — (a) painel do MP da Maná: aprovado com `marketplace_fee` = 10% do produto; (b) log do app; (c) `psql`: `status_pagamento='pago'` e `pago_em` preenchido; (d) `psql`: `estoque_variacao` debitado; (e) e-mail de confirmação com itens e valor certos. **Não-regressão obrigatória**: repetir uma compra até a tela do MP em fitas e em porcelanato, **sem pagar**, conferindo que a preference sai na conta da ROI Labs e que a `notification_url` **não** tem `?cadeira=`. **Caminho recusado/pendente (FR-015), obrigatório**: pagar com cartão de teste de **recusa** do MP e conferir que (a) o pedido fica `pendente`, (b) o comprador é avisado na hora, (c) o carrinho **sobrevive** e a 2ª tentativa funciona. ⚠️ O research declara isto "satisfeito por construção" (`clearCart` nunca é chamado), mas nunca foi exercitado com preference de **outra conta** — e a Constituição II não aceita "por construção" como evidência. ⛔ **Cartão real segue vetado (07/08)** — sandbox prova a **fiação**, não prova que dinheiro real chega

**Checkpoint**: o caminho de dinheiro está fiado e testado até onde o veto permite. **Sandbox verde não autoriza nenhuma afirmação de receita** — essa frase precisa sobreviver ao handoff.

---

## Fase 5: O painel do parceiro

**Purpose**: A Maná confere sozinha o que vendeu, quanto foi retido e quanto ficou. Segunda autenticação no `/app`, com superfície mínima e escopo **sempre** da sessão.

**Goal (US2)**: FR-009 e SC-003.

- [ ] T048 [US2] Adicionar `senhaHash String? @map("senha_hash")` ao model `Parceiro` em `app/prisma/schema.prisma` e rodar `npx prisma db push` **manual**. `NULL` ⇒ o parceiro não faz login — é o estado de todos, menos a Maná
- [ ] T049 [P] [US2] Adicionar em `app/src/lib/auth.ts` (arquivo que já tem `checkPassword`) o hash e a verificação de senha de parceiro: `scrypt` de `node:crypto`, formato `scrypt$<salt-b64>$<hash-b64>`, comparação com `timingSafeEqual`. **Sem dependência nova** (não bcrypt). ⚠️ Senha de terceiro **nunca** em texto — o `ADMIN_PASSWORD` em texto é o padrão do login interno único e **não se estende** a parceiro
- [ ] T050 [US2] Adicionar em `app/src/lib/session.ts` a sessão de parceiro: cookie **`roilabs_parceiro`** (separado do `roilabs_admin`), payload assinado `exp.parceiroId`, TTL 7 dias, e `verifySessionParceiro()` devolvendo `parceiroId | null`. ⚠️ Cookie novo em vez de estender o payload do existente: mudar o formato invalidaria as sessões de admin vigentes e misturaria dois níveis de confiança na mesma verificação. **Sessão de parceiro não satisfaz `isAuthed()`; sessão de admin não abre `/parceiro`**
- [ ] T051 [US2] Criar `app/src/app/api/parceiro/login/route.ts` — resposta **genérica sempre** (nunca "senha errada" vs "parceiro inexistente") e log em `warn` a cada falha, para que tentativa em massa apareça. ⚠️ O repo não tem rate limit hoje: registrado como **lacuna consciente**, não como resolvido
- [ ] T052 [US2] Criar `app/src/app/api/parceiro/resumo/route.ts` — `GET ?de=&ate=` (default: mês corrente), escopo `parceiroId` **da sessão**. Apuração de contracts/painel-parceiro.md §3: elegíveis são `vertical=<cadeira>` + `statusPagamento='pago'` + `pagoEm` no período; `vendido = Σ (total − frete)`; `comissaoRetida = Σ arredondar(produtoDoPedido × pct, 2)` — ⚠️ **arredondar por pedido ANTES de somar**, senão a linha do detalhe não fecha com o total; `liquido = vendido − comissaoRetida`. ⚠️ **`parceiroId` nunca vem de query nem de body** — `?parceiroId=` seria IDOR. ⚠️ Pedido `reembolsado` fica de fora, inclusive o `sem_estoque` da corrida perdida: nunca foi venda
- [ ] T053 [US2] Criar `app/src/app/parceiro/login/page.tsx` e `app/src/app/parceiro/page.tsx` — vendido, comissão retida, líquido e a lista de pedidos do período. Passar por `accessibility` e `ux-writing`. **A tela diz explicitamente**, porque com split é a verdade e omitir seria enganoso: *"O valor líquido já foi creditado na sua conta Mercado Pago no momento de cada pagamento. Este painel é a conferência, não uma promessa de repasse futuro."* Uma tela que falasse em "a receber" descreveria um processo que não existe
- [ ] T054 [P] [US2] Criar `app/test/sessao-parceiro.test.mjs` — **os dois sentidos** (um teste só cobre metade do buraco): sessão de A com `?parceiroId=B` devolve os dados de **A**; cookie de parceiro em `/admin` ⇒ 401; cookie de admin em `/parceiro` ⇒ 401. Mais a aritmética: arredondamento por pedido, `reembolsado` fora, frete fora da base
- [ ] T055 [US2] Estender `app/scripts/seed-015-mana.mjs` para gravar `senhaHash` da Maná. ⚠️ O `Parceiro` **já existe desde T042a** (Fase 4) — isto é `update` da linha encontrada por `siteUrl`, nunca `upsert` cego que criaria uma segunda. As comissões (`0.10`/`0.10`) também já foram gravadas em T042a: não porque a régua da 010 seja usada aqui (com split ela não é), mas para que qualquer repasse manual criado por engano no `/admin` cobre os mesmos 10% em vez de recusar por "parceiro sem taxas"
- [ ] T056 [US2] **Gate da Fase 5** (quickstart §Fase 5): `sessao-parceiro.test.mjs` verde **e** o total do painel conferido contra o `SELECT` no Postgres de produção, **centavo a centavo**. ⚠️ SC-003 só fecha quando **a Maná** entra e confere sozinha — tela em 200 não é isso

**Checkpoint**: o parceiro tem número próprio e conferível. Nenhum caminho lê escopo de fora da sessão.

---

## Fase 6: Pós-venda

**Purpose**: FR-011 — o comprador **abre** a solicitação; o operador **executa**. Logística reversa é física e nenhum código a resolve sozinho.

**Goal (US1)**: janela de 7 dias do CDC validada **no servidor**, escolha reembolso/troca registrada na abertura.

- [ ] T057 [US1] Adicionar o model `SolicitacaoPosVenda` a `app/prisma/schema.prisma` conforme data-model.md §6 (`@@index([pedidoId])`, `@@index([estado])`, `@@map("solicitacoes_pos_venda")`, `onDelete: Cascade`) e rodar `npx prisma db push` **manual**
- [ ] T058 [P] [US1] Criar `app/src/lib/pos-venda.ts` — função **pura** da janela de 7 dias a partir de `Pedido.pagoEm`. ⚠️ `pagoEm` NULL (pedido anterior à feature) ⇒ a janela **nunca abre**: comportamento correto e explícito. ⚠️ `updatedAt` **não** serve como marco — qualquer atualização posterior o move e a janela passaria a contar de um evento que não é o pagamento
- [ ] T059 [US1] Criar `app/src/app/api/pos-venda/route.ts` com as invariantes de servidor de data-model.md §6: `resultado='troca'` ⇒ `skuDesejado` presente, existente no catálogo da cadeira e com estoque > 0; `resultado='reembolso'` ⇒ `skuDesejado` nulo; sempre ⇒ `statusPagamento='pago'` e `pagoEm` dentro da janela. ⚠️ **A troca não reserva estoque na abertura** — coerente com FR-016; a disponibilidade é conferida de novo quando o operador aprova
- [ ] T060 [P] [US1] Criar `site-goiania/src/pages/mana/trocas.astro` — abertura da solicitação, com a escolha reembolso × troca feita **no ato** (fechado no clarify). Texto por `ux-writing`, formulário por `accessibility`
- [ ] T061 [US1] Adicionar a fila de solicitações ao `/admin` (filtro por `estado`), com as transições `aberta → aprovada → concluida` e `aberta → recusada`. ⚠️ **Nada nesta máquina estorna dinheiro sozinho** — o único refund automático do sistema é o da corrida (Fase 3). ⚠️ Devolução aprovada **não repõe estoque**: o operador repõe quando a peça volta e é conferida; repor na aprovação criaria estoque que não existe fisicamente. Toda reposição registra `sku`, delta e quem pediu
- [ ] T062 [P] [US1] Criar `app/test/pos-venda-janela.test.mjs` — pago há 3 dias aceita; há 8 dias recusa; `pagoEm` NULL recusa; troca sem `skuDesejado` recusa; troca com SKU esgotado recusa
- [ ] T063 [US1] **Gate da Fase 6** (quickstart §Fase 6): os 5 casos conferidos **no browser em produção** e a linha em `solicitacoes_pos_venda` conferida no banco com `resultado` e `estado='aberta'`, aparecendo na fila do `/admin`

**Checkpoint**: o comprador tem saída self-service dentro do CDC, sem que nenhum estorno automático novo tenha sido criado.

---

## Fase 7: Publicar

**Purpose**: A cadeira sai de `publicada:false` e passa a existir como parceira ativa na carteira.

**Goal (US3)**: FR-012 e SC-005.

- [ ] T064 [US3] Conferir o knob de frete de T038 contra uma cotação real da Melhor Envio para uma caixa de camisa **antes** de publicar — estimativa calibrada para rolo de fita subestima roupa (peso cubado)
- [ ] T065 [US3] Trocar `publicada` para `true` **nos DOIS espelhos** (`site-goiania/src/data/lojas.ts` e `app/src/lib/lojas.ts`) e rodar `check-lojas` + `check-mana` + `npx astro build`
- [ ] T066 [US3] Virar o estado da cadeira criada em T042a de `ocupada-sem-produto` para **`estado='ocupada-vendavel'`** via `seed-015-mana.mjs`, com a mesma idempotência **por `siteUrl`**. ⚠️ Nenhuma linha nova é criada aqui — a carteira já conhece a Maná desde a Fase 4 (data-model.md §10); o que muda nesta task é **só a vendabilidade**
- [ ] T067 [US3] Submeter o sitemap da Maná e conferir no GSC que o Google **baixou** (`lastDownloaded` recente, `errors: 0`). ⚠️ **200 no sitemap não é prova de nada** — o Google não rebaixa cópia velha sozinho; se não baixar, submeter por `PUT` na API. Já custou 1/4 de um site nesta casa
- [ ] T068 [US3] **Gate da Fase 7 / SC-005** (quickstart §Fase 7): `psql` mostrando `ocupada-vendavel · https://mana.roilabs.com.br/ · da_casa = false`; `mana.roilabs.com.br` público no browser; a cadeira aparecendo como ocupada na carteira com 10%

**Checkpoint**: a cadeira está ocupada, pública e vendável.

---

## Fase 8: Fechamento

**Purpose**: Provar que a 015 **não moveu dinheiro das outras duas cadeiras** e fechar a entrega como a Constituição V exige.

- [ ] T069 [INFRA] Rodar o baseline do quickstart §0 de novo (`pedidos` por vertical) e conferir que os números de **porcelanato e fitas** estão **iguais** aos do passo 0. Ler o baseline do banco **na hora** — nunca de um arquivo de handoff
- [ ] T070 [INFRA] Rodar `verify-015-estoque.mjs` uma última vez e guardar o output ao lado do da Fase 3. ⚠️ Comparar a migração contra ela mesma é a armadilha que a 013 já registrou
- [ ] T071 [INFRA] Percorrer o **checklist de fechamento** do quickstart inteiro (9 itens), sem pular nenhum
- [ ] T072 [INFRA] Escrever `specs/015-ecommerce-mana-moda/handoff.md` co-localizado, registrando com todas as letras: 🚩 **sandbox verde ≠ receita provada**; a data de renovação do token OAuth do MP (~180 dias); o knob de frete não calibrado para roupa; a lacuna de rate limit no login do parceiro; e o que **não** foi feito (limpeza da Fase 5 da 013, migração de domínio da 012 US4, troca automática, logística reversa)
- [ ] T073 [INFRA] Commit + **push** (Constituição V). ⚠️ `push` em `main` é deploy — merge do branch só depois de o gate da fase correspondente estar verde

---

## Dependencies & Execution Order

### Dependências entre fases

As 7 fases são **sequenciais por construção** — cada uma existe para que a seguinte não possa cobrar errado:

- **Fase 1** (dado) → sem dependência. Nada no ar muda
- **Fase 2** (host) depende de 1 — as páginas leem `mana.ts`
- **Fase 3** (estoque) depende de 1. Independente de 2 no código, mas o plano a coloca depois porque a vitrine precisa existir para marcar esgotado
- **Fase 4** (split) **depende de 3 estar verde** — dinheiro entrando sem estoque garantido é exatamente o defeito que a feature existe para evitar
- **Fase 5** (painel) depende de 3 (`pagoEm`) e de 4 (a comissão que o painel apura)
- **Fase 6** (pós-venda) depende de 3 (`pagoEm`) e do catálogo/estoque para validar a troca
- **Fase 7** (publicar) depende de **todas** — é o único ponto em que uma venda real fica possível
- **Fase 8** (fechamento) depende de 7

### Dependências internas relevantes

- T007 depende de T006 · T011 depende de T001–T010
- T017 depende de T012, T014, T015 · T023 depende de T020 **e** de T021 (DNS **antes** do cert)
- T026, T028, T031 dependem de T024+T025 (schema aplicado)
- T031/T032 dependem de T026 · T036 depende de T033+T034
- T039 é pré-requisito de T040 e T041 · T040 depende de T037 e T038
- **Cadeia obrigatória da Fase 4**: T041a (OAuth **produz** o token) → T042 (publica as envs) → T042a (cria `Cadeira`+`Parceiro`) → T043 (`CredencialGateway` referencia o `parceiroId`) → T040/T041 (resolvem a credencial). Inverter qualquer par aqui é FK inexistente ou env vazia
- T047 depende de T042 (envs publicadas **antes** do deploy)
- T050 é pré-requisito de T051, T052, T053 · T052 depende de T037
- T059 depende de T057+T058 · T061 depende de T059
- T065 depende de T064 · T066 depende de T042a (a linha que ele atualiza nasce lá) · T068 depende de T066

### Paralelismo real

- **Fase 1**: T002 ∥ T003 ∥ T006 ∥ T008 ∥ T009 ∥ T010 (arquivos distintos)
- **Fase 2**: T013 ∥ T014 ∥ T018 ∥ T019
- **Fase 3**: T026 ∥ T027 ∥ T033 ∥ T034 ∥ T035
- **Fase 4**: T037 ∥ T044 ∥ T045
- **Fase 5**: T049 ∥ T054
- **Fase 6**: T058 ∥ T060 ∥ T062

⚠️ **Os gates de fim de fase (T011, T023, T036, T047, T056, T063, T068) nunca são paralelos.** Eles são o ponto em que a fase é declarada verdadeira.

---

## Implementation Strategy

### MVP (US1 — a compra ponta a ponta)

Fases 1 → 2 → 3 → 4 → 7. Ao fim disso a Maná vende, com estoque garantido e comissão retida no ato. **Pare e valide no gate de cada fase** — nenhuma delas pode ser "quase verde".

### Incremento seguinte

Fase 5 (US2 — o parceiro confia no número) e Fase 6 (pós-venda). Cada uma é deployável e reversível sozinha.

### US3

US3 é **pré-requisito, não desfecho** — como a spec descreve ao marcá-la P3 "não bloqueia a compra, pode ser feito com um cadastro mínimo antes do catálogo completo existir". O cadastro na carteira acontece em T042a (Fase 4), com `estado='ocupada-sem-produto'`; a Fase 7 só vira o estado para `ocupada-vendavel`.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência. `[Story]` mapeia a task para US1/US2/US3/INFRA
- Commit por task ou grupo lógico; **push só depois do gate da fase**
- ⚠️ **Nenhuma task fecha com "compilou"** — build local não prova nada neste stack (OneDrive corrompe `node_modules`, errno -4094)
- ⚠️ `prisma db push` aparece **3 vezes** (T025, T048, T057), sempre manual e sempre desta máquina. É deliberado: cada fase carrega só o schema que ela precisa, para poder ser revertida sozinha
- ⚠️ Toda tela nova passa por `accessibility`; todo texto de interface por `ux-writing`. **Obrigatório no `implement`**, não opcional (Constituição IV)
- 🚩 A afirmação que precisa sobreviver a esta feature inteira: **sandbox verde prova a fiação, não prova que dinheiro real chega.**
