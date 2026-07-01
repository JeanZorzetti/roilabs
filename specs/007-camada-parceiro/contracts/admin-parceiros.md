# Contrato — CRUD de parceiros (`isAuthed`, mesma origem admin)

Padrão `api/centros-custo/parametros` / `api/cupons`. Escritas exigem `isAuthed` (401). `force-dynamic`.

## `GET /api/parceiros`
Lista parceiros (para `/admin/parceiros`), com estágio, nicho/cadeira, % e ocupação derivada.

## `POST /api/parceiros` — cria
Body: `{ nome, whatsapp?, email?, cpfCnpj?, cidade?, cadeiraId, comissaoPct?, candidaturaId? }`.
- `nicho` derivado da `Cadeira` (`cadeiraId` obrigatório — D5); estágio inicial `sondagem`.
- `cpfCnpj` opcional na criação (obrigatório só para faturar depois).
- Origem opcional em `Candidatura` (`candidaturaId`) — pré-preenche dados.
- Sucesso `201 { ok:true, id }`; erros `400 { ok:false, motivo }` (cadeira inexistente, `comissaoPct` fora de `[0,1]`).

## `PATCH /api/parceiros/[id]` — edita/estágio
`params: Promise<{id}>`+`await`. Body: subconjunto de `{ estagio, comissaoPct, contratoEm, nome, whatsapp, email, cpfCnpj, cidade, cadeiraId }`.
- Transições de `estagio` (`sondagem|ativa|riscada|pausada`) validadas; `ativa` sem `comissaoPct` ⇒ `400` (não pode faturar sem %).
- `contratoEm` setado ⇒ passa a ocupar a cadeira (derivado).
- Sucesso `200 { ok:true }`; `404` id inexistente; `401` sem auth.

## `DELETE /api/parceiros/[id]`
Remove o parceiro **apenas se não houver negócios/faturas** (senão `409` — preservar histórico, FR/edge). Preferir `pausada`/`riscada` a apagar. `401` sem auth.
