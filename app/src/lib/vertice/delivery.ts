/**
 * Documento do termo de entrega — a única coisa que o cliente vê em /e/<slug>.
 *
 * Espelha `proposal.ts` de propósito: o `DeliveryDoc` é congelado no save
 * (coluna `doc` jsonb) e a página pública só o renderiza. Nenhum campo de custo,
 * margem ou piso existe neste módulo — o preço ao cliente sim, no bloco Registro,
 * porque é o número que já foi combinado com ele.
 */

import { splitCustomLabel } from "./format";
import type { ProposalDoc } from "./proposal";

export type DeliveryKind = "final" | "marco";

export type DeliverySection =
  | { id: string; heading: string; shape: "items"; items: { name: string; details: string[] }[] }
  | { id: string; heading: string; shape: "rows"; rows: [string, string, string][] }
  | { id: string; heading: string; shape: "lines"; marker: "bullet" | "check"; lines: string[] };

export type DeliveryDoc = {
  version: 1;
  kind: DeliveryKind;
  title: string;
  clientName: string;
  createdAt: string;
  /** `YYYY-MM-DD`, formatado para pt-BR só na renderização. Vazio = sem data. */
  completedAt: string;
  summary: string | null;
  sections: DeliverySection[];
  registro: { serviceLabel: string; amount: number | null; paidAt: string | null };
  closing: string;
};

/**
 * O que o formulário manda. Vai para a coluna `input` e é o que reabre o termo
 * para edição — igual a `lines` em `proposals`.
 *
 * Repare no que NÃO está aqui: `heading`. O título de cada seção sai da definição
 * no código, então o navegador só consegue TIRAR seção e mandar conteúdo — nunca
 * inventar seção nova. Mesmo princípio de `droppedTerms` em `saveProposal`.
 */
export type DeliveryInput = {
  kind: DeliveryKind;
  title: string;
  completedAt: string;
  summary: string | null;
  /** Ids das seções ligadas. */
  enabled: string[];
  /** Texto cru de cada seção, por id, do jeito que foi digitado. */
  text: Record<string, string>;
  registro: { serviceLabel: string; amount: number | null; paidAt: string | null };
};

export type DeliverySectionDef = {
  /** Estável: é o que o formulário devolve para ligar e desligar. Não renomeie. */
  id: string;
  heading: string;
  shape: DeliverySection["shape"];
  /** Só em `lines`: o marcador vem daqui, o renderizador não adivinha pelo id. */
  marker?: "bullet" | "check";
  /** Tipos de termo em que a seção nasce ligada. */
  defaultFor: DeliveryKind[];
};

/**
 * As seis seções, fixas no código. Seção livre faria cada termo sair diferente;
 * ligar e desligar cobre o caso real sem perder o formato.
 */
export const DELIVERY_SECTIONS: DeliverySectionDef[] = [
  {
    id: "entregue",
    heading: "O que foi entregue",
    shape: "items",
    defaultFor: ["final", "marco"],
  },
  {
    id: "localizacao",
    heading: "Onde está cada coisa agora",
    shape: "rows",
    defaultFor: ["final"],
  },
  {
    id: "conferencia",
    heading: "Como conferir a entrega",
    shape: "lines",
    marker: "check",
    defaultFor: ["final", "marco"],
  },
  {
    // Um marco não transfere responsabilidade nem desliga ambiente.
    id: "responsabilidades",
    heading: "O que passa a ser responsabilidade do cliente",
    shape: "lines",
    marker: "bullet",
    defaultFor: ["final"],
  },
  {
    id: "fora",
    heading: "O que não está incluso",
    shape: "lines",
    marker: "bullet",
    defaultFor: ["final", "marco"],
  },
  {
    // Só migração precisa dela: nasce desligada nos dois tipos.
    id: "anterior",
    heading: "Ambiente anterior",
    shape: "lines",
    marker: "bullet",
    defaultFor: [],
  },
];

/** O fecho sai do tipo do termo, não do formulário. */
export const DELIVERY_CLOSING: Record<DeliveryKind, string> = {
  final:
    "Este serviço está encerrado. O que vier a partir daqui é escopo novo, orçado e aprovado por escrito antes de executar.",
  marco:
    "Esta etapa está entregue. O contrato segue em andamento; as próximas entregas têm termo próprio.",
};

export function defaultSections(kind: DeliveryKind): string[] {
  return DELIVERY_SECTIONS.filter((def) => def.defaultFor.includes(kind)).map((def) => def.id);
}

/**
 * `YYYY-MM-DD` → `DD/MM/AAAA` no braço. `new Date("2026-09-09")` é meia-noite
 * UTC, que em São Paulo ainda é dia 8 — o termo mostraria a data errada por um
 * dia inteiro, justamente no campo que ele existe para registrar.
 */
export function brDate(ymd: string): string {
  const [year, month, day] = String(ymd ?? "").split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}

/** Seção `lines`: um item por linha; marcador digitado sai para não duplicar com o da tela. */
function parseLines(text: string): string[] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•·]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

/** Seção `rows`: uma linha por item, colunas separadas por `|`. */
function parseRows(text: string): [string, string, string][] {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const [item = "", where = "", owner = ""] = line.split("|").map((cell) => cell.trim());
      return [item, where, owner] as [string, string, string];
    })
    .filter((row) => row.some((cell) => cell.length > 0));
}

/**
 * Seção `items`: blocos separados por linha em branco, nome na primeira linha e
 * marcadores nas demais. É o mesmo formato das linhas livres do simulador, então
 * `splitCustomLabel` é reaproveitado — o operador já conhece a regra.
 */
function parseItems(text: string): { name: string; details: string[] }[] {
  return String(text ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => splitCustomLabel(block))
    .filter((block) => block.name.length > 0)
    .map((block) => ({ name: block.name, details: block.items }));
}

function sectionFrom(def: DeliverySectionDef, text: string): DeliverySection | null {
  if (def.shape === "items") {
    const items = parseItems(text);
    return items.length > 0 ? { id: def.id, heading: def.heading, shape: "items", items } : null;
  }

  if (def.shape === "rows") {
    const rows = parseRows(text);
    return rows.length > 0 ? { id: def.id, heading: def.heading, shape: "rows", rows } : null;
  }

  const lines = parseLines(text);
  return lines.length > 0
    ? { id: def.id, heading: def.heading, shape: "lines", marker: def.marker ?? "bullet", lines }
    : null;
}

/**
 * Congela o documento. Roda no servidor: o `heading` sai da definição, o `closing`
 * sai do `kind`, e o que estiver desligado ou vazio simplesmente não existe no doc.
 */
export function buildDeliveryDoc(input: DeliveryInput, clientName: string): DeliveryDoc {
  const enabled = new Set(input.enabled ?? []);

  const sections = DELIVERY_SECTIONS.filter((def) => enabled.has(def.id))
    .map((def) => sectionFrom(def, input.text?.[def.id] ?? ""))
    .filter((section) => section !== null) as DeliverySection[];

  return {
    version: 1,
    kind: input.kind,
    title: input.title,
    clientName,
    createdAt: new Date().toISOString(),
    completedAt: input.completedAt,
    summary: input.summary,
    sections,
    registro: input.registro,
    closing: DELIVERY_CLOSING[input.kind],
  };
}

/**
 * Pré-preenchimento a partir de uma proposta: cada linha vira um item de "O que
 * foi entregue", com os entregáveis como marcadores. É pré-preenchimento, não
 * vínculo — o operador edita ou remove antes de salvar.
 */
export function sectionsFromProposal(doc: ProposalDoc): DeliverySection[] {
  const def = DELIVERY_SECTIONS.find((section) => section.id === "entregue");
  const items = (doc?.lines ?? []).map((line) => ({ name: line.name, details: line.items ?? [] }));
  if (!def || items.length === 0) return [];
  return [{ id: def.id, heading: def.heading, shape: "items", items }];
}

/** Uma seção de volta no formato do textarea — é assim que o pré-preenchimento chega ao formulário. */
export function sectionText(section: DeliverySection): string {
  if (section.shape === "items") {
    return section.items
      .map((item) => [item.name, ...item.details.map((detail) => `- ${detail}`)].join("\n"))
      .join("\n\n");
  }
  if (section.shape === "rows") return section.rows.map((row) => row.join(" | ")).join("\n");
  return section.lines.join("\n");
}

// ---------------------------------------------------------------------------
// Autoteste. Roda com: npm run check:entrega
// ponytail: assert em vez de framework de teste, igual a quote.ts. O que precisa
// falhar alto é o contrato do documento — seção desligada, seção vazia, título
// vindo do navegador e o fecho por tipo.
// ---------------------------------------------------------------------------

export function check(): void {
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`FALHOU: ${message}`);
  };

  const base = (over: Partial<DeliveryInput> = {}): DeliveryInput => ({
    kind: "final",
    title: "Termo de entrega — Migração",
    completedAt: "2026-09-09",
    summary: null,
    enabled: defaultSections("final"),
    text: {
      entregue: "Código-fonte\n- Repositório transferido\n- Histórico preservado",
      localizacao: "Repositório | github.com/seven-md/loja | Seven-MD",
      conferencia: "Abrir a loja e navegar por um produto.",
      responsabilidades: "Backup do banco de dados.",
      fora: "Manutenção não está inclusa.",
      anterior: "",
    },
    registro: { serviceLabel: "Migração", amount: 400, paidAt: "2026-09-05" },
    ...over,
  });

  // Seção desligada não entra no doc, mesmo com texto preenchido.
  const semLocalizacao = buildDeliveryDoc(
    base({ enabled: defaultSections("final").filter((id) => id !== "localizacao") }),
    "Seven-MD"
  );
  assert(
    !semLocalizacao.sections.some((s) => s.id === "localizacao"),
    "seção desligada não deveria entrar no doc"
  );

  // Seção ligada e vazia não entra: título órfão no PDF é pior que seção faltando.
  const comAnterior = buildDeliveryDoc(
    base({ enabled: [...defaultSections("final"), "anterior"] }),
    "Seven-MD"
  );
  assert(
    !comAnterior.sections.some((s) => s.id === "anterior"),
    "seção ligada e vazia não deveria entrar no doc"
  );

  // O título da seção vem do código. Mandar `heading` pelo formulário não muda nada.
  const injetado = buildDeliveryDoc(
    base({ heading: "Título inventado pelo navegador" } as unknown as Partial<DeliveryInput>),
    "Seven-MD"
  );
  const entregue = injetado.sections.find((s) => s.id === "entregue");
  assert(
    entregue?.heading === "O que foi entregue",
    `heading deveria vir do código, veio "${entregue?.heading}"`
  );

  // Defaults por tipo: marco não liga localização nem responsabilidades.
  assert(
    defaultSections("final").includes("responsabilidades") &&
      !defaultSections("marco").includes("responsabilidades"),
    "marco não deveria transferir responsabilidade por padrão"
  );
  assert(
    defaultSections("final").includes("localizacao") &&
      !defaultSections("marco").includes("localizacao"),
    "marco não deveria ligar a seção de localização por padrão"
  );
  assert(
    !defaultSections("final").includes("anterior") && !defaultSections("marco").includes("anterior"),
    "ambiente anterior nasce desligada nos dois tipos"
  );

  // O fecho acompanha o tipo, e não vem do formulário.
  assert(
    buildDeliveryDoc(base(), "Seven-MD").closing === DELIVERY_CLOSING.final,
    "termo final deveria fechar com o texto de encerramento"
  );
  assert(
    buildDeliveryDoc(base({ kind: "marco", enabled: defaultSections("marco") }), "Seven-MD")
      .closing === DELIVERY_CLOSING.marco,
    "marco deveria fechar com o texto de contrato em andamento"
  );

  // Formatos: item com marcadores, linha de tabela em 3 colunas, marcador de caixa.
  const doc = buildDeliveryDoc(base(), "Seven-MD");
  const itens = doc.sections.find((s) => s.id === "entregue");
  assert(
    itens?.shape === "items" && itens.items[0].name === "Código-fonte",
    "primeiro bloco deveria virar o nome do item"
  );
  assert(
    itens?.shape === "items" && itens.items[0].details.length === 2,
    "os marcadores do item deveriam ser 2"
  );
  const tabela = doc.sections.find((s) => s.id === "localizacao");
  assert(
    tabela?.shape === "rows" && tabela.rows[0][2] === "Seven-MD",
    "a terceira coluna da tabela deveria ser o dono"
  );
  const conferencia = doc.sections.find((s) => s.id === "conferencia");
  assert(
    conferencia?.shape === "lines" && conferencia.marker === "check",
    "o marcador de caixa vem da definição da seção"
  );
  const fora = doc.sections.find((s) => s.id === "fora");
  assert(
    fora?.shape === "lines" && fora.marker === "bullet",
    "seção sem marcador declarado cai em bullet"
  );

  // Pré-preenchimento a partir da proposta: linha vira item, entregáveis viram marcadores.
  const daProposta = sectionsFromProposal({
    version: 1,
    title: "Proposta Seven-MD",
    clientName: "Seven-MD",
    createdAt: "2026-09-01T12:00:00.000Z",
    validUntil: "2026-09-16T12:00:00.000Z",
    notes: null,
    lines: [
      {
        name: "Migração do e-commerce",
        group: "Sob medida",
        qty: 1,
        unit: "un",
        unitPrice: 400,
        total: 400,
        recurring: false,
        sla: null,
        items: ["Exportação da base", "Ambiente configurado"],
      },
    ],
    monthly: 0,
    monthlyList: 0,
    discountPct: 0,
    oneTime: 400,
    terms: [],
  });
  assert(
    daProposta[0]?.shape === "items" && daProposta[0].items[0].name === "Migração do e-commerce",
    "a linha da proposta deveria virar o nome do item entregue"
  );
  assert(
    daProposta[0]?.shape === "items" && daProposta[0].items[0].details.length === 2,
    "os entregáveis da proposta deveriam virar os marcadores do item"
  );

  // Ida e volta: o texto que sai para o formulário volta na mesma seção.
  const revolta = buildDeliveryDoc(
    base({ enabled: ["entregue"], text: { entregue: sectionText(daProposta[0]) } }),
    "Seven-MD"
  );
  assert(
    revolta.sections[0]?.shape === "items" &&
      revolta.sections[0].items[0].details[1] === "Ambiente configurado",
    "o pré-preenchimento deveria voltar do textarea igual ao que saiu"
  );

  // A data não pode andar um dia para trás no fuso.
  assert(
    brDate("2026-09-09") === "09/09/2026",
    `data deveria sair 09/09/2026, veio ${brDate("2026-09-09")}`
  );
  assert(brDate("") === "", "data vazia sai vazia, não `Invalid Date`");
}
