---
status: decided
depends_on:
  - "[[gtm]]"
  - "[[mercado]]"
  - "[[oferta]]"
---

# pSEO — Execução (Polo 1 Goiânia / Porcelanato)

> **Pergunta que este nó responde:** como o pSEO de [[gtm]] vira código e páginas no ar?

## Decisão atual

Engine de SEO programático em Astro estático, servido num **subdomínio por polo**. Brainstorm fechado em 2026-06-29 (Jean).

### IA / URL (confirmado no brainstorm)
- **Subdomínio por POLO, nicho como PASTA:** `goiania.roilabs.com.br/porcelanato/{slug}`.
- **NÃO** subdomínio por nicho (`porcelanato-goiania...`). Motivo: o tráfego é ativo da ROI Labs ([[tese]]: "carrega o risco técnico e de tráfego") → autoridade tem que **consolidar** num host, não fragmentar em N subdomínios fracos que começam do zero e morrem quando o fornecedor sai. Nicho novo = nova pasta no **mesmo** subdomínio (`/construcao`, ...), herdando a autoridade já construída.
- Hospedagem: **3º app Astro estático** na EasyPanel (`/site-goiania`), irmão de `/site` e `/app`. Reusa `Base`/`Header` de `/site` por **cópia** (extrair pacote compartilhado só no 3º polo — YAGNI).
- White Label vive na **loja/checkout** (tenant do hub multitenant de [[oferta]]), **não** no domínio. A landing de SEO é ROI Labs; a loja pode ser a marca do fornecedor.

### Engine & dados
- Lista **curada** num arquivo (`src/data/porcelanato.ts`) → `getStaticPaths` → 1 template. Sem integração com API de volume agora (o snapshot do Keyword Planner em [[mercado]] já basta — integrar quando expandir, YAGNI).
- Ancorado nos **volumes reais** (não combinatória cega de bairro×produto, que dá thin page): tipos (`acetinado` 590, `piso porcelanato` 320, `amadeirado` 260, `marmorizado` 170, `polido`…), ocasião/ambiente (`área externa` ~150, cozinha, fachada, piscina), intenção local (`porcelanato Goiânia` 140, `loja de porcelanato` 20-LOW) + alguns long-tail de alta intenção. **~25-40 páginas curadas**, não 1.600.

### Template de página
- **Sem fornecedor fechado = sem catálogo real.** Páginas nascem **informacionais** (guia de compra, valor real, zero inventário fake) e ganham listagem de produto quando o catálogo do fornecedor entrar — mesma URL, evolui.
- Estrutura: H1 + intro local → características técnicas (PEI, acabamento, antiderrapante, dimensão, m²/caixa — os atributos que [[oferta]] exige do fornecedor) → ambientes ideais → "como escolher" (E-E-A-T) → **FAQ com schema FAQPage** (joga junto com o playbook GEO/AEO) → CTA de conversão → links internos do silo `/porcelanato/*` → Schema.org.

## Depende de

- [[gtm]] — é a execução do canal pSEO decidido lá.
- [[mercado]] — os volumes reais definem quais páginas valem a pena gerar.
- [[oferta]] — atributos estruturados do catálogo = combustível das páginas; White Label define onde o lead aterrissa.

## Decisões em aberto

- [ ] **Conversão:** WhatsApp click-to-chat (`wa.me`, zero backend — **recomendado** p/ começar sem fornecedor) vs. form→DB (nova tabela `LeadConsumidor` no `/app`, separada de `Candidatura`). Resolver no `speckit-clarify`.

## Notas

Vira spec via Spec Kit (`speckit-specify`), agora que o `.specify/` existe no repo. Escopo da 1ª rodada: engine + ~25-40 páginas + home-hub do polo + sitemap + schema; **deploy do 3º app = passo de ops** (Jean faz na EasyPanel, igual aos outros).
