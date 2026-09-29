# Implementation Plan: Contrato da cadeira, emitido a partir da proposta

**Branch**: `020-contrato-cadeira` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-contrato-cadeira/spec.md`

## Summary

O cartão da proposta de cadeira ganha "Emitir contrato", que abre `/admin/contratos/cadeira?proposta=<id>`. O
formulário pede só as partes, o início, o foro, o pagamento e as condições específicas. Uma server action relê a
proposta, monta o documento congelado com `montarContratoCadeira()` (função pura em `lib/contrato-cadeira.ts`, que
reaproveita `qualify`, `addMonths` e os tipos do contrato da Vértice) e grava numa tabela nova, `contratos_cadeira`,
com slug de 48 bits e uma proposta por contrato. O link abre `app.roilabs.com.br/c/<slug>`, página pública nova com a
mesma pele da `/p/` (classes `.prop-*`), que termina num formulário HTML de aceite, sem JS: nome, CPF, caixa e botão.
A action de aceite grava nome, CPF, IP, navegador e o hash do texto, com trava otimista contra edição simultânea.
`/admin/contratos` passa a listar os dois tipos, e o cartão da proposta mostra o estado do contrato.

## Technical Context

**Language/Version**: TypeScript 5.7, Node 22

**Primary Dependencies**: Next 16 (App Router, standalone), React 19, Prisma 6, Tailwind 3 (só em `/admin`). Nada novo.

**Storage**: Postgres `roilabs_db`, schema `public`, tabela nova `contratos_cadeira`, com FK `proposta_id` →
`propostas_cadeira(id)` `ON DELETE RESTRICT` e `UNIQUE`. É aplicada à mão, como na 018 e na 019: `prisma migrate diff
--from-url --to-schema-datamodel --script`, e depois `db execute` só do `CREATE TABLE`, dos índices e da FK. A tabela
entra **antes** do push do código, porque `/admin/propostas` passa a ler a relação.

**Testing**: `test/contrato-cadeira.test.mjs` (`node --import tsx`, `node:assert`) cobre os três modelos, as pendências,
PF×PJ, a proposta sem entregáveis, a estimativa fora do contrato, o hash estável e a vigência. Entra no `npm test`.
Verificação real em produção (constituição II).

**Target Platform**: EasyPanel (Docker), `app.roilabs.com.br`. O push em `main` publica o app.

**Project Type**: web app (monorepo, pasta `app/`).

**Performance Goals**: página pública em server component, sem JS próprio, com a mesma folha de estilo da `/p/`. LCP ≤
2,5 s no móvel.

**Constraints**: o repo é **público**: nada de CNPJ, CPF ou nome real em teste ou commit. A página pública tem CPF do
representante, protegido só pelo slug de 48 bits e pelo noindex, como a `/c/` da Vértice. Horário em
America/Sao_Paulo.

**Scale/Scope**: 1 operador, poucos contratos por mês. As listas leem até 200 (`ponytail:`, igual à 019).

## Constitution Check

| Princípio | Como o plano cumpre |
|---|---|
| I. Env primeiro | Nenhuma env var nova. A URL pública é a constante `ROI_APP` do `DocLink`. |
| II. Verificação real | "Pronto" = proposta e contrato de teste em produção, contrato aberto sem login nas 3 larguras, conferido contra a proposta, aceite forçado com pendência recusado, aceite válido gravado com IP, navegador e hash, e tentativa de excluir o aceito recusada. As linhas de teste são apagadas no fim, direto no banco. |
| III. YAGNI | Uma tabela, uma função pura de montagem, uma página admin, uma página pública, 3 actions. Sem PDF, sem assinatura por provedor, sem aditivo, sem cliente JS no aceite. |
| IV. Qualidade de página | A página pública herda a pele aprovada da `/p/`. `accessibility`, `ux-writing` e `ui-verification` rodam na implementação (formulário de aceite = UI interativa). |
| V. Spec-driven | specify → clarify → plan → tasks → implement; handoff + commit + push no fim. |

Nenhuma violação.

## Decisões (research)

Detalhe em [research.md](research.md).

- **D1. Tabela própria, não `vertice.contracts`.** `contracts.client_id` é obrigatório e aponta para `vertice.clients`,
  e a `/c/` da Vértice abre no site dela, com a marca dela. A cadeira não tem cliente na Vértice.
- **D2. FK `RESTRICT` é a trava do FR-021.** O banco recusa excluir proposta com contrato, e a action traduz o erro.
  O cartão nem mostra o botão.
- **D3. Aceite em formulário HTML + server action + `redirect`.** Funciona sem JS, sem componente cliente. O erro volta
  por `?erro=<campo>`.
- **D4. O hash prova o texto.** SHA-256 do `doc` serializado com as chaves em ordem (o `jsonb` reordena as chaves). O
  formulário leva o hash do texto que a página mostrou. Se mudou, o aceite é recusado ("o contrato mudou, leia de
  novo").
- **D5. Trava otimista.** O aceite faz `updateMany where { id, aceitoEm: null, editadoEm: <lido> }`, e a edição faz
  `where { id, aceitoEm: null }`. Clique duplo ou edição no meio: só um vence.
- **D6. Montagem reaproveita a Vértice onde o texto é o mesmo.** `qualify`, `addMonths`, `PLACEHOLDER`,
  `ContractParty` e `ContractClause` vêm de `lib/vertice/contract.ts` (`splitLines` passa a ser exportada). As
  cláusulas são novas: o objeto e a remuneração não têm nada em comum.
- **D7. A contratada é pré-preenchida pelo último contrato de cadeira**, como o `getLastContractDefaults` da Vértice. O
  primeiro contrato pede os dados da ROI Labs uma vez.

## Project Structure

### Documentation (this feature)

```text
specs/020-contrato-cadeira/
├── spec.md
├── plan.md              # este arquivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── actions.md       # server actions: salvar, excluir, aceitar
│   └── pagina-publica.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── prisma/schema.prisma                          # + model ContratoCadeira; PropostaCadeira ganha a relação
├── src/lib/contrato-cadeira.ts                   # NOVO: tipos, montarContratoCadeira(), hashDoc() — puro
├── src/lib/vertice/contract.ts                   # exporta splitLines
├── src/app/admin/contratos/cadeira/page.tsx      # NOVO: formulário (?proposta= | ?editar=)
├── src/app/admin/contratos/cadeira/actions.ts    # NOVO: salvarContratoCadeira, excluirContratoCadeira
├── src/app/admin/contratos/page.tsx              # lista os dois tipos (allSettled)
├── src/app/admin/propostas/page.tsx              # lê a relação contrato
├── src/app/admin/propostas/actions.ts            # excluirPropostaCadeira traduz o RESTRICT
├── src/components/vertice/PropostaCadeiraCard.tsx # estado do contrato / "Emitir contrato"
├── src/components/vertice/ContratoCadeiraCard.tsx # NOVO: cartão na lista de contratos
├── src/app/c/[slug]/page.tsx                     # NOVO: contrato público + formulário de aceite
├── src/app/c/[slug]/actions.ts                   # NOVO: aceitarContratoCadeira
├── src/app/c/[slug]/not-found.tsx                # NOVO: "contrato não encontrado"
├── src/app/globals.css                           # + poucas classes .contrato-* (aceite, cláusulas)
├── test/contrato-cadeira.test.mjs                # NOVO
└── package.json                                  # + teste no npm test
```

**Structure Decision**: tudo dentro de `app/`, seguindo a 019: lib pura + página admin + página pública.

## Complexity Tracking

Sem violação da constituição a justificar.
