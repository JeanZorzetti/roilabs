import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAlert, escapeHtml } from '@/lib/email';
import { filaFollowUp } from '@/lib/follow-up';
import { breakdownOrigem } from '@/lib/origem';

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
  const [candidaturas, leadsSemana, pedidos, pagos, fila] = await Promise.all([
    prisma.candidatura.count({ where: { createdAt: { gte: desde } } }),
    prisma.leadConsumidor.findMany({
      where: { createdAt: { gte: desde } },
      select: { mensagem: true },
    }),
    prisma.pedido.count({ where: { createdAt: { gte: desde } } }),
    prisma.pedido.findMany({
      where: { createdAt: { gte: desde }, statusPagamento: 'pago' },
      select: { total: true },
    }),
    filaFollowUp(),
  ]);
  const leads = leadsSemana.length;
  const gmv = pagos.reduce((s, p) => s + Number(p.total), 0);
  const rank = (await req.text()).trim().slice(0, 20000);

  // First-touch da semana: qual página/canal de entrada gerou os leads.
  const origens = breakdownOrigem(leadsSemana).slice(0, 5);
  const origemHtml = origens.length
    ? `<h2>Origem dos leads (first-touch)</h2>
     <ul>${origens.map(([b, n]) => `<li><strong>${n}</strong> × ${escapeHtml(b)}</li>`).join('')}</ul>`
    : '';

  // Ação pendente: same queue as /admin/follow-up — the digest nags until it's cleared.
  const pendentes = fila.carrinhos.length + fila.frios.length + fila.pendentes.length;
  const nomes = (ls: { nome: string }[]) =>
    ls.slice(0, 5).map((l) => escapeHtml(l.nome)).join(', ') + (ls.length > 5 ? ` +${ls.length - 5}` : '');
  const acaoPendente = pendentes
    ? `<h2>⚠️ Ação pendente — ${pendentes} contatos na fila</h2>
     <ul>
       ${fila.pendentes.length ? `<li><strong>${fila.pendentes.length}</strong> pedido(s) sem pagamento: ${nomes(fila.pendentes)}</li>` : ''}
       ${fila.carrinhos.length ? `<li><strong>${fila.carrinhos.length}</strong> carrinho(s) sem pedido pago: ${nomes(fila.carrinhos)}</li>` : ''}
       ${fila.frios.length ? `<li><strong>${fila.frios.length}</strong> lead(s) sem resposta há 48h+: ${nomes(fila.frios)}</li>` : ''}
     </ul>
     <p><a href="https://app.roilabs.com.br/admin/follow-up">Abrir a fila de follow-up</a></p>`
    : '';

  sendAlert(
    `📊 Semana ROI Labs — ${leads + candidaturas} leads · ${pagos.length} pedidos pagos · ${brl(gmv)}`,
    `<h2>Últimos 7 dias</h2>
     <ul>
       <li><strong>${leads}</strong> leads consumidor (goiânia) · <strong>${candidaturas}</strong> candidaturas (institucional)</li>
       <li><strong>${pedidos}</strong> pedidos criados · <strong>${pagos.length}</strong> pagos · GMV <strong>${brl(gmv)}</strong></li>
     </ul>
     ${origemHtml}
     ${acaoPendente}
     <p><a href="https://app.roilabs.com.br/admin">Abrir o admin</a></p>
     ${rank ? `<h2>Rank tracking (segunda)</h2><pre style="font-size:12px">${escapeHtml(rank)}</pre>` : ''}`
  );

  return NextResponse.json({ ok: true, candidaturas, leads, pedidos, pagos: pagos.length, gmv, followUp: pendentes });
}
