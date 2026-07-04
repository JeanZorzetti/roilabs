---
tipo: backlog
status: vivo
data: 2026-07-03
dono: Jean (dev)
---

# 📥 Backlog — pendências (não é prioridade agora)

> [!info] O que é este arquivo
> Tudo que estava **não-feito** em [[proximos-passos-dev]] em 2026-07-03, estacionado aqui de propósito. Nada disso bloqueia o que está no ar. Quando algum item virar prioridade, move de volta pra lista autoritativa.

## 🔴 Crítico quando retomar (último item do MVP)

- [ ] **Configurar o Asaas (chaves + webhook)** — última pendência da feature 007. Sem isso a cobrança do success fee não roda. Integração externa, separada do Mercado Pago do checkout. Código pronto (`lib/asaas.ts`, `api/faturas`, `api/parceiros/webhook`).

## ⏳ Ops rápidas (deploy/verificação, não é código)

- [x] **Microsoft Clarity — NO AR 2026-07-03.** Jean criou os 2 projetos; IDs hard-coded como fallback no código (goiânia `xgun692iah` em `8d85e62`, institucional `v09iongg9z` em `2a34e57`) — env na EasyPanel dispensada (`PUBLIC_CLARITY_ID` segue sobrepondo). Verificado no HTML de prod do goiânia; dados no painel em ~2h. **Bônus na mesma leva: GA4 `G-7JD9J2QEDJ` (mesma Google tag) nos 2 sites** (`581efdc` institucional + `98e6abe` goiânia), verificado em prod — gotcha: o testador do Google falha se testar `www.goiania...` (host não existe; testar sem www).
- [x] **ntfy.sh (ciclo 6, ~5 min, sem conta)** — gerar nome de tópico longo/aleatório (ex.: `roilabs-alertas-$(openssl rand -hex 8)`), setar `NTFY_TOPIC` na EasyPanel do `/app`, instalar o app ntfy no celular (Duda + Jean) e assinar o tópico. Push imediato de lead/candidatura/pedido pago — não depende do Resend.
- [x] **Conferir OG do ciclo 6 pós-deploy** — 1 página de produto (deve mostrar a FOTO real) e 1 guia (PNG gerado com borda laranja) no opengraph.xyz; conferir também a coluna **Origem** em `/admin/leads` quando entrar o 1º lead novo.

- [ ] **Criar conta Resend (free tier)** e setar na EasyPanel do `/app`: `RESEND_API_KEY`, `EMAIL_FROM`, `ALERT_EMAIL`. O código do ciclo 2 (`ef7bced`) já está no ar como no-op — com a chave, confirmação de pedido + alertas internos passam a sair sozinhos. Depois: verificar domínio `roilabs.com.br` no Resend pra sair do `onboarding@resend.dev`.
- [ ] **`CRON_SECRET` (digest semanal, ciclo 3)** — gerar um segredo (`openssl rand -hex 32`) e setar **nos dois lugares**: env var na EasyPanel do `/app` + secret `CRON_SECRET` no repo GitHub. Sem ele a rota `/api/cron/digest` responde 503 e o step de segunda no `rank-tracking.yml` é pulado (não quebra nada). E-mail só sai quando o Resend acima também existir.
- [x] **Meta Catalog (Duda, ciclo 3)** — cadastrar o feed `goiania.roilabs.com.br/feed.xml` no Commerce Manager (Instagram Shopping + catálogo do WhatsApp). Passo a passo pronto em [[meta-catalog]]. Dev: zero mudança (feed do Merchant Center é aceito como está).
- [x] **Serper.dev — FEITO 2026-07-03.** Conta criada pelo Jean, secret `SERPER_API_KEY` setado no repo + env var local. 1ª rodada completa ok (40/40).
- [x] **GitHub Actions — RESOLVIDO 2026-07-03.** Causa era billing travado na conta (cartão); Jean atualizou o cartão → verificação concluiu → run `success` na nuvem commitando sozinha (`ad8bf00`). Cron oficial = `rank-tracking.yml` (segunda 09:00 UTC). Task local `roilabs-rank-tracking` REMOVIDA (ficaria em dobro); o runner `rank-tracking-local.ps1` segue no repo como fallback documentado.

- [x] **Redeploy manual do `/site` institucional na EasyPanel** — publica a chave IndexNow (`e72cab81...txt`; sem ela os pings dão 403). O lote GEO de 07-02 já foi ao ar no redeploy do item 1; este é só pra ativar o IndexNow.
- [x] **Redeploy manual do `/app` na EasyPanel** — publica o demonstrativo do parceiro + admin mobile (`ea1e6de`).
- [ ] **Testar `/admin` no celular da Duda** pós-redeploy (kanban, pedidos, cadeiras, demonstrativo) — e **instalar como app** (Chrome → "Adicionar à tela inicial"; PWA do ciclo 3).
- [ ] **Conferir eventos no painel himetrica** — em especial `orcamento_whatsapp` (carrinho), `orcamento_lead` (ciclo 3) e o novo `calculadora_lead` (ciclo 4) após o deploy automático do site-goiania.
- [ ] **Conferir ciclo 7 em prod (pós-deploy automático):** botão "Buscar" no header do goiânia (+ evento `busca_interna` no himetrica — atenção às buscas com 0 resultado, é demanda sem página); link "Quantas caixas preciso?" num produto → calculadora pré-preenchida; seção 💳 no `/admin/follow-up`; `GET /api/health` respondendo 200.
- [ ] **Conferir ciclo 8 em prod (pós-deploy automático):** `goiania.roilabs.com.br/sobre/` no ar (footer "Como funciona"); URL inventada (ex.: `/xyz`) responde **HTTP 404** com a página útil (antes era a home com 200 — se voltar a dar 200, o nginx.conf não foi ao ar); `/?q=porcelanato` abre a busca pré-preenchida.
- [ ] **Secret `PSI_API_KEY` (CWV semanal, ciclo 8, ~5 min)** — console do Google Cloud → ativar API "PageSpeed Insights" → criar API key (grátis, 25k/dia) → secret `PSI_API_KEY` no repo GitHub. Sem ela o step de segunda é no-op (anônimo dá 429). A partir daí `90-medicao/cwv.{csv,md}` ganha a série semanal de LCP/CLS/TBT das 5 páginas-template.
- [ ] **Testar o botão "Chamar no WhatsApp" em `/admin/leads`** (ciclo 4) — abrir um lead real, conferir que a mensagem vem com nome + contexto + link do carrinho.
- [x] **Pinterest Catalogs (ops, ciclo 4)** — conta business + claim do domínio (acionar Jean p/ meta tag) + cadastrar `feed.xml`. Passo a passo em [[pinterest-catalog]]. Validar 30/30 na 1ª ingestão.
- [x] **Bing Webmaster Tools (Jean, ~10 min, ciclo 4)** — importar propriedades do GSC + conferir sitemaps e pings IndexNow. Passo a passo em [[bing-webmaster]].
- [x] **Merchant Center: Produtos → Diagnóstico** (~2026-07-05, 3 dias após cadastro) — meta ≥ 90% aprovados (SC-003). Reprovações → [[merchant-center]]. Suspeito nº 1: imagens em CDN de terceiro (vteximg).
- [ ] **GBP (Service Area Business)** — terminar verificação do perfil novo; depois me acionar p/ o nó `LocalBusiness` no @graph do goiânia (telephone + areaServed, SEM address) + GBP no `sameAs`. Fotos de produto prontas em `brand-assets/gbp-fotos/` (30 × 1000px).

## 📊 Medição (aguarda maturação)

- [ ] **GSC miner — secret `GSC_SA_KEY` (~2026-07-15, junto do checkpoint da malha).** Service account com leitura na propriedade goiânia + secret no repo; a partir daí o cron semanal grava `90-medicao/gsc-miner.md` com candidatas a página nova + striking distance (substitui a mineração DataForSEO). Runbook completo: [[gsc-miner-setup]].

- [ ] **⚠️ GSC goiânia — CAUSA ENCONTRADA E CORRIGIDA em código (2026-07-03, `36a2436`+`02937fb`); falta a ação no GSC.** Quadro real (print do Jean): 17 indexadas, 75 não (12 "página com redirecionamento", 50 "detectada não indexada", 13 "rastreada não indexada"); crawl despencou 261→6 req/dia. **Causa raiz (crawl stats): 46% do rastreamento batia em 301** — sitemap/llms/feed/JSON-LD/links internos apontavam URL SEM barra final; nginx (formato directory do Astro) devolvia 301 **para `http://`** (downgrade, nginx atrás do proxy TLS). Fix shipped nos DOIS sites: `absolute_redirect off` no nginx + barra final em toda URL emitida (canonical já tinha). **Ação restante no GSC (Jean, 5 min): resubmeter o `sitemap.xml` na propriedade goiânia + "Solicitar indexação" da home e do hub `/porcelanato/`** — acompanhar "páginas indexadas" (meta ≥ 35/41 da malha; métrica do GTM [[40-gtm]], checkpoint ~07-15). As 12 "com redirecionamento" devem migrar pra indexadas sozinhas nos próximos crawls.

## 🛡️ Proteger o que está no ar

- [ ] **Backup automático do Postgres — CÓDIGO FEITO 2026-07-04 (ciclo 7, `8dd24bf`); falta instalar.** Script pronto em `app/scripts/backup-postgres.sh`; passo a passo (cron no VPS, teste de restore, cópia semanal fora do VPS) em [[backup-uptime]]. Ops: Jean, ~10 min no VPS.
- [ ] **Uptime monitor + alerta — ROTA FEITA 2026-07-04 (ciclo 7, `8dd24bf`); falta criar os monitores.** `GET /api/health` prova app+DB (melhor que `/api/cadeiras`: sem dado exposto). Criar 3 monitores no cron-job.org (health + 2 homes) — checklist em [[backup-uptime]]. ⏳ vale após o redeploy automático do app.
- [x] **Alerta de lead/pedido novo — CÓDIGO FEITO 2026-07-03 (`ef7bced`, junto com a confirmação de pedido do ciclo 2).** Alertas em candidaturas, leads-consumidor e webhook de pagamento via `lib/email.ts` (Resend). Já no ar como no-op; ⏳ conta Resend + env vars (item em "Ops rápidas" acima). **Update ciclo 6 (`c9eb662`): mesmo gatilho agora também manda push ntfy.sh — canal sem conta, só falta `NTFY_TOPIC` (item em "Ops rápidas").**

## 🌟 Gateado (não fazer antes do gate)

- [ ] **Review engine → estrelas no SERP.** Pós-venda pede avaliação, admin grava, páginas de produto expõem `AggregateRating` com ≥ 3 avaliações reais. **Gate: 3–5 pedidos entregues** — antes é schema vazio (risco de penalidade).
- [ ] **Gatekeeper (buy, tier 2 de integração).** Depende de fechar o 1º fornecedor — Gate 3, campo.

## 👤 Não-dev (Maria Eduarda / campo) — registrado p/ não perder

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
