# Handoff — 012 carteira de cadeiras no e-commerce

**Data**: 2026-08-07 · **Status**: spec em Draft, 1 clarification bloqueante · **Próximo**: `clarify`

## Feito

- `spec.md` escrita e revisada em duas rodadas de clarification no mesmo dia.
- Escopo **medido, não lembrado** (`roihub/scripts/gateways.mjs`, 35 projetos × 10 caminhos,
  HTTP contra produção, zero LLM): 1 gateway ligado (`atma`), 1 servido sem régua (`orcaobra`),
  6 servem preço sem gateway (`sirius`, `polarisia`, `estetiacrm`, `context`, `orion`,
  `vertice`), 27 sem caminho de cobrança. Idêntico à corrida de 01/08.
- Baseline de acesso medido no GSC e registrado em Success Criteria:
  `Docs/Obsidian/80-dev/atma-diferencial-de-acesso-2026-08-07.md`.

## Decisões (Jean, 2026-08-07 — não reabrir)

1. Cada cadeira ganha **página de produto + preço + checkout**. Não é vitrine com link de saída.
2. **Fase 1 = só quem tem produto vendável**; os 35 entram no fim, transformando os outros um a
   um. O modelo de dados já nasce comportando os 35.
3. Pagamento **depende do tipo de cadeira**: físico → carrinho da ROI Labs; SaaS → gateway do
   parceiro.
4. Cadeira da casa: marcada **sempre** no dado interno, sem success fee de si mesma. No site
   público exibida como parceiro, **exceto `sirius`, `meridian` e `orion`**.
5. E-commerce vai para **subdomínio novo em `roilabs.com.br`** (assumido `loja.`).

## 🚩 A decisão 3 REDUZIU o escopo — leia antes de planejar

A primeira versão desta spec tinha como P1 **generalizar `ItemPedido`** para unidade arbitrária,
por entender que as 6 cadeiras SaaS eram a "terceira unidade de venda" que a spec 011 registrou
como teto do seu atalho.

**Está errado, e a decisão 3 é o motivo.** São dois eixos independentes: *unidade de venda* e
*quem processa*. Com SaaS comprando no gateway do parceiro, cadeira SaaS **nunca cria pedido
interno** — nasce um `NegocioOriginado`, que já é agnóstico de unidade. O carrinho da ROI Labs
continua servindo só m² e rolo. **Nenhuma terceira unidade entra no `ItemPedido`; o atalho da 011
segue válido e o caminho de dinheiro existente não é tocado.**

Gatilho redefinido e registrado em Out of scope: generalizar quando **uma terceira unidade entrar
no carrinho da própria ROI Labs** (cadeira física que não venda por m² nem rolo). Cadeira SaaS
nova não dispara, por mais que se somem.

## Pendências

- **[BLOQUEIA `plan`] FR-003: como a venda do parceiro chega até aqui** — webhook do gateway dele
  ou informe manual? Decide se `SC-001` (receita provada sair de R$ 0,00) é apurável por máquina
  ou vira número declarado. Esta casa já mediu o custo de número escrito à mão.
- Label do subdomínio: assumido `loja.roilabs.com.br`, não confirmado. Não bloqueia.

## Gotchas herdados (já embutidos como FR)

- **`approved` + `live_mode` não é venda**: os 20 pagamentos da `atma` são de payer de teste.
  Só o payer separa teste de receita — receita provada da carteira hoje é **R$ 0,00**.
- **Cert Universal da Cloudflare cobre apex + UM label.** Subdomínio de segundo nível quebra no
  handshake (é o que já acontece com `www.sirius` e `www.goiania`).
- **`curl -k` esconde erro de cert**: 200 no terminal e "Failed to fetch" no browser.
- **Sitemap em 200 não prova deploy** — validar o corpo (`<?xml`), nunca o status.
- **Contar palavra com `sed 's/<script[^>]*>.*<\/script>//g'` mede o `sed`**: em HTML minificado
  o `.*` guloso devolve 0 palavra em página com `<h1>`.
- **`goiania` e `roilabs` são o mesmo repo** — card ≠ repositório; somar os dois infla a carteira.
- **Ligar cobrança não cria demanda.** Para as cadeiras sem busca (doença A da medição de
  07/08), o resultado esperado é conversão do tráfego existente, nunca crescimento.
