# Quickstart: validar o feed Merchant Center (009)

## Pré-requisitos

- Node 20+ e dependências instaladas em `site-goiania/` (`npm install`).
- ⚠️ Constituição II: build local em OneDrive é smoke test; evidência final é Docker/EasyPanel + prod.

## Validação local (smoke)

```bash
cd site-goiania
npm run build          # prebuild (check-matrix) → astro build → postbuild (check-feed)
```

Esperado: `check-feed` reporta `feed.xml OK — 30 itens` (ou contagem atual do catálogo) e o build termina verde.

Inspeção manual do artefato:

```bash
head -40 dist/feed.xml   # declaração XML, channel, primeiro <item> completo
```

Cenário negativo (prova do gate): remover temporariamente o `preco` de um produto em `porcelanatos.json` → `npm run build` deve falhar apontando slug + campo → reverter.

## Verificação em prod (obrigatória, pós-deploy EasyPanel)

```bash
curl -s https://goiania.roilabs.com.br/feed.xml | head -40
curl -s https://goiania.roilabs.com.br/feed.xml | grep -c "<item>"   # = nº de produtos elegíveis
```

Paridade (amostra de 1 item): abrir o `link` do item no navegador e conferir título, imagem e preço idênticos aos do feed.

## Cadastro no Merchant Center (ops)

Seguir `site-goiania/docs/merchant-center.md`: conta → verificação do domínio (via Search Console, serve também ao item GSC do backlog) → cadastrar feed por URL (`https://goiania.roilabs.com.br/feed.xml`, busca diária) → habilitar free listings → acompanhar em Produtos → Diagnóstico.

**Sucesso (SC-002/SC-003)**: painel processa o feed sem erro estrutural; ≥ 90% dos itens aprovados após a revisão.
