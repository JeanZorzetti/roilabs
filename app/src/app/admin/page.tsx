import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { derivarOcupacao } from '@/lib/ocupacao';
import { decidirCheckout } from '@/lib/carteira/produto';
import { breakdownOrigem, bucketOrigem } from '@/lib/origem';

export const dynamic = 'force-dynamic';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (n: number, d: number) =>
  d === 0 ? '— (0 leads)' : `${((n / d) * 100).toFixed(1)}%`;

export default async function PainelPage() {
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
    leads30d,
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
    prisma.cadeira.findMany({
      select: {
        polo: true,
        estado: true,
        produto: true,
        parceiros: { select: { estagio: true, contratoEm: true, nome: true, _count: { select: { credenciais: true } } } },
      },
    }),
    prisma.pedido.count({ where: { statusPagamento: 'pago', createdAt: { gte: d7 } } }),
    prisma.leadConsumidor.count({ where: { createdAt: { gte: d7 } } }),
    prisma.leadConsumidor.findMany({
      where: { createdAt: { gte: d30 } },
      select: { mensagem: true, createdAt: true },
    }),
  ]);

  // First-touch: qual página/canal de entrada gera lead (parse do sufixo [origem]).
  const origem30 = breakdownOrigem(leads30d).slice(0, 10);
  const origem7Counts = new Map<string, number>();
  for (const l of leads30d.filter((l) => l.createdAt >= d7)) {
    const k = bucketOrigem(l.mensagem);
    origem7Counts.set(k, (origem7Counts.get(k) ?? 0) + 1);
  }

  const gmvPagoMes = Number(gmvMes._sum.total ?? 0);
  const pedidosPagosMes = gmvMes._count.id;

  // ⚠️ TRÊS RÉGUAS, e o card mostrava só a primeira sem dizer que era uma escolha:
  //   `Parceiro.contratoEm` → quantas têm CONTRATO assinado (é o que `derivarOcupacao` lê,
  //   e é a régua do success fee — não trocar por `estado`);
  //   `estado === 'ocupada-vendavel'` → quantas a curadoria MARCOU como vendáveis;
  //   `decidirCheckout` → quantas conseguem RECEBER dinheiro hoje. Esta é a que decide o mês,
  //   e em 07/08 dava 0 em 16 (ProdutoCadeira vazia). É a mesma função que /api/cadeiras
  //   chama, com as mesmas entradas — import, não regra nova.
  type Contagem = { ocupadas: number; prospeccao: number; abertas: number; vendaveis: number; recebem: number };
  const polosMap = new Map<string, Contagem>();
  for (const cadeira of cadeiraGroups) {
    if (!polosMap.has(cadeira.polo))
      polosMap.set(cadeira.polo, { ocupadas: 0, prospeccao: 0, abertas: 0, vendaveis: 0, recebem: 0 });
    const entry = polosMap.get(cadeira.polo)!;
    const estado = derivarOcupacao(cadeira.parceiros);
    if (estado === 'ocupada') entry.ocupadas += 1;
    else if (estado === 'prospeccao') entry.prospeccao += 1;
    else entry.abertas += 1;

    if (cadeira.estado === 'ocupada-vendavel') entry.vendaveis += 1;
    const ativo = cadeira.parceiros.find((p) => p.estagio === 'ativa') ?? null;
    const checkout = decidirCheckout({
      estado: cadeira.estado,
      produto: cadeira.produto ? { ...cadeira.produto, preco: Number(cadeira.produto.preco) } : null,
      parceiroNome: ativo?.nome ?? null,
      gatewayLigado: (ativo?._count.credenciais ?? 0) > 0,
    });
    if (checkout.tipo !== 'indisponivel') entry.recebem += 1;
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

        {origem30.length > 0 && (
          <div className="cc-card" style={{ marginTop: '0.8rem' }}>
            <div className="cc-card__label">Origem dos leads · first-touch (top 10, 30d)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--l-line)', color: 'var(--l-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '0.35rem 0.5rem' }}>Página de entrada / canal</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.5rem' }}>7d</th>
                  <th style={{ textAlign: 'right', padding: '0.35rem 0.5rem' }}>30d</th>
                </tr>
              </thead>
              <tbody>
                {origem30.map(([bucket, total]) => (
                  <tr key={bucket} style={{ borderBottom: '1px solid var(--l-line)' }}>
                    <td style={{ padding: '0.35rem 0.5rem', fontFamily: 'monospace' }}>{bucket}</td>
                    <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>{origem7Counts.get(bucket) ?? 0}</td>
                    <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            polos.map(({ polo, ocupadas, prospeccao, abertas, vendaveis, recebem }) => (
              <Link key={polo} href="/admin/cadeiras" className="cc-card painel-card-link">
                <div className="cc-card__label">Ocupação · {polo}</div>
                <div className="cc-card__value">
                  <span style={{ color: '#166534' }}>{ocupadas}</span> com contrato{' '}
                  · <span className="painel-estudo">{prospeccao}</span> em prospecção{' '}
                  · <span className="painel-abertas">{abertas}</span> sem parceiro
                </div>
                <div className="cc-card__value" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {vendaveis} marcadas vendáveis ·{' '}
                  <span className={recebem === 0 ? 'painel-alert' : undefined}>{recebem}</span> conseguem
                  receber pagamento
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
