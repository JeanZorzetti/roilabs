---
status: in_progress
next_effort: medium
iteration: 1
updated_at: 2026-07-04T19:40:00.000Z
---

## Last completed
Ciclo 15, tarefa 1 (`[plan]` favoritos client-side em `/site-goiania`):

- `src/lib/favoritos.ts`: localStorage array de slugs (`roi_fav_v1`), mesmo
  padrão de `cart.ts` (get/toggle/remove/count + evento `roi-fav-change`).
- `src/components/FavToggle.astro`: botão coração reutilizável (`variant="card"`
  flutuando sobre a foto, `variant="inline"` na página de produto). Um único
  `<script>` hidrata todos os botões da página (Astro dedupe por componente).
  Usado em `ProdutoCard.astro` (hub/categorias) e `ProdutoDetalhe.astro`.
- `src/components/FavCount.astro`: link "Favoritos" no header com badge de
  contagem ao vivo (mesmo padrão de `CartCount.astro`), adicionado em
  `Header.astro`.
- `src/pages/favoritos.astro`: página nova, `noindex` (é pessoal, sem
  conteúdo indexável — mesmo motivo pelo qual `/carrinho` não está no
  sitemap). Embeda o catálogo inteiro (slug/título/foto/preço) num
  `<script type=application/json>` (mesmo truque de `/comparar`, evita
  puxar `produtos.ts` pro bundle do client) e filtra client-side pelos
  slugs favoritados. Lista com foto+nome+preço+"Remover", estado vazio, e
  CTA "Pedir orçamento dos favoritos no WhatsApp".
- `src/lib/cart.ts`: extraída `encodeItems()` de dentro de `encodeCart()`
  (mesma lógica, sem duplicar) — a página de favoritos reusa essa função
  pra gerar o token `?c=` (favoritos → 1 caixa cada) sem tocar no carrinho
  real do usuário. O CTA abre `/carrinho?c=<token>` dentro da mensagem do
  WhatsApp, igual ao botão "Receber orçamento no WhatsApp" do carrinho.

Verificado com `npx astro build` (86 páginas, sem erros) e também em
`astro preview` via Playwright MCP (browser real): favoritar no hub e na
página de produto persiste e não navega o `<a>` do card; `/favoritos`
lista os 2 produtos favoritados; clique no CTA gera a URL
`https://wa.me/...?text=...http://localhost:4325/carrinho?c=<token>`;
abrir esse link em `/carrinho` restaura exatamente os 2 itens; botão
"Remover" some da lista e atualiza o badge do header ao vivo (2 → 1).
Nenhum item do escopo já existia (busquei "favorit" em `handoff.md`, zero
resultado).

Não fiz: sitemap/`llms.txt` (tarefa 1 não pede — mesmo motivo do
`/carrinho`/`/orcamento`, que também não estão no sitemap; `noindex` cobre
o caso). Não toquei em `/app`, pagamento, DB nem deploy.

## Next step
Tarefa 2 do `macro_plan.md` (Ciclo 15) — `[build]` **Estimador de
acessórios na `/calculadora`** (`site-goiania/src/pages/calculadora.astro`):

Depois do resultado de caixas necessárias (já existe: m² → caixas fechadas,
ver `src/lib/cart.ts` `m2ParaCaixas` e a lógica client-side dentro de
`calculadora.astro`), mostrar mais duas estimativas, puramente matemáticas,
sem API nova:

1. **Rejunte (kg)**: fórmula padrão de mercado é
   `kg ≈ (comprimento_placa_cm + largura_placa_cm) / (comprimento_placa_cm × largura_placa_cm) × largura_junta_mm × profundidade_junta_mm × densidade_rejunte(kg/dm³) × área_m2`
   — como a calculadora atual não guarda dimensão da placa em cm (só
   `m2_caixa`), ou (a) adicionar campo de dimensão da placa lida do
   catálogo (`produtos.ts` já tem `atributos.dimensao`, ex. "60x60", parsear
   os dois números), ou (b) usar uma estimativa simplificada por m² com
   junta padrão de 2mm (ex.: ~0,3-0,5 kg/m² pra peças grandes tipo
   60x60/90x90, mais para peças pequenas) — decidir a fórmula olhando
   `atributos.dimensao` real do catálogo antes de implementar.
2. **Argamassa (sacos de 20kg)**: regra de bolso comum é ~5kg/m² de
   argamassa (desempenadeira média), portanto `sacos = ceil(area_m2 * 5 / 20)`.

Ambas com aviso visível "estimativa — confirme com o revendedor" (texto
similar ao que já existe em avisos parecidos no site, ex. `AddToCart.astro`
usa disclaimers). Sem dependência nova, sem tocar em `/app` ou pagamento.

Depois de implementar: rodar `npx astro build` (não `npm run build`, que
dispara `postbuild` → `indexnow.mjs`, que faz POST real pra API externa —
evitar rodar isso à toa) e conferir manualmente 2-3 casos com contas na
mão (ex.: ambiente 20m², placa 60x60, junta 2mm → validar kg de rejunte e
nº de sacos de argamassa batem com a fórmula escolhida).

Depois da tarefa 2, seguem as tarefas 3 (`[build]` galeria "Inspire-se"),
4 (`[plan]` simulador de ROI em `/site`) e 5 (`[build]` auditoria a11y) —
ver `macro_plan.md` para o texto completo de cada uma.
