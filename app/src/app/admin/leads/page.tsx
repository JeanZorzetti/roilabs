import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function LeadsConsumidorPage() {
  const leads = await prisma.leadConsumidor.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Leads Consumidor</h1>
        <p>{leads.length} no total · leads de porcelanato vindos do site Goiânia.</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Nome</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>WhatsApp</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Produto</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Página</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Data</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '0.6rem 0.8rem' }}>{l.nome}</td>
              <td style={{ padding: '0.6rem 0.8rem' }}>
                <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">
                  {l.whatsapp}
                </a>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', color: '#999' }}>{l.produto ?? '—'}</td>
              <td style={{ padding: '0.6rem 0.8rem', color: '#999', fontSize: '0.78rem' }}>{l.pagina ?? '—'}</td>
              <td style={{ padding: '0.6rem 0.8rem' }}>
                <span style={{ background: '#1e2a1e', color: '#4ade80', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem' }}>
                  {l.status}
                </span>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', color: '#666', fontSize: '0.78rem' }}>
                {l.createdAt.toISOString().slice(0, 10)}
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                Nenhum lead ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
