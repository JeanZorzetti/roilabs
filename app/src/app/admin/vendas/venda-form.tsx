'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ParceiroOpcao {
  id: string;
  nome: string;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (t: number) => `${Math.round(t * 1000) / 10}%`.replace('.', ',');

// Registro de venda fechada fora do site (orçamento no WhatsApp, telefone, e-mail).
export default function VendaForm({ parceiros }: { parceiros: ParceiroOpcao[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/negocios/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (json?.ok) {
      const tipo = json.classificacao === 'aquisicao' ? '1ª compra' : 'recompra';
      setMsg({ ok: true, texto: `Venda registrada. Comissão de ${brl(json.comissao)} (${tipo}, ${pct(json.taxa)}).` });
      form.reset();
      router.refresh();
    } else {
      setMsg({ ok: false, texto: json?.motivo ?? 'Não deu para registrar agora. Confira a conexão e tente de novo.' });
    }
  }

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

  return (
    <form className="cc-section" onSubmit={registrar} aria-labelledby="venda-form-titulo">
      <h2 id="venda-form-titulo" className="cc-section__title">Registrar venda fechada fora do site</h2>
      <p className="cc-note">
        Para a venda que o parceiro fechou por WhatsApp, telefone ou e-mail. A comissão sai da taxa do
        parceiro: 1ª compra do cliente ou recompra.
      </p>

      <div className="cc-fields" style={{ marginTop: '1rem' }}>
        <div className="cc-field">
          <label htmlFor="vf-parceiro">Parceiro</label>
          <select id="vf-parceiro" name="parceiroId" required defaultValue="" style={{ width: 200 }}>
            <option value="" disabled>Escolha…</option>
            {parceiros.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>
        <div className="cc-field">
          <label htmlFor="vf-orcamento">Nº do orçamento</label>
          <input id="vf-orcamento" name="orcamento" required maxLength={40} placeholder="ex.: 0446" aria-describedby="vf-orcamento-dica" style={{ width: 120 }} />
        </div>
        <div className="cc-field">
          <label htmlFor="vf-data">Data da venda</label>
          <input id="vf-data" name="data" type="date" required max={hoje} />
        </div>
        <div className="cc-field">
          <label htmlFor="vf-canal">Canal</label>
          <select id="vf-canal" name="canal" defaultValue="WhatsApp" style={{ width: 130 }}>
            <option>WhatsApp</option>
            <option>Telefone</option>
            <option>E-mail</option>
            <option>Presencial</option>
          </select>
        </div>
      </div>

      <div className="cc-fields" style={{ marginTop: '0.85rem' }}>
        <div className="cc-field">
          <label htmlFor="vf-cliente">Cliente</label>
          <input id="vf-cliente" name="cliente" required maxLength={200} placeholder="ex.: Elevaa 3D Ltda" autoComplete="off" style={{ width: 280 }} />
        </div>
        <div className="cc-field">
          <label htmlFor="vf-doc">CPF ou CNPJ do cliente (opcional)</label>
          <input id="vf-doc" name="clienteDoc" inputMode="numeric" maxLength={30} placeholder="ex.: 00.000.000/0001-00" aria-describedby="vf-doc-dica" autoComplete="off" style={{ width: 200 }} />
        </div>
        <div className="cc-field">
          <label htmlFor="vf-valor">Valor do produto, sem frete</label>
          <input id="vf-valor" name="valor" required inputMode="decimal" placeholder="ex.: 387,80" aria-describedby="vf-valor-dica" style={{ width: 140 }} />
        </div>
        <button className="btn btn--sm" type="submit" disabled={busy}>
          {busy ? 'Registrando…' : 'Registrar venda'}
        </button>
      </div>

      <ul className="muted" style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem', fontSize: 12, lineHeight: 1.6 }}>
        <li id="vf-orcamento-dica">Nº do orçamento: o número no sistema do parceiro. Impede registrar a mesma venda duas vezes.</li>
        <li id="vf-doc-dica">Documento: com ele, a próxima compra desse cliente entra como recompra.</li>
        <li id="vf-valor-dica">Valor: a comissão incide só sobre o produto, nunca sobre o frete.</li>
      </ul>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'cc-msg cc-msg--ok' : 'cc-msg cc-msg--err'} style={{ marginTop: '0.75rem' }}>
          {msg.texto}
        </p>
      )}
    </form>
  );
}
