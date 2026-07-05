# Auditoria de acessibilidade — site-goiania (ciclo 15, tarefa 5)

Data: 2026-07-04. Método: inspeção manual do HTML gerado (`npx astro build`,
sem ferramenta paga) e do código-fonte `.astro`. Páginas cobertas: hub
(`/porcelanato/`), produto (`/porcelanato/produto/[slug]/`), categoria
(`/porcelanato/[slug]/`), `/calculadora/`, `/carrinho/`, `/orcamento/`,
`/favoritos/`, `/inspire-se/`.

## Alt text

- Nenhum `<img>` sem atributo `alt` encontrado no source.
- `porcelanato/index.astro:136` usa `alt=""` na capa de categoria — revisado
  e considerado correto: a imagem fica dentro do mesmo link cujo texto
  adjacente (`pseo-index-card__title`) já descreve o destino; `alt=""` evita
  leitura redundante em leitor de tela. Nenhuma ação necessária.
- Demais imagens (hub, produto, favoritos, inspire-se, ProdutoCard) têm
  `alt` descritivo com nome do produto ou contexto ("aplicado em ambiente",
  "foto N"). OK.

## Labels de formulário

Corrigidos (mecânico, sem decisão de design):

- `calculadora.astro` — os dois inputs de largura/comprimento adicionados
  dinamicamente por ambiente (`.r-l`, `.r-c`) tinham só `placeholder`
  ("largura"/"compr."), que não é lido de forma confiável por leitor de
  tela e some ao digitar. Adicionado `aria-label="Largura do ambiente (m)"`
  e `aria-label="Comprimento do ambiente (m)"`.
- `carrinho.astro` — input do cupom (`#ck-cupom`) também só tinha
  `placeholder`, sem `<label>` nem `aria-label`. Adicionado
  `aria-label="Código do cupom"`.

Já corretos (não precisaram de mudança): campos de nome/whatsapp/e-mail/CEP
do checkout usam `<label for="...">` associado; radios de entrega e
checkbox de consentimento usam `<label>` envolvente; inputs de
quantidade/metragem no carrinho (`.qty-cx`, `.qty-m2`) já estão dentro de
`<label>Caixas ...</label>` (label implícito); campo de WhatsApp do
formulário de lead na calculadora e no carrinho já usa `aria-label="Seu
WhatsApp"`.

Sem inputs: `/orcamento/`, `/favoritos/` (páginas de leitura/CTA, sem
formulário próprio).

## Contraste (checagem manual, cálculo de luminância relativa WCAG)

- `--d-muted` (#969ba6) sobre fundo escuro `--ink` (#14171d): contraste
  ≈ 6.4:1 — passa AA (4.5:1) e AAA (7:1 fica perto, mas não é obrigatório
  para texto normal). OK.
- `--l-muted` (#5b606a) sobre `--porcelain` (#f2f1ed): contraste ≈ 5.6:1 —
  passa AA. OK.
- `--hivis` (#ff5a1f, laranja "hi-vis de obra") usado como cor de link
  (ex.: link da Política de Privacidade em `carrinho.astro:131`) sobre fundo
  claro `--porcelain`: contraste ≈ **2.8:1 — reprova AA** (mínimo 4.5:1 para
  texto normal, 3:1 para texto grande/UI). O laranja é usado como cor de
  destaque/marca em vários pontos do design system; **não foi alterado**
  aqui porque mexer na paleta é decisão de design, não correção mecânica.
  **Achado registrado para decisão do dono do projeto**: considerar
  sublinhado permanente (não só hover) nesse link específico sobre fundo
  claro, ou um tom mais escuro de laranja só para uso como texto/link (o uso
  atual como cor de botão/ícone sobre fundo escuro ou como acento visual
  grande não tem o mesmo problema de contraste de texto pequeno).

## Follow-up — páginas novas das semanas 1–2 (2026-07-05, macro plan 2 tarefa 10)

Re-inspeção manual do source das páginas criadas depois da auditoria original:

- **Guias AEO novos** (`guia/porcelanato-area-externa`, `guia/rejunte-porcelanato`,
  `guia/porcelanato-liquido-vs-porcelanato`): conteúdo puro — nenhum `<img>`,
  `<input>` ou `<button>` no source. Nada a corrigir.
- **Glossário** (`glossario.astro`): âncora "#" por termo tem
  `aria-label="Link direto para {termo}"`. OK.
- **Filtros do hub** (`porcelanato/index.astro`): os 3 `<select>` estão dentro
  de `<label>` com texto visível; contador usa `role="status"` +
  `aria-live="polite"`; botão "Limpar filtros" tem texto. OK.
- **Favoritos ↔ comparador**: botão de favoritar no comparador tem
  `aria-label`, `aria-pressed` sincronizado e texto visível ("♥ Favoritado" /
  "♡ Favoritar"); botão "Remover dos favoritos" em `/favoritos` tem texto;
  imgs dos cards JS têm `alt` com o nome do produto. OK.
- **Vistos recentemente** (`VistosRecentemente.astro`): cards JS com `alt` no
  produto; seção some (`hidden`) quando vazia. OK.
- **Inspire-se por ambiente** (`inspire-se/[ambiente].astro`): `alt`
  descritivo ("{ambiente} com {produto}"). OK.

Nenhum problema mecânico novo encontrado; nenhuma mudança de código.
O achado de contraste do `--hivis` (abaixo) segue pendente de decisão de
design e vale também para qualquer link laranja nas páginas novas.

## Resumo

- 2 problemas mecânicos corrigidos diretamente (aria-label em 3 inputs).
- 1 problema de contraste documentado, não corrigido (exige decisão de
  design sobre a paleta `--hivis`).
- Build (`npx astro build`) confirmado sem erro após as correções.
