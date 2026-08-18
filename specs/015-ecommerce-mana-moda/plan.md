# Implementation Plan: E-commerce Maná Moda Social Masculina

> 🚩 **ESTE PLANO ESTÁ DESATUALIZADO desde 18/08/2026 — leia o [handoff.md](./handoff.md) primeiro.**
> A Maná saiu do build do `site-goiania` e virou projeto próprio (`JeanZorzetti/mana`), no formato
> do Tapepro. A Estrutura, a decisão D1 do [research.md](./research.md) (prefixo `/mana/`) e as tasks
> T012–T072 do [tasks.md](./tasks.md) assumem a arquitetura antiga, em que os dois sites dividiam
> um container e um `root` de nginx — que foi exatamente o defeito. O handoff tem o estado real,
> a fila do que falta e os comandos de verificação.

**Branch**: `015-ecommerce-mana-moda` (trabalho em branch; `main` é deploy) | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-ecommerce-mana-moda/spec.md`

## Summary

A 013 prometeu que a 3ª cadeira custaria **um catálogo + uma configuração**. A Maná Moda é a
primeira a cobrar essa promessa — e ela cobra em quatro pontos onde o motor ainda não tinha
sido exercitado:

| O que a Maná traz de novo | Por que o motor de hoje não cobre |
|---|---|
| **Unidade `peca` com variação** (tamanho × cor) | as 3 unidades atuais (`m2`, `rolo`, `assinatura`) têm **um preço por slug**; roupa tem N SKUs por produto |
| **Estoque finito** | catálogo é arquivo versionado; arquivo não debita |
| **Comissão flat de 10% retida na hora** | a régua da 010 é de duas taxas e o negócio é criado **à mão** no admin |
| **Host próprio** (`mana.roilabs.com.br`) | o motor mora dentro de um site com um `Astro.site` só |

A decisão que mantém o custo baixo é tratar **variação como SKU de primeira classe**: o item de
pedido continua guardando um `slug` escalar — que na Maná é o `sku` da variação, não o slug do
produto. Com isso `quantidade × precoUnitario = subtotal` continua valendo, o carrinho não muda
de formato, e a variação vira **catálogo + estoque**, nunca coluna nova em `ItemPedido`.

A decisão que muda mais coisa é o **split no Mercado Pago** (escolha do Jean, 17/08): o
comprador paga na conta MP da própria Maná, com `marketplace_fee` de 10% retido pela ROI Labs no
ato. Isso **elimina o repasse** como processo — o líquido já cai na conta certa — ao custo de um
caminho de dinheiro novo, token OAuth por parceiro e webhook assinado por **outra** conta.

## Technical Context

**Language/Version**: TypeScript 5.x · Node 20+ (Docker: node:22-alpine) · Astro 5 · Next.js 16 App Router

**Primary Dependencies**: Astro, Next 16, Prisma 6, Mercado Pago (Checkout Pro **+ marketplace
split**), Melhor Envio. **Nenhuma dependência nova é adicionada.** Hash de senha do parceiro usa
`node:crypto` (`scrypt`), não bcrypt.

**Storage**: Postgres (EasyPanel). Schema aplicado por `prisma db push` **manual**, de máquina
que alcança o host (Constituição, Restrições Técnicas). Endpoint externo: `2.24.207.200:5443`.
⚠️ `:5445` é o `roihub_db` e **não** tem as tabelas deste app.

**Testing**: `node --import tsx test/*.test.mjs` no `/app` (24 arquivos hoje). Gates de build no
`prebuild`/`postbuild` do `/site-goiania` (`check-matrix`, `check-cart-math`, `check-lojas`,
`check-cadeiras`, `check-feed`).

**Target Platform**: `site-goiania` → Astro estático servido por nginx, **agora com dois hosts no
mesmo container** (`goiania.roilabs.com.br` e `mana.roilabs.com.br`). `app` → Next standalone em
`app.roilabs.com.br`. Ambos EasyPanel/Docker. DNS em Cloudflare.

**Project Type**: Web — site estático (vitrine + carrinho no browser) + serviço Next (checkout,
webhook, admin, banco, **painel do parceiro**). O carrinho é 100% cliente; **o servidor é a única
autoridade de dinheiro e de estoque**.

**Performance Goals**: nenhuma meta nova. Restrição: a página de produto da Maná é o ativo — o
seletor de variação não pode entrar no caminho do LCP (renderiza no HTML inicial; o JS só marca
o que está esgotado).

**Constraints**:
- **As 99 URLs do sitemap do goiania são intocáveis.** Nenhuma rota da Maná pode colidir com
  elas, e `/mana/*` no host antigo responde **301** para o host novo.
- **Nenhuma prova de pagamento com cartão real.** O veto do Jean (07/08) segue valendo e não é
  reaberto. A verificação do split usa **usuários de teste do Mercado Pago** — sandbox, não
  cartão real; isso é o teto do que dá para provar aqui, e está declarado como tal.
- **Estoque é dinheiro.** Vender unidade inexistente cobra o comprador por nada. O débito é
  condicional e atômico no banco, nunca `read-then-write` na aplicação.
- Build local não prova nada (Constituição II; OneDrive corrompe `node_modules`).
- `npm run build` no `site-goiania` **submete ao IndexNow** — build exploratório é `npx astro build`.

**Scale/Scope**: 1 cadeira nova · 1 unidade nova · ~N produtos × ~M variações (catálogo inicial a
ser fornecido pela Maná) · 1 host novo · 1 gateway novo (conta MP de terceiro) · 3 tabelas novas.

## Constitution Check

*GATE: passa antes da Fase 0 e é re-avaliado depois da Fase 1.*

| Princípio | Como este plano satisfaz | Status |
|---|---|---|
| **I. Env vars primeiro** | 2 envs novas (`GATEWAY_TOKEN_MANA`, `WEBHOOK_SECRET_MANA`), e elas reusam a convenção que `lib/carteira/credenciais.ts` já estabeleceu — nome no banco, valor na EasyPanel. O plano manda investigar **nesta ordem** qualquer falha de checkout da Maná: as duas envs, depois `MELHOR_ENVIO_*`, e só então o código. `resolverCredencial` já devolve `null` quando a env não foi publicada, o que faz a cadeira **falhar fechada** em vez de cobrar errado. | ✅ |
| **II. Verificação em ambiente real** | Nenhuma task fecha com "build passou". Os gates são: `npm test` no app, `astro build` com sitemap conferido, **navegação no browser em produção nos dois hosts**, `curl` do TLS do host novo antes de qualquer corte, e o débito de estoque conferido **por consulta ao Postgres de produção**. A quickstart lista comando e output esperado. ⚠️ O split é verificado com **usuário de teste do MP**, não com cartão real — o limite está declarado, não escondido. | ⚠️ com limite declarado |
| **III. Simplicidade deliberada (YAGNI)** | Zero dependência nova. Variação **não** vira coluna em `ItemPedido` (vira SKU). Credencial da Maná **não** vira mecanismo novo (reusa `CredencialGateway` + `nomeEnvToken`). `getPayment`/`refund` ganham um argumento opcional, no mesmo padrão que `verifyWebhookSignature` já abriu na 012. 5 exceções ficam registradas em Complexity Tracking, com teto e upgrade. | ✅ |
| **IV. Qualidade de página** | A vitrine da Maná é conteúdo rico e design próprio, não o layout do porcelanato com outro texto. O seletor de variação passa por `accessibility` (radiogroup, foco, estado esgotado anunciado) e todo texto de interface por `ux-writing` — **obrigatório no `implement`**, não opcional. | ✅ |
| **V. Spec-driven e entrega fechada** | `specify → clarify → plan` cumpridos; `tasks`/`implement` na sequência. `handoff.md` co-localizado no fechamento, com commit + push. | ✅ |

**Restrições técnicas verificadas:** monorepo por app respeitado (nada novo fora de
`site-goiania/src`, `app/src`, `app/prisma`, `app/scripts`); `prisma db push` manual previsto
como task própria; patterns Next 16 (`params: Promise<…>`, `getAuthFromRequest`, singleton
`@/lib/prisma`, `@@map` snake_case) mantidos; LLM não entra nesta feature; canal 100% orgânico.

**Resultado do gate:** PASS, com 4 itens em Complexity Tracking e **um limite de verificação
declarado** (Princípio II) que não tem como ser fechado dentro do veto vigente.

## Project Structure

### Documentation (this feature)

```text
specs/015-ecommerce-mana-moda/
├── plan.md                       # Este arquivo
├── research.md                   # Fase 0 — as 9 decisões e o que foi rejeitado
├── data-model.md                 # Fase 1 — variação, estoque, pós-venda, sessão de parceiro
├── quickstart.md                 # Fase 1 — como verificar em ambiente real (Constituição II)
├── contracts/
│   ├── checkout-split.md         # preference com token e fee da Maná; webhook por cadeira
│   ├── estoque-variacao.md       # débito condicional, corrida da última unidade, refund
│   └── painel-parceiro.md        # sessão de parceiro, escopo, o que o demonstrativo mostra
├── checklists/                   # já existe
├── handoff.md                    # criado no fechamento
└── tasks.md                      # Fase 2 — NÃO criado por /speckit-plan
```

### Source Code (repository root)

```text
site-goiania/                             # Astro estático — vitrine, carrinho, checkout (form)
├── nginx.conf                            # ALTERADO — 2º server{} (mana) + 301 de /mana/ no antigo
├── src/data/
│   ├── unidades.ts                       # ALTERADO — +unidade 'peca'
│   ├── lojas.ts                          # ALTERADO — +cadeira 'mana' (publicada: false até a fase 7)
│   └── mana.ts                           # NOVO — catálogo: produto + variações (sku/tamanho/cor/preço/peso)
├── src/layouts/Base.astro                # ALTERADO — prop `siteBase` (canonical/og/@graph do host certo)
├── src/components/
│   ├── SeletorVariacao.astro             # NOVO — tamanho × cor; a11y é requisito, não extra
│   ├── HeaderMana.astro / FooterMana.astro  # NOVO — marca da Maná, não a do porcelanato
│   └── AddToCart.astro                   # ALTERADO — aceita sku de variação
├── src/pages/mana/
│   ├── index.astro                       # vitrine
│   ├── [slug].astro                      # página de produto
│   ├── sitemap.xml.ts                    # sitemap PRÓPRIO (host mana)
│   ├── robots.txt.ts · llms.txt.ts       # idem — o root é compartilhado, estes não podem ser
│   └── trocas.astro                      # abertura de solicitação (FR-011)
└── src/scripts/check-mana.mjs            # NOVO — paridade catálogo × espelho servidor (gate de build)

app/                                      # Next 16 — checkout, webhook, admin, banco
├── prisma/schema.prisma                  # +EstoqueVariacao, +SolicitacaoPosVenda, Pedido.pagoEm, Parceiro.senhaHash
├── scripts/
│   ├── seed-015-mana.mjs                 # NOVO — cadeira + parceiro + credencial + estoque inicial
│   └── verify-015-estoque.mjs            # NOVO — soma vendida × estoque debitado, rodável a qualquer hora
├── src/lib/
│   ├── lojas.ts                          # ALTERADO — espelho servidor +mana, +emailObrigatorio
│   ├── precos-mana.ts                    # NOVO — autoridade de preço/peso por SKU (espelho servidor)
│   ├── estoque.ts                        # NOVO — débito condicional atômico e sua decisão (pura)
│   ├── comissao.ts                       # NOVO — 10% flat sobre produto, nunca sobre frete (pura)
│   ├── cors.ts                           # NOVO — allowlist de origem (2 hosts), some o SITE_ORIGIN solto
│   ├── mercadopago.ts                    # ALTERADO — tokenOverride em getPayment/refund; marketplaceFee
│   ├── frete-fitas.ts → frete-cotacao.ts # RENOMEADO — serve 2 cadeiras; carga vem do chamador
│   ├── session.ts                        # ALTERADO — sessão de PARCEIRO (cookie próprio, não o do admin)
│   └── pos-venda.ts                       # NOVO — janela de 7 dias do CDC (pura)
├── src/app/api/
│   ├── pedidos/route.ts                  # ALTERADO — unidade 'peca', fee no split, email obrigatório
│   ├── pagamentos/webhook/route.ts       # ALTERADO — ?cadeira=, secret/token da conta certa, débito+refund
│   ├── estoque/route.ts                  # NOVO — disponibilidade ao vivo (CORS), lida pela vitrine
│   ├── pos-venda/route.ts                # NOVO — abre solicitação de troca/devolução
│   └── parceiro/{login,resumo}/route.ts  # NOVO — sessão e demonstrativo do parceiro
├── src/app/parceiro/                     # NOVO — /parceiro/login e /parceiro (demonstrativo)
└── test/                                 # NOVOS — estoque-corrida · comissao-flat · mana-paridade
                                          #          sessao-parceiro · pos-venda-janela
```

**Structure Decision**: nenhuma pasta nova de topo. A loja da Maná mora **dentro do motor
existente** (`site-goiania/src`), servida por um segundo `server{}` do mesmo nginx. É a opção
que preserva a promessa da 013 — um carrinho, um checkout, um item de pedido — ao preço de as
URLs canônicas carregarem o prefixo `/mana/` (`https://mana.roilabs.com.br/mana/<produto>/`).
Ver [research.md](./research.md) D1 para por que o prefixo fica e o que custaria tirá-lo.

## Fases de execução

A ordem existe para que **nenhum passo isolado possa cobrar errado nem derrubar o goiania**.
Cada fase é deployável e reversível sozinha.

### Fase 1 — O dado, sem vender nada

`unidades.ts` ganha `peca`; `lojas.ts` (site e servidor) ganham a cadeira `mana` com
**`publicada: false`**; `mana.ts` e `precos-mana.ts` nascem com o catálogo real; `check-mana.mjs`
entra no `prebuild`. Nenhuma rota nova, nenhum host novo, nenhum schema.

*Prova:* `check-lojas` e `check-mana` passam; `astro build` continua com **99 URLs**; `npm test`
verde. O site no ar não muda em nada.

### Fase 2 — O host e a vitrine (sem checkout)

Páginas `/mana/**`, layout e componentes próprios, sitemap/robots/llms próprios, `nginx.conf`
com o 2º `server{}` e o 301 de `/mana/` no host antigo. DNS da Maná no Cloudflare **antes** do
deploy. Cadeira segue `publicada: false` ⇒ URLs em 200, produtos visíveis, **sem caminho de
compra**.

*Prova:* TLS do host novo completa handshake sem `-k`; `mana.roilabs.com.br/mana/<produto>/`
em 200; `goiania.roilabs.com.br/mana/x` em **301**; `mana.roilabs.com.br/sitemap.xml` traz as
URLs da Maná e **nenhuma** do porcelanato; as 99 do goiania seguem em 200.

### Fase 3 — O estoque (a fase que impede vender o que não existe)

`EstoqueVariacao` no schema (`db push` manual), `seed-015-mana.mjs` carregando a quantidade
inicial por SKU, `/api/estoque` para a vitrine marcar esgotado, e o **débito condicional** dentro
da transação do webhook. Perder a corrida ⇒ rollback, pedido `reembolsado`/`sem_estoque` e
`refund()`.

*Prova:* `verify-015-estoque.mjs` fecha (Σ vendido por SKU + estoque atual = estoque inicial);
teste de corrida verde; consulta ao Postgres de produção mostrando o débito de um pedido de
teste. **Nenhuma venda real ainda** — a cadeira continua despublicada.

### Fase 4 — O split (o caminho de dinheiro novo)

`CredencialGateway` da Maná cadastrada (envs `GATEWAY_TOKEN_MANA`/`WEBHOOK_SECRET_MANA`
publicadas na EasyPanel **antes**), `createPreference` com token da Maná e `marketplace_fee` de
10% sobre produto, `notification_url` com `?cadeira=mana`, e o webhook resolvendo secret/token da
conta certa **antes de tocar estado**.

*Prova:* compra completa com **usuário de teste do MP**, ponta a ponta: preference criada na
conta da Maná, pagamento aprovado, webhook validado com a secret dela, estoque debitado, fee de
10% visível no painel do MP. ⛔ Cartão real segue vetado — o limite é declarado, não contornado.

### Fase 5 — O painel do parceiro

`Parceiro.senhaHash`, sessão de parceiro em cookie próprio, `/parceiro/login` e `/parceiro` com
vendido, comissão retida e líquido do período. **Escopo sempre da sessão, nunca da query.**

*Prova:* sessão de parceiro **não** abre `/admin` e a do admin não vira parceiro; parceiro A não
lê dado de B (teste); números do painel conferem com a soma no Postgres.

### Fase 6 — Pós-venda

`SolicitacaoPosVenda`, página `/mana/trocas`, `POST /api/pos-venda` com a janela de 7 dias do CDC
validada no servidor a partir de `Pedido.pagoEm`, e a fila no `/admin`.

*Prova:* pedido com `pagoEm` de 8 dias atrás é recusado com mensagem própria; de 3 dias é aceito;
pedido sem `pagoEm` (anterior à feature) é recusado.

### Fase 7 — Publicar

`publicada: true`, cadeira na carteira (`seats.ts` + seed), Maná Moda como `Parceiro` ativo com
a cadeira e a URL associadas, sitemap submetido.

*Prova:* SC-005 medido — `mana.roilabs.com.br` público, cadeira `ocupada-vendavel` na carteira
com 10%, e o sitemap **baixado** pelo Google com `errors: 0` (200 no sitemap **não** é prova).

## Complexity Tracking

> Cinco exceções deliberadas. Cada uma com teto e caminho de upgrade, como a Constituição III exige.
> A quinta entrou em 17/08 pelo `/speckit-analyze`, junto com a emenda de FR-008.

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| **URL com prefixo redundante** (`mana.roilabs.com.br/mana/<produto>/`) | é o preço de servir dois hosts do **mesmo build**, que é o que preserva um carrinho e um checkout | Tirar o prefixo exige `base` diferente ⇒ segundo build ⇒ segundo app ⇒ cópia do motor (a opção B, rejeitada pelo Jean). Reescrever no nginx faz cada link interno sofrer 301 e queima crawl — a lição que o GSC já cobrou aqui em 07/2026. **Teto:** quando a Maná justificar site próprio ou quando o goiania migrar para `loja.roilabs.com.br` (012 US4). **Upgrade:** aí sim, `packages/loja-motor` + dois builds |
| **4º e 5º espelho de catálogo** (`mana.ts` no site, `precos-mana.ts` no servidor) | o site é estático e não importa do app; o servidor **precisa** ser a autoridade de preço (FR-005 da 013: nunca confiar no dinheiro do cliente) | Importar do site quebra o isolamento dos dois containers. Mover o catálogo para o banco contraria a Assumption da 013 e obriga o build a consultar Postgres. **Teto:** este é o **primeiro espelho com gate automático** (`check-mana.mjs`) — os de porcelanato e fita nunca tiveram. Se um terceiro par surgir, extrair o gate para um script único. **Trava hoje:** o build quebra se sku ou preço divergirem |
| **Estoque no banco enquanto o catálogo é arquivo** | catálogo é fato editorial (muda por commit); estoque é estado (muda por venda). Um `@default` de arquivo **nunca** debita | Estoque em arquivo torna FR-008/FR-016 impossíveis. Catálogo no banco arrasta build dinâmico. **Teto:** a chave que liga os dois é o `sku`, e é o `check-mana.mjs` que garante que todo SKU do catálogo tem linha de estoque. **Upgrade:** catálogo no banco só quando a Maná precisar editar produto sem deploy |
| **Painel do parceiro é somente leitura** (FR-008 emendado: quem cadastra estoque é o operador da ROI Labs) | o catálogo inicial entra por seed e a Maná não edita produto sem deploy de qualquer forma — dar escrita de estoque a ela hoje seria tela para um fluxo que ninguém exerce | Tela de estoque no `/admin` na v1 é trabalho para um operador que já tem o seed. **Teto:** quando a Maná precisar repor sem pedir à ROI Labs, ou quando o catálogo passar a mudar mais rápido que o deploy. **Upgrade:** escrita de `EstoqueVariacao` no painel do parceiro, com o mesmo escopo de sessão do demonstrativo e log de `sku`/delta/autor |
| **Sessão de parceiro** (2ª autenticação no `/app`) | escolha explícita do Jean (17/08) sobre link-token opaco. FR-009 exige que a Maná consulte **a qualquer momento** | Link-token era menor superfície mas foi rejeitado. **Teto:** cookie próprio (`roilabs_parceiro`), sem recuperação de senha, sem cadastro self-service, sem papel genérico — a senha é definida pelo seed/admin. **Upgrade:** se um 2º parceiro entrar, aí vira tela de gestão de senha; hoje seria config para valor que não muda |

## O que este plano deliberadamente NÃO faz

- **Não toca no caminho de dinheiro de porcelanato e fitas.** O webhook resolve credencial por
  cadeira; sem `?cadeira=`, o comportamento é **exatamente** o de hoje (conta ROI Labs).
- **Não migra o domínio do goiania.** `loja.roilabs.com.br` é a 012 US4 e continua parada.
- **Não faz a limpeza da Fase 5 da 013** (`ItemPedidoFita`, colunas legadas de `itens_pedido`).
  Continua pendente e fora daqui — misturar duas migrações no mesmo diff é o que impede medir.
- **Não testa pagamento com cartão real.** Vetado em 07/08. Sandbox com usuário de teste é o teto.
- **Não implementa troca automática nem logística reversa.** A solicitação é registrada; quem
  executa é o operador (decisão do Jean, 17/08).
- **Não cria success fee nem fatura para a Maná.** Com split, a comissão é retida no ato —
  `NegocioOriginado` e `FaturaSuccessFee` **não** entram neste caminho.

## Constitution Check — re-avaliação pós-Fase 1

O design fechado não introduziu violação nova. Três observações que só apareceram depois de
desenhar:

- **Princípio I ficou mais forte.** Ao reusar `resolverCredencial`, a cadeira da Maná **falha
  fechada** quando `GATEWAY_TOKEN_MANA` não está publicada: sem token não há preference, e sem
  preference não há cobrança. O modo de falha por env ausente é "não vende", nunca "vende errado".
- **Princípio III ganhou um saldo que a Fase 0 não previa:** `SITE_ORIGIN` hard-coded existe
  duplicado em duas rotas hoje; a allowlist de CORS **remove** essa duplicação em vez de somar
  uma terceira cópia.
- **Princípio II tem um buraco que este plano não fecha e não finge fechar.** O split é um
  caminho de dinheiro **novo**, e o veto ao cartão real impede a prova ponta a ponta com dinheiro
  de verdade. A mitigação é sandbox com usuário de teste do MP — que prova a **fiação** (token,
  fee, assinatura do webhook, débito de estoque), **não** prova que o dinheiro real chega. Essa
  distinção precisa sobreviver ao handoff: nenhuma afirmação de receita pode sair desta entrega.
