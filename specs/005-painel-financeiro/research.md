# Phase 0 — Research: Painel Administrativo e Financeiro

Sem `NEEDS CLARIFICATION` herdado (resolvidos no `/speckit-clarify`). Aqui ficam as decisões de design que o plano deixou abertas.

## D1 — Fonte da fórmula de líquido por modalidade (FR-011)

- **Decision**: Reusar `calcIntermediacao`, `calcWL`, `resolverParametros` e `PARAMS` de `lib/centros-custo.ts`. A nova `lib/financeiro.ts` apenas **agrupa por mês** os `itensPagos` e chama essas funções por item, espelhando a leitura "real por modalidade oficial" já feita no server component de centros-de-custo (linhas ~111–153).
- **Rationale**: Fonte única de verdade da fórmula; estabilidade de snapshot já garantida pelos campos `*Snapshot` do `ItemPedido` (testado em `centros-custo.test.mjs`). Não reescrever o que já passa em teste.
- **Alternatives**: Reimplementar o cálculo no financeiro (rejeitado — duplica fórmula, viola FR-011 e Constituição III). Refatorar o agregado de centros-de-custo para compartilhar com o financeiro (rejeitado por ora — mexe em tela que funciona; o ganho não paga o risco. `ponytail`: extrair depois se um terceiro consumidor aparecer).

## D2 — Agrupamento por mês (in-memory vs SQL)

- **Decision**: Carregar `itensPagos` (com `pedido.createdAt` e os snapshots) via Prisma e agrupar por mês **em memória** dentro de `lib/financeiro.ts` (chave `YYYY-MM` a partir de `createdAt`).
- **Rationale**: O líquido por item exige rodar `calcIntermediacao`/`calcWL` em JS (não dá pra fazer em SQL sem duplicar a fórmula). Dataset pequeno — agrupar em memória é trivial e mantém a fórmula única. Mês = `createdAt` (clarificação Q2).
- **Alternatives**: `prisma.groupBy` por mês (rejeitado — só somaria `subtotal`, não calcula líquido por modalidade; precisaria reimplementar a fórmula em SQL). Materializar coluna de mês (rejeitado — schema novo desnecessário).

## D3 — Geração do CSV (FR-012)

- **Decision**: Rota `GET /api/financeiro/csv` (server, `isAuthed`) que monta o CSV (uma linha por pedido pago, clarificação Q4) com a **mesma `lib/financeiro.ts`** e responde `text/csv` com `Content-Disposition: attachment`. A página tem um link/botão para essa rota.
- **Rationale**: Reconcilia com a tela por construção (mesma fonte de cálculo). Padrão nativo de download no Next; sem montar CSV no cliente (evitaria duplicar dados/cálculo). Sem libs de CSV — o formato é simples o suficiente para gerar à mão.
- **Alternatives**: Gerar CSV no cliente a partir do que já foi renderizado (rejeitado — duplica dados e arrisca divergir da tela). Lib de CSV (rejeitado — YAGNI; escaping de campos controlados é trivial).
- **Formato pt-BR**: delimitador `;` (Excel pt-BR usa `;`), decimais com vírgula, datas `dd/MM/yyyy`, encoding UTF-8 com BOM (Excel reconhece acentos). Documentado no contrato.

## D4 — Onde mora o Painel

- **Decision**: `/admin` (a home) **vira o Painel**; a página atual de Candidaturas é movida para `/admin/candidaturas`. `nav.tsx` ganha "Painel" (apontando `/admin`) como primeiro item e "Financeiro"; o item "Candidaturas" passa a apontar `/admin/candidaturas`.
- **Rationale**: O requisito é "tela home do /admin". O login já cai em `/admin`, então o operador passa a aterrissar no cockpit. Mover a página é mecânico (o conteúdo e `lead-card.tsx` permanecem; só muda o arquivo de rota).
- **Alternatives**: Painel em `/admin/painel` mantendo Candidaturas na home (rejeitado — contraria o requisito explícito de "home"; `ponytail` não simplifica away pedido explícito). Verificar no implement se algo além do nav referencia `/admin` esperando candidaturas (redirect de login aponta `/admin` como cockpit — ok).

## D5 — Verificação (Constituição II)

- **Decision**: `lib/financeiro.ts` ganha asserts em `test/financeiro.test.mjs` (`node --import tsx`) cobrindo: agrupamento por mês, estabilidade de snapshot, fallback sem snapshot, soma por modalidade. As telas e o CSV são verificados no **navegador em produção / Docker EasyPanel** (build local é não-confiável aqui).
- **Rationale**: A lógica de dinheiro é o que pode quebrar silenciosamente → teste runnable local (confiável para lib pura). UI/route exigem ambiente real.
- **Alternatives**: Confiar em build local (rejeitado — Constituição II). E2E Playwright (fora de escopo desta entrega; verificação manual no navegador basta para o volume atual).
