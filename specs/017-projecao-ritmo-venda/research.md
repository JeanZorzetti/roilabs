# Research — 017 Projeção do ritmo de venda

**Data:** 2026-09-28 · **Spec:** [spec.md](spec.md)

Cada decisão segue o formato Decision / Rationale / Alternatives. Os números que vão para a tela ficam
em `app/src/lib/projecao.ts` com a mesma fonte e data escritas aqui. Se mudar um número, mude os dois.

---

## D1 — Fonte de volume: Google Ads `search_volume/live` da DataForSEO

- **Decision:** `POST /v3/keywords_data/google_ads/search_volume/live`, 1 tarefa por consulta, com os termos da lista,
  `language_code: "pt"` e a região (D12).
- **Rationale:** é a mesma fonte e a mesma conta usadas no roihub (spec 057). Fatos conferidos em 28/09/2026:
  - preço de **US$ 0,09 por requisição**, qualquer número de termos até 1.000 (`/v3/appendix/user_data`, chamada grátis);
  - termo com no máximo **80 caracteres e 10 palavras**; emoji e símbolo UTF são recusados;
  - `search_volume` é a média mensal e vem **`null` quando não há dado**; `monthly_searches` traz os últimos 12 meses;
  - "Google Ads provides combined search volume values for groups of similar keywords" (D5);
  - limite de **12 requisições por minuto** por conta, que nunca é atingido com um operador só.
- **Alternatives:** `keywords_for_keywords` (usado no roihub) devolve termos sugeridos, e o dono decidiu que os
  termos vêm da conversa com o Claude. Search Console não serve, porque a loja é nova e não tem impressão.

## D2 — Dificuldade: DataForSEO Labs `bulk_keyword_difficulty/live`, chamada ANTES do volume

- **Decision:** `POST /v3/dataforseo_labs/google/bulk_keyword_difficulty/live` com `location_code: 2076`
  (Brasil) e `language_code: "pt"`, sempre nacional, mesmo quando o volume é de uma cidade. A chamada de
  dificuldade vem **primeiro**. Se ela falhar, a de volume não acontece.
- **Rationale:** custa **US$ 0,012 por requisição + US$ 0,00012 por termo**, bem menos que o volume. Falhar na
  chamada barata não pode gastar a cara. `keyword_difficulty` é "0–100, escala logarítmica, chance de
  entrar no top 10", calculada pelos backlinks do domínio e da página dos 10 primeiros, e vem `null` sem dado.
  A base do Labs é por país, sem corte por cidade.
- **Alternatives:** a camada que o Claude marca à mão (cabeça, meio ou cauda) foi recusada pelo dono no clarify
  Q1 por ser julgamento, não medida. Um corte fixo por volume é arbitrário.

## D3 — A chave vai para produção (diferente do roihub D3)

- **Decision:** `DATAFORSEO_API_KEY` (Basic = base64 de `login:senha`) nas variáveis do `/app` na EasyPanel e
  em `app/.env.example`, sem o valor. É lida só no servidor (FR-013).
- **Rationale:** no roihub a consulta é um script local e produção nunca consulta. Aqui, consultar É a
  feature, e roda no servidor do admin atrás do login. A chave nunca chega ao navegador. Toda chamada paga
  exige sessão válida, e o teto de termos (D4) limita o custo de cada uma.
- **Alternatives:** chamar a API do navegador vazaria a chave. Um script local com colar o resultado quebra
  o SC-001 (3 minutos).

## D4 — Teto de 200 termos por consulta

- **Decision:** de 1 a 200 termos, depois de tirar os duplicados.
- **Rationale:** o pior caso é 0,09 + 0,012 + 200 × 0,00012 = **US$ 0,126**, que cabe no SC-004 (≤ US$ 0,15).
  Uma lista boa de nicho tem de 20 a 80 termos. O custo mostrado é a soma dos `cost` que as duas tarefas
  devolvem, não uma estimativa.
- **Alternatives:** 1.000 termos (o limite da API) custaria US$ 0,222 e estouraria o SC-004.

## D5 — Variantes: série mensal idêntica conta uma vez

- **Decision:** dois termos com o **mesmo `search_volume` > 0 e os 12 valores de `monthly_searches` idênticos**
  formam um grupo. O volume conta uma vez, pelo primeiro termo da lista, e os outros aparecem como
  "agrupado com «x»". A **posição do grupo também é a do primeiro termo**, pela dificuldade dele: a dificuldade
  das outras variantes aparece na tabela, mas não entra na conta. Assim o termo que dá o volume é o mesmo que dá
  a posição. Antes da consulta, as linhas repetidas (sem diferenciar caixa, acento e espaço) caem.
- **Rationale:** o Google Ads devolve o volume combinado das variantes próximas (D1), e somar tudo triplicou
  a demanda da Tape Pro no roihub. Série de 12 meses idêntica é assinatura de grupo.
  `ponytail:` o teto é que dois termos sem relação, com séries iguais por acaso, viram um grupo. Isso só é
  provável em volume mínimo (10/mês), e a perda é no máximo o volume do menor. O upgrade seria agrupar
  também pelo texto normalizado.
- **Alternatives:** normalizar plural e acento no texto erra nos dois sentidos ("fita" e "fitas" às vezes têm
  volumes diferentes) e não explica o que o Google fez.

## D6 — CTR por posição: First Page Sage, setembro de 2026, com e sem resposta de IA

- **Decision:** `CTR(p) = s · CTR_comIA(p) + (1 − s) · CTR_semIA(p)` para p de 1 a 10. Posição acima de 10 conta
  **zero**.

  | Posição | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | Sem resposta de IA (%) | 22,6 | 10,2 | 5,8 | 3,7 | 2,5 | 1,8 | 1,3 | 0,9 | 0,7 | 0,5 |
  | Com resposta de IA (%) | 3,6 | 1,4 | 0,8 | 0,5 | 0,3 | 0,3 | 0,2 | 0,2 | 0,1 | 0,1 |

  Fonte: First Page Sage, *Google CTRs by Ranking Position*, dados de 01/03 a 31/08/2026, 1.184 domínios,
  3,67 bi de impressões, média de desktop e mobile nos EUA.

  | Cenário | s = fatia de buscas com resposta de IA | Fonte de s |
  |---|---|---|
  | Conservador | 81,6% | First Page Sage, set/2026: todas as buscas dos EUA. Resulta na curva média do relatório (posição 1 = 7,1%) |
  | Base | 14% | Visibility Labs, início de 2026: 20,9 mi de buscas de compra (BrightEdge, nov/2025: 13% das transacionais) |
  | Otimista | 14% | a mesma. O otimista se diferencia pela posição (D7) e pela conversão (D10) |

- **Rationale:** é a medição mais recente, e ela mudou o jogo: a 1ª posição média caiu de 39,8% (2025) para
  7,1%. Os termos da lista são de compra, e nesse tipo de busca a IA aparece em 13–14% dos casos (e não
  cresceu de um ano para o outro). O conservador supõe que a IA chegue aos termos de compra como já chegou
  à média das buscas. Não existe dado equivalente do Brasil. O "48% no Brasil" que aparece em blogs vem de uma
  fonte estrangeira sem recorte de país.
- **Alternatives:** AWR (jul/2026) mede só desktop nos EUA e só dá a posição 1 por intenção. O Backlinko (2023)
  é anterior ao AI Overview. O Ahrefs (dez/2025) mede só a redução causada pelo AIO (−58% na 1ª), sem curva
  absoluta.
- **Premissa:** a posição 11+ conta zero. O relatório só mede até a 10ª, e a 2ª página recebe menos de 1%.

## D7 — Dificuldade → posição alcançável, por cenário (premissa informada)

| Dificuldade | Conservador | Base | Otimista |
|---|---|---|---|
| 0–10 | 8ª | 5ª | 3ª |
| 11–20 | 10ª | 7ª | 5ª |
| 21–30 | fora do alcance | 10ª | 7ª |
| 31–40 | fora do alcance | fora do alcance | 10ª |
| > 40 | fora do alcance | fora do alcance | fora do alcance |
| não medida | tratada como 15 | tratada como 15 | tratada como 15 |

- **Rationale:** a loja da cadeira é um domínio novo sem backlink, e a dificuldade da DataForSEO mede
  justamente o backlink do top 10. O Ahrefs (estudo de 2025 sobre dados de 2023) mostra que **só 1,74% das
  páginas novas chega ao top 10 em um ano**, que 72,9% do top 10 tem mais de 3 anos e que só 13,7% tem menos
  de 1 ano. Por isso o conservador só alcança dificuldade ≤ 20, e nenhum cenário passa de 40. Termo sem
  dificuldade medida costuma ser cauda longa pouco disputada, e 15 é o meio da faixa alcançável no
  conservador.
- **Premissa declarada na tela:** a tabela não sai de um estudo de mercado, e isso fica escrito.
- **Alternatives:** usar a mesma posição para todos os termos foi recusado no clarify Q1. Uma fórmula contínua
  (posição = f(dificuldade)) daria precisão falsa a uma premissa.

## D8 — Rampa linear até o mês em que a posição se estabiliza (premissa informada)

- **Decision:** `captura(m) = min(1, (m − 1) / (M − 1))`: o mês 1 é zero (a loja entra no ar e é indexada), e
  M é o mês em que a posição se estabiliza: **conservador 9, base 6, otimista 4**.
- **Rationale:** o simulador já afirma que o orgânico leva de 3 a 6 meses para estabilizar. O Ahrefs mostra que
  as páginas que chegam ao top 10 costumam chegar cedo e que a chance cai depois de ~6 meses sem melhora. O
  conservador estica até o mês 9 para cobrir a loja sem autoridade nenhuma. Uma reta tem um parâmetro só e
  é fácil de defender na reunião.
- **Alternatives:** uma curva em S tem 2 parâmetros sem fonte para nenhum dos dois.
- **Efeito na spec:** a premissa "posição-alvo entre os meses 4 e 6" vira "entre os meses 4 e 9, conforme o
  cenário".

## D9 — 1 clique orgânico = 1 visita (premissa)

- **Decision:** o número de cliques estimado vira o de visitas (sessões) sem desconto.
- **Rationale:** as taxas de conversão das fontes (D10 e D11) são por sessão. Clique orgânico e sessão de
  entrada ficam próximos o bastante para uma projeção, e um desconto aqui seria outro número sem fonte.

## D10 — Conversão do e-commerce: Prax 2025 por setor, mediana de sessão → pedido

Fonte: **Relatório Prax de Benchmarks E-commerce Brasil 2025**, mais de 1.000 lojas ativas com faturamento
de pelo menos R$ 50 mil/mês, **medianas** por setor, todos os canais, publicado em 14/09/2026.

| Nicho (id) | Setor Prax usado | Base | Confiança |
|---|---|---|---|
| beleza | Cosméticos | 2,1% | média-alta |
| joias | Jóias/Semijóias | 1,1% | média-alta |
| moda | Moda Feminina (Masc. 0,9, Infantil 0,9) | 1,0% | alta |
| esporte | Esporte e Lazer (Moda Fitness 1,5) | 1,2% | média-alta |
| pet | Pet Shop | 1,2% | alta |
| suplementos | *proxy* Esporte e Lazer (sem linha de suplemento) | 1,2% | baixa |
| casa | Casa, Jardim e Decoração | 0,4% | alta |
| construcao | *proxy* Casa, Jardim e Decoração | 0,4% | média-baixa |
| ferramentas | Máquinas/Industriais | 0,7% | média |
| saude | Saúde | 0,5% | média-alta |
| brinquedos | Brinquedo/Diversão | 1,0% | alta |
| papelaria | Papelaria | 1,3% | alta |
| jardinagem | Casa, Jardim e Decoração | 0,4% | média |
| autopecas | *proxy* Máquinas/Industriais | 0,7% | baixa |
| alimentos | Alimentos e Bebidas | 3,3% | alta |
| eletronicos | Eletrônico e Informática | 0,5% | alta |
| agro | *proxy* Máquinas/Industriais | 0,7% | baixa |
| b2b | *proxy* Papelaria (suprimento padronizado de recompra) | 1,3% | baixa |

- **Cenários:** conservador = base × 0,7 e otimista = base × 1,3. **Premissa:** a amostra da Prax são lojas
  estabelecidas (≥ R$ 50 mil/mês, com avaliação e marca), e a loja da cadeira começa sem nada disso, o que
  pede o desconto do conservador. O otimista cobre o termo de compra orgânico, que converte acima da média
  de todos os canais.
- **Alternatives:** os números "Neotrust/Ebit por categoria" que circulam em blogs brasileiros não têm fonte
  primária localizável. Benchmarks estrangeiros (IRP, Dynamic Yield) usam categorias diferentes e o mercado
  dos EUA e do Reino Unido.

## D11 — Funis de SaaS (mensalidade) e de clínica (consulta)

**SaaS: visita → lead (trial ou demonstração) → assinatura**

| Degrau | Base | Fonte | Confiança |
|---|---|---|---|
| visita → lead | 1,83% | Leadster, *Panorama de Geração de Leads no Brasil 2026*, segmento Software (2.425 sites, dados de 2025, publicado em 06/07/2026) | média-alta |
| lead → assinatura | 18,2% | First Page Sage, *SaaS Free Trial Conversion Benchmarks*, trial opt-in de tráfego orgânico (86 SaaS, 2022–T3/2025, publicado em 05/09/2025) | média |

Cenários = base × 0,7 e base × 1,3 (a mesma premissa de D10). Por coincidência, o otimista da 1ª linha
(2,38%) fica igual à conversão média do canal orgânico no Leadster 2026 (2,39%).

**Clínica: visita → contato → agendamento → comparecimento**

| Degrau | Conservador | Base | Otimista | Fonte | Confiança |
|---|---|---|---|---|---|
| visita → contato | 2,85% | 4,07% | 5,29% | Leadster, *Panorama 2025*, segmento Saúde (base). Extremos = × 0,7 e × 1,3 | média |
| contato → agendamento | 18% | 25% | 35% | faixa de 18–35% sem automação relatada por fornecedores de software para clínica (Clint, Odonto Results, 2026). Não é estudo | baixa |
| agendamento → comparecimento | 72,2% | 75% | 85% | Dantas et al., *No-shows in appointment scheduling: a systematic literature review*, Health Policy, 2018 (falta de 27,8% na América do Sul) · falta de ~25% em consultório particular (Fácil Consulta, ByDoctor) · falta de 15% no otimista (a maioria das instituições privadas relata 5–20%) | média |

- **Premissa:** o "contato" junta formulário e WhatsApp. A parte que o mapa do Google leva numa busca local
  (13,1% de CTR médio nas posições 1–3, First Page Sage 2026) **não entra**, porque depende do Perfil de
  Empresa da clínica, e não do site da cadeira. Isso fica escrito em "o que a projeção não cobre".

## D12 — Região: Brasil ou cidade, com a lista de locais grátis da DataForSEO

- **Decision:** a região padrão é Brasil (`location_code: 2076`). Para cidade, um campo com `<datalist>`
  alimentado por `GET /api/projecao/cidades?q=`, que filtra no servidor a lista de locais do Brasil da
  DataForSEO (`/v3/keywords_data/google_ads/locations/br`, **grátis**) guardada em memória por 24 h. O volume
  usa o `location_code` da cidade. A dificuldade continua nacional (D2).
- **Rationale:** clínica atende uma cidade (edge case da spec), e o nome precisa ser o que a API aceita
  ("Goiania,State of Goias,Brazil"). `ponytail:` o cache fica na memória do processo e reinicia a cada
  deploy. Custa zero, porque a chamada é grátis. O upgrade seria um arquivo estático, se a lista pesar.
- **Alternatives:** uma lista fixa de capitais deixaria de fora o interior. Estado não foi pedido pela spec,
  e o campo de cidade já aceita digitar o nome de um estado se a lista trouxer esse local.

## D13 — Ponte para o simulador: query string

- **Decision:** `/admin/precos?nicho=<id>&ritmo=<número com ponto>&cenario=<id>#simulador`. A página do servidor
  valida (nicho existe, 0 ≤ ritmo ≤ 100.000, cenário conhecido) e passa o valor inicial ao `SimuladorCadeira`.
  Valor inválido é ignorado em silêncio, e o simulador abre como hoje (FR-011).
- **Rationale:** não grava nada (FR-012), dá para compartilhar por link e é recurso da própria plataforma.
- **Alternatives:** localStorage não aparece no link e some sem aviso. Guardar no banco violaria o FR-012.

## D14 — Sem persistência e sem cache de consulta paga

Confirmado da spec. O teto é de ~US$ 0,11 por refazer uma consulta, e o gatilho de upgrade é gastar mais de
US$ 5 por mês.

## D15 — Gráfico: SVG e CSS escritos à mão, zero dependência

- **Decision:** 12 barras verticais do cenário escolhido mais a linha da média do ano 1, em SVG inline. A cadeia
  e a comparação de cenários são barras de CSS (`width: %`).
- **Rationale:** o `package.json` não tem biblioteca de gráfico. Uma barra de 12 pontos é o caso "SVG à mão, 20
  linhas" (information-design, formas.md), e a constituição III põe o recurso da plataforma antes de uma
  dependência.
- **Alternatives:** Recharts custaria ~100 kb para um gráfico.
