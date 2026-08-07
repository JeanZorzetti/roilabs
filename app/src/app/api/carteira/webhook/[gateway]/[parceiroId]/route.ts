import { NextRequest, NextResponse } from 'next/server';
import { processarWebhook } from '@/lib/carteira/webhook';

export const dynamic = 'force-dynamic';

// Webhook de venda de parceiro (012). A ordem obrigatória e a tabela de status vivem em
// lib/carteira/webhook.ts, onde os testes de contrato alcançam.
//
// ⚠️ NÃO é /api/pagamentos/webhook. Aquele é a conta da própria ROI Labs (porcelanato e
// fitas) e é o caminho que fatura hoje — não se toca nele (FR-005a).
//
// O `parceiroId` está no PATH e não é descoberto pelo corpo porque o segredo de assinatura
// é POR CONTA nos dois gateways: o receptor precisa saber qual parceiro é ANTES de validar.
// Descobrir pelo corpo obrigaria a ler entrada não autenticada no caminho de dinheiro.
// O `parceiroId` no path NÃO é credencial: é público e não autentica nada — quem autentica
// é a assinatura.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gateway: string; parceiroId: string }> },
) {
  const { gateway, parceiroId } = await params;
  const { http, corpo } = await processarWebhook(gateway, parceiroId, req);
  return NextResponse.json(corpo, { status: http });
}
