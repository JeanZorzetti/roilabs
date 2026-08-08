# Contrato: cancelamento (self-service e admin)

## `POST /api/assinaturas/cancelar` — self-service (FR-010/FR-011)

**Entrada**: `{ token: string }` (body ou query — a tela envia por form POST simples, sem JS
obrigatório, mesmo espírito do carrinho estático).

**Fluxo**:
```text
assinatura = findUnique(where: { cancelToken: token })
SE não achou: 404 — mesma resposta para "token errado" e "token de outra pessoa" (não vaza
  existência de assinatura por tentativa)
SE assinatura.estado === 'cancelada': 200 idempotente (já está cancelada, não é erro)
SENÃO:
  cancelPreapproval(assinatura.mpPreapprovalId)   # MP primeiro (data-model.md, ordem importa)
  update Assinatura { estado: 'cancelada', proximaCobranca: null, canceladaEm: now() }
  update ItemPedido { assinaturaEstado: 'cancelada' }
```

**Por que o token É a autorização** (FR-011): o token não identifica uma "conta" — identifica
exatamente uma assinatura, no momento em que foi gerado. Não existe operação "listar minhas
assinaturas" nem qualquer ação além de cancelar ESSA. Um comprador com o token de outro nunca
teria como obtê-lo (só chega por e-mail para o dono) — não há verificação adicional de
propriedade a fazer porque o token JÁ É a prova de propriedade.

## `GET /assinatura/cancelar?token=...` — a tela (FR-010)

Página pública (sem auth), Next.js. Mostra: produto, valor do ciclo, data da próxima cobrança
(se ainda ativa) e um aviso explícito — "cancelar não corta o acesso ao ciclo já pago, só impede
a próxima cobrança; não há reembolso" (US3 AC2 + spec Assumptions, para não gerar chargeback por
expectativa errada). Um botão só, que faz o POST acima. Depois de cancelar, confirma e não
oferece "desfazer" (não existe reativação — data-model.md).

## Cancelamento pelo time (admin)

Mesma rota `POST /api/assinaturas/cancelar`, mas por `id` em vez de `token`, atrás do
`isAuthed()` que já protege `/admin/*` — reaproveita a checagem de auth existente, não duplica
lógica de cancelamento (a função que chama `cancelPreapproval` + atualiza estado é uma função
só, chamada pelas duas rotas).
