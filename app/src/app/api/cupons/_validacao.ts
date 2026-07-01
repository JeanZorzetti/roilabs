// Validação server-side compartilhada por POST (route.ts) e PATCH ([id]/route.ts) — FR-012.
import { prisma } from '@/lib/prisma';

export interface CupomData {
  codigo: string;
  tipo: string;
  valor: number;
  validadeInicio: Date | null;
  validadeFim: Date | null;
  minimo: number | null;
  ativo: boolean;
}

export type ValidacaoErro = { ok: false; motivo: string; status: 400 | 409 };

const parseData = (v: unknown): Date | null | 'invalido' => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v !== 'string') return 'invalido';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? 'invalido' : d;
};

/** Normaliza o body cru em CupomData, sem checar unicidade (checagem de forma). */
export function normalizarCampos(
  body: Record<string, unknown>,
  base: CupomData,
): CupomData | ValidacaoErro {
  const codigo =
    typeof body.codigo === 'string' ? body.codigo.trim().toUpperCase() : base.codigo;
  const tipo = typeof body.tipo === 'string' ? body.tipo : base.tipo;

  let valor = base.valor;
  if (body.valor !== undefined) {
    const v = Number(body.valor);
    if (!Number.isFinite(v)) return { ok: false, motivo: 'valor deve ser numérico', status: 400 };
    valor = v;
  }

  let minimo = base.minimo;
  if (body.minimo !== undefined) {
    if (body.minimo === null || body.minimo === '') {
      minimo = null;
    } else {
      const v = Number(body.minimo);
      if (!Number.isFinite(v)) return { ok: false, motivo: 'mínimo deve ser numérico', status: 400 };
      minimo = v;
    }
  }

  let validadeInicio = base.validadeInicio;
  if (body.validadeInicio !== undefined) {
    const d = parseData(body.validadeInicio);
    if (d === 'invalido') return { ok: false, motivo: 'validadeInicio inválida', status: 400 };
    validadeInicio = d;
  }

  let validadeFim = base.validadeFim;
  if (body.validadeFim !== undefined) {
    const d = parseData(body.validadeFim);
    if (d === 'invalido') return { ok: false, motivo: 'validadeFim inválida', status: 400 };
    validadeFim = d;
  }

  const ativo = typeof body.ativo === 'boolean' ? body.ativo : base.ativo;

  return { codigo, tipo, valor, validadeInicio, validadeFim, minimo, ativo };
}

/** Valida forma + unicidade (FR-012). `excludeId` ignora o próprio registro no PATCH. */
export async function validarCupomData(
  d: CupomData,
  excludeId?: string,
): Promise<{ ok: true } | ValidacaoErro> {
  if (!d.codigo) return { ok: false, motivo: 'código é obrigatório', status: 400 };
  if (d.tipo !== 'percentual' && d.tipo !== 'fixo') {
    return { ok: false, motivo: "tipo deve ser 'percentual' ou 'fixo'", status: 400 };
  }
  if (!Number.isFinite(d.valor)) {
    return { ok: false, motivo: 'valor é obrigatório e deve ser numérico', status: 400 };
  }
  if (d.tipo === 'percentual' && (d.valor < 0 || d.valor > 100)) {
    return { ok: false, motivo: 'valor percentual deve estar entre 0 e 100', status: 400 };
  }
  if (d.tipo === 'fixo' && d.valor < 0) {
    return { ok: false, motivo: 'valor fixo deve ser ≥ 0', status: 400 };
  }
  if (d.minimo !== null && d.minimo < 0) {
    return { ok: false, motivo: 'mínimo deve ser ≥ 0', status: 400 };
  }
  if (d.validadeInicio && d.validadeFim && d.validadeInicio > d.validadeFim) {
    return { ok: false, motivo: 'data-início deve ser ≤ data-fim', status: 400 };
  }

  const existente = await prisma.cupom.findUnique({ where: { codigo: d.codigo } });
  if (existente && existente.id !== excludeId) {
    return { ok: false, motivo: 'código já existe', status: 409 };
  }

  return { ok: true };
}
