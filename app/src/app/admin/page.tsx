import Link from 'next/link';
import { AdminShell } from '@/components/vertice/AdminShell';
import { TIPOS_CADEIRA, TOTAL_FASES } from '@/lib/entregaveis';
import { ONBOARDING, countItems } from '@/lib/vertice/onboarding';

const CARDS = [
  {
    href: '/admin/entregaveis',
    title: 'Entregáveis',
    lead: 'O que a ROI Labs entrega em cada tipo de cadeira, fase por fase — mais o que nunca está incluso e para onde vai o pedido de fora.',
    stat: () => `${TIPOS_CADEIRA.length} tipos de cadeira · ${TOTAL_FASES} fases`,
  },
  {
    href: '/admin/onboarding',
    title: 'Onboarding',
    lead: 'Checklist por serviço, marcado por cliente. Item que trava o prazo aparece marcado como tal.',
    stat: () =>
      `${Object.keys(ONBOARDING).length} checklists · ${Object.values(ONBOARDING).reduce(
        (total, phases) => total + countItems(phases),
        0
      )} itens`,
  },
  {
    href: '/admin/precos',
    title: 'Preços',
    lead: 'Anuidade, domínio próprio e comissão pela faixa do nicho — e o simulador que diz quanto o parceiro paga no primeiro ano.',
    stat: () => 'Anuidade R$ 3.960 · domínio R$ 50/ano · sem setup',
  },
  {
    href: '/admin/propostas',
    title: 'Propostas',
    lead: 'As propostas salvas, com o link que vai para o cliente, o PDF e o registro de quem aceitou e quando.',
    stat: () => 'Link público · aceite registrado',
  },
  {
    href: '/admin/contratos',
    title: 'Contratos',
    lead: 'Contrato de prestação de serviços gerado a partir de uma proposta, com aceite eletrônico do cliente.',
    stat: () => 'Link público · aceite com IP e data',
  },
  {
    href: '/admin/entregas',
    title: 'Entregas',
    lead: 'Termo de entrega do que foi feito, para o cliente confirmar o recebimento.',
    stat: () => 'Link público · recebimento confirmado',
  },
  {
    href: '/admin/candidaturas',
    title: 'Candidaturas',
    lead: 'Quem se candidatou a uma cadeira da ROI Labs, por status.',
    stat: () => 'ROI Labs · parceiros',
  },
  {
    href: '/admin/precificacao',
    title: 'Precificação',
    lead: 'Success fee por nicho e faixa de margem, com a calculadora que sugere a taxa.',
    stat: () => 'ROI Labs · comissão por nicho',
  },
];

export default function AdminHome() {
  return (
    <AdminShell
      title="Painel interno"
      lead="Escopo, onboarding e preço no mesmo lugar. Tudo aqui é interno: margem, custo e piso de negociação não saem desta área."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-border bg-white p-6 shadow-soft transition-shadow hover:shadow-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span className="block h-1 w-10 rounded-full bg-gold" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-bold text-navy">{card.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{card.lead}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-navy/60">{card.stat()}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
