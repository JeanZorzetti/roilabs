// Cria o schema `vertice` e as 6 tabelas das telas vindas da Vértice (clientes, onboarding,
// propostas, contratos, entregas, planos de mídia) no banco da ROI Labs.
// Run: node --import tsx scripts/migrate-vertice.ts   (lê DATABASE_URL, ou VERTICE_DATABASE_URL se existir)
//
// Idempotente: tudo é `if not exists`. O SQL é o mesmo que o app roda em `ensureSchema`
// (lib/vertice/db.ts), então app e script nunca divergem. O que só o script faz é criar o
// schema — ver o comentário de PG_SCHEMA sobre por que não é o `public`.
import pg from "pg";
import { PG_SCHEMA, SCHEMA } from "../src/lib/vertice/db";

const url = process.env.VERTICE_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL (ou VERTICE_DATABASE_URL) antes de rodar.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, options: `-c search_path=${PG_SCHEMA},public` });
await client.connect();
try {
  await client.query("begin");
  await client.query(`create schema if not exists ${PG_SCHEMA}`);
  await client.query(SCHEMA);
  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  const { rows } = await client
    .query(
      "select table_name from information_schema.tables where table_schema = $1 order by 1",
      [PG_SCHEMA]
    )
    .catch(() => ({ rows: [] as { table_name: string }[] }));
  console.log(`schema ${PG_SCHEMA}:`, rows.map((r) => r.table_name).join(", ") || "(vazio)");
  await client.end();
}
