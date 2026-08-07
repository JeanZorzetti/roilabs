// Invariante de origem de um NegocioOriginado (012, data-model §1). Pura.
//
// Postgres faria isto com CHECK constraint, que o Prisma não declara — então é validação
// de servidor. Mora num lugar só e os DOIS caminhos de escrita a chamam (carrinho em
// api/negocios/route.ts, webhook em lib/carteira/registrar-venda.ts): guarda na função
// compartilhada é diff menor que guarda em cada chamador, e não deixa irmão desprotegido.

export type Origem = 'pedido' | 'webhook';

export interface OrigemNegocio {
  origem: string;
  pedidoId: string | null;
  vendaId: string | null;
}

/**
 * Das 4 combinações de (pedidoId, vendaId), só 2 podem gravar:
 *   origem='pedido'  ⇒ pedidoId presente, vendaId nulo
 *   origem='webhook' ⇒ vendaId presente, pedidoId nulo
 * As outras duas (ambos, nenhum) são o estado que `pedidoId` anulável abriu.
 */
export function validarOrigemNegocio(n: OrigemNegocio): { ok: true } | { ok: false; motivo: string } {
  const temPedido = !!n.pedidoId;
  const temVenda = !!n.vendaId;

  if (n.origem !== 'pedido' && n.origem !== 'webhook') {
    return { ok: false, motivo: `origem inválida: ${JSON.stringify(n.origem)}` };
  }
  if (temPedido && temVenda) {
    return { ok: false, motivo: 'pedidoId e vendaId preenchidos: um negócio tem UMA origem' };
  }
  if (!temPedido && !temVenda) {
    return { ok: false, motivo: 'nem pedidoId nem vendaId: negócio sem origem não se reconstrói' };
  }
  if (n.origem === 'pedido' && !temPedido) {
    return { ok: false, motivo: "origem='pedido' exige pedidoId" };
  }
  if (n.origem === 'webhook' && !temVenda) {
    return { ok: false, motivo: "origem='webhook' exige vendaId" };
  }
  return { ok: true };
}
