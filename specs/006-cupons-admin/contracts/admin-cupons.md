# Contrato NOVO — CRUD admin de cupons (`isAuthed`)

Todas as escritas exigem sessão admin (`isAuthed()` → 401 se ausente). Padrão espelha `api/centros-custo/parametros/route.ts` (validação server-side, respostas JSON `{ ok }`). `force-dynamic`.

## `GET /api/cupons` — lista
Retorna todos os cupons (para a tela `/admin/cupons`). Somente admin.
```json
[
  { "id": "clx…", "codigo": "OBRA10", "tipo": "percentual", "valor": 10,
    "validadeInicio": null, "validadeFim": null, "minimo": 500, "ativo": true,
    "createdAt": "2026-…", "updatedAt": "2026-…" }
]
```
`valor`/`minimo` como `Number`; datas ISO ou `null`.

## `POST /api/cupons` — cria
Body JSON:
```json
{ "codigo": "obra15", "tipo": "percentual", "valor": 15,
  "validadeInicio": "2026-07-01", "validadeFim": "2026-12-31", "minimo": 800, "ativo": true }
```
- Normaliza `codigo` → MAIÚSCULAS + trim.
- Validação (FR-012): `codigo` não-vazio e único; `tipo ∈ {percentual,fixo}`; `percentual ⇒ 0≤valor≤100`, `fixo ⇒ valor≥0`; `minimo≥0` se presente; `validadeInicio ≤ validadeFim` se ambas.
- **Sucesso**: `201` `{ "ok": true, "id": "clx…" }`
- **Erros**: `400` `{ "ok": false, "motivo": "<campo/razão>" }`; código duplicado ⇒ `409` `{ "ok": false, "motivo": "código já existe" }`; sem auth ⇒ `401`.

## `PATCH /api/cupons/[id]` — edita
`params: Promise<{ id }>` + `await params`. Body = subconjunto dos campos do `POST` (incl. `codigo`, `ativo`). Mesma validação; unicidade de `codigo` ignora o próprio `id`.
- **Sucesso**: `200` `{ "ok": true }`
- **Erros**: `400` validação · `404` id inexistente · `409` código duplicado · `401` sem auth.

## `DELETE /api/cupons/[id]` — apaga (hard delete)
Remove a linha. Pedidos passados intactos (snapshot). Idempotente (`deleteMany`/tolera ausente).
- **Sucesso**: `200` `{ "ok": true }` · sem auth ⇒ `401`.

**Nota de segurança**: estas rotas são internas ao admin (mesma origem); NÃO recebem CORS do site (diferente de `/api/cupom/validar`).
