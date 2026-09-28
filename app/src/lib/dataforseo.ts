// Cliente mínimo da DataForSEO (017). Existe porque as duas rotas de /api/projecao o usam.
// DATAFORSEO_API_KEY (Basic = base64 de login:senha) só é lida aqui, no servidor, e nunca entra
// em mensagem nem em log: o repo é público.
import { erroDataForSEO, type ErroFonte } from './projecao';

const BASE = 'https://api.dataforseo.com/v3/';

// Status 20000 = ok, no topo da resposta e em cada tarefa.
interface Tarefa {
  status_code: number;
  status_message: string;
  cost?: number;
  result: unknown[] | null;
}
interface Corpo {
  status_code: number;
  status_message: string;
  cost?: number;
  tasks?: Tarefa[];
}

export type RespostaDataForSEO =
  | { ok: true; tarefa: Tarefa & { result: unknown[] }; custo: number }
  | { ok: false; erro: ErroFonte; http: 503 | 402 | 502; statusCode: number | null; mensagem: string };

const falha = (statusCode: number | null, mensagem: string): RespostaDataForSEO => ({
  ok: false,
  ...(statusCode ? erroDataForSEO(statusCode) : { erro: 'fonte' as const, http: 502 as const }),
  statusCode,
  mensagem,
});

/** POST quando há corpo, GET quando não há. Devolve a 1ª tarefa ou o erro já traduzido. */
export async function chamar(caminho: string, corpo?: unknown): Promise<RespostaDataForSEO> {
  const chave = process.env.DATAFORSEO_API_KEY?.trim();
  if (!chave) return { ok: false, erro: 'chave', http: 503, statusCode: null, mensagem: 'DATAFORSEO_API_KEY ausente' };

  let res: Response;
  let json: Corpo | null;
  try {
    res = await fetch(BASE + caminho, {
      method: corpo === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Basic ${chave}`, 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: AbortSignal.timeout(60_000), // o live da DataForSEO corta em 120 s
      cache: 'no-store',
    });
    json = await res.json().catch(() => null);
  } catch (err) {
    const tempo = err instanceof Error && err.name === 'TimeoutError';
    return falha(null, tempo ? 'sem resposta em 60 s' : 'falha de rede');
  }

  if (!json) return falha(res.status === 401 ? 40100 : res.status === 402 ? 40200 : null, `HTTP ${res.status}`);
  if (json.status_code !== 20000) return falha(json.status_code, json.status_message);
  const tarefa = json.tasks?.[0];
  if (!tarefa || tarefa.status_code !== 20000) {
    return falha(tarefa?.status_code ?? null, tarefa?.status_message ?? 'resposta sem tarefa');
  }
  if (!Array.isArray(tarefa.result)) return falha(null, 'tarefa sem resultado');
  return { ok: true, tarefa: { ...tarefa, result: tarefa.result }, custo: Number(json.cost ?? tarefa.cost ?? 0) };
}
