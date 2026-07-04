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

## 🧭 Fora da caixa — ciclo 11 (2026-07-04) — 4/4 itens de código EXECUTADOS (`e7978a0`)

> [!note] Tema: **funil visual a partir de `/porcelanato`** (pedido do Jean: porcelanato é compra visual, o funil hoje é texto-pesado). Verificado contra o código em 2026-07-04: 30 produtos com **média 1,1 foto** cada (0 vídeos, apesar do campo `video` já existir no JSON); **34/34 imagens em hotlink de `jurunense.vteximg.com.br`** (CDN de terceiro — suspeito nº 1 do Merchant Center e ponto único de falha); hub `/porcelanato/` com 41 cards de **texto puro**; hero da malha sem imagem; galeria do produto sem zoom. **Ordem importa: o item 1 é fundação dos demais.**

### 🛡️🖼️ Fundação: donos das próprias imagens

- [x] **⭐ 1. Self-host + otimização das 34 fotos do catálogo — FEITO 2026-07-04 (`e7978a0`).** `fetch-images.mjs` (one-shot, idempotente) baixou as 34 fotos pra `public/img/produtos/` (2 MB), gerou variante de exibição `.webp` ≤900px (`imgDisplay` em `produtos.ts`) e reescreveu `porcelanatos.json` com caminho local — original fica pra feed/OG/zoom. Feed, image sitemap (199 locs) e Product JSON-LD emitem URL absoluta própria (`imgAbs`); **`check-feed` agora FALHA se `g:image_link` sair do domínio** (hotlink de terceiro virou regressão detectável). Gotcha corrigido de brinde: `Base.astro` só emite `og:image` 1200×630 pra imagens de social — foto de produto tem proporção própria. Zero refs `vteximg` no dist. ⏳ watch: Merchant Center vai re-crawlear o feed com URLs novas de imagem — itens podem voltar a "Em análise" por uns dias (junto do Diagnóstico ~07-05).

### 🎨 Funil visual (depende do 1)

- [x] **⭐ 2. Hub visual — FEITO 2026-07-04 (`e7978a0`).** 38 dos 40 cards da malha em `/porcelanato/` ganharam capa (foto do 1º produto da categoria, `loading="lazy"`, hover com zoom sutil); 2 categorias sem produto seguem como card texto (fallback por design). E2E: 38 capas renderizando no preview.
- [x] **⭐ 3. Hero visual na malha — FEITO 2026-07-04 (`e7978a0`).** `pseo-hero__strip`: até 4 fotos reais da categoria no hero, cada uma linkando pra âncora `#catalogo` da galeria. Sem carrossel/JS — só HTML+CSS com as webp do item 1.
- [x] **4. Zoom na foto do produto — FEITO 2026-07-04 (`e7978a0`).** Foto principal virou `<button cursor:zoom-in>` que abre `<dialog>` nativo (top-layer passa por cima do MiniCart) com o **original full-res** (`data-full`), não a webp. Bônus: thumbs agora TROCAM a foto principal (antes eram estáticas — produto com 5 fotos não tinha como ver as outras). E2E Playwright: abre com original, fecha no ✕/backdrop.

### 📸 Acervo (gate — sem isso não existe "inspiração")

- [ ] **5. Fotos ambientadas + 2ª foto por produto + vídeo (ops primeiro, dev depois).** O layout é a parte barata; **o acervo é o gate real** (média 1,1 foto/produto). Duda pede aos fornecedores/marcas — Biancogres e Delta têm banco oficial de imagens ambientadas (pedir autorização de uso). Com acervo em mãos: seção "Veja em ambiente" no produto/malha e o campo `video` passa a renderizar. **Não codar antes do acervo existir.**

## ⏭️ Próximo checkpoint

- **~07-15** — GSC miner + checkpoint da malha ([[backlog-pendencias]]): a partir daí os dados (GSC, Clarity, coluna Origem, `busca_interna` com 0 resultado) escolhem o ciclo 12 — não especular antes.
