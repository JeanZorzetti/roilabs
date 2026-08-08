import { prisma } from '@/lib/prisma';
import { CancelarButton } from './cancelar-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cancelar assinatura — ROI Labs' };

const brl = (v: unknown) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Pública, sem auth (FR-010/FR-011) — o token na URL É a autorização (contracts/cancelamento.md).
export default async function CancelarAssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const assinatura = token
    ? await prisma.assinatura.findUnique({
        where: { cancelToken: token },
        select: { slug: true, estado: true, proximaCobranca: true, itemPedidoId: true },
      })
    : null;

  if (!assinatura) {
    return (
      <main className="login">
        <div className="login__card">
          <span className="brand-mark">R</span>
          <h1>Link inválido</h1>
          <p className="muted">Este link de cancelamento não existe.</p>
        </div>
      </main>
    );
  }

  const item = await prisma.itemPedido.findUnique({
    where: { id: assinatura.itemPedidoId },
    select: { subtotal: true },
  });

  return (
    <main className="login">
      <div className="login__card">
        <span className="brand-mark">R</span>
        <h1>Cancelar assinatura</h1>
        <p className="muted">{assinatura.slug}{item ? ` · ${brl(item.subtotal)}/ciclo` : ''}</p>

        {assinatura.estado === 'cancelada' ? (
          <p>Esta assinatura já está cancelada.</p>
        ) : (
          <>
            <p>
              Próxima cobrança prevista:{' '}
              {assinatura.proximaCobranca
                ? new Date(assinatura.proximaCobranca).toLocaleDateString('pt-BR')
                : '—'}
            </p>
            <p className="muted">
              Cancelar interrompe só a próxima cobrança — não há reembolso, e o acesso ao ciclo
              já pago continua valendo até o fim do período.
            </p>
            <CancelarButton token={token!} />
          </>
        )}
      </div>
    </main>
  );
}
