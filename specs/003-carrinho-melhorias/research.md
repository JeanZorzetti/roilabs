# Research — Fase 0

Decisões técnicas para as melhorias do carrinho, construídas sobre o que a 002 já entregou (`cart.ts` localStorage `{slug,caixas}`, `precos.ts`/`frete.ts` knobs server-side, checkout form-POST 303 → MP). Cada decisão fecha um ponto da spec; tetos deliberados marcados como `ponytail:`.

## D1 — Cupom: fonte de verdade

- **Decisão**: cupons vivem num **knob em código** `app/src/lib/cupons.ts` (`código → {tipo:'percentual'|'fixo', valor, validadeInicio?, validadeFim?, minimo?, ativo}`), com `validarCupom(codigo, subtotalProduto) → {ok, desconto} | {ok:false, motivo}`. Tipos: percentual e valor fixo, **só sobre o subtotal do produto** (Clarification Q1). Um cupom por carrinho.
- **Rationale**: espelha o padrão de `frete.ts` (knob editável pela operação); volume de 1 polo no lançamento não justifica tabela + CRUD. Mantém o servidor como dono da validação (FR-014).
- **Alternativas**: tabela `cupons` + admin CRUD (rejeitada agora — YAGNI; `ponytail: cupons em código; promover a tabela DB + admin quando a operação precisar criar cupom sem deploy`). Mirror do código no front (rejeitada — vazaria todos os códigos no bundle JS).

## D2 — Cupom: como o carrinho mostra o desconto

- **Decisão**: endpoint novo **`POST /api/cupom/validar`** (urlencoded, requisição simples → sem preflight) que recebe `codigo` + `itens` (`[{slug,caixas}]`), recomputa o subtotal do produto via `precos.ts` (nunca confia em dinheiro do cliente) e responde **JSON** `{ok, desconto, descontoFmt} | {ok:false, motivo}`. Como o JS do site lê a resposta cross-origin, o endpoint envia `Access-Control-Allow-Origin: https://goiania.roilabs.com.br`.
- **Rationale**: códigos ficam secretos no servidor; o cálculo do desconto é autoritativo já no display. É o único ponto que precisa ler resposta cross-origin (o checkout da 002 evita CORS via 303). Um header ACAO resolve.
- **Alternativas**: mirror de cupons no front (rejeitada — vaza códigos, D1); "quote endpoint" que recalcula carrinho inteiro (frete+itens+cupom) — adiável: frete já é mirror no front e funciona; `ponytail: unificar num /api/carrinho/cotar só se o mirror de frete divergir`.

## D3 — Frete + prazo no carrinho

- **Decisão**: estender a `Faixa` em `frete.ts` com `prazo` (ex.: "2–4 dias úteis") e expor `getFaixa(cep) → {valor, prazo, regiao} | null`; `calcFrete` permanece como wrapper retornando o valor (não quebra `/api/pedidos`). O mirror no `carrinho.astro` ganha a mesma coluna de prazo. Retirada → grátis; CEP fora → "a combinar" (paridade 002).
- **Rationale**: frete já é mirror front + autoritativo no checkout; só falta o prazo. Mudança mínima, sem endpoint.
- **Alternativas**: API de transportadora (fora de escopo — `ponytail: trocar por cálculo de transportadora só se vender fora do polo`).

## D4 — Salvar/recuperar carrinho por link (30 dias)

- **Decisão**: link = **payload codificado na URL** `/carrinho?c=<base64url(JSON {v:1, ts, items:[{slug,caixas}]})>`. Ao abrir, decodifica, checa `idade ≤ 30 dias` (Clarification Q3), e restaura no `localStorage`; expirado → mensagem clara. **Sem tabela, sem endpoint, sem cron.**
- **Rationale**: o carrinho só guarda `{slug,caixas}` (dados públicos do catálogo); o servidor recalcula todo dinheiro no checkout (FR-017), então um payload não confiável é inofensivo. ~10 itens cabem folgado em < 2000 chars.
- **Alternativas**: tabela `carrinhos_salvos` + token + cron de limpeza (rejeitada — YAGNI; `ponytail: promover a link tokenizado em DB só se precisar revogar links ou medir abertura`). Expiração assinada/HMAC (rejeitada — sem dinheiro no payload, adulterar `ts` só afeta o próprio usuário).

## D5 — Simulador de m² por ambiente

- **Decisão**: island `SimuladorM2.astro` soma `Σ(largura×comprimento)` dos ambientes, aplica folga **clampada a 5–20%** (default 10%, Clarification Q4) e reusa `m2ParaCaixas(area, m2_caixa, perda)` de `cart.ts` (arredonda ↑, mín. 1). **Coexiste** com a entrada direta de m²/caixas (Clarification Q2): `AddToCart.astro` alterna entre os dois modos. `ambientes[]` e `perda` ficam **opcionais no `CartItem` (localStorage)** para reabrir o simulador pré-preenchido — nunca enviados como dinheiro ao servidor.
- **Rationale**: reusa a função de conversão já testada; clamp transforma a "faixa sensata" em limite testável. Persistir ambientes é client-only e barato.
- **Alternativas**: persistir ambientes no `ItemPedido` do servidor (rejeitada — servidor só precisa de `caixas`; m² é derivado).

## D6 — Mini-cart sem regredir pSEO

- **Decisão**: `MiniCart.astro` é um **island client-side** montado pelo `Header.astro` (drawer + badge via evento `roi-cart-change` já emitido por `cart.ts`). O HTML pré-renderizado/indexável das páginas de pSEO não muda em conteúdo; o widget hidrata por cima.
- **Rationale**: FR-018/SC-006 exigem zero regressão de pSEO; island é aditivo. Sem JS / antes da hidratação, a página segue válida.
- **Alternativas**: re-render do Header com estado no servidor (rejeitada — site é estático; quebraria o modelo de deploy).

## D7 — Aplicar o desconto na preferência Mercado Pago

- **Decisão**: no checkout, depois de re-validar o cupom no servidor, **escalar proporcionalmente** o `unitPrice` dos itens enviados ao MP para que o **total da preferência == total do servidor** (`produto − desconto + frete`). Registrar `cupom_codigo` + `desconto` no `Pedido`.
- **Rationale**: MP Checkout Pro não aceita item de valor negativo; escalar mantém o total cobrado idêntico ao recalculado, sem linha "desconto" inválida.
- **Alternativas**: campo de cupom nativo do MP (rejeitada — acopla a regra de negócio ao provedor; `ponytail: migrar para o desconto nativo do MP só se precisar exibir o código na fatura do MP`).

## D8 — Edição inline (m² ⇄ caixas)

- **Decisão**: no `carrinho.astro`, editar por **caixas** chama `setCaixas` (já existe); editar por **m²** converte via `m2ParaCaixas(m2, m2_caixa, perda do item)` e grava as caixas resultantes. O resumo mostra sempre caixas + m² cobertos + subtotal (display de `lines()`), recalculados na hora.
- **Rationale**: reusa `cart.ts`; mantém a invariante "carrinho só guarda caixas fechadas".
- **Alternativas**: guardar m² bruto no carrinho (rejeitada — quebraria a invariante de caixas fechadas e o recálculo do servidor).

**Saída**: nenhum `NEEDS CLARIFICATION` remanescente. Pronto para a Fase 1.
