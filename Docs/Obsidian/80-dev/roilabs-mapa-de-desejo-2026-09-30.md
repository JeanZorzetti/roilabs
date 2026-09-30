---
tipo: análise
status: diagnóstico (modo a decidir pelo Jean)
data: 2026-09-30
dono: Jean
---

# roilabs.com.br: Mapa de Desejo da cadeira (diagnóstico, 30/09/2026)

Diagnóstico do posicionamento **no ar hoje** em `roilabs.com.br` (home + `/modelo`, versão de 29/09) contra a evidência
disponível. Método: skill `desire-positioning`. Um veredito exige **3 evidências de 2 tipos, com pelo menos 1 revelada**, e o
que não tem evidência sai como hipótese com plano de medição. Relaciona-se com [[oferta]], [[mercado]] e
[[nimblabs-mapa-de-desejo-2026-09-29]] (mesmo método).

**Resumo em 6 linhas**
1. **O site não capta o comprador.** Em 3 meses: 0 candidaturas reais (a única no banco é um teste), 0 consulta de
   comprador no GSC, e a categoria com que o site se apresenta ("agência que cobra por resultado", "marketing por
   comissão") tem busca zero. Os dois negócios reais (Tapepro e a proposta de 29/09) vieram de relacionamento, não do site.
2. **O preço público não tem prova.** R$ 0 → R$ 2.640 (24/09) → R$ 3.960 (29/09), sem nenhuma venda no meio. A única
   proposta real, de 29/09, saiu com anuidade de **R$ 1.320**, um terço do preço público. Receita recebida até hoje: **R$ 0**.
3. **O site compete contra a alternativa errada.** Ele se define contra "agência", mas a frustração com agência não
   aparece na busca. O hábito que tem volume, e que cresce, é o **marketplace**: "como vender no mercado livre" tem 18.100
   buscas/mês, e "taxa do mercado livre" foi de 1.000 para 2.400 em 12 meses. A página com mais impressões do site
   inteiro é o artigo "marketplace ou canal próprio".
4. **O site lidera com o que o time faz melhor e o comprador não procura:** SEO programático, "centenas de páginas" e o
   mapa de cadeiras/exclusividade. Nenhum desses termos tem busca.
5. **A probabilidade percebida é baixa.** A prova de resultado da home vem da Use Aligner, que é cadeira da casa
   (`daCasa: true`). A única cadeira de cliente externo com contrato (Tapepro) tem 4 pedidos pendentes e nenhum pago.
6. **Modo indicado: reposicionar UMA peça, o quadro de referência** (contra quem compete: agência → marketplace ou
   representante). Hoje isso é hipótese. O plano de medição (seção 8) decide até 31/10, com as conversas do outbound, e
   não com mudança de copy.

## 1. Modo e comprador

**Modo:** diagnóstico. O modo recomendado sai na seção 7.

| | Quem é | O que quer (hipótese, seção 2) |
|---|---|---|
| Paga | dono de fornecedor ou fabricante com catálogo próprio (Tapepro: fábrica de fitas). A proposta de 29/09 já é de **serviço** ("Cursos e formação profissional", cadeira de serviço): o ICP escrito no site ("estoque e despacho") não cobre mais o negócio real | vender mais, sem montar estrutura e sem jogar dinheiro fora de novo |
| Usa | o mesmo dono, que recebe a venda pronta da equipe de vendas da ROI Labs | menos trabalho de atender e cotar |

Quem paga e quem usa são a mesma pessoa, então o desejo que decide é o do dono.

## 2. Desejo em 1 frase

**Hipótese, não medida** (não há evidência declarada, nível 3 ou 4, das palavras do fornecedor):

> "Quero **vender pela internet** para o Brasil **sem depender da taxa do Mercado Livre** e sem pagar agência que não traz venda."

Os termos vêm da busca (E6, E7). O tipo é **funcional** (vender mais). O lado **emocional** ("não ser refém do marketplace",
"não jogar dinheiro fora de novo") é o candidato a decidir a compra, mas está **não medido**.

A frase concorrente, que sai do único contrato assinado: "quero **alguém que venda por mim** e só ganhe se vender". Na
Tapepro, o Jean vira representante comercial ([[project_roilabs_growth_partner]] na memória). É N=1, e a seção 8 decide
entre as duas frases.

## 3. Evidências

| # | Fonte | Número | Janela | Lido em | Nível |
|---|---|---|---|---|---|
| E1 | `roilabs_db.candidaturas` | **1 registro no total, e é teste** ("TESTE 027 - ignorar", 18/09). 0 candidatura real. `leads_consumidor`: 2 (B2C, não conta) | desde a criação da tabela (jun/2026)¹ | 30/09/2026 | 2 revelada |
| E2 | `roilabs_db` (`parceiros`, `faturas_success_fee`, `negocios_originados`, `pedidos`, `assinaturas`) | 1 parceiro (Tapepro, contrato 22/07, 15%/10%, **não veio do form**, fechado quando a entrada era R$ 0). 0 fatura, 0 negócio originado, 0 assinatura. Pedidos: 6 reais, todos `pendente` (R$ 22.091,89; fitas: 4, R$ 7.602,99). **Dinheiro recebido: R$ 0** | tudo | 30/09/2026 | 1 revelada |
| E3 | `roilabs_db` (`propostas_cadeira`, `contratos_cadeira`) | 1 proposta (29/09, cursos, cliente com relação anterior), **anuidade negociada de R$ 1.320/ano** contra R$ 3.960 no site. Contrato gerado, **não aceito**, validade 14/10 | 29/09 | 30/09/2026 | 1 pendente |
| E4 | GSC `sc-domain:roilabs.com.br`, filtrado ao host raiz | 327 impressões, 16 cliques. Das 91 impressões com consulta visível, **85 são a marca** (roilabs, roi lab, roi labs). Fora da marca: "pseo" 2, "seo programático" 1. Página mais vista: `/blog/marketplace-ou-canal-proprio-vender-porcelanato/` com **125 impressões**, acima da home (110) | 29/06–27/09/2026 | 30/09/2026 | 2 revelada |
| E5 | DataForSEO (Google Ads, Brasil), a categoria do site | **sem volume:** agência que cobra por resultado · agência de marketing por resultado · marketing por comissão · agência de marketing para indústria · marketing para fabricante. "seo programático" 30 · "growth partner" 170² · "terceirização de vendas" 110 (CPC R$ 9) · "equipe de vendas terceirizada" 90 · "procuro representante comercial" 20 | média mensal de 12m | 30/09/2026 | 2 revelada |
| E6 | DataForSEO (Brasil), o hábito | "como vender no mercado livre" **18.100** (12m: 18.100→22.200) · "vender no mercado livre" 5.400 (4.400→8.100) · "gestor de tráfego" 12.100 (18.100→8.100) · "agência de marketing digital" 6.600 (9.900→5.400) · "como vender pela internet" 3.600³ | média mensal de 12m | 30/09/2026 | 2 revelada |
| E7 | DataForSEO (Brasil), o empurrão do marketplace | "taxa do mercado livre" 1.600 (**1.000→2.400**) · "quanto o mercado livre cobra por venda" 1.000 (720→1.600) · "taxa shopee" 2.900 (1.600→3.600) | média mensal de 12m | 30/09/2026 | 2 revelada |
| E8 | DataForSEO (Brasil), o empurrão da agência | **sem volume:** agência de marketing não dá resultado · gestor de tráfego não dá resultado · quanto custa uma agência de marketing | média mensal de 12m | 30/09/2026 | 2 revelada (ausência) |
| E9 | GSC da cadeira Tapepro (`tapepro.` + `goiania…/fita*`) | 228 impressões, 3 cliques, posição ~24 (tapepro.) e ~10 (goiania). 0 pedido pago (E2) | 29/06–27/09/2026 | 30/09/2026 | 2 revelada |
| — | Reclamação ou pergunta do fornecedor (WhatsApp, motivo de recusa, conversa de outbound) | **não medido**: nenhum registro no banco nem no vault | — | — | 3/4 ausente |

¹ O `/admin` tem um botão para apagar candidatura, então alguma apagada antes de hoje não aparece aqui.
² Provavelmente é cargo (vaga de emprego), não serviço.
³ "como vender pela internet" e "como vender na internet" dão o mesmo 3.600: é variante, e não se soma. As duas incluem pessoa física e afiliado.

**Critério da skill:** o diagnóstico do que **não** funciona tem 2 tipos (dinheiro e comportamento), ambos revelados, e
passa. O desejo positivo (seção 2) não tem evidência declarada e fica como hipótese.

## 4. As 4 forças

| Força | Leitura | Evidência |
|---|---|---|
| **Empurrão** | A taxa do marketplace dói e dói cada vez mais: a busca por ela dobrou em 12 meses. A frustração com agência não aparece | E7 (medido, com pessoa física misturada) · E8 (ausente) |
| **Atração** | "Sem setup, sem mídia, só paga se vender", mais exclusividade. **Não testada, e não refutada**: nenhum comprador chegou ao site para reagir a ela | E1 + E4 (sem tráfego do ICP) |
| **Ansiedade** | "Vai funcionar?" (a prova é da casa, e a Tapepro ainda não tem venda paga) · 3–6 meses de "travessia do deserto" (FAQ) · anuidade paga **antes** de qualquer resultado · compromisso de 1 ano com SLA de estoque | E9 · E3: o próprio vendedor deu 67% de desconto no primeiro contato real, e esse é o sinal mais forte de que o preço cheio assusta |
| **Hábito** | Mercado Livre/Shopee (volume alto e crescendo), gestor de tráfego/agência, representante comercial | E6 |

Leitura: a atração nunca foi testada porque o comprador não chega. O que se mediu é **ansiedade alta**, com preço
antecipado, prova fraca e prazo longo, contra um **hábito forte** (o marketplace), que também só cobra quando vende.

## 5. Consciência e sofisticação

- **Consciência:** o comprador **sabe que tem a dor** ("vender pela internet") e conhece **tipos de solução**:
  marketplace, gestor de tráfego, agência, representante. A categoria "Growth Partner / cadeira / SEO programático" ele
  **não sabe que existe** (busca ~0). Uma página que lidera com o mecanismo ("centenas de páginas de alta intenção") fala
  com um nível de consciência que o comprador não tem.
- **Sofisticação:** alta contra agência e tráfego (6.600 e 12.100 buscas, CPC de R$ 4–6,50, concorrência alta).
  "Cobra por resultado" já é promessa gasta de agência de performance ("marketing de performance" caiu de 880 para 390).
- **Onde o site é lido hoje:** por quem **já foi abordado** no outbound e procura a marca (E4: 85 de 91 impressões
  visíveis). Esse leitor sabe que a ROI Labs existe e quer **prova e diferença**, não educação sobre SEO.

## 6. Matriz melhor × desejado

A comparação é contra a alternativa que o fornecedor usa hoje (marketplace, representante, agência), e não contra o
concorrente que o time admira.

| | Somos melhores | Somos piores ou iguais |
|---|---|---|
| **Desejado** (com evidência) | **Canal próprio: o cliente é do fornecedor, sem taxa de marketplace** (E7, E4: o artigo marketplace × canal próprio é a página mais vista). Liderar com isso **depois** de confirmar (seção 8) | **Prova de resultado de fornecedor** (E9: nenhuma venda paga de cliente externo; a prova da home é da casa). **"Só paga se vender"** contra marketplace e representante: os dois também só cobram na venda e não têm anuidade. **Tempo até o resultado:** 3–6 meses. Consertar primeiro |
| **Não desejado** (sem evidência) | SEO programático · "centenas de páginas" · "domina a busca do setor" · mapa de cadeiras e exclusividade (E5: 30 buscas ou menos). Parar de liderar com isso | "Não somos agência": o comprador não está se queixando de agência (E8). Ignorar |

A célula "melhores, não desejado" concentra o que a home destaca hoje: o manifesto, a mecânica, o mapa de cadeiras e os
3 gates. É onde está o orgulho do time.

## 7. Decisão

**Veredito (a evidência passa):**
1. **O site não é canal de aquisição do fornecedor agora.** Mudar a copy não traz candidatura enquanto não houver tráfego
   do ICP (E1, E4, E5). O canal que fechou os dois negócios reais é o relacionamento e o outbound. **O trabalho do site é
   ser a página de prova para quem já foi abordado.**
2. **Não mexer no preço público de novo antes de um contrato aceito.** Foram duas altas em 5 dias sem uma venda no meio,
   e a proposta real saiu a um terço dele (E3). O aceite ou a recusa da proposta de 29/09 é a primeira evidência de preço.
3. **Consertar a prova antes de consertar a promessa.** A primeira venda paga da Tapepro (4 pedidos pendentes) é o
   número que falta na home: "fornecedor X vendeu R$ Y pelo canal". Enquanto não houver esse número, a prova da home é de
   projeto da casa. Se um prospect perguntar se a Use Aligner paga a cadeira, a resposta enfraquece a confiança.

**Modo recomendado: reposicionar uma peça por vez, começando pelo quadro de referência** (contra quem compete).

- Hoje: contra **agência** (manifesto, "sem fee de agência", "não é pra você se procura agência de mídia paga").
- Candidatos:
  - **(a) Contra o marketplace:** "um canal de venda só seu, sem a taxa do marketplace". Tem empurrão medido e crescente (E7) e a única tração orgânica do site (E4).
  - **(b) Contra o representante comercial:** "uma equipe que vende por você, com site". Tem o único contrato assinado (Tapepro) e busca pequena com CPC alto (E5).
- A decisão entre (a) e (b) sai da medição da seção 8, e **não** da copy.

**Parar:** abrir a home com o mecanismo (SEO programático, "centenas de páginas") e com a escassez (mapa de cadeiras); e
escrever artigo para termos de busca zero como jogada de aquisição ("agência que cobra por resultado").

**Promessa em 1 frase para a `conversion-copy`:** só depois da seção 8. A versão para o candidato (a) seria esta, e o
texto precisa continuar verdadeiro com a anuidade:

> "Um canal de venda online só seu, com equipe que atende e fecha por você. A ROI Labs banca a construção e ganha uma parte de cada venda."

## 8. Critério de confirmação

| # | O que decide | Número | Fonte | Até |
|---|---|---|---|---|
| C1 | Preço de entrada | contrato da proposta de 29/09 **aceito** (a R$ 1.320). Aceito: primeira evidência de nível 1. Recusado ou expirado: registrar o motivo (nível 3). R$ 3.960 segue sem evidência até um aceite a esse valor | `contratos_cadeira.aceito_em` | 14/10/2026 |
| C2 | Quadro de referência: (a) × (b) | nas próximas **10 conversas de outbound**, perguntar e anotar a resposta literal de "onde você vende online hoje?" e "o que já tentou que não deu certo?". **(a) confirma** se ≥5/10 citarem marketplace ou taxa; **(b) confirma** se ≥5/10 citarem vendedor ou representante; nenhum dos dois: seguem hipóteses, e a peça não muda | tabela neste vault (`10-mercado/`) | 31/10/2026 |
| C3 | Prova | 1º pedido de fita **pago**, que gera o 1º `negocios_originados` e a 1ª fatura de success fee | `pedidos.status_pagamento`, `faturas_success_fee` | checkpoint em 31/10/2026 |
| C4 | Reposicionamento funcionou | se C2 confirmar um lado, reescrever **só** o quadro de referência da home e medir candidaturas reais e consultas fora da marca por 60 dias | `candidaturas`, GSC | 60 dias após a troca |

**Hipóteses que já caíram**
- "O blog GEO/SEO atrai o fornecedor" (jun/2026): 3 meses, 0 candidatura real, 85 de 91 impressões visíveis são a marca (E1, E4).
- "Agência que cobra por resultado" como termo de captação: busca zero (E5).
- "A frustração com agência empurra o fornecedor": nenhuma busca de queixa (E8). Fica como não medida até aparecer em conversa (C2).

**Fora deste diagnóstico:** Autogestor, Coopluz e Viagens aparecem como "Cadeiras de clientes" na home desde 28/09, mas
não têm registro em `parceiros`. Não dá para dizer, pelo banco, se são contratos.
