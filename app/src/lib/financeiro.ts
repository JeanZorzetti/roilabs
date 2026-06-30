import {
  PARAMS,
  resolverParametros,
  calcIntermediacao,
  calcWL,
  type CamadasConfig,
  type Parametros,
} from './centros-custo';

export interface ItemPagoInput {
  pedidoId: string;
  createdAt: Date;
  subtotal: number;
  pisoSnapshot: number | null;
  modalidadeSnapshot: string | null;
  comissaoSnapshot: number | null;
  aliqIntermediacaoSnapshot: number | null;
  aliqWLSnapshot: number | null;
  slug: string;
  skuModalidadeAlvo?: string | null;
}

export interface MesFinanceiro {
  mes: string; // YYYY-MM
  gmvPago: number;
  liquidoInter: number;
  liquidoWL: number;
  pedidos: number;
  semSnapshot: number;
}

export interface LinhaCSV {
  data: string; // dd/MM/yyyy
  pedidoId: string;
  gmv: number;
  modalidade: string; // 'Intermediação' | 'White Label'
  liquido: number;
}

// Mirrors the per-item resolution logic from centros-de-custo/page.tsx (FR-011).
function calcItem(
  it: ItemPagoInput,
  vigentes: Parametros,
): { liquido: number; modalidade: 'intermediacao' | 'wl'; semSnapshot: boolean } {
  const varejo = it.subtotal;
  const hasSnapshot =
    it.comissaoSnapshot !== null ||
    it.aliqIntermediacaoSnapshot !== null ||
    it.aliqWLSnapshot !== null;

  const p: Parametros = hasSnapshot
    ? {
        markup: PARAMS.markup,
        comissao: it.comissaoSnapshot !== null ? it.comissaoSnapshot : vigentes.comissao,
        aliqIntermediacao:
          it.aliqIntermediacaoSnapshot !== null
            ? it.aliqIntermediacaoSnapshot
            : vigentes.aliqIntermediacao,
        aliqWL: it.aliqWLSnapshot !== null ? it.aliqWLSnapshot : vigentes.aliqWL,
      }
    : vigentes;

  const piso =
    it.pisoSnapshot !== null ? it.pisoSnapshot : varejo / (1 + vigentes.markup);

  const modalidade: 'intermediacao' | 'wl' =
    (it.modalidadeSnapshot ?? it.skuModalidadeAlvo ?? 'intermediacao') === 'wl' ? 'wl' : 'intermediacao';

  const liquido =
    modalidade === 'wl'
      ? calcWL(varejo, piso, p).liquido
      : calcIntermediacao(varejo, piso, p).liquido;

  return { liquido, modalidade, semSnapshot: !hasSnapshot };
}

export function agregarPorMes(
  itensPagos: ItemPagoInput[],
  globalParams: CamadasConfig['global'],
): MesFinanceiro[] {
  const vigentes = resolverParametros({ global: globalParams });
  const map = new Map<string, MesFinanceiro & { pedidoIds: Set<string> }>();

  for (const it of itensPagos) {
    const mes = it.createdAt.toISOString().slice(0, 7);
    if (!map.has(mes)) {
      map.set(mes, {
        mes, gmvPago: 0, liquidoInter: 0, liquidoWL: 0,
        pedidos: 0, semSnapshot: 0, pedidoIds: new Set(),
      });
    }
    const bucket = map.get(mes)!;
    const { liquido, modalidade, semSnapshot } = calcItem(it, vigentes);

    bucket.gmvPago += it.subtotal;
    if (modalidade === 'wl') bucket.liquidoWL += liquido;
    else bucket.liquidoInter += liquido;
    if (semSnapshot) bucket.semSnapshot++;
    if (!bucket.pedidoIds.has(it.pedidoId)) {
      bucket.pedidoIds.add(it.pedidoId);
      bucket.pedidos++;
    }
  }

  return [...map.values()]
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .map(({ pedidoIds: _ids, ...rest }) => rest);
}

function fmtData(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function linhasPorPedido(
  itensPagos: ItemPagoInput[],
  globalParams: CamadasConfig['global'],
): LinhaCSV[] {
  const vigentes = resolverParametros({ global: globalParams });
  const pedidoMap = new Map<string, { createdAt: Date; itens: ItemPagoInput[] }>();

  for (const it of itensPagos) {
    if (!pedidoMap.has(it.pedidoId)) {
      pedidoMap.set(it.pedidoId, { createdAt: it.createdAt, itens: [] });
    }
    pedidoMap.get(it.pedidoId)!.itens.push(it);
  }

  return [...pedidoMap.values()].map(({ createdAt, itens }) => {
    let gmv = 0;
    let liquidoInter = 0;
    let liquidoWL = 0;
    let wlCount = 0;

    for (const it of itens) {
      const { liquido, modalidade } = calcItem(it, vigentes);
      gmv += it.subtotal;
      if (modalidade === 'wl') { liquidoWL += liquido; wlCount++; }
      else liquidoInter += liquido;
    }

    // ponytail: pedido misto reporta modalidade predominante; só conta para CSV (SC-004)
    const modalidade = wlCount >= itens.length - wlCount ? 'White Label' : 'Intermediação';
    const pedidoId = itens[0].pedidoId;

    return { data: fmtData(createdAt), pedidoId, gmv, modalidade, liquido: liquidoInter + liquidoWL };
  });
}
