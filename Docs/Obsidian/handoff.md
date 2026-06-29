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
1. ✅ **Keyword Planner (Goiânia) — FEITO (2026-06-28):** Gate 1 validado. Demanda local real concentra em `porcelanato` (1.900) + tipos de produto; `porcelanato Goiânia` (140, CPC alto) = âncora de Ads; `pronta entrega` (10) vira USP; `área externa` (30 local, não 2.900 nacional) = nicho. Dados completos no nó [[mercado]].
2. **Fechar o 1º fornecedor** A-Player de revestimentos (Gate 3). (nó [[mercado]] / [[time]])
3. ✅ **Estrutura de contrato + mecânica fiscal + minuta — FECHADAS (2026-06-28):** veículo = contrato atípico de intermediação/marketplace (NÃO representação comercial — evita indenização 1/12 + del credere vedado; ISS LC 116 item 10.05); padrão sem posse, revenda à ordem só no WL premium. Spread = comissão + excedente (uma só receita de serviço). Mecânica de NF fechada p/ os 2 cenários. Minuta em [[contrato-quadro]] + 2 anexos ([[anexo-A-intermediacao]], [[anexo-B-white-label]]); pagamento via Asaas (split automático). Projeção dos 2 regimes (intermediação + WL) em [[projecao-financeira]]. **Regime decidido: Simples Nacional** (deserto SEO + WL como moat de margem; mirar Anexo III via fator-r; watch-point teto R$4,8M se WL crescer). [[legal-fin]] `decided`. Resíduo só de execução: contador formalizar enquadramento + gerir fator-r, IVA-ST GO na 1ª compra WL, advogado adaptar minuta ao CNPJ.
4. **Definir o piso de take rate em R$** após ver tickets reais de revestimentos. (nó [[modelo]])
5. ✅ **Dataview instalado + dashboard criado (2026-06-28):** plugin baixado em `.obsidian/plugins/dataview` e habilitado; nó [[dashboard]] com tabela de `stale` (alarme) + overview de status. Hoje vazio (todos `decided`) — é o estado esperado.

## Pendências / em aberto
- `legal-fin` agora `decided` (estrutura + mecânica fiscal + minuta fechadas por pesquisa); resta só **execução do profissional** (opção formal de regime, IVA-ST GO no momento da compra WL, advogado adaptar a minuta ao CNPJ/foro) — não é decisão estratégica em aberto.
- Validação de mercado: Keyword Planner ✅ feito; resta o fornecedor (ação de campo).
- Todos os 8 nós agora `decided`; nenhuma área estratégica em `draft`.

## Gotchas
- **Wikilinks resolvem por nome de arquivo**, não por pasta — mover nó entre pastas não quebra link.
- **Propagação de obsolescência é manual mas trivial:** mudou um nó `decided`? Abra os Backlinks dele e marque os dependentes como `stale`. O Obsidian lista quem depende.
- **Moda/Região da 44** continua sendo um vertical possível, mas como **pivot consciente** para atacado nacional (outro playbook) — não misturar no polo 1.
- Edições via terminal (a substituição Roy→ROI) deixam o estado do arquivo "fora de sincronia" para a ferramenta de edição — por isso às vezes é preciso reler antes de editar.
