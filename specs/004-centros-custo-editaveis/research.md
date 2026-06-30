# Research — Centros de custo editáveis (Fase 0)

Decisões que resolvem as incógnitas do Technical Context. Formato: Decisão / Razão /
Alternativas. Tudo dentro do `/app` Next 16 + Postgres `roilabs_db` existentes.

## D1 — Forma de persistência dos parâmetros

**Decisão:** **2 tabelas**. `parametro_centro_custo` guarda as camadas `global` e `linha`
(uma linha por escopo); `sku_config` guarda, por SKU, o piso, a modalidade-alvo e os
overrides de parâmetro. Campos de parâmetro são **nullable** = "herda a camada de cima".

**Razão:** a feature exige edição **sem deploy** (FR-001/SC-001) ⇒ precisa persistir fora
do código. Exige 3 camadas (`SKU > linha > global`, clarify) ⇒ precisa de um escopo. Duas
tabelas separam o que é "config de parâmetro" (global/linha) do que é "dado do produto"
(piso/modalidade/override por SKU), sem uma tabela genérica chave-valor que perderia
tipo. `global` é uma linha singleton (`escopo='global'`, `chave=NULL`).

**Alternativas:** (a) tabela única chave-valor — rejeitada: perde tipagem e validação por
campo; (b) arquivo JSON versionado em disco — rejeitada: editar exigiria deploy/permissão
de FS no container standalone; (c) 3+ tabelas (linha própria, override próprio, piso
próprio) — rejeitada: `sku_config` agrega os três dados por-SKU num registro, menos joins.
`// ponytail: nullable-herda em vez de tabela de regras; vira engine de regras só se as camadas passarem de 3.`

## D2 — Onde e o que congelar no snapshot

**Decisão:** congelar **por item**, em `itens_pedido`, no momento em que o pedido vira
`pago`: `piso_snapshot`, `modalidade_snapshot`, `comissao_snapshot`,
`aliq_intermediacao_snapshot`, `aliq_wl_snapshot` (todas **nullable**). O agregado real
**reapura** cada item pago via `calcIntermediacao`/`calcWL` usando esses snapshots.

**Razão:** os parâmetros podem variar por SKU (camadas) ⇒ o snapshot honesto é
**por item**, não por pedido. Congelar o **piso** (não o markup) basta para o custo, já
resolvido. Reapurar pela mesma fórmula (em vez de congelar o valor líquido) mantém uma só
fonte de cálculo e sobrevive a um bugfix de fórmula sem reescrever números. Espelha o
snapshot de `preco_m2` já feito na 002 (mesma tabela). Colunas nullable ⇒ migração
**aditiva**, não destrutiva (Assumptions da spec).

**Alternativas:** (a) congelar o líquido pronto (`liquido_wl`, `liquido_interm`) —
rejeitada: duplica a fórmula e trava correções; (b) snapshot por pedido — rejeitada: não
captura variação por SKU; (c) tabela de snapshot separada — rejeitada: 1-para-1 com o
item, colunas no próprio `itens_pedido` são mais simples.

**Ponto de gravação:** `app/src/app/api/pagamentos/webhook/route.ts` é onde
`status_pagamento` vira `pago` (idempotente via `mp_payment_id`). O snapshot é gravado na
mesma transação. Pedidos pagos **antes** desta feature ficam com snapshot `NULL` →
agregado os trata com parâmetros vigentes e os marca "sem snapshot" (FR-012/edge case).

## D3 — Defaults e seed

**Decisão:** o resolvedor lê o `global` do DB; **se ausente, cai no `PARAMS`** já em
`centros-custo.ts` (defaults dos docs). O `seed.ts` faz **upsert idempotente** do `global`
com esses mesmos defaults, para a operação ter uma linha editável.

**Razão:** FR-004 exige reproduzir a âncora com defaults mesmo num banco vazio — o
fallback ao `PARAMS` garante isso sem depender do seed ter rodado. O seed materializa o
`global` para edição (a UI precisa de um registro para editar). Idempotente = seguro
re-rodar (padrão do projeto, como as cadeiras).

**Alternativas:** exigir seed antes de funcionar — rejeitada: quebraria a página num
banco novo; defaults só no seed (sem fallback) — rejeitada: frágil.

## D4 — Valores dos presets de cenário

**Decisão:** mapa fixo em código `CENARIOS` (Conservador/Base/Otimista), valores de
`Docs/Obsidian/60-legal-fin/projecao-financeira.md`. Aplicar um preset **preenche** as
alíquotas; ajuste manual depois **prevalece** (FR-013).

| Cenário | aliq. Intermediação (Anexo III s/ serviço) | aliq. WL (Anexo I s/ GMV, pós-ST) |
|---|---|---|
| Conservador | 6,0% | ~4,6% |
| **Base** (default) | **10,2%** | **6,2%** |
| Otimista | 12,7% | ~7,8% |

**Razão:** os percentuais já estão decididos nos docs; um mapa em código evita decorar e
conecta a edição ao modelo fiscal. WL pós-ST ≈ ⅔ do nominal do Anexo I (nota da
`projecao-financeira`). São **editáveis** — o contador confirma o número final por faixa
de RBT12.

**Alternativas:** derivar a faixa do RBT12 real automaticamente — Out of Scope (spec);
presets em DB — YAGNI (valores estáveis dos docs, raramente mudam).

## D5 — Regra de resolução e herança

**Decisão:** funções puras em `centros-custo.ts`:
`resolverParametros(slug) → Parametros` combina, **campo a campo**, o primeiro valor
não-nulo em `[sku_config(slug), linha(sku_config.linha), global]`, caindo em `PARAMS` se o
global faltar. `resolverPiso(slug, varejo)` = `sku_config.piso ?? atacadoDe(varejo,
markupResolvido)`. `resolverModalidade(slug)` = `sku_config.modalidade ?? 'intermediacao'`.
As fórmulas `calcIntermediacao`/`calcWL` recebem os valores resolvidos — **inalteradas**
(FR-016).

**Razão:** herança por campo (não por registro inteiro) permite, ex., uma linha sobrepor
só o markup e herdar as alíquotas do global. Função pura = testável sem DB (o teste injeta
as 3 camadas). Mantém a fórmula separada da origem dos dados.

**Alternativas:** herança "tudo-ou-nada" por camada — rejeitada: forçaria reescrever todos
os campos numa linha; resolver dentro do componente React — rejeitada: lógica de dinheiro
fica fora do alcance do self-check.

## D6 — Superfície de edição (UI + rotas)

**Decisão:** 2 rotas REST autenticadas no padrão do projeto —
`PATCH /api/centros-custo/parametros` (global e linhas) e
`PATCH /api/centros-custo/sku/[slug]` (piso/modalidade/override). A página
`/admin/centros-de-custo` (server, `force-dynamic`) ganha 2 islands client
(`parametros-form`, `sku-row`) que chamam essas rotas e dão refresh. Auth por
`getAuthFromRequest()`/sessão (FR-005); **validação de faixa server-side** em cada PATCH
(FR-003): markup ≥ 0; comissão/alíquotas em [0,1]; recusa com 4xx + motivo, sem gravar.

**Razão:** espelha o que já existe (`/api/cadeiras/[id]`, `/api/candidaturas/[id]` com
PATCH protegido + islands como `seat-row`/`pedido-row`). Sem libs de form/zod (validação
de 4 números é trivial — Constituição III). `[slug]` segue o pattern `params: Promise<…>`.

**Alternativas:** Server Actions — viável, mas o projeto padronizou rotas API + islands;
manter o padrão reduz superfície nova. Form que posta urlencoded 303 (como candidaturas) —
rejeitado: aqui é edição autenticada com feedback inline, JSON PATCH encaixa melhor.

## D7 — As duas leituras do agregado

**Decisão:** sobre os itens de pedidos **pagos**, a página calcula:
- **Real (por modalidade oficial):** cada item no centro da sua `modalidade_snapshot`
  (ou `resolverModalidade(slug)` se sem snapshot) → soma `Centro WL` e `Centro
  Intermediação`.
- **Referência (hipotético):** o comportamento atual — "se tudo Intermediação" vs "se
  tudo WL" — somando todos os itens nos dois centros.

Ambas rotuladas; SKU sem modalidade → Intermediação (edge case). Itens sem snapshot usam
parâmetros vigentes e são sinalizados.

**Razão:** clarify pediu **ambos**. A leitura real dá o resultado contábil por centro; a
hipotética mantém o comparativo "qual modalidade renderia mais" que já existia. Reusa as
mesmas funções `calc*`.

**Alternativas:** só real — perde o comparativo decisório; só hipotético — não é "centro
de custo" no sentido contábil (clarify rejeitou ambos isolados).
