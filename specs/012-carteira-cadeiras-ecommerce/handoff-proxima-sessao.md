# Handoff — próxima sessão (3 itens do Jean, 07/08/2026)

---

# ✅ EXECUTADO em 07/08 — itens 1 e 2 (commitados, **NÃO pushados**)

**Decisões do Jean, tomadas antes de escrever:** saída **B** (casar por `siteUrl`) · os **5
rótulos propostos aceitos** · Meridian **pivotou** para finanças (o subdomínio está certo, a
memória é que estava velha) · fusão com **skeleton estático GERADO**.

O que mudou:

| arquivo | o quê |
|---|---|
| [app/prisma/seed.ts](../../app/prisma/seed.ts) | chave = `siteUrl` (fallback `niche` só para a `atma`, que se auto-cura na 1ª rodada). `niche` passou a ser ESCRITO no update |
| [app/src/lib/seats.ts](../../app/src/lib/seats.ts) | os 5 rótulos novos |
| [site-goiania/src/data/cadeiras.ts](../../site-goiania/src/data/cadeiras.ts) | `CRM / Solar` → `CRM de vendas` (o 2º lugar, escrito à mão) |
| [app/scripts/gen-carteira.ts](../../app/scripts/gen-carteira.ts) + `npm run gen:carteira` | gera o skeleton no-JS de `seats.ts`. Sem rede, sem build-time fetch |
| `site/src/data/carteira.ts` | **GERADO e commitado** — o Docker do `site` só copia `site/`, então `../app` não existe no build dele |
| [site/src/pages/index.astro](../../site/src/pages/index.astro) | `#carteira` apagada · 16 cards num grid só · copy nova · o laço JS **atualiza** os 16, nunca cria `<li>` |
| [app/test/cadeira-chave-siteurl.test.mjs](../../app/test/cadeira-chave-siteurl.test.mjs) | novo, na suíte |

Medido, não lembrado: `npm test` **18/18** · `tsc --noEmit` limpo · `dist/index.html` do `site`
com **16 cards no HTML inicial**, zero duplicado, `#carteira` ausente, `daCasa` só em
comentário · `site-goiania` builda 105 páginas. O teste novo foi conferido **falhando** antes
de conferido passando (dessincronizei o skeleton de propósito).

## 🚨 O ÚNICO passo que falta — e por que o push está segurado

`niche` é editável no `/admin`, então quem manda na tela é o **BANCO**: o laço JS reescreve o
rótulo dos 16 cards com o que `/api/cadeiras` devolve. **O banco ainda tem os rótulos velhos.**

Deployar agora colocaria `Imobiliário / IA` e os outros 4 **dentro da vitrine** — exatamente o
que a ordem deste handoff existia para impedir. Não há `.env` com `DATABASE_URL` neste
ambiente, então o seed em produção não roda daqui.

**Duas formas de destravar, as duas do Jean:**

1. `cd app && npm run db:seed` com a `DATABASE_URL` de produção — aplica os 5 rótulos **e**
   fecha a **T072b** que já estava pendente (`daCasa` de `vertice`/`orcaobra` + `estado` de
   `Fitas adesivas`, hoje `vaga` no ar contra `ocupada-vendavel` no arquivo).
2. Renomear os 5 à mão no `/admin` (é um `<input>`) — instantâneo, sem seed e sem deploy.

**Depois de qualquer uma das duas: `git push` (= deploy).** O commit já está pronto.

---


**Contexto**: a 012 está em **68 de 84 tasks**, `npm test` 17/17, tudo pushado em `main`
(`7645d67`). O histórico completo da feature está em [handoff.md](./handoff.md) — **este
arquivo é só o que vem a seguir**, e nasceu de o Jean olhar a home depois do deploy.

Os três itens, **na ordem em que devem ser feitos** (não é a ordem em que foram pedidos):

| # | item | por que nesta ordem |
|---|---|---|
| **1º** | **Consertar os rótulos das cadeiras** (item 3 do Jean) | O item 2 move esses cards para a seção principal da home. Mover rótulo errado para a vitrine é pior que deixá-lo escondido |
| **2º** | **Fundir "A carteira" no "Mapa de cadeiras"** (item 2) | Depende dos rótulos certos |
| **3º** | **`goiania.roilabs.com.br`** (item 1) | Trava em credencial, não em código — pode correr em paralelo se o Jean liberar o Stripe |

---

# 1º — 🚨 "Imobiliário não existe": são CINCO rótulos errados, não um

O Jean apontou o card `Imobiliário / IA`. Fui conferir **abrindo cada um dos 8 sites** em
07/08 e o problema é maior: **5 dos 8 rótulos não descrevem o produto que está no ar.**

| card na home | `niche` atual | o que o site REALMENTE é (lido no ar, 07/08) | veredito |
|---|---|---|---|
| polarisia | `Imobiliário / IA` | **"Polaris IA — Plataforma de Orquestração de Agentes IA"**. Zero menção a imóvel, corretor ou imobiliária na página inteira | ❌ **errado** |
| meridian | `Beleza / Estética` | **"Meridian — See every dollar."** *A precision-built personal finance engine* | ❌ **errado** |
| vertice | `Vértice` | "Vértice – Automated Client Onboarding" · h1: *Acabe com o Caos do Onboarding* | ❌ **é o nome do produto, não um nicho** |
| orion | `Orion` | "Orion Nova — Sistema Completo de Gestão Empresarial" (ERP + CRM + financeiro) | ❌ **é o nome do produto, não um nicho** |
| sirius | `CRM / Solar` | CRM de vendas genérico. Solar é **1 de 5** segmentos que o próprio site lista (corretores, solar, agências, consultores, representantes) | ⚠️ **estreito demais** |
| estetiacrm | `CRM / Estética` | "Estetia CRM — Gestão para Clínicas de Estética" | ✅ certo |
| context | `Ferramentas de dev` | "Context Keeper — Context Lifecycle Manager for AI Coding Agents" | ✅ certo |
| orcaobra | `Orçamento de obra` | "Planilha de Orçamento de Obras e Reformas em Excel" | ✅ certo |

Os 8 rótulos de **nicho de Goiânia** (`Revestimentos / Porcelanato` … `Ortodontia /
Alinhadores`) estão certos e **não** entram nesta lista. O problema é só das cadeiras de
projeto.

## 🚩 A ARMADILHA — renomear só no `seats.ts` CRIA CADEIRA DUPLICADA

Isto não é opinião, é o código. Em [app/prisma/seed.ts](../../app/prisma/seed.ts):

```ts
const existing = await prisma.cadeira.findFirst({ where: { niche: dados.niche } });
if (existing) { /* update */ } else { /* CREATE */ }
```

**`niche` é a CHAVE DE CASAMENTO do seed.** Trocar `'Imobiliário / IA'` por qualquer outra
coisa em `seats.ts` faz o `findFirst` não achar nada → o seed **cria uma linha nova**, e a
antiga fica no banco com o rótulo velho. Resultado: **duas cadeiras para o mesmo projeto**,
as duas servidas por `/api/cadeiras`, as duas desenhadas na home.

É exatamente a armadilha que o handoff da 012 já registrava para as 26 cadeiras da T066 — só
que agora ela dispara sobre linhas **que já existem em produção**.

### As duas saídas (escolher uma, não improvisar)

**A. `UPDATE` no banco antes de mexer no arquivo** — renomeia a linha existente, depois o
seed volta a casar. Uma migração de dado, à mão, ou um script `.mjs` único.

**B. Parar de casar por `niche` e passar a casar por `siteUrl`** — que é o que a memória do
roihub já diz ser a chave certa (*"a chave é a URL do site, NÃO o repo"*, e nem o rótulo).
`siteUrl` tem `@unique` desde a migração da 012, e as 9 cadeiras de projeto já o têm
preenchido. **É a saída que mata a classe do bug**, não só esta ocorrência — depois dela,
renomear rótulo vira edição de texto e nunca mais duplica cadeira.

👉 **Recomendação: B.** É mais diff hoje e menos armadilha para sempre — e destrava a T066,
onde a mesma armadilha voltaria ×26. Fazer A é aceitável se a pressa for real, mas então
**anotar que a T066 continua minada**.

⚠️ Seja qual for: `siteUrl` das 8 cadeiras de projeto **já está em produção** (conferido).
`niche` das outras 26 nunca existiu — se a decisão for B, a T066 deixa de precisar dele.

## Os rótulos propostos — CONFIRMAR COM O JEAN antes de escrever

Derivei cada um do que o site diz de si mesmo, não de palpite. Ele decide:

| projeto | proposta |
|---|---|
| polarisia | `Orquestração de agentes IA` |
| meridian | `Finanças pessoais` |
| vertice | `Onboarding de clientes` |
| orion | `ERP / Gestão empresarial` |
| sirius | `CRM de vendas` (hoje `CRM / Solar`) |

⚠️ **Uma dúvida que NÃO é de rótulo, e precisa ir para o Jean separada:** a memória do
projeto registra o **Meridian como laboratório de BELEZA** (para a vaga da FitNext, em
`C:\dev\meridian`). Mas `meridian.roilabs.com.br` serve **um app de finanças pessoais**. Ou o
produto pivotou, ou **o subdomínio está apontando para outro projeto**. Renomear o rótulo
antes de saber qual dos dois é o caso conserta a legenda de uma foto errada.

⚠️ E se o `sirius` for renomeado, lembrar que a página de cadeira dele
([site-goiania/src/data/cadeiras.ts](../../site-goiania/src/data/cadeiras.ts)) tem
`niche: 'CRM / Solar'` escrito à mão — são **dois** lugares, e o `check-cadeiras` não compara
os dois.

---

# 2º — Fundir "A carteira" dentro do "Mapa de cadeiras"

Pedido do Jean: mover as empresas de **"Prova de operação · A carteira"** para dentro de
**"Escassez programada · Mapa de cadeiras — Goiânia"**. Um grid só, 16 cards.

## O diff mecânico é pequeno

Em [site/src/pages/index.astro](../../site/src/pages/index.astro):

1. Apagar a `<section id="carteira">` inteira (o `<div class="section__head">` e o `<ul
   id="carteira-grid">`).
2. Dar um `id` ao `<ul class="map__grid">` que já existe dentro de `#cadeiras`, e fazer o
   bloco de append da carteira escrever **nele**.
3. O laço de índice dos 8 nichos **continua correto**: ele roda *antes* do append, então
   `seats[0..7]` ainda alinha com os 8 `<li>` estáticos. Manter o seletor escopado.

## ⚠️ O que NÃO é mecânico — e é o que vai dar errado se ninguém decidir

**a) A copy da seção passa a mentir.** O cabeçalho hoje diz:

> **Escassez programada** · "Uma cadeira por nicho, por polo, renovável por desempenho.
> Quando uma fecha, ela sai do mapa — e o seu concorrente não senta nela."
> Rodapé: `// polo 01 de N · novos nichos abrem após a primeira cadeira faturar`

Nenhuma das 8 cadeiras da carteira é de Goiânia, nenhuma está vaga e nenhuma é "escassez
programada" — são operações **já ocupadas, fora do polo**. Fundir sem reescrever o cabeçalho
transforma a seção assinatura do site numa afirmação falsa. **A copy nova é entregável do
item 2, não um detalhe.**

**b) 🚨 A decisão que a fusão REABRE: o skeleton estático.** Hoje a carteira é **JS-only** de
propósito — foi a decisão da T057a, e ela se justificava porque era uma seção secundária. Ao
mover os cards para a seção assinatura, **metade do grid principal deixa de existir para quem
não roda JS e para crawler que não renderiza**. Isso é aceitável para uma prova social lateral
e é bem menos aceitável para o mapa que é o argumento central da home.

As duas saídas, e nenhuma é grátis:
- **Manter JS-only**: grid de 16 que serve 8 no HTML inicial. Simples, e some do SEO.
- **Voltar a ter skeleton estático dos 8 de projeto**: aparece sem JS — e reintroduz o
  espelho de dado que causou o bug original ("a tela é byte-idêntica com a API em 200 ou em
  500"). Se for essa, o espelho tem de ser **gerado**, não escrito à mão, e o
  `build-time fetch` está **proibido** naquele arquivo (o layer do Docker cacheia o `dist`,
  e é por isso que ele foi removido).

👉 Levar essa escolha ao Jean **junto com a copy**. Não decidir e implementar a primeira é
como o problema apareceu da primeira vez.

**c) Confirmar no olho, não no console.** 8 cards claros (vagas) + 8 escuros (ocupadas) no
mesmo grid de 3 colunas pode ler como "16 nichos vagos" para quem passa o olho. É o tipo de
coisa que só aparece na tela.

---

# 3º — `goiania.roilabs.com.br`: o próximo passo é UMA credencial

## Estado medido agora (07/08), não lembrado

```
sitemap.xml            → <?xml …  ·  99 <loc>  ·  ZERO /cadeira/
/cadeira/sirius/       → 404
site-goiania/src/data/cadeiras.ts → 1 cadeira (sirius), publicado: false
```

O conteúdo **já existe e já foi medido**: `1817 palavras · 9 FAQ · preço no corpo · Offer ok`
(piso de FR-014 é 800/6), `@graph` único com `Organization, WebSite, Product, FAQPage`.
Preços apurados no próprio produto, não estimados.

## O passo, e por que é esse

**T033 — criar a `CredencialGateway` do `sirius` e publicar as duas envs na EasyPanel.**
Depois disso, `publicado: false → true` é **uma palavra**, e o site ganha a primeira página
de cadeira.

Por que o `sirius` e não outro: **ele é da casa.** O gateway é Stripe na conta da própria ROI
Labs, então o Jean tem o acesso — ao contrário das cadeiras de parceiro, onde T033 depende do
painel de terceiro. É a única da lista que não trava em ninguém de fora.

As duas envs, e a convenção que as liga (está em `app/src/lib/carteira/credenciais.ts`):

```
WEBHOOK_SECRET_STRIPE_<PARCEIRO>   ← segredo de assinatura (painel Stripe → Webhooks)
GATEWAY_TOKEN_STRIPE_<PARCEIRO>    ← nome DERIVADO do primeiro, não é coluna nova
```
No banco, `segredoRef` guarda o **NOME** da primeira env, nunca o valor. `contaRef` = o
`acct_…` da Stripe.

Depois: **T034** (apontar o webhook para
`https://app.roilabs.com.br/api/carteira/webhook/stripe/<parceiroId>`) e só então virar o flag.

## ⚠️ A ironia que vale registrar

**A única cadeira que poderia ser publicada hoje é justamente a que decidimos não escrever.**
A `atma` é a única com gateway ligado — mas ela tem página de preço própria com 189 queries
na pág. 1, e foi por isso que o Jean escolheu o `sirius`. Ou seja: `goiania` **não tem passo
desbloqueado que produza valor público** além de ligar o Stripe do sirius. Escrever mais
conteúdo (T049) esbarra no mesmo muro, uma cadeira depois.

## Se o Stripe travar, o passo alternativo

**T062** — reorganizar `site-goiania/src/pages/` com o porcelanato sob pasta própria,
mantendo o conteúdo da malha intacto (FR-018). É preparação do corte de domínio, agora
destravado (`loja.roilabs.com.br` confirmado). ⚠️ Mas é a fase que **pode destruir ativo** —
104 URLs de malha pSEO — e não destrava receita nenhuma. Fazer só com o mapa de 301 em mãos
([snapshots/mapa-301.txt](./snapshots/mapa-301.txt), já gerado do `dist/` real).

---

# Armadilhas que já mordeu — não redescobrir

- **🚨 `npm run build` no `site`/`site-goiania` PUBLICA.** O `postbuild` chama `indexnow.mjs`
  e submete as URLs ao Bing. Build exploratório (testar um flag, medir palavra) usa
  **`npx astro build`**, que não dispara lifecycle do npm; depois `npm run check-cadeiras`
  avulso.
- **🚨 `git push` em `main` É DEPLOY.** O EasyPanel deploya por push. Não há branch, não há PR.
- **🚨 API em 200 não prova que a TELA mudou.** Verificar entrega de UI é abrir a página no
  browser e comparar — nunca curlar a API que a alimenta. Foi assim que a carteira ficou
  invisível apesar do backend correto.
- **Seed com `update` parcial nunca chega no banco.** O ramo `existing` do laço de
  `DEFAULT_SEATS` escrevia só `ordem`; coluna nova de migração ficava no default para sempre.
  Corrigido — mas **falta rodar o seed em produção (T072b)**, e é ele que também aplica o
  `daCasa: false` de `vertice`/`orcaobra`.
- **`status` e `estado` na mesma linha podem se contradizer** e sobreviver a 17 testes verdes:
  um é texto de exibição, o outro é decisão de máquina, e nada compara os dois.
- **`rotulo`, NUNCA `daCasa`.** 3 das 8 cadeiras de projeto são da casa **sem** exibição
  pública (FR-010a); a projeção de `/api/cadeiras` existe para esconder essa curadoria.
  Conferido: `daCasa` não vaza hoje. Não regredir isso ao fundir as seções.

# Comandos de verificação

```bash
# a carteira como a home a lê (ordem, rótulo, estado, siteUrl)
curl -s https://app.roilabs.com.br/api/cadeiras | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>JSON.parse(d).forEach(c=>console.log(c.ordem,'|',c.niche,'|',c.estado,'|',c.rotulo,'|',c.siteUrl)))"

# suíte + tipos (app)
cd app && npm test && npx tsc --noEmit

# build exploratório do institucional, SEM submeter ao IndexNow
cd site && npx astro build

# piso de FR-014, avulso, contra o dist/
cd site-goiania && npm run check-cadeiras
```

# O que ficou pendente de terceiros (não é bloqueio de código)

- **T033/T034/T036/T037** — painel do gateway + compra real com cartão. `sirius` é o único que
  não depende de parceiro externo.
- **T072b** — rodar o seed em produção (precisa da `DATABASE_URL`). Destrava `daCasa` de
  `vertice`/`orcaobra` **e** o `estado` da cadeira `Fitas adesivas`.
- **T066** — a tabela de 26 linhas × (`niche`, `daCasa`) do Jean. ⚠️ **Se a decisão do item 1
  for a saída B (casar por `siteUrl`), esta task muda de forma**: `niche` deixa de ser chave e
  a lista de 26 passa a vir pronta de `roihub/data/projects.json`.
- **T059/T061–T065** — corte de domínio para `loja.roilabs.com.br`. Só execução de infra agora.
