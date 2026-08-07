// O que uma cadeira oferece, e por qual caminho se paga (012, US2). Puro.
//
// Duas perguntas que a spec insiste em não deixar responder por aproximação:
//   1. Este produto está bem configurado? (FR-008: nunca um botão que leva a lugar nenhum)
//   2. Quem processa o pagamento? (carrinho da ROI Labs × gateway do parceiro)

/** Estados da cadeira. Só `ocupada-vendavel` pode vender. */
export const ESTADOS = ['vaga', 'em-preparacao', 'ocupada-sem-produto', 'ocupada-vendavel'] as const;
export type Estado = (typeof ESTADOS)[number];

export type ModoCobranca = 'carrinho' | 'parceiro';

export interface ProdutoCadeiraDados {
  nome: string;
  preco: number;
  moeda: string;
  recorrencia: string;
  modoCobranca: string;
  checkoutUrl: string | null;
  publicado: boolean;
}

/**
 * T038 / data-model §4.5 — a invariante que o Prisma não declara.
 * `modoCobranca='parceiro'` sem `checkoutUrl` é o botão que leva a lugar nenhum de FR-008.
 */
export function validarProdutoCadeira(p: ProdutoCadeiraDados): { ok: true } | { ok: false; motivo: string } {
  if (p.modoCobranca !== 'carrinho' && p.modoCobranca !== 'parceiro') {
    return { ok: false, motivo: `modoCobranca inválido: ${JSON.stringify(p.modoCobranca)}` };
  }
  if (!(p.preco > 0)) {
    return { ok: false, motivo: 'preço tem de ser maior que zero — é a fonte do Offer (FR-013)' };
  }
  if (p.modoCobranca === 'parceiro') {
    const url = (p.checkoutUrl ?? '').trim();
    if (!url) return { ok: false, motivo: "modoCobranca='parceiro' exige checkoutUrl" };
    // String qualquer não serve: `href` inválido vira link morto na página publicada.
    if (!/^https:\/\/[^\s]+$/i.test(url)) {
      return { ok: false, motivo: 'checkoutUrl tem de ser https absoluto' };
    }
  }
  return { ok: true };
}

export type Checkout =
  | { tipo: 'carrinho' }
  /** T041: `pagoA` é obrigatório — comprador que não sabe a quem paga é chargeback. */
  | { tipo: 'parceiro'; url: string; pagoA: string }
  | { tipo: 'indisponivel'; motivo: 'estado' | 'sem-produto' | 'nao-publicado' | 'produto-invalido' | 'sem-gateway' };

export interface EntradaCheckout {
  estado: string;
  produto: ProdutoCadeiraDados | null;
  /** Nome do parceiro que ocupa a cadeira — vai na tela antes da saída. */
  parceiroNome: string | null;
  /** Existe CredencialGateway ativa para o parceiro desta cadeira. */
  gatewayLigado: boolean;
}

/**
 * T039/T040 — a decisão de fluxo. `indisponivel` NÃO é erro: é a resposta certa para
 * cadeira que ainda não vende, e é o que impede a página de oferecer o que não existe.
 */
export function decidirCheckout(e: EntradaCheckout): Checkout {
  if (e.estado !== 'ocupada-vendavel') return { tipo: 'indisponivel', motivo: 'estado' };
  if (!e.produto) return { tipo: 'indisponivel', motivo: 'sem-produto' };
  if (!e.produto.publicado) return { tipo: 'indisponivel', motivo: 'nao-publicado' };
  if (!validarProdutoCadeira(e.produto).ok) return { tipo: 'indisponivel', motivo: 'produto-invalido' };

  if (e.produto.modoCobranca === 'carrinho') {
    // Caminho existente de `Pedido` — porcelanato (m²) e fitas (rolo). Intocado (FR-001).
    return { tipo: 'carrinho' };
  }

  // ⚠️ FR-008: sem gateway LIGADO não há como a venda voltar (US1). Oferecer checkout aqui
  // mandaria o cliente pagar num lugar que a carteira não enxerga — venda feita, receita
  // invisível, e é justamente o buraco que esta feature existe para fechar.
  if (!e.gatewayLigado) return { tipo: 'indisponivel', motivo: 'sem-gateway' };

  return {
    tipo: 'parceiro',
    url: (e.produto.checkoutUrl ?? '').trim(),
    pagoA: e.parceiroNome ?? 'parceiro da ROI Labs',
  };
}

/**
 * FR-009 — só cadeira vendável e publicada gera URL pública indexável e entra no sitemap.
 * Mesma condição do checkout, de propósito: página indexada que não vende é página fina.
 */
export function ehIndexavel(e: EntradaCheckout): boolean {
  return decidirCheckout(e).tipo !== 'indisponivel';
}

/**
 * FR-010a — a exibição pública. Cadeira da casa é exibida como PARCEIRO, exceto as que o
 * dado marca com `exibirDaCasa`. ⚠️ Derivar de `daCasa` apagaria a decisão do Jean, e a
 * lista de exceções (sirius/meridian/orion) é DADO, nunca condição no código.
 */
export function rotuloPublico(c: { daCasa: boolean; exibirDaCasa: boolean }): 'casa' | 'parceiro' {
  return c.exibirDaCasa ? 'casa' : 'parceiro';
}

/**
 * O nome da empresa que ocupa a cadeira — o que a home descartava até 07/08.
 *
 * Ele NÃO é campo novo: já vive dentro do `status` de exibição ("Ocupada · Polaris IA"),
 * que é curadoria do /admin. Criar uma coluna `nome` duplicaria a mesma verdade em dois
 * lugares que passariam a divergir na primeira edição feita só num deles.
 * Sem separador, o `status` inteiro É o nome.
 */
export function nomeExibido(status: string): string {
  return status.split('·').pop()?.trim() ?? '';
}
