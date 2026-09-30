# Glossário do produto (admin da ROI Labs)

Um verbo por ação e um nome por coisa. Antes de nomear um botão, procure aqui; se o termo não estiver,
decida e registre. Começou com a spec 017 (Projeção).

| Termo | Usar | Nunca | Onde aparece |
|---|---|---|---|
| Projeção | "Projeção", "Projeção de vendas" | previsão, forecast, estimativa de faturamento | menu do admin, `/admin/projecao`, aviso no simulador |
| Consultar | "Consultar termos" (ação paga na DataForSEO) | buscar, pesquisar, analisar, rodar | botão da Projeção, estado "Consultando…" |
| Termos de compra | "termos de compra", "termos" | palavras-chave, keywords, KWs | campo da Projeção, onboarding |
| Cenário | "Conservador", "Base", "Otimista" | pessimista, realista, provável | rádios da Projeção, aviso no simulador |
| Média do ano 1 | "média do ano 1" (soma dos 12 meses ÷ 12) | média anual, ritmo médio | número-herói da Projeção, aviso no simulador |
| Mês estável | "mês estável" (depois que a posição se estabiliza) | regime, potencial máximo, run-rate | cartão da Projeção, cadeia |
| Fora do alcance | "fora do alcance" (dificuldade acima do limite do cenário) | inviável, impossível, bloqueado | tabela de termos, cobertura |
| Sem volume medido | "sem volume medido" (a fonte devolveu vazio) | 0 buscas, sem dados, N/A | tabela de termos, cobertura |
| Taxa do mercado / Taxa do parceiro | "Usar a taxa do parceiro", "Voltar à taxa do mercado" | benchmark (na interface), taxa real, override | cadeia da Projeção |
| Usar no simulador | "Usar no simulador" (leva nicho e ritmo para Preços) | exportar, enviar, aplicar | cartão da Projeção |
| Ritmo esperado de venda | "Ritmo esperado de venda" | volume de vendas, meta | simulador em `/admin/precos` |
| Consulta guardada | "consulta guardada", "Consultas guardadas" (toda consulta paga que deu certo) | consulta salva, histórico de buscas, log, registro | `/admin/projecao/consultas`, link no cabeçalho da Projeção, procedência |
| Guardar | "guardada", "não entrou nas consultas guardadas" | salvar, gravar, registrar (na interface) | aviso e procedência da Projeção |
| Para quem | "Para quem (opcional)" (nome da consulta); "Para quem" obrigatório na proposta de cadeira | cliente, parceiro, projeto, rótulo | campo da Projeção, 1ª coluna das consultas guardadas, simulador de Preços, título da proposta |
| Nova consulta | "Nova consulta" (volta à Projeção vazia) | nova busca, novo cálculo | cabeçalho das consultas guardadas |
| Guardar proposta | "Guardar proposta", "Guardando…" (congela a proposta de cadeira e dá o link) | salvar, gerar, emitir, enviar proposta | simulador em `/admin/precos` |
| Proposta de cadeira | "Proposta para {para quem}", selo "Cadeira" na lista | orçamento, cotação, proposta comercial | `/admin/propostas`, página pública `/p/<slug>` |
| Válida até / Vencida em | "Válida até dd/mm/aaaa", "Vencida em dd/mm/aaaa" (15 dias) | expira, prazo, validade expirada | cartão da proposta, página pública |
| Falar com a ROI Labs no WhatsApp | CTA único da página pública da proposta | aceitar, fechar, contratar agora | `/p/<slug>` |
| Emitir contrato | "Emitir contrato" no cartão da proposta de cadeira (e da Vértice) | gerar, criar, fechar contrato | `/admin/propostas` |
| Contrato de cadeira | "Contrato de parceria — cadeira de {nicho}", selo "Cadeira" na lista | termo, acordo, contrato de serviço | `/admin/contratos`, página pública `/c/<slug>` |
| Aceitar o contrato | CTA único do aceite; estado "Aceito em dd/mm/aaaa às hh:mm por {nome}" | assinar, confirmar, concordar | `/c/<slug>`, cartões da proposta e do contrato |
| Não envie ainda | "Não envie ainda: N pendências travam o aceite" (contrato com "[a preencher]") | incompleto, rascunho, erro | cartões da proposta e do contrato |
| Venda | "Vendas" (menu), "Registrar venda", "Nenhuma venda registrada ainda." | negócio, negócio originado, deal (na interface; no banco é `NegocioOriginado`) | `/admin/vendas` |
| Comissão | "Comissão", "Faturas de comissão", "a faturar" | success fee, fee (no admin) | `/admin/vendas` |
| Gerar fatura | "Gerar fatura de R$ X" (o valor no botão, confirmação antes de cobrar no Asaas) | emitir cobrança, faturar (como botão) | `/admin/vendas` |
| Nº do orçamento | "Nº do orçamento" = o número **no sistema do parceiro** (ex.: 0446 da TapePro) | pedido, ID; não confundir com a Proposta de cadeira, que nunca se chama orçamento | formulário de venda fechada fora do site |
