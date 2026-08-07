import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decidirCheckout, rotuloPublico } from '@/lib/carteira/produto';

export const dynamic = 'force-dynamic';

// Public read: the static site fetches this live from the browser (cross-origin) to render
// the chair map, so it reflects /admin edits without a rebuild. Simple GET → no preflight,
// just needs the CORS allow-origin header for the browser to read the response.
//
// ⚠️ 012: esta rota é PÚBLICA e a projeção é explícita de propósito. Devolver a linha crua
// vazaria `daCasa` — a marcação INTERNA que FR-010a manda não exibir (cadeira da casa
// aparece como parceiro, exceto as três marcadas com `exibirDaCasa`). Campo novo no schema
// não entra aqui sozinho; entra quando alguém decidir que ele é público.
export async function GET() {
  const cadeiras = await prisma.cadeira.findMany({
    orderBy: { ordem: 'asc' },
    include: {
      produto: true,
      parceiros: {
        where: { estagio: 'ativa' },
        select: { nome: true, _count: { select: { credenciais: true } } },
        take: 1,
      },
    },
  });

  const publico = cadeiras.map((c) => {
    const parceiro = c.parceiros[0] ?? null;
    const produto = c.produto
      ? {
          nome: c.produto.nome,
          preco: Number(c.produto.preco),
          moeda: c.produto.moeda,
          recorrencia: c.produto.recorrencia,
          modoCobranca: c.produto.modoCobranca,
          checkoutUrl: c.produto.checkoutUrl,
          publicado: c.produto.publicado,
        }
      : null;

    const checkout = decidirCheckout({
      estado: c.estado,
      produto,
      parceiroNome: parceiro?.nome ?? null,
      // FR-008: "ligado" = tem credencial de gateway cadastrada. Sem ela a venda não tem
      // como voltar, e um checkout aqui produziria receita invisível.
      gatewayLigado: (parceiro?._count.credenciais ?? 0) > 0,
    });

    return {
      id: c.id,
      niche: c.niche,
      status: c.status, // texto de exibição — nenhuma decisão de máquina lê isto
      open: c.open,
      ordem: c.ordem,
      polo: c.polo,
      estado: c.estado,
      // A exibição RESOLVIDA. `daCasa` cru nunca sai daqui.
      rotulo: rotuloPublico(c),
      siteUrl: c.siteUrl,
      // FR-020: cadeira ocupada não é oferecida para candidatura.
      aceitaCandidatura: c.estado === 'vaga' && c.open,
      produto:
        produto && checkout.tipo !== 'indisponivel'
          ? { nome: produto.nome, preco: produto.preco, moeda: produto.moeda, recorrencia: produto.recorrencia }
          : null,
      checkout,
    };
  });

  return NextResponse.json(publico, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
