import { prisma } from '@/lib/prisma';
import { waPedidoLink } from '@/lib/wa';
import { PedidoRow } from './pedido-row';
import { RepassarParceiro } from './repassar-parceiro';

export const dynamic = 'force-dynamic';

export default async function PedidosPage() {
  const [pedidos, parceirosAtivos, negociosAtivos] = await Promise.all([
    prisma.pedido.findMany({ orderBy: { createdAt: 'desc' }, include: { itens: true } }),
    prisma.parceiro.findMany({ where: { estagio: 'ativa' }, select: { id: true, nome: true, nicho: true } }),
    prisma.negocioOriginado.findMany({ where: { estagio: { not: 'perdido' } }, select: { pedidoId: true } }),
  ]);
  const pedidosComRepasse = new Set(negociosAtivos.map((n) => n.pedidoId));

  const brl = (v: unknown) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const badge = (label: string, color: string) => (
    <span style={{ background: color, color: '#fff', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>
      {label}
    </span>
  );

  const pagBadge = (s: string) => {
    const map: Record<string, string> = { pago: '#166534', pendente: '#92400e', reembolsado: '#7f1d1d' };
    return badge(s, map[s] ?? '#374151');
  };

  const fulBadge = (s: string) => {
    const map: Record<string, string> = { confirmado: '#1e3a5f', aguardando: '#4b3800', reembolsado: '#7f1d1d' };
    return badge(s, map[s] ?? '#374151');
  };

  return (
    <div className="page">
      <div className="page__head">
        <h1>Pedidos</h1>
        <p>{pedidos.length} no total · pedidos de porcelanato vindos do carrinho.</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--l-line)' }}>
            {['Nome', 'WhatsApp', 'Itens', 'Frete', 'Cupom', 'Total', 'Pagamento', 'Fulfillment', 'Data', 'Ações'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--l-line)', verticalAlign: 'top' }}>
              <td style={{ padding: '0.6rem 0.8rem' }}>
                <div>{p.nome}</div>
                {p.email && <div style={{ color: 'var(--l-muted)', fontSize: '0.78rem' }}>{p.email}</div>}
              </td>
              <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                <a
                  href={waPedidoLink(p)}
                  target="_blank"
                  rel="noopener"
                  style={{ background: 'var(--green-strong)', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: 5, textDecoration: 'none', fontWeight: 600 }}
                >
                  Chamar no WhatsApp
                </a>
                <div style={{ color: 'var(--l-muted)', fontSize: '0.78rem', marginTop: '0.3rem' }}>{p.whatsapp}</div>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', maxWidth: 240 }}>
                {p.itens.map((it) => (
                  <div key={it.id} style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {it.caixas}cx · {Number(it.m2).toFixed(2)}m² · {it.slug.replace('porcelanato-', '')}
                  </div>
                ))}
                <div style={{ color: 'var(--l-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                  {p.entrega === 'retirada' ? 'Retirada' : p.entrega === 'a_combinar' ? 'Frete a combinar' : `Entrega · ${p.cep ?? '—'}`}
                </div>
              </td>
              <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                {p.frete == null ? <span style={{ color: 'var(--l-muted)' }}>a combinar</span> : brl(p.frete)}
              </td>
              <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap' }}>
                {p.cupomCodigo ? (
                  <span style={{ color: 'var(--green-strong)' }}>{p.cupomCodigo} −{brl(p.desconto)}</span>
                ) : (
                  <span style={{ color: 'var(--l-muted)' }}>—</span>
                )}
              </td>
              <td style={{ padding: '0.6rem 0.8rem', whiteSpace: 'nowrap', fontWeight: 700 }}>{brl(p.total)}</td>
              <td style={{ padding: '0.6rem 0.8rem' }}>{pagBadge(p.statusPagamento)}</td>
              <td style={{ padding: '0.6rem 0.8rem' }}>{fulBadge(p.statusFulfillment)}</td>
              <td style={{ padding: '0.6rem 0.8rem', color: 'var(--l-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                {p.createdAt.toISOString().slice(0, 10)}
              </td>
              <td style={{ padding: '0.6rem 0.8rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {p.statusPagamento === 'pago' && p.statusFulfillment === 'aguardando' && (
                    <PedidoRow id={p.id} />
                  )}
                  {p.statusPagamento === 'pago' && !pedidosComRepasse.has(p.id) && (
                    <RepassarParceiro pedidoId={p.id} parceiros={parceirosAtivos} />
                  )}
                  {p.statusPagamento === 'pago' && pedidosComRepasse.has(p.id) && (
                    <span style={{ color: 'var(--green-strong)', fontSize: '0.78rem' }}>repassado</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {pedidos.length === 0 && (
            <tr>
              <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--l-muted)' }}>
                Nenhum pedido ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
