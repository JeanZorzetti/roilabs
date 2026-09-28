import { query } from "@/lib/vertice/db";
import type { ProposalDoc } from "./proposal";
import type { QuoteLine } from "./quote";
import type { DeliveryDoc, DeliveryInput, DeliveryKind } from "./delivery";
import type { ContractDoc, ContractInput, ContractParty } from "./contract";

export type ClientRow = {
  id: number;
  name: string;
  segment: string | null;
  notes: string | null;
  created_at: string;
};

export type ProgressRow = {
  client_id: number;
  service_id: string;
  item_id: string;
  done: boolean;
  owner: string | null;
  done_at: string | null;
  note: string | null;
};

export type ProposalRow = {
  id: number;
  client_id: number;
  lines: QuoteLine[];
  discount_pct: string;
  monthly: string;
  onetime: string;
  monthly_cost: string;
  onetime_cost: string;
  created_at: string;
  slug: string | null;
  doc: ProposalDoc | null;
  accepted_at: string | null;
  accepted_by: string | null;
  bundle: string | null;
  /** Outra opção do mesmo bundle já foi aceita — esta não será mais. */
  sibling_accepted: boolean;
};

export type ClientSummary = ClientRow & {
  /** Serviços que já têm algum item de onboarding tocado. */
  services: string[];
  doneCount: number;
  touchedCount: number;
};

export async function listClients(): Promise<ClientSummary[]> {
  const rows = await query<ClientRow & { services: string[] | null; done_count: string; touched_count: string }>(
    `select c.*,
            array_remove(array_agg(distinct p.service_id), null) as services,
            count(p.*) filter (where p.done) as done_count,
            count(p.*) as touched_count
       from clients c
       left join onboarding_progress p on p.client_id = c.id
      group by c.id
      order by c.name`
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    segment: row.segment,
    notes: row.notes,
    created_at: row.created_at,
    services: row.services ?? [],
    doneCount: Number(row.done_count),
    touchedCount: Number(row.touched_count),
  }));
}

export async function getClient(id: number): Promise<ClientRow | null> {
  const rows = await query<ClientRow>("select * from clients where id = $1", [id]);
  return rows[0] ?? null;
}

export async function getProgress(clientId: number): Promise<Map<string, ProgressRow>> {
  const rows = await query<ProgressRow>(
    "select * from onboarding_progress where client_id = $1",
    [clientId]
  );
  // Chave composta: um cliente pode ter o mesmo item em serviços diferentes
  // (a fase `base` é compartilhada entre os 6 checklists).
  return new Map(rows.map((row) => [`${row.service_id}:${row.item_id}`, row]));
}

const SIBLING_ACCEPTED = `exists (
  select 1 from proposals o
   where o.bundle = p.bundle and o.id <> p.id and o.accepted_at is not null
) as sibling_accepted`;

/** Todas as propostas, de todos os clientes — a tela /admin/propostas. */
export async function listAllProposals(
  limit = 50
): Promise<(ProposalRow & { client_name: string })[]> {
  return query<ProposalRow & { client_name: string }>(
    `select p.*, c.name as client_name, ${SIBLING_ACCEPTED}
       from proposals p
       join clients c on c.id = p.client_id
      order by p.created_at desc
      limit $1`,
    [limit]
  );
}

/** Uma proposta pelo id — a edição em /admin/precos?editar=<id>. */
export async function getProposal(id: number): Promise<ProposalRow | null> {
  const rows = await query<ProposalRow>(
    `select p.*, ${SIBLING_ACCEPTED} from proposals p where p.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function listProposals(clientId: number): Promise<ProposalRow[]> {
  return query<ProposalRow>(
    `select p.*, ${SIBLING_ACCEPTED}
       from proposals p
      where p.client_id = $1
      order by p.created_at desc
      limit 20`,
    [clientId]
  );
}

export type DeliveryRow = {
  id: number;
  client_id: number;
  proposal_id: number | null;
  kind: DeliveryKind;
  input: DeliveryInput;
  doc: DeliveryDoc;
  slug: string;
  created_at: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
};

/** Todos os termos, de todos os clientes — a tela /admin/entregas. */
export async function listAllDeliveries(
  limit = 50
): Promise<(DeliveryRow & { client_name: string })[]> {
  return query<DeliveryRow & { client_name: string }>(
    `select d.*, c.name as client_name
       from deliveries d
       join clients c on c.id = d.client_id
      order by d.created_at desc
      limit $1`,
    [limit]
  );
}

/** Um termo pelo id — a edição em /admin/entregas/nova?editar=<id>. */
export async function getDelivery(id: number): Promise<DeliveryRow | null> {
  const rows = await query<DeliveryRow>("select * from deliveries where id = $1", [id]);
  return rows[0] ?? null;
}

export type ContractRow = {
  id: number;
  client_id: number;
  proposal_id: number | null;
  input: ContractInput;
  doc: ContractDoc;
  slug: string;
  created_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  accepted_ip: string | null;
};

/** Todos os contratos, de todos os clientes — a tela /admin/contratos. */
export async function listAllContracts(
  limit = 50
): Promise<(ContractRow & { client_name: string })[]> {
  return query<ContractRow & { client_name: string }>(
    `select k.*, c.name as client_name
       from contracts k
       join clients c on c.id = k.client_id
      order by k.created_at desc
      limit $1`,
    [limit]
  );
}

/** Um contrato pelo id — a edição em /admin/contratos/novo?editar=<id>. */
export async function getContract(id: number): Promise<ContractRow | null> {
  const rows = await query<ContractRow>("select * from contracts where id = $1", [id]);
  return rows[0] ?? null;
}

/**
 * A qualificação da Vértice e o foro são os mesmos em todo contrato: o
 * formulário novo reaproveita os do último salvo, em vez de o dono redigitar
 * CNPJ toda vez.
 */
export async function getLastContractDefaults(): Promise<{
  contratada: ContractParty;
  forum: string;
} | null> {
  const rows = await query<{ contratada: ContractParty; forum: string }>(
    "select input->'contratada' as contratada, input->>'forum' as forum from contracts order by id desc limit 1"
  );
  return rows[0] ?? null;
}
