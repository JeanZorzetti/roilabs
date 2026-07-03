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
- [ ] **Criar conta serper.dev (grátis, 2.500 buscas, sem cartão)** e setar o secret no repo: `gh secret set SERPER_API_KEY -R JeanZorzetti/roilabs`. Destrava o rank tracking semanal (DataForSEO zerou o saldo 2026-07-03 e não será recarregado agora; o script já prefere Serper quando a chave existe). Sem isso o cron de segunda falha.

- [x] **Redeploy manual do `/site` institucional na EasyPanel** — publica a chave IndexNow (`e72cab81...txt`; sem ela os pings dão 403). O lote GEO de 07-02 já foi ao ar no redeploy do item 1; este é só pra ativar o IndexNow.
- [x] **Redeploy manual do `/app` na EasyPanel** — publica o demonstrativo do parceiro + admin mobile (`ea1e6de`).
- [ ] **Testar `/admin` no celular da Duda** pós-redeploy (kanban, pedidos, cadeiras, demonstrativo).
- [ ] **Conferir eventos no painel himetrica** — em especial o novo `orcamento_whatsapp` (carrinho) após o deploy automático do site-goiania.
- [ ] **Merchant Center: Produtos → Diagnóstico** (~2026-07-05, 3 dias após cadastro) — meta ≥ 90% aprovados (SC-003). Reprovações → `site-goiania/docs/merchant-center.md`. Suspeito nº 1: imagens em CDN de terceiro (vteximg).
- [ ] **GBP (Service Area Business)** — terminar verificação do perfil novo; depois me acionar p/ o nó `LocalBusiness` no @graph do goiânia (telephone + areaServed, SEM address) + GBP no `sameAs`. Fotos de produto prontas em `brand-assets/gbp-fotos/` (30 × 1000px).

## 📊 Medição (aguarda maturação)

- [ ] **⚠️ URGENTE — GSC: `goiania.roilabs.com.br` aparenta NÃO estar indexado.** Evidência (2026-07-03, SERP via serper.dev): institucional ranqueia #1/#2/#4 pra query de marca, mas **zero URLs do subdomínio goiânia** em qualquer query — incluindo marca e as 40 do rank tracking. Ação: conferir/criar propriedade no GSC, **submeter `sitemap.xml`** e pedir indexação da home + hub `/porcelanato`. Sem isso a malha de 41 páginas não existe pro Google. Depois: acompanhar páginas indexadas (métrica de decisão do GTM, [[40-gtm]]); checkpoint ~2026-07-15.

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
