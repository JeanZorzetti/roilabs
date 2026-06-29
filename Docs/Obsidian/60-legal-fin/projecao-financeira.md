---
tipo: projecao
status: decidido
depends_on:
  - "[[modelo]]"
  - "[[legal-fin]]"
---

# Projeção Financeira — Carga Tributária nos 2 Regimes

> **Para quê:** comparar Simples Nacional × Lucro Presumido lado a lado. A estrutura jurídica/fiscal está fechada em [[legal-fin]]; aqui é o número.

## ✅ Decisão (2026-06-28): regime = **Simples Nacional**

*Por quê:* no deserto SEO o faturamento inicial é baixo → Lucro Presumido seria prematuro; e como a paridade de preço (Cl. 7 do [[contrato-quadro]]) faz a **WL virar o moat de margem**, a fatia de comércio sobe — o Simples acomoda os dois lados (Anexo III/V no serviço, Anexo I na WL). **Alvo:** Anexo III via fator-r na intermediação. **Watch-point:** se a WL (base = GMV) aproximar a RBT12 do sublimite R$3,6M / teto R$4,8M, reavaliar Presumido/Real. As tabelas abaixo ficam como base de gestão do fator-r e de monitoramento do teto.

> ⚠️ **Validade temporal (Reforma Tributária).** Toda a análise abaixo é do **sistema atual** (ICMS/ISS/PIS/COFINS/Simples). Em 2026 já roda a fase-teste de **IBS/CBS** (LC 214/2025): o **split payment vira obrigação legal**, a plataforma pode ser **responsável solidária** (deemed supplier) e o optante do Simples decide até **set/2026** se recolhe IBS/CBS dentro do DAS ou pelo **regime regular híbrido** (sem o qual **não gera crédito** ao comprador — crítico se houver venda B2B). Reavaliar com o contador. Ver [[auditoria]] C1.

## Insight que muda tudo

No modelo **padrão (intermediação)**, a **receita bruta da ROI Labs = só a comissão + excedente (~R$3.010/venda)**, **não o GMV (R$9.100)**. O imposto incide sobre a receita de serviço, não sobre o ticket cheio. Isso mantém a empresa nas **faixas baixas** do Simples mesmo com GMV alto. (A revenda WL premium é a exceção — ver fim.)

## Premissas (edite estes números)

| Premissa | Valor | Origem |
|---|---|---|
| Ticket varejo (porcelanato âncora) | R$ 9.100 | [[modelo]] |
| Piso (atacado) | R$ 7.000 | [[modelo]] |
| **Receita ROI Labs/venda** (excedente R$2.100 + comissão 10% × R$9.100) | **R$ 3.010** | [[modelo]] |
| ISS Goiânia (intermediação, item 10.05) | **5%** (teto; mín. 2%) | a confirmar — ver resíduo |
| Fator-r | **cenário** (≥28% → Anexo III; <28% → Anexo V) | folha/pró-labore ÷ receita |

**Cenários de volume (vendas/mês):** Conservador 5 · Base 15 · Otimista 30.

| Cenário | Vendas/mês | Receita ROI Labs/mês | **Receita/ano (RBT12)** | GMV/ano (passa, não é receita) |
|---|---|---|---|---|
| Conservador | 5 | R$ 15.050 | **R$ 180.600** | R$ 546.000 |
| Base | 15 | R$ 45.150 | **R$ 541.800** | R$ 1.638.000 |
| Otimista | 30 | R$ 90.300 | **R$ 1.083.600** | R$ 3.276.000 |

## Carga tributária comparada (% sobre a receita da ROI Labs · R$/ano)

| Cenário | Simples **Anexo III** (fator-r ≥28%) | Simples **Anexo V** (fator-r <28%) | **Lucro Presumido** (ISS 5%) |
|---|---|---|---|
| **Conservador** (R$180,6k) | **6,0%** · R$ 10.867 | 15,5% · R$ 28.008 | 16,3% · R$ 29.492 |
| **Base** (R$541,8k) | **10,2%** · R$ 55.503 | 17,7% · R$ 95.751 | 16,3% · R$ 88.476 |
| **Otimista** (R$1,08M) | **12,7%** · R$ 137.736 | 18,9% · R$ 205.038 | 17,3% · R$ 187.627 |

> Lucro Presumido = IRPJ 4,8% + CSLL 2,88% + PIS/COFINS 3,65% + ISS 5% (+ adicional de 10% de IRPJ sobre o lucro presumido acima de R$20k/mês — só morde no Otimista). **Se Goiânia for ISS 2% no item 10.05, subtraia 3 p.p. do Presumido.**
>
> ⚠️ **Faixa do Conservador:** a RBT12 de R$180.600 fica **na Faixa 2** do Anexo III (não Faixa 1) — o efetivo dá ~6,0% só por estar colado no teto da Faixa 1 (R$180k). Não confundir o "6% inicial" (nominal de Faixa 1) com o efetivo deste cenário; os R$10.867 estão corretos.

## Leitura — o que decide o regime

1. **Anexo III ganha em todos os cenários (6%–12,7%).** Se a ROI Labs mantiver **fator-r ≥ 28%**, Simples Anexo III é disparado o mais barato. É o alvo.
2. **O jogo é o fator-r.** Fator-r = (folha + pró-labore dos últimos 12m) ÷ receita 12m. Na Fase 1, com receita baixa e o pró-labore da Maria Eduarda como custo principal ([[time]]), é **fácil ficar ≥28% → Anexo III**. À medida que a receita escala, é preciso **escalar a folha/pró-labore proporcionalmente** para não cair no Anexo V.
3. **Se cair no Anexo V, o Lucro Presumido passa a competir** — empata no Conservador e **fica mais barato que o Anexo V a partir do Base** (16,3% vs 17,7%). Ou seja: Anexo V é o pior dos três; se não dá pra segurar o Anexo III, vale comparar com Presumido.
4. **Decisão prática:** mirar **Simples Anexo III** (gerindo o fator-r). Só migrar para **Lucro Presumido** se o fator-r não fechar 28% **e** a receita já estiver no nível Base+. Lucro Real não compensa nesse porte (intermediação tem pouco crédito de PIS/COFINS).

## Como recalcular

- **Simples (efetiva):** `(RBT12 × alíquota_nominal − parcela_a_deduzir) ÷ RBT12`, com a faixa definida pela RBT12 (tabelas nas fontes).
- **Presumido:** `IRPJ 15%×(32%×receita) + CSLL 9%×(32%×receita) + PIS 0,65% + COFINS 3% + ISS` sobre a receita.
- **Me passe o volume real de vendas/mês e o pró-labore previsto** que eu ploto os números exatos com a sua faixa e fator-r.

## Projeção WL (revenda à ordem)

Na revenda WL muda tudo: a **receita bruta da ROI Labs vira o GMV inteiro** (R$9.100/venda), o imposto é de **comércio** sobre o **ticket cheio** (não sobre a margem), e **some a comissão de 10%** (não há venda de terceiro a comissionar — é a própria venda da ROI Labs). A margem vira só o spread (varejo − atacado).

### Tributação WL por cenário (% sobre o GMV)

RBT12 da atividade WL = o GMV (não a receita líquida). Volumes 5/15/30 vendas/mês:

| Cenário (GMV/ano) | Simples **Anexo I** (comércio, bruto) | Lucro Presumido (comércio) |
|---|---|---|
| Conservador (R$546k) | 6,96% | 5,93% |
| Base (R$1,64M) | 9,33% | 5,93% |
| Otimista (R$3,28M) | 11,63% | ~6,0% |

> Presumido comércio = IRPJ 1,2% + CSLL 1,08% + PIS/COFINS 3,65% sobre o GMV. **No Anexo I, como o porcelanato é ICMS-ST, a parcela de ICMS do DAS (≈1/3) já foi recolhida a montante e não entra de novo** → o efetivo cai para ~⅔ dos % acima (contador confirma a fatia de ICMS por faixa). O ICMS-ST vem **embutido no custo de compra** nos dois regimes.

### A pergunta que decide: WL vale a pena vs intermediação?

Comparação **por venda** do mesmo produto (varejo R$9.100, atacado R$7.000), no cenário Base:

| | Intermediação | WL revenda |
|---|---|---|
| Receita bruta ROI Labs | R$ 3.010 | R$ 9.100 |
| (−) custo (atacado) | — | R$ 7.000 |
| Margem bruta | R$ 3.010 | R$ 2.100 |
| (−) imposto ROI Labs | ~R$ 307 (Anexo III 10,2%) | ~R$ 565 (Anexo I ~6,2% s/ GMV, após ST) |
| **Líquido ROI Labs** | **~R$ 2.700** | **~R$ 1.535** |
| *(memo) imposto do Fornecedor sobre a NF* | *~R$ 360–640 (Anexo I s/ R$9.100)* | *~R$ 280–490 (Anexo I s/ R$7.000)* |
| **Imposto do sistema (Forn.+ROI)** | **~R$ 670–950** | **~R$ 845–1.055** |

**No P&L isolado da ROI Labs, a intermediação ganha ~R$1.165/venda** — captura comissão + spread e tributa só a receita de serviço. **Mas a comparação justa é sistêmica:** na intermediação o **Fornecedor** emite a NF cheia (R$9.100, que carrega os R$2.100 de spread da ROI Labs) e paga Anexo I sobre ela — parte do "ganho" é imposto que recai sobre o Fornecedor, e o excedente acaba tributado em **duas pontas**. No sistema (Forn.+ROI), a vantagem **encolhe** (~R$670–950 vs ~R$845–1.055): a intermediação **ainda vence**, mas menos do que o P&L isolado sugere. *(Regime do exemplo: Simples — antes a WL aparecia com imposto de Presumido, corrigido. Ver [[auditoria]] C2/C3.)*

### Ponto de equilíbrio (breakeven)

A WL só compensa se a marca própria permitir **subir o preço** (sem comparação direta). Para a WL empatar com a intermediação (~R$2.700 líquidos):

> **varejo WL ≈ R$ 10.300–10.500** — cerca de **+13–15% sobre o preço de mercado comparável** (R$9.100), ou markup de ~47–50% sobre o atacado vs. ~30% da referência. *(Sob o Simples Anexo I decidido, o prêmio exigido é maior que os +12% antes calculados por Presumido.)*

**Regra de bolso:** só usar WL onde o "premium de marca" permitir **≥ ~13–15% de preço acima** do equivalente vendido por intermediação. Abaixo disso, intermediação é mais lucrativa **e** menos arriscada (sem estoque/giro). Isso confirma a decisão da [[oferta]]: WL **só** nas linhas premium de alto markup.

### Ressalvas (empresa mista)

- Se a ROI Labs fizer **intermediação + WL na mesma empresa**, o regime é o da empresa toda. No Simples, segrega-se a receita por anexo (serviço → III/V; comércio WL → I), mas a **faixa de todos** é definida pela **RBT12 total** → a fatia WL pode cair numa faixa mais alta do Anexo I.
- Confirmar com o contador a fatia exata de ICMS do Anexo I (para o desconto de ST) e o IVA-ST do NCM 6907 na compra (ver [[legal-fin]]).

## Resíduo

- Confirmar **alíquota de ISS de Goiânia para o item 10.05** (2% mín. ou 5% teto) — LC municipal 344/2021 → impacta só o Lucro Presumido (±3 p.p.).
- Você define o **volume projetado** e o **pró-labore** (fator-r) → fecha a escolha do regime.

## Fontes

- [Tabelas Simples Nacional 2026 — Anexos I, III, V (faixas, alíquota, parcela a deduzir)](https://www.contabilizei.com.br/contabilidade-online/tabela-simples-nacional-completa/)
- [Fator R — Anexo III × V](https://www.contabilizei.com.br/contabilidade-online/fator-r-simples-nacional/)
- [Lucro Presumido — presunção 32% (serviço/intermediação)](https://www.portaltributario.com.br/guia/lucro_presumido_irpj.html)
- [ISS Goiânia — LC 344/2021 (mín. 2%, teto 5%)](https://www.goiania.go.gov.br/download/financas/novoctm.pdf)
