# Handoff — 010 success fee com duas taxas (aquisição vs recorrência)

**Data**: 2026-07-22 · **Status**: código completo (Gate 1 verde) **e migração aplicada no `roilabs_db`** (Gate 2 ✅). Falta só o **Gate 3 (E2E real no navegador)** e duas ações de negócio do Jean (abaixo).

## Feito (código)

- **Schema** (`app/prisma/schema.prisma`): `Parceiro.comissaoAquisicao` + `comissaoRecorrencia` (`Decimal(6,4)`, `comissaoPct` mantido **deprecado**); `NegocioOriginado.clienteDoc` + `classificacao` + `taxaAplicada` (nullable nesta etapa) + `@@index([parceiroId, clienteDoc])`; `Pedido.compradorDoc`. Prisma client regenerado.
- **Libs puras**: `src/lib/doc.ts` (normaliza/valida CPF·CNPJ por tamanho), `src/lib/classificar-negocio.ts` (aquisição vs recorrência), `src/lib/taxa.ts` (parse [0,1] compartilhado), `src/lib/success-fee.ts` (**soma por negócio** `Σ money(valor × taxaAplicada)`; assinatura sem `comissaoPct`; exporta `elegivel`).
- **US1** — parceiros: POST/PATCH aceitam e validam as duas taxas em [0,1], ignoram `comissaoPct`; `ativa` exige as **duas** + `cpfCnpj`. GET expõe ambas. Form (`parceiros-form.tsx`) com 2 campos (default 0.15/0.10, FR-009) + validação cliente. Detalhe (`[id]/page.tsx`) mostra as duas e `podeGerar` exige as duas + cpfCnpj.
- **US2** — negócios: POST faz **snapshot na criação** (lê `pedido.compradorDoc`→`clienteDoc`, classifica, congela `taxaAplicada`); exige parceiro com as 2 taxas; GET expõe os campos. Faturas: valida as 2 taxas, monta `NegocioCalc` com `taxaAplicada` do snapshot, chama o novo cálculo; **guard**: negócio ganho sem taxa → 400 (nunca cobra taxa zero por omissão). Demonstrativo com breakdown por negócio (classificação + taxa + subtotal), total = soma por negócio. Checkout `site-goiania/carrinho.astro` com campo **opcional** CPF/CNPJ; `pedidos/route.ts` persiste `compradorDoc` (só dígitos, `null` se inválido/ausente).
- **US3** — `scripts/migrate-010-backfill.mjs` (idempotente): parceiros → 2 taxas = `comissaoPct`; negócios abertos → `taxaAplicada=comissaoPct`, `classificacao='legado'`, `clienteDoc` do pedido; não toca faturados/faturas.
- **US4** — imutabilidade: as duas rotas PATCH já usam allowlist e **nunca** reescrevem `taxaAplicada/classificacao/clienteDoc` (comentário do invariante adicionado). O cálculo não recebe mais taxa do parceiro → mudar a taxa não afeta negócio criado. Self-check em `test/success-fee.test.mjs`.

## Gate 1 (self-checks) — ✅ verde

```
cd app && npm test
# doc.test.mjs, classificar-negocio.test.mjs, success-fee.test.mjs (250/2000; snapshot; sem drift) todos passam
```
`npx tsc --noEmit` limpo.

## Migração aplicada no host (2026-07-22) — Gate 2 ✅

Estado do `roilabs_db` antes: **1 parceiro (TapePro, ativa, `comissaoPct=0.15`), 0 negócios, 0 faturas.**

1. **T009 `db push`** — preview (`prisma migrate diff`) confirmou **puramente aditivo**: 6 colunas nullable + 1 índice, zero DROP, sem drift. Aplicado.
2. **T020 backfill** — rodado 2× (idempotente): run 1 = 1 parceiro, run 2 = 0. TapePro ficou `aquisicao=recorrencia=0.15`. **Nenhuma fatura mudou de valor — havia 0 faturas** (SC-004 trivialmente satisfeito).
3. **T021 NOT NULL** — como havia **0 negócios**, foi seguro ir direto ao estado final: `taxaAplicada` é **NOT NULL** no banco e no schema. A constraint do DB passou a ser a garantia do invariante, então o guard "negócio sem taxa" da rota de faturas virou código morto e foi removido.

## TapePro configurado (2026-07-22)

`cpfCnpj=44724076000135` (CNPJ 44.724.076/0001-35, só dígitos p/ o Asaas) · `comissaoAquisicao=0.15` · `comissaoRecorrencia=0.10` · `estagio=ativa` → **`podeGerar=true`** (já fatura). Gravado direto no banco com as mesmas barreiras da API (doc 11/14 dígitos, taxa em [0,1]).

## Pendências

1. **T024 — E2E real (Gate 3, declara "pronto")**: seguir `quickstart.md` no navegador — 2 pedidos mesmo doc → 15%+10%, demonstrativo bate, snapshot congelado, checkout grava `compradorDoc` só dígitos. **Ainda não executado** (precisa de auth admin + pedido pago real).

## Gotchas / decisões

- `comissaoPct` fica **deprecado** (não dropado) — `ponytail:` no schema; dropar num push futuro se incomodar.
- Validação de doc é **por tamanho** (CPF 11 / CNPJ 14), não dígito verificador — é o que a spec pede ("formato").
- Migração feita em **2 passos** (nullable+backfill → NOT NULL) porque `db push` não adiciona coluna NOT NULL a tabela com linhas sem default. Com a coluna já NOT NULL, o filtro `taxaAplicada: null` é **inválido** no Prisma — por isso a 2ª etapa saiu do script de backfill (ele estourava ao rodar de novo); ficou documentada no cabeçalho dele para quem migrar outro banco.
- `prisma migrate diff --from-url ... --script` é o preview seguro antes de qualquer `db push` em prod — mostra o SQL sem aplicar.
- `ativa` agora exige `cpfCnpj` além das 2 taxas (T011). Se houver parceiro `ativa` legado sem cpfCnpj, o próximo PATCH pede o cpfCnpj — comportamento intencional.
