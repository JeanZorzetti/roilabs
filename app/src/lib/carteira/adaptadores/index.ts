// Contrato dos adaptadores de gateway (012). Dois adaptadores finos, um núcleo:
// eles diferem em ASSINATURA, CONSULTA e FORMATO, e convergem em registrar-venda.ts.
//
// Kiwify não se constrói: serve zero cadeira depois que `orcaobra` saiu da fase 1
// (Constituição III — sem cadeira, é scaffolding "para depois"). Gatilho para construir:
// uma cadeira Kiwify entrar em `ocupada-vendavel`.

import type { VendaEntrada } from '@/lib/carteira/registrar-venda';
import { adaptadorMercadoPago } from './mercadopago';
import { adaptadorStripe } from './stripe';

/** O que a rota entrega ao adaptador. `corpoCru` é string porque a assinatura é sobre BYTES. */
export interface CtxWebhook {
  headers: Headers;
  url: URL;
  corpoCru: string;
}

export interface AdaptadorGateway {
  /** Passo 2 do contrato. Nenhum estado tocado até isto devolver true. */
  verificarAssinatura(ctx: CtxWebhook, segredo: string): boolean;
  /**
   * Passo 3 do contrato: lê status, valor e a CONTA DONA do pagamento no gateway.
   * `null` = evento irrelevante (→ 200; erro faria o gateway reenviar para sempre).
   * `throw` = falha ao consultar (→ 5xx, o único caso que pede retry).
   */
  consultar(ctx: CtxWebhook, token: string): Promise<VendaEntrada | null>;
}

const ADAPTADORES: Record<string, AdaptadorGateway> = {
  mercadopago: adaptadorMercadoPago,
  stripe: adaptadorStripe,
};

export function adaptadorDe(gateway: string): AdaptadorGateway | null {
  return ADAPTADORES[gateway] ?? null;
}
