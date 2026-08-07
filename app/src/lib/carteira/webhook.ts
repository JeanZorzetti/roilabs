// A ordem obrigatória do contrato do webhook (012), em um lugar só.
// Contrato: specs/012-carteira-cadeiras-ecommerce/contracts/webhook-carteira.md
//
// Por que não vive dentro do route.ts: o contrato exige provar "401 E NENHUMA LINHA
// GRAVADA" e "falha ao consultar → 5xx, nada gravado". Isso só se prova se o teste puder
// OBSERVAR as escritas — daí as dependências entrarem por parâmetro. Não é abstração
// especulativa: são dois chamadores reais (a rota e test/webhook-carteira.test.mjs).

import { log } from '@/lib/log';
import { sendAlert, escapeHtml } from '@/lib/email';
import { adaptadorDe } from '@/lib/carteira/adaptadores';
import { resolverCredencial } from '@/lib/carteira/credenciais';
import { registrarVenda } from '@/lib/carteira/registrar-venda';

// ponytail: dedupe em memória, uma hora por (gateway, parceiro). Sem ele, um gateway
// reenviando em loop com segredo derivado vira milhares de e-mails e o alerta que
// importa se perde no meio. Teto: é POR INSTÂNCIA — com várias réplicas, um alerta por
// réplica por hora. Upgrade se incomodar: chave no banco ou no Redis.
const ULTIMO_ALERTA = new Map<string, number>();
const JANELA_MS = 60 * 60 * 1000;

function alertarAssinaturaInvalida(gateway: string, parceiroId: string) {
  const chave = `${gateway}:${parceiroId}`;
  const agora = Date.now();
  if (agora - (ULTIMO_ALERTA.get(chave) ?? 0) < JANELA_MS) return;
  ULTIMO_ALERTA.set(chave, agora);
  // Fire-and-forget: efeito colateral nunca derruba o webhook (contrato, passo 7).
  sendAlert(
    `🔴 Carteira: assinatura inválida — ${escapeHtml(gateway)}/${escapeHtml(parceiroId)}`,
    `<p>O webhook da carteira recusou uma notificação de <strong>${escapeHtml(gateway)}</strong>
      para o parceiro <strong>${escapeHtml(parceiroId)}</strong>.</p>
     <p>São duas causas possíveis, e uma delas é cara:</p>
     <ul>
       <li><strong>O segredo derivou do painel do parceiro.</strong> Neste caso as vendas
           dele PARARAM de ser gravadas — em silêncio. Conferir a env apontada por
           <code>segredoRef</code> contra o painel do gateway.</li>
       <li>Alguém está forjando notificações. Nada foi gravado.</li>
     </ul>
     <p>Este alerta se repete no máximo 1×/hora por parceiro.</p>`,
  );
}

export interface RespostaWebhook {
  http: 200 | 401 | 404 | 409 | 502;
  corpo: Record<string, unknown>;
}

export interface DepsWebhook {
  adaptadorDe: typeof adaptadorDe;
  resolverCredencial: typeof resolverCredencial;
  registrarVenda: typeof registrarVenda;
}

const DEPS_PADRAO: DepsWebhook = { adaptadorDe, resolverCredencial, registrarVenda };

export async function processarWebhook(
  gateway: string,
  parceiroId: string,
  req: { headers: Headers; url: string; text: () => Promise<string> },
  deps: DepsWebhook = DEPS_PADRAO,
): Promise<RespostaWebhook> {
  const adaptador = deps.adaptadorDe(gateway);
  if (!adaptador) return { http: 404, corpo: { error: 'gateway desconhecido' } };

  // ── Passo 1: resolver a credencial. SEM ler o corpo. ──────────────────────
  const credencial = await deps.resolverCredencial(gateway, parceiroId);
  if (!credencial) {
    log.warn({ gateway, parceiroId }, 'carteira: credencial inexistente, inativa ou sem env');
    return { http: 404, corpo: { error: 'credencial não encontrada' } };
  }

  // O corpo CRU, uma vez: a assinatura do Stripe é sobre os BYTES, e reserializar o JSON a
  // invalidaria. Ler o corpo não é "tocar estado" — nada é persistido até o passo 5.
  const corpoCru = await req.text();
  const ctx = { headers: req.headers, url: new URL(req.url), corpoCru };

  // ── Passo 2: verificar a assinatura. NADA de estado tocado até aqui (FR-003a). ──
  if (!adaptador.verificarAssinatura(ctx, credencial.segredo)) {
    // ⚠️ ESTE É O ÚNICO SINAL de que o segredo derivou do painel do parceiro. Quando isso
    // acontece a venda para de ser gravada EM SILÊNCIO — nada quebra, nada falha, e a
    // receita simplesmente não aparece. Log NÃO basta: ninguém lê log de rotina, por isso
    // vai alerta junto (T035).
    log.warn({ gateway, parceiroId }, 'carteira: assinatura inválida');
    alertarAssinaturaInvalida(gateway, parceiroId);
    return { http: 401, corpo: { error: 'assinatura inválida' } };
  }

  // ── Passo 3: consultar o gateway. O corpo nunca é fonte de verdade (FR-003b). ──
  let entrada;
  try {
    entrada = await adaptador.consultar(ctx, credencial.token);
  } catch (err) {
    // Falha ao consultar é o ÚNICO caso que pede reenvio.
    log.error({ err, gateway, parceiroId }, 'carteira: falha ao consultar o gateway');
    return { http: 502, corpo: { error: 'falha ao consultar o gateway' } };
  }

  // ⚠️ 200 para evento irrelevante é DELIBERADO: devolver erro faria o gateway reenviar
  // para sempre um evento que nunca vai importar.
  if (!entrada) return { http: 200, corpo: { ok: true, ignorado: true } };

  // ── Passos 4-6: conferir a conta, gravar, e originar o negócio. ───────────
  const r = await deps.registrarVenda(entrada, credencial);
  return {
    http: r.http,
    corpo: {
      ok: r.ok,
      retry: r.retry,
      vendaId: r.vendaId,
      negocioId: r.negocioId,
      motivo: r.motivoDescarte,
    },
  };
}
