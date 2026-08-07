# Feature Specification: O motor de loja que serve qualquer cadeira ocupada

**Feature Branch**: `013-motor-loja-multicadeira`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "O goiania precisa virar a loja de TODA cadeira ocupada da carteira da roilabs.com.br sem copiar código a cada nova cadeira. Decisão travada do Jean (2026-08-07): construir o MOTOR DE LOJA REUTILIZÁVEL — catálogo, vitrine, carrinho, item de pedido e checkout escritos UMA VEZ e servindo qualquer cadeira, de modo que a 3ª cadeira ocupada seja configuração + catálogo, não código novo."

## Contexto

### O que existe hoje, medido (2026-08-07)

O `goiania.roilabs.com.br` **não é uma loja com dois departamentos — são duas lojas coladas
lado a lado**, cada uma com sua própria cópia de tudo:

| | porcelanato | fitas (TapePro) |
|---|---|---|
| unidade de venda | m² / caixa | rolo, com faixa de quantidade |
| catálogo | `src/data/porcelanato.ts` (1487 linhas) | `src/data/fitas.ts` (189 linhas) |
| carrinho | `src/pages/carrinho.astro` (**524 linhas**) | `src/pages/carrinho-fitas.astro` (**407 linhas**) |
| item no banco | tabela `itens_pedido` | tabela `itens_pedido_fita` |
| caminho no checkout | `api/pedidos/route.ts`, um ramo | o mesmo arquivo, **outro ramo** |
| qual é qual | `Pedido.vertical` = string `'porcelanato' \| 'fitas'` | idem |

**931 linhas de carrinho duplicado, duas tabelas de item, dois ramos no mesmo endpoint.** Uma
terceira cadeira ocupada, hoje, significa uma terceira cópia de cada linha dessa tabela.

### O teto já estava escrito — esta feature é o saque dele

A spec 011 (fitas) travou a duplicação **de propósito** e registrou o preço na mesma frase
(Constituição III — atalho deliberado exige teto e caminho de upgrade declarados):

> *"Duplicação deliberada entre os dois verticais: o teto é que **uma terceira unidade de venda
> torna a duplicação insustentável**. O caminho de upgrade — generalizar o item de pedido —
> fica registrado para quando isso acontecer."*

O teto chegou: o modelo comercial da ROI Labs é uma carteira de cadeiras, e o `goiania` é onde
**toda cadeira ocupada** fatura. Enquanto abrir loja custar "copiar 931 linhas", a carteira não
escala — e a 012 (que publica a página de cada cadeira) empurra exatamente nessa direção.

### O que esta feature NÃO é

Ela **não publica cadeira nenhuma** e **não escreve conteúdo de página** — isso é a spec 012,
aberta em 67/85 tasks. A 013 constrói o **motor**; a 012 continua sendo quem liga cada cadeira.
As duas se encontram num ponto só: depois da 013, ligar a cadeira da 012 deixa de exigir código.

### A restrição que domina tudo

O porcelanato é o único ativo de busca que o site tem: **99 URLs no sitemap**, reconhecidas
pelo Google em 07/08 depois de 35 dias de cópia velha. **Uma refatoração que mova, renomeie ou
derrube qualquer uma dessas URLs destrói o único ativo orgânico da loja** — e o custo não
aparece no build, aparece semanas depois no GSC. Por isso a generalização é **interna**: o
comprador e o Google não podem perceber que ela aconteceu.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A terceira cadeira abre loja sem código novo (Priority: P1)

Como dono da carteira, quero abrir a loja de uma cadeira ocupada nova fornecendo apenas o
catálogo de produtos dela e a configuração da sua unidade de venda — sem que ninguém precise
escrever uma rota, um carrinho, uma tabela ou um ramo de checkout.

**Why this priority**: é a feature inteira. Se abrir a 3ª loja ainda custar cópia de código, o
motor não existe e nada mais desta spec importa.

**Independent Test**: cadastrar uma cadeira de teste com dois produtos fictícios, percorrer
vitrine → carrinho → checkout até a intenção de pagamento, e conferir que **nenhum arquivo de
rota, carrinho, checkout ou schema foi alterado** para isso acontecer. Remover a cadeira de
teste depois e conferir que a loja volta ao estado anterior.

**Acceptance Scenarios**:

1. **Given** uma cadeira ocupada sem loja, **When** seu catálogo e sua unidade de venda são
   declarados, **Then** a vitrine, a página de produto, o carrinho e o checkout dela funcionam
   sem alteração em código compartilhado.
2. **Given** essa cadeira nova, **When** o comprador adiciona itens dela ao carrinho, **Then**
   o total, as regras de preço e a unidade exibida são as **dela**, não as de outra cadeira.
3. **Given** uma cadeira **sem** meio de cobrança ligado, **When** alguém tenta chegar ao
   checkout dela, **Then** o sistema recusa a compra em vez de aceitar dinheiro que não sabe
   receber.

---

### User Story 2 - O dinheiro que já existe continua idêntico (Priority: P1)

Como responsável pela receita, quero que a generalização **não mude um centavo** do que
porcelanato e fitas já cobram, e que o histórico de pedidos continue somando exatamente o mesmo.

**Why this priority**: refatoração que mexe em caminho de dinheiro sem prova é como a feature
perde a confiança do Jean. Os 6 pedidos existentes são o único histórico real que há.

**Independent Test**: somar os 6 pedidos existentes antes e depois da migração e conferir
igualdade exata (R$ 22.091,89), item a item, incluindo os campos que explicam **por que** cada
preço foi aquele.

**Acceptance Scenarios**:

1. **Given** os 6 pedidos já gravados, **When** a migração é aplicada, **Then** cada pedido
   mantém total, itens, unidade e preço unitário idênticos.
2. **Given** um pedido de fita antigo, **When** ele é lido depois da migração, **Then** a faixa
   de quantidade aplicada continua reconstruível — o "por que cobrou esse unitário" não se perde.
3. **Given** a régua de success fee (15% aquisição / 10% recorrência, spec 010), **When** um
   pedido novo é criado por qualquer cadeira, **Then** a taxa é congelada na criação, como já era.

---

### User Story 3 - Uma unidade de venda nova entra sem carrinho novo (Priority: P2)

Como operador, quero que uma cadeira que vende em unidade diferente das duas atuais (por
exemplo, assinatura mensal de SaaS) entre no mesmo carrinho, sem que isso vire um terceiro
carrinho.

**Why this priority**: é o teste real do motor. Se ele só comporta "m²" e "rolo", ele é a mesma
duplicação com outro nome.

**Independent Test**: declarar uma cadeira cuja unidade é assinatura recorrente e conferir que
ela usa a mesma vitrine, o mesmo carrinho e o mesmo caminho de pedido, com a unidade e a
recorrência corretas na tela e no registro.

**Acceptance Scenarios**:

1. **Given** uma unidade de venda ainda não usada, **When** ela é declarada, **Then** o carrinho
   exibe quantidade, unidade e preço com o rótulo dela sem código específico.
2. **Given** uma cadeira com preço por faixa de quantidade, **When** o comprador cruza a faixa,
   **Then** o preço unitário aplicado e a faixa que o justificou ficam registrados no item.

---

### User Story 4 - O checkout roteia por quem recebe, não por qual produto (Priority: P2)

Como comprador, quero saber **a quem estou pagando** e ser levado ao meio de pagamento certo,
seja a caixa da ROI Labs ou o gateway do parceiro que ocupa a cadeira.

**Why this priority**: os dois eixos (unidade de venda × quem processa) já estão travados na
012 e são independentes. Misturá-los é o que faria o motor nascer torto.

**Independent Test**: uma cadeira cobrada pela ROI Labs e uma cobrada pelo parceiro,
percorridas lado a lado: a primeira cria pedido interno, a segunda não cria pedido nenhum e
sai para o gateway do parceiro.

**Acceptance Scenarios**:

1. **Given** cadeira cobrada pela ROI Labs, **When** o comprador finaliza, **Then** um pedido
   interno é criado e o pagamento vai para a caixa da ROI Labs.
2. **Given** cadeira cobrada pelo parceiro, **When** o comprador finaliza, **Then** **nenhum**
   pedido interno é criado e o comprador vê, antes de pagar, a quem está pagando.
3. **Given** qualquer cadeira, **When** o meio de pagamento falha, **Then** o comprador recebe
   um erro explícito e o pedido não fica gravado como se estivesse a caminho do pagamento.

---

### User Story 5 - O admin lê qualquer pedido sem saber de qual cadeira ele é (Priority: P3)

Como operador do `/admin`, quero abrir um pedido e ver seus itens sem que a tela precise
adivinhar em qual das relações eles estão.

**Why this priority**: hoje um pedido de fita tem `itens` vazio e `itensFita` cheio — já
documentado como "não é bug". Depois do motor, isso deixa de existir; enquanto existir, cada
tela nova precisa aprender a armadilha.

**Independent Test**: abrir um pedido de cada cadeira no admin e conferir que os itens
aparecem pelo mesmo caminho de leitura, sem ramo por vertical.

**Acceptance Scenarios**:

1. **Given** pedidos de cadeiras diferentes, **When** listados no admin, **Then** todos exibem
   seus itens, unidade e total pela mesma leitura.

---

### Edge Cases

- **Carrinho com itens de duas cadeiras**: um pedido pertence a **uma** cadeira (regra herdada
  da 011). O que acontece quando o comprador adiciona um item de outra cadeira a um carrinho já
  ocupado — o sistema recusa, separa em dois carrinhos, ou troca?
- **Cadeira desocupada com pedido em aberto**: o parceiro sai, a loja dele sai do ar — e o
  pedido pago que ainda não foi entregue? E a URL que já ranqueava (URL que vira 404 depois de
  ranquear é destruição de ativo).
- **Duas cadeiras vendendo o mesmo tipo de produto** (dois CRMs, duas fitas): o mesmo `slug` de
  produto em cadeiras diferentes não pode colidir na URL nem no carrinho.
- **Frete**: porcelanato tem modelo de frete por CEP; assinatura não tem frete nenhum. Unidade
  de venda sem entrega física não pode herdar o formulário de entrega.
- **Cupom**: `OBRA10` tem escopo porcelanato. Cupom de uma cadeira não pode descontar item de
  outra.
- **Cadeira sem catálogo**: cadeira ocupada declarada mas com zero produto — não pode gerar
  vitrine vazia indexável (é exatamente a "página fina" que a 012 proíbe).

## Requirements *(mandatory)*

### Functional Requirements

**O motor**

- **FR-001**: O sistema DEVE permitir abrir a loja de uma cadeira ocupada fornecendo **apenas**
  o catálogo de produtos dela e a configuração da cadeira — sem criar rota, tela de carrinho,
  tabela de item ou ramo de checkout específicos.
- **FR-002**: A vitrine, a página de produto, o carrinho e o checkout DEVEM ser **um** de cada,
  compartilhados por todas as cadeiras.
- **FR-003**: A **unidade de venda** DEVE ser um dado declarado por cadeira (rótulo, como a
  quantidade é contada, como o preço é calculado), não um ramo de código. As três unidades a
  comportar na entrega: área (m²/caixa), unidade avulsa com faixa de quantidade (rolo) e
  assinatura recorrente.
- **FR-004**: O item de pedido DEVE ser **um só conceito**, capaz de registrar qualquer unidade
  de venda, incluindo o dado que **explica o preço aplicado** (faixa, piso, snapshot de
  comissão) — sem o qual um pedido antigo deixa de ser auditável.
- **FR-005**: Um pedido DEVE pertencer a **uma única cadeira**. O sistema DEVE impedir a
  criação de pedido com itens de cadeiras diferentes.
- **FR-006**: Cadeira sem meio de cobrança configurado NÃO DEVE oferecer checkout (herdado de
  FR-008 da 012: venda feita com receita invisível é pior que venda não feita).
- **FR-007**: Cadeira ocupada sem nenhum produto no catálogo NÃO DEVE gerar vitrine pública
  indexável.

**O que não pode quebrar**

- **FR-008**: **Toda URL indexável hoje DEVE continuar respondendo na mesma URL**, com o mesmo
  conteúdo — as 99 do sitemap, incluindo a malha pSEO de porcelanato e as páginas de fitas.
  Redirecionar não satisfaz este requisito; a URL tem de continuar sendo ela.
- **FR-009**: O comprador NÃO DEVE perceber a mudança: fluxo, campos, textos e etapas do
  carrinho e do checkout de porcelanato e de fitas permanecem equivalentes.
- **FR-010**: O total, os itens e o preço unitário dos pedidos já gravados DEVEM permanecer
  **exatamente** iguais depois da migração.
- **FR-011**: A migração dos pedidos existentes DEVE ser **explícita e verificada linha a
  linha** — valor padrão de coluna nova **não reescreve linha já gravada**, e coluna anulável
  casa linha arbitrária em filtro.
- **FR-012**: A régua de success fee (15% aquisição / 10% recorrência) DEVE continuar valendo
  para qualquer cadeira, com a taxa congelada na criação do negócio.
- **FR-013**: O caminho de webhook de pagamento existente DEVE continuar idempotente por
  pagamento — reprocessar o mesmo evento não pode produzir dois pedidos nem dois negócios.

**Os dois eixos**

- **FR-014**: O sistema DEVE tratar **unidade de venda** e **quem processa o pagamento** como
  eixos independentes: qualquer unidade DEVE poder ser cobrada em qualquer um dos dois modos.
- **FR-015**: Cadeira cobrada pelo parceiro NÃO DEVE criar pedido interno; a venda dela chega
  por webhook do gateway do parceiro.
- **FR-016**: O comprador DEVE ver, antes de pagar, **a quem** está pagando.

**Operação**

- **FR-017**: O admin DEVE ler os itens de qualquer pedido por **um** caminho, sem ramo por
  cadeira.
- **FR-018**: Cupom e frete DEVEM ter escopo por cadeira; regra de uma cadeira não se aplica a
  itens de outra, e unidade sem entrega física não coleta dados de entrega.
- **FR-019**: O sistema DEVE recusar catálogo com produto sem preço ou sem imagem **antes** de
  publicar, mantendo o gate que já derruba o build hoje.

### Key Entities

- **Cadeira-loja**: a cadeira ocupada enquanto vendedora — a quem o catálogo pertence, qual a
  unidade de venda, quem processa o pagamento, se está publicada.
- **Catálogo**: os produtos de uma cadeira. Cada produto tem preço, imagem, descrição e o que
  sua unidade exige (dimensão, faixas, recorrência).
- **Unidade de venda**: como se conta e se cobra — rótulo exibido, forma de calcular quantidade
  e regra de preço (fixo, por área, por faixa de quantidade, recorrente).
- **Item de pedido**: uma linha comprada, com quantidade, unidade, preço unitário aplicado e a
  **justificativa** desse preço.
- **Pedido**: a compra de **uma** cadeira, com comprador, entrega quando aplicável, cupom,
  frete, total e estado de pagamento.
- **Modo de cobrança**: quem recebe o dinheiro — a caixa da ROI Labs (gera pedido) ou o
  gateway do parceiro (não gera pedido).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Abrir a loja de uma cadeira nova custa **1 catálogo + 1 configuração de cadeira**
  e **zero** alteração em rota, carrinho, checkout ou schema — provado adicionando uma cadeira
  de teste, percorrendo a compra e conferindo o conjunto de arquivos alterados.
- **SC-002**: As **99 URLs** do sitemap continuam respondendo na mesma URL depois da entrega, e
  o download do sitemap pelo Google segue com **0 erro**.
- **SC-003**: Os **6 pedidos** existentes somam **R$ 22.091,89** antes e depois da migração, com
  a mesma quantidade de itens por pedido e o mesmo preço unitário em cada item.
- **SC-004**: A superfície de carrinho cai de **931 linhas em 2 arquivos** para **um** carrinho,
  e o número de tabelas de item de pedido cai de 2 para 1.
- **SC-005**: **Zero** pedidos com itens de mais de uma cadeira, medido no banco depois da
  entrega.
- **SC-006**: Uma unidade de venda que não existe hoje (assinatura recorrente) é declarada e
  comprada **sem nenhuma linha de código novo** no carrinho ou no checkout.
- **SC-007**: Nenhuma tela de comprador muda de fluxo: o número de etapas para comprar
  porcelanato e para comprar fita é o mesmo de antes.

## Assumptions

- **O catálogo continua sendo arquivo versionado no repositório**, um por cadeira, como
  `porcelanato.ts` e `fitas.ts` já são hoje — não vira cadastro no `/admin` nesta feature. O
  modelo `ProdutoCadeira` do banco (spec 012) segue servindo a cadeira SaaS; unificar as duas
  fontes é trabalho posterior, e fazê-lo aqui misturaria duas mudanças de risco no mesmo diff.
- **As URLs ficam onde estão.** `/porcelanato/…` e `/fitas/…` não viram `/loja/<cadeira>/…`
  nesta feature. A repaginação de domínio já é escopo da 012 (US4) e mover URL e generalizar
  motor no mesmo passo torna impossível saber qual dos dois derrubou o tráfego, se cair.
- **"Cadeira ocupada" é a definição da 012** (`estado` da cadeira no banco); esta spec consome
  esse estado, não o redefine.
- Um pedido tem itens de uma cadeira só — regra herdada da 011, mantida de propósito.
- Verificação vale em **ambiente real** (Docker/EasyPanel ou navegador em produção);
  build local não prova nada neste stack (Constituição II).
- O banco de produção é alcançável para migração a partir do endpoint externo, e o schema é
  aplicado manualmente de uma máquina que alcance o host — o runner standalone não aplica.

## Out of scope

- **Teste de venda real com cartão real** — ⛔ **cancelado pelo Jean em 07/08/2026, não
  reabrir.** Consequência aceita e registrada: o caminho pagamento → webhook → negócio →
  success fee segue **sem prova ponta a ponta**, e nenhum número de receita deste site pode ser
  afirmado como provado.
- **Publicar as páginas de cadeira** e escrever o conteúdo delas — é a spec 012, aberta.
- **Migrar o domínio** ou reposicionar `goiania` para um nome não-geográfico — spec 012, US4.
- **Resolver a falta de ranking** (`0/40` no top 50) ou de demanda das cadeiras. Este motor
  liga a loja; não traz cliente.
- **Google Ads** — o canal é 100% orgânico por decisão registrada.
- Autoridade tópica do domínio com múltiplos nichos: risco reconhecido, endereçado quando a 3ª
  cadeira publicar.

## Próximo passo

`/speckit-clarify` para fechar as decisões das Edge Cases (carrinho misto, saída de parceiro,
colisão de slug) e depois `/speckit-plan`.
