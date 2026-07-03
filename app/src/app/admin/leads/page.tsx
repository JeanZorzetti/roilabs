import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ponytail: assume a local BR number, prefix 55 (same rule as the candidatura card).
function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('55') && digits.length > 11 ? digits : '55' + digits;
}

// 1-click template: Duda opens the chat already contextualized instead of typing from scratch.
function waLink(lead: { nome: string; whatsapp: string; produto: string | null; mensagem: string | null }) {
  const primeiroNome = lead.nome.trim().split(/\s+/)[0];
  const cartLink = lead.mensagem?.match(/https?:\/\/\S+/)?.[0];
  const contexto = lead.produto ? ` sobre ${lead.produto}` : ' de porcelanato';
  const text =
    `Olá, ${primeiroNome}! Aqui é da ROI Labs 👋 Recebemos seu pedido${contexto} pelo site ` +
    `e já consigo te passar os valores com frete. Pode me confirmar o bairro e a metragem da sua obra?` +
    (cartLink ? `\n\nSeu carrinho salvo: ${cartLink}` : '');
  return `https://wa.me/${waNumber(lead.whatsapp)}?text=${encodeURIComponent(text)}`;
}

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
              <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                <a
                  href={waLink(l)}
                  target="_blank"
                  rel="noopener"
                  style={{ background: '#166534', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: 5, textDecoration: 'none', fontWeight: 600 }}
                >
                  Chamar no WhatsApp
                </a>
                <div style={{ color: '#999', fontSize: '0.78rem', marginTop: '0.3rem' }}>{l.whatsapp}</div>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', color: '#999' }}>
                {l.produto ?? '—'}
                {l.mensagem?.match(/https?:\/\/\S+/) && (
                  <>
                    {' · '}
                    <a href={l.mensagem.match(/https?:\/\/\S+/)![0]} target="_blank" rel="noopener">
                      carrinho →
                    </a>
                  </>
                )}
              </td>
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
