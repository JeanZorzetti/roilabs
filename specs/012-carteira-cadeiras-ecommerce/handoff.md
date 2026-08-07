# Handoff — 012 carteira de cadeiras no e-commerce

**Data**: 2026-08-07 (2ª sessão) · **Status**: **65 de 83 tasks entregues**, `npm test` 17/17.
18 em aberto — nenhuma por falta de implementação; todas por falta de acesso (produção do
parceiro, roihub) ou de decisão do Jean.

---

# ✅ A migração RODOU — produção está de pé

**`prisma db push` aplicado em `2.24.207.200:5443` em 07/08.** Output completo, com o SQL
lido antes e a verificação depois: [snapshots/db-push-012.txt](./snapshots/db-push-012.txt).
Fecha **T003a, T008, T009, T011, T072a**.

Conferido em produção, não no build local:

| rota | antes | agora |
|---|---|---|
| `GET /api/cadeiras` | 500 | **200**, 4487 bytes, sem vazar `daCasa` |
| `GET /api/negocios` | 500 | **401** (auth) |
| `POST /api/pagamentos/webhook` | OK | **405** no GET — intocado, segue faturando |

**Três coisas que a migração ensinou e a spec não sabia:**

1. **`negocios_originados` está VAZIA em produção.** Os 6 pedidos existentes nunca originaram
   negócio. O portão do T011 passou por **vacuidade**, não por medição — e o defeito do
   `include: { pedido }` não tinha linha antiga para derrubar. O lado ruim é o que importa:
   **a régua do success fee nunca foi exercida contra dado real.** A T036 é a primeira vez.
2. **O `db push` exigiu `--accept-data-loss`,** e o aviso é vazio por construção: o único item
   é o `@unique` em `cadeiras.site_url`, coluna criada **no mesmo diff**, logo nula em toda
   linha — e índice único no Postgres admite N nulos. Ler a **lista** de avisos, não o flag:
   se aparecer qualquer segunda linha, ela não é vazia e o `db push` não deve ir.
3. **O diff real trouxe um `DropForeignKey` que o `delta-012.sql` offline não tinha.** Não é
   perda de dado: é a FK de `pedido_id` sendo recriada com `ON DELETE SET NULL` porque a
   coluna virou anulável. Confirma por que o passo do preview contra o **datasource** é
   obrigatório mesmo com o SQL previsto offline.

⚠️ **SC-003 fechou sobre a migração, não sobre a feature.** O `sc003-depois.json` foi tirado
logo após o `db push`, com zero negócio no banco. **Reexportar o `depois` e rediffar depois da
T036** — só aí ele cobre a primeira venda de webhook.

---

# Regras de trabalho desta feature

1. **Push direto em `main`, sempre.** Sem branch, sem PR. O EasyPanel deploya por push, então
   **todo push é um deploy** — a consequência é o bloco acima, não uma abstração.
2. **Terminar as tasks restantes**, na ordem de `tasks.md`. Marcar `[X]` só o que estiver
   *feito*, nunca o que estiver *escrito*.
3. **Constituição II vale.** `npm test` verde e `tsc --noEmit` limpo **não são** verificação.
   "Pronto" exige Docker/EasyPanel ou browser em produção, com output anexado.
4. **Teste novo TEM de entrar na lista de `test` do `app/package.json` à mão.** O script é
   cadeia de `&&`; teste fora da lista nunca roda e não reprova nada. Conferir a **lista**,
   não o output — o primeiro erro interrompe a cadeia, então "não apareceu" pode ser ausência
   **ou** interrupção.

---

# As 18 tasks restantes

## A. ~~Destravadas pelo `db push`~~ — FEITAS em 07/08

`T003a · T008 · T009 · T011 · T072a`. Ver o bloco acima.

## B. Ligar a primeira cadeira — é onde `SC-001` sai de R$ 0,00

**T033 · T034 · T035(feita) · T036 · T037.** Comece pelo Mercado Pago: ele cobre 4 das 7.

1. **T033** — criar a `CredencialGateway` e publicar as DUAS envs na EasyPanel:
   - `WEBHOOK_SECRET_MERCADOPAGO_<PARCEIRO>` — segredo de assinatura (painel MP → Webhooks)
   - `GATEWAY_TOKEN_MERCADOPAGO_<PARCEIRO>` — access token **da conta do parceiro**
   - No banco, `segredoRef` guarda o **NOME** da primeira env, nunca o valor. O nome da
     segunda **deriva** da primeira (`WEBHOOK_SECRET_` → `GATEWAY_TOKEN_`), ver
     `lib/carteira/credenciais.ts`.
   - `contaRef` = o `collector_id` do MP (ou `acct_…` do Stripe). É contra ele que o passo 4
     do contrato confere o pagamento.
2. **T034** — apontar o webhook no painel do parceiro para
   `https://app.roilabs.com.br/api/carteira/webhook/mercadopago/<parceiroId>`
3. **T036** — **compra real, cartão real, em produção.** Conferir `VendaParceiro` +
   `NegocioOriginado` + `taxaAplicada`. ⚠️ **Payer de teste não vale**: `approved` +
   `live_mode: true` com payer `…@testuser.com` é gravado com `motivoDescarte='payer-teste'`
   e **não conta receita** — é exatamente o caso dos 20 pagamentos de R$ 940 da Atma.
4. **T037** — reenviar o mesmo evento pelo painel e provar que produz **um** negócio (`SC-007`).

**T035 já está feita**: o 401 dispara `sendAlert` além do `log.warn`, com dedupe de 1h por
parceiro. Confirme só que `ALERT_EMAIL`/`RESEND_API_KEY` estão publicados, senão o alerta
vira no-op silencioso — e ele é o **único** sinal de segredo derivado do painel.

## C. Conteúdo das páginas de cadeira (T048 · T049 · T050)

**Bloqueadas por conteúdo, não por código.** Prontos e testados: o template
`site-goiania/src/pages/cadeira/[slug].astro`, o `Product`/`Offer` + `FAQPage` no `@graph`
único, o portão de FR-009 no sitemap, e o verificador do piso.

Para publicar uma cadeira, acrescente um objeto em `site-goiania/src/data/cadeiras.ts`. O
verificador roda no `postbuild` e **quebra o build** se a página estiver fina:

```bash
cd site-goiania
npm run build            # o check-cadeiras roda no postbuild
npm run check-cadeiras   # ou avulso, contra dist/
node src/scripts/check-cadeiras.mjs --self-test
```

Piso de FR-014: **≥800 palavras no HTML inicial · preço explícito no corpo · ≥6 FAQ ·
`Product`/`Offer` com preço**.

⚠️ **Conteúdo antes de quantidade.** 86% do tráfego da Atma vem de UMA página que responde
uma pergunta de preço inteira, e esforço por artigo não prediz nada (o vencedor é o 6º maior
de 22). **7 páginas finas é o resultado a evitar** — publique uma boa antes de replicar.

⚠️ **Risco de canibalização não resolvido:** a Atma já tem página de preço própria
ranqueando com 189 queries na pág. 1. Uma página de cadeira para o mesmo produto no
e-commerce compete com ela. Decidir antes de escrever a da `atma`.

## D. Corte de domínio (T058 · T059 · T061 · T062 · T063 · T064 · T065)

**Por último, de propósito** — é a única fase que pode destruir ativo, e **não bloqueia
receita nenhuma**. Depende da decisão do label (ver "Decisões pendentes").

**T060 está feita.** O mapa saiu do `dist/` que o site serve, não de lista à mão:
[snapshots/mapa-301.txt](./snapshots/mapa-301.txt) e
[snapshots/301-corte-dominio.conf](./snapshots/301-corte-dominio.conf). Regerar com:

```bash
cd site-goiania && npm run build && node src/scripts/mapa-301.mjs [novo-host]
```

⚠️ **A estimativa da spec está velha por ~2×.** Ela diz "41 pSEO + 5 guias" = 46 URLs. O site
serve **104**: os 41 slugs viram 71 URLs por causa dos combos da spec 008, e há 13 guias, não
5. **Um mapa feito pela contagem da spec deixaria ~58 URLs em 404.**

Ordem obrigatória, sem atalho: cert e handshake verificados **sem `curl -k`** → 301 de toda
URL → sitemap submetido com o **CORPO** validado (`<?xml`, nunca o status 200) → conferir em
D+30. O script já recusa label de segundo nível (o cert Universal cobre apex + **um** label).

## E. As 27 restantes (T066 · T067) e a régua (T071)

**A lista dos 35 projetos vive no `roihub`, que não é este repositório.** Inventar slug ou
URL para "completar 35" fabricaria a carteira — e a chave é a **URL do site**, não o repo.

Para fazer: exportar a lista do roihub (`roihub/scripts/gateways.mjs` lê o GitHub) e
acrescentar em `PROJETOS_CADEIRA` de `app/src/lib/seats.ts`, com `estado: 'em-preparacao'`,
`siteUrl` e `repoUrl` reais. `orcaobra` **já está lá**.

⚠️ **T069 — ao apurar estado por HTTP, `tapevision`, `potencialarquitetado` e `pathfinder`
servem TUDO em 200** (shell de SPA). Ler "200" como caminho de cobrança produz
`ocupada-vendavel` falsa. A lista está em `HOSTS_SPA_TUDO_200` no mesmo arquivo.

**T071** (`SC-002`) roda no roihub. ⚠️ O critério é **o balde correto para o modo de
cobrança**, não "ligado" para todas: cadeira SaaS com checkout no parceiro sai como
**"gateway servido"**, não "ligado".

## F. Verificação final (T072)

Docker/EasyPanel ou browser em produção, output anexado. Build local não vale.

---

# 🚩 Decisões pendentes do Jean (travam tasks)

1. **`daCasa` de `vertice` e `orcaobra`.** A spec diz explicitamente que a curadoria "não
   está apurada" (é a T052). Semeei **fail-closed** (`daCasa: true`) — errado para `false`
   faz a ROI Labs cobrar success fee de si mesma e **inflar** a receita da carteira, que é o
   defeito que FR-010 proíbe; errado para `true` só sub-reporta, e isso é recuperável.
   - Da FR-010a, sem dúvida: `sirius`, `meridian`, `orion` → `daCasa` **e** `exibirDaCasa`.
   - Inferidos de serem produto da casa: `polarisia`, `estetiacrm`, `context`.
   - `false` por serem parceiro externo documentado: `atma`, Fitas adesivas (Tapepro).
   - **Confirmar:** `vertice` e `orcaobra` — são os que não derivei de nada escrito.
2. **Label do subdomínio (T058).** Assumido `loja.roilabs.com.br`. Trava T059 e T061–T065.
   Um label só: o cert Universal da Cloudflare cobre apex + **um** nível.

---

# Mapa do que foi construído

```text
app/src/lib/carteira/
├── webhook.ts            # a ORDEM do contrato; deps injetáveis p/ o teste observar escritas
├── registrar-venda.ts    # passos 4-6: conferir conta → gravar → originar negócio
├── credenciais.ts        # resolve (gateway, parceiro); segredo vem da ENV, nunca do banco
├── classificar-venda.ts  # ENVELOPE da regra da 010, não uma segunda regra
├── origem-negocio.ts     # a invariante que o Prisma não declara (CHECK constraint)
├── produto.ts            # decisão de checkout, FR-008/009/010a
├── agregados.ts          # receitaDaCarteira() — FR-010; reposDuplicados() — FR-011
└── adaptadores/
    ├── index.ts          # contrato + lookup por gateway
    ├── mercadopago.ts    # atma, polarisia, estetiacrm, vertice
    └── stripe.ts         # sirius, context, orion

app/src/app/api/carteira/webhook/[gateway]/[parceiroId]/route.ts   # 3 linhas, chama webhook.ts
app/scripts/{snapshot-012-sc003,migrate-012-backfill}.mjs
site-goiania/src/{data/cadeiras.ts, pages/cadeira/[slug].astro, scripts/{check-cadeiras,mapa-301}.mjs}
```

**7 arquivos de teste novos, todos na lista do `package.json`** (17/17 verdes):
`negocio-origem` · `registrar-venda` · `webhook-carteira` · `mercadopago-assinatura-regressao`
· `cadeira-checkout` · `agregado-sem-casa` · `cadeira-repo-unico`.

---

# O que a implementação descobriu (não estava na spec)

### 1. `pedidoId` anulável causa DOIS defeitos, e o pior é crash

A spec antecipou o filtro silencioso (`where: { pedidoId }` deixando de cobrir venda de
webhook). Ele existe, e é o **menor** dos dois.

⚠️ **`include: { pedido }` numa relação que virou opcional devolve `null`.** Todo
`n.pedido.statusPagamento` do código existente vira **`TypeError` em runtime** na primeira
venda de webhook — e uma das cinco ocorrências é a **geração de fatura**.

Varredura completa, com arquivo:linha e a classe de cada uma:
[varredura-pedidoid.md](./varredura-pedidoid.md). **7 ocorrências: 5 de crash, 1 silenciosa,
1 correta como estava.** Todas corrigidas.

Num caso `?.` sozinho estaria **errado**: em `api/negocios/route.ts` a lista de anteriores
decide aquisição × recorrência, e uma venda de gateway **reembolsada** continuaria consumindo
a aquisição — o cliente seguinte cairia em recorrência (10%) quando devia ser aquisição
(15%). Reembolso de webhook mora em `VendaParceiro.status`, não em `Pedido`; as duas fontes
agora são lidas.

### 2. O `data-model.md` modela o segredo, mas não o token de leitura

O passo 3 manda consultar o gateway, mas o pagamento está na conta **do parceiro** e o token
global da ROI Labs não o enxerga. Resolvido **por convenção, sem coluna nova**:
`WEBHOOK_SECRET_<G>_<P>` → `GATEWAY_TOKEN_<G>_<P>`. Coluna custaria um **segundo `db push`
manual**, que é o que a decisão de "um `db push` só" existe para evitar. Teto registrado em
`credenciais.ts`: par fora do padrão vira coluna `tokenRef`.

### 3. `/api/cadeiras` devolvia a linha CRUA — ia vazar `daCasa`

A rota fazia `findMany` e devolvia o objeto inteiro; com as colunas da 012 ela passaria a
publicar `daCasa`, a marcação **interna** que FR-010a existe para esconder. A projeção agora
é campo a campo e só sai `rotulo` (a exibição já resolvida). **Coluna nova não entra ali
sozinha.**

### 4. Reembolso precisava de propagação, senão o demonstrativo lia código morto

O estorno chega como **outro** evento com o mesmo `pagamentoId`. Sem propagar o status para a
venda original, `VendaParceiro.status` ficaria eternamente `'aprovada'`.

---

# Decisões de implementação que valem revisão

| decisão | por quê |
|---|---|
| **Cadeira da casa NÃO cria `NegocioOriginado`** (em vez de criar com `faturavel=false`) | `NegocioOriginado` é o livro do success fee. Sem linha, FR-010 vale por **construção**, não por uma flag que alguém inverte. A venda **é** gravada — receita direta, auditável. |
| **Sem o SDK `stripe`** (a T003 pedia adicionar) | O repo já decidiu isso: `lib/mercadopago.ts` diz *"no SDK dependency"* e `mercadopago` também não está no `package.json`. Assinatura = 15 linhas de `crypto`, consulta = um `GET`. Adicionar contraria a Constituição III **e** exigiria `npm install` num diretório do OneDrive que corrompe `node_modules`. |
| **Adaptador MP faz o próprio `fetch`** em vez de generalizar `getPayment` | Seria um **segundo** toque no arquivo que `/api/pagamentos/webhook` usa. Raio de alcance menor vale a duplicação de um `fetch`. |
| **`eventoId` do MP derivado de `(pagamento, status)`** | O MP manda notificação sem corpo em algumas integrações; id instável quebraria a idempotência. Retry do mesmo estado colide (200); **mudança** de estado grava linha nova — que é o que o estorno precisa. O Stripe usa o `evt_` real, estável. |
| **`processarWebhook` recebe deps** | O contrato exige provar "401 **e nenhuma linha gravada**", e isso só se prova se o teste puder **observar** as escritas. Dois chamadores reais, não abstração especulativa. |
| **Alerta do 401 com dedupe de 1h** | Sem ele, gateway em loop vira milhares de e-mails e o alerta que importa se perde. Teto: por instância. |

---

# Gotchas que já estão embutidos (não redescobrir)

- **`approved` + `live_mode` NÃO é venda.** Só o payer separa teste de receita. Receita
  provada da carteira hoje: **R$ 0,00**, e continua até a T036.
- **Idempotência mora no BANCO** (`@@unique([gateway, eventoId])`), não num `if`: dois
  retries simultâneos são o comportamento **normal** dos gateways.
- **200 para evento irrelevante é deliberado** — erro faria o gateway reenviar para sempre.
  Só `5xx` pede retry, e só para falha de consulta.
- **Retry de evento divergente devolve 200, não 409** — a colisão da `@@unique` encerra antes,
  e o 409 da primeira entrega já pediu apuração humana.
- **Contar palavra com `sed 's/<script[^>]*>.*<\/script>//g'` mede o `sed`**: em HTML
  minificado o `.*` guloso devolve 0 palavra numa página com `<h1>`. O `--self-test` do
  `check-cadeiras` tem exatamente esse caso.
- **Sitemap em 200 não prova deploy** — validar o corpo (`<?xml`), nunca o status.
- **`curl -k` esconde erro de cert**: 200 no terminal, "Failed to fetch" no browser.
- **`goiania` e `roilabs` são o mesmo repo** — card ≠ repositório; somar os dois infla a
  carteira. Por isso FR-011 é **teste**, não `@@unique`.
- **Dois "8" diferentes**: `seats.ts` tem 8 cadeiras de **nicho**; a fase 1 tem 7 **projetos**.
  Sempre dizer qual.
- **Ligar cobrança não cria demanda.** Para as cadeiras sem busca, o resultado esperado é
  conversão do tráfego existente, nunca crescimento.

---

# Contexto original da spec (07/08, antes do código)

## Decisões do Jean — não reabrir

1. Cada cadeira ganha **página de produto + preço + checkout**. Não é vitrine com link de saída.
2. **Fase 1 = só quem tem produto vendável**; os 35 entram no fim, um a um. O modelo de dados
   já nasce comportando os 35.
3. Pagamento **depende do tipo de cadeira**: físico → carrinho da ROI Labs; SaaS → gateway do
   parceiro.
4. Cadeira da casa: marcada **sempre** no dado, sem fee de si mesma. No site público exibida
   como parceiro, **exceto `sirius`, `meridian` e `orion`**.
5. E-commerce vai para **subdomínio novo** em `roilabs.com.br` (assumido `loja.`).
6. **Webhook por gateway**, sem informe manual. *Webhook por gateway ≠ por cadeira.*
7. **Fase 0:** `sirius` cobra com **Stripe**. **`orcaobra` sai da fase 1** — bloqueio de
   **produto**, não de fiação. **Escopo final: 7 cadeiras, 2 adaptadores; Kiwify serve zero
   cadeira e não se constrói.**

## 🚩 A decisão 3 REDUZIU o escopo

A primeira leitura da spec dizia que as 6 cadeiras SaaS eram a "terceira unidade de venda"
que a spec 011 registrou como teto do seu atalho, e que era preciso generalizar `ItemPedido`.

**Está errado.** São dois eixos independentes: *unidade de venda* e *quem processa*. Com SaaS
comprando no gateway do parceiro, cadeira SaaS **nunca cria pedido interno** — nasce um
`NegocioOriginado`, que já é agnóstico de unidade. O carrinho da ROI Labs continua servindo
só m² e rolo. **Nenhuma terceira unidade entra no `ItemPedido`.**

Gatilho redefinido: generalizar quando **uma terceira unidade entrar no carrinho da própria
ROI Labs** (cadeira física que não venda por m² nem rolo). Cadeira SaaS nova **não** dispara,
por mais que se somem.

## O estado medido em 07/08 (`roihub/scripts/gateways.mjs`, 35 projetos × 10 caminhos)

| balde | n | projetos |
|---|---|---|
| Gateway **ligado**, régua lendo | 1 | `atma` |
| Gateway servido, **sem régua** | 1 | `orcaobra` — fora da fase 1 |
| **Serve preço, sem gateway** | 6 | `sirius`, `polarisia`, `estetiacrm`, `context`, `orion`, `vertice` |
| Sem caminho de cobrança | 27 | o resto |

**A leitura é "faltam 2", não "faltam 34".** E nem a única ligada faturou.
