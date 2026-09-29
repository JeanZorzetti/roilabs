import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { hashDoc, type ContratoCadeiraDoc } from '@/lib/contrato-cadeira';
import { brl } from '@/lib/precos-cadeira';
import { prisma } from '@/lib/prisma';
import { qualify } from '@/lib/vertice/contract';
import { waLink } from '@/lib/wa';
import { aceitarContratoCadeira } from './actions';

// 020 — contrato de cadeira que o parceiro lê e aceita pelo link. Pública, sem login: o slug de 48
// bits é a autorização, como na /p/. Lê só o `doc` congelado e o registro do aceite. Mesma pele da
// /p/ (classes .prop-*); o aceite fica no rodapé escuro, onde o anel de foco hi-vis tem 5,8:1.

export const dynamic = 'force-dynamic';

const ROI_WHATSAPP = '5562993265713'; // o mesmo da /p/ e do site
const SLUG = /^[A-Za-z0-9_-]{8}$/;
const TZ = 'America/Sao_Paulo';

const ERROS: Record<string, { campo: 'nome' | 'cpf' | 'caixa' | null; texto: string }> = {
  nome: { campo: 'nome', texto: 'Escreva o nome completo de quem aceita, como no documento.' },
  cpf: { campo: 'cpf', texto: 'Confira o CPF: são 11 números, e os dois últimos não conferem com os anteriores.' },
  caixa: { campo: 'caixa', texto: 'Marque que leu o contrato e concorda com ele para aceitar.' },
  mudou: {
    campo: null,
    texto: 'A ROI Labs atualizou o contrato enquanto você lia. Confira a versão desta página e aceite de novo.',
  },
};

const lerContrato = cache(async (slug: string) => {
  if (!SLUG.test(slug)) return null;
  const c = await prisma.contratoCadeira.findUnique({
    where: { slug },
    select: { doc: true, aceitoEm: true, aceitoPor: true },
  });
  return c ? { doc: c.doc as ContratoCadeiraDoc, aceitoEm: c.aceitoEm, aceitoPor: c.aceitoPor } : null;
});

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ erro?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await lerContrato((await params).slug);
  return {
    title: c ? `${c.doc.titulo} · ROI Labs` : 'Contrato não encontrado · ROI Labs',
    robots: { index: false, follow: false },
  };
}

/** Parágrafo é texto; lista é lista — o mesmo formato das cláusulas da Vértice. */
function Corpo({ body }: { body: ContratoCadeiraDoc['clausulas'][number]['body'] }) {
  return (
    <>
      {body.map((item, i) =>
        typeof item === 'string' ? (
          <p key={i}>{item}</p>
        ) : (
          <ul key={i} className="prop-lista">
            {item.map((linha) => (
              <li key={linha}>{linha}</li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

export default async function ContratoPage({ params, searchParams }: Props) {
  const [{ slug }, { erro: codigo }] = await Promise.all([params, searchParams]);
  const c = await lerContrato(slug);
  if (!c) notFound();

  const { doc } = c;
  const pendente = doc.pendencias.length > 0;
  const erro = codigo ? ERROS[codigo] : undefined;
  const invalido = (campo: 'nome' | 'cpf' | 'caixa') => erro?.campo === campo;
  const whats = waLink(
    ROI_WHATSAPP,
    `Olá! Estou com o contrato da cadeira de ${doc.proposta.nicho} aberto e tenho uma dúvida. https://app.roilabs.com.br/c/${slug}`,
  );
  const quando = c.aceitoEm
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(c.aceitoEm).replace(', ', ' às ')
    : '';

  return (
    <div className="prop">
      <header className="prop-capa">
        <div className="prop-wrap">
          <p className="prop-marca">
            ROI Labs <span>Contrato</span>
          </p>
          <p className="prop-eyebrow">Cadeira · {doc.proposta.nicho}</p>
          <h1>{doc.titulo}</h1>
          <p className="prop-lead">
            Entre {doc.contratante.name || 'a CONTRATANTE'} e {doc.contratada.name || 'a ROI Labs'}. Os valores e o
            escopo são os da proposta feita para {doc.proposta.paraQuem}.
          </p>

          <dl className="prop-cifras">
            <div>
              <dt>Entrada por ano</dt>
              <dd>{brl(doc.entradaTotal)}</dd>
              <dd className="prop-cifra-nota">na assinatura e a cada renovação</dd>
            </div>
            <div>
              <dt>Comissão</dt>
              <dd className="contrato-cifra-texto">{doc.comissao.resumo}</dd>
              <dd className="prop-cifra-nota">só sobre venda originada pela cadeira</dd>
            </div>
          </dl>

          <p className="contrato-estado" role="status">
            {c.aceitoEm
              ? `Aceito em ${quando} por ${c.aceitoPor}.`
              : pendente
                ? 'Em preenchimento pela ROI Labs: o aceite abre quando o contrato estiver completo.'
                : 'Aguardando o seu aceite, no fim desta página.'}
          </p>
          {!c.aceitoEm && !pendente ? (
            <a className="prop-cta prop-cta--hivis" href="#aceite">
              Ir para o aceite
            </a>
          ) : null}
        </div>
      </header>

      <main className="prop-wrap prop-corpo contrato-corpo">
        <section aria-labelledby="contrato-partes">
          <h2 id="contrato-partes">As partes</h2>
          <p>
            <strong>CONTRATANTE:</strong> {qualify(doc.contratante)}.
          </p>
          <p>
            <strong>CONTRATADA:</strong> {qualify(doc.contratada)}.
          </p>
          <p>As partes acima celebram este contrato de parceria, nos termos das cláusulas a seguir.</p>
        </section>

        <ol className="contrato-clausulas">
          {doc.clausulas.map((cl, i) => (
            <li key={cl.id}>
              <h2 id={`cl-${cl.id}`}>
                <span className="contrato-num">{i + 1}.</span> {cl.heading}
              </h2>
              <Corpo body={cl.body} />
            </li>
          ))}
        </ol>

        <section aria-labelledby="contrato-anexo">
          <h2 id="contrato-anexo">Anexo I · O que a ROI Labs entrega</h2>
          {doc.anexo ? (
            <>
              <p className="prop-taxa">{doc.anexo.cadeira}</p>
              {doc.anexo.fases.map((f) => (
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
              {(
                [
                  ['Também incluído', doc.anexo.extras],
                  ['O que precisamos de você', doc.anexo.precisamos],
                  ['Não inclui', doc.anexo.naoInclui],
                ] as const
              ).map(([titulo, itens]) =>
                itens.length > 0 ? (
                  <div key={titulo}>
                    <h3 className="prop-h3">{titulo}</h3>
                    <ul className="prop-lista">
                      {itens.map((item) => (
                        <li key={item}>{item}.</li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
            </>
          ) : (
            <p className="prop-ressalva">[a preencher] O escopo desta cadeira ainda não foi anexado.</p>
          )}
        </section>
      </main>

      <footer className="prop-fim" id="aceite">
        <div className="prop-wrap">
          {c.aceitoEm ? (
            <>
              <h2>Contrato aceito</h2>
              <p>
                Aceito em {quando} por {c.aceitoPor}. Guarde este link: ele é a sua via do contrato.
              </p>
            </>
          ) : pendente ? (
            <>
              <h2>O aceite ainda não abriu</h2>
              <p>
                A ROI Labs está completando este contrato. Quando estiver pronto, o aceite aparece aqui, no mesmo link.
              </p>
            </>
          ) : (
            <form action={aceitarContratoCadeira} className="contrato-aceite">
              <h2>Aceitar o contrato</h2>
              <p>Quem aceita precisa ter poder para assinar pela CONTRATANTE.</p>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="hash" value={hashDoc(doc)} />

              {erro ? (
                <p role="alert" id="aceite-erro" className="contrato-erro">
                  {erro.texto}
                </p>
              ) : null}

              <div className="contrato-campo">
                <label htmlFor="aceite-nome">Nome completo</label>
                <input
                  id="aceite-nome"
                  name="nome"
                  autoComplete="name"
                  required
                  minLength={5}
                  maxLength={120}
                  aria-invalid={invalido('nome') || undefined}
                  aria-describedby={invalido('nome') ? 'aceite-erro' : undefined}
                />
              </div>
              <div className="contrato-campo">
                <label htmlFor="aceite-cpf">CPF</label>
                <input
                  id="aceite-cpf"
                  name="cpf"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="000.000.000-00"
                  required
                  maxLength={14}
                  aria-invalid={invalido('cpf') || undefined}
                  aria-describedby={invalido('cpf') ? 'aceite-erro' : undefined}
                />
              </div>
              <label className="contrato-caixa">
                <input
                  type="checkbox"
                  name="concordo"
                  value="sim"
                  required
                  aria-invalid={invalido('caixa') || undefined}
                  aria-describedby={invalido('caixa') ? 'aceite-erro' : undefined}
                />
                <span>Li o contrato inteiro, com o Anexo I, e concordo com ele em nome da CONTRATANTE.</span>
              </label>

              <button type="submit" className="prop-cta prop-cta--hivis">
                Aceitar o contrato
              </button>
              <p className="contrato-nota">
                O aceite registra o seu nome, CPF, data, hora, endereço IP, navegador e a impressão digital deste texto.
              </p>
            </form>
          )}
          <p className="prop-validade">
            <a href={whats}>Dúvida sobre o contrato? Fale com a ROI Labs no WhatsApp</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
