# Quickstart — validar a 017 Projeção

Constituição II: build e typecheck locais **não provam nada** (OneDrive). A prova é o teste puro, que roda sem
build, mais a tela em produção depois do push em `main` (a EasyPanel faz o deploy).

## 0. Pré-requisitos

- `DATAFORSEO_API_KEY` nas variáveis do app **roilabs-admin** na EasyPanel. O valor é o mesmo de
  `roihub/.env` / `open-seo/.env`. Conferir **só pela existência do nome**, sem ecoar o valor
  (`grep -c DATAFORSEO_API_KEY`).
- Saldo na DataForSEO ≥ US$ 0,15. É grátis conferir: `GET /v3/appendix/user_data`.

## 1. A conta (sem rede, sem custo)

```bash
cd app && node --import tsx test/projecao.test.mjs
```

O teste precisa travar:
- **Caso de referência** (SC-003): 1 termo, 10.000 buscas/mês, dificuldade 5, moda, cenário base → posição 5 →
  CTR 0,14 × 0,3% + 0,86 × 2,5% = 2,192% → 219,2 cliques → 2,192 pedidos/mês estáveis → rampa base (M = 6)
  soma 9 → **média do ano 1 = 1,644**. O mesmo termo nos 3 modelos (pedido, assinatura e consulta), cada um com a
  multiplicação dos seus degraus.
- **O mesmo termo nos outros dois cenários** (SC-003, "em cada cenário"):
  - conservador → posição 8 → CTR 0,816 × 0,2% + 0,184 × 0,9% = 0,3288% → 32,88 cliques × 0,7% = 0,23016
    pedidos/mês estáveis → rampa M = 9 soma 7,5 → **média do ano 1 = 0,14385**;
  - otimista → posição 3 → CTR 0,14 × 0,8% + 0,86 × 5,8% = 5,1% → 510 cliques × 1,3% = 6,63 pedidos/mês estáveis →
    rampa M = 4 soma 10 → **média do ano 1 = 5,525**.
- Conservador com dificuldade 25 → fora do alcance → média 0 (zero real).
- Dificuldade `null` → conta 15.
- Variantes com a série mensal idêntica somam uma vez, e a posição do grupo é a do 1º termo (research D5).
  Duplicados por caixa e acento caem antes.
- `volume: null` → fica fora da soma e entra na contagem "sem volume medido".
- **Todo nicho de `NICHOS` tem funil com fonte e data** (SC-002).
- A validação de entrada: 201 termos, termo de 81 caracteres, termo de 11 palavras, emoji → erro nomeado.
- A tradução dos códigos da DataForSEO: `40100` → chave, `40200`/`40210` → saldo, `50401` → fonte.
- A ponte do simulador: `ritmo=abc` ou `nicho=xpto` → ignorada. O `ritmo` levado é o número que a Projeção
  mostra (1,644 → 1,6; 18,4 → 18), não a média crua.

E `npm test` (a suíte inteira) continua verde.

## 2. Em produção (depois do push)

1. `/admin/projecao` abre **sem consultar nada**. Conferir na aba de rede: nenhum POST ao abrir (FR-003).
2. Nicho moda, região Brasil, 10 termos colados → "Consultar". Esperado: o custo mostrado ≤ US$ 0,15 (SC-004), e a
   tabela, a curva, a cadeia e a cobertura preenchidas.
3. Trocar de cenário e de nicho → a projeção muda, e a aba de rede não registra nenhum POST novo (SC-004).
4. "Usar no simulador" → `/admin/precos` abre com nicho e ritmo iguais aos da projeção e com o aviso de
   origem (US2). Abrir `/admin/precos` direto → tudo como antes (FR-011).
5. Colar um termo de 90 caracteres → erro no campo, e o saldo não muda (conferir no `user_data`).
6. Nicho clínicas + Brasil → aviso de cidade. Digitar "Goi" no campo de cidade → aparece "Goiania,State of
   Goias,Brazil".

## 3. Tela (skill `ui-verification`)

- 390 / 768 / 1440 px no estado pronto; um quadro de **ocioso**, **erro de entrada**, **tudo fora do alcance** e
  **menos de 1 venda/mês**. Sem rolagem horizontal em 390 (SC-005).
- Passagem de Tab: nicho → região → termos → consultar → cenários (setas) → usar no simulador.
- Console limpo. Abrir os PNGs e rodar os gates G31 (a resposta em 5 segundos) e G32 (o número-herói com
  janela, fonte e total).
