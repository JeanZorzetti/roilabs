---
tipo: hub
status: vivo
---

# 🗺️ Mapa Empresarial — ROI Labs Hub

Este vault **é** o mapa. Não leia de cima a baixo: abra o **Graph View** (ícone de grafo na barra lateral) e você vê a empresa inteira como nós ligados. Cada nó é uma decisão; cada seta é uma dependência.

> [!tip] O grafo é o mapa, os backlinks são o alarme
> Quando você abre um nó, o painel **Backlinks** (canto inferior direito) mostra *quem depende dele*. Mudou uma decisão? Os backlinks são exatamente a lista do que revisitar. Você não mantém isso à mão — o Obsidian mantém.

> [!info] Estado atual — Polo 1
> **Goiânia** · nicho âncora **revestimentos/porcelanato** · subdomínio `goiania.roilabs.com.br`.
> Pendências: validar volumes no Keyword Planner, fechar 1º fornecedor, estrutura jurídica em [[legal-fin]] (com contador). Detalhes em [[handoff]].
> **Dev (Jean):** o que falta no código/deploy está em [[proximos-passos-dev]].

## As duas relações (o que evita você se perder)

- **Pasta = filiação** (X faz parte de Y). É a árvore, a estrutura de posse.
- **`depends_on` = dependência** (mudar X obriga revisitar Y). É o grafo, as setas.

Um nó *mora* em uma pasta só, mas *se liga* a vários. `pricing` mora em `30-modelo`, mas depende de `mercado` **e** de `oferta`.

## Ciclo de vida de cada nó (campo `status`)

| status | significado | o que fazer |
|--------|-------------|-------------|
| `draft` | rascunho, decisão ainda aberta | escrever, decidir |
| `decided` | decisão **congelada** | mexer aqui = propagar |
| `stale` | um upstream mudou, ficou desatualizado | revisar e voltar pra `decided` |

**Regra de propagação:** ao mudar um nó `decided`, abra os Backlinks dele e marque cada dependente como `stale`. Pronto — sua lista de "o que revisitar" se monta sozinha.

## A árvore (filiação)

- **[[tese]]** — a raiz. Tudo depende daqui.
  - [[mercado]] — nicho, hiper-localismo, ICP do fornecedor
  - [[oferta]] — o que a ROI Labs entrega (infra + White Label)
  - [[modelo]] — margem dupla, take rate, unit economics
  - [[gtm]] — pSEO programático, subdomínios regionais, FOMO
  - [[operacao]] — SLA, event-driven, multitenant, deploy
  - [[legal-fin]] — estrutura societária, runway, riscos
  - [[time]] — Customer Success, curadoria comercial

## Execução e medição (fora do DAG estratégico)

Notas operacionais — não são nós de decisão, não têm `depends_on`:

- **`80-dev/`** — execução dev/ops: [[proximos-passos-dev]] (lista ativa), [[backlog-pendencias]] (estacionado), [[merchant-center]] e [[meta-catalog]] (docs de ops dos feeds). **Regra: todo doc novo nasce aqui, não em `docs/` do repo.**
- **`90-medicao/`** — dados que a automação escreve sozinha: [[rank-tracking]] (snapshot semanal, cron de segunda) + `rank-tracking.csv` (histórico) + exports do GSC. Não editar à mão.

## Fontes (documentos originais, não editar)

- [[Blueprint Estratégico_ Hub de Infraestrutura Digital ROI Labs]] — blueprint linear de origem
- [[Pesquisa Hub E-commerce ROI Labs]] — pesquisa de apoio
- `ROI Labs_B2B_Infrastructure_Blueprint.pdf` — versão PDF

## Opcional: dashboard "o que revisar"

Se instalar o plugin **Dataview**, cole isto em qualquer nota para ver os nós desatualizados em tempo real:

````
```dataview
TABLE status, depends_on FROM "" WHERE status = "stale"
```
````

## Como criar um nó novo

Copie `_template.md`, mova pra pasta certa, preencha `depends_on` com os `[[nós]]` de que ele depende. O grafo se atualiza sozinho.
