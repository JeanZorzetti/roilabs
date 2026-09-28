---
description: "Tarefas da 017 Projeção: ritmo esperado de venda pela demanda de busca"
---

# Tasks: Projeção — ritmo esperado de venda pela demanda de busca

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md) (D1–D15),
[data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md), [contracts/ui.md](./contracts/ui.md),
[quickstart.md](./quickstart.md)

**Tests**: incluídos. O SC-003 exige casos de referência travados em teste automatizado, e o quickstart §1
lista os casos. O padrão do repo é um `.mjs` de asserts puros rodado com `node --import tsx`.

**Organização**: por user story. US1 e US2 são P1, US3 é P2. Todos os caminhos são relativos à raiz do repo
(`ROI Labs/`). O app fica em `app/`.

**Regras que valem para todas as tarefas**:

- Trabalho em `main`, como na 016. **Push em `main` é deploy** do `app.roilabs.com.br` (EasyPanel).
- O working tree tem alterações de outros escritores (`CLAUDE.md`, `Docs/`, `.specify/feature.json`). Faça o
  commit sempre por caminho (`git commit -- <arquivos>`) e nunca com `git add -A`.
- O repo é **público**: a chave da DataForSEO nunca entra em arquivo versionado nem em log. Confira pelo nome
  (`grep -c DATAFORSEO_API_KEY`) e nunca com `cat`/`diff` de `.env`.
- Constituição II: `next build` local no OneDrive não prova nada. A prova é o teste puro mais a tela em
  produção.
- Os números de `research.md` e os de `app/src/lib/projecao.ts` andam juntos. Se mudar um, mude o outro.

## Format: `[ID] [P?] [Story] Descrição`

- **[P]**: pode rodar em paralelo (arquivo diferente, sem depender de tarefa pendente)
- **[Story]**: US1, US2 ou US3 (spec.md)

---

## Phase 1: Setup

**Purpose**: declarar a variável nova. Não entra dependência nova nem tabela.

- [X] T001 [P] Adicionar `DATAFORSEO_API_KEY=` **sem valor** em `app/.env.example`, com o comentário "Basic auth da DataForSEO (base64 de login:senha), lida só no servidor por /api/projecao/*. Mesmo valor do roihub/.env" (research D3)

---

## Phase 2: Foundational (bloqueia US1, US2 e US3)

**Purpose**: as constantes com fonte e os funis por nicho, que as três histórias usam. Nada de I/O.

**⚠️ CRITICAL**: nenhuma história começa antes desta fase.

- [X] T002 Criar `app/test/projecao.test.mjs` no padrão de `app/test/precificacao.test.mjs` (import de `../src/lib/projecao.ts`, `assert` do `node:assert/strict`, um `console.log('ok …')` por bloco). Primeiro bloco (SC-002): **todo `id` de `NICHOS`** (`app/src/lib/precificacao.ts`) tem um funil em `FUNIS`; a `unidade` segue o `modelo` (`percentual` → 1 degrau, `mensalidade` → 2, `consulta` → 3); todo degrau tem `fonte` e `data` não vazias, taxas em (0, 1) e `conservador ≤ base ≤ otimista`. Rodar `cd app && node --import tsx test/projecao.test.mjs` e ver **falhar** (o módulo ainda não existe)
- [X] T003 Criar `app/src/lib/projecao.ts` com os tipos do data-model (`Cenario`, `CENARIOS`, `CENARIO_PADRAO = 'conservador'`, `Unidade`, `Degrau`, `FunilNicho`, `TermoConsultado`), reusando `Confianca` e `NICHOS` de `@/lib/precificacao`, e as constantes de captura com fonte e data em texto: `CTR_SEM_IA[10]` e `CTR_COM_IA[10]` (First Page Sage, set/2026, tabela D6), `FATIA_IA` = { conservador 0,816, base 0,14, otimista 0,14 } com a fonte de cada uma, `POSICAO_POR_DIFICULDADE` (tabela D7, com a marca de premissa), `KD_SEM_DADO = 15`, `MES_ESTAVEL` = { conservador 9, base 6, otimista 4 } (D8, premissa) e `LIMITE` = { termos 200, caracteres 80, palavras 10 } (D1/D4). Comentários `ponytail:` onde o research marca atalho (posição 11+ conta zero, KD nacional mesmo com volume por cidade)
- [X] T004 Em `app/src/lib/projecao.ts`, `FUNIS: Record<string, FunilNicho>`: os 18 nichos `percentual` com a taxa base da tabela D10 (Prax 2025, mediana por setor, publicada em 2026-09-14, confiança por linha, e `premissa` nos *proxies* suplementos, construcao, autopecas, agro e b2b), com conservador = base × 0,7 e otimista = base × 1,3 e a premissa escrita; `saas` com 2 degraus (visita → lead 1,83% Leadster 2026; lead → assinatura 18,2% First Page Sage 2025); `clinicas` com 3 degraus e os valores absolutos da tabela D11 (não × 0,7/× 1,3 nos degraus 2 e 3). Rodar o teste do T002: **verde**
- [X] T005 Incluir `node --import tsx test/projecao.test.mjs` no script `"test"` de `app/package.json`, logo depois de `test/precificacao.test.mjs`, e rodar `cd app && npm test` com saída 0

**Checkpoint**: as constantes e os funis existem, com fonte, e estão travados em teste.

---

## Phase 3: User Story 1 - Projetar o ritmo de um parceiro a partir dos termos (Priority: P1) 🎯 MVP

**Goal**: o operador cola os termos, escolhe o nicho e a região, consulta uma vez e vê a média do ano 1 em 3
cenários, a curva de 12 meses, a cobertura da demanda e a tabela de termos.

**Independent Test**: `/admin/projecao` → moda, Brasil, 10 termos → "Consultar". A página mostra a demanda
somada, a curva de 12 meses por cenário e a média do ano 1, e trocar de cenário ou de nicho não gera POST
novo (quickstart §2, passos 1–3).

### Tests for User Story 1 ⚠️

> Escrever primeiro e ver falhar antes de implementar.

- [X] T006 [US1] Em `app/test/projecao.test.mjs`, bloco da **entrada**: `limparTermos()` apara as pontas, tira as linhas vazias e remove duplicatas pela forma normalizada (sem diferenciar caixa, acento e espaço repetido), mantém a 1ª ocorrência e devolve `removidos`; `validarTermos()` devolve erro nomeado (`{ termo, regra, mensagem }`) para lista vazia, 201 termos, termo de 81 caracteres, termo de 11 palavras e termo com emoji; 200 termos de 80 caracteres passam
- [X] T007 [US1] Em `app/test/projecao.test.mjs`, bloco da **conta** (SC-003): o caso de referência do quickstart §1 (1 termo, 10.000 buscas, dificuldade 5, moda, base → posição 5 → CTR 2,192% → 219,2 cliques → 2,192 pedidos estáveis → soma da rampa 9 → `mediaAno1` 1,644, com tolerância de 1e-9); o mesmo termo nos **outros dois cenários** (quickstart §1): conservador → posição 8 → CTR 0,3288% → 32,88 cliques → 0,23016 pedidos estáveis → rampa soma 7,5 → `mediaAno1` 0,14385, e otimista → posição 3 → CTR 5,1% → 510 cliques → 6,63 pedidos estáveis → rampa soma 10 → `mediaAno1` 5,525; `porMes[0] === 0` e `porMes[5] === vendasEstaveis` na base; o mesmo termo em `saas` (esperado = 219,2 × 0,0183 × 0,182) e em `clinicas` (esperado = 219,2 × 0,0407 × 0,25 × 0,75), com o esperado escrito como produto e não como número de cabeça; conservador com dificuldade 25 → `posicao: null`, `mediaAno1 === 0` e `demanda.foraDoAlcance === 10000`; dificuldade `null` → conta 15 (base → posição 7) e soma em `demanda.semDificuldade`; `volume: null` fica fora da soma e soma em `demanda.semVolume`; dois termos com a mesma série de 12 meses e o mesmo volume > 0 somam uma vez, e o 2º traz `grupo` = texto do 1º; a **posição do grupo é a do 1º** (research D5): 1º com dificuldade 34 e 2º com 12 → no conservador o grupo fica fora do alcance, e invertendo a ordem ele entra na posição 10; `arredondarVendas(1.644) === 1.6`, `arredondarVendas(18.4) === 18`, `formatarVendas(0.7) === '0,7'`, `formatarVendas(12.4) === '12'` (nunca arredonda 0,7 para 1)
- [X] T008 [US1] Em `app/test/projecao.test.mjs`, bloco da **tradução de erro**: `erroDataForSEO(40100)` → `chave` (503), `40200` e `40210` → `saldo` (402), `50000`, `50401`, `40202` e código desconhecido → `fonte` (502)

### Implementation for User Story 1

- [X] T009 [US1] Em `app/src/lib/projecao.ts`: `normalizar(t)` (NFD sem diacrítico, minúsculas, espaço colapsado; é também a chave para juntar a resposta da API), `limparTermos(linhas)` → `{ termos, removidos }` e `validarTermos(termos)` → `null | { termo, regra, mensagem }`, com a mensagem nomeando o termo e a regra (rascunho em contracts/api.md, 400). A regex de caractere aceita letra (`\p{L}`), número, espaço, hífen e apóstrofo. Rodar o T006: verde
- [X] T010 [US1] Em `app/src/lib/projecao.ts`: `agruparVariantes(termos)` (D5, série de 12 meses idêntica + mesmo volume > 0 → o grupo conta volume **e posição** pelo 1º da lista, e a dificuldade das outras variantes só aparece na tabela; com o comentário `ponytail:` do teto e do upgrade), `posicaoPara(kd, cenario)`, `ctrPara(posicao, cenario)` (a mistura de D6), `captura(m, cenario)` = `min(1, (m − 1) / (M − 1))` e `projetar(termos, nichoId)` → `Record<Cenario, ResultadoCenario>` com `termos[]`, `demanda` (total, alcancavel, foraDoAlcance, semVolume, semDificuldade, agrupados), `cliquesEstaveis`, `vendasEstaveis`, `porMes[12]` e `mediaAno1`. Mais `arredondarVendas(n)` (1 decimal abaixo de 10, inteiro a partir de 10: a única regra de arredondamento, que a ponte do US2 também usa) e `formatarVendas(n)` = `arredondarVendas` + `Intl.NumberFormat('pt-BR')`. Rodar o T007: verde
- [X] T011 [US1] Em `app/src/lib/projecao.ts`: `erroDataForSEO(statusCode)` → `{ erro: 'chave' | 'saldo' | 'fonte', http: 503 | 402 | 502 }` pela tabela de contracts/api.md. Rodar o T008: verde
- [X] T012 [P] [US1] Criar `app/src/lib/dataforseo.ts`: `chamar(caminho, corpo?)` faz `POST` quando há corpo e `GET` quando não há, em `https://api.dataforseo.com/v3/`, com `Authorization: Basic ${process.env.DATAFORSEO_API_KEY}` e `AbortSignal.timeout(60_000)`. Devolve `{ ok: true, tarefa, custo }` ou `{ ok: false, erro, statusCode, mensagem }`: chave ausente → `chave` sem chamar a rede; o `status_code` do topo e o de `tasks[0]` diferentes de `20000` passam por `erroDataForSEO`; timeout ou rede → `fonte`. Não importa nada de `next/*`, e a chave nunca aparece em mensagem nem em log
- [X] T013 [US1] Criar `app/src/app/api/projecao/consultar/route.ts` (`POST`, `dynamic = 'force-dynamic'`) seguindo contracts/api.md: `isAuthed()` de `@/lib/auth` → 401 `sessao`; corpo inválido, `limparTermos` + `validarTermos` → 400 `entrada` sem chamar a API; `local` ausente → `{ codigo: 2076, nome: 'Brasil' }`; **dificuldade primeiro** (`dataforseo_labs/google/bulk_keyword_difficulty/live`, sempre 2076 e `pt`) e, se falhar, para sem pagar o volume; depois `keywords_data/google_ads/search_volume/live` (local pedido, `pt`). Junta as duas respostas por `normalizar()` (o Google Ads pode devolver o termo em minúsculas), ordena `mensal` do mais antigo para o mais novo, calcula a `janela` (`YYYY-MM`) e o `custoUsd` (soma dos `cost`) e devolve 200 com `termos`, `janela`, `local`, `custoUsd`, `consultadoEm` e `removidos`. Em todo 402/502/503: `log.error({ err, etapa, statusCode }, 'projecao/consultar: …')` de `@/lib/log`, **sem** a chave e **sem** os termos
- [X] T014 [P] [US1] Criar `app/src/app/api/projecao/cidades/route.ts` (`GET`, `dynamic = 'force-dynamic'`, atrás de `isAuthed()`): `q` com menos de 2 caracteres → `{ locais: [] }`; a lista de `keywords_data/google_ads/locations/br` fica numa variável de módulo com carimbo de 24 h (comentário `ponytail:` do D12); filtra por `normalizar(location_name)` que contém `normalizar(q)`, com "City" antes de "State", e devolve até 10 `{ codigo, nome, tipo }`. Falha da fonte → 502 `{ locais: [], erro: 'fonte' }`
- [X] T015 [P] [US1] Adicionar `['/admin/projecao', 'Projeção']` logo depois de `['/admin/precos', 'Preços']` no `NAV` de `app/src/app/admin/admin-nav.tsx` e citar a spec 017 no comentário do topo (FR-001)
- [X] T016 [P] [US1] Criar `app/src/app/admin/projecao/page.tsx` (servidor, `metadata`, `AdminShell` com `title` e `lead` no padrão de `app/src/app/admin/precos/page.tsx`): monta `<Projecao />` e renderiza no servidor, a partir das constantes de `@/lib/projecao`, a seção **Premissas e fontes** (tabela de CTR com e sem IA, fatia de IA por cenário, tabela dificuldade → posição, rampa, funil de cada nicho com fonte, data, confiança e marca de premissa: FR-007, FR-008, SC-002) e a seção **O que a projeção não cobre** (FR-015: só orgânico do Google, sem mídia paga, marketplace, redes sociais nem recompra; volume = média de 12 meses; mapa do Google fora da conta da clínica, D11). Tabelas com `pr-table pr-table--cards` (reuso da 016)
- [X] T017 [US1] Criar `app/src/app/admin/projecao/projecao.tsx` (`"use client"`), a **entrada** e os estados de contracts/ui.md: `<select>` de nicho agrupado por faixa como em `app/src/app/admin/precos/simulador.tsx`, região "Brasil" por padrão mais o campo de cidade com `<datalist>` alimentado por `/api/projecao/cidades?q=` (que só aceita um `codigo` devolvido pela rota), `<textarea>` de termos e o botão "Consultar". O `fetch` só dispara no clique (FR-003) e guarda os `TermoConsultado[]` no estado. Estados `ocioso` (os 3 passos de onboarding, sem nível 2 e 3), `consultando` (esqueleto, botão desabilitado "Consultando…", `aria-busy`) e `erro` (entrada no campo com `aria-invalid` + `aria-describedby`, mantendo o resultado anterior; sessão, chave, saldo e fonte num bloco no padrão `DbErrorState`, **nunca** projeção 0). "N linhas repetidas foram ignoradas" quando `removidos > 0`
- [X] T018 [US1] Em `app/src/app/admin/projecao/projecao.tsx`, o **cartão do nível 1** (coluna direita sticky em `lg:grid-cols-[1fr_380px]`): a `mediaAno1` do cenário escolhido com `formatarVendas` e a unidade do nicho (FR-006), numa região `aria-live="polite"`; ① `<fieldset><legend>Cenário</legend>` com 3 `<input type="radio">` nativos (conservador marcado ao abrir, FR-005b), cada cartão com a barra de comprimento na escala comum aos três e o número escrito; o `h2` com `tabIndex={-1}` recebe o foco quando a consulta termina; os avisos de estado (tudo fora do alcance, com o limite de dificuldade **do cenário escolhido** lido de `POSICAO_POR_DIFICULDADE` e nunca um "20" fixo; menos de 1 venda/mês com "≈ N no ano 1"; clínica com Brasil); a linha de procedência (G32: janela, `consultadoEm`, fonte da conversão e "custou US$ x"). `projetar()` roda em `useMemo` sobre `[termos, nichoId]` e não chama a API (FR-003)
- [X] T019 [US1] Em `app/src/app/admin/projecao/projecao.tsx`, ② a **curva de 12 meses**: `<figure>` com `<svg role="img" aria-labelledby>` (title + desc com mês 1, mês 12 e média), 12 barras `navy` do cenário escolhido numa escala de 0 ao máximo, zero real como traço de 2 px, a linha tracejada da média em `gold-dark` rotulada na ponta, o rótulo de valor só no mês 12 e `<details><summary>Números mês a mês</summary><table>` logo abaixo (D15, SVG à mão)
- [X] T020 [US1] Em `app/src/app/admin/projecao/projecao.tsx`, ④ a **cobertura da demanda** (uma barra empilhada 100%: alcançável no ano 1 × fora do alcance, com número e % escritos dos dois lados, e a linha de contagens que só mostra o que for > 0) e a **tabela de termos** `pr-table pr-table--cards` (Termo · Buscas/mês · Dificuldade · Posição no cenário · Cliques/mês; ordem por buscas, do maior para o menor, e os sem volume no fim; "sem volume medido", "não medida · conta 15", "fora do alcance" e "agrupado com «x»" com o volume riscado, sempre em texto neutro; `tabular-nums` e números à direita)
- [X] T021 [US1] Passagem das skills na tela, antes do commit: `component-architecture` (se `app/src/app/admin/projecao/projecao.tsx` passar de ~400 linhas, extrair o resultado para `app/src/app/admin/projecao/resultado.tsx`), `ux-writing` (verbo do botão, erros de contracts/api.md, onboarding e avisos, no tom de fato e não de mascote), `accessibility` (ordem de Tab nicho → região → termos → consultar → cenários, contraste de `gold-dark` ≥ 3:1, foco visível `focus-visible:outline-gold`) e `responsive-design` (390 px em uma coluna na ordem de contracts/ui.md, alvos de 44 px, sem rolagem lateral)
- [X] T022 [US1] `cd app && npm test` com saída 0 e commit por caminho: `git commit -- app/.env.example app/package.json app/src/lib/projecao.ts app/src/lib/dataforseo.ts app/src/app/api/projecao app/src/app/admin/admin-nav.tsx app/src/app/admin/projecao app/test/projecao.test.mjs specs/017-projecao-ritmo-venda` (mensagem em inglês)

**Checkpoint**: a projeção funciona sozinha. O número ainda não viaja para o simulador.

---

## Phase 4: User Story 2 - Levar o número para o simulador (Priority: P1)

**Goal**: "Usar no simulador" abre `/admin/precos` com o nicho e a média do ano 1 do cenário escolhido já
preenchidos, e o simulador aberto direto continua igual.

**Independent Test**: projeção feita → "Usar no simulador" → o simulador abre com o mesmo nicho e o mesmo
número mensal, a comissão recalculada e o aviso de origem. `/admin/precos` aberto direto funciona como hoje
(quickstart §2, passo 4).

### Tests for User Story 2 ⚠️

- [X] T023 [US2] Em `app/test/projecao.test.mjs`, bloco da **ponte** (research D13): `urlSimulador('moda', 1.644, 'conservador')` → `/admin/precos?nicho=moda&ritmo=1.6&cenario=conservador#simulador` (decimal com ponto, já arredondado como a tela mostra) e `urlSimulador('moda', 18.4, 'base')` → `ritmo=18`; para uma média qualquer, o `ritmo` lido de volta por `lerPonteSimulador` é igual a `arredondarVendas(média)` (a Projeção e o simulador mostram o mesmo número); `lerPonteSimulador({ nicho: 'moda', ritmo: '18', cenario: 'base' })` → `{ nichoId: 'moda', ritmo: 18, cenario: 'base' }`; `ritmo=abc`, `ritmo=-1`, `ritmo=100001`, `nicho=xpto`, `cenario=xpto`, parâmetro ausente ou em array → `null` (as três caem juntas, FR-011)

### Implementation for User Story 2

- [X] T024 [US2] Em `app/src/lib/projecao.ts`: `urlSimulador(nichoId, ritmo, cenario)` (leva `arredondarVendas(ritmo)`, o número que a tela mostra) e `lerPonteSimulador(params)` (nicho em `NICHOS`, ritmo finito entre 0 e 100.000 e cenário em `CENARIOS`; qualquer falha → `null`). Rodar o T023: verde
- [X] T025 [P] [US2] Em `app/src/app/admin/precos/simulador.tsx`: `SimuladorCadeira({ inicial }: { inicial?: { nichoId: string; ritmo: number; cenario: Cenario } | null })`. Com `inicial`, o `nichoId` começa no nicho recebido e o campo do modelo dele (`pedidos`, `assinaturas` ou `consultas`) começa no ritmo formatado em pt-BR com até 1 decimal ("1,6"; conferir que `simular()` aceita decimal), e o parágrafo "Pergunte ao parceiro…" dá lugar a "Veio da Projeção: média do ano 1 no cenário <cenário>", com o link de volta para `/admin/projecao`. Sem `inicial`, os `useState` e o texto ficam **exatamente** como hoje
- [X] T026 [P] [US2] Em `app/src/app/admin/precos/page.tsx`: `PrecosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> })` vira `async`, faz `await searchParams`, passa o resultado por `lerPonteSimulador` e entrega `<SimuladorCadeira inicial={…} />` (padrão Next 16 do plan, Stack · Next 16)
- [X] T027 [US2] Em `app/src/app/admin/projecao/projecao.tsx`: o botão "Usar no simulador" colado ao número do nível 1 (um `<Link>` para `urlSimulador(nichoId, mediaAno1, cenarioEscolhido)`), ativo também no zero real de "tudo fora do alcance" e oculto no estado `ocioso` (FR-010). O texto passa por `ux-writing`
- [X] T028 [US2] `cd app && npm test` com saída 0 e commit por caminho: `git commit -- app/src/lib/projecao.ts app/test/projecao.test.mjs app/src/app/admin/precos/page.tsx app/src/app/admin/precos/simulador.tsx app/src/app/admin/projecao/projecao.tsx`

**Checkpoint**: US1 + US2 fecham o MVP. O ritmo do simulador sai de uma conta, não de um chute.

---

## Phase 5: User Story 3 - Entender e contestar a conta (Priority: P2)

**Goal**: a cadeia buscas → cliques → degraus do funil → vendas, com o número, a taxa e a fonte de cada
passagem, e a troca de qualquer taxa pela taxa real do parceiro.

**Independent Test**: com uma projeção feita, multiplicar os degraus mostrados reproduz o número do mês 12.
Digitar a taxa do parceiro num degrau muda a projeção e troca a fonte daquele degrau pelo selo "taxa do
parceiro".

### Tests for User Story 3 ⚠️

- [X] T029 [US3] Em `app/test/projecao.test.mjs`, bloco da **cadeia**: nos 3 modelos, `cadeia[0].n` é a demanda alcançável, o produto dos `n` × `taxa` de cada degrau reproduz `vendasEstaveis`, e `vendasEstaveis === porMes[11]` nos 3 cenários. Taxa do parceiro: `projetar(termos, 'moda', { 0: 0.02 })` usa 2% nos 3 cenários (que passam a diferir só na captura) e marca o degrau com `origem: 'parceiro'` no lugar da fonte

### Implementation for User Story 3

- [X] T030 [US3] Em `app/src/lib/projecao.ts`: `projetar(termos, nichoId, taxasDoParceiro?: Record<number, number | undefined>)` (o 3º parâmetro é opcional e as chamadas do US1 não mudam) e `cadeia[]` em `ResultadoCenario` (`{ rotulo, n, taxa?, fonte?, origem: 'mercado' | 'parceiro' | 'premissa' }`, começando pela demanda alcançável, depois os cliques com o CTR ponderado e depois um degrau por taxa do funil). Rodar o T029: verde
- [X] T031 [US3] Em `app/src/app/admin/projecao/projecao.tsx` (ou `resultado.tsx`, se o T021 extraiu), ③ a **cadeia da busca à venda**: uma linha por degrau com `rótulo · n absoluto · taxa · fonte` e uma barra de 0–100% que codifica só a taxa do degrau, escrita "de 100%" (contracts/ui.md ③; sem funil de largura proporcional). Em cada degrau do funil, "Usar a taxa do parceiro" abre um `<input inputMode="decimal">` lido com `lerNumeroBR` de `@/lib/precificacao` ("1,5" = 1,5%). Valor inválido mostra aviso e nunca NaN, e o valor válido entra em `taxasDoParceiro` e troca a fonte pelo selo "taxa do parceiro" (FR-009). Nada é gravado (FR-012). Os textos passam por `ux-writing` e o input por `accessibility` (label, `aria-invalid`, `aria-describedby`)
- [X] T032 [US3] `cd app && npm test` com saída 0 e commit por caminho dos arquivos tocados no T029–T031 (`app/src/lib/projecao.ts`, `app/test/projecao.test.mjs`, `app/src/app/admin/projecao/`)

**Checkpoint**: as três histórias funcionam e cada número da tela tem origem.

---

## Phase 6: Polish, deploy e prova em produção

**Purpose**: publicar e provar no ar (constituição II), fechar o SC-006 e deixar o handoff.

- [ ] T033 Conferir o SC-006: `git diff --stat 73a46fb..HEAD -- app/` só lista os arquivos do plan (Source Code). Nenhum `app/prisma/`, nenhuma rota de fatura, taxa de parceiro ou pagamento
- [ ] T034 Conferir se `DATAFORSEO_API_KEY` existe nas variáveis do app **roilabs-admin** na EasyPanel, só pelo nome (`specs/017-projecao-ritmo-venda/quickstart.md` §0). Se faltar, configurar com o valor de `roihub/.env` sem ecoar o valor e, se não houver acesso à EasyPanel nesta máquina, pedir ao Jean. Conferir o saldo grátis em `GET /v3/appendix/user_data` (≥ US$ 0,15)
- [ ] T035 `git push` em `main` (deploy da EasyPanel, ~15 min) e esperar o build novo servir `/admin/projecao` (`app/src/app/admin/projecao/page.tsx`) (sem sessão → `307 /login`, não 404)
- [ ] T036 Validação em produção por `specs/017-projecao-ritmo-venda/quickstart.md` §2, passos 1–6: nenhum POST ao abrir; consulta de 10 termos de moda com custo ≤ US$ 0,15 (SC-004); troca de cenário e de nicho sem POST novo; ponte para `/admin/precos` com o aviso de origem, e `/admin/precos` direto como antes; termo de 90 caracteres → erro no campo, com o saldo intacto; clínica + Brasil → aviso, e "Goi" → "Goiania,State of Goias,Brazil". Se não houver sessão de admin nesta máquina, registrar o que ficou provado e o que falta, como no T013 da 016
- [ ] T037 Skill `ui-verification` (`specs/017-projecao-ritmo-venda/quickstart.md` §3): 390 / 768 / 1440 px no estado pronto, mais um quadro de ocioso, erro de entrada, tudo fora do alcance e menos de 1 venda/mês; sem rolagem lateral em 390 (SC-005); passagem de Tab; console limpo; gates G31 (a resposta em 5 s) e G32 (o número-herói com janela, fonte e total) conferidos nos PNGs
- [ ] T038 Escrever `specs/017-projecao-ritmo-venda/handoff.md` com as 5 seções da constituição (Princípio V): **feito** (o que está no ar e o que foi provado em produção no T036 e no T037), **decisões** (as tomadas no implement que não estavam no plan), **próximos passos**, **pendências** (o que não deu para provar e por quê) e **gotchas** (inclusive o custo real da consulta de teste e qualquer surpresa da DataForSEO). Marcar as tarefas feitas neste `tasks.md`. Commit por caminho e push sem perguntar

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: sem dependência.
- **Foundational (T002–T005)**: depois do Setup. **Bloqueia todas as histórias** (os funis e as constantes).
- **US1 (T006–T022)**: depois da Foundational. É a base das outras duas.
- **US2 (T023–T028)**: depois da US1. O botão vive na tela da US1, e a ponte precisa de `mediaAno1`. T024–T026
  (lib e simulador) podem começar logo depois da Foundational, porque não dependem da tela.
- **US3 (T029–T032)**: depois da US1 (`projetar()` e a tela). É independente da US2.
- **Polish (T033–T038)**: depois das histórias que forem publicadas.

### Within Each User Story

- Teste primeiro e vermelho (T006–T008, T023, T029), depois a lib, as rotas e a tela.
- Tudo o que escreve em `app/src/lib/projecao.ts` ou em `app/test/projecao.test.mjs` é sequencial: é o mesmo
  arquivo.
- Tudo o que escreve em `app/src/app/admin/projecao/projecao.tsx` (T017–T020, T027, T031) é sequencial.

### Parallel Opportunities

- T001 corre em paralelo com a Foundational.
- Na US1, com a lib verde (T011): T012 (`dataforseo.ts`), T015 (menu) e T016 (`page.tsx`) em paralelo. T014
  (`cidades`) corre em paralelo com T013 (`consultar`) depois do T012.
- Na US2: T025 (`simulador.tsx`) e T026 (`precos/page.tsx`) em paralelo, com a forma de `inicial` fixada no T025.
- US2 e US3 podem correr em paralelo depois da US1, se T027 e T031 não forem editados ao mesmo tempo
  (os dois mexem em `projecao.tsx`).

---

## Parallel Example: User Story 1

```bash
# Com T009–T011 verdes (lib pura):
Task: "T012 cliente DataForSEO em app/src/lib/dataforseo.ts"
Task: "T015 link Projeção em app/src/app/admin/admin-nav.tsx"
Task: "T016 página do servidor com premissas e fontes em app/src/app/admin/projecao/page.tsx"

# Com T012 pronto:
Task: "T013 POST em app/src/app/api/projecao/consultar/route.ts"
Task: "T014 GET em app/src/app/api/projecao/cidades/route.ts"
```

---

## Implementation Strategy

### MVP (US1 + US2, as duas P1)

1. T001–T005: constantes e funis travados em teste.
2. T006–T022: a projeção na tela, com commit.
3. T023–T028: a ponte para o simulador, com commit.
4. **Parar e validar**: T033–T037 em produção. O simulador já recebe um número rastreável.

### Incremental

1. MVP no ar → o operador usa na próxima reunião.
2. US3 (T029–T032) → a cadeia aberta para contestar a conta → push e `ui-verification` de novo só na cadeia.
3. T038 fecha com o handoff.

---

## Notes

- 38 tarefas. Commits em inglês e por caminho. Push só depois de uma história inteira verde.
- `ponytail:` nos atalhos do research: variante por série idêntica (D5), cache de cidades em memória (D12), KD
  nacional (D2), posição 11+ = 0 (D6).
- Os textos de contracts/*.md são rascunho. A passagem de `ux-writing` (T021, T027, T031) é obrigatória antes
  do commit da tela.
