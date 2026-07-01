'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface Cadeira {
  id: string;
  niche: string;
}

export interface CandidaturaOption {
  id: string;
  nome: string;
  empresa: string;
  whatsapp: string;
  cidade: string | null;
  categoria: string | null;
}

export interface Parceiro {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  cpfCnpj: string | null;
  cidade: string | null;
  nicho: string;
  cadeiraId: string | null;
  cadeiraNiche: string | null;
  estagio: string;
  comissaoPct: number | null;
  contratoEm: string | null; // ISO date ou null
}

const ESTAGIOS = ['sondagem', 'ativa', 'riscada', 'pausada'] as const;
const ESTAGIO_LABEL: Record<string, string> = { sondagem: 'Sondagem', ativa: 'Ativa', riscada: 'Riscada', pausada: 'Pausada' };
const ESTAGIO_COLOR: Record<string, string> = { sondagem: '#1d4ed8', ativa: '#166534', riscada: '#7f1d1d', pausada: '#92400e' };

type Novo = {
  candidaturaId: string;
  nome: string;
  whatsapp: string;
  email: string;
  cidade: string;
  cpfCnpj: string;
  cadeiraId: string;
  comissaoPct: string;
};

const NOVO_VAZIO: Novo = { candidaturaId: '', nome: '', whatsapp: '', email: '', cidade: '', cpfCnpj: '', cadeiraId: '', comissaoPct: '' };

type Edit = { estagio: string; comissaoPct: string; contratoEm: string };

function toEdit(p: Parceiro): Edit {
  return { estagio: p.estagio, comissaoPct: p.comissaoPct !== null ? String(p.comissaoPct) : '', contratoEm: p.contratoEm ?? '' };
}

export default function ParceirosForm({
  cadeiras,
  candidaturas,
  parceiros: initial,
}: {
  cadeiras: Cadeira[];
  candidaturas: CandidaturaOption[];
  parceiros: Parceiro[];
}) {
  const router = useRouter();
  const [parceiros, setParceiros] = useState(initial);
  const [novo, setNovo] = useState<Novo>(NOVO_VAZIO);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  function setMsgFor(key: string, text: string) {
    setMsg((m) => ({ ...m, [key]: text }));
    setTimeout(() => setMsg((m) => ({ ...m, [key]: '' })), 4000);
  }

  function aplicarCandidatura(candidaturaId: string) {
    const c = candidaturas.find((x) => x.id === candidaturaId);
    setNovo((f) => ({
      ...f,
      candidaturaId,
      nome: c ? c.empresa || c.nome : f.nome,
      whatsapp: c?.whatsapp ?? f.whatsapp,
      cidade: c?.cidade ?? f.cidade,
    }));
  }

  async function criar() {
    setBusy('novo');
    const res = await fetch('/api/parceiros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: novo.nome.trim(),
        whatsapp: novo.whatsapp || null,
        email: novo.email || null,
        cidade: novo.cidade || null,
        cpfCnpj: novo.cpfCnpj || null,
        cadeiraId: novo.cadeiraId,
        candidaturaId: novo.candidaturaId || null,
        comissaoPct: novo.comissaoPct === '' ? null : Number(novo.comissaoPct),
      }),
    });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setNovo(NOVO_VAZIO);
      setMsgFor('novo', '✓ Criado');
      router.refresh();
    } else {
      setMsgFor('novo', `✗ ${json.motivo}`);
    }
  }

  function campos(p: Parceiro): Edit {
    return edits[p.id] ?? toEdit(p);
  }

  async function salvar(p: Parceiro) {
    const f = campos(p);
    setBusy(p.id);
    const res = await fetch(`/api/parceiros/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estagio: f.estagio,
        comissaoPct: f.comissaoPct === '' ? null : Number(f.comissaoPct),
        contratoEm: f.contratoEm || null,
      }),
    });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setMsgFor(p.id, '✓ Salvo');
      router.refresh();
    } else {
      setMsgFor(p.id, `✗ ${json.motivo}`);
    }
  }

  async function apagar(p: Parceiro) {
    if (!confirm(`Apagar o parceiro "${p.nome}"? Só funciona se não houver negócios/faturas.`)) return;
    setBusy(p.id);
    const res = await fetch(`/api/parceiros/${p.id}`, { method: 'DELETE' });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setParceiros((prev) => prev.filter((x) => x.id !== p.id));
      router.refresh();
    } else {
      setMsgFor(p.id, `✗ ${json.motivo}`);
    }
  }

  return (
    <div>
      <div className="cc-section" style={{ marginBottom: '1.5rem' }}>
        <div className="cc-section__title">Novo parceiro</div>
        <div className="cc-fields">
          <label className="cc-field">
            A partir de candidatura (opcional)
            <select value={novo.candidaturaId} onChange={(e) => aplicarCandidatura(e.target.value)}>
              <option value="">— nenhuma —</option>
              {candidaturas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.empresa || c.nome} {c.categoria ? `(${c.categoria})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="cc-field">
            Nome/loja
            <input value={novo.nome} onChange={(e) => setNovo((f) => ({ ...f, nome: e.target.value }))} placeholder="Razão social ou loja" />
          </label>
          <label className="cc-field">
            Cadeira (nicho)
            <select value={novo.cadeiraId} onChange={(e) => setNovo((f) => ({ ...f, cadeiraId: e.target.value }))}>
              <option value="">— selecione —</option>
              {cadeiras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.niche}
                </option>
              ))}
            </select>
          </label>
          <label className="cc-field">
            WhatsApp
            <input value={novo.whatsapp} onChange={(e) => setNovo((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="62 9…" />
          </label>
          <label className="cc-field">
            E-mail
            <input value={novo.email} onChange={(e) => setNovo((f) => ({ ...f, email: e.target.value }))} placeholder="cobrança Asaas" />
          </label>
          <label className="cc-field">
            Cidade
            <input value={novo.cidade} onChange={(e) => setNovo((f) => ({ ...f, cidade: e.target.value }))} />
          </label>
          <label className="cc-field">
            CPF/CNPJ (opcional agora)
            <input value={novo.cpfCnpj} onChange={(e) => setNovo((f) => ({ ...f, cpfCnpj: e.target.value }))} placeholder="obrigatório p/ faturar" />
          </label>
          <label className="cc-field">
            % negociado (opcional)
            <input value={novo.comissaoPct} onChange={(e) => setNovo((f) => ({ ...f, comissaoPct: e.target.value }))} placeholder="0–1, ex: 0.1" />
          </label>
        </div>
        <div className="cc-row-actions" style={{ marginTop: '0.7rem' }}>
          <button className="btn btn--sm" disabled={busy === 'novo' || !novo.nome || !novo.cadeiraId} onClick={criar}>
            {busy === 'novo' ? 'Criando…' : 'Criar parceiro (sondagem)'}
          </button>
          {msg.novo && <span className={msg.novo.startsWith('✓') ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>{msg.novo}</span>}
        </div>
      </div>

      <table className="cc-table">
        <thead>
          <tr>
            <th>Parceiro</th>
            <th>Cadeira</th>
            <th>Estágio</th>
            <th>%</th>
            <th>Contrato</th>
            <th>Ocupação</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {parceiros.map((p) => {
            const f = campos(p);
            return (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/parceiros/${p.id}`}>{p.nome}</Link>
                </td>
                <td>{p.cadeiraNiche ?? p.nicho}</td>
                <td>
                  <select
                    value={f.estagio}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...campos(p), estagio: e.target.value } }))}
                    style={{ color: ESTAGIO_COLOR[f.estagio], fontWeight: 700 }}
                  >
                    {ESTAGIOS.map((e) => (
                      <option key={e} value={e}>
                        {ESTAGIO_LABEL[e]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="num"
                    style={{ width: 70 }}
                    value={f.comissaoPct}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...campos(p), comissaoPct: e.target.value } }))}
                    placeholder="0–1"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={f.contratoEm}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: { ...campos(p), contratoEm: e.target.value } }))}
                  />
                </td>
                <td>{f.contratoEm ? <span style={{ color: '#166534', fontWeight: 700 }}>ocupada</span> : <span className="muted">—</span>}</td>
                <td>
                  <div className="cc-row-actions">
                    <button className="btn btn--sm" disabled={busy === p.id} onClick={() => salvar(p)}>
                      {busy === p.id ? '…' : 'Salvar'}
                    </button>
                    <button className="card__del" disabled={busy === p.id} onClick={() => apagar(p)}>
                      Apagar
                    </button>
                  </div>
                  {msg[p.id] && <div className={msg[p.id].startsWith('✓') ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'}>{msg[p.id]}</div>}
                </td>
              </tr>
            );
          })}
          {parceiros.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="muted">
                Nenhum parceiro ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
