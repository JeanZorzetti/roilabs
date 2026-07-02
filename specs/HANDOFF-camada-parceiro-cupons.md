# Handoff — Spec de "Camada Parceiro + Cupons no admin"

**Para:** próxima sessão (outro chat) que vai rodar o fluxo Spec Kit.
**Objetivo:** gerar o(s) spec(s) destas duas features do admin da ROI Labs (`ROI Labs/app`). Projeto tem `.specify/` → usar `speckit-specify → clarify → plan → tasks → implement`.
**Data:** 2026-06-30. Feature anterior (`005-painel-financeiro`) já está em `specify→clarify→plan→tasks→analyze` (pronta p/ implement).

---

## ⚠️ Leia primeiro: maturidade MUITO diferente entre as duas

| Feature | Maturidade | Recomendação |
|---|---|---|
| **Cupons no admin** | Crisp, pequena, pronta p/ specar | Pode ir direto pro `speckit-specify`; clarify curto. |
| **Camada Parceiro** | Estratégica e fuzzy — a mecânica "pago-pelo-sucesso" NÃO está modelada em lugar nenhum | NÃO specar no escrivo. Brainstorm/clarify com o Jean ANTES (regra global #2: confirmar abordagem em tarefa estratégica). |

**Recomendação de sequência:** specar como **DOIS specs separados** (006-cupons-admin e 007-camada-parceiro), não um combinado. Cupons é independentemente shippável e trivial; Camada Parceiro precisa de um ciclo de clarify pesado e provavelmente várias migrações. Combinar trava o quick win do Cupons atrás da feature grande.

---

## Contexto de negócio (essencial)

ROI Labs Growth Partner = marketplace/intermediação local estilo BNI: **1 cadeira por nicho por polo, pago-pelo-sucesso**. Polo 1 = Goiânia, nicho-âncora = porcelanato. ROI Labs gera demanda (pSEO regional + e-commerce de porcelanato) e roteia ao parceiro daquele nicho; cobra **success fee** quando o parceiro fecha. Memória: `project_roilabs_growth_partner`.

Hoje o porcelanato é operado pela própria ROI Labs (dois centros de custo: Intermediação × White Label — ver `lib/centros-custo.ts` e feature 004/005). **Questão central não resolvida:** quem é o "parceiro" do nicho porcelanato e o que conta como "negócio originado" dele — isso muda todo o modelo da Camada Parceiro (ver Perguntas Abertas).

---

## FEATURE A — Cupons no admin

### O que existe hoje
- [`app/src/lib/cupons.ts`](app/src/lib/cupons.ts): `CUPONS` hard-coded (`Record<string, Cupom>`, hoje só `OBRA10`). Shape: `tipo: 'percentual'|'fixo'`, `valor`, `validadeInicio?`, `validadeFim?`, `minimo?`, `ativo`. Função `validarCupom(codigo, subtotalProduto)` é a autoridade. Tem `ponytail:` comment apontando exatamente este upgrade.
- [`app/src/app/api/cupom/validar/route.ts`](app/src/app/api/cupom/validar/route.ts): POST consumido **cross-origin** pelo site estático (`goiania.roilabs.com.br`) com CORS; recomputa subtotal no servidor (nunca confia no cliente) e chama `validarCupom`.
- `Pedido.cupomCodigo` + `Pedido.desconto` (schema): snapshot do cupom aplicado, **re-validado no checkout** (não só no display — FR-014 do código). Há um 2º call site de `validarCupom` no fluxo de pedido/checkout. **Migrar p/ DB não pode quebrar nenhum dos dois call sites nem o princípio "servidor é a única autoridade; código nunca vai pro bundle do front".**

### Escopo proposto (specar)
Migrar o code knob para uma tabela `Cupom` + CRUD no admin, mantendo `validarCupom` como autoridade única (agora lendo do DB).
- Modelo `Cupom` (snake_case `@@map`, espelha o shape atual): `codigo` (unique, upper), `tipo`, `valor`, `validadeInicio?`, `validadeFim?`, `minimo?`, `ativo`, timestamps.
- `validarCupom` passa a buscar no DB (async) — ajustar os 2 call sites (validar route + checkout).
- Página `/admin/cupons` (server component, design system LIGHT) + rota API CRUD (`isAuthed`), padrão das telas existentes (ver `centros-de-custo` como referência de form editável: `parametros-form.tsx` + `api/centros-custo/parametros/route.ts`).
- Edge/validação: código único, % em [0,100], fixo ≥ 0, `minimo` ≥ 0, datas coerentes; desconto nunca < 0 nem > subtotal (já em `validarCupom`).

### Já decidido / não re-litigar
- Continua **sobre o subtotal do produto**, nunca frete. Servidor = autoridade. Código não vai pro front.

---

## FEATURE B — Camada Parceiro

### O que existe hoje
- `Cadeira` (schema): `niche`, `status` (rótulo livre: "Curadoria aberta"/"Em estudo"), `open` (bool), `ordem`, `polo`, `updatedAt`. **Sem vínculo com ocupante.** Seed em `app/src/lib/seats.ts`. Admin em `/admin/cadeiras`.
- `Candidatura` (schema): candidato a parceiro vindo do form do site — `nome`, `empresa`, `whatsapp`, `cidade`, `categoria`, `site`, `mensagem`, `status` (`novo|curadoria|aprovado|recusado`). Admin em `/admin` (vai virar `/admin/candidaturas` na feature 005).
- `LeadConsumidor` + `Pedido`: demanda de consumidor (porcelanato). Hoje NÃO atribuídos a nenhum parceiro.

### Escopo (a DEFINIR com o Jean — não assumir)
A camada que liga **cadeira → parceiro ocupante → negócios originados → success fee → cobrança**. Modelos prováveis (PROPOSTA, não decidido):
- `Parceiro`: empresa ocupante de uma `Cadeira` (origem em `Candidatura` aprovada), nicho/polo, termos do success fee, status (ativo/pausado).
- `NegocioOriginado` / atribuição: lead/pedido originado pela ROI Labs → parceiro, valor, estágio (originado/negociando/ganho/perdido).
- `Fatura`/`CobrancaSuccessFee`: por parceiro/período, base de cálculo, % ou valor, status (emitida/paga).
- Reflete no Painel (feature 005): cadeiras passariam a ter estado "ocupada" real (hoje é só `open`).

### Perguntas abertas (alimentam o `speckit-clarify` — NÃO especular)
1. **O que é um "negócio originado"?** Um `LeadConsumidor`? Um `Pedido` pago? Algo registrado manualmente pelo operador? Há atribuição automática ou o operador marca?
2. **Base do success fee:** % sobre o valor do negócio fechado? Valor fixo por negócio? Mensalidade + sucesso? Como o parceiro reporta que fechou?
3. **Porcelanato é caso especial?** Hoje a ROI Labs opera o porcelanato como própria (centros de custo). O parceiro do nicho porcelanato é o fornecedor? A Camada Parceiro convive com os centros de custo ou substitui no nicho dele?
4. **Vínculo Candidatura↔Cadeira↔Parceiro:** `Candidatura.categoria` é texto livre, `Cadeira.niche` idem — precisa de mapeamento/normalização de nicho.
5. **Cobrança:** integra com pagamento (Asaas/MercadoPago) ou é só registro/controle interno por ora?

---

## Constraints & padrões do projeto (valem p/ ambas)

- **Stack:** Next 16 App Router, React 19, Prisma 6 + Postgres (EasyPanel). Repo `JeanZorzetti/roilabs`, deploy da `main` (trunk-based, EasyPanel observa a main).
- **Patterns obrigatórios:** prisma singleton `@/lib/prisma`; páginas admin server component `export const dynamic = 'force-dynamic'`; auth de página herdada do `admin/layout.tsx` (`requireAuth()`); rotas API usam `isAuthed()`; tabelas snake_case com `@@map`; `params: Promise<…>` + `await params` quando houver rota dinâmica.
- **Schema:** migração via `prisma db push` MANUAL de uma máquina que alcança o host (o runner standalone NÃO aplica schema — memória `sofia_next_db_push_runner_fails`). `prisma generate` antes de `next build`.
- **Design system LIGHT:** `app/src/app/globals.css` (`.page/.card/.btn/.cc-*`); NUNCA inline escuro (vira ilha tema-escuro). Memória `roilabs_app_admin_design_system`. Ênfase AA. Princípio constitucional IV: página voltada ao usuário é **rica, não mínima**.
- **YAGNI (Const. III):** sem dependência nova se der pra fazer com o que há; sem abstração especulativa. Cupons NÃO precisa de lib de CSV/validação externa.
- **Verificação (Const. II, NÃO-NEGOCIÁVEL):** build/Lighthouse local são não-confiáveis (OneDrive corrompe `node_modules`, errno -4094). Lógica pura → teste `node --import tsx test/*.test.mjs` (confiável). UI/rota → navegador em produção ou Docker EasyPanel, com evidência.
- **Entrega (Const. V):** ao fechar, `handoff.md` co-localizado + commit + push sem perguntar (memória `feedback_push_apos_concluir`).

## Gotchas
- Cupons: os DOIS call sites de `validarCupom` (validar route CORS + checkout) e o snapshot `Pedido.cupomCodigo/desconto` precisam continuar funcionando após a migração p/ DB; servidor segue autoridade única.
- EasyPanel: cache de build Docker pode servir `dist` stale (memória `easypanel-docker-build-cache-stale-dist`).
- Constituição em `.specify/memory/constitution.md`; o `Constitution Check` do plano é obrigatório.

---

## Pronto p/ colar — feature description do `speckit-specify` (Cupons, a parte madura)

> Cupons no admin da ROI Labs (`ROI Labs/app`). Migrar os cupons hoje hard-coded em `lib/cupons.ts` (`CUPONS` record, autoridade `validarCupom`) para uma tabela `Cupom` no Postgres + CRUD no admin, para criar/editar/expirar cupons sem deploy. Modelo `Cupom` espelha o shape atual (codigo único upper, tipo percentual|fixo, valor, validadeInicio?, validadeFim?, minimo?, ativo) com `@@map` snake_case. `validarCupom` passa a ler do DB (async), mantendo servidor como autoridade única e código fora do bundle do front; ajustar os dois call sites (api/cupom/validar com CORS + re-validação no checkout) sem quebrar o snapshot `Pedido.cupomCodigo/desconto`. Página `/admin/cupons` server component force-dynamic no design system LIGHT (referência: telas de centros-de-custo), rota API CRUD com `isAuthed`. Validação: código único, percentual em [0,100], fixo ≥0, minimo ≥0, datas coerentes; desconto nunca <0 nem > subtotal do produto. Sem dependência nova; sem schema além da tabela Cupom.

Para a **Camada Parceiro**, NÃO colar uma descrição pronta — abrir com brainstorm/clarify das 5 perguntas acima com o Jean e só então `speckit-specify`.
