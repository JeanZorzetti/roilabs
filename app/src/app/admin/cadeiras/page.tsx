import { prisma } from '@/lib/prisma';
import { SeatRow } from './seat-row';

export const dynamic = 'force-dynamic';

export default async function CadeirasPage() {
  // Sem `include: { parceiros }`: esta tela exibe `estado` (012), não a régua de success fee.
  // Ver o bloco 012 em lib/ocupacao.ts para por que `derivarOcupacao` não serve aqui.
  const seats = await prisma.cadeira.findMany({ orderBy: { ordem: 'asc' } });

  return (
    <div className="page">
      <div className="page__head">
        <h1>Mapa de cadeiras — Goiânia</h1>
        <p>Edite o nicho, o texto de status e quem aceita candidaturas. O estado da cadeira é só leitura aqui — ele vem do seed (<span className="mono">npm run db:seed</span>).</p>
      </div>

      {seats.length === 0 && (
        <p className="muted">Nenhuma cadeira. Rode <span className="mono">npm run db:seed</span> para carregar o mapa inicial.</p>
      )}

      <div className="seats">
        {seats.map((s) => (
          <SeatRow
            key={s.id}
            seat={{ id: s.id, niche: s.niche, status: s.status, open: s.open, estado: s.estado }}
          />
        ))}
      </div>
    </div>
  );
}
