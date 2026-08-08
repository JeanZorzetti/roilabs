import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cancelarAssinatura, decidirCancelamento } from '@/lib/assinaturas';
import { isAuthed } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// Self-service (FR-010/FR-011): { token } no body ou na query, sem auth — o token JÁ É a
// prova de propriedade (contracts/cancelamento.md). Admin: { id } atrás de isAuthed().
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  let token: string | null = url.searchParams.get('token');
  let id: string | null = url.searchParams.get('id');

  if (!token && !id) {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    token = (body as { token?: string }).token ?? null;
    id = (body as { id?: string }).id ?? null;
  }

  let assinatura;
  if (id) {
    // T024: cancelamento pelo time — mesma função, atrás do login que já protege /admin/*.
    if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    assinatura = await prisma.assinatura.findUnique({ where: { id } });
  } else if (token) {
    assinatura = await prisma.assinatura.findUnique({ where: { cancelToken: token } });
  } else {
    return NextResponse.json({ error: 'token ou id obrigatório' }, { status: 400 });
  }

  const decisao = decidirCancelamento(assinatura);
  if (decisao.httpStatus === 404) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (decisao.noop) return NextResponse.json({ ok: true, jaCancelada: true });

  try {
    await cancelarAssinatura(assinatura!);
  } catch (err) {
    log.error({ err, assinaturaId: assinatura!.id }, 'assinaturas/cancelar: cancelPreapproval falhou');
    return NextResponse.json({ error: 'falha ao cancelar no gateway, tente novamente' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
