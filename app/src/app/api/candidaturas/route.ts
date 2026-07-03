import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { sendAlert, escapeHtml } from '@/lib/email';

export const dynamic = 'force-dynamic';

const cap = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === 'string' ? v.trim() : '').slice(0, max);

// Public: the static site form POSTs here (urlencoded, simple request — no CORS preflight).
export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Honeypot — bots fill it, humans can't see it.
  if (cap(form.get('botcheck'), 100)) return NextResponse.json({ ok: true });

  const nome = cap(form.get('nome'), 200);
  const empresa = cap(form.get('empresa'), 200);
  const whatsapp = cap(form.get('whatsapp'), 40);
  if (!nome || !empresa || !whatsapp) {
    return NextResponse.json({ ok: false, error: 'nome, empresa e whatsapp são obrigatórios' }, { status: 400 });
  }

  await prisma.candidatura.create({
    data: {
      nome,
      empresa,
      whatsapp,
      cidade: cap(form.get('cidade'), 120) || null,
      categoria: cap(form.get('categoria'), 120) || null,
      site: cap(form.get('site'), 300) || null,
      mensagem: cap(form.get('mensagem'), 4000) || null,
    },
  });

  // Alerta interno fire-and-forget — velocidade de resposta é conversão (Gate 3).
  sendAlert(
    `🏭 Candidatura nova — ${nome} (${empresa})`,
    `<p><strong>${escapeHtml(nome)}</strong> · ${escapeHtml(empresa)} · ${escapeHtml(whatsapp)}</p>
     <p>${escapeHtml(cap(form.get('categoria'), 120) || 'sem categoria')}</p>
     <p><a href="https://app.roilabs.com.br/admin/candidaturas">Abrir no admin</a></p>`
  );

  const redirectTo = cap(form.get('redirect'), 300);
  if (redirectTo.startsWith('http')) return NextResponse.redirect(redirectTo, 303);
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Protected: list for the admin.
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const leads = await prisma.candidatura.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(leads);
}
