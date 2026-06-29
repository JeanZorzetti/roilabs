# Contrato — delta de `POST /api/pedidos` (checkout)

Estende o checkout da 002 (ver `specs/002-ecommerce-porcelanato/contracts/pedidos.md`). **Tudo da 002 permanece**; só o que muda está aqui.

## Campos novos no request (urlencoded)
| campo | obrig. | descrição |
|---|---|---|
| `cupom` | não | código de cupom aplicado no carrinho (string) |

> `entrega` agora também aceita `retirada`/`entrega` como na 002; CEP fora da tabela continua virando `a_combinar`. Nenhum valor monetário do cliente é aceito (FR-017), inclusive `desconto`.

## Processamento (passos adicionados, na ordem)
1. (002) Recalcula itens via `precos.ts` → `subtotalProduto = Σ subtotais`.
2. **NOVO** — se `cupom` presente: `validarCupom(cupom, subtotalProduto)` (re-validação autoritativa, FR-014).
   - válido → `desconto` do servidor; grava `cupomCodigo` + `desconto` no `Pedido`.
   - inválido/expirado → **ignora o desconto** (cobra sem ele) e sinaliza ao retorno (ex.: `?aviso=cupom`); o pedido segue.
3. (002) Frete via `frete.ts` (agora com `prazo` disponível para o `Pedido`/retorno).
4. **ALTERADO** — `total = subtotalProduto − (desconto ?? 0) + (frete ?? 0)` (nunca < 0).
5. **ALTERADO** — preferência MP: escalar `unitPrice` dos itens para que o **total da preferência == `total`** do servidor (sem item negativo — ver `research.md` D7).
6. (002) Persiste `Pedido`/`ItemPedido`, cria preferência, 303 → `init_point`.

## Response
- Inalterada (303 → MP em sucesso; 303 → `/carrinho?erro=...` em falha). Em cupom invalidado no checkout, pode anexar `&aviso=cupom` ao `back_url` de retorno para o cliente saber que o desconto não valeu.

## Admin (`GET /api/pedidos` + `/admin/pedidos`)
- Passa a expor `cupomCodigo` e `desconto` por pedido (coluna nova na listagem). Sem mudança de auth.
