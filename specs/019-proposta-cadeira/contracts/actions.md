# Contract — server actions (`app/src/app/admin/propostas/actions.ts`)

Both call `isAuthed()` first: a server action is reachable by its id, outside `admin/layout.tsx` (FR-013).

## `guardarPropostaCadeira(prev, formData) → { erro: string | null }`

Form fields (raw strings, as typed in the simulator):

| Field | Rule |
|---|---|
| `paraQuem` | trimmed, 2..120, otherwise `{ erro: "Escreva para quem é a proposta (de 2 a 120 caracteres)." }` |
| `nichoId` | must be an `id` in `NICHOS`, otherwise `{ erro }` |
| `pedidos`, `ticket`, `recompra`, `assinaturas`, `mensalidade`, `consultas`, `valorConsulta` | `lerNumeroBR`; invalid or empty = 0 (same as the simulator's `ler`) |
| `distribuidor` | `"1"` = true |

Effect: `simular()` → `montarPropostaCadeira()` → `prisma.propostaCadeira.create({ slug, doc })` →
`revalidatePath('/admin/propostas')` → `redirect('/admin/propostas')`.

Failures: no session → `{ erro: "Sessão expirada — entre de novo em /login." }`; database → `{ erro: "Não deu para
guardar agora. A simulação continua aqui: tente de novo ou copie o resumo." }` plus a server log line without the
document.

## `excluirPropostaCadeira(formData) → void`

`id` (cuid). `deleteMany({ where: { id } })` is idempotent: deleting twice is not an error. Revalidates
`/admin/propostas`.
