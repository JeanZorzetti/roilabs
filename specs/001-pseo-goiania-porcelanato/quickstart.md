# Quickstart — Verificar pSEO Porcelanato Goiânia

> **Constituição II:** build/`tsc` local em OneDrive é não-confiável (errno -4094). A verdade é **Docker (EasyPanel)** + **navegador em prod**. Local serve só para dev rápido e o self-check da matriz.

## Pré-requisitos

- `site-goiania/` criado (espelha `/site`); `app/` com o model `LeadConsumidor`.
- DB: `prisma db push` MANUAL de máquina que alcança `2.24.207.200:5443` (cria `leads_consumidor`).
- Envs EasyPanel: site-goiania → `PUBLIC_GA_ID` (analytics), `PUBLIC_WHATSAPP` (número wa.me), `PUBLIC_APP_URL` (=`https://app.roilabs.com.br`). app → já tem `DATABASE_URL` etc.

## Dev local (rápido, não-autoritativo)

```sh
cd site-goiania && npm run dev      # abre o hub + porcelanato/{slug}
node src/scripts/check-matrix.mjs   # self-check: slug único, volume>0, atributos+faq presentes
```

## Verificação real (autoritativa)

### SC-001 / FR-011 — ≥25 páginas geradas
- Build no Docker (EasyPanel) do `site-goiania`. Conferir que `dist/porcelanato/` tem ≥25 páginas e o `sitemap.xml` lista todas. (Constituição II — build real.)

### SC-003 / FR-001 — 0 páginas de volume 0
- O build **falha** se alguma entrada tiver `volume <= 0` (self-check). Verde = gate ok.

### US1 / FR-003,004,005,010 — página útil e indexável
- Abrir `https://goiania.roilabs.com.br/porcelanato/porcelanato-amadeirado` (ex.) no navegador. Conferir: H1+intro, tabela de atributos, "como escolher", FAQ. Ver fonte (Ctrl+U): conteúdo presente **sem JS**; JSON-LD `Product`/`FAQPage`/`BreadcrumbList` no HTML. Rich Results Test (Google) = válido.

### US2 / FR-006,013,014 — conversão pelos 2 canais
- **WhatsApp:** clicar no CTA → abre `wa.me` com texto pré-preenchido do produto. 
- **Form sem consentimento:** enviar sem marcar o checkbox → bloqueado (400/validação). 
- **Form com consentimento:** enviar → 303 → `/obrigado`. Conferir `GET /api/leads-consumidor` (logado) ou `/admin/leads` lista o lead com `produto`/`pagina`. 
- **Honeypot:** preencher `botcheck` (via devtools) → 200 sem gravar.

### FR-002 / FR-007 — silo e links internos
- Navegar `porcelanato/index` → todas as páginas; cada página linka relacionados; tudo no host `goiania.roilabs.com.br` (não em `roilabs.com.br`).

### FR-015 — medição
- `https://goiania.roilabs.com.br/sitemap.xml` responde 200 com os slugs. Tag de analytics presente no `<head>`. (Submeter o sitemap ao Search Console = passo de ops.)

## Ops (fora do código)

1. Criar 3º App EasyPanel: build path `site-goiania`, Dockerfile, domínio `goiania.roilabs.com.br`, DNS.
2. Redeploy do `/app` (novo endpoint + tabela).
3. Submeter `sitemap.xml` ao Google Search Console.
