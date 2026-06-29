// Coupon knob — code-as-config, mirrors the frete.ts pattern (D1). One polo's launch
// volume doesn't justify a table + CRUD. Discount is ALWAYS over the product subtotal,
// never freight. The server is the sole authority (validated at display AND re-validated
// at checkout, FR-014). Codes never reach the front bundle (validated server-side).
// ponytail: code knob; promote to a DB table + admin CRUD when the operation needs to
// create coupons without a deploy.

type Tipo = 'percentual' | 'fixo';

interface Cupom {
  tipo: Tipo;
  valor: number; // percentual: 0–100 · fixo: BRL
  validadeInicio?: string; // ISO date; optional
  validadeFim?: string; // ISO date; optional
  minimo?: number; // minimum product subtotal to apply
  ativo: boolean;
}

const CUPONS: Record<string, Cupom> = {
  OBRA10: { tipo: 'percentual', valor: 10, minimo: 500, ativo: true },
};

export type Motivo = 'invalido' | 'expirado' | 'minimo' | 'inativo';

export type ResultadoCupom =
  | { ok: true; codigo: string; tipo: Tipo; desconto: number }
  | { ok: false; motivo: Motivo };

const money = (n: number) => Math.round(n * 100) / 100;

/** Validates a coupon against the server-recomputed product subtotal (D1, FR-014). */
export function validarCupom(codigo: string, subtotalProduto: number): ResultadoCupom {
  const c = CUPONS[(codigo || '').trim().toUpperCase()];
  if (!c) return { ok: false, motivo: 'invalido' };
  if (!c.ativo) return { ok: false, motivo: 'inativo' };

  const now = Date.now();
  if (c.validadeInicio && now < Date.parse(c.validadeInicio)) return { ok: false, motivo: 'expirado' };
  if (c.validadeFim && now > Date.parse(c.validadeFim)) return { ok: false, motivo: 'expirado' };
  if (c.minimo != null && subtotalProduto < c.minimo) return { ok: false, motivo: 'minimo' };

  const bruto = c.tipo === 'percentual' ? (subtotalProduto * c.valor) / 100 : c.valor;
  const desconto = money(Math.min(Math.max(0, bruto), subtotalProduto)); // never < 0, never > subtotal
  return { ok: true, codigo: (codigo || '').trim().toUpperCase(), tipo: c.tipo, desconto };
}
