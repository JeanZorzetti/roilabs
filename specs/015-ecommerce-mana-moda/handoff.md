# Handoff — 015 Maná Moda Social

**Ponto de entrada para continuar em outra sessão.** Última atualização: **18/08/2026 (A3, B parcial, C e a marca da D concluídas — falta o Bing e a Fase 4/split para vender de verdade)**.

A arquitetura da feature mudou: a Maná **saiu do build do site-goiania** e virou projeto
próprio, no formato do Tapepro. Este documento substitui o handoff da Fase 1 e as tasks
T012–T072 do `tasks.md` — aquela numeração assumia a arquitetura antiga. Se for retomar
pelo Spec Kit, as skills `speckit-*` estão em `.claude/skills` deste repo, e o caminho
honesto é `speckit-plan` de novo, não `speckit-implement` sobre o `tasks.md` velho.

---

## 0. Comece por aqui (não confie nos status deste doc)

Rode estes 4 comandos **antes de decidir qualquer coisa**. Eles medem o mundo; o resto
deste arquivo é do dia em que foi escrito.

```bash
# 1. A contenção do host antigo já está no ar? (se SIM: 302 e 404)
curl -s -o /dev/null -w "/ = %{http_code}\n"             https://mana.roilabs.com.br/
curl -s -o /dev/null -w "/porcelanato/ = %{http_code}\n" https://mana.roilabs.com.br/porcelanato/

# 2. O site novo já está servindo o host? (se SIM: título da Maná)
curl -s https://mana.roilabs.com.br/ | grep -o "<title>[^<]*</title>"

# 3. Estado dos dois repos
cd "C:/Users/jeanz/OneDrive/Desktop/ROI Labs/ROI Labs" && git log --oneline -3 && git status -s
cd "C:/Users/jeanz/OneDrive/Desktop/ROI Labs/Mana"      && git log --oneline -3 && git status -s

# 4. O mapa de cadeiras ao vivo — a Maná já aparece?
curl -s https://app.roilabs.com.br/api/cadeiras | python -c "import sys,json;[print(c['ordem'],c['niche']) for c in json.load(sys.stdin)]"
```

**Situação em 18/08, quando este doc foi escrito:** `/porcelanato/` respondia **200** no
host da Maná (contenção commitada e **não publicada**), o site novo **não** estava servindo
o host, e a Maná **não** aparecia em `/api/cadeiras`.

---

## 1. O que estava errado

A Fase 2 pôs a Maná dentro do build do `site-goiania`: um container, um `root` de nginx,
dois `server{}`. O host novo herdou o site inteiro do porcelanato.

| URL | Respondia |
|---|---|
| `mana.roilabs.com.br/` | **200 — a home de *fitas adesivas*** |
| `mana.roilabs.com.br/porcelanato/`, `/carrinho/`, `/guia/**` | 200, sob a marca Maná |
| `mana.roilabs.com.br/mana/**` | as únicas páginas que eram da Maná |

E o `Base.astro` compartilhado carimbava a marca errada **dentro** das páginas certas:
`<link rel=alternate>` de *"Guias de porcelanato"*, `Organization` se descrevendo como
*"fitas adesivas... porcelanato"*, e o botão flutuante de WhatsApp abrindo com *"Olá! Estou
no site de porcelanato de Goiânia"* — **na página do terno**.

O `research.md` D1 tratava o prefixo `/mana/` como compromisso aceitável do build
compartilhado. Ele era o sintoma; o problema era o build compartilhado.

---

## 2. Onde está cada coisa

| | Caminho | Repo / branch | Estado |
|---|---|---|---|
| **Site novo da Maná** | `ROI Labs/Mana` | `JeanZorzetti/mana` (**privado**), `main` | pushado, build verde |
| Doc do site novo | `Mana/CLAUDE.md` | idem | leia junto com este |
| Contenção do host antigo | `ROI Labs/site-goiania/nginx.conf` | `roilabs`, branch `015-ecommerce-mana-moda`, commit `46dea4f` | pushado, **não publicado** |
| Este handoff | `specs/015-ecommerce-mana-moda/handoff.md` | idem | — |

🚩 **A produção do goiania roda do branch `015-ecommerce-mana-moda`, não da `main`.**
Conferido: `git show origin/main:site-goiania/nginx.conf | grep -c mana` = **0**, e a
produção tem o 301 de `/mana/`. O EasyPanel **não** builda esse branch a cada push — os
deploys foram manuais. Push nesse branch **não publica nada sozinho.**

### O que o site novo já entrega

Astro estático + nginx próprio. A Maná mora na **raiz** (`/`, `/terno-poliviscose/`), e o
`nginx.conf` do projeto faz `301 /mana/** → /**`, transferindo o sinal das URLs indexadas.
`Base.astro` reescrito (a Maná é a entidade do `@graph`; Clarity e o tracker himetrica
ficaram de fora — instrumentação de outra marca). `global.css` com os ~10 tokens que as
páginas usam, no lugar das 1125 linhas do porcelanato. `--mana-accent` (`#c8a45c`)
finalmente definido — dentro do goiania o token não existia e todo destaque da loja de moda
social caía no laranja de obra.

Verificado: `npx astro build` verde (6 páginas) · `npx astro check` 0 erros ·
`npm test` 5/5 · `dist/` servido localmente sem referência quebrada.

`test/build.test.mjs` é o gate anti-regressão: roda contra o `dist/` e falha se marca de
outra loja ou o prefixo `/mana/` voltarem.
⚠️ **"Goiânia" a cidade NÃO entra na lista de proibidos** — a Maná é de Goiânia e a cidade
aparece na copy dos produtos e no rodapé. Casar o nome da cidade vira falso positivo (já
aconteceu nesta sessão; o teste foi corrigido para casar a marca da outra loja, não a cidade).

---

## 3. A fila — nesta ordem

### ⬜ A1. Publicar a contenção · *desbloqueia: parar a duplicação de hoje*

**Redeploy manual do serviço do goiania no EasyPanel.** O commit já está no branch que a
produção usa; falta só o build.

Aceite:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://mana.roilabs.com.br/porcelanato/     # 404
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://mana.roilabs.com.br/ # 302 -> /mana/
curl -s -o /dev/null -w "%{http_code}\n" https://mana.roilabs.com.br/mana/            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://goiania.roilabs.com.br/porcelanato/  # 200
```
🚨 O último não é opcional: os dois hosts saem do **mesmo container**, então um erro no
`nginx.conf` derruba o goiania junto. Não foi possível validar com `nginx -t` nesta máquina
(Docker parado, WSL sem sudo) — a conferência foi manual: chaves balanceadas, 2 `server{}`,
16 `location`, toda linha terminando em `;`, `{` ou `}`.

### ✅ A2. Subir o site próprio · feito em 18/08, **mudou de EasyPanel para Vercel**

O plano original (novo serviço EasyPanel + `Dockerfile`) foi trocado por deploy na Vercel — o
`Dockerfile`/`nginx.conf` do repo **ficaram sem uso em produção**, mas continuam servindo de
referência/fallback local. O que foi feito:

1. Clone de deploy em `C:\dev\mana` (fora do OneDrive — `vercel --prod` falha de dentro dele,
   ver [[vercel_deploy_fails_under_onedrive]]).
2. `vercel.json` criado e **commitado no repo** (`JeanZorzetti/mana@main`), traduzindo a lógica
   do `nginx.conf`: `framework: astro`, `outputDirectory: dist`, redirect
   `/mana/(.*) → /$1` (**regex, não `:path*`** — `:path*` não casa o `/` final, ficava 404 em
   `/mana/algo/`), rewrite `/sitemap.xml → /sitemap-index.xml`.
3. Projeto `jean-zorzettis-projects/mana` linkado ao GitHub — push em `main` já dispara deploy
   sozinho, sem passo manual.
4. Domínio adicionado ao projeto (`vercel domains add`), DNS trocado no Cloudflare (zona
   `roilabs.com.br`, record `mana`, `A 2.24.207.200 → 76.76.21.21`, **DNS-only**) via API com
   token temporário do Jean (revogado depois de confirmar).
5. Cert HTTPS **não saiu sozinho** depois do DNS — precisou `vercel certs issue
   mana.roilabs.com.br` manual (mesma fricção do [[vercel_cert_stuck_after_nxdomain]], mesmo
   sem ter passado por NXDOMAIN desta vez). Antes disso HTTP/80 já respondia 200 (`Server:
   Vercel`) mas HTTPS/443 dava falha de handshake total, não erro de cert — é o sintoma a
   procurar se isso se repetir noutro domínio.

Aceite (rodado e verde em 18/08):
```bash
curl -s https://mana.roilabs.com.br/ | grep -o "<title>[^<]*</title>"    # título da Maná ✓
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" \
     https://mana.roilabs.com.br/mana/terno-poliviscose/                 # 308 -> /terno-poliviscose/ ✓
curl -s https://mana.roilabs.com.br/sitemap.xml | head -3                # sitemap-index ✓
curl -s https://mana.roilabs.com.br/ | grep -c porcelanato               # 0 ✓
curl -s -o /dev/null -w "%{http_code}\n" https://goiania.roilabs.com.br/porcelanato/  # 200 ✓ (A1 intacta)
```
Nota: os 308 (não 301) são a Vercel preservando método no redirect — equivalente a 301 para SEO,
Google trata os dois como permanentes.

⚠️ **Consequência para A3** (já resolvida — ver abaixo): como o host não passa mais pelo
container do goiania, a contenção da A1 (`nginx.conf` do `site-goiania`) virou vestigial
para este domínio.

### ✅ A3. Remover a Maná do site-goiania · feito em 18/08

Removido de `site-goiania`: `src/pages/mana/**` (5 arquivos), `src/components/HeaderMana.astro`,
`FooterMana.astro`, `SeletorVariacao.astro`, `src/data/mana.ts`, `src/scripts/check-mana.mjs`
(e a entrada dele no `prebuild`), o 2º `server{}` do `nginx.conf`, e a prop `siteBase` do
`Base.astro`. `src/data/lojas.ts` perdeu a entrada `mana` (e o import de `produtosMana`).

O `location /mana/` que sobra no host do goiania agora é regex (`~ ^/mana/(.*)$`) e aponta
**direto** para `https://mana.roilabs.com.br/$1` — antes encadearia dois 301 (goiania → mana
com `/mana/` → mana sem prefixo).

`check-lojas.mjs` também precisou de ajuste (não estava na lista original): lia
`data/mana.ts` por parse textual para validar o catálogo; essa leitura saiu junto, senão o
prebuild quebra com `ENOENT`.

⚠️ O **app continua dono do checkout**: `app/src/lib/lojas.ts` e `app/src/lib/precos-mana.ts`
ficam intactos. `app/test/mana-paridade.test.mjs` **não podia só "continuar rodando"** como o
handoff anterior previa — ele lia `site-goiania/src/data/mana.ts` como a fonte "site" da
paridade, e esse arquivo deixou de existir. Corrigido para ler `../Mana/src/data/mana.ts`
(repo `JeanZorzetti/mana`, sibling fora deste git) em vez disso — é o espelho real agora.
Igual ao padrão já usado em `check-mana.mjs` para `precos-mana.ts`: `existsSync` com aviso em
vez de falha dura, porque esse repo irmão só existe no checkout local do Jean, não em
CI/deploy do `app`.

Verificado: `npx astro build` no site-goiania → **99 `<loc>`** no sitemap (igual ao número de
antes da 015) · `node check-lojas.mjs` + `check-matrix.mjs` + `check-cart-math.mjs` +
`check-cadeiras.mjs --self-test` verdes (prebuild completo, rodado manualmente porque
`npx astro build` não dispara os hooks do npm) · `npm test` verde no `app` (paridade real:
24 SKUs contra `Mana/src/data/mana.ts`).
🚨 `npm run build` no site-goiania **submete ao IndexNow** (está no `Dockerfile`). Build
exploratório é sempre `npx astro build`.

### ✅ B (parcial). Ligar o checkout — feito em 18/08, `LOJA_PUBLICADA` segue `false`

Itens 1-4 abaixo foram implementados e verificados; item 5 (o lembrete) continua valendo.
`EstoqueVariacao` foi aplicado em produção (`prisma db push`, confirmado por query direta).
`app/src/lib/cors.ts` substitui os `SITE_ORIGIN` hard-coded em `frete/cotar` e
`cupom/validar`, e `app/src/lib/lojas.ts` ganhou `hostPadrao` por cadeira — o open redirect
de `pedidos/route.ts` (qualquer `origin` começando com "http" passava) fechou nos 3 pontos
que liam esse campo. Teste: `app/test/cors-allowlist.test.mjs`.

O carrinho (item 4) foi portado para `Mana/src/lib/cart.ts` + `AddToCart.astro` +
`CartCount.astro` + `carrinho.astro` — versão enxuta (1 cadeira, 1 unidade, sem simulador
m², sem link compartilhável, sem orçamento por WhatsApp: nada disso existe no catálogo da
Maná). `astro build` e `npm test` verdes nos dois repos (`app` e `Mana`).

⚠️ **Ainda falta para vender de verdade** (fora do escopo desta rodada, é a Fase 4 do
plan.md): o débito de estoque não está ligado ao webhook (`estoque.ts` só tem a leitura,
não o débito condicional — sem caller ainda), e o split no Mercado Pago (token da conta da
Maná, OAuth, `marketplace_fee`) não existe. `LOJA_PUBLICADA` em `Mana/src/data/loja.ts`
continua `false` de propósito — virar `true` sem isso publica uma loja que não cobra certo.

### ✅ C. Cadeira da Maná na roilabs.com.br — feito em 18/08

Linha inserida em produção (`Cadeira`, `ordem: 3`, `estado: 'em-preparacao'`,
`siteUrl: 'https://mana.roilabs.com.br/'`, `daCasa: false`), idempotente por `siteUrl`.
`app/src/lib/seats.ts` (`DEFAULT_SEATS`, 4º item) e `site/src/pages/index.astro` (`seats`,
4º item) atualizados na mesma entrega — 12 `<li>` no grid (4 nichos + 8 projetos),
conferido no `dist/index.html` depois de `npx astro build`. Card aparece como "Em
preparação · Maná Moda"; vira `'ocupada-vendavel'` só no dia em que a Fase 4 fechar.

### 🟡 D. Marca da Maná — 3 de 4 feitos em 18/08; falta só o Bing

O que destravou: o Jean forneceu o logo do cliente em
`specs/015-ecommerce-mana-moda/logo/Design sem nome (13).svg`. **Cuidado: aquilo não é
vetor.** São 947KB de SVG embrulhando um JPEG 2560² (`<image xlink:href="data:image/jpeg">`)
— não escala, não muda de cor, e o wordmark dele diz **"Mana", sem acento**.

Daí saiu uma marca vetorial nova, no padrão do `tape-vision-ai-92` e do
`potencial-arquitetado`: gerador paramétrico + `Logo.astro` com variantes.

| Item | Estado |
|---|---|
| Favicon próprio | ✅ `public/favicon.svg` + `icon-32.png` + `apple-touch-icon.png` |
| Imagem OG própria | ✅ `public/og/default.png` (1200×630) + `og/logo.svg` |
| Identidade visual | ✅ `--mana-accent` virou o dourado do logo (`#f5c451`, amostrado do anel) |
| Verificação Bing Webmaster | ⬜ **continua bloqueado** — exige login na conta do Jean |

**O acento vem do TEXTO, não do desenho.** O lockup põe "Maná" num `<text>` com a fonte do
site (Archivo), então o navegador compõe o acento que a arte original não tem. É por isso
que o wordmark não foi vetorizado junto da pomba — e é o que o teste novo
`marca: assets gerados no dist e wordmark acentuado` protege.

Regeração: `node scripts/build-logo.mjs` no repo `Mana` reescreve os 6 arquivos a partir
dos knobs em `K`. A receita completa está no cabeçalho do script. Duas armadilhas já
pagas e anotadas lá: as primárias da asa têm que pesar **na ponta** (`t**0.8`) — invertido
vira mariposa; e a cauda tem que ser **penas individuais** (traços com ponta arredondada) —
arco fechado vira saia.

⚠️ O `favicon.svg` é uma variante **simplificada** de propósito (sem raios, anel mais
grosso, pomba 10% maior): a marca completa empastela abaixo de ~48px. Mesmo motivo do
`icon.svg` do potencial-arquitetado.

🚨 **O tamanho do texto do lockup não significa nada sozinho.** A marca preenche os 64 de
altura do `viewBox`, então cada unidade de `font-size` vale `altura_renderizada / 64` px.
Na primeira entrega o kicker estava em 9 unidades num header de 40px = **5,6px na tela,
ilegível** — e passou porque eu estava julgando num preview de 512px. Hoje: header a 48px,
`Maná` = 21px, `MODA SOCIAL` = 9,8px (medido no HTML de produção). Mexeu em `K.lockup`?
**Screenshot da página construída**, nenhum teste pega isso.

⚠️ A OG foi renderizada nesta máquina com `sharp`/librsvg, que não tem a Archivo instalada
no SO — o texto dela caiu no fallback (Segoe UI). O site em si continua em Archivo de
verdade. Se isso incomodar, é instalar a fonte e rodar o gerador de novo.

Verificado: `npx astro build` verde (7 páginas) · `npx astro check` 0 erros · `npm test`
**6/6** · SVG do header extraído do `dist/index.html` e renderizado — o acento chega ao
HTML publicado.

🚩 A frase que precisa sobreviver, de B item 5 do texto original: **sandbox verde do MP
prova a fiação, não prova que dinheiro real chega.** Cartão real segue vetado.

---

## 4. Armadilhas que atravessam tudo

- 🚨 `git push` em `main` no repo `roilabs` **é deploy** — inclui `site-goiania`. Confirmado
  em 18/08 na entrega da A3: push em `main` bastou, sem redeploy manual no EasyPanel (o
  parágrafo anterior deste doc, dizendo que só o branch `015-ecommerce-mana-moda` publicava
  e que exigia deploy manual, estava desatualizado/errado — corrigido aqui).
- 🚨 `npm run build` no `site-goiania` **submete ao IndexNow**. Use `npx astro build`.
  O projeto da Maná não tem esse gatilho.
- ⚠️ Banco: `2.24.207.200:5443/roilabs_db`. `:5445` é o `roihub_db` — schema errado.
- ⚠️ O `DATABASE_URL` do `.env` da raiz aponta para o host interno do Docker e tem um `]`
  colado no fim. Usar o endpoint externo sem o `]` (`quickstart.md §0`).
- ⚠️ Este repo mora numa pasta com **espaço no nome** ("ROI Labs"). `new URL(...).pathname`
  devolve `%20` e o `fs` não resolve — usar `fileURLToPath`. Já mordeu no
  `Mana/test/build.test.mjs` nesta sessão.
- ⚠️ Docker Desktop parado e WSL sem sudo nesta máquina: **não dá para rodar `nginx -t`
  localmente**. Mudança em `nginx.conf` é conferida à mão e verificada em produção logo
  após o deploy.

## 5. Fotos

Originais (até 46MB, SVG com C2PA embutido) seguem fora do git. A versão que o site usa está
em `Mana/public/img/mana/`. Catálogo novo: receber a foto → extrair/otimizar com `sharp` →
salvar em `Mana/public/img/mana/` → adicionar em `Mana/src/data/mana.ts`.
