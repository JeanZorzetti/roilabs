import { prisma } from '@/lib/prisma';
import { agregarPorMes, type ItemPagoInput } from '@/lib/financeiro';

export const dynamic = 'force-dynamic';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toNum = (v: unknown): number | null => (v !== null && v !== undefined ? Number(v) : null);

export default async function FinanceiroPage() {
  const [paramRows, skuRows, itensPagosRaw] = await Promise.all([
    prisma.parametroCentroCusto.findMany(),
    prisma.skuConfig.findMany({ select: { slug: true, modalidadeAlvo: true } }),
    prisma.itemPedido.findMany({
      where: { pedido: { statusPagamento: 'pago' } },
      select: {
        pedidoId: true,
        slug: true,
        subtotal: true,
        pisoSnapshot: true,
        modalidadeSnapshot: true,
        comissaoSnapshot: true,
        aliqIntermediacaoSnapshot: true,
        aliqWLSnapshot: true,
        pedido: { select: { createdAt: true } },
      },
    }),
  ]);

  const globalRow = paramRows.find((r) => r.escopo === 'global') ?? null;
  const globalParams = globalRow
    ? {
        markup: toNum(globalRow.markup),
        comissao: toNum(globalRow.comissao),
        aliqIntermediacao: toNum(globalRow.aliqIntermediacao),
        aliqWL: toNum(globalRow.aliqWL),
      }
    : null;

  const skuMap = new Map(skuRows.map((r) => [r.slug, r.modalidadeAlvo]));

  const itens: ItemPagoInput[] = itensPagosRaw.map((it) => ({
    pedidoId: it.pedidoId,
    createdAt: it.pedido.createdAt,
    subtotal: Number(it.subtotal),
    pisoSnapshot: it.pisoSnapshot !== null ? Number(it.pisoSnapshot) : null,
    modalidadeSnapshot: it.modalidadeSnapshot,
    comissaoSnapshot: it.comissaoSnapshot !== null ? Number(it.comissaoSnapshot) : null,
    aliqIntermediacaoSnapshot:
      it.aliqIntermediacaoSnapshot !== null ? Number(it.aliqIntermediacaoSnapshot) : null,
    aliqWLSnapshot: it.aliqWLSnapshot !== null ? Number(it.aliqWLSnapshot) : null,
    slug: it.slug,
    skuModalidadeAlvo: skuMap.get(it.slug) ?? null,
  }));

  const meses = agregarPorMes(itens, globalParams);

  const totalGmv = meses.reduce((acc, m) => acc + m.gmvPago, 0);
  const totalInter = meses.reduce((acc, m) => acc + m.liquidoInter, 0);
  const totalWL = meses.reduce((acc, m) => acc + m.liquidoWL, 0);
  const totalPedidos = meses.reduce((acc, m) => acc + m.pedidos, 0);

  return (
    <div className="page">
      <div className="page__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div>
          <h1>Financeiro</h1>
          <p>
            Resultado real por mês · calculado a partir do snapshot congelado de cada pedido.{' '}
            Meses passados não mudam quando os parâmetros vigentes são editados.
          </p>
        </div>
        <a href="/api/financeiro/csv" className="btn btn--sm" style={{ whiteSpace: 'nowrap', marginTop: '0.25rem' }}>
          ↓ Baixar CSV
        </a>
      </div>

      {meses.length === 0 ? (
        <p className="muted">Nenhum pedido pago ainda.</p>
      ) : (
        <table className="fin-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>GMV pago</th>
              <th>Líq. Intermediação</th>
              <th>Líq. White Label</th>
              <th>Pedidos</th>
              <th>Sem snapshot</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.mes}>
                <td>{m.mes}</td>
                <td>{brl(m.gmvPago)}</td>
                <td className="fin-inter">{brl(m.liquidoInter)}</td>
                <td className="fin-wl">{brl(m.liquidoWL)}</td>
                <td>{m.pedidos}</td>
                <td>
                  {m.semSnapshot > 0 ? (
                    <span className="fin-warn">⚠ {m.semSnapshot}</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td>{brl(totalGmv)}</td>
              <td className="fin-inter">{brl(totalInter)}</td>
              <td className="fin-wl">{brl(totalWL)}</td>
              <td>{totalPedidos}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
