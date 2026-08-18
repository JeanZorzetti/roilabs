# Handoff — 015 Maná Moda Social

**Ponto de entrada para continuar em outra sessão.** Última atualização: **18/08/2026 (A3 concluída)**.

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

### ⬜ B. Ligar o checkout — o trabalho está no `app`, não no site novo

`Mana/src/data/loja.ts` tem `LOJA_PUBLICADA = false`, e por isso o `@graph` do produto sai
**sem `offers`** (preço sem caminho de checkout é oferta fabricada). Virar `true` sem os
itens abaixo publica uma loja que não vende.

1. **`/api/estoque` não existe.** `SeletorVariacao` já o chama e falha fechado (nada é
   marcado como esgotado). Criar em `app/src/app/api/estoque/route.ts`, aceitando
   `?cadeira=mana` e devolvendo `{ ok: true, estoque: { "<sku>": <qtd> } }`.
2. **O CORS fixa o host errado.** Duas rotas com a origem escrita à mão:
   - `app/src/app/api/frete/cotar/route.ts:10` → `const SITE_ORIGIN = 'https://goiania.roilabs.com.br'`
   - `app/src/app/api/cupom/validar/route.ts:13` → idem

   De `mana.roilabs.com.br` o browser **bloqueia as duas chamadas**. Precisa virar allowlist
   (goiania + mana), com o header refletindo a origem do request quando ela estiver na lista.
3. 🚨 **Open redirect pré-existente**, adjacente e consertado pela mesma allowlist:
   `app/src/app/api/pedidos/route.ts:25` monta o retorno com
   `origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br'` — qualquer
   `origin` vindo do formulário que comece com `http` vira destino de redirect.
4. **O carrinho em si — decisão em aberto, não tomada.** O
   `site-goiania/src/pages/carrinho.astro` (656 linhas) é o motor multicadeira da 013.
   Ou porta-se para o projeto da Maná só a fatia da cadeira `mana`, ou a compra fica no
   goiania. O Jean escolheu "e-commerce próprio no site da Maná" em 18/08, o que aponta para
   portar — mas o corte do motor não foi feito.
5. 🚩 A frase que precisa sobreviver: **sandbox verde do MP prova a fiação, não prova que
   dinheiro real chega.** Cartão real segue vetado.

### ⬜ C. Cadeira da Maná na roilabs.com.br

Hoje a Maná não tem card na home. **É mais simples do que a versão anterior deste doc
dizia** — conferido em 18/08 contra `/api/cadeiras`:

```
nichos:   ordem 0, 1, 2   (polo Goiânia)
projetos: ordem 8 .. 15   (polo Carteira)
-> a faixa 3..7 está VAGA, sobrou dos 5 nichos de construção removidos em 07/08
```

Então a Maná entra em **`ordem: 3`** e cai sozinha no lugar certo, **sem reordenar nada**.
E o `s.ordem >= 8` que classificava nicho vs. projeto **já foi removido** — quem decide hoje
é o `data-projeto` que o template marca.

Mas continua sendo **mudança atômica** (banco + código no mesmo deploy):
`site/src/pages/index.astro` renderiza `seats` (3 nichos) e `carteira` (8 projetos) no
**mesmo `<ul>`**, e o script ao vivo casa cada card com `/api/cadeiras` **por índice**
(`seats[i]`). São 11 cards ↔ 11 linhas. Só código = 12 cards contra 11 linhas, e o card novo
passa a exibir o dado do vizinho.

Os três lugares:

1. **Banco** (`roilabs_db @ 2.24.207.200:5443`) — uma linha em `Cadeira`:
   `ordem: 3`, `polo: 'Goiânia'`, `niche: 'Moda social masculina'`, `open: false`,
   `estado: 'em-preparacao'`, `status: 'Em preparação · Maná Moda'`,
   `siteUrl: 'https://mana.roilabs.com.br/'`, `daCasa: false`, `exibirDaCasa: false`.
   `daCasa: false` porque a Maná é parceiro externo e a venda **gera success fee** — é o que
   `lojas.ts` já diz (`pagoA: 'Maná Moda'`, `split.comissaoPct: 0.1`), mesma leitura da
   Tapepro. (A regra geral é fail-closed para `true`; aqui não há dúvida.)
2. `app/src/lib/seats.ts` → `DEFAULT_SEATS`, como **4º** item.
3. `site/src/pages/index.astro` → array `seats`, como **4º** item, com
   `href: 'https://mana.roilabs.com.br/'`.

Não precisa de `npm run gen:carteira` — aquilo regenera `carteira.ts` a partir de
`PROJETOS_CADEIRA`, que não muda aqui.

**Estado honesto**: `em-preparacao` enquanto o checkout não fecha. Vira `'ocupada-vendavel'`
/ `'Ocupada · Maná Moda'` no dia em que **B** fechar — não antes.

### ⬜ D. Pendências de marca da Maná (baratas, nenhuma bloqueia)

- `Mana/public/favicon.png` ainda é o ícone da ROI Labs.
- Sem imagem OG própria — o default é a foto do terno.
- Sem verificação do host no Bing Webmaster. Sem ela o **IndexNow devolve 403** (a
  verificação é por host; a do goiania não vale aqui).
- O visual ainda é o tema escuro do porcelanato com um accent novo. **Identidade visual
  própria da Maná não foi feita** — é trabalho de design à parte.

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
