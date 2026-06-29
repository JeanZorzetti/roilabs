import { prisma } from '@/lib/prisma';
import { LEAD_STATUSES, LEAD_LABELS } from '@/lib/status';
import { LeadCard } from './lead-card';

export const dynamic = 'force-dynamic';

export default async function CandidaturasPage() {
  const leads = await prisma.candidatura.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Candidaturas</h1>
        <p>{leads.length} no total · mude o status pelo seletor de cada card.</p>
      </div>

      <div className="board">
        {LEAD_STATUSES.map((status) => {
          const items = leads.filter((l) => l.status === status);
          return (
            <div key={status} className={`col col--${status}`}>
              <div className="col__head">
                <span>{LEAD_LABELS[status]}</span>
                <span className="col__count">{items.length}</span>
              </div>
              {items.length === 0 && <div className="empty">—</div>}
              {items.map((l) => (
                <LeadCard
                  key={l.id}
                  lead={{
                    id: l.id,
                    nome: l.nome,
                    empresa: l.empresa,
                    whatsapp: l.whatsapp,
                    cidade: l.cidade,
                    categoria: l.categoria,
                    site: l.site,
                    mensagem: l.mensagem,
                    status: l.status,
                    createdAt: l.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
