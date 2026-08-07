// Classificação de uma venda de gateway (012, contrato §"Classificação aquisição × recorrência").
// Pura. É o ENVELOPE da regra da 010, não uma segunda regra: o passo 3 chama
// `classificarNegocio` sem reimplementá-la.

import { classificarNegocio, type Classificacao } from '@/lib/classificar-negocio';

export type { Classificacao };

export interface VendaParaClassificar {
  /** Lido DO gateway. true = renovação de assinatura. */
  recorrente: boolean;
  /** CPF/CNPJ normalizado, quando o gateway entrega. '' = não entregou. */
  clienteDoc: string;
  /** id/e-mail do cliente NO gateway. Fallback quando não há doc. '' = nenhum. */
  clienteRef: string;
  /** Docs dos negócios anteriores não-perdidos do mesmo parceiro. */
  docsAnteriores: string[];
  /** Refs dos negócios anteriores não-perdidos do mesmo parceiro. */
  refsAnteriores: string[];
}

/**
 * Regra ORDENADA — para na primeira que casar:
 *   1. `recorrente` → recorrência. Renovação é recorrência por definição e não depende
 *      de identificar o cliente.
 *   2. negócio anterior do mesmo cliente (clienteDoc, senão clienteRef) → recorrência.
 *   3. senão → aquisição.
 *
 * ⚠️ A regra 1 existe porque "sem doc → aquisição" da 010 foi escrita para compra ÚNICA de
 * porcelanato. Aplicada crua a assinatura SaaS — onde MP e Stripe entregam e-mail e quase
 * nunca CPF — ela cobraria 15% de aquisição em TODA renovação mensal, contra os 10% que o
 * contrato do parceiro promete. A regra da 010 fica intacta no passo 3; o que muda é que
 * renovação nunca chega lá.
 */
export function classificarVendaParceiro(v: VendaParaClassificar): Classificacao {
  if (v.recorrente) return 'recorrencia';

  // O doc é a chave preferida; o ref do gateway é o fallback. Comparar chaves de espaços
  // diferentes (doc daqui contra ref de lá) daria falso negativo — por isso a lista de
  // anteriores acompanha a chave escolhida.
  const [chave, anteriores] = v.clienteDoc
    ? [v.clienteDoc, v.docsAnteriores]
    : [v.clienteRef, v.refsAnteriores];

  return classificarNegocio(chave, anteriores);
}
