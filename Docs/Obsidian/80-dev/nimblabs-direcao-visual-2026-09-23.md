---
tipo: decisão
status: vivo
data: 2026-09-23
dono: Jean (dev)
---

# nimblabs: direção visual escolhida, Placa

Tarefa 3 do [[nimblabs-site-plano-2026-09-23]], com a `art-direction` (passos 0 a 3). A marca é a atual, mantida pelo Jean: Archivo 800 com o "b" aberto, âmbar `#E8A33D` sobre placa `#1C1F23` ([[nimblabs-marca-2026-09-23]]).

## Referências abertas

O setor foi usado a pedido do Jean, só para mapear o lugar-comum e os mecanismos, nunca composição, paleta ou fonte.

| Referência | Matéria | Motor | Banda | O gesto |
|---|---|---|---|---|
| cheesecakelabs.com | luz (faixas azuis) | autônomo | escura | faixas de luz azul varrendo da borda direita |
| codeminer42.com | luz + ilustração | autônomo | escura | cone de lanterna do mascote iluminando o título |
| thoughtbot.com | geometria + foto | estado | escura | rostos da equipe como prova, em formas coloridas |
| softdesign.com.br | campo (partículas) | autônomo | escura | onda de partículas azuis "de IA" |
| Placa de motor (Wikimedia, "typenschild") | metal gravado | estado | média | a grade de especificações gravada no metal, lida de relance |
| DANFE impressa | papel, caixas rotuladas | estado | clara | cada dado na sua caixa; o código de barras marca a identidade |

**Lugar-comum a evitar:** fundo escuro com título grande e fileira de números; faixa de logos; luz azul ou partículas; mascote; fotos recortadas em formas coloridas; "transformamos ideias em produtos digitais".

## As três propostas

1. **Placa (escolhida)** `custom:derivada-placa-de-identificacao` · geometria · estado · escura. Cada produto é uma placa de identificação de máquina em alumínio anodizado escuro, com gravação âmbar e uma grade com preço, prazo e entregáveis. **Não é** formulário ou carimbo de papel (o e-NR1).
   - Movimento: o texto aparece como gravação a laser; um brilho de metal passa sob o cursor; a placa do produto continua na página seguinte.
   - Custo: cerca de 2 kb de JavaScript, com a página visível em até 2,0 s.
   - Risco: a grade lembra formulário, o que se evita com metal escuro gravado, sem carimbo nem campo para preencher. E um objeto sozinho lê frio, então as fotos dos sócios entram como o lado humano.
2. **Tipo Cinético** (catálogo) · geometria · scroll · clara. A palavra "manual" do título se comprime até sumir no scroll, no eixo de largura da Archivo.
3. **Baralho** (catálogo) · pigmento · scroll · média. As fichas dos produtos se empilham no scroll, com preço e prazo na face.

**Escolha do Jean em 23/09/2026: Placa.** Ela continua a marca, cujo ícone já é uma placa, e põe preço e prazo no centro do visual. As outras duas vão para o `.art/log.json` como recusadas.
