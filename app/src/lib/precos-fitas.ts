// Autoridade de preço das FITAS (011). Espelha o papel de precos.ts (porcelanato), que
// NÃO é tocado — verticais paralelos por decisão de produto (FR-003).
//
// A modalidade comercial é dada pela PRESENÇA na tabela, nunca por `preco = 0` (FR-005):
// SKU aqui ⇒ preço público, compra direta. SKU ausente ⇒ só-orçamento.
// `fita-transparente-personalizada` agora fatura direto (como as outras): o clichê deixou
// de ser motivo para orçamento e virou uma linha fixa no checkout (ver CLICHE_FIXO no
// /api/pedidos), cobrada UMA vez e isenta para quem repete a arte — o FR-040 (não
// sobrecobrar o recorrente) continua honrado, agora por dado do banco, não por modalidade.
//
// ponytail: Record em código, igual a precos.ts. Tabela no banco só se o catálogo virar
// dinâmico — 2 SKUs fechados não pagam migração + tela de admin.

export interface FaixaPreco {
  min: number; // inclusivo
  max: number | null; // inclusivo; null = sem teto
  precoRolo: number; // R$ por rolo nesta faixa
}

export interface PrecoFita {
  faixas: FaixaPreco[]; // ordenadas por min, sem lacuna e sem sobreposição
  minimoRolos: number; // FR-029 — igual ao min da primeira faixa
  // Carga por rolo — entra na cotação de frete. NUNCA vem do cliente (FR-006).
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
}

// Tabela oficial do Tapepro (docs/Imagens/WhatsApp Image 2026-07-20 at 23.51.19.jpeg).
//
// Duas fronteiras da tabela impressa eram ambíguas e foram resolvidas A FAVOR DO COMPRADOR
// (errar a favor do cliente é reclamação zero; errar contra é estorno e atrito com o
// parceiro). "15 a 100" + "acima de 100" ⇒ 100 fica na faixa de baixo, 101+ na de cima.
// ponytail: knob do operador — se o Tapepro confirmar outra leitura, muda o número aqui.
//
// ⚠️ pesoKg/dimensões são ESTIMATIVA calibrável (T002 pendente do Tapepro). São knob de
// operador: entram só na cotação de frete, nunca no preço do produto. Confirmar e ajustar.
const PRECOS: Record<string, PrecoFita> = {
  'fita-transparente-personalizada': {
    faixas: [
      { min: 20, max: 49, precoRolo: 16.2 },
      { min: 50, max: 99, precoRolo: 13.9 },
      { min: 100, max: 199, precoRolo: 10.5 },
      { min: 200, max: null, precoRolo: 10.1 },
    ],
    minimoRolos: 20,
    pesoKg: 0.3, // mesmo BOPP 48mm × 100m da comum
    alturaCm: 5,
    larguraCm: 12,
    comprimentoCm: 12,
  },
  'fita-transparente-comum': {
    faixas: [{ min: 1, max: null, precoRolo: 7.9 }],
    minimoRolos: 1,
    pesoKg: 0.3, // BOPP 48mm × 100m
    alturaCm: 5,
    larguraCm: 12,
    comprimentoCm: 12,
  },
  'fita-gomada': {
    faixas: [
      { min: 15, max: 100, precoRolo: 37.2 },
      { min: 101, max: null, precoRolo: 32.2 },
    ],
    minimoRolos: 15,
    pesoKg: 1.1, // kraft gomado 70mm × 150m — mais denso que BOPP
    alturaCm: 8,
    larguraCm: 20,
    comprimentoCm: 20,
  },
};

export function getFita(slug: string): PrecoFita | null {
  return PRECOS[slug] ?? null;
}

export function listarFitas(): Array<{ slug: string } & PrecoFita> {
  return Object.entries(PRECOS).map(([slug, p]) => ({ slug, ...p }));
}

/** Slug com preço público ⇒ compra direta. Ausente ⇒ só-orçamento (FR-005/FR-040). */
export const temPrecoPublico = (slug: string): boolean => slug in PRECOS;

/**
 * Faixa aplicável a uma quantidade (FR-038). `null` quando o SKU não tem preço público,
 * a quantidade é inválida ou está abaixo do mínimo — o chamador decide o erro.
 */
export function precoPorQuantidade(slug: string, rolos: number): FaixaPreco | null {
  const p = getFita(slug);
  if (!p || !Number.isFinite(rolos) || !Number.isInteger(rolos) || rolos < p.minimoRolos) return null;
  return p.faixas.find((f) => rolos >= f.min && (f.max === null || rolos <= f.max)) ?? null;
}

/** Carga total do carrinho para a cotação — derivada do slug, nunca do cliente. */
export function cargaDoCarrinho(itens: Array<{ slug: string; rolos: number }>): {
  pesoKg: number;
  alturaCm: number;
  larguraCm: number;
  comprimentoCm: number;
} | null {
  let pesoKg = 0;
  let alturaCm = 0;
  let larguraCm = 0;
  let comprimentoCm = 0;
  for (const i of itens) {
    const p = getFita(i.slug);
    if (!p || !(i.rolos > 0)) continue;
    pesoKg += p.pesoKg * i.rolos;
    // Volume empilhado: altura soma, base é a maior caixa. Aproximação deliberada — a
    // transportadora cobra por peso cubado, e superestimar a altura nunca cobra a menos.
    alturaCm += p.alturaCm * i.rolos;
    larguraCm = Math.max(larguraCm, p.larguraCm);
    comprimentoCm = Math.max(comprimentoCm, p.comprimentoCm);
  }
  if (pesoKg <= 0) return null;
  return {
    pesoKg: Math.round(pesoKg * 100) / 100,
    alturaCm: Math.ceil(alturaCm),
    larguraCm: Math.ceil(larguraCm),
    comprimentoCm: Math.ceil(comprimentoCm),
  };
}
