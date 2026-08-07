# Handoff — 012 carteira de cadeiras no e-commerce

**Data**: 2026-08-07 · **Status**: **60 de 83 tasks entregues em código**; 23 em aberto, todas
por falta de acesso (banco, produção, roihub) ou de decisão do Jean — nenhuma por falta de
implementação · **Próximo**: `prisma db push` manual (T009), e só então o push do código.

---

# ⚠️ LEIA ISTO ANTES DE DAR `git push`

**O código NÃO pode ir para produção antes do `prisma db push`.** As rotas novas e as
alteradas leem colunas que ainda não existem no banco (`origem`, `venda_id`, `estado`,
`da_casa`, e as três tabelas novas). Subir o código primeiro derruba `/api/cadeiras`, a
tela de negócios e a geração de fatura — ou seja, o que fatura hoje.

**Ordem obrigatória, sem atalho:**

1. `node --import tsx scripts/snapshot-012-sc003.mjs antes` ← **T003a, tem de ser ANTES do push**
2. `npx prisma migrate diff --from-schema-datasource ./prisma/schema.prisma --to-schema-datamodel ./prisma/schema.prisma --script` e **ler o SQL**
3. `npx prisma db push` (de máquina que alcança o host)
4. `node --import tsx scripts/migrate-012-backfill.mjs` ← falha fechada se algo estiver errado
5. **aí sim** `git push`
6. `node --import tsx scripts/snapshot-012-sc003.mjs depois && … diff` ← T072a, fecha SC-003

O SQL já foi previsto offline (diff entre o schema do `HEAD` e o novo) e está em
[snapshots/delta-012.sql](./snapshots/delta-012.sql): **tudo aditivo, um `DROP NOT NULL`,
zero `DROP COLUMN`**. O passo 2 continua obrigatório porque o preview offline assume que o
banco está igual ao `HEAD` — quem confirma isso é o diff contra o datasource real.

---

## O que a implementação descobriu (e a spec não previa)

### 1. `pedidoId` anulável não causa UM defeito, causa DOIS — e o pior é crash

A spec antecipou o filtro silencioso (`where: { pedidoId: … }` deixando de cobrir venda de
webhook). Ele existe, e é o **menor** dos dois.

⚠️ **`include: { pedido: … }` numa relação que virou opcional devolve `null`.** Todo
`n.pedido.statusPagamento` do código existente vira **`TypeError` em runtime** assim que
existir um negócio de webhook. Uma das cinco ocorrências é a **geração de fatura**.

A varredura completa, com arquivo:linha e a classe de cada uma, está em
[varredura-pedidoid.md](./varredura-pedidoid.md). **7 ocorrências, 5 de crash, 1 silenciosa,
1 correta como estava.** Todas corrigidas.

E num caso `?.` sozinho estaria **errado**: em `api/negocios/route.ts` a lista de negócios
anteriores decide aquisição × recorrência, e uma venda de gateway **reembolsada** continuaria
consumindo a aquisição — o cliente seguinte cairia em recorrência (10%) quando devia ser
aquisição (15%). O reembolso de venda de webhook mora em `VendaParceiro.status`, não em
`Pedido`, e agora as duas fontes são lidas.

### 2. O `data-model.md` modela o segredo da assinatura, mas não o token de leitura

O passo 3 do contrato manda consultar o gateway para ler status e valor. Mas o pagamento
está na conta **do parceiro**, e o token global da ROI Labs não o enxerga — e o schema só
tem `segredoRef` (assinatura).

Resolvido **por convenção, sem coluna nova**: o nome da env do token deriva do nome da env do
segredo (`WEBHOOK_SECRET_<G>_<P>` → `GATEWAY_TOKEN_<G>_<P>`). Coluna aqui custaria um
**segundo `db push` manual** no meio da entrega, que é justamente o que a decisão de "um
`db push` só" existe para evitar. Teto registrado em `lib/carteira/credenciais.ts`: parceiro
que precise de um par fora do padrão vira coluna `tokenRef`.

### 3. `/api/cadeiras` devolvia a linha CRUA — e ia vazar `daCasa`

A rota fazia `findMany` e devolvia o objeto inteiro. Com as colunas da 012, ela passaria a
publicar `daCasa` — a marcação **interna** que FR-010a manda justamente não exibir (cadeira
da casa aparece como parceiro, exceto três). A projeção agora é explícita, campo a campo, e
só sai `rotulo` (a exibição já resolvida).

### 4. A estimativa de "41 páginas pSEO + 5 guias" da US4 está velha por ~2×

O `dist/` real serve **104 URLs**: 71 de porcelanato (os 41 slugs viram ~71 URLs por causa
dos combos da spec 008) e 13 guias, não 5. **Um mapa 301 feito pela contagem da spec
deixaria ~58 URLs em 404** — destruição de ativo, que é exatamente o que a fase de maior
risco existe para evitar.

Por isso `src/scripts/mapa-301.mjs` gera o mapa do **`dist/` que o site serve**, nunca de
lista escrita à mão. Saída versionada em [snapshots/mapa-301.txt](./snapshots/mapa-301.txt)
e [snapshots/301-corte-dominio.conf](./snapshots/301-corte-dominio.conf).

### 5. Reembolso de webhook precisava de propagação, senão o demonstrativo lia código morto

O estorno chega como **outro** evento, com o mesmo `pagamentoId`. Sem propagar o status para
a venda original, `VendaParceiro.status` ficaria eternamente `'aprovada'` e a leitura que o
demonstrativo faz para tirar o negócio da fatura nunca dispararia.

## Decisões de implementação que valem revisão

| decisão | por quê | onde |
|---|---|---|
| **Cadeira da casa não cria `NegocioOriginado`** (em vez de criar com `faturavel=false`) | `NegocioOriginado` é o livro do success fee. Sem linha, FR-010 vale por **construção**, não por uma flag que alguém inverte. A venda É gravada — receita direta, auditável. | `registrar-venda.ts` |
| **Sem o SDK `stripe`** (T003 pedia adicionar) | O repo já decidiu isso: `lib/mercadopago.ts` diz "no SDK dependency — a few fetch calls cover it", e `mercadopago` também não está no `package.json`. Assinatura = 15 linhas de `crypto`; consulta = um `GET`. Adicionar dependência aqui contraria a Constituição III **e** obrigaria `npm install` num diretório do OneDrive que já corrompe `node_modules`. | `adaptadores/stripe.ts` |
| **Adaptador MP faz o próprio `fetch`** em vez de generalizar `getPayment` | Seria um **segundo** toque no arquivo que `/api/pagamentos/webhook` usa — o único caminho que fatura. Raio de alcance menor vale a duplicação de um `fetch`. | `adaptadores/mercadopago.ts` |
| **`eventoId` do MP é derivado de `(pagamento, status)`** | O MP manda notificação sem corpo em algumas integrações, e id instável quebraria a idempotência. Assim retry do mesmo estado colide (200) e **mudança** de estado grava linha nova — que é o que o estorno precisa. O Stripe usa o `evt_` real, que é estável. | `adaptadores/mercadopago.ts` |
| **`processarWebhook` recebe deps** | O contrato exige provar "401 **e nenhuma linha gravada**". Isso só se prova se o teste puder **observar** as escritas. Dois chamadores reais, não abstração especulativa. | `lib/carteira/webhook.ts` |
| **`daCasa` fail-closed no SEED** | Errado para `false` faz a ROI Labs cobrar fee de si mesma e **inflar** a receita da carteira — o defeito que FR-010 proíbe. Errado para `true` só sub-reporta, que é recuperável. | `lib/seats.ts` |
| **Alerta do 401 com dedupe de 1h** | Sem ele, gateway reenviando em loop vira milhares de e-mails e o alerta que importa se perde. Teto: é por instância. | `lib/carteira/webhook.ts` |

## 🚩 Decisões que precisam do Jean (bloqueiam tasks)

1. **`daCasa`, cadeira a cadeira (T052).** A spec diz explicitamente que "não está apurada".
   Semeei **fail-closed** (`daCasa: true`) em `polarisia`, `estetiacrm`, `context`, `vertice`,
   `orcaobra`, além de `sirius`/`meridian`/`orion` que a FR-010a já determina. `atma` e
   `Fitas adesivas` (Tapepro) ficaram `false` — são os dois parceiros externos documentados.
   **Confirmar `vertice` e `orcaobra`**, que são os que não consegui derivar de nada escrito.
2. **Label do subdomínio (T058).** Assumido `loja.roilabs.com.br`. Trava T059/T061–T065.
3. **Preço e texto real dos 7 produtos (T048/T049).** Ver abaixo.

## O que ficou de fora, e por quê

| task | por que não fecha aqui |
|---|---|
| T003a · T009 · T011 · T072a | **Não há `DATABASE_URL` nesta máquina** (só `.env.example`). Os três scripts estão escritos e prontos: `snapshot-012-sc003.mjs`, `migrate-012-backfill.mjs`. Precisam de máquina que alcance o host. |
| T033 · T034 · T036 · T037 | Operação em produção: cadastrar credencial, publicar env na EasyPanel, apontar o webhook no painel do parceiro e **fazer uma compra real com cartão real**. `SC-001` sai daqui ou não sai. |
| T048 · T049 · T050 | **Exigem preço e descrição reais de produto de terceiro.** Inventar preço numa página de e-commerce publicada é fabricar oferta comercial. O template, o `Product`/`Offer`, o `FAQPage` e o **verificador do piso** estão prontos: cada cadeira adicionada já nasce medida e reprovada se estiver fina. |
| T058–T065 | Corte de domínio: precisa do label (1), de DNS/EasyPanel e de 30 dias de GSC. **T060 está feita** — o mapa das 104 URLs. |
| T066 · T067 · T071 | A lista dos 35 projetos vive no **roihub**, que não é este repositório. Inventar slug e URL para "completar 35" fabricaria a carteira, e a chave é a URL do site, não o repo. O schema já os comporta (FR-007), que era o que esta fase tinha de garantir. |
| T072 | Constituição II: Docker/EasyPanel ou browser em produção. `npm test` (17/17) e `tsc --noEmit` passam local, e **isso não é verificação em ambiente real**. |
| T074 | Push depende do `db push` — ver o bloco no topo. |

## Verificação feita (e o que ela NÃO prova)

- `npm test` — **17/17 verdes** (eram 10; 7 arquivos novos). A **lista** do `package.json` foi
  conferida arquivo a arquivo, não o output: o script é cadeia de `&&` e o primeiro erro
  interrompe, então "não apareceu" podia ser ausência **ou** interrupção.
- `npx prisma validate` — schema válido (é o que pega relação inversa faltando, T007a).
- `npx tsc --noEmit` — limpo. É o que pega o `pedido` anulável propagando errado.
- `check-cadeiras --self-test` — passa, **incluindo o caso do `sed` guloso**: HTML minificado
  com dois `<script>` conta 8 palavras, e contaria 0 com o `.*` guloso.
- ⚠️ **Nada disso é Constituição II.** Nenhuma linha foi executada contra o banco real, nenhum
  webhook recebeu evento de verdade, nenhuma venda foi registrada. **Receita provada da
  carteira continua R$ 0,00** — e continua até a T036.

---

## Feito

- `spec.md` escrita e revisada em duas rodadas de clarification no mesmo dia.
- Escopo **medido, não lembrado** (`roihub/scripts/gateways.mjs`, 35 projetos × 10 caminhos,
  HTTP contra produção, zero LLM): 1 gateway ligado (`atma`), 1 servido sem régua (`orcaobra`),
  6 servem preço sem gateway (`sirius`, `polarisia`, `estetiacrm`, `context`, `orion`,
  `vertice`), 27 sem caminho de cobrança. Idêntico à corrida de 01/08.
- Baseline de acesso medido no GSC e registrado em Success Criteria:
  `Docs/Obsidian/80-dev/atma-diferencial-de-acesso-2026-08-07.md`.

## Decisões (Jean, 2026-08-07 — não reabrir)

1. Cada cadeira ganha **página de produto + preço + checkout**. Não é vitrine com link de saída.
2. **Fase 1 = só quem tem produto vendável**; os 35 entram no fim, transformando os outros um a
   um. O modelo de dados já nasce comportando os 35.
3. Pagamento **depende do tipo de cadeira**: físico → carrinho da ROI Labs; SaaS → gateway do
   parceiro.
4. Cadeira da casa: marcada **sempre** no dado interno, sem success fee de si mesma. No site
   público exibida como parceiro, **exceto `sirius`, `meridian` e `orion`**.
5. E-commerce vai para **subdomínio novo em `roilabs.com.br`** (assumido `loja.`).

## 🚩 A decisão 3 REDUZIU o escopo — leia antes de planejar

A primeira versão desta spec tinha como P1 **generalizar `ItemPedido`** para unidade arbitrária,
por entender que as 6 cadeiras SaaS eram a "terceira unidade de venda" que a spec 011 registrou
como teto do seu atalho.

**Está errado, e a decisão 3 é o motivo.** São dois eixos independentes: *unidade de venda* e
*quem processa*. Com SaaS comprando no gateway do parceiro, cadeira SaaS **nunca cria pedido
interno** — nasce um `NegocioOriginado`, que já é agnóstico de unidade. O carrinho da ROI Labs
continua servindo só m² e rolo. **Nenhuma terceira unidade entra no `ItemPedido`; o atalho da 011
segue válido e o caminho de dinheiro existente não é tocado.**

Gatilho redefinido e registrado em Out of scope: generalizar quando **uma terceira unidade entrar
no carrinho da própria ROI Labs** (cadeira física que não venda por m² nem rolo). Cadeira SaaS
nova não dispara, por mais que se somem.

6. **Webhook por gateway**, sem informe manual (3ª rodada). *Webhook por gateway ≠ por cadeira.*
7. **Fase 0 (resolvida antes de qualquer código):** `sirius` cobra com **Stripe** — o
   `mercadopago` no `package.json` dele é dependência escrita e não usada. E **`orcaobra` sai da
   fase 1**: *"acho ele um produto ruim do jeito que está"* — bloqueio de **produto**, não de
   fiação. **Escopo final: 7 cadeiras, 2 adaptadores; Kiwify serve zero cadeira e não se
   constrói.**

## Plano (07/08) — o que ele descobriu no código

- **Já existe webhook de MP** (`app/src/app/api/pagamentos/webhook/route.ts`) com o padrão certo:
  assinatura antes de estado, status lido do gateway, idempotência por id. **Vira o molde — e não
  é tocado** (é o que fatura hoje, FR-005a). Ele é single-tenant; cadeira de parceiro tem conta e
  segredo próprios.
- **Bloqueio de schema achado no arquivo:** `NegocioOriginado.pedidoId` é **NOT NULL** com relação
  obrigatória. Venda SaaS não tem `Pedido`, logo hoje **não consegue** virar negócio. `Pedido`
  sintético foi **rejeitado** (exigiria `whatsapp` e `entrega` falsos no caminho de dinheiro).
  Escolhido: `pedidoId` anulável + discriminador `origem` + invariante testada.
- **Segredo de webhook NÃO vai para o banco** — `CredencialGateway.segredoRef` guarda o *nome* da
  env var. Banco guarda ponteiro, EasyPanel guarda valor.
- **Parceiro vai no PATH da rota**, não é descoberto pelo corpo: o segredo é por conta, então
  descobrir pelo corpo exigiria ler entrada não autenticada antes de validar assinatura.

## Pendências

*(Atualizadas no bloco de implementação no topo — o que segue é o registro do dia do plano.)*

- Label do subdomínio: assumido `loja.roilabs.com.br`, não confirmado. Não bloqueia (T058).
- ⚠️ **Dois "8" diferentes no material** — `seats.ts` tem **8 cadeiras de nicho**; a fase 1 tinha
  **8 projetos candidatos** (hoje 7). Contagens de coisas distintas que ficaram perto por acidente:
  sempre dizer QUAL. Já causou uma leitura errada na revisão de consistência de 07/08.
- ⚠️ **Quantas cadeiras são "da casa" NÃO está apurado.** A spec deixou de afirmar um número; a
  classificação é curadoria e é a tarefa T052.
- ⚠️ **`pedidoId` anulável quebra leitura existente em silêncio** — varrer TODA consulta de
  `NegocioOriginado` por `pedidoId` é tarefa da Fase 1, não observação. Mesma landmine do
  `freteMotivo` na 010, e esta casa já pisou nela duas vezes.

## Gotchas herdados (já embutidos como FR)

- **`approved` + `live_mode` não é venda**: os 20 pagamentos da `atma` são de payer de teste.
  Só o payer separa teste de receita — receita provada da carteira hoje é **R$ 0,00**.
- **Cert Universal da Cloudflare cobre apex + UM label.** Subdomínio de segundo nível quebra no
  handshake (é o que já acontece com `www.sirius` e `www.goiania`).
- **`curl -k` esconde erro de cert**: 200 no terminal e "Failed to fetch" no browser.
- **Sitemap em 200 não prova deploy** — validar o corpo (`<?xml`), nunca o status.
- **Contar palavra com `sed 's/<script[^>]*>.*<\/script>//g'` mede o `sed`**: em HTML minificado
  o `.*` guloso devolve 0 palavra em página com `<h1>`.
- **`goiania` e `roilabs` são o mesmo repo** — card ≠ repositório; somar os dois infla a carteira.
- **Ligar cobrança não cria demanda.** Para as cadeiras sem busca (doença A da medição de
  07/08), o resultado esperado é conversão do tráfego existente, nunca crescimento.
