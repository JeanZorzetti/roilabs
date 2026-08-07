# T012 — varredura das leituras de `NegocioOriginado` por `pedidoId`

**Data**: 2026-08-07 · Comando: `grep -rn "negocioOriginado\|pedidoId" app/src/`
**Feita ANTES de alterar qualquer ocorrência** (a varredura é tarefa, não observação).

## O defeito real é PIOR do que a spec previu

`data-model.md` §1 antecipou o filtro silencioso — `where: { pedidoId: … }` deixando de
cobrir negócio de webhook. Ele existe, mas é o **menor** dos dois:

⚠️ **`include: { pedido: … }` numa relação que virou opcional devolve `null`.** Todo
`n.pedido.statusPagamento` do código atual passa a ser **`TypeError` em runtime** assim que
existir um negócio de webhook — não um número errado, uma página quebrada. E uma delas é a
**geração de fatura** (`api/faturas/route.ts`), que é caminho de dinheiro.

Ou seja: a landmine do `freteMotivo` (filtro que ignora em silêncio) **e** uma segunda,
de crash. As duas são consertadas abaixo.

## As 7 ocorrências

| # | arquivo:linha | o que faz | efeito com `pedidoId` anulável | classe |
|---|---|---|---|---|
| 1 | [api/faturas/route.ts:65-75](../../app/src/app/api/faturas/route.ts#L65-L75) | `findMany({ parceiroId, faturaId: null })` + `include pedido` → `n.pedido.statusPagamento` | **crash** ao gerar fatura do parceiro que tem venda de webhook | 💥 crash · 💰 dinheiro |
| 2 | [api/negocios/route.ts:13-35](../../app/src/app/api/negocios/route.ts#L13-L35) | GET lista negócios + `include pedido` → `r.pedido.nome` | **crash** na tela de negócios do parceiro | 💥 crash |
| 3 | [api/negocios/route.ts:78-83](../../app/src/app/api/negocios/route.ts#L78-L83) | `anteriores` p/ classificação + `include pedido` → `n.pedido.statusPagamento` | **crash** ao repassar pedido de cliente que já comprou por webhook | 💥 crash · 💰 dinheiro |
| 4 | [admin/parceiros/[id]/page.tsx:18-64](../../app/src/app/admin/parceiros/[id]/page.tsx#L18-L64) | `include pedido` → `n.pedido.nome`, `n.pedido.statusPagamento` | **crash** na página do parceiro | 💥 crash |
| 5 | [admin/parceiros/[id]/demonstrativo/page.tsx:38-63](../../app/src/app/admin/parceiros/[id]/demonstrativo/page.tsx#L38-L63) | `include pedido` → `n.pedido.statusPagamento` | **crash** no demonstrativo do mês | 💥 crash · 💰 dinheiro |
| 6 | [admin/pedidos/page.tsx:12-14](../../app/src/app/admin/pedidos/page.tsx#L12-L14) | `select: { pedidoId }` → `Set` de pedidos com repasse | `Set` passa a conter `null`; `has(p.id)` segue certo, mas o conjunto mente | 🤫 silencioso |
| 7 | [api/negocios/route.ts:65-66](../../app/src/app/api/negocios/route.ts#L65-L66) | `findFirst({ pedidoId, estagio })` — guarda de repasse duplicado | **correto como está**: `pedidoId` aqui é string não-vazia validada na linha 49 | ✅ sem ação |

Fora da varredura por não lerem `pedidoId` nem `pedido`:
`api/parceiros/[id]/route.ts:76` (`count` por `parceiroId`), `api/negocios/[id]/route.ts`
(por `id`), `api/faturas/route.ts:88` (`updateMany` por `id`).

## A correção (T013)

Um só padrão, aplicado nas 5 ocorrências de crash:

```ts
include: { pedido: { select: { … } } }   // pedido agora é Pedido | null
…
pedidoReembolsado: n.pedido?.statusPagamento === 'reembolsado'
```

**`?.` está certo aqui e a semântica é a que se quer**: venda de webhook não tem pedido,
logo não tem como estar reembolsada — `false` é a resposta correta, e é o que
`undefined === 'reembolsado'` devolve. O reembolso de venda de webhook chega por
`VendaParceiro.status`, não por `Pedido` (contrato do webhook, passo 3).

Para exibição (`pedidoNome`, `pedidoWhatsapp`), o fallback é o rótulo da origem — nunca
string vazia, que na tela vira uma linha sem identificação nenhuma.

⚠️ **`?.` NÃO basta sozinho num caso**: a ocorrência 6 precisa de `filter`, não de `?.` —
o `Set` tem de excluir os nulos, senão um `Set` de 3 pedidos com repasse reporta 4 elementos.
