# Research — Expandir malha pSEO porcelanato (Fase 0)

Sem `NEEDS CLARIFICATION` pendentes (o `/speckit-clarify` fechou piso, regra de parada e fonte). Este doc registra as decisões de design que sustentam o plano e o resultado do gate env-first.

## R0 — Gate env-first: OpenSEO está FORA do ar (BLOQUEIA execução)

- **Achado (2026-07-01):** `curl localhost:3001` → HTTP 000 (inacessível); nenhum container Docker de `open-seo`/`3001` rodando. O código existe em `open-seo/` (self-host: `Dockerfile.selfhost`, `compose.yaml`).
- **Decisão:** a implementação **não começa** a minerar/curar combos sem o OpenSEO no ar e com créditos DataForSEO. 1ª task da execução = `docker compose up` em `open-seo/` + validar `localhost:3001` responde + uma consulta de teste retorna volume. Sem fallback (decisão do clarify).
- **Rationale:** Constituição I/II — volume chutado = inventário falso (Const. III). O bloqueio é deliberado, não um bug a contornar.

## R1 — Fonte e método de mineração de keywords

- **Decisão:** OpenSEO (keyword planner self-hosted, dados DataForSEO) como **única** fonte de volume. Método: seed a partir do vocabulário já validado no `porcelanato.ts` (tipos: amadeirado, marmorizado, acetinado, polido, antiderrapante, retificado; ocasiões: cozinha, banheiro, área externa, piscina, fachada, varanda, sala; dimensões: 60x60, 80x80, 90x90, 120x60; cores: branco, cinza, preto, bege; intenção local: "Goiânia", "loja", "preço") → gerar combinações candidatas → consultar volume no OpenSEO → **filtrar ≥ 200/mês** → deduplicar contra os 31 slugs existentes.
- **Rationale:** o seed vem de termos que já provaram volume; a expansão cobre os cruzamentos ainda não construídos (ex.: tipo × ocasião: "porcelanato marmorizado para cozinha"; tipo × dimensão: "porcelanato amadeirado 80x80").
- **Alternativas:** cartesiano cego de todo o vocabulário → rejeitado (gera lixo de volume 0 e quase-duplicatas); mercado.md da spec 001 como fonte → rejeitado no clarify (OpenSEO é a única fonte, sem fallback).
- **Mecanismo de consulta (2026-07-01):** o OpenSEO **não expõe API REST** (todos os endpoints testados = 404) — é uma UI sobre o DataForSEO. Logo, a mineração automatizável chama a **API DataForSEO diretamente** com a chave configurada em `open-seo/.env` (`keywords_data/google_ads/search_volume/live`, batch de keywords, `location_name` Goiânia/Brasil, `language_code` pt). É a **mesma fonte real** que o OpenSEO consome — coerente com "volume real, nunca chutado". Gate verificado: OpenSEO 200 + chave DataForSEO válida com saldo $0.89 (limite 1000/dia). Batch para minimizar custo (~$0.05/req).

## R2 — Piso de volume vs. gate de build (a página existente de volume 190)

- **Achado:** o menor volume entre as 31 páginas atuais é **190** — abaixo do piso ≥ 200.
- **Decisão:** o piso ≥ 200 é **regra de seleção** de combos NOVOS (aplicada na mineração + documentada em `src/data/README.md`). O gate de build (`check-matrix.mjs`) **mantém o erro fatal só em `volume ≤ 0`** (invariante de honestidade) e **ganha um warning não-fatal para `< 200`**. A página de 190 é **grandfathered** (real, honesta, já no ar).
- **Rationale:** elevar o gate para ≥ 200 quebraria o build de uma página válida existente e forçaria removê-la sem ganho. YAGNI (Const. III): o gate protege contra volume falso; a curadoria aplica o piso.
- **Alternativas:** elevar o gate para ≥ 200 e remover/ajustar a página de 190 → rejeitado (destrói página honesta por formalidade); campo `grandfathered` no tipo → rejeitado (config para um caso só).

## R3 — Autoria do conteúdo rico das páginas novas

- **Decisão:** gerar cada entrada `PorcelanatoPage` seguindo o padrão das existentes (intro BLUF, `comoEscolher` 4-6 itens, `faq` 3-5 pares, `atributos` reais) via `claude-cli`, com **curadoria humana obrigatória de honestidade** antes de commitar: nenhum atributo técnico inventado (`classeAd`/`antiderrapante`/`dimensao` só se real ou omitido), nenhuma promessa de estoque/preço que não exista.
- **Rationale:** Constituição IV (qualidade voltada ao usuário) + III (honestidade); o handoff da 001 já removeu PEI inventado — mesma barra. LLM único = claude-cli (sem API paga).
- **Alternativas:** template com placeholders genéricos preenchidos por find-replace → rejeitado (vira thin/doorway, o que a feature existe para evitar).

## R4 — Deduplicação / canibalização

- **Decisão:** antes de adicionar, comparar cada combo candidato contra os slugs/termoAlvo existentes; combos quase-idênticos (ex.: "porcelanato 60x60" já existe vs. "porcelanato 60x60 cinza") só entram se o ângulo de conteúdo for genuinamente distinto e o volume próprio justificar; senão, reforçar a página existente. `relacionados` conecta o silo.
- **Rationale:** FR-011; evita duas páginas finas disputando a mesma query (canibalização).
- **Alternativas:** aceitar todo combo ≥ 200 sem checar sobreposição → rejeitado (gera gêmeas finas).

## R5 — `llms.txt` gerado da fonte (paridade com sitemap)

- **Decisão:** criar rota `src/pages/llms.txt.ts` que monta o `llms.txt` a partir de `pages` (e do hub/silo), como o `sitemap.xml.ts` já faz; remover o `public/llms.txt` manual. Descrição corrigida: dimensões reais (tipo × característica × ocasião × intenção local), **sem "bairro"**.
- **Rationale:** FR-009; o manual já dessincroniza (aconteceu no `site` institucional). Gerar da fonte elimina o toil e a imprecisão para sempre.
- **Nota:** o `site-goiania` tem seu próprio `llms.txt`? Confirmar na execução; se for manual como o do `site`, mesma solução. A correção da menção "bairro" no `llms.txt` do `roilabs.com.br` (site institucional) é um ajuste pontual separado (1 linha), fora do fluxo programático.

## R6 — Reuso do motor (sem código novo de renderização)

- **Decisão:** nenhuma mudança em `[slug].astro`, `index.astro`, `sitemap.xml.ts`, componentes ou JSON-LD. O template já renderiza qualquer entrada nova, o silo já lista, o sitemap já inclui, o match categoria↔produto (`tagsDoProduto`) já roda. A feature é dados + 1 rota (`llms.txt.ts`) + 1 warning no gate.
- **Rationale:** Constituição III (menor diff). O motor foi projetado (spec 001) para escalar por dados: "adicionar 1 entrada → build gera página + sitemap + relacionados".
