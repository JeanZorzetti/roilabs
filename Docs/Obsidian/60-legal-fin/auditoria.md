---
tipo: auditoria
status: vivo
data: 2026-06-28
escopo: crivo crítico de 60-legal-fin (não-jurídico, baseado em pesquisa)
audita:
  - "[[legal-fin]]"
  - "[[projecao-financeira]]"
  - "[[contrato-quadro]]"
  - "[[anexo-A-intermediacao]]"
  - "[[anexo-B-white-label]]"
---

# Auditoria — `60-legal-fin`

> Sessão de **pressionar as apostas**, não de criar. Cada achado: o buraco, por quê, e o que fazer. Ranqueado por severidade. Fontes ao final. **Não substitui contador/advogado** — afia o que levar a eles.

## Aplicação das correções (2026-06-28)

Tudo que era corrigível **nos docs** foi aplicado. O que depende de terceiro ficou **flagado**, não inventado.

| Achado | Aplicado | Onde |
|---|---|---|
| M1 ref. stale Cl.8→7 | ✅ | [[legal-fin]] |
| M2 WL com Presumido num mundo Simples | ✅ | [[projecao-financeira]] (tabela WL recalc. Anexo I) |
| M3 take rate 30%→33% | ✅ | [[anexo-A-intermediacao]] A.2.4 |
| M4 faixa do Conservador | ✅ | [[projecao-financeira]] (nota sob a tabela) |
| M5 breakeven +12%→+13–15% | ✅ | [[projecao-financeira]] |
| C1 Reforma (validade temporal) | ✅ | [[legal-fin]] (nova seção), [[projecao-financeira]] (callout), [[contrato-quadro]] (checklist) |
| C2 furos do excedente | ✅ | [[legal-fin]] (risco ampliado) |
| C3 comparação sistêmica | ✅ | [[projecao-financeira]] (linha imposto do Fornecedor + sistema) |
| A1 paridade → narrow MFN (CADE) | ✅ | [[contrato-quadro]] Cl. 7 |
| A3 ICMS-ST transitório | ✅ | [[anexo-B-white-label]] B.4.3, [[legal-fin]] |
| F cláusulas faltantes | ✅ | [[contrato-quadro]] Cl. 16–22 + 8.3 (Disposições gerais → Cl. 23) |
| B.6 frete reverso WL `[definir]` | ✅ → Fornecedor | [[anexo-B-white-label]] B.6/B.8.2 |

**Não aplicável (precisa de terceiro, segue flagado):** pauta IVA-ST do 6907 na SEFAZ-GO; solução de consulta do caso *exato* spread-retido; fatia de ICMS por faixa do Anexo I; mix B2B/B2C real; números finais do contador; revisão/assinatura do advogado.

## Veredito em 1 tela

| # | Achado | Severidade | Status da aposta |
|---|---|---|---|
| C1 | **A análise está sobre o sistema que está morrendo.** Reforma (IBS/CBS, LC 214/2025) já corre em 2026 e muda marketplace, split payment e Simples. | 🔴 CRÍTICO | aposta **incompleta no tempo** |
| C2 | **"Excedente = serviço" tem dois furos:** a NFS-e do excedente *contra o fornecedor* é o seam de re-caracterização (SC 5007/2025 mostra fisco fechando), e o excedente é **bitributado**. | 🔴 CRÍTICO | aposta **frágil no pilar** |
| C3 | **A projeção compara P&L da ROI Labs, não o sistema.** Ignora o imposto que o **fornecedor** paga sobre a NF cheia (que carrega o spread da ROI Labs). O "R$1.140/venda" encolhe. | 🔴 CRÍTICO | conclusão **certa, mas inflada** |
| A1 | Paridade (Cl. 7) é mais larga que o *safe harbor* do CADE (caso Booking/Decolar). | 🟠 ALTO | corrigível |
| A2 | Se WL vira regra (tensão do founder), o **teto do Simples vira problema de curto prazo**, não watch-point distante. | 🟠 ALTO | revisar regime/framing |
| A3 | ICMS-ST 6907 segue vivo, mas a Reforma **extingue o ICMS-ST** na transição — a precificação WL tem prazo de validade. | 🟠 ALTO | confirmar + datar |
| M1–M5 | Consistência interna: ref. de cláusula stale, mistura de regime na comparação WL, take rate rotulado errado, faixa do Conservador, breakeven otimista. | 🟡 MÉDIO | ajustes pontuais |
| F | Minuta enxuta: faltam ~7 cláusulas padrão. | 🟡 MÉDIO | completar antes do advogado |

---

## 🔴 C1 — A Reforma Tributária não é "fora de escopo", é o chão mudando agora

Toda [[legal-fin]] e [[projecao-financeira]] modela **ICMS/ISS/PIS/COFINS/Simples**. Em 2026 já roda a fase-teste de **CBS/IBS** (LC 214/2025), e três peças batem direto na tese:

1. **Plataforma vira "deemed supplier" (arts. 21–23, LC 214/2025).** A plataforma responde por IBS/CBS quando **controla** um elemento essencial: pagamento, preço, termos **ou** entrega. A ROI Labs controla **preço** (define o varejo), **pagamento** (split Asaas) e **termos** — é o retrato do deemed supplier. Sob IBS/CBS isso tende a **puxar a base para a operação inteira**, não só a comissão. A blindagem ("intermediário, não vendedor") é mais fraca no sistema novo do que no atual.
2. **Split payment deixa de ser conveniência e vira mecanismo legal de arrecadação.** O que hoje é só plumbing do Asaas (Cl. 8) passa a ser **obrigação fiscal**: a plataforma que inicia o pagamento segrega e recolhe IBS/CBS na liquidação. *Lado bom:* cumprindo reporte + split, a plataforma **não responde** por diferença do fornecedor (proteção do art. 22). Isso **legitima** a arquitetura de split — mas como dever, com formato definido por lei, não pelo gateway.
3. **Simples + Reforma: decisão irreversível em setembro/2026.** Optante do Simples que **não** opta pelo "regime regular híbrido" (recolher IBS/CBS por fora do DAS) **não gera crédito** de IBS/CBS para o comprador (LC 214/2025, art. 47, §9º). Para um hub **B2C** de porcelanato (consumidor final não credita) isso é irrelevante; para **B2B** (construtora, arquiteto, obra) é decisivo — o cliente vai preferir quem dá crédito. A decisão "Simples puro" precisa ser conferida contra o mix B2B/B2C real.

**Ação:** datar a análise como "regime atual, válido até a transição"; pedir ao contador uma 2ª coluna IBS/CBS; e decidir o B2B antes de set/2026.

## 🔴 C2 — O pilar "excedente = receita de serviço" tem dois furos

A economia inteira depende de a Receita aceitar **definir o varejo + reter o spread** como serviço de intermediação. Dois pontos a pressionar:

**(a) A direção da NFS-e é o seam.** [[anexo-A-intermediacao]] A.2.3 emite a NFS-e do **excedente** *contra o Fornecedor*. Mas o excedente sai do **bolso do consumidor** (varejo − piso), não do fornecedor — o fornecedor nunca paga esse valor à ROI Labs; a ROI Labs o **retém no split**. Cobrar do fornecedor um "serviço" que ele não contratou nem paga é a ficção que o fisco abre para re-caracterizar: *quem define preço e fica com o spread do consumidor está vendendo a varejo* → revenda, não serviço prestado ao fornecedor. A **Solução de Consulta COSIT nº 5007/2025** já sinaliza a Receita fechando o cerco à "economia digital" (não deixa o marketplace excluir da receita o que repassa). O excedente é munição muito maior que uma comissão limpa.

**(b) O excedente é bitributado.** O fornecedor emite NF-e ao consumidor por **R$9.100** (varejo cheio, necessário para manter a ROI Labs fora da cadeia). Logo a **receita bruta do fornecedor é R$9.100** — Anexo I sobre os R$9.100, ainda que ele só embolse R$7.000. Os **R$2.100 de excedente entram na base do fornecedor (mercadoria) E na base da ROI Labs (serviço)**. Camada dupla sobre o spread. Sob ICMS-ST dói menos (ICMS já retido por pauta), mas para o PIS/COFINS/IRPJ/DAS do fornecedor a base é a NF cheia.

**Ação:** decidir conscientemente quem absorve a tributação extra do fornecedor sobre os R$2.100 (vira desconto no piso? a ROI Labs reembolsa?). Buscar **solução de consulta própria** ou jurisprudência específica de "intermediação com retenção de spread" — é o ponto que mais merece parecer assinado.

## 🔴 C3 — A projeção compara o lado errado da balança

[[projecao-financeira]] conclui "intermediação ganha ~R$1.140/venda". A **aritmética está correta** (conferi todas as faixas — ver M-checks), mas a **comparação é assimétrica**: ela soma à WL o imposto sobre o **GMV inteiro**, e à intermediação só o imposto da **ROI Labs** (R$307). Esquece que, na intermediação, o **fornecedor** paga Anexo I sobre a NF de **R$9.100** — que inclui os R$2.100 de spread da ROI Labs.

Comparação **sistêmica** (fornecedor + ROI Labs), ordem de grandeza:
- **Intermediação:** Anexo I do fornecedor s/ R$9.100 (~R$360–640 após ST) **+** Anexo III da ROI Labs s/ R$3.010 (~R$307) ≈ **R$670–950**.
- **WL revenda:** Anexo I do fornecedor s/ R$7.000 (venda real a ROI Labs) **+** Anexo I da ROI Labs s/ R$9.100 (~⅔ após ST) ≈ **R$910–1.120**.

Intermediação **ainda vence**, mas a vantagem real é **menor** que o "R$1.140" — e parte dela é imposto que **o fornecedor** paga sobre dinheiro que é da ROI Labs (ver C2-b). A conclusão estratégica (WL só no premium) **sobrevive**; o número de venda da tabela da linha 82-90 precisa de uma 3ª linha "imposto do fornecedor".

---

## 🟠 A1 — Paridade (Cl. 7) está mais larga que o CADE permite

[[contrato-quadro]] Cl. 7.2 proíbe o fornecedor de fazer *undercut* do SKU no Polo **em loja física, site próprio e outros marketplaces**. No TCC Booking/Decolar/Expedia (CADE, 2018), o CADE **vedou paridade ampla** (vs. concorrentes e todos os canais) e **só admitiu paridade estreita** (vs. o **canal direto do próprio vendedor**). A Cl. 7.2, ao alcançar "outros marketplaces" e a loja física, está no território amplo que o CADE rejeitou.

**Ação:** estreitar para **só o canal direto do fornecedor** (site/loja próprios), ou trocar por **preço mínimo sugerido** (não vinculante). A nota de revisão em 7.4 já aponta para cá — esta é a resposta.

## 🟠 A2 — Se a WL vira regra, o teto do Simples é curto prazo, não watch-point

A tensão do founder (paridade faz a WL virar quase-obrigatória) tem mordida numérica direta: na WL a **RBT12 = GMV inteiro**. No cenário **Otimista**, o GMV já é **R$3,276M** (linha 37 da projeção) — colado no **sublimite de R$3,6M** e a um passo do **teto de R$4,8M**. Ou seja: **uma cadeira só**, no Otimista, em modo WL, **já estoura o Simples**. O framing "intermediação é o padrão, WL é exceção" ([[legal-fin]], [[oferta]]) não é só narrativa — é o que segura a empresa dentro do Simples. Se a WL escala, **Presumido/Real entram muito antes** do que o texto sugere.

**Ação:** tratar o "watch-point" como **gatilho de regime** com número (RBT12 → R$3,6M) e revisar o framing nos nós `decided`.

## 🟠 A3 — ICMS-ST do 6907 vive, mas com prazo de validade

Confirmei que o regime de ST de revestimento (NCM **6907**, Protocolos 84/11 e 85/11) **segue ativo** e os estados continuam fixando **pauta/valor mínimo** (ex.: SP fixou R$11,85/m² para 2025). Não achei revogação **específica de GO** — então o resíduo "obter o IVA-ST na SEFAZ-GO na 1ª compra" **continua válido**. Porém: a Reforma **extingue o ICMS-ST** ao longo da transição (IBS substitui ICMS até 2033). Toda a vantagem "ICMS-ST já embutido no custo" da WL **tem data para acabar**.

**Ação:** confirmar pauta vigente na SEFAZ-GO **e** marcar que o benefício de ST é transitório.

---

## 🟡 Consistência interna e aritmética

- **M1 — Ref. de cláusula stale (CORRIGIDO).** [[legal-fin]] citava a paridade como "**Cl. 8**"; no [[contrato-quadro]] ela é **Cl. 7** (Cl. 8 = Pagamento). Corrigi a ocorrência em `legal-fin.md`. (A [[projecao-financeira]] já usava "Cl. 7" — estava certa.)
- **M2 — Comparação WL mistura regime.** A tabela "vale a pena?" (projeção, ~linha 87) tributa a WL por **Lucro Presumido (5,93%)** num mundo onde o regime **decidido é Simples**. Sob Anexo I a WL paga mais → a intermediação ganha por **mais** ainda, mas a tabela deveria ser Simples-vs-Simples para ser honesta.
- **M3 — Take rate rotulado errado.** R$3.010 / R$9.100 = **33,1%**, não os "~30%" de A.2.4 e [[legal-fin]]. Cosmético, mas conferir.
- **M4 — Faixa do Conservador.** RBT12 R$180.600 cai na **Faixa 2** do Anexo III (não Faixa 1); o efetivo dá 6,02% **por coincidência** de estar colado no teto da Faixa 1. O rótulo "6% inicial" é nominal de Faixa 1, não o efetivo desse cenário. (Os R$10.867 estão corretos.)
- **M5 — Breakeven WL é piso otimista.** O "+12%" usa imposto de **Presumido**; sob o **Simples Anexo I** decidido, a WL precisa de **prêmio maior** para empatar. Regra de bolso deveria dizer "**≥ ~13–15%**".
- **Aritmética: APROVADA.** Refiz Anexo III (6,02% / 10,24% / 12,71%), Anexo V (15,51% / 17,67% / 18,92%) e Presumido (16,33% + adicional só no Otimista = 17,3%) — **todos batem ao real** com os valores das tabelas. O motor de cálculo está certo; o problema é o **enquadramento da comparação** (C3/M2), não as contas.

## 🟡 F — Completude contratual (faltas antes do advogado)

A minuta é enxuta de propósito; faltam cláusulas padrão que o advogado vai cobrar:
- **Força maior / caso fortuito**
- **Cessão e sucessão** (pode transferir o contrato? a cadeira?)
- **Comunicações/notificações** (forma, e-mail válido, prazos)
- **Anticorrupção / compliance** (Lei 12.846)
- **Penalidades / multa** por inadimplemento (hoje só há rescisão, sem multa)
- **Resolução de disputas** (mediação/arbitragem antes do foro?)
- **Não-aliciamento** (fornecedor não contorna a plataforma para falar direto com clientes captados)
- **Apêndice de SKUs** do [[anexo-B-white-label]] (B.8.2) e prazos em branco: SLA de despacho (Cl. 5.1), aviso prévio (Cl. 13.3), `[definir]` do frete reverso WL (B.6).
- **Tributo retido na fonte sobre o split:** quem retém ISS/IRRF na liquidação Asaas? Não tratado.

---

## Defaults a confirmar (do handoff) — minha recomendação

- **Frete reverso (arrependimento) → Fornecedor:** ✅ coerente, ele é Vendedor de Fato no Anexo A. Manter.
- **Chargeback por falha de produto → Fornecedor integral:** ✅ correto. Só ressalva: garantir contratualmente o **direito de retenção** (Cl. 10.2) para a ROI Labs não ficar descoberta entre o estorno e o regresso.
- **Frete reverso WL (B.6) `[definir]`:** recomendo **Fornecedor** (ele despacha e tem a logística), com a ROI Labs só intermediando o estorno ao consumidor — espelha o Anexo A e evita custo de logística na ROI Labs.

## O que NÃO consegui fechar (precisa do profissional)

- Pauta/IVA-ST **vigente** do 6907 na **SEFAZ-GO** (busquei; achei SP, não o número de GO).
- **Solução de consulta específica** sobre intermediação com **retenção de spread** (a SC 5007/2025 é o sinal mais próximo, não o caso exato).
- Alíquota e **fatia de ICMS por faixa** do Anexo I (para o desconto de ST) — contador.
- Mix **B2B vs B2C** real (decide a opção de regime regular híbrido até set/2026).

## Fontes

- [LC 214/2025 (IBS/CBS) — Planalto](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm) · plataformas: arts. 21–23; crédito Simples: art. 47 §9º
- [Responsabilidade das plataformas digitais na reforma (ConJur, dez/2025)](https://www.conjur.com.br/2025-dez-29/responsabilidade-tributaria-das-plataformas-digitais-na-reforma/)
- [Split payment em marketplaces (Contábeis)](https://www.contabeis.com.br/artigos/72488/reforma-tributaria-split-payment-em-marketplaces-impacta-recolhimento-de-ibs-e-cbs/)
- [Simples Nacional na Reforma — crédito e regime híbrido (Contabilizei)](https://www.contabilizei.com.br/reforma-tributaria/artigo/simples-nacional-reforma-tributaria/)
- [Comissão de marketplace integra receita bruta — SC 5007/2025 (Chambarelli)](https://chambarelli.com.br/comissao-paga-ao-marketplace-integra-receita-bruta-do-simples-nacional-reafirma-receita-federal/)
- [CADE — TCC Booking/Decolar/Expedia, paridade estreita vs. ampla](https://www.gov.br/cade/pt-br/assuntos/noticias/booking-decolar-e-expedia-celebram-acordo-de-cessacao-com-o-cade)
- [Pauta ICMS-ST revestimento 6907 (exemplo SP, vigente 2025)](https://netcpa.com.br/colunas/portaria-sre-no-842024-fixa-valor-minimo-para-o-calculo-do-icms-nas-operacoes-com-revestimento-ceramico-classificado-como-extra-ou-tipo-a/24060)
