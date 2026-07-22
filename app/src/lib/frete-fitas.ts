// Cotação de frete NACIONAL para fitas (011), via Melhor Envio. `frete.ts` (tabela
// estática da Grande Goiânia) é de porcelanato e NÃO é tocado (FR-017).
//
// ponytail: um módulo, uma implementação. Sem camada de abstração de transportadora —
// trocar de provedor (ex.: Frenet, se o Tapepro tiver contrato próprio) é reescrever
// este arquivo, não implementar uma interface para um único produto.
//
// Constituição I: falha de cotação em produção investiga-se NESTA ordem —
// MELHOR_ENVIO_TOKEN, MELHOR_ENVIO_BASE_URL, MELHOR_ENVIO_CEP_ORIGEM. Só depois, o código.
import { cargaDoCarrinho } from '@/lib/precos-fitas';
import { log } from '@/lib/log';

/** Timeout deliberado: margem para o SC-010 (5s ponta a ponta) sobrar. */
const TIMEOUT_MS = 4000;

export type MotivoFrete = 'cep_nao_atendido' | 'falha_tecnica';

export type Cotacao =
  | { ok: true; valor: number; prazo: string; servico: string }
  | { ok: false; motivo: MotivoFrete };

type ServicoRaw = {
  name?: unknown;
  price?: unknown;
  custom_price?: unknown;
  delivery_time?: unknown;
  company?: { name?: unknown } | null;
  error?: unknown;
};

const num = (v: unknown): number => (typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN);

/**
 * FUNÇÃO PURA — resposta crua do provedor → cotação. Sem I/O, testável isoladamente.
 *
 * Escolhe o serviço mais barato entre os que cotaram. Serviço com `error` é o jeito do
 * Melhor Envio dizer "não atendo este CEP/esta carga" — ele vem no array junto dos que
 * deram certo, então filtrar é obrigatório antes de decidir qualquer coisa.
 */
export function mapearResposta(raw: unknown): Cotacao {
  if (!Array.isArray(raw)) return { ok: false, motivo: 'falha_tecnica' }; // JSON ilegível

  const validos = (raw as ServicoRaw[])
    .filter((s) => s && !s.error)
    .map((s) => ({
      valor: num(s.custom_price ?? s.price),
      prazo: Number(s.delivery_time),
      servico: [s.company?.name, s.name].filter((x) => typeof x === 'string' && x).join(' ') || 'Transportadora',
    }))
    .filter((s) => Number.isFinite(s.valor) && s.valor > 0);

  // Nenhum serviço cotou, mas a resposta é legível ⇒ o provedor respondeu "não cubro".
  // Isso é operação normal, NÃO incidente — a distinção é o que evita alerta-ruído (FR-034).
  if (validos.length === 0) {
    const houveResposta = (raw as ServicoRaw[]).length > 0;
    return { ok: false, motivo: houveResposta ? 'cep_nao_atendido' : 'falha_tecnica' };
  }

  const melhor = validos.reduce((a, b) => (b.valor < a.valor ? b : a));
  const dias = Number.isFinite(melhor.prazo) && melhor.prazo > 0 ? melhor.prazo : null;
  return {
    ok: true,
    valor: Math.round(melhor.valor * 100) / 100,
    prazo: dias ? `${dias} dia(s) útil(eis)` : 'a confirmar',
    servico: melhor.servico,
  };
}

/**
 * Cota o carrinho. Peso e dimensões saem de `precos-fitas.ts` a partir do slug —
 * nenhum dado de carga vem do cliente (FR-006). `null` de carga ⇒ carrinho sem SKU
 * cotável, que o chamador trata como `vazio` antes de chegar aqui.
 */
export async function cotarFrete(cepDestino: string, itens: Array<{ slug: string; rolos: number }>): Promise<Cotacao> {
  const cep = (cepDestino || '').replace(/\D/g, '');
  const origem = (process.env.MELHOR_ENVIO_CEP_ORIGEM || '').replace(/\D/g, '');
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const base = (process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br').replace(/\/$/, '');

  if (cep.length !== 8) return { ok: false, motivo: 'cep_nao_atendido' };

  // Env var faltando é falha técnica — e é o modo de falha mais caro da feature (FR-035),
  // então precisa do log que diz QUAL delas, não só "quebrou".
  if (!token || origem.length !== 8) {
    log.error(
      { temToken: !!token, cepOrigemOk: origem.length === 8, cep },
      'frete-fitas: env var ausente/inválida (MELHOR_ENVIO_TOKEN / MELHOR_ENVIO_CEP_ORIGEM)',
    );
    return { ok: false, motivo: 'falha_tecnica' };
  }

  const carga = cargaDoCarrinho(itens);
  if (!carga) return { ok: false, motivo: 'falha_tecnica' };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ROI Labs (parceria@roilabs.com.br)', // exigido pelo Melhor Envio
      },
      body: JSON.stringify({
        from: { postal_code: origem },
        to: { postal_code: cep },
        package: {
          height: carga.alturaCm,
          width: carga.larguraCm,
          length: carga.comprimentoCm,
          weight: carga.pesoKg,
        },
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      log.error({ status: res.status, cep }, 'frete-fitas: provedor respondeu erro HTTP');
      return { ok: false, motivo: 'falha_tecnica' };
    }

    const r = mapearResposta(await res.json());
    if (!r.ok && r.motivo === 'falha_tecnica') {
      log.error({ cep, status: res.status }, 'frete-fitas: resposta ilegível do provedor');
    }
    return r;
  } catch (err) {
    // AbortError (timeout) e falha de rede caem aqui — os dois são incidente.
    log.error({ err, cep }, 'frete-fitas: cotação falhou (timeout ou rede)');
    return { ok: false, motivo: 'falha_tecnica' };
  } finally {
    clearTimeout(timer);
  }
}
