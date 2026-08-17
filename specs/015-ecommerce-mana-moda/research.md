# Fase 0 — Research: as 9 decisões da cadeira Maná Moda

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Quatro decisões foram tomadas pelo Jean em 17/08 (D1, D2, D6, D7) e estão registradas como
decisão, não como recomendação. As outras cinco são técnicas e saíram da leitura do código.

Zero `NEEDS CLARIFICATION` restante.

---

## D1 — Onde a loja mora (decisão do Jean, 17/08)

**Decisão:** as páginas da Maná são geradas em `/mana/**` pelo **build do `site-goiania`**, e
`mana.roilabs.com.br` é apontado para o **mesmo container**, com um segundo `server{}` no nginx.

**Rationale:** é a única das três opções que preserva o que a 013 acabou de construir — um
`cart.ts`, um `carrinho.astro`, um `/api/pedidos`, uma `itens_pedido`. Um app Astro separado
exigiria copiar o motor do carrinho para um segundo site, que é literalmente a duplicação que a
013 existiu para matar. Extrair `packages/loja-motor` é o upgrade já declarado na 013, mas o teto
dela é *">5 cadeiras ou divergência na prática"* — estamos em 3 e sem divergência.

**Consequência aceita:** as URLs canônicas carregam o prefixo: `https://mana.roilabs.com.br/mana/<produto>/`.

**Alternativas consideradas:**

| Opção | Por que não |
|---|---|
| App novo `site-mana` (Dockerfile + domínio próprios) | URL limpa, mas copia `cart.ts` (330 linhas), `unidades.ts`, `lojas.ts`, `carrinho.astro` e o layout. Recria a duplicação que a 013 removeu, e a partir daí toda correção de carrinho vira duas |
| `packages/loja-motor` consumido pelos dois sites | resolve os dois problemas, mas dispara agora um teto declarado para depois: workspace npm, build step e um terceiro lugar para quebrar, com 3 cadeiras |
| Rewrite no nginx para esconder o prefixo | cada link interno do HTML (que o Astro gera com `/mana/`) sofreria 301. O GSC já cobrou essa conta aqui: redirect foi **46% do rastreamento** em 07/2026 |

**O que isso obriga:**

1. `location /mana/ { return 301 https://mana.roilabs.com.br$request_uri; }` no server do goiania.
   Sem isso, o mesmo HTML responde 200 nos dois hosts = conteúdo duplicado auto-infligido.
2. O root do nginx é **compartilhado**, então `mana.roilabs.com.br/sitemap.xml` serviria o
   sitemap do porcelanato. Os arquivos de raiz precisam de `location =` explícito apontando para
   a versão da Maná (`/sitemap.xml`, `/robots.txt`, `/llms.txt`, `error_page 404`).
3. `Base.astro` deriva canonical, `og:url` e o nó `WebSite` do `@graph` de `Astro.site`, que é
   fixo em `goiania.roilabs.com.br`. Ganha uma prop opcional `siteBase` — 5 linhas, contra
   duplicar o layout inteiro.

---

## D2 — Como a comissão de 10% é cobrada (decisão do Jean, 17/08)

**Decisão:** **split no Mercado Pago**. A preference é criada com o `access_token` da conta MP da
Maná (obtido por OAuth) e carrega `marketplace_fee` = 10% do valor de produto. O comprador paga
na conta da Maná; a ROI Labs recebe a taxa no ato.

**Rationale:** elimina o repasse como processo — não há apuração, ciclo, nem transferência a
executar. FR-010 (*"repassar o valor líquido em cadência regular"*) passa a ser satisfeito **por
construção**: o líquido nunca chega a ficar com a ROI Labs.

⚠️ **Tensão registrada com a spec, não escondida:** a Assumption da spec diz *"cadeira física →
processada pelo carrinho da própria ROI Labs (spec 012), com repasse do valor líquido"*. Com
split, o **carrinho** continua sendo o da ROI Labs (a experiência inteira: vitrine, carrinho,
checkout, e-mail, acompanhamento) mas a **conta que recebe** passa a ser a da Maná. A frase
"repasse do valor líquido" deixa de descrever o mecanismo. Isso não invalida a spec — é a
decisão posterior do Jean sobrepondo a assumption dela, e fica registrado aqui para o
`/speckit-analyze` não tratar como inconsistência acidental.

**Sobre o quê incide a taxa:** `marketplace_fee = 10% × (produto − desconto)`, **nunca sobre o
frete**. É a mesma regra que `NegocioOriginado.valor = total − frete` já aplica no repo. Cobrar
10% do frete seria cobrar comissão sobre o custo da transportadora.

**Alternativas consideradas:** PIX manual com repasse registrado (menor superfície, zero
integração — rejeitada); transferência via Asaas (a integração existente é de **cobrança**, a
direção oposta — rejeitada).

**Riscos que esta decisão traz, e que o plano precisa carregar:**

| Risco | Mitigação |
|---|---|
| Token OAuth do MP expira (~180 dias) | fica em env var (`GATEWAY_TOKEN_MANA`). Quando expira, `createPreference` falha e a cadeira **para de vender** — não vende errado. Registrar a data de renovação no handoff |
| Webhook do pagamento é assinado com a secret **da Maná**, não a da ROI Labs | `notification_url` com `?cadeira=mana`; a rota resolve a credencial **antes** de validar. Sem o parâmetro, o comportamento é o de hoje (FR-005a da 012) |
| `getPayment` e `refund` usam o token global e não enxergam pagamento da conta da Maná | ambos ganham `tokenOverride` opcional — mesmo padrão que `verifyWebhookSignature(opts, secretOverride)` já abriu na 012 |
| Sem prova com dinheiro real | usuário de teste do MP. Prova a fiação, **não** prova receita. Ver Princípio II no plan |

---

## D3 — Variação de tamanho/cor: SKU, não coluna

**Decisão:** cada combinação tamanho × cor é um **SKU próprio**, e é o `sku` que vai para
`ItemPedido.slug`. O slug do produto serve só para a rota da página.

**Rationale:** o item de pedido unificado da 013 é `{ slug, unidade, quantidade, precoUnitario,
detalhe, subtotal }`. Tratar variação como SKU faz `quantidade × precoUnitario = subtotal`
continuar valendo sem tocar em nada, e o carrinho (`{slug, quantidade}`) não muda de formato —
nem no `localStorage`, nem no token de link compartilhado, nem no form-POST. Tamanho e cor vão
para `detalhe`, que é exatamente o campo que a 013 criou para justificativa de preço.

⚠️ **A chave é o `sku`, nunca o rótulo.** `"Camisa Social Branca M"` é texto de exibição. Esta
casa já pagou duas vezes por casar rótulo com chave (`status` da `Cadeira` que nenhuma máquina
pode ler; `niche` que é rótulo e não chave do seed). O `sku` é gerado no catálogo e é imutável.

**Alternativas consideradas:** colunas `tamanho`/`cor` em `ItemPedido` (obriga toda leitura de
item a saber de roupa, e não generaliza para a 4ª unidade); tabela `Variacao` com FK do item
(join a mais em todo caminho de dinheiro, para um dado que já cabe no `slug`).

---

## D4 — Estoque no banco, catálogo em arquivo

**Decisão:** o **catálogo** (produto, variações, preço, peso) continua sendo arquivo versionado,
como manda a 013. O **estoque** vive no Postgres, numa tabela por `(cadeira, sku)`. A vitrine
estática lê a disponibilidade ao vivo no browser via `GET /api/estoque?cadeira=mana`.

**Rationale:** catálogo é fato editorial e muda por commit; estoque é estado e muda por venda —
arquivo não debita. Ler ao vivo no browser é o padrão que este repo já estabeleceu: a home busca
`/api/cadeiras` e sobrescreve o esqueleto estático, e as edições do `/admin` aparecem sem rebuild.

**Falha fechada:** se `/api/estoque` não responder, a vitrine mostra as variações sem marcar
esgotado — e o **servidor recusa no checkout**. O comprador vê um erro claro em vez de comprar o
que não existe. Nenhuma decisão de estoque acontece no cliente.

---

## D5 — A corrida da última unidade: débito condicional atômico

**Decisão:** o débito acontece **dentro da transação que marca o pedido como pago**, por
`updateMany` condicional:

```ts
tx.estoqueVariacao.updateMany({
  where: { cadeira, sku, quantidade: { gte: n } },
  data:  { quantidade: { decrement: n } },
})
```

`count === 0` ⇒ perdeu a corrida ⇒ **rollback da transação inteira**, pedido marcado
`statusPagamento='reembolsado'` / `statusFulfillment='sem_estoque'`, e `refund()` no gateway.

**Rationale:** é a única forma de FR-016 (*"quem pagar primeiro leva"*) ser verdade sob
concorrência real. `read-then-write` na aplicação — ler o estoque, decidir, gravar — é uma corrida
entre os dois retries do webhook, que são o comportamento **normal** do Mercado Pago. A mesma
lição que a 012 registrou ao pôr a idempotência em `@@unique([gateway, eventoId])` no banco em
vez de num `if` na rota: *"checar-antes-de-gravar é corrida entre os dois"*.

O `WHERE quantidade >= n` faz o Postgres travar a linha e reavaliar a condição; o vencedor
grava e o perdedor recebe `count = 0`. Sem CHECK constraint (o Prisma não declara), a guarda
contra estoque negativo **é** essa condição — e é por isso que ela não pode ser simplificada.

**Ordem obrigatória** (o refund é I/O externo e não pode estar dentro da transação):

```text
1. transação: pedido→pago + débito condicional + snapshots     [rollback se count=0]
2. se falhou: pedido→reembolsado/sem_estoque                    [fora da transação]
3. refund() no gateway com o token da conta que cobrou
4. e-mail ao comprador + alerta interno
```

Se o passo 3 falhar, o pedido **já está** marcado e o alerta dispara — o dinheiro fica retido com
registro, nunca sem registro.

---

## D6 — Painel do parceiro por login (decisão do Jean, 17/08)

**Decisão:** a Maná acessa o demonstrativo com **login próprio** no `/app`, em cookie separado
(`roilabs_parceiro`), com senha em `Parceiro.senhaHash` (scrypt, `node:crypto`).

**Rationale (do Jean):** escolhido sobre link-token opaco. O plano carrega a consequência: é uma
segunda superfície de autenticação num app que hoje tem uma credencial compartilhada só.

**O que não é construído** (teto declarado): cadastro self-service, recuperação de senha, papéis
genéricos, gestão de usuários. A senha nasce pelo seed/admin. Um segundo parceiro justificaria a
tela; hoje seria config para valor que não muda.

⚠️ **Fronteira de confiança — não simplificar:** o `parceiroId` do escopo vem **sempre** da
sessão assinada, nunca de query string ou body. A sessão de parceiro **não** satisfaz `isAuthed()`
e a do admin não vira parceiro. Os dois sentidos têm teste.

⚠️ Senha **hasheada**, nunca comparada em texto. `checkPassword` do admin compara contra
`ADMIN_PASSWORD` em texto — padrão do login interno único, que **não** se estende a terceiros.

---

## D7 — Pós-venda: reembolso automático só na corrida (decisão do Jean, 17/08)

**Decisão:** o estorno automático existe **apenas** para FR-016 (pagou por unidade que já foi
vendida). Troca e devolução (FR-011) abrem uma **solicitação registrada** que o operador executa.

**Rationale (do Jean):** a corrida perdida é dinheiro cobrado por algo que não existe — não há
nada a decidir, e `refund()` já existe em `mercadopago.ts`. Troca e devolução envolvem logística
física reversa, que nenhum código resolve sozinho.

**O que o sistema garante mesmo assim:** a janela de 7 dias do CDC é validada **no servidor**, a
partir de `Pedido.pagoEm`; a escolha entre reembolso e troca é registrada no ato da solicitação
(como o clarify da spec fechou); e o comprador vê o estado da solicitação sem precisar de conta.

**`Pedido.pagoEm` é coluna nova, anulável de propósito.** Pedido anterior à feature nasce `NULL`
e a janela **nunca abre** para ele — que é o comportamento correto, e explícito.
⚠️ `@default` não reescreve linha gravada. Não há backfill: `NULL` aqui é o valor certo.

---

## D8 — CORS: allowlist, e o `SITE_ORIGIN` solto some

**Decisão:** `app/src/lib/cors.ts` com o conjunto dos dois hosts, consumido por
`/api/cupom/validar`, `/api/frete/cotar` e o novo `/api/estoque`.

**Rationale:** `SITE_ORIGIN = 'https://goiania.roilabs.com.br'` está hard-coded **duplicado** em
duas rotas hoje. O host novo obrigaria uma terceira cópia; a allowlist **remove** a duplicação em
vez de somar. Saldo de código negativo.

⚠️ **Nunca `*`.** `/api/cupom/validar` valida código de cupom e `/api/estoque` expõe posição de
estoque — nenhum dos dois é conteúdo público para qualquer origem. Origem fora da lista recebe
resposta sem header de CORS, e o browser barra.

---

## D9 — Frete: a cotação passa a servir duas cadeiras

**Decisão:** `frete-fitas.ts` vira `frete-cotacao.ts` e `cotarFrete` passa a receber a **carga já
resolvida** em vez de derivá-la de `precos-fitas.ts`. Cada cadeira resolve o peso do seu jeito:
fita por `cargaDoCarrinho`, Maná por `pesoKg` no espelho de SKU.

**Rationale:** o módulo já é genérico em tudo (Melhor Envio, bandas de CEP, estimativa
calibrável, tratamento de 422); a única amarra a fita é de onde vem o peso. Inverter essa
dependência é menor que duplicar o módulo — e o comentário `ponytail` no topo dele já dizia que
trocar provedor é reescrever o arquivo, não implementar interface.

⚠️ **Peso vem sempre do catálogo pelo SKU, nunca do cliente** — regra que a 011 já fixou
(FR-006) e que se mantém: peso enviado pelo browser é frete subestimado sob demanda.

⚠️ Os knobs de estimativa (`EST_BASE`, `EST_RS_POR_KG`, `bandaFrete`) foram calibrados para
**rolo de fita**. Roupa tem outra densidade: caixa de camisa é volume alto e peso baixo, e
transportadora cobra por peso cubado. Enquanto `MELHOR_ENVIO_TOKEN` não estiver publicado, a
estimativa da Maná é **knob de operador não calibrado** — está marcado como tal no código e
precisa ser conferido contra frete real antes de a cadeira publicar.

---

## O que já estava resolvido e não precisou de decisão

| Requisito | Já satisfeito por |
|---|---|
| **FR-014** compra como convidado com e-mail + CPF/CNPJ | `Pedido.email` + `Pedido.compradorDoc` + `normalizarDoc`/`validarDoc`. Só falta `emailObrigatorio` na config da cadeira (hoje a regra é fixa por unidade `assinatura`) |
| **FR-015** pedido pendente sem perder o carrinho | **por construção**: `clearCart()` existe em `cart.ts` e **nunca é chamado** por ninguém. O carrinho sobrevive a qualquer desfecho de pagamento. Verificado por grep no repo inteiro |
| **FR-013** confirmação explícita do pedido | `/obrigado?pedido=<id>` + e-mail de confirmação no webhook + `/pedido/?t=<id>` para acompanhar |
| **FR-004** carrinho com múltiplos itens, um checkout | `cart.ts` v2 + `/api/pedidos`, já multicadeira |
| **FR-005** frete por CEP | Melhor Envio, com estimativa de contingência (ver D9) |
| **FR-012** cadeira na carteira | `Cadeira` + `Parceiro` + `seats.ts`; a chave é `siteUrl`, não o rótulo |
| idempotência do pagamento | `Pedido.mpPaymentId @unique` |
| **FR-003** bloquear variação sem estoque | vitrine marca ao vivo (D4) **e** servidor recusa (autoridade) |

## Armadilhas herdadas que este plano precisa respeitar

- 🚨 **`git push` em `main` é deploy** (EasyPanel). Feature de dinheiro trabalha em branch.
- 🚨 **`npm run build` no `site-goiania` submete ao IndexNow.** Exploratório é `npx astro build`.
- ⚠️ **`prisma db push` é manual**, de máquina que alcança o host. O runner standalone não aplica.
- ⚠️ **Dois bancos com senha igual:** o do `app` é `roilabs_db@:5443`. `:5445` é o `roihub_db` e
  **não** tem estas tabelas — seed apontado para lá cria o schema no projeto errado.
- ⚠️ **`DATABASE_URL` do `.env` da raiz** aponta para o host **interno** do Docker e tem um `]`
  colado no fim das 3 ocorrências. Para alcançar o banco daqui: host `2.24.207.200:5443`, sem o `]`.
- ⚠️ **`@default` do Prisma não reescreve linha gravada.** Vale para `pagoEm` (sem backfill, por
  decisão) e para qualquer coluna nova.
- ⚠️ **Coluna anulável casa linha arbitrária** em `where: { campo: null }`; **FK anulável quebra
  `include`** em TypeError. Os dois já morderam neste repo.
- ⚠️ **Status 200 não é prova**: nem de sitemap baixado, nem de página indexada, nem de venda.
