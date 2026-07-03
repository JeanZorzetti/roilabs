import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthed } from '@/lib/auth';
import { sendAlert, escapeHtml } from '@/lib/email';

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

  // First-touch (landing page + referrer, capturado no browser) vive como sufixo
  // `[origem] ...` da mensagem — coluna própria só no próximo db push manual no host real.
  const origem = cap(form.get('origem'), 300);
  const mensagem =
    [cap(form.get('mensagem'), 4000) || null, origem ? `[origem] ${origem}` : null]
      .filter(Boolean)
      .join('\n') || null;

  await prisma.leadConsumidor.create({
    data: {
      nome,
      whatsapp,
      produto: cap(form.get('produto'), 200) || null,
      pagina: cap(form.get('pagina'), 300) || null,
      mensagem,
      consentLGPD: true,
    },
  });

  // Alerta interno fire-and-forget — lead B2C quente, responder rápido converte.
  sendAlert(
    `🛒 Lead novo — ${nome}`,
    `<p><strong>${escapeHtml(nome)}</strong> · ${escapeHtml(whatsapp)}</p>
     <p>${escapeHtml(cap(form.get('produto'), 200) || 'sem produto')} · ${escapeHtml(cap(form.get('pagina'), 300) || '')}</p>
     <p><a href="https://app.roilabs.com.br/admin/leads">Abrir no admin</a></p>`
  );

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
