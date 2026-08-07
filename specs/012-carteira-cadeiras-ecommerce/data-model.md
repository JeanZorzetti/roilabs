# Data Model — 012 carteira de cadeiras

**Data**: 2026-08-07 · Base: `app/prisma/schema.prisma` **lido**, não de memória.

**Princípio que governa tudo aqui:** `Pedido`, `ItemPedido`, `ItemPedidoFita`, `precos.ts` e
`frete.ts` **não mudam** (FR-001). O gatilho de generalização da spec 011 não disparou. Toda a
mudança está em *como um negócio pode nascer sem pedido* e em *onde moram as credenciais do
gateway do parceiro*.

---

## 1. `NegocioOriginado` — ALTERADO (o único toque em tabela existente)

```prisma
model NegocioOriginado {
  // ... campos existentes inalterados ...

  pedidoId String? @map("pedido_id")   // ERA NOT NULL
  pedido   Pedido? @relation(fields: [pedidoId], references: [id])

  // 012: de onde este negócio veio. 'pedido' = carrinho da ROI Labs (porcelanato/fitas);
  // 'webhook' = venda no gateway do parceiro, sem pedido interno.
  origem        String  @default("pedido")   // 'pedido' | 'webhook'
  vendaId       String? @map("venda_id")     // FK para VendaParceiro quando origem='webhook'

  venda VendaParceiro? @relation(fields: [vendaId], references: [id])
}
```

**A invariante que o `@default` não garante — e por isso vira teste:** exatamente **uma** origem
preenchida. `origem='pedido'` ⇒ `pedidoId` presente e `vendaId` nulo; `origem='webhook'` ⇒ o
inverso. Postgres faria isso com CHECK constraint, que **o Prisma não declara** — então é
validação de servidor **mais** um teste que tenta gravar as quatro combinações e exige que só
duas passem.

⚠️ **`pedidoId` anulável é uma landmine conhecida desta casa**: consulta com
`where: { pedidoId: … }` que antes cobria 100% das linhas passa a ignorar em silêncio todo negócio
de webhook. **Toda leitura existente de `NegocioOriginado` tem de ser varrida** — é o mesmo defeito
que o comentário do `freteMotivo` registra ("NOT NULL aqui quebraria `where: { freteMotivo: null }`,
mesma landmine da 010"). Esta casa já pisou nele duas vezes.

**Backfill**: `origem='pedido'` para toda linha existente, explicitamente por script — o
`@default` **não** reescreve linha já gravada (a lição registrada em `migrate-011-backfill.mjs`).

---

## 2. `VendaParceiro` — NOVO

A venda crua reportada pelo gateway. Tabela nova, sem linha antiga → **sem risco de backfill**.

```prisma
model VendaParceiro {
  id          String   @id @default(cuid())
  parceiroId  String   @map("parceiro_id")
  gateway     String                                  // 'mercadopago' | 'stripe' | 'kiwify'
  eventoId    String   @map("evento_id")              // id do evento NO gateway
  pagamentoId String   @map("pagamento_id")           // id do pagamento NO gateway
  valor       Decimal  @db.Decimal(10, 2)             // valor bruto lido DO gateway
  moeda       String   @default("BRL")
  status      String                                  // 'aprovada' | 'reembolsada' | 'estornada'
  recorrente  Boolean  @default(false)                // assinatura vs compra única
  clienteDoc  String?  @map("cliente_doc")            // CPF/CNPJ normalizado, quando o gateway dá
  clienteRef  String?  @map("cliente_ref")            // id/e-mail do cliente NO gateway
  payload     Json                                    // cru, como chegou — auditoria
  recebidoEm  DateTime @default(now()) @map("recebido_em")

  parceiro Parceiro           @relation(fields: [parceiroId], references: [id])
  negocios NegocioOriginado[]

  @@unique([gateway, eventoId])        // ← a idempotência de FR-004, no BANCO
  @@index([parceiroId, clienteRef])    // classificar aquisição × recorrência
  @@map("vendas_parceiro")
}
```

**Regras:**
- **`@@unique([gateway, eventoId])` é a idempotência**, e ela mora no banco de propósito. Checar
  em código antes de gravar é corrida entre dois retries simultâneos do gateway — e retry
  simultâneo é o comportamento normal deles, não o excepcional.
- `valor` e `status` vêm **do gateway consultado**, nunca do corpo da notificação (FR-003b).
- `payload` cru é obrigatório: sem ele, um negócio disputado não tem como ser reconstruído.
- **`clienteDoc` pode ser nulo** e isso já tem semântica definida na spec 010: sem doc →
  **aquisição**. Não inventar regra nova.

---

## 3. `CredencialGateway` — NOVO

Onde mora o segredo por conta de parceiro. **Não em `Parceiro`**: um parceiro pode ter mais de uma
conta (o `sirius` tem os dois SDKs), e segredo em coluna de tabela muito lida vaza em `select *`.

```prisma
model CredencialGateway {
  id          String   @id @default(cuid())
  parceiroId  String   @map("parceiro_id")
  gateway     String                                // 'mercadopago' | 'stripe' | 'kiwify'
  contaRef    String   @map("conta_ref")            // user_id (MP) / account (Stripe) / loja (Kiwify)
  segredoRef  String   @map("segredo_ref")          // NOME da env var, NUNCA o segredo
  ativo       Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")

  parceiro Parceiro @relation(fields: [parceiroId], references: [id])

  @@unique([gateway, contaRef])
  @@index([parceiroId])
  @@map("credenciais_gateway")
}
```

**`segredoRef` guarda o NOME da variável de ambiente, nunca o valor.** Segredo de webhook no banco
é segredo num backup, num dump de debug e no `select *` de qualquer admin. A env fica na
EasyPanel; o banco guarda só o ponteiro. *(Esta casa já tem uma memória inteira de segredos a
rotacionar por terem vazado para repositório — não aumentar a lista.)*

⚠️ **`@@unique([gateway, contaRef])` é o que impede dois parceiros reivindicarem a mesma conta** —
sem isso, a atribuição de uma venda vira ambígua e o fee vai para o parceiro errado.

---

## 4. `Cadeira` — ALTERADO (3 colunas)

```prisma
model Cadeira {
  // ... campos existentes inalterados ...

  // 012: estado da cadeira no ciclo de vendabilidade. Substitui a leitura de `status`
  // (string livre de exibição) para decisão de máquina.
  estado    String  @default("vaga")
  // 'vaga' | 'em-preparacao' | 'ocupada-sem-produto' | 'ocupada-vendavel'

  daCasa    Boolean @default(false) @map("da_casa")        // FR-010: nunca gera fee de si mesma
  exibirDaCasa Boolean @default(false) @map("exibir_da_casa") // FR-010a: só sirius/meridian/orion
}
```

**`daCasa` e `exibirDaCasa` são DOIS campos de propósito, e não um.** A decisão do Jean é
justamente que eles divergem: cadeira da casa é marcada **sempre** no dado (`daCasa=true`, e por
isso não fatura fee de si mesma) mas exibida como parceiro, **exceto** `sirius`, `meridian` e
`orion` (`exibirDaCasa=true`). Derivar um do outro apagaria a decisão. A lista de exceções é
**dado**, nunca condição no código.

⚠️ **`status` (existente) continua sendo texto de exibição** — `'Ocupada · Tapepro'`. Nenhuma
decisão de máquina pode ler `status`: casar substring de rótulo é a mesma classe de defeito que
`GEO-01` medindo a palavra `GPTBot` em vez da permissão.

---

## 5. O que NÃO muda

| | por quê |
|---|---|
| `Pedido`, `ItemPedido`, `ItemPedidoFita` | gatilho da 011 não disparou (FR-001) |
| `precos.ts`, `frete.ts` | idem |
| `FaturaSuccessFee` | a regra de fee não muda; só a fonte dos negócios cresce |
| `Parceiro.comissaoAquisicao/Recorrencia` | spec 010 intacta |
| `/api/pagamentos/webhook` | é o caminho que fatura hoje (FR-005a) |

---

## 6. Ordem de aplicação (`prisma db push` é MANUAL, de máquina que alcança o host)

1. Criar `VendaParceiro`, `CredencialGateway` (tabelas novas — sem risco).
2. Colunas novas em `Cadeira` com `@default` (sem risco).
3. **`NegocioOriginado.pedidoId` → anulável** ⚠️ e `origem` com `@default('pedido')`.
4. **Backfill explícito** de `origem` por script; conferir contagem antes e depois.
5. **Varrer todas as leituras de `NegocioOriginado`** por `pedidoId` (item 1).

`migrate diff --script` antes de qualquer `db push` — é o preview seguro já registrado na 010.
