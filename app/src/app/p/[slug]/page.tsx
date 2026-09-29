import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { brl, type PropostaCadeiraDoc } from '@/lib/precos-cadeira';
import { prisma } from '@/lib/prisma';
import { waLink } from '@/lib/wa';

// 019 — proposta de cadeira que o parceiro abre pelo link. Pública, sem login: o slug de 48 bits
// é a autorização (mesmo modelo da /p/ da Vértice). Lê só o `doc` congelado no save — não importa
// NICHOS nem simular(), então não tem de onde recalcular nem vazar regra interna.

export const dynamic = 'force-dynamic';

const ROI_WHATSAPP = '5562993265713'; // o mesmo do site (site/src/data/contato.ts)
const SLUG = /^[A-Za-z0-9_-]{8}$/;
const TZ = 'America/Sao_Paulo';
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ });
const pct = (v: number) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

// cache(): generateMetadata e a página leem a mesma proposta numa consulta só.
const lerProposta = cache(async (slug: string): Promise<PropostaCadeiraDoc | null> => {
  if (!SLUG.test(slug)) return null;
  const linha = await prisma.propostaCadeira.findUnique({ where: { slug }, select: { doc: true } });
  return (linha?.doc as PropostaCadeiraDoc | undefined) ?? null;
});

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await lerProposta((await params).slug);
  return {
    title: doc ? `Proposta para ${doc.paraQuem} · ROI Labs` : 'Proposta não encontrada · ROI Labs',
    robots: { index: false, follow: false },
  };
}

export default async function PropostaPage({ params }: Props) {
  const { slug } = await params;
  const doc = await lerProposta(slug);
  if (!doc) notFound();

  const vencida = Date.now() > new Date(doc.validaAte).getTime();
  const whats = waLink(
    ROI_WHATSAPP,
    `Olá! Li a proposta da cadeira de ${doc.nicho.nome} para ${doc.paraQuem} e quero conversar. https://app.roilabs.com.br/p/${slug}`,
  );
  const e = doc.estimativa;

  return (
    <div className="prop">
      <header className="prop-capa">
        <div className="prop-wrap">
          <p className="prop-marca">
            ROI Labs <span>Proposta</span>
          </p>

          {vencida ? (
            <p className="prop-vencida">
              Esta proposta venceu em {data(doc.validaAte)}. Os valores podem ter mudado: peça uma atualizada pelo
              WhatsApp.
            </p>
          ) : null}

          <p className="prop-eyebrow">Cadeira · {doc.nicho.nome}</p>
          <h1>Proposta para {doc.paraQuem}</h1>
          <p className="prop-lead">
            Uma cadeira por nicho no Brasil: enquanto o contrato valer, você é o único. Você paga a entrada anual, e a
            comissão só existe quando a cadeira traz venda.
          </p>

          <dl className="prop-cifras">
            <div>
              <dt>Entrada por ano</dt>
              <dd>{brl(doc.entradaTotal)}</dd>
              <dd className="prop-cifra-nota">sem setup</dd>
            </div>
            {e ? (
              <div>
                <dt>1º ano, no ritmo combinado</dt>
                <dd>{brl(e.totalAno)}</dd>
                <dd className="prop-cifra-nota">entrada + comissão estimada</dd>
              </div>
            ) : null}
          </dl>

          <a className="prop-cta" href={whats}>
            Falar com a ROI Labs no WhatsApp
          </a>
          <p className="prop-validade">
            Feita em {data(doc.criadaEm)} · válida até {data(doc.validaAte)}
          </p>
        </div>
      </header>

      <main className="prop-wrap prop-corpo">
        <section aria-labelledby="prop-entrada">
          <h2 id="prop-entrada">O que você paga todo ano</h2>
          <ul className="prop-extrato">
            {doc.entrada.map((linha) => (
              <li key={linha.item}>
                <span className="prop-extrato-item">{linha.item}</span>
                <span className="prop-extrato-valor">{linha.valor}</span>
                <span className="prop-extrato-nota">{linha.nota}</span>
              </li>
            ))}
            <li className="prop-extrato-total">
              <span className="prop-extrato-item">Entrada por ano</span>
              <span className="prop-extrato-valor">{brl(doc.entradaTotal)}</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="prop-comissao">
          <h2 id="prop-comissao">Comissão: só sobre o que vender</h2>
          <p className="prop-taxa">{doc.comissao.resumo}</p>
          <ul className="prop-lista">
            {doc.comissao.regras.map((regra) => (
              <li key={regra}>{regra}</li>
            ))}
            <li>{doc.comissao.quando}</li>
          </ul>
        </section>

        <section aria-labelledby="prop-estimativa">
          <h2 id="prop-estimativa">Estimativa no ritmo combinado</h2>
          {e ? (
            <>
              <dl className="prop-extrato prop-extrato--dl">
                <div>
                  <dt className="prop-extrato-item">Comissão por mês{e.mesReferencia ? ` (${e.mesReferencia})` : ''}</dt>
                  <dd className="prop-extrato-valor">{brl(e.comissaoMes)}</dd>
                </div>
                <div>
                  <dt className="prop-extrato-item">Comissão em 12 meses</dt>
                  <dd className="prop-extrato-valor">{brl(e.comissaoAno)}</dd>
                </div>
                <div className="prop-extrato-total">
                  <dt className="prop-extrato-item">1º ano: entrada + comissão</dt>
                  <dd className="prop-extrato-valor">{brl(e.totalAno)}</dd>
                </div>
                {e.vendasAno !== null && e.pctDaVenda !== null ? (
                  <div>
                    <dt className="prop-extrato-item">Sobre {brl(e.vendasAno)} vendidos em 12 meses</dt>
                    <dd className="prop-extrato-valor">{pct(e.pctDaVenda)}</dd>
                  </div>
                ) : null}
              </dl>
              <h3 className="prop-h3">O ritmo que você informou</h3>
              <dl className="prop-ritmo">
                {doc.ritmo.map((r) => (
                  <div key={r.rotulo}>
                    <dt>{r.rotulo}</dt>
                    <dd>{r.valor}</dd>
                  </div>
                ))}
              </dl>
              <p className="prop-ressalva">
                É uma estimativa, não uma promessa de venda. O orgânico leva de 3 a 6 meses para estabilizar: o 1º ano
                real tende a ficar abaixo desta conta.
              </p>
            </>
          ) : (
            <p className="prop-ressalva">
              A comissão depende da venda. Esta proposta não traz um ritmo combinado, então não estima o 1º ano. Se a
              cadeira não vender, você paga só a entrada.
            </p>
          )}
        </section>

        {doc.entregaveis ? (
          <section aria-labelledby="prop-entregaveis">
            <h2 id="prop-entregaveis">O que a ROI Labs entrega</h2>
            <p className="prop-taxa">{doc.entregaveis.cadeira}</p>
            {doc.entregaveis.fases.map((f) => (
              <div key={f.nome}>
                <h3 className="prop-h3">
                  {f.prazo} · {f.nome}
                </h3>
                <ul className="prop-lista">
                  {f.itens.map((item) => (
                    <li key={item}>{item}.</li>
                  ))}
                </ul>
              </div>
            ))}
            {doc.entregaveis.precisamos.length > 0 ? (
              <>
                <h3 className="prop-h3">O que precisamos de você</h3>
                <ul className="prop-lista">
                  {doc.entregaveis.precisamos.map((item) => (
                    <li key={item}>{item}.</li>
                  ))}
                </ul>
              </>
            ) : null}
            {doc.entregaveis.naoInclui.length > 0 ? (
              <>
                <h3 className="prop-h3">Não inclui</h3>
                <ul className="prop-lista">
                  {doc.entregaveis.naoInclui.map((item) => (
                    <li key={item}>{item}.</li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="prop-condicoes">
          <h2 id="prop-condicoes">Condições</h2>
          <ul className="prop-lista">
            {doc.condicoes.map((c) => (
              <li key={c}>{c}.</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="prop-fim">
        <div className="prop-wrap">
          <h2>Ficou alguma dúvida?</h2>
          <p>Responda pelo WhatsApp: a conversa já abre com esta proposta.</p>
          <a className="prop-cta" href={whats}>
            Falar com a ROI Labs no WhatsApp
          </a>
          <p className="prop-validade">
            <a href="https://roilabs.com.br/modelo">Como funciona o modelo Growth Partner</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
