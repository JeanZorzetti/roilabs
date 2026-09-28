# Data Model — 017 Projeção

Nada disto vai para o banco (FR-012). São tipos TypeScript em `app/src/lib/projecao.ts` (a conta, pura) e
o formato das respostas da API (contracts/api.md). Nenhum schema Prisma é tocado (SC-006).

## Cenario

`'conservador' | 'base' | 'otimista'`. O padrão é `'conservador'` (FR-005b).

## TermoConsultado (a resposta da API, um por termo enviado)

| Campo | Tipo | Regra |
|---|---|---|
| `termo` | string | como o operador escreveu, sem espaço nas pontas; 1–80 caracteres e ≤ 10 palavras (research D1) |
| `volume` | `number \| null` | média mensal do Google Ads. `null` = **sem volume medido**, que é diferente de 0 |
| `mensal` | `number[] \| null` | os 12 valores de `monthly_searches`, do mais antigo para o mais novo. Serve só para agrupar variantes (D5) e para a janela |
| `dificuldade` | `number \| null` | 0–100. `null` = **não medida**, tratada como `KD_SEM_DADO = 15` (D7) |

Janela da consulta: `{ de: 'YYYY-MM', ate: 'YYYY-MM' }`, tirada do menor e do maior mês de `monthly_searches`.

## Benchmark de nicho

```ts
type Degrau = {
  de: string;          // "visita", "lead", "contato", "agendamento"
  para: string;        // "pedido pago", "assinatura", "comparecimento"…
  taxa: Record<Cenario, number>;  // fração: 0.01 = 1%
  fonte: string;       // "Prax, Benchmarks E-commerce Brasil 2025 · Moda Feminina"
  data: string;        // "2026-09-14" (publicação)
  confianca: Confianca;           // reusa o tipo de lib/precificacao.ts
  premissa?: string;   // presente quando a taxa, ou o multiplicador do cenário, não vem de estudo
};
type FunilNicho = { nichoId: string; unidade: Unidade; degraus: Degrau[] };  // 1 degrau (pedido), 2 (assinatura) ou 3 (consulta)
```

`Unidade` segue o modelo do nicho em `lib/precificacao.ts`: `percentual` → "pedidos pagos", `mensalidade` →
"assinaturas novas", `consulta` → "consultas comparecidas" (FR-006). **Todo nicho de `NICHOS` tem um
funil**, e isso é travado no teste (SC-002).

## Constantes de captura (research D6–D8)

- `CTR_SEM_IA[10]`, `CTR_COM_IA[10]`, `FATIA_IA: Record<Cenario, number>`, e as fontes.
- `POSICAO_POR_DIFICULDADE: Record<Cenario, [kdMax, posicao][]>` e `KD_SEM_DADO = 15`.
- `MES_ESTAVEL: Record<Cenario, number>` = { conservador: 9, base: 6, otimista: 4 }.

## Resultado da projeção (calculado no cliente, efêmero)

Para cada cenário:

| Campo | Definição |
|---|---|
| `termos[]` | por termo: `posicao` (1–10 ou `null` = fora do alcance), `ctr`, `cliquesEstaveis`, `grupo` (texto do representante quando é variante agrupada) |
| `demanda` | `{ total, alcancavel, foraDoAlcance, semVolume (contagem), semDificuldade (contagem), agrupados (contagem) }`. Volumes somados **uma vez por grupo** |
| `cliquesEstaveis` | Σ volume × CTR(posição) dos termos alcançáveis |
| `vendasEstaveis` | `cliquesEstaveis × Π taxa(degrau, cenário)` |
| `porMes[12]` | `vendasEstaveis × captura(m)` (D8) |
| `mediaAno1` | `Σ porMes / 12`, o número que vai ao simulador (FR-010) |
| `cadeia[]` | os degraus do mês estabilizado: `{ rotulo, n, taxa?, fonte? }`, começando pela demanda alcançável |

A troca de nicho, de cenário ou de taxa do parceiro recalcula a partir dos `TermoConsultado[]` que já estão
na memória. Nenhuma troca chama a API (FR-003).

## Taxa do parceiro (FR-009)

`Record<degrauIndex, number | undefined>`: o operador sobrescreve a taxa **base** de um degrau. A taxa
informada vale para os 3 cenários, que passam a diferir só na captura. A cadeia marca o degrau como "taxa
do parceiro" no lugar da fonte.

## Estados do resultado (contracts/ui.md)

`ocioso` (nada consultado) · `consultando` · `erro` (`entrada` | `sessao` | `chave` | `saldo` | `fonte`) ·
`pronto`. Dentro de `pronto`, dois subestados de conteúdo: **tudo fora do alcance** (média 0, zero real
explicado) e **menos de 1 venda por mês** (decimal mais o aviso).
