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

## 🧭 Fora da caixa — ciclo 11 (2026-07-04) — PROPOSTO, aguardando o "vai"

> [!note] Tema: **funil visual a partir de `/porcelanato`** (pedido do Jean: porcelanato é compra visual, o funil hoje é texto-pesado). Verificado contra o código em 2026-07-04: 30 produtos com **média 1,1 foto** cada (0 vídeos, apesar do campo `video` já existir no JSON); **34/34 imagens em hotlink de `jurunense.vteximg.com.br`** (CDN de terceiro — suspeito nº 1 do Merchant Center e ponto único de falha); hub `/porcelanato/` com 41 cards de **texto puro**; hero da malha sem imagem; galeria do produto sem zoom. **Ordem importa: o item 1 é fundação dos demais.**

### 🛡️🖼️ Fundação: donos das próprias imagens

- [ ] **⭐ 1. Self-host + otimização das 34 fotos do catálogo.** Script one-shot baixa as imagens pro repo (`public/img/produtos/`), o build gera variantes responsivas (WebP + width/height explícitos = zero CLS) e site/feed/OG passam a servir do próprio domínio. Mata 3 coelhos: risco de hotlink (se a Jurunense bloquear referer, o site inteiro fica sem foto), o suspeito nº 1 de reprovação no Merchant Center e o LCP. `check-feed` passa a validar URL própria.

### 🎨 Funil visual (depende do 1)

- [ ] **⭐ 2. Hub visual.** Os 41 cards da malha em `/porcelanato/` ganham foto de capa — 1º produto da categoria via `produtosDaCategoria()` (dado já computado no build); categoria sem produto mantém o card texto. É a página da âncora "porcelanato goiânia" deixando de parecer um sumário.
- [ ] **⭐ 3. Hero visual na malha.** O `pseo-hero` das 41 páginas ganha strip de 3–4 fotos reais da categoria (linkando pra galeria abaixo). Leve: imagens otimizadas do item 1, sem carrossel/JS.
- [ ] **4. Zoom na foto do produto.** `<dialog>` nativo full-screen no clique da foto principal — porcelanato é textura, ver grande decide compra. Zero-dep, ~30 linhas.

### 📸 Acervo (gate — sem isso não existe "inspiração")

- [ ] **5. Fotos ambientadas + 2ª foto por produto + vídeo (ops primeiro, dev depois).** O layout é a parte barata; **o acervo é o gate real** (média 1,1 foto/produto). Duda pede aos fornecedores/marcas — Biancogres e Delta têm banco oficial de imagens ambientadas (pedir autorização de uso). Com acervo em mãos: seção "Veja em ambiente" no produto/malha e o campo `video` passa a renderizar. **Não codar antes do acervo existir.**

## ⏭️ Próximo checkpoint

- **~07-15** — GSC miner + checkpoint da malha ([[backlog-pendencias]]): a partir daí os dados (GSC, Clarity, coluna Origem, `busca_interna` com 0 resultado) escolhem o ciclo 12 — não especular antes.
