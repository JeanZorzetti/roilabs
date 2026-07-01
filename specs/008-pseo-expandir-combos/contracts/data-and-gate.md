# Contract — Dados, gate e geração (Fase 1)

Este site é estático; o "contrato" é a **forma dos dados**, os **invariantes do gate de build** e as **saídas geradas**. Quem cumprir isto pode adicionar páginas sem tocar no motor.

## C1 — Contrato de uma entrada de página (`PorcelanatoPage`)

Uma entrada nova é **válida** se, e só se:

1. `slug` é único no array e em kebab-case sem acento.
2. `volume` (number) `> 0` **[gate fatal]** e, para combos novos, `≥ 200` **[regra de seleção; < 200 = warning]**.
3. `termoAlvo`, `titulo`, `intro`, `comoEscolher` (≥ 1), `atributos` (objeto), `faq` (≥ 1) presentes.
4. Todo campo em `atributos` é **real** (não inventado); campos técnicos não verificáveis são omitidos, não chutados.
5. `titulo` contém sinal de intenção local ("Goiânia").

## C2 — Contrato do gate `check-matrix.mjs`

- **Entrada:** `src/data/porcelanato.ts` (regex sobre `slug:`/`volume:`) + `porcelanatos.json`.
- **Falha (exit ≠ 0, quebra o build):** slug duplicado; `volume ≤ 0`; título/atributos/faq ausentes; produto com `preco ≤ 0` ou sem imagem.
- **Novo — Warning (exit 0, não quebra):** qualquer entrada com `volume < 200`. Lista os slugs afetados no log.
- **Contrato de compatibilidade:** a página existente de `volume: 190` continua passando (gate fatal só em `≤ 0`); ela dispara o warning, o que é aceitável (grandfathered).

## C3 — Contrato de geração (saídas automáticas — não editar à mão)

Ao adicionar uma entrada válida e buildar:

| Saída | Como | Verificação |
|---|---|---|
| Página `/porcelanato/{slug}` | `[slug].astro` via `getStaticPaths` | H1 + intro + como escolher + FAQ renderizam sem JS. |
| Entrada no silo `/porcelanato` | `index.astro` mapeia `pages` | slug novo aparece no grid. |
| Entrada no `sitemap.xml` | `sitemap.xml.ts` itera `pages` | `<loc>` do slug novo presente. |
| Entrada no `llms.txt` | **NOVO** `llms.txt.ts` itera `pages` | slug novo listado; texto sem "bairro". |
| JSON-LD Product/FAQPage/BreadcrumbList | `buildJsonLdNodes` no `@graph` | válido no Rich Results Test. |
| CTA de conversão | `WhatsappCta` + `LeadForm` | WhatsApp pré-preenchido + form 303 → `/obrigado`. |

## C4 — Contrato de fonte de volume (OpenSEO)

- **Pré-condição de execução:** `localhost:3001` responde e uma consulta de teste retorna volume (créditos DataForSEO ok).
- **Se indisponível:** a mineração **não roda**; a feature fica bloqueada. Sem fallback, sem volume estimado à mão.
- **Saída consumível:** para cada `termoAlvo`, um `volume` inteiro ≥ 0. Só ≥ 200 vira página.
