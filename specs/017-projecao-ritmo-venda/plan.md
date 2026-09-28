# Implementation Plan: Projeção — ritmo esperado de venda pela demanda de busca

**Branch**: `017-projecao-ritmo-venda` (trabalho em `main`, como a 016) | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-projecao-ritmo-venda/spec.md`

## Summary

Página `/admin/projecao` no app Next 16. O operador cola os termos de compra que o Claude preparou, escolhe
o nicho e a região e consulta uma vez (a dificuldade custa US$ 0,012 e o volume US$ 0,09 na DataForSEO, total
≤ US$ 0,126). A conta, pura e testada, cruza:

- o volume de cada termo, somando as variantes uma vez só;
- a posição alcançável pela dificuldade do termo;
- o CTR de setembro de 2026, com e sem resposta de IA;
- uma rampa linear de 12 meses;
- o funil de benchmark do nicho, com fonte (Prax 2025, Leadster, First Page Sage, Dantas 2018).

Tudo isso em 3 cenários. A média do ano 1 do cenário escolhido (o conservador vem marcado) vai para
`/admin/precos` pela query string. Nada é gravado.

## Technical Context

**Language/Version**: TypeScript 5.7, Next 16 App Router, React 19

**Primary Dependencies**: as que já existem, nenhuma nova. `fetch` nativo para a DataForSEO. SVG e CSS à mão para o gráfico

**Storage**: nenhum (FR-012). Só a lista de cidades da DataForSEO (grátis) fica em memória por 24 h (research D12)

**Testing**: `node --import tsx test/projecao.test.mjs` (asserts puros, o padrão do repo), incluído no `npm test`

**Target Platform**: container Docker `output: 'standalone'` na EasyPanel, em `app.roilabs.com.br`

**Project Type**: web app (admin interno)

**Performance Goals**: consulta paga em menos de 10 s (as duas chamadas live). A troca de cenário ou de nicho recalcula no cliente em menos de 50 ms (200 termos × 3 cenários)

**Constraints**: ≤ 200 termos, ≤ US$ 0,15 por consulta, chave só no servidor, 390 px sem rolagem horizontal, zero dependência nova

**Scale/Scope**: 1 operador, poucas consultas por semana. 1 página, 2 rotas, 1 lib pura, 1 ajuste no simulador

## Constitution Check

*GATE: antes da Fase 0 e de novo depois da Fase 1.*

| Princípio | Como a 017 cumpre | Status |
|---|---|---|
| I · Env primeiro | `DATAFORSEO_API_KEY` documentada em `app/.env.example`. Chave ausente vira erro nomeado (`chave`, 503), não um 500 mudo. O quickstart confere a variável pelo nome | ✅ |
| II · Verificação real | o teste puro roda sem build. A prova da tela é em produção depois do push, com `ui-verification` (quickstart §2–3). Nada é declarado "funcionando" pelo `next build` local | ✅ |
| III · YAGNI | zero dependência, zero tabela, zero cache de consulta paga. Uma lib pura; o cliente DataForSEO só é extraído porque 2 rotas o usam. Atalhos marcados com `ponytail:` (variante por série idêntica, cache de cidades em memória, KD nacional) | ✅ |
| IV · Página rica | a tela entrega resposta, 4 evidências, tabela, premissas com fonte e o que fica de fora. Não é um formulário com um número. Contrato em [contracts/ui.md](contracts/ui.md) | ✅ |
| V · Spec-driven | specify → clarify (3 Q) → plan (este) → tasks → implement. `handoff.md` + commit + push ao fechar | ✅ |
| Stack · Next 16 | `searchParams: Promise` + `await` em `/admin/precos`. Auth pelo `isAuthed()` do app (este app não usa `getAuthFromRequest`) | ✅ |
| Stack · LLM só `claude-cli` | não há LLM no app. Os termos saem da conversa com o Claude (decisão do dono) | ✅ |

Nenhuma violação, então a Complexity Tracking fica vazia.

## Project Structure

### Documentation (this feature)

```text
specs/017-projecao-ritmo-venda/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # D1–D15: fontes, preços, CTR, KD→posição, rampa, benchmarks
├── data-model.md        # tipos (sem banco)
├── quickstart.md        # validação: teste puro + produção + ui-verification
├── contracts/
│   ├── api.md           # POST /api/projecao/consultar, GET /api/projecao/cidades, ponte do simulador
│   └── ui.md            # pergunta, formas, estados, layout, a11y
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
app/
├── .env.example                              # + DATAFORSEO_API_KEY (sem valor)
├── package.json                              # + test/projecao.test.mjs no "test"
├── src/lib/
│   ├── projecao.ts                           # NOVO, puro: constantes (CTR, KD→posição, rampa, funis por nicho
│   │                                         #   com fonte), limparTermos(), validarTermos(), agruparVariantes(),
│   │                                         #   projetar(), erroDataForSEO(), lerPonteSimulador()
│   └── dataforseo.ts                         # NOVO: chamar(caminho, corpo?) → tarefa | erro tipado (2 rotas usam)
├── src/app/api/projecao/
│   ├── consultar/route.ts                    # NOVO: POST, dificuldade → volume
│   └── cidades/route.ts                      # NOVO: GET, lista BR em memória por 24 h
├── src/app/admin/
│   ├── admin-nav.tsx                         # + ['/admin/projecao', 'Projeção'], ao lado de Preços
│   ├── projecao/page.tsx                     # NOVO: AdminShell + premissas e fontes renderizadas no servidor
│   ├── projecao/projecao.tsx                 # NOVO, client: entrada, consulta, cenário, resultado
│   └── precos/
│       ├── page.tsx                          # lê searchParams → inicial validado
│       └── simulador.tsx                     # aceita `inicial` + aviso de origem
└── test/projecao.test.mjs                    # NOVO
```

**Structure Decision**: segue a 016. A conta fica em `src/lib/` (pura, testável com `tsx`, sem I/O) e a tela em
`src/app/admin/<rota>/` com `page.tsx` do servidor e um componente cliente. O resultado (gráfico, cadeia,
cobertura, tabela) começa dentro de `projecao.tsx`. Ele só vira arquivo próprio se passar de ~400 linhas, e
essa decisão fica com `component-architecture` no implement.

## Fluxo

```text
[textarea termos] ──POST /api/projecao/consultar──▶ isAuthed ─▶ limpar+validar ─▶ DataForSEO KD (Brasil)
                                                                                 └▶ DataForSEO volume (local)
       ◀──────────── { termos[volume, mensal, dificuldade], janela, custoUsd } ◀─┘
[estado no cliente] ─▶ projetar(termos, nicho, taxasDoParceiro) ─▶ 3 cenários ─▶ tela
[Usar no simulador] ─▶ /admin/precos?nicho&ritmo&cenario ─▶ page.tsx valida ─▶ SimuladorCadeira(inicial)
```

## Riscos

| Risco | Mitigação |
|---|---|
| A projeção sai baixa demais e o dono desconfia da conta | a cadeia mostra cada degrau com a fonte. O caso de referência está no quickstart. O CTR de 2026 está documentado (a 1ª posição caiu de 39,8% para 7,1%) |
| Os termos da lista trazem intenção informacional e inflam a demanda | a responsabilidade é da conversa com o Claude (spec, Assumptions). A tela mostra os termos com volume para o operador cortar |
| A dificuldade passa por uma API que falha isolada | a dificuldade vai primeiro: se falhar, nada é pago (D2) |
| O nome da cidade não bate com o da API | só aceita o que `/api/projecao/cidades` devolveu (`codigo`) |

## Complexity Tracking

Vazia: nenhuma violação da constituição.
