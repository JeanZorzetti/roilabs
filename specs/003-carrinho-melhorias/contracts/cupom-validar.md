# Contrato — `POST /api/cupom/validar` (`/app`)

Valida um cupom e devolve o desconto recalculado no servidor, para o carrinho exibir antes do checkout. **Único endpoint que lê resposta cross-origin** → exige header CORS.

## Request
- `Content-Type: application/x-www-form-urlencoded` (requisição simples — sem preflight, igual `leads-consumidor`/`pedidos`)
- Campos:
  | campo | obrig. | descrição |
  |---|---|---|
  | `codigo` | sim | código do cupom (case-insensitive) |
  | `itens` | sim | JSON `[{"slug":"...","caixas":3}, ...]` |

  > **Ignorado se enviado**: qualquer `subtotal`/`desconto`/`total` do cliente. O servidor recomputa o subtotal do produto via `precos.ts` (FR-017).

## Processamento
1. Parse `itens`; descarta slug inexistente; recomputa `subtotalProduto = Σ caixas × m2_caixa × preço` via `precos.ts`.
2. `validarCupom(codigo, subtotalProduto)` (ver `data-model.md` → `Cupom`).
3. Monta a resposta JSON.

## Response (200, sempre — erro de cupom não é erro HTTP)
- Válido: `{ "ok": true, "codigo": "OBRA10", "tipo": "percentual", "desconto": 123.45, "descontoFmt": "R$ 123,45" }`
- Inválido: `{ "ok": false, "motivo": "invalido" | "expirado" | "minimo" | "inativo" }`
- Carrinho vazio / itens inválidos: `{ "ok": false, "motivo": "vazio" }`

## Headers
- `Access-Control-Allow-Origin: https://goiania.roilabs.com.br`
- `Content-Type: application/json`

## Notas
- Apenas **display**. A cobrança usa a re-validação do checkout (`checkout-delta.md`, FR-014): um cupom que expirou entre o carrinho e o checkout **não** é cobrado com desconto.
- Sem auth (público), sem rate-limit dedicado no v1. `// ponytail: adicionar throttle só se houver abuso de brute-force de códigos.`
