# Contract — `POST/GET /api/leads-consumidor` (no `/app`)

Espelha `POST/GET /api/candidaturas`. Public POST + protected GET.

## `POST /api/leads-consumidor` (público)

- **Origem:** form nativo de `goiania.roilabs.com.br` (cross-origin). Requisição **simples** urlencoded → **sem preflight CORS**.
- **Content-Type:** `application/x-www-form-urlencoded`
- `export const dynamic = 'force-dynamic'`

**Campos (form):**

| Campo | Obrig. | Limite | Nota |
|---|---|---|---|
| `nome` | ✅ | 200 | |
| `whatsapp` | ✅ | 40 | |
| `consent` | ✅ | — | checkbox; ausente → 400 |
| `produto` | — | 200 | contexto da página |
| `pagina` | — | 300 | slug de origem |
| `mensagem` | — | 4000 | |
| `botcheck` | — | 100 | **honeypot**: preenchido → `200 {ok:true}` sem gravar |
| `redirect` | — | 300 | URL absoluta p/ 303 (→ `/obrigado`) |

**Respostas:**

- `botcheck` presente → `200 { ok: true }` (silencioso, não grava).
- falta `nome`/`whatsapp`/`consent` → `400 { ok:false, error }`.
- sucesso + `redirect` http → `303` Location.
- sucesso sem redirect → `201 { ok: true }`.

**Efeito:** cria 1 `LeadConsumidor` (`consentLGPD = true`).

## `GET /api/leads-consumidor` (protegido)

- `if (!await isAuthed()) → 401`.
- `200` JSON: `findMany({ orderBy: { createdAt: 'desc' } })` — consumido por `/admin/leads`.

## Não muda

`/api/candidaturas`, `/api/cadeiras`, auth — intactos.
