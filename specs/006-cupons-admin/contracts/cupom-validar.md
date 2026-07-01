# Contrato EXISTENTE — `POST /api/cupom/validar` (deve permanecer idêntico)

Consumido **cross-origin** pelo site estático `goiania.roilabs.com.br` (exibição do desconto no carrinho). A migração para DB NÃO pode alterar este contrato. Único ponto de mudança interna: `validarCupom` vira async (`await`); a resposta é bit-a-bit a mesma.

- **Origem permitida (CORS)**: `Access-Control-Allow-Origin: https://goiania.roilabs.com.br`
- **Content-Type**: `application/x-www-form-urlencoded` (requisição simples, sem preflight)
- **Autoridade**: o servidor **recomputa** o subtotal a partir de `itens` (nunca confia em valor do cliente).

### Request (form fields)
| Campo | Tipo | Notas |
|---|---|---|
| `codigo` | string (≤ 40) | código do cupom digitado |
| `itens` | JSON string (≤ 5000) | `[{ slug, caixas }]`; itens desconhecidos/inválidos são descartados |

### Response 200 (sucesso)
```json
{ "ok": true, "codigo": "OBRA10", "tipo": "percentual", "desconto": 123.45, "descontoFmt": "R$ 123,45" }
```

### Response 200 (recusado / vazio)
```json
{ "ok": false, "motivo": "invalido" }   // ou: inativo | expirado | minimo | vazio
```

Regras de recusa vindas de `avaliarCupom`: `invalido` (não existe), `inativo`, `expirado` (fora da validade), `minimo` (subtotal < mínimo). `vazio` = itens não parseáveis ou subtotal ≤ 0 (curto-circuito antes de `validarCupom`).

**Invariante**: o valor/código do cupom NUNCA vai no bundle do front; só o resultado calculado no servidor é exposto.
