import { prisma } from '@/lib/prisma';
import { listarProdutos } from '@/lib/precos';
import {
  PARAMS,
  resolverParametros,
  resolverPiso,
  resolverModalidade,
  calcIntermediacao,
  calcWL,
  type CamadasConfig,
} from '@/lib/centros-custo';
import ParametrosForm from './parametros-form';
import SkuRow, { type SkuRowData } from './sku-row';

export const dynamic = 'force-dynamic';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export default async function CentrosDeCustoPage() {
  // ── Load DB layers ──────────────────────────────────────────────────────────
  const [paramRows, skuRows, itensPagos] = await Promise.all([
    prisma.parametroCentroCusto.findMany(),
    prisma.skuConfig.findMany(),
    prisma.itemPedido.findMany({
      where: { pedido: { statusPagamento: 'pago' } },
      select: {
        slug: true,
        subtotal: true,
        pisoSnapshot: true,
        modalidadeSnapshot: true,
        comissaoSnapshot: true,
        aliqIntermediacaoSnapshot: true,
        aliqWLSnapshot: true,
      },
    }),
  ]);

  const globalRow = paramRows.find((r) => r.escopo === 'global') ?? null;
  const linhaRows = paramRows.filter((r) => r.escopo === 'linha');

  // Helper: convert Prisma Decimal|null to number|null
  const toNum = (v: unknown): number | null => (v !== null && v !== undefined ? Number(v) : null);

  const globalParams = globalRow
    ? {
        markup: toNum(globalRow.markup),
        comissao: toNum(globalRow.comissao),
        aliqIntermediacao: toNum(globalRow.aliqIntermediacao),
        aliqWL: toNum(globalRow.aliqWL),
        cenario: globalRow.cenario,
      }
    : null;

  const linhasMap = new Map(
    linhaRows.map((r) => [
      r.chave,
      {
        markup: toNum(r.markup),
        comissao: toNum(r.comissao),
        aliqIntermediacao: toNum(r.aliqIntermediacao),
        aliqWL: toNum(r.aliqWL),
      },
    ]),
  );

  const skuMap = new Map(
    skuRows.map((r) => [
      r.slug,
      {
        piso: toNum(r.piso),
        modalidadeAlvo: r.modalidadeAlvo ?? null,
        linha: r.linha ?? null,
        markup: toNum(r.markup),
        comissao: toNum(r.comissao),
        aliqIntermediacao: toNum(r.aliqIntermediacao),
        aliqWL: toNum(r.aliqWL),
      },
    ]),
  );

  const linhasDisponiveis = linhaRows.map((r) => r.chave ?? '').filter(Boolean);

  // ── Catálogo: parâmetros vigentes por SKU (simulação prospectiva) ──────────
  const produtos = listarProdutos().map((p) => {
    const skuCfg = skuMap.get(p.slug) ?? null;
    const linhaNome = skuCfg?.linha ?? null;
    const linhaCfg = linhaNome ? (linhasMap.get(linhaNome) ?? null) : null;

    const camadas: CamadasConfig = { sku: skuCfg, linha: linhaCfg, global: globalParams };
    const parametros = resolverParametros(camadas);
    const { piso, real } = resolverPiso(p.preco, camadas);
    const modalidade = resolverModalidade(camadas);
    const inter = calcIntermediacao(p.preco, piso, parametros);
    const wl = calcWL(p.preco, piso, parametros);
    const prejuizo = piso > p.preco;

    return {
      slug: p.slug,
      varejo: p.preco,
      piso,
      real,
      prejuizo,
      modalidade,
      linhaAtual: skuCfg?.linha ?? null,
      interLiquido: inter.liquido,
      wlLiquido: wl.liquido,
      linhasDisponiveis,
    } satisfies SkuRowData;
  });

  // ── Agregado de pedidos pagos: duas leituras (US4 + US6) ──────────────────
  // Parâmetros vigentes globais para itens sem snapshot
  const vigentes = resolverParametros({ sku: null, linha: null, global: globalParams });

  const agr = itensPagos.reduce(
    (acc, it) => {
      const varejo = Number(it.subtotal);
      const hasSnapshot =
        it.comissaoSnapshot !== null ||
        it.aliqIntermediacaoSnapshot !== null ||
        it.aliqWLSnapshot !== null;

      // Resolve effective params: snapshot > vigentes
      const p = hasSnapshot
        ? {
            markup: PARAMS.markup, // markup not snapshotted (piso already resolved)
            comissao: it.comissaoSnapshot !== null ? Number(it.comissaoSnapshot) : vigentes.comissao,
            aliqIntermediacao: it.aliqIntermediacaoSnapshot !== null ? Number(it.aliqIntermediacaoSnapshot) : vigentes.aliqIntermediacao,
            aliqWL: it.aliqWLSnapshot !== null ? Number(it.aliqWLSnapshot) : vigentes.aliqWL,
          }
        : vigentes;

      const piso = it.pisoSnapshot !== null ? Number(it.pisoSnapshot) : Number(it.subtotal) / (1 + vigentes.markup);
      const inter = calcIntermediacao(varejo, piso, p);
      const wlCalc = calcWL(varejo, piso, p);

      acc.gmv += varejo;

      // Leitura hipotética: todos em cada centro
      acc.hipInterTotal += inter.liquido;
      acc.hipWLTotal += wlCalc.liquido;

      // Leitura real: cada item no seu centro oficial
      const modalidadeEfetiva =
        it.modalidadeSnapshot ?? (skuMap.get(it.slug)?.modalidadeAlvo) ?? 'intermediacao';
      if (modalidadeEfetiva === 'wl') {
        acc.realWL += wlCalc.liquido;
        acc.realWLItems++;
      } else {
        acc.realInter += inter.liquido;
        acc.realInterItems++;
      }

      if (!hasSnapshot) acc.semSnapshot++;

      return acc;
    },
    { gmv: 0, hipInterTotal: 0, hipWLTotal: 0, realInter: 0, realWL: 0, realInterItems: 0, realWLItems: 0, semSnapshot: 0 },
  );

  // ── Display params summary ─────────────────────────────────────────────────
  const p = resolverParametros({ sku: null, linha: null, global: globalParams });

  const th: React.CSSProperties = { textAlign: 'right', padding: '0.6rem 0.8rem', whiteSpace: 'nowrap', color: '#888', fontSize: '0.8rem' };
  const card: React.CSSProperties = { border: '1px solid #333', borderRadius: 6, padding: '0.9rem 1.1rem', minWidth: 200 };

  return (
    <div className="page">
      <div className="page__head">
        <h1>Centros de custo</h1>
        <p>
          A mesma venda vista por dois centros: <strong>Intermediação</strong> (comissão {pct(p.comissao)} +
          excedente, imposto de serviço {pct(p.aliqIntermediacao)}) e <strong>White Label</strong> (spread,
          imposto sobre o GMV {pct(p.aliqWL)}). Atacado estimado por markup {pct(p.markup)} — ou piso real por SKU.
        </p>
      </div>

      {/* Parâmetros editáveis */}
      <details open style={{ marginBottom: '1.5rem', border: '1px solid #2d4a6e', borderRadius: 6, padding: '0.75rem 1rem' }}>
        <summary style={{ cursor: 'pointer', color: '#93c5fd', fontWeight: 600, fontSize: '0.9rem' }}>
          ⚙️ Parâmetros editáveis
        </summary>
        <div style={{ marginTop: '1rem' }}>
          <ParametrosForm
            global={globalParams}
            linhas={linhaRows.map((r) => ({
              chave: r.chave,
              markup: toNum(r.markup),
              comissao: toNum(r.comissao),
              aliqIntermediacao: toNum(r.aliqIntermediacao),
              aliqWL: toNum(r.aliqWL),
              cenario: null,
            }))}
          />
        </div>
      </details>

      {/* Agregado: leitura hipotética (referência) */}
      <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Referência hipotética — todos os pedidos pagos em cada modalidade
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {[
          ['GMV pago', brl(agr.gmv), '#888'],
          ['Tudo Intermediação (líq.)', brl(agr.hipInterTotal), '#86efac'],
          ['Tudo White Label (líq.)', brl(agr.hipWLTotal), '#93c5fd'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={card}>
            <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ color: color as string, fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
        <div style={{ alignSelf: 'center', color: '#666', fontSize: '0.8rem' }}>
          {itensPagos.length} item(ns) · vantagem{' '}
          <strong style={{ color: agr.hipInterTotal >= agr.hipWLTotal ? '#86efac' : '#93c5fd' }}>
            {brl(Math.abs(agr.hipInterTotal - agr.hipWLTotal))}
          </strong>{' '}
          a favor de {agr.hipInterTotal >= agr.hipWLTotal ? 'Intermediação' : 'White Label'}
        </div>
      </div>

      {/* Agregado: leitura real por modalidade oficial */}
      <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Real por modalidade oficial — cada item no seu centro
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[
          [`Centro Intermediação (${agr.realInterItems} itens)`, brl(agr.realInter), '#86efac'],
          [`Centro White Label (${agr.realWLItems} itens)`, brl(agr.realWL), '#93c5fd'],
        ].map(([label, value, color]) => (
          <div key={label as string} style={card}>
            <div style={{ color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ color: color as string, fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
          </div>
        ))}
        {agr.semSnapshot > 0 && (
          <div style={{ alignSelf: 'center', color: '#f59e0b', fontSize: '0.8rem' }}>
            ⚠ {agr.semSnapshot} item(ns) sem snapshot — apurado com parâmetros vigentes
          </div>
        )}
      </div>

      {/* Catálogo: tabela editável por SKU */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ ...th, textAlign: 'left' }}>Produto</th>
            <th style={th}>Varejo/m²</th>
            <th style={th}>Piso /m²</th>
            <th style={th}>Origem</th>
            <th style={th}>Linha</th>
            <th style={th}>Modalidade</th>
            <th style={th}>Interm. líq./m²</th>
            <th style={th}>WL líq./m²</th>
            <th style={th}>Vence</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((p) => (
            <SkuRow key={p.slug} data={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
