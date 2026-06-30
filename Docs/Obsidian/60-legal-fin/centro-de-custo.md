---
status: decided
depends_on:
  - "[[modelo]]"
  - "[[anexo-A-intermediacao]]"
  - "[[anexo-B-white-label]]"
  - "[[projecao-financeira]]"
---

# Centro de Custo — Guia Executivo

> **O que é, em uma frase:** uma tela única (`/admin/centros-de-custo`) que mostra,
> para cada produto e para os pedidos já pagos, **quanto a ROI Labs ganha em cada um dos
> dois modelos de negócio** — Intermediação e White Label — e deixa a operação **ajustar
> todos os números (markup, comissão, impostos, piso) sem mexer em código nem redeployar**.
>
> **Onde fica:** [app.roilabs.com.br/admin/centros-de-custo](https://app.roilabs.com.br/admin/centros-de-custo) (login admin).

---

## 1. O conceito em 30 segundos

A mesma venda de porcelanato pode render dinheiro de **duas formas diferentes**, e cada
forma tem uma economia (e um imposto) distinta. A tela chama cada forma de **centro de
custo** e calcula os dois sobre o **mesmo preço de varejo**, lado a lado, para responder:
*"neste produto/venda, qual modelo me dá mais líquido?"*

| | **Intermediação** (padrão) | **White Label** (premium) |
|---|---|---|
| Papel da ROI Labs | Plataforma — o fornecedor vende, nós agenciamos | Revendedor sob marca própria |
| Receita | excedente (varejo − piso) **+ comissão** | o **varejo cheio** (GMV) |
| Custo de mercadoria | nenhum (não compramos) | o **piso** (atacado) |
| Imposto | sobre a **receita de serviço** (~10,2%) | sobre o **GMV inteiro** (~6,2%) |
| Quando usar | todo o catálogo | só linhas premium de alto markup |

A regra de ouro dos docs: **na maioria dos produtos a Intermediação vence** — a alíquota
da revenda parece menor, mas incide sobre o ticket inteiro. Ver [[legal-fin]] e
[[anexo-A-intermediacao]].

### A âncora (sanidade dos números)

Produto de referência: **varejo R$ 9.100 / piso R$ 7.000** (markup 30%). Com os defaults,
a tela reproduz os números fechados nos docs ([[projecao-financeira]]):

- **Intermediação líquida ≈ R$ 2.700** (excedente R$ 2.100 + comissão R$ 910 − imposto)
- **White Label líquida ≈ R$ 1.535** (spread R$ 2.100 − imposto sobre o GMV)

Se algum dia esses números não baterem com os defaults, **algo está errado** — é o sinal
de regressão.

---

## 2. As quatro alavancas (parâmetros)

Tudo o que a tela calcula sai de **quatro números**, todos editáveis:

| Parâmetro | Default | O que muda | De onde veio |
|---|---|---|---|
| **Markup** | 30% | o **piso estimado** (`piso = varejo ÷ 1,30`) enquanto não há piso real | âncora R$9.100/R$7.000 ([[modelo]]) |
| **Comissão** | 10% | a remuneração de serviço na Intermediação | Anexo A.2.2.a ([[anexo-A-intermediacao]]) |
| **Alíq. Intermediação** | 10,2% | imposto sobre a receita de serviço | Simples Anexo III, cenário Base ([[projecao-financeira]]) |
| **Alíq. White Label** | 6,2% | imposto sobre o GMV (após ICMS-ST) | Simples Anexo I, cenário Base ([[projecao-financeira]]) |

**Markup é só um proxy.** Ele estima o piso enquanto o fornecedor não fechou (Gate 3).
Quando o piso real chegar, ele substitui o markup **naquele produto** (ver §4.4).

---

## 3. As duas leituras do "quanto já ganhei" (pedidos pagos)

Acima da tabela há dois blocos de cartões, sobre os **pedidos já pagos**:

1. **Referência hipotética** — "e se *tudo* fosse Intermediação?" vs "e se *tudo* fosse
   White Label?". Serve para **decidir estratégia** (qual modelo renderia mais no mix atual).
2. **Real por modalidade oficial** — cada item entra **no centro da sua modalidade-alvo**
   (premium → White Label; resto → Intermediação) e soma um total por centro. Este é o
   **resultado contábil de verdade** — quanto cada centro rendeu.

> Hoje os dois mostram **R$ 0,00** porque ainda não há pedido pago. Assim que houver,
> preenchem sozinhos.

---

## 4. Como se usa — passo a passo

### 4.1 Acessar
Entrar em `/login` com a senha admin → menu **Centros de custo**.

### 4.2 Ajustar um percentual sem deploy (o caso mais comum)
1. Abrir **⚙ Parâmetros editáveis** → seção **Parâmetros globais**.
2. Mudar, por exemplo, **Markup** de 30 para 25.
3. Clicar **Salvar global**.
4. ✅ A tabela inteira recalcula **na hora** — atacado estimado e os dois líquidos por m².

> Valor fora de faixa (ex.: comissão 150%) é **recusado** com mensagem; os números
> anteriores ficam intactos. Markup aceita 0 (piso = varejo); alíquotas e comissão vão de 0 a 100%.

### 4.3 Trocar o cenário tributário (atalho de impostos)
Na seção global há três botões: **Conservador / Base / Otimista**. Clicar preenche as duas
alíquotas com os valores do cenário; depois você pode **ajustar uma à mão** — aí o rótulo
vira **"ajustado"** e o valor manual prevalece.

| Cenário | Alíq. Intermediação | Alíq. White Label |
|---|---|---|
| Conservador | 6,0% | 4,6% |
| **Base** (default) | 10,2% | 6,2% |
| Otimista | 12,7% | 7,8% |

### 4.4 Cadastrar o piso real de um produto (quando o fornecedor fechar)
Na tabela, coluna **Piso /m²** do produto:
1. Digitar o custo real de atacado (ex.: `95`) e clicar **✓**.
2. ✅ A coluna **Origem** muda de **"estimado"** para **"real"** e o cálculo passa a usar 95
   (não mais `varejo ÷ markup`) **só naquele produto**.
3. Para voltar a estimar por markup: **apagar** o campo e ✓.
4. Se o piso ficar **acima** do varejo, aparece **⚠ prejuízo** (não bloqueia — só avisa).

### 4.5 Criar uma linha (ex.: "premium") com parâmetros próprios
1. No fim dos Parâmetros editáveis: digitar o nome em **Nome da nova linha** → **+ Linha**.
2. Preencher só os campos que diferem do global (ex.: Markup 50%); os campos em branco
   **herdam o global**. Clicar **Salvar linha**.
3. Na tabela, no produto desejado, escolher essa linha na coluna **Linha**.
4. ✅ Só os produtos daquela linha usam os parâmetros dela. Precedência:
   **SKU > linha > global** (um override no próprio produto vence a linha).

### 4.6 Marcar a modalidade-alvo de um produto
Na coluna **Modalidade** de cada produto, escolher **Intermediação** (padrão) ou
**White Label**. É isso que aloca o item na leitura **"Real por modalidade oficial"** (§3).
Sem marcar = Intermediação.

### 4.7 O histórico não muda quando você edita (snapshot)
Quando um pedido é **pago**, os parâmetros usados ficam **congelados naquele pedido**.
Editar markup/comissão/impostos depois muda **só a simulação do catálogo** — o que já foi
apurado nos pedidos pagos **não se altera**. É o que torna o número confiável ao longo do tempo.

---

## 5. Como ler a tabela do catálogo

| Coluna | Significado |
|---|---|
| **Produto** | o porcelanato (slug) |
| **Varejo/m²** | preço de venda minerado do concorrente |
| **Piso /m²** | atacado — editável; vazio = estimado por markup |
| **Origem** | **real** (piso cadastrado) ou **estimado** (por markup); **⚠ prejuízo** se piso > varejo |
| **Linha** | grupo de parâmetros aplicado (ou *global*) |
| **Modalidade** | centro oficial do produto (Intermediação / White Label) |
| **Interm. líq./m²** | líquido por m² se vendido como Intermediação |
| **WL líq./m²** | líquido por m² se vendido como White Label |
| **Vence** | qual centro dá mais líquido (verde = Intermediação, azul = White Label) |

---

## 6. Receitas rápidas

- **"Negociei outra comissão com o fornecedor"** → Parâmetros globais → ajustar Comissão →
  Salvar global. (Se for só de uma linha, edite a linha.)
- **"O contador fechou a faixa de imposto"** → aplicar o preset mais próximo e ajustar a
  alíquota à mão → Salvar global.
- **"Fornecedor fechou; tenho o piso real de 8 produtos"** → cadastrar o piso em cada um
  (§4.4); eles viram "real" e o resto segue estimado.
- **"Quero ver se vale a pena fazer White Label na linha premium"** → marcar esses produtos
  como **White Label** na coluna Modalidade e comparar **Interm. líq.** vs **WL líq.**.

---

## 7. Cuidados / limites

- **Markup 0%** zera o spread (piso = varejo) — permitido, exibido como tal.
- **Última gravação vence** (sem trava de concorrência) — não editar de duas abas ao mesmo tempo.
- **Pedido pago antes desta feature** aparece marcado **"sem snapshot"** e é apurado com os
  parâmetros vigentes (não inventa histórico).
- A tela **não muda a fórmula** dos centros — só a origem dos números. A mecânica jurídica/
  fiscal continua a de [[legal-fin]] / [[anexo-A-intermediacao]] / [[anexo-B-white-label]].

## Depende de

- [[modelo]] — markup/take rate e a âncora R$9.100/R$7.000.
- [[anexo-A-intermediacao]] — comissão + excedente como receita de serviço.
- [[anexo-B-white-label]] — quando a revenda (WL) se aplica.
- [[projecao-financeira]] — alíquotas por cenário (Conservador/Base/Otimista).
