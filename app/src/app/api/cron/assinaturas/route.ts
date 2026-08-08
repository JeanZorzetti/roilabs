import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelarAssinatura, janelaEsgotada } from '@/lib/assinaturas';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// FR-009: quantos dias de tentativas até cancelar automaticamente quem ficou inadimplente.
const JANELA_DIAS = 7;

// Sweep diário — a AUTORIDADE de quando uma assinatura vira 'cancelada' é este cron, nunca
// o webhook (research.md D2). Mesmo padrão de auth de api/cron/digest.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: 'CRON_SECRET não configurado' }, { status: 503 });
  if (req.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const candidatas = await prisma.assinatura.findMany({
    where: { estado: 'inadimplente', janelaFalhaDesde: { not: null } },
    select: { id: true, itemPedidoId: true, mpPreapprovalId: true, janelaFalhaDesde: true },
  });

  const agora = new Date();
  let canceladas = 0;
  const falhas: string[] = [];

  for (const a of candidatas) {
    if (!janelaEsgotada(a.janelaFalhaDesde!, JANELA_DIAS, agora)) continue;
    try {
      // cancelPreapproval no MP primeiro, só então o banco (ordem importa — data-model.md).
      // Se falhar, esta assinatura fica como está e o cron tenta de novo amanhã.
      await cancelarAssinatura(a);
      canceladas++;
    } catch (err) {
      falhas.push(a.id);
      log.error({ err, assinaturaId: a.id }, 'cron/assinaturas: cancelPreapproval falhou, tenta de novo amanhã');
    }
  }

  log.info({ candidatas: candidatas.length, canceladas, falhas: falhas.length }, 'cron/assinaturas: sweep concluído');
  return NextResponse.json({ ok: true, candidatas: candidatas.length, canceladas, falhas: falhas.length });
}
