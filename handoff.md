# Handoff — /admin (Next.js) + logo ROI Labs

> **STATUS 2026-06-29 — executado.** Tarefa 1: app `/app` Next 16 com Candidaturas
> (kanban) + Mapa de Cadeiras, auth de login único, DB `roilabs_db`. CÓDIGO PRONTO,
> **falta ops** (db push+seed, App EasyPanel, DNS, build Docker). Tarefa 2: logo
> renomeada; aplicação **aguarda variante que case** (decisão do dono). Detalhes,
> deploy e pendências agora em **[`app/handoff.md`](app/handoff.md)**.
>
> _Contexto original abaixo (mantido)._ Duas tarefas: **(1)** criar um `/admin` em
> Next.js e **(2)** colocar a logo da marca no projeto.

---

## Contexto (estado atual do repo)

- Repo **`JeanZorzetti/roilabs` (PRIVADO)**, monorepo rooteado em `ROI Labs/ROI Labs/`:
  - `/site` — **site Astro 5 estático** (marketing + recrutamento de fornecedor). **PRONTO e shipado.** Hero → manifesto → mecânica → Mapa de Cadeiras → mercado → ICP (3 gates) → FAQ → form de candidatura → footer. Form via **Web3Forms** (→ e-mail `parceria@roilabs.com.br`, redirect `/obrigado`). Deploy via `site/Dockerfile` (node build → nginx) na EasyPanel, **build path = `/site`**. Detalhes em [`site/handoff.md`](site/handoff.md).
  - `/Docs/Obsidian` — **vault de estratégia** (8 nós DAG, `decided`). Comece por [`Docs/Obsidian/INDEX.md`](Docs/Obsidian/INDEX.md).
- **Negócio:** ROI Labs = Growth Partner (não agência). Modelo BNI: 1 cadeira exclusiva por nicho/polo, fornecedor paga 100% variável (pago pelo sucesso). Polo 1 = Goiânia, nicho = revestimentos/porcelanato.
- **Design system** (`site/src/styles/global.css`): base grafite (`--ink #14171d`), seções porcelana, acento **laranja hi-vis `--hivis #ff5a1f`**. Fontes Archivo / Hanken Grotesk / Space Mono. Header é **escuro**.
- Stack padrão do dono (ver memória): **Next 16 App Router + Prisma + Postgres (EasyPanel) + auth**. Convenções recorrentes: params `Promise` + `await params`; `getAuthFromRequest()→auth.id`; prisma singleton `@/lib/prisma`; `prisma generate` antes do `next build`; tabelas snake_case `@@map`.

---

## Tarefa 1 — `/admin` em Next.js

### Arquitetura recomendada
- **App Next separado** no monorepo como `/app` (irmão de `/site`), deploy em **`app.roilabs.com.br`**. Espelha o padrão SplitJud (site=Astro / app=Next) que o dono já usa. **Não tocar no site Astro.**
- Stack: Next 16 App Router + Prisma + Postgres + auth. Deploy EasyPanel = novo App, **build path = `/app`**, domínio `app.roilabs.com.br`.

### O que o `/admin` gerencia — **CONFIRMAR COM O DONO antes de codar** (tarefa ambígua)
Recomendação de MVP e fases, a validar:
1. **MVP — Candidaturas (leads do form).** Hoje as candidaturas só vão por e-mail (Web3Forms), não há onde listá-las. Para o admin gerenciar, capturar em DB. Duas formas:
   - (a) Trocar o `action` do form (em `site/src/pages/index.astro`) para uma API route do app (`app.roilabs.com.br/api/candidaturas`) que grava no DB. ⚠️ vira POST cross-origin do site estático → **tratar CORS**.
   - (b) Manter Web3Forms e usar **webhook** dele → API route que grava. Menos mexida no site.
   - Recomendo (a) depois do app existir (dono dos dados). Kanban de status (novo → em curadoria → aprovado/recusado) no estilo do CRM do SplitJud (@dnd-kit).
2. **Fase 2 — Mapa de Cadeiras.** Hoje o array `seats[]` é **hard-coded** em `site/src/pages/index.astro`. Mover pra DB pra o admin abrir/fechar cadeiras. ⚠️ o site é estático → ou rebuild a cada mudança, ou o site passa a fazer fetch no build/ISR (acopla site↔app). Decisão de arquitetura.
3. Possível fase 3: gestão de conteúdo pSEO (quando entrar `goiania.roilabs.com.br`).

### Perguntas a confirmar com o dono
- `/admin` gerencia **só leads**, ou leads + cadeiras + conteúdo?
- App novo em `app.roilabs.com.br` (recomendado) — confirma?
- **DB:** subir um Postgres novo na EasyPanel ou reusar um existente?
- **Auth:** login único interno basta (recomendado), ou multiusuário/roles?
- Pipar leads pro **Sirius CRM** em vez de DB próprio? (o dono tem esse padrão; faltava `SIRIUS_API_KEY`.)

---

## Tarefa 2 — Logo da marca

**Arquivo:** `site/public/Design sem nome (18).png` — **2000×2000**, **PNG transparente** (alpha, fundo transparente), **2.4 MB**. Wordmark grunge: "ROI LABS" em letras pretas desgastadas, o "O" é um círculo de **arame farpado** com **seta verde de crescimento** dentro + caveirinha pixel no "I".

### Passos
1. **Renomear** (nome tem espaços e parênteses = ruim em URL): `Design sem nome (18).png` → `roilabs-logo.png` (ou `.webp`).
2. **Otimizar:** 2.4 MB é absurdo pra header. Exportar versão web (~400–600px de largura, < 100 KB) pro header; e uma 1200×630 pra `og:image`.
3. **Usar em:**
   - Header do site — hoje é texto `R ROI LABS` (`.brand` + `.brand__mark` em `index.astro`/`global.css`). Trocar pela `<img>`.
   - Favicon (`site/public/favicon.svg` + `<link rel="icon">` no `Base.astro`).
   - `og:image` no `Base.astro` (hoje não tem).
   - Header do novo `/admin`.

### ⚠️ GOTCHAS — leia antes (senão a logo some ou quebra a marca)
1. **Logo é PRETA sobre transparente → some no header ESCURO (grafite) do site.** Preto em fundo escuro = invisível. Decidir: **(a)** gerar uma versão **branca/invertida** pra superfícies escuras, **(b)** pôr a logo num chip claro, ou **(c)** mudar o header pra barra clara. Sem isso, a logo não aparece.
2. **Conflito de paleta/vibe — decisão de marca do DONO.** A logo é **verde + grunge + arame farpado + caveira** (agressiva). O site inteiro que está no ar é **laranja hi-vis + limpo/premium/arquitetural**. Eles **brigam** (cor e tom). Opções: **(a)** adotar o verde+grunge no site (mexer em `--hivis` e na linguagem visual), **(b)** manter o laranja/clean e conviver com a dissonância, ou **(c)** pedir uma variante de logo que case com o site. **Não decidir isso sozinho — perguntar ao dono.**
3. Lockup é quadrado/empilhado. Pra header horizontal, talvez usar só o "O" de arame farpado como ícone compacto, ou pedir um lockup horizontal.

---

## Como começar
- Repo já está local em `c:\Users\jeanz\OneDrive\Desktop\ROI Labs\ROI Labs`. `gh` autenticado como `JeanZorzetti`. Repo é PRIVADO.
- Site: `cd site` (Astro). Novo app: criar `/app` (Next).
- **Gotcha de ambiente:** `npm install` em pasta OneDrive corrompe `node_modules` (errno -4094) — se build quebrar do nada, deletar `node_modules` + reinstalar. Lighthouse local não é confiável (só prod).
- Antes de codar a Tarefa 1, **rodar as perguntas de confirmação** com o dono (escopo do admin, DB, auth). Antes da Tarefa 2, **confirmar a direção de marca** (gotcha 2).

## Pendências herdadas (do site, não bloqueiam estas tarefas)
- `WEB3FORMS_KEY` ainda é placeholder em `site/src/pages/index.astro` — form não envia até colar a chave real.
- Deploy do site na EasyPanel + DNS de `roilabs.com.br` ainda são manuais (não feitos).
