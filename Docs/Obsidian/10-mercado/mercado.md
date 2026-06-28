---
status: decided
depends_on:
  - "[[tese]]"
---

# Mercado — Nicho, Hiper-localismo e ICP

> **Pergunta que este nó responde:** quem é o cliente (fornecedor) e onde a ROI Labs compete?

## Decisão atual

**Segmentação por polo geográfico.** Subdomínios regionais (ex: `buriti.roilabs.com.br`) exploram a preferência do Google por proximidade. Domina-se buscas de alta intenção: "pronta entrega", "retirada próxima".

**ICP do fornecedor:** "A-Player" — capacidade produtiva e logística para escalar com o tráfego, mas sem maturidade tecnológica. Prioridade de curadoria: **nichos de alto ticket e demanda regional comprovada**.

**Exclusividade:** uma cadeira por setor por polo (herdado da [[tese]]).

## Depende de

- [[tese]] — a exclusividade de nicho e o modelo BNI definem como o mercado é fatiado.

## Decisões fechadas

- ✅ **Polo 1 = Goiânia** (Buriti era fictício). Subdomínio: `goiania.roilabs.com.br`.
- ✅ **Nicho âncora = construção/acabamento → primeira cadeira em revestimentos/porcelanato.** Escolhido por *fit* com a tese hiperlocal (alto ticket, produto frete-sensível favorece o fornecedor local, fornecedores fracos no online = ICP) — **não** pelo maior volume bruto (que seria moda/Região da 44, mas é atacado nacional, fora da tese). Base: Goiânia é a 3ª maior praça imobiliária do país; acabamento >30% das compras de obra.
- ✅ **Validar demanda antes de abrir cada cadeira (3 gates):** (1) volume no Keyword Planner por região para "[produto] + [bairro/cidade]"; (2) SERP local fraca (só marketplace genérico = brecha); (3) ≥1 fornecedor A-Player real disponível. Abre só se os 3 baterem.

> ✅ **Gate 1 validado (2026-06-28):** demanda local existe — ver seção abaixo. ⏳ Resta o Gate 3 (fechar 1º fornecedor A-Player).

## Validação de demanda — Keyword Planner (Goiânia)

Fonte: DataForSEO Google Ads, targeting **cidade de Goiânia** (location_code 1001552), 2026-06-28. Volume = buscas/mês locais reais.

**Os 3 termos do blueprint:**

| Termo | Vol Goiânia | CPC | Veredito |
|---|---|---|---|
| `porcelanato Goiânia` | 140 | $0,66 | ✅ Âncora local — CPC alto = comprador valioso |
| `revestimento área externa` | 30 | $0,10 | ⚠️ Nacional (2.900) era ilusão; local é nicho |
| `porcelanato pronta entrega` | 10 | — | ❌ Sem busca → vira USP/selo, não keyword |

**Onde está a demanda local de fato:**

| Termo | Vol Goiânia | Comp Ads |
|---|---|---|
| `porcelanato` (genérico) | **1.900** | HIGH |
| `porcelanato acetinado` | 590 | HIGH |
| `piso porcelanato` / `revestimento de parede` | 320 / 320 | HIGH |
| `porcelanato amadeirado` | 260 | HIGH |
| `porcelanato marmorizado` | 170 | HIGH |
| cluster área externa (piso 70 + porcelanato 40 + revest. 30 + externo 10) | ~150 | HIGH |
| `loja de porcelanato` | 20 | **LOW** (clique barato) |

**Conclusões p/ GTM:**
- **pSEO/conteúdo:** mirar `porcelanato` + tipos de produto (acetinado, piso, amadeirado, marmorizado) — é o volume real local.
- **Ads:** `porcelanato Goiânia` (comprador quente, CPC $0,66) + `loja de porcelanato` (competição LOW) convertem melhor que genéricos.
- **`pronta entrega`** = USP de página (selo), fora do SEO. **`área externa`** = landing de nicho, não âncora.
- "HIGH" = competição de **anúncios**, não dificuldade SEO. Custo da consulta: ~$0,11 (crédito DataForSEO).

> Ferramenta usada: OpenSEO self-hosted (Docker, `localhost:3001`) + DataForSEO. Ver memória `project_openseo_keyword_planner`.

## Notas

Origem: [[Blueprint Estratégico_ Hub de Infraestrutura Digital ROI Labs]] §3 (hiper-localismo) e §4.
