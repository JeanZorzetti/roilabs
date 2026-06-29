import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const cap = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === 'string' ? v.trim() : '').slice(0, max);

// Public: form das páginas pSEO de porcelanato POSTa aqui (urlencoded, sem preflight CORS).
export async function POST(req: NextRequest) {
  const form = await req.formData();

  // Honeypot — bots preenchem, humanos não veem.
  if (cap(form.get('botcheck'), 100)) return NextResponse.json({ ok: true });

  const nome = cap(form.get('nome'), 200);
  const whatsapp = cap(form.get('whatsapp'), 40);
  const consent = form.get('consent');

  if (!nome || !whatsapp) {
    return NextResponse.json({ ok: false, error: 'nome e whatsapp são obrigatórios' }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: 'consentimento LGPD obrigatório' }, { status: 400 });
  }

  await prisma.leadConsumidor.create({
    data: {
      nome,
      whatsapp,
      produto: cap(form.get('produto'), 200) || null,
      pagina: cap(form.get('pagina'), 300) || null,
      mensagem: cap(form.get('mensagem'), 4000) || null,
      consentLGPD: true,
    },
  });

  const redirectTo = cap(form.get('redirect'), 300);
  if (redirectTo.startsWith('http')) return NextResponse.redirect(redirectTo, 303);
  return NextResponse.json({ ok: true }, { status: 201 });
}

// Protected: lista para o admin.
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const leads = await prisma.leadConsumidor.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(leads);
}
