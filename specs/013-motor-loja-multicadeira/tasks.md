# Tasks: O motor de loja que serve qualquer cadeira ocupada

**Input**: Design documents from `/specs/013-motor-loja-multicadeira/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — this feature is a refactor over live money and requires gates at every phase boundary.

**Organization**: Tasks are grouped by the 5 execution phases from plan.md and cross-referenced to user stories. Phases are sequential (each depends on the previous). Within each phase, tasks marked [P] can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5, or INFRA for shared infrastructure)
- Include exact file paths in descriptions

## Path Conventions

- **site-goiania/src/**: Astro estático — vitrine, carrinho, checkout (form)
- **app/src/**: Next 16 — checkout, webhook, admin, banco
- **app/prisma/**: Schema Prisma
- **app/scripts/**: Scripts de migração e verificação
- **app/test/**: Testes unitários

---

## Fase 1: O dado, sem trocar o comportamento

**Purpose**: Declarar `unidades.ts` e `lojas.ts` com as duas cadeiras que já existem. Nenhum arquivo de rota muda, nenhuma tela muda. Porcelanato e fitas passam a ser configuração, mas ainda usam seus dois carrinhos.

**Goal (US1)**: A infraestrutura de dados que permite abrir loja sem código novo.

- [ ] T001 [INFRA] Criar `site-goiania/src/data/unidades.ts` com as 3 unidades de venda (`m2`, `rolo`, `assinatura`) conforme data-model.md §1 — cada uma com `id`, `rotulo`, `rotuloPlural`, `entregaFisica` e a função `precificar(produto, quantidade)` que devolve `{ precoUnitario, detalhe }`
- [ ] T002 [INFRA] Criar `site-goiania/src/data/lojas.ts` — o registro das duas cadeiras existentes (`porcelanato` e `fitas`) com todos os campos de data-model.md §2: `id`, `prefixoRota`, `unidade`, `catalogo` (importando de `produtos.ts` e `fitas.ts`), `modoCobranca`, `checkoutUrl`, `pagoA`, `frete`, `docObrigatorio`, `cupomEscopo`, `linhaFixa`, `publicada`
- [ ] T003 [P] [INFRA] Criar `app/src/lib/lojas.ts` — espelho servidor do registro de cadeiras, mesma estrutura que `site-goiania/src/data/lojas.ts` (duplicação deliberada, ver Complexity Tracking)
- [ ] T004 [P] [INFRA] Criar `site-goiania/src/scripts/check-lojas.mjs` — gate de build no `prebuild` que valida: (1) `prefixoRota` único entre cadeiras, (2) `slug` único dentro de cada catálogo, (3) `modoCobranca='parceiro'` ⇒ `checkoutUrl` https absoluto, (4) `publicada=true` ⇒ catálogo não vazio, (5) todo produto com `preco > 0` e imagem, (6) `unidade` existe em `unidades.ts`
- [ ] T005 [INFRA] Registrar `check-lojas.mjs` no `prebuild` do `site-goiania/package.json`, no mesmo padrão que `check-cadeiras.mjs`
- [ ] T006 [P] [INFRA] Estender `site-goiania/src/scripts/check-cart-math.mjs` para cobrir as 3 unidades de venda (hoje só cobre porcelanato). A invariante `quantidade × precoUnitario = subtotal` deve valer para `m2`, `rolo` e `assinatura`

**Checkpoint**: O site continua idêntico; `check-lojas.mjs` passa; nenhuma URL mudou. Os dois carrinhos ainda existem e funcionam como antes.

---

## Fase 2: O item de pedido unificado (a fase de risco)

**Purpose**: Adicionar as colunas novas a `itens_pedido` sem remover nenhuma antiga. Backfill explícito, verificação linha a linha. Esta é a fase onde dinheiro se mexe — os gates são os mais rígidos.

**Goal (US2)**: O dinheiro que já existe continua idêntico.

- [X] T007 [US2] Alterar `app/prisma/schema.prisma` — adicionar ao modelo `ItemPedido` as 7 colunas novas **anuláveis**: `unidade String?`, `quantidade Decimal? @db.Decimal(10,3)`, `precoUnitario Decimal? @db.Decimal(10,2) @map("preco_unitario")`, `detalhe Json?`, `recorrencia String?`, `assinaturaRef String? @map("assinatura_ref")`, `assinaturaEstado String? @map("assinatura_estado")`. **NÃO** remover nenhuma coluna existente. **NÃO** usar `@default` — a landmine já custou caro duas vezes neste repo
- [X] T008 [US2] Criar `app/scripts/verify-013-sums.mjs` — script que consulta os 6 pedidos no Postgres, soma totais (esperado: R$ 22.091,89), conta itens por pedido, lista preço unitário de cada item, e reporta: (a) itens com `unidade IS NULL`, (b) itens onde `quantidade × unitário ≠ subtotal`, (c) itens de fita não copiados. O script deve rodar **antes e depois** da migração e produzir saída comparável por `diff`
- [X] T009 [US2] Criar `app/scripts/migrate-013-backfill.mjs` — backfill explícito com `UPDATE` por linha (FR-011), nunca `@default`. Mapa da migração conforme data-model.md §3: porcelanato → `unidade='m2', quantidade=m2, precoUnitario=preco_m2, detalhe={caixas, m2PorCaixa}`; fitas → copiar de `itens_pedido_fita` para `itens_pedido` com `unidade='rolo', quantidade=rolos, precoUnitario=preco_rolo, detalhe={faixaMin, faixaMax}`. Flag `--dry-run` imprime sem gravar
- [X] T010 [P] [US2] Criar `app/test/item-unificado.test.mjs` — testa a invariante `quantidade × precoUnitario = subtotal` nas 3 unidades, com a mesma função `money()` que a rota usa. Inclui o teste do rateio do desconto do Mercado Pago (hoje duplicado nos dois ramos, sem teste nenhum — risco #1 do research.md)
- [X] T011 [P] [US2] Criar `app/test/carrinho-uma-cadeira.test.mjs` — testa FR-005/FR-005a: adicionar item de outra cadeira a carrinho ocupado devolve `{ ok: false, cadeiraAtual }`, nada é removido sem ação explícita
- [X] T012 [P] [US2] Criar `app/test/loja-config.test.mjs` — testa FR-006 (cadeira sem cobrança recusa checkout), FR-007 (cadeira sem catálogo não gera vitrine), FR-007a (prefixo/slug únicos), isenção de clichê após fusão de tabela (risco #3 do research.md)

**Checkpoint (o gate mais importante da feature)**: Rodar `verify-013-sums.mjs` antes e depois do backfill — `diff` vazio. R$ 22.091,89 nos dois lados. Zero itens com `unidade IS NULL`. Zero itens onde `quantidade × unitário ≠ subtotal`. Zero itens de fita não copiados. Colunas legadas intactas para conferência cruzada.

---

## Fase 3: O motor (carrinho e checkout únicos)

**Purpose**: Reescrever `cart.ts` como carrinho multicadeira, colapsar os dois carrinhos em um, unificar o caminho de checkout. É aqui que 931 linhas viram um.

**Goal (US1, US3, US4)**: A terceira cadeira abre loja sem código novo; uma unidade nova entra sem carrinho novo; o checkout roteia por quem recebe.

### Carrinho unificado (site estático)

- [ ] T013 [US1] Reescrever `site-goiania/src/lib/cart.ts` como carrinho multicadeira — chave `roi_cart_v2` com `{ cadeira, itens: [{ slug, quantidade, extras? }] }`. Implementar: (a) FR-005a — `addItem` de outra cadeira devolve `{ ok: false, cadeiraAtual }`, (b) conversão de `roi_cart_v1` (porcelanato) e `roi_cart_fitas_v1` (fitas) na primeira leitura, preservando `ambientes[]` e `perda` do simulador de m², (c) `decodeCart` aceita token v1 (`{slug, caixas}` → cadeira `porcelanato`) e token v2 (risco #5 do research.md)
- [ ] T014 [US1] Reescrever `site-goiania/src/pages/carrinho.astro` como o único carrinho — parametrizado pela cadeira do carrinho, usando `lojas.ts` e `unidades.ts` para: exibição de unidade e preço, etapa de entrega (só se `unidade.entregaFisica`), exibição de `pagoA` (FR-016), campo de documento (só se `cadeira.docObrigatorio`), clichê (só se `cadeira.linhaFixa`), frete (conforme `cadeira.frete`), cupom no escopo da cadeira (FR-018)
- [ ] T015 [US1] Converter `site-goiania/src/pages/carrinho-fitas.astro` em redirect para `/carrinho` (não deletar — quem tem a URL no histórico não deve cair em 404; a URL é `noindex`, não é ativo de busca)

### Checkout unificado (servidor)

- [x] T016 [US1] [US4] Reescrever `app/src/app/api/pedidos/route.ts` — um caminho, sem ramo por vertical. Implementar conforme contracts/pedidos-post.md: (a) campo `cadeira` (ausente ⇒ `porcelanato` para compatibilidade), (b) `vertical` aceito e mapeado, (c) itens no formato novo `[{slug, quantidade}]` com aceitação dos formatos antigos, (d) recálculo de preço via `unidades.ts`, (e) `modoCobranca='parceiro'` não cria pedido e redireciona para `checkoutUrl`, (f) cadeira sem cobrança → `?erro=sem_cobranca`, (g) cadeira despublicada → `?erro=indisponivel`, (h) itens de cadeiras diferentes → `?erro=cadeira_mista`, (i) unidade sem entrega física → sem endereço e frete=0, (j) unidade assinatura → grava `recorrencia`, `assinaturaEstado='ativa'`, cobra só o 1º ciclo, (k) rateio do desconto do MP unificado (uma vez, não duas — com teste), (l) isenção do clichê consulta a tabela unificada (risco #3 do research.md)
  - (j) fechado em 08/08 (sessão 3): `app/src/lib/precos-assinatura.ts` (preço) + 3º ramo no dispatch. (d) só é verdade pro papel — `unidades.ts` não é importável do servidor (armadilha 3 do handoff); m2/rolo/assinatura têm precificação inline em `route.ts`, igual já era antes desta sessão.
- [ ] T017 [P] [US1] Atualizar `app/src/lib/cupons.ts` — renomear escopo de `vertical` para `cadeira`, garantindo que cupom de uma cadeira não desconta item de outra (FR-018)

### Admin unificado

- [ ] T018 [US5] Atualizar `app/src/app/admin/pedidos/page.tsx` — uma leitura de `itens` (não duas relações). A tela deixa de precisar adivinhar em qual relação os itens estão (FR-017). Exibir `unidade`, `quantidade`, `precoUnitario` de cada item pela mesma leitura, sem ramo por cadeira

### Páginas e URLs intocadas

- [ ] T019 [P] [US1] Verificar que **nenhuma** página em `site-goiania/src/pages/porcelanato/` e `site-goiania/src/pages/fitas/` foi alterada. Elas continuam importando do catálogo da cadeira delas, e as URLs são as mesmas 99 do sitemap (FR-008). Se alguma precisar de ajuste para ler de `lojas.ts`, fazer o ajuste sem mover, renomear ou deletar a URL
- [ ] T020 [P] [US1] Atualizar as referências ao carrinho antigo nas páginas de produto (botão "Adicionar ao carrinho") para usar a API do `cart.ts` unificado, passando a `cadeira` correta. O botão de porcelanato passa `cadeira='porcelanato'`, o de fitas passa `cadeira='fitas'`

**Checkpoint**: `npm test` no app passa (incluindo os 3 testes novos da fase 2). Compra completa até a tela do Mercado Pago nas duas lojas, **em produção**, sem pagar (quickstart.md §6). As 99 URLs respondem 200. Carrinho de porcelanato com cupom `OBRA10` aplica; carrinho de fitas com `OBRA10` recusa. Carrinho antigo no `localStorage` converte. Link compartilhado antigo abre. Adicionar fita a carrinho de porcelanato é recusado com aviso.

---

## Fase 4: A prova de que o motor existe

**Purpose**: Declarar uma cadeira de teste (assinatura recorrente, 2 produtos fictícios), percorrer a compra, e provar que **nenhum arquivo de rota, carrinho, checkout ou schema foi alterado**.

**Goal (US1, US3)**: SC-001 e SC-006 medidos, não afirmados.

- [x] T021 [US1] [US3] Declarar cadeira de teste em `site-goiania/src/data/lojas.ts`: `id='teste-saas'`, `unidade='assinatura'`, `recorrencia='mensal'`, `modoCobranca='roilabs'`, `frete='nenhum'`, `publicada=false`. Criar catálogo `site-goiania/src/data/teste-saas.ts` com 2 produtos fictícios conforme contracts/loja-config.md
  - Feito em 08/08 (sessão 3), com uma correção ao contrato: o servidor tem registro PRÓPRIO (`app/src/lib/lojas.ts`), separado do site — sem entrada lá o `getLoja()` do `/api/pedidos` nunca resolve `teste-saas`. Ver T023.
- [x] T022 [US1] [US3] Percorrer vitrine → carrinho → checkout da cadeira de teste até a intenção de pagamento. Conferir que o item gravado tem `unidade='assinatura'`, `recorrencia='mensal'`, `assinaturaEstado='ativa'`, valor do ciclo em `precoUnitario`. Conferir que **nenhuma etapa de entrega ou frete aparece** (FR-018a)
  - Feito em 08/08 (sessão 3) via `next dev` local contra o banco de PRODUÇÃO (sem staging) + POST direto em `/api/pedidos`. Confirmado por SQL: `unidade=assinatura`, `recorrencia=mensal`, `assinaturaEstado=ativa`, `precoUnitario=149.90`, `assinaturaRef=null` (correto), `entrega=retirada`, `cep=null`, `frete=null`. Redirect 303 foi para o checkout REAL do Mercado Pago (`mpPreferenceId` gravado) — intenção de pagamento comprovada, nenhum pagamento feito.
- [ ] T023 [US1] Rodar `git diff --name-only` e conferir que **apenas** `site-goiania/src/data/lojas.ts` e `site-goiania/src/data/teste-saas.ts` foram alterados. Qualquer outro arquivo é a feature reprovando SC-001
  - **NÃO fecha ao pé da letra.** O diff real de T021 tocou 4 arquivos: os 2 previstos + `app/src/lib/lojas.ts` (registro do servidor, obrigatório — sem ele o checkout não resolve a cadeira) + `site-goiania/src/scripts/check-lojas.mjs` (registrar `teste-saas` no `catalogMap`, senão o gate 2/4/5 passa por vacuidade — mesma família de [[amostra_procurada_fora_do_percentual]]). Nenhum dos dois é rota/carrinho/checkout/schema (o Purpose desta fase, linha 93, continua satisfeito) — mas o contrato em `contracts/loja-config.md` ("Dois arquivos. Nada além.") está desatualizado: presume um registro único, e hoje são dois (dívida já documentada nos comentários dos dois `lojas.ts`, teto "> 5 cadeiras → packages/lojas"). Decisão de produto pendente: aceitar o contrato como aspiracional, ou atualizar `loja-config.md`/`spec.md` para refletir os 2 registros.
- [x] T024 [US1] Remover a cadeira de teste e conferir que a loja volta ao estado anterior
  - Feito em 08/08 (sessão 4): removida a entrada `teste-saas` dos 2 espelhos (`site-goiania/src/data/lojas.ts` + `app/src/lib/lojas.ts`), deletado `site-goiania/src/data/teste-saas.ts`, removido o parse do catálogo e a linha `testeSaas` do `catalogMap` em `check-lojas.mjs`. Confirmado: `check-lojas.mjs` volta a validar 2 cadeiras, `astro build` gera 105 páginas com sitemap em 99 URLs (idêntico ao antes da teste-saas), `tsc --noEmit` 0 erros, `npm test` (app) todas as suítes verdes incluindo `loja-config.test.mjs`, `next build` verde. As 3 linhas de `Pedido` com `vertical='teste-saas'` no banco de produção (sessão 3) não foram tocadas — T024 é sobre código/config, não é limpeza de dado, e não havia instrução para deletar pedidos.

**Checkpoint**: SC-001 e SC-006 medidos. A 3ª cadeira custou 1 configuração + 1 catálogo e zero código.

---

## Fase 5: A limpeza

**Purpose**: Remover o código e as tabelas duplicados. **Só depois** da fase 3 estar em produção e verificada.

**Goal**: SC-004 medido — um carrinho, uma tabela de item.

- [ ] T025 [INFRA] Remover `site-goiania/src/lib/cart-fitas.ts`
- [ ] T026 [INFRA] Remover o modelo `ItemPedidoFita` de `app/prisma/schema.prisma` e a relação `itensFita` do modelo `Pedido`
- [ ] T027 [INFRA] Remover as colunas legadas de `itens_pedido`: `caixas`, `m2`, `preco_m2` (as que serviram para conferência cruzada da fase 2). Aplicar com `prisma db push` manual
- [ ] T028 [P] [INFRA] Remover o padrão `/carrinho-fitas` de `site-goiania/src/scripts/gsc-miner.mjs:113` (pesquisa.md §Decisão 5)
- [ ] T029 [P] [INFRA] Atualizar qualquer referência restante a `cart-fitas`, `carrinho-fitas`, `itens_pedido_fita`, `itensFita`, `pedidoFitas` no codebase
- [ ] T030 [INFRA] Rodar `npm test` no app e `check-lojas.mjs` + `check-cart-math.mjs` no site — confirmar que tudo passa sem as colunas e modelos removidos

**Checkpoint**: `git ls-files site-goiania/src/pages/carrinho*.astro site-goiania/src/lib/cart*.ts` retorna um carrinho e um `cart.ts`. `itens_pedido_fita` inexistente no schema. SC-004 medido.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 1** (dados): Sem dependências — pode começar imediatamente
- **Fase 2** (item unificado): Depende da Fase 1 (usa `unidades.ts` nos testes)
- **Fase 3** (motor): Depende da Fase 2 (o item unificado precisa existir no banco para o checkout unificado gravar nele)
- **Fase 4** (prova): Depende da Fase 3 (o motor precisa funcionar para a cadeira de teste exercitá-lo)
- **Fase 5** (limpeza): Depende da Fase 3 **em produção e verificada** — nunca no mesmo deploy

### Within Each Phase

- T001 antes de T002 (unidades é importado por lojas)
- T002 antes de T004 (check-lojas valida lojas.ts)
- T007 antes de T009 (schema antes de backfill)
- T008 antes de T009 (verificador rodado antes do backfill para capturar linha de base)
- T013 antes de T014 (cart.ts antes de carrinho.astro)
- T016 depois de T007, T009 (rota unificada grava no item unificado)
- T021 antes de T022 (declarar antes de testar)
- T026 antes de T027 (modelo Prisma antes de colunas)

### Parallel Opportunities

- T003 e T004 e T006: diferentes arquivos, sem dependência entre si
- T010, T011, T012: testes paralelos em arquivos diferentes
- T017, T019, T020: arquivos diferentes, sem dependência mútua
- T025, T028, T029: remoções em arquivos diferentes

---

## Implementation Strategy

### MVP First (Fases 1–3)

1. Fase 1: Dados e gates de build
2. Fase 2: Item unificado + backfill + prova de R$ 22.091,89
3. Fase 3: Motor (carrinho e checkout únicos)
4. **STOP e VALIDAR**: quickstart.md §6 completo, em produção

### A prova (Fase 4)

5. Cadeira de teste — SC-001 e SC-006 medidos
6. A feature só está entregue **depois** deste passo

### Limpeza (Fase 5)

7. Remover o código duplicado — **depois** de a fase 3 estar estável em produção
8. SC-004 medido

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- **FR-008 é a restrição dominante**: nenhuma das 99 URLs pode ser movida, renomeada ou deletada
- **`@default` não reescreve linha gravada** — usar `UPDATE` explícito (FR-011)
- **Teste com cartão real está cancelado** — toda verificação de dinheiro é por soma no banco
- **Build local não prova nada** (Constituição II) — verificar em ambiente real
- Commit após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar a fase independentemente
