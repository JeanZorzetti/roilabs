import { prisma } from '@/lib/prisma';
import ParceirosForm from './parceiros-form';

export const dynamic = 'force-dynamic';

const toIso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export default async function ParceirosPage() {
  const [parceiros, cadeiras, candidaturas] = await Promise.all([
    prisma.parceiro.findMany({ include: { cadeira: { select: { niche: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.cadeira.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.candidatura.findMany({ where: { status: 'aprovado' }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <div className="page">
      <div className="page__head">
        <h1>Parceiros</h1>
        <p>Sondagem, ativação e acompanhamento de estágio por cadeira — camada de repasse (007).</p>
      </div>

      <ParceirosForm
        cadeiras={cadeiras.map((c) => ({ id: c.id, niche: c.niche }))}
        candidaturas={candidaturas.map((c) => ({
          id: c.id,
          nome: c.nome,
          empresa: c.empresa,
          whatsapp: c.whatsapp,
          cidade: c.cidade,
          categoria: c.categoria,
        }))}
        parceiros={parceiros.map((p) => ({
          id: p.id,
          nome: p.nome,
          whatsapp: p.whatsapp,
          email: p.email,
          cpfCnpj: p.cpfCnpj,
          cidade: p.cidade,
          nicho: p.nicho,
          cadeiraId: p.cadeiraId,
          cadeiraNiche: p.cadeira?.niche ?? null,
          estagio: p.estagio,
          comissaoPct: p.comissaoPct !== null ? Number(p.comissaoPct) : null,
          contratoEm: toIso(p.contratoEm),
        }))}
      />
    </div>
  );
}
