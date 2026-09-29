# Implementation Plan: Proposta de cadeira guardada, com link próprio da ROI Labs

**Branch**: `019-proposta-cadeira` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-proposta-cadeira/spec.md`

## Summary

O simulador de `/admin/precos` ganha "Para quem" e "Guardar proposta". Uma server action refaz a conta com `simular()`,
monta um documento congelado (`montarPropostaCadeira()`, pura, em `lib/precos-cadeira.ts`) e grava numa tabela nova
(`propostas_cadeira`) com um slug de 48 bits. Depois, redireciona para `/admin/propostas`, que passa a listar as
propostas de cadeira junto com as da Vértice, em ordem de data. O link abre `app.roilabs.com.br/p/<slug>`, uma página
pública nova com a marca da ROI Labs (tokens do `globals.css`, os mesmos do site), que só renderiza o documento e
termina num botão para o WhatsApp comercial.

## Technical Context

**Language/Version**: TypeScript 5.7, Node 22

**Primary Dependencies**: Next 16 (App Router, standalone), React 19 (`useActionState`), Prisma 6, Tailwind 3 (só em
`/admin`, dentro de `.vtx`). Nada novo.

**Storage**: Postgres `roilabs_db`, schema `public`, tabela nova `propostas_cadeira` via Prisma. Aplicada à mão, como na
018: `prisma migrate diff --from-url --to-schema-datamodel --script`. Se o diff for só o `CREATE TABLE` e os índices,
aplica via `db execute`. Qualquer drift é registrado no handoff, e só o `CREATE` é aplicado.

**Testing**: `test/precos-cadeira.test.mjs` ganha os casos de `montarPropostaCadeira()`: os três modelos, ritmo zero,
distribuidor, e nenhum texto interno no documento. Verificação real em produção (constituição II).

**Target Platform**: EasyPanel (Docker), `app.roilabs.com.br`. O push em `main` publica o app.

**Project Type**: web app (monorepo, pasta `app/`).

**Performance Goals**: a página pública é um server component sem JS próprio, só HTML e CSS, com fontes que o layout
já carrega. LCP ≤ 2,5 s no móvel (SC-004).

**Constraints**: o repo é **público** (sem dado real de cliente em teste ou commit). O horário aparece em
America/Sao_Paulo. A página pública fica fora do índice (o `robots` do layout raiz já é noindex; a página repete).

**Scale/Scope**: 1 operador, poucas propostas por semana. A lista lê até 200 (`ponytail:`).

## Constitution Check

| Princípio | Como o plano cumpre |
|---|---|
| I. Env primeiro | Nenhuma env var nova. `DATABASE_URL` já existe; a URL pública do app é constante, como a `VERTICE_SITE` do `DocLink`. |
| II. Verificação real | "Pronto" = proposta de teste guardada em produção, link aberto sem login nas 3 larguras, números conferidos contra o simulador, exclusão levando o link a "não encontrada". A linha de teste é apagada no fim. |
| III. YAGNI | Uma tabela com 4 colunas (o resto é o `doc` congelado), uma página pública, duas actions. Sem edição, sem aceite e sem PDF. A edição fica como atalho anotado na spec, com o caminho de upgrade. |
| IV. Qualidade de página | A página pública passa pelo `design-review` (art-direction, conversion-copy, ux-writing, accessibility, responsive) antes do código. Estados de não encontrada e vencida têm texto próprio. |
| V. Spec-driven | spec → clarify → plan → tasks → implement; handoff + commit + push no fim. |

Nenhuma violação.

## Decisões (research)

Detalhe em [research.md](research.md).

- **D1. Tabela própria no Prisma, não `vertice.proposals`.** O site da Vértice lê `vertice.proposals` para servir
  `/p/<slug>`: uma proposta de cadeira ali abriria com a marca da Vértice (fere FR-011) e com um `doc` de formato que
  o site não conhece. Separada, ela nem existe para o site da Vértice.
- **D2. Documento congelado em `jsonb`.** Tudo que o cliente lê é montado no save e nunca recalculado (FR-006). As
  colunas ficam em `id`, `slug`, `criada_em` e `doc`. "Para quem", nicho e números moram no `doc`, porque a lista e a
  página leem o documento inteiro.
- **D3. O texto da comissão para o cliente é montado, não copiado.** `nicho.regra` e o último item de
  `REGRAS_CONTRATO` (desconto) são orientação ao operador, e os `avisos` de `simular()` misturam as duas coisas (o do
  CFO/CFM é interno). `montarPropostaCadeira()` escreve a regra de comissão para o cliente com as taxas já ajustadas
  (distribuidor) e o valor por consulta digitado. O desconto sai de `REGRAS_CONTRATO` para `REGRAS_NEGOCIACAO`, que só
  `/admin/precos` mostra.
- **D4. Conta refeita no servidor.** A action recebe os campos crus (strings do formulário), valida o nicho contra
  `NICHOS` e chama `simular()`. Número vindo da tela não é gravado.
- **D5. `useActionState` no simulador.** Erro de validação ou de banco volta como texto na própria tela, e a simulação
  não se perde. Sucesso = `redirect('/admin/propostas')`. O `isPending` trava o botão contra o clique duplo.
- **D6. Página pública em `/p/[slug]`, fora de `/admin`.** O layout raiz não pede login, e só `admin/layout.tsx`
  chama `requireAuth()`. O estilo é um bloco novo no `globals.css` (`/* ---- proposta pública ---- */`) com os tokens da
  marca, porque o Tailwind só existe dentro de `.vtx` e usa as cores da Vértice.
- **D7. Slug validado antes de consultar** (`/^[A-Za-z0-9_-]{8}$/`). Fora do formato ou inexistente, `notFound()`, com
  um `not-found.tsx` da marca que não revela nada.
- **D8. Lista mesclada em `/admin/propostas`.** As duas fontes são lidas em paralelo, e o erro de uma não esconde a
  outra. Os itens são ordenados por data. O cartão novo é `PropostaCadeiraCard`, e o `ProposalCard` da Vértice ganha o
  selo "Vértice" e perde "Editar esta proposta" (FR-010).
- **D9. `DocLink` ganha `site` opcional** (padrão `VERTICE_SITE`), e o cartão de cadeira passa `ROI_APP =
  "https://app.roilabs.com.br"`. A URL absoluta é necessária porque o link é copiado para o WhatsApp.
- **D10. Validade de 15 dias** (`PROPOSTA_VALIDADE_DIAS`). Vencida, a página mostra uma faixa no topo, e o cartão mostra
  "Vencida em dd/mm".

## Project Structure

### Documentation (this feature)

```text
specs/019-proposta-cadeira/
├── spec.md
├── plan.md              # este arquivo
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── actions.md       # guardarPropostaCadeira / excluirPropostaCadeira
│   └── pagina-publica.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── prisma/schema.prisma                        # + model PropostaCadeira
├── src/lib/precos-cadeira.ts                   # + montarPropostaCadeira(), REGRAS_NEGOCIACAO, tipos do doc
├── src/app/admin/precos/simulador.tsx          # + Para quem, Guardar proposta (useActionState)
├── src/app/admin/precos/page.tsx               # mostra REGRAS_NEGOCIACAO junto do contrato
├── src/app/admin/propostas/actions.ts          # novo: guardar / excluir ("use server")
├── src/app/admin/propostas/page.tsx            # lista mesclada, textos
├── src/components/vertice/PropostaCadeiraCard.tsx  # novo
├── src/components/vertice/ProposalCard.tsx     # selo Vértice, sem "Editar"
├── src/components/vertice/DocLink.tsx          # + prop `site`
├── src/app/p/[slug]/page.tsx                   # novo: página pública
├── src/app/p/[slug]/not-found.tsx              # novo
├── src/app/globals.css                         # + bloco proposta pública
└── test/precos-cadeira.test.mjs                # + casos do documento
```

**Structure Decision**: tudo em `app/`, seguindo os padrões que já existem ali. As actions ficam ao lado da tela que
lista, como `lib/vertice/actions.ts` fica ao lado das telas da Vértice, e a regra pura fica em `lib/precos-cadeira.ts`,
que já tem o teste.

## Complexity Tracking

Nenhuma violação a justificar.
