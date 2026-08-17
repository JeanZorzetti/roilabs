// Registro de cadeiras-loja (FR-001). Abrir loja = uma entrada aqui + um catálogo.
//
// Duplicação deliberada com app/src/lib/lojas.ts — o site é Astro estático e não importa
// do app. Trava contra divergência: teste de paridade (mesmo padrão de check-matrix.mjs).
// Teto: > 5 cadeiras ou divergência na prática → extrair para packages/lojas.
//
// Campos: data-model.md §2. Invariantes: check-lojas.mjs no prebuild.

import { produtos, type Produto } from './produtos';
import { fitas, type Fita } from './fitas';
import { produtosMana, type ProdutoMana } from './mana';
import { unidadesById, type Unidade } from './unidades';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface LinhaFixa {
  quandoSlug: string;    // slug do produto que DISPARA a linha fixa
  slug: string;          // slug da linha CRIADA — o gatilho e o item são coisas diferentes
  rotulo: string;        // rótulo exibido no checkout do gateway
  valor: number;         // R$ do clichê (80 hoje)
  isentoSeJaComprou: boolean; // true ⇒ comprador recorrente não paga
}

/** Split no gateway (015) — comissão retida NO ATO, na conta do parceiro. `null` = caminho
 * de hoje (cobra na conta da ROI Labs). NÃO deriva de `modoCobranca`: são eixos diferentes
 * (quem opera a loja × qual conta recebe). */
export interface Split {
  gateway: 'mercadopago';
  comissaoPct: number; // (0, 1]
}

export interface Loja {
  id: string;
  prefixoRota: string;
  unidade: string;           // id de Unidade (m2 | rolo | assinatura | peca)
  recorrencia?: string;      // só para unidade='assinatura': 'mensal' | 'anual'
  catalogo: Array<Produto | Fita | ProdutoMana | Record<string, unknown>>;
  modoCobranca: 'roilabs' | 'parceiro';
  checkoutUrl: string | null;
  pagoA: string;
  frete: 'tabela-cep' | 'cotacao' | 'nenhum';
  docObrigatorio: boolean;
  emailObrigatorio: boolean; // booleano explícito, sem default implícito (015)
  split: Split | null; // 015 — ver comentário acima
  cupomEscopo: string;
  linhaFixa: LinhaFixa | null;
  publicada: boolean;
}

// ── Registro das cadeiras ───────────────────────────────────────────────────

export const lojas: Loja[] = [
  {
    id: 'porcelanato',
    prefixoRota: 'porcelanato',
    unidade: 'm2',
    catalogo: produtos,
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    pagoA: 'ROI Labs',
    frete: 'tabela-cep',
    docObrigatorio: false,
    emailObrigatorio: false,
    split: null,
    cupomEscopo: 'porcelanato',
    linhaFixa: null,
    publicada: true,
  },
  {
    id: 'fitas',
    prefixoRota: 'fitas',
    unidade: 'rolo',
    catalogo: fitas,
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    pagoA: 'Tapepro',
    frete: 'cotacao',
    docObrigatorio: true,
    emailObrigatorio: false,
    split: null,
    cupomEscopo: 'fitas',
    linhaFixa: {
      quandoSlug: 'fita-transparente-personalizada',
      slug: 'cliche-arte',
      rotulo: 'Clichê (arte personalizada)',
      valor: 80,
      isentoSeJaComprou: true,
    },
    publicada: true,
  },
  {
    id: 'mana',
    prefixoRota: 'mana',
    unidade: 'peca',
    catalogo: produtosMana,
    modoCobranca: 'roilabs',
    checkoutUrl: null,
    pagoA: 'Maná Moda',
    frete: 'cotacao',
    docObrigatorio: true,
    emailObrigatorio: true,
    split: { gateway: 'mercadopago', comissaoPct: 0.1 },
    cupomEscopo: 'mana',
    linhaFixa: null,
    // 015 Fase 1: dado existe, nada vende ainda. Fase 7 vira true.
    publicada: false,
  },
];

export const lojasById = new Map(lojas.map((l) => [l.id, l]));

/** Resolve a Unidade da cadeira — faz o build quebrar se `unidade` não existir. */
export function getUnidade(loja: Loja): Unidade {
  const u = unidadesById.get(loja.unidade);
  if (!u) throw new Error(`Unidade '${loja.unidade}' da cadeira '${loja.id}' não existe em unidades.ts`);
  return u;
}
