# Research & Decisions: Success fee com duas taxas

Fonte: `spec.md` (010) + código da camada 007 (`success-fee.ts`, `negocios/route.ts`, `faturas/route.ts`, `parceiros/`). Nenhum NEEDS CLARIFICATION restante no spec; as decisões abaixo resolvem os detalhes de algoritmo deixados para o plano.

## D1 — Onde e como guardar as duas taxas

- **Decisão**: Adicionar `comissaoAquisicao` e `comissaoRecorrencia` (Decimal(6,4), fração [0,1]) ao `Parceiro`. Manter `comissaoPct` como coluna **deprecada** (não dropar), parar de lê-la no código.
- **Rationale**: Dropar coluna com dado em prod via `db push` é risco desnecessário (Const. III); manter deprecada é reversível e barato. Backfill copia `comissaoPct` para as duas.
- **Alternativas**: (a) Dropar `comissaoPct` — rejeitado (risco em prod, sem ganho). (b) Uma tabela de taxas por tipo — over-engineering para 2 taxas (Const. III). `ponytail: comissaoPct deprecada; dropar num db push futuro se incomodar.`

## D2 — Snapshot por negócio (Q2: congelar na criação)

- **Decisão**: Adicionar ao `NegocioOriginado`: `clienteDoc` (String?, CPF/CNPJ normalizado), `classificacao` (String: `aquisicao`|`recorrencia`|`legado`), `taxaAplicada` (Decimal(6,4)). Preenchidos no **POST /api/negocios** (criação), nunca reescritos depois.
- **Rationale**: Espelha o padrão de `ItemPedido` da 007 (snapshot de piso/comissão/alíquotas ao virar 'pago'). Auditável: a fatura é reconstituível exatamente como foi cobrada; mudar as taxas do parceiro depois não afeta negócios já criados (FR-005).
- **Alternativas**: Snapshot no faturamento — rejeitado pela clarificação Q2 (mexeria retroativamente na competência aberta).

## D3 — Algoritmo de classificação (aquisição vs recorrência)

- **Decisão** (executado na criação do negócio, função pura `classificar-negocio.ts`):
  1. Normalizar o `compradorDoc` do Pedido (só dígitos).
  2. Se **vazio** → `aquisicao`.
  3. Se preenchido → procurar um `NegocioOriginado` **anterior** (`createdAt <` ou mesmo pedido mais antigo) do **mesmo parceiro** cujo `clienteDoc` == este doc **e** que **não esteja perdido** (`estagio != 'perdido'` e pedido não reembolsado). Achou → `recorrencia`; não achou → `aquisicao`.
  4. `taxaAplicada` = `comissaoAquisicao` se aquisição, senão `comissaoRecorrencia`.
- **Rationale**: Determinístico na criação (honra Q2). Usar "negócios anteriores não-perdidos" (em vez de só `ganho`) resolve o caso de concorrência: o 1º negócio criado do cliente é a aquisição, os seguintes são recorrência, mesmo antes de o 1º virar `ganho`.
- **Tie-break / reconciliação com FR-008** (só-ganhos reabrem a aquisição): FR-008 diz que se o negócio inaugural for perdido/estornado, o próximo volta a ser aquisição. Com snapshot congelado na criação (Q2), isso vale para negócios criados **após** a perda: quando o próximo negócio nasce, o inaugural já está `perdido` → não conta → o novo é aquisição. Para negócios já criados antes da perda, o snapshot manda (Q2 vence). `ponytail: reconciliação Q2-vence-sobre-FR008 para o caso raro de concorrência; re-avaliar no ganho/perda só se o negócio virar dinheiro relevante.`
- **Alternativas**: Re-avaliar a classificação a cada transição de estágio (ganho/perdido) — rejeitado: contradiz "congelar na criação" e adiciona lógica no caminho de transição.

## D4 — Cálculo da fatura (soma por negócio)

- **Decisão**: `calcularFaturaMensal` deixa de receber `comissaoPct` único; passa a somar por negócio: `valor = Σ money(negócio.valor × negócio.taxaAplicada)`. `NegocioCalc` ganha `taxaAplicada`. `base` continua `Σ valor` (para exibição). Arredondamento `money()` **por negócio** antes de somar (evita drift de centavos e casa com o breakdown do demonstrativo).
- **Rationale**: FR-004 exige soma por negócio, não taxa única sobre o total. Arredondar por negócio garante que o total confere com a soma exibida (SC-002, zero discrepância).
- **Alternativas**: `base × taxa média` — rejeitado (não auditável, não é a regra).

## D5 — Novo campo no Pedido + captura

- **Decisão**: Adicionar `compradorDoc` (String?) ao `Pedido`. Capturar no checkout do `site-goiania` como campo **opcional** (B2C, sem fricção — clarificação Q1). Normalizar/validar (CPF ou CNPJ) no servidor ao criar o Pedido. O fluxo B2B/orçamento (obrigatório) ainda não existe → fica documentado para o e-commerce de fitas futuro.
- **Rationale**: A identidade escolhida é CPF/CNPJ (spec FR-003), mas o Pedido não a coleta hoje. Opcional no B2C evita fricção e não prejudica classificação porque os parceiros B2C estão com as duas taxas iguais (FR-006).
- **Alternativas**: whatsapp como chave — rejeitado na clarificação (menos correto p/ B2B). Tornar obrigatório no B2C — rejeitado na Q1 (fricção).

## D6 — Migração / compatibilidade (FR-006)

- **Decisão**: Script `scripts/migrate-010-backfill.mjs` (idempotente, roda MANUAL após `prisma db push`):
  1. Para cada parceiro com `comissaoAquisicao` NULL: setar `comissaoAquisicao = comissaoRecorrencia = comissaoPct` (a taxa antiga).
  2. Para cada `NegocioOriginado` ainda **não faturado** (`faturaId = null`) sem `taxaAplicada`: setar `taxaAplicada = comissaoPct` do parceiro, `classificacao = 'legado'`, `clienteDoc` = doc do pedido se houver.
  3. Negócios já faturados e faturas emitidas: **não tocar** (valores congelados na `FaturaSuccessFee`).
- **Rationale**: Garante que nenhuma fatura muda de valor (FR-006/SC-004). `legado` marca os negócios anteriores à feature para auditoria.
- **Alternativas**: Default global 15/10 no backfill — rejeitado (mudaria o valor de parceiros existentes que não são fitas).

## D7 — Validação das taxas (FR-010)

- **Decisão**: Ambas as taxas validadas em [0,1] na API (como hoje) e no form. Ao **ativar/faturar**, exigir as **duas** taxas (hoje exige `comissaoPct`). O placeholder do form deixa explícito "fração 0–1 (ex.: 0.15 = 15%)".
- **Rationale**: Evita o erro que aconteceu (digitar `1` = 100%). Caminho de dinheiro pede barreira explícita.

## Referências de código (camada 007)

- `app/src/lib/success-fee.ts` — função pura a estender.
- `app/src/app/api/negocios/route.ts` (POST) — ponto do snapshot.
- `app/src/app/api/faturas/route.ts` (POST) — validação + cálculo + Asaas.
- `app/src/app/admin/parceiros/parceiros-form.tsx` + `[id]/demonstrativo/page.tsx` — UI.
- Padrão de snapshot: `ItemPedido.*Snapshot` em `prisma/schema.prisma`.
