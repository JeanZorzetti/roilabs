import { prisma } from '@/lib/prisma';
import { waLeadLink } from '@/lib/wa';
import { origemDe } from '@/lib/origem';

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
          <tr style={{ borderBottom: '2px solid var(--l-line)' }}>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Nome</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>WhatsApp</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Produto</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Página</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Origem</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem' }}>Data</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} style={{ borderBottom: '1px solid var(--l-line)' }}>
              <td style={{ padding: '0.6rem 0.8rem' }}>{l.nome}</td>
              <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                <a
                  href={waLeadLink(l)}
                  target="_blank"
                  rel="noopener"
                  style={{ background: 'var(--green-strong)', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: 5, textDecoration: 'none', fontWeight: 600 }}
                >
                  Chamar no WhatsApp
                </a>
                <div style={{ color: 'var(--l-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>{l.whatsapp}</div>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--l-muted)' }}>
                {l.produto ?? '—'}
                {l.mensagem?.match(/https?:\/\/\S+/) && (
                  <>
                    {' · '}
                    <a href={l.mensagem.match(/https?:\/\/\S+/)![0]} target="_blank" rel="noopener">
                      carrinho →
                    </a>
                    {/* Same ?c= token rendered as a formal quote (print → PDF) — the link Duda sends. */}
                    {l.mensagem.match(/https?:\/\/\S+/)![0].includes('/carrinho?c=') && (
                      <>
                        {' · '}
                        <a
                          href={l.mensagem.match(/https?:\/\/\S+/)![0].replace('/carrinho?c=', '/orcamento?c=')}
                          target="_blank"
                          rel="noopener"
                        >
                          orçamento →
                        </a>
                      </>
                    )}
                  </>
                )}
              </td>
              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--l-muted)', fontSize: '0.78rem' }}>{l.pagina ?? '—'}</td>
              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--l-muted)', fontSize: '0.78rem' }}>{origemDe(l.mensagem) ?? '—'}</td>
              <td style={{ padding: '0.6rem 0.8rem' }}>
                <span style={{ background: 'var(--porcelain-2)', color: 'var(--green-strong)', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>
                  {l.status}
                </span>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--l-muted)', fontSize: '0.78rem' }}>
                {l.createdAt.toISOString().slice(0, 10)}
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--l-muted)' }}>
                Nenhum lead ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
