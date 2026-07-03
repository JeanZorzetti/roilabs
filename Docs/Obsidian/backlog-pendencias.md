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

- [ ] **Criar conta Resend (free tier)** e setar na EasyPanel do `/app`: `RESEND_API_KEY`, `EMAIL_FROM`, `ALERT_EMAIL`. O código do ciclo 2 (`ef7bced`) já está no ar como no-op — com a chave, confirmação de pedido + alertas internos passam a sair sozinhos. Depois: verificar domínio `roilabs.com.br` no Resend pra sair do `onboarding@resend.dev`.
- [ ] **`CRON_SECRET` (digest semanal, ciclo 3)** — gerar um segredo (`openssl rand -hex 32`) e setar **nos dois lugares**: env var na EasyPanel do `/app` + secret `CRON_SECRET` no repo GitHub. Sem ele a rota `/api/cron/digest` responde 503 e o step de segunda no `rank-tracking.yml` é pulado (não quebra nada). E-mail só sai quando o Resend acima também existir.
- [ ] **Meta Catalog (Duda, ciclo 3)** — cadastrar o feed `goiania.roilabs.com.br/feed.xml` no Commerce Manager (Instagram Shopping + catálogo do WhatsApp). Passo a passo pronto em `site-goiania/docs/meta-catalog.md`. Dev: zero mudança (feed do Merchant Center é aceito como está).
- [x] **Serper.dev — FEITO 2026-07-03.** Conta criada pelo Jean, secret `SERPER_API_KEY` setado no repo + env var local. 1ª rodada completa ok (40/40).
- [x] **GitHub Actions — RESOLVIDO 2026-07-03.** Causa era billing travado na conta (cartão); Jean atualizou o cartão → verificação concluiu → run `success` na nuvem commitando sozinha (`ad8bf00`). Cron oficial = `rank-tracking.yml` (segunda 09:00 UTC). Task local `roilabs-rank-tracking` REMOVIDA (ficaria em dobro); o runner `rank-tracking-local.ps1` segue no repo como fallback documentado.

- [x] **Redeploy manual do `/site` institucional na EasyPanel** — publica a chave IndexNow (`e72cab81...txt`; sem ela os pings dão 403). O lote GEO de 07-02 já foi ao ar no redeploy do item 1; este é só pra ativar o IndexNow.
- [x] **Redeploy manual do `/app` na EasyPanel** — publica o demonstrativo do parceiro + admin mobile (`ea1e6de`).
- [ ] **Testar `/admin` no celular da Duda** pós-redeploy (kanban, pedidos, cadeiras, demonstrativo) — e **instalar como app** (Chrome → "Adicionar à tela inicial"; PWA do ciclo 3).
- [ ] **Conferir eventos no painel himetrica** — em especial `orcamento_whatsapp` (carrinho) e o novo `orcamento_lead` (ciclo 3: carrinho capturado como lead) após o deploy automático do site-goiania.
- [ ] **Merchant Center: Produtos → Diagnóstico** (~2026-07-05, 3 dias após cadastro) — meta ≥ 90% aprovados (SC-003). Reprovações → `site-goiania/docs/merchant-center.md`. Suspeito nº 1: imagens em CDN de terceiro (vteximg).
- [ ] **GBP (Service Area Business)** — terminar verificação do perfil novo; depois me acionar p/ o nó `LocalBusiness` no @graph do goiânia (telephone + areaServed, SEM address) + GBP no `sameAs`. Fotos de produto prontas em `brand-assets/gbp-fotos/` (30 × 1000px).

## 📊 Medição (aguarda maturação)

- [ ] **⚠️ GSC goiânia — CAUSA ENCONTRADA E CORRIGIDA em código (2026-07-03, `36a2436`+`02937fb`); falta a ação no GSC.** Quadro real (print do Jean): 17 indexadas, 75 não (12 "página com redirecionamento", 50 "detectada não indexada", 13 "rastreada não indexada"); crawl despencou 261→6 req/dia. **Causa raiz (crawl stats): 46% do rastreamento batia em 301** — sitemap/llms/feed/JSON-LD/links internos apontavam URL SEM barra final; nginx (formato directory do Astro) devolvia 301 **para `http://`** (downgrade, nginx atrás do proxy TLS). Fix shipped nos DOIS sites: `absolute_redirect off` no nginx + barra final em toda URL emitida (canonical já tinha). **Ação restante no GSC (Jean, 5 min): resubmeter o `sitemap.xml` na propriedade goiânia + "Solicitar indexação" da home e do hub `/porcelanato/`** — acompanhar "páginas indexadas" (meta ≥ 35/41 da malha; métrica do GTM [[40-gtm]], checkpoint ~07-15). As 12 "com redirecionamento" devem migrar pra indexadas sozinhas nos próximos crawls.

## 🛡️ Proteger o que está no ar

- [ ] **Backup automático do Postgres.** `roilabs_db` tem pedidos pagos e leads reais e **zero backup**. `pg_dump` diário via cron no VPS + cópia semanal fora dele; testar 1 restore de verdade. O item mais barato da lista contra o pior cenário.
- [ ] **Uptime monitor + alerta.** cron-job.org (grátis, padrão do Compass) em 3 URLs: `app.roilabs.com.br/api/cadeiras` (prova app+DB), home goiânia, home institucional. Hoje checkout quebrado = ninguém sabe.
- [x] **Alerta de lead/pedido novo — CÓDIGO FEITO 2026-07-03 (`ef7bced`, junto com a confirmação de pedido do ciclo 2).** Alertas em candidaturas, leads-consumidor e webhook de pagamento via `lib/email.ts` (Resend). Já no ar como no-op; ⏳ conta Resend + env vars (item em "Ops rápidas" acima).

## 🌟 Gateado (não fazer antes do gate)

- [ ] **Review engine → estrelas no SERP.** Pós-venda pede avaliação, admin grava, páginas de produto expõem `AggregateRating` com ≥ 3 avaliações reais. **Gate: 3–5 pedidos entregues** — antes é schema vazio (risco de penalidade).
- [ ] **Gatekeeper (buy, tier 2 de integração).** Depende de fechar o 1º fornecedor — Gate 3, campo.

## 👤 Não-dev (Maria Eduarda / campo) — registrado p/ não perder

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
