'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MarkContacted({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function mark() {
    setBusy(true);
    await fetch(`/api/leads-consumidor/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contatado' }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" className="card__del" disabled={busy} onClick={mark}>
      {busy ? '…' : 'Contatado ✓'}
    </button>
  );
}
