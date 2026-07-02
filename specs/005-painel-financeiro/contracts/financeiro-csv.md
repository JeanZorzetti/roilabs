# Contract — Export CSV do Financeiro

## `GET /api/financeiro/csv`

Exporta os pedidos pagos como CSV (uma linha por pedido) para a contabilidade.

### Auth
- Requer sessão admin válida (`isAuthed()`); sem sessão → `401`.

### Query params (opcionais)
- `de` (`YYYY-MM`): mês inicial inclusive. Ausente = sem limite inferior.
- `ate` (`YYYY-MM`): mês final inclusive. Ausente = sem limite superior.
- Sem params = todos os pedidos pagos. Bucket por `pedido.createdAt` (clarificação Q2).

### Resposta `200`
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="roilabs-financeiro-<periodo>.csv"`
- Corpo: UTF-8 **com BOM**, delimitador `;`, decimais com vírgula, datas `dd/MM/yyyy`.

#### Colunas (cabeçalho na 1ª linha)
```
data;pedido_id;gmv;modalidade;liquido
```
- `data`: data de criação do pedido (`dd/MM/yyyy`)
- `pedido_id`: id do pedido
- `gmv`: soma dos `subtotal` dos itens do pedido (R$, vírgula)
- `modalidade`: `Intermediação` | `White Label` (modalidade oficial do pedido)
- `liquido`: líquido do pedido na sua modalidade oficial (R$, vírgula), via `lib/financeiro`/`lib/centros-custo`

> Pedido com itens de modalidades mistas: somar o líquido de cada item na sua própria modalidade; a coluna `modalidade` reporta a predominante do pedido. (No volume atual cada pedido é de uma modalidade só; `ponytail`: tratar misto só se aparecer.)

### Reconciliação (invariante testável)
- A soma de `gmv` e de `liquido` do CSV para um período **bate exatamente** com os totais da tela `/admin/financeiro` no mesmo período (FR-012 / SC-004).

### Erros
- `401` sem auth (corpo vazio ou JSON `{ ok:false }`, seguindo o padrão das rotas admin existentes).
- Período inválido (`de`/`ate` fora de `YYYY-MM`) → `400` com `{ ok:false, motivo }`.
