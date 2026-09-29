# Quickstart — verificar a 018 em produção

1. **Schema**: dentro de `app/`, `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script`.
   O diff deve ser só o `CREATE TABLE "projecao_consultas"` + índice. Aplicar.
2. **Importar**: feito em 28/09 por script fora do repo (plan D7) → 2 linhas.
3. **Lista**: `/admin/projecao/consultas` mostra as 2 consultas da Karla, a de Goiânia com 29 termos e 260 buscas/mês;
   o topo diz "2 consultas · US$ 0,21".
4. **Detalhe**: clicar na de Goiânia → `/admin/projecao?consulta=<id>` com o nicho clínicas, Goiânia, 29 termos na
   caixa e a resposta completa. Nenhum POST para `/api/projecao/consultar`.
5. **Gravar**: consultar 1 termo barato com "Para quem" = "Teste 018" (≈ US$ 0,10). A URL ganha `?consulta=`, e a
   lista passa a ter 3 linhas.
6. **Estados**: `?consulta=nao-existe` → "consulta não encontrada" com link para o histórico.
7. **Larguras**: 1440, 768 e 390 nas duas telas, sem rolagem lateral.
