# Data Model — 012 carteira de cadeiras

**Data**: 2026-08-07 · Base: `app/prisma/schema.prisma` **lido**, não de memória.

**Princípio que governa tudo aqui:** `Pedido`, `ItemPedido`, `ItemPedidoFita`, `precos.ts` e
`frete.ts` **não mudam** (FR-001). O gatilho de generalização da spec 011 não disparou. Toda a
mudança está em *como um negócio pode nascer sem pedido*, *onde moram as credenciais do gateway do
parceiro*, *quem é o projeto que ocupa a cadeira* e *o que aquela cadeira vende*.

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

  // 012: chave de cliente quando o gateway não entrega documento (id/e-mail NO gateway).
  // `clienteDoc` continua sendo a preferida; esta é o fallback do passo 2 do contrato.
  clienteRef    String? @map("cliente_ref")

  venda VendaParceiro? @relation(fields: [vendaId], references: [id])

  @@index([parceiroId, clienteRef])   // espelha o índice de clienteDoc, para a classificação
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

**`clienteRef` NÃO tem backfill**: nulo em linha antiga é o valor **correto** — negócio de origem
`pedido` classifica por `clienteDoc`, como sempre classificou. A coluna existe porque a
classificação de venda SaaS precisa dela (`contracts/webhook-carteira.md`, regra 2) e porque
cabe **no mesmo `db push`** desta tabela — adicioná-la depois custaria uma segunda migração manual.

---

## 2. `VendaParceiro` — NOVO

A venda crua reportada pelo gateway. Tabela nova, sem linha antiga → **sem risco de backfill**.

```prisma
model VendaParceiro {
  id          String   @id @default(cuid())
  parceiroId  String?  @map("parceiro_id")            // NULL = não atribuída (FR-005), falha fechada
  gateway     String                                  // 'mercadopago' | 'stripe'
  eventoId    String   @map("evento_id")              // id do evento NO gateway
  pagamentoId String   @map("pagamento_id")           // id do pagamento NO gateway
  valor       Decimal  @db.Decimal(10, 2)             // valor bruto lido DO gateway
  moeda       String   @default("BRL")
  status      String                                  // 'aprovada' | 'reembolsada' | 'estornada'
  recorrente  Boolean  @default(false)                // assinatura vs compra única
  clienteDoc  String?  @map("cliente_doc")            // CPF/CNPJ normalizado, quando o gateway dá
  clienteRef  String?  @map("cliente_ref")            // id/e-mail do cliente NO gateway
  payload     Json                                    // cru, como chegou — auditoria
  motivoDescarte String? @map("motivo_descarte")      // 'conta-divergente' | 'payer-teste' | null
  recebidoEm  DateTime @default(now()) @map("recebido_em")

  parceiro Parceiro?          @relation(fields: [parceiroId], references: [id])
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
- **`clienteDoc` pode ser nulo.** A classificação então cai para `clienteRef`, e antes de tudo
  isso para `recorrente` — a regra ordenada vive em `contracts/webhook-carteira.md` e é lá que se
  lê, para a mesma pergunta não ser respondida em dois lugares.
- **`parceiroId` anulável é o que dá lugar ao não-atribuído.** Com ele NOT NULL, "registrar como
  não-atribuído" (FR-005) não tinha onde cair: a linha nasceria atribuída ao parceiro errado, que
  é precisamente o defeito que a falha fechada existe para impedir. A conta é conferida **antes**
  da única escrita (contrato, passo 4) — não depois.
- **`motivoDescarte` serve dois requisitos com uma coluna**: conta divergente (FR-005) e payer de
  teste (FR-006, que exige "registrando o motivo do descarte"). Nulo = venda boa.

---

## 3. `CredencialGateway` — NOVO

Onde mora o segredo por conta de parceiro. **Não em `Parceiro`**: um parceiro pode ter mais de uma
conta (o `sirius` tem os dois SDKs), e segredo em coluna de tabela muito lida vaza em `select *`.

```prisma
model CredencialGateway {
  id          String   @id @default(cuid())
  parceiroId  String   @map("parceiro_id")
  gateway     String                                // 'mercadopago' | 'stripe'
  contaRef    String   @map("conta_ref")            // user_id (MP) / account (Stripe)
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

  // 012: identidade do projeto que ocupa a cadeira. A chave é a URL DO SITE, não o repo —
  // 35 dos 36 repos têm site próprio, e é o site que se vende.
  siteUrl String? @unique @map("site_url")
  repoUrl String? @map("repo_url")
}
```

**`siteUrl` é a identidade; `repoUrl` é o que FR-011 dedupe.** Sem estas duas colunas, FR-007
("comportar os 35") e FR-011 ("impedir que o mesmo repositório conte como duas cadeiras") não têm
onde escrever — o `model Cadeira` de hoje é `{niche, status, open, ordem, polo}` e **não tem
identificador de projeto nenhum**. Nulo é permitido (Postgres aceita múltiplos nulos em `@unique`)
porque cadeira **vaga** não tem projeto.

⚠️ **FR-011 NÃO vira constraint.** `@@unique` em `repoUrl` proibiria para sempre um repo servir
dois sites legítimos — e `goiania` e `roilabs` são exatamente isso hoje. Vira **teste**: nenhuma
cadeira compartilha `repoUrl` com outra (T068). Teto registrado: se um dia dois sites do mesmo
repo forem duas cadeiras de verdade, o teste é o lugar onde a decisão aparece.

**`daCasa` e `exibirDaCasa` são DOIS campos de propósito, e não um.** A decisão do Jean é
justamente que eles divergem: cadeira da casa é marcada **sempre** no dado (`daCasa=true`, e por
isso não fatura fee de si mesma) mas exibida como parceiro, **exceto** `sirius`, `meridian` e
`orion` (`exibirDaCasa=true`). Derivar um do outro apagaria a decisão. A lista de exceções é
**dado**, nunca condição no código.

⚠️ **`status` (existente) continua sendo texto de exibição** — `'Ocupada · Tapepro'`. Nenhuma
decisão de máquina pode ler `status`: casar substring de rótulo é a mesma classe de defeito que
`GEO-01` medindo a palavra `GPTBot` em vez da permissão.

---

## 4.5 `ProdutoCadeira` — NOVO

O que se vende naquela cadeira. Tabela nova, sem linha antiga → **sem risco de backfill**.

```prisma
model ProdutoCadeira {
  id           String   @id @default(cuid())
  cadeiraId    String   @unique @map("cadeira_id")   // ZERO OU UM por cadeira na fase 1
  nome         String
  descricao    String?
  preco        Decimal  @db.Decimal(10, 2)
  moeda        String   @default("BRL")
  recorrencia  String   @default("unica")            // 'unica' | 'mensal' | 'anual'
  modoCobranca String   @map("modo_cobranca")        // 'carrinho' | 'parceiro'
  checkoutUrl  String?  @map("checkout_url")         // destino quando modoCobranca='parceiro'
  publicado    Boolean  @default(false)
  updatedAt    DateTime @updatedAt @map("updated_at")

  cadeira Cadeira @relation(fields: [cadeiraId], references: [id])

  @@map("produtos_cadeira")
}
```

**Regras:**

- **`preco` é a fonte do `Offer` de FR-013.** Sem esta tabela a página de cadeira não tem de onde
  tirar preço — era o buraco entre a Key Entity "Produto de cadeira" da spec e o schema.
- `modoCobranca='parceiro'` ⇒ `checkoutUrl` **obrigatório** — validação de servidor, mesma classe
  da invariante de origem do §1. Sem ele, FR-008 vira um botão que leva a lugar nenhum.
- `publicado=false` ⇒ sem URL pública indexável e sem entrada no sitemap (FR-009).
- **`@unique` no `cadeiraId` é o teto declarado**: catálogo com múltiplos SKUs continua exclusivo
  de porcelanato e fitas (FR-001). Caminho de upgrade: dropar o `@unique` quando uma cadeira
  precisar de dois produtos — nada mais muda.
- **Não toca `Cadeira`.** Preço e modo de cobrança são atributos do produto, não do nicho.

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

⚠️ **Passo 0 — as relações inversas.** O Prisma exige o outro lado de toda relação e **falha no
`generate`** sem ele. As três tabelas novas obrigam a acrescentar em modelos existentes:
`Parceiro { vendas VendaParceiro[]  credenciais CredencialGateway[] }` e
`Cadeira { produto ProdutoCadeira? }`. São linhas de relação, não colunas — não geram SQL.

1. Criar `VendaParceiro`, `CredencialGateway`, **`ProdutoCadeira`** (tabelas novas — sem risco).
2. Colunas novas em `Cadeira` com `@default` — e `siteUrl`/`repoUrl` anuláveis (sem risco).
3. **`NegocioOriginado.pedidoId` → anulável** ⚠️, `origem` com `@default('pedido')` e `clienteRef`.
4. **Backfill explícito** de `origem` por script; conferir contagem antes e depois.
5. **Varrer todas as leituras de `NegocioOriginado`** por `pedidoId` (item 1).

`migrate diff --script` antes de qualquer `db push` — é o preview seguro já registrado na 010.

⚠️ **É UM `db push` só, e isso é decisão de projeto.** Toda coluna que alguma fase vai precisar
está aqui: `clienteRef` (classificação), `siteUrl`/`repoUrl` (FR-007/FR-011), `motivoDescarte`
(FR-005/FR-006) e a `ProdutoCadeira` inteira (FR-013, e a antiga T038). `db push` é **manual, de
máquina que alcança o host** — cada migração esquecida é uma viagem ao host no meio da entrega.
