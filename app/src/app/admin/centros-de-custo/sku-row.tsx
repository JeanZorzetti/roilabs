'use client';
import { useState } from 'react';

export interface SkuRowData {
  slug: string;
  varejo: number;
  piso: number;
  real: boolean;
  prejuizo: boolean;
  modalidade: 'intermediacao' | 'wl';
  linhaAtual: string | null;
  interLiquido: number;
  wlLiquido: number;
  linhasDisponiveis: string[];
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function SkuRow({ data }: { data: SkuRowData }) {
  const [piso, setPiso] = useState(data.piso);
  const [real, setReal] = useState(data.real);
  const [prejuizo, setPrejuizo] = useState(data.prejuizo);
  const [modalidade, setModalidade] = useState(data.modalidade);
  const [linha, setLinha] = useState(data.linhaAtual ?? '');
  const [pisoInput, setPisoInput] = useState(data.real ? String(data.piso) : '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/centros-custo/sku/${encodeURIComponent(data.slug)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) {
      setMsg('✓');
      if (json.prejuizo !== undefined) setPrejuizo(json.prejuizo);
    } else {
      setMsg(`✗ ${json.motivo}`);
    }
    setTimeout(() => setMsg(null), 2500);
  }

  function savePiso() {
    const raw = pisoInput.replace(',', '.').trim();
    if (raw === '') {
      // clear piso → back to estimado
      setPiso(data.piso);
      setReal(false);
      patch({ piso: null });
    } else {
      const v = parseFloat(raw);
      if (isNaN(v) || v < 0) { setMsg('✗ valor inválido'); return; }
      setPiso(v);
      setReal(true);
      patch({ piso: v });
    }
  }

  const td: React.CSSProperties = { padding: '0.5rem 0.8rem', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' };
  const inp: React.CSSProperties = { background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '0.2rem 0.4rem', width: 72, fontFamily: 'monospace', fontSize: '0.8rem' };

  return (
    <tr style={{ borderBottom: '1px solid #222' }}>
      <td style={{ ...td, color: '#ccc' }}>{data.slug.replace('porcelanato-', '')}</td>
      <td style={{ ...td, textAlign: 'right' }}>{brl(data.varejo)}</td>

      {/* Piso */}
      <td style={{ ...td, textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'flex-end' }}>
          <input
            style={inp}
            value={pisoInput}
            placeholder="(markup)"
            onChange={(e) => setPisoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && savePiso()}
          />
          <button onClick={savePiso} disabled={saving} style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', background: '#333', color: '#eee', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
            {saving ? '…' : '✓'}
          </button>
        </div>
        {msg && <div style={{ fontSize: '0.7rem', color: msg.startsWith('✓') ? '#86efac' : '#f87171', marginTop: 2 }}>{msg}</div>}
      </td>

      {/* Real/estimado + prejuízo */}
      <td style={{ ...td, color: real ? '#86efac' : '#888' }}>
        {real ? 'real' : 'estimado'}
        {prejuizo && <span style={{ color: '#f87171', marginLeft: 4 }}>⚠ prejuízo</span>}
      </td>

      {/* Linha */}
      <td style={{ ...td }}>
        <select
          value={linha}
          onChange={(e) => {
            const v = e.target.value;
            setLinha(v);
            patch({ linha: v === '' ? null : v });
          }}
          style={{ background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '0.2rem 0.3rem', fontSize: '0.8rem' }}
        >
          <option value="">(global)</option>
          {data.linhasDisponiveis.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </td>

      {/* Modalidade-alvo */}
      <td style={{ ...td }}>
        <select
          value={modalidade}
          onChange={(e) => {
            const v = e.target.value as 'intermediacao' | 'wl';
            setModalidade(v);
            patch({ modalidadeAlvo: v });
          }}
          style={{ background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 3, padding: '0.2rem 0.3rem', fontSize: '0.8rem' }}
        >
          <option value="intermediacao">Intermediação</option>
          <option value="wl">White Label</option>
        </select>
      </td>

      <td style={{ ...td, textAlign: 'right', color: data.interLiquido >= data.wlLiquido ? '#86efac' : '#ccc' }}>{brl(data.interLiquido)}</td>
      <td style={{ ...td, textAlign: 'right', color: data.wlLiquido > data.interLiquido ? '#93c5fd' : '#ccc' }}>{brl(data.wlLiquido)}</td>
      <td style={{ ...td, color: data.interLiquido >= data.wlLiquido ? '#86efac' : '#93c5fd' }}>
        {data.interLiquido >= data.wlLiquido ? 'Interm.' : 'WL'}
      </td>
    </tr>
  );
}
