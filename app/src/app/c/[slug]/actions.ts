'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cpfValido, hashDoc, type ContratoCadeiraDoc } from '@/lib/contrato-cadeira';
import { prisma } from '@/lib/prisma';

// 020 — aceite público do contrato de cadeira. Sem login: quem tem o link aceita, como na /c/ da
// Vértice. Todo caminho termina em redirect para a própria página, que mostra o estado atual —
// inclusive quando outro aceite ou uma edição venceu a corrida (research D5).

export async function aceitarContratoCadeira(formData: FormData): Promise<void> {
  const slug = String(formData.get('slug') ?? '');
  // Declaração (não arrow): assim o TS entende que volta() não retorna e estreita os tipos abaixo.
  function volta(erro?: string): never {
    redirect(`/c/${encodeURIComponent(slug)}${erro ? `?erro=${erro}#aceite` : ''}`);
  }

  const nome = String(formData.get('nome') ?? '').trim().replace(/\s+/g, ' ');
  const cpf = String(formData.get('cpf') ?? '').replace(/\D/g, '');
  if (nome.length < 5 || nome.length > 120 || nome.split(' ').length < 2) volta('nome');
  if (!cpfValido(cpf)) volta('cpf');
  if (formData.get('concordo') !== 'sim') volta('caixa');

  const contrato = await prisma.contratoCadeira.findUnique({
    where: { slug },
    select: { id: true, doc: true, editadoEm: true, aceitoEm: true },
  });
  if (!contrato || contrato.aceitoEm) volta();
  const doc = contrato.doc as ContratoCadeiraDoc;
  if (doc.pendencias.length > 0) volta();

  // O formulário leva o hash do texto que a página mostrou: se o contrato mudou, o aceite não vale.
  const hash = hashDoc(doc);
  if (formData.get('hash') !== hash) volta('mudou');

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim().slice(0, 64);

  // editadoEm: uma edição entre a leitura e aqui derruba este aceite (count 0) em vez de gravar
  // o hash de um texto que já não é o do banco.
  await prisma.contratoCadeira.updateMany({
    where: { id: contrato.id, aceitoEm: null, editadoEm: contrato.editadoEm },
    data: {
      aceitoEm: new Date(),
      aceitoPor: nome,
      aceitoCpf: cpf,
      aceitoIp: ip || null,
      aceitoUa: (h.get('user-agent') ?? '').slice(0, 500) || null,
      aceitoHash: hash,
    },
  });

  revalidatePath('/admin/contratos');
  revalidatePath('/admin/propostas');
  volta();
}
