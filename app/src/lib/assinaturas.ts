// 014: motor da assinatura recorrente — data + máquina de estado + cancelamento.
// Isolado de mercadopago.ts porque é lógica NOSSA (decisão), não chamada de gateway.
import crypto from 'crypto';
import { prisma } from './prisma';
import { cancelPreapproval } from './mercadopago';

/** mensal soma 1 mês, anual soma 12, a partir de `de` (default agora). */
export function dataProximoCiclo(recorrencia: string, de: Date = new Date()): Date {
  const d = new Date(de);
  d.setMonth(d.getMonth() + (recorrencia === 'anual' ? 12 : 1));
  return d;
}

export function novoCancelToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export interface AssinaturaEstadoAtual {
  estado: string; // ativa | inadimplente | cancelada
  recorrencia: string;
}

export type DecisaoRenovacao =
  | { acao: 'ignorar' } // dedupe (FR-006) — mpPaymentId já processado
  | { acao: 'sucesso'; novoEstado: 'ativa'; proximaCobranca: Date; limparJanela: boolean }
  | { acao: 'falha'; novoEstado: string; setarJanela: boolean };

/**
 * Decide o efeito de uma notificação de renovação sobre a máquina de estado
 * (data-model.md). `jaProcessado` = já existe CicloCobranca com este mpPaymentId.
 * Nunca decide 'cancelada' — isso é só o cron (FR-009), ver `janelaEsgotada`.
 */
export function decidirRenovacao(
  assinatura: AssinaturaEstadoAtual,
  paymentStatus: string,
  jaProcessado: boolean,
  agora: Date = new Date(),
): DecisaoRenovacao {
  if (jaProcessado) return { acao: 'ignorar' };

  if (paymentStatus === 'approved') {
    return {
      acao: 'sucesso',
      novoEstado: 'ativa',
      proximaCobranca: dataProximoCiclo(assinatura.recorrencia, agora),
      limparJanela: assinatura.estado === 'inadimplente',
    };
  }

  // Falha: só entra em inadimplente se estava ativa; se já inadimplente, a janela não reseta.
  return {
    acao: 'falha',
    novoEstado: assinatura.estado === 'ativa' ? 'inadimplente' : assinatura.estado,
    setarJanela: assinatura.estado === 'ativa',
  };
}

/** O cron (D2) compara isto para decidir se esgotou a janela de retry (FR-009). */
export function janelaEsgotada(janelaFalhaDesde: Date, janelaDias: number, agora: Date = new Date()): boolean {
  const limite = new Date(janelaFalhaDesde);
  limite.setDate(limite.getDate() + janelaDias);
  return agora >= limite;
}

/** 404 para token errado/de outra assinatura (mesma resposta — FR-011); 200 idempotente se
 *  já cancelada. Usado tanto pelo self-service quanto pelo admin (mesma decisão, 2 rotas). */
export function decidirCancelamento(assinatura: { estado: string } | null): { httpStatus: number; noop: boolean } {
  if (!assinatura) return { httpStatus: 404, noop: true };
  if (assinatura.estado === 'cancelada') return { httpStatus: 200, noop: true };
  return { httpStatus: 200, noop: false };
}

/**
 * Cancela no MP e só então no banco — a ordem importa (data-model.md): se `cancelar` falhar,
 * nada abaixo roda, e quem chamou (cron, self-service, admin) tenta de novo depois.
 * `deps` é injetável só para o teste observar a ordem sem tocar rede/DB reais.
 */
export async function cancelarAssinatura(
  assinatura: { id: string; itemPedidoId: string; mpPreapprovalId: string },
  deps: { cancelar: typeof cancelPreapproval; db: typeof prisma } = { cancelar: cancelPreapproval, db: prisma },
): Promise<void> {
  await deps.cancelar(assinatura.mpPreapprovalId);
  await deps.db.$transaction([
    deps.db.assinatura.update({
      where: { id: assinatura.id },
      data: { estado: 'cancelada', proximaCobranca: null, canceladaEm: new Date() },
    }),
    deps.db.itemPedido.update({
      where: { id: assinatura.itemPedidoId },
      data: { assinaturaEstado: 'cancelada' },
    }),
  ]);
}
