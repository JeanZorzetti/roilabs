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

## Home construída (Tarefa 14, aprovada pelo Jean em 24/09/2026)

- **Estrutura "espécime":** a placa-mestra, com a marca do fabricante (o "b") em relevo; as placas de produto, com grade de preço e prazo; a peça sob medida, com o canto cortado; as etapas numeradas; e o fecho.
- **Uma ideia em todas as camadas, gravar:**
  - entrada: um feixe de laser passa sobre a placa-mestra;
  - rolagem: os valores de cada placa são gravados conforme ela entra na tela (CSS `view()`);
  - cursor: uma luz de oficina segue o ponteiro sobre o metal;
  - transição: o `view-transition-name` já está nas placas da home, e a outra ponta entra na Tarefa 15.
- **Gates: 32 de 32 aplicáveis passam**, contando o G34 e o G35, que foram julgados olhando os prints.
  - Reprovaram e foram corrigidos: G1 (tons neutros da placa passaram do matiz 255,6 para 245), G3 (título a 5,2 vezes o texto), G6 e G19 (brilho e sombra viraram tokens com temperatura), G18 (as sombras deixaram de ser preto puro), G7 (carimbo também no CSS da direção) e G26 (CLS 0,0098 → 0, com a Plex Mono pré-carregada).
  - Não se aplicam: G31, porque não há canvas, e G32 e G33, porque esta é a primeira entrada do `.art/log.json` e não há com o que comparar.
  - G10 passa por declaração: a transição está preparada nas placas da home, e a outra ponta entra na Tarefa 15.
  - G35 passa. As referências do setor foram pedidas pelo Jean e serviram só para mapear o lugar-comum. O mecanismo emprestado veio da placa de motor, de fora da web, e o par Archivo + Plex Mono vem da marca e da placa.
  - G34 passa, com ressalva. O topo tem cara de objeto: placa gravada, com a marca do fabricante em relevo. As placas de produto, vistas de longe, ficam mais perto de "três cards escuros", e o que as separa é a grade gravada e os rebites. E tudo escuro lê frio: o contraponto humano são as fotos dos sócios, quando chegarem.

### Prints (23/09/2026, nimblabs.com no ar)

![[nimblabs-direcao-visual/home-topo-1440.webp]]

![[nimblabs-direcao-visual/home-produtos-1440.webp]]

Celular (360 px) e a luz do cursor sobre uma placa:

![[nimblabs-direcao-visual/home-topo-360.webp]] ![[nimblabs-direcao-visual/home-luz-do-cursor.webp]]

## Custo

```
Faixa: marca
JS adicionado: 1,1 kb gzip (menu, aviso de cookies, luz do cursor; tudo inline, zero script externo)
LCP: 1,14 s (alvo 2,0 s), elemento = h1 · INP: sem medida de campo; TBT 0 ms · CLS: 0
Medição: Lighthouse 12 local, celular, 4G e CPU 4× simulados, mediana de 3 (API do PageSpeed sem cota em 23/09)
Fontes: Archivo variável (peso) 35 KB + IBM Plex Mono 500 15 KB, as duas pré-carregadas
Fallback: sem JS, as placas continuam compostas e o menu mostra todos os links; com movimento reduzido, sem laser e sem luz no cursor, com os valores visíveis
Fora do limiar bom de CWV? Não
```

## Visual em todas as páginas (Tarefa 15, 24/09/2026, aguardando aprovação)

- **Tokens:** saíram do escopo da home e valem no site inteiro.
- **Placa no topo de cada página:** produto, sob medida, contato, privacidade e 404 abrem cada um na sua placa, com rótulo gravado.
  - A placa do produto repete a grade do card da home (entrada, mensal e prazo). Ao clicar no card, ele vira essa placa na página seguinte, em 360 ms.
  - Com movimento reduzido, a página troca sem animação.
  - A placa do sob medida tem o canto cortado, como na home.
- **Formulário de contato:** os campos são rasgos na placa. O erro fica no campo e num resumo com links que levam ao campo, e o vermelho tem contraste de 5,5 a 7,8:1.
- **Tabela do exemplo de relatório (produto B):** no celular, rola de lado com a coluna do item fixa. Foi conferida com dado de teste, porque o exemplo real ainda depende do contador parceiro.
- **Aviso de cookies:**
  - pelo teclado, é alcançado logo depois do "Pular para o conteúdo";
  - no celular, fica fora da primeira tela e aparece na primeira rolagem;
  - com foco ou com movimento reduzido, aparece na hora.
- **Imagem de compartilhamento:** agora é o "b" âmbar sobre a placa, com o nome embaixo. O símbolo ocupa 31% da altura e sobrevive ao recorte quadrado.
- **Medido no ar (nimblabs.com, 360, 768 e 1440 px):**
  - CLS 0 em todas as páginas. Uma única leitura de 0,0079 na home, na primeira carga logo após o deploy, não se repetiu em 5 medições.
  - 5 requisições por página e nenhum serviço de terceiros.
  - Um h1 por página, nenhum link ou botão sem nome e títulos em ordem.
  - Console limpo; a única linha é o próprio 404 da página de erro.
  - Alvos de toque de pelo menos 44 px.

![[nimblabs-direcao-visual/produto-1440.webp]]

![[nimblabs-direcao-visual/contato-768.webp]] ![[nimblabs-direcao-visual/produto-360.webp]]

![[nimblabs-direcao-visual/og.webp]]
