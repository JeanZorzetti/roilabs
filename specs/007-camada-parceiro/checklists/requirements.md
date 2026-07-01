# Specification Quality Checklist: Camada Parceiro

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-01
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain — resolvidos no clarify de 2026-07-01 (base do %, origem do %, gatilho da cobrança, período).
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded (camada aditiva; não altera centros de custo)
- [x] Dependencies and assumptions identified (Asaas; sem parceiro contratado hoje; sondagem = julgamento do operador)

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows (US1 registrar+sondagem, US2 repassar, US3 cobrar, US4 painel)
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Modelo corrigido no clarify: fee **desde o 1º repasse** (todo negócio faturável por padrão); "moeda de troca" = entregar a venda, não isentar comissão; **sondagem** gate (loja que recusa pagar+firmar é riscada); isenção é exceção pontual do 1º repasse; 1º repasse é registro manual.
- US1+US2 = MVP entregável hoje (estrutura de prospecção/sondagem + registro de repasses); US3 (Asaas) entrega quando a 1ª loja topar pagar.
- **Pronto para `/speckit-plan`.** No plan, atenção à integração Asaas (chaves/webhook — Const. I env-first) e à normalização de nicho.
