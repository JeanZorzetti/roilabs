'use client';
import { useState } from 'react';

type Seat = { id: string; niche: string; status: string; open: boolean };

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
      </div>
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
        Aberta
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn btn--sm" disabled={busy} onClick={() => save()}>Salvar</button>
        {saved && <span className="saved">✓ salvo</span>}
      </div>
    </div>
  );
}
