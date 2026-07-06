---
status: in_progress
next_effort: high
iteration: 4
updated_at: 2026-07-06T08:55:00.000Z
---

## Last completed
Tarefa 4 (Semana 1, Macro plan 3): guia AEO `/guia/piso-vinilico-vs-porcelanato/`
no site-goiania. Criado `src/pages/guia/piso-vinilico-vs-porcelanato.astro` no
mesmo padrão do `porcelanato-liquido-vs-porcelanato.astro`: BLUF no hero, seção
"o que é cada um" (LVT colado vs SPC click vs placa cerâmica), tabela
comparativa de 8 critérios (custo instalado com o custo escondido de
regularização do contrapiso, durabilidade/capa de uso, umidade, conforto
térmico/acústico, sol direto, instalação em reforma, reparo, revenda), seção
"quando cada um faz sentido" (incluindo o cenário híbrido porcelanato+vinílico
com o gotcha da transição de nível), FAQ com 8 perguntas. JSON-LD com FAQPage +
BreadcrumbList. Interlinks: glossário via âncoras (#pei, #absorcao-de-agua,
#argamassa-colante, #rejunte, #junta, #lote), guias (como-assentar,
como-escolher, quanto-custa, area-externa, liquido-vs-porcelanato,
porcelanato-ou-ceramica), calculadora e catálogo; CTAs duplos. Registrado em
`src/data/guias.ts`. `astro build` verde (97 páginas); conferido que a URL
aparece em dist/sitemap.xml, dist/llms.txt e dist/busca-index.json, que o HTML
emite FAQPage + BreadcrumbList e que o OG
`dist/open-graph/guia/piso-vinilico-vs-porcelanato.png` foi gerado.

## Next step
Tarefa 5 do `macro_plan.md` (Semana 1, `[high]`): **glossário ida-e-volta** no
site-goiania. O glossário `/glossario/` (19 termos com âncoras `#termo` em
`src/pages/glossario.astro` — ids: pei, absorcao-de-agua, esmaltado, tecnico,
destonalizacao, lote, polido, acetinado, natural, antiderrapante, retificado,
bold, calibre, m2-por-caixa, formato-grande, junta, rejunte, argamassa-colante,
paginacao, nivelador) já linka guias/produtos na IDA. Auditar a VOLTA: varrer
os 11 guias em `src/pages/guia/*.astro` e as páginas/templates de produto
(malha `/porcelanato/` — ver template em `src/pages/porcelanato/`) que citam
termos técnicos e linkar o 1º uso de cada termo por página para a âncora
`#termo` de `/glossario/`. Regras: máx. 1 link por termo por página, não
quebrar layout (conferir com `astro build` verde no site-goiania antes do
commit). Os guias mais novos (como-limpar, como-assentar, erros-ao-comprar,
piso-vinilico-vs) já interlinkam bastante — se a volta já existir de forma
geral, registrar "pulado (já existia)" e seguir para a tarefa 6 ([low], hub
/guia/).
