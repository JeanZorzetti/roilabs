'use client';
import { useState } from 'react';
import {
  FAIXAS,
  NICHOS_PERCENTUAIS,
  PISO_POR_PEDIDO,
  AJUSTE_DISTRIBUIDOR,
  calcularComissao,
  encaixarPorMargem,
  lerNumeroBR,
  type Faixa,
  type ResultadoComissao,
  type TipoCompra,
} from '@/lib/precificacao';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

// optgroup por faixa, na ordem da tabela
const GRUPOS = NICHOS_PERCENTUAIS.reduce<[Faixa, typeof NICHOS_PERCENTUAIS][]>((acc, n) => {
  const g = acc.find(([f]) => f === n.faixa);
  if (g) g[1].push(n);
  else acc.push([n.faixa, [n]]);
  return acc;
}, []);

function Resultado({ titulo, tipo, r, valor, distribuidor }: {
  titulo: string;
  tipo: TipoCompra;
  r: ResultadoComissao;
  valor: number;
  distribuidor: boolean;
}) {
  const passouCorte = valor > r.corte;
  return (
    <div className="pr-result">
      <div className="pr-result__label">{titulo}</div>
      <div className="pr-result__valor">{brl(r.comissao)}</div>
      <div className="pr-result__pct">{valor > 0 ? `${pct(r.pctEfetivo)} do pedido` : 'informe o valor do pedido'}</div>
      <ul>
        <li>
          Taxa: {distribuidor && r.taxaAplicada !== r.taxaTabela
            ? `${pct(r.taxaTabela)} − ${Math.round(AJUSTE_DISTRIBUIDOR[tipo] * 100)} pts de distribuidor = ${pct(r.taxaAplicada)}`
            : pct(r.taxaAplicada)}
        </li>
        {passouCorte && (
          <li>
            Até {brl(r.corte)} a {pct(r.taxaAplicada)}: {brl(r.ateCorte)} · acima a {pct(r.taxaAcimaCorte)}: {brl(r.acimaCorte)}
          </li>
        )}
        {r.pisoAplicado && <li>O percentual daria menos que o piso: vale o piso de {brl(PISO_POR_PEDIDO)}</li>}
        {valor > 0 && <li>Fica com o fornecedor: {brl(r.fornecedorFica)}</li>}
      </ul>
    </div>
  );
}

export default function Calculadora() {
  const [nichoId, setNichoId] = useState('moda');
  const [valorTxt, setValorTxt] = useState('200');
  const [distribuidor, setDistribuidor] = useState(false);
  const [margemTxt, setMargemTxt] = useState('45');
  const [freteTxt, setFreteTxt] = useState('0');

  const nicho = NICHOS_PERCENTUAIS.find((n) => n.id === nichoId) ?? NICHOS_PERCENTUAIS[0];
  const valorLido = lerNumeroBR(valorTxt);
  const valor = Number.isNaN(valorLido) ? 0 : valorLido;
  const aq = calcularComissao(nicho, 'aquisicao', valor, distribuidor);
  const rec = calcularComissao(nicho, 'recorrencia', valor, distribuidor);

  const margemLida = lerNumeroBR(margemTxt);
  const freteLido = lerNumeroBR(freteTxt);
  const margemOk = !Number.isNaN(margemLida) && margemLida <= 100;
  const freteOk = freteTxt.trim() === '' || (!Number.isNaN(freteLido) && freteLido <= 100);
  const encaixe = encaixarPorMargem(margemLida / 100, freteOk && freteTxt.trim() !== '' ? freteLido / 100 : 0);

  return (
    <div className="pr-calc">
      <section className="pr-panel" aria-labelledby="calc-pedido">
        <h2 id="calc-pedido">Quanto a ROI Labs recebe num pedido</h2>
        <p className="pr-panel__lead">
          Escolha o nicho e o valor do produto. A conta mostra a 1ª compra e a recompra lado a lado,
          já com o piso e a taxa reduzida em pedido grande.
        </p>
        <div className="pr-form">
          <label className="pr-field pr-field--grow">
            Nicho do fornecedor
            <select value={nichoId} onChange={(e) => setNichoId(e.target.value)}>
              {GRUPOS.map(([faixa, nichos]) => (
                <optgroup key={faixa} label={FAIXAS[faixa].rotulo}>
                  {nichos.map((n) => (
                    <option key={n.id} value={n.id}>{n.nicho}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="pr-field pr-field--num">
            Valor do produto (R$)
            <input
              inputMode="decimal"
              value={valorTxt}
              onChange={(e) => setValorTxt(e.target.value)}
              aria-invalid={valorTxt.trim() !== '' && Number.isNaN(valorLido)}
              aria-describedby="valor-ajuda"
            />
          </label>
          <label className="pr-check">
            <input type="checkbox" checked={distribuidor} onChange={(e) => setDistribuidor(e.target.checked)} />
            É distribuidor ou revende marcas de outras empresas
          </label>
        </div>
        <p id="valor-ajuda" className="pr-hint">
          {valorTxt.trim() !== '' && Number.isNaN(valorLido)
            ? 'Não entendi esse valor. Use só números, como 1.500,00.'
            : 'Valor do produto já com desconto e sem o frete: a comissão nunca incide sobre o frete.'}
        </p>
        <div className="pr-results" aria-live="polite">
          <Resultado titulo="1ª compra (aquisição)" tipo="aquisicao" r={aq} valor={valor} distribuidor={distribuidor} />
          <Resultado titulo="Recompra (recorrência)" tipo="recorrencia" r={rec} valor={valor} distribuidor={distribuidor} />
        </div>
        <p className="pr-hint">Além do percentual, a cadeira paga a anuidade de R$ 2.640 (R$ 220/mês), cobrada à parte.</p>
      </section>

      <section className="pr-panel" aria-labelledby="calc-margem">
        <h2 id="calc-margem">Encaixar um fornecedor pela margem</h2>
        <p className="pr-panel__lead">
          Para um nicho fora da tabela, ou quando o fornecedor informar a margem real. A margem vale mais que o nicho.
        </p>
        <div className="pr-form">
          <label className="pr-field pr-field--num">
            Margem bruta (%)
            <input
              inputMode="decimal"
              value={margemTxt}
              onChange={(e) => setMargemTxt(e.target.value)}
              aria-invalid={!margemOk}
            />
          </label>
          <label className="pr-field pr-field--num">
            Frete pago pelo fornecedor (% da venda)
            <input
              inputMode="decimal"
              value={freteTxt}
              onChange={(e) => setFreteTxt(e.target.value)}
              aria-invalid={!freteOk}
            />
          </label>
        </div>
        <div aria-live="polite">
          {!margemOk || !freteOk ? (
            <p className="pr-alerta">Informe as porcentagens só com números, entre 0 e 100 (ex.: 45).</p>
          ) : (
            <>
              <dl className="pr-encaixe">
                <div>
                  <dt>Folga a cada R$ 100 vendidos</dt>
                  <dd>{brl(encaixe.folga * 100)}</dd>
                </div>
                <div>
                  <dt>A recompra pode ir até</dt>
                  {/* truncado, não arredondado: 5,95% exibido como "6%" contradiria a faixa 8%/5% sugerida ao lado */}
                  <dd>{pct(Math.floor(encaixe.recorrenciaMaxima * 1000) / 1000)}</dd>
                </div>
              </dl>
              {encaixe.sugestao ? (
                <div className={`pr-sugestao pr-cor--${encaixe.sugestao.faixa}`}>
                  <div className="pr-result__label">Faixa sugerida</div>
                  <div className="pr-sugestao__faixa">{FAIXAS[encaixe.sugestao.faixa].rotulo}</div>
                  <div className="pr-sugestao__taxa">
                    {pct(encaixe.sugestao.aquisicao)} <span>1ª compra</span> · {pct(encaixe.sugestao.recorrencia)} <span>recompra</span>
                  </div>
                  {encaixe.sugestao.faixa === 'premium' && (
                    <p className="pr-hint">Premium só se a devolução for baixa. Moda, mesmo com margem alta, fica no Padrão (15% / 10%).</p>
                  )}
                </div>
              ) : (
                <p className="pr-alerta">
                  Com essa margem, nenhum percentual fecha a conta: a recompra teria de ficar abaixo do mínimo de 5%.
                  Não abrir cadeira cobrando percentual.
                </p>
              )}
            </>
          )}
        </div>
        <p className="pr-hint">
          Folga = margem × (1 − 9% de imposto) − 4% de cartão − frete. A recompra não passa de 1/3 da folga:
          regra proposta pela pesquisa, sem fonte de mercado.
        </p>
      </section>
    </div>
  );
}
