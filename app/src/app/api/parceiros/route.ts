import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET — lista parceiros (tela /admin/parceiros). Só admin.
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const rows = await prisma.parceiro.findMany({
    include: { cadeira: { select: { niche: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      whatsapp: r.whatsapp,
      email: r.email,
      cpfCnpj: r.cpfCnpj,
      cidade: r.cidade,
      nicho: r.nicho,
      polo: r.polo,
      cadeiraId: r.cadeiraId,
      cadeiraNiche: r.cadeira?.niche ?? null,
      candidaturaId: r.candidaturaId,
      estagio: r.estagio,
      comissaoPct: r.comissaoPct !== null ? Number(r.comissaoPct) : null,
      contratoEm: r.contratoEm,
      ocupaCadeira: r.contratoEm !== null,
      createdAt: r.createdAt,
    })),
  );
}

// POST — cria um parceiro em estágio 'sondagem'. nicho deriva da cadeira escolhida (D5).
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const cadeiraId = typeof body.cadeiraId === 'string' ? body.cadeiraId : '';
  if (!nome) return NextResponse.json({ ok: false, motivo: 'nome obrigatório' }, { status: 400 });
  if (!cadeiraId) return NextResponse.json({ ok: false, motivo: 'cadeira obrigatória' }, { status: 400 });

  const cadeira = await prisma.cadeira.findUnique({ where: { id: cadeiraId } });
  if (!cadeira) return NextResponse.json({ ok: false, motivo: 'cadeira inexistente' }, { status: 400 });

  let comissaoPct: number | null = null;
  if (body.comissaoPct !== undefined && body.comissaoPct !== null && body.comissaoPct !== '') {
    comissaoPct = Number(body.comissaoPct);
    if (!Number.isFinite(comissaoPct) || comissaoPct < 0 || comissaoPct > 1) {
      return NextResponse.json({ ok: false, motivo: 'comissaoPct fora de [0,1]' }, { status: 400 });
    }
  }

  const created = await prisma.parceiro.create({
    data: {
      nome,
      whatsapp: typeof body.whatsapp === 'string' ? body.whatsapp : null,
      email: typeof body.email === 'string' ? body.email : null,
      cpfCnpj: typeof body.cpfCnpj === 'string' && body.cpfCnpj ? body.cpfCnpj : null,
      cidade: typeof body.cidade === 'string' ? body.cidade : null,
      nicho: cadeira.niche,
      polo: cadeira.polo,
      cadeiraId,
      candidaturaId: typeof body.candidaturaId === 'string' && body.candidaturaId ? body.candidaturaId : null,
      comissaoPct,
      estagio: 'sondagem',
    },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
