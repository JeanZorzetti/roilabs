---
tipo: checklist
status: vivo
data: 2026-07-04
dono: Jean (dev)
---

# ✅ Próximos passos — DEV (Jean)

> [!info] Onde estamos (2026-07-04)
> 3 propriedades em produção com **deploy automático por push**: `roilabs.com.br` (10 págs), `goiania.roilabs.com.br` (85 págs) e `app.roilabs.com.br`. **Ciclos fora-da-caixa 1–10 executados** — histórico integral (hashes, notas de disciplina, verificações) em [[changelog-ciclos]].
> **Ops, verificações pós-deploy e gatilhos externos vivem em [[backlog-pendencias]]** (Merchant Center Diagnóstico ~07-05, GSC miner ~07-15, review engine no gate 3–5 pedidos, Asaas na 1ª fatura) — não duplicar aqui.

> [!warning] O que NÃO é seu
> Fechar 1º fornecedor (Gate 3), piso de take rate em R$, prospecção de players = **Maria Eduarda / campo**.

## 🧭 Fora da caixa — ciclo 11 (2026-07-04) — 5/5 itens EXECUTADOS (`e7978a0`, `589685f`)

> [!note] Tema: **funil visual a partir de `/porcelanato`** (pedido do Jean: porcelanato é compra visual, o funil hoje é texto-pesado). Verificado contra o código em 2026-07-04: 30 produtos com **média 1,1 foto** cada (0 vídeos, apesar do campo `video` já existir no JSON); **34/34 imagens em hotlink de `jurunense.vteximg.com.br`** (CDN de terceiro — suspeito nº 1 do Merchant Center e ponto único de falha); hub `/porcelanato/` com 41 cards de **texto puro**; hero da malha sem imagem; galeria do produto sem zoom. **Ordem importa: o item 1 é fundação dos demais.**

### 🛡️🖼️ Fundação: donos das próprias imagens

- [x] **⭐ 1. Self-host + otimização das 34 fotos do catálogo — FEITO 2026-07-04 (`e7978a0`).** `fetch-images.mjs` (one-shot, idempotente) baixou as 34 fotos pra `public/img/produtos/` (2 MB), gerou variante de exibição `.webp` ≤900px (`imgDisplay` em `produtos.ts`) e reescreveu `porcelanatos.json` com caminho local — original fica pra feed/OG/zoom. Feed, image sitemap (199 locs) e Product JSON-LD emitem URL absoluta própria (`imgAbs`); **`check-feed` agora FALHA se `g:image_link` sair do domínio** (hotlink de terceiro virou regressão detectável). Gotcha corrigido de brinde: `Base.astro` só emite `og:image` 1200×630 pra imagens de social — foto de produto tem proporção própria. Zero refs `vteximg` no dist. ⏳ watch: Merchant Center vai re-crawlear o feed com URLs novas de imagem — itens podem voltar a "Em análise" por uns dias (junto do Diagnóstico ~07-05).

### 🎨 Funil visual (depende do 1)

- [x] **⭐ 2. Hub visual — FEITO 2026-07-04 (`e7978a0`).** 38 dos 40 cards da malha em `/porcelanato/` ganharam capa (foto do 1º produto da categoria, `loading="lazy"`, hover com zoom sutil); 2 categorias sem produto seguem como card texto (fallback por design). E2E: 38 capas renderizando no preview.
- [x] **⭐ 3. Hero visual na malha — FEITO 2026-07-04 (`e7978a0`).** `pseo-hero__strip`: até 4 fotos reais da categoria no hero, cada uma linkando pra âncora `#catalogo` da galeria. Sem carrossel/JS — só HTML+CSS com as webp do item 1.
- [x] **4. Zoom na foto do produto — FEITO 2026-07-04 (`e7978a0`).** Foto principal virou `<button cursor:zoom-in>` que abre `<dialog>` nativo (top-layer passa por cima do MiniCart) com o **original full-res** (`data-full`), não a webp. Bônus: thumbs agora TROCAM a foto principal (antes eram estáticas — produto com 5 fotos não tinha como ver as outras). E2E Playwright: abre com original, fecha no ✕/backdrop.

### 📸 Acervo (gate — sem isso não existe "inspiração")

- [x] **5. Fotos ambientadas — FEITO PARCIAL 2026-07-04 (`589685f`), decisão consciente de pular a autorização formal.** Mudança de plano: em vez de esperar a Duda pedir aos fornecedores, o Jean pediu a mineração direta dos sites oficiais (Biancogres/Delta) e aceitou o risco de usar as imagens sem autorização explícita por escrito — **fica registrado aqui pra não se perder essa decisão.** `fetch-ambiente.mjs` (curadoria manual, não crawler) confirmou 6/30 produtos com foto de ambiente do fabricante na MESMA coleção e MESMA dimensão do catálogo (todos Biancogres: Marmo Perla, Arezzo Grigio, Arezzo Beige EXT/Satin, Chicago Grafite, Persia Beige); Delta não tinha correspondência exata pros 4 SKUs do catálogo. Renderiza como seção "Veja em ambiente" no produto (`ProdutoDetalhe`) e substitui a foto no hero da malha quando existe; sitemap de imagens ganhou as 6 fotos. **Vídeo: capacidade implementada (iframe), mas nenhum vídeo atribuído** — o único vídeo oficial encontrado é genérico da marca, não por SKU; ⏳ pendente é a Duda achar/pedir vídeo específico por produto quando houver. 2ª foto por produto (múltiplos ângulos) não minerada — fica pro próximo ciclo se o acervo virar prioridade de novo. **Handoff completo pra ampliar (Savane 0/8 nunca pesquisado, Biancogres 12 faltando, método validado) em `site-goiania/handoff.md`.**

## 🧭 Fora da caixa — ciclo 12 (2026-07-04) — acervo de ambiente, 6/30 → 23/30

> [!success] Continuação do ciclo 11 item 5, executado antes do checkpoint ~07-15 (o Jean priorizou o acervo). 2 levas: WebSearch/Playwright manual + ferramenta nova `media-miner` (achou o filtro de busca interno de Biancogres/Savane que o Google não indexava). Handoff completo em `site-goiania/handoff.md`.

- [x] **Biancogres 6/18 → 15/18, Savane 0/8 → 8/8 completo, Delta segue 0/4** (confirmado de novo: a marca nunca teve foto de ambiente real — não é falha de busca). Ficaram só 3 SKUs genuinamente ambíguos (coleções diferentes, mesma dimensão/acabamento — catálogo não desambigua, forçar uma arrisca mostrar textura errada pro cliente).

## 🧭 Fora da caixa — ciclo 13 (2026-07-04)

> [!note] 3 frentes pedidas pelo Jean: fechar o gate do acervo que o ciclo 12 deixou pendente, mais fotos por produto, e uma galeria melhor na página de produto.

- [x] **⭐ Lupa em hover na galeria do produto — FEITO 2026-07-04.** Estilo Mercado Livre: em telas ≥880px com mais de 1 foto (`.has-thumbs`), os thumbs viram coluna à esquerda da foto principal; em desktop com mouse (`hover:hover`+`pointer:fine`+≥1180px), passar o cursor na foto abre um painel ao lado com zoom 2,5× seguindo o cursor — reaproveita o mesmo `data-full` (original full-res) que já alimentava o `<dialog>` do ciclo 11. Zero dependência nova (`background-position` em % faz a matemática da lupa sozinho). Clique continua abrindo o dialog fullscreen em qualquer dispositivo — a lupa é um atalho a mais, não substitui (touch não tem hover). Verificado via Playwright: grid lado a lado, painel posicionado e com zoom corretos seguindo o cursor, dialog ainda abre no clique, lupa desativa <1180px ou sem mouse.
- [x] **Terminar o acervo (23/30 → 25/30) — FEITO 2026-07-04, gate fechado.** As 3 decisões do Jean: *Grigio Externo 90x90* → usou 2 fotos próprias (gerais, sem coleção Biancogres confirmada — ver nota); *Lux 100x100* → aceitou o risco, reaproveitou a foto já usada em `pulpis-grigio-ac-100x100cm` (o próprio arquivo já rotula a variante "lux-100x100" entre as que mostra — é o match genérico mais próximo real, não um qualquer); *Delta (4) + Onix Bianco Lux/`bianco-luz-polido` (1)* → **0/5 permanente, decisão minha por consistência** (mesma regra já aplicada ao Delta: as 2 pesquisas anteriores já confirmaram que nenhum dos 2 tem foto de ambiente real, só simulador/close-up genérico — mostrar isso seria enganoso). **25/30 é o teto salvo nova decisão do Jean.**
- [x] **2ª foto por produto (textura) — REVERTIDO E FEITO 2026-07-04.** Resposta inicial foi "deixe como está", mas o Jean voltou atrás ao notar que a coluna de miniaturas da lupa não aparecia (só 1/30 produtos tinha 2+ fotos). Minerado 20/29 produtos que ainda tinham só 1 foto: 16 Biancogres + 1 Onix Bianco Lux via páginas oficiais (padrão `f01`-`f12` de close-up por modelo, media IDs sequenciais ao da foto de ambiente) + 4 Delta (`files/product/`, textura distinta do simulador rejeitado no gate de ambiente). **Savane (8) ficou de fora — estrutural, não busca malfeita**: página oficial confirmada só tem 1 foto de produto (carrossel de 1 thumbnail + toggle separado pra ambiente, sem close-up adicional). `Grigio Externo 90x90` também ficou de fora (mesma cautela da coleção ambígua). **21/30 produtos agora com 2+ fotos** (era 1/30); `fetch-images.mjs` rodado, build+Playwright confirmam miniaturas aparecendo nas páginas que o Jean apontou.

> [!warning] Pendente confirmar com o Jean
> As 2 fotos do Grigio Externo 90x90 vieram de fora do fluxo `media-miner`/`fetch-ambiente.mjs` (arquivos passados diretamente, origem não confirmada) — `ProdutoDetalhe.astro` legenda TODA foto de `imagensAmbiente` como "foto do fabricante". Se essas 2 não forem do site oficial da Biancogres, a legenda fica incorreta pra esse produto específico — confirmar a fonte ou ajustar o texto.

## 🧭 Fora da caixa — ciclo 14 (2026-07-04) — 3/3 itens EXECUTADOS

> [!note] Pedido direto do Jean (fora da ordem de espera por dados do checkpoint ~07-15): as 34 fotos do catálogo apareciam repetidas nos cards de `/porcelanato/`, e 2 categorias não tinham NENHUMA foto. Handoff técnico completo em `site-goiania/handoff.md`.

- [x] **Capas do hub sem repetição.** Causa raiz única: `capaDe()` sempre pegava o produto `[0]` da categoria — como várias categorias compartilham tag/tipo, o mesmo produto (`carvalho-natural`, posição 0 do JSON) virava capa de 14 dos 40 cards. Trocado por seleção sem repetição (1ª passada: produto ainda não usado; 2ª: outra foto do mesmo produto; só repete de fato quando não há alternativa real).
- [x] **`porcelanato-fachada` e `porcelanato-60x60` ganharam foto real.** Nenhum produto tinha tag pra essas 2 categorias (dimensão "60x60" não existe no catálogo real; "fachada" não existia como tag). Estendida a função única de casamento produto→categoria (`tagsDoProduto`, raiz compartilhada pelo hub E pela página da categoria): 60x60 aceita 62×62 como formato próximo (mesmo padrão já usado em 90x90/91x91); fachada aceita qualquer produto com acabamento Externo/Rústico. As 2 páginas agora mostram hero + galeria de produto (antes: só texto).
- [x] **Jean recusou repetição residual → minerado até fechar 100%.** Os 2 fixes acima deixaram 37/40 fotos distintas (só a família "amadeirado", 5 páginas, tinha 1 único produto real no catálogo). Fechado com: (1) `capaDe()` passou a considerar `imagensAmbiente` também, não só `imagens` — 1 foto grátis já baixada desde o ciclo 11; (2) minerei 2 fotos novas de verdade do site oficial da Biancogres (`biancogres.com.br/pt_BR/produto/carvalho-natural`) via `fetch-images.mjs` (fluxo padrão dos ciclos 11/13). **40/40 cards com capa, 40/40 fotos distintas — zero repetição confirmada** no build (`grep`+`uniq -c`) e visualmente via Playwright.

## ⏭️ Próximo checkpoint

- [x] **EXECUTADO 11/07 (antecipado)** — [[checkpoint-malha-2026-07]]: **41/41 da malha indexadas** (meta ≥35), miner validado (0 candidatas acima do piso — cedo demais), fix trailing-slash confirmado vivo. **Ciclo 15 escolhido pelos dados: reforçar guias (limpeza/rejunte/polido-vs-acetinado) + interlink guia→malha.** Clarity/busca_interna/Origem ficaram pro D+30 (~28/07).
- **~28/07 (D+30)** — reavaliar com o miner semanal rodando (secret `GSC_SA_KEY` pendente, 2 min).
