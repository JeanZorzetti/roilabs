'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES, LEAD_LABELS } from '@/lib/status';

type Lead = {
  id: string;
  nome: string;
  empresa: string;
  whatsapp: string;
  cidade: string | null;
  categoria: string | null;
  site: string | null;
  mensagem: string | null;
  status: string;
  createdAt: string;
};

export function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function move(status: string) {
    setBusy(true);
    await fetch(`/api/candidaturas/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  // ponytail: assume a local BR number, prefix 55. Add country-code parsing if leads come from elsewhere.
  const wa = '55' + lead.whatsapp.replace(/\D/g, '');

  return (
    <div className="card">
      <div className="card__name">{lead.nome}</div>
      <div className="card__company">{lead.empresa}</div>
      <div className="card__meta">
        {lead.categoria && <span>{lead.categoria}</span>}
        {lead.cidade && <span>{lead.cidade}</span>}
        <span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
      {lead.site && (
        <div className="card__meta">
          <a href={lead.site} target="_blank" rel="noreferrer">{lead.site}</a>
        </div>
      )}
      {lead.mensagem && <div className="card__msg">{lead.mensagem}</div>}
      <div className="card__foot">
        <select disabled={busy} value={lead.status} onChange={(e) => move(e.target.value)}>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{LEAD_LABELS[s]}</option>
          ))}
        </select>
        <a className="wa" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp →</a>
      </div>
    </div>
  );
}
