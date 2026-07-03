---
tipo: ops-doc
status: vivo
data: 2026-07-03
dono: Jean (dev/ops) — ~10 min
---

# Bing Webmaster Tools — importar do GSC (~10 min)

Por que vale: **Copilot e o Bing Chat citam o índice do Bing**, e parte das buscas do
ChatGPT também bebe dele. Nossos sites já pingam **IndexNow** a cada deploy (chave
`e72cab81...` no `public/` dos dois sites) — mas o ping só tem efeito pleno quando o
site existe no Bing Webmaster. É a ponta solta do GEO: 10 minutos, custo zero.

## Passo a passo (Jean)

1. Acessar [bing.com/webmasters](https://www.bing.com/webmasters) e logar com conta
   Microsoft (criar uma com o e-mail comercial se não houver).
2. Na tela inicial, escolher **"Importar do Google Search Console"** → autorizar com a
   conta Google que tem as propriedades. Isso importa **verificação + sitemaps** das
   propriedades do GSC de uma vez — sem meta tag, sem DNS:
   - `roilabs.com.br` (institucional)
   - `goiania.roilabs.com.br` (e-commerce + malha + guias)
3. Conferir em **Sitemaps** que os dois `sitemap.xml` vieram junto; se não, submeter:
   - `https://roilabs.com.br/sitemap.xml`
   - `https://goiania.roilabs.com.br/sitemap.xml`
4. Conferir em **IndexNow** (menu lateral) que os pings dos deploys passam a aparecer —
   o próximo deploy de qualquer site já deve registrar.
5. (Opcional, 2 min) **URL Inspection** na home dos dois sites → "Request indexing",
   mesma lógica do GSC.

## Watch-points

- A importação do GSC replica as propriedades que a conta Google enxerga — usar a MESMA
  conta que administra o GSC do goiânia (a do print de 2026-07-03).
- Bing rastreia bem menos que o Google em site novo; o valor aqui não é tráfego Bing,
  é **presença no índice que os motores de resposta citam** ([[geo_aeo_playbook]]).
- Métrica de acompanhamento: Bing Webmaster → Search Performance, olhar 1×/mês no
  ritual do digest — não vale ritual próprio.

Ver também: [[backlog-pendencias]] (GSC: resubmeter sitemap pós-fix do 301).
