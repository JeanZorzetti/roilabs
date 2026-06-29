# Research — pSEO Regional Porcelanato Goiânia (Fase 0)

Sem `NEEDS CLARIFICATION` pendentes (o `/speckit-clarify` resolveu lead e medição). Este doc registra as decisões de design que sustentam o plano.

## D1 — Fonte de dados das páginas: arquivo TS curado (não content collection)

- **Decisão:** matriz em `src/data/porcelanato.ts` (array tipado) + 1 template `[slug].astro` via `getStaticPaths`.
- **Rationale:** as páginas são **programáticas** (atributos estruturados + seções templatizadas), não artigos autorais. Um array tipado + um template é o menor diff e escala por dados (FR-008). Type-safety pelo `interface` do array.
- **Alternativas:** **content collection** (padrão do blog em `/site`) — melhor para conteúdo hand-authored (markdown livre); rejeitada para o programático porque exigiria 25-40 arquivos MD e perderia a geração por dados. **CMS/headless** — YAGNI, viola Constituição III.

## D2 — Hospedagem: app Astro separado em subdomínio

- **Decisão:** novo app `site-goiania` (3º na EasyPanel), `astro.config.mjs` com `site: https://goiania.roilabs.com.br`.
- **Rationale:** IA decidida no vault (subdomínio por polo). Servir do mesmo build do `roilabs.com.br` geraria as mesmas URLs em dois hosts = conteúdo duplicado / canonical bagunçado.
- **Alternativas:** rotas `/porcelanato` dentro do `/site` servidas no subdomínio — rejeitada (duplicação). Subdomínio por nicho (`porcelanato-goiania`) — rejeitada no brainstorm (fragmenta autoridade).

## D3 — Reuso de design: cópia de Base/Header/Footer/global.css

- **Decisão:** copiar os componentes/estilos do `/site` para `site-goiania`.
- **Rationale:** 2 sites = cópia é o menor diff (Constituição III). Extrair pacote compartilhado só quando surgir o 3º consumidor (2º polo).
- **Alternativas:** monorepo workspace com pacote `@roilabs/ui` — YAGNI agora; divergência entre 2 sites é tolerável.

## D4 — Conversão: WhatsApp (sem backend) + form → `/app` (com persistência)

- **Decisão:** `WhatsappCta.astro` = link `wa.me` com `?text=` pré-preenchido do contexto da página; `LeadForm.astro` = form urlencoded que **POSTa em `app.roilabs.com.br/api/leads-consumidor`** e redireciona 303 → `/obrigado`.
- **Rationale:** espelha o fluxo de `candidaturas` já em produção (requisição simples urlencoded, **sem preflight CORS**, honeypot `botcheck`, 303). Reuso máximo de padrão comprovado.
- **Alternativas:** captura via JS/fetch (exigiria header CORS e leitura de resposta no cliente) — rejeitada; o submit nativo + 303 não lê resposta, então não precisa de CORS. Form-provider externo (Web3Forms) — rejeitado (já foi substituído no `/site`).

## D5 — Modelo de lead: tabela `leads_consumidor` separada de `candidaturas`

- **Decisão:** novo model `LeadConsumidor` (`@@map("leads_consumidor")`), campos mínimos + `consentLGPD` + contexto da página.
- **Rationale:** `candidaturas` é recrutamento de fornecedor (público distinto); misturar poluiria o kanban. Separação limpa (FR-013). Aplicado por `prisma db push` manual (Constituição: runner standalone não aplica schema).
- **Alternativas:** reusar `candidaturas` com um campo `tipo` — rejeitada (semântica e admin diferentes).

## D6 — LGPD: consentimento explícito no form

- **Decisão:** checkbox de consentimento **obrigatório** (validado no cliente e no servidor) + link para aviso de privacidade; armazenar só nome, contato e contexto.
- **Rationale:** FR-014; PII mínima reduz superfície. Servidor rejeita envio sem `consent`.
- **Alternativas:** consentimento implícito — rejeitado (não conforme LGPD).

## D7 — Medição: sitemap + tag de analytics no código; GSC = ops

- **Decisão:** `sitemap.xml.ts` no `site-goiania` (hub + todos os slugs); tag de analytics (GA4) no `<head>` do `Base.astro`, com ID via env de build. Submissão do sitemap ao Search Console = passo de ops.
- **Rationale:** clarify. Sitemap + tag são baratos e duráveis; integração programática de status de indexação seria dependência externa a manter (YAGNI).
- **Alternativas:** checagem automatizada de indexação — rejeitada na v1.

## D8 — Curadoria do lote (~25-40) ancorada nos volumes reais

- **Decisão:** derivar do snapshot do Keyword Planner (`mercado.md`): **tipos** (porcelanato, acetinado, piso porcelanato, amadeirado, marmorizado, polido…), **ocasião/ambiente** (área externa, cozinha, fachada, piscina, banheiro), **intenção local** (porcelanato Goiânia, loja de porcelanato) + long-tail de alta intenção (ex.: "porcelanato amadeirado para área externa"). Cada entrada carrega seu termo-alvo e volume; nada com volume 0 (FR-001/SC-003).
- **Rationale:** o volume real local é por tipo de produto, não por bairro (bairro×produto ≈ 0 = thin page).
- **Alternativas:** produto cartesiano cego bairro×produto×ocasião (~1.600) — rejeitado (conteúdo fino, risco de doorway).

## D9 — Schema.org / AEO

- **Decisão:** JSON-LD por página: `Product` (o tipo de porcelanato, com atributos), `FAQPage` (a seção de dúvidas) e `BreadcrumbList`; `LocalBusiness`/`Organization` no hub.
- **Rationale:** sustenta citação por motores de resposta/IA (FR-005) e o playbook GEO/AEO do dono.
- **Alternativas:** sem dados estruturados — rejeitado (perde elegibilidade a rich results/AEO).
