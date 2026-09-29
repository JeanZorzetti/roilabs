# Data Model — 018 Histórico de consultas da Projeção

## `ConsultaProjecao` → tabela `projecao_consultas`

Uma consulta paga que deu certo, como a DataForSEO respondeu. Nunca é atualizada nem apagada por esta feature.

| Campo | Coluna | Tipo | Regra |
|---|---|---|---|
| `id` | `id` | `String @id @default(cuid())` | vai na URL `?consulta=` |
| `criadaEm` | `criada_em` | `DateTime @default(now())` | = `consultadoEm` da resposta; índice para a ordem da lista |
| `paraQuem` | `para_quem` | `String?` | aparado; vazio vira `null`; até 80 caracteres |
| `nichoId` | `nicho_id` | `String` | um `id` de `NICHOS` no momento da gravação (pode deixar de existir depois) |
| `localCodigo` | `local_codigo` | `Int` | 2076 = Brasil |
| `localNome` | `local_nome` | `String` | nome da DataForSEO ("Goiania,State of Goias,Brazil") |
| `termos` | `termos` | `Json` (jsonb) | `TermoConsultado[]`: `{ termo, volume: number\|null, mensal: number[], dificuldade: number\|null }` |
| `janelaDe` / `janelaAte` | `janela_de` / `janela_ate` | `String?` | `"2025-09"`; `null` quando nenhum termo trouxe histórico mensal |
| `removidos` | `removidos` | `Int` | linhas repetidas removidas na limpeza |
| `custoUsd` | `custo_usd` | `Float` | soma dos `cost` das duas tarefas |

`@@index([criadaEm])`.

**Por que `Float` e não `Decimal`:** o custo é informativo (US$ 0,10), nunca somado em cobrança. `Decimal` voltaria
como objeto e exigiria conversão em toda leitura.

## Derivado, não gravado

`resumirConsulta({ termos, nichoId })` → `{ demanda, conservador, otimista, unidade, nichoConhecido }`, recalculado a
cada leitura com as premissas atuais (spec, Clarifications).
