# Phase 1 — Data Model: Cupons no admin

## Entidade nova: `Cupom` → tabela `cupons`

Espelha o shape do knob atual (`CUPONS` em `lib/cupons.ts`). Substitui a lista em código como fonte de verdade.

| Campo | Tipo Prisma | Coluna | Regras / Notas |
|---|---|---|---|
| `id` | `String @id @default(cuid())` | `id` | Identidade estável (usada nas rotas `[id]`). |
| `codigo` | `String @unique` | `codigo` | **Armazenado em MAIÚSCULAS** (normalizado no create/update). Único (FR-011). Consulta por `findUnique({ codigo })`. |
| `tipo` | `String` | `tipo` | `'percentual'` \| `'fixo'` (validado em runtime). |
| `valor` | `Decimal @db.Decimal(10,2)` | `valor` | percentual: `[0,100]` · fixo: BRL `≥ 0`. Lido como `Number`. |
| `validadeInicio` | `DateTime? @db.Date` | `validade_inicio` | Data-only. `null` = sem início. |
| `validadeFim` | `DateTime? @db.Date` | `validade_fim` | Data-only. `null` = sem fim. |
| `minimo` | `Decimal? @db.Decimal(10,2)` | `minimo` | Subtotal de produto mínimo p/ aplicar. `null` = sem mínimo. `≥ 0`. |
| `ativo` | `Boolean @default(true)` | `ativo` | Desativar ⇒ validação retorna `inativo`. |
| `createdAt` | `DateTime @default(now())` | `created_at` | Convenção do repo. |
| `updatedAt` | `DateTime @updatedAt` | `updated_at` | Convenção do repo. |

```prisma
// Cupons de desconto — migra o knob CUPONS de lib/cupons.ts. Desconto SEMPRE sobre o
// subtotal do produto (nunca frete); servidor é a autoridade única (validado no display
// E re-validado no checkout).
model Cupom {
  id             String    @id @default(cuid())
  codigo         String    @unique                 // armazenado em MAIÚSCULAS
  tipo           String                              // 'percentual' | 'fixo'
  valor          Decimal   @db.Decimal(10, 2)        // percentual 0–100 · fixo BRL
  validadeInicio DateTime? @map("validade_inicio") @db.Date
  validadeFim    DateTime? @map("validade_fim")   @db.Date
  minimo         Decimal?  @db.Decimal(10, 2)
  ativo          Boolean   @default(true)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@map("cupons")
}
```

**Validação (server-side, no CRUD — FR-012)**:
- `codigo`: obrigatório, não-vazio após trim; único (após upper). Duplicado ⇒ 409/erro.
- `tipo`: `'percentual'` ou `'fixo'`.
- `valor`: finito; se `percentual` ⇒ `0 ≤ valor ≤ 100`; se `fixo` ⇒ `valor ≥ 0`.
- `minimo`: se presente, `≥ 0`.
- `validadeInicio` / `validadeFim`: se ambas presentes, `inicio ≤ fim`.

**Ciclo de vida**: criado → editado (qualquer campo, incl. `codigo`) → ativado/desativado → **apagado (hard delete)**. Apagar remove a linha; pedidos passados NÃO são afetados (snapshot em `Pedido`). Sem contador de resgates (uso ilimitado — clarify).

## Entidade existente (inalterada em forma): `Pedido`

Continua guardando o **snapshot** do cupom aplicado — não muda:
- `cupomCodigo String? @map("cupom_codigo")` — código aplicado no momento da compra.
- `desconto Decimal? @db.Decimal(10,2)` — desconto recalculado no servidor.

Independe da existência futura do `Cupom` na tabela ⇒ apagar cupom é seguro para o histórico (SC-005).

## Shape em memória consumido por `avaliarCupom` (pura)

O wrapper async normaliza a linha do DB para:

```ts
type CupomAvaliavel = {
  tipo: 'percentual' | 'fixo';
  valor: number;
  validadeInicio: number | null; // epoch ms (Date → getTime) ou null
  validadeFim: number | null;
  minimo: number | null;
  ativo: boolean;
};
```

`avaliarCupom(c: CupomAvaliavel | null, subtotalProduto: number): ResultadoCupom` mantém `ResultadoCupom`/`Motivo` atuais (contrato externo inalterado). Regra de desconto idêntica: `desconto = round2(min(max(0, bruto), subtotalProduto))`.
