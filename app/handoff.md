# Handoff — /app (ROI Labs Admin)

App Next 16 separado (irmão do `/site` Astro), em `app.roilabs.com.br`. Gerencia
**Candidaturas** (leads do form) + **Mapa de Cadeiras**. Site Astro intacto, exceto
o `action` do form (ver abaixo).

## Decisões (confirmadas com o dono)
- **Escopo:** Leads + Mapa de Cadeiras (sem gestão de conteúdo por ora).
- **DB:** Postgres existente — `roilabs_db @ 2.24.207.200:5443`. ⚠️ senha `PAzo18**` → rotacionar (ver memória `secrets_to_rotate`).
- **Auth:** login único interno. Cookie HMAC-assinado (`src/lib/session.ts`), sem NextAuth, sem multiusuário.
- **Logo (Task 2):** dono vai pedir uma **variante que case** com o site (laranja/clean). Logo grunge atual NÃO foi aplicada. Só renomeei o arquivo fonte.

## Feito
- `/app` Next 16 App Router completo: Prisma + 2 modelos, auth de cookie, APIs, UI.
- **APIs:** `POST /api/candidaturas` (público, recebe o form), `GET` (protegido, lista), `PATCH /api/candidaturas/:id` (status), `GET /api/cadeiras` (público), `PATCH /api/cadeiras/:id` (protegido).
- **UI:** `/login`, `/admin` (kanban de candidaturas, 4 colunas, muda status por seletor), `/admin/cadeiras` (abre/fecha + edita status). Tema = mesmos tokens do site (header grafite, porcelana, hi-vis).
- **Site:** form em `site/src/pages/index.astro` agora posta em `https://app.roilabs.com.br/api/candidaturas` (era Web3Forms com chave placeholder). POST urlencoded simples → sem preflight CORS; a API redireciona pro `/obrigado`.
- **Logo:** `site/public/Design sem nome (18).png` → `site/public/roilabs-logo-source.png` (2000×2000, 2.4 MB, fonte).
- **Check:** `node test/session.test.mjs` (sign/verify, expiração, adulteração) — passou.

## Deploy (EasyPanel)
1. **Schema no DB:** de uma máquina que alcança `2.24.207.200` (a mesma rede do sofia_db etc.), na pasta `/app`:
   `npm install` → `npx prisma db push` → `npm run db:seed` (carrega as 6 cadeiras, idempotente).
   ⚠️ NÃO confie no runner standalone pra aplicar schema (memória `sofia_next_db_push_runner_fails`). Faça `db push` manual.
2. **Novo App na EasyPanel:** build path = `/app`, Dockerfile (já incluso, Next standalone, porta 3000), domínio `app.roilabs.com.br`.
3. **Env vars** (copie de `.env.example`): `DATABASE_URL`, `ADMIN_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`).
4. Site: rebuild/redeploy do `/site` pra publicar o novo `action` do form.

## Próximos passos
- Aplicar schema + seed + criar o App + DNS (acima). Nada disso foi executado ainda.
- **Verificar build real no Docker** — não rodei `next build` local (gotcha OneDrive corrompe node_modules; build local não-confiável). Build limpo é no Docker.
- Task 2: quando a variante de logo chegar, otimizar (~500px <100KB header + 1200×630 og:image) e aplicar em header do site/admin, favicon, og:image.

## Pendências / gotchas
- **Cadeiras ↔ site:** o admin grava cadeiras no DB, mas o site é Astro estático e ainda lê o `seats[]` hard-coded. Pra refletir ao vivo: ou rebuild a cada mudança, ou o site passa a `fetch('/api/cadeiras')` no build (acopla site↔app). Decisão de arquitetura pendente. `src/lib/seats.ts` é a fonte do seed e espelha o array do site.
- **WhatsApp do card:** assume número BR local e prefixa `55`. Se vier número com DDI, ajustar.
- **Kanban sem drag:** muda status por `<select>` (ponytail — sem @dnd-kit). Se quiser arrastar, adicionar @dnd-kit como no CRM do SplitJud.
- **Sem migrations Prisma** — usa `db push` (2 tabelas, MVP). Se virar multi-ambiente, migrar pra `migrate`.
- Rotacionar a senha do Postgres exposta.
