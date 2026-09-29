import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { log } from '@/lib/log';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { NICHOS } from '@/lib/precificacao';
import { chamar, type RespostaDataForSEO } from '@/lib/dataforseo';
import { limparTermos, normalizar, validarTermos, type TermoConsultado } from '@/lib/projecao';

// 017 — a consulta paga da Projeção (contracts/api.md). Dificuldade primeiro, volume depois: se a
// chamada barata falhar, a cara não acontece (research D2). A consulta que dá certo é guardada no
// histórico (018, FR-001); se a gravação falhar, a resposta sai do mesmo jeito com `id: null`.
export const dynamic = 'force-dynamic';

const BRASIL = { codigo: 2076, nome: 'Brasil' };

type Mes = { year: number; month: number; search_volume: number | null };
type ItemVolume = { keyword: string; search_volume: number | null; monthly_searches: Mes[] | null };
type ItemDificuldade = { keyword: string; keyword_difficulty: number | null };

const usd = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const ym = (m: Mes) => `${m.year}-${String(m.month).padStart(2, '0')}`;

function mensagemDeFalha(r: Extract<RespostaDataForSEO, { ok: false }>, custoJaPago: number): string {
  // Na etapa do volume a dificuldade já foi cobrada; na da dificuldade, nada foi.
  const cobranca = custoJaPago > 0 ? ` A dificuldade já foi cobrada (US$ ${usd(custoJaPago)}).` : ' Nada foi cobrado nesta tentativa.';
  if (r.erro === 'chave') {
    return r.statusCode === null
      ? 'A chave da DataForSEO não está configurada no servidor. Configure DATAFORSEO_API_KEY na EasyPanel.'
      : 'A DataForSEO recusou a chave configurada no servidor. Confira DATAFORSEO_API_KEY na EasyPanel.';
  }
  if (r.erro === 'saldo') return `Acabou o saldo da DataForSEO. Recarregue a conta e consulte de novo.${cobranca}`;
  if (r.statusCode !== null && r.statusCode < 50000) return `A DataForSEO recusou a consulta (${r.mensagem}).${cobranca}`;
  return `A DataForSEO não respondeu (${r.mensagem}). Tente de novo em 1 minuto.${cobranca}`;
}

function falhou(r: Extract<RespostaDataForSEO, { ok: false }>, etapa: 'dificuldade' | 'volume', custoJaPago: number) {
  // Nunca a chave, nem os termos: eles contam a estratégia do parceiro.
  log.error({ err: r.mensagem, etapa, statusCode: r.statusCode }, `projecao/consultar: ${etapa} falhou`);
  return NextResponse.json({ erro: r.erro, mensagem: mensagemDeFalha(r, custoJaPago) }, { status: r.http });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ erro: 'sessao', mensagem: 'Sua sessão expirou. Entre de novo para consultar.' }, { status: 401 });
  }

  const corpo = await req.json().catch(() => null);
  if (!Array.isArray(corpo?.termos) || corpo.termos.some((t: unknown) => typeof t !== 'string')) {
    return NextResponse.json({ erro: 'entrada', mensagem: 'Cole a lista de termos, um por linha.' }, { status: 400 });
  }
  const { termos, removidos } = limparTermos(corpo.termos);
  const invalido = validarTermos(termos);
  if (invalido) return NextResponse.json({ erro: 'entrada', mensagem: invalido.mensagem }, { status: 400 });

  const l = corpo.local;
  const local =
    Number.isInteger(l?.codigo) && l.codigo > 0 && typeof l?.nome === 'string' && l.nome.length <= 200
      ? { codigo: l.codigo as number, nome: l.nome as string }
      : BRASIL;

  // 018: o nicho e o nome vão para o histórico. Validados antes de pagar.
  if (!NICHOS.some((n) => n.id === corpo.nicho)) {
    return NextResponse.json({ erro: 'entrada', mensagem: 'Escolha um nicho da lista.' }, { status: 400 });
  }
  const paraQuem = typeof corpo.paraQuem === 'string' ? corpo.paraQuem.replace(/\s+/g, ' ').trim() : '';
  if (paraQuem.length > 80) {
    return NextResponse.json(
      { erro: 'entrada', mensagem: `"Para quem" tem ${paraQuem.length} caracteres; o limite é 80.` },
      { status: 400 },
    );
  }

  // 1. Dificuldade: sempre nacional (a base do Labs não corta por cidade).
  const kd = await chamar('dataforseo_labs/google/bulk_keyword_difficulty/live', [
    { keywords: termos, location_code: BRASIL.codigo, language_code: 'pt' },
  ]);
  if (!kd.ok) return falhou(kd, 'dificuldade', 0);

  // 2. Volume, na região pedida.
  const vol = await chamar('keywords_data/google_ads/search_volume/live', [
    { keywords: termos, location_code: local.codigo, language_code: 'pt' },
  ]);
  if (!vol.ok) return falhou(vol, 'volume', kd.custo);

  // 3. Junta pelo texto normalizado: o Google Ads pode devolver o termo em minúsculas.
  const dificuldades = new Map<string, number | null>();
  for (const bloco of kd.tarefa.result as { items: ItemDificuldade[] | null }[]) {
    for (const it of bloco?.items ?? []) dificuldades.set(normalizar(it.keyword), it.keyword_difficulty ?? null);
  }
  const volumes = new Map<string, ItemVolume>();
  for (const it of vol.tarefa.result as ItemVolume[]) volumes.set(normalizar(it.keyword), it);

  let de: string | null = null;
  let ate: string | null = null;
  const consultados: TermoConsultado[] = termos.map((termo) => {
    const chave = normalizar(termo);
    const v = volumes.get(chave);
    const meses = [...(v?.monthly_searches ?? [])].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
    if (meses.length) {
      if (!de || ym(meses[0]) < de) de = ym(meses[0]);
      if (!ate || ym(meses.at(-1)!) > ate) ate = ym(meses.at(-1)!);
    }
    return {
      termo,
      volume: v?.search_volume ?? null,
      mensal: meses.length ? meses.map((m) => m.search_volume ?? 0) : null,
      dificuldade: dificuldades.get(chave) ?? null,
    };
  });

  const resposta = {
    termos: consultados,
    janela: de && ate ? ({ de, ate } as { de: string; ate: string }) : null,
    local,
    custoUsd: kd.custo + vol.custo,
    consultadoEm: new Date().toISOString(),
    removidos,
  };

  // 4. Guarda (018). A DataForSEO já cobrou: falhar aqui não pode esconder a resposta.
  let id: string | null = null;
  try {
    ({ id } = await prisma.consultaProjecao.create({
      data: {
        criadaEm: new Date(resposta.consultadoEm),
        paraQuem: paraQuem || null,
        nichoId: corpo.nicho,
        localCodigo: local.codigo,
        localNome: local.nome,
        termos: consultados as unknown as Prisma.InputJsonValue, // interface sem assinatura de índice
        janelaDe: resposta.janela?.de ?? null,
        janelaAte: resposta.janela?.ate ?? null,
        removidos,
        custoUsd: resposta.custoUsd,
      },
      select: { id: true },
    }));
  } catch (err) {
    log.error({ err: err instanceof Error ? err.message : String(err), etapa: 'gravar' }, 'projecao/consultar: não guardou');
  }

  return NextResponse.json({ ...resposta, id });
}
