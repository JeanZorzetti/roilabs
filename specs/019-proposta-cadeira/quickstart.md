# Quickstart — 019 Proposta de cadeira

1. **Schema**: dentro de `app/`, rode
   `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`.
   Se for só o `CREATE TABLE "propostas_cadeira"` e os índices, aplique com `npx prisma db execute --stdin`. Depois,
   `migrate diff --exit-code` deve dar 0.
2. **Regra pura**: `node --import tsx test/precos-cadeira.test.mjs`, e depois `npm test` inteiro.
3. **Produção** (depois do push, com o deploy no ar):
   - Em `/admin/precos`, escolha Moda, 30 pedidos de R$ 200 e 20% de recompra, "Para quem" = `Teste 019 (apagar)`, e
     guarde. Você deve cair em `/admin/propostas` com o cartão no topo: R$ 4.010 de entrada, R$ 840/mês e R$ 14.090 no
     1º ano.
   - Abra o link numa janela anônima: mesmos números, marca ROI Labs, nenhum texto interno. Confira em 1440, 768 e
     390 px, o console limpo e o botão do WhatsApp com a mensagem.
   - Repita com um nicho SaaS e um de clínica (números contra o simulador).
   - Guarde sem "Para quem": a mensagem aparece e nada é gravado.
   - `/p/xxxxxxxx` → "Proposta não encontrada" (404).
   - Exclua as propostas de teste: o link volta 404.
   - O cartão da Vértice não tem mais "Editar esta proposta".
