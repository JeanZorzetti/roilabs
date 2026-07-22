# Contrato: Parceiros (deltas)

Rotas: `POST /api/parceiros`, `PATCH /api/parceiros/[id]`. Auth interna (cookie HMAC).

## Mudança

Substitui o campo único `comissaoPct` por **dois**:

| Campo | Tipo | Regra |
|-------|------|-------|
| `comissaoAquisicao` | number \| null | fração [0,1]; recusa fora do range (400 `comissaoAquisicao fora de [0,1]`) |
| `comissaoRecorrencia` | number \| null | fração [0,1]; recusa fora do range (400 `comissaoRecorrencia fora de [0,1]`) |

- `comissaoPct` no body: **ignorado** (deprecado). Sem quebra para clientes antigos.
- **Ativação/faturamento**: `estagio='ativa'` (e o `podeGerar` da tela) exige as **duas** taxas preenchidas + `cpfCnpj` (regra atual generalizada). Erro: `comissaoAquisicao e comissaoRecorrencia obrigatórias para ativa`.

## GET /api/parceiros

Resposta passa a expor `comissaoAquisicao` e `comissaoRecorrencia` (Number|null); `comissaoPct` pode continuar no payload durante a transição (informativo).

## Aceitação

- Salvar aquisição=0.15, recorrência=0.10 → persiste os dois; GET retorna ambos.
- Salvar aquisição=1 → 400 (barra o typo 100%).
- Ativar sem uma das taxas → 400.
