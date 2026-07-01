# Data Model — Expandir malha pSEO porcelanato (Fase 1)

Feature é data-driven; não há schema de banco novo. As entidades abaixo descrevem os dados em arquivo que a expansão manipula.

## Entidade: `PorcelanatoPage` (existente — não muda de forma)

Interface já definida em `site-goiania/src/data/porcelanato.ts`. A expansão apenas **acrescenta itens** ao array `pages`. Campos:

| Campo | Tipo | Obrigatório | Regra de validação |
|---|---|---|---|
| `slug` | string | sim | Único em todo o array (gate `check-matrix`). kebab-case, sem acento. |
| `termoAlvo` | string | sim | A keyword-alvo real (ex.: "porcelanato marmorizado para cozinha"). |
| `volume` | number | sim | Do OpenSEO. **Gate build: > 0** (erro). **Seleção: ≥ 200** (warning se < 200). |
| `tipo` | string | sim | Categoria (amadeirado, marmorizado, acetinado, polido, antiderrapante, retificado, genérico…). |
| `ocasiao` | string | não | Ambiente/uso (cozinha, banheiro, área externa, piscina, fachada, varanda, sala). |
| `titulo` | string | sim | H1/`<title>`. Inclui "Goiânia" (intenção local). |
| `intro` | string | sim | Abertura BLUF (responde a query de cara; ~40-60 palavras isoláveis). |
| `comoEscolher` | string[] | sim | 4-6 itens práticos. |
| `atributos` | objeto | sim | Só atributos **reais**; campos técnicos (`classeAd`, `antiderrapante`, `dimensao`, `m2PorCaixa`) omitidos se não verificáveis. |
| `faq` | {q,a}[] | sim | 3-5 pares (vira FAQPage JSON-LD). |
| `relacionados` | string[] | não | Slugs de páginas irmãs (silo interno). |

**Invariantes (garantidas pelo `check-matrix.mjs`):** slug único; `volume > 0`; `titulo`, `atributos` e `faq` presentes; produtos com `preco > 0` e ≥ 1 imagem. **Novo:** warning quando `volume < 200`.

**Honestidade (Const. III/IV — não automatizável, curadoria):** nenhum atributo técnico inventado; `classeAd` só das páginas de produto (dado real); sem promessa de estoque/preço inexistente.

## Entidade: `KeywordCandidato` (transiente — mineração, não persistida no código)

Objeto de trabalho durante a mineração; não vira arquivo versionado (a saída é a entrada `PorcelanatoPage`).

| Campo | Tipo | Origem |
|---|---|---|
| `termo` | string | Seed combinatório (tipo × ocasião × dimensão × acabamento × intenção local). |
| `volume` | number | OpenSEO / DataForSEO. |
| `qualifica` | boolean | `volume ≥ 200` **e** não duplica slug/termoAlvo existente. |
| `anguloConteudo` | string | Nota de curadoria: há algo honesto e distinto a dizer? Se não, descartar. |

**Ciclo de vida:** minerado → filtrado (`qualifica`) → curado (`anguloConteudo`) → vira `PorcelanatoPage` (ou é descartado). Combos que não qualificam são descartados, não versionados.

## Entidade: `Produto` (existente — inalterada)

30 SKUs reais em `porcelanatos.json` (marca, dimensão, acabamento, preço, imagens, `classe_ad`, retificado, m²/caixa). A expansão **não minera novos produtos** (sem fornecedor assinado — Gate 3). Páginas novas casam com esses 30 via `tagsDoProduto` (heurística) ou seguem informacionais (0 produtos casados é válido).

## Relacionamentos

```
KeywordCandidato --(qualifica+curado)--> PorcelanatoPage --(tagsDoProduto)--> Produto[0..n]
                                                 |
                                                 └--(relacionados[])--> PorcelanatoPage (silo)
```

- Uma `PorcelanatoPage` casa com 0..n `Produto` (0 = página informacional válida).
- `PorcelanatoPage.relacionados` liga páginas irmãs (silo interno, mão dupla recomendada).
