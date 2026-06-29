# Data Model — pSEO Regional Porcelanato Goiânia (Fase 1)

## 1. `LeadConsumidor` (Postgres, via Prisma) — NOVO

Lead de consumidor vindo do formulário das páginas pSEO. Separado de `Candidatura` (recrutamento de fornecedor).

| Campo | Tipo | Regra |
|---|---|---|
| `id` | String (cuid) | PK |
| `nome` | String | obrigatório, ≤ 200 |
| `whatsapp` | String | obrigatório, ≤ 40 |
| `produto` | String? | contexto da página (ex.: "porcelanato amadeirado"), ≤ 200 |
| `pagina` | String? | slug/URL de origem, ≤ 300 |
| `mensagem` | String? | opcional, ≤ 4000 |
| `consentLGPD` | Boolean | **obrigatório = true** (servidor rejeita se ausente) |
| `status` | String | default `"novo"` (novo · contatado · descartado) |
| `createdAt` | DateTime | `@default(now()) @map("created_at")` |
| `updatedAt` | DateTime | `@updatedAt @map("updated_at")` |

- `@@index([status])`, `@@map("leads_consumidor")` (convenção snake_case do dono).
- **Aplicação:** `prisma db push` MANUAL de máquina que alcança `2.24.207.200` (não confiar no runner standalone).
- **Validação (servidor, espelha `candidaturas`):** `cap()` por tamanho; honeypot `botcheck` → 200 silencioso; faltando `nome`/`whatsapp`/`consentLGPD` → 400.

> Schema Prisma a adicionar (referência):
> ```prisma
> model LeadConsumidor {
>   id          String   @id @default(cuid())
>   nome        String
>   whatsapp    String
>   produto     String?
>   pagina      String?
>   mensagem    String?
>   consentLGPD Boolean  @default(false) @map("consent_lgpd")
>   status      String   @default("novo")
>   createdAt   DateTime @default(now()) @map("created_at")
>   updatedAt   DateTime @updatedAt @map("updated_at")
>   @@index([status])
>   @@map("leads_consumidor")
> }
> ```

## 2. `PorcelanatoPage` (dados estáticos, `src/data/porcelanato.ts`) — NOVO

Entrada da matriz curada que alimenta `getStaticPaths`. **Não** é tabela; é dado de build.

| Campo | Tipo | Uso |
|---|---|---|
| `slug` | string | URL `porcelanato/{slug}` — **único** |
| `termoAlvo` | string | keyword principal (ex.: "porcelanato amadeirado") |
| `volume` | number | busca/mês local; **> 0** (gate FR-001/SC-003) |
| `tipo` | string | acetinado · amadeirado · marmorizado · polido · piso … |
| `ocasiao` | string? | área externa · cozinha · fachada · piscina · banheiro |
| `titulo` | string | H1 / `<title>` |
| `intro` | string | parágrafo local |
| `comoEscolher` | string[] | bullets de guia (E-E-A-T) |
| `atributos` | `{ pei?, acabamento?, antiderrapante?, dimensao?, m2PorCaixa?, ambiente? }` | bloco técnico (FR-004) → vira `Product` JSON-LD |
| `faq` | `{ q: string; a: string }[]` | seção de dúvidas (FR-005) → `FAQPage` JSON-LD |
| `relacionados` | string[]? | slugs p/ links internos do silo (FR-007); default = mesmos `tipo`/`ocasiao` |

- **Self-check** (`scripts/check-matrix.mjs`): asserta `slug` único, `volume > 0`, `titulo`/`intro` não vazios, `atributos` e `faq` presentes em toda entrada. Roda no build e localmente (`node`).

## 3. Entidades existentes — INTACTAS

- `Candidatura` (`candidaturas`), `Cadeira` (`cadeiras`) — não tocadas.
