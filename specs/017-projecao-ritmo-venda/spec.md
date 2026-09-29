# Feature Specification: Projeção — ritmo esperado de venda pela demanda de busca

**Feature Branch**: `017-projecao-ritmo-venda`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Precisamos criar uma nova pagina/feature chamada 'projeção', ela vai projetar o ritmo esperado de venda em função do DataforSEO + Benchmark de mercado de taxas de conversão no funil de vendas por nicho. Isso é pra ajudar a responder 'https://app.roilabs.com.br/admin/precos' > 'Ritmo esperado de venda'."

## Contexto

O simulador de proposta em `/admin/precos` (spec 016) pede o **ritmo esperado de venda** (pedidos pagos, assinaturas novas ou consultas comparecidas por mês) e hoje só orienta "pergunte ao parceiro, ou use um número conservador". O número é chute, e é ele que move a comissão e o "ROI Labs no 1º ano" da proposta.

A projeção troca o chute por uma conta rastreável: **quanto o nicho do parceiro é buscado** (volume mensal dos termos com intenção de compra, medido na DataForSEO) × **quanto desses cliques uma loja nova pega** (CTR pela posição que a loja alcança em cada termo segundo a dificuldade dele, subindo ao longo de 12 meses porque o orgânico leva de 3 a 6 meses para estabilizar) × **quanto desses visitantes vira venda** (benchmark de mercado da conversão do funil daquele nicho, com fonte).

Decisões já tomadas com o dono (28/09/2026):
- **Página própria** `/admin/projecao` com um botão que leva o resultado ao simulador já preenchido.
- **Os termos vêm de uma conversa com o Claude**: o operador explica o nicho do parceiro e recebe a lista dos melhores termos, e a página só recebe a lista pronta. Não há LLM dentro do app, porque o único LLM custeado é o `claude-cli` (constituição, Restrições Técnicas).
- **Benchmarks por pesquisa com fonte**: cada taxa do funil, de cada nicho, sai de fonte citada com data, em faixa conservador, base e otimista.

## Clarifications

### Session 2026-09-28

- Q: Como a projeção decide a posição que a loja alcança em cada termo? → A: Pela dificuldade medida de cada termo (0 a 100, DataForSEO Labs). Termo difícil entra com posição pior ou fica fora do alcance no ano 1, para que um termo muito buscado não decida a soma sozinho.
- Q: Qual ritmo mensal o botão "Usar no simulador" leva? → A: A média do ano 1 (soma dos 12 meses projetados ÷ 12). O mês estabilizado aparece na página, mas não vai para o simulador.
- Q: Qual cenário vem selecionado quando a página abre? → A: O conservador, seguindo o que o simulador já orienta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Projetar o ritmo de um parceiro a partir dos termos (Priority: P1)

Como operador, antes da reunião com um candidato a cadeira, colo a lista de termos que o Claude me passou, escolho o nicho e a região, e vejo quantas vendas por mês o orgânico tende a trazer em cada mês do ano 1, em três cenários. Assim chego com um número que consigo defender, não com um chute.

**Why this priority**: é a feature. Sem ela o simulador continua dependendo de um palpite.

**Independent Test**: abrir `/admin/projecao`, escolher "Moda, vestuário e calçados", região Brasil, colar 10 termos e consultar. A página mostra a demanda somada, a curva de 12 meses por cenário e o número mensal que vai para o simulador.

**Acceptance Scenarios**:

1. **Given** o operador logado, nicho moda, região Brasil e 10 termos colados, **When** consulta o volume, **Then** vê o volume mensal e a dificuldade de cada termo, a demanda total, a demanda alcançável no ano 1, e a projeção de pedidos por mês do mês 1 ao 12 nos cenários conservador, base e otimista.
2. **Given** uma projeção feita, **When** o operador troca de cenário ou de nicho, **Then** a projeção é recalculada sem nova consulta paga, porque o volume dos termos não mudou.
3. **Given** o nicho "Software e SaaS B2B", **When** projeta, **Then** a saída é em **assinaturas novas por mês**. Para "Serviços locais e clínicas", é em **consultas comparecidas por mês**. Para os demais nichos, é em **pedidos pagos por mês**.
4. **Given** qualquer projeção, **When** o operador olha uma taxa do funil ou o CTR usado, **Then** vê de onde veio: fonte, data e, se for premissa sem fonte de mercado, o aviso de que é premissa.

---

### User Story 2 - Levar o número para o simulador (Priority: P1)

Como operador, com a projeção pronta, clico em "Usar no simulador" e caio em `/admin/precos` com o nicho e o ritmo já preenchidos, e fecho a proposta sem redigitar nada.

**Why this priority**: a projeção existe para responder o campo "Ritmo esperado de venda". Sem essa ponte, o número morre na página.

**Independent Test**: fazer uma projeção, clicar em "Usar no simulador" e conferir que o simulador abre com o mesmo nicho e o mesmo número mensal, e que a comissão é recalculada.

**Acceptance Scenarios**:

1. **Given** uma projeção de moda com média de 18 pedidos/mês no ano 1 (cenário escolhido), **When** clica em "Usar no simulador", **Then** o simulador abre com nicho moda e "Pedidos pagos por mês" = 18.
2. **Given** o simulador aberto a partir da projeção, **Then** ele indica que o ritmo veio da projeção (cenário e que é a média do ano 1), no lugar do texto genérico "pergunte ao parceiro".
3. **Given** o simulador aberto direto, sem vir da projeção, **Then** ele funciona exatamente como hoje, com os valores padrão.

---

### User Story 3 - Entender e contestar a conta (Priority: P2)

Como operador, quero ver cada degrau do funil (buscas → cliques → visitas → vendas) com o número e a taxa de cada passagem, para responder quando o parceiro disser "isso tá otimista demais" ou "no meu nicho converte mais".

**Why this priority**: número sem conta aberta não se defende numa reunião. Mas a US1 já entrega valor sem a cadeia detalhada.

**Independent Test**: com uma projeção feita, conferir que multiplicar os degraus mostrados reproduz o número final do mês 12.

**Acceptance Scenarios**:

1. **Given** uma projeção, **When** o operador abre o detalhe, **Then** vê a cadeia do mês estabilizado: demanda mensal × participação de cliques × taxas do funil = vendas por mês, com a fonte de cada taxa.
2. **Given** um parceiro que já sabe a própria taxa de conversão, **When** o operador a digita no lugar do benchmark, **Then** a projeção usa a taxa informada e marca que ela veio do parceiro, não do mercado.

### Edge Cases

- **Termo sem volume medido** (a fonte devolve vazio para busca muito baixa): aparece como "sem volume medido", separado de "0 buscas", e entra como zero na soma. A página avisa quantos termos ficaram sem dado.
- **Variantes com o mesmo volume** (singular e plural, com e sem acento): a fonte costuma repetir o mesmo volume em variantes próximas, e somar tudo multiplica a demanda. Variantes agrupadas pela fonte contam uma vez, e a página mostra quais foram agrupadas.
- **Lista vazia, com duplicados ou longa demais**: a lista vazia bloqueia a consulta; linhas repetidas (ignorando caixa e espaços) contam uma vez; acima do teto de termos por consulta, a página pede para cortar a lista, sem truncar em silêncio.
- **Saldo da DataForSEO acabou, chave ausente ou fonte fora do ar**: a página diz qual dos três aconteceu, e não mostra projeção com zero no lugar do dado que faltou.
- **Termo sem dificuldade medida** (a base de dificuldade não cobre todo termo de cauda longa): entra com a posição de um termo de dificuldade média no cenário, marcado como "dificuldade não medida", e a página diz quantos termos ficaram assim.
- **Toda a demanda fora do alcance** (só termos muito difíceis): a projeção mostra zero com a explicação de que nenhum termo é alcançável no ano 1 naquele cenário. Não é tratado como erro nem como falta de dado.
- **Clínica sem cidade**: serviço local é buscado por região. Projetar clínica com região "Brasil" mostra o aviso de que a demanda nacional superestima o que uma clínica atende.
- **Demanda pequena** (por exemplo, menos de 1 venda por mês no cenário base): mostra o número com casa decimal e o aviso de que o orgânico sozinho não sustenta a cadeira nesse ritmo. Não arredonda para 1.
- **Valor digitado em pt-BR** ("1,5%", "2.000"): é lido como número, e valor inválido mostra aviso, não NaN (mesmo comportamento do simulador).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A página DEVE ficar em `/admin/projecao`, protegida pelo login do admin, com link no menu do admin.
- **FR-002**: O operador DEVE informar o nicho (os mesmos nichos da tabela de Precificação), a região (Brasil ou uma cidade) e a lista de termos, um por linha.
- **FR-003**: A consulta de volume DEVE acontecer só quando o operador pedir, e nunca ao abrir a página ou ao mudar cenário, nicho ou taxa. Trocar essas escolhas recalcula em cima do volume já consultado.
- **FR-004**: A consulta DEVE ter teto de termos, e a página DEVE mostrar o custo da consulta devolvido pela fonte.
- **FR-005**: A projeção DEVE cobrir os meses 1 a 12, em três cenários (conservador, base e otimista), com a participação de cliques subindo ao longo dos meses conforme a rampa de maturação do orgânico.
- **FR-005a**: A posição que a loja alcança DEVE ser calculada **por termo**, a partir da dificuldade medida dele (0 a 100) e do cenário. Termo acima do limite de dificuldade do cenário fica **fora do alcance no ano 1**: aparece na lista, não entra na captura, e a página mostra quanto da demanda total ficou fora.
- **FR-005b**: A página DEVE abrir com o cenário **conservador** selecionado. É dele o número que "Usar no simulador" leva, até o operador escolher outro cenário.
- **FR-006**: A unidade da saída DEVE seguir o modelo do nicho: pedidos pagos por mês (percentual), assinaturas novas por mês (mensalidade), consultas comparecidas por mês (consulta).
- **FR-007**: Cada nicho DEVE ter taxas de conversão do funil por cenário, e cada taxa DEVE exibir fonte e data. Taxa sem fonte de mercado DEVE aparecer marcada como premissa, com o motivo.
- **FR-008**: O CTR por posição e a rampa de 12 meses DEVEM exibir fonte ou a marca de premissa, como no FR-007.
- **FR-009**: O operador DEVE poder substituir a taxa de conversão do benchmark pela taxa real do parceiro, e a projeção DEVE indicar a origem da taxa usada.
- **FR-010**: "Usar no simulador" DEVE abrir `/admin/precos` com o nicho e o ritmo mensal preenchidos. O ritmo levado é a **média mensal do ano 1** do cenário escolhido, para que o "Comissão em 12 meses" do simulador bata com o ano 1 projetado. O mês estabilizado aparece na projeção como referência de potencial, mas não é levado.
- **FR-011**: O simulador DEVE continuar funcionando como hoje quando aberto sem vir da projeção. Quando vier, DEVE indicar a origem (projeção, cenário, média do ano 1).
- **FR-012**: A página NÃO DEVE gravar nada: nem projeção, nem taxa de parceiro, nem fatura (mesma regra do simulador, "nada é salvo aqui").
- **FR-013**: A chave da DataForSEO NÃO DEVE chegar ao navegador, e só um operador logado DEVE conseguir disparar consulta paga.
- **FR-014**: Falha da fonte de volume DEVE produzir mensagem que diga a causa (saldo, chave ou indisponibilidade) e registrar o erro no log do servidor.
- **FR-015**: A página DEVE deixar claro o que a projeção não cobre: só busca orgânica do Google (sem mídia paga, marketplace, redes sociais ou recompra), e o dado de volume é média dos últimos 12 meses.

### Key Entities

- **Termo consultado**: texto do termo, volume mensal médio (ou "sem volume medido"), dificuldade de 0 a 100 (ou "não medida"), posição alcançável por cenário (ou "fora do alcance no ano 1"), grupo de variante e região.
- **Benchmark de nicho**: nicho, degraus do funil do modelo (por exemplo, visita → pedido no e-commerce; visita → contato → agendamento → comparecimento na clínica), taxa por cenário, fonte, data e confiança.
- **Curva de captura**: participação de cliques esperada por mês (1 a 12) e por cenário, derivada do CTR por posição, com fonte.
- **Projeção**: vendas por mês (1 a 12) por cenário, média do ano 1 e mês estabilizado. É efêmera e não é gravada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com a lista de termos pronta, o operador sai com o ritmo mensal preenchido no simulador em menos de 3 minutos, sem redigitar número.
- **SC-002**: 100% das taxas e curvas usadas na conta exibem fonte e data, ou a marca de premissa. Nenhum número da cadeia aparece sem origem.
- **SC-003**: Casos de referência com números redondos (demanda, CTR e conversão conhecidos) produzem exatamente o resultado esperado em cada cenário e em cada um dos 3 modelos, e ficam travados em teste automatizado.
- **SC-004**: Uma consulta com até o teto de termos (volume + dificuldade) custa no máximo US$ 0,15 na DataForSEO, e mudar cenário, nicho ou taxa não gera nova cobrança.
- **SC-005**: A página abre sem erro de console e não rola para o lado em 390 px de largura.
- **SC-006**: Nenhuma rota de dinheiro, fatura, taxa de parceiro ou schema de banco é alterada.

## Assumptions

- **Termos com intenção de compra**: a lista vem da conversa com o Claude já filtrada. Entram termos transacionais e comerciais do que o parceiro vende de fato. Ficam de fora os informacionais ("como…", "o que é…"), as marcas de terceiros e os atributos que ele não vende (cor, tamanho, modelo), porque esses erros inflaram a demanda na spec 057 do roihub. A página não reclassifica intenção.
- **Posição esperada, não garantida**: a loja nova não começa na 1ª página. A posição sai da dificuldade de cada termo (FR-005a), e os cenários diferem pela tabela de dificuldade para posição, pelo limite de alcance e pela taxa de conversão. A rampa vai de captura zero no mês 1 até a posição-alvo entre os meses 4 e 9, conforme o cenário (research D8). O simulador já afirma de 3 a 6 meses, e o conservador estica para cobrir uma loja sem autoridade nenhuma.
- **AI Overviews e SERP com anúncios reduzem o CTR orgânico**: a curva de CTR usada deve refletir estudos recentes (2025–2026), não as curvas antigas.
- **Volume da DataForSEO = Google Ads** (média mensal de 12 meses, sem sazonalidade na v1). A conta DataForSEO já existe e foi recarregada em 28/09/2026. A chave precisa ser configurada no `/app` em produção.
- **Sem persistência na v1** (atalho deliberado, constituição III): refazer a mesma consulta paga de novo, cerca de US$ 0,10 com volume e dificuldade. O teto é o saldo, que dá cerca de 500 consultas com US$ 50. O upgrade é um cache por termo e região se o gasto passar de US$ 5 por mês.
- **Benchmarks pesquisados na fase de plano** (`research.md`), com prioridade para fontes brasileiras (NielsenIQ Ebit/Webshoppers, ABComm, Nuvemshop e relatórios de plataforma), estrangeiras só onde não houver nacional, e confiança por nicho como na tabela de Precificação.
- **Fora do escopo**: sugestão de termos dentro do app, sazonalidade mês a mês, projeção de receita em R$ (o simulador faz o dinheiro), gravação ou compartilhamento da projeção, e projeção de mídia paga.
