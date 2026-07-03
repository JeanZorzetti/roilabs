// WhatsApp deep-link helpers shared by the admin surfaces (leads, pedidos, candidaturas).

// ponytail: assume a local BR number, prefix 55 (same rule since the candidatura card).
export function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('55') && digits.length > 11 ? digits : '55' + digits;
}

export function waLink(rawNumber: string, text?: string) {
  return `https://wa.me/${waNumber(rawNumber)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// 1-click template for consumer leads: Duda opens the chat already contextualized.
// Used by /admin/leads and /admin/follow-up.
export function waLeadLink(lead: { nome: string; whatsapp: string; produto: string | null; mensagem: string | null }) {
  const primeiroNome = lead.nome.trim().split(/\s+/)[0];
  const cartLink = lead.mensagem?.match(/https?:\/\/\S+/)?.[0];
  const contexto = lead.produto ? ` sobre ${lead.produto}` : ' de porcelanato';
  const text =
    `Olá, ${primeiroNome}! Aqui é da ROI Labs 👋 Recebemos seu pedido${contexto} pelo site ` +
    `e já consigo te passar os valores com frete. Pode me confirmar o bairro e a metragem da sua obra?` +
    (cartLink ? `\n\nSeu carrinho salvo: ${cartLink}` : '');
  return waLink(lead.whatsapp, text);
}

// 1-click template for pedidos, contextual to payment/fulfillment state.
export function waPedidoLink(p: {
  nome: string;
  whatsapp: string;
  entrega: string;
  statusPagamento: string;
  statusFulfillment: string;
}) {
  const primeiroNome = p.nome.trim().split(/\s+/)[0];
  let corpo: string | null = null;

  if (p.statusPagamento === 'pendente') {
    corpo =
      'vi que você montou seu pedido de porcelanato no site, mas o pagamento não chegou a ser concluído. ' +
      'Quer que eu te envie um novo link, ou prefere fechar direto por aqui?';
  } else if (p.statusPagamento === 'pago' && p.statusFulfillment === 'aguardando') {
    const prazo =
      p.entrega === 'retirada'
        ? 'Assim que estiver separado te aviso para combinarmos a retirada.'
        : p.entrega === 'entrega'
          ? 'A entrega leva de 2 a 6 dias úteis.'
          : 'Me confirma o endereço da obra para fecharmos o frete?';
    corpo = `seu pagamento foi aprovado ✓ e já estamos confirmando o pedido com o fornecedor do polo. ${prazo}`;
  } else if (p.statusPagamento === 'pago' && p.statusFulfillment === 'confirmado') {
    corpo =
      p.entrega === 'retirada'
        ? 'seu pedido foi confirmado com o fornecedor ✓ e já podemos combinar a retirada. Qual o melhor dia para você?'
        : 'seu pedido foi confirmado com o fornecedor ✓ e está em preparação para a entrega. Te aviso assim que sair!';
  }

  // reembolsado (or unknown state): plain chat, no canned message.
  if (!corpo) return waLink(p.whatsapp);
  return waLink(p.whatsapp, `Olá, ${primeiroNome}! Aqui é da ROI Labs 👋 Sobre seu pedido: ${corpo}`);
}
