# Fase 0 — Research: o motor de loja multicadeira

**Data**: 2026-08-07 · **Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

Nenhum `NEEDS CLARIFICATION` restou do `/speckit-clarify` — as cinco ambiguidades de
comportamento foram fechadas na spec. O que esta fase resolve são as **decisões de arquitetura**
que a spec exige mas não escolhe, e o que foi medido no código atual para chegar nelas.

## O que foi medido antes de decidir

Os dois verticais foram lidos ponta a ponta (`cart.ts` 174 linhas, `cart-fitas.ts` 103,
`carrinho.astro` 524, `carrinho-fitas.astro` 407, `api/pedidos/route.ts` 335, `schema.prisma`).
O achado que governa o plano inteiro:

**Os dois fluxos já são o mesmo fluxo.** `localStorage` → `lines()` para display → form-POST
urlencoded 303 → recálculo no servidor → `prisma.pedido.create` → `createPreference` do Mercado
Pago → redirect. Idêntico nos dois, incluindo o algoritmo de rateio do desconto entre as linhas
do MP (que aparece **duplicado byte a byte** nos dois ramos da rota).

Eles divergem em exatamente **cinco pontos**, e nenhum é estrutural:

| Divergência | porcelanato | fitas | Vira |
|---|---|---|---|
| unidade e regra de preço | m² por caixa, preço fixo/m² | rolo, preço por faixa de volume | `unidade` da cadeira |
| frete | tabela por CEP (`calcFrete`) | cotação Melhor Envio (`cotarFrete`) | `frete` da cadeira |
| documento | opcional | **obrigatório** (senão a taxa da 010 sai errada) | `docObrigatorio` da cadeira |
| linha fixa | nenhuma | clichê R$ 80, isento para arte repetida | `linhaFixa` da cadeira |
| alerta operacional | nenhum | 3 falhas técnicas seguidas de frete | `alerta` da cadeira |

Cinco campos de configuração substituem 931 linhas de carrinho duplicado e um `if (vertical ===
'fitas') return pedidoFitas(...)`. É isso que torna a feature viável sem inventar arquitetura.

---

## Decisão 1 — O item de porcelanato migra como `m2`, não como `caixa`

**Decisão**: no item unificado, a unidade do porcelanato é **`m2`**, com
`quantidade = m2`, `precoUnitario = preco_m2`, e o número de caixas guardado como detalhe de
exibição.

**Rationale**: é a única forma de a invariante `quantidade × precoUnitario = subtotal` valer nas
três unidades **sem recalcular nenhum número já gravado**. `preco_m2` atravessa a migração
intacto, e `subtotal` também. Recalcular é exatamente o que FR-010 proíbe.

**Alternativas rejeitadas**:
- **`caixa` como unidade** — obrigaria `precoUnitario = subtotal / caixas`, um número que **não
  existe** hoje em lugar nenhum e que introduz arredondamento no caminho de dinheiro. Reprova
  FR-010 por construção.
- **Manter as colunas específicas de cada unidade** (`caixas`, `m2`, `rolos` convivendo) — é a
  tabela de item atual com outro nome; a 3ª unidade adicionaria a 4ª coluna. Reprova FR-004.
- **Uma linha de item por unidade, em tabelas separadas** — é literalmente o estado de hoje.

**Consequência aceita**: a tela mostra "12 caixas (26,4 m²)" a partir do detalhe, não da
quantidade. Zero mudança visível para o comprador; uma linha a mais no render.

## Decisão 2 — A justificativa do preço vai em `detalhe Json`, exceto o que a 014 vai consultar

**Decisão**: `detalhe Json?` guarda o que **explica** o preço aplicado (faixa aplicada, m² por
caixa, número de caixas, perda). Três campos ficam **fora** do Json, como colunas reais:
`recorrencia`, `assinaturaRef`, `assinaturaEstado`.

**Rationale**: FR-004 exige que o pedido antigo continue auditável, e auditoria é leitura, não
consulta indexada — Json serve. Mas o webhook de ciclo da spec 014 vai **procurar** um item pelo
id da assinatura no gateway, e procurar dentro de Json é o tipo de atalho que vira scan de
tabela e query frágil. Três colunas resolvem, e é o preço combinado em FR-003a.

**Alternativas rejeitadas**:
- **Tudo em colunas** — cada unidade nova viraria migração de schema, que é o custo que FR-001
  existe para eliminar.
- **Tudo em Json**, inclusive a assinatura — empurraria para a 014 uma remodelagem, quebrando a
  promessa feita no clarify de que ligar recorrência é "adicionar o webhook, sem remodelar".

## Decisão 3 — `Pedido.vertical` vira o campo `cadeira`, mas a **coluna do banco não muda**

**Decisão**: renomear o campo Prisma para `cadeira` mantendo `@map("vertical")`. Os valores
gravados (`'porcelanato'`, `'fitas'`) já são os ids das cadeiras.

**Rationale**: o nome errado no código custa confusão; o rename da coluna custa uma migração de
dados sobre a tabela de dinheiro para ganhar zero. O `@map` dá o nome certo onde se lê e zero
risco onde se grava. Mesma lógica que o repo já aplica em todo `@@map` snake_case.

**Alternativa rejeitada**: renomear a coluna. Ganho puramente cosmético num diff que já mexe em
`itens_pedido`; duas mudanças de schema na mesma tabela multiplicam os modos de falha.

**Marcado como atalho**: o comentário no schema declara que o nome físico é histórico.

## Decisão 4 — Um `localStorage`, com conversão dos carrinhos já abertos

**Decisão**: uma chave (`roi_cart_v2`) guardando `{ cadeira, itens[] }`. Na primeira leitura, se
existir `roi_cart_v1` ou `roi_cart_fitas_v1`, converter e apagar.

**Rationale**: FR-005a (carrinho de uma cadeira só) sai **de graça** de uma chave única — não há
onde guardar duas cadeiras, então a recusa é estrutural, não uma validação que alguém pode
esquecer de chamar. E carrinho abandonado no browser de um comprador real é uma venda: dez
linhas de conversão custam menos que uma venda perdida.

**Alternativas rejeitadas**:
- **Uma chave por cadeira** (o que existe hoje) — permite dois carrinhos simultâneos, que é a
  opção C que o clarify rejeitou, e reintroduz a coordenação entre chaves.
- **Bump de chave sem conversão** — descarta carrinho de comprador real sem aviso.

**Detalhe que não pode ser esquecido**: o carrinho de porcelanato guarda `ambientes[]` e `perda`
(o simulador de m²) que **nunca vão ao servidor**. A conversão preserva os dois, senão o
comprador reabre o simulador vazio.

## Decisão 5 — `/carrinho-fitas` vira redirect, e isso não fere FR-008

**Decisão**: `carrinho-fitas.astro` passa a redirecionar para `/carrinho`.

**Rationale**: FR-008 protege **URL indexável**. `carrinho-fitas.astro` é declarado
`noindex={true}` no próprio arquivo e não está entre as 99 do sitemap — não é ativo de busca. É
um destino de link interno e de histórico de browser, e para esses um redirect é o
comportamento correto. Manter uma segunda página de carrinho viva contrariaria SC-004.

**Alternativa rejeitada**: deletar a rota. Quem tem a URL no histórico ou num link antigo cairia
em 404 sem motivo, e o custo de evitar isso é uma linha de config.

**Verificado em 07/08**: `/carrinho-fitas` não aparece em `sitemap.xml.ts`. Aparece em
`gsc-miner.mjs:113`, que classifica URLs por vertical para a medição — como a página é
`noindex`, ela não produz dado de GSC e o padrão pode ser simplesmente removido de lá.

---

## Riscos que a pesquisa levantou e o plano endereça

1. **O rateio do desconto no Mercado Pago está duplicado** nos dois ramos, com o mesmo bug
   potencial de arredondamento na última linha. Unificar é obrigatório e o teste unitário do
   rateio é o gate — hoje não existe nenhum.
2. **`check-cart-math.mjs` roda no `prebuild` e conhece só porcelanato.** Se ele não for
   estendido junto, a fase 3 sobe com o gate cego para duas das três unidades.
3. **A isenção do clichê consulta `itensFita: { some: { slug } }`.** Essa query muda de forma
   quando a tabela funde; se passar despercebida, o comprador recorrente volta a pagar R$ 80 —
   uma sobrecobrança silenciosa, sem erro em lugar nenhum. Merece teste próprio.
4. **`Pedido.freteMotivo` é anulável de propósito** (registrado no schema como landmine da 010).
   Nenhuma query nova pode filtrar por ele sem considerar o `null`.
5. **O link de carrinho compartilhado (`/carrinho?c=<token>`) existe e está no mundo.**
   `encodeCart`/`decodeCart` codificam `{slug, caixas}` em base64url com validade de 30 dias. Um
   token emitido hoje tem de continuar abrindo depois da entrega — o decodificador precisa
   aceitar o formato v1 (`caixas`) e mapeá-lo para a cadeira `porcelanato`, não só o formato
   novo. É o mesmo tipo de dado abandonado que a conversão do `localStorage` resolve, mas este
   vive fora do browser do comprador e não pode ser convertido de antemão.
6. **`negocios_originados` estava vazia em 07/08** — a régua de success fee nunca rodou contra
   dado real. Esta feature não conserta isso e **não pode fingir que consertou**: FR-012 é
   preservação de comportamento, não prova de funcionamento.
