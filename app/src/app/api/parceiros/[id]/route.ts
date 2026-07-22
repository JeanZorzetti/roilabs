import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { parseTaxa, ERR } from '@/lib/taxa';

export const dynamic = 'force-dynamic';

const ESTAGIOS = ['sondagem', 'ativa', 'riscada', 'pausada'];

// PATCH — edita dados/estágio/taxas de um parceiro. `ativa` exige as duas taxas + cpfCnpj (010).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.parceiro.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, motivo: 'parceiro não encontrado' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (body.estagio !== undefined) {
    if (typeof body.estagio !== 'string' || !ESTAGIOS.includes(body.estagio)) {
      return NextResponse.json({ ok: false, motivo: 'estágio inválido' }, { status: 400 });
    }
    data.estagio = body.estagio;
  }

  // comissaoPct do body é ignorado (deprecado — 010). As duas taxas substituem.
  if (body.comissaoAquisicao !== undefined) {
    const t = parseTaxa(body.comissaoAquisicao);
    if (t === ERR) return NextResponse.json({ ok: false, motivo: 'comissaoAquisicao fora de [0,1]' }, { status: 400 });
    data.comissaoAquisicao = t;
  }
  if (body.comissaoRecorrencia !== undefined) {
    const t = parseTaxa(body.comissaoRecorrencia);
    if (t === ERR) return NextResponse.json({ ok: false, motivo: 'comissaoRecorrencia fora de [0,1]' }, { status: 400 });
    data.comissaoRecorrencia = t;
  }

  const proximoEstagio = (data.estagio as string | undefined) ?? existing.estagio;
  const proximaAquisicao = data.comissaoAquisicao !== undefined ? data.comissaoAquisicao : existing.comissaoAquisicao;
  const proximaRecorrencia = data.comissaoRecorrencia !== undefined ? data.comissaoRecorrencia : existing.comissaoRecorrencia;
  const proximoCpfCnpj = body.cpfCnpj !== undefined ? body.cpfCnpj || null : existing.cpfCnpj;
  if (proximoEstagio === 'ativa' && (proximaAquisicao === null || proximaRecorrencia === null || !proximoCpfCnpj)) {
    return NextResponse.json(
      { ok: false, motivo: 'estágio ativa exige comissaoAquisicao, comissaoRecorrencia e cpfCnpj' },
      { status: 400 },
    );
  }

  if (body.contratoEm !== undefined) {
    data.contratoEm = body.contratoEm ? new Date(body.contratoEm as string) : null;
  }
  if (body.nome !== undefined && typeof body.nome === 'string') data.nome = body.nome.trim();
  if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.cpfCnpj !== undefined) data.cpfCnpj = body.cpfCnpj || null;
  if (body.cidade !== undefined) data.cidade = body.cidade || null;
  if (body.cadeiraId !== undefined && typeof body.cadeiraId === 'string' && body.cadeiraId) {
    const cadeira = await prisma.cadeira.findUnique({ where: { id: body.cadeiraId } });
    if (!cadeira) return NextResponse.json({ ok: false, motivo: 'cadeira inexistente' }, { status: 400 });
    data.cadeiraId = body.cadeiraId;
    data.nicho = cadeira.niche;
  }

  await prisma.parceiro.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

// DELETE — só remove se não houver negócios/faturas vinculados (preserva histórico).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;

  const [negocios, faturas] = await Promise.all([
    prisma.negocioOriginado.count({ where: { parceiroId: id } }),
    prisma.faturaSuccessFee.count({ where: { parceiroId: id } }),
  ]);
  if (negocios > 0 || faturas > 0) {
    return NextResponse.json({ ok: false, motivo: 'parceiro tem negócios/faturas — use pausada/riscada' }, { status: 409 });
  }

  await prisma.parceiro.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
