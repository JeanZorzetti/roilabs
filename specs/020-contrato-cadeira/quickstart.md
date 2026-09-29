# Quickstart: validar a 020

## Local (sem banco)

```bash
cd app
node --import tsx test/contrato-cadeira.test.mjs   # montagem, pendências, hash, vigência
npx tsc --noEmit                                   # tipos (o OneDrive pode mentir: vale o build no Docker)
```

## Banco

```bash
cd app
npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script
# conferir: só CREATE TABLE contratos_cadeira + índices + FK. Aplicar só isso:
npx prisma db execute --url "$DATABASE_URL" --file <arquivo-com-o-create>.sql
```

A tabela entra antes do push do código.

## Produção (constituição II)

1. `/admin/precos` → guardar proposta de teste "Teste 020 — apagar" → `/admin/propostas` mostra "Emitir contrato".
2. Emitir com o CNPJ em branco → `/admin/contratos` lista o contrato "Cadeira" com a pendência; o link `/c/<slug>`
   numa janela anônima mostra o contrato sem formulário.
3. POST forçado do aceite (curl com o hash da página) → recusado (`erro=travado`).
4. Completar (dados fictícios) → o link mostra o formulário; aceitar sem a caixa → erro `caixa`; aceitar certo →
   "Aceito em … por …".
5. No banco: `aceito_ip`, `aceito_ua` e `aceito_hash` preenchidos; o hash recalculado do `doc` confere.
6. Cartão da proposta: "Aceito em …", sem "Excluir". Cartão do contrato: sem "Editar" e sem "Excluir".
7. Conferir anuidade, comissão e entregáveis do `/c/` contra o `/p/` da mesma proposta, campo a campo.
8. 360, 768 e 1280 px; teclado até o botão de aceite; console limpo.
9. Limpar: `delete from contratos_cadeira where …; delete from propostas_cadeira where …` (o aceito não sai pela tela,
   de propósito).
