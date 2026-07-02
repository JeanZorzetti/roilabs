# Tasks: Feed de Produtos para Google Merchant Center (Free Listings)

**Input**: Design documents from `/specs/009-merchant-center-feed/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/feed-xml.md, quickstart.md

**Tests**: validação de artefato (check-feed) faz parte da spec (US2/FR-007); sem suíte de testes além dela (YAGNI).

**Organization**: agrupado por user story; paths relativos à raiz do repo.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

Nenhuma task — app existente (`site-goiania/`), zero dependência nova (plan/D6).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: helpers compartilhados que garantem a paridade página↔feed por construção (D5). Bloqueia US1.

- [x] T001 Extrair `tituloProduto(p)` (`${marca} ${nome}`) e `descricaoProduto(p)` (string da meta description hoje inline) para `site-goiania/src/data/produtos.ts`, e definir `elegivelParaFeed(p)` (tem `imagens[0]` e `preco > 0`) no mesmo arquivo (regra única usada por feed e validação, D7).
- [x] T002 Atualizar `site-goiania/src/pages/porcelanato/produto/[slug].astro` para consumir `tituloProduto()`/`descricaoProduto()` (remover as strings inline; nenhum texto renderizado pode mudar — diff de output zero).

**Checkpoint**: página de produto renderiza idêntica (mesmo título/descrição), helpers prontos.

---

## Phase 3: User Story 1 — Catálogo inteiro elegível nas free listings (P1) 🎯 MVP

**Goal**: `GET /feed.xml` com 1 item por produto elegível, campos obrigatórios do Google, paridade com a página.

**Independent Test**: `npm run build` em `site-goiania` → `dist/feed.xml` existe, 30 `<item>`, campos obrigatórios preenchidos, valores iguais aos da página de um produto amostrado.

- [x] T003 [US1] Criar `site-goiania/src/pages/feed.xml.ts`: APIRoute GET (padrão do `sitemap.xml.ts`) que gera RSS 2.0 + `xmlns:g` conforme `contracts/feed-xml.md` — mapear cada produto elegível para os 14 atributos do data-model (id, title, description, link, image_link, price `NN.NN BRL`, unit_pricing 1sqm, availability in_stock, condition new, brand, identifier_exists no, product_type, google_product_category); escapar XML (`&`, `<`, `>`) num helper local; produtos inelegíveis omitidos.
- [x] T004 [US1] Smoke local (Constituição II — evidência final fica pro deploy): `npm run build` em `site-goiania/` e inspecionar `dist/feed.xml` (`head -40`): declaração UTF-8, channel, primeiro item completo, acentos íntegros, contagem de `<item>` = 30.

**Checkpoint**: feed gerado e conferido no artefato de build — MVP pronto para deploy.

---

## Phase 4: User Story 2 — Feed validado antes de ir ao ar (P2)

**Goal**: build quebra se o feed sair malformado ou incompleto (gate automático, FR-007).

**Independent Test**: remover `preco` de um produto no JSON → build falha apontando slug+campo; restaurar → build verde.

- [x] T005 [US2] Criar `site-goiania/src/scripts/check-feed.mjs` (Node puro, sem deps): valida `dist/feed.xml` pelas 6 regras do data-model (existe + declaração XML; estrutura rss/channel/item; contagem = elegíveis do `porcelanatos.json`; campos obrigatórios não-vazios por item; sem `�` e sem `&` cru fora de entidade; warn com slug+campo por produto inelegível). Exit 1 em falha. Marcar `// ponytail:` o teto (checagem regex-level; parser XML de verdade se o feed ganhar estrutura dinâmica).
- [x] T006 [US2] Adicionar `"postbuild": "node src/scripts/check-feed.mjs"` em `site-goiania/package.json` (npm roda pre/post automaticamente — mesmo padrão do `prebuild` existente).
- [x] T007 [US2] Provar o gate: rodar `npm run build` verde; depois quebrar temporariamente um produto (sem `preco`) → build DEVE falhar com slug+campo → reverter e confirmar verde de novo. Registrar output no handoff.

**Checkpoint**: gate ativo — feed inválido não passa do build.

---

## Phase 5: User Story 3 — Passo ops documentado (P3)

**Goal**: operador cadastra o feed no Merchant Center seguindo doc do projeto.

**Independent Test**: seguir o doc do zero até "feed cadastrado e processado" no painel.

- [x] T008 [P] [US3] Criar `site-goiania/docs/merchant-center.md`: criação da conta Merchant Center; verificação/reivindicação de `goiania.roilabs.com.br` via Search Console (nota: mesma verificação serve ao item GSC do backlog); cadastro do feed por URL com busca agendada diária; habilitar free listings (programa "listagens gratuitas"); onde monitorar (Produtos → Diagnóstico); troubleshooting das reprovações prováveis (preço/m² → fallback D2 preço por caixa; identifier_exists; imagem de CDN de terceiro).

---

## Phase 6: Polish & Entrega Fechada

- [x] T009 Atualizar `site-goiania/handoff.md` (ou criar): feito/decisões (D1–D9)/próximos passos (deploy + cadastro ops)/gotchas (preço por m², CDN de imagem de terceiro). Constituição V.
- [x] T010 Commit + push (mensagem em inglês) — inclui specs 009, código e docs.
- [x] T011 **Verificação em prod — FEITA 2026-07-02** (deploy automático por push): `https://goiania.roilabs.com.br/feed.xml` → 200, 30 `<item>`, namespace `g:` presente, primeiro item íntegro (`porcelanato-20x120-carvalho-natural`, `98.99 BRL`), sem campo vazio nem mojibake.
- [ ] T012 **Ops (Jean, manual)**: executar `docs/merchant-center.md` — cadastrar feed no Merchant Center e confirmar processamento sem erro estrutural (SC-002). Acompanhar aprovação ≥ 90% (SC-003) após a revisão do Google.

---

## Dependencies & Execution Order

- Phase 2 (T001→T002) bloqueia US1.
- US1 (T003→T004) bloqueia US2 (valida o artefato que US1 gera) e T011.
- US3 (T008) é independente — pode rodar em paralelo com qualquer fase ([P]).
- Polish (T009–T012) por último; T011/T012 dependem de deploy manual.

**Parallel example**: T008 (doc ops) em paralelo com T003–T007.

## Implementation Strategy

MVP = Phase 2 + US1 (feed válido no ar já habilita o cadastro). US2 protege contra regressão futura; US3 destrava o passo externo. Entrega incremental na `main`, sem branch (padrão do repo).
