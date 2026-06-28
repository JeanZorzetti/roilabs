---
tipo: handoff
status: vivo
data: 2026-06-28
---

# Handoff — Mapa Empresarial ROI Labs

## Feito
- Sistema de "mapa empresarial" no Obsidian: 8 nós interdependentes (DAG), `INDEX.md` (hub) e `_template.md`.
- Blueprint linear desmontado em nós com `depends_on` (grafo) + pastas numeradas (filiação).
- Renomeação global **Roy Labs / Roylabs → ROI Labs** (conteúdo + arquivos-fonte + domínio `roilabs.com.br`).
- 18 decisões processadas e gravadas nos nós.

## Decisões fechadas (`decided`)
- **Polo 1 = Goiânia**, nicho âncora **revestimentos/porcelanato** (subdomínio `goiania.roilabs.com.br`).
  - *Por quê:* fit com a tese hiperlocal (alto ticket, frete-sensível, fornecedor local, ICP low-tech). Moda/Região da 44 é maior, mas é atacado nacional → fora da tese.
- **Tese:** remuneração ao fornecedor 100% variável (sem piso); exclusividade da cadeira 1 ano renovável por SLA.
- **Oferta:** White Label por nicho/categoria (não em tudo); requisito mínimo de catálogo é gate de entrada.
- **Modelo:** mensalidade SaaS = fórmula (gatilho 30-40%), não número fixo; piso de take rate = receita absoluta/venda, não %.
- **GTM:** páginas pSEO = catálogo × combinações com volume>0 (medir indexadas); saída do deserto = mesmo gatilho do SaaS.
- **Operação:** requisito técnico em 2 tiers (API/webhook | export+Gatekeeper); Gatekeeper = buy no MVP.
- **Time:** Maria Eduarda (sócia) cobre CS + curadoria na Fase 1 (pró-labore); comissão atrelada ao take rate só para comercial externo futuro.

## Próximos passos
1. **Keyword Planner (Goiânia):** validar `porcelanato Goiânia`, `porcelanato pronta entrega`, `revestimento área externa` vs alternativas. (nó [[mercado]])
2. **Fechar o 1º fornecedor** A-Player de revestimentos. (nó [[mercado]] / [[time]])
3. **Contador/advogado:** resolver a estrutura de contrato (intermediação vs revenda) — destrava todo o [[legal-fin]].
4. **Definir o piso de take rate em R$** após ver tickets reais de revestimentos. (nó [[modelo]])
5. (Opcional) Instalar plugin **Dataview** para o dashboard de nós `stale`.

## Pendências / em aberto
- `legal-fin` segue `draft` (proposta não validada) — única área não congelada.
- Validações de mercado (Keyword Planner + fornecedor) são ação de campo, não decisão de mesa.

## Gotchas
- **Wikilinks resolvem por nome de arquivo**, não por pasta — mover nó entre pastas não quebra link.
- **Propagação de obsolescência é manual mas trivial:** mudou um nó `decided`? Abra os Backlinks dele e marque os dependentes como `stale`. O Obsidian lista quem depende.
- **Moda/Região da 44** continua sendo um vertical possível, mas como **pivot consciente** para atacado nacional (outro playbook) — não misturar no polo 1.
- Edições via terminal (a substituição Roy→ROI) deixam o estado do arquivo "fora de sincronia" para a ferramenta de edição — por isso às vezes é preciso reler antes de editar.
