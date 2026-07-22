# Handoff — 010 success fee com duas taxas (aquisição vs recorrência)

**Data**: 2026-07-22 · **Status**: código completo e verde localmente (Gate 1). Faltam só os passos de **host real** (Gate 2/3).

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

## Pendências (HOST real — só o Jean roda, `roilabs_db@2.24.207.200:5443`)

1. **T009 — `prisma db push`** (runner standalone NÃO aplica schema; rodar de máquina que alcança o host). Adiciona as colunas novas com `taxaAplicada` ainda **nullable**.
2. **T020 — backfill**: `DATABASE_URL=... node scripts/migrate-010-backfill.mjs` (rodar **2×**, é idempotente). Conferir: nenhuma `FaturaSuccessFee` muda `valor`; TapePro fica com aquisição=recorrência=0.15 → depois **setar recorrência 0.10 pela UI** `/admin/parceiros`.
3. **T021 — NOT NULL** (opcional, recomendado): só **após** o backfill confirmar que todo negócio aberto tem taxa, mudar em `schema.prisma` `taxaAplicada Decimal?` → `Decimal` e `db push` de novo. Se o backfill avisar "negócio sem taxa" (parceiro sem `comissaoPct`), resolver **antes**. O guard na fatura já protege o interim, então isto é integridade, não bloqueio.
4. **T024 — E2E real (Gate 3, declara "pronto")**: seguir `quickstart.md` no EasyPanel/navegador — 2 pedidos mesmo doc → 15%+10%, demonstrativo bate, snapshot congelado, checkout grava `compradorDoc` só dígitos.

## Gotchas / decisões

- `comissaoPct` fica **deprecado** (não dropado) — `ponytail:` no schema; dropar num push futuro se incomodar.
- Validação de doc é **por tamanho** (CPF 11 / CNPJ 14), não dígito verificador — é o que a spec pede ("formato").
- Migração em **2 passos** (nullable+backfill → NOT NULL) porque `db push` não adiciona coluna NOT NULL a tabela com linhas sem default.
- `ativa` agora exige `cpfCnpj` além das 2 taxas (T011). Se houver parceiro `ativa` legado sem cpfCnpj, o próximo PATCH pede o cpfCnpj — comportamento intencional.
