# Contract — página pública `GET /p/[slug]` (app.roilabs.com.br)

- Sem login. `robots: noindex, nofollow`. `dynamic = 'force-dynamic'`.
- `slug` fora de `/^[A-Za-z0-9_-]{8}$/`, ou sem linha → `notFound()` → `p/[slug]/not-found.tsx` (status 404), com a
  marca da ROI Labs e sem citar nenhuma outra proposta.
- Lê só `doc`. Nenhum import de `NICHOS`, `simular` ou do catálogo: a página não tem de onde recalcular (FR-006).
- `<title>`: `Proposta para {paraQuem} · ROI Labs`.

Ordem de leitura (o design-review ajusta a forma, não o conteúdo):

1. Marca ROI Labs, "Proposta para {paraQuem}", cadeira do nicho {nome}, data e "válida até". Vencida: faixa no topo.
2. O que você paga: entrada por ano (setup R$ 0, anuidade, domínio, total) e comissão (resumo + quando + regras).
3. Estimativa no ritmo combinado (se houver): comissão por mês, 12 meses, total do 1º ano, % da venda. O ritmo
   informado vem logo embaixo, como premissa. Ritmo zero: frase dizendo que a comissão depende da venda.
4. Condições do contrato e do domínio.
5. "Falar com a ROI Labs no WhatsApp" (`wa.me/5562993265713`, mensagem com nicho e para quem).
