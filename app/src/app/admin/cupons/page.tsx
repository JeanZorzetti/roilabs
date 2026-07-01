import { prisma } from '@/lib/prisma';
import CuponsForm from './cupons-form';

export const dynamic = 'force-dynamic';

const toIso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export default async function CuponsPage() {
  const rows = await prisma.cupom.findMany({ orderBy: { codigo: 'asc' } });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Cupons</h1>
        <p>Criar, editar, ativar/desativar e apagar cupons de desconto — sem deploy.</p>
      </div>

      <CuponsForm
        cupons={rows.map((r) => ({
          id: r.id,
          codigo: r.codigo,
          tipo: r.tipo,
          valor: Number(r.valor),
          validadeInicio: toIso(r.validadeInicio),
          validadeFim: toIso(r.validadeFim),
          minimo: r.minimo !== null ? Number(r.minimo) : null,
          ativo: r.ativo,
        }))}
      />
    </div>
  );
}
