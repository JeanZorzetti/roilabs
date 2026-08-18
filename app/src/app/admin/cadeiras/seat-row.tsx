'use client';
import { useState } from 'react';
import { ESTADO_COLOR, rotuloEstado } from '@/lib/ocupacao';

type Seat = { id: string; niche: string; status: string; open: boolean; estado: string };

export function SeatRow({ seat }: { seat: Seat }) {
  const [niche, setNiche] = useState(seat.niche);
  const [status, setStatus] = useState(seat.status);
  const [open, setOpen] = useState(seat.open);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(override: Partial<Seat> = {}) {
    setBusy(true);
    setSaved(false);
    await fetch(`/api/cadeiras/${seat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, status, open, ...override }),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className={`seat-row ${open ? 'is-open' : ''}`}>
      <div style={{ display: 'grid', gap: '0.4rem' }}>
        <input type="text" className="niche" value={niche} onChange={(e) => setNiche(e.target.value)} />
        <input type="text" value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status (ex: Curadoria aberta)" />
        <span style={{ color: ESTADO_COLOR[seat.estado] ?? '#6b7280', fontWeight: 700, fontSize: 12 }}>
          {rotuloEstado(seat.estado)}
        </span>
      </div>
      <div style={{ display: 'grid', gap: '0.2rem' }}>
        <label className="toggle">
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => {
              const v = e.target.checked;
              setOpen(v);
              save({ open: v });
            }}
          />
          Aceita candidaturas
        </label>
        {/* Regra de negócio não óbvia: a API só oferece a cadeira se `estado === 'vaga' && open`
            (api/cadeiras/route.ts). Marcar aqui numa cadeira ocupada não faz nada — dizer isso
            evita a mesma leitura errada que o rótulo antigo causava. */}
        {open && seat.estado !== 'vaga' && (
          <span style={{ fontSize: 11, color: '#92400e' }}>Sem efeito enquanto a cadeira não está vaga.</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn btn--sm" disabled={busy} onClick={() => save()}>Salvar</button>
        {saved && <span className="saved">✓ salvo</span>}
      </div>
    </div>
  );
}
