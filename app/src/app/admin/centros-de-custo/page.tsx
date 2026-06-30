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
  const vigentes = resolverParametros({ sku: null, linha: null, global: globalParams });

  const agr = itensPagos.reduce(
    (acc, it) => {
      const varejo = Number(it.subtotal);
      const hasSnapshot =
        it.comissaoSnapshot !== null ||
        it.aliqIntermediacaoSnapshot !== null ||
        it.aliqWLSnapshot !== null;

      const p = hasSnapshot
        ? {
            markup: PARAMS.markup,
            comissao: it.comissaoSnapshot !== null ? Number(it.comissaoSnapshot) : vigentes.comissao,
            aliqIntermediacao: it.aliqIntermediacaoSnapshot !== null ? Number(it.aliqIntermediacaoSnapshot) : vigentes.aliqIntermediacao,
            aliqWL: it.aliqWLSnapshot !== null ? Number(it.aliqWLSnapshot) : vigentes.aliqWL,
          }
        : vigentes;

      const piso = it.pisoSnapshot !== null ? Number(it.pisoSnapshot) : Number(it.subtotal) / (1 + vigentes.markup);
      const inter = calcIntermediacao(varejo, piso, p);
      const wlCalc = calcWL(varejo, piso, p);

      acc.gmv += varejo;
      acc.hipInterTotal += inter.liquido;
      acc.hipWLTotal += wlCalc.liquido;

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

  const p = resolverParametros({ sku: null, linha: null, global: globalParams });
  const hipInterWins = agr.hipInterTotal >= agr.hipWLTotal;

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
      <details className="cc-params" open>
        <summary>Parâmetros editáveis</summary>
        <div className="cc-params__body">
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

      {/* Agregado: referência hipotética */}
      <div className="cc-readout">Referência hipotética — todos os pedidos pagos em cada modalidade</div>
      <div className="cc-cards">
        <div className="cc-card">
          <div className="cc-card__label">GMV pago</div>
          <div className="cc-card__value">{brl(agr.gmv)}</div>
        </div>
        <div className="cc-card">
          <div className="cc-card__label">Tudo Intermediação (líq.)</div>
          <div className="cc-card__value is-inter">{brl(agr.hipInterTotal)}</div>
        </div>
        <div className="cc-card">
          <div className="cc-card__label">Tudo White Label (líq.)</div>
          <div className="cc-card__value is-wl">{brl(agr.hipWLTotal)}</div>
        </div>
        <div className="cc-note">
          {itensPagos.length} item(ns) · vantagem{' '}
          <strong className={hipInterWins ? 'is-inter' : 'is-wl'}>{brl(Math.abs(agr.hipInterTotal - agr.hipWLTotal))}</strong>{' '}
          a favor de {hipInterWins ? 'Intermediação' : 'White Label'}
        </div>
      </div>

      {/* Agregado: real por modalidade oficial */}
      <div className="cc-readout">Real por modalidade oficial — cada item no seu centro</div>
      <div className="cc-cards">
        <div className="cc-card">
          <div className="cc-card__label">Centro Intermediação ({agr.realInterItems} itens)</div>
          <div className="cc-card__value is-inter">{brl(agr.realInter)}</div>
        </div>
        <div className="cc-card">
          <div className="cc-card__label">Centro White Label ({agr.realWLItems} itens)</div>
          <div className="cc-card__value is-wl">{brl(agr.realWL)}</div>
        </div>
        {agr.semSnapshot > 0 && (
          <div className="cc-note cc-note--warn">
            ⚠ {agr.semSnapshot} item(ns) sem snapshot — apurado com parâmetros vigentes
          </div>
        )}
      </div>

      {/* Catálogo: tabela editável por SKU */}
      <table className="cc-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Varejo/m²</th>
            <th>Piso /m²</th>
            <th>Origem</th>
            <th>Linha</th>
            <th>Modalidade</th>
            <th>Interm. líq./m²</th>
            <th>WL líq./m²</th>
            <th>Vence</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((prod) => (
            <SkuRow key={prod.slug} data={prod} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
