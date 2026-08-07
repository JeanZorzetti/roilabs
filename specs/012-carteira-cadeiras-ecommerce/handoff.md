# Handoff — 012 carteira de cadeiras no e-commerce

**Data**: 2026-08-07 · **Status**: spec + plan fechados, zero bloqueio · **Próximo**: `tasks`
(começando pela **Fase 0**, que pode eliminar um adaptador antes de qualquer código)

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

6. **Webhook por gateway**, sem informe manual (3ª rodada). *Webhook por gateway ≠ por cadeira.*
7. **Fase 0 (resolvida antes de qualquer código):** `sirius` cobra com **Stripe** — o
   `mercadopago` no `package.json` dele é dependência escrita e não usada. E **`orcaobra` sai da
   fase 1**: *"acho ele um produto ruim do jeito que está"* — bloqueio de **produto**, não de
   fiação. **Escopo final: 7 cadeiras, 2 adaptadores; Kiwify serve zero cadeira e não se
   constrói.**

## Plano (07/08) — o que ele descobriu no código

- **Já existe webhook de MP** (`app/src/app/api/pagamentos/webhook/route.ts`) com o padrão certo:
  assinatura antes de estado, status lido do gateway, idempotência por id. **Vira o molde — e não
  é tocado** (é o que fatura hoje, FR-005a). Ele é single-tenant; cadeira de parceiro tem conta e
  segredo próprios.
- **Bloqueio de schema achado no arquivo:** `NegocioOriginado.pedidoId` é **NOT NULL** com relação
  obrigatória. Venda SaaS não tem `Pedido`, logo hoje **não consegue** virar negócio. `Pedido`
  sintético foi **rejeitado** (exigiria `whatsapp` e `entrega` falsos no caminho de dinheiro).
  Escolhido: `pedidoId` anulável + discriminador `origem` + invariante testada.
- **Segredo de webhook NÃO vai para o banco** — `CredencialGateway.segredoRef` guarda o *nome* da
  env var. Banco guarda ponteiro, EasyPanel guarda valor.
- **Parceiro vai no PATH da rota**, não é descoberto pelo corpo: o segredo é por conta, então
  descobrir pelo corpo exigiria ler entrada não autenticada antes de validar assinatura.

## Pendências

- Label do subdomínio: assumido `loja.roilabs.com.br`, não confirmado. Não bloqueia (T058).
- ⚠️ **Dois "8" diferentes no material** — `seats.ts` tem **8 cadeiras de nicho**; a fase 1 tinha
  **8 projetos candidatos** (hoje 7). Contagens de coisas distintas que ficaram perto por acidente:
  sempre dizer QUAL. Já causou uma leitura errada na revisão de consistência de 07/08.
- ⚠️ **Quantas cadeiras são "da casa" NÃO está apurado.** A spec deixou de afirmar um número; a
  classificação é curadoria e é a tarefa T052.
- ⚠️ **`pedidoId` anulável quebra leitura existente em silêncio** — varrer TODA consulta de
  `NegocioOriginado` por `pedidoId` é tarefa da Fase 1, não observação. Mesma landmine do
  `freteMotivo` na 010, e esta casa já pisou nela duas vezes.

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
