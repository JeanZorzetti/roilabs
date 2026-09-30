---
tipo: análise
status: recomendação (melhorar agora; reposicionar só se C2 confirmar em 31/10)
data: 2026-09-30
dono: Jean
---

# roilabs.com.br: Mapa de Desejo da cadeira (diagnóstico, 30/09/2026)

Diagnóstico do posicionamento **no ar hoje** em `roilabs.com.br` (home + `/modelo`, versão de 29/09) contra a evidência
disponível. Método: skill `desire-positioning`. Um veredito exige **3 evidências de 2 tipos, com pelo menos 1 revelada**, e o
que não tem evidência sai como hipótese com plano de medição. Relaciona-se com [[oferta]], [[mercado]] e
[[nimblabs-mapa-de-desejo-2026-09-29]] (mesmo método).

> **Revisado em 30/09, tarde**, com dado do Jean: as 2 vendas da TapePro por WhatsApp (E10), os 4 clientes da época sem
> anuidade (E11), e os 4 pedidos pendentes de fita, que eram teste interno e não pedidos reais (E2).

**Resumo em 7 linhas**
1. **O site não capta o comprador.** Em 3 meses: 0 candidaturas reais (a única no banco é um teste), 0 consulta de
   comprador no GSC, e a categoria com que o site se apresenta ("agência que cobra por resultado", "marketing por
   comissão") tem busca zero. Nenhum dos 4 clientes nem a proposta de 29/09 veio do formulário do site.
2. **O preço público não tem prova.** Os **4 clientes que existem** (TapePro, Autogestor, Coopluz, Viagens) entraram com
   **anuidade zero**. Depois disso o preço foi para R$ 2.640 (24/09) e R$ 3.960 (29/09), sem nenhum cliente no meio. A
   única proposta a preço pago, de 29/09, saiu com anuidade de **R$ 1.320**, um terço do preço público.
3. **A cadeira já vende, e a venda passa pelo WhatsApp.** Na TapePro, 3 pessoas chamaram no WhatsApp e 2 compraram
   (R$ 387,80 em 07/09 e R$ 409,80 em 28/09). A primeira venda saiu 47 dias depois do contrato, não nos "3–6 meses" do FAQ.
   O carrinho de fitas teve **0 pedido real**. Isso prova que a cadeira **entrega** para o fornecedor, mas não prova que o
   fornecedor **deseja** a oferta: são compradores diferentes (seção 3, E10).
4. **O site compete contra a alternativa errada.** Ele se define contra "agência", mas a frustração com agência não
   aparece na busca. O hábito que tem volume, e que cresce, é o **marketplace**: "como vender no mercado livre" tem 18.100
   buscas/mês, e "taxa do mercado livre" foi de 1.000 para 2.400 em 12 meses. A página com mais impressões do site
   inteiro é o artigo "marketplace ou canal próprio".
5. **O site lidera com o que o time faz melhor e o comprador não procura:** SEO programático, "centenas de páginas" e o
   mapa de cadeiras/exclusividade. Nenhum desses termos tem busca.
6. **A prova existe, mas está fora da página e fora do sistema.** A home mostra o resultado da Use Aligner, que é cadeira
   da casa (`daCasa: true`). As 2 vendas da TapePro, que são a prova de um fornecedor externo, não aparecem na home. Elas
   vieram do botão de WhatsApp do site da cadeira e foram registradas no `/app` em 30/09 como negócios originados.
7. **Modo indicado: reposicionar UMA peça, o quadro de referência** (contra quem compete: agência → marketplace ou
   representante). Hoje isso é hipótese, mas o lado (b), "equipe que vende por você", ganhou o primeiro apoio revelado:
   quem compra fita fechou falando com gente, e não no carrinho. O plano de medição (seção 8) decide até 31/10, com as
   conversas do outbound, e não com mudança de copy.

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

A frase concorrente, que sai do contrato da TapePro: "quero **alguém que venda por mim** e só ganhe se vender". Na
TapePro, o Jean vira representante comercial ([[project_roilabs_growth_partner]] na memória), e as 2 vendas saíram assim:
pelo WhatsApp, com ele fechando (E10). Do lado do fornecedor ainda é N=1, e a seção 8 decide entre as duas frases.

## 3. Evidências

| # | Fonte | Número | Janela | Lido em | Nível |
|---|---|---|---|---|---|
| E1 | `roilabs_db.candidaturas` | **1 registro no total, e é teste** ("TESTE 027 - ignorar", 18/09). 0 candidatura real. `leads_consumidor`: 2 (B2C, não conta) | desde a criação da tabela (jun/2026)¹ | 30/09/2026 | 2 revelada |
| E2 | `roilabs_db` (`parceiros`, `faturas_success_fee`, `negocios_originados`, `pedidos`, `assinaturas`) | 1 parceiro cadastrado (TapePro, contrato 22/07, 15%/10%, **não veio do form**). 0 fatura, 0 negócio originado, 0 assinatura. Pedidos de fita: 4 `pendente`, **todos teste interno** (23/07, 34 minutos, 1 comprador, e-mail da casa, 3 CEPs: o dia em que o frete foi ligado). Porcelanato: 2 `pendente`, não conferidos. **Dinheiro que a ROI Labs recebeu: R$ 0** | tudo | 30/09/2026 | 1 revelada |
| E3 | `roilabs_db` (`propostas_cadeira`, `contratos_cadeira`) | 1 proposta (29/09, cursos, cliente com relação anterior), **anuidade negociada de R$ 1.320/ano** contra R$ 3.960 no site. Contrato gerado, **não aceito**, validade 14/10 | 29/09 | 30/09/2026 | 1 pendente |
| E4 | GSC `sc-domain:roilabs.com.br`, filtrado ao host raiz | 327 impressões, 16 cliques. Das 91 impressões com consulta visível, **85 são a marca** (roilabs, roi lab, roi labs). Fora da marca: "pseo" 2, "seo programático" 1. Página mais vista: `/blog/marketplace-ou-canal-proprio-vender-porcelanato/` com **125 impressões**, acima da home (110) | 29/06–27/09/2026 | 30/09/2026 | 2 revelada |
| E5 | DataForSEO (Google Ads, Brasil), a categoria do site | **sem volume:** agência que cobra por resultado · agência de marketing por resultado · marketing por comissão · agência de marketing para indústria · marketing para fabricante. "seo programático" 30 · "growth partner" 170² · "terceirização de vendas" 110 (CPC R$ 9) · "equipe de vendas terceirizada" 90 · "procuro representante comercial" 20 | média mensal de 12m | 30/09/2026 | 2 revelada |
| E6 | DataForSEO (Brasil), o hábito | "como vender no mercado livre" **18.100** (12m: 18.100→22.200) · "vender no mercado livre" 5.400 (4.400→8.100) · "gestor de tráfego" 12.100 (18.100→8.100) · "agência de marketing digital" 6.600 (9.900→5.400) · "como vender pela internet" 3.600³ | média mensal de 12m | 30/09/2026 | 2 revelada |
| E7 | DataForSEO (Brasil), o empurrão do marketplace | "taxa do mercado livre" 1.600 (**1.000→2.400**) · "quanto o mercado livre cobra por venda" 1.000 (720→1.600) · "taxa shopee" 2.900 (1.600→3.600) | média mensal de 12m | 30/09/2026 | 2 revelada |
| E8 | DataForSEO (Brasil), o empurrão da agência | **sem volume:** agência de marketing não dá resultado · gestor de tráfego não dá resultado · quanto custa uma agência de marketing | média mensal de 12m | 30/09/2026 | 2 revelada (ausência) |
| E9 | GSC da cadeira TapePro (`tapepro.` + `goiania…/fita*`) | 228 impressões, 3 cliques, posição ~24 (tapepro.) e ~10 (goiania). 0 pedido real no carrinho (E2) | 29/06–27/09/2026 | 30/09/2026 | 2 revelada |
| E10 | Sistema de orçamentos da TapePro (print do Jean) | **3 contatos no WhatsApp → 2 vendas** (vendedor: Jean): empresa de impressão 3D, R$ 387,80 (07/09); clínica de odontologia e cosméticos, R$ 409,80 (28/09). Total **R$ 797,60**, os dois B2B, **só produto** (sem frete). Contrato em 22/07 e 1ª venda **47 dias** depois. **Origem dos 3 contatos:** o botão "Pedir orçamento no WhatsApp" do hero de `tapepro.roilabs.com.br`, o site que a ROI Labs construiu (Jean, 30/09). **Como o visitante chegou ao site: não medido**, porque o site não tem GA, Clarity nem evento de clique, e o GSC do `tapepro.` registrou só 2 cliques em 90 dias | 22/07–28/09/2026 | 30/09/2026 | 1 revelada, do **comprador de fita**, não do fornecedor |
| E11 | Jean, 30/09 | TapePro, Autogestor, Coopluz e Viagens: **4 clientes, todos fechados quando a anuidade era zero**. Nenhum cliente fechou pagando anuidade | até 30/09/2026 | 30/09/2026 | 1 revelada (registro do dono) |
| — | Reclamação ou pergunta do fornecedor (WhatsApp, motivo de recusa, conversa de outbound) | **não medido**: nenhum registro no banco nem no vault | — | — | 3/4 ausente |

¹ O `/admin` tem um botão para apagar candidatura, então alguma apagada antes de hoje não aparece aqui.
² Provavelmente é cargo (vaga de emprego), não serviço.
³ "como vender pela internet" e "como vender na internet" dão o mesmo 3.600: é variante, e não se soma. As duas incluem pessoa física e afiliado.

**Critério da skill:** o diagnóstico do que **não** funciona tem 2 tipos (dinheiro e comportamento), ambos revelados, e
passa. O desejo positivo do **fornecedor** (seção 2) não tem evidência declarada e fica como hipótese.

**Dois compradores, duas perguntas.** E10 fala do **comprador de fita**: ele deseja fita personalizada e fechou falando
com gente (2 de 3 no WhatsApp, 0 no carrinho). Isso responde "a cadeira entrega?", e a resposta é sim, com número pequeno.
Não responde "o fornecedor quer comprar a cadeira?", que é a pergunta do posicionamento do roilabs.com.br. Para o
fornecedor, E10 entra como **prova** (a alavanca de probabilidade da seção 6), e não como desejo.

## 4. As 4 forças

| Força | Leitura | Evidência |
|---|---|---|
| **Empurrão** | A taxa do marketplace dói e dói cada vez mais: a busca por ela dobrou em 12 meses. A frustração com agência não aparece | E7 (medido, com pessoa física misturada) · E8 (ausente) |
| **Atração** | "Sem setup, sem mídia, só paga se vender", mais exclusividade. **Não testada, e não refutada**: nenhum comprador chegou ao site para reagir a ela | E1 + E4 (sem tráfego do ICP) |
| **Ansiedade** | "Vai funcionar?" (a home mostra prova da casa, e as vendas da TapePro não aparecem) · 3–6 meses de "travessia do deserto" (FAQ), quando a TapePro vendeu em 47 dias · anuidade paga **antes** de qualquer resultado · compromisso de 1 ano com SLA de estoque | E3: o próprio vendedor deu 67% de desconto no primeiro contato real · E11: os 4 clientes entraram sem anuidade. São os sinais mais fortes de que o preço cheio assusta |
| **Hábito** | Mercado Livre/Shopee (volume alto e crescendo), gestor de tráfego/agência, representante comercial | E6 |

Leitura: a atração nunca foi testada no site porque o fornecedor não chega a ele. O que se mediu é **ansiedade alta**
(preço antecipado, prova escondida, prazo prometido longo) contra um **hábito forte** (o marketplace), que também só cobra
quando vende. As duas primeiras ansiedades têm conserto barato, porque o dado já existe (E10).

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
| **Desejado** (com evidência) | **Canal próprio: o cliente é do fornecedor, sem taxa de marketplace** (E7, E4: o artigo marketplace × canal próprio é a página mais vista). Liderar com isso **depois** de confirmar (seção 8). **Equipe que atende e fecha no WhatsApp:** o comprador de fita fechou assim, 2 de 3, e 0 no carrinho (E10). Contra o marketplace e o carrinho, que são autoatendimento, é melhor. Se é desejo do **fornecedor** ainda falta confirmar (C2, lado b) | **Prova na página:** o resultado da TapePro existe (E10) e a home mostra o da casa. **"Só paga se vender"** contra marketplace e representante: os dois também só cobram na venda e não têm anuidade. **Tempo prometido:** o FAQ diz 3–6 meses, e o caso real vendeu em 47 dias. Consertar primeiro |
| **Não desejado** (sem evidência) | SEO programático · "centenas de páginas" · "domina a busca do setor" · mapa de cadeiras e exclusividade (E5: 30 buscas ou menos). Parar de liderar com isso | "Não somos agência": o comprador não está se queixando de agência (E8). Ignorar |

A célula "melhores, não desejado" concentra o que a home destaca hoje: o manifesto, a mecânica, o mapa de cadeiras e os
3 gates. É onde está o orgulho do time.

## 7. Decisão

**Veredito (a evidência passa):**
1. **O site não é canal de aquisição do fornecedor agora.** Mudar a copy não traz candidatura enquanto não houver tráfego
   do ICP (E1, E4, E5). Nenhum dos 4 clientes nem a proposta de 29/09 veio do formulário. **O trabalho do site é ser a
   página de prova para quem já foi abordado.**
2. **Não mexer no preço público de novo antes de um contrato aceito.** Os 4 clientes entraram com anuidade zero (E11), o
   preço subiu duas vezes em 5 dias sem cliente no meio, e a proposta real saiu a um terço dele (E3). O aceite ou a recusa
   da proposta de 29/09 é a primeira evidência de preço pago.
3. **Mostrar a prova que já existe antes de mudar a promessa.** "Fornecedor de fita: 1ª venda em 47 dias, 2 vendas
   fechadas pela equipe no WhatsApp" é o número que falta na home, e ele é de cliente externo. Três cuidados:
   - só publicar com autorização da TapePro;
   - dar o número como ele é (pequeno), sem arredondar para cima;
   - a origem já está respondida: os 3 contatos vieram do botão de WhatsApp do site que a ROI Labs construiu, então a prova é **da cadeira** (site + equipe que fecha). O que ainda não se sabe é como o visitante chegou ao site (Google, direto, Instagram), e isso decide se dá para dizer "veio do SEO".
   O FAQ que promete "3–6 meses" passa a ser a ansiedade mais barata de reduzir, porque o caso real foi mais rápido.

**Modo recomendado: reposicionar uma peça por vez, começando pelo quadro de referência** (contra quem compete).

- Hoje: contra **agência** (manifesto, "sem fee de agência", "não é pra você se procura agência de mídia paga").
- Candidatos:
  - **(a) Contra o marketplace:** "um canal de venda só seu, sem a taxa do marketplace". Tem empurrão medido e crescente (E7) e a única tração orgânica do site (E4).
  - **(b) Contra o representante comercial:** "uma equipe que vende por você, com site". Tem o contrato da TapePro, as 2 vendas fechadas no WhatsApp (E10) e busca pequena com CPC alto (E5).
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
| C3 | Prova | ✅ **atingido:** 1ª venda da TapePro em 07/09 (E10), vinda do botão de WhatsApp do site da cadeira. ✅ **Registrado em 30/09:** as 2 vendas são negócios originados no `/app`, com origem `manual` (nova, commit `0093ed7`): aquisição a 15%, comissão de R$ 119,64, sem fatura emitida. Falta medir como o visitante chega ao site da TapePro | `negocios_originados` + medição no site | medição: a decidir |
| C4 | Reposicionamento funcionou | se C2 confirmar um lado, reescrever **só** o quadro de referência da home e medir candidaturas reais e consultas fora da marca por 60 dias | `candidaturas`, GSC | 60 dias após a troca |

**Hipóteses que já caíram**
- "O blog GEO/SEO atrai o fornecedor" (jun/2026): 3 meses, 0 candidatura real, 85 de 91 impressões visíveis são a marca (E1, E4).
- "Agência que cobra por resultado" como termo de captação: busca zero (E5).
- "A frustração com agência empurra o fornecedor": nenhuma busca de queixa (E8). Fica como não medida até aparecer em conversa (C2).
- "No B2B de fita, o comprador fecha no carrinho": 0 pedido real no carrinho e 2 vendas no WhatsApp (E2, E10).
- "SEO leva 3–6 meses até a 1ª venda" (FAQ): a TapePro vendeu em 47 dias (E10). O número ainda é de um caso só.

**Cadastro (feito em 30/09):** Autogestor, Coopluz e Viagens são clientes da época sem anuidade, como a TapePro (Jean,
30/09). Foram criadas as 3 cadeiras (e a da Vértice Marketing, que também faltava) pelo seed, e depois os 3 `parceiros`,
com contrato em 01/09/2026. A comissão foi negociada antes da tabela: Coopluz 50% na 1ª compra e 2% na recompra;
Autogestor e Autogestor Viagens 15%/10%. Os três estão `ativa` **sem CNPJ**, por exceção nomeada no PATCH de
`api/parceiros/[id]` (commit `0093ed7`). A emissão de fatura (`api/faturas`) continua exigindo CNPJ: sem ele não sai cobrança.

## 9. Diagnóstico final e recomendação (30/09/2026)

### Diagnóstico em 5 frases
1. **A cadeira entrega.** O site da TapePro gerou 3 contatos pelo botão de WhatsApp, e a equipe fechou 2 vendas em 47 dias (E10).
2. **A ROI Labs não recebe.** Receita = R$ 0. As vendas acontecem no WhatsApp, e até hoje o `/app` só registrava venda de
   carrinho ou de gateway. Os 3 parceiros novos não têm CNPJ, então não dá para faturar deles. A parte variável do modelo não tinha por onde entrar.
3. **Ninguém pagou pela cadeira.** Os 4 clientes entraram com anuidade zero (E11). O preço público de R$ 3.960 não tem
   aceite, e a única proposta a preço pago saiu a R$ 1.320 (E3).
4. **O site não é canal de aquisição; é a página que o prospect abordado lê.** São 0 candidatura real e 85 de 91 impressões
   buscando a marca (E1, E4). Esse leitor já sabe que a ROI Labs existe e precisa de **prova e diferença**.
5. **O site descreve um comprador que quase não assina.** O teste dos 3 gates pede estoque, despacho e pronta-entrega. De 5
   negócios reais, 4 são **serviço**: Autogestor (seguros e crédito), Coopluz (conta de luz), Autogestor Viagens e a
   proposta de cursos. Só a TapePro tem estoque. O filtro escrito reprova quem de fato fecha.

### Recomendação: MELHORAR agora. Reposicionar não, ainda

- **Por que não reposicionar agora:** as duas posições candidatas, (a) contra o marketplace e (b) contra o representante,
  não têm nenhuma evidência declarada do **fornecedor** (seção 3). E10 é evidência do comprador de fita. A regra da skill é
  que a posição nova também precisa de demanda comprovada. Além disso, o site não recebe o comprador (E1, E4), então uma
  posição nova publicada nele não seria testada por ninguém.
- **Por que melhorar:** cada item abaixo tem evidência revelada e mexe na equação de valor (probabilidade, tempo e risco)
  para o leitor que o site realmente tem. Nenhum deles troca o quadro de referência, então quando C2 decidir a
  reposição, ela será **a única peça** que muda.

| Ordem | Melhoria | Evidência | Alavanca | Custo |
|---|---|---|---|---|
| 0 | **Piso do dinheiro: registrar venda manual pelo `/admin`** (hoje só por script) **e emitir a 1ª fatura da TapePro** (R$ 119,64). A fatura paga é a primeira evidência de nível 1 de que o fornecedor paga o success fee, e é o desejo do modelo inteiro | E10, E2 · os 2 negócios `manual` de 30/09 | dinheiro (piso) | form no `/admin`; fatura = 1 clique |
| 1 | **Prova na home:** o caso TapePro (3 contatos → 2 vendas, 1ª em 47 dias), **com autorização da TapePro**, ao lado ou no lugar do readout da Use Aligner, que é da casa | E10 · Use Aligner `daCasa: true` | probabilidade | copy + 1 bloco |
| 2 | **FAQ do prazo:** trocar a espera genérica de "3–6 meses" pelo caso real, dito como caso e não como promessa | E10 | tempo | 1 parágrafo |
| 3 | **Gates do comprador:** tirar estoque, despacho e pronta-entrega como condição. Pedir capacidade de **atender** o volume, seja produto ou serviço | 4 de 5 negócios são serviço | remove o filtro que reprova o comprador real | teste de 4 perguntas + FAQ "Preciso de quanto estoque?" |
| 4 | **Ordem da home:** subir "site + equipe que atende e fecha no WhatsApp"; descer SEO programático, "centenas de páginas" e mapa/exclusividade, sem apagar | E5 (mecanismo sem busca) · E10 (fechamento humano: 2 de 3; carrinho: 0) | probabilidade, e para de liderar com "melhores × não desejado" | reordenar seções |
| 5 | **Medição:** a página de origem na mensagem pronta do botão de WhatsApp da TapePro; e a tabela das 10 conversas de outbound (C2) | E10 (origem do visitante não medida) | é o que decide C2 e a próxima rodada | 1 linha por botão + 1 nota |
| — | **Preço: congelado até C1 (14/10).** Não subir nem baixar o público. Mudança de anuidade, renovação ou garantia passa antes pela `saas-legal` | E3, E11 | risco | zero |

**Estado em 30/09, noite** (pedido do Jean: 0 crie · 1 coloque, TapePro autorizou · 2 troque · 3 não entendi · 4 suba · 5 inclua):

| # | Estado | Onde |
|---|---|---|
| 0 | ✅ Tela `/admin/vendas`: registra a venda fechada fora do site, lista as vendas por parceiro e gera a fatura com confirmação (a de 28/09 tinha apagado a tela de parceiros). ⏳ **A fatura de R$ 119,64 da TapePro não foi emitida**: é um clique do Jean (C0) | `198c7f0` |
| 1 | ✅ Seção `#caso` logo depois de "como funciona": 3 contatos → 2 vendas → 47 dias, com fonte e link. Sem valor em R$ (a autorização foi do caso) | `a4b1cdb` |
| 2 | ✅ FAQ "Quanto tempo até as vendas?" cita o caso, "é um caso, não uma promessa". O `/modelo` segue com "3 a 6 meses até o volume orgânico estabilizar", que é outra afirmação e continua verdadeira | `a4b1cdb` |
| 3 | ✅ Aprovado pelo Jean. "Estoque e despacho" saiu como condição: o teste agora pergunta "produto ou serviço próprio" e "atender mais pedidos ou clientes sem atrasar"; o SLA virou "de atendimento e entrega" na home, `/modelo`, `/simulador`, `llms.txt` e na lista "o parceiro sustenta" das propostas. O contrato não foi tocado (só pede "preço, estoque, prazo" como informação) | ver commit abaixo |
| 4 | ✅ Hero e passo 02 abrem com o site e a equipe que fecha no WhatsApp; SEO programático virou frase de apoio; demanda e mapa de cadeiras desceram para depois dos gates | `a4b1cdb` |
| 5 | ✅ A página de origem **já ia** na mensagem ("Vim pelo site da TapePro (Home)"). O que faltava era de onde a pessoa veio: agora a mensagem termina com "Achei vocês pelo Google." (utm_source ou referrer da 1ª página da visita; acesso direto não acrescenta nada) | TapePro `83653df` |

**Promessa para a `conversion-copy`** (melhoria, mesmo quadro de hoje). Só com a autorização da TapePro, e o número é de um caso só:

> "A ROI Labs constrói o seu site de vendas, e a nossa equipe atende o cliente no WhatsApp até fechar. O primeiro fornecedor vendeu em 47 dias."

### Quando reposicionar
Em **31/10**, com C2. Se 5 ou mais de 10 fornecedores abordados citarem **marketplace ou taxa**, o quadro vira (a); se
citarem **vendedor ou representante**, vira (b). Com a melhoria 4 já no ar, (b) exige pouca reescrita. Sem maioria, o
quadro fica como está e a próxima leitura é com 10 conversas a mais.

### Critérios desta recomendação

| # | Número | Fonte | Até |
|---|---|---|---|
| C0 | 1ª fatura da TapePro **emitida e paga** (R$ 119,64). Paga: o fornecedor aceita o success fee (nível 1). Recusada ou atrasada: registrar o motivo (nível 3) | `faturas_success_fee.status` + Asaas | emitida até 05/10; paga até 15/10 |
| C1 | contrato da proposta de 29/09 aceito | `contratos_cadeira.aceito_em` | 14/10 |
| C2 | 10 conversas de outbound anotadas; maioria define (a) × (b) | tabela em `10-mercado/` | 31/10 |
| C5 | com as melhorias 1–4 no ar, nas próximas propostas: o prospect leu o site antes? citou o caso? A proposta foi aceita? | anotação por proposta | contínuo |
