/**
 * Documento da proposta — a única coisa que o cliente vê.
 *
 * O `ProposalDoc` é congelado no save (coluna `doc` jsonb) e a página pública
 * só o renderiza. Duas consequências de propósito:
 *
 * 1. Nenhum campo de custo, margem ou piso existe neste tipo. A página pública
 *    não tem de onde vazar o interno, porque não lê o catálogo nem a proposta
 *    calculada — lê só isto.
 * 2. Mudar a tabela de preço amanhã não reescreve proposta já enviada. O
 *    documento é o que foi oferecido naquele dia.
 */

import { findOffer, serviceOf } from "./catalog";
import { splitCustomLabel } from "./format";
import type { QuoteResult } from "./quote";

export const PROPOSAL_VALID_DAYS = 15;

function hasOffer(quote: QuoteResult, prefix: string): boolean {
  return [...quote.recurring, ...quote.oneTime].some((line) => line.offerId.startsWith(prefix));
}

/**
 * Condições padrão. Um lugar só para editar o que sai na proposta — mas cada
 * termo só entra se tiver o que fazer ali.
 *
 * Condição genérica não é neutra: num chamado avulso de R$ 350, ler "contrato
 * de 6 meses" e "50% na assinatura" faz o cliente perguntar se paga metade
 * agora em vez de aceitar. `when` ausente = sempre.
 */
export type ProposalTerm = {
  /** Estável: é o que o simulador manda de volta para desmarcar. Não renomeie. */
  id: string;
  text: string;
  when?: (quote: QuoteResult) => boolean;
  /**
   * O que a Vértice perde se esta condição sair da proposta. Só as que LIMITAM
   * o que a agência promete têm risco — desmarcar essas não é ajuste de texto,
   * é assumir o custo. O simulador mostra esta frase na hora de desmarcar.
   */
  risk?: string;
};

export const PROPOSAL_TERMS: ProposalTerm[] = [
  {
    id: "recorrente-fidelidade",
    text: "Serviços recorrentes: contrato de 6 meses, com saída a partir do 3º mês avisando 30 dias antes.",
    when: (q) => q.recurring.length > 0,
  },
  {
    id: "mensal-sem-fidelidade",
    text: "Manutenção de site e licença de CRM são mensais, sem fidelidade.",
    when: (q) => hasOffer(q, "site-manutencao") || hasOffer(q, "crm-licenca"),
  },
  {
    id: "projeto-50-50",
    text: "Projetos e implantações: 50% na assinatura e 50% na entrega.",
    when: (q) => q.oneTime.some((line) => line.kind === "setup"),
  },
  {
    id: "mensalidade-faturamento",
    text: "Mensalidades: faturamento no dia 5, pagamento em até 5 dias.",
    when: (q) => q.recurring.length > 0,
  },
  {
    id: "avulso-na-entrega",
    text: "Serviços avulsos: pagamento na entrega.",
    when: (q) => q.oneTime.some((line) => line.kind === "avulso"),
  },
  {
    id: "reajuste-ipca",
    text: "Reajuste anual pelo IPCA + 3%.",
    when: (q) => q.recurring.length > 0,
  },
  {
    id: "verba-midia",
    text: "A verba de mídia não está inclusa: ela é paga pelo cliente, na conta e no cartão do cliente.",
    when: (q) =>
      hasOffer(q, "google-mensal") || hasOffer(q, "meta-mensal") || hasOffer(q, "ecom-gestao"),
    risk: "Sem ela, o cliente pode cobrar a verba de mídia da Vértice.",
  },
  {
    id: "revisoes-escopo",
    text: "Todo entregável de criação inclui 2 rodadas de revisão. O que não está descrito aqui é escopo novo, orçado e aprovado por escrito antes de executar.",
    risk: "Sem ela, revisão vira ilimitada e escopo novo vira de graça.",
  },
  {
    id: "contas-no-cliente",
    text: "Todas as contas e acessos ficam no nome do cliente. Em caso de encerramento, acessos devolvidos e dados exportados em até 5 dias úteis.",
  },
  {
    id: "sem-promessa-buscador",
    text: "Nenhuma posição em buscador é prometida.",
    when: (q) => hasOffer(q, "seo"),
    risk: "Sem ela, a proposta deixa de negar promessa de posição no Google.",
  },
];

/** As condições que se aplicam a esta simulação, na ordem em que saem na proposta. */
export function applicableTerms(quote: QuoteResult): ProposalTerm[] {
  return PROPOSAL_TERMS.filter((term) => term.when?.(quote) ?? true);
}

export type ProposalDocLine = {
  name: string;
  /** Serviço do catálogo ao qual a linha pertence. */
  group: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  recurring: boolean;
  sla: string | null;
  /** Entregáveis, em uma lista chapada — o cliente lê o que está incluso. */
  items: string[];
};

/** Caso de resultado mostrado como prova. Só número que está na imagem. */
export type ProposalProof = {
  heading: string;
  /** Nicho, fonte e período — o que torna o número conferível. */
  context: string;
  stats: { label: string; value: string }[];
  image: { src: string; width: number; height: number; alt: string } | null;
  note: string | null;
};

export type ProposalDoc = {
  version: 1;
  title: string;
  clientName: string;
  createdAt: string;
  validUntil: string;
  notes: string | null;
  lines: ProposalDocLine[];
  monthly: number;
  monthlyList: number;
  discountPct: number;
  oneTime: number;
  terms: string[];
  // Os campos abaixo só aparecem quando a proposta divide a página com outras
  // opções (coluna `bundle`). O simulador não os escreve: salvar a proposta de
  // novo por lá os apaga, e o cartão da opção fica só com título e preço.
  /** O que esta opção destrava, em uma frase. */
  summary?: string;
  /** Linha logo abaixo do preço ("contrato de 6 meses"). */
  priceNote?: string;
  /** Motivo de recomendar esta opção. Presente = opção recomendada. */
  recommended?: string;
  proof?: ProposalProof;
};

export function buildProposalDoc(input: {
  title: string;
  clientName: string;
  notes: string | null;
  validDays: number;
  quote: QuoteResult;
  /**
   * Ids das condições padrão que o dono desmarcou nesta proposta. Só remove: o
   * texto das condições padrão nunca vem do formulário, então o cliente do
   * navegador não tem como inventar cláusula nova por aqui.
   */
  droppedTerms?: string[];
  /** Condições escritas à mão, válidas só nesta proposta. Entram no fim. */
  extraTerms?: string[];
}): ProposalDoc {
  const { quote } = input;
  const dropped = new Set(input.droppedTerms ?? []);
  const now = new Date();
  const validUntil = new Date(now.getTime() + input.validDays * 86_400_000);

  const docLines: ProposalDocLine[] = [...quote.recurring, ...quote.oneTime].map((line) => {
    const offer = line.offerId.startsWith("livre:") ? undefined : findOffer(line.offerId);
    const custom = offer ? null : splitCustomLabel(line.name);

    return {
      name: custom ? custom.name : line.name,
      group: offer ? serviceOf(offer.id)?.name ?? "Serviço" : "Sob medida",
      qty: line.qty,
      unit: line.unit,
      unitPrice: line.unitPrice,
      total: line.final,
      recurring: line.kind === "recorrente",
      sla: line.sla,
      items: offer ? offer.deliverables.flatMap((group) => group.items) : custom?.items ?? [],
    };
  });

  return {
    version: 1,
    title: input.title,
    clientName: input.clientName,
    createdAt: now.toISOString(),
    validUntil: validUntil.toISOString(),
    notes: input.notes,
    lines: docLines,
    monthly: quote.monthlyFinal,
    monthlyList: quote.monthlyList,
    discountPct: quote.discountPct,
    oneTime: quote.oneTimeTotal,
    terms: [
      ...applicableTerms(quote)
        .filter((term) => !dropped.has(term.id))
        .map((term) => term.text),
      ...(input.extraTerms ?? []),
    ],
  };
}
