// Unidades de venda (FR-003). Dado, não código — a 4ª unidade entra aqui e pronto.
//
// `precificar` é o único ponto onde a unidade encosta em lógica: devolve o preço aplicado
// E a justificativa, tornando FR-004 satisfeito por construção.
//
// Regra de arredondamento: subtotal = arredondar(quantidade × precoUnitario, 2), com a
// mesma função money() que a rota usa. A invariante é testável e vale nas 3 unidades.

export interface DetalhePreco {
  [key: string]: unknown;
}

export interface ResultadoPrecificacao {
  precoUnitario: number;
  detalhe: DetalhePreco;
}

export interface Unidade {
  id: string;
  rotulo: string;
  rotuloPlural: string;
  entregaFisica: boolean;
  precificar: (produto: unknown, quantidade: number) => ResultadoPrecificacao;
}

// ── Precificadores ──────────────────────────────────────────────────────────

/**
 * m² — preço fixo por m². O produto precisa ter `atributos.preco` e `atributos.m2_caixa`.
 * `quantidade` é m² do pedido; `detalhe` registra quantas caixas e m² por caixa.
 */
function precificarM2(produto: unknown, quantidade: number): ResultadoPrecificacao {
  const p = produto as { atributos?: { preco?: number; m2_caixa?: number } };
  const preco = p?.atributos?.preco ?? 0;
  const m2PorCaixa = p?.atributos?.m2_caixa ?? 0;
  const caixas = m2PorCaixa > 0 ? Math.max(1, Math.ceil(quantidade / m2PorCaixa)) : 0;
  return {
    precoUnitario: preco,
    detalhe: { caixas, m2PorCaixa },
  };
}

/**
 * Rolo — preço por faixa de volume. O produto precisa ter `faixas[]` com `{ min, precoRolo }`.
 * `quantidade` é número de rolos; a última faixa cujo piso é alcançado é a aplicável.
 */
function precificarRolo(produto: unknown, quantidade: number): ResultadoPrecificacao {
  const p = produto as { faixas?: Array<{ min: number; max?: number | null; precoRolo: number; rotulo?: string }> };
  const faixas = p?.faixas ?? [];
  if (faixas.length === 0) return { precoUnitario: 0, detalhe: {} };
  let escolhida = faixas[0];
  for (const fx of faixas) {
    if (quantidade >= fx.min) escolhida = fx;
  }
  return {
    precoUnitario: escolhida.precoRolo,
    detalhe: { faixaMin: escolhida.min, faixaMax: escolhida.max ?? null },
  };
}

/**
 * Assinatura — valor do ciclo. O produto precisa ter `preco` (valor mensal/anual).
 * `quantidade` é 1 (um ciclo por item); detalhe é vazio — a recorrência mora em coluna própria.
 */
function precificarAssinatura(produto: unknown, _quantidade: number): ResultadoPrecificacao {
  const p = produto as { preco?: number };
  return {
    precoUnitario: p?.preco ?? 0,
    detalhe: {},
  };
}

/**
 * Peça (015) — preço fixo por variação (tamanho × cor). `produto` aqui é a VARIAÇÃO, não
 * o produto pai: cada SKU tem seu próprio `preco`. `quantidade` é inteiro ≥ 1 — peça
 * fracionária não existe. `detalhe` carrega tamanho/cor porque é ele que reconstrói o que
 * foi vendido depois que o catálogo já mudou — mesmo papel de `{caixas, m2PorCaixa}`.
 */
function precificarPeca(variacao: unknown, _quantidade: number): ResultadoPrecificacao {
  const v = variacao as { preco?: number; produtoSlug?: string; tamanho?: string; cor?: string };
  return {
    precoUnitario: v?.preco ?? 0,
    detalhe: { produtoSlug: v?.produtoSlug ?? null, tamanho: v?.tamanho ?? null, cor: v?.cor ?? null },
  };
}

// ── Registro ────────────────────────────────────────────────────────────────

export const unidades: Unidade[] = [
  {
    id: 'm2',
    rotulo: 'm²',
    rotuloPlural: 'm²',
    entregaFisica: true,
    precificar: precificarM2,
  },
  {
    id: 'rolo',
    rotulo: 'rolo',
    rotuloPlural: 'rolos',
    entregaFisica: true,
    precificar: precificarRolo,
  },
  {
    id: 'assinatura',
    rotulo: 'mês',
    rotuloPlural: 'meses',
    entregaFisica: false,
    precificar: precificarAssinatura,
  },
  {
    id: 'peca',
    rotulo: 'peça',
    rotuloPlural: 'peças',
    entregaFisica: true,
    precificar: precificarPeca,
  },
];

export const unidadesById = new Map(unidades.map((u) => [u.id, u]));
