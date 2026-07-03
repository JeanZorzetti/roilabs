---
tipo: ops-doc
status: vivo
data: 2026-07-03
dono: Duda (ops)
---

# Meta Catalog (Instagram + WhatsApp) — reusando o feed do Merchant Center

O mesmo feed do Google (`https://goiania.roilabs.com.br/feed.xml`) alimenta o catálogo da Meta:
o Commerce Manager aceita feeds no formato Google Shopping (RSS 2.0 + namespace `g:`) sem conversão.
Resultado: os 30 porcelanatos viram **catálogo no Instagram** e **catálogo no WhatsApp Business** —
a Duda passa a mandar o produto como card dentro da conversa, com foto, preço e link.

Custo: R$ 0. Dev: zero mudança de código (o feed já cumpre os campos exigidos, ver tabela abaixo).

## Passo a passo (ops — Duda)

1. **Business Manager**: acessar [business.facebook.com](https://business.facebook.com) com a conta
   que administra a página do Facebook / Instagram da ROI Labs (criar o Business se não existir).
2. **Commerce Manager → Catálogos → Criar catálogo** → tipo **E-commerce** → "Enviar informações do produto".
3. No catálogo: **Catálogo → Fontes de dados → Adicionar itens** → opção **"Arquivo de dados"**
   (é o antigo "feed de dados" — não confundir com "Manual"). Na etapa seguinte, escolher
   **"Usar uma URL"** (não o upload de arquivo):
   - URL do feed: `https://goiania.roilabs.com.br/feed.xml`
   - Recarregamento programado: **diário** (mesma cadência do Merchant Center);
   - Sem login/senha (feed público);
   - Moeda padrão: BRL.
4. Conferir a 1ª importação: **30/30 itens** sem erro (a Meta mostra o diagnóstico por item,
   igual ao Google). Erros de campo → ver "Compatibilidade" abaixo.
5. **Instagram Shopping**: Commerce Manager → Configurações → conectar a conta Instagram
   (precisa ser conta comercial) e enviar para análise. Aprovação leva alguns dias — mesma
   lógica da revisão do Merchant Center.
6. **WhatsApp**: no WhatsApp Business (app ou API), Configurações → Empresa → Catálogo →
   conectar ao catálogo do Commerce Manager. A partir daí os produtos aparecem no perfil
   comercial e podem ser enviados como card na conversa (`5562993265713`).

## Compatibilidade do feed (verificado contra o feed.xml atual)

| Campo Meta (obrigatório) | No nosso feed | OK |
|---|---|---|
| `id` | `g:id` (slug) | ✅ |
| `title` | `<title>` (nome + dimensão) | ✅ |
| `description` | `<description>` | ✅ |
| `availability` | `g:availability` = `in_stock` (Meta mapeia formato Google) | ✅ |
| `condition` | `g:condition` = `new` | ✅ |
| `price` | `g:price` = `NN.NN BRL` | ✅ |
| `link` | `<link>` (página do produto, https) | ✅ |
| `image_link` | `g:image_link` (https, mesma imagem da página) | ✅ |
| `brand` (recomendado) | `g:brand` (Biancogres, Delta…) | ✅ |

`g:identifier_exists=no` dispensa GTIN/MPN na Meta do mesmo jeito que no Google.
`g:google_product_category` é aceito e mapeado pela Meta.

## Watch-points

- A revisão do Instagram Shopping pode pedir **política de devolução visível** → já existe:
  `goiania.roilabs.com.br/devolucoes` (criada para o Merchant Center).
- Preço/estoque mudou no site → o feed atualiza sozinho no próximo build; a Meta relê 1×/dia.
- Item reprovado na Meta mas aprovado no Google → quase sempre é imagem (mín. 500×500) ou
  categoria; o diagnóstico por item do Commerce Manager diz o campo exato.
