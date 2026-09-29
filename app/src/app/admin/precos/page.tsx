import Link from "next/link";
import type { Metadata } from "next";
import { AdminShell } from "@/components/vertice/AdminShell";
import { TIPOS_CADEIRA } from "@/lib/entregaveis";
import { FAIXAS, NICHOS, PISO_POR_PEDIDO, type Faixa, type NichoPreco } from "@/lib/precificacao";
import {
  ANUIDADE,
  ANUIDADE_MES,
  DOMINIO_ANO,
  ENTRADA_ANO,
  ITENS_FIXOS,
  REGRAS_CONTRATO,
  REGRAS_DOMINIO,
  REGRAS_NEGOCIACAO,
  brl,
} from "@/lib/precos-cadeira";
import { lerPonteSimulador } from "@/lib/projecao";
import { SimuladorCadeira } from "./simulador";

export const metadata: Metadata = {
  title: "Preços · Admin ROI Labs",
  robots: { index: false, follow: false },
};

const ORDEM: Faixa[] = ["premium", "padrao", "intermediaria", "margem-fina", "especial"];

const pct = (v: number) => `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

/** "18% / 10%" por faixa — Margem fina tem dois pares (10/6 e 8/5). */
function taxasDaFaixa(nichos: NichoPreco[], tipo: "aquisicao" | "recorrencia"): string {
  const valores = [
    ...new Set(nichos.flatMap((n) => (n.modelo === "percentual" ? [pct(n[tipo])] : []))),
  ];
  return valores.length ? valores.join(" ou ") : "—";
}

export default async function PrecosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Ponte da Projeção (017): ?nicho=&ritmo=&cenario=. Inválido = simulador como sempre (FR-011).
  const inicial = lerPonteSimulador(await searchParams);
  return (
    <AdminShell
      title="Preços da ROI Labs"
      lead="O que o parceiro paga por uma cadeira: anuidade, domínio próprio e comissão pela faixa do nicho. É referência para montar a proposta — quem fatura continua sendo a taxa gravada no cadastro de cada parceiro."
    >
      <div className="mb-8 rounded-xl border-l-4 border-l-gold border-border bg-card p-4">
        <p className="text-sm text-navy">
          <strong className="font-semibold">Sem setup.</strong> Entrada de {brl(ENTRADA_ANO)} por ano:
          anuidade de {brl(ANUIDADE)} ({brl(ANUIDADE_MES)}/mês) + domínio próprio na Hostinger a{" "}
          {brl(DOMINIO_ANO)}/ano. A comissão só existe quando o parceiro vende — vendeu zero, fica só a
          entrada.
        </p>
      </div>

      <section aria-labelledby="simulador" className="mb-14">
        <h2 id="simulador" className="mb-1 text-xl font-bold text-navy">
          Simulador de proposta
        </h2>
        <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
          Escolha o nicho e o ritmo de venda que o parceiro espera. A comissão segue a{" "}
          <Link href="/admin/precificacao" className="font-semibold text-navy underline underline-offset-2">
            tabela de Precificação
          </Link>
          , com piso de {brl(PISO_POR_PEDIDO)} por pedido.
        </p>
        <SimuladorCadeira inicial={inicial} />
      </section>

      <section aria-labelledby="tabela" className="mb-14">
        <h2 id="tabela" className="mb-4 text-xl font-bold text-navy">
          Tabela da cadeira
        </h2>

        <div className="space-y-6">
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">
              O que toda cadeira paga
            </h3>
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">Itens fixos de toda cadeira: valor, quando cobra e observação</caption>
              <thead className="bg-card text-left text-xs uppercase tracking-wider text-navy/60">
                <tr>
                  <th scope="col" className="px-4 py-2 font-bold">
                    Item
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-bold">
                    Valor
                  </th>
                  <th scope="col" className="px-4 py-2 font-bold">
                    Quando
                  </th>
                  <th scope="col" className="px-4 py-2 font-bold">
                    Observação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ITENS_FIXOS.map((linha) => (
                  <tr key={linha.item}>
                    <th scope="row" className="px-4 py-2.5 text-left align-top font-medium text-foreground">
                      {linha.item}
                    </th>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right align-top font-mono font-bold text-navy">
                      {linha.valor}
                    </td>
                    <td className="px-4 py-2.5 align-top text-muted-foreground">{linha.quando}</td>
                    <td className="px-4 py-2.5 align-top text-muted-foreground">{linha.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">Comissão por faixa</h3>
            <p className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
              A faixa sai da margem bruta do fornecedor, mais que do nicho. Nicho a nicho, com o porquê de cada
              número, está em{" "}
              <Link href="/admin/precificacao" className="font-semibold text-navy underline underline-offset-2">
                Precificação
              </Link>
              .
            </p>
            <table className="w-full min-w-[680px] text-sm">
              <caption className="sr-only">Comissão de 1ª compra e recompra por faixa de margem</caption>
              <thead className="bg-card text-left text-xs uppercase tracking-wider text-navy/60">
                <tr>
                  <th scope="col" className="px-4 py-2 font-bold">
                    Faixa
                  </th>
                  <th scope="col" className="px-4 py-2 font-bold">
                    Quando usar
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-bold">
                    1ª compra
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-bold">
                    Recompra
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-bold">
                    Nichos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ORDEM.map((faixa) => {
                  const nichos = NICHOS.filter((n) => n.faixa === faixa);
                  const especial = faixa === "especial";
                  return (
                    <tr key={faixa}>
                      <th scope="row" className="px-4 py-2.5 text-left align-top font-medium text-foreground">
                        {FAIXAS[faixa].rotulo}
                      </th>
                      <td className="px-4 py-2.5 align-top text-muted-foreground">
                        {especial
                          ? nichos.map((n) => (
                              <span key={n.id} className="block">
                                {n.nicho}:{" "}
                                {n.modelo === "percentual"
                                  ? `${pct(n.aquisicao)} / ${pct(n.recorrencia)}`
                                  : `${n.aquisicaoTexto}; ${n.recorrenciaTexto.toLowerCase()}`}
                              </span>
                            ))
                          : FAIXAS[faixa].criterio}
                      </td>
                      <td className="px-4 py-2.5 text-right align-top font-mono font-bold text-navy">
                        {especial ? "—" : taxasDaFaixa(nichos, "aquisicao")}
                      </td>
                      <td className="px-4 py-2.5 text-right align-top font-mono font-bold text-navy">
                        {especial ? "—" : taxasDaFaixa(nichos, "recorrencia")}
                      </td>
                      <td className="px-4 py-2.5 text-right align-top font-mono text-muted-foreground">
                        {nichos.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <h3 className="border-b border-border px-4 py-3 font-semibold text-navy">Por tipo de cadeira</h3>
            <table className="w-full min-w-[560px] text-sm">
              <caption className="sr-only">Como a ROI Labs ganha em cada tipo de cadeira</caption>
              <tbody className="divide-y divide-border">
                {TIPOS_CADEIRA.map((tipo) => (
                  <tr key={tipo.id}>
                    <th scope="row" className="w-48 px-4 py-2.5 text-left align-top font-semibold text-navy">
                      <Link
                        href={`/admin/entregaveis?cadeira=${tipo.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {tipo.name}
                      </Link>
                    </th>
                    <td className="px-4 py-2.5 align-top text-foreground">
                      {tipo.cobranca.replace(/^Anuidade/, `Anuidade + domínio (${brl(ENTRADA_ANO)}/ano)`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="dominio" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          <h2 id="dominio" className="font-semibold text-navy">
            Domínio próprio na Hostinger — {brl(DOMINIO_ANO)}/ano
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Toda cadeira vai ao ar com o domínio do próprio cliente. É o endereço que o Google e as IAs passam a
            conhecer, então não pode vencer.
          </p>
          <ul className="mt-3 space-y-1.5">
            {REGRAS_DOMINIO.map((regra) => (
              <li key={regra} className="flex gap-2 text-sm">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <span>{regra}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <h2 className="font-semibold text-navy">Contrato e cobrança</h2>
          <ul className="mt-3 space-y-1.5">
            {[...REGRAS_CONTRATO, ...REGRAS_NEGOCIACAO].map((regra) => (
              <li key={regra} className="flex gap-2 text-sm">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <span>{regra}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AdminShell>
  );
}
