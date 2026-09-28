import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell } from "@/components/vertice/AdminShell";
import { NICHOS, type Confianca } from "@/lib/precificacao";
import {
  CENARIOS,
  CTR_COM_IA,
  CTR_SEM_IA,
  DATA_CTR,
  FATIA_IA,
  FONTE_CTR,
  FUNIS,
  KD_SEM_DADO,
  MES_ESTAVEL,
  PREMISSA_MULTIPLICADOR,
  PREMISSA_POSICAO,
  PREMISSA_RAMPA,
  ROTULO_CENARIO,
  posicaoPara,
} from "@/lib/projecao";
import { Projecao } from "./projecao";

export const metadata: Metadata = {
  title: "Projeção · Admin ROI Labs",
  robots: { index: false, follow: false },
};

const pct = (v: number) =>
  `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: v < 0.01 ? 2 : 1 })}%`;

const CONFIANCA: Record<Confianca, string> = {
  alta: "Alta",
  "media-alta": "Média-alta",
  media: "Média",
  "media-baixa": "Média-baixa",
  baixa: "Baixa",
};

// Faixas da tabela D7, com uma dificuldade representativa de cada uma.
const FAIXAS_KD: [string, number | null][] = [
  ["0 a 10", 10],
  ["11 a 20", 20],
  ["21 a 30", 30],
  ["31 a 40", 40],
  ["acima de 40", 41],
  [`não medida (conta ${KD_SEM_DADO})`, null],
];

const NAO_COBRE = [
  "Só a busca orgânica do Google. Mídia paga, marketplace, redes sociais e e-mail ficam de fora.",
  "Recompra não entra: a projeção conta vendas novas. No simulador, a recompra tem campo próprio.",
  "O volume é a média dos últimos 12 meses do Google Ads, sem sazonalidade: dezembro e março contam igual.",
  "A dificuldade é medida para o Brasil, mesmo quando o volume é de uma cidade.",
  "Clínica: o mapa do Google leva boa parte da busca local (13,1% de CTR médio nas posições 1 a 3, First Page Sage 2026), mas depende do Perfil de Empresa da clínica, não do site. Fica fora da conta.",
  "Um clique orgânico conta como uma visita, sem desconto (premissa: as taxas de conversão das fontes são por sessão).",
  "A página não julga a intenção dos termos. Termo informacional (\"como…\", \"o que é…\"), marca de terceiro ou atributo que o parceiro não vende infla a demanda: corte na conversa com o Claude.",
];

export default function ProjecaoPage() {
  return (
    <AdminShell
      title="Projeção de vendas"
      lead="Quantas vendas por mês a busca orgânica tende a trazer para uma cadeira no ano 1, a partir dos termos de compra do nicho. O número vai pronto para o simulador de Preços."
    >
      <Projecao />

      <section aria-labelledby="premissas" className="mt-14 space-y-8">
        <div>
          <h2 id="premissas" className="text-xl font-bold text-navy">
            Premissas e fontes
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Todo número da conta está aqui, com a fonte e a data. O que não vem de estudo está marcado como
            premissa, com o motivo. A pesquisa completa fica em{" "}
            <code className="rounded bg-card px-1 py-0.5 font-mono text-xs">specs/017-projecao-ritmo-venda/research.md</code>.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="min-w-0">
            <h3 className="mb-1 font-semibold text-navy">Cliques por posição (CTR)</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              {FONTE_CTR}, publicado em {DATA_CTR.split("-").reverse().join("/")}. A 1ª posição média caiu de 39,8%
              (2025) para 7,1%: a resposta de IA no topo leva o clique. Posição além da 10ª conta zero.
            </p>
            <table className="pr-table pr-table--cards">
              <caption className="sr-only">CTR por posição, sem e com resposta de IA na página</caption>
              <thead>
                <tr>
                  <th scope="col">Posição</th>
                  <th scope="col" className="md:text-right">Sem resposta de IA</th>
                  <th scope="col" className="md:text-right">Com resposta de IA</th>
                </tr>
              </thead>
              <tbody>
                {CTR_SEM_IA.map((sem, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{i + 1}ª</td>
                    <td data-label="Sem IA" className="tabular-nums md:text-right">{pct(sem)}</td>
                    <td data-label="Com IA" className="tabular-nums md:text-right">{pct(CTR_COM_IA[i])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="min-w-0 space-y-6">
            <div>
              <h3 className="mb-1 font-semibold text-navy">Buscas com resposta de IA, por cenário</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                O CTR de cada posição é a mistura das duas colunas ao lado, pesada por esta fatia.
              </p>
              <table className="pr-table pr-table--cards">
                <caption className="sr-only">Fatia de buscas com resposta de IA e a fonte, por cenário</caption>
                <thead>
                  <tr>
                    <th scope="col">Cenário</th>
                    <th scope="col" className="md:text-right">Fatia</th>
                    <th scope="col">Fonte</th>
                  </tr>
                </thead>
                <tbody>
                  {CENARIOS.map((c) => (
                    <tr key={c}>
                      <td className="font-semibold">{ROTULO_CENARIO[c]}</td>
                      <td data-label="Fatia" className="tabular-nums md:text-right">{pct(FATIA_IA[c].s)}</td>
                      <td data-label="Fonte" className="text-muted-foreground">{FATIA_IA[c].fonte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-navy">Dificuldade do termo → posição no ano 1</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                <strong className="font-semibold text-navy">Premissa.</strong> {PREMISSA_POSICAO}
              </p>
              <table className="pr-table pr-table--cards">
                <caption className="sr-only">Posição alcançável no ano 1 por faixa de dificuldade e cenário</caption>
                <thead>
                  <tr>
                    <th scope="col">Dificuldade</th>
                    {CENARIOS.map((c) => (
                      <th key={c} scope="col">{ROTULO_CENARIO[c]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FAIXAS_KD.map(([faixa, kd]) => (
                    <tr key={faixa}>
                      <td className="font-semibold">{faixa}</td>
                      {CENARIOS.map((c) => {
                        const p = posicaoPara(kd, c);
                        return (
                          <td key={c} data-label={ROTULO_CENARIO[c]} className={p ? "tabular-nums" : "text-muted-foreground"}>
                            {p ? `${p}ª` : "fora do alcance"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="mb-1 font-semibold text-navy">Rampa de 12 meses</h3>
              <p className="text-sm text-muted-foreground">
                <strong className="font-semibold text-navy">Premissa.</strong> {PREMISSA_RAMPA} A posição se
                estabiliza no mês{" "}
                {CENARIOS.map((c, i) => (
                  <span key={c}>
                    {i > 0 ? (i === CENARIOS.length - 1 ? " e " : ", ") : ""}
                    {MES_ESTAVEL[c]} ({ROTULO_CENARIO[c].toLowerCase()})
                  </span>
                ))}
                .
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="mb-1 font-semibold text-navy">Funil de cada nicho</h3>
          <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
            Os nichos são os da{" "}
            <Link href="/admin/precificacao" className="font-semibold text-navy underline underline-offset-2">
              Precificação
            </Link>
            . <strong className="font-semibold text-navy">Premissa dos cenários no e-commerce e no SaaS.</strong>{" "}
            {PREMISSA_MULTIPLICADOR}
          </p>
          {/* 7 colunas não cabem entre 768 e 1280 px: a tabela rola dentro da caixa, não a página. */}
          <div className="overflow-x-auto rounded-xl">
          <table className="pr-table pr-table--cards">
            <caption className="sr-only">Taxas de conversão do funil por nicho e cenário, com fonte e confiança</caption>
            <thead>
              <tr>
                <th scope="col">Nicho</th>
                <th scope="col">Degrau</th>
                {CENARIOS.map((c) => (
                  <th key={c} scope="col" className="md:text-right">{ROTULO_CENARIO[c]}</th>
                ))}
                <th scope="col">Fonte</th>
                <th scope="col">Confiança</th>
              </tr>
            </thead>
            <tbody>
              {NICHOS.flatMap((n) =>
                FUNIS[n.id].degraus.map((d, i) => {
                  const premissa = d.premissa?.replace(PREMISSA_MULTIPLICADOR, "").trim();
                  return (
                    <tr key={`${n.id}-${i}`}>
                      <td className="pr-table__nicho">{n.nicho}</td>
                      <td data-label="Degrau">
                        {d.de} → {d.para}
                      </td>
                      {CENARIOS.map((c) => (
                        <td key={c} data-label={ROTULO_CENARIO[c]} className="whitespace-nowrap font-mono tabular-nums md:text-right">
                          {pct(d.taxa[c])}
                        </td>
                      ))}
                      <td data-label="Fonte" className="pr-table__porque">
                        {d.fonte} ({d.data.split("-").reverse().join("/")})
                        {premissa ? (
                          <span className="mt-1 block">
                            <strong className="font-semibold text-navy">Premissa:</strong> {premissa}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span className={`pr-conf pr-conf--${d.confianca}`}>{CONFIANCA[d.confianca]}</span>
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="nao-cobre" className="mt-12 rounded-xl border border-border bg-card p-5">
        <h2 id="nao-cobre" className="text-lg font-bold text-navy">
          O que a projeção não cobre
        </h2>
        <ul className="mt-3 space-y-1.5">
          {NAO_COBRE.map((item) => (
            <li key={item} className="flex gap-2 text-sm">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
