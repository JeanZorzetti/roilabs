# Research — 011 E-commerce de fitas adesivas Tapepro

**Data**: 2026-07-22 · Resolve as 6 pendências deixadas pela spec para o plano.

Tudo aqui foi verificado no código ou em fonte externa citada — nada de memória.

---

## D1 — Provedor de cálculo de frete

**Decisão: Melhor Envio, sandbox primeiro.**

**Rationale**:
- **Sandbox real e gratuito**: token de teste próprio, 1.000 envios e R$ 10.000 de crédito fictício, com Correios e JadLog. É o que permite cumprir a Constituição II (verificação em ambiente real) **sem gastar** — o E2E de cotação roda de verdade antes de tocar produção.
- **API de cotação gratuita**; paga-se por envio comprado, não por consulta.
- **Agrega Correios + transportadoras**, o que importa: fita vai em volume (mínimo de 20 rolos), e frequentemente ultrapassa o limite de peso/dimensão dos Correios. Só Correios não atende o caso B2B.
- **Sem dependência npm**: a cotação é um `POST` REST com `fetch`. Nada entra no `package.json`.

**Alternativas consideradas**:
- **Frenet** — equivalente em cobertura e também com plano gratuito. Vence quando a empresa **já tem contrato negociado** com transportadora (Jadlog, Correios) e quer só plugar. **Vale reabrir se o Tapepro já tiver contrato próprio** — é plausível para um fabricante de fitas que despacha volume. Custo de troca: reescrever `frete-fitas.ts`, um arquivo. Não é decisão irreversível.
- **API dos Correios direto** — exige contrato e credenciais CWS; a antiga `CalcPrecoPrazo` pública foi descontinuada. Mais burocracia e menos cobertura.
- **Tabela de faixas por região à mão** — rejeitada na spec (rodada 2): estimativa em caminho de dinheiro pode cobrar a menos e dar prejuízo silencioso.

**Ação do Jean (bloqueia o E2E, não o código)**: criar conta no Melhor Envio e gerar **token de sandbox**. Depois, token de produção.

**Risco registrado**: sandbox só simula Correios + JadLog. A cobertura real de transportadora só se prova em produção — o quickstart trata isso como passo separado.

---

## D2 — Onde a cotação de frete é executada

**Decisão: no `/app`, atrás de `POST /api/frete/cotar`, com o mesmo padrão CORS de `/api/cupom/validar`.**

**Rationale**: o site é **estático** — não pode carregar `MELHOR_ENVIO_TOKEN` sem vazar a credencial no bundle. Já existe exatamente um endpoint lido cross-origin pelo site (`/api/cupom/validar`), com o padrão resolvido: `application/x-www-form-urlencoded` (requisição simples, **sem preflight**) e header `Access-Control-Allow-Origin` fixo no origin do site. Copiar esse padrão é zero descoberta e zero risco.

**Alternativas**: endpoint no próprio Astro (exigiria SSR e mataria o estático que sustenta o pSEO) · chamar o Melhor Envio do browser (vaza credencial) · calcular só no checkout (o comprador só veria o frete depois de decidir — mata o SC-001).

---

## D3 — Estrutura do item de pedido de fita no banco

**Decisão: tabela nova `ItemPedidoFita`. `ItemPedido` não é tocado.**

**Rationale**:
- FR-003 exige porcelanato intocado; adicionar colunas anuláveis na tabela de dinheiro que já fatura é risco sem retorno.
- O gotcha da 010 é literal aqui: *coluna `NOT NULL` sem backfill quebra `where: { campo: null }` e vira landmine*. Tabela nova não tem esse problema — não há linha antiga para migrar.
- As colunas divergem de verdade: `caixas`/`m2`/`precoM2` vs `rolos`/`precoRolo`. Forçar as duas na mesma tabela produziria metade das colunas sempre nulas.

**Alternativa rejeitada**: discriminador `vertical` + colunas anuláveis no `ItemPedido`. Menos tabelas, mas mexe na tabela que fatura hoje e reintroduz o risco que a decisão de vertical paralelo existe para evitar.

`Pedido` ganha `vertical` (com default `porcelanato` e backfill) para saber qual relação ler. Um pedido tem itens de exatamente um vertical (FR-028).

---

## D4 — Coexistência dos dois carrinhos

**Decisão: módulo `cart-fitas.ts` com chave `roi_cart_fitas_v1`, separado de `cart.ts` (`roi_cart_v1`).**

**Rationale**: FR-028 (dois carrinhos coexistem sem sobrescrita) fica satisfeito **por construção** — chaves distintas no `localStorage` não colidem. Zero lógica de coordenação.

O `cart.ts` atual é porcelanato de ponta a ponta (`caixas`, `m2_caixa`, `m2ParaCaixas`, simulador de ambientes, `perda`). O de fitas é bem menor: `{ slug, rolos }`, sem perda, sem ambientes, sem conversão de área.

O que a UI precisa: ao adicionar fita com carrinho de porcelanato não-vazio (ou vice-versa), avisar que são pedidos separados — **sem apagar nenhum dos dois**. O badge do header passa a somar as duas contagens.

**Reaproveitável**: o mecanismo de link compartilhável (`encodeCart`/`decodeCart`) é genérico o bastante para copiar, mas **não entra no v1** — ninguém pediu compartilhar carrinho B2B. YAGNI.

---

## D5 — Sincronização do conteúdo com o institucional

**Decisão: importar os *fatos* na origem, escrever a *prosa* nova.**

`Tapepro/src/lib/produtos.ts` é a fonte dos fatos: medidas, material, reforço, ativação, mínimo de pedido. O e-commerce **não pode divergir** disso (FR-027).

Os dois repositórios são **separados** (`ROI Labs/Tapepro/` e `ROI Labs/ROI Labs/site-goiania/`), então não há import direto de módulo. Opções avaliadas:

| Opção | Veredicto |
|---|---|
| Copiar os fatos à mão para `fitas.ts` | ✅ **Escolhida no v1.** São 3 SKUs e ~6 campos factuais cada. Um script de sync para 18 valores é a definição de over-engineering. |
| Script de sync entre repos | ❌ YAGNI agora. Vira necessário se o catálogo crescer. |
| Pacote compartilhado no monorepo | ❌ Os repos não compartilham workspace; criar um para 3 produtos não se paga. |

**Mitigação da divergência** (o risco real de copiar à mão): o `check-matrix.mjs` — que já roda no `prebuild` — ganha uma asserção comparando os fatos de `fitas.ts` com uma cópia declarada dos valores do institucional. Se alguém mudar a medida num lado só, **o build quebra**. É a trava barata que substitui o script de sync.

**A copy comercial é nova** (FR-032): o institucional escreve para intenção informacional; o e-commerce escreve para transacional (preço, mínimo, prazo, frete, comparação). Não é rewrite estético — é intenção de busca diferente.

---

## D6 — Canal do alerta de contingência (FR-035)

**Decisão: reusar `sendAlert()` de `app/src/lib/email.ts`.**

**Rationale**: já existe e já é usado pelo `cron/digest`. Zero infra nova, zero dependência, zero credencial adicional.

**Gatilho**: ao gravar um pedido com `freteMotivo = 'falha_tecnica'`, contar os pedidos de fita recentes com o mesmo motivo. Ao cruzar o limiar (**3 consecutivos**), disparar um alerta. Não alertar em `cep_nao_atendido` — isso é operação normal e viraria ruído que ninguém lê.

**Por que 3 e não 1**: uma falha isolada é instabilidade de rede e se resolve sozinha; três seguidas é credencial errada ou serviço fora. O limiar é o que separa sinal de ruído — e é um **botão de operador**, ajustável numa constante.

**Alternativas**: health-check por cron (detecta a queda mas não diz quantos pedidos já saíram sem frete) · banner no admin (depende de alguém abrir o admin — não satisfaz "sem inspeção manual") · circuit breaker (reintroduz a perda de venda rejeitada na rodada 2).

---

## D7 — `check-cart-math.mjs` está órfão

**Achado, não decisão.** O SC-009 exige que `check-cart-math.mjs` e `check-feed.mjs` continuem verdes. Verificado no `site-goiania/package.json`:

```json
"prebuild":  "node src/scripts/check-matrix.mjs",
"postbuild": "node src/scripts/check-feed.mjs && node src/scripts/indexnow.mjs"
```

`check-feed.mjs` roda. **`check-cart-math.mjs` não é executado em lugar nenhum** — nem no build, nem em script npm. Existe e não protege nada.

**Ação**: wire no `prebuild` junto do `check-matrix`, e estender para a matemática de rolos. Sem isso, o SC-009 é uma afirmação não verificável — exatamente o que a Constituição II proíbe.

---

## Env vars novas

| Var | Onde | Observação |
|---|---|---|
| `MELHOR_ENVIO_TOKEN` | `/app` (EasyPanel) | **Server-side apenas.** Nunca no bundle do site. |
| `MELHOR_ENVIO_BASE_URL` | `/app` | Alterna sandbox ↔ produção sem trocar código. |
| `MELHOR_ENVIO_CEP_ORIGEM` | `/app` | CEP de despacho do Tapepro. **Pendente do Jean.** |

*Constituição I: qualquer investigação de falha de cotação começa conferindo estas três, antes de olhar o código.*
