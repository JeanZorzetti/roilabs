# Handoff — 015 Maná Moda Social

**Status em 18/08/2026**: a arquitetura da feature MUDOU. A Maná saiu do build do
site-goiania e virou **projeto próprio**, no formato do Tapepro. Este documento substitui
o handoff de fim da Fase 1 e é o ponto de entrada da próxima sessão.

## O que estava errado (verificado em produção, 18/08)

A Fase 2 (T012–T023) pôs a Maná dentro do build do `site-goiania`: um container, um `root`
de nginx, dois `server{}`. O host novo herdou o site inteiro do porcelanato.

| URL | O que respondia |
|---|---|
| `mana.roilabs.com.br/` | **200** — a home de *fitas adesivas* da ROI Labs |
| `mana.roilabs.com.br/porcelanato/` | 200 — guias de porcelanato, sob a marca Maná |
| `mana.roilabs.com.br/carrinho/` | 200 |
| `mana.roilabs.com.br/mana/**` | 200 — as únicas páginas que eram da Maná |

E o `Base.astro` compartilhado carimbava a marca errada dentro das páginas da Maná:

- `<link rel="alternate">` → *"Guias de porcelanato — ROI Labs Goiânia"*;
- `Organization` do `@graph` se descrevendo como *"fitas adesivas... porcelanato"*;
- o botão flutuante de WhatsApp, **na página do terno**, abrindo com
  *"Olá! Estou no site de porcelanato de Goiânia e quero uma ajuda."*

O `research.md` D1 tratou o prefixo `/mana/` como compromisso aceitável do build
compartilhado. Ele não era o problema — era o sintoma. O problema era o build compartilhado.

## O que existe agora

### 1. Projeto próprio da Maná — FEITO

`C:\Users\jeanz\OneDrive\Desktop\ROI Labs\Mana` · repo **`JeanZorzetti/mana`** (privado) ·
Astro estático + nginx próprio, o mesmo formato do Tapepro.

- A Maná mora na **raiz**: `/`, `/terno-poliviscose/`. O `nginx.conf` do projeto faz
  `301 /mana/** → /**`, preservando o sinal das URLs já indexadas.
- `Base.astro` reescrito: `@graph` com a **Maná** como entidade, sem Clarity e sem o
  tracker himetrica (instrumentação de outra marca), GA4 atrás de env var.
- `global.css` com os ~10 tokens e 6 primitivas que as páginas usam, no lugar das 1125
  linhas do design system do porcelanato.
- `--mana-accent` **definido** (`#c8a45c`). Dentro do goiania o token nunca existiu, então
  todo destaque da Maná caía no fallback e a loja de moda social pintava no laranja de obra.
- `test/build.test.mjs` roda contra o `dist/` e falha se marca de outra loja ou o prefixo
  `/mana/` voltarem. **5/5 verdes**; `astro build` verde; `astro check` 0 erros.

### 2. Contenção do host antigo — COMMITADA, NÃO PUBLICADA

`site-goiania/nginx.conf` (commit `46dea4f`, branch `015-ecommerce-mana-moda`) transforma o
host da Maná em allowlist: só `/mana/**` + assets respondem, o resto é 404, e `/` faz
**302** (não 301 — o redirect inverte quando o site próprio subir) para `/mana/`.

🚩 **Está no GitHub e NÃO está no ar.** Conferido 3× após o push: `/porcelanato/` ainda
responde 200 em `mana.roilabs.com.br`. O EasyPanel não builda este branch sozinho —
a produção do goiania roda deste branch por deploy manual (a `origin/main` não tem uma
linha sequer sobre mana no nginx). **Precisa de redeploy manual do serviço do goiania.**

## O que falta

### A. Publicar (ordem importa)

1. **Redeploy manual do goiania no EasyPanel** → contenção entra no ar.
2. **Criar o serviço da Maná no EasyPanel** apontando para `JeanZorzetti/mana`, e mover o
   host `mana.roilabs.com.br` para ele. O DNS já existe e o cert já está emitido.
3. Só **depois** que o host novo estiver servindo o projeto novo: remover
   `pages/mana/**`, `components/HeaderMana|FooterMana|SeletorVariacao`, `data/mana.ts` e o
   2º `server{}` do `site-goiania`. Remover antes deixa a Maná no escuro.
4. Ao remover, o `location /mana/` que sobra no host do goiania deve apontar **direto**
   para `https://mana.roilabs.com.br/$1` — hoje encadearia dois 301.

### B. Checkout — bloqueado no `app`, não neste site

`src/data/loja.ts` mantém `LOJA_PUBLICADA = false`, e por isso o `@graph` do produto sai
**sem `offers`**. Ligar depende de duas coisas no `app/`:

1. **`/api/estoque` não existe.** `SeletorVariacao` já o chama e falha fechado.
2. **CORS fixa o host errado.** `app/src/app/api/frete/cotar/route.ts` e
   `.../cupom/validar/route.ts` têm `const SITE_ORIGIN = 'https://goiania.roilabs.com.br'`
   escrito à mão. De `mana.roilabs.com.br` o browser bloqueia as duas chamadas. Precisa
   virar allowlist de origens.
3. ⚠️ Achado adjacente, **pré-existente**: `app/src/app/api/pedidos/route.ts` monta o
   redirect de volta com `origin.startsWith('http') ? origin : <default>` — qualquer
   `origin` vindo do formulário que comece com `http` vira destino de redirect. É open
   redirect. A mesma allowlist do item 2 resolve.

### C. Cadeira na roilabs.com.br — PREPARADA, NÃO APLICADA

A Maná não tem card na home da ROI Labs. Adicionar **não é mudança só de código**:

`site/src/pages/index.astro` renderiza `seats` (3 nichos) e `carteira` (8 projetos) no
**mesmo `<ul>`**, e o script ao vivo casa cada card com `/api/cadeiras` **por índice**
(`seats[i]`). Hoje são 11 cards ↔ 11 linhas, alinhados. Inserir a Maná como 4º nicho só no
código empurra todos os projetos uma posição — o card da Maná exibiria o status do Polaris,
e assim por diante.

Então a mudança é atômica: linha `Cadeira` no `roilabs_db` com `ordem = 3` + reordenar os
8 projetos para 4..11 + `DEFAULT_SEATS` + o espelho estático + `npm run gen:carteira`.

Estado honesto enquanto o site não vende: `estado: 'em-preparacao'`,
`status: 'Em preparação · Maná Moda'`. Vira `ocupada-vendavel` quando o checkout fechar.

## Avisos que continuam valendo

- 🚨 `npm run build` no `site-goiania` **submete ao IndexNow** (está no `Dockerfile`, roda
  em todo deploy). Build exploratório é `npx astro build`. O projeto da Maná não tem isso.
- 🚨 `git push` em `main` no repo `roilabs` é deploy.
- ⚠️ Banco: `2.24.207.200:5443/roilabs_db`. `:5445` é o `roihub_db`.
- 🚩 **Sandbox verde do MP prova a fiação, não prova que dinheiro real chega.** Cartão real
  segue vetado.
- Pendências de marca da Maná: `favicon.png` ainda é o ícone da ROI Labs, não há imagem OG
  própria, e o host não tem verificação no Bing (sem ela o IndexNow devolve 403 — é por host).
- O visual ainda é o tema escuro do porcelanato com um accent novo. Identidade visual
  própria da Maná é trabalho de design à parte, não foi feito.

## Fotos

Originais (até 46MB, SVG com C2PA embutido) seguem fora do git. A versão que o site usa
está em `Mana/public/img/mana/` (no repo novo). Fluxo para catálogo novo: receber a foto →
extrair/otimizar com `sharp` → salvar em `public/img/mana/` → adicionar em `src/data/mana.ts`.
