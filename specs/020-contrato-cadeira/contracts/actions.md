# Contract: server actions

Toda action de admin confere `isAuthed()` primeiro (chamada pelo id, por fora do `admin/layout.tsx`).

## `salvarContratoCadeira(formData)` — admin

- Entrada: `propostaId` (emitir) **ou** `contratoId` (editar); `titulo`; `contratante.{name,document,address,representative,email}`;
  `contratada.{…}`; `inicio`; `foro`; `pagamento`; `extra`.
- Relê a proposta do banco (a do contrato, na edição). Proposta inexistente → `Error("Proposta não encontrada.")`.
- Limites: campos de parte cortados em 160/30/300/200/160 (nome/documento/endereço/representante/e-mail), título 140,
  foro 120, pagamento e extra 2.000 — corta em vez de recusar, como o `parseParty` da Vértice.
- Emitir: `create` com slug novo. Proposta que já tem contrato → o `UNIQUE` recusa → `Error("Esta proposta já tem contrato.")`.
- Editar: `updateMany where { id, aceitoEm: null }` gravando `input`, `doc` e `editadoEm = now()`. `count 0` →
  `Error("Contrato já aceito: não se edita.")`.
- Sucesso: `revalidatePath` de `/admin/contratos` e `/admin/propostas`; `redirect("/admin/contratos")`.

## `excluirContratoCadeira(formData)` — admin

- Entrada: `id`. `deleteMany where { id, aceitoEm: null }`. Contrato aceito não sai (FR-018), e a segunda exclusão não é erro.

## `excluirPropostaCadeira(formData)` — admin (existe, muda)

- O `RESTRICT` recusa (Prisma `P2003`) → `Error("Esta proposta tem contrato. Exclua o contrato antes, se ele ainda não foi aceito.")`.

## `aceitarContratoCadeira(formData)` — público

- Entrada: `slug`, `hash`, `nome`, `cpf`, `concordo`.
- Validação, na ordem, cada uma → `redirect("/c/<slug>?erro=<código>#aceite")`:
  - `nome`: 5 a 120 caracteres com pelo menos 2 palavras → `nome`
  - `cpf`: 11 dígitos com dígito verificador válido → `cpf`
  - `concordo === "sim"` → `caixa`
- Lê o contrato por slug. Inexistente → `notFound()`. Aceito → `redirect("/c/<slug>")` (a página mostra o aceito).
  `pendencias.length > 0` → `redirect("/c/<slug>")` (a página já mostra "em preenchimento"). `hashDoc(doc) !== hash` →
  `erro=mudou`.
- Grava: `updateMany where { id, aceitoEm: null, editadoEm: <lido> }` com `aceitoEm = now()`, `aceitoPor`, `aceitoCpf`
  (dígitos), `aceitoIp`, `aceitoUa`, `aceitoHash`. `count 0` → `redirect("/c/<slug>")` (outro aceite venceu, ou houve
  edição: a página mostra o estado atual).
- Sucesso: `redirect("/c/<slug>")`.
