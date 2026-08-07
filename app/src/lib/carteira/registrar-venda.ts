// Núcleo de registro de venda de parceiro — passos 4 a 6 de
// specs/012-carteira-cadeiras-ecommerce/contracts/webhook-carteira.md.
//
// Os dois adaptadores (mercadopago, stripe) diferem em assinatura, consulta e formato, e
// convergem AQUI. Um lugar só: a regra de dinheiro não se responde em dois arquivos.

import { prisma } from '@/lib/prisma';
import { log } from '@/lib/log';
import { normalizarDoc } from '@/lib/doc';
import { classificarVendaParceiro } from '@/lib/carteira/classificar-venda';
import { validarOrigemNegocio } from '@/lib/carteira/origem-negocio';

export type StatusVenda = 'aprovada' | 'reembolsada' | 'estornada';
export type MotivoDescarte = 'conta-divergente' | 'payer-teste';

/** O que o adaptador entrega depois de consultar o gateway (passo 3). */
export interface VendaEntrada {
  gateway: string;
  eventoId: string;
  pagamentoId: string;
  valor: number;
  moeda: string;
  status: StatusVenda;
  recorrente: boolean;
  clienteDoc: string | null;
  clienteRef: string | null;
  /** Conta dona do pagamento, lida DO gateway — nunca do corpo da notificação. */
  contaRefPagamento: string;
  /** FR-006: payer é conta de teste, mesmo com approved + live_mode. */
  payerTeste: boolean;
  payload: unknown;
}

export interface ResultadoRegistro {
  /** Status HTTP que a rota devolve (tabela de respostas do contrato). */
  http: 200 | 409;
  ok: boolean;
  /** 'retry' = colisão da @@unique; o evento já estava registrado. */
  retry?: boolean;
  vendaId?: string;
  negocioId?: string;
  motivoDescarte?: MotivoDescarte;
  /** Por que a venda foi gravada sem gerar negócio, quando foi o caso. */
  semNegocio?: 'nao-atribuida' | 'payer-teste' | 'da-casa' | 'nao-aprovada' | 'parceiro-sem-taxas';
}

/**
 * Passo 4 — conferir a conta. PURO, e roda ANTES da única escrita.
 *
 * ⚠️ Gravar primeiro e conferir depois faria a linha nascer atribuída ao parceiro ERRADO —
 * que é exatamente o defeito que a falha fechada de FR-005 existe para impedir.
 * Conta divergente ganha do payer de teste: a atribuição errada é o problema maior, e é
 * a única que exige apuração humana (409).
 */
export function decidirAtribuicao(opts: {
  contaRefPagamento: string;
  contaRefCredencial: string;
  parceiroId: string;
  payerTeste: boolean;
}): { parceiroId: string | null; motivoDescarte: MotivoDescarte | null } {
  if (opts.contaRefPagamento !== opts.contaRefCredencial) {
    return { parceiroId: null, motivoDescarte: 'conta-divergente' };
  }
  if (opts.payerTeste) {
    // Atribuída (sabemos de quem é), mas descartada da receita: os 20 pagamentos
    // `approved` + `live_mode: true` da Atma são teste e somam R$ 0,00 de receita real.
    return { parceiroId: opts.parceiroId, motivoDescarte: 'payer-teste' };
  }
  return { parceiroId: opts.parceiroId, motivoDescarte: null };
}

/** Colisão de UNIQUE do Prisma. É retry do gateway, não erro. */
const ehColisaoUnique = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === 'P2002';

type Db = typeof prisma;

export async function registrarVenda(
  entrada: VendaEntrada,
  credencial: { parceiroId: string; contaRef: string },
  db: Db = prisma,
): Promise<ResultadoRegistro> {
  // ── Passo 4: conferir a conta ANTES de escrever ────────────────────────────
  const { parceiroId, motivoDescarte } = decidirAtribuicao({
    contaRefPagamento: entrada.contaRefPagamento,
    contaRefCredencial: credencial.contaRef,
    parceiroId: credencial.parceiroId,
    payerTeste: entrada.payerTeste,
  });

  // ── Passo 5: gravar VendaParceiro — UMA escrita, com o parceiroId já decidido ──
  let venda;
  try {
    venda = await db.vendaParceiro.create({
      data: {
        parceiroId,
        gateway: entrada.gateway,
        eventoId: entrada.eventoId,
        pagamentoId: entrada.pagamentoId,
        valor: entrada.valor,
        moeda: entrada.moeda,
        status: entrada.status,
        recorrente: entrada.recorrente,
        clienteDoc: entrada.clienteDoc,
        clienteRef: entrada.clienteRef,
        payload: entrada.payload as never,
        motivoDescarte,
      },
    });
  } catch (err) {
    if (ehColisaoUnique(err)) {
      // ⚠️ É a @@unique([gateway, eventoId]) que segura, não um `if` — dois retries
      // SIMULTÂNEOS são o comportamento normal dos gateways, e checar-antes-de-gravar
      // é corrida entre os dois. Retry de evento divergente também cai aqui e devolve
      // 200, não 409: o 409 da primeira entrega já pediu apuração humana.
      return { http: 200, ok: true, retry: true };
    }
    throw err;
  }

  // Reembolso/estorno chega como OUTRO evento, com o mesmo pagamentoId. Propagar o status
  // para a venda original é o que faz o negócio dela sair da fatura — sem isto o
  // `venda.status` que o demonstrativo lê ficaria eternamente 'aprovada'.
  if (entrada.status !== 'aprovada') {
    await db.vendaParceiro.updateMany({
      where: { gateway: entrada.gateway, pagamentoId: entrada.pagamentoId, id: { not: venda.id } },
      data: { status: entrada.status },
    });
    log.info({ vendaId: venda.id, pagamentoId: entrada.pagamentoId, status: entrada.status }, 'carteira: venda revertida');
    return { http: 200, ok: true, vendaId: venda.id, semNegocio: 'nao-aprovada' };
  }

  // ── Falha fechada (FR-005): não atribuível não vira negócio, nunca por aproximação ──
  if (!parceiroId) {
    log.warn(
      { vendaId: venda.id, gateway: entrada.gateway, contaPagamento: entrada.contaRefPagamento },
      'carteira: conta divergente — venda registrada sem parceiro',
    );
    return { http: 409, ok: false, vendaId: venda.id, motivoDescarte: 'conta-divergente', semNegocio: 'nao-atribuida' };
  }

  // ── FR-006: payer de teste grava a venda e NÃO conta como receita ──────────
  if (motivoDescarte === 'payer-teste') {
    log.info({ vendaId: venda.id, gateway: entrada.gateway }, 'carteira: payer de teste — fora da receita');
    return { http: 200, ok: true, vendaId: venda.id, motivoDescarte: 'payer-teste', semNegocio: 'payer-teste' };
  }

  // ── Passo 6: criar NegocioOriginado, EXCETO cadeira da casa (FR-010) ───────
  const parceiro = await db.parceiro.findUnique({
    where: { id: parceiroId },
    include: { cadeira: { select: { daCasa: true } } },
  });
  if (!parceiro) {
    // Credencial aponta para parceiro que sumiu — não inventar atribuição.
    log.error({ vendaId: venda.id, parceiroId }, 'carteira: parceiro da credencial não existe');
    return { http: 409, ok: false, vendaId: venda.id, semNegocio: 'nao-atribuida' };
  }

  if (parceiro.cadeira?.daCasa) {
    // ⚠️ Cadeira da casa grava a venda (receita direta, auditável) e NÃO cria negócio.
    // ponytail: sem negócio em vez de negócio com faturavel=false — assim FR-010
    // ("nenhum agregado de faturamento, fee ou receita da carteira soma cadeira da casa")
    // vale por CONSTRUÇÃO, não por uma flag que alguém pode inverter. `NegocioOriginado`
    // é o livro do success fee; o que não gera fee não entra nele.
    log.info({ vendaId: venda.id, parceiroId }, 'carteira: cadeira da casa — venda sem success fee');
    return { http: 200, ok: true, vendaId: venda.id, semNegocio: 'da-casa' };
  }

  if (parceiro.comissaoAquisicao === null || parceiro.comissaoRecorrencia === null) {
    // Sem as duas taxas não há o que congelar (FR-006a). 200 de propósito: reenviar não
    // conserta cadastro. O log.error é o sinal de que alguém tem de cadastrar as taxas.
    log.error({ vendaId: venda.id, parceiroId }, 'carteira: parceiro sem taxas — venda sem negócio');
    return { http: 200, ok: true, vendaId: venda.id, semNegocio: 'parceiro-sem-taxas' };
  }

  const clienteDoc = normalizarDoc(entrada.clienteDoc ?? '');
  const clienteRef = entrada.clienteRef ?? '';

  // Anteriores não-perdidos do MESMO parceiro. Negócio perdido, pedido reembolsado ou
  // venda estornada não consomem a aquisição (FR-008).
  const anteriores = await db.negocioOriginado.findMany({
    where: { parceiroId, estagio: { not: 'perdido' } },
    select: {
      clienteDoc: true,
      clienteRef: true,
      pedido: { select: { statusPagamento: true } },
      venda: { select: { status: true } },
    },
  });
  const vivos = anteriores.filter(
    (n) =>
      n.pedido?.statusPagamento !== 'reembolsado' &&
      n.venda?.status !== 'reembolsada' &&
      n.venda?.status !== 'estornada',
  );

  const classificacao = classificarVendaParceiro({
    recorrente: entrada.recorrente,
    clienteDoc,
    clienteRef,
    docsAnteriores: vivos.map((n) => n.clienteDoc ?? '').filter(Boolean),
    refsAnteriores: vivos.map((n) => n.clienteRef ?? '').filter(Boolean),
  });
  const taxaAplicada =
    classificacao === 'aquisicao' ? parceiro.comissaoAquisicao : parceiro.comissaoRecorrencia;

  const dados = {
    pedidoId: null,
    vendaId: venda.id,
    origem: 'webhook' as const,
    parceiroId,
    valor: entrada.valor,
    estagio: 'repassado',
    faturavel: true,
    clienteDoc: clienteDoc || null,
    clienteRef: clienteRef || null,
    classificacao,
    taxaAplicada,
  };

  const invariante = validarOrigemNegocio(dados);
  if (!invariante.ok) throw new Error(`invariante de origem violada: ${invariante.motivo}`);

  const negocio = await db.negocioOriginado.create({ data: dados });

  log.info(
    { vendaId: venda.id, negocioId: negocio.id, parceiroId, classificacao },
    'carteira: negócio originado por webhook',
  );
  return { http: 200, ok: true, vendaId: venda.id, negocioId: negocio.id };
}
