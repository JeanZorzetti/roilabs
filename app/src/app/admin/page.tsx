import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { derivarOcupacao } from '@/lib/ocupacao';

export const dynamic = 'force-dynamic';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (n: number, d: number) =>
  d === 0 ? '— (0 leads)' : `${((n / d) * 100).toFixed(1)}%`;

export default async function PainelPage() {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    cand24h,
    cand7d,
    candStatuses,
    leads24h,
    leads7d,
    leadStatuses,
    gmvMes,
    fulfillmentPendente,
    cadeiraGroups,
    pedidos7d,
    leadsCount7d,
  ] = await Promise.all([
    prisma.candidatura.count({ where: { createdAt: { gte: h24 } } }),
    prisma.candidatura.count({ where: { createdAt: { gte: d7 } } }),
    prisma.candidatura.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.leadConsumidor.count({ where: { createdAt: { gte: h24 } } }),
    prisma.leadConsumidor.count({ where: { createdAt: { gte: d7 } } }),
    prisma.leadConsumidor.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.pedido.aggregate({
      where: { statusPagamento: 'pago', createdAt: { gte: startOfMonth } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.pedido.count({ where: { statusPagamento: 'pago', statusFulfillment: 'aguardando' } }),
    prisma.cadeira.findMany({ select: { polo: true, parceiros: { select: { estagio: true, contratoEm: true } } } }),
    prisma.pedido.count({ where: { statusPagamento: 'pago', createdAt: { gte: d7 } } }),
    prisma.leadConsumidor.count({ where: { createdAt: { gte: d7 } } }),
  ]);

  const gmvPagoMes = Number(gmvMes._sum.total ?? 0);
  const pedidosPagosMes = gmvMes._count.id;

  const polosMap = new Map<string, { ocupadas: number; prospeccao: number; abertas: number }>();
  for (const cadeira of cadeiraGroups) {
    if (!polosMap.has(cadeira.polo)) polosMap.set(cadeira.polo, { ocupadas: 0, prospeccao: 0, abertas: 0 });
    const entry = polosMap.get(cadeira.polo)!;
    const estado = derivarOcupacao(cadeira.parceiros);
    if (estado === 'ocupada') entry.ocupadas += 1;
    else if (estado === 'prospeccao') entry.prospeccao += 1;
    else entry.abertas += 1;
  }
  const polos = [...polosMap.entries()].map(([polo, c]) => ({ polo, ...c }));

  const mesLabel = startOfMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const diaLabel = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const candStatusText = candStatuses
    .map((s) => `${s._count.id} ${s.status}`)
    .join(' · ') || '0 registros';
  const leadStatusText = leadStatuses
    .map((s) => `${s._count.id} ${s.status}`)
    .join(' · ') || '0 registros';

  return (
    <div className="page">
      <div className="page__head">
        <h1>Painel</h1>
        <p>Estado do negócio em {diaLabel}.</p>
      </div>

      {/* Captação */}
      <div className="painel-section">
        <div className="painel-section__title">Captação — parceiros</div>
        <div className="cc-cards">
          <Link href="/admin/candidaturas" className="cc-card painel-card-link">
            <div className="cc-card__label">Candidaturas novas</div>
            <div className="cc-card__value">
              {cand24h} <span className="painel-win">24h</span>{' '}
              · {cand7d} <span className="painel-win">7d</span>
            </div>
            <div className="cc-note">{candStatusText}</div>
          </Link>
        </div>
      </div>

      {/* Demanda */}
      <div className="painel-section">
        <div className="painel-section__title">Demanda — consumidores</div>
        <div className="cc-cards">
          <Link href="/admin/leads" className="cc-card painel-card-link">
            <div className="cc-card__label">Leads Goiânia novos</div>
            <div className="cc-card__value">
              {leads24h} <span className="painel-win">24h</span>{' '}
              · {leads7d} <span className="painel-win">7d</span>
            </div>
            <div className="cc-note">{leadStatusText}</div>
          </Link>
          <div className="cc-card">
            <div className="cc-card__label">
              Conversão lead→pedido{' '}
              <span style={{ fontWeight: 400 }}>(7d, aproximada)</span>
            </div>
            <div className="cc-card__value">{pct(pedidos7d, leadsCount7d)}</div>
            <div className="cc-note">
              {pedidos7d} pedidos pagos ÷ {leadsCount7d} leads nos últimos 7 dias
            </div>
          </div>
        </div>
      </div>

      {/* Mês corrente */}
      <div className="painel-section">
        <div className="painel-section__title">Mês corrente — {mesLabel}</div>
        <div className="cc-cards">
          <Link href="/admin/pedidos" className="cc-card painel-card-link">
            <div className="cc-card__label">GMV pago</div>
            <div className="cc-card__value is-inter">{brl(gmvPagoMes)}</div>
            <div className="cc-note">{pedidosPagosMes} pedido(s) pago(s)</div>
          </Link>
          <Link
            href="/admin/pedidos"
            className={`cc-card painel-card-link${fulfillmentPendente > 0 ? ' painel-card--alert' : ''}`}
          >
            <div className="cc-card__label">Precisa de ação · pago + aguardando</div>
            <div className={`cc-card__value${fulfillmentPendente > 0 ? ' painel-alert' : ''}`}>
              {fulfillmentPendente}
            </div>
            <div className="cc-note">
              {fulfillmentPendente === 0
                ? 'Nenhum pedido aguardando confirmação'
                : 'pedido(s) pago(s) aguardando confirmação do fornecedor'}
            </div>
          </Link>
        </div>
      </div>

      {/* Marketplace */}
      <div className="painel-section">
        <div className="painel-section__title">Marketplace — cadeiras</div>
        <div className="cc-cards">
          {polos.length === 0 ? (
            <div className="cc-card">
              <div className="cc-card__label">Nenhuma cadeira cadastrada</div>
              <div className="cc-card__value">0</div>
              <div className="cc-note">Execute db:seed para carregar o mapa inicial</div>
            </div>
          ) : (
            polos.map(({ polo, ocupadas, prospeccao, abertas }) => (
              <Link key={polo} href="/admin/cadeiras" className="cc-card painel-card-link">
                <div className="cc-card__label">Ocupação · {polo}</div>
                <div className="cc-card__value">
                  <span style={{ color: '#166534' }}>{ocupadas}</span> ocupadas{' '}
                  · <span className="painel-estudo">{prospeccao}</span> em prospecção{' '}
                  · <span className="painel-abertas">{abertas}</span> abertas
                </div>
                <div className="cc-note">{ocupadas + prospeccao + abertas} cadeiras no total</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
