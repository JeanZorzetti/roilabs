---
status: decided
depends_on:
  - "[[modelo]]"
---

# Legal & Financeiro — Estrutura, Runway e Riscos

> **Pergunta que este nó responde:** como a operação se estrutura juridicamente, se sustenta no caixa e mitiga riscos?

## Decisão atual

### Estrutura de contrato: **intermediação/marketplace como padrão; revenda à ordem só na exceção White Label premium**

A margem dupla do [[modelo]] (spread atacado/varejo + comissão) misturava duas naturezas fiscais opostas. **Resolvido colapsando as duas em uma única receita de serviço**, com veículo jurídico fechado por pesquisa (fontes ao final):

- **Padrão (todo o catálogo): contrato atípico de intermediação de vendas (marketplace).** A ROI Labs é **plataforma/intermediadora**, não vendedora. O fornecedor define um **preço mínimo (piso = atacado)** e autoriza a ROI Labs a praticar o preço de varejo ≥ piso; **a remuneração da ROI Labs = comissão % + o excedente sobre o piso** — fica tudo como **receita de serviço de intermediação** (ISS, [LC 116/2003](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm) item **10.05** — "agenciamento, corretagem ou intermediação de bens móveis"). Entrega a economia da margem dupla **dentro da caixa fiscal de serviço**: uma só receita, sem ICMS, sem posse de estoque, sem capital de giro. Coerente com a [[tese]] (sem piso de remuneração ao fornecedor, risco compartilhado, custo zero de setup).
- **NÃO usar representação comercial** ([Lei 4.886/65](https://www.planalto.gov.br/ccivil_03/leis/l4886.htm)) como veículo: ela impõe **indenização obrigatória ≥ 1/12 do total das comissões** ao representante na rescisão sem justa causa (passivo que a ROI Labs não quer carregar), **proíbe cláusula del credere** e exige registro no CORE — é desenhada para proteger o representante, não a plataforma. O contrato de intermediação atípico (liberdade contratual, [CC art. 425](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm)) evita essa camisa de força.
- **Exceção (linhas premium White Label): revenda via venda à ordem.** Onde a marca é da ROI Labs, o fornecedor não pode figurar como vendedor na NF ao consumidor → ali é revenda de fato. Aceita-se a carga de revenda, mas em **venda à ordem (dropship triangular)**: o fornecedor despacha, a ROI Labs **não carrega estoque físico**. Reservado ao premium WL de alto markup (ver [[oferta]]).

### Mecânica fiscal fechada (fluxo de NF)

**Padrão — intermediação (sem posse):**
1. Cliente compra no hub.
2. **Fornecedor emite NF-e de venda direto ao cliente** pelo preço de varejo praticado (CFOP 5.102/6.102). Em porcelanato sob ICMS-ST, o imposto já foi retido a montante → NF sai com CST de mercadoria já tributada por ST (sem novo ICMS a recolher na ponta).
3. **ROI Labs emite NFS-e** de intermediação ao fornecedor (ISS item 10.05), base = comissão % + excedente sobre o piso.
4. Fluxo financeiro: split de pagamento — a ROI Labs recebe do cliente, retém sua remuneração e repassa o piso líquido ao fornecedor (definido na minuta).

**Exceção — venda à ordem (WL premium, revenda):**
1. **Fornecedor (vendedor remetente) emite duas NF-e:** (a) **faturamento** para a ROI Labs (adquirente original), CFOP 5.101/6.101, com ICMS; (b) **remessa por conta e ordem** ao cliente (destinatário), CFOP 5.923/6.923, que acompanha o transporte.
2. **ROI Labs emite NF-e de venda** ao cliente, CFOP 5.120/6.120.
3. ICMS: sob ST já vem retido; fora de ST, a ROI Labs recolhe na saída e credita a entrada.

### Fiscal do spread, nos dois regimes (ordem de grandeza — contador confirma os números exatos)

A intermediação tributa **só a comissão+excedente**; a revenda tributa o **valor cheio da mercadoria** + ICMS.

| | Intermediação (padrão) | Revenda à ordem (WL premium) |
|---|---|---|
| **Simples Nacional** | Serviço — **Anexo V** (15,5% inicial) por padrão; cai para **Anexo III** (6% inicial) se **fator-r ≥ 28%** (folha/faturamento). Base = **só a remuneração** | Comércio — **Anexo I** (4% inicial) sobre o **valor cheio**; ICMS-ST de revestimento já embutido no custo de compra |
| **Lucro Presumido** | **Presunção 32%** → IRPJ 4,8% + CSLL 2,88% + PIS/COFINS 3,65% + ISS 2–5% ≈ **~16% sobre a remuneração** | **Presunção 8%/12%** → IRPJ 1,2% + CSLL 1,08% + PIS/COFINS 3,65% ≈ **~6% sobre o faturamento cheio** + ICMS/ST embutido |

Em **ambos os regimes a intermediação vence**: a alíquota nominal de comércio parece menor, mas incide sobre o ticket inteiro (porcelanato ~R$9.100 vs. remuneração ~R$3.010) e ainda carrega ICMS-ST e capital de giro. Por isso a revenda fica restrita ao premium WL.

### Runway / sustentabilidade

O take rate de ~30% (ver [[modelo]]) financia a janela de maturação de ~6 meses sem queimar caixa em Ads. A estrutura de intermediação **preserva esse runway** ao tributar a receita líquida de serviço (não o GMV) e ao eliminar a necessidade de giro para comprar estoque.

### Riscos e mitigação

- **Re-caracterização fiscal (intermediação → revenda):** o fisco pode alegar que "definir o varejo + reter o spread" é revenda. **Mitigação na minuta:** o fornecedor mantém a **titularidade** da mercadoria e **emite a NF-e ao consumidor pelo preço cheio**; ele define o piso e **delega** a precificação acima do piso; o excedente é contratualmente remuneração de serviço de intermediação/otimização de preço.
  - ⚠️ **Dois furos a pressionar (ver [[auditoria]] C2):** (a) a NFS-e do **excedente** é emitida *contra o Fornecedor* ([[anexo-A-intermediacao]] A.2.3), mas o excedente sai do **bolso do consumidor**, não do fornecedor — cobrar dele um "serviço" que não contratou nem paga é o seam que o fisco usa para re-caracterizar; a **Solução de Consulta COSIT nº 5007/2025** mostra a Receita fechando o cerco à "economia digital". (b) **Bitributação do excedente:** ele entra na NF cheia do fornecedor (mercadoria, base R$9.100) **e** na receita de serviço da ROI Labs — camada dupla sobre o spread. **A buscar:** solução de consulta própria / jurisprudência de "intermediação com retenção de spread" (parecer assinado).
- **Responsabilidade solidária por ICMS de marketplace** ([STF Tema 1.413](https://portal.stf.jus.br); leis estaduais de obrigações acessórias): a plataforma responde se o vendedor não emitir NF ou descumprir obrigações acessórias. **Mitigação:** cláusula obrigando o fornecedor a emitir NF-e regular em toda venda (amarra com o requisito mínimo / Gatekeeper de [[operacao]]) + ROI Labs cumpre o reporte de operações intermediadas.
- **Conflito de canal:** preço do hub vs. loja física do fornecedor → **White Label** em alto markup (ver [[oferta]]).
- **Legacy ERPs:** sistemas obsoletos ameaçam a integridade do estoque → requisito mínimo / Gatekeeper (ver [[operacao]]).

### ⚠️ Horizonte: Reforma Tributária (IBS/CBS) — análise atual tem prazo

Toda a mecânica acima está sobre o **sistema atual** (ICMS/ISS/PIS/COFINS/Simples). A transição **IBS/CBS** (LC 214/2025) já começou em 2026 e muda três pilares (ver [[auditoria]] C1):

1. **Plataforma "deemed supplier" (arts. 21–23):** a plataforma responde por IBS/CBS quando **controla** pagamento, preço, termos **ou** entrega. A ROI Labs controla preço (define o varejo) + pagamento (split Asaas) + termos → a blindagem "intermediário, não vendedor" fica **mais fraca** no sistema novo.
2. **Split payment vira obrigação legal:** o que hoje é plumbing do Asaas (Cl. 8) passa a ser dever de segregar/recolher IBS/CBS na liquidação. *Contrapartida:* cumprindo reporte + split, a plataforma **não responde** pela diferença do fornecedor (art. 22) — a arquitetura de split fica **legitimada**.
3. **Simples + Reforma (decisão até set/2026):** optante que **não** adere ao regime regular híbrido **não gera crédito** de IBS/CBS ao comprador (art. 47 §9º). Irrelevante para **B2C**; decisivo para **B2B** (construtora, arquiteto). Confirmar o mix antes de set/2026.

**Também transitório:** o ICMS-ST do NCM 6907 (vantagem da WL) é extinto ao longo da transição (até 2033).

## Depende de

- [[modelo]] — o take rate e a margem dupla definem o runway e a viabilidade financeira. **A "margem dupla" se realiza fiscalmente como comissão + excedente de intermediação (padrão) ou revenda à ordem (WL premium), nunca como compra-e-revenda genérica.**

## Decisões fechadas

- ✅ **Veículo: contrato atípico de intermediação/marketplace** (não representação comercial, não revenda no padrão). Minuta em **contrato-quadro + 2 anexos**: [[contrato-quadro]], [[anexo-A-intermediacao]], [[anexo-B-white-label]].
- ✅ **Fiscal do spread: tributado como serviço** (ISS item 10.05; Anexo V/III no Simples ou presunção 32% no Presumido), **não como mercadoria**.
- ✅ **Mecânica de NF fechada** para os dois cenários (intermediação e venda à ordem).
- ✅ **Revenda à ordem só no WL premium**, sem estoque físico (dropship triangular).
- ✅ **Exclusividade da cadeira: 1 ano renovável** (vem da [[tese]]), rescisão por quebra de SLA, **paridade de preço no polo** (não-undercut — substitui a antiga não-canibalização, que jogava risco de canal pro fornecedor e feria a tese) — formalizado na minuta.
- ✅ **Regime tributário: Simples Nacional** (decisão do fundador, 2026-06-28). *Por quê:* no deserto SEO o faturamento inicial é baixo → migrar para Lucro Presumido seria prematuro; e como a paridade de preço (Cl. 7) faz a **WL virar o moat de margem**, sobe a fatia de comércio — o Simples acomoda os dois lados (Anexo III/V no serviço de intermediação, Anexo I na WL). Mirar **Anexo III** via fator-r na fatia de intermediação (ver [[projecao-financeira]]). **Watch-point:** se a WL (base = GMV inteiro) crescer e aproximar a RBT12 do sublimite (R$3,6M) / teto (R$4,8M) do Simples, reavaliar Presumido/Real.

## Resíduo de execução (assinatura do profissional, não decisão em aberto)

1. ✅ **RESOLVIDO (2026-06-28): regime = Simples Nacional** (ver Decisões fechadas). Resta ao contador só formalizar a opção/enquadramento e gerir o fator-r para mirar o Anexo III.
2. **Obter o IVA-ST/pauta vigente do NCM 6907 na SEFAZ-GO** ([Anexo VIII do RCTE](https://appasp.economia.go.gov.br/legislacao/arquivos/Rcte/Anexos/ANEXO_08_Substituicao_Tributaria.htm), Protocolos ICMS 84/11 e 85/11) **no momento da 1ª compra WL** — só impacta a exceção de revenda.
3. **Advogado adapta a minuta** ao CNPJ/razão social final e ao foro, e confirma o split de pagamento (gateway).

## Notas

⚠️ Esta era a área **menos coberta** pelo blueprint original; saiu de `draft` para `decided` com a **mecânica fiscal e a minuta fechadas** por pesquisa em fontes oficiais. O que resta é assinatura/execução do profissional, não decisão estratégica. Origem parcial: [[Blueprint Estratégico_ Hub de Infraestrutura Digital ROI Labs]] §2 (runway) e §5 (riscos).

### Fontes

- [LC 116/2003 (ISS — lista de serviços, itens 10.05 e 10.09)](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm)
- [Lei 4.886/65 (representação comercial — indenização 1/12, del credere vedado)](https://www.planalto.gov.br/ccivil_03/leis/l4886.htm)
- [Código Civil — comissão (arts. 693+) e liberdade contratual (art. 425)](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm)
- [Anexo VIII do RCTE-GO (substituição tributária)](https://appasp.economia.go.gov.br/legislacao/arquivos/Rcte/Anexos/ANEXO_08_Substituicao_Tributaria.htm) — adesão aos Protocolos ICMS 84/11 e 85/11 (material de construção/acabamento)
- [Fator R e Anexos III/V do Simples Nacional](https://www.contabilizei.com.br/contabilidade-online/fator-r-simples-nacional/)
- [Lucro Presumido — percentuais de presunção (32% serviço / 8% comércio)](https://www.portaltributario.com.br/guia/lucro_presumido_irpj.html)
- [Venda à ordem / operação triangular — CFOPs](https://www.rotinafiscal.com.br/operacoes-fiscais/venda-a-ordem)
- [Responsabilidade tributária de marketplaces / STF Tema 1.413](https://www.ibet.com.br/a-responsabilidade-dos-marketplaces-pelo-icms/)
