# Data Model — Cobrança recorrente de assinatura

Duas tabelas novas. Nenhuma coluna nova em `pedidos`/`itens_pedido` — o placeholder que a 013
deixou (`assinatura_ref`, `assinatura_estado`, `recorrencia`) é suficiente; `Assinatura` só
referencia esse item, não o duplica.

## Assinatura

Representa o vínculo recorrente (Key Entity da spec). Nasce **dentro da mesma transação** que
marca o `Pedido` do 1º ciclo como pago (webhook) — nunca antes, para não recriar o 1º ciclo por
fora do fluxo que a 013 já valida.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `itemPedidoId` | `String @unique` | 1:1 com o `ItemPedido` de `unidade='assinatura'` que originou o ciclo 1 (013). `@unique` porque um item de assinatura só pode originar UMA assinatura — é a trava natural contra duplicar no reprocessamento do webhook. |
| `pedidoId` | `String` | Denormalizado do pedido pai — evita um join a mais nas leituras do admin (FR-008); a fonte de verdade continua sendo `itemPedidoId`. |
| `slug` | `String` | Produto de assinatura (`precos-assinatura.ts`), snapshot no momento da criação. |
| `lojaId` | `String` | Cadeira-loja (013) — para relatório e para achar `recorrencia`/config se precisar reprocessar. |
| `mpPreapprovalId` | `String @unique` | O `preapproval.id` do MP — é o valor que passa a preencher `ItemPedido.assinaturaRef` (o placeholder da 013). |
| `recorrencia` | `String` | `mensal` \| `anual` — snapshot do `ItemPedido.recorrencia` no momento da criação; nunca lido de volta da config da loja depois (a loja pode mudar, a assinatura já vendida não). |
| `estado` | `String @default("ativa")` | `ativa` \| `inadimplente` \| `cancelada` (FR-008). Transições: ver máquina de estado abaixo. |
| `proximaCobranca` | `DateTime?` | Calculada a partir do último ciclo de sucesso + `recorrencia`; `null` quando `cancelada` (FR-005/US3 AC1: "a data de próxima cobrança deixa de existir"). |
| `janelaFalhaDesde` | `DateTime?` | Marcado na 1ª falha de uma sequência; limpo em qualquer sucesso seguinte. É o que o cron (D2) compara contra a janela configurada para decidir cancelamento (FR-009). `null` enquanto `ativa` sem falha corrente. |
| `cancelToken` | `String @unique` | Opaco, gerado 1x na criação (D3). Nunca rotacionado — se vazar, o pior caso é alguém cancelar a própria assinatura mais cedo, não uma ação de terceiro (o token não abre nenhuma outra ação). |
| `canceladaEm` | `DateTime?` | Auditoria de quando e (via `cicloCancelamento`, ver abaixo) por quê. |
| `createdAt` / `updatedAt` | `DateTime` | Padrão do repo. |

Relação: `ciclos CicloCobranca[]`.

`@@map("assinaturas")`, `@@index([estado])` (o cron filtra por `estado='inadimplente'` todo dia).

## CicloCobranca

Key Entity "Ciclo de cobrança" da spec: uma tentativa de cobrar um período, com resultado e
motivo. Uma linha por tentativa — incluindo o 1º ciclo (para o histórico de FR-007 ser uma
timeline única, sem caso especial no admin).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `assinaturaId` | `String` | FK para `Assinatura`. |
| `dataTentativa` | `DateTime @default(now())` | Quando a notificação chegou (não quando o MP tentou internamente — não temos esse dado). |
| `resultado` | `String` | `sucesso` \| `falha`. |
| `motivo` | `String?` | Do campo de status/detalhe que o `Payment` do MP retorna quando falha; `null` em sucesso ou quando o MP não informa motivo (FR-002 permite "quando disponível"). |
| `mpPaymentId` | `String @unique` | Idempotência (FR-006) — mesmo padrão de `Pedido.mpPaymentId`: se o webhook reprocessar a mesma notificação, o `create` colide no `@unique` e o handler trata como no-op, nunca duplica. |

`assinatura Assinatura @relation(fields: [assinaturaId], references: [id])`
`@@index([assinaturaId])`, `@@map("ciclos_cobranca")`.

**Nunca deletado**, mesmo depois de `Assinatura.estado = 'cancelada'` (FR-007 — é o registro
financeiro).

## Máquina de estado de `Assinatura.estado`

```text
                    cobrança falha (1ª da sequência)
   ┌────────┐  ──────────────────────────────────►  ┌───────────────┐
   │ ativa  │                                        │ inadimplente  │
   └────────┘  ◄──────────────────────────────────   └───────────────┘
        │            cobrança seguinte tem sucesso           │
        │                                                    │ janela de retry
        │ cancelamento (self-service FR-010 OU admin)         │ esgota (cron, FR-009)
        ▼                                                    ▼
   ┌───────────┐  ◄─────────────────────────────────────────┘
   │ cancelada │
   └───────────┘
```

- `ativa → inadimplente`: webhook grava um `CicloCobranca(resultado='falha')` e a assinatura
  estava `ativa`. Seta `janelaFalhaDesde = now()`. Dispara e-mail (FR-004).
- `inadimplente → ativa`: webhook grava um `CicloCobranca(resultado='sucesso')` estando
  `inadimplente`. Limpa `janelaFalhaDesde`, recalcula `proximaCobranca` (US2 AC2).
- `inadimplente → inadimplente`: nova falha dentro da mesma janela — só grava o ciclo, não
  mexe em `janelaFalhaDesde` (a janela é fixa a partir da 1ª falha, não deslizante).
- `inadimplente → cancelada`: só o cron (D2), quando `now() - janelaFalhaDesde > JANELA_DIAS`
  sem um sucesso no meio (US2 AC3). Chama `cancelPreapproval` no MP antes de gravar — a ordem
  importa: se a chamada ao MP falhar, o cron não marca cancelada e tenta de novo no dia seguinte
  (nunca fica "cancelada" aqui e "cobrando" lá).
- `ativa → cancelada` / `inadimplente → cancelada` (self-service ou admin, US3): mesma ordem —
  `cancelPreapproval` primeiro, só então `estado='cancelada'`, `proximaCobranca=null`.
- **Não existe transição para fora de `cancelada`.** Reassinar depois de cancelar é uma
  assinatura NOVA (novo checkout, novo `preapproval`), não uma reativação — consistente com o
  Edge Case da spec ("é uma assinatura nova... ou existe alguma restrição?" → é nova, sem
  restrição adicional, porque nada nesta feature impede um 2º checkout).

## Ligação com o schema existente (013)

```text
Pedido 1───1 ItemPedido (unidade='assinatura')   ← já existe (013)
                    │ itemPedidoId (@unique)
                    ▼
              Assinatura 1───N CicloCobranca
```

`ItemPedido.assinaturaRef` passa a ser preenchido com `Assinatura.mpPreapprovalId` (o mesmo
valor, guardado nos dois lugares: no item por compatibilidade com o que a 013 já expõe, na
`Assinatura` porque é onde a lógica nova lê). `ItemPedido.assinaturaEstado` passa a espelhar
`Assinatura.estado` a cada transição (mesma dupla escrita, mesmo motivo).
