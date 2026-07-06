---
title: Google Shopping para loja de material de construção — o que o Google exige de verdade
description: Colocar produtos de uma loja de material de construção no Google Shopping (listagens gratuitas) exige um feed de produtos, domínio verificado, imagem própria, política de devolução e paridade de preço entre feed e página. Este é o passo a passo real de quem montou um feed de 30 porcelanatos para o Merchant Center.
eyebrow: Google Shopping · Material de construção
pubDate: 2026-07-06
author: Equipe ROI Labs
faq:
  - q: 'Preciso pagar para aparecer no Google Shopping?'
    a: 'Não necessariamente. Além dos anúncios pagos (Shopping Ads), o Google oferece as listagens gratuitas (free listings): seus produtos aparecem na aba Shopping sem custo por clique. O requisito é técnico, não financeiro — conta no Merchant Center, domínio verificado e um feed de produtos válido.'
  - q: 'O que é um feed de produtos para o Merchant Center?'
    a: 'É um arquivo estruturado (XML no vocabulário do Google, com campos como g:price, g:image_link e g:availability) que lista cada produto da loja com título, preço, imagem e link da página. O Google busca esse arquivo periodicamente (fetch agendado, por exemplo diário) e usa os dados para montar as listagens. O ideal é gerá-lo automaticamente a partir do catálogo, para que produto novo entre no feed sem passo manual.'
  - q: 'Posso usar as fotos do site do fabricante no meu feed?'
    a: 'É arriscado. Se a imagem do feed aponta para o CDN de um terceiro, o robô do Google pode ser bloqueado ao rastreá-la e o item é reprovado. A prática segura é hospedar as imagens no seu próprio domínio. Além disso, imagem que não corresponde ao produto real da página é motivo clássico de reprovação.'
  - q: 'Meus produtos não têm código de barras (GTIN). Posso vender no Shopping mesmo assim?'
    a: 'Sim. Para catálogos sem GTIN/MPN — comum em revestimentos vendidos por m² — o feed declara identifier_exists=no. O item pode ficar com alcance limitado em algumas superfícies, mas não é reprovado por isso. Se o fornecedor tiver os GTINs reais, vale coletá-los depois para ampliar o alcance.'
  - q: 'Produto vendido por metro quadrado dá problema no Shopping?'
    a: 'Dá trabalho extra, mas tem solução prevista pelo próprio Google: o campo unit_pricing_measure informa que o preço é por unidade de medida (1sqm, no caso de piso). O ponto crítico é a paridade — o preço do feed precisa bater com o preço exibido na página de destino, senão o item é reprovado por "preço incompatível".'
  - q: 'Quanto tempo o Google leva para aprovar os produtos?'
    a: 'A primeira revisão após o processamento do feed leva de algumas horas a cerca de 3 dias úteis. O acompanhamento é feito em Produtos → Diagnóstico no Merchant Center, que mostra itens aprovados, reprovados e pendentes, com o motivo de cada reprovação.'
---

Para colocar uma loja de material de construção no Google Shopping não basta ter site: o Google exige uma conta no Merchant Center, domínio verificado e reivindicado, um feed de produtos estruturado, imagem hospedada no seu próprio domínio, política de devolução publicada e — o ponto que mais reprova item — paridade exata entre o preço do feed e o preço da página. A boa notícia: nas **listagens gratuitas**, tudo isso custa trabalho técnico, não mídia. Este artigo é o passo a passo real que seguimos ao montar o feed de 30 porcelanatos do polo de revestimentos que operamos em Goiânia.

## O que é o Google Shopping gratuito (free listings)?

O Google Shopping tem duas portas: os anúncios pagos (Shopping Ads, com custo por clique) e as **listagens gratuitas**, em que os produtos aparecem na aba Shopping sem mídia paga. Para uma loja de material de construção, as listagens gratuitas são o ponto de partida óbvio: o custo é zero e a estrutura montada para elas é exatamente a mesma exigida se um dia você quiser rodar campanha paga.

A porta de entrada das duas é o **Google Merchant Center** — o painel onde você cadastra o negócio, verifica o domínio e envia o catálogo. Quem já domina a busca orgânica local (veja [como vender porcelanato pela internet](/blog/vender-porcelanato-internet-goiania/)) ganha ali uma segunda vitrine sobre o mesmo catálogo, sem duplicar operação.

## O que o Google exige antes de mostrar seus produtos?

Quatro blocos, nesta ordem:

1. **Conta no Merchant Center** — nome do negócio, país (Brasil), fuso, e a declaração de onde o cliente finaliza a compra (no site, na loja, ou ambos).
2. **Domínio verificado e reivindicado** — o caminho mais curto é o Search Console: uma verificação de domínio via DNS cobre todos os subdomínios e serve, de quebra, para medir o SEO do site. Depois de verificar, é preciso *reivindicar* (claim) o site no Merchant Center.
3. **Feed de produtos válido** — o arquivo XML com os dados de cada item (detalhado abaixo).
4. **Informações de confiança na loja** — política de devolução publicada, dados de contato e informação de frete/retirada. Frete ausente costuma gerar só advertência informativa, mas política de devolução inexistente derruba a confiança da conta.

## Como funciona o feed de produtos na prática?

O feed é um RSS 2.0 no vocabulário do Google (`xmlns:g`), com um `<item>` por produto e campos como `g:title`, `g:price`, `g:image_link`, `g:availability` e `g:condition`. No nosso caso, ele é **gerado no build do site** a partir do mesmo JSON que alimenta as páginas de produto — 30 itens hoje, e produto novo no catálogo entra no feed no deploy seguinte, sem passo manual.

Duas decisões técnicas evitam a maior parte das reprovações:

- **Paridade por construção, não por disciplina.** Título, descrição e preço do feed saem das *mesmas funções* que montam a página de produto. Não existe "esqueci de atualizar o feed" — os dois nascem da mesma fonte.
- **Validação que quebra o build.** Um script roda após cada build e confere o feed inteiro: campos obrigatórios por item, contagem batendo com o catálogo, imagens no domínio próprio. Feed malformado = deploy nem sai.

No Merchant Center, o cadastro é simples: Produtos → Feeds, método **busca agendada** apontando para a URL do feed, frequência diária. O Google baixa o arquivo todo dia e reprocessa sozinho.

## Quais são as reprovações mais comuns (e como evitar)?

| Reprovação | Causa típica | Prevenção |
| :-- | :-- | :-- |
| Preço incompatível | Preço do feed ≠ preço visível na página (clássico em produto por m²) | Mesma fonte de dados para feed e página; `unit_pricing_measure` (1sqm) para preço por metro |
| Imagem não rastreável | `image_link` apontando para CDN de terceiro que bloqueia o robô | Hospedar as imagens no próprio domínio |
| Identificador ausente | Catálogo sem GTIN/MPN | Declarar `identifier_exists=no`; coletar GTINs reais depois, se houver |
| Página de destino inativa | Produto removido do site mas ainda presente no feed | Feed gerado do mesmo catálogo da página: item some dos dois no mesmo deploy |
| Dados do negócio incompletos | Sem política de devolução ou contato | Página de devoluções publicada e linkada no rodapé |

Após o primeiro processamento, o acompanhamento vive em **Produtos → Diagnóstico**: a primeira revisão leva de horas a ~3 dias úteis, e cada reprovação vem com o motivo.

## Vale a pena para uma loja de material de construção?

Vale, com uma ressalva honesta: o Shopping gratuito é uma **vitrine adicional**, não uma estratégia completa. Ele funciona melhor quando já existe uma base — páginas de produto reais, com preço, foto própria e informação técnica — porque é para essas páginas que o clique vai. Montar o feed sem ter páginas que convertem é inverter a ordem.

É exatamente essa a sequência do modelo que operamos no [polo de revestimentos de Goiânia](/polo-goiania/): primeiro a malha de páginas de alta intenção, depois o feed por cima do mesmo catálogo. Para o lojista parceiro, todo esse trabalho técnico — feed, validação, Merchant Center — está incluído no [modelo Growth Partner](/modelo/), sem custo fixo: a remuneração é uma fração do que vendeu, e você pode dimensionar a conta no [simulador](/simulador/). Se preferir entender o custo de fazer tudo por conta própria, a comparação está em [e-commerce próprio vs entrar num polo pronto](/blog/ecommerce-proprio-vs-polo-pronto/).
