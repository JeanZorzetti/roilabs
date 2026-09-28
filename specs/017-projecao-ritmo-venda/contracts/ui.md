# Contrato de UI — `/admin/projecao`

Saiu do `design-review` (disciplinas: information-design → usability → ux-writing → accessibility →
responsive). Não entram art-direction nem design-systems, porque a tela herda o admin light (`AdminShell`, tokens
`navy`/`gold`/`muted`/`card` de `vertice.css`) e é da mesma casa do `/admin/precos`. **Nenhum token novo.**

## Pergunta única (information-design, passo 1)

> **Quantas vendas por mês a busca orgânica tende a trazer para esta cadeira no ano 1, no cenário escolhido,
> e qual número eu levo para o simulador?**

- **Nível 1 (a resposta):** a média do ano 1 do cenário escolhido, em unidade do nicho, com o botão "Usar no
  simulador" colado a ela.
- **Nível 2 (a evidência):** ① os cenários comparados, ② a curva de 12 meses, ③ a cadeia da busca até a venda,
  ④ a cobertura da demanda (alcançável × fora do alcance).
- **Nível 3 (o contexto):** a tabela de termos, as premissas e fontes, e o que a projeção não cobre.

## Formas (information-design, passo 3)

### ① Cenários: 3 cartões de rádio com barra de comprimento
**Responde:** "quanto muda se eu for mais ou menos otimista?"
**Codifica:** a média do ano 1 de cada cenário → comprimento da barra, numa escala comum aos três, mais o número escrito.
**Descartei:** as 3 séries como linhas num eixo só. O conservador pode sair 10× menor que o otimista e ficaria
achatado nos 9% de baixo do plot, e ele é o cenário pré-selecionado (leituras recusadas, roihub 18/09:
"razão > 5 → o eixo compartilhado já não responde").
**Controle:** `<fieldset><legend>Cenário</legend>` com `<input type="radio">` nativo. As setas do teclado
funcionam sem JavaScript.

### ② Curva de 12 meses: 12 barras verticais do cenário escolhido + linha da média
**Responde:** "como o ritmo sobe até estabilizar, e onde fica a média que vai ao simulador?"
**Codifica:** vendas do mês → altura (a escala começa em 0 e vai até o máximo do cenário escolhido). A média do
ano 1 → uma linha horizontal tracejada em `gold-dark`, rotulada na ponta direita ("média 0,7"). Só o mês 12
leva rótulo de valor. Os outros ficam na tabela acessível.
**Descartei:** uma linha contínua. São 12 pontos discretos, e a resposta é a média das barras, que se lê pela
régua cruzando-as.
**Zero real** (os meses antes da rampa): um traço de 2 px sobre a linha de base e "0" na tabela. Barra de zero
não some.
**Custo:** SVG inline, ~40 linhas, 0 kb de dependência. 12 barras no pior caso.

### ③ Cadeia da busca à venda (mês estável em diante): lista de degraus
Cada linha tem `rótulo · n absoluto · taxa do degrau · fonte`, e uma **barra de 0–100% que codifica só a taxa
do degrau** (a escala é própria de cada linha, escrita "de 100%").
**Descartei:** um funil com a largura proporcional ao `n`. As ordens de grandeza (10.000 buscas → 30 cliques
→ 0,3 pedido) somem numa escala comum, e barra em log não codifica razão.
Linhas por modelo:
- pedido: buscas alcançáveis → cliques (CTR ponderado) → pedidos pagos;
- assinatura: … → cliques → leads → assinaturas;
- consulta: … → cliques → contatos → agendamentos → consultas comparecidas.

Cada degrau do funil tem "Usar a taxa do parceiro" (FR-009): um `<input inputMode="decimal">` que aparece
ao clicar. Quando preenchido, a fonte vira o selo "taxa do parceiro".

### ④ Cobertura da demanda: 1 barra empilhada 100%
Mostra `alcançável no ano 1` × `fora do alcance`, somadas por volume, com o número e o % escritos nos dois
lados. Abaixo, 1 linha de contagens: "3 termos sem volume medido · 5 sem dificuldade medida (contados como 15) ·
2 variantes agrupadas". Só aparece a contagem que for > 0.

### Tabela de termos: `pr-table pr-table--cards` (reuso da 016)
Colunas: Termo · Buscas/mês · Dificuldade · Posição (cenário escolhido) · Cliques/mês.
Ordena por buscas/mês, do maior para o menor. Os termos sem volume ficam no fim. `tabular-nums` e números à
direita. No celular, cada termo vira um cartão.

## Estados (information-design, estados.md)

| Estado | Onde | Como aparece |
|---|---|---|
| **ocioso** (nada consultado) | cartão do nível 1 | o único estado vazio de onboarding: 3 passos. 1) "Explique o nicho ao Claude e peça os termos de compra." 2) "Cole aqui, um por linha." 3) "Consulte (cerca de US$ 0,10)." O nível 2 e o 3 não são renderizados |
| **consultando** | cartão do nível 1 + nível 2 | esqueleto do mesmo tamanho do resultado; botão desabilitado "Consultando…"; `aria-busy="true"` na região de resultado |
| **erro de entrada** | no campo de termos | `aria-invalid` + mensagem ligada por `aria-describedby`, nomeando o termo e a regra. O resultado anterior continua |
| **erro de sessão, chave, saldo ou fonte** | cartão do nível 1 | bloco com moldura vermelha (padrão `DbErrorState`), com a causa nomeada e a ação (contracts/api.md). **Nunca** vira projeção 0 |
| **pronto** | tudo | a tela completa |
| **tudo fora do alcance** | nível 1 | `0 pedidos pagos/mês` + "Nenhum termo da lista é alcançável no ano 1 neste cenário: todos têm dificuldade acima de {limite}." O `{limite}` é o do cenário escolhido, lido de `POSICAO_POR_DIFICULDADE` (20 no conservador, 30 no base, 40 no otimista, research D7), nunca um número fixo. Zero real, com a explicação. O botão continua ativo |
| **menos de 1 venda/mês** | nível 1 | o número com 1 decimal ("0,7") + "≈ 8 no ano 1" + aviso: "Nesse ritmo, o orgânico sozinho não paga a anuidade: vale somar outros canais." Nunca arredonda para 1 |
| **sem volume / sem dificuldade** | célula da tabela | "sem volume medido" e "não medida · conta 15", em texto neutro. Nunca vermelho, nunca "0" |
| **variante agrupada** | célula da tabela | "agrupado com «fita gomada»"; o volume aparece riscado e não soma |
| **clínica com região Brasil** | aviso no nível 1 | "Clínica atende uma cidade: com Brasil, a demanda fica superestimada. Escolha a cidade." |
| **duplicados removidos** | abaixo do campo de termos | "2 linhas repetidas foram ignoradas." |

## Procedência (gate G32)

Uma linha no pé do cartão do nível 1: **"Buscas: Google Ads via DataForSEO, média mensal de set/25 a ago/26 ·
consultado em 28/09, 14:05 · conversão: Prax 2025 (Moda Feminina)"**. Cada degrau da cadeia leva a própria
fonte. O custo da consulta ("custou US$ 0,11") fica na mesma linha.

## Ordem e layout

- **≥ 1024 px:** a mesma grade do simulador (`lg:grid-cols-[1fr_380px]`). À esquerda: a entrada, depois ② ③ ④, a
  tabela e as premissas. À direita, **sticky**: o cartão do nível 1 (número, ① cenários, botão, procedência,
  avisos).
- **< 1024 px (390 px incluso):** uma coluna na ordem **entrada → nível 1 → ② → ③ → ④ → tabela → premissas**.
  Sem rolagem horizontal. Alvos de toque de 44 px nos rádios, botões e `summary`.
- Ao terminar a consulta, o foco vai para o `h2` do cartão do nível 1 (`tabIndex={-1}`). Quem usa leitor de
  tela ouve a resposta, e no celular a tela rola até ela.

## Acessibilidade

- O gráfico fica num `<figure>`, com o `<svg role="img" aria-labelledby>` (title + desc resumindo mês 1, mês 12
  e média) e `<details><summary>Números mês a mês</summary><table>` logo abaixo.
- O número do nível 1 fica numa região `aria-live="polite"`, como no simulador. A troca de cenário é anunciada.
- Contraste: as barras em `navy` passam de 4,5:1. A linha da média usa `gold-dark` (≥ 3:1), porque o `gold`
  puro tem ~2,6:1 sobre o branco e não carrega dado. A cor nunca é o único sinal: todo estado tem texto.
- Foco visível no padrão do admin (`focus-visible:outline-gold`).

## Números (numero.md)

- Vendas/mês: 1 decimal abaixo de 10 e inteiro a partir de 10. Buscas e cliques: inteiro com ponto de milhar.
  O arredondamento mora numa função só (`arredondarVendas`), usada pela tela e pela ponte do simulador: o número
  que "Usar no simulador" leva é o mesmo que está escrito ao lado do botão (contracts/api.md, Ponte).
- Taxas: 1 decimal. O CTR ponderado usa 2 decimais quando fica abaixo de 1% ("0,33%").
- Sempre por `Intl.NumberFormat('pt-BR')`, reusando `lerNumeroBR` de `lib/precificacao.ts` para ler o que o
  operador digita.

## Textos

Os textos acima são **rascunho**. A passagem de `ux-writing` acontece no implement, antes do primeiro commit da
tela, e confere o verbo do botão, os erros e o tom (fato, não mascote).
