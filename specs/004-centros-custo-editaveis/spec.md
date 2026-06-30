# Feature Specification: Centros de custo editáveis e auditáveis

**Feature Branch**: `004-centros-custo-editaveis`

**Created**: 2026-06-30

**Status**: Draft

**Input**: User description: "Torne os centros de custo (WL e intermediação) mais robustos, principalmente editáveis — considerando porcentagens, spread, comissões. O centro de custo ideal."

## Contexto

A entrega anterior (commit `58085b4`) criou os **dois centros de custo** no `/app`:
`lib/centros-custo.ts` (funções puras `calcIntermediacao` e `calcWL`) + a página
`/admin/centros-de-custo`. Hoje **todos os parâmetros são hard-coded** num único
objeto `PARAMS`:

| Parâmetro | Valor fixo hoje | Origem |
|-----------|-----------------|--------|
| `markup` | 30% | âncora R$9.100/R$7.000 ([[modelo]]) |
| `comissao` | 10% | Anexo A.2.2.a ([[anexo-A-intermediacao]]) |
| `aliqIntermediacao` | 10,2% | Simples Anexo III, cenário Base ([[projecao-financeira]]) |
| `aliqWL` | 6,2% | Simples Anexo I após ICMS-ST, cenário Base ([[projecao-financeira]]) |

E o **atacado (piso)** é *derivado* do varejo minerado por um markup global — porque
ainda não há fornecedor fechado (Gate 3) dando o piso real por SKU.

Para mudar qualquer número hoje é preciso **editar código e redeployar**. Isso trava
a operação: o markup varia por linha de produto, a comissão é negociada por
fornecedor, e as alíquotas mudam com a faixa de faturamento (RBT12) e com o regime
que o contador fechar. Esta feature torna os centros de custo o **"centro de custo
ideal"**: parâmetros **editáveis pela operação sem deploy**, com **piso real por SKU**
quando existir, **override por linha/categoria**, e **histórico auditável** (o que a
operação vê de margem hoje não pode mudar retroativamente ao editar um parâmetro).

**Restrição transversal:** as funções de cálculo (`calcIntermediacao`/`calcWL`) e os
números-âncora dos docs (9.100/7.000 → 3.010/2.700/2.100/1.535) **não regridem** — a
feature troca a *fonte* dos parâmetros (de constante para configuração persistida +
override), não a *fórmula*. O login admin único existente (`session.ts`) governa quem
edita; nenhum endpoint de edição é público.

## Clarifications

### Session 2026-06-30

- Q: Granularidade dos overrides de parâmetro — quantas camadas no MVP? → A: **Três camadas — `SKU > linha/categoria > global`** (o mais específico vence; o que não for definido numa camada herda a de cima). A camada de **linha** entra no MVP.
- Q: Editar um parâmetro deve mudar a margem já apurada de pedidos pagos? → A: **Não — snapshot no momento do pagamento.** Os parâmetros são congelados no pedido quando ele é pago (paridade com o snapshot de `precoM2` da 002); editar parâmetros depois muda **só a simulação do catálogo** (parâmetros vigentes), nunca o histórico apurado.
- Q: De onde vem a classificação de qual SKU é "premium / alvo de White Label"? → A: **Flag manual por SKU no admin** (a operação marca; sem regra automática que possa errar). A flag indica a **modalidade-alvo** daquele SKU.
- Q: As alíquotas de imposto — presets de cenário ou digitação direta? → A: **Presets (Conservador / Base / Otimista) que preenchem as alíquotas + ajuste manual posterior** (o ajuste manual prevalece). Default **Base**.
- Q: Com a flag premium por SKU, o agregado de pedidos pagos aloca cada item ao seu centro oficial ou mostra cenários hipotéticos? → A: **Ambos.** O agregado traz duas leituras: (a) **real por modalidade oficial** — cada item no seu centro (premium → WL, resto → Intermediação); e (b) **referência hipotética** — "se tudo fosse Intermediação" vs "se tudo fosse WL".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar os parâmetros globais sem deploy (Priority: P1)

A operação abre `/admin/centros-de-custo`, edita **markup, comissão e as alíquotas de
imposto de cada modalidade** num formulário, salva, e vê a tabela do catálogo e os
agregados **recalcularem na hora** com os novos valores — sem tocar em código nem
redeployar. Valores fora de faixa (ex.: comissão de 150%) são recusados com mensagem
clara; o cálculo nunca usa um parâmetro inválido.

**Why this priority**: É o núcleo do pedido ("principalmente editável"). Sem isso, todo
ajuste de % exige deploy. Sozinha já entrega o "centro de custo editável" e tudo o
mais (piso por SKU, override por linha, snapshot) pluga nesta camada de parâmetros.

**Independent Test**: Editar o markup de 30% para 25%, salvar, e confirmar que o
atacado estimado e o líquido de cada centro mudam coerentemente na tabela; tentar
salvar comissão = 150% e ver a recusa sem alterar o cálculo vigente.

**Acceptance Scenarios**:

1. **Given** os parâmetros vigentes, **When** a operação altera markup/comissão/alíquotas e salva, **Then** os valores persistem e a página de centros de custo passa a calcular com eles imediatamente, sem deploy.
2. **Given** o formulário de parâmetros, **When** a operação informa um valor fora da faixa válida (markup < 0, % fora de 0–100, alíquota fora de 0–100), **Then** o sistema recusa com mensagem clara e mantém os parâmetros anteriores intactos.
3. **Given** um banco recém-criado sem parâmetros salvos, **When** a página carrega, **Then** ela usa os **defaults dos docs** (markup 30%, comissão 10%, alíq. 10,2%/6,2%) como ponto de partida, reproduzindo os números-âncora.
4. **Given** uma edição salva, **When** outra pessoa autenticada recarrega a página, **Then** vê os mesmos parâmetros vigentes (fonte única no servidor, não estado local de um navegador).

---

### User Story 2 - Piso (atacado) real por SKU, com fallback a markup (Priority: P1)

Quando o fornecedor fecha e informa o **piso real** de um SKU, a operação cadastra esse
custo de atacado por produto. O cálculo passa a usar o **piso real** daquele SKU em vez
do atacado derivado por markup; SKUs sem piso cadastrado continuam usando o markup
global. Assim o spread (WL) e o excedente (intermediação) ficam **reais** onde há dado e
**estimados** onde ainda não há — sem misturar nem esconder qual é qual.

**Why this priority**: O markup é só um proxy enquanto não há fornecedor (Gate 3). O
valor real do centro de custo depende do piso verdadeiro. É P1 junto com US1 porque é o
que torna o número **robusto** (real), não só editável.

**Independent Test**: Cadastrar piso real R$95/m² num SKU cujo varejo é R$129/m², e
confirmar que o spread daquele item usa 95 (não 129÷1,30); remover o piso e ver o item
voltar ao atacado por markup, marcado como "estimado".

**Acceptance Scenarios**:

1. **Given** um SKU sem piso cadastrado, **When** a página calcula, **Then** o atacado é derivado por markup e o item é marcado como **estimado**.
2. **Given** um SKU com piso real cadastrado, **When** a página calcula, **Then** usa o piso real, o item é marcado como **real**, e markup global não o afeta.
3. **Given** um piso real maior que o varejo minerado, **When** salvo, **Then** o sistema avisa que o spread/excedente fica negativo (prejuízo) — não bloqueia, mas sinaliza.
4. **Given** um piso cadastrado, **When** a operação o remove, **Then** o item volta a estimar por markup sem erro.

---

### User Story 3 - Parâmetros por linha/categoria (premium vs commodity) (Priority: P2)

A operação define que a **linha premium** (alvo de White Label) tem parâmetros próprios
— por exemplo markup maior e a alíquota de comércio — enquanto o restante (commodity,
intermediação) segue o global. Um SKU pertencente a uma linha herda os parâmetros dela;
um override por SKU (US2 para piso, e aqui para %) ainda vence sobre a linha.

**Why this priority**: Os docs decidem WL **só** nas linhas premium de alto markup
([[oferta]], [[anexo-B-white-label]] B.1.2/B.8.2). Tratar todo o catálogo com um único
markup/comissão distorce a comparação. Depende da camada de parâmetros da US1, por isso
P2.

**Independent Test**: Criar a linha "premium" com markup 50%, associar 3 SKUs a ela, e
confirmar que só esses 3 usam 50% enquanto o resto usa o global; aplicar um override de
SKU e ver que ele vence sobre a linha.

**Acceptance Scenarios**:

1. **Given** uma linha com parâmetros próprios, **When** um SKU é associado a ela, **Then** o cálculo desse SKU usa os parâmetros da linha onde definidos e herda o global no resto.
2. **Given** um SKU com override próprio e também numa linha, **When** calculado, **Then** vale a precedência **SKU > linha > global**.
3. **Given** um SKU sem linha e sem override, **When** calculado, **Then** usa o global (paridade com US1).

---

### User Story 4 - Histórico auditável: snapshot de parâmetros no pedido pago (Priority: P2)

Quando um pedido é **pago**, os parâmetros usados para apurar a margem daquele pedido
são **congelados** no próprio pedido. Editar os parâmetros depois muda a **simulação** do
catálogo, mas **não** altera retroativamente o que a operação já apurou nos pedidos
pagos — o agregado histórico é estável e auditável (quanto cada centro de custo rendeu,
com quais regras, naquele período).

**Why this priority**: Robustez contábil. Sem snapshot, baixar o markup hoje reescreveria
o lucro histórico — números que a operação usa para decidir não podem mudar sob seus
pés. Espelha o snapshot de `precoM2` já feito na 002. P2 porque o cálculo já funciona sem
ele; ele protege a confiabilidade ao longo do tempo.

**Independent Test**: Apurar o agregado com markup 30%, marcar um pedido como pago,
mudar o markup para 20%, e confirmar que o pedido pago mantém a margem apurada com 30%
enquanto a simulação do catálogo passa a refletir 20%.

**Acceptance Scenarios**:

1. **Given** um pedido que passa a **pago**, **When** a apuração corre, **Then** os parâmetros vigentes (markup/comissão/alíquotas/piso por item) ficam registrados no pedido.
2. **Given** parâmetros editados após o pagamento, **When** o agregado de pedidos pagos é exibido, **Then** ele usa os parâmetros **congelados** de cada pedido, não os vigentes.
3. **Given** a tabela do catálogo (simulação), **When** os parâmetros mudam, **Then** ela reflete os **vigentes** (não há snapshot na simulação — ela é prospectiva).

---

### User Story 5 - Cenário tributário selecionável (Priority: P3)

A operação escolhe o **cenário** vigente (Conservador / Base / Otimista, das faixas de
RBT12 em [[projecao-financeira]]), que **preenche** as alíquotas das duas modalidades com
os valores do cenário; depois ela pode ajustar manualmente. Isso conecta a edição às
faixas reais do Simples sem obrigar a operação a decorar percentuais.

**Why this priority**: Conveniência e fidelidade ao modelo fiscal, mas a US1 já permite
digitar as alíquotas direto. Açúcar sobre a edição. P3.

**Independent Test**: Selecionar "Conservador" e confirmar que as alíquotas viram
6,0%/~4% (valores do doc) nos campos; ajustar uma manualmente e ver que o ajuste vence.

**Acceptance Scenarios**:

1. **Given** os presets de cenário, **When** a operação escolhe um, **Then** as alíquotas das duas modalidades são preenchidas com os valores daquele cenário.
2. **Given** um cenário aplicado, **When** a operação edita uma alíquota à mão, **Then** o valor manual prevalece e o cenário fica marcado como "ajustado".

---

### User Story 6 - Modalidade-alvo por SKU e agregado por centro oficial (Priority: P2)

A operação **marca manualmente** quais SKUs são premium (alvo de White Label); o
restante é Intermediação por padrão. Com isso, o agregado de pedidos pagos passa a ter
**duas leituras**: a **real por modalidade oficial** — cada item vendido alocado ao
centro da sua modalidade-alvo, somando um valor por centro (o que a operação de fato
ganhou em cada modalidade) — e a **referência hipotética** já existente ("se tudo fosse
Intermediação" vs "se tudo fosse WL"), mantida como comparativo.

**Why this priority**: Sem a modalidade-alvo, "centro de custo" é só um comparativo
hipotético; com ela, cada venda é alocada ao seu centro e o número vira o resultado
**real** da operação por modalidade — o sentido contábil de "centro de custo". Depende da
flag de classificação (manual por SKU) e do snapshot da US4 para o histórico, por isso
P2.

**Independent Test**: Marcar 1 SKU como premium, registrar 2 pedidos pagos (um com o SKU
premium, outro comum), e confirmar que a leitura real soma o item premium no centro WL e
o comum no centro Intermediação; conferir que a referência hipotética continua somando
todos nos dois cenários.

**Acceptance Scenarios**:

1. **Given** SKUs com modalidade-alvo marcada, **When** o agregado real corre sobre pedidos pagos, **Then** cada item entra no centro da sua modalidade-alvo e o total por centro reflete só os itens daquela modalidade.
2. **Given** um SKU sem modalidade-alvo marcada, **When** agregado, **Then** ele conta como **Intermediação** (padrão dos docs).
3. **Given** a leitura real e a referência hipotética, **When** ambas são exibidas, **Then** ficam claramente rotuladas (real vs hipotético), sem se confundirem.

---

### Edge Cases

- **Piso real > varejo** (prejuízo): não bloqueia o cadastro, mas o item é sinalizado e o líquido pode ser negativo — a operação precisa ver, não ser impedida.
- **Parâmetro vazio/parcial** ao salvar (ex.: markup preenchido, comissão em branco): o campo em branco **herda** a camada acima (não vira zero silencioso).
- **SKU some do catálogo** mas tinha piso/override cadastrado: o registro fica órfão; o catálogo não quebra e o órfão é sinalizado para limpeza (paridade com a 002).
- **Edição concorrente** (duas abas salvando parâmetros): vence a última gravação; nenhuma escrita corrompe o estado (sempre um conjunto de parâmetros válido).
- **Markup 0%**: atacado = varejo → spread/excedente zerados; permitido (a operação pode querer ver o piso colado no varejo), apenas exibido como tal.
- **Alíquota 0%**: permitida (ex.: isenção hipotética) — o cálculo não assume mínimo.
- **Defaults ausentes**: banco sem nenhum parâmetro salvo cai nos defaults dos docs (US1 cenário 3), nunca em `NaN`/tela quebrada.
- **Pedido pago sem snapshot** (pago antes desta feature): o agregado o trata com os parâmetros vigentes e o marca como "sem snapshot" (não inventa histórico).
- **SKU sem modalidade-alvo marcada**: na leitura real do agregado, conta como **Intermediação** (padrão dos docs), nunca fica de fora do total.

## Requirements *(mandatory)*

### Functional Requirements

**Edição de parâmetros (US1)**
- **FR-001**: O sistema MUST permitir que um usuário **autenticado** edite, pela UI do `/admin`, os parâmetros dos centros de custo — **markup**, **comissão**, **alíquota de imposto da intermediação** e **alíquota de imposto da White Label** — e **persistir** essa configuração no servidor como **fonte única** (não estado de um navegador).
- **FR-002**: O sistema MUST recalcular a tabela do catálogo e os agregados a partir dos **parâmetros vigentes persistidos**, sem exigir redeploy para refletir uma edição.
- **FR-003**: O sistema MUST **validar** cada parâmetro contra sua faixa (markup ≥ 0; percentuais e alíquotas em 0–100) e **recusar** uma gravação inválida com mensagem clara, **mantendo os parâmetros anteriores**.
- **FR-004**: Na ausência de parâmetros salvos, o sistema MUST usar os **defaults dos docs** (markup 30%, comissão 10%, alíq. intermediação 10,2%, alíq. WL 6,2%) e reproduzir os números-âncora (9.100/7.000 → 3.010/2.700/2.100/1.535).
- **FR-005**: Os endpoints de leitura/escrita de parâmetros MUST exigir autenticação (login admin único existente); nenhuma edição é acessível sem sessão válida.

**Piso por SKU (US2)**
- **FR-006**: O sistema MUST permitir cadastrar/editar/remover um **piso (atacado) real por SKU**, e usá-lo no lugar do atacado derivado por markup **somente para aquele SKU**.
- **FR-007**: O sistema MUST **distinguir visualmente** itens com atacado **real** (piso cadastrado) de itens **estimado** (derivado por markup).
- **FR-008**: O sistema MUST **sinalizar** (sem bloquear) quando um piso torna o spread/excedente **negativo**.

**Parâmetros por linha (US3)**
- **FR-009**: O sistema MUST permitir definir conjuntos de parâmetros por **linha/categoria** e associar SKUs a uma linha, com **precedência `SKU > linha > global`**; parâmetros não definidos numa camada **herdam** a de cima. A camada de linha faz parte do MVP.

**Snapshot/auditoria (US4)**
- **FR-010**: Quando um pedido passa a **pago**, o sistema MUST **congelar** no pedido os parâmetros usados para apurar sua margem (markup/comissão/alíquotas e piso por item).
- **FR-011**: O agregado de **pedidos pagos** MUST usar os parâmetros **congelados de cada pedido**; editar parâmetros depois **não** altera o histórico apurado. A **simulação do catálogo** MUST usar os parâmetros **vigentes**.
- **FR-012**: Pedidos pagos **sem snapshot** (anteriores a esta feature) MUST ser apurados com os parâmetros vigentes e **marcados como tal**, sem fabricar histórico.

**Cenário tributário (US5)**
- **FR-013**: O sistema MUST oferecer **presets de cenário** (Conservador/Base/Otimista) que **preenchem** as alíquotas das duas modalidades com os valores de [[projecao-financeira]]; um ajuste manual posterior **prevalece** sobre o preset.

**Modalidade-alvo e agregado (US6)**
- **FR-014**: O sistema MUST permitir **marcar manualmente, por SKU**, a **modalidade-alvo** (premium → White Label | comum → Intermediação), editável pelo admin autenticado; SKU sem marca assume **Intermediação** (padrão dos docs).
- **FR-015**: O agregado de pedidos pagos MUST apresentar **duas leituras rotuladas**: (a) **real por modalidade oficial** — cada item alocado ao centro da sua modalidade-alvo, somando um valor por centro; e (b) **referência hipotética** — "se tudo fosse Intermediação" vs "se tudo fosse WL".

**Transversais**
- **FR-016**: As funções de cálculo (`calcIntermediacao`/`calcWL`) e suas saídas MUST permanecer **inalteradas em fórmula**; a feature só troca a **origem** dos parâmetros (constante → configuração + camadas de override).
- **FR-017**: Toda lógica de resolução de parâmetros (defaults → global → linha → SKU → snapshot) MUST ter um **check runnable** que valide a precedência e a reprodução dos números-âncora.

### Key Entities *(include if feature involves data)*

- **ParametrosCentroCusto**: configuração vigente dos centros de custo. Atributos: markup, comissão, alíquota intermediação, alíquota WL, cenário (rótulo), escopo (global | linha | SKU) e a chave do escopo. Fonte única no servidor. A resolução efetiva de um SKU combina as camadas por precedência.
- **PisoSKU**: custo de atacado real de um produto. Atributos: slug, piso (R$/m²), origem/observação (fornecedor), data. Override do markup para aquele SKU. Ausência ⇒ estima por markup.
- **LinhaProduto** (US3): agrupamento de SKUs (ex.: "premium") com parâmetros próprios (markup/comissão/alíquotas); um SKU herda os parâmetros da sua linha, ainda sujeitos a override por SKU. Camada intermediária da precedência `SKU > linha > global`.
- **ModalidadeAlvoSKU** (US6): marca **manual** por SKU indicando o centro de custo oficial do produto — **White Label** (premium) ou **Intermediação** (padrão). Alimenta a leitura "real por modalidade oficial" do agregado. Distinta de `LinhaProduto` (agrupa parâmetros) e de `PisoSKU` (dá o custo de atacado).
- **SnapshotApuracao** (parte do Pedido pago, US4): os parâmetros congelados no momento do pagamento, mais o piso e a modalidade-alvo por item, suficientes para reapurar a margem do pedido de forma idêntica no futuro. Espelha o snapshot de `precoM2` da 002.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A operação consegue **alterar qualquer porcentagem (markup, comissão, alíquotas) e ver o impacto na margem dos dois centros em ≤ 30 segundos**, inteiramente pela UI, **sem redeploy**.
- **SC-002**: Com os defaults, a apuração reproduz os **números-âncora dos docs** (intermediação líq. ≈ R$2.700; WL líq. ≈ R$1.535 no produto R$9.100/R$7.000) — verificável por teste.
- **SC-003**: **100% dos parâmetros inválidos** (fora de faixa) são recusados sem alterar o cálculo vigente.
- **SC-004**: Após cadastrar piso real em N SKUs, **100% desses SKUs** apuram com o piso real e ficam marcados como "real"; os demais permanecem "estimado".
- **SC-005**: Editar um parâmetro **não altera** a margem apurada de **nenhum** pedido já pago (snapshot estável), enquanto **altera** a simulação do catálogo — verificável comparando o agregado antes/depois.
- **SC-006**: **Zero regressão**: as funções de cálculo e a página existentes continuam funcionando; o `npm test` (incl. `centros-custo.test.mjs`) permanece verde.
- **SC-007**: O agregado de pedidos pagos exibe **as duas leituras rotuladas** (real por modalidade oficial e referência hipotética); na leitura real, a soma dos itens por centro **bate** com a apuração item a item (cada item no centro da sua modalidade-alvo, SKU sem marca → Intermediação).

## Assumptions

- **Construído sobre o commit `58085b4`**: reusa `calcIntermediacao`/`calcWL` e a página `/admin/centros-de-custo`; não recria o cálculo nem um segundo admin.
- **Persistência no Postgres existente** (`roilabs_db`), via `prisma db push` MANUAL de máquina que alcança o host (Constituição — Restrições Técnicas); schema novo é aditivo (não altera `Pedido`/`ItemPedido` de forma destrutiva — o snapshot entra como colunas/relacionamento aditivo).
- **Auth = login admin único** já existente (`session.ts`); sem multiusuário, sem papéis.
- **Defaults = números dos docs** ([[modelo]], [[anexo-A-intermediacao]], [[projecao-financeira]]); o piso real só existe quando o fornecedor fechar (Gate 3) — até lá, markup é o proxy assumido.
- **Cálculo por m²** permanece a base na simulação do catálogo (unidade nativa do preço minerado); o agregado real usa o `subtotal` do item do pedido (produto puro, sem frete/cupom), em paridade com a entrega anterior.
- **Verificação em ambiente real** (Constituição II): edição, persistência e apuração validadas em Docker/EasyPanel ou no navegador em produção — não em build local (OneDrive corrompe `node_modules`).
- **Idioma**: UI/comunicação em português; código e commits em inglês (Constituição).

## Out of Scope

- Alterar a **fórmula** dos centros de custo ou criar uma terceira modalidade.
- Multiusuário, papéis/permissões, trilha de auditoria por usuário (só snapshot de valores, não "quem editou").
- Versionamento/histórico completo de parâmetros (diffs ao longo do tempo); apenas o **conjunto vigente** + o **snapshot por pedido pago**.
- Integração com ERP/nota fiscal para puxar o piso automaticamente; o piso é **cadastrado manualmente**.
- Cálculo automático da faixa de RBT12 a partir do faturamento real (os presets de cenário são **valores fixos** dos docs, ajustáveis à mão).
- Gráficos, exportação (CSV/PDF) ou relatórios além da tabela + agregados já existentes.
- Qualquer mudança no `site-goiania` ou no checkout/pagamento da 002/003.
