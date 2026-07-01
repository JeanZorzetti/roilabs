---
status: decided
depends_on:
  - "[[mercado]]"
  - "[[oferta]]"
---

# Modelo — Margem Dupla e Unit Economics

> **Pergunta que este nó responde:** como a ROI Labs ganha dinheiro e se sustenta?

## Decisão atual

**Margem Dupla** (blinda contra oscilação e financia a maturação orgânica):

1. **Spread atacado/varejo** — ROI Labs compra no atacado, define o varejo; o markup absorve a infraestrutura. *(Fiscalmente realizado como comissão mercantil — preço mínimo do fornecedor + excedente retido como comissão —, não como compra-e-revenda. Ver [[legal-fin]].)*
2. **Comissão de 10%** sobre o bruto da transação (equivale a um representante comercial).

**Meta: Take Rate médio de 30%** — combustível para atravessar a janela de ~6 meses sem queimar caixa em Ads.

| Produto | Atacado | Varejo | Spread | Comissão | Receita | Take Rate |
|---|---|---|---|---|---|---|
| Blusa (baixo ticket) | R$ 20 | R$ 25 | R$ 5 | R$ 2,50 | R$ 7,50 | 30% |
| Notebook (alto ticket) | R$ 3.600 | R$ 4.000 | R$ 400 | R$ 400 | R$ 800 | 20% |
| Porcelanato (volume) | R$ 7.000 | R$ 9.100 | R$ 2.100 | R$ 910 | R$ 3.010 | 33% |

**Monetização progressiva:** quando um polo prova que a ROI Labs = 30-40% do faturamento do parceiro, o próximo polo abre com **mensalidade SaaS + comissão** (a cadeira agora tem valor de mercado provado → ver [[gtm]] FOMO).

## Depende de

- [[mercado]] — ticket e nicho definem qual faixa de take rate é viável.
- [[oferta]] — White Label e markup alto sustentam o spread.

## Decisões fechadas

- ✅ **Mensalidade SaaS (Fase 2): fórmula, não número fixo.** Entra só no gatilho dos 30-40% do faturamento do parceiro, ancorada em ~1 venda média/mês (precificar pela dor). O número real sai dos dados do polo 1.
- ✅ **Piso de take rate = receita absoluta por venda, não %.** Aceita ticket de margem % menor se R$/venda ≥ piso (porcelanato de alto valor a 20% ainda gera receita absoluta que financia a infra). Definir o piso em R$ após ver os tickets reais de revestimentos.
- ✅ **Success fee: mecânica decidida e implementada (2026-07-01, feature 007 — no ar).** Cada `Parceiro` tem um **% negociado** (guardado no cadastro); a comissão incide sobre o **valor de produto do pedido pago** (total − frete, **nunca sobre o frete** — espelha a regra do cupom), agregada em **fatura mensal por parceiro** e cobrada automaticamente via **Asaas** (boleto/PIX, separado do Mercado Pago do checkout). **Tática de aquisição — "moeda de troca":** a ROI repassa reservas pagas do e-commerce a lojas candidatas para provar valor; antes do repasse faz uma **sondagem** (a loja topa pagar a comissão + firmar?) — quem recusa é *riscado*; só o *primeiro* repasse a quem firmará mas ainda não é parceiro formal pode ser marcado isento. Camada **aditiva**: coexiste com os centros de custo (operação própria da ROI), não os substitui. Detalhe e pendências de config em [[proximos-passos-dev]].

## Notas

Origem: [[Blueprint Estratégico_ Hub de Infraestrutura Digital ROI Labs]] §2.
