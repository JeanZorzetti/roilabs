/**
 * Contrato de prestação de serviços — o que o cliente lê e aceita em /c/<slug>.
 *
 * Mesmo desenho do termo de entrega: o `ContractDoc` é congelado no save (coluna
 * `doc` jsonb) e a página pública só o renderiza. O escopo e o preço saem da
 * proposta, relida no servidor; as cláusulas saem daqui. Do formulário só vêm a
 * qualificação das partes, o prazo, o foro e as formas de pagamento.
 */

import { brDate } from "./delivery";
import { money } from "./format";
import type { ProposalDoc, ProposalDocLine } from "./proposal";

export type ContractParty = {
  /** Razão social, ou nome completo se for pessoa física. */
  name: string;
  /** CNPJ ou CPF, do jeito que foi digitado. */
  document: string;
  address: string;
  /** Nome e CPF de quem assina pela empresa. Pessoa física não precisa. */
  representative: string;
  email: string;
};

export type ContractInput = {
  title: string;
  contratante: ContractParty;
  contratada: ContractParty;
  /** `YYYY-MM-DD`. Vazio = a vigência conta da data do aceite. */
  startDate: string;
  /** Vigência em meses. Só vale para proposta com mensalidade. */
  months: number;
  /** Comarca do foro, com UF. */
  forum: string;
  /** Uma forma de pagamento por linha. */
  payment: string;
  /** Cláusulas combinadas só com este cliente, uma por linha. */
  extra: string;
};

/** Um item de `body`: texto é parágrafo, lista é lista. */
export type ContractClause = { id: string; heading: string; body: (string | string[])[] };

export type ContractDoc = {
  version: 1;
  title: string;
  clientName: string;
  createdAt: string;
  contratante: ContractParty;
  contratada: ContractParty;
  proposalTitle: string;
  /** Anexo I. Cópia das linhas da proposta no dia em que o contrato foi salvo. */
  lines: ProposalDocLine[];
  clauses: ContractClause[];
  /**
   * O que falta preencher. Enquanto não estiver vazio, a página pública não
   * mostra o aceite e o banco recusa o aceite — contrato com CNPJ em branco não
   * se fecha.
   */
  missing: string[];
};

export const PLACEHOLDER = "[a preencher]";

/** Vigência padrão: a mesma das condições da proposta ("contrato de 6 meses"). */
export const CONTRACT_MONTHS = 6;

const digits = (value: string) => value.replace(/\D/g, "");
const isPerson = (party: ContractParty) => digits(party.document).length === 11;
const or = (value: string) => value.trim() || PLACEHOLDER;

/** Qualificação da parte, do jeito que abre um contrato. Campo vazio sai como marcador. */
export function qualify(party: ContractParty): string {
  const kind = isPerson(party) ? "CPF" : "CNPJ";
  const home = isPerson(party) ? "residente em" : "com sede em";
  const parts = [`${or(party.name)}, ${kind} nº ${or(party.document)}`, `${home} ${or(party.address)}`];
  if (!isPerson(party)) parts.push(`representada por ${or(party.representative)}`);
  if (party.email.trim()) parts.push(`e-mail ${party.email.trim()}`);
  return parts.join(", ");
}

/**
 * `YYYY-MM-DD` + meses, pelo art. 132, § 3º, do Código Civil: o prazo vence no
 * dia de igual número do mês final, ou no dia seguinte se esse mês não tiver o
 * dia. Conta em UTC puro para o fuso não andar a data.
 */
export function addMonths(ymd: string, months: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const end = day <= lastDay
    ? new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day))
    : new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 1));
  return end.toISOString().slice(0, 10);
}

const splitLines = (text: string) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•·]\s*/, "").trim())
    .filter(Boolean);

/** O que impede o aceite. Nome humano, porque aparece no admin. */
function missingFields(input: ContractInput): string[] {
  const missing: string[] = [];
  const roles = [
    ["contratante", input.contratante],
    ["contratada", input.contratada],
  ] as const;

  for (const [role, party] of roles) {
    if (!party.name.trim()) missing.push(`Nome (${role})`);
    if (!party.document.trim()) missing.push(`CNPJ ou CPF (${role})`);
    if (!party.address.trim()) missing.push(`Endereço (${role})`);
    if (!isPerson(party) && !party.representative.trim()) missing.push(`Representante (${role})`);
  }
  if (!input.forum.trim()) missing.push("Foro");

  // Marcador digitado à mão ("[percentual]") também trava: é o jeito de o dono
  // deixar um buraco no texto sem esquecer dele.
  const free = [input.title, input.payment, input.extra, ...roles.flatMap(([, p]) => Object.values(p))];
  for (const text of free) {
    for (const match of String(text).match(/\[[^\]]+\]/g) ?? []) missing.push(`Texto com ${match}`);
  }
  return [...new Set(missing)];
}

/**
 * Monta o documento. Roda no servidor: `proposal` é a proposta relida do banco,
 * não o que o navegador mandou, e o título de cada cláusula sai daqui.
 */
export function buildContractDoc(
  input: ContractInput,
  proposal: ProposalDoc,
  clientName: string
): ContractDoc {
  const recurring = proposal.monthly > 0;
  const oneTime = proposal.oneTime > 0;
  const hasSeo = proposal.lines.some((line) => /seo/i.test(line.group));
  const months = recurring ? input.months : 0;
  const start = brDate(input.startDate);
  const payment = splitLines(input.payment);
  const extra = splitLines(input.extra);

  const prices: string[] = [];
  if (recurring) {
    prices.push(
      `${money(proposal.monthly)} por mês, durante ${months} meses, no total de ${money(Math.round(proposal.monthly * months * 100) / 100)}`
    );
  }
  if (oneTime) prices.push(`${money(proposal.oneTime)} em parcela única${recurring ? ", pelos serviços pontuais" : ""}`);

  const clauses: (ContractClause | false)[] = [
    {
      id: "objeto",
      heading: "Objeto",
      body: [
        `A CONTRATADA presta à CONTRATANTE os serviços descritos no Anexo I, que reproduz a proposta “${proposal.title}”.`,
        "O que não está descrito no Anexo I não está contratado. Pedido fora dele é escopo novo: a CONTRATADA orça, e só executa depois da aprovação por escrito da CONTRATANTE.",
        "Todo entregável de criação inclui 2 rodadas de revisão, salvo número diferente indicado no Anexo I. Rodada além dessas é escopo novo.",
      ],
    },
    {
      id: "vigencia",
      heading: "Vigência",
      body: recurring
        ? [
            start
              ? `Este contrato vale por ${months} meses, de ${start} a ${brDate(addMonths(input.startDate, months))}.`
              : `Este contrato vale por ${months} meses, contados da data do aceite eletrônico.`,
            "Ao fim do prazo, o contrato se encerra sem renovação automática. Continuar exige nova proposta, com preço e prazo próprios, aceita por escrito.",
          ]
        : [
            `Este contrato começa ${start ? `em ${start}` : "na data do aceite eletrônico"} e se encerra com a entrega dos serviços, registrada em termo de entrega.`,
          ],
    },
    {
      id: "prazos",
      heading: "Prazos",
      body: [
        "Os prazos do Anexo I contam em dias úteis e só começam quando a CONTRATADA recebe o último acesso ou material de que precisa para o serviço.",
        "Atraso da CONTRATANTE em aprovar, responder ou fornecer material empurra a entrega pelo mesmo número de dias. A CONTRATADA avisa por escrito no dia em que o atraso acontece.",
      ],
    },
    {
      id: "preco",
      heading: "Preço e pagamento",
      body: [
        `Pelos serviços, a CONTRATANTE paga ${prices.join(", mais ")}.`,
        ...(payment.length > 0 ? ["Formas de pagamento:", payment] : []),
        recurring
          ? months > 12
            ? "O preço é reajustado a cada 12 meses pelo IPCA acumulado no período, mais 3%."
            : "O preço é fixo durante toda a vigência."
          : "",
        "Atraso de pagamento gera multa de 2% e juros de 1% ao mês, proporcionais aos dias. Com mais de 15 dias de atraso, a CONTRATADA pode suspender os serviços, avisando por escrito, até a regularização. A suspensão não estende a vigência.",
      ].filter((item) => item !== ""),
    },
    {
      id: "obrigacoes-contratada",
      heading: "Obrigações da CONTRATADA",
      body: [
        [
          "Executar os serviços do Anexo I nos prazos indicados.",
          "Manter um responsável nomeado pelo projeto.",
          "Atender pelo canal oficial — o grupo de WhatsApp do projeto e o e-mail — de segunda a sexta, das 9h às 18h, exceto feriados nacionais.",
          "Dar a primeira resposta em até 1 dia útil, e em até 4 horas úteis nas urgências: site fora do ar, conta de anúncio suspensa ou cobrança indevida.",
          ...(recurring ? ["Enviar o relatório mensal até o 5º dia útil do mês seguinte."] : []),
        ],
      ],
    },
    {
      id: "obrigacoes-contratante",
      heading: "Obrigações da CONTRATANTE",
      body: [
        [
          "Indicar um responsável único, com poder para aprovar.",
          "Fornecer os acessos administrativos e o material pedidos no início do trabalho.",
          "Aprovar ou pedir ajuste em até 5 dias úteis.",
          "Pagar nos prazos combinados.",
          "Responder pela veracidade e pelos direitos do material que fornece, como textos, imagens e marcas, e pelo cumprimento das normas do seu setor, inclusive as de publicidade.",
        ],
      ],
    },
    {
      id: "fora",
      heading: "O que não está incluído",
      body: [
        "Não estão incluídos: verba de mídia; licenças de terceiros, como plataforma de loja, ferramenta de e-mail, banco de imagens premium, domínio e plugins pagos; produção de vídeo, fotografia, locução e animação; identidade visual; gestão de redes sociais; atendimento de leads; assessoria de imprensa; influenciadores; e suporte a sistema de terceiros que a CONTRATADA não implantou.",
        "Custos de terceiros são pagos pela CONTRATANTE, em nome dela.",
        ...(hasSeo
          ? [
              "A CONTRATADA não promete posição em buscador nem volume de visitas: o resultado depende de fatores que ela não controla, como os algoritmos dos buscadores e a concorrência.",
            ]
          : []),
      ],
    },
    {
      id: "contas",
      heading: "Contas, acessos e propriedade",
      body: [
        "Todas as contas — domínio, hospedagem, Analytics, Search Console, anúncios e loja — ficam no nome da CONTRATANTE. A CONTRATADA entra como usuária.",
        "O que a CONTRATADA produzir neste contrato passa a ser da CONTRATANTE depois de pago.",
        "A CONTRATADA pode citar a CONTRATANTE como cliente e o trabalho como caso, sem expor informação confidencial, salvo pedido contrário por escrito.",
        "No encerramento, a CONTRATADA devolve os acessos e exporta os dados em até 5 dias úteis.",
      ],
    },
    {
      id: "dados",
      heading: "Confidencialidade e dados pessoais",
      body: [
        "Cada parte mantém em sigilo as informações não públicas da outra, durante o contrato e por 2 anos depois dele.",
        "Quando tratar dados pessoais em nome da CONTRATANTE, a CONTRATADA age como operadora, nos termos da Lei 13.709/2018 (LGPD): segue as instruções da CONTRATANTE, usa os dados só para executar este contrato e comunica incidente de segurança em até 2 dias úteis da ciência. A CONTRATANTE, como controladora, responde pela base legal do tratamento.",
      ],
    },
    {
      id: "rescisao",
      heading: "Rescisão",
      body: [
        ...(recurring
          ? [
              "A partir do 3º mês, qualquer parte pode encerrar o contrato avisando por escrito com 30 dias de antecedência. Os serviços do período de aviso são prestados e pagos normalmente.",
              "Se a CONTRATANTE sair sem justa causa antes do 3º mês, paga as mensalidades que faltam para completar 3 meses.",
            ]
          : [
              "A CONTRATANTE pode desistir antes da entrega, avisando por escrito, e paga o trabalho já feito, na proporção do escopo.",
            ]),
        "Qualquer parte pode encerrar o contrato de imediato se a outra descumprir uma obrigação e não corrigir em 10 dias úteis após aviso por escrito.",
      ],
    },
    recurring && {
      id: "reembolso",
      heading: "Pagamento antecipado",
      body: [
        "Se o pagamento foi feito adiantado e o contrato se encerrar antes do fim, a CONTRATADA devolve em até 10 dias úteis o que foi pago além dos meses já prestados. Os meses prestados contam pela mensalidade cheia, sem o desconto do pagamento à vista.",
      ],
    },
    {
      id: "responsabilidade",
      heading: "Responsabilidade",
      body: [
        `A responsabilidade da CONTRATADA por perdas ligadas a este contrato se limita ${recurring ? "ao que a CONTRATANTE pagou nos 3 meses anteriores ao fato" : "ao valor deste contrato"}, exceto em caso de dolo.`,
        "A CONTRATADA não responde por lucro cessante, nem por falha ou decisão de terceiros, como hospedagem, plataformas, buscadores e redes de anúncio.",
      ],
    },
    extra.length > 0 && {
      id: "especificas",
      heading: "Condições específicas",
      body: [extra],
    },
    {
      id: "gerais",
      heading: "Disposições gerais",
      body: [
        "Avisos e aprovações valem por escrito no canal oficial: o grupo de WhatsApp do projeto ou o e-mail das partes.",
        "Este contrato não cria vínculo de emprego, sociedade ou representação entre as partes. Tolerar um descumprimento não altera o contrato. Alteração só vale por escrito, aceita pelas duas partes.",
        "Em conflito entre a proposta e este contrato, vale o contrato.",
        "As partes reconhecem como válido o aceite eletrônico deste contrato, registrado com nome, data, hora, endereço IP e navegador, nos termos do art. 10, § 2º, da Medida Provisória 2.200-2/2001.",
      ],
    },
    {
      id: "foro",
      heading: "Foro",
      body: [`Fica eleito o foro da comarca de ${or(input.forum)} para resolver questões deste contrato.`],
    },
  ];

  return {
    version: 1,
    title: input.title,
    clientName,
    createdAt: new Date().toISOString(),
    contratante: input.contratante,
    contratada: input.contratada,
    proposalTitle: proposal.title,
    lines: proposal.lines,
    clauses: clauses.filter((c): c is ContractClause => Boolean(c)),
    missing: missingFields(input),
  };
}

// ---------------------------------------------------------------------------
// Autoteste. Roda com: npm run check:contrato
// ponytail: assert em vez de framework de teste, igual a delivery.ts. O que
// precisa falhar alto: cláusula que aparece no tipo errado de proposta, contrato
// incompleto que parece completo e prazo contado errado.
// ---------------------------------------------------------------------------

export function check(): void {
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`FALHOU: ${message}`);
  };

  const line = (over: Partial<ProposalDocLine>): ProposalDocLine => ({
    name: "Manutenção mensal",
    group: "Criação de Sites",
    qty: 1,
    unit: "un",
    unitPrice: 0,
    total: 0,
    recurring: true,
    sla: null,
    items: ["Monitoramento de uptime"],
    ...over,
  });

  const proposal = (over: Partial<ProposalDoc> = {}): ProposalDoc => ({
    version: 1,
    title: "Manutenção do site + SEO",
    clientName: "Mhédicos",
    createdAt: "2026-09-17T11:52:56.797Z",
    validUntil: "2026-10-02T11:52:56.797Z",
    notes: null,
    lines: [line({}), line({ name: "SEO contínuo", group: "Consultoria de SEO" })],
    monthly: 798.9,
    monthlyList: 798.9,
    discountPct: 0,
    oneTime: 0,
    terms: [],
    ...over,
  });

  const party = (name: string): ContractParty => ({
    name,
    document: "12.345.678/0001-90",
    address: "Rua A, 100, Curitiba/PR",
    representative: "Fulano de Tal, CPF 123.456.789-00",
    email: "contato@example.com",
  });

  const input = (over: Partial<ContractInput> = {}): ContractInput => ({
    title: "Contrato — Mhédicos",
    contratante: party("Mhédicos Ltda"),
    contratada: party("Vértice Marketing Ltda"),
    startDate: "2026-09-17",
    months: 6,
    forum: "Curitiba/PR",
    payment: "PIX à vista: R$ 4.553,73.\nBoleto: 6 parcelas de R$ 798,90.",
    extra: "",
    ...over,
  });

  const text = (doc: ContractDoc) => JSON.stringify(doc.clauses);
  const clause = (doc: ContractDoc, id: string) => doc.clauses.find((c) => c.id === id);

  // Mensal: vigência com as duas datas, sem renovação automática, e a saída do 3º mês.
  const mensal = buildContractDoc(input(), proposal(), "Mhédicos");
  assert(
    text(mensal).includes("17/09/2026") && text(mensal).includes("17/03/2027"),
    "vigência de 6 meses a partir de 17/09/2026 deveria ir até 17/03/2027"
  );
  assert(text(mensal).includes("sem renovação automática"), "mensal não renova sozinho");
  assert(text(mensal).includes("3º mês"), "mensal deveria ter a saída a partir do 3º mês");
  assert(text(mensal).includes("R$ 798,90 por mês"), "o preço mensal sai da proposta");
  assert(!text(mensal).includes("pagamento na entrega"), "mensal não fala em pagamento na entrega");

  // Avulso: sem vigência em meses, sem fidelidade.
  const avulso = buildContractDoc(
    input({ payment: "Pagamento na entrega." }),
    proposal({
      monthly: 0,
      oneTime: 368,
      lines: [line({ name: "Banners", group: "Sob medida", recurring: false, total: 368 })],
    }),
    "Mhédicos"
  );
  assert(!text(avulso).includes("3º mês"), "avulso não tem fidelidade");
  assert(!text(avulso).includes("meses"), "avulso não tem vigência em meses");
  assert(text(avulso).includes("R$ 368"), "o preço avulso sai da proposta");
  assert(text(avulso).includes("termo de entrega"), "avulso se encerra com o termo de entrega");
  assert(!clause(avulso, "reembolso"), "avulso não tem reembolso de mensalidade");

  // Promessa de posição só existe quando há SEO no escopo.
  assert(text(mensal).includes("posição em buscador"), "com SEO, nega promessa de posição");
  assert(!text(avulso).includes("posição em buscador"), "sem SEO, a cláusula não aparece");

  // Sem data de início, a vigência conta do aceite.
  const semInicio = buildContractDoc(input({ startDate: "" }), proposal(), "Mhédicos");
  assert(text(semInicio).includes("contados da data do aceite"), "sem início, conta do aceite");

  // Prazo em meses pelo art. 132, § 3º, do Código Civil: dia de igual número,
  // ou o seguinte quando o mês não tem esse dia.
  assert(addMonths("2026-09-17", 6) === "2027-03-17", "17/09 + 6 meses = 17/03");
  assert(addMonths("2026-08-31", 6) === "2027-03-01", "31/08 + 6 meses cai em 01/03 (fev. sem 31)");
  assert(addMonths("2027-08-29", 6) === "2028-02-29", "29/08 + 6 meses = 29/02 em ano bissexto");
  assert(addMonths("2026-11-30", 3) === "2027-03-01", "30/11 + 3 meses = 01/03");

  // Completo: nada a preencher.
  assert(mensal.missing.length === 0, `completo, mas faltou: ${mensal.missing.join(", ")}`);

  // Campo vazio da parte e marcador entre colchetes contam como pendência.
  const incompleto = buildContractDoc(
    input({
      contratante: { ...party("Mhédicos Ltda"), document: "" },
      forum: " ",
      payment: "Cartão: até 6x, com acréscimo de [percentual].",
    }),
    proposal(),
    "Mhédicos"
  );
  assert(incompleto.missing.includes("CNPJ ou CPF (contratante)"), "documento vazio é pendência");
  assert(incompleto.missing.includes("Foro"), "foro em branco é pendência");
  assert(
    incompleto.missing.some((item) => item.includes("[percentual]")),
    "marcador entre colchetes no pagamento é pendência"
  );

  // Pessoa física (CPF) não precisa de representante.
  const pf = buildContractDoc(
    input({
      contratante: { ...party("Maria Souza"), document: "123.456.789-00", representative: "" },
    }),
    proposal(),
    "Maria"
  );
  assert(pf.missing.length === 0, "pessoa física sem representante está completa");
  assert(qualify(pf.contratante).includes("CPF"), "11 dígitos se qualificam como CPF");

  // Título da cláusula vem do código, e texto extra entra só na cláusula própria.
  const injetado = buildContractDoc(
    { ...input({ extra: "Reunião extra no 1º mês." }), heading: "Inventado" } as ContractInput,
    proposal(),
    "Mhédicos"
  );
  assert(clause(injetado, "objeto")?.heading === "Objeto", "heading vem do código");
  assert(
    JSON.stringify(clause(injetado, "especificas")).includes("Reunião extra"),
    "cláusula específica entra na seção dela"
  );
  assert(!clause(mensal, "especificas"), "sem texto extra, a seção específica não existe");

  // Escopo copiado da proposta.
  assert(mensal.lines.length === 2 && mensal.proposalTitle === "Manutenção do site + SEO",
    "o Anexo I copia as linhas da proposta");
}
