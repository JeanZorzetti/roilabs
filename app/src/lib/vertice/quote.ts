/**
 * Simulador de proposta — aplica as regras do PRECIFICACAO-INTERNA §8 e §9.
 *
 * Puro, sem I/O. Autoteste no fim do arquivo — roda com:
 *   npm run check:quote
 */

import {
  BILLABLE_HOURS_PER_OPERATOR,
  HOUR_COST,
  MARGIN_FLOOR,
  SERVICES,
  combinationDiscount,
  brl,
  findOffer,
  hasTrafegoMensal,
  serviceOf,
  type Offer,
  type OfferKind,
} from "./catalog";
import { money } from "./format";
import {
  applicableTerms,
  buildProposalDoc,
  PROPOSAL_TERMS,
  PROPOSAL_VALID_DAYS,
  type ProposalDoc,
} from "./proposal";

export type CatalogLine = { offerId: string; qty: number };

/**
 * Linha livre: descrição, unidade e valor decididos na hora — é como se cobra a
 * hora ("2 h a R$ 350") ou um pacote fechado que não está na tabela.
 *
 * `hours` é o total estimado da linha, não por unidade: serve só para o custo
 * interno (horas × R$ 150) e nunca aparece na proposta do cliente.
 *
 * ponytail: linha livre é sempre avulsa. Recorrente sob medida ainda não
 * apareceu — quando aparecer, um campo `recurring` aqui resolve.
 */
export type CustomLine = {
  label: string;
  qty: number;
  unit: string;
  unitPrice: number;
  hours: number;
  /** Prazo mostrado ao cliente ("3 dias úteis"). Opcional. */
  sla?: string;
};

export type QuoteLine = CatalogLine | CustomLine;

export function isCustomLine(line: QuoteLine): line is CustomLine {
  return (line as CustomLine).label !== undefined;
}

export type QuotedLine = {
  offerId: string;
  name: string;
  serviceName: string;
  kind: OfferKind;
  qty: number;
  /** Unidade mostrada ao cliente: "mês", "hora", "chamado", "peça". */
  unit: string;
  unitPrice: number;
  /** Prazo de entrega mostrado ao cliente. Vem da oferta ou da linha livre. */
  sla: string | null;
  /** Preço de tabela × quantidade. */
  list: number;
  /** Depois do desconto de combinação (só nas recorrentes elegíveis). */
  final: number;
  cost: number;
  marginPct: number | null;
  hours: number;
  /** Piso de negociação da linha, quando existe. */
  floor: number | null;
  belowFloor: boolean;
  belowMarginFloor: boolean;
  variablePrice: boolean;
};

export type QuoteResult = {
  recurring: QuotedLine[];
  oneTime: QuotedLine[];
  discountPct: number;
  eligibleRecurringCount: number;
  monthlyList: number;
  monthlyFinal: number;
  monthlyCost: number;
  monthlyMarginPct: number | null;
  oneTimeTotal: number;
  oneTimeCost: number;
  oneTimeMarginPct: number | null;
  hoursPerMonth: number;
  capacityPct: number;
  warnings: string[];
};

function marginOf(price: number, cost: number): number | null {
  if (price <= 0) return null;
  return (price - cost) / price;
}

function quoteOne(offer: Offer, qty: number, discountPct: number): QuotedLine {
  const service = serviceOf(offer.id);
  const variablePrice = offer.price === null;
  const list = (offer.price ?? 0) * qty;
  const discountable = offer.kind === "recorrente" && offer.discountEligible;
  const final = discountable ? Math.round(list * (1 - discountPct)) : list;
  const cost = (offer.cost ?? 0) * qty;
  const floor = offer.floor ?? null;

  return {
    offerId: offer.id,
    name: offer.name,
    serviceName: service?.name ?? "—",
    kind: offer.kind,
    qty,
    // Oferta de catálogo é sempre cobrada por unidade contratada: 2× manutenção
    // são dois sites, não dois meses. O "/mês" quem coloca é o `recurring`.
    unit: "un",
    unitPrice: offer.price ?? 0,
    sla: offer.sla ?? null,
    list,
    final,
    cost,
    marginPct: variablePrice ? null : marginOf(final, cost),
    hours: (offer.hours ?? 0) * qty,
    floor,
    belowFloor: floor !== null && !variablePrice && final < floor * qty,
    belowMarginFloor:
      !variablePrice && final > 0 && (final - cost) / final < MARGIN_FLOOR,
    variablePrice,
  };
}

function quoteCustom(line: CustomLine, index: number): QuotedLine {
  const list = Math.round(line.unitPrice * line.qty);
  const cost = Math.round(line.hours * HOUR_COST);

  return {
    offerId: `livre:${index}`,
    name: line.label,
    serviceName: "Linha livre",
    kind: "avulso",
    qty: line.qty,
    unit: line.unit,
    unitPrice: line.unitPrice,
    sla: line.sla?.trim() || null,
    list,
    final: list,
    cost,
    marginPct: marginOf(list, cost),
    hours: line.hours,
    floor: null,
    belowFloor: false,
    belowMarginFloor: list > 0 && (list - cost) / list < MARGIN_FLOOR,
    variablePrice: false,
  };
}

export function buildQuote(lines: QuoteLine[], extraDiscountPct = 0): QuoteResult {
  const custom = lines.filter(
    (line): line is CustomLine => isCustomLine(line) && line.qty > 0 && line.label.trim().length > 0
  );

  const resolved = lines
    .filter((line): line is CatalogLine => !isCustomLine(line) && line.qty > 0)
    .map((line) => ({ offer: findOffer(line.offerId), qty: line.qty }))
    .filter((entry): entry is { offer: Offer; qty: number } => Boolean(entry.offer));

  const eligibleRecurringCount = resolved.filter(
    (e) => e.offer.kind === "recorrente" && e.offer.discountEligible
  ).length;

  // §8.4: desconto extra só contra 12 meses pré-pago, no máximo 10% além da tabela.
  const extra = Math.min(Math.max(extraDiscountPct, 0), 0.1);
  const discountPct = combinationDiscount(eligibleRecurringCount) + extra;

  const quoted = [
    ...resolved.map((e) => quoteOne(e.offer, e.qty, discountPct)),
    ...custom.map(quoteCustom),
  ];
  const recurring = quoted.filter((l) => l.kind === "recorrente");
  const oneTime = quoted.filter((l) => l.kind !== "recorrente");

  const monthlyList = recurring.reduce((sum, l) => sum + l.list, 0);
  const monthlyFinal = recurring.reduce((sum, l) => sum + l.final, 0);
  const monthlyCost = recurring.reduce((sum, l) => sum + l.cost, 0);
  const oneTimeTotal = oneTime.reduce((sum, l) => sum + l.final, 0);
  const oneTimeCost = oneTime.reduce((sum, l) => sum + l.cost, 0);
  const hoursPerMonth = recurring.reduce((sum, l) => sum + l.hours, 0);

  const warnings: string[] = [];

  for (const line of quoted) {
    if (line.belowMarginFloor) {
      warnings.push(
        `${line.name}: margem de ${Math.round((line.marginPct ?? 0) * 100)}% fura o piso de 40%. Não fecha assim.`
      );
    }
    if (line.belowFloor) {
      warnings.push(
        `${line.name}: R$ ${line.final.toLocaleString("pt-BR")} está abaixo do piso de negociação (R$ ${(
          (line.floor ?? 0) * line.qty
        ).toLocaleString("pt-BR")}).`
      );
    }
    if (line.variablePrice) {
      warnings.push(
        `${line.name}: preço percentual — calcular sobre a verba real e conferir a margem à mão.`
      );
    }
  }

  const ids = new Set(quoted.map((l) => l.offerId));

  if (ids.has("ecom-gestao") && hasTrafegoMensal(ids)) {
    warnings.push(
      "Gestão de E-commerce já inclui o escopo de tráfego. Somar Google Ads ou Meta Ads é vender escopo duplicado — remova um dos dois."
    );
  }

  if (ids.has("seo-pacote-artigos") && discountPct > 0) {
    warnings.push(
      "Pacote de 4 artigos ficou fora do desconto de propósito (margem de 43%). Não conceda −15% nele."
    );
  }

  if (ids.has("midia-canal-extra") && !hasTrafegoMensal(ids)) {
    warnings.push("Canal adicional pressupõe uma mensalidade de Google Ads ou Meta Ads contratada.");
  }

  if (hoursPerMonth > BILLABLE_HOURS_PER_OPERATOR) {
    warnings.push(
      `${hoursPerMonth}h/mês nesta proposta sozinha já passam das ${BILLABLE_HOURS_PER_OPERATOR}h faturáveis de um operador.`
    );
  }

  if (extra > 0) {
    warnings.push(
      "Desconto extra só vale contra 12 meses pré-pago. Sem o pré-pago, volte para a tabela."
    );
  }

  return {
    recurring,
    oneTime,
    discountPct,
    eligibleRecurringCount,
    monthlyList,
    monthlyFinal,
    monthlyCost,
    monthlyMarginPct: marginOf(monthlyFinal, monthlyCost),
    oneTimeTotal,
    oneTimeCost,
    oneTimeMarginPct: marginOf(oneTimeTotal, oneTimeCost),
    hoursPerMonth,
    capacityPct: Math.round((hoursPerMonth / BILLABLE_HOURS_PER_OPERATOR) * 100),
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Edição de proposta salva: banco -> estado do simulador.
// ---------------------------------------------------------------------------

/** Estado inicial do simulador quando ele abre em cima de uma proposta salva. */
export type ProposalDraft = {
  id: number;
  clientId: number;
  qty: Record<string, number>;
  custom: CustomLine[];
  extra: number;
  dropped: string[];
  extraTerms: string;
  title: string;
  notes: string;
  validDays: number;
};

const DAY_MS = 86_400_000;

/**
 * Reconstrói o simulador a partir do que foi gravado. Nenhuma coluna nova foi
 * precisa: o desconto extra é o que sobra do `discount_pct` depois de tirar o de
 * combinação, e as condições desmarcadas são as aplicáveis que não estão no
 * `doc.terms` — exatamente como o `buildProposalDoc` as montou.
 *
 * Mora aqui, e não na página, porque é o inverso do `buildQuote`/`buildProposalDoc`
 * e falha junto com eles no autoteste abaixo.
 */
export function proposalDraft(row: {
  id: number;
  client_id: number;
  lines: QuoteLine[];
  discount_pct: string | number;
  doc: ProposalDoc | null;
}): ProposalDraft {
  const qty: Record<string, number> = {};
  const custom: CustomLine[] = [];
  for (const line of row.lines) {
    if (isCustomLine(line)) custom.push(line);
    else qty[line.offerId] = line.qty;
  }

  const quote = buildQuote(row.lines);
  // Arredonda: 0,1 + 0,05 volta do banco como 0,15000000000000002 e a subtração
  // devolveria um extra que não bate com nenhuma opção do select.
  const extra =
    Math.round(
      Math.min(
        0.1,
        Math.max(0, Number(row.discount_pct) - combinationDiscount(quote.eligibleRecurringCount))
      ) * 100
    ) / 100;

  const saved = row.doc?.terms ?? [];
  const validDays = row.doc
    ? Math.round((Date.parse(row.doc.validUntil) - Date.parse(row.doc.createdAt)) / DAY_MS)
    : PROPOSAL_VALID_DAYS;

  return {
    id: row.id,
    clientId: row.client_id,
    qty,
    custom,
    extra,
    // Proposta antiga não tem doc: nada foi desmarcado lá atrás, então as
    // condições padrão voltam inteiras em vez de todas desmarcadas.
    dropped: row.doc
      ? applicableTerms(quote)
          .filter((term) => !saved.includes(term.text))
          .map((term) => term.id)
      : [],
    extraTerms: saved
      .filter((text) => !PROPOSAL_TERMS.some((term) => term.text === text))
      .join("\n"),
    title: row.doc?.title ?? "",
    notes: row.doc?.notes ?? "",
    validDays: validDays > 0 && validDays <= 180 ? validDays : PROPOSAL_VALID_DAYS,
  };
}

// ---------------------------------------------------------------------------
// Autoteste. Roda com: npm run check:quote
// ponytail: assert em vez de framework de teste. É a combinação conferida à mão
// no PRECIFICACAO-INTERNA §8 — se a matemática quebrar, isto falha alto.
// ---------------------------------------------------------------------------
export function check(): void {
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`FALHOU: ${message}`);
  };

  // Combinação conferida no §8: Google Ads 10-40k + CRM + SEO contínuo, −15%.
  const combo = buildQuote([
    { offerId: "google-mensal-40k", qty: 1 },
    { offerId: "crm-licenca", qty: 1 },
    { offerId: "seo-continuo", qty: 1 },
  ]);
  assert(combo.discountPct === 0.15, `desconto deveria ser 15%, veio ${combo.discountPct}`);
  assert(combo.monthlyList === 8190, `tabela deveria somar 8190, veio ${combo.monthlyList}`);
  assert(combo.monthlyFinal === 6962, `com desconto deveria dar 6962, veio ${combo.monthlyFinal}`);
  assert(combo.monthlyCost === 3600, `custo deveria ser 3600, veio ${combo.monthlyCost}`);
  assert(
    Math.round((combo.monthlyMarginPct ?? 0) * 100) === 48,
    `margem deveria ser 48%, veio ${Math.round((combo.monthlyMarginPct ?? 0) * 100)}%`
  );
  assert(combo.warnings.length === 0, `combinação aprovada não deveria alertar: ${combo.warnings}`);

  // §8.3: gestão Google 3–6k (R$ 2.400) a −15% = R$ 2.040, MB 48%, acima do piso de margem.
  const doisRecorrentes = buildQuote([
    { offerId: "google-mensal-6k", qty: 1 },
    { offerId: "crm-licenca", qty: 1 },
  ]);
  assert(doisRecorrentes.discountPct === 0.1, "2 recorrentes = −10%");

  const tresBaratos = buildQuote([
    { offerId: "google-mensal-6k", qty: 1 },
    { offerId: "crm-licenca", qty: 1 },
    { offerId: "site-manutencao", qty: 1 },
  ]);
  const gestao = tresBaratos.recurring.find((l) => l.offerId === "google-mensal-6k")!;
  assert(gestao.final === 2040, `2400 a −15% = 2040, veio ${gestao.final}`);
  assert(
    Math.round((gestao.marginPct ?? 0) * 100) === 49,
    `MB da gestão a −15% deveria ser ~49%, veio ${Math.round((gestao.marginPct ?? 0) * 100)}%`
  );
  assert(!gestao.belowMarginFloor, "gestão a −15% não deveria furar o piso de margem");
  assert(!gestao.belowFloor, `2040 está acima do piso de negociação de 1750, veio belowFloor=${gestao.belowFloor}`);

  // Setup nunca entra em desconto (§8.1).
  const comSetup = buildQuote([
    { offerId: "google-mensal-40k", qty: 1 },
    { offerId: "crm-licenca", qty: 1 },
    { offerId: "seo-continuo", qty: 1 },
    { offerId: "site-landing", qty: 1 },
  ]);
  const lp = comSetup.oneTime.find((l) => l.offerId === "site-landing")!;
  assert(lp.final === 5900, `setup não recebe desconto, veio ${lp.final}`);

  // Conteúdo de SEO fica fora do desconto (§8.2) e o alerta aparece.
  const comConteudo = buildQuote([
    { offerId: "google-mensal-40k", qty: 1 },
    { offerId: "crm-licenca", qty: 1 },
    { offerId: "seo-pacote-artigos", qty: 1 },
  ]);
  const artigos = comConteudo.recurring.find((l) => l.offerId === "seo-pacote-artigos")!;
  assert(artigos.final === 2990, `pacote de artigos não recebe desconto, veio ${artigos.final}`);
  assert(
    comConteudo.warnings.some((w) => w.includes("artigos")),
    "deveria alertar sobre o pacote de conteúdo fora do desconto"
  );

  // E-commerce + mensalidade de Google ou de Meta = escopo duplicado.
  for (const mensal of ["google-mensal-40k", "meta-mensal-10k"]) {
    const duplicado = buildQuote([
      { offerId: "ecom-gestao", qty: 1 },
      { offerId: mensal, qty: 1 },
    ]);
    assert(
      duplicado.warnings.some((w) => w.includes("escopo duplicado")),
      `deveria alertar que a gestão de e-commerce já inclui ${mensal}`
    );
  }

  // Canal adicional vale sobre Google ou Meta; sozinho, alerta.
  const canalSozinho = buildQuote([{ offerId: "midia-canal-extra", qty: 1 }]);
  assert(
    canalSozinho.warnings.some((w) => w.includes("Canal adicional")),
    "canal adicional sem mensalidade de mídia deveria alertar"
  );
  const canalSobreMeta = buildQuote([
    { offerId: "meta-mensal-10k", qty: 1 },
    { offerId: "midia-canal-extra", qty: 1 },
  ]);
  assert(
    !canalSobreMeta.warnings.some((w) => w.includes("Canal adicional")),
    "canal adicional sobre mensalidade de Meta não deveria alertar"
  );

  // Google e Meta são serviços separados: os dois juntos contam como 2
  // recorrentes e caem no −10%. Google 3–6k (2400) + Meta 6–10k (3700).
  const googleEMeta = buildQuote([
    { offerId: "google-mensal-6k", qty: 1 },
    { offerId: "meta-mensal-10k", qty: 1 },
  ]);
  assert(googleEMeta.discountPct === 0.1, `Google + Meta = −10%, veio ${googleEMeta.discountPct}`);
  assert(googleEMeta.monthlyFinal === 5490, `2160 + 3330 = 5490, veio ${googleEMeta.monthlyFinal}`);

  // Todo preço de tabela precisa bater a margem alvo de 55% (±2pp de arredondamento).
  for (const service of SERVICES) {
    for (const offer of service.offers) {
      if (offer.price === null || offer.cost === undefined || offer.marginPct === undefined) continue;
      const real = (offer.price - offer.cost) / offer.price;
      assert(
        Math.abs(real - offer.marginPct) < 0.02,
        `${offer.id}: margem declarada ${offer.marginPct} não bate com a calculada ${real.toFixed(3)}`
      );
      assert(real >= MARGIN_FLOOR, `${offer.id}: preço de tabela já nasce abaixo do piso de 40%`);
    }
  }

  // Desconto máximo = −15% de combinação (§8) + 10% de pré-pago (§8.4) = −25%.
  //
  // O PRECIFICACAO-INTERNA §8.3 confere só o −15% isolado e por isso não vê a
  // colisão das duas regras. Nesta faixa a Gestão de E-commerce é o único item
  // que fura o piso: R$ 7.900 → R$ 5.925 com custo de R$ 3.600 = MB 39%, e
  // abaixo do piso de negociação de R$ 6.000 também.
  //
  // O código não conserta preço — quem decide isso é o dono. O que se garante
  // aqui é que o simulador AVISA em vez de deixar passar calado.
  const recorrentesElegiveis = SERVICES.flatMap((s) => s.offers).filter(
    (o) => o.kind === "recorrente" && o.discountEligible && o.price !== null
  );

  const furamNoDescontoMaximo: string[] = [];

  for (const offer of recorrentesElegiveis) {
    const maxDiscount = buildQuote(
      [
        { offerId: offer.id, qty: 1 },
        // Duas outras elegíveis quaisquer para cair na faixa de −15%.
        ...recorrentesElegiveis
          .filter((other) => other.id !== offer.id)
          .slice(0, 2)
          .map((other) => ({ offerId: other.id, qty: 1 })),
      ],
      0.1
    );
    const line = maxDiscount.recurring.find((l) => l.offerId === offer.id)!;

    if (line.belowMarginFloor || line.belowFloor) {
      furamNoDescontoMaximo.push(offer.id);
      assert(
        maxDiscount.warnings.some((w) => w.includes(offer.name)),
        `${offer.id} fura o piso a −25% e o simulador não avisou — passaria calado na proposta`
      );
    }
  }

  assert(
    furamNoDescontoMaximo.join(",") === "ecom-gestao",
    `mudou quem fura o piso no desconto máximo: agora é [${furamNoDescontoMaximo.join(", ")}]. ` +
      "Confira o §8 do PRECIFICACAO-INTERNA antes de oferecer 12 meses pré-pago nesses itens."
  );

  // ---- Linha livre (cobrança por hora e pacote fora da tabela) ----

  // 2h a R$ 350 = R$ 700, custo 2h × R$ 150 = R$ 300 → MB 57%.
  const porHora = buildQuote([
    { label: "Alterações nos sites", qty: 2, unit: "hora", unitPrice: 350, hours: 2 },
  ]);
  assert(porHora.oneTimeTotal === 700, `2h a 350 = 700, veio ${porHora.oneTimeTotal}`);
  assert(porHora.recurring.length === 0, "linha livre é avulsa, não entra na mensalidade");
  assert(
    Math.round((porHora.oneTimeMarginPct ?? 0) * 100) === 57,
    `MB da linha livre deveria ser 57%, veio ${Math.round((porHora.oneTimeMarginPct ?? 0) * 100)}%`
  );

  // Preço de favor numa linha livre precisa avisar como qualquer outro item.
  const favor = buildQuote([
    { label: "Ajuste rapido", qty: 1, unit: "hora", unitPrice: 200, hours: 1 },
  ]);
  assert(
    favor.warnings.some((w) => w.includes("Ajuste rapido")),
    "linha livre com MB 25% deveria disparar o alerta de piso"
  );

  // Linha livre nunca recebe o desconto de combinação, nem quando há recorrentes.
  const misto = buildQuote([
    { offerId: "site-manutencao", qty: 2 },
    { offerId: "crm-licenca", qty: 1 },
    { label: "Chamado de alteracao", qty: 1, unit: "chamado", unitPrice: 700, hours: 2 },
  ]);
  assert(misto.discountPct === 0.1, `2 recorrentes elegíveis = −10%, veio ${misto.discountPct}`);
  assert(misto.oneTimeTotal === 700, `linha livre não recebe desconto, veio ${misto.oneTimeTotal}`);

  // Descrição em várias linhas: título na primeira, marcadores nas demais.
  const comMarcadores = buildProposalDoc({
    title: "Alterações",
    clientName: "César Mhedicos",
    notes: null,
    validDays: 15,
    quote: buildQuote([
      {
        label: "Alterações nos sites\n- Retirar banners da Geratherm\n• Incluir na Mhédicos\n\n  Retirar telemedicina  ",
        qty: 1,
        unit: "hora",
        unitPrice: 350,
        hours: 1,
      },
    ]),
  });
  const livre = comMarcadores.lines[0];
  assert(
    livre.name === "Alterações nos sites",
    `título da linha livre deveria ser só a 1ª linha, veio "${livre.name}"`
  );
  assert(
    livre.items.join("|") ===
      "Retirar banners da Geratherm|Incluir na Mhédicos|Retirar telemedicina",
    `marcadores da linha livre saíram errados: ${JSON.stringify(livre.items)}`
  );

  // Descrição de uma linha só continua sem lista de marcadores.
  const semMarcadores = buildProposalDoc({
    title: "x",
    clientName: "y",
    notes: null,
    validDays: 15,
    quote: buildQuote([{ label: "Ajuste simples", qty: 1, unit: "hora", unitPrice: 350, hours: 1 }]),
  });
  assert(
    semMarcadores.lines[0].items.length === 0,
    "linha livre de uma linha não deveria gerar marcadores"
  );

  // Prazo da linha livre chega ao doc; sem prazo, o campo fica nulo (a página
  // pública só renderiza "Prazo:" quando existe).
  const comPrazo = buildProposalDoc({
    title: "x",
    clientName: "y",
    notes: null,
    validDays: 15,
    quote: buildQuote([
      { label: "Ajuste", qty: 1, unit: "hora", unitPrice: 350, hours: 1, sla: "3 dias úteis" },
    ]),
  });
  assert(
    comPrazo.lines[0].sla === "3 dias úteis",
    `prazo da linha livre não chegou ao doc, veio ${JSON.stringify(comPrazo.lines[0].sla)}`
  );
  assert(semMarcadores.lines[0].sla === null, "linha livre sem prazo deveria vir null");

  // Oferta de catálogo continua tirando o prazo da tabela, agora pelo QuotedLine.
  const prazoDeCatalogo = buildProposalDoc({
    title: "x",
    clientName: "y",
    notes: null,
    validDays: 15,
    quote: buildQuote([{ offerId: "site-landing", qty: 1 }]),
  });
  assert(
    prazoDeCatalogo.lines[0].sla === findOffer("site-landing")!.sla,
    `prazo da oferta de catálogo se perdeu, veio ${JSON.stringify(prazoDeCatalogo.lines[0].sla)}`
  );

  // ---- Condições: só entra o que se aplica ----

  const termos = (doc: { terms: string[] }) => doc.terms.join(" | ");

  const soAvulso = termos(
    buildProposalDoc({
      title: "x",
      clientName: "y",
      notes: null,
      validDays: 15,
      quote: buildQuote([{ label: "Ajuste", qty: 1, unit: "hora", unitPrice: 350, hours: 1 }]),
    })
  );
  for (const proibido of ["6 meses", "IPCA", "verba de mídia", "buscador", "50% na assinatura"]) {
    assert(
      !soAvulso.includes(proibido),
      `chamado avulso não deveria trazer a condição sobre "${proibido}": ${soAvulso}`
    );
  }
  assert(
    soAvulso.includes("pagamento na entrega"),
    `chamado avulso precisa dizer quando se paga: ${soAvulso}`
  );

  const recorrenteCompleto = termos(
    buildProposalDoc({
      title: "x",
      clientName: "y",
      notes: null,
      validDays: 15,
      quote: buildQuote([
        { offerId: "google-mensal-40k", qty: 1 },
        { offerId: "seo-continuo", qty: 1 },
        { offerId: "site-landing", qty: 1 },
      ]),
    })
  );
  for (const esperado of [
    "6 meses",
    "IPCA",
    "verba de mídia",
    "buscador",
    "50% na assinatura",
    "faturamento no dia 5",
  ]) {
    assert(
      recorrenteCompleto.includes(esperado),
      `proposta recorrente completa deveria trazer "${esperado}": ${recorrenteCompleto}`
    );
  }
  assert(
    !recorrenteCompleto.includes("pagamento na entrega"),
    "sem item avulso, a condição de pagamento na entrega não se aplica"
  );

  // ---- Condições editadas na proposta ----

  const avulso = buildQuote([{ label: "Ajuste", qty: 1, unit: "hora", unitPrice: 350, hours: 1 }]);
  const base = { title: "x", clientName: "y", notes: null, validDays: 15, quote: avulso };

  // Id estável: o simulador manda de volta o que o builder publicou. Se um id
  // for renomeado sem querer, a condição some da tela em vez de desmarcar.
  const ids = new Set(PROPOSAL_TERMS.map((t) => t.id));
  assert(ids.size === PROPOSAL_TERMS.length, "id de condição duplicado em PROPOSAL_TERMS");
  assert(
    applicableTerms(avulso).every((t) => ids.has(t.id)),
    "applicableTerms devolveu condição fora de PROPOSAL_TERMS"
  );

  const editado = buildProposalDoc({
    ...base,
    droppedTerms: ["revisoes-escopo"],
    extraTerms: ["Pagamento via PIX até o dia 10."],
  });
  assert(
    !editado.terms.some((t) => t.includes("2 rodadas de revisão")),
    `condição desmarcada continuou na proposta: ${editado.terms.join(" | ")}`
  );
  assert(
    editado.terms[editado.terms.length - 1] === "Pagamento via PIX até o dia 10.",
    `condição extra deveria entrar no fim, veio ${JSON.stringify(editado.terms)}`
  );
  assert(
    editado.terms.length === applicableTerms(avulso).length,
    "tirar uma e somar uma deveria manter a contagem"
  );

  // Id desconhecido não derruba o save nem apaga condição de tabela.
  const idBobo = buildProposalDoc({ ...base, droppedTerms: ["nao-existe", ""] });
  assert(
    idBobo.terms.length === applicableTerms(avulso).length,
    "id desconhecido não deveria remover condição nenhuma"
  );

  // Desmarcar tudo é decisão do dono — o builder obedece e não inventa termo.
  const semNada = buildProposalDoc({
    ...base,
    droppedTerms: applicableTerms(avulso).map((t) => t.id),
  });
  assert(semNada.terms.length === 0, `desmarcar tudo deveria zerar, veio ${semNada.terms.length}`);

  // O risco só existe nas condições que limitam o que a Vértice promete.
  assert(
    PROPOSAL_TERMS.filter((t) => t.risk)
      .map((t) => t.id)
      .join(",") === "verba-midia,revisoes-escopo,sem-promessa-buscador",
    "mudou quem carrega risco — confira se a condição nova limita o que a agência promete"
  );

  // A Gotham renderiza U+00A0 com 749px de largura e joga o número para fora da
  // tela. Os dois formatadores de moeda precisam devolver espaço comum.
  for (const [nome, texto] of [["brl", brl(1593)], ["money", money(1593)]]) {
    assert(
      !texto.includes(" "),
      `${nome}() devolveu espaço não-separável em "${texto}" — a Gotham quebra nele`
    );
  }

  // Preço promocional tem centavos; arredondar mostraria ao cliente outro número.
  for (const format of [brl, money]) {
    const cheio = format(690);
    const quebrado = format(798.9);
    assert(cheio === "R$ 690", `preço inteiro deveria sair sem centavos, veio "${cheio}"`);
    assert(quebrado === "R$ 798,90", `preço com centavos deveria sair "R$ 798,90", veio "${quebrado}"`);
  }

  // Edição: o que foi salvo tem que voltar para o simulador igual ao que saiu.
  // É a única garantia de que abrir uma proposta para editar não muda o número
  // dela sozinha — o `proposalDraft` deriva tudo, não lê coluna própria.
  const paraEditar: QuoteLine[] = [
    { offerId: "google-mensal-6k", qty: 1 },
    { offerId: "crm-licenca", qty: 1 },
    { label: "Ajuste no site\n- trocar banner", qty: 2, unit: "hora", unitPrice: 350, hours: 2 },
  ];
  const salvo = buildQuote(paraEditar, 0.05);
  const draft = proposalDraft({
    id: 7,
    client_id: 3,
    lines: paraEditar,
    discount_pct: String(salvo.discountPct),
    doc: buildProposalDoc({
      title: "Proposta de teste",
      clientName: "Cliente",
      notes: "observação",
      validDays: 30,
      quote: salvo,
      droppedTerms: ["reajuste-ipca"],
      extraTerms: ["Pagamento via PIX até o dia 10."],
    }),
  });

  assert(draft.extra === 0.05, `desconto extra deveria voltar 0.05, veio ${draft.extra}`);
  assert(draft.qty["crm-licenca"] === 1, "quantidade de catálogo deveria voltar");
  assert(draft.custom.length === 1 && draft.custom[0].unitPrice === 350, "linha livre deveria voltar");
  assert(
    draft.dropped.join(",") === "reajuste-ipca",
    `condição desmarcada deveria voltar desmarcada, veio [${draft.dropped}]`
  );
  assert(
    draft.extraTerms === "Pagamento via PIX até o dia 10.",
    `condição própria deveria voltar sozinha, veio "${draft.extraTerms}"`
  );
  assert(draft.validDays === 30, `validade deveria voltar 30, veio ${draft.validDays}`);
  assert(draft.title === "Proposta de teste" && draft.notes === "observação", "título e observação");

  // Salvar de novo sem tocar em nada tem que dar o mesmo total.
  const resalvo = buildQuote(paraEditar, draft.extra);
  assert(
    resalvo.monthlyFinal === salvo.monthlyFinal && resalvo.oneTimeTotal === salvo.oneTimeTotal,
    `reabrir e salvar mudou o valor: ${salvo.monthlyFinal} virou ${resalvo.monthlyFinal}`
  );
}
