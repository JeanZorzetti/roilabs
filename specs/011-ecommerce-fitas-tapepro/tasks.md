---

description: "Task list — 011 E-commerce de fitas adesivas Tapepro"
---

# Tasks: E-commerce de fitas adesivas Tapepro (segundo vertical)

**Input**: Design documents from `/specs/011-ecommerce-fitas-tapepro/`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/)

**Tests**: Self-checks são **obrigatórios** aqui — a Constituição II e o SC-009 exigem função pura testada em todo caminho de dinheiro. Não são opcionais nesta feature.

**Organization**: Agrupadas por user story, para entrega incremental.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1, US2, US3, US4
- Caminho de arquivo exato em toda tarefa

## Convenções de caminho

- `app/` — Next 16 + Prisma (dinheiro, admin) → `app.roilabs.com.br`
- `site-goiania/` — Astro estático (SEO, catálogo, carrinho) → `goiania.roilabs.com.br`

> ⛔ **Invariante de toda a feature**: `app/src/lib/precos.ts`, `app/src/lib/frete.ts`, `model ItemPedido`, `site-goiania/src/lib/cart.ts`, `site-goiania/src/data/produtos.ts` e `porcelanato.ts` **NÃO são editados**. Se uma tarefa exigir tocar num deles, pare — a abordagem está errada.

---

## Phase 1: Setup (dependências externas)

**Purpose**: Destravar o que não é código. **Três destas dependem do Jean/Tapepro** e bloqueiam fases posteriores.

- [ ] T001 Criar conta no Melhor Envio e gerar **token de sandbox** (painel → ambiente de teste). Bloqueia T030.
- [ ] T002 [P] Obter do Tapepro o **peso (kg) e as dimensões da embalagem (cm)** por rolo dos 3 SKUs. Sem isso a cotação de frete não roda — bloqueia T030.
- [ ] T003 [P] Confirmar com o Tapepro as **duas fronteiras ambíguas** da tabela de preços: 200 rolos exatos (lacuna entre "100 a 199" e "acima de 200") e 100 rolos na gomada (sobreposição entre "15 a 100" e "acima de 100"). Ver [data-model.md](./data-model.md). Bloqueia T012.
- [ ] T004 [P] Obter o **CEP de origem** de despacho do Tapepro.
- [ ] T005 Registrar `MELHOR_ENVIO_TOKEN`, `MELHOR_ENVIO_BASE_URL` (sandbox) e `MELHOR_ENVIO_CEP_ORIGEM` no EasyPanel do `/app` (Constituição I).

**Checkpoint**: credenciais e dados de carga disponíveis.

---

## Phase 2: Foundational (bloqueia TODAS as user stories)

**Purpose**: Schema, autoridade de preço, catálogo e carrinho — a base que todas as histórias consomem.

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase fechar.

### Banco (ordem rígida — inverter derruba produção)

- [x] T006 Adicionar `model ItemPedidoFita` e os campos `Pedido.vertical`, `Pedido.freteMotivo`, `Cupom.escopo` em `app/prisma/schema.prisma`, conforme [data-model.md](./data-model.md)
- [ ] T007 Gerar preview do SQL com `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` e revisar antes de aplicar
- [ ] T008 Aplicar `npx prisma db push` **MANUALMENTE** de máquina que alcança o host (runner standalone não aplica schema)
- [x] T009 Criar `app/scripts/migrate-011-backfill.mjs` — `Cupom.escopo='porcelanato'` e `Pedido.vertical='porcelanato'` em todas as linhas existentes (FR-037)
- [ ] T010 Executar T009 e conferir com `SELECT escopo, COUNT(*) FROM cupons GROUP BY escopo` e `SELECT vertical, COUNT(*) FROM pedidos GROUP BY vertical` — tudo `porcelanato`

### Autoridade de preço (caminho de dinheiro)

- [x] T011 [P] Criar `app/src/lib/precos-fitas.ts` com as interfaces `FaixaPreco`/`PrecoFita` e a função pura `precoPorQuantidade(slug, rolos)` que resolve a faixa (FR-038)
- [x] T012 Preencher `app/src/lib/precos-fitas.ts` com a **tabela oficial** transcrita em [data-model.md](./data-model.md) — **apenas 2 SKUs**: gomada (2 faixas) e comum (preço único). A **personalizada NÃO entra** — é só-orçamento (FR-040), e sua ausência é o que a marca como tal. Depende de T003 (fronteiras) e T002 (peso/dimensões)
- [x] T013 Criar `app/test/precos-fitas.test.mjs` — **fronteiras de faixa** (14/15/100/101 na gomada), invariante de faixas **sem lacuna e sem sobreposição** por SKU, slug ausente → `null`, e **`fita-transparente-personalizada` → `null`** (prova de que é só-orçamento)

### Catálogo e carrinho (site estático)

- [x] T014 [P] Criar `site-goiania/src/data/fitas.ts` com os 3 SKUs: **fatos** copiados de `Tapepro/src/lib/produtos.ts` (medidas, material, reforço, ativação, mínimo) + campos de **copy comercial própria** (FR-027/FR-032)
- [x] T015 [P] Copiar as imagens de produto de `Tapepro/src/assets/produtos/` para `site-goiania/src/assets/fitas/`. **Excluir `sua-marca-aqui.png`** — carrega marca de outro fornecedor
- [x] T016 Estender `site-goiania/src/scripts/check-matrix.mjs` com asserção comparando os fatos de `fitas.ts` contra uma cópia declarada dos valores do institucional — divergência **quebra o build** (mitigação de D5)
- [x] T017 [P] Criar `site-goiania/src/lib/cart-fitas.ts` — chave `roi_cart_fitas_v1`, itens `{slug, rolos}`, `addItem`/`setRolos`/`removeItem`/`lines`/`count`. Sem perda, sem ambientes, sem conversão de área
- [x] T018 Adicionar `node src/scripts/check-cart-math.mjs` ao `prebuild` em `site-goiania/package.json` — **hoje é órfão e nunca roda** (research D7)
- [x] T019 Estender `site-goiania/src/scripts/check-cart-math.mjs` com a matemática de rolos: `rolos × precoRolo(faixa) = subtotal` e as fronteiras de faixa. A matemática de porcelanato deve continuar passando sem alteração

**Checkpoint**: schema migrado, preço autoritativo testado, catálogo e carrinho prontos. User stories podem começar.

---

## Phase 3: User Story 1 — Comprar fita com preço público (P1) 🎯 MVP

**Goal**: Comprador B2B vai da página do produto ao pagamento, com frete nacional calculado e CNPJ obrigatório.

**Independent Test**: abrir `/fitas/`, adicionar rolos acima do mínimo, informar CNPJ e CEP de outro estado, ver frete e total, pagar de verdade; conferir pedido persistido em rolos com valor conferido pelo servidor.

### Frete (o risco nº 1)

- [x] T020 [P] [US1] Criar `app/src/lib/frete-fitas.ts` com a função **pura** `mapearResposta(raw)` → `{ok, valor, prazo, servico}` ou `{ok:false, motivo}`, separando `cep_nao_atendido` de `falha_tecnica` (FR-034)
- [x] T021 [P] [US1] Criar `app/test/frete-fitas.test.mjs` — resposta válida → `ok`, lista de serviços vazia → `cep_nao_atendido`, erro HTTP/JSON ilegível/timeout → `falha_tecnica`, valor `0` ou negativo → `falha_tecnica`
- [x] T022 [US1] Implementar em `app/src/lib/frete-fitas.ts` a chamada ao Melhor Envio com `AbortController` e **timeout de 4s**, derivando peso e dimensões de `precos-fitas.ts` (nunca do cliente)
- [x] T023 [US1] Criar `app/src/app/api/frete/cotar/route.ts` conforme [contracts/frete-cotar.md](./contracts/frete-cotar.md) — urlencoded sem preflight, header CORS fixo no origin do site, espelhando `api/cupom/validar/route.ts`
- [x] T024 [US1] Adicionar `log.error` com CEP e status em toda `falha_tecnica` em `app/src/lib/frete-fitas.ts` — sem isso o alerta avisa que quebrou mas não o quê

### Escopo de cupom (impede desconto de porcelanato vazar para fita)

- [x] T025 [P] [US1] Estender `app/src/lib/cupons.ts` — campo `escopo` em `CupomAvaliavel`, motivo `'escopo'`, parâmetro `vertical` em `avaliarCupom`, verificado **depois** de `inativo` e **antes** de validade (ver [contracts/cupom-escopo.md](./contracts/cupom-escopo.md))
- [x] T026 [P] [US1] Estender `app/test/cupons.test.mjs` — cupom fora de escopo nos dois sentidos, `ambos` valendo nos dois, precedência de `inativo` sobre `escopo`, e **todos os casos existentes continuando verdes**
- [x] T027 [US1] Atualizar `app/src/app/api/cupom/validar/route.ts` para receber `vertical` (ausente ⇒ `porcelanato`) e recalcular o subtotal pela tabela do vertical certo

### Páginas e carrinho

- [x] T028 [P] [US1] Criar `site-goiania/src/pages/fitas/index.astro` — vitrine dos 3 SKUs, com barra final na URL
- [x] T029 [US1] Criar `site-goiania/src/pages/fitas/[slug].astro` — ficha técnica, imagem, copy comercial, **tabela de faixas visível** (FR-039), mínimo de compra e seletor de rolos. Renderiza **compra direta** (comum, gomada) ou **CTA de orçamento** (personalizada) conforme a modalidade
- [x] T029a [P] [US1] Sinalizar a **modalidade de cada SKU já na vitrine** `site-goiania/src/pages/fitas/index.astro` — comprar direto vs orçamento, sem exigir clique para descobrir (FR-041)
- [x] T030 [US1] Criar `site-goiania/src/pages/carrinho-fitas.astro` — linhas em rolos, unitário que **acompanha a faixa** ao mudar a quantidade, campo de CEP chamando `/api/frete/cotar`, campo de CPF/CNPJ obrigatório. Depende de T001/T002 para cotar de verdade
- [x] T031 [US1] Implementar em `site-goiania/src/components/MiniCart.astro` o aviso de **pedidos separados** ao misturar verticais, preservando os dois carrinhos (FR-028), e somar as duas contagens no badge

### Checkout (caminho de dinheiro)

- [x] T032 [US1] Adicionar o ramo `vertical=fitas` em `app/src/app/api/pedidos/route.ts` conforme [contracts/checkout-pedido-fitas.md](./contracts/checkout-pedido-fitas.md) — itens `{slug, rolos}`, preço da faixa resolvido no servidor, persistência em `ItemPedidoFita`. **O ramo de porcelanato fica byte a byte igual**
- [x] T033 [US1] Implementar as validações do ramo de fitas em `app/src/app/api/pedidos/route.ts`: CPF/CNPJ obrigatório (`?erro=documento`), item sem preço público **rejeitado com erro** (`?erro=item_orcamento`, FR-009), quantidade abaixo do mínimo (`?erro=minimo`), carrinho misto (`?erro=vertical_misto`)
- [x] T034 [US1] Implementar o frete no checkout em `app/src/app/api/pedidos/route.ts` — re-cotar, gravar `frete`/`entrega`/`freteMotivo`, e com `frete=null` cobrar só o produto no Mercado Pago
- [x] T035 [US1] Implementar o alerta de contingência em `app/src/app/api/pedidos/route.ts` — ao gravar `freteMotivo='falha_tecnica'`, contar pedidos de fita recentes com o mesmo motivo e chamar `sendAlert()` de `app/src/lib/email.ts` ao atingir **3 consecutivos**. Nunca alertar em `cep_nao_atendido` (FR-035)
- [x] T036 [US1] Exibir as novas mensagens de erro em `site-goiania/src/pages/carrinho-fitas.astro` para cada `?erro=` do contrato

**Checkpoint**: US1 funcional — dá para vender fita de ponta a ponta. **Este é o MVP.**

---

## Phase 4: User Story 3 — Fitas assume a home sem derrubar a malha (P1)

**Goal**: o site se identifica como loja de fitas, sem que nenhuma URL de porcelanato mude ou perca links.

**Independent Test**: publicar e verificar que toda URL de porcelanato responde igual, que os links internos da malha continuam presentes e que as rotas de fitas aparecem nos 4 índices.

- [x] T037 [US3] Reposicionar `site-goiania/src/pages/index.astro` — `<title>`, `<h1>` e JSON-LD identificando **loja de fitas adesivas**; porcelanato como vertical secundário com link para `/porcelanato/` (FR-025)
- [x] T038 [US3] Ajustar o JSON-LD em `site-goiania/src/pages/index.astro` — cobertura **nacional** para fitas e **regional** para porcelanato, sem afirmar cobertura falsa (FR-025)
- [x] T039 [US3] Auditar as páginas de fitas garantindo **zero sinal geográfico local** (sem "Goiânia" em título, `h1`, copy ou `areaServed`) — FR-031
- [x] T040 [P] [US3] Registrar as rotas de fitas em `site-goiania/src/pages/sitemap.xml.ts`, todas **com barra final**
- [x] T041 [P] [US3] Registrar o vertical de fitas em `site-goiania/src/pages/llms.txt.ts`
- [x] T042 [P] [US3] Adicionar os SKUs de fita em `site-goiania/src/pages/busca-index.json.ts`
- [x] T043 [P] [US3] Adicionar link para `/fitas/` no rodapé em `site-goiania/src/components/Footer.astro`
- [x] T044 [US3] Incluir em `site-goiania/src/pages/feed.xml.ts` **apenas** SKUs de fita com preço público (FR-024)
- [x] T045 [US3] Ajustar `site-goiania/src/scripts/check-feed.mjs` para tolerar SKU só-orçamento **por design**, sem falhar o build por preço ausente (FR-024)
- [ ] T046 [US3] Registrar **baseline no GSC** (posição e impressões da home e das 41 páginas) **antes** de publicar o reposicionamento — sem baseline não há como avaliar o efeito
- [x] T046a [P] [US3] Adicionar em `site-goiania/src/pages/fitas/[slug].astro` link para a página correspondente no institucional (`tapepro.roilabs.com.br`) como autoridade de marca (FR-033)
- [x] T046b [US3] Registrar em `handoff.md` a pendência **FR-033b** — o link inverso (institucional → e-commerce) vive no repo `ROI Labs/Tapepro/` e é **entrega separada**. Sem ela, o cruzamento fica pela metade

**Checkpoint**: fitas lidera o SEO, malha de porcelanato intacta.

---

## Phase 5: User Story 2 — Orçamento para personalizado ou volume (P2)

**Goal**: SKU sem preço público oferece caminho explícito de orçamento, em vez de página sem saída.

**Independent Test**: abrir um SKU só-orçamento, enviar a solicitação com contato e especificação, e confirmar que chegou ao operador — sem carrinho e sem cobrança.

> ⬆️ **Prioridade real subiu.** Desde a quarta rodada de clarificação, a personalizada — **produto de maior margem do Tapepro** — é só-orçamento. Esta fase deixou de ser acessória: sem ela o SKU mais rentável não tem caminho de conversão.

- [x] T047 [US2] Renderizar em `site-goiania/src/pages/fitas/[slug].astro` o caminho de **solicitação de orçamento** no lugar do botão de compra quando `modalidade === 'orcamento'` — nunca preço vazio ou zerado (FR-005)
- [x] T047a [US2] Exibir na página da personalizada a **tabela de faixas como informação** e o custo de clichê ("a partir de R$ 80,00") como referência, deixando claro que o valor final sai no orçamento (FR-040)
- [x] T048 [US2] Criar o formulário de orçamento de fitas em `site-goiania/src/pages/fitas/[slug].astro` reusando o padrão de `orcamento.astro` (POST para `PUBLIC_APP_URL`, honeypot, consentimento LGPD)
- [x] T049 [US2] Garantir em `app/src/app/api/leads-consumidor/route.ts` que a solicitação registre a especificação e o SKU de origem, visível ao operador

**Checkpoint**: modelo híbrido completo — preço público e orçamento coexistem.

---

## Phase 6: User Story 4 — Operar o catálogo de fitas (P3)

**Goal**: operador distingue pedidos por vertical, vê rolos e documento, e repassa ao Tapepro.

**Independent Test**: após pedido de fita pago, ver o vertical e a quantidade em rolos no admin e gerar o negócio originado a partir dali.

- [x] T050 [US4] Exibir a coluna **vertical** e as quantidades na unidade correta de cada um na listagem de pedidos do admin em `app/src/app/admin/`
- [x] T051 [US4] Exibir o **motivo do frete** (`cep_nao_atendido` / `falha_tecnica`) nos pedidos em "a combinar" no admin em `app/src/app/admin/`
- [x] T052 [US4] Adicionar o seletor de **escopo** na criação/edição de cupom em `app/src/app/admin/cupons/`, com default do formulário em `porcelanato` (default seguro é o restritivo)

### Centro de Custo — ativar a linha 'fitas adesivas' (FR-012)

> Hoje `app/src/app/admin/centros-de-custo/page.tsx` itera **só** `listarProdutos()` de `precos.ts` (porcelanato). SKU de fita nunca aparece na tela, logo a linha 'fitas adesivas' continuaria inerte — contrariando o gatilho de negócio declarado na spec.

- [x] T052a [US4] Estender `app/src/app/admin/centros-de-custo/page.tsx` para listar também os SKUs de fita, lendo de `precos-fitas.ts` além de `listarProdutos()`
- [x] T052b [US4] Usar o **menor unitário** (última faixa) como preço representativo de cada SKU de fita ao chamar `resolverPiso`/`calcIntermediacao`/`calcWL` em `app/src/app/admin/centros-de-custo/page.tsx` — é onde a margem morre; a primeira faixa esconderia prejuízo no pedido de volume. Exibir na linha **qual faixa** foi usada, para o operador saber sobre o que a simulação foi feita
- [ ] T052c [US4] Vincular os SKUs de fita à linha de Centro de Custo **'fitas adesivas'** já existente e confirmar que ela sai da inércia (FR-012)

**Checkpoint**: todas as histórias funcionais e a linha de Centro de Custo ativa.

---

## Phase 7: Polish & Cross-Cutting

- [x] T053 [P] Rodar todos os self-checks: `precos-fitas`, `frete-fitas`, `cupons`, `success-fee` (deve continuar verde **sem alteração** — prova do FR-003), `check-cart-math`, `check-matrix`
- [ ] T054 Executar o roteiro completo de [quickstart.md](./quickstart.md) — E2E com **pedido pago real** em produção (Constituição II)
- [ ] T055 Validar contingência de frete nas **duas** causas em produção e confirmar recebimento do e-mail de alerta (FR-035)
- [ ] T056 [P] Verificar SEO em produção: 41 URLs de porcelanato respondendo igual, barra final com `https`, 404 real, 4 índices atualizados
- [ ] T057 Trocar `MELHOR_ENVIO_BASE_URL` para produção e conferir uma cotação real contra o valor esperado
- [x] T058 Escrever `specs/011-ecommerce-fitas-tapepro/handoff.md` (feito / decisões / pendências / gotchas) e fazer commit + push (Constituição V)
- [ ] T059 Atualizar o card correspondente em `roihub/data/projects.json` se houver um apontando para esta entrega

---

## Dependencies & Execution Order

### Fases

- **Phase 1 (Setup)**: sem dependências. **T001–T004 dependem de terceiros** — começar por elas.
- **Phase 2 (Foundational)**: depende da Phase 1. **BLOQUEIA todas as user stories.** Dentro dela, a ordem T006→T007→T008→T009→T010 é **rígida**.
- **Phase 3 (US1)**: depende da Phase 2. É o MVP.
- **Phase 4 (US3)**: depende da Phase 2. Pode correr em paralelo com a US1 (arquivos diferentes), mas **T046 antes de publicar** T037.
- **Phase 5 (US2)**: depende de T029 (página de produto existir).
- **Phase 6 (US4)**: depende da Phase 2; T052 depende de T025.
- **Phase 7**: depende de tudo que se quer entregar.

### Ordem crítica do banco

```
T006 (schema) → T007 (preview) → T008 (db push) → T009+T010 (backfill) → push do código
```

> ⛔ Fazer o push do código antes do `db push` derruba produção: o código consulta coluna que não existe. Mesmo gotcha registrado na 010.

### Dependências pontuais

- T012 depende de **T003** (fronteiras de faixa) e **T002** (peso/dimensões)
- T030 depende de **T001** (token) para cotar de verdade
- T019 depende de T011/T012 (precisa da função de faixa)
- T032–T035 dependem de T011, T020–T023
- T045 depende de T044
- T052 depende de T025
- **T052a/b/c dependem de T012** (precisam de `precos-fitas.ts` preenchido) — cobrem o FR-012, que estava sem tarefa
- T046a depende de T029

### Paralelismo

- **Phase 1**: T002, T003, T004 em paralelo (T001 primeiro, é o de maior lead time)
- **Phase 2**: T011, T014, T015, T017 em paralelo — arquivos distintos
- **Phase 3**: T020+T021 (frete) e T025+T026 (cupom) são trilhas independentes; T028 em paralelo com ambas
- **Phase 4**: T040–T043 em paralelo — os 4 índices são arquivos diferentes
- **US1 e US3** podem ser tocadas por pessoas diferentes após a Phase 2

---

## Parallel Example: Phase 2

```bash
# Após o banco migrado (T010), quatro trilhas independentes:
Task: "Criar app/src/lib/precos-fitas.ts com precoPorQuantidade (T011)"
Task: "Criar site-goiania/src/data/fitas.ts com os 3 SKUs (T014)"
Task: "Copiar imagens para site-goiania/src/assets/fitas/ (T015)"
Task: "Criar site-goiania/src/lib/cart-fitas.ts (T017)"
```

## Parallel Example: Phase 4 (os 4 índices)

```bash
Task: "Registrar rotas de fitas em sitemap.xml.ts (T040)"
Task: "Registrar vertical em llms.txt.ts (T041)"
Task: "Adicionar SKUs em busca-index.json.ts (T042)"
Task: "Link /fitas/ no rodapé em components/Footer.astro (T043)"
```

---

## Implementation Strategy

### MVP (US1)

1. Phase 1 → Phase 2 → Phase 3
2. **PARAR e VALIDAR**: pedido pago real de fita, com frete e CNPJ
3. Nesse ponto a cadeira do Tapepro já fatura — a linha 'fitas adesivas' do Centro de Custo sai da inércia

### Entrega incremental

1. Setup + Foundational → base pronta
2. **US1** → vender fita (MVP, receita)
3. **US3** → SEO de fitas assume a home (o motivo estratégico da feature)
4. **US2** → orçamento fecha o modelo híbrido
5. **US4** → operação mais confortável

### Publicação

US1 **pode ser construída e testada** com os preços reais já disponíveis. O que ainda falta para publicar é **peso e dimensões** (T002) — sem eles a cotação não roda. Se o Tapepro demorar, dá para seguir até T029 e parar antes de T030.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência pendente
- Commit por tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a história isoladamente
- **Nenhuma tarefa edita o caminho de dinheiro de porcelanato** — se parecer necessário, a abordagem está errada
- Build local não prova nada neste repo (OneDrive corrompe `node_modules`): verificação real é Docker/EasyPanel ou navegador em produção
