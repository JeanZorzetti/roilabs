# Handoff — 013 motor de loja multicadeira

## 2026-08-07 — a spec nasceu; nenhuma linha de código foi tocada

> **BLUF:** existe agora uma spec para o `goiania` **parar de ser duas lojas coladas com fita**
> e virar um motor de loja que serve qualquer cadeira ocupada da carteira. Nada foi
> implementado: esta sessão produziu [spec.md](./spec.md) e o
> [checklist de qualidade](./checklists/requirements.md), ambos aprovados. **A próxima sessão
> começa em `/speckit-clarify`, não em código.**

---

## Por que esta spec existe (em uma tela)

Hoje o `goiania` tem **dois de tudo**: dois catálogos, dois carrinhos (**524 + 407 = 931
linhas**), duas tabelas de item de pedido (`itens_pedido` e `itens_pedido_fita`) e dois ramos
no mesmo endpoint de pedido. Abrir a loja da **terceira** cadeira ocupada, hoje, significa
copiar tudo isso de novo.

A própria spec 011 escreveu esse teto quando criou a duplicação:

> *"o teto é que uma terceira unidade de venda torna a duplicação insustentável. O caminho de
> upgrade — generalizar o item de pedido — fica registrado para quando isso acontecer."*

**A 013 é o saque desse teto.** Decisão do Jean em 07/08, escolhida entre três opções: construir
o **motor reutilizável** (catálogo, vitrine, carrinho, item de pedido e checkout escritos uma
vez), de modo que a cadeira nova seja **configuração + catálogo**, nunca código novo.

## A fronteira com a 012 — leia antes de abrir qualquer arquivo

| | spec 012 (aberta, 67/85) | spec 013 (esta) |
|---|---|---|
| o que faz | **publica** a página de cada cadeira: conteúdo, preço, botão | constrói o **motor** que a loja usa |
| entrega | 7 páginas de cadeira, 26 cadeiras cadastradas, migração de domínio | um carrinho, um item de pedido, uma vitrine |
| toca conteúdo? | sim, é o trabalho dela | **não, nenhum** |

🚩 **Não rode as duas no mesmo diff.** As duas mexem no mesmo site; juntas, nenhuma medição
(tráfego, receita, regressão) consegue apontar qual das duas causou o quê.

## Estado exato

| | |
|---|---|
| ✅ `spec.md` | 5 user stories (P1–P3), 19 FR, 7 SC, 6 edge cases, out-of-scope explícito |
| ✅ `checklists/requirements.md` | 16/16 itens passando, zero `[NEEDS CLARIFICATION]` |
| ✅ `.specify/feature.json` | aponta para `specs/013-motor-loja-multicadeira` |
| ⬜ `plan.md` · `tasks.md` | não existem ainda |
| ⬜ código | **zero arquivo tocado.** Nenhum branch, nenhuma migração |

## Ordem da próxima sessão

1. **`/speckit-clarify`** — as 3 decisões abaixo travam o plano. Não pule: cada uma muda
   comportamento visível ao comprador.
2. **`/speckit-plan`** — o Constitution Check vai cobrar Princípio II (verificação real) e III
   (YAGNI) explicitamente.
3. **`/speckit-tasks`** e só então **`/speckit-implement`**.

### As 3 decisões que o clarify precisa fechar

| # | pergunta | por que trava | sugestão |
|---|---|---|---|
| 1 | Comprador adiciona item de **outra cadeira** ao carrinho: recusa, troca ou dois carrinhos? | um pedido pertence a uma cadeira só (FR-005); sem regra, o carrinho aceita e o checkout falha | **recusar com aviso** — é a menor superfície e não perde o carrinho existente |
| 2 | **Parceiro sai da cadeira**: o que acontece com a URL que já ranqueava e com pedido pago não entregue? | URL que vira 404 depois de ranquear é destruição de ativo | decidir **antes** de existir a 3ª cadeira, não depois |
| 3 | Duas cadeiras com o **mesmo slug** de produto: como a URL e o carrinho desambiguam? | colisão silenciosa é a pior classe de bug de e-commerce | espaço de nomes por cadeira, mas **sem mudar as URLs de hoje** |

## O que MEDIR antes de tocar em código (baseline da migração)

O SC-003 exige igualdade exata de dinheiro antes/depois. **Leia o baseline do banco na hora,
não deste arquivo** — o número abaixo é de 07/08 e serve só para conferir que você está no
banco certo:

- `Pedido: 6` · soma dos totais **R$ 22.091,89** · `PAGOS: 0` · `mpPaymentId: 0`
- por vertical: porcelanato 2 (R$ 7.244,45 ×2, ambos duplicata) · fitas 4

```
2 × 7244,45  +  2461,05 + 2360,73 + 2361,19 + 420,02  =  22.091,89
```

Guarde também, antes de qualquer mudança: contagem de itens por pedido e preço unitário de cada
item. Total igual com item errado dentro é o falso-verde clássico desta migração.

## Armadilhas específicas desta feature

- 🚨 **`git push` em `main` É DEPLOY** (EasyPanel). Sem branch, sem PR — e esta feature mexe em
  caminho de dinheiro. Trabalhe em branch e só encoste em `main` com a verificação real na mão.
- 🚨 **`npm run build` no `site-goiania` submete ao IndexNow.** Build exploratório é
  `npx astro build`.
- 🚨 **As 99 URLs do sitemap são o único ativo orgânico do site** e o Google só as reconheceu em
  07/08 (FR-008). Refatoração que mova ou renomeie qualquer uma delas destrói isso, e o custo
  não aparece no build — aparece semanas depois no GSC.
- ⚠️ **`@default` do Prisma NÃO reescreve linha já gravada.** Foi assim que a 012 deixou 8
  cadeiras no default `'vaga'` sem nenhuma rodada de seed corrigir. Migração aqui é backfill
  **explícito**, conferido linha a linha (FR-011).
- ⚠️ **Coluna anulável casa linha arbitrária em filtro** (`where: { campo: null }`) e **FK
  anulável quebra `include` em TypeError**, não em filtro silencioso. Os dois já morderam neste
  repo.
- ⚠️ **Schema vai para o banco por `prisma db push` MANUAL**, de uma máquina que alcança o host.
  O runner standalone não aplica. Endpoint externo: `2.24.207.200:5443`, sem TLS — a
  `DATABASE_URL` do `.env` aponta para o host **interno** do Docker.
- ⚠️ **Existem dois bancos com senha igual e porta diferente.** O do `app` é `roilabs_db@:5443`.
  O `:5445` é o `roihub_db` e **não tem** tabela `Cadeira` — um seed apontado para lá cria o
  schema inteiro no projeto errado. Já quase aconteceu na 012.
- ⚠️ **`pedidoId` anulável em `NegocioOriginado` é landmine** (spec 012): cadeira cobrada pelo
  parceiro não gera pedido, então o campo é nulo **de propósito** — e é por isso que filtro por
  ele casa linha errada.
- ⚠️ **Verificação vale em ambiente real.** Build local neste stack não prova nada (OneDrive
  corrompe `node_modules`).

## O que está FORA, e não deve ser reaberto

- ⛔ **Teste de venda real com cartão real — cancelado pelo Jean em 07/08, sem discussão.**
  Consequência registrada e aceita: pagamento → webhook → negócio → success fee segue sem prova
  ponta a ponta. **Não sugerir de novo.**
- Publicar página de cadeira / escrever conteúdo → spec 012.
- Migrar domínio ou tirar o "goiania" do nome → spec 012, US4.
- Consertar ranking (`0/40` no top 50) ou falta de demanda → o motor liga a loja, não traz
  cliente. Ver [site-goiania/handoff.md](../../site-goiania/handoff.md), decisão (b).
- Google Ads — canal 100% orgânico, decisão registrada.

## Contexto vivo do site (para não medir de novo)

Do [handoff do site](../../site-goiania/handoff.md), medido em 07/08: 99 URLs no sitemap ·
sitemap baixado pelo Google com 0 erro · 3 dos 4 SKUs de fita saíram de "URL desconhecida" para
"Descoberta – não indexada" · **reaferir indexação ~14/08** · GSC 28 dias: 322 impressões, 2
cliques, posição 19,8, 0/43 no top 50 · LCP 2,5 s (resolvido, não é gargalo) · `LeadConsumidor`
= 1 (o de teste foi apagado em 07/08).
