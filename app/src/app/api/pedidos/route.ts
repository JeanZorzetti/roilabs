import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { isAuthed } from '@/lib/auth';
import { getProduto } from '@/lib/precos';
import { calcFrete, type Entrega } from '@/lib/frete';
import { precoPorQuantidade, temPrecoPublico } from '@/lib/precos-fitas';
import { cotarFrete } from '@/lib/frete-fitas';
import { getProdutoAssinatura } from '@/lib/precos-assinatura';
import { validarCupom } from '@/lib/cupons';
import { createPreference } from '@/lib/mercadopago';
import { normalizarDoc, validarDoc } from '@/lib/doc';
import { sendAlert } from '@/lib/email';
import { log } from '@/lib/log';
import { getLoja } from '@/lib/lojas';

export const dynamic = 'force-dynamic';

const cap = (v: FormDataEntryValue | null, max: number) =>
  (typeof v === 'string' ? v.trim() : '').slice(0, max);

const money = (n: number) => Math.round(n * 100) / 100;

function backTo(origin: string, erro: string, cadeira: string = 'porcelanato') {
  const base = origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br';
  // O site-goiania novo unificou a rota em /carrinho (suporta qualquer cadeira por URL/localStorage)
  return NextResponse.redirect(`${base}/carrinho?erro=${erro}`, 303);
}

const ALERTA_FRETE_LIMIAR = 3;

// Public checkout: the static cart POSTs here (urlencoded, no preflight). 303 → Mercado Pago.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const origin = cap(form.get('origin'), 300); // static site base, for redirects back
  
  // Lê a cadeira do carrinho (fallback pro legado caso o front não envie cadeira)
  const cadeiraId = cap(form.get('cadeira'), 50) || cap(form.get('vertical'), 50) || 'porcelanato';
  
  const loja = getLoja(cadeiraId);
  if (!loja) return backTo(origin, 'vazio', cadeiraId);
  if (!loja.publicada) return backTo(origin, 'indisponivel', cadeiraId);
  if (!loja.modoCobranca) return backTo(origin, 'sem_cobranca', cadeiraId);

  // Honeypot + LGPD consent (FR-008 boundary).
  if (cap(form.get('botcheck'), 100) || form.get('consent') !== '1') {
    return backTo(origin, 'validacao', cadeiraId);
  }

  const nome = cap(form.get('nome'), 200);
  const whatsapp = cap(form.get('whatsapp'), 40);
  if (!nome || !whatsapp) return backTo(origin, 'validacao', cadeiraId);

  const docDigits = normalizarDoc(cap(form.get('compradorDoc'), 20));
  if (loja.docObrigatorio && !validarDoc(docDigits)) {
    return backTo(origin, 'documento', cadeiraId);
  }
  const compradorDoc = validarDoc(docDigits) ? docDigits : null;

  // ── Parse dos Itens ────────────────────────────────────────────────────────

  let parsed: unknown;
  try {
    parsed = JSON.parse(cap(form.get('itens'), 5000) || '[]');
  } catch {
    return backTo(origin, 'vazio', cadeiraId);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return backTo(origin, 'vazio', cadeiraId);

  const crus = parsed.map((i: any) => ({
    slug: typeof i?.slug === 'string' ? i.slug : '',
    quantidade: Math.max(0, Number(i?.quantidade) || 0),
  })).filter(i => i.slug && i.quantidade > 0);

  if (crus.length === 0) return backTo(origin, 'vazio', cadeiraId);

  // ⚠️ TIPADO de propósito. Enquanto era `[]` (inferido `any[]`), o `create` do Prisma
  // recebia `caixas`/`m2`/`precoM2` — colunas que a 013 tirou do schema — e o compilador
  // não via nada. Todo pedido novo estouraria em runtime, no caminho de dinheiro.
  interface ItemNovo {
    slug: string;
    unidade: string;
    quantidade: number;
    precoUnitario: number;
    detalhe: Prisma.InputJsonValue;
    subtotal: number;
    recorrencia?: string | null;
    assinaturaEstado?: string | null;
  }
  const itens: ItemNovo[] = [];

  // Dispatch mínimo de precificação baseado na unidade da loja (T017)
  for (const i of crus) {
    if (loja.unidade === 'm2') {
      const p = getProduto(i.slug);
      if (!p) return backTo(origin, 'vazio', cadeiraId);
      
      const caixas = Math.floor(i.quantidade);
      if (caixas < 1) continue;
      
      const m2 = money(caixas * p.m2_caixa);
      const subtotal = money(m2 * p.preco);
      
      itens.push({
        slug: i.slug,
        unidade: 'm2',
        quantidade: m2,
        precoUnitario: p.preco,
        detalhe: { caixas, m2PorCaixa: p.m2_caixa },
        subtotal,
      });
    } else if (loja.unidade === 'rolo') {
      if (!temPrecoPublico(i.slug)) return backTo(origin, 'item_orcamento', cadeiraId);
      
      const rolos = Math.floor(i.quantidade);
      const faixa = precoPorQuantidade(i.slug, rolos);
      if (!faixa) return backTo(origin, 'minimo', cadeiraId);
      
      const subtotal = money(rolos * faixa.precoRolo);
      itens.push({
        slug: i.slug,
        unidade: 'rolo',
        quantidade: rolos,
        precoUnitario: faixa.precoRolo,
        detalhe: { faixaMin: faixa.min, faixaMax: faixa.max },
        subtotal,
      });
    } else if (loja.unidade === 'assinatura') {
      const p = getProdutoAssinatura(i.slug);
      if (!p) return backTo(origin, 'vazio', cadeiraId);

      // Um item = um ciclo (T016j). `quantidade` do carrinho é ignorada de propósito:
      // a unidade assinatura não empilha ciclos, cobra só o 1º — a 014 amarra recorrência
      // de verdade no gateway.
      itens.push({
        slug: i.slug,
        unidade: 'assinatura',
        quantidade: 1,
        precoUnitario: p.preco,
        detalhe: {},
        subtotal: p.preco,
        recorrencia: loja.recorrencia ?? null,
        assinaturaEstado: 'ativa',
      });
    }
  }

  if (itens.length === 0) return backTo(origin, 'vazio', cadeiraId);

  // ── Linha Fixa (ex: clichê de fita) ────────────────────────────────────────

  if (loja.linhaFixa) {
    if (itens.some((i) => i.slug === loja.linhaFixa!.quandoSlug)) {
      let isento = false;
      if (loja.linhaFixa.isentoSeJaComprou && compradorDoc) {
        // Busca se já produziu no passado na mesma cadeira
        const jaProduziu = await prisma.pedido.findFirst({
          where: {
            compradorDoc,
            statusPagamento: 'pago',
            // Agora a busca é na tabela unificada (itens), usando a unidade (risco #3 do research.md mitigado)
            itens: { some: { slug: loja.linhaFixa.quandoSlug, unidade: loja.unidade } },
          },
          select: { id: true },
        });
        isento = !!jaProduziu;
      }
      
      if (!isento) {
        itens.push({
          slug: loja.linhaFixa.slug,
          unidade: loja.unidade, // herda a unidade da loja, mesmo sendo 1 rolo/1 item abstrato
          quantidade: 1,
          precoUnitario: loja.linhaFixa.valor,
          detalhe: { isencao: false },
          subtotal: loja.linhaFixa.valor,
        });
      }
    }
  }

  const totalProduto = money(itens.reduce((s, i) => s + i.subtotal, 0));

  // ── Frete ──────────────────────────────────────────────────────────────────

  const cep = cap(form.get('cep'), 12) || null;
  const entregaInput = (cap(form.get('entrega'), 20) || 'retirada');
  
  let frete = null;
  let freteMotivo = null;
  let entrega = 'retirada'; // default
  
  if (loja.frete !== 'nenhum' && entregaInput === 'entrega') {
    if (loja.frete === 'tabela-cep') {
      frete = calcFrete('entrega', cep);
      entrega = frete === null ? 'a_combinar' : 'entrega';
    } else if (loja.frete === 'cotacao') {
      // Para fitas, a cotação depende do peso abstrato
      // Nesta cadeira a `quantidade` JÁ é a contagem de rolos — `detalhe` aqui guarda a
      // faixa de preço, não caixas. Ler `detalhe.caixas` era herança do ramo de porcelanato.
      const rolosParaCotar = itens.map((i) => ({ slug: i.slug, rolos: Math.floor(i.quantidade) }));
      const cot = await cotarFrete(cep ?? '', rolosParaCotar);
      frete = cot.ok ? cot.valor : null;
      freteMotivo = cot.ok ? null : cot.motivo;
      entrega = cot.ok ? 'entrega' : 'a_combinar';
    }
  }

  // ── Cupom ──────────────────────────────────────────────────────────────────

  const cupomInput = cap(form.get('cupom'), 40);
  const rRaw = cupomInput ? await validarCupom(cupomInput, totalProduto, loja.cupomEscopo) : null;
  const r = rRaw && rRaw.ok && rRaw.desconto >= totalProduto ? null : rRaw;
  const desconto = r && r.ok ? r.desconto : 0;
  const cupomCodigo = r && r.ok ? r.codigo : null;
  const avisoCupom = !!cupomInput && !(r && r.ok);

  const total = money(Math.max(0, totalProduto - desconto) + (frete ?? 0));

  // ── Gravação ───────────────────────────────────────────────────────────────

  // Tudo grava em itens_pedido (unificado) a partir de agora
  const pedido = await prisma.pedido.create({
    data: {
      nome,
      whatsapp,
      email: cap(form.get('email'), 200) || null,
      compradorDoc,
      vertical: loja.id,
      entrega,
      cep: entrega === 'retirada' ? null : cep,
      frete,
      freteMotivo,
      cupomCodigo,
      desconto: cupomCodigo ? desconto : null,
      total,
      consent: true,
      itens: { create: itens },
    },
    include: { itens: true },
  });

  if (freteMotivo === 'falha_tecnica') await alertarFreteQuebrado(pedido.id);

  // ── Integração Mercado Pago (Rateio unificado) ─────────────────────────────

  try {
    const appOrigin = req.nextUrl.origin;
    
    // O MP não tem linha negativa. O desconto é rateado entre as linhas de forma que
    // Σ linhas + frete = total do pedido. A última linha absorve a diferença acumulada.
    const alvoProduto = money(Math.max(0, totalProduto - desconto));
    let acc = 0;
    const mpItems = itens.map((i, idx) => {
      const isLast = idx === itens.length - 1;
      const unitPrice = isLast ? money(alvoProduto - acc) : money((i.subtotal * alvoProduto) / totalProduto);
      acc = money(acc + unitPrice);
      
      const lf = loja.linhaFixa;
      const title = lf && i.slug === lf.slug
        ? lf.rotulo
        : loja.unidade === 'm2'
          ? `${(i.detalhe as { caixas?: number }).caixas} cx — ${i.slug}`
          : `${i.quantidade} ${loja.unidade}(s) — ${i.slug}`;
          
      return { title, unitPrice };
    });
    
    const backBase = origin.startsWith('http') ? origin : 'https://goiania.roilabs.com.br';
    
    // modoCobranca parceiro seria redirecionado aqui, mas roilabs abre MP (T028 lida com isso depois).
    if (loja.modoCobranca === 'parceiro' && loja.checkoutUrl) {
      // Simulação ou redirecionamento futuro? Hoje não temos, vamos jogar erro provisório ou voltar
      return backTo(origin, 'pagamento', cadeiraId); 
    }
    
    const pref = await createPreference({
      externalReference: pedido.id,
      items: mpItems,
      frete,
      backUrl: `${backBase}/obrigado?pedido=${pedido.id}${avisoCupom ? '&aviso=cupom' : ''}${freteMotivo ? '&aviso=frete' : ''}`,
      notificationUrl: `${appOrigin}/api/pagamentos/webhook`,
    });
    
    await prisma.pedido.update({ where: { id: pedido.id }, data: { mpPreferenceId: pref.id } });
    return NextResponse.redirect(pref.initPoint, 303);
  } catch (err) {
    log.error({ err, pedidoId: pedido.id, total }, `checkout ${cadeiraId}: MP preference falhou`);
    return backTo(origin, 'pagamento', cadeiraId);
  }
}

async function alertarFreteQuebrado(pedidoId: string) {
  const ultimos = await prisma.pedido.findMany({
    where: { vertical: 'fitas' },
    orderBy: { createdAt: 'desc' },
    take: ALERTA_FRETE_LIMIAR,
    select: { freteMotivo: true },
  });
  if (ultimos.length < ALERTA_FRETE_LIMIAR) return;
  if (!ultimos.every((p) => p.freteMotivo === 'falha_tecnica')) return;

  sendAlert(
    '🚨 Frete quebrado — 3 pedidos seguidos sem cotação',
    `<p>Os últimos ${ALERTA_FRETE_LIMIAR} pedidos saíram com frete "a combinar" por <strong>falha técnica</strong>.</p>
     <p>Conferir NESTA ordem: <code>MELHOR_ENVIO_TOKEN</code>, <code>MELHOR_ENVIO_BASE_URL</code>, <code>MELHOR_ENVIO_CEP_ORIGEM</code>. Só depois, o código.</p>
     <p>Último pedido: ${pedidoId}</p>
     <p><a href="https://app.roilabs.com.br/admin/pedidos">Abrir no admin</a></p>`,
  );
}

// Admin: list orders for manual fulfillment
export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: 'desc' },
    include: { itens: true },
  });
  return NextResponse.json(pedidos);
}
