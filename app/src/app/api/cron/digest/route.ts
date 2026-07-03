import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlert, escapeHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Weekly ops digest — the rank-tracking GitHub Action calls this every Monday after
// committing the snapshot, passing rank-tracking.md as the plain-text body (optional).
// Auth: X-Cron-Secret header must match CRON_SECRET (same pattern as the MP webhook
// secret: env var on EasyPanel + GitHub secret). E-mail goes out via sendAlert, which
// is a no-op until RESEND_API_KEY/ALERT_EMAIL exist — the route still returns the stats.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'CRON_SECRET não configurado' }, { status: 503 });
  if (req.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [candidaturas, leads, pedidos, pagos] = await Promise.all([
    prisma.candidatura.count({ where: { createdAt: { gte: desde } } }),
    prisma.leadConsumidor.count({ where: { createdAt: { gte: desde } } }),
    prisma.pedido.count({ where: { createdAt: { gte: desde } } }),
    prisma.pedido.findMany({
      where: { createdAt: { gte: desde }, statusPagamento: 'pago' },
      select: { total: true },
    }),
  ]);
  const gmv = pagos.reduce((s, p) => s + Number(p.total), 0);
  const rank = (await req.text()).trim().slice(0, 20000);

  sendAlert(
    `📊 Semana ROI Labs — ${leads + candidaturas} leads · ${pagos.length} pedidos pagos · ${brl(gmv)}`,
    `<h2>Últimos 7 dias</h2>
     <ul>
       <li><strong>${leads}</strong> leads consumidor (goiânia) · <strong>${candidaturas}</strong> candidaturas (institucional)</li>
       <li><strong>${pedidos}</strong> pedidos criados · <strong>${pagos.length}</strong> pagos · GMV <strong>${brl(gmv)}</strong></li>
     </ul>
     <p><a href="https://app.roilabs.com.br/admin">Abrir o admin</a></p>
     ${rank ? `<h2>Rank tracking (segunda)</h2><pre style="font-size:12px">${escapeHtml(rank)}</pre>` : ''}`
  );

  return NextResponse.json({ ok: true, candidaturas, leads, pedidos, pagos: pagos.length, gmv });
}
