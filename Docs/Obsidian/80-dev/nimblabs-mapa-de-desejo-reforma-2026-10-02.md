---
tipo: análise
status: proposta (aguarda Jean e sócios)
data: 2026-10-02
dono: Jean
---

# nimblabs: Mapa de Desejo do produto da reforma tributária de 2027 (02/10/2026)

Pedido do Jean (02/10): a nimblabs é **1º fábrica de software sob demanda** e **2º um produto para a reforma tributária
de 2027**. Este mapa continua o adendo do [[nimblabs-mapa-de-desejo-2026-09-29]] (seção 9, produto B), que mandou
"manter e priorizar" o saneamento do cadastro fiscal. O produto ainda não foi vendido nem construído. Método: skill
`desire-positioning`, que exige **3 evidências, de 2 tipos, com pelo menos 1 revelada**.

**Resumo em 5 linhas**
1. O desejo é real e está crescendo: "reforma tributária 2027" foi de 90 para 5.400 buscas/mês em 12 meses, e
   "cclasstrib" tem 9.900/mês, com pico de 22.200 em jan/26.
2. Só que quem busca quer **fazer sozinho** ("tabela", "consulta", "por ncm", "planilha", "excel"). A categoria
   "saneamento/revisão de cadastro" tem **busca zero** em 8 variantes.
3. **A sugestão de cClassTrib por item virou commodity:** o ClassTrib vende 40 mil consultas por R$ 197 vitalício,
   a Conta Azul sugere o código a partir do NCM sem custo extra e há pelo menos 6 ferramentas prometendo "classificar em lote".
   Os R$ 25 mil do spec não se sustentam vendendo **a sugestão**.
4. O que as ferramentas não fazem é o trabalho de fábrica: **pôr o cadastro certo dentro do sistema que a empresa
   usa e provar com as notas que ela já emitiu**. Isso vale principalmente para quem tem sistema próprio, legado ou
   mais de um sistema. É hipótese, com evidência fraca de desejo (busca "ERP + reforma" com CPC alto).
5. Decisão: **não construir SaaS de classificação.** Vender um diagnóstico pago a partir dos XMLs antes de escrever
   código, com o saneamento e a atualização do sistema como continuação.

## 1. Modo e comprador

**Modo:** criar, sobre o produto B que já está no site (`/saneamento-cadastro-fiscal`, `publicado: false`,
R$ 25 mil + R$ 2.500/mês).

| Comprador candidato | Quem paga | Quem usa | Quando a dor morde |
|---|---|---|---|
| Empresa do regime normal (lucro real/presumido), média | dono ou financeiro | fiscal interno | destaque obrigatório na NF-e desde 03/08/2026; a rejeição automática foi adiada sem data nova (fontes divergem, ver nota) |
| Empresa do Simples Nacional | dono | contador dela | **01/01/2027**: campos de IBS/CBS obrigatórios e com validação (LC 214/2025, Resoluções CGSN 190 e 191/2026) |
| Escritório de contabilidade | dono do escritório | analista fiscal | revisa o cadastro de toda a carteira até a virada |

O "2027" do pedido é a virada do Simples e a CBS cobrada de verdade. Só que o Simples paga pouco e já tem o ERP e o
contador fazendo o trabalho (E22). Para uma fábrica, o comprador que sobra é a **empresa média cujo sistema não
foi atualizado por um fornecedor de ERP**. Esse recorte **não foi medido** (critério 4).

Nota sobre a rejeição: a Conta Azul fala em "rejeição, advertências e multas" e cita a nota da Receita de que não
há multa nos 90 dias após o regulamento. O CRC-BA e a Jettax dizem que a rejeição automática de 03/08/2026 foi
adiada sem data. A Sittax e a Meira Fernandes dizem que a Sefaz valida em tempo real. **Nenhuma dessas frases vai
para a página sem a revisão do contador parceiro** (regra 1 do spec do site).

## 2. Desejo em 1 frase (palavras da busca)

> "Quero a **tabela do cClassTrib** para o meu NCM e saber **o que muda em 2027**, sem a nota travar."

O desejo é **funcional** ("tabela", "consulta", "por ncm", "o que é"). O emocional, "não quero o faturamento
travado", aparece em fornecedor e em associação (Fenacon: "pode travar o faturamento"), mas **não foi medido na voz
do cliente**.

## 3. Evidências (lidas em 02/10/2026)

| # | Fonte | Número | Janela | Nível |
|---|---|---|---|---|
| E16 | DataForSEO, Brasil | **cclasstrib 9.900** (12.100 em jul–ago/26; pico 22.200 em jan/26) · **tabela cclasstrib 2.900** · o que é cclasstrib 480 · tabela cclasstrib excel 390 · cst cclasstrib 260 · consulta cclasstrib 210 · cclasstrib por ncm 170 · planilha cclasstrib 170 · tabela nbs 3.600 · consulta ncm 12.100 | set/25–ago/26 | 2 revelada |
| E17 | DataForSEO, Brasil | **reforma tributária 2027: 90 → 5.400** · "…2027 o que muda": 0 → 1.900 · reforma tributária simples nacional 1.600 (2.400 em ago/26) · **ibs cbs nota fiscal: 30 → 2.400** (ago/26, o mês em que o destaque virou obrigatório) · nota fiscal reforma tributária 390 · cclasstrib simples nacional 90 | set/25–ago/26 | 2 revelada |
| E18 | DataForSEO, Brasil | **sem volume:** saneamento cadastro fiscal · saneamento de cadastro de produtos · revisão de ncm · revisão de cadastro de produtos · saneamento fiscal · empresa de classificação fiscal · diagnóstico reforma tributária · checklist reforma tributária. Com volume, porém pouco: consultoria reforma tributária 90 (CPC R$ 6,86, alta) · erp reforma tributária 40 (CPC R$ 3,91, alta) · saneamento de cadastro 30 (CPC R$ 8,37) · software reforma tributária 20 (CPC R$ 5,09, alta) | 12 meses | 2 revelada |
| E19 | DataForSEO, Brasil: "[meu sistema] + reforma" | totvs 260 (CPC R$ 3,87) · iob 320 · sap 50 · bling 50 · sankhya 40 (CPC R$ 5,51) · senior 30 · omie 20 · conta azul, protheus, linx 10 cada | 12 meses | 2 revelada |
| E20 | DataForSEO, marcas fiscais | Qive 27.100 · e-Auditoria 9.900 · ROIT 3.600 · Mastersaf 2.400 · Tax Group 1.600 · Becomex 1.600 · Systax 1.300 · Dootax 1.300 · **ClassTrib 880** (390 → 1.600 no pico) · Taxcel 590 · Revizia 480 | 12 meses | 2 revelada¹ |
| E21 | Preço que o mercado pratica | **ClassTrib:** R$ 97 (4 mil consultas), R$ 147 (15 mil), R$ 197 (40 mil), vitalício, "classifique milhares de produtos em minutos"; o contador público do site marca 0 clientes. **RS Company:** classificador white label para escritório contábil, com cobrança sugerida de R$ 350–800 por CNPJ/mês ao cliente (o preço que o escritório paga não é informado) | páginas lidas em 02/10 | 1 revelada (fraca²) |
| E22 | Recurso incluso no que o cliente já paga | **Conta Azul:** "sugere automaticamente o cClassTrib e os demais dados fiscais a partir do NCM", e o cliente confere. **Omie:** cenários fiscais configuráveis com CST e cClassTrib. e-Auditoria e Fiscontech vendem análise em lote para escritório contábil | central de ajuda / páginas, 02/10 | 1 revelada (hábito pago) |
| E23 | Pesquisas | V360 (355 empresas médias/grandes): 72% não preparadas, 24% com ERP pronto, 67% sem validação automática de documento. FGV Ibre: 77% em estágio médio ou avançado | 2025–2026 | 5 induzida (as duas se contradizem) |
| — | Voz do cliente (Reclame Aqui, fórum Contábeis, motivo de perda) | nada encontrado; o fórum não está indexado | — | **não medido** |
| — | Painel `/admin` da nimblabs | 0 leads; site em homologação com `noindex` | até 29/09 | **não medido** |

¹ Busca de marca é em boa parte login de quem já paga. Prova que o hábito é pago, e não que há demanda nova.
² Preço de lista sem prova de venda. O ClassTrib mostra 0 clientes, e o R$ 350–800 é o que o fornecedor sugere ao revendedor.
Consultas salvas em `nimblabs/docs/demanda/dataforseo-reforma-2026-10-02T143748-*.json` (US$ 0,18).

Mínimo da regra de ferro: **cumprido** para o desejo e para os vereditos de "não construir SaaS" e "não liderar com
a sugestão" (5 reveladas + 1 induzida). **Não cumprido** para o comprador recomendado nem para o preço, que saem
como hipótese com critério.

## 4. Forças (JTBD), para a empresa média

| Força | Leitura | Evidência |
|---|---|---|
| Empurrão | calendário legal: NF-e do regime normal desde 03/08/2026; Simples em 01/01/2027. A dor só morde quando a rejeição ligar, e hoje ela está adiada | E17 (pico em ago/26); a data da rejeição está **não medida** |
| Atração | "classificar em minutos" já é prometido por todos | E21, E22 |
| Ansiedade | "e se o código estiver errado, de quem é a culpa?". Todo fornecedor se isenta ("não substitui o profissional") | disclaimers de E21/E22; **não medido** no cliente |
| Hábito | **forte**: o ERP sugere, o contador faz, a tabela grátis está em blog, e as ferramentas fiscais são pagas | E16 (faça você mesmo), E20, E22 |

Produto que entra aqui perde em hábito, não em atração. A sugestão de código não vence o "o meu ERP já faz". Quem
não tem esse hábito disponível é a empresa cujo sistema **não** é de um fornecedor de ERP que atualiza sozinho.

## 5. Consciência e sofisticação

- **Consciência:** o comprador sabe que existe solução e busca pelo mecanismo ("tabela cclasstrib", "cclasstrib por
  ncm") ou pelo sistema que já usa ("totvs reforma tributária"). Lidere com o **mecanismo**, e não com a dor: o
  medo da reforma já está em todo blog.
- **Sofisticação: alta.** ClassTrib, e-Auditoria, Fiscontech, RS Company, NexaTax, Systax e os próprios ERPs dizem
  "classifique em lote, com IA". Prometer mais rápido ou mais preciso não diferencia. O mecanismo novo candidato:
  **"conferimos com as notas que você já emitiu e deixamos o seu sistema emitindo certo"**.

## 6. Matriz melhor × desejado

| | Somos melhores | Somos piores ou iguais |
|---|---|---|
| **Desejado** | **Pôr o cadastro certo dentro do sistema**, inclusive sistema próprio, legado ou mais de um (ERP + loja + PDV). É o ofício da fábrica e o produto C. Desejo com evidência fraca (E19, CPC alto em E18). Liderar com isso | **Sugestão de cClassTrib por item** (E16). Somos iguais ou piores que R$ 197 vitalício e que o ERP. Tratar como piso: usar a tabela oficial, **sem investir para ser melhor** |
| **Não desejado** | "IA", "relatório de divergências", "contador parceiro" como título: não tem busca. Fica na página como prova, não como promessa | SaaS de classificação próprio. Ignorar |

## 7. Decisão

**Construir:** nada antes do primeiro sinal pago. O que vier depois é **ferramenta interna** e não SaaS: um script que
lê os XMLs de NF-e/NFS-e e o cadastro e aponta o item sem cClassTrib, o CST incompatível com o cClassTrib e o NCM
inexistente. A equipe usa para entregar o diagnóstico em dias.

**Oferta (vender antes de construir):**
1. **Conferência de 1 nota, à mão, pelo WhatsApp:** "manda um XML e dizemos se a sua nota já sai pronta para 2027".
   Não há código: um sócio abre o XML. É o passo que qualifica, e não a métrica de desejo.
2. **Diagnóstico pago:** os XMLs dos últimos 3 meses mais o cadastro viram a lista do que vai travar e por quê.
   O preço fica com os sócios. O critério é qualquer valor acima de zero.
3. **Saneamento + atualização do sistema:** é o atual produto B (R$ 25 mil + R$ 2.500/mês), agora vendido como
   continuação do diagnóstico e não como porta de entrada. Quando o sistema é próprio, isso é sob medida, que é o 1º produto da empresa.

**Consertar primeiro:** o contador parceiro (insumo 6, prazo 20/10). Sem ele, nenhuma afirmação fiscal vai ao ar e
o diagnóstico não sai com o nome de ninguém. Continua sendo o caminho crítico.

**Parar:**
- Liderar a página B com "sugestão de NCM, NBS e cClassTrib" (o título, o terceiro entregável e a FAQ).
- Qualquer plano de SaaS de classificação, de consulta de cClassTrib ou de white label para contador antes de sinal
  pago. São seis ou mais concorrentes, e o ERP já faz de graça.
- SEO para "saneamento de cadastro fiscal": a busca é zero (E18). A página continua existindo como prova para quem
  chega por contato direto ou por contador.

**Dizer (promessa em 1 frase para a `conversion-copy`):**

> Conferimos as notas que a sua empresa já emitiu, corrigimos o cadastro e deixamos o seu sistema emitindo
> com IBS e CBS antes de janeiro de 2027.

"Notas", "IBS e CBS" e "2027" vêm da busca (E17). "Deixamos o seu sistema emitindo" é a hipótese em teste. Antes de
ir à página, a promessa passa pela `saas-legal` (é promessa de resultado) e pelo glossário: nunca "garantimos". A
classificação final é validada pelo responsável fiscal do cliente.

## 8. Critério de confirmação

| # | Decisão | Confirma se | Fonte | Até |
|---|---|---|---|---|
| 6 | Contador parceiro (mantido do 29/09) | parceiro assinado, revisando as regras | contrato | 20/10/2026 |
| 8 | Há quem queira a conferência | **≥ 5 empresas mandam XML** para conferir | notas do `/admin` + WhatsApp | 15/11/2026 |
| 9 | Comprador = sistema próprio/legado | **≥ metade** das empresas que mandaram XML emitem por sistema próprio, legado ou por mais de um sistema. Se a maioria usa TOTVS, Omie ou Bling, o mecanismo "atualizamos o seu sistema" cai e o canal vira o escritório de contabilidade | notas do `/admin` | 31/12/2026 |
| 7 | Desejo vira dinheiro (mantido do 29/09) | **≥ 1 diagnóstico pago**, qualquer valor acima de zero | extrato + `/admin` | 31/01/2027 |

Com 0 diagnóstico pago em 31/01/2027, o produto B sai do site e a reforma vira só argumento da página de sob medida.

**Hipóteses que caíram em 02/10 (não repetir):**
- "O comprador procura saneamento ou revisão de cadastro": as 8 variantes têm volume zero (E18).
- "A sugestão de código por item sustenta R$ 25 mil": o mesmo trabalho sai a R$ 97–197 vitalício e vem incluso no
  ERP (E21, E22). Os R$ 25 mil só se sustentam se incluírem o trabalho dentro do sistema.
- "72% despreparadas = demanda": é pesquisa induzida, e a FGV diz o contrário (E23).

**Fora deste mapa (crescendo, sem prova de pagamento):** "split payment" foi de 18.100 para 135.000 em jul–ago/26,
"apuração assistida" de 880 para 14.800 e "calculadora reforma tributária" tem 2.400. É o desejo de entender o
impacto da reforma no caixa. Não foi medido quem paga por isso, nem se há ferramenta oficial grátis.

## Fontes

- Volumes: DataForSEO `keywords_for_keywords` e `search_volume`, Brasil, pt, lidos em 02/10/2026 (US$ 0,18), salvos em `nimblabs/docs/demanda/`.
- ClassTrib: https://classtrib.com/novo/
- e-Auditoria, Tributação na Reforma: https://www.e-auditoria.com.br/ofertas/lm-tributacao-na-reforma/
- RS Company, white label: https://recuperasimples.com.br/white-label-do-classificador-fiscal-a-receita-recorrente-do-seu-escritorio/
- Fiscontech: https://www.fiscontech.com.br/post/reforma-tribut%C3%A1ria-na-pr%C3%A1tica-escrit%C3%B3rio-cont%C3%A1bil-est%C3%A1-preparado-para-classificar-produtos-revisar
- Conta Azul, multa e preenchimento: https://ajuda.contaazul.com/hc/pt-br/articles/45282194549261
- Omie, IBS e CBS: https://ajuda.omie.com.br/pt-BR/articles/13291407-configurando-o-ibs-e-o-cbs-no-omie
- Simples em 2027: https://www.jettax.com.br/blog/simples-nacional-e-mei-ibs-e-cbs-na-nota-fiscal-em-2026-entenda-as-regras/ · https://fenacon.org.br/reforma-tributaria/empresas-do-simples-precisam-preparar-sistemas-para-novas-regras-das-notas-fiscais-em-2027/
- Rejeição adiada: https://www.crcba.org.br/fisco-adia-preenchimento-do-ibs-e-cbs-nas-notas-fiscais-como-fator-de-rejeicao-mas-obrigacao-legal-permanece-a-partir-de-janeiro-de-2026/
- Pesquisas: https://timesbrasil.com.br/brasil/empresas-nao-preparadas-reforma-tributaria-levantamento-v360/ · https://agenciabrasil.ebc.com.br/economia/noticia/2025-11/pesquisa-mostra-que-empresas-nao-se-adaptaram-para-reforma-tributaria
