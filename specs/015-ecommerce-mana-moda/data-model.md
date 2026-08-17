# Fase 1 — Data Model: a cadeira Maná Moda

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Research**: [research.md](./research.md)

Uma unidade nova, um catálogo com variação, três tabelas novas, duas colunas novas. Tudo o mais
é preservação do que a 013 e a 012 já construíram.

---

## 1. Unidade de venda `peca` (`site-goiania/src/data/unidades.ts`)

Quarta entrada no registro. Dado, não código — é exatamente o que a 013 declarou que a 4ª unidade
custaria.

| Campo | Valor |
|---|---|
| `id` | `'peca'` |
| `rotulo` / `rotuloPlural` | `'peça'` / `'peças'` |
| `entregaFisica` | `true` |
| `precificar(variacao, quantidade)` | `{ precoUnitario: variacao.preco, detalhe: { produtoSlug, tamanho, cor } }` |

`quantidade` é inteiro ≥ 1 (peça fracionária não existe). O `detalhe` carrega tamanho e cor
porque é ele que reconstrói **o que foi vendido** anos depois, quando o catálogo já mudou — o
mesmo papel que `{caixas, m2PorCaixa}` tem em porcelanato.

**Invariante testável (a mesma das outras três):** `subtotal = arredondar(quantidade × precoUnitario, 2)`.

---

## 2. Catálogo (`site-goiania/src/data/mana.ts`)

```ts
export interface VariacaoMana {
  sku: string;        // CHAVE. Vai para ItemPedido.slug. Imutável.
  tamanho: string;    // 'P' | 'M' | 'G' | 'GG' | '39' … — texto de exibição
  cor: string;        // 'Branco' | 'Azul marinho' … — texto de exibição
  preco: number;      // BRL por peça
  pesoKg: number;     // frete: peso vem do catálogo, NUNCA do cliente
}

export interface ProdutoMana {
  slug: string;               // só a rota: /mana/<slug>/
  nome: string;
  categoria: string;
  h1, seoTitle, seoDescription, chamadaVitrine: string;
  copyComercial: string[];    // 2–3 parágrafos próprios (Constituição IV)
  specs: { label: string; valor: string }[];
  imagens: string[];
  alt: string;
  variacoes: VariacaoMana[];
}
```

⚠️ **`sku` é a chave; `tamanho`/`cor` são rótulos.** Casar `"Branco"` com uma decisão de máquina
é a mesma classe de defeito que ler `Cadeira.status` (texto de exibição) para decidir, ou medir a
palavra `GPTBot` em vez da permissão. O `sku` nasce no catálogo e nunca muda — renomear a cor é
edição de texto e **não** cria SKU novo.

**Convenção de `sku`:** `<produto-slug>-<tamanho>-<cor-slug>`, minúsculo, sem acento. Serve para
leitura humana no admin e no e-mail; a unicidade é garantida pelo gate, não pela convenção.

---

## 3. Espelho servidor (`app/src/lib/precos-mana.ts`)

O servidor é a autoridade de preço (FR-005 da 013: **nunca** confiar no dinheiro do cliente).
Mesmo papel de `precos.ts` (porcelanato) e `precos-fitas.ts` (fita).

```ts
// sku → { preco, pesoKg, produtoSlug, tamanho, cor }
export function getVariacao(sku: string): VariacaoPreco | null
export function listarSkus(): string[]
```

### Gate de paridade — `site-goiania/src/scripts/check-mana.mjs` (no `prebuild`)

O build quebra, não avisa. É o primeiro espelho deste repo com trava automática:

1. Todo `sku` de `mana.ts` existe em `precos-mana.ts`, e vice-versa (**conjuntos iguais**).
2. `preco` e `pesoKg` **idênticos** nos dois arquivos.
3. `sku` único em todo o catálogo (não só dentro do produto).
4. `sku` não colide com slug de porcelanato nem de fita (namespace único no motor).
5. Todo produto tem imagem e toda variação tem `preco > 0` e `pesoKg > 0`.
6. Cadeira `publicada: true` ⇒ todo `sku` tem linha em `EstoqueVariacao` (checado pelo
   `verify-015-estoque.mjs`, contra o banco — o build não alcança o Postgres).

**Por que este gate não é opcional:** preço divergente entre catálogo e servidor é a vitrine
anunciando um valor e o checkout cobrando outro. Silencioso, e do lado do dinheiro.

---

## 4. Cadeira-loja `mana` (`lojas.ts` no site + espelho em `app/src/lib/lojas.ts`)

| Campo | Valor | Por quê |
|---|---|---|
| `id` / `prefixoRota` | `'mana'` | grava em `Pedido.vertical` (coluna intocada desde a 011) |
| `unidade` | `'peca'` | FR-002 |
| `catalogo` | `produtosMana` | FR-001 |
| `modoCobranca` | `'roilabs'` | o **carrinho** é da ROI Labs; a **conta** que recebe é a da Maná (ver `split` abaixo) |
| `checkoutUrl` | `null` | |
| `pagoA` | `'Maná Moda'` | FR-016 da 013 — exibido ao comprador **antes** de pagar. Com split, quem recebe é a Maná, e a tela precisa dizer isso |
| `frete` | `'cotacao'` | FR-005 |
| `docObrigatorio` | `true` | FR-014 |
| **`emailObrigatorio`** | `true` | **campo novo** — FR-014. Hoje a regra é fixa por unidade (`assinatura`); vira campo porque duas unidades diferentes passam a exigi-lo |
| **`split`** | `{ gateway: 'mercadopago', comissaoPct: 0.10 }` \| `null` | **campo novo** — FR-007. `null` = comportamento de hoje (cobra na conta da ROI Labs) |
| `cupomEscopo` | `'mana'` | cupom de uma cadeira não desconta item de outra |
| `linhaFixa` | `null` | |
| `publicada` | `false` → `true` na Fase 7 | URLs em 200 com compra fechada até publicar |

⚠️ **`split` é o campo que decide caminho de dinheiro.** `null` ⇒ nada muda para porcelanato e
fitas — a 011/013 continuam byte a byte iguais. Preenchido ⇒ preference com token e fee de outra
conta. Não derivar de `modoCobranca`: são eixos diferentes (quem opera a loja × qual conta
recebe), e a 012 já pagou o preço de confundir dois eixos uma vez.

**Invariantes novas no `check-lojas.mjs`:**

- `split != null` ⇒ `comissaoPct` em `(0, 1]` e `gateway` conhecido.
- `emailObrigatorio` presente em toda cadeira (booleano explícito, sem default implícito).

---

## 5. `EstoqueVariacao` — tabela nova

```prisma
// 015: estoque por SKU de variação. Catálogo continua em arquivo (013); ESTADO mora aqui,
// porque arquivo não debita. A chave é (cadeira, sku) — nunca o rótulo tamanho/cor.
model EstoqueVariacao {
  id         String   @id @default(cuid())
  cadeira    String                     // 'mana' — mesmo espaço de nome de Pedido.vertical
  sku        String                     // = ItemPedido.slug quando a unidade é 'peca'
  quantidade Int      @default(0)       // NUNCA negativo: a guarda é o WHERE do débito
  updatedAt  DateTime @updatedAt @map("updated_at")

  // ⚠️ A trava contra vender duas vezes a última unidade mora AQUI, no banco: o débito é
  // um UPDATE condicional (quantidade >= n), não read-then-write na aplicação. Dois retries
  // simultâneos do gateway são o comportamento NORMAL dele.
  @@unique([cadeira, sku])
  @@map("estoque_variacao")
}
```

**Sem CHECK constraint** (o Prisma não declara): a garantia de não-negativo **é** a condição
`quantidade >= n` no `where` do `updateMany`. Por isso ela não pode ser "simplificada" para um
`decrement` solto. Ver [contracts/estoque-variacao.md](./contracts/estoque-variacao.md).

**Sem FK para o catálogo:** o catálogo é arquivo, não tabela. A ligação `sku` ↔ catálogo é
garantida pelo gate de build (§3, invariante 6) e por `verify-015-estoque.mjs`.

### Estados de uma variação

```text
  sem linha em EstoqueVariacao ──> a vitrine não a oferece; checkout recusa   (falha fechada)
  quantidade > 0               ──> comprável
  quantidade = 0               ──> exibida como esgotada; checkout recusa     (FR-003)
  disputada por 2 pagamentos   ──> o 1º debita; o 2º leva rollback + refund   (FR-016)
```

---

## 6. `SolicitacaoPosVenda` — tabela nova

```prisma
// 015 FR-011: troca/devolução self-service. O comprador ABRE; o operador EXECUTA (decisão
// do Jean, 17/08) — logística reversa é física e nenhum código a resolve sozinho.
model SolicitacaoPosVenda {
  id           String   @id @default(cuid())
  pedidoId     String   @map("pedido_id")
  itemPedidoId String?  @map("item_pedido_id")   // null = pedido inteiro
  resultado    String                            // 'reembolso' | 'troca' — escolhido na ABERTURA (clarify)
  skuDesejado  String?  @map("sku_desejado")     // obrigatório quando resultado='troca'
  motivo       String?
  estado       String   @default("aberta")       // aberta | aprovada | concluida | recusada
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  pedido Pedido @relation(fields: [pedidoId], references: [id], onDelete: Cascade)

  @@index([pedidoId])
  @@index([estado])                              // a fila do admin filtra por estado
  @@map("solicitacoes_pos_venda")
}
```

**Invariante de servidor** (o Prisma não declara CHECK, então é validação + teste, mesmo padrão
de `validarOrigemNegocio`):

```text
resultado='troca'     ⇒ skuDesejado presente, existente no catálogo da cadeira e com estoque > 0
resultado='reembolso' ⇒ skuDesejado nulo
sempre                ⇒ pedido.statusPagamento='pago' E pedido.pagoEm dentro da janela de 7 dias
```

⚠️ **A troca não reserva estoque na abertura.** Coerente com FR-016 (carrinho não reserva): a
disponibilidade é conferida de novo quando o operador aprova. Reservar aqui criaria um segundo
lugar onde estoque some sem venda.

### Máquina de estado

```text
  aberta ──aprovada──> aprovada ──executada──> concluida
     └────recusada───> recusada        (fora da janela, item não elegível, ou decisão do operador)
```

Nada nesta máquina estorna dinheiro sozinho. O único refund automático do sistema é o da corrida
(§5) — e ele nunca passa por aqui.

---

## 7. `Pedido` — uma coluna nova

| Campo | Mudança |
|---|---|
| **`pagoEm`** | `DateTime?` `@map("pago_em")` — **NOVO**. Gravado na transação do webhook junto com `statusPagamento='pago'`. É o marco da janela de 7 dias do CDC |
| `statusFulfillment` | ganha o valor `'sem_estoque'` (corrida perdida). Coluna e tipo inalterados |
| todo o resto | intocado |

⚠️ **`pagoEm` é anulável de propósito e NÃO tem backfill.** Pedido anterior à feature nasce
`NULL` e a janela do CDC **nunca abre** para ele — comportamento correto e explícito. `@default`
não reescreveria linha gravada de qualquer forma; aqui não há nem `@default`.

⚠️ `updatedAt` **não** serve como marco de pagamento: qualquer atualização posterior o move, e a
janela do CDC passaria a contar de um evento que não é o pagamento.

---

## 8. `Parceiro` — uma coluna nova

| Campo | Mudança |
|---|---|
| **`senhaHash`** | `String?` `@map("senha_hash")` — **NOVO**. `scrypt` de `node:crypto`, formato `scrypt$<salt-b64>$<hash-b64>`. `NULL` ⇒ parceiro **não** faz login (o estado de todos, menos a Maná) |
| `comissaoAquisicao` / `comissaoRecorrencia` | ambas `0.10` para a Maná — não porque a régua da 010 seja usada aqui (com split ela não é), mas para que qualquer repasse manual criado por engano no `/admin` cobre os mesmos 10%, em vez de recusar por "parceiro sem taxas" |

⚠️ **Senha hasheada, sempre.** `checkPassword` do admin compara `ADMIN_PASSWORD` em texto — é o
padrão do login interno único e **não** se estende a terceiro. Guardar senha de parceiro em texto
seria segredo num backup, num dump de debug e no `select *` de qualquer admin — a mesma razão
pela qual `CredencialGateway` guarda o **nome** da env var e nunca o valor.

---

## 9. Sessão de parceiro (`app/src/lib/session.ts`)

Cookie **separado**, não o do admin.

| | admin (hoje) | parceiro (novo) |
|---|---|---|
| cookie | `roilabs_admin` | `roilabs_parceiro` |
| payload assinado | `exp` | `exp.parceiroId` |
| TTL | 7 dias | 7 dias |
| abre `/admin`? | sim | **não** |
| abre `/parceiro`? | não | sim |

**Por que cookie novo em vez de estender o payload do existente:** `verifySession` assina só
`exp`; mudar o formato invalidaria as sessões de admin vigentes e misturaria dois níveis de
confiança na mesma verificação. Duas funções pequenas no mesmo arquivo são diff menor e risco
zero para o caminho que já funciona.

⚠️ **O `parceiroId` do escopo vem da sessão, sempre.** Nunca de query string, nunca de body. É
fronteira de confiança — não simplificar. Teste nos dois sentidos.

---

## 10. `Cadeira` / carteira — o que a Maná escreve (US3)

Nenhuma coluna nova. O que entra é **dado**:

```text
Cadeira   niche='Moda social masculina' · estado='ocupada-vendavel'
          siteUrl='https://mana.roilabs.com.br/'   ← A CHAVE (nunca o rótulo)
          repoUrl=null  · daCasa=false · exibirDaCasa=false
Parceiro  nome='Maná Moda Social Masculina' · estagio='ativa' · cadeiraId=<a de cima>
          comissaoAquisicao=0.10 · comissaoRecorrencia=0.10 · senhaHash=<scrypt>
CredencialGateway  gateway='mercadopago' · contaRef=<user_id MP da Maná>
                   segredoRef='WEBHOOK_SECRET_MANA'   → token derivado: GATEWAY_TOKEN_MANA
```

⚠️ **`daCasa: false` sem dúvida.** A regra fail-closed do `seats.ts` ("na dúvida, `true`") existe
porque `false` errado faz a ROI Labs cobrar fee de si mesma e **inflar** a receita da carteira.
Aqui não há dúvida: a Maná é terceiro real, com Instagram e operação próprios. E, com split, a
marcação nem alcança dinheiro — a comissão é retida no gateway, sem passar por
`NegocioOriginado`/`FaturaSuccessFee`.

⚠️ **Não existe caminho de escrita** (tela ou script) para `Parceiro`/`CredencialGateway` neste
repo — bloqueio já registrado no handoff da 012. Por isso o `scripts/seed-015-mana.mjs`, que é
**idempotente por `siteUrl`** e nunca por rótulo.

---

## 11. O que NÃO muda

| | |
|---|---|
| `ItemPedido` | **nenhuma coluna nova.** Variação vira `slug` (o `sku`); tamanho/cor vão em `detalhe` |
| `cart.ts` / `localStorage` | formato `{cadeira, itens:[{slug, quantidade}]}` intocado — `slug` passa a poder ser um `sku` |
| token de link compartilhado | v2 continua válido; SKU é string como qualquer slug |
| `NegocioOriginado` · `FaturaSuccessFee` | **não entram** neste caminho. Com split, a comissão é retida no ato |
| porcelanato e fitas | zero mudança de comportamento. `split: null` ⇒ o caminho de hoje, byte a byte |
| as 99 URLs do goiania | intocadas; `/mana/*` no host antigo é 301 para o host novo |
