# Contract — Parâmetros (global + linhas)

`/api/centros-custo/parametros` — leitura e escrita das camadas `global` e `linha`.
**Autenticado** (cookie de sessão, `getAuthFromRequest()`); sem sessão → `401`.
Percentuais como fração `[0,1]`. Validação de faixa **no servidor** (FR-003).

## GET /api/centros-custo/parametros

Retorna o global e todas as linhas. (A página server também pode ler direto via Prisma;
o GET serve o island após um save.)

**200**
```json
{
  "global": { "markup": 0.30, "comissao": 0.10, "aliqIntermediacao": 0.102, "aliqWL": 0.062, "cenario": "base" },
  "linhas": [
    { "chave": "premium", "markup": 0.50, "comissao": null, "aliqIntermediacao": null, "aliqWL": null }
  ]
}
```
`null` num campo de linha = herda o global.

## PATCH /api/centros-custo/parametros

Cria/atualiza o global ou uma linha (upsert por `escopo`+`chave`).

**Request**
```json
{ "escopo": "global", "markup": 0.25, "comissao": 0.10, "aliqIntermediacao": 0.102, "aliqWL": 0.062, "cenario": "base" }
```
```json
{ "escopo": "linha", "chave": "premium", "markup": 0.50 }
```

**Campos**
| Campo | Regra |
|---|---|
| `escopo` | obrigatório, `'global'` \| `'linha'` |
| `chave` | obrigatório se `escopo='linha'`; ignorado/`null` no global |
| `markup` | opcional; número `≥ 0` |
| `comissao`, `aliqIntermediacao`, `aliqWL` | opcionais; número em `[0,1]` |
| `cenario` | opcional, só no global; aplicar um preset preenche as alíquotas, mas valor manual posterior prevalece (vira `'ajustado'`) |

Campo **ausente** numa linha = herda; campo ausente no global = mantém o valor atual (não
zera).

**Respostas**
- `200` `{ "ok": true }` — gravado.
- `400` `{ "ok": false, "motivo": "markup deve ser ≥ 0" }` — fora de faixa; **nada gravado**.
- `401` — sem sessão.

**Presets (referência, valores fixos em código — D4)**
| cenário | aliqIntermediacao | aliqWL |
|---|---|---|
| conservador | 0.060 | 0.046 |
| base | 0.102 | 0.062 |
| otimista | 0.127 | 0.078 |
