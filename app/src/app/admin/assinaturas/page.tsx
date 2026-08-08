import { prisma } from '@/lib/prisma';
import { CancelarAdminButton } from './cancelar-admin-button';

export const dynamic = 'force-dynamic';

const brl = (v: unknown) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (v: Date | null) => (v ? v.toLocaleDateString('pt-BR') : '—');

const badge = (label: string, color: string) => (
  <span style={{ background: color, color: '#fff', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>
    {label}
  </span>
);

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = { ativa: '#166534', inadimplente: '#92400e', cancelada: '#7f1d1d' };
  return badge(estado, map[estado] ?? '#374151');
};

// FR-008 / US4: estado, última e próxima cobrança de qualquer assinatura num lugar só.
export default async function AssinaturasPage() {
  const assinaturas = await prisma.assinatura.findMany({
    orderBy: { createdAt: 'desc' },
    include: { ciclos: { orderBy: { dataTentativa: 'desc' }, take: 1 } },
  });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Assinaturas</h1>
        <p>{assinaturas.length} no total.</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--l-line)' }}>
            {['Produto', 'Estado', 'Última tentativa', 'Próxima cobrança', 'Recorrência', 'Criada em', 'Ações'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assinaturas.map((a) => {
            const ultimo = a.ciclos[0] ?? null;
            return (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--l-line)', verticalAlign: 'top' }}>
                <td style={{ padding: '0.6rem 0.8rem' }}>{a.slug}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>{estadoBadge(a.estado)}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  {ultimo ? (
                    <>
                      {data(ultimo.dataTentativa)} · {ultimo.resultado}
                      {ultimo.motivo ? ` (${ultimo.motivo})` : ''}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '0.6rem 0.8rem' }}>{data(a.proximaCobranca)}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>{a.recorrencia}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>{data(a.createdAt)}</td>
                <td style={{ padding: '0.6rem 0.8rem' }}>
                  {a.estado !== 'cancelada' && <CancelarAdminButton id={a.id} slug={a.slug} />}
                </td>
              </tr>
            );
          })}
          {assinaturas.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">Nenhuma assinatura ainda.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
