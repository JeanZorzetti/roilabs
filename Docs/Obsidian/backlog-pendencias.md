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

- [ ] **Redeploy manual do `/site` institucional na EasyPanel** — publica a chave IndexNow (`e72cab81...txt`; sem ela os pings dão 403). O lote GEO de 07-02 já foi ao ar no redeploy do item 1; este é só pra ativar o IndexNow.
- [ ] **Redeploy manual do `/app` na EasyPanel** — publica o demonstrativo do parceiro + admin mobile (`ea1e6de`).
- [ ] **Testar `/admin` no celular da Duda** pós-redeploy (kanban, pedidos, cadeiras, demonstrativo).
- [ ] **Conferir eventos no painel himetrica** — em especial o novo `orcamento_whatsapp` (carrinho) após o deploy automático do site-goiania.
- [ ] **Merchant Center: Produtos → Diagnóstico** (~2026-07-05, 3 dias após cadastro) — meta ≥ 90% aprovados (SC-003). Reprovações → `site-goiania/docs/merchant-center.md`. Suspeito nº 1: imagens em CDN de terceiro (vteximg).
- [ ] **GBP (Service Area Business)** — terminar verificação do perfil novo; depois me acionar p/ o nó `LocalBusiness` no @graph do goiânia (telephone + areaServed, SEM address) + GBP no `sameAs`. Fotos de produto prontas em `brand-assets/gbp-fotos/` (30 × 1000px).

## 📊 Medição (aguarda maturação)

- [ ] **GSC: medir a malha pSEO.** Conferir propriedade de `goiania.roilabs.com.br`, submeter sitemap e acompanhar **páginas indexadas das 39** — métrica de decisão do GTM ([[40-gtm]]). Primeiro checkpoint ~2 semanas pós-deploy (a partir de ~2026-07-15).

## 🛡️ Proteger o que está no ar

- [ ] **Backup automático do Postgres.** `roilabs_db` tem pedidos pagos e leads reais e **zero backup**. `pg_dump` diário via cron no VPS + cópia semanal fora dele; testar 1 restore de verdade. O item mais barato da lista contra o pior cenário.
- [ ] **Uptime monitor + alerta.** cron-job.org (grátis, padrão do Compass) em 3 URLs: `app.roilabs.com.br/api/cadeiras` (prova app+DB), home goiânia, home institucional. Hoje checkout quebrado = ninguém sabe.
- [ ] **Alerta de lead/pedido novo.** Fetch fire-and-forget pra e-mail (Resend free tier) no `POST /api/candidaturas` e no webhook de pagamento. Em high-ticket local, velocidade de resposta É conversão. (Sinergia com "confirmação de pedido ao cliente" do ciclo 2 — mesma infra Resend, fazer juntos.)

## 🌟 Gateado (não fazer antes do gate)

- [ ] **Review engine → estrelas no SERP.** Pós-venda pede avaliação, admin grava, páginas de produto expõem `AggregateRating` com ≥ 3 avaliações reais. **Gate: 3–5 pedidos entregues** — antes é schema vazio (risco de penalidade).
- [ ] **Gatekeeper (buy, tier 2 de integração).** Depende de fechar o 1º fornecedor — Gate 3, campo.

## 👤 Não-dev (Maria Eduarda / campo) — registrado p/ não perder

- [ ] Fechar 1º fornecedor A-Player de revestimentos (Gate 3) — [[mercado]] / [[time]]
- [ ] Definir piso de take rate em R$ após ver tickets reais — [[modelo]]
- [ ] Resíduo legal/fiscal com contador/advogado — [[legal-fin]]
