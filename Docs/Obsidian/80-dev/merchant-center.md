---
tipo: ops-doc
status: vivo
data: 2026-07-02
dono: Duda (ops) / Jean (feed)
---

# Google Merchant Center — cadastro do feed (ops)

Feed: `https://goiania.roilabs.com.br/feed.xml` — RSS 2.0 gerado no build a partir de `porcelanatos.json` (1 item por produto; contrato em `specs/009-merchant-center-feed/contracts/feed-xml.md`). Produto novo no JSON entra no feed no deploy seguinte, sem passo manual.

## 1. Conta

1. Acessar <https://merchants.google.com> logado na conta Google do negócio.
2. Criar a conta Merchant Center: nome do negócio **ROI Labs**, país **Brasil**, fuso **America/Sao_Paulo**.
3. Em "Onde os clientes finalizam a compra", marcar **no meu site**.

## 2. Verificar e reivindicar o domínio

1. Merchant Center → **Configurações (⚙) → Site**.
2. Informar `https://goiania.roilabs.com.br`.
3. Verificação mais fácil: **Search Console** — se `goiania.roilabs.com.br` (ou o domínio `roilabs.com.br`) já estiver verificado na mesma conta Google, a verificação é automática.
   - Ainda não está? Verificar primeiro no Search Console (propriedade de domínio via DNS TXT na zona `roilabs.com.br` cobre todos os subdomínios). ⚠️ Essa MESMA verificação serve ao item "GSC: medir a malha pSEO" do backlog — matar os dois de uma vez.
4. Depois de verificar, clicar em **Reivindicar** (claim) o site.

## 3. Cadastrar o feed

1. **Produtos → Feeds → (+)**.
2. País de venda **Brasil**, idioma **português**, destino **listagens gratuitas** (e Shopping Ads se um dia rodar campanha — não obrigatório).
3. Método: **Busca agendada** (scheduled fetch).
   - Nome do arquivo/URL: `https://goiania.roilabs.com.br/feed.xml`
   - Frequência: **diária** (horário qualquer fora de pico, ex. 04:00).
4. Salvar e clicar **Buscar agora** para o primeiro processamento.

## 4. Habilitar as free listings

1. **Crescimento → Gerenciar programas → Listagens gratuitas** → ativar (se não vier ativo por padrão).
2. Conferir em **Produtos → Diagnóstico** após o processamento: meta = 0 erros estruturais; advertências informativas são aceitáveis (ex.: frete ausente).

## 5. Monitorar

- **Produtos → Diagnóstico**: aprovados / reprovados / pendentes por item. Primeira revisão do Google pode levar de horas a ~3 dias úteis.
- Meta da spec (SC-003): **≥ 90% dos 30 itens aprovados** após a revisão.

## Troubleshooting (reprovações prováveis)

| Sintoma no Diagnóstico | Causa | Ação |
|---|---|---|
| "Preço incompatível" na revisão | Google comparou o preço do feed (R$/m²) com outro número da página | O feed já envia `unit_pricing_measure=1sqm`; se ainda reprovar, fallback decidido na spec (research D2): mudar `g:price` para preço por caixa (`preco × m2_caixa`) e exibir esse valor com destaque na página. |
| "Identificador de produto ausente" | Catálogo sem GTIN/MPN | Já mitigado com `g:identifier_exists=no`. Se itens ficarem limitados por isso, coletar GTINs reais com o fornecedor. |
| Imagem reprovada / não rastreável | `g:image_link` aponta pra CDN de terceiro (vteximg) que pode bloquear o robô do Google | Hospedar as imagens no próprio site (baixar para `public/produtos/`) e trocar as URLs no JSON. |
| Feed não buscado (fetch falha) | Deploy quebrado ou URL errada | `curl -I https://goiania.roilabs.com.br/feed.xml` deve dar 200; o build só passa com feed válido (gate `check-feed`). |
| "Página de destino inativa" | Produto removido do JSON mas o Google ainda tem o item | O item some do feed no mesmo deploy que remove a página — reprocessar o feed (Buscar agora). |
