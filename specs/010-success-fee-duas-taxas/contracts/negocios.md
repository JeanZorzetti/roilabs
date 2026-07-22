# Contrato: Negócios (deltas)

Rota: `POST /api/negocios` (repassa Pedido pago → Parceiro ativo). Auth interna.

## Mudança — snapshot na criação

Request inalterado (`pedidoId`, `parceiroId`, `isento?`, `isencaoMotivo?`). No servidor, ao criar o `NegocioOriginado`, além do que já faz:

1. Ler `pedido.compradorDoc`, normalizar (só dígitos) → `clienteDoc`.
2. Classificar (função pura `classificarNegocio`): existe negócio anterior não-perdido do mesmo `parceiroId` com o mesmo `clienteDoc` (doc não-vazio)? → `recorrencia`; senão → `aquisicao`.
3. `taxaAplicada` = `parceiro.comissaoAquisicao` (aquisição) ou `comissaoRecorrencia` (recorrência).
4. Gravar `clienteDoc`, `classificacao`, `taxaAplicada` no negócio (imutáveis).

**Pré-condição nova**: o parceiro ativo precisa ter as duas taxas (senão 400 `parceiro sem taxas de aquisição/recorrência`).

Response inalterado: `{ ok: true, id }` 201.

## GET /api/negocios

Resposta passa a expor `clienteDoc`, `classificacao`, `taxaAplicada` por negócio (para o demonstrativo).

## Aceitação

- 1º negócio de um doc com o parceiro → `classificacao=aquisicao`, `taxaAplicada=0.15`.
- 2º negócio do mesmo doc → `recorrencia`, `0.10`.
- Pedido sem `compradorDoc` → `aquisicao` (D3).
- Editar as taxas do parceiro depois NÃO altera negócios já criados.
