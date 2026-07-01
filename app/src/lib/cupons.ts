// Cupons de desconto — lidos da tabela `Cupom` (Postgres), gerida via /admin/cupons.
// Desconto SEMPRE sobre o subtotal do produto, nunca frete. O servidor é a autoridade
// única (validado no display E re-validado no checkout, FR-014). Código do cupom nunca
// chega ao bundle do front (validado server-side).
import { prisma } from '@/lib/prisma';

type Tipo = 'percentual' | 'fixo';

export interface CupomAvaliavel {
  tipo: Tipo;
  valor: number; // percentual: 0–100 · fixo: BRL
  validadeInicio: number | null; // epoch ms, ou null = sem início
  validadeFim: number | null; // epoch ms, ou null = sem fim
  minimo: number | null; // subtotal mínimo de produto para aplicar
  ativo: boolean;
}

export type Motivo = 'invalido' | 'expirado' | 'minimo' | 'inativo';

export type ResultadoCupom =
  | { ok: true; codigo: string; tipo: Tipo; desconto: number }
  | { ok: false; motivo: Motivo };

type ResultadoAvaliacao = { ok: true; tipo: Tipo; desconto: number } | { ok: false; motivo: Motivo };

const money = (n: number) => Math.round(n * 100) / 100;

/** Regras puras de dinheiro — sem I/O. Testável isoladamente (test/cupons.test.mjs). */
export function avaliarCupom(c: CupomAvaliavel | null, subtotalProduto: number): ResultadoAvaliacao {
  if (!c) return { ok: false, motivo: 'invalido' };
  if (!c.ativo) return { ok: false, motivo: 'inativo' };

  const now = Date.now();
  if (c.validadeInicio !== null && now < c.validadeInicio) return { ok: false, motivo: 'expirado' };
  if (c.validadeFim !== null && now > c.validadeFim) return { ok: false, motivo: 'expirado' };
  if (c.minimo !== null && subtotalProduto < c.minimo) return { ok: false, motivo: 'minimo' };

  const bruto = c.tipo === 'percentual' ? (subtotalProduto * c.valor) / 100 : c.valor;
  const desconto = money(Math.min(Math.max(0, bruto), subtotalProduto)); // never < 0, never > subtotal
  return { ok: true, tipo: c.tipo, desconto };
}

/** Busca o cupom no DB e delega para avaliarCupom (D1, FR-014). */
export async function validarCupom(codigo: string, subtotalProduto: number): Promise<ResultadoCupom> {
  const codigoNorm = (codigo || '').trim().toUpperCase();
  const row = await prisma.cupom.findUnique({ where: { codigo: codigoNorm } });
  const c: CupomAvaliavel | null = row
    ? {
        tipo: row.tipo as Tipo,
        valor: Number(row.valor),
        validadeInicio: row.validadeInicio ? row.validadeInicio.getTime() : null,
        validadeFim: row.validadeFim ? row.validadeFim.getTime() : null,
        minimo: row.minimo !== null ? Number(row.minimo) : null,
        ativo: row.ativo,
      }
    : null;
  const r = avaliarCupom(c, subtotalProduto);
  return r.ok ? { ok: true, codigo: codigoNorm, tipo: r.tipo, desconto: r.desconto } : r;
}
