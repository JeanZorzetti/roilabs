'use client';
// Veio da tela /admin/parceiros/[id], removida em 28/09 (3bedb21), sem o link do demonstrativo.
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Fatura {
  id: string;
  competencia: string;
  base: number;
  valor: number;
  status: string;
  asaasPaymentId: string | null;
}

const STATUS: Record<string, { rotulo: string; cor: string }> = {
  emitida: { rotulo: 'Emitida', cor: '#1d4ed8' },
  paga: { rotulo: 'Paga', cor: '#166534' },
  erro: { rotulo: 'Erro na cobrança', cor: '#7f1d1d' },
};
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FaturasSection({
  parceiroId,
  nome,
  aFaturar,
  competenciaSugerida,
  bloqueio,
  faturas,
}: {
  parceiroId: string;
  nome: string;
  aFaturar: number;
  competenciaSugerida: string; // YYYY-MM da venda mais recente a faturar (vem do servidor)
  bloqueio: string | null; // por que a fatura não pode sair; null = pode
  faturas: Fatura[];
}) {
  const router = useRouter();
  const [competencia, setCompetencia] = useState(competenciaSugerida);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function gerar() {
    if (!window.confirm(`Gerar a fatura de ${brl(aFaturar)} e enviar a cobrança para ${nome} pelo Asaas?`)) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/faturas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parceiroId, competencia }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (json?.ok) {
      setMsg({ ok: true, texto: `Fatura gerada: ${brl(json.valor)}. A cobrança foi enviada pelo Asaas.` });
      router.refresh();
    } else {
      setMsg({ ok: false, texto: json?.motivo ?? 'Não deu para gerar agora. Confira a conexão e tente de novo.' });
    }
  }

  const titulo = `faturas-${parceiroId}`;
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <h3 id={titulo} className="cc-section__title" style={{ fontSize: 13 }}>Faturas de comissão</h3>

      {bloqueio ? (
        <p className="cc-note">{bloqueio}</p>
      ) : (
        <div className="cc-row-actions cc-fields" style={{ marginBottom: '0.75rem' }}>
          <div className="cc-field">
            <label htmlFor={`comp-${parceiroId}`}>Competência</label>
            <input id={`comp-${parceiroId}`} type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} style={{ width: 190 }} />
          </div>
          <button className="btn btn--sm" type="button" disabled={busy} onClick={gerar}>
            {busy ? 'Gerando…' : `Gerar fatura de ${brl(aFaturar)}`}
          </button>
        </div>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>
          {msg.texto}
        </p>
      )}

      {faturas.length > 0 && (
        <table className="cc-table" aria-labelledby={titulo}>
          <thead>
            <tr>
              <th scope="col">Competência</th>
              <th scope="col">Base</th>
              <th scope="col">Comissão</th>
              <th scope="col">Status</th>
              <th scope="col">Cobrança Asaas</th>
            </tr>
          </thead>
          <tbody>
            {faturas.map((f) => (
              <tr key={f.id}>
                <td>{f.competencia}</td>
                <td className="num">{brl(f.base)}</td>
                <td className="num">{brl(f.valor)}</td>
                <td style={{ color: STATUS[f.status]?.cor, fontWeight: 700 }}>{STATUS[f.status]?.rotulo ?? f.status}</td>
                <td className="mono" style={{ fontSize: 12 }}>{f.asaasPaymentId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
