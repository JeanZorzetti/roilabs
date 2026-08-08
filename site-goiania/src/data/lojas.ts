// Registro de cadeiras-loja (FR-001). Abrir loja = uma entrada aqui + um catálogo.
//
// Duplicação deliberada com app/src/lib/lojas.ts — o site é Astro estático e não importa
// do app. Trava contra divergência: teste de paridade (mesmo padrão de check-matrix.mjs).
// Teto: > 5 cadeiras ou divergência na prática → extrair para packages/lojas.
//
// Campos: data-model.md §2. Invariantes: check-lojas.mjs no prebuild.

import { produtos, type Produto } from './produtos';
import { fitas, type Fita } from './fitas';
import { unidadesById, type Unidade } from './unidades';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface LinhaFixa {
  quandoSlug: string;    // slug do produto que DISPARA a linha fixa
  slug: string;          // slug da linha CRIADA — o gatilho e o item são coisas diferentes
  rotulo: string;        // rótulo exibido no checkout do gateway
  valor: number;         // R$ do clichê (80 hoje)
  isentoSeJaComprou: boolean; // true ⇒ comprador recorrente não paga
}

export interface Loja {
  id: string;
  prefixoRota: string;
  unidade: string;           // id de Unidade (m2 | rolo | assinatura)
  recorrencia?: string;      // só para unidade='assinatura': 'mensal' | 'anual'
  catalogo: Array<Produto | Fita | Record<string, unknown>>;
  modoCobranca: 'roilabs' | 'parceiro';
  checkoutUrl: string | null;
  pagoA: string;
  frete: 'tabela-cep' | 'cotacao' | 'nenhum';
  docObrigatorio: boolean;
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
];

export const lojasById = new Map(lojas.map((l) => [l.id, l]));

/** Resolve a Unidade da cadeira — faz o build quebrar se `unidade` não existir. */
export function getUnidade(loja: Loja): Unidade {
  const u = unidadesById.get(loja.unidade);
  if (!u) throw new Error(`Unidade '${loja.unidade}' da cadeira '${loja.id}' não existe em unidades.ts`);
  return u;
}
