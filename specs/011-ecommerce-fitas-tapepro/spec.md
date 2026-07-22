# Feature Specification: E-commerce de fitas adesivas Tapepro (segundo vertical)

**Feature Branch**: `011-ecommerce-fitas-tapepro`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "E-commerce de fitas adesivas Tapepro no goiania.roilabs.com.br — segundo vertical no site que hoje vende porcelanato. Decisões travadas: vertical paralelo (não generalizar o caminho de dinheiro), frete por API de transportadora, dois verticais lado a lado com marca neutra, os 3 tipos de fita com preço público no v1."

## Contexto

`goiania.roilabs.com.br` **já é um e-commerce em produção** que vende porcelanato por m², com 41 páginas de malha pSEO + 5 guias AEO indexadas e histórico no GSC. Este projeto **não cria um e-commerce** — adiciona um **segundo vertical de produto** (fitas adesivas do parceiro Tapepro) ao mesmo site.

O Tapepro ocupou a primeira cadeira do marketplace em 2026-07-22 (nicho "fitas adesivas", `cpfCnpj=44724076000135`, aquisição 15% / recorrência 10%, `podeGerar=true`). A linha de Centro de Custo 'fitas adesivas' já existe e está **inerte** até haver SKU de fita com preço publicado — este projeto é o que a ativa.

### Por que fitas tem prioridade sobre porcelanato

Os dois verticais **não têm o mesmo status comercial**, e isso governa todas as decisões de hierarquia desta spec:

| | Fitas (Tapepro) | Porcelanato |
|---|---|---|
| Status | **Cadeira ocupada** | Cadeira vaga |
| Receita | Success fee real, 15% / 10% | Nenhuma |
| Papel | O negócio | **Moeda de troca** — vitrine que prova o modelo e vende a cadeira |

Porcelanato **não é a receita a proteger**: é o portfólio de demonstração. As 41 páginas indexadas valem porque são o argumento para alguém ocupar aquela cadeira ("já traz tráfego; ocupe e é sua"), não porque faturam. Por isso a malha continua **intocável** — mas a prioridade de SEO, a home e a identidade seguem a receita real, que é fitas.

**Divisão de domínios (decidida):** `tapepro.roilabs.com.br` = site **institucional** de fitas (marca, autoridade, conteúdo). `goiania.roilabs.com.br` = **e-commerce** de fitas. Papéis distintos, sem sobreposição de função.

O código atual assume "porcelanato vendido por m²" em quatro camadas: o catálogo (`atributos.preco` em R$/m², `m2_caixa`, `dimensao`, `acabamento`, `classe_ad`), a tabela de preço-autoridade do servidor (`slug → [m2_caixa, preco]`), as colunas de item de pedido no banco (`caixas`/`m2`/`precoM2`) e a UI (carrinho, simulador de m², calculadora, comparador). Fita vende por **rolo**, não por m².

**Decisão travada (Jean, 2026-07-22): vertical paralelo.** O caminho de dinheiro de porcelanato — que fatura hoje — fica **intocado**. Fitas ganham suas próprias estruturas de catálogo, preço-autoridade e item de pedido. A duplicação é aceita **deliberadamente** como troca por risco zero na receita existente (Constituição III: atalho deliberado, com teto e caminho de upgrade registrados).

## Clarifications

### Session 2026-07-22 (decisões prévias do Jean, não reabrir)

- Q: Como introduzir a unidade "rolo" no caminho de dinheiro? → A: **Vertical paralelo.** Fitas com catálogo, preço-autoridade e item de pedido próprios. Não generalizar `ItemPedido` para `{unidade, quantidade, precoUnitario}`. Porcelanato intocado.
- Q: Como calcular frete para um catálogo B2B nacional? → A: **Cálculo real por transportadora/Correios** para fitas. A tabela estática da Grande Goiânia continua servindo porcelanato, sem alteração. Escolha do provedor é decisão de plano, não de spec.
- Q: Fitas assumem a hierarquia principal do site? → A: ~~**Não.** Dois verticais lado a lado, marca neutra.~~ **SUPERSEDIDA na terceira rodada** — ver abaixo. Permanece válido apenas: nenhuma URL de `/porcelanato/` muda.
- Q: Quais SKUs entram no v1? → A: Os **3 tipos com preço público** (BOPP personalizada, gomada kraft/nylon, comum), mantendo o modelo híbrido (SKU padrão compra direto; personalizado/volume vira orçamento).
- Q: CPF/CNPJ do comprador no checkout de fitas? → A: **Obrigatório** (B2B). Já previsto pela spec 010, que classifica aquisição vs recorrência pelo documento do comprador.

### Session 2026-07-22 (segunda rodada)

- Q: Um mesmo pedido pode conter fitas **e** porcelanato? → A: **Não. Um vertical por pedido.** Ao adicionar um item do outro vertical, o sistema avisa e separa. Cada pedido usa seu próprio modelo de frete e sua própria estrutura de item — coerente com a decisão de vertical paralelo.
- Q: O que acontece quando a cotação de frete falha, estoura o tempo ou não atende o CEP? → A: **Cai para "a combinar" com aviso explícito.** Cobra só o produto e deixa claro ao comprador, antes do pagamento, que o frete será combinado depois. Nunca perde a venda. Reusa o estado `a_combinar` que o pedido já suporta.
- Q: De onde vêm os dados reais do catálogo? → A: **Do site institucional do Tapepro, que já os tem.** `Tapepro/src/lib/produtos.ts` traz os 3 SKUs com ficha técnica, aplicações, benefícios, copy de SEO e imagem própria; as fotos ficam em `Tapepro/src/assets/produtos/` e `Tapepro/imagens/`. **Os preços vieram da tabela oficial** em `site-goiania/docs/Imagens/`.

### Session 2026-07-22 (quarta rodada — pós-`/speckit-analyze`)

- Q: Como modelar o clichê flexográfico, dado que a tabela diz "**a partir de** R$ 80,00"? → A: **A personalizada vira só-orçamento.** Dois problemas se resolvem juntos: (1) "a partir de" significa valor variável, e valor variável não fecha compra direta; (2) o clichê é a **matriz da arte**, custo único por arte — cobrá-lo em todo pedido sobrecobraria exatamente o cliente **recorrente**, que é o segmento de 10% que a spec 010 existe para cultivar.
- Q: Quais SKUs ficam com preço público então? → A: **Comum (R$ 7,90) e gomada (R$ 37,20 / 32,20)** compram direto no carrinho. **Personalizada** exibe a tabela de faixas como informação, mas o CTA é orçamento — arte, número de cores e clichê são fechados caso a caso.

> Isto ajusta a decisão da primeira rodada ("os 3 tipos com preço público"): os 3 tipos são **publicados** com ficha completa, mas em **duas modalidades**. É exatamente o modelo híbrido já travado — a novidade é qual SKU cai de que lado. Consequência: a **US2 (orçamento) deixa de ser acessória** e passa a carregar o produto de maior margem do Tapepro.

> ⚠️ **Tensão registrada nesta rodada.** O institucional afirma explicitamente que *"Preço NÃO entra no site — o nicho inteiro vende por orçamento"* (`produtos.ts`) e que concorrentes e o próprio Tapepro funilam tudo para WhatsApp/orçamento (`Tapepro/CLAUDE.md`). A decisão de publicar preço nesta loja **contraria o padrão do nicho de propósito** — é exatamente a aposta diferenciadora do vertical. Fica registrado que a decisão foi tomada com essa informação à vista.

### Session 2026-07-22 (terceira rodada — prioridade estratégica)

- Q: Onde mora a loja de fitas? → A: **Divisão explícita de papéis por domínio.** `tapepro.roilabs.com.br` = **site institucional** de fitas (marca, conteúdo, autoridade). `goiania.roilabs.com.br` = **e-commerce** de fitas (catálogo, carrinho, checkout). Os dois permanecem, com funções distintas.
- Q: Fitas ou porcelanato tem prioridade de SEO no `goiania`? → A: **Fitas.** Supersede a decisão de "marca neutra" da primeira rodada. **Razão:** fitas é **cadeira ocupada** — parceiro ativo gerando success fee de 15%/10%. Porcelanato é **moeda de troca**: um vertical de demonstração cujo valor é servir de argumento para alguém ocupar aquela cadeira. Prioridade de SEO segue a receita real, não a antiguidade do conteúdo.
- Q: A malha de porcelanato ainda precisa ser preservada? → A: **Sim, mas por outro motivo.** Ela deixa de ser "a receita a proteger" e passa a ser **o ativo de venda da cadeira de porcelanato** ("41 páginas indexadas já trazendo tráfego — ocupe esta cadeira e é sua"). Destruí-la destrói o argumento comercial. Continua intocável; muda apenas a justificativa.

> ⚠️ **Constraint aceito.** `goiania.roilabs.com.br` é um subdomínio com nome de cidade hospedando um produto **B2B nacional** — o hostname é um sinal geográfico contra o objetivo nacional de fitas. O Jean optou por manter, dado que a divisão institucional/e-commerce entre os dois domínios já está decidida. Mitigação registrada em FR-031: o hostname deve ser o **único** sinal local nas páginas de fitas.

- Q: Como dividir o conteúdo entre institucional e e-commerce sem os dois competirem pela mesma busca? → A: **Split por intenção de busca.** `tapepro` fica com informacional/topo (blog, segmentos, marca); `goiania` fica com transacional/fundo (comprar, preço, mínimo, frete, carrinho) e escreve **copy comercial própria**. Os **fatos** da ficha técnica se repetem (isso é dado, não conteúdo duplicado); a **prosa** é distinta. Cross-link nos dois sentidos. → FR-027, FR-032, FR-033.
- Q: Como a operação descobre que o frete caiu em contingência? → A: **Gravar o motivo no pedido** (CEP não atendido vs falha técnica) **+ alertar quando pedidos consecutivos caírem por falha técnica.** O defeito era as duas causas serem indistinguíveis: uma credencial errada faria 100% dos pedidos saírem sem frete com o sistema aparentando funcionar. → FR-034, FR-035, SC-011.
- Q: Cupom vale para fitas? → A: **Escopo por vertical, configurável pelo operador na criação** (fitas / porcelanato / ambos). Cupom fora de escopo é rejeitado no servidor. Cupons existentes recebem backfill para porcelanato — ausência de escopo **não** significa "ambos". → FR-036, FR-037.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprar fita com preço público (Priority: P1)

Como comprador B2B (empresa que consome fita adesiva), quero encontrar um SKU de fita padrão com preço visível, escolher a quantidade em **rolos**, informar meu CNPJ e meu CEP em qualquer lugar do Brasil, ver o **frete calculado** e pagar online — sem precisar falar com um vendedor.

**Why this priority**: É a única história que gera receita e ativa a linha 'fitas adesivas' do Centro de Custo. Todas as demais são acessórias a ela. Sem esta, o projeto entrega apenas conteúdo.

**Independent Test**: Abrir uma página de produto de fita, adicionar N rolos ao carrinho, preencher CNPJ + CEP de outro estado, ver frete e total, e concluir um pagamento real; conferir que o pedido persistiu com quantidade em rolos e valor conferido pelo servidor.

**Acceptance Scenarios**:

1. **Given** um SKU de fita com preço público, **When** o comprador adiciona 20 rolos ao carrinho, **Then** o carrinho mostra quantidade em **rolos** (nunca "caixas" ou "m²") e o subtotal = 20 × preço por rolo.
2. **Given** um SKU com pedido mínimo de 20 rolos, **When** o comprador tenta adicionar 5 rolos, **Then** o sistema informa o mínimo e não permite avançar abaixo dele.
3. **Given** um carrinho com fitas e um CEP nacional válido, **When** o comprador avança para o checkout, **Then** o sistema apresenta o valor de frete calculado para aquele CEP e o prazo estimado, e o total = produto − desconto + frete.
4. **Given** um checkout de fitas, **When** o comprador não informa CPF/CNPJ, **Then** o sistema **bloqueia** o envio com mensagem clara — o documento é obrigatório neste vertical.
5. **Given** um checkout de fitas, **When** o comprador informa um CPF/CNPJ com formato inválido, **Then** o sistema bloqueia e explica, sem criar pedido.
6. **Given** um cliente enviou valores de preço ou frete adulterados, **When** o pedido chega ao servidor, **Then** o servidor **recalcula todo o dinheiro** a partir de suas próprias fontes e ignora qualquer valor vindo do cliente.
7. **Given** um pedido de fita foi pago, **When** o operador o repassa ao Tapepro, **Then** o negócio originado é criado com taxa e classificação **congeladas na criação**, classificado pelo documento do comprador (aquisição na primeira compra, recorrência nas seguintes).
8. **Given** um carrinho que já contém porcelanato, **When** o comprador adiciona uma fita, **Then** o sistema avisa que os verticais são pedidos separados e mantém os dois carrinhos distintos — nunca mistura os itens num mesmo pedido.

---

### User Story 2 - Pedir orçamento para personalizada ou volume (Priority: P2)

Como comprador que precisa de fita **personalizada** (impressa com a marca) ou de um **volume** fora da tabela, quero solicitar um orçamento pelo mesmo catálogo, informando o que preciso — em vez de encontrar uma página sem preço e sem saída.

**Why this priority**: É o outro lado do modelo híbrido e, desde a quarta rodada de clarificação, carrega o **produto de maior margem do Tapepro** (BOPP personalizada, que virou só-orçamento por causa do clichê variável). Continua P2 porque depende do catálogo existir (P1) e porque não move dinheiro no sistema — mas **não é acessória**: sem ela, o SKU mais rentável fica sem caminho de conversão. Um lead qualificado vale sem checkout.

**Independent Test**: Abrir um SKU marcado como orçamento, enviar a solicitação com dados de contato e especificação, e conferir que ela chegou ao operador — sem passar pelo carrinho nem gerar cobrança.

**Acceptance Scenarios**:

1. **Given** um SKU de fita sem preço público (só orçamento), **When** o comprador abre a página, **Then** vê um caminho explícito de solicitação de orçamento no lugar do botão de compra — nunca um preço vazio ou zerado.
2. **Given** um SKU só-orçamento, **When** o sistema gera o feed de produtos, **Then** esse SKU é **excluído do feed por design** e a verificação de feed continua passando (não pode falhar o build por preço ausente).
3. **Given** um item de orçamento que, por qualquer caminho, chegue ao checkout, **When** o servidor processa o pedido, **Then** ele **rejeita explicitamente com mensagem** — nunca descarta o item em silêncio deixando o comprador pagar um pedido incompleto.
4. **Given** uma solicitação de orçamento enviada, **When** o operador consulta as solicitações, **Then** encontra a especificação e o contato, com o mesmo consentimento LGPD exigido nos demais formulários do site.

---

### User Story 3 - Fitas assume a home sem derrubar a malha de porcelanato (Priority: P1)

Como visitante (ou robô de busca), quero chegar ao `goiania.roilabs.com.br` e entender que é uma **loja de fitas adesivas** — sem que nenhuma página de porcelanato que já ranqueia mude de endereço ou perca os links que a sustentam.

**Why this priority**: É P1 junto com a US1 porque carrega os dois lados do valor. De um lado, é a prioridade de SEO da **cadeira ocupada** — a receita real. Do outro, o risco é **destrutivo, não incremental**: as 41 páginas + 5 guias são o argumento de venda da cadeira de porcelanato, e uma reorganização de home/nav sem trava quebra a malha de forma difícil de reverter. A trava precisa existir **antes** do conteúdo de fitas entrar, não depois.

**Independent Test**: Publicar a home liderada por fitas e o namespace de fitas, e verificar que toda URL de porcelanato responde igual (mesmo endereço, mesmo status), que os links internos da malha continuam presentes, e que as novas URLs aparecem em todos os índices do site.

**Acceptance Scenarios**:

1. **Given** a home republicada, **When** um visitante ou robô a lê, **Then** o título, o `h1` e os dados estruturados identificam o site como **loja de fitas adesivas** — porcelanato aparece como vertical secundário com caminho claro, não como identidade do site.
2. **Given** o site republicado, **When** qualquer URL de porcelanato existente é acessada, **Then** ela responde no **mesmo endereço e mesmo status** de antes — nenhum redirecionamento novo, nenhuma remoção.
3. **Given** o site republicado, **When** se comparam os links internos que sustentam a malha pSEO, **Then** todos continuam existindo (a contagem de links para páginas de porcelanato não diminui).
4. **Given** uma nova página de fitas, **When** ela é acessada **sem** barra final, **Then** o servidor responde com redirecionamento para a versão **com** barra final **preservando o protocolo seguro** — nunca rebaixando para conexão não segura.
5. **Given** uma URL inexistente dentro do namespace de fitas, **When** ela é acessada, **Then** o servidor responde com **404 real** — nunca uma página de erro servida com status de sucesso.
6. **Given** o site republicado, **When** se inspecionam os índices do site (mapa do site, índice para agentes de IA, índice de busca interna e rodapé), **Then** as páginas de fitas aparecem nos **quatro**.
7. **Given** os dados estruturados da home, **When** um mecanismo de busca os lê, **Then** a área atendida representa **fitas como nacional e porcelanato como regional** sem afirmar cobertura falsa para nenhum dos dois.

---

### User Story 4 - Operar o catálogo de fitas (Priority: P3)

Como operador da ROI Labs, quero conferir os pedidos de fita separados dos de porcelanato, com quantidade em rolos e o documento do comprador, para repassar ao Tapepro e faturar o success fee correto.

**Why this priority**: O repasse é hoje um passo manual do operador e funciona com o que já existe (spec 007/010). Melhorar a visão é ganho de eficiência, não pré-requisito de receita.

**Independent Test**: Após um pedido de fita pago, abrir a listagem de pedidos e ver o vertical, a quantidade em rolos e o documento do comprador, e conseguir gerar o negócio originado a partir dali.

**Acceptance Scenarios**:

1. **Given** pedidos dos dois verticais, **When** o operador lista pedidos, **Then** consegue distinguir a qual vertical cada pedido pertence e ver as quantidades na unidade correta de cada um.
2. **Given** um pedido de fita pago, **When** o operador o repassa ao Tapepro, **Then** o valor-base do success fee é o total do pedido **menos o frete** (mesma regra dos negócios já existentes).

---

### Edge Cases

**Frete nacional (o ponto mais frágil desta feature)**

- Serviço de frete **não responde a tempo**, **falha** ou **não atende o CEP** → todos convergem para o mesmo caminho: frete "a combinar" com aviso explícito antes do pagamento (FR-014/FR-015). O comprador nunca fica preso numa tela travada e nenhum valor é arbitrado em silêncio.
- O que acontece quando o frete é cotado no carrinho e, no instante do checkout, o serviço devolve **valor diferente**? A autoridade é o servidor no momento do checkout, e a diferença precisa ser visível ao comprador antes do pagamento.
- Como o sistema trata **CEP com formato válido mas inexistente**? (Trata como CEP não atendido → "a combinar".)
- O peso/dimensão declarado do rolo é o que define a cotação — o que acontece se um SKU não tiver esses dados preenchidos? (Um SKU sem dados de envio não pode ser vendido com frete calculado → cai em "a combinar" sempre, o que mascara um erro de cadastro.)
- Um pedido que cai em "a combinar" e nunca tem o frete fechado pela operação: quanto tempo fica pendente e quem é avisado?
- **Falha técnica silenciosa**: credencial inválida em produção derruba 100% das cotações e todo pedido sai sem frete, com o sistema aparentando operar conforme o especificado. Coberto por FR-034/FR-035 — é o modo de falha mais caro desta feature.

**Modelo híbrido**

- SKU só-orçamento que vaze para o carrinho (link antigo, carrinho salvo no navegador, SKU que teve o preço removido depois): precisa de rejeição explícita, não descarte silencioso.
- Carrinho salvo no navegador contendo um SKU que **deixou de existir** ou **mudou de preço** entre a visita e o checkout.
- Comprador quer uma quantidade **muito acima** do padrão (ex.: 5.000 rolos), onde o preço de tabela deixa de fazer sentido comercial → caminho de orçamento (US2), não compra direta.

**Dois verticais**

- Carrinho contendo itens dos **dois** verticais → **resolvido: proibido.** Um vertical por pedido (FR-028).
- Comprador com carrinhos ativos nos dois verticais ao mesmo tempo: os dois estados precisam sobreviver lado a lado no navegador sem um sobrescrever o outro.
- Colisão de identificador entre um SKU de fita e um de porcelanato.
- Cupom fora do escopo do vertical do carrinho → rejeitado no servidor com aviso, sem desconto (FR-036).
- Cupom **existente** (criado antes desta feature, sem escopo gravado): não pode virar "vale para ambos" por omissão — o backfill precisa marcá-lo como porcelanato (FR-037). *Gotcha conhecido do repo: coluna nova sem backfill quebra consultas e vira landmine — foi o caso da 010.*

**Success fee**

- Comprador informa um documento que **já comprou porcelanato** antes: a compra de fita é aquisição ou recorrência? (A regra vigente classifica por parceiro + documento do cliente, então é a primeira compra **daquele parceiro** que conta.)
- Pedido de fita reembolsado após o negócio ter sido criado.

## Requirements *(mandatory)*

### Funcionais — Catálogo e unidade

- **FR-001**: O sistema DEVE representar fitas adesivas como um vertical de produto **separado** do de porcelanato, com sua própria estrutura de catálogo, sua própria fonte de preço-autoridade no servidor e sua própria estrutura de item de pedido.
- **FR-002**: O sistema DEVE vender fita pela unidade **rolo**, e NÃO DEVE reaproveitar, converter ou exibir as unidades de porcelanato (caixas, m², preço por m²) em qualquer ponto do fluxo de fitas.
- **FR-003**: O sistema NÃO DEVE alterar o comportamento, os dados ou as unidades do vertical de porcelanato. Os pedidos de porcelanato já existentes DEVEM continuar legíveis e íntegros após a mudança.
- **FR-004**: Cada SKU de fita DEVE ter ficha técnica estruturada suficiente para decisão de compra e para cotação de envio (identificação, medidas, e os dados físicos que a cotação de frete exige).
- **FR-005**: O sistema DEVE suportar, no mesmo catálogo de fitas, SKUs **com preço público** (compra direta) e SKUs **só-orçamento**, distinguindo os dois de forma explícita — nunca por preço ausente ou igual a zero.
- **FR-028**: Um pedido DEVE conter itens de **um único vertical**. Ao adicionar um item do outro vertical, o sistema DEVE avisar o comprador e manter os dois carrinhos **separados**, sem descartar o conteúdo de nenhum deles.
- **FR-029**: Cada SKU de fita DEVE ter uma **quantidade mínima de compra** em rolos, e o sistema DEVE impedir o avanço abaixo dela informando o mínimo exigido. *(Os mínimos praticados hoje pelo Tapepro são 20 rolos para a personalizada e 15 para a gomada.)*

### Funcionais — Dinheiro e checkout

- **FR-006**: O servidor DEVE recalcular **todo** o dinheiro do pedido de fitas (preço unitário, subtotal, desconto, frete e total) a partir de suas próprias fontes, ignorando qualquer valor enviado pelo cliente. *(mesma invariante do FR-005 da spec 002)*
- **FR-007**: O checkout de fitas DEVE **exigir** o CPF/CNPJ do comprador e recusar o pedido sem documento válido. O checkout de porcelanato DEVE permanecer com documento **opcional**.
- **FR-008**: O sistema DEVE gravar, em cada item de pedido de fita, o **snapshot** da quantidade em rolos e do preço unitário praticado no momento da compra.
- **FR-009**: Quando um item sem preço público chegar ao checkout, o sistema DEVE **rejeitar o pedido com erro explícito** ao comprador. O sistema NÃO DEVE descartar o item em silêncio nem prosseguir com um pedido parcial.
- **FR-010**: Um pedido de fita pago DEVE poder gerar um negócio originado para o Tapepro, com **taxa e classificação congeladas na criação**, classificado pelo documento do comprador conforme a regra de aquisição/recorrência já vigente.
- **FR-011**: O valor-base do success fee de um pedido de fita DEVE ser o total do pedido **menos o frete**.
- **FR-012**: O sistema DEVE registrar as vendas de fita na linha de Centro de Custo 'fitas adesivas' já existente.
- **FR-036**: Todo cupom DEVE ter um **escopo de vertical** definido pelo operador na criação (fitas, porcelanato ou ambos). O sistema DEVE **rejeitar** no servidor um cupom aplicado a um carrinho fora do seu escopo, reusando o caminho de "cupom rejeitado" já existente (cobra sem desconto e avisa o comprador) — nunca aplicar em silêncio.
- **FR-037**: Cupons **já existentes** DEVEM continuar valendo exatamente como hoje após a mudança. Nenhum cupom vigente pode passar a valer para fitas por omissão — a ausência de escopo definido NÃO DEVE ser interpretada como "ambos".

### Funcionais — Frete nacional

- **FR-013**: O sistema DEVE calcular frete para pedidos de fita a partir do **CEP de destino em todo o território nacional**, apresentando valor e prazo estimado antes do pagamento.
- **FR-014**: O cálculo de frete DEVE ter **limite de tempo de resposta** definido; ao estourá-lo, o sistema DEVE entrar em contingência (FR-015) — nunca travar a tela nem arbitrar um valor silenciosamente.
- **FR-015**: Quando o serviço de frete **falhar**, **estourar o tempo** ou **não atender** o CEP informado, o sistema DEVE registrar o pedido com frete **"a combinar"**, cobrando **somente o produto**, e DEVE informar isso ao comprador de forma explícita **antes** do pagamento. O sistema NÃO DEVE bloquear a venda nem estimar um valor de frete.
- **FR-034**: O pedido DEVE registrar **por que** caiu em "a combinar", distinguindo no mínimo **CEP não atendido** (operação normal) de **falha técnica do serviço** (incidente). As duas causas NÃO DEVEM ser indistinguíveis no registro.
- **FR-035**: O sistema DEVE **alertar a operação** quando pedidos consecutivos caírem em contingência por **falha técnica**, sem depender de alguém inspecionar pedidos manualmente. Uma credencial errada em produção faria 100% dos pedidos saírem sem frete cobrado enquanto o sistema aparenta operar conforme o especificado — este é o modo de falha que o alerta existe para pegar *(Constituição I)*.
- **FR-016**: O **servidor** é a autoridade do valor de frete cobrado. Um valor de frete exibido no carrinho que divirja do recalculado no checkout DEVE ser apresentado ao comprador **antes** do pagamento.
- **FR-017**: O cálculo de frete do vertical de porcelanato (tabela regional da Grande Goiânia) DEVE permanecer **inalterado**.

### Funcionais — SEO e navegação (não-negociáveis)

- **FR-018**: As páginas de fitas DEVEM viver sob um **namespace próprio**, espelhando o padrão do namespace de porcelanato.
- **FR-019**: **Nenhuma** URL existente de porcelanato pode mudar de endereço, ser removida ou passar a redirecionar.
- **FR-020**: Todos os links internos que sustentam a malha pSEO de porcelanato DEVEM continuar existindo após a reorganização da home e da navegação.
- **FR-021**: Toda URL nova DEVE ser publicada e referenciada **com barra final**, e o acesso sem barra final DEVE redirecionar preservando o protocolo seguro.
- **FR-022**: Uma URL inexistente dentro do namespace de fitas DEVE responder **404 real**, nunca uma página de erro com status de sucesso.
- **FR-023**: As páginas de fitas DEVEM ser registradas nos **quatro** índices do site: mapa do site, índice para agentes de IA, índice de busca interna e rodapé.
- **FR-024**: Um SKU só-orçamento DEVE ser **excluído do feed de produtos por design**, e a verificação automática do feed DEVE continuar passando sem falhar o build por causa dele.
- **FR-025**: A home DEVE identificar o site como **loja de fitas adesivas** no título, no `h1` e nos dados estruturados, com porcelanato como vertical **secundário** e caminho de navegação claro. Os dados estruturados DEVEM representar a cobertura **nacional** das fitas e **regional** do porcelanato, sem afirmar cobertura falsa para nenhum dos dois.
- **FR-031**: As páginas de fitas NÃO DEVEM conter sinais geográficos locais (menção a Goiânia em título, `h1`, copy ou `areaServed`). O nome do host é o único sinal local tolerado, e é um handicap aceito conscientemente — nada deve reforçá-lo. As páginas de porcelanato DEVEM manter seus sinais locais como estão.

### Funcionais — Conteúdo

- **FR-026**: O v1 DEVE publicar os três tipos de fita — **BOPP personalizada** (48 mm × 100 m, *orçamento*), **gomada kraft com fios de nylon** (70 mm × 150 m, *preço público*) e **transparente comum** (48 mm × 100 m, *preço público*) — com conteúdo rico: ficha técnica real, imagem própria e texto de aplicação/uso. Páginas genéricas ou mínimas são proibidas *(Constituição IV)*. A modalidade comercial não altera a exigência de conteúdo: a página da personalizada é tão rica quanto as outras.
- **FR-027**: Os **dados factuais** do produto (medidas, material, reforço, ativação, mínimo de pedido) DEVEM ser reaproveitados do institucional e NÃO DEVEM divergir dele — ficha técnica que discorda entre dois domínios da mesma operação é erro, não variação.
- **FR-032**: A **copy comercial** das páginas de produto do e-commerce DEVE ser própria e distinta da prosa do institucional. Os dois domínios NÃO DEVEM competir pela mesma intenção de busca:
  - `tapepro.roilabs.com.br` (institucional) — intenção **informacional/topo**: o que é, como escolher, aplicações por segmento, blog, marca.
  - `goiania.roilabs.com.br` (e-commerce) — intenção **transacional/fundo**: comprar, preço, quantidade mínima, prazo, frete, ficha comparável, carrinho.
- **FR-033**: As páginas de produto do e-commerce DEVEM apontar para o institucional como autoridade de marca e conteúdo de apoio. *(Escopo desta feature.)*
- **FR-033b**: O institucional DEVE apontar para o e-commerce como caminho de compra. ⚠️ **Fora do escopo da 011** — vive no repositório `ROI Labs/Tapepro/`, com deploy próprio. Registrado como **entrega separada**; misturar dois repositórios numa feature quebra o rollback. Sem esta contrapartida, o cruzamento fica pela metade e o ganho de SEO é parcial.
- **FR-030**: Os preços DEVEM vir da **tabela oficial do Tapepro** (`site-goiania/docs/Imagens/`). O sistema NÃO DEVE publicar valor estimado, arredondado ou inventado — é caminho de dinheiro.
- **FR-038**: O preço por rolo DEVE ser **escalonado por faixa de quantidade**. O sistema DEVE aplicar a faixa correspondente à quantidade do item e DEVE recalculá-la no servidor (FR-006) — a faixa nunca vem do cliente. Ao mudar a quantidade no carrinho, o unitário exibido DEVE acompanhar a faixa.
- **FR-039**: A página de produto DEVE **exibir a tabela de faixas** completa. É informação de decisão de compra em B2B (o comprador precisa ver que 50 rolos saem mais barato por unidade) e é conteúdo rico real, não enfeite.
- **FR-040**: A fita **personalizada** é **só-orçamento** — não entra no carrinho nem no checkout. Sua página DEVE exibir ficha, faixas de preço e o custo de clichê como **informação**, com CTA de orçamento (FR-005). O **clichê flexográfico NÃO entra no caminho de dinheiro**: é valor variável ("a partir de R$ 80,00") e custo único por arte, fechado no orçamento. O sistema NÃO DEVE cobrar clichê automaticamente por pedido.
- **FR-041**: O catálogo DEVE deixar visível ao comprador **qual modalidade** cada SKU segue, sem que ele precise clicar para descobrir: comum e gomada compram direto; personalizada vai a orçamento.

### Key Entities

- **SKU de fita**: um item vendável do catálogo de fitas. Identificação, tipo (BOPP personalizada / gomada / comum), ficha técnica, imagens, dados físicos para cotação de envio, e uma **modalidade comercial**: preço público ou só-orçamento.
- **Preço-autoridade de fita**: a fonte no servidor que define, por SKU, o preço por rolo usado para recalcular o pedido. Independente da tabela de porcelanato.
- **Item de pedido de fita**: a linha de um pedido, com quantidade em rolos e preço unitário congelados na compra.
- **Cotação de frete**: valor e prazo obtidos para um CEP de destino e uma composição de carga, com validade no tempo e um estado de contingência quando indisponível. A contingência carrega o **motivo** (CEP não atendido vs falha técnica), que é o que separa operação normal de incidente.
- **Cupom** *(existente, estendido)*: ganha um **escopo de vertical** — a quais catálogos ele se aplica. Cupons anteriores a esta feature recebem escopo de porcelanato por backfill.
- **Solicitação de orçamento**: pedido de proposta para SKU personalizado ou volume — contato, especificação e consentimento. Não gera cobrança.
- **Negócio originado** *(existente, spec 010)*: o repasse de um pedido pago ao Tapepro, com taxa e classificação congeladas na criação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um comprador em qualquer estado do Brasil consegue ir da página do produto ao pagamento concluído em **menos de 3 minutos**, vendo o valor do frete antes de pagar.
- **SC-002**: **100%** dos pedidos de fita pagos têm CPF/CNPJ válido registrado — nenhum negócio é classificado como aquisição por documento ausente.
- **SC-003**: **100%** das URLs de porcelanato indexadas respondem no mesmo endereço e mesmo status após a publicação, e o número de links internos para a malha não diminui.
- **SC-004**: **Zero** URLs novas acessíveis sem barra final e **zero** páginas de erro respondendo com status de sucesso, verificado em produção.
- **SC-005**: Em **100%** dos pedidos, o valor cobrado é igual ao recalculado pelo servidor — nenhum pedido é cobrado com valor originado do cliente.
- **SC-006**: **Zero** itens descartados em silêncio: toda tentativa de comprar um SKU sem preço público resulta em mensagem visível ao comprador.
- **SC-007**: As páginas de fitas aparecem nos **quatro** índices do site na primeira publicação (sem correção posterior).
- **SC-008**: Um pedido de fita pago gera negócio originado com a taxa correta (15% aquisição / 10% recorrência) em **100%** dos casos, conferido contra o documento do comprador.
- **SC-009**: A verificação automática de matemática do carrinho e a de feed continuam **verdes** após a mudança.
- **SC-010**: A cotação de frete devolve resultado ao comprador em **menos de 5 segundos** ou entra em contingência visível — nunca deixa a tela sem resposta.
- **SC-011**: **100%** dos pedidos em "a combinar" têm o motivo registrado, e uma indisponibilidade do serviço de frete é detectada pela operação **no mesmo dia** — não pela conferência manual de pedidos depois.

## Assumptions

- O carrinho de fitas segue o padrão já usado no site: estado no navegador, sem sessão de servidor, preservando a natureza estática das páginas de catálogo (que é o que sustenta o pSEO).
- O pagamento continua pelo mesmo provedor já integrado; esta feature não muda meio de pagamento.
- O repasse do pedido pago ao parceiro continua sendo uma ação **manual** do operador, como nas specs 007/010 — não há automação nova de faturamento aqui.
- O consentimento LGPD e a proteção anti-bot dos formulários seguem o padrão já existente no site.
- Cupons ganham escopo por vertical (FR-036) — é mudança de **código e de dado**, com backfill obrigatório dos cupons existentes para porcelanato (FR-037), não mero ajuste de configuração.
- A escolha do provedor de cálculo de frete (transportadora, Correios ou agregador) é **decisão de plano**, não de spec. Esta feature assume que existe um serviço consultável por CEP e carga.
- O idioma e a moeda são os mesmos do site atual (português do Brasil, real).
- ~~**Preço unitário fixo acima do mínimo**, sem faixas por volume.~~ **REFUTADA em 2026-07-22** pela tabela oficial do Tapepro (`site-goiania/docs/Imagens/`): o preço **é escalonado por faixa de quantidade**. Ver FR-038 e o data-model.
- A "fita transparente comum" tem **preço único** (R$ 7,90/un) e **nenhum mínimo declarado** na tabela oficial — é o único dos três SKUs sem faixa e sem mínimo.

## Dependencies

- **Conteúdo de catálogo do Tapepro** — ✅ **já existe e é reaproveitável**. Fonte primária: `Tapepro/src/lib/produtos.ts` (3 SKUs com ficha técnica, aplicações, benefícios, copy de SEO, mínimos de pedido). Imagens: `Tapepro/src/assets/produtos/` (4 PNG, incluindo clichê) e `Tapepro/imagens/` (fotos reais de trabalhos de clientes, com e sem fundo). Fontes de apoio: `tapepro.roilabs.com.br`, `tapeprofitas.com.br` e `site-goiania/docs/Imagens/`. ⚠️ Excluir `imagens/com fundo/sua-marca-aqui.png` — carrega a marca de outro fornecedor, conforme `Tapepro/CLAUDE.md`.
- **Preço por rolo dos 3 SKUs** — ❌ **não existe em nenhuma fonte**. É o **único bloqueio de publicação**. Não bloqueia a construção do fluxo. Ver FR-030.
- **Serviço de cálculo de frete nacional** — precisa estar contratado/credenciado e acessível a partir do servidor, com credenciais em produção *(Constituição I: conferir variáveis de ambiente antes de investigar qualquer falha de cotação)*.
- **Spec 010 (success fee com duas taxas)** — já shipada; esta feature consome a classificação aquisição/recorrência e depende do documento do comprador para funcionar.
- **Parceiro Tapepro ativo** — já cadastrado, com as duas taxas definidas e `podeGerar=true`.

## Out of Scope

- Generalizar o caminho de dinheiro de porcelanato para unidades arbitrárias (decisão explicitamente rejeitada; ver Contexto).
- Migrar os pedidos de porcelanato já existentes.
- Malha pSEO própria para fitas (páginas de combinação por termo de busca) — o v1 entrega o catálogo; a malha é feature futura.
- Automação de faturamento ou de repasse ao parceiro.
- Área logada de cliente B2B, tabela de preço por cliente ou pedido recorrente.
- Transformar `tapepro.roilabs.com.br` em loja — ele permanece o **site institucional** de fitas. A divisão institucional (tapepro) / e-commerce (goiania) é decisão travada.
- Migrar a loja de fitas para outro domínio ou domínio próprio.
- Alterar o conteúdo, a copy ou os sinais locais das páginas de porcelanato — a malha fica exatamente como está.

## Riscos

- **Frete é o risco nº 1.** É a única parte do projeto que depende de um serviço externo no caminho de dinheiro. Uma cotação errada é prejuízo direto por pedido; uma cotação indisponível trava a venda.
- **A malha pSEO de porcelanato é o argumento de venda da cadeira vaga.** 41 páginas + 5 guias levaram meses. Quebrá-la não custa receita — custa o pitch comercial que justifica o modelo de cadeiras. O erro recorrente conhecido neste repo é esquecer um dos quatro índices ao adicionar rotas.
- **Hostname geográfico contra produto nacional.** `goiania.roilabs.com.br` vendendo fita B2B nacional é um sinal contrário aceito conscientemente (ver Clarifications, terceira rodada). Mitigado por FR-031, mas não eliminado — se o SEO nacional de fitas não deslanchar em 6 meses, o hostname é a primeira hipótese a testar, não a última.
- **Duplicação deliberada** entre os dois verticais: o teto é que uma terceira unidade de venda torna a duplicação insustentável. O caminho de upgrade — generalizar o item de pedido — fica registrado para quando isso acontecer *(Constituição III)*.
- **Verificação em ambiente real é obrigatória** *(Constituição II)*: mudanças em preço, item de pedido ou frete exigem self-check puro **e** um pedido pago de verdade em produção, como nas specs 002/003/010. Build local não prova nada neste repo.

## Questões resolvidas

| # | Questão | Resolução (2026-07-22) | Onde ficou |
|---|---------|------------------------|------------|
| Q1 | Carrinho misto entre verticais? | **Não.** Um vertical por pedido; carrinhos separados com aviso. | FR-028, US1 cenário 8 |
| Q2 | Contingência quando o frete falha? | **"A combinar"** com aviso explícito, cobrando só o produto. Nunca bloqueia a venda. | FR-014, FR-015 |
| Q3 | Dados reais do catálogo? | Ficha, fotos e copy **já existem** no institucional do Tapepro. **Só o preço falta.** | FR-027, FR-030, Dependencies |
| Q4 | Fitas ou porcelanato lidera o SEO? | **Fitas** — cadeira ocupada com receita real. Porcelanato é moeda de troca; malha preservada como ativo de venda da cadeira. | Contexto, US3, FR-025, FR-031 |
| Q5 | Papel de cada domínio? | `tapepro` = institucional; `goiania` = e-commerce. Divisão de conteúdo por **intenção de busca**. | FR-027, FR-032, FR-033 |
| Q6 | Como detectar contingência de frete? | Gravar **motivo** no pedido + **alertar** em falhas técnicas consecutivas. | FR-034, FR-035, SC-011 |
| Q7 | Cupom vale para fitas? | **Escopo por vertical**, configurável. Cupons existentes recebem backfill para porcelanato. | FR-036, FR-037 |

**Único bloqueio remanescente para publicar**: preço por rolo dos 3 SKUs (FR-030). Não bloqueia `/speckit-plan` nem a implementação do fluxo.

## Pendências para o `/speckit-plan`

Decisões técnicas que a spec deliberadamente não toma:

1. **Provedor de frete** — transportadora, Correios ou agregador; credenciais e ambiente. Inclui o canal do alerta de FR-035.
2. **Onde mora o catálogo de fitas** no site-goiania, e como os **fatos** da ficha técnica ficam sincronizados com o institucional (FR-027) sem virar cópia manual que diverge — enquanto a copy comercial permanece própria (FR-032).
3. **Formato da estrutura de item de pedido de fita** no banco (tabela nova vs colunas novas), respeitando FR-003 (porcelanato intocado) e o gotcha conhecido do repo: `db push` manual antes do push do código, e `NOT NULL` sem backfill quebra consultas existentes.
4. **Como os dois carrinhos coexistem** no navegador (FR-028) sem um sobrescrever o outro.
5. **Migração do escopo de cupom** (FR-036/037): coluna nova + backfill de todos os cupons vigentes para porcelanato, na mesma janela do `db push`.
6. **Reposicionamento da home** (FR-025): trocar title/`h1`/JSON-LD de porcelanato para fitas é mudança de sinal de SEO em página que já ranqueia — precisa de registro de antes/depois no GSC para ser avaliável.
