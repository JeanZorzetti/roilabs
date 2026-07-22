'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SkuRowData {
  slug: string;
  /** Fita: faixa de volume que gerou o unitário simulado. null em porcelanato (preço/m²). */
  faixa: string | null;
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
  const router = useRouter();
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
      setMsg('✓ salvo');
      if (json.prejuizo !== undefined) setPrejuizo(json.prejuizo);
      router.refresh(); // recalcula líquidos/origem da tabela na hora
    } else {
      setMsg(`✗ ${json.motivo}`);
    }
    setTimeout(() => setMsg(null), 2500);
  }

  function savePiso() {
    const raw = pisoInput.replace(',', '.').trim();
    if (raw === '') {
      setReal(false);
      patch({ piso: null });
    } else {
      const v = parseFloat(raw);
      if (isNaN(v) || v < 0) { setMsg('✗ inválido'); return; }
      setReal(true);
      patch({ piso: v });
    }
  }

  const interWins = data.interLiquido >= data.wlLiquido;

  return (
    <tr>
      <td className="slug">{data.slug.replace('porcelanato-', '')}</td>
      <td className="num">
        {brl(data.varejo)}
        {/* Sem dizer a faixa, o operador não sabe sobre qual cenário a simulação foi feita. */}
        {data.faixa && <div className="cc-cell-msg">/rolo · faixa {data.faixa}</div>}
      </td>

      {/* Piso */}
      <td className="num">
        <span className="cc-piso">
          <input
            value={pisoInput}
            placeholder="markup"
            onChange={(e) => setPisoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && savePiso()}
          />
          <button className="btn btn--sm" onClick={savePiso} disabled={saving}>{saving ? '…' : '✓'}</button>
        </span>
        {msg && <div className={`cc-cell-msg ${msg.startsWith('✓') ? 'cc-msg--ok' : 'cc-msg--err'}`}>{msg}</div>}
      </td>

      {/* Origem (real/estimado + prejuízo) */}
      <td>
        <span className={real ? 'cc-tag cc-tag--real' : 'cc-tag cc-tag--est'}>{real ? 'real' : 'estimado'}</span>
        {prejuizo && <span className="cc-tag cc-tag--prejuizo">⚠ prejuízo</span>}
      </td>

      {/* Linha */}
      <td>
        <select
          className="cc-select"
          value={linha}
          onChange={(e) => { const v = e.target.value; setLinha(v); patch({ linha: v === '' ? null : v }); }}
        >
          <option value="">global</option>
          {data.linhasDisponiveis.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </td>

      {/* Modalidade-alvo */}
      <td>
        <select
          className="cc-select"
          value={modalidade}
          onChange={(e) => { const v = e.target.value as 'intermediacao' | 'wl'; setModalidade(v); patch({ modalidadeAlvo: v }); }}
        >
          <option value="intermediacao">Intermediação</option>
          <option value="wl">White Label</option>
        </select>
      </td>

      <td className={`num ${interWins ? 'cc-win-inter' : ''}`}>{brl(data.interLiquido)}</td>
      <td className={`num ${!interWins ? 'cc-win-wl' : ''}`}>{brl(data.wlLiquido)}</td>
      <td className={interWins ? 'cc-win-inter' : 'cc-win-wl'}>{interWins ? 'Interm.' : 'WL'}</td>
    </tr>
  );
}
