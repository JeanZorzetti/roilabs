import { prisma } from '@/lib/prisma';
import { SeatRow } from './seat-row';

export const dynamic = 'force-dynamic';

export default async function CadeirasPage() {
  const seats = await prisma.cadeira.findMany({ orderBy: { ordem: 'asc' } });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Mapa de cadeiras — Goiânia</h1>
        <p>Abra/feche cadeiras e edite o status. O site estático só reflete após rebuild (ver handoff.md).</p>
      </div>

      {seats.length === 0 && (
        <p className="muted">Nenhuma cadeira. Rode <span className="mono">npm run db:seed</span> para carregar o mapa inicial.</p>
      )}

      <div className="seats">
        {seats.map((s) => (
          <SeatRow key={s.id} seat={{ id: s.id, niche: s.niche, status: s.status, open: s.open }} />
        ))}
      </div>
    </div>
  );
}
