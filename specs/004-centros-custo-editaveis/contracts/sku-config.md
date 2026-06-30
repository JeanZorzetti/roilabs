# Contract — Config por SKU (piso / modalidade / override)

`/api/centros-custo/sku/[slug]` — dado por-SKU. **Autenticado**; sem sessão → `401`.
Pattern Next 16: `params: Promise<{ slug: string }>` + `await params`.

## PATCH /api/centros-custo/sku/[slug]

Upsert do `sku_config` daquele `slug` (cria se não existe). Só os campos enviados mudam;
enviar `null` num campo **limpa** o override (volta a herdar / estimar).

**Request** (todos opcionais)
```json
{ "piso": 95.00, "modalidadeAlvo": "wl", "linha": "premium", "markup": null }
```

**Campos**
| Campo | Regra |
|---|---|
| `piso` | número `≥ 0` ou `null`. `null` ⇒ atacado volta a ser estimado por markup. Piso > varejo é **aceito** e sinalizado como prejuízo (FR-008) |
| `modalidadeAlvo` | `'wl'` \| `'intermediacao'` \| `null` (`null` ⇒ Intermediação no agregado) |
| `linha` | nome de uma linha existente, ou `null` |
| `markup`, `comissao`, `aliqIntermediacao`, `aliqWL` | override por SKU; mesmas faixas do contrato de parâmetros; `null` limpa |

**Respostas**
- `200` `{ "ok": true, "prejuizo": false }` — gravado; `prejuizo:true` quando o piso torna spread/excedente negativo (aviso, não erro).
- `400` `{ "ok": false, "motivo": "..." }` — fora de faixa ou `slug` inexistente em `precos.ts`; nada gravado.
- `401` — sem sessão.

**Notas**
- O `slug` precisa existir em `precos.ts` (catálogo). Um `sku_config` cujo `slug` saiu do
  catálogo vira **órfão** — não quebra a página, é sinalizado para limpeza (edge case).
- Não há `DELETE`: limpar um SKU = enviar todos os campos como `null` (registro fica
  inerte, herda tudo).
