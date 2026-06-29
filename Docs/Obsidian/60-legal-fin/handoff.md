---
tipo: handoff
status: vivo
data: 2026-06-28
escopo: auditoria da pasta 60-legal-fin
---

# Handoff — Auditoria de `60-legal-fin`

> **Objetivo da próxima sessão:** auditar/revisar criticamente **tudo** nesta pasta — estrutura jurídica, mecânica fiscal, projeção e a minuta (quadro + 2 anexos). Não é sessão de criação; é de **pressionar as apostas** e achar buracos. Tudo aqui foi produzido por pesquisa, **não por contador/advogado** — o objetivo da auditoria é exatamente esse crivo.

## Mapa da pasta

| Arquivo | Status | O que é |
|---|---|---|
| [[legal-fin]] | `decided` | Nó central: estrutura de contrato, mecânica fiscal de NF, riscos, decisões fechadas, resíduo, fontes |
| [[projecao-financeira]] | `decidido` | Carga tributária Simples × Presumido (intermediação **e** WL), breakeven WL, decisão de regime |
| [[contrato-quadro]] | `para-revisao-advogado` | Contrato-quadro (16 cláusulas, termos da relação) |
| [[anexo-A-intermediacao]] | `para-revisao-advogado` | Mecânica da intermediação (serviço) |
| [[anexo-B-white-label]] | `para-revisao-advogado` | Mecânica da revenda WL (venda à ordem) |

## Decisões fechadas nesta sessão (com o porquê)

1. **Veículo = contrato atípico de intermediação/marketplace.** Descartada **representação comercial** (Lei 4.886/65: indenização ≥1/12 na rescisão + del credere vedado + registro CORE). ISS pela LC 116 item **10.05**.
2. **Padrão = intermediação** (sem posse, NF do fornecedor ao consumidor, NFS-e de comissão+excedente); **WL premium = revenda à ordem** (triangular, sem estoque físico). A "margem dupla" do [[modelo]] vira **comissão + excedente como receita de serviço** — não compra-e-revenda.
3. **Regime = Simples Nacional** (decisão do fundador). Deserto SEO → Presumido prematuro; paridade de preço faz a WL virar moat → sobe a fatia de comércio, e o Simples acomoda os dois lados. **Alvo: Anexo III via fator-r.**
4. **Cláusula 8 (não-canibalização) → paridade de preço.** A trava de canal feria a tese (jogava risco pro fornecedor); virou só **não-undercut no Polo** + WL como matador de conflito.
5. **Pagamento = Asaas** com split automático (Pix/boleto/cartão).
6. **Minuta reestruturada:** monólito → **quadro + 2 anexos**, unificados pelo conceito **"Vendedor de Fato"** (fornecedor no Anexo A, ROI Labs no Anexo B) — evita duplicar devolução/garantia/chargeback.
7. **Adições à minuta:** arrependimento CDC (Cl. 9), chargeback por causa (Cl. 10), garantia/vícios = fornecedor (Cl. 11), independência das partes (Cl. 3), LGPD controladores independentes (Cl. 15), nota antitruste CADE na paridade (Cl. 7).

## O que auditar (checklist priorizado)

1. **[CRÍTICO] A aposta central — "excedente = serviço".** Pressionar: a Receita aceitaria a ROI Labs **definir o varejo e reter o spread** como receita de serviço de intermediação, sem re-caracterizar como revenda? É o pilar de toda a economia fiscal. Procurar jurisprudência/solução de consulta.
2. **[CRÍTICO] Reforma Tributária (IBS/CBS).** Toda a análise está sobre o sistema atual (ICMS/ISS/PIS/COFINS/Simples). A transição 2026–2033 muda regras de marketplace, **split payment** (vira mecanismo legal!) e Simples. Avaliar impacto e timeline.
3. **Atualidade do ICMS-ST de porcelanato em GO.** Confirmar se o NCM **6907** segue no regime de ST (Anexo VIII do RCTE / Protocolos 84/11 e 85/11) — muitos ST foram revogados pós-2019. Afeta a precificação WL.
4. **Paridade × CADE (Cl. 7).** Cláusula MFN é frágil; decidir manter / restringir / trocar por preço mínimo sugerido.
5. **Aritmética da [[projecao-financeira]].** Conferir alíquotas efetivas (fórmula Simples), o breakeven WL (~+12%) e o monitoramento do sublimite R$3,6M / teto R$4,8M.
6. **Consistência interna da minuta.** Cross-references quadro↔anexos (números de cláusula), uso de "Vendedor de Fato", nada órfão.
7. **Coerência com os nós `decided`** ([[tese]], [[oferta]], [[modelo]]) — a estrutura não pode contradizê-los. Ver item "tensão" abaixo.
8. **Completude contratual.** A minuta é enxuta — auditar faltas: força maior, cessão, comunicações/notificações, anticorrupção, penalidades, resolução de disputas/arbitragem, Apêndice de SKUs do Anexo B.

## Tensão estratégica a revisitar

O fundador observou que, com a paridade de preço (a loja física do fornecedor segue competindo), **a WL tende a virar obrigatória** — "difícil sermos só intermediadores". Se a WL deixar de ser exceção e virar regra:
- O framing "intermediação é o padrão, WL é exceção" em [[legal-fin]]/[[oferta]] precisa ser revisto.
- O **teto do Simples** (base WL = GMV inteiro) chega muito mais rápido → reavaliar regime.

## Decisões defaultadas — confirmar na auditoria

- **Frete reverso (arrependimento) → Fornecedor** (não rateado no take rate).
- **Chargeback por falha de produto → Fornecedor integral**; só fraude de pagamento é rateada.
- **Rateio do frete reverso no WL (Anexo B, B.6)** ainda `[definir]`.

## Resíduo de execução (profissional, não-decisório)

- Contador: **formalizar opção pelo Simples** + gerir fator-r para fixar o Anexo III.
- Advogado: adaptar minuta ao CNPJ/razão social/foro; vetar/ajustar paridade (CADE); confirmar regras de chargeback do Asaas.
- WL: obter **IVA-ST do NCM 6907 na SEFAZ-GO** na 1ª compra; montar Apêndice de SKUs premium.
- **MOOT:** "confirmar ISS Goiânia 2% vs 5%" perdeu relevância — no **Simples**, o ISS está embutido no DAS, então a alíquota municipal não muda a conta. Só voltaria a importar se migrar para Presumido.

## Fora de escopo (não feito de propósito)

- Runway/fluxo de caixa detalhado (CAPEX/OPEX da plataforma) — o nó só trata sustentabilidade em alto nível.
- Modelagem da mensalidade SaaS da Fase 2 (vive no [[modelo]]/[[gtm]]).
- Constituição da empresa (tipo societário, contrato social).

## Gotchas

- **Wikilinks resolvem por nome de arquivo** (Obsidian) — mover entre pastas não quebra link.
- **`workspace.json` ainda cita o monólito apagado** (`minuta-contrato-intermediacao`) — é estado interno do Obsidian, regenera sozinho, ignorar.
- **OneDrive:** edições via terminal deixam o arquivo "fora de sincronia" para a ferramenta — reler antes de editar.
- Os 3 arquivos de minuta são **rascunhos** (`para-revisao-advogado`); a análise fiscal é **baseada em pesquisa**, sem assinatura de CPA/advogado. Fontes citadas no rodapé de [[legal-fin]].
