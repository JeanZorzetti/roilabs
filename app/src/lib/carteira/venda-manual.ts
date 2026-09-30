// Venda de parceiro fechada fora do carrinho e fora do gateway (30/09/2026): o orçamento que a
// TapePro fecha no WhatsApp. Pura — lê e valida o corpo do POST /api/negocios/manual; quem grava
// é a rota. Classificação e taxa seguem as da carteira (classificarVendaParceiro), não uma regra nova.
import { normalizarDoc } from '@/lib/doc';

export interface VendaManual {
  parceiroId: string;
  orcamento: string; // nº no sistema do parceiro: a chave contra registro duplicado
  data: string; // YYYY-MM-DD
  cliente: string;
  clienteDoc: string | null; // só dígitos, 11 ou 14
  valor: number; // produto, sem frete: a base da comissão
  canal: string;
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Aceita 387.8, "387,80", "1.234,56" e "1234.56". NaN quando não é número. */
export function lerValor(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return NaN;
  const s = v.trim().replace(/^R\$\s*/, '');
  const br = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return /^\d+(\.\d{1,2})?$/.test(br) ? Number(br) : NaN;
}

export function lerVendaManual(
  body: Record<string, unknown>,
  hoje: string = new Date().toISOString().slice(0, 10),
): { ok: true; venda: VendaManual } | { ok: false; motivo: string } {
  const parceiroId = texto(body.parceiroId, 64);
  const orcamento = texto(body.orcamento, 40).replace(/^#/, '');
  const data = texto(body.data, 10);
  const cliente = texto(body.cliente, 200);
  const docCru = texto(body.clienteDoc, 30);
  const clienteDoc = docCru ? normalizarDoc(docCru) : '';
  const valor = lerValor(body.valor);
  const canal = texto(body.canal, 60) || 'WhatsApp';

  if (!parceiroId) return { ok: false, motivo: 'Escolha o parceiro.' };
  if (!orcamento) return { ok: false, motivo: 'Informe o nº do orçamento.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) return { ok: false, motivo: 'Informe a data da venda.' };
  if (data > hoje) return { ok: false, motivo: 'A data da venda não pode ser futura.' };
  if (!cliente) return { ok: false, motivo: 'Informe o cliente.' };
  if (docCru && clienteDoc.length !== 11 && clienteDoc.length !== 14) {
    return { ok: false, motivo: 'Confira o documento: CPF tem 11 dígitos e CNPJ, 14.' };
  }
  if (!(valor > 0) || valor > 10_000_000) return { ok: false, motivo: 'Informe o valor do produto, maior que zero.' };

  return { ok: true, venda: { parceiroId, orcamento, data, cliente, clienteDoc: clienteDoc || null, valor, canal } };
}
