# Phase 0 — Research: Camada Parceiro

Sem `NEEDS CLARIFICATION` remanescentes (clarify fechou base/origem do %, gatilho, período). Decisões técnicas:

## D1 — Três entidades separadas (Parceiro / NegocioOriginado / FaturaSuccessFee)

**Decision**: modelar as três como tabelas distintas (ver data-model.md), não colapsar.

**Rationale**: são conceitos com ciclos de vida próprios — parceiro (sondagem→ativa→contrato), negócio (repassado→ganho/perdido, faturável×isento), fatura (emitida→paga). Um negócio referencia um `Pedido` e um `Parceiro`; uma fatura agrega N negócios. Colapsar geraria colunas nuláveis e regras ambíguas.

**Alternatives rejected**: guardar o parceiro como um campo em `Cadeira` (não comporta sondagem/vários candidatos por cadeira); guardar o negócio como flag em `Pedido` (perde histórico de estágio e o vínculo com a fatura).

## D2 — Cálculo do fee como função pura testável

**Decision**: `lib/success-fee.ts` com `calcularFaturaMensal(comissaoPct, negocios)` puro: recebe o % do parceiro e a lista de negócios já filtráveis (`{ valor, estagio, faturavel, pedidoReembolsado }`), seleciona **ganho + faturável + não reembolsado**, e devolve `{ base, valor, negocioIds }`. Sem Prisma, sem Asaas.

**Rationale**: dinheiro → exige teste `tsx` confiável (Const. II), espelhando `centros-custo.ts`/`financeiro.ts`. A rota `faturas` faz a leitura do DB, chama a função pura e então emite no Asaas.

## D3 — Integração Asaas via REST + webhook (espelha Mercado Pago)

**Decision**: `lib/asaas.ts` com `fetch` (sem SDK), token via `process.env.ASAAS_API_KEY`, base `process.env.ASAAS_API_URL` (default sandbox `https://sandbox.asaas.com/api/v3`; prod `https://api.asaas.com/v3`). Funções: `garantirCliente(parceiro)` → cria/retorna `asaasCustomerId`; `criarCobranca({ customerId, valor, descricao, externalReference })` → boleto/PIX, retorna id+status; usado pela rota `faturas`. Webhook `api/parceiros/webhook` concilia pagamento, **idempotente por `asaas_payment_id`** (`@unique`), validando um segredo de webhook (`ASAAS_WEBHOOK_TOKEN`) antes de tocar estado — igual ao padrão de `pagamentos/webhook`.

**Rationale**: reusa o padrão de pagamento externo já validado no repo (REST + assinatura + idempotência), sem nova dependência npm (Const. III) e com env-first (Const. I).

**Alternatives rejected**: SDK oficial do Asaas (dependência nova para poucas chamadas — YAGNI); polling de status (webhook é o padrão do repo e evita varredura).

## D4 — Exclusão de negócios reembolsados

**Decision**: um negócio é excluído da fatura quando o `Pedido` vinculado está `statusPagamento === 'reembolsado'`. Esse estado **já é setado** pelo webhook do Mercado Pago (`pagamentos/webhook` → refunded/charged_back). A função pura recebe `pedidoReembolsado` derivado disso.

**Rationale**: aproveita dado que já existe; sem novo mecanismo de reembolso.

## D5 — Normalização de nicho (Candidatura/Cadeira texto livre)

**Decision**: a lista de `Cadeira` é o **conjunto canônico de nichos**. `Parceiro.nicho` deriva da `Cadeira` escolhida (`cadeiraId`), não de texto livre. Na conversão de `Candidatura` → `Parceiro`, o operador **seleciona a cadeira** (dropdown das cadeiras do polo); `Candidatura.categoria` (texto livre) vira só um palpite pré-preenchido. Sem fuzzy matching.

**Rationale**: resolve a edge de normalização com o mínimo — o operador desambigua na conversão; nenhuma tabela/algoritmo de mapeamento (YAGNI).

## D6 — "Ocupação" da cadeira derivada, não duplicada

**Decision**: a cadeira é considerada **ocupada** quando existe um `Parceiro` com `contratoEm != null` ligado a ela; **em prospecção** quando há parceiros em `sondagem`/`ativa` sem contrato; senão **aberta**. Estado **derivado por consulta** — não duplicar um campo de status em `Cadeira` (evita divergência). O `open` atual permanece para o fallback do site.

**Rationale**: fonte única de verdade (o parceiro), sem sincronização de estado; o Painel calcula o estado ao carregar (dataset pequeno).

## D7 — Increment split (por que US1+US2 antes de US3)

**Decision**: entregar US1+US2 sem Asaas primeiro; US3 (fatura+cobrança) + US4 (painel) depois.

**Rationale**: US1+US2 já dão valor (estrutura de sondagem/prospecção e registro dos repasses/"moeda de troca") e **não dependem de env nova**; travar tudo atrás da configuração do Asaas atrasaria o ganho. Cada incremento é commitável/verificável isolado.
