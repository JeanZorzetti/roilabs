import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { log } from '@/lib/log';
import { chamar } from '@/lib/dataforseo';
import { normalizar } from '@/lib/projecao';

// 017 — sugestões do campo de cidade da Projeção. A lista de locais do Brasil da DataForSEO é grátis;
// só aceitamos na consulta o `codigo` que esta rota devolveu (research D12).
export const dynamic = 'force-dynamic';

type LocalBr = { location_code: number; location_name: string; location_type: string };
type Local = { codigo: number; nome: string; tipo: string; chave: string; cidade: string };

// ponytail: a lista fica na memória do processo por 24 h e some a cada deploy. Custa zero (a chamada
// é grátis). Upgrade: arquivo estático no repo, se a lista pesar.
let cache: { em: number; locais: Local[] } | null = null;
const DIA = 24 * 60 * 60 * 1000;
const PRIORIDADE: Record<string, number> = { City: 0, State: 1 };

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ locais: [], erro: 'sessao' }, { status: 401 });

  const q = normalizar(req.nextUrl.searchParams.get('q') ?? '');
  if (q.length < 2) return NextResponse.json({ locais: [] });

  if (!cache || Date.now() - cache.em > DIA) {
    const r = await chamar('keywords_data/google_ads/locations/br');
    if (!r.ok) {
      log.error({ err: r.mensagem, statusCode: r.statusCode }, 'projecao/cidades: lista de locais falhou');
      // 503, não 502: a EasyPanel engole o 502 do app (ver erroDataForSEO).
      return NextResponse.json({ locais: [], erro: 'fonte' }, { status: 503 });
    }
    cache = {
      em: Date.now(),
      locais: (r.tarefa.result as LocalBr[]).map((l) => ({
        codigo: l.location_code,
        nome: l.location_name,
        tipo: l.location_type,
        chave: normalizar(l.location_name),
        cidade: normalizar(l.location_name.split(',')[0]),
      })),
    };
  }

  // "Goi" casa com toda cidade "…,State of Goias": o nome que COMEÇA com o texto vem antes.
  const ordem = (l: Local) => (l.cidade.startsWith(q) ? 0 : l.cidade.includes(q) ? 1 : 2);
  const locais = cache.locais
    .filter((l) => l.chave.includes(q))
    .sort(
      (a, b) =>
        ordem(a) - ordem(b) ||
        (PRIORIDADE[a.tipo] ?? 2) - (PRIORIDADE[b.tipo] ?? 2) ||
        a.nome.length - b.nome.length,
    )
    .slice(0, 10)
    .map(({ codigo, nome, tipo }) => ({ codigo, nome, tipo }));
  return NextResponse.json({ locais });
}
