# Feature Specification: Precificação — tabela de success fee por nicho no admin

**Feature Branch**: `016-precificacao`

**Created**: 2026-09-27

**Status**: Implementado no branch (não publicado — ver handoff.md)

**Input**: User description: "implemente como nova feature 'precificação' do painel adm app.roilabs" — a partir da pesquisa de mercado de 27/09/2026 que propôs percentuais de comissão por nicho/segmento para quem vai ocupar as cadeiras.

## Contexto

Hoje o success fee é **15% aquisição / 10% recorrência** para todo parceiro (padrão da spec 010, editável por parceiro). A pesquisa de 27/09/2026 (marketplaces, afiliados, representantes, margens IBGE/balanços, CAC de mídia paga) concluiu que o número certo depende principalmente da **margem bruta do fornecedor** e propôs uma tabela em faixas: Premium 18/10, Padrão 15/10, Intermediária 12/8, Margem fina 10/6 e 8/5, mais três modelos especiais (B2B 15/8, SaaS por mensalidade, clínicas por consulta). A feature põe essa tabela e as contas dela no `/admin`, para montar a proposta de uma cadeira — **sem tocar na cobrança**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar a taxa de um nicho (Priority: P1)

Como operador, quero abrir uma página do admin e ver, por nicho, a taxa de 1ª compra, a de recompra, a regra específica, o porquê do número e o grau de confiança, para montar a proposta de uma cadeira sem abrir planilha.

**Independent Test**: abrir `/admin/precificacao` e achar "Moda, vestuário e calçados" com 15% / 10%.

**Acceptance Scenarios**:

1. **Given** o operador logado, **When** abre `/admin/precificacao`, **Then** vê as 5 faixas resumidas e a tabela completa agrupada por faixa, com confiança por linha.
2. **Given** o banco fora do ar, **When** a página carrega, **Then** a tabela e as calculadoras continuam funcionando (só a seção de parceiros avisa que não carregou).

### User Story 2 - Calcular a comissão de um pedido (Priority: P1)

Como operador, quero escolher o nicho e o valor do produto e ver quanto a ROI Labs recebe na 1ª compra e na recompra, já com piso de R$ 5, taxa reduzida em pedido grande e desconto de distribuidor, para usar na conversa de venda.

**Acceptance Scenarios**:

1. **Given** moda e R$ 200, **Then** 1ª compra R$ 30 e recompra R$ 20.
2. **Given** casa/móveis e R$ 4.000, **Then** 1ª compra R$ 380 (R$ 180 até R$ 1.500 a 12% + R$ 200 acima a 8%).
3. **Given** papelaria e R$ 25, **Then** vale o piso: R$ 5.
4. **Given** distribuidor marcado, **Then** −3 pontos na 1ª compra e −2 na recompra, nunca abaixo de 5%.

### User Story 3 - Encaixar um fornecedor pela margem (Priority: P2)

Como operador, quero informar a margem bruta real (e o frete que o fornecedor paga) e ver a folga, a recompra máxima e a faixa sugerida, para precificar nicho fora da tabela ou fornecedor que foge do típico.

**Acceptance Scenarios**:

1. **Given** margem 45% e frete 0, **Then** faixa Padrão 15% / 10%.
2. **Given** margem 20%, **Then** aviso de que nenhum percentual fecha a conta.
3. **Given** margem 35% e frete 10%, **Then** a faixa cai para 8% / 5% (frete pesado derruba a faixa).

### User Story 4 - Comparar com as taxas em vigor (Priority: P3)

Como operador, quero ver cada parceiro (menos os riscados) com a taxa gravada hoje ao lado da linha da tabela que casa com o nicho dele, para saber quem está acima ou abaixo da tabela antes de uma renovação.

**Acceptance Scenarios**:

1. **Given** um parceiro de nicho "Fitas adesivas" a 15/10, **Then** a linha sugerida é B2B 15/8 e a situação "Acima da tabela".

### Edge Cases

- Valor digitado em pt-BR ("1.500,00", "R$ 1.500") é lido como número; lixo mostra aviso, não R$ NaN.
- Pedido menor que R$ 5: o piso não passa do valor do pedido.
- 2/3 da taxa acima do corte nunca fura o mínimo de 5%.
- Nicho de parceiro sem linha correspondente: "Nicho fora da tabela: use o encaixe pela margem".

## Requirements *(mandatory)*

- **FR-001**: A página DEVE ficar em `/admin/precificacao`, protegida pelo login do admin, com link no menu.
- **FR-002**: A tabela DEVE ter, por nicho: faixa, taxa de 1ª compra, taxa de recompra, regra específica, justificativa e confiança; SaaS e clínicas mostram texto (modelo próprio), não percentual.
- **FR-003**: A calculadora DEVE aplicar: percentual sobre o produto sem frete; piso de R$ 5 (limitado ao valor do pedido); 2/3 da taxa na parte acima de R$ 1.500 (R$ 5.000 no B2B), arredondado ao ponto e nunca abaixo de 5%; ajuste de distribuidor −3/−2 pontos com mínimo de 5%.
- **FR-004**: O encaixe pela margem DEVE usar folga = margem × (1 − 9%) − 4% − frete e sugerir a faixa mais alta cuja margem mínima foi atingida **e** cuja recompra cabe em 1/3 da folga; sem faixa possível, avisar.
- **FR-005**: A página NÃO DEVE alterar nenhuma taxa de parceiro nem entrar no cálculo da fatura (spec 010 intocada).
- **FR-006**: Falha do banco NÃO DEVE derrubar a página: a seção de parceiros avisa e registra `log.error`.
- **FR-007**: A página DEVE declarar o que é premissa sem fonte de mercado (1/3 da folga, piso, corte, volume) e que contrato/impostos passam por advogado/contador.

## Success Criteria *(mandatory)*

- **SC-001**: Os exemplos numéricos do relatório (R$ 30/20, R$ 380, piso R$ 5) saem idênticos na calculadora — travados em `test/precificacao.test.mjs`.
- **SC-002**: A página abre sem banco e sem erro de console, e não rola para o lado em 390px.
- **SC-003**: Nenhuma rota de dinheiro, schema Prisma ou fatura é modificada.

## Assumptions

- A tabela é **proposta**, ainda não decidida pelo Jean; por isso é referência e não parâmetro de cobrança.
- Muda poucas vezes por ano: fica em código (`app/src/lib/precificacao.ts`), não no banco (Constituição III).
- O repositório `JeanZorzetti/roilabs` é **público**: publicar a feature publica a tabela (ver handoff.md).
