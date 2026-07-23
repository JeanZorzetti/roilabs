// Cotação de frete NACIONAL para fitas (011), via Melhor Envio. `frete.ts` (tabela
// estática da Grande Goiânia) é de porcelanato e NÃO é tocado (FR-017).
//
// ponytail: um módulo, uma implementação. Sem camada de abstração de transportadora —
// trocar de provedor (ex.: Frenet, se o Tapepro tiver contrato próprio) é reescrever
// este arquivo, não implementar uma interface para um único produto.
//
// 011.1: enquanto o Melhor Envio não está configurado, cotarFrete cai em estimarFrete()
// (estimativa calibrável) em vez de devolver "a combinar". Ver estimarFrete abaixo.
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

// ── Estimativa de frete (011.1) ────────────────────────────────────────────────
// Enquanto o Melhor Envio não está ligado (sem MELHOR_ENVIO_TOKEN), o frete é ESTIMADO em
// vez de "a combinar" — a pedido do operador. Modelo: base + R$/kg × peso × fator de região,
// origem em Goiânia (CEP 74934-577, região 7 / Centro-Oeste). Quando o token entrar no
// EasyPanel, cotarFrete volta a cotar de verdade e esta estimativa fica dormente.
//
// ⚠️ TODOS os números abaixo são KNOBS DE OPERADOR (estimativa calibrável, como o peso em
// precos-fitas.ts). Frete subestimado é prejuízo silencioso — calibrar contra fretes reais.
const EST_BASE = 20; // R$ fixo por envio (manuseio + mínimo)
const EST_RS_POR_KG = 3.5; // R$ por kg antes do fator de distância

/**
 * Banda de distância a partir de Goiânia (origem 74934-577), pelo prefixo de 3 DÍGITOS do
 * CEP de destino — nível estado. O 1º dígito sozinho não serve: Goiânia (74x) e Palmas (77x)
 * caem no mesmo "7" e sairiam iguais, apesar de 700 km e estados diferentes.
 * ⚠️ fator/dias são KNOBS DE OPERADOR — calibrar contra fretes reais. Prefixo desconhecido
 * assume DISTANTE (nunca a menor tarifa: subestimar frete é prejuízo silencioso).
 */
function bandaFrete(cep: string): { fator: number; dias: number } {
  const p = Number(cep.slice(0, 3)); // 000–999
  const em = (a: number, b: number) => p >= a && p <= b;
  if (em(700, 767)) return { fator: 1.0, dias: 3 }; // DF + GO (entorno da origem)
  if (em(768, 769)) return { fator: 2.4, dias: 12 }; // RO (dentro do 76, mas é Norte)
  if (em(770, 799)) return { fator: 1.3, dias: 5 }; // TO / MT / MS
  if (em(300, 399)) return { fator: 1.3, dias: 5 }; // MG
  if (em(10, 299)) return { fator: 1.5, dias: 6 }; // SP / RJ / ES
  if (em(800, 879)) return { fator: 1.5, dias: 6 }; // PR
  if (em(880, 999)) return { fator: 1.8, dias: 8 }; // SC / RS
  if (em(400, 599)) return { fator: 2.0, dias: 9 }; // Nordeste (BA/SE/PE/AL/PB/RN)
  if (em(600, 699)) return { fator: 2.4, dias: 12 }; // Norte + NE norte (CE/PI/MA/PA/AM/RR/AP/AC)
  return { fator: 2.0, dias: 9 };
}

/**
 * Estimativa PURA (sem I/O). Cobre todo o Brasil — não existe "CEP não atendido" de verdade
 * aqui, só CEP malformado. Peso vem da carga derivada do slug, nunca do cliente (FR-006).
 */
export function estimarFrete(cepDestino: string, itens: Array<{ slug: string; rolos: number }>): Cotacao {
  const cep = (cepDestino || '').replace(/\D/g, '');
  if (cep.length !== 8) return { ok: false, motivo: 'cep_nao_atendido' };
  const carga = cargaDoCarrinho(itens);
  if (!carga) return { ok: false, motivo: 'falha_tecnica' };
  const { fator, dias } = bandaFrete(cep);
  const valor = Math.round((EST_BASE + EST_RS_POR_KG * carga.pesoKg * fator) * 100) / 100;
  return { ok: true, valor, prazo: `~${dias} dias úteis`, servico: 'Frete estimado' };
}

/**
 * DIAGNÓSTICO TEMPORÁRIO (011.1) — expõe a resposta CRUA do Melhor Envio para descobrir por
 * que os serviços não cotam (conta sem transportadora, sandbox, dimensão/peso). NÃO vaza o
 * token: só presença + tamanho. REMOVER depois de resolver a cotação.
 */
export async function cotarFreteDebug(cepDestino: string, itens: Array<{ slug: string; rolos: number }>) {
  const cep = (cepDestino || '').replace(/\D/g, '');
  const origem = (process.env.MELHOR_ENVIO_CEP_ORIGEM || '74934577').replace(/\D/g, '');
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const base = (process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br').replace(/\/$/, '');
  const carga = cargaDoCarrinho(itens);
  const cfg = { hasToken: !!token, tokenLen: (token || '').length, base, origem, cep, carga };
  if (!token || !carga) return { cfg, erro: 'sem token ou carga' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ROI Labs (parceria@roilabs.com.br)',
      },
      body: JSON.stringify({
        from: { postal_code: origem },
        to: { postal_code: cep },
        package: { height: carga.alturaCm, width: carga.larguraCm, length: carga.comprimentoCm, weight: carga.pesoKg },
      }),
      signal: ctrl.signal,
    });
    const txt = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(txt);
    } catch {
      json = null;
    }
    return { cfg, status: res.status, body: json ?? txt.slice(0, 600) };
  } catch (e) {
    return { cfg, erro: String(e) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Cota o carrinho. Peso e dimensões saem de `precos-fitas.ts` a partir do slug —
 * nenhum dado de carga vem do cliente (FR-006). `null` de carga ⇒ carrinho sem SKU
 * cotável, que o chamador trata como `vazio` antes de chegar aqui.
 */
export async function cotarFrete(cepDestino: string, itens: Array<{ slug: string; rolos: number }>): Promise<Cotacao> {
  const cep = (cepDestino || '').replace(/\D/g, '');
  // CEP de despacho do Tapepro (74934-577, Goiânia) como default — assim ligar o Melhor
  // Envio pede só MELHOR_ENVIO_TOKEN (+ BASE_URL se produção). Override por env se mudar.
  const origem = (process.env.MELHOR_ENVIO_CEP_ORIGEM || '74934577').replace(/\D/g, '');
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const base = (process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br').replace(/\/$/, '');

  if (cep.length !== 8) return { ok: false, motivo: 'cep_nao_atendido' };

  // Melhor Envio ainda não ligado ⇒ ESTIMATIVA (011.1), não "a combinar". Log em info, não
  // error: é o modo esperado até o token entrar no EasyPanel, não um incidente — e não pode
  // disparar o alerta de contingência (que existe para credencial errada, não para "sem
  // credencial ainda"). Quando o token existir, cai no caminho real abaixo.
  if (!token || origem.length !== 8) {
    log.info({ cep }, 'frete-fitas: sem MELHOR_ENVIO_TOKEN/CEP_ORIGEM — usando estimativa (011.1)');
    return estimarFrete(cep, itens);
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
