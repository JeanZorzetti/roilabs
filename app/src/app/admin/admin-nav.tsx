'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// O outline padrão do navegador é quase preto e some sobre a barra navy-dark.
// Anel dourado explícito em tudo que recebe foco ali.
const FOCO_NA_BARRA =
  ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light';

// Telas que vieram do admin do site verticemarketing e duas da ROI Labs.
// /admin/entregaveis usa o esqueleto da Vértice com o escopo das cadeiras da
// ROI Labs (lib/entregaveis.ts); /admin/precos, com os preços da ROI Labs
// (lib/precos-cadeira.ts). /admin/precificacao é a comissão por nicho (spec 016).
const NAV: [string, string][] = [
  ['/admin/entregaveis', 'Entregáveis'],
  ['/admin/onboarding', 'Onboarding'],
  ['/admin/precos', 'Preços'],
  ['/admin/propostas', 'Propostas'],
  ['/admin/contratos', 'Contratos'],
  ['/admin/entregas', 'Entregas'],
  ['/admin/candidaturas', 'Candidaturas'],
  ['/admin/precificacao', 'Precificação'],
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Seções do admin" className="-mx-1 flex flex-1 flex-wrap items-center gap-1">
      {NAV.map(([href, label]) => {
        const current = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? 'page' : undefined}
            className={
              current
                ? 'rounded-md bg-white/10 px-3 py-1.5 text-sm font-semibold text-white shadow-[inset_0_-2px_0_0_hsl(var(--gold))]' +
                  FOCO_NA_BARRA
                : 'rounded-md px-3 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white' +
                  FOCO_NA_BARRA
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
