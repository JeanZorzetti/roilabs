// Classificação aquisição vs recorrência de um negócio, na criação (010, D3). Puro.
// A rota busca os docs dos negócios anteriores NÃO-perdidos (estagio != 'perdido' e pedido
// não reembolsado) do mesmo parceiro e passa aqui — a lógica de match fica testável.

export type Classificacao = 'aquisicao' | 'recorrencia';

/**
 * @param clienteDoc doc normalizado (só dígitos) do comprador deste negócio; '' = sem doc.
 * @param docsAnteriores docs normalizados dos negócios anteriores não-perdidos do parceiro.
 * Sem doc → aquisição. Doc já visto num negócio anterior não-perdido → recorrência.
 */
export function classificarNegocio(clienteDoc: string, docsAnteriores: string[]): Classificacao {
  if (!clienteDoc) return 'aquisicao';
  return docsAnteriores.includes(clienteDoc) ? 'recorrencia' : 'aquisicao';
}
