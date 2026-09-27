# Handoff — 016 Precificação

**Última atualização: 27/09/2026.** Feature publicada: merge em `main` e push em 27/09, com
autorização da Maria ("de tudo que já fez faça commit push") depois do aviso abaixo.

## 0. A tabela é pública

O repositório `JeanZorzetti/roilabs` é **público** (GitHub API: `visibility=public`, conferido em
27/09). Com o push, a tabela interna de preços ficou legível por qualquer um — inclusive
fornecedores e o parceiro atual de fitas: as faixas, a recompra de 8% sugerida para o B2B (o
contrato atual é 15/10), o "limite para negociar" e as justificativas. A Maria foi avisada antes e
autorizou. Se isso mudar: tornar o repo privado (Settings → General → Danger Zone) — ⚠️ conferir
antes se a EasyPanel puxa o repo com token; se puxa pela URL pública, o deploy quebra até
configurar credencial. Tornar privado não apaga o que já foi lido ou copiado.

## Feito

- `app/src/lib/precificacao.ts` — tabela (20 nichos, 5 faixas) e regras puras: `calcularComissao`,
  `encaixarPorMargem`, `nichoSugerido`, `lerNumeroBR`. Não é lido pela cobrança.
- `/admin/precificacao` — faixas, calculadora de pedido (1ª compra × recompra), encaixe pela margem,
  tabela agrupada, taxas em vigor por parceiro (compara com a tabela), regras, contrato, comparativo
  de mercado e notas de confiança. Link no menu, entre Parceiros e Centros de custo.
- Menu do topo: com 12 links, quebra em linha inteira em vez de partir o rótulo ("Leads / Goiânia").
- `app/test/precificacao.test.mjs` no `npm test`.

## Verificação (local, 27/09)

- `npm run build` limpo (TypeScript incluso); `npm test` com saída 0.
- Playwright contra `next start` com banco inexistente de propósito: página abre, seção de parceiros
  mostra o aviso, calculadora confere com o relatório (moda R$ 200 → R$ 30/R$ 20; móveis R$ 4.000 →
  R$ 380; eletrônicos R$ 30 com distribuidor → piso R$ 5; margem 20% → "não fecha"). Console sem
  erro. 390px sem rolagem lateral; tabelas viram cartões.
- **Não verificado**: a seção "Taxas em vigor" com dados reais (sem banco local) e produção.

## Próximos passos

- Abrir `/admin/precificacao` logado em produção e conferir a lista real de parceiros e a linha
  sugerida de cada um (sem banco local, isso não foi visto).
- Se o Jean aprovar a tabela: botão "preencher pela tabela" no cadastro do parceiro (toca o caminho
  de dinheiro da 010 — só pré-preenche, a validação `parseTaxa` continua igual).
- Subir a confiança dos números: CPC por nicho no Keyword Planner, margem real de cada fornecedor,
  % de recompra da Tapepro nos primeiros 6–12 meses (decide 8% ou 10%).

## Gotchas

- `next start` avisa que não combina com `output: 'standalone'`, mas serve para conferir tela local.
- `npm install` no `/app` gera `package-lock.json`; o repo não versiona lockfile — não commitar.
- A tabela está em código de propósito (Constituição III). Editar pelo admin = model Prisma + form,
  no molde dos parâmetros de centros de custo (004).
