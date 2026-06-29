// Lead pipeline stages (kanban columns), in order.
export const LEAD_STATUSES = ['novo', 'curadoria', 'aprovado', 'recusado'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo',
  curadoria: 'Em curadoria',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

export function isLeadStatus(v: unknown): v is LeadStatus {
  return typeof v === 'string' && (LEAD_STATUSES as readonly string[]).includes(v);
}
