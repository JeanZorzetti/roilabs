import { Pool } from "pg";

/**
 * Pool único para as telas que vieram da Vértice em /admin (clientes,
 * onboarding, propostas, contratos, entregas). Mora no banco da ROI Labs
 * (`roilabs_db`, o mesmo `DATABASE_URL` do Prisma), no schema `vertice`.
 * `VERTICE_DATABASE_URL` só existe para apontar para outro banco.
 *
 * O `globalThis` evita que o hot reload do `next dev` abra um pool novo a cada
 * recompilação e estoure o limite de conexões do servidor.
 */
const globalForPool = globalThis as unknown as { verticePool?: Pool };

/**
 * Schema Postgres das tabelas. Fora do `public` de propósito: o `roilabs_db`
 * recebe `prisma db push` manual, e o push apaga do `public` toda tabela que
 * não está no schema.prisma. O `public` no search_path mantém funcionando um
 * banco sem o schema `vertice` (o `verticemkt` antigo, tabelas no `public`).
 * Quem cria o schema é `scripts/migrate-vertice.ts` — o `ensureSchema` abaixo
 * não cria, senão num banco antigo ele abriria tabelas vazias por cima das reais.
 */
export const PG_SCHEMA = "vertice";

function connectionString(): string {
  const url = process.env.VERTICE_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. As telas de clientes, propostas, contratos e entregas precisam dela para ler e gravar."
    );
  }
  return url;
}

export function pool(): Pool {
  if (!globalForPool.verticePool) {
    globalForPool.verticePool = new Pool({
      connectionString: connectionString(),
      options: `-c search_path=${PG_SCHEMA},public`,
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return globalForPool.verticePool;
}

// ponytail: schema criado sob demanda com CREATE TABLE IF NOT EXISTS em vez de
// ferramenta de migração. São 6 tabelas e um único operador. Se aparecer uma
// segunda pessoa escrevendo schema, migrar para drizzle-kit ou node-pg-migrate.
let schemaReady: Promise<void> | null = null;

export const SCHEMA = `
create table if not exists clients (
  id          serial primary key,
  name        text not null,
  segment     text,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists onboarding_progress (
  client_id   integer not null references clients(id) on delete cascade,
  service_id  text not null,
  item_id     text not null,
  done        boolean not null default false,
  owner       text,
  done_at     timestamptz,
  note        text,
  primary key (client_id, service_id, item_id)
);

create table if not exists proposals (
  id            serial primary key,
  client_id     integer not null references clients(id) on delete cascade,
  lines         jsonb not null,
  discount_pct  numeric not null default 0,
  monthly       numeric not null default 0,
  onetime       numeric not null default 0,
  monthly_cost  numeric not null default 0,
  created_at    timestamptz not null default now()
);

-- Proposta enviável ao cliente. A coluna doc é o documento congelado no
-- save: nome, escopo e preço já formatados, sem custo nem margem. A página
-- pública só renderiza esse jsonb — mudar a tabela de preço depois não reescreve
-- proposta já enviada, e não existe caminho de código que vaze o interno.
alter table proposals add column if not exists slug        text;
alter table proposals add column if not exists doc         jsonb;
alter table proposals add column if not exists accepted_at timestamptz;
alter table proposals add column if not exists accepted_by text;
alter table proposals add column if not exists onetime_cost numeric not null default 0;
create unique index if not exists proposals_slug_key on proposals (slug);
-- Propostas alternativas para o mesmo pedido. Linhas com o mesmo bundle saem
-- juntas no link de qualquer uma delas, e o cliente aceita só uma. Cada linha
-- continua com preço, custo e aceite próprios.
alter table proposals add column if not exists bundle text;

-- Termo de entrega. Fecha o ciclo proposta → aceite → entrega → recebimento.
-- \`proposal_id\` é \`set null\`, não \`cascade\`: apagar a proposta não pode apagar o
-- registro do que foi entregue — a entrega aconteceu de qualquer jeito.
-- \`input\` é o que o formulário mandou (reabre para edição) e \`doc\` é o documento
-- congelado, o único que a página pública lê.
create table if not exists deliveries (
  id            serial primary key,
  client_id     integer not null references clients(id) on delete cascade,
  proposal_id   integer references proposals(id) on delete set null,
  kind          text not null default 'final',
  input         jsonb not null,
  doc           jsonb not null,
  slug          text not null,
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz,
  confirmed_by  text
);
create unique index if not exists deliveries_slug_key on deliveries (slug);

-- Contrato. Nasce de uma proposta e, no aceite, aceita a proposta junto.
-- \`accepted_ip\` e \`accepted_ua\` são a prova de autoria do aceite eletrônico
-- (MP 2.200-2/2001, art. 10, § 2º) — nome e data sozinhos provam pouco.
create table if not exists contracts (
  id            serial primary key,
  client_id     integer not null references clients(id) on delete cascade,
  proposal_id   integer references proposals(id) on delete set null,
  input         jsonb not null,
  doc           jsonb not null,
  slug          text not null,
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  accepted_by   text,
  accepted_ip   text,
  accepted_ua   text
);
create unique index if not exists contracts_slug_key on contracts (slug);

-- Plano de mídia trimestral. Mesmo par input/doc do termo: \`input\` reabre o
-- editor, \`doc\` é o plano com a projeção já calculada, o único que /m/<slug> lê.
create table if not exists media_plans (
  id            serial primary key,
  client_id     integer not null references clients(id) on delete cascade,
  start_month   text not null,
  input         jsonb not null,
  doc           jsonb not null,
  slug          text not null,
  created_at    timestamptz not null default now()
);
create unique index if not exists media_plans_slug_key on media_plans (slug);
`;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((error) => {
        // Sem isso, uma falha de rede no primeiro acesso "cacheia" o erro para
        // sempre e a área toda fica morta até o próximo deploy.
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const result = await pool().query(text, params);
  return result.rows as T[];
}
