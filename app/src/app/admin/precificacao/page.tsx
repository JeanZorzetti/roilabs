import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/log';
import { FAIXAS, NICHOS, nichoSugerido, type Confianca, type Faixa, type NichoPreco } from '@/lib/precificacao';
import Calculadora from './calculadora';

export const dynamic = 'force-dynamic';

const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const CONFIANCA: Record<Confianca, string> = {
  alta: 'Alta',
  'media-alta': 'Média-alta',
  media: 'Média',
  'media-baixa': 'Média-baixa',
  baixa: 'Baixa',
};

const ORDEM_FAIXAS: Faixa[] = ['premium', 'padrao', 'intermediaria', 'margem-fina', 'especial'];

const REGRAS: [string, string][] = [
  ['Piso por pedido', 'A ROI Labs recebe o maior valor entre o percentual e R$ 5 por pedido. Mercado Livre e Shopee cobram mais que isso em item abaixo de R$ 79.'],
  ['Taxa reduzida em pedido grande', 'Na parte do produto que passar de R$ 1.500 (R$ 5.000 no B2B), a taxa cai para 2/3: 18% vira 12%, 15% vira 10%, 12% vira 8%. Mesma lógica da Amazon em móveis.'],
  ['Distribuidor ou revendedor', 'Paga 3 pontos a menos na 1ª compra e 2 a menos na recompra, com mínimo de 5%. No atacado, a margem fica 8 a 15 pontos abaixo da do varejo (IBGE).'],
  ['Estorno', 'Comissão só sobre pedido pago. Devolução, cancelamento ou chargeback devolvem a comissão. Fechamento mensal, pagamento até o dia 15 do mês seguinte.'],
  ['Cliente novo', 'É o CPF/CNPJ na primeira compra pela loja. Se o fornecedor provar que a pessoa comprou dele nos últimos 12 meses por outro canal, paga a taxa de recompra.'],
  ['Desconto por volume', 'Até R$ 1 milhão/ano originado, tabela cheia. De R$ 1 mi a R$ 3 mi, −1 ponto sobre o que passar de R$ 1 mi; acima de R$ 3 mi, −2 pontos. Nunca abaixo de 5%.'],
  ['Depois do contrato', 'A recompra dos clientes que a ROI Labs trouxe continua sendo comissionada por 12 meses depois do fim do contrato.'],
  ['Limite para negociar', 'Desconto só até a faixa logo abaixo, e só em troca de algo (ex.: contrato de 24 meses).'],
];

const COMPARATIVO: [string, string, string][] = [
  ['Agência de tráfego com taxa de sucesso', '1,5% a 4% das vendas + fixo de R$ 1.500 a R$ 8.000/mês', 'Cuida dos anúncios; a mídia é paga pelo fornecedor'],
  ['Assessoria de marketplace', '2% a 8% do faturamento, ou fixo de R$ 1.500 a R$ 15.000/mês', 'Opera a conta no marketplace; não paga tráfego'],
  ['Representante comercial', '3% a 10% sobre a nota, com impostos e frete', 'Vende pessoalmente; não investe em tecnologia'],
  ['Afiliados', '7% a 13% (Amazon); até 16% (Mercado Livre)', 'Só o clique, com janela de 24 horas a 7 dias'],
  ['ROI Labs', 'Tabela desta página, sobre o produto sem frete, + R$ 220/mês', 'Loja, tecnologia, SEO e tráfego bancados, com exclusividade no nicho'],
  ['Comissão de marketplace', 'Amazon 10% a 15%; Mercado Livre 10% a 14% (Clássico) e 15% a 19% (Premium)', 'Vitrine com movimento desde o 1º dia'],
  ['Varejistas e marketplaces especializados', '16% a 21% (Magalu, Casas Bahia, Leroy Merlin); 18% a 30% em moda', 'Vitrine especializada'],
  ['Custo total de vender em marketplace', '20% a 34%, somando tarifa fixa e frete grátis obrigatório', '—'],
  ['Anúncio pago (custo de cada venda)', '29% a 36% do pedido em moda, beleza e alimentos; 48% a 67% em casa, pet e eletrônicos', 'Cliques, sem garantia de venda'],
];

function taxaTexto(n: NichoPreco, tipo: 'aquisicao' | 'recorrencia') {
  if (n.modelo === 'percentual') return pct(n[tipo]);
  return tipo === 'aquisicao' ? n.aquisicaoTexto : n.recorrenciaTexto;
}

type Situacao = { texto: string; classe: 'igual' | 'acima' | 'abaixo' | 'neutro' };

function comparar(aq: number | null, rec: number | null, sug: NichoPreco | null): Situacao {
  if (aq === null || rec === null) return { texto: 'Sem taxa cadastrada', classe: 'neutro' };
  if (!sug) return { texto: 'Nicho fora da tabela: use o encaixe pela margem', classe: 'neutro' };
  if (sug.modelo !== 'percentual') return { texto: 'A tabela usa outro formato de cobrança', classe: 'neutro' };
  const d = [aq - sug.aquisicao, rec - sug.recorrencia].map((x) => (Math.abs(x) < 1e-9 ? 0 : Math.sign(x)));
  if (d.every((x) => x === 0)) return { texto: 'Igual à tabela', classe: 'igual' };
  if (d.every((x) => x >= 0)) return { texto: 'Acima da tabela', classe: 'acima' };
  if (d.every((x) => x <= 0)) return { texto: 'Abaixo da tabela', classe: 'abaixo' };
  return { texto: 'Diferente da tabela', classe: 'neutro' };
}

async function carregarParceiros() {
  try {
    const rows = await prisma.parceiro.findMany({
      where: { estagio: { not: 'riscada' } },
      select: {
        id: true,
        nome: true,
        nicho: true,
        estagio: true,
        comissaoAquisicao: true,
        comissaoRecorrencia: true,
        cadeira: { select: { daCasa: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => ({
      ...p,
      aq: p.comissaoAquisicao !== null ? Number(p.comissaoAquisicao) : null,
      rec: p.comissaoRecorrencia !== null ? Number(p.comissaoRecorrencia) : null,
      daCasa: p.cadeira?.daCasa ?? false,
    }));
  } catch (err) {
    // A tabela e a calculadora não dependem do banco: a página continua útil sem ele.
    log.error({ err }, 'precificacao: falha ao carregar parceiros');
    return null;
  }
}

export default async function PrecificacaoPage() {
  const parceiros = await carregarParceiros();

  return (
    <div className="page">
      <div className="page__head">
        <span className="pr-tag">Proposta · pesquisa de mercado de 27/09/2026</span>
        <h1>Precificação</h1>
        <p>
          Quanto cobrar de success fee em cada nicho, para montar a proposta de uma cadeira. É referência:{' '}
          <strong>não muda nenhuma cobrança</strong>. Quem fatura continua sendo a taxa gravada no cadastro de
          cada <Link href="/admin/parceiros">parceiro</Link>.
        </p>
      </div>

      <div className="pr-faixas">
        {ORDEM_FAIXAS.map((f) => {
          const nichos = NICHOS.filter((n) => n.faixa === f);
          const pares = [...new Set(nichos.flatMap((n) => (n.modelo === 'percentual' ? [`${pct(n.aquisicao)} / ${pct(n.recorrencia)}`] : [])))];
          return (
            <div key={f} className={`pr-faixa pr-cor--${f}`}>
              <div className="pr-faixa__nome">{FAIXAS[f].rotulo}</div>
              <div className="pr-faixa__taxa">
                {f === 'especial' ? `${nichos.length} formatos` : pares.map((p) => <span key={p}>{p}</span>)}
              </div>
              <div className="pr-faixa__criterio">{FAIXAS[f].criterio}</div>
              <div className="pr-faixa__qtd">{nichos.length} {nichos.length === 1 ? 'nicho' : 'nichos'}</div>
            </div>
          );
        })}
      </div>

      <Calculadora />

      <section className="pr-section" aria-labelledby="tabela">
        <h2 id="tabela">Tabela por nicho</h2>
        <p>
          A faixa sai da margem bruta do fornecedor, mais que do nicho: dois fornecedores do mesmo nicho podem cair em
          faixas diferentes. Antes da proposta, pergunte a margem real, se ele é fabricante ou revendedor e quanto os
          clientes dele recompram. Percentual sempre sobre o produto com desconto, nunca sobre o frete.
        </p>
        <table className="pr-table pr-table--cards">
          <thead>
            <tr>
              <th>Nicho</th>
              <th>1ª compra</th>
              <th>Recompra</th>
              <th>Regra específica</th>
              <th>Por que esse número</th>
              <th>Confiança</th>
            </tr>
          </thead>
          {ORDEM_FAIXAS.map((f) => (
            <tbody key={f}>
              <tr className={`pr-group pr-cor--${f}`}>
                <th colSpan={6} scope="colgroup">
                  {FAIXAS[f].rotulo} <span>· {FAIXAS[f].criterio}</span>
                </th>
              </tr>
              {NICHOS.filter((n) => n.faixa === f).map((n) => (
                <tr key={n.id}>
                  <td className="pr-table__nicho">{n.nicho}</td>
                  <td data-label="1ª compra" className={n.modelo === 'percentual' ? 'pr-table__taxa' : 'pr-table__texto'}>{taxaTexto(n, 'aquisicao')}</td>
                  <td data-label="Recompra" className={n.modelo === 'percentual' ? 'pr-table__taxa' : 'pr-table__texto'}>{taxaTexto(n, 'recorrencia')}</td>
                  <td data-label="Regra" className="pr-table__regra">{n.regra ?? '—'}</td>
                  <td data-label="Por que" className="pr-table__porque">{n.porque}</td>
                  <td><span className={`pr-conf pr-conf--${n.confianca}`}>{CONFIANCA[n.confianca]}</span></td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </section>

      <section className="pr-section" aria-labelledby="vigor">
        <h2 id="vigor">Taxas em vigor hoje</h2>
        <p>
          O que cada parceiro paga pelo cadastro, comparado com a linha da tabela que casa com o nicho dele. A linha é
          sugerida pelo nome do nicho: confira antes de levar para uma renegociação.
        </p>
        {parceiros === null ? (
          <p className="pr-alerta">Não foi possível carregar os parceiros agora. A tabela e a calculadora acima continuam valendo.</p>
        ) : parceiros.length === 0 ? (
          <p className="empty">Nenhum parceiro em sondagem, ativo ou pausado.</p>
        ) : (
          <table className="pr-table pr-table--cards">
            <thead>
              <tr>
                <th>Parceiro</th>
                <th>Nicho no cadastro</th>
                <th>Estágio</th>
                <th>Hoje</th>
                <th>Linha da tabela</th>
                <th>Tabela sugere</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {parceiros.map((p) => {
                const sug = nichoSugerido(p.nicho);
                const sit = comparar(p.aq, p.rec, sug);
                return (
                  <tr key={p.id}>
                    <td className="pr-table__nicho"><Link href={`/admin/parceiros/${p.id}`}>{p.nome}</Link></td>
                    <td data-label="Nicho no cadastro">{p.nicho}{p.daCasa && <span className="pr-hint"> · da casa, não gera fee</span>}</td>
                    <td data-label="Estágio">{p.estagio}</td>
                    <td data-label="Hoje" className="pr-table__taxa">{p.aq !== null && p.rec !== null ? `${pct(p.aq)} / ${pct(p.rec)}` : '—'}</td>
                    <td data-label="Linha da tabela">{sug?.nicho ?? '—'}</td>
                    <td data-label="Tabela sugere" className={sug?.modelo === 'percentual' ? 'pr-table__taxa' : 'pr-table__texto'}>
                      {sug ? `${taxaTexto(sug, 'aquisicao')} / ${taxaTexto(sug, 'recorrencia')}` : '—'}
                    </td>
                    <td><span className={`pr-status pr-status--${sit.classe}`}>{sit.texto}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="pr-section" aria-labelledby="regras">
        <h2 id="regras">Regras que valem para todos os nichos</h2>
        <p>Protegem os dois lados: o pedido pequeno que não pagaria o trabalho, o pedido grande que sairia mais caro que anúncio e o fornecedor que cresce muito.</p>
        <div className="pr-regras">
          {REGRAS.map(([titulo, texto]) => (
            <div key={titulo} className="pr-regra">
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </div>
          ))}
        </div>
        <div className="pr-regra pr-regra--contrato">
          <h3>O contrato precisa dizer</h3>
          <ul>
            <li>A exclusividade é a ROI Labs não atender concorrentes do nicho, não uma zona do fornecedor.</li>
            <li>A comissão incide só sobre vendas originadas na loja da ROI Labs.</li>
            <li>A base é o produto sem frete, com cláusula sobre IBS/CBS antes de 01/01/2027.</li>
            <li>No onboarding, perguntar se o fornecedor tem representantes com zona exclusiva: eles podem cobrar comissão sobre as mesmas vendas.</li>
          </ul>
        </div>
      </section>

      <section className="pr-section" aria-labelledby="mercado">
        <h2 id="mercado">Onde a tabela fica no mercado</h2>
        <p>
          Entre quem só traz o comprador (afiliado, representante) e quem traz comprador e vitrine (marketplace). A
          ROI Labs banca loja e tráfego, então cobra acima do primeiro grupo e abaixo do custo total do segundo.
        </p>
        <table className="pr-table pr-table--cards">
          <thead>
            <tr>
              <th>Quem vende pelo fornecedor</th>
              <th>Quanto cobra</th>
              <th>O que entrega</th>
            </tr>
          </thead>
          <tbody>
            {COMPARATIVO.map(([quem, quanto, entrega]) => (
              <tr key={quem} className={quem === 'ROI Labs' ? 'pr-destaque' : undefined}>
                <td className="pr-table__nicho">{quem}</td>
                <td data-label="Quanto cobra">{quanto}</td>
                <td data-label="O que entrega" className="pr-table__porque">{entrega}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="pr-notas">
        <strong>Sobre os números.</strong>
        <ul>
          <li>Confiança alta: várias fontes oficiais concordam. Média: fontes secundárias ou dado oficial combinado com conta da pesquisa. Baixa: faltam dados brasileiros do nicho.</li>
          <li>Sem fonte de mercado, propostas da pesquisa: a regra de 1/3 da folga, o piso de R$ 5, o corte de R$ 1.500 e as faixas de volume.</li>
          <li>Comissões do Mercado Livre e da Shopee vêm de blogs (as páginas oficiais bloquearam a leitura); margens de empresas vêm de resumos dos balanços.</li>
          <li>Cláusulas de contrato: validar com advogado. Impostos: confirmar com o contador.</li>
        </ul>
      </div>
    </div>
  );
}
