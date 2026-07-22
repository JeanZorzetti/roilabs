# Data Model — 011 E-commerce de fitas adesivas Tapepro

**Data**: 2026-07-22 · Base: `app/prisma/schema.prisma` (verificado, não de memória).

**Princípio que governa tudo aqui**: `ItemPedido`, `precos.ts` e `frete.ts` são de **porcelanato** e não mudam (FR-003/FR-017). Fitas vivem em estruturas próprias.

---

## 1. `ItemPedidoFita` — NOVO

Espelha o papel do `ItemPedido`, na unidade certa. Tabela nova, sem linha antiga → **sem risco de backfill**.

```prisma
model ItemPedidoFita {
  id          String  @id @default(cuid())
  pedidoId    String  @map("pedido_id")
  slug        String
  rolos       Int
  precoRolo   Decimal @db.Decimal(10, 2) @map("preco_rolo")  // snapshot do unitário da faixa aplicada
  faixaMin    Int     @map("faixa_min")                      // faixa aplicada, para auditoria
  faixaMax    Int?    @map("faixa_max")                      // null = faixa sem teto
  subtotal    Decimal @db.Decimal(10, 2)

  pedido Pedido @relation(fields: [pedidoId], references: [id], onDelete: Cascade)

  @@index([pedidoId])
  @@map("itens_pedido_fita")
}
```

**Regras**:
- `rolos ≥ minimoRolos` do SKU (FR-029), validado no servidor.
- `precoRolo` = unitário da **faixa correspondente a `rolos`**, resolvida no servidor (FR-038). Nunca vem do cliente.
- `subtotal = rolos × precoRolo`, recalculado no servidor (FR-006).
- `precoRolo`, `faixaMin` e `faixaMax` são **snapshot** (FR-008): mudar a tabela depois não altera pedido fechado.
- `faixaMin`/`faixaMax` existem para **auditoria** — sem eles, um pedido antigo não permite reconstruir *por que* cobrou aquele unitário, e caminho de dinheiro precisa ser auditável.
- **Sem coluna de clichê** (FR-040): a personalizada é só-orçamento, então nenhum pedido do sistema carrega clichê. Valor variável não entra em caminho de dinheiro automatizado.
- Sem `m2`, sem `caixas`, sem `precoM2` — a unidade não se mistura (FR-002).

---

## 2. `Pedido` — ALTERADO (2 colunas)

```prisma
model Pedido {
  // ... campos existentes inalterados ...

  vertical    String  @default("porcelanato")  // 'porcelanato' | 'fitas'
  freteMotivo String? @map("frete_motivo")     // 'cep_nao_atendido' | 'falha_tecnica' | null

  itens      ItemPedido[]      // porcelanato (existente, intocado)
  itensFita  ItemPedidoFita[]  // NOVO
}
```

| Coluna | Por quê | Migração |
|---|---|---|
| `vertical` | Diz qual relação de itens ler e qual modelo de frete se aplica. Um pedido tem itens de **um só** vertical (FR-028). | `@default("porcelanato")` cobre pedidos existentes automaticamente. Backfill explícito mesmo assim, para não depender do default. |
| `freteMotivo` | Separa operação normal (`cep_nao_atendido`) de incidente (`falha_tecnica`) — FR-034. É o campo que impede a perda silenciosa de receita. | Anulável. `null` = frete calculado normalmente **ou** pedido anterior à feature. |

**Invariante**: `frete = null` (a combinar) ⇒ para pedidos de fita, `freteMotivo` **não** pode ser `null`. Se caiu em "a combinar", há um motivo registrado.

> ⚠️ **Gotcha da 010 aplicado**: `freteMotivo` é anulável **de propósito**. Torná-lo `NOT NULL` quebraria `where: { freteMotivo: null }` e viraria a mesma landmine da spec anterior.

---

## 3. `Cupom` — ALTERADO (1 coluna + backfill obrigatório)

```prisma
model Cupom {
  // ... campos existentes inalterados ...

  escopo String @default("porcelanato")  // 'porcelanato' | 'fitas' | 'ambos'
}
```

**Backfill NÃO-NEGOCIÁVEL** (FR-037): todo cupom existente vira `'porcelanato'`. Ausência de escopo **não** pode ser lida como `'ambos'` — senão todo cupom vigente passa a valer para fita por omissão, drenando a margem do parceiro.

O `@default` cobre linhas novas; o script de backfill cobre as existentes. **Os dois**, porque o default não reescreve linha já gravada.

**Validação**: cupom aplicado a carrinho fora do escopo → rejeitado com motivo novo `'escopo'`, reusando o caminho de "cupom rejeitado" que já existe (cobra sem desconto + avisa). Nunca aplicar em silêncio.

---

## 4. Preço-autoridade de fita — `app/src/lib/precos-fitas.ts` (NOVO, não é tabela)

Espelha `precos.ts`, que é um `Record` em código — mesmo padrão, mesma justificativa (catálogo fechado de 3 SKUs; tabela no banco só se virar dinâmico).

**Preço é escalonado por faixa de quantidade** (FR-038) — confirmado pela tabela oficial em `site-goiania/docs/Imagens/`.

```ts
export interface FaixaPreco {
  min: number;          // inclusivo
  max: number | null;   // inclusivo; null = sem teto
  precoRolo: number;    // R$ por rolo nesta faixa
}

export interface PrecoFita {
  faixas: FaixaPreco[]; // ordenadas por min, sem lacuna e sem sobreposição
  minimoRolos: number;  // FR-029 — igual ao min da primeira faixa
  pesoKg: number;       // por rolo — entra na cotação de frete
  alturaCm: number;     // dimensões da embalagem, exigidas pela cotação
  larguraCm: number;
  comprimentoCm: number;
}
```

### Tabela oficial (fonte: `docs/Imagens/WhatsApp Image 2026-07-20 at 23.51.19.jpeg`)

| SKU | Faixa (rolos) | R$/un | Modalidade |
|---|---|---|---|
| `fita-transparente-comum` | 1+ (única) | 7,90 | ✅ **preço público** — entra em `precos-fitas.ts` |
| `fita-gomada` | 15–100 | 37,20 | ✅ **preço público** |
| | 101+ | 32,20 | |
| `fita-transparente-personalizada` | 20–49 | 16,20 | 🔵 **só-orçamento** — **NÃO** entra em `precos-fitas.ts` |
| | 50–99 | 13,90 | (faixas exibidas na página como informação) |
| | 100–199 | 10,50 | |
| | 200+ | 10,10 | |

**Clichê flexográfico**: R$ 80,00 "**a partir de**", custo único **por arte** — não por pedido. **Fora do caminho de dinheiro** (FR-040): valor variável e isenção natural na recompra da mesma arte tornam a cobrança automática errada nos dois sentidos. Fechado no orçamento.

> Só **2 dos 3 SKUs** entram em `precos-fitas.ts`. A personalizada estar **ausente** da tabela é o que a marca como só-orçamento — exatamente o mecanismo do FR-005 (modalidade por presença, nunca por `preco = 0`).

### ⚠️ Duas ambiguidades de fronteira na tabela original

A tabela impressa tem uma lacuna e uma sobreposição. Em caminho de dinheiro isso não pode ficar implícito:

| Problema | Texto original | Interpretação adotada | Risco |
|---|---|---|---|
| **Lacuna em 200** | "100 a 199" depois "Acima de 200" — o valor **200 exato** não está em faixa nenhuma | `200+` → R$ 10,10 (faixa mais barata) | Se o Tapepro quis `>200`, cobramos R$ 0,40/un a menos em pedidos de exatamente 200 rolos |
| **Sobreposição em 100** | "15 a 100" e "Acima de 100" — `100` cabe nas duas | `100` → R$ 37,20 (faixa inferior); `101+` → R$ 32,20 | Interpretação literal de "acima de" |

**Ambas favorecem o comprador em caso de dúvida** — escolha deliberada: errar a favor do cliente é reclamação zero; errar contra é estorno e atrito com o parceiro. **Confirmar com o Tapepro** e ajustar uma constante se necessário.

**Invariante de validação** (self-check obrigatório): as faixas de um SKU devem cobrir de `minimoRolos` a infinito **sem lacuna e sem sobreposição**. Uma lacuna faz a função de preço retornar `undefined` no meio do carrinho — e é exatamente o defeito que a tabela original tinha.

**Modalidade comercial** (FR-005): um SKU está em `precos-fitas.ts` ⇒ tem preço público. Ausente ⇒ só-orçamento. A distinção é **presença na tabela**, nunca `preco = 0` — a armadilha que o FR-005 proíbe.

> ⚠️ **Ainda pendente do Tapepro**: **peso e dimensões da embalagem** por rolo. Sem eles a cotação de frete não roda. Preço **deixou de ser bloqueio** — a tabela existe.

> 💡 **Promoção relâmpago**: as outras duas imagens são a mesma oferta temporária (personalizada a R$ 11,90 e R$ 9,90). É mecanismo de venda por prazo — **fora do v1**; quando entrar, o caminho natural é o sistema de cupom com escopo `fitas`, não uma segunda tabela de preço.

---

## 5. Catálogo de fitas — `site-goiania/src/data/fitas.ts` (NOVO, não é tabela)

Espelha o papel de `produtos.ts`. **Fatos** importados do institucional (`Tapepro/src/lib/produtos.ts`), **copy comercial** própria (FR-027/FR-032).

| Campo | Origem | Observação |
|---|---|---|
| `slug`, `nome` | Institucional | Mesmos slugs, para consistência entre os domínios |
| `specs[]` (largura, comprimento, material, reforço, ativação) | Institucional — **não pode divergir** | Travado por asserção no `check-matrix.mjs` |
| `minimoRolos` | Institucional (20 personalizada · 15 gomada) | Espelhado em `precos-fitas.ts`; servidor é a autoridade |
| `imagem` | `Tapepro/src/assets/produtos/` | ⚠️ **Excluir** `imagens/com fundo/sua-marca-aqui.png` — marca de outro fornecedor |
| `copyComercial`, `chamadaVitrine` | **Nova** | Intenção transacional (FR-032) |
| `modalidade` | Derivada | `precoPublico` se está em `precos-fitas.ts`, senão `orcamento` |

**Os 3 SKUs do v1** (fatos verificados em `Tapepro/src/lib/produtos.ts`):

| slug | Medidas | Material | Mínimo |
|---|---|---|---|
| `fita-transparente-personalizada` | 48 mm × 100 m | BOPP transparente, até 2 cores | 20 rolos |
| `fita-gomada` | 70 mm × 150 m | Kraft gomado, fios de nylon, ativação com água | 15 rolos |
| `fita-transparente-comum` | 48 mm × 100 m | BOPP transparente, sem impressão | ⚠️ não declarado |

---

## 6. O que NÃO muda

Registrado explicitamente porque é o núcleo da decisão de vertical paralelo:

| Artefato | Estado |
|---|---|
| `model ItemPedido` | **Intocado** — nenhuma coluna nova |
| `app/src/lib/precos.ts` | **Intocado** |
| `app/src/lib/frete.ts` | **Intocado** — tabela da Grande Goiânia segue só para porcelanato |
| `site-goiania/src/lib/cart.ts` | **Intocado** — chave `roi_cart_v1` |
| `site-goiania/src/data/produtos.ts` · `porcelanato.ts` | **Intocados** |
| `model NegocioOriginado` | **Intocado** — a regra da 010 já funciona; consome `total − frete` |
| URLs de `/porcelanato/` | **Intocadas** (FR-019) |

---

## 7. Ordem da migração (`prisma db push` MANUAL)

A ordem importa e o repo já queimou nisso antes:

1. `db push` do schema (3 alterações: tabela nova + 2 colunas em `Pedido` + 1 em `Cupom`).
2. `node scripts/migrate-011-backfill.mjs` — `Cupom.escopo='porcelanato'` e `Pedido.vertical='porcelanato'` em todas as linhas existentes.
3. **Só então** push do código.

> Inverter 1 e 3 derruba produção: o código novo consulta coluna que ainda não existe. É o mesmo gotcha registrado na 010 — `db push` **sempre** antes do push do código.

**Preview seguro antes de aplicar** (aprendizado da 010):

```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
```
